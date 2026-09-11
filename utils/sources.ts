/**
 * Catálogo das fontes de dados que sustentam o IGA Reformulado.
 *
 * Esta lista é documentação da metodologia, não um conjunto de ligações
 * decorativas: cada entrada declara que pilar alimenta e que indicador extrai,
 * para que o leitor possa auditar a proveniência de cada pontuação.
 *
 * NOTA DE IDIOMA: nomes de instituições e URLs são nomes próprios. As
 * descrições estão em pt-PT, como o restante conteúdo metodológico longo
 * (ver harness/CONVENTIONS.md). A cromagem da UI passa toda por `t()`.
 */

import { DimensionKey } from '../types';

/** Origem institucional da fonte — determina o rótulo de soberania de dados. */
export type SourceOrigin = 'pan-africana' | 'multilateral' | 'academica';

export interface DataSource {
  /** Sigla estável, usada como chave de React e como referência cruzada. */
  id: string;
  name: string;
  organisation: string;
  origin: SourceOrigin;
  /** Pilares que esta fonte alimenta. Vazio = princípio transversal. */
  pillars: DimensionKey[];
  /** Que variável concreta é extraída daqui. */
  indicator: string;
  /** Porque é esta a fonte escolhida, e não a alternativa habitual. */
  rationale: string;
  url: string;
  /** Periodicidade declarada de actualização. */
  cadence: string;
}

export const SOURCE_ORIGIN_LABEL: Record<SourceOrigin, string> = {
  'pan-africana': 'Instituição pan-africana',
  multilateral: 'Organização multilateral',
  academica: 'Consórcio académico',
};

export const SOURCE_ORIGIN_CLASSES: Record<SourceOrigin, string> = {
  'pan-africana': 'border-emerald-200 bg-emerald-50 text-emerald-800',
  multilateral: 'border-blue-200 bg-blue-50 text-blue-800',
  academica: 'border-purple-200 bg-purple-50 text-purple-800',
};

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'bad',
    name: 'African Economic Outlook & Country Focus Reports',
    organisation: 'Banco Africano de Desenvolvimento (BAD/AfDB)',
    origin: 'pan-africana',
    pillars: ['economic', 'international'],
    indicator:
      'PIB per capita em paridade de poder de compra (transformação logarítmica), mobilização fiscal doméstica e rácio de serviço da dívida externa sobre receita fiscal.',
    rationale:
      'Cobertura continental construída por uma instituição africana, com séries de finanças públicas que as bases do Norte Global tratam de forma residual.',
    url: 'https://www.afdb.org/en/knowledge/publications/african-economic-outlook',
    cadence: 'Anual',
  },
  {
    id: 'uneca',
    name: 'Economic Report on Africa & Estatísticas da ZLECAF',
    organisation: 'Comissão Económica das Nações Unidas para África (UNECA)',
    origin: 'pan-africana',
    pillars: ['economic', 'international'],
    indicator:
      'Percentagem do comércio externo canalizada para parceiros africanos no quadro da Zona de Comércio Livre Continental Africana.',
    rationale:
      'Mede integração continental efectiva, e não apenas abertura comercial genérica ao resto do mundo.',
    url: 'https://www.uneca.org/publications',
    cadence: 'Anual',
  },
  {
    id: 'afreximbank',
    name: 'African Trade Report',
    organisation: 'Banco Africano de Exportação e Importação (Afreximbank)',
    origin: 'pan-africana',
    pillars: ['international'],
    indicator:
      'Composição de parceiros comerciais e de credores, usada no cálculo da entropia de Shannon normalizada.',
    rationale:
      'Detalha fluxos intra-africanos e financiamento comercial que as estatísticas espelhadas do Norte subestimam sistematicamente.',
    url: 'https://www.afreximbank.com/publications/',
    cadence: 'Anual',
  },
  {
    id: 'afrobarometro',
    name: 'Afrobarómetro — inquéritos por amostragem probabilística',
    organisation: 'Rede Afrobarómetro',
    origin: 'academica',
    pillars: ['political', 'security'],
    indicator:
      'Confiança declarada nos órgãos de soberania, percepção de corrupção e sensação de segurança pessoal.',
    rationale:
      'Ruptura epistémica central do IGA: a legitimidade institucional é aferida junto dos cidadãos africanos, não por analistas de risco corporativo do Norte Global.',
    url: 'https://www.afrobarometer.org/data/',
    cadence: 'Rondas bienais por país',
  },
  {
    id: 'iiag',
    name: 'Ibrahim Index of African Governance (IIAG)',
    organisation: 'Mo Ibrahim Foundation',
    origin: 'pan-africana',
    pillars: ['political'],
    indicator:
      'Capacidade de implementação administrativa, prestação de serviços públicos, Estado de direito e integridade.',
    rationale:
      'Único índice de governação desenhado de raiz para o continente, com metodologia e dados subjacentes publicados na íntegra.',
    url: 'https://mo.ibrahim.foundation/iiag',
    cadence: 'Bienal',
  },
  {
    id: 'unctadstat',
    name: 'UNCTADstat — Concentração e diversificação de mercadorias',
    organisation: 'Conferência das Nações Unidas sobre Comércio e Desenvolvimento',
    origin: 'multilateral',
    pillars: ['economic', 'international'],
    indicator:
      'Índice Herfindahl-Hirschman de concentração da pauta exportadora; o IGA usa o seu inverso como medida de diversificação produtiva.',
    rationale:
      'Substitui a percentagem de manufacturas nas exportações, que premiava artificialmente economias de entreposto e reexportação aduaneira.',
    url: 'https://unctadstat.unctad.org/',
    cadence: 'Anual',
  },
  {
    id: 'ucdp',
    name: 'UCDP Georeferenced Event Dataset',
    organisation: 'Uppsala Conflict Data Program / PRIO',
    origin: 'academica',
    pillars: ['security'],
    indicator:
      'Eventos de violência armada organizada georreferenciados, agregados por intensidade e por continuidade territorial.',
    rationale:
      'Codificação transparente e replicável ao nível do evento, com critérios de inclusão públicos e revistos por pares.',
    url: 'https://ucdp.uu.se/downloads/',
    cadence: 'Anual, com actualização mensal de candidatos',
  },
  {
    id: 'cews',
    name: 'Sistema Continental de Alerta Precoce (CEWS)',
    organisation: 'União Africana',
    origin: 'pan-africana',
    pillars: ['security'],
    indicator:
      'Sinalização de risco de conflito e de descontinuidade da presença do Estado no interior territorial.',
    rationale:
      'Leitura de segurança produzida pelo próprio quadro institucional continental, alinhada com a Arquitectura Africana de Paz e Segurança.',
    url: 'https://www.peaceau.org/en/page/28-continental-early-warning-system-cews',
    cadence: 'Contínua',
  },
  {
    id: 'unodc',
    name: 'UNODC — Estatísticas de homicídio e criminalidade',
    organisation: 'Escritório das Nações Unidas sobre Drogas e Crime',
    origin: 'multilateral',
    pillars: ['security'],
    indicator: 'Taxa de homicídio intencional por 100 000 habitantes e criminalidade violenta urbana.',
    rationale:
      'Complementa o UCDP com segurança humana quotidiana, que a contagem de conflitos armados não capta.',
    url: 'https://dataunodc.un.org/',
    cadence: 'Anual',
  },
  {
    id: 'sipri',
    name: 'SIPRI Military Expenditure Database',
    organisation: 'Stockholm International Peace Research Institute',
    origin: 'academica',
    pillars: ['security'],
    indicator:
      'Despesa militar em percentagem do PIB e da despesa pública, como proxy de capacidade soberana de defesa.',
    rationale:
      'Série longa e metodologicamente estável; usada como capacidade, nunca como mérito — despesa alta não pontua por si.',
    url: 'https://www.sipri.org/databases/milex',
    cadence: 'Anual',
  },
  {
    id: 'imf-dots',
    name: 'Direction of Trade Statistics (DOTS)',
    organisation: 'Fundo Monetário Internacional',
    origin: 'multilateral',
    pillars: ['international'],
    indicator:
      'Matriz bilateral de fluxos comerciais, base do cálculo de diversificação multipolar de parceiros.',
    rationale:
      'Cobertura bilateral completa, indispensável para detectar monopsonismo — a dependência de um único comprador.',
    url: 'https://data.imf.org/',
    cadence: 'Trimestral',
  },
  {
    id: 'ids',
    name: 'International Debt Statistics',
    organisation: 'Banco Mundial',
    origin: 'multilateral',
    pillars: ['international'],
    indicator: 'Composição da dívida externa por credor e calendário do serviço da dívida.',
    rationale:
      'Permite avaliar concentração de credores, que é o que limita a margem de manobra — e não o montante absoluto da dívida.',
    url: 'https://www.worldbank.org/en/programs/debt-statistics/ids',
    cadence: 'Anual',
  },
  {
    id: 'michalopoulos',
    name: 'Pre-Colonial Ethnic Institutions (Ethnographic Atlas)',
    organisation: 'Michalopoulos & Papaioannou; Murdock',
    origin: 'academica',
    pillars: ['historical'],
    indicator: 'Antiguidade e grau de centralização das instituições políticas pré-coloniais.',
    rationale:
      'Variável moderadora de natureza nominal: estratifica a leitura dos pilares activos, sem entrar na média aditiva.',
    url: 'https://scholar.harvard.edu/nunn/pages/data-0',
    cadence: 'Base histórica estável',
  },
  {
    id: 'geojson',
    name: 'Fronteiras administrativas de África (GeoJSON)',
    organisation: 'Click That Hood / Code for Germany',
    origin: 'academica',
    pillars: [],
    indicator: 'Geometria dos 54 Estados usada na projecção de Mercator do mapa interactivo.',
    rationale:
      'Dados abertos; a representação cartográfica não implica reconhecimento de qualquer disputa fronteiriça.',
    url: 'https://github.com/codeforgermany/click_that_hood',
    cadence: 'Comunitária',
  },
];

