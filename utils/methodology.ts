/**
 * Conteúdo metodológico longo do IGA, num só sítio.
 *
 * Antes estava disperso por literais dentro do JSX de `MethodologyPage`. Aqui
 * fica estruturado, tipado e reutilizável pelas páginas de Metodologia,
 * Algoritmo e Fontes, e alinhado com `ontology/DOMAIN.md` — que continua a ser
 * a fonte de verdade. Divergência entre os dois é um bug.
 *
 * NOTA DE IDIOMA: texto científico longo em pt-PT. A cromagem da interface
 * (navegação, títulos de secção, rótulos, botões) passa toda por `t()` nas 8
 * línguas; traduzir a prosa metodológica exige revisão humana por idioma.
 */

import { DimensionKey, StabilityKey } from '../types';

export interface PillarDetail {
  key: DimensionKey;
  /** 'activo' entra na média; 'moderador' estratifica sem somar. */
  role: 'activo' | 'moderador';
  /** Peso na agregação linear. O moderador tem peso nulo por construção. */
  weight: number;
  /** Uma frase: o que este pilar mede. */
  question: string;
  summary: string;
  /** Indicadores concretos, cada um com a fonte que o alimenta. */
  indicators: Array<{ name: string; source: string }>;
  /** O que foi mudado face à versão anterior do índice, e porquê. */
  reformulation: string;
}

export const PILLAR_DETAILS: PillarDetail[] = [
  {
    key: 'economic',
    role: 'activo',
    weight: 0.25,
    question: 'O Estado tem base produtiva e fiscal para sustentar as suas próprias escolhas?',
    summary:
      'Mede capacidade produtiva real e a capacidade de a converter em receita pública utilizável, em vez de riqueza aparente. Uma economia grande mas concentrada num único produto de exportação pontua abaixo de uma economia menor e diversificada.',
    indicators: [
      {
        name: 'PIB per capita em paridade de poder de compra, em escala logarítmica',
        source: 'BAD · Banco Mundial',
      },
      {
        name: 'Mobilização fiscal doméstica não-recurso, em percentagem do PIB',
        source: 'BAD · UNECA · ATAF',
      },
      { name: 'Diversificação produtiva pelo inverso do índice Herfindahl-Hirschman', source: 'UNCTADstat' },
      { name: 'Estabilidade macroeconómica no quinquénio', source: 'BAD' },
    ],
    reformulation:
      'A percentagem de manufacturas nas exportações foi abandonada: premiava economias de entreposto, onde a mercadoria apenas atravessa a fronteira aduaneira. O inverso do HHI mede dispersão real da pauta exportadora.',
  },
  {
    key: 'political',
    role: 'activo',
    weight: 0.25,
    question: 'A administração implementa o que decide, e os cidadãos reconhecem-lhe legitimidade?',
    summary:
      'Separa a existência formal de instituições da sua capacidade de execução. Combina desempenho administrativo observado com legitimidade declarada pelos próprios cidadãos em inquéritos por amostragem probabilística.',
    indicators: [
      {
        name: 'Capacidade de implementação administrativa e prestação de serviços públicos',
        source: 'IIAG · BAD',
      },
      { name: 'Confiança cívica nos órgãos de soberania', source: 'Afrobarómetro' },
      { name: 'Estado de direito e integridade nos serviços públicos', source: 'IIAG' },
    ],
    reformulation:
      'Ruptura epistémica: substitui avaliações de analistas de risco corporativo do Norte Global pela percepção directa e representativa dos cidadãos africanos, na linha de Claude Ake.',
  },
  {
    key: 'security',
    role: 'activo',
    weight: 0.25,
    question: 'O Estado mantém coesão e presença efectiva em todo o seu território?',
    summary:
      'Cobre dois planos distintos que a maioria dos índices funde: a violência armada organizada e a segurança humana quotidiana. Um país sem guerra mas com homicídio urbano elevado não é um país seguro.',
    indicators: [
      { name: 'Ausência de violência armada organizada, por evento georreferenciado', source: 'UCDP/PRIO' },
      { name: 'Alerta precoce e continuidade da presença do Estado no interior', source: 'UA · CEWS' },
      {
        name: 'Segurança humana: homicídio intencional e criminalidade violenta',
        source: 'UNODC · Afrobarómetro',
      },
      { name: 'Capacidade soberana de defesa e integridade territorial', source: 'SIPRI · UA' },
    ],
    reformulation:
      'Aplicação estrita da regra de safra: nenhuma observação de segurança com mais de cinco anos civis entra no cômputo, porque o quadro securitário do Sahel e dos Grandes Lagos muda em meses, não em décadas.',
  },
  {
    key: 'international',
    role: 'activo',
    weight: 0.25,
    question: 'Quanta margem de manobra resta ao Estado face aos seus parceiros e credores?',
    summary:
      'Mede autonomia relacional, não isolamento. O que limita a soberania não é ter parceiros ou dívida, é depender de um só comprador ou de um só credor. A diversificação é calculada pela entropia de Shannon normalizada.',
    indicators: [
      {
        name: 'Diversificação multipolar de parceiros comerciais e credores (entropia de Shannon)',
        source: 'UNCTADstat · FMI DOTS · Afreximbank',
      },
      { name: 'Integração no comércio intrarregional no quadro da ZLECAF', source: 'UNECA · Afreximbank' },
      {
        name: 'Sustentabilidade do serviço da dívida sobre receita fiscal doméstica',
        source: 'BAD · Banco Mundial IDS',
      },
    ],
    reformulation:
      'Reespecificação radical. A versão anterior tratava ausência de ajuda e de dívida como soberania, o que beneficiava autocracias rendeiras isolacionistas. Passou a medir-se dispersão de dependências.',
  },
  {
    key: 'historical',
    role: 'moderador',
    weight: 0,
    question: 'Que herança estrutural condiciona a leitura dos quatro pilares activos?',
    summary:
      'Quadro contextual que estratifica a interpretação sem entrar na soma. Tradição jurídico-administrativa, densidade institucional pré-colonial e padrão de inserção colonial na economia-mundo são variáveis nominais, e a média de variáveis nominais é matematicamente inválida.',
    indicators: [
      {
        name: 'Tradição jurídica herdada: civil, common law, romano-holandesa ou mista',
        source: 'Mamdani · compilação própria',
      },
      {
        name: 'Antiguidade e centralização das instituições pré-coloniais',
        source: 'Michalopoulos & Papaioannou · Englebert',
      },
      { name: 'Padrão histórico de inserção colonial na economia-mundo', source: 'Samir Amin' },
    ],
    reformulation:
      'Deixou de pesar 20 % numa média de cinco pilares. Passou a moderador analítico por imposição da teoria de escalas de Stevens — a alteração metodológica mais consequente desta edição.',
  },
];

export interface TierDetail {
  id: StabilityKey;
  tier: string;
  name: string;
  range: string;
  min: number;
  max: number | null;
  examples: string;
  bottleneck: string;
}

export const TIERS: TierDetail[] = [
  {
    id: 'e1',
    tier: 'E1',
    name: 'Alta Capacidade e Autonomia Estratégica',
    range: '≥ 78',
    min: 78,
    max: null,
    examples: 'Botsuana, Seicheles, Marrocos, Maurícia',
    bottleneck: 'Exposição a choques externos de procura global e turismo; insularidade e pressão hídrica.',
  },
  {
    id: 'e2',
    tier: 'E2',
    name: 'Capacidade Consolidada com Vulnerabilidades',
    range: '66 – 77',
    min: 66,
    max: 78,
    examples: 'Gana, Cabo Verde, Egipto, África do Sul, Argélia, Namíbia, Costa do Marfim, Tunísia',
    bottleneck:
      'Tensões de coesão interna e criminalidade urbana, ou serviço da dívida externa e transição energética.',
  },
  {
    id: 'e3',
    tier: 'E3',
    name: 'Capacidade Intermédia e Articulação Regional',
    range: '55 – 65',
    min: 55,
    max: 66,
    examples: 'Benim, Senegal, Ruanda, Tanzânia, Essuatíni, Quénia, Gabão, Guiné, Togo, Zimbábue',
    bottleneck:
      'Base fiscal estreita e dependência de importações energéticas; limites da logística intra-africana.',
  },
  {
    id: 'e4',
    tier: 'E4',
    name: 'Vulnerabilidade Estrutural com Resiliência',
    range: '45 – 54',
    min: 45,
    max: 55,
    examples: 'Angola, Nigéria, Etiópia, Uganda, Camarões, Madagáscar, Moçambique, Zâmbia',
    bottleneck:
      'Dependência de rendas voláteis de matérias-primas e assimetria na diversificação de credores.',
  },
  {
    id: 'e5',
    tier: 'E5',
    name: 'Fragilidade Institucional e Exposição a Choques',
    range: '35 – 44',
    min: 35,
    max: 45,
    examples: 'Burquina Faso, Mali, Chade, Eritreia, República Democrática do Congo, Burundi',
    bottleneck:
      'Pressão securitária transfronteiriça no Sahel e nos Grandes Lagos; descontinuidade do Estado no interior.',
  },
  {
    id: 'e6',
    tier: 'E6',
    name: 'Crise Severa e Conflito Sistémico',
    range: '< 35',
    min: 0,
    max: 35,
    examples: 'Sudão, República Centro-Africana, Sudão do Sul, Somália',
    bottleneck:
      'Conflito armado de alta intensidade e fragmentação da soberania territorial; quebra dos registos estatísticos.',
  },
];

