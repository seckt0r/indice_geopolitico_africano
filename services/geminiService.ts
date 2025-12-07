
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { IGAReport } from "../types";

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY not found in environment variables");
    return "";
  }
  return key;
};

const pillarSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Score from 0 to 100 based on the specific IGA methodology metrics." },
    analysis: { type: Type.STRING, description: "Specific justification for this score (approx 2 sentences)." }
  },
  required: ["score", "analysis"]
};

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    countryName: { type: Type.STRING, description: "The name of the country in Portuguese." },
    population: { type: Type.STRING, description: "Current population estimate (e.g. '34.5 Milhões')." },
    capital: { type: Type.STRING, description: "Capital city name." },
    igaScore: { type: Type.NUMBER, description: "The calculated final IGA Score (average of the 5 pillars)." },
    stabilityLevel: { type: Type.STRING, enum: ['Crítico', 'Instável', 'Moderado', 'Estável', 'Muito Estável'] },
    pillars: {
      type: Type.OBJECT,
      properties: {
        economic: pillarSchema,
        political: pillarSchema,
        security: pillarSchema,
        international: pillarSchema,
        history: pillarSchema
      },
      required: ["economic", "political", "security", "international", "history"]
    },
    longAnalysis: { type: Type.STRING, description: "A comprehensive executive summary of the geopolitical situation (approx 200 words)." },
    sources: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "List of 3-5 specific open sources (e.g. 'World Bank 2024', 'ACLED Index', 'V-Dem Report')." 
    }
  },
  required: ["countryName", "population", "capital", "igaScore", "stabilityLevel", "pillars", "longAnalysis", "sources"]
};

export const fetchCountryAnalysis = async (countryName: string): Promise<IGAReport> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Atue como o algoritmo do "Índice Geopolítico Africano (IGA)". Gere um relatório para o país: ${countryName}.
    
    INFORMAÇÕES GERAIS:
    - Forneça a Capital e a População estimada atual.

    METODOLOGIA IGA (Calcule as pontuações de 0 a 100 estritamente baseadas nestas regras):
    
    1. Pilar Económico (Recursos e Resiliência):
       - Métricas: PIB/capita, Crescimento, Comércio, IDE.
       - REGRA CRÍTICA: "Maldição dos Recursos". Se o país tem alta dependência de rendas de recursos naturais (ex: Petróleo > 20% PIB), a pontuação DEVE SER PENALIZADA (Invertida). Economias diversificadas pontuam mais alto.
    
    2. Pilar Político (Governação e Legitimidade):
       - Métricas: V-Dem Liberal Democracy Index + World Bank Governance (Eficácia Gov, Qualidade Regulatória, Controlo de Corrupção).
       - Pontue alto para democracias eficazes. Pontue baixo para autocracias corruptas ou democracias falhadas.
    
    3. Pilar Segurança (Estabilidade Interna):
       - Métricas: ACLED Conflict Index + Global Terrorism Index + Fragile States Index.
       - REGRA CRÍTICA: Escalas invertidas. Alto conflito/terrorismo = PONTUAÇÃO BAIXA. Alta estabilidade = PONTUAÇÃO ALTA.
    
    4. Pilar Internacional (Alinhamento e Influência):
       - Métricas: Padrão de voto na ONU, Rácio de Dependência (Dívida/Ajuda vs China/Ocidente), Liderança Regional (UA/SADC/CEDEAO).
       - Países "hedgers" (que equilibram bem as potências) ou líderes regionais pontuam mais alto que estados-pária ou satélites dependentes.
    
    5. Pilar Histórico (Trajetória):
       - Métricas: Legado colonial, tipo de transição para independência (pacífica vs guerra), histórico de golpes (volatilidade).
       - Histórico de golpes frequentes reduz a pontuação drasticamente (path dependency).
    
    Gere o 'igaScore' como a média aritmética exata dos 5 pilares.
    Responda em PORTUGUÊS. Seja técnico e analítico.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        temperature: 0.2, // Low temperature for consistent algorithmic simulation
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");

    const data = JSON.parse(text) as IGAReport;
    return data;
  } catch (error) {
    console.error("Error fetching country analysis:", error);
    throw error;
  }
};
