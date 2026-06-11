const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export const extractDataFromImage = async (base64Image: string, maxRetries = 5) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key não configurada.");
  }

  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
  const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

  const prompt = `Você é o assistente OCR do sistema "Preciso OCR".
Analise esta imagem de documento de saneamento (CESAN/SAAE) e extraia as informações de cada matrícula presente.

ESTRUTURA DO DOCUMENTO:
- Cada matrícula ocupa um bloco com: texto de dados à ESQUERDA e foto do hidrômetro à DIREITA
- O texto contém: Matrícula, Proprietário, Leitura, OCI, Data, etc.
- A foto do hidrômetro é sempre uma imagem fotográfica (não texto) no canto direito do bloco

LEITURA DA CÚPULA DO HIDRÔMETRO:
- A cúpula exibe dígitos numéricos divididos em duas partes: dígitos PRETOS/ESCUROS (inteiros) e dígitos VERMELHOS (decimais)
- Considere APENAS os dígitos PRETOS/ESCUROS — IGNORE completamente os dígitos em VERMELHO
- Os dígitos válidos são lidos da ESQUERDA para a DIREITA
- REMOVA todos os zeros à esquerda. Exemplos:
  * "0000" → leitura_hidrometro = "0"
  * "0097" → leitura_hidrometro = "97"
  * "0350" → leitura_hidrometro = "350"
  * "01087" → leitura_hidrometro = "1087"
  * "00008" → leitura_hidrometro = "8"
- Se não conseguir ler a cúpula claramente, use o valor do campo "Leitura" no texto do documento
- A leitura_documento também deve ter zeros à esquerda removidos

REGRAS DE EXTRAÇÃO:
- CONTA RETIDA: Se tiver "Acréscimo" ou "Decréscimo", ou OC 17, 51, 53, 50, 54
- OC 16, 07, 20: Foto de fachada. NÃO tentar ler leitura da foto, usar leitura do documento
- OCI 48: observations = "baixo consumo, imóvel habitado"
- OCI 40: observations = "imóvel sem caixa de correio"
- OC 04: Hidrômetro parado, imóvel habitado. observations = "hidrômetro parado, imóvel habitado"
- CATEGORIA ESPECIAL: Se cliente for Empresa (LTDA, S.A.), Prefeitura, Escola

BOUNDING BOXES (valores de 0 a 1000):
- dataBoundingBox: região do BLOCO DE TEXTO com os dados da matrícula (parte esquerda do bloco)
- meterBoundingBox: região da FOTO DO HIDRÔMETRO (parte direita/fotográfica do bloco)
- As coordenadas são [ymin, xmin, ymax, xmax] de 0 a 1000
- dataBoundingBox e meterBoundingBox NUNCA devem ser iguais
- meterBoundingBox deve apontar APENAS para a área da foto do hidrômetro, não para o texto

Retorne APENAS um JSON válido sem markdown:
{
  "extractions": [
    {
      "matricula": "string com apenas números",
      "nome_cliente": "string",
      "leitura_documento": "string com apenas números sem zeros à esquerda",
      "leitura_hidrometro": "string com apenas números sem zeros à esquerda (lido da cúpula)",
      "oc_code": "string",
      "tipo_cliente": "empresa ou individual",
      "observations": "string",
      "dataBoundingBox": [ymin, xmin, ymax, xmax],
      "meterBoundingBox": [ymin, xmin, ymax, xmax]
    }
  ]
}`;

  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
      const parsed = JSON.parse(clean);

      // Validar e corrigir bounding boxes
      if (parsed?.extractions) {
        parsed.extractions = parsed.extractions.map((ext: any) => {
          const db = ext.dataBoundingBox || [0, 0, 500, 600];
          const mb = ext.meterBoundingBox || [0, 500, 500, 1000];

          const boxesAreEqual = JSON.stringify(db) === JSON.stringify(mb);
          const meterTooSmall = mb[2] - mb[0] < 50 || mb[3] - mb[1] < 50;

          if (boxesAreEqual || meterTooSmall) {
            ext.meterBoundingBox = [db[0], Math.round((db[1] + db[3]) / 2), db[2], db[3]];
          }

          // Remover zeros à esquerda das leituras
          if (ext.leitura_documento) {
            ext.leitura_documento = String(parseInt(ext.leitura_documento, 10) || 0);
          }
          if (ext.leitura_hidrometro) {
            ext.leitura_hidrometro = String(parseInt(ext.leitura_hidrometro, 10) || 0);
          }

          return ext;
        });
      }

      return parsed;

    } catch (e: any) {
      lastError = e;
      const isRateLimit = (e.message || '').includes('429') || (e.message || '').includes('RESOURCE_EXHAUSTED');
      const delay = (isRateLimit ? 5000 : 2000) * Math.pow(2, i);
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError || new Error("Falha na extração OCR.");
};