/** Referências teóricas invocadas pela reformulação metodológica. */
export interface Reference {
  author: string;
  work: string;
  contribution: string;
}

export const REFERENCES: Reference[] = [
  {
    author: 'S. S. Stevens',
    work: 'On the Theory of Scales of Measurement (1946)',
    contribution:
      'Fundamenta a exclusão do Pilar V da soma aditiva: calcular a média de variáveis nominais é matematicamente inválido.',
  },
  {
    author: 'Thandika Mkandawire',
    work: 'Sobre capacidade fiscal e Estados desenvolvimentistas africanos',
    contribution:
      'Justifica a mobilização fiscal doméstica não-recurso como medida de capacidade estatal, em vez do volume de receita bruta.',
  },
  {
    author: 'Claude Ake',
    work: 'Democracy and Development in Africa (1996)',
    contribution:
      'Sustenta a aferição da legitimidade junto dos cidadãos, em vez de índices de percepção elaborados por terceiros.',
  },
  {
    author: 'Samir Amin',
    work: 'Teoria da acumulação à escala mundial',
    contribution:
      'Enquadra o padrão histórico de inserção periférica na economia-mundo como condicionante estrutural.',
  },
  {
    author: 'Mahmood Mamdani',
    work: 'Citizen and Subject (1996)',
    contribution: 'Informa a leitura da herança jurídico-administrativa e do despotismo descentralizado.',
  },
  {
    author: 'Pierre Englebert',
    work: 'State Legitimacy and Development in Africa (2000)',
    contribution: 'Liga a continuidade institucional pré-colonial ao desempenho estatal contemporâneo.',
  },
];
