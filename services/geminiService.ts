
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { IGAReport, Language } from "../types";

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API_KEY not found in environment variables");
    return "";
  }
  return key;
};

const dimensionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Score from 0 to 100 based on the specific dimension indicators." },
    analysis: { type: Type.STRING, description: "Specific justification for this score (approx 2 sentences)." }
  },
  required: ["score", "analysis"]
};

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    countryName: { type: Type.STRING, description: "The name of the country in the requested language." },
    population: { type: Type.STRING, description: "Current population estimate (e.g. '34.5 Millions' or localized)." },
    capital: { type: Type.STRING, description: "Capital city name." },
    igaScore: { type: Type.NUMBER, description: "The calculated final IGA Score (Simple Average of 5 pillars)." },
    stabilityLevel: { type: Type.STRING, enum: ['Crítico', 'Instável', 'Moderado', 'Estável', 'Muito Estável'] },
    dimensions: {
      type: Type.OBJECT,
      properties: {
        economic: dimensionSchema,
        political: dimensionSchema,
        security: dimensionSchema,
        international: dimensionSchema,
        historical: dimensionSchema
      },
      required: ["economic", "political", "security", "international", "historical"]
    },
    longAnalysis: { type: Type.STRING, description: "A comprehensive executive summary of the geopolitical situation (approx 200 words)." },
    sources: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "List of 3-5 specific open sources (e.g. 'World Bank 2024', 'ACLED', 'V-Dem', 'SIPRI')." 
    }
  },
  required: ["countryName", "population", "capital", "igaScore", "stabilityLevel", "dimensions", "longAnalysis", "sources"]
};

const getLanguageName = (code: Language): string => {
  const map: Record<Language, string> = {
    pt: 'PORTUGUÊS (PT)',
    en: 'ENGLISH',
    fr: 'FRANÇAIS',
    zh: 'CHINESE (SIMPLIFIED)',
    ru: 'RUSSIAN',
    es: 'SPANISH',
    de: 'GERMAN',
    it: 'ITALIAN'
  };
  return map[code] || 'PORTUGUÊS (PT)';
};

export const fetchCountryAnalysis = async (countryName: string, lang: Language = 'pt'): Promise<IGAReport> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  const langName = getLanguageName(lang);

  const prompt = `
    Atue como o algoritmo do "Índice Geopolítico Africano (IGA)". Gere um relatório rigoroso para o país: ${countryName}.
    
    INFORMAÇÕES GERAIS:
    - Forneça a Capital e a População estimada atual.

    METODOLOGIA DE CÁLCULO (0-100):
    Calcule as pontuações para cada um dos 5 Pilares baseando-se nos indicadores reais e na lógica de inversão descrita:
    
    1. Capacidade Económica e Resiliência:
       - Indicadores: PIB per capita, Crescimento do PIB, Comércio (% PIB), IDE.
       - MÉTRICA INVERTIDA: "Rendas de Recursos Naturais (% PIB)". Se for alta (dependência), a pontuação do pilar deve DESCER. Economias diversificadas pontuam mais alto.
    
    2. Governação e Legitimidade Política:
       - Indicadores: Liberal Democracy Index (V-Dem), Eficácia Governamental (WGI), Qualidade Regulatória (WGI), Controlo da Corrupção (WGI).
    
    3. Estabilidade e Segurança Interna:
       - Indicadores: Political Stability (WGI).
       - MÉTRICAS INVERTIDAS: ACLED Conflict Index (Conflito Ativo), Global Terrorism Index (Terrorismo), Fragile States Index (Aparato de Segurança, Queixa de Grupo). Quanto maiores estes índices, MENOR a pontuação do pilar.
    
    4. Alinhamento e Influência Internacional:
       - Indicadores: Votação na ONU (Alinhamento), Rácio de Influência (Ajuda/Dívida China vs Ocidente), Participação em Organizações Regionais (UA, SADC, CEDEAO).
    
    5. Trajetória e Contexto Histórico:
       - Variáveis Qualitativas/Ordinais: Legado Colonial (Instituições), Trajetória da Independência (Luta armada vs Pacífica), Volatilidade Histórica (Número de Golpes de Estado).
       - Países com histórico de golpes frequentes ou guerras civis prolongadas devem ter pontuação menor neste pilar.

    CÁLCULO FINAL (IGA SCORE):
    O IGA é a MÉDIA ARITMÉTICA SIMPLES dos 5 pilares (Peso igual: 20% cada).
    IGA = (Economic + Political + Security + International + Historical) / 5.

    CLASSIFICAÇÃO DE ESTABILIDADE:
    - < 35: Crítico
    - 35 - 49: Instável
    - 50 - 59: Moderado
    - 60 - 69: Estável
    - >= 70: Muito Estável

    Responda em JSON compatível com o schema.
    IMPORTANTE: O IDIOMA DE TODO O CONTEÚDO (ANÁLISE, TÍTULOS, ETC) DEVE SER: ${langName}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        temperature: 0.2, // Low temperature for consistent scoring
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
