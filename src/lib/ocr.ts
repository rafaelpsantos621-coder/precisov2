'use client';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export const extractDataFromImage = async (base64Image: string, maxRetries = 5) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key não configurada. Adicione NEXT_PUBLIC_GEMINI_API_KEY no .env.local");
  }

  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
  const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

  const systemInstruction = `Você é o assistente OCR de elite do sistema "Preciso OCR".
    Analise imagens de documentos de saneamento e extraia informações com precisão.

    REGRAS:
    - CATEGORIA ESPECIAL: Se cliente for Empresa (LTDA, S.A.), Prefeitura, Escola ou similar.
    - CONTA RETIDA: Se tiver "Acréscimo" ou "Decréscimo", ou OC 17, 51, 53, 50, 54.
    - OC 16, 07, 20: Foto de fachada. NÃO marcar divergência de leitura.
    - OCI 48/48: Baixo consumo. observations = "baixo consumo, imóvel habitado"
    - OCI 40: observations = "imóvel sem caixa de correio"

    Para cada registro retorne JSON com:
    - matricula, nome_cliente, leitura_documento, leitura_hidrometro
    - oc_code, tipo_cliente, observations
    - dataBoundingBox: [ymin, xmin, ymax, xmax] (0-1000)
    - meterBoundingBox: [ymin, xmin, ymax, xmax] da foto do hidrômetro`;

  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Data } },
                { text: "Analise e extraia todos os registros presentes nesta página seguindo o esquema JSON." }
              ]
            }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.1,
            }
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(JSON.stringify(errData));
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return JSON.parse(text.replace(/```json|```/g, '').trim());

    } catch (e: any) {
      lastError = e;
      const isRateLimit = (e.message || '').includes('429') || (e.message || '').includes('RESOURCE_EXHAUSTED');
      const delay = (isRateLimit ? 5000 : 2000) * Math.pow(2, i);
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError || new Error("Falha na extração OCR.");
};