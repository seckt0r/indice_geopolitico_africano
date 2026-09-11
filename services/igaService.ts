/**
 * Geração de relatórios do Índice Geopolítico Africano (IGA).
 *
 * A metodologia vive no prompt abaixo e está espelhada em ontology/DOMAIN.md.
 * Alterar um obriga a alterar o outro no mesmo commit.
 *
 * Princípio de desenho: o modelo é responsável apenas pelo JUÍZO QUALITATIVO
 * (pontuar cada pilar e justificá-lo). Toda a ARITMÉTICA e a CLASSIFICAÇÃO são
 * feitas aqui, no cliente. Isto existe por duas razões concretas:
 *   1. Um modelo local de 8B erra contas. A média dos 5 pilares é trivial de
 *      calcular e não há motivo para a delegar.
 *   2. O nível de estabilidade tem de ser uma chave estável e não traduzida,
 *      caso contrário cores, filtros e comparações partem-se noutros idiomas.
 */

import { DIMENSION_KEYS, DimensionData, DimensionKey, IGAReport, Language, StabilityKey } from '../types';
import { AiError, generateJson, JsonSchema } from './ollamaClient';

// ---------------------------------------------------------------------------
// Schema da resposta
// ---------------------------------------------------------------------------

// NOTA: "integer", nunca "number". Com "number" a geração restringida por
// gramática produz ocasionalmente literais como 4.25e-2000000000000000, que o
// JSON.parse aceita silenciosamente como 0.
const dimensionSchema: JsonSchema = {
  type: 'object',
  properties: {
    score: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Pontuação 0-100 para este pilar.',
    },
    analysis: {
      type: 'string',
      description: 'Justificação específica da pontuação, cerca de 2 frases.',
    },
  },
  required: ['score', 'analysis'],
};

const reportSchema: JsonSchema = {
  type: 'object',
  properties: {
    countryName: { type: 'string', description: 'Nome do país no idioma pedido.' },
    capital: { type: 'string', description: 'Nome da capital.' },
    population: { type: 'string', description: 'População estimada actual, ex.: "34,5 milhões".' },
    dimensions: {
      type: 'object',
      properties: {
        economic: dimensionSchema,
        political: dimensionSchema,
        security: dimensionSchema,
        international: dimensionSchema,
        historical: dimensionSchema,
      },
      required: ['economic', 'political', 'security', 'international', 'historical'],
    },
    longAnalysis: {
      type: 'string',
      description: 'Síntese executiva da situação geopolítica, cerca de 200 palavras.',
    },
    sources: {
      type: 'array',
      items: { type: 'string' },
      description:
        '3 a 5 fontes abertas do Sul Global / África, ex.: "BAD / African Development Bank", "Afrobarómetro", "Fundação Mo Ibrahim (IIAG)", "UNECA", "Afreximbank", "UNCTADstat", "UCDP", "SIPRI".',
    },
  },
  required: ['countryName', 'capital', 'population', 'dimensions', 'longAnalysis', 'sources'],
};