/** Etapas do pipeline, da selecção do país ao relatório apresentado. */
export interface AlgorithmStep {
  n: number;
  title: string;
  body: string;
  /** Quem executa: importa para saber onde está a autoridade do número. */
  actor: 'cliente' | 'modelo';
  /** Detalhe técnico verificável, mostrado em monoespaçado. */
  technical?: string;
}

export const ALGORITHM_STEPS: AlgorithmStep[] = [
  {
    n: 1,
    title: 'Selecção do Estado',
    actor: 'cliente',
    body: 'O clique no mapa resolve o país para um identificador ISO 3166-1 alpha-2, estável e independente do idioma da interface. O nome traduzido serve apenas para exibição e nunca é usado como chave de dados.',
    technical: 'CountryRef { id: "AO", name: "Angola" }',
  },
  {
    n: 2,
    title: 'Consulta à cache',
    actor: 'cliente',
    body: 'A cache em memória é indexada por país e idioma. Um relatório já gerado reaparece instantaneamente; pedidos concorrentes para o mesmo par são deduplicados numa única geração.',
    technical: 'chave = `${id}:${idioma}`',
  },
  {
    n: 3,
    title: 'Construção do prompt metodológico',
    actor: 'cliente',
    body: 'O prompt transporta a definição dos cinco pilares, os indicadores de cada um, a regra de safra e as proibições explícitas. Entre elas, a proibição de o modelo calcular médias, escalões ou classificações.',
  },
  {
    n: 4,
    title: 'Inferência com saída estruturada',
    actor: 'modelo',
    body: 'Um modelo de linguagem em execução local pontua cada pilar de 0 a 100 e justifica a pontuação. A resposta é restringida por um JSON Schema, o que elimina a análise sintáctica de texto livre.',
    technical: 'Todos os campos numéricos são integer, nunca number',
  },
  {
    n: 5,
    title: 'Validação e saneamento',
    actor: 'cliente',
    body: 'Cada pontuação é verificada quanto a tipo e a intervalo. Valores fora de 0 a 100 são corrigidos, campos em falta são rejeitados e um relatório incompleto nunca chega à interface.',
  },
  {
    n: 6,
    title: 'Agregação',
    actor: 'cliente',
    body: 'A pontuação composta é a média aritmética dos quatro pilares activos, cada um com peso de 25 %. O pilar histórico fica de fora da soma, por ser um moderador de natureza nominal.',
    technical: 'IGA = (P1 + P2 + P3 + P4) / 4',
  },
  {
    n: 7,
    title: 'Classificação por escalão',
    actor: 'cliente',
    body: 'A pontuação é mapeada num dos seis escalões estatísticos robustos. Não existe posição ordinal de 1 a 54, nem no cálculo nem na apresentação.',
    technical: 'stabilityFromScore(iga) → e1 … e6',
  },
  {
    n: 8,
    title: 'Apresentação com proveniência',
    actor: 'cliente',
    body: 'O relatório indica o idioma de geração, o momento em que foi produzido e as fontes declaradas pelo modelo, assinaladas como não verificadas automaticamente.',
  },
];

/** Princípios inegociáveis de admissibilidade científica. */
export const PRINCIPLES = [
  {
    id: 'safra',
    title: 'Regra estrita de safra',
    body: 'Desfasamento temporal máximo de cinco anos civis. Índices internacionais correntes arrastam observações com décadas de atraso; nenhuma entra aqui.',
  },
  {
    id: 'soberania',
    title: 'Soberania de dados',
    body: 'Prioridade a fontes abertas e a instituições africanas. A opacidade estatística de um Estado não é tratada como mau desempenho desse Estado.',
  },
  {
    id: 'incerteza',
    title: 'Propagação de incerteza',
    body: 'Simulação de Monte Carlo com 10 000 iterações, variação de pesos por distribuição de Dirichlet e erro empírico de medida das fontes.',
  },
  {
    id: 'escaloes',
    title: 'Proibição de rankings lineares',
    body: 'A comunicação pública restringe-se aos seis escalões, com intervalos de incerteza declarados. A ordenação de 1 a 54 foi banida.',
  },
  {
    id: 'causalidade',
    title: 'Vedação causal',
    body: 'É expressamente proibido usar a pontuação composta como variável independente univariada em regressões de causalidade linear.',
  },
  {
    id: 'replicabilidade',
    title: 'Replicabilidade',
    body: 'Metodologia, pesos e limiares são públicos. O cálculo corre no cliente e pode ser auditado linha a linha no código aberto do projecto.',
  },
] as const;

/** Resultado da auditoria de Monte Carlo, citado na página do algoritmo. */
export const UNCERTAINTY_FINDINGS = [
  { label: 'Iterações da simulação', value: '10 000' },
  { label: 'Amplitude média do intervalo a 90 %', value: '12,9 posições' },
  { label: 'Pares consecutivos indistinguíveis', value: '53 de 53' },
  { label: 'Escalões estatisticamente separáveis', value: '6' },
] as const;
