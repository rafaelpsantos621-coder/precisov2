const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export const extractDataFromImage = async (base64Image: string, maxRetries = 5) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key não configurada.");
  }

  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
  const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

  const prompt = `Você é o assistente OCR do sistema "Preciso OCR".
Analise esta imagem de documento de saneamento e extraia informações.

REGRAS:
- CATEGORIA ESPECIAL: Se cliente for Empresa (LTDA, S.A.), Prefeitura, Escola ou similar.
- CONTA RETIDA: Se tiver "Acréscimo" ou "Decréscimo", ou OC 17, 51, 53, 50, 54.
- OC 16, 07, 20: Foto de fachada. NÃO marcar divergência de leitura.
- OCI 48/48: Baixo consumo. observations = "baixo consumo, imóvel habitado"
- OCI 40: observations = "imóvel sem caixa de correio"

Retorne APENAS um JSON válido com a estrutura:
{
  "extractions": [
    {
      "matricula": "string",
      "nome_cliente": "string",
      "leitura_documento": "string",
      "leitura_hidrometro": "string",
      "oc_code": "string",
      "tipo_cliente": "string",
      "observations": "string",
      "dataBoundingBox": [0, 0, 1000, 1000],
      "meterBoundingBox": [0, 0, 1000, 1000]
    }
  ]
}`;

  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Data } },
                { text: prompt }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
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
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);

    } catch (e: any) {
      lastError = e;
      const isRateLimit = (e.message || '').includes('429') || (e.message || '').includes('RESOURCE_EXHAUSTED');
      const delay = (isRateLimit ? 5000 : 2000) * Math.pow(2, i);
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError || new Error("Falha na extração OCR.");
};