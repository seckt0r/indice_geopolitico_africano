
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

export interface PillarData {
  score: number; // 0 to 100
  analysis: string; // Brief explanation of the score based on specific metrics
}

export interface IGAReport {
  countryName: string;
  population: string; // New field for demographics
  capital: string;    // New field for demographics
  igaScore: number; // Final average 0 to 100
  stabilityLevel: 'Crítico' | 'Instável' | 'Moderado' | 'Estável' | 'Muito Estável';
  
  // The 5 IGA Pillars
  pillars: {
    economic: PillarData;      // Pilar 1: Capacidade Económica e Resiliência
    political: PillarData;     // Pilar 2: Governação e Legitimidade Política
    security: PillarData;      // Pilar 3: Estabilidade e Segurança Interna
    international: PillarData; // Pilar 4: Alinhamento e Influência Internacional
    history: PillarData;       // Pilar 5: Trajetória e Contexto Histórico
  };

  longAnalysis: string;
  sources: string[];
}

export interface MapTooltipData {
  x: number;
  y: number;
  name: string;
}
