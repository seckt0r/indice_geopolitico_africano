
export type Language = 'pt' | 'en' | 'fr' | 'zh' | 'ru' | 'es' | 'de' | 'it';

export interface CountryGeoFeature {
  type: string;
  properties: {
    name: string;
    iso_a2?: string;
    iso_a3?: string;
    [key: string]: any;
  };
  geometry: any;
}

export interface DimensionData {
  score: number; // 0 to 100
  analysis: string; // Brief explanation based on specific indicators
}

export interface IGAReport {
  countryName: string;
  population: string; 
  capital: string;    
  igaScore: number; // Final weighted average (Equal weights for 5 pillars)
  stabilityLevel: 'Crítico' | 'Instável' | 'Moderado' | 'Estável' | 'Muito Estável';
  
  // The 5 IGA Pillars (Original Methodology)
  dimensions: {
    economic: DimensionData;       // 1. Capacidade Económica e Resiliência
    political: DimensionData;      // 2. Governação e Legitimidade Política
    security: DimensionData;       // 3. Estabilidade e Segurança Interna
    international: DimensionData;  // 4. Alinhamento e Influência Internacional
    historical: DimensionData;     // 5. Trajetória e Contexto Histórico
  };

  longAnalysis: string;
  sources: string[];
}

export interface MapTooltipData {
  x: number;
  y: number;
  name: string;
}
