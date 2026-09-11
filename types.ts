export type Language = 'pt' | 'en' | 'fr' | 'zh' | 'ru' | 'es' | 'de' | 'it';

/**
 * Chave estável e NÃO traduzida do escalão estatístico de capacidade e estabilidade.
 * Derivada do igaScore no cliente (ver services/igaService.ts), refletindo os 6 escalões
 * estatisticamente robustos validados na literatura (E1 a E6):
 * - e1: Escalão E1 — Alta Capacidade e Autonomia Estratégica (>= 78)
 * - e2: Escalão E2 — Capacidade Consolidada com Vulnerabilidades (66 a 77)
 * - e3: Escalão E3 — Capacidade Intermédia e Articulação Regional (55 a 65)
 * - e4: Escalão E4 — Vulnerabilidade Estrutural com Resiliência (45 a 54)
 * - e5: Escalão E5 — Fragilidade Institucional e Exposição a Choques (35 a 44)
 * - e6: Escalão E6 — Crise Severa e Conflito Sistémico (< 35)
 */
export type StabilityKey = 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6';

export const STABILITY_KEYS: StabilityKey[] = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'];

/** Identificação estável de um país. `id` é o ISO 3166-1 alpha-2 sempre que exista. */
export interface CountryRef {
  /** ISO 3166-1 alpha-2 em maiúsculas; fallback para o nome inglês do GeoJSON. */
  id: string;
  /** Nome já localizado, apenas para exibição. */
  name: string;
}

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
  score: number; // 0 a 100, inteiro, validado no cliente
  analysis: string; // Justificação curta baseada nos indicadores do pilar
}

export type DimensionKey = 'economic' | 'political' | 'security' | 'international' | 'historical';

export const DIMENSION_KEYS: DimensionKey[] = [
  'economic',
  'political',
  'security',
  'international',
  'historical',
];

export interface IGAReport {
  /** Chave estável do país (ISO alpha-2). Atribuída pelo cliente, não pelo modelo. */
  id: string;
  countryName: string;
  population: string;
  capital: string;
  /** Média ponderada dos 4 pilares activos (25% cada), RECALCULADA no cliente. */
  igaScore: number;
  /** Derivada do igaScore no cliente a partir dos limiares dos 6 escalões estatísticos (E1 a E6). */
  stabilityKey: StabilityKey;

  // Os 5 Pilares do IGA: 4 activos (25% cada) + 1 moderador histórico (ver ontology/DOMAIN.md)
  dimensions: Record<DimensionKey, DimensionData>;

  longAnalysis: string;
  sources: string[];

  /** Idioma em que o conteúdo textual foi gerado. */
  language: Language;
  /** Timestamp (epoch ms) da geração, para a UI poder indicar frescura. */
  generatedAt: number;
}

export interface MapTooltipData {
  /** Coordenadas relativas ao container do mapa (não à página). */
  x: number;
  y: number;
  name: string;
  stabilityKey?: StabilityKey;
}

/**
 * Conjunto de relatórios pré-calculado na compilação e servido como ficheiro
 * estático. É isto que permite que o mapa apareça já colorido e que o painel
 * mostre um país sem esperar minutos pelo modelo.
 */
export interface ReportDataset {
  /** Epoch ms do fim da última execução do script de geração. */
  generatedAt: number;
  /** Modelo que produziu este conjunto, para efeitos de proveniência. */
  model: string;
  /** Idioma em que o conteúdo textual foi gerado. */
  language: Language;
  /** Relatórios indexados por ISO 3166-1 alpha-2. */
  reports: Record<string, IGAReport>;
}
