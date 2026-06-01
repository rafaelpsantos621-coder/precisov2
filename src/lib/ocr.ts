import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export const extractDataFromImage = async (base64Image: string, maxRetries = 5) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key não configurada. Adicione NEXT_PUBLIC_GEMINI_API_KEY no .env.local");
  }

  let lastError: any = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
      const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

      const systemInstruction = `
        Você é o assistente OCR de elite do sistema "Preciso OCR". 
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
        - meterBoundingBox: [ymin, xmin, ymax, xmax] da foto do hidrômetro
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: [{
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Analise e extraia todos os registros presentes nesta página seguindo o esquema JSON." }
          ]
        }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    matricula: { type: Type.STRING },
                    nome_cliente: { type: Type.STRING },
                    leitura_documento: { type: Type.STRING },
                    leitura_hidrometro: { type: Type.STRING },
                    oc_code: { type: Type.STRING },
                    tipo_cliente: { type: Type.STRING },
                    observations: { type: Type.STRING },
                    dataBoundingBox: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                    meterBoundingBox: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                  },
                  required: ["matricula", "nome_cliente", "dataBoundingBox"]
                }
              }
            }
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (e: any) {
      lastError = e;
      const isRateLimit = (e.message || '').includes('429') || (e.message || '').includes('RESOURCE_EXHAUSTED');
      const delay = (isRateLimit ? 5000 : 2000) * Math.pow(2, i);
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError || new Error("Falha na extração OCR.");
};