/** Forma bruta devolvida pelo modelo, antes de validação. */
interface RawReport {
  countryName?: unknown;
  capital?: unknown;
  population?: unknown;
  dimensions?: Partial<Record<DimensionKey, { score?: unknown; analysis?: unknown }>>;
  longAnalysis?: unknown;
  sources?: unknown;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const LANGUAGE_NAMES: Record<Language, string> = {
  pt: 'PORTUGUÊS DE PORTUGAL (pt-PT)',
  en: 'ENGLISH',
  fr: 'FRANÇAIS',
  zh: 'CHINESE (SIMPLIFIED)',
  ru: 'RUSSIAN',
  es: 'SPANISH',
  de: 'GERMAN',
  it: 'ITALIAN',
};

const buildPrompt = (countryName: string, lang: Language): string => `
Atue como o algoritmo de inferência do "Índice Geopolítico Africano (IGA Reformulado)". Gere um relatório analítico rigoroso para o país: ${countryName}.

INFORMAÇÕES GERAIS:
- Forneça a Capital e a População estimada actual.

METODOLOGIA REFORMULADA DE PONTUAÇÃO (cada pilar de 0 a 100):
Pontue cada pilar com base em evidências contemporâneas (safra ≤ 5 anos), priorizando dados abertos do Sul Global e instituições pan-africanas (BAD, UNECA, Afreximbank, Afrobarómetro, IIAG Mo Ibrahim, UNCTADstat, UCDP):

1. Capacidade Económica e Resiliência Estrutural (economic):
   - Indicadores: PIB per capita em PPA (logarítmico), Inverso do Índice Herfindahl-Hirschman (HHI) de Concentração de Mercadorias da UNCTADstat (diversificação real da produção de exportação, não mera reexportação), Mobilização Fiscal Doméstica não-recurso (% do PIB - BAD/UNECA/ATAF conforme Thandika Mkandawire) e Estabilidade Macroeconómica quinquenal.
   - Países dependentes de rendas de hidrocarbonetos/minerais não diversificados pontuam MENOS; economias com capacidade fiscal própria e pauta diversificada pontuam MAIS.

2. Efectividade Institucional e Governação Endógena (political):
   - Indicadores: Capacidade administrativa e prestação de serviços públicos (IIAG / BAD), Legitimidade Institucional e Confiança Cívica da população nos órgãos de soberania (dados primários do Afrobarómetro e IIAG), e Estado de Direito e Integridade pública.
   - Valoriza a legitimidade endógena e a percepção cívica cidadã em vez de apenas o risco corporativo percebido por investidores externos (Claude Ake).

3. Segurança, Coesão Interna e Controlo Territorial (security):
   - Indicadores: Ausência de violência armada e conflito organizado (UCDP/PRIO aberto e Sistema de Alerta Precoce da UA - CEWS), Segurança Humana e Ordem Pública (taxas contemporâneas de vitimização/homicídios da UNODC/Afrobarómetro, safra ≤ 5 anos), e Integridade Territorial e Defesa Soberana (SIPRI/UA).
   - Países com conflitos armados abertos, fragmentação da autoridade estatal territorial ou violência sistemática pontuam MENOS.

4. Gestão Estratégica da Interdependência e Margem de Manobra (international):
   - Indicadores: Diversificação Multipolar de Parceiros Comerciais e Credores via Entropia de Shannon normalizada (UNCTAD/FMI DOTS/Afreximbank), Integração Comercial Continental (% comércio intra-africano na ZLECAF - UNECA/Afreximbank), e Sustentabilidade Soberana do Serviço da Dívida face às receitas fiscais domésticas (BAD/IDS).
   - Autonomia relacional: países com parceiros comerciais e credores multipolares (Sul Global, BRICS+, bilaterais) e integração activa na ZLECAF pontuam MAIS. Não se penaliza a cooperação internacional legítima nem se confunde soberania com isolamento autárquico.

5. Trajetória Histórica e Condicionantes Estruturais (historical):
   - Quadro analítico moderador e contextual: Tradição jurídico-administrativa herdada, Antiguidade e densidade institucional pré-colonial (Michalopoulos & Papaioannou, Englebert), e Padrão histórico de inserção colonial na economia-mundo (Amin, Mamdani).
   - Avalia a resiliência adaptativa das instituições históricas sem violar regras de agregação cardeal.

Para cada pilar escreva 2 frases de justificação técnica assentes nos indicadores acima.
Escreva ainda uma síntese executiva (longAnalysis) de cerca de 200 palavras focada nos estrangulamentos de soberania e liste 3 a 5 fontes abertas preferencialmente do continente (ex.: "BAD / African Development Bank", "Afrobarómetro", "Fundação Mo Ibrahim (IIAG)", "UNECA", "Afreximbank", "UNCTADstat", "UCDP", "SIPRI").

NÃO calcule médias nem ordens lineares de 1 a 54: o IGA classifica exclusivamente em 6 escalões estatísticos e isso é feito fora do seu âmbito.

IMPORTANTE: O IDIOMA DE TODO O CONTEÚDO (análises, nomes, síntese) DEVE SER: ${LANGUAGE_NAMES[lang]}.
`;

// ---------------------------------------------------------------------------
// Validação e cálculo (autoridade do cliente)
// ---------------------------------------------------------------------------

/**
 * Converte o que o modelo devolveu num inteiro 0-100 utilizável.
 * Rejeita NaN, Infinity e os expoentes absurdos que a geração por gramática
 * ocasionalmente produz. Devolve null quando não há valor aproveitável.
 */
export const normalizeScore = (value: unknown): number | null => {
  // Number(null) e Number('') são 0, não "inválido". Sem esta guarda, um campo
  // em falta passaria a valer uma pontuação legítima de zero.
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  // Um expoente disparatado (ex.: 4.25e-2000) chega aqui como 0 ou Infinity;
  // valores fora do intervalo são erro do modelo, não dado válido.
  if (n < 0 || n > 100) return null;
  return Math.round(n);
};

/** Limiares dos 6 escalões estatísticos robustos (E1 a E6). Ver ontology/DOMAIN.md §4. */
export const stabilityFromScore = (score: number): StabilityKey => {
  if (score >= 78) return 'e1';
  if (score >= 66) return 'e2';
  if (score >= 55) return 'e3';
  if (score >= 45) return 'e4';
  if (score >= 35) return 'e5';
  return 'e6';
};

const asText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

/**
 * Transforma a resposta bruta num IGAReport válido, ou falha com AiError.
 * Esta função é pura e exportada para poder ser testada isoladamente.
 */
export const buildReport = (raw: RawReport, ref: { id: string; name: string }, lang: Language): IGAReport => {
  const dimensions = {} as Record<DimensionKey, DimensionData>;
  const missing: DimensionKey[] = [];

  for (const key of DIMENSION_KEYS) {
    const score = normalizeScore(raw.dimensions?.[key]?.score);
    if (score === null) {
      missing.push(key);
      continue;
    }
    dimensions[key] = {
      score,
      analysis: asText(raw.dimensions?.[key]?.analysis),
    };
  }

  if (missing.length) {
    throw new AiError(
      'bad_response',
      `O modelo não produziu pontuações válidas para: ${missing.join(', ')}.`
    );
  }

  // A média composta do IGA agrega os 4 pilares activos (w = 0,25 cada, total 100%),
  // enquanto o Pilar V (trajetória histórica) constitui a dimensão moderadora contextual.
  const activeKeys: DimensionKey[] = ['economic', 'political', 'security', 'international'];
  const activeTotal = activeKeys.reduce((sum, key) => sum + dimensions[key].score, 0);
  const igaScore = activeTotal / activeKeys.length;

  return {
    id: ref.id,
    countryName: asText(raw.countryName, ref.name),
    capital: asText(raw.capital, '—'),
    population: asText(raw.population, '—'),
    igaScore,
    stabilityKey: stabilityFromScore(igaScore),
    dimensions,
    longAnalysis: asText(raw.longAnalysis),
    sources: Array.isArray(raw.sources)
      ? raw.sources
          .map((s) => asText(s))
          .filter(Boolean)
          .slice(0, 6)
      : [],
    language: lang,
    generatedAt: Date.now(),
  };
};

// ---------------------------------------------------------------------------
// Cache e deduplicação
// ---------------------------------------------------------------------------

/**
 * O modelo local demora minutos por relatório em CPU. Sem cache, reabrir um
 * país já analisado voltaria a pagar esse custo por inteiro.
 * A chave inclui o idioma porque o conteúdo textual é gerado nesse idioma.
 */
const cache = new Map<string, IGAReport>();
const inFlight = new Map<string, Promise<IGAReport>>();

const cacheKey = (id: string, lang: Language) => `${id}:${lang}`;

export const getCachedReport = (id: string, lang: Language): IGAReport | undefined =>
  cache.get(cacheKey(id, lang));

export const clearReportCache = (): void => {
  cache.clear();
};

/**
 * Carrega relatórios pré-calculados para dentro da cache.
 *
 * O conjunto estático gerado na compilação entra por aqui ao arrancar a
 * aplicação. A partir desse momento, abrir um país é instantâneo e a geração a
 * pedido fica reservada para o que não vem no conjunto — um idioma diferente,
 * ou um país cuja geração falhou na última execução do script.
 *
 * Não sobrepõe um relatório já em cache: uma geração feita nesta sessão é mais
 * recente do que o ficheiro que veio do servidor.
 */
export const hydrateReports = (reports: IGAReport[], lang: Language): number => {
  let loaded = 0;
  for (const report of reports) {
    const key = cacheKey(report.id, lang);
    if (cache.has(key)) continue;
    cache.set(key, report);
    loaded += 1;
  }
  return loaded;
};

/**
 * Obtém o relatório IGA de um país.
 * Devolve imediatamente do cache quando possível; pedidos concorrentes para o
 * mesmo país/idioma partilham a mesma promessa em vez de duplicar trabalho.
 */
export const fetchCountryAnalysis = async (
  ref: { id: string; name: string },
  lang: Language = 'pt',
  signal?: AbortSignal,
  onProgress?: (charsReceived: number) => void
): Promise<IGAReport> => {
  const key = cacheKey(ref.id, lang);

  const cached = cache.get(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const task = (async () => {
    const raw = await generateJson<RawReport>({
      prompt: buildPrompt(ref.name, lang),
      schema: reportSchema,
      temperature: 0.2,
      signal,
      onProgress,
    });
    const report = buildReport(raw, ref, lang);
    cache.set(key, report);
    return report;
  })();

  inFlight.set(key, task);
  try {
    return await task;
  } finally {
    inFlight.delete(key);
  }
};
