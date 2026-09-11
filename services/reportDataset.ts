/**
 * Leitura do índice a partir da base de dados.
 *
 * Substituiu o ficheiro estático `public/dados/relatorios.json`. A razão da
 * mudança não é o formato: a base guarda uma linha por geração em vez de
 * substituir a anterior, o que dá histórico e torna possível o gráfico de
 * evolução de cada país.
 *
 * SANEAMENTO. Nada do que chega pela rede é aceite como está. As pontuações
 * são forçadas a inteiros dentro de 0-100, os textos são aparados e limitados,
 * e a pontuação composta e o escalão são RECALCULADOS aqui — pela mesma função
 * que serve a geração a pedido. Um valor adulterado na base não passa a
 * classificação errada para o mapa.
 */

import {
  DIMENSION_KEYS,
  DimensionData,
  DimensionKey,
  EvolutionPoint,
  IGAReport,
  Language,
  ReportDataset,
  StabilityKey,
} from '../types';
import { hydrateReports, stabilityFromScore } from './igaService';
import { COUNTRY_BY_ID } from '../utils/countries';
import { DatabaseError, hasSupabaseConfig, rpc } from './supabaseClient';

const LANGUAGES: Language[] = ['pt', 'en', 'fr', 'zh', 'ru', 'es', 'de', 'it'];

/** Limites de comprimento. Um campo desmesurado é erro de dados, não conteúdo. */
const LIMITES = {
  nome: 120,
  capital: 120,
  populacao: 60,
  analise: 1500,
  sintese: 12_000,
  fonte: 200,
  fontes: 8,
} as const;

const texto = (valor: unknown, maximo: number, omissao = ''): string => {
  if (typeof valor !== 'string') return omissao;
  const limpo = valor.trim();
  return limpo ? limpo.slice(0, maximo) : omissao;
};

const pontuacao = (valor: unknown): number | null => {
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n);
};

interface RelatorioBruto {
  id?: unknown;
  countryName?: unknown;
  capital?: unknown;
  population?: unknown;
  igaScore?: unknown;
  stabilityKey?: unknown;
  longAnalysis?: unknown;
  sources?: unknown;
  language?: unknown;
  generatedAt?: unknown;
  dimensions?: unknown;
}

/**
 * Converte uma linha da base num IGAReport confiável, ou devolve null quando
 * o registo está incompleto de forma irrecuperável.
 */
const sanearRelatorio = (bruto: RelatorioBruto, idiomaPedido: Language): IGAReport | null => {
  const id = texto(bruto.id, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(id)) return null;

  const dimensoesBrutas = (bruto.dimensions ?? {}) as Record<string, { score?: unknown; analysis?: unknown }>;
  const dimensions = {} as Record<DimensionKey, DimensionData>;

  for (const chave of DIMENSION_KEYS) {
    const score = pontuacao(dimensoesBrutas[chave]?.score);
    // Um pilar em falta invalida o relatório: a média dos quatro activos
    // deixaria de ter significado e o mapa mostraria uma cor inventada.
    if (score === null) return null;
    dimensions[chave] = { score, analysis: texto(dimensoesBrutas[chave]?.analysis, LIMITES.analise) };
  }

  // A aritmética é autoridade do cliente, aqui como em igaService: a base pode
  // ter sido escrita por uma versão anterior, ou alterada à mão.
  const activos: DimensionKey[] = ['economic', 'political', 'security', 'international'];
  const igaScore = activos.reduce((soma, chave) => soma + dimensions[chave].score, 0) / activos.length;

  const geradoEm = Number(bruto.generatedAt);
  const idioma = LANGUAGES.includes(bruto.language as Language) ? (bruto.language as Language) : idiomaPedido;

  const fontes = Array.isArray(bruto.sources)
    ? bruto.sources
        .map((fonte) => texto(fonte, LIMITES.fonte))
        .filter(Boolean)
        .slice(0, LIMITES.fontes)
    : [];

  return {
    id,
    countryName: texto(bruto.countryName, LIMITES.nome, COUNTRY_BY_ID[id]?.name ?? id),
    capital: texto(bruto.capital, LIMITES.capital, '—'),
    population: texto(bruto.population, LIMITES.populacao, '—'),
    igaScore,
    stabilityKey: stabilityFromScore(igaScore),
    dimensions,
    longAnalysis: texto(bruto.longAnalysis, LIMITES.sintese),
    sources: fontes,
    language: idioma,
    generatedAt: Number.isFinite(geradoEm) && geradoEm > 0 ? geradoEm : Date.now(),
  };
};

export interface LoadedDataset {
  dataset: ReportDataset;
  /** Escalão por país, pronto a colorir o mapa. */
  statusMap: Record<string, StabilityKey>;
  /** Verdadeiro quando o idioma pedido não tinha dados e se usou o de base. */
  usedFallback: boolean;
}

const consultar = async (lang: Language, signal?: AbortSignal): Promise<IGAReport[]> => {
  const linhas = await rpc<RelatorioBruto[]>('iga_relatorios_actuais', { p_idioma: lang }, { signal });
  if (!Array.isArray(linhas)) return [];
  return linhas
    .map((linha) => sanearRelatorio(linha, lang))
    .filter((relatorio): relatorio is IGAReport => relatorio !== null);
};

/**
 * Carrega o índice no idioma pedido e alimenta a cache de relatórios.
 * Quando esse idioma ainda não foi gerado, recorre ao conjunto em português:
 * as pontuações são as mesmas e o mapa fica colorido à mesma.
 */
export const loadReportDataset = async (
  lang: Language,
  signal?: AbortSignal
): Promise<LoadedDataset | null> => {
  if (!hasSupabaseConfig()) return null;

  let usedFallback = false;
  let reports: IGAReport[];

  try {
    reports = await consultar(lang, signal);
    if (reports.length === 0 && lang !== 'pt') {
      reports = await consultar('pt', signal);
      usedFallback = reports.length > 0;
    }
  } catch (err) {
    // Base indisponível não é um erro fatal: a aplicação continua a funcionar
    // com geração a pedido, apenas sem o arranque instantâneo.
    console.error('Falha ao ler o índice da base de dados:', err);
    if (err instanceof DatabaseError) return null;
    return null;
  }

  if (reports.length === 0) return null;

  const idiomaDoConteudo = usedFallback ? 'pt' : lang;
  hydrateReports(reports, idiomaDoConteudo);
  // Quando se recorreu ao português, alimenta também a cache do idioma pedido:
  // sem isto, cada clique voltava a pagar uma inferência completa só para
  // obter o mesmo texto. A faixa de aviso explica que o texto vem em português.
  if (usedFallback) hydrateReports(reports, lang);

  const dataset: ReportDataset = {
    generatedAt: reports.reduce((maximo, relatorio) => Math.max(maximo, relatorio.generatedAt), 0),
    language: idiomaDoConteudo,
    reports: Object.fromEntries(reports.map((relatorio) => [relatorio.id, relatorio])),
  };

  return {
    dataset,
    statusMap: Object.fromEntries(reports.map((r) => [r.id, r.stabilityKey])),
    usedFallback,
  };
};

interface PontoBruto {
  generatedAt?: unknown;
  igaScore?: unknown;
  stabilityKey?: unknown;
  dimensions?: unknown;
}

/**
 * Série histórica de um país, para o gráfico de evolução.
 * Devolve lista vazia quando não há base configurada ou histórico suficiente.
 */
export const loadEvolution = async (
  countryId: string,
  lang: Language,
  signal?: AbortSignal
): Promise<EvolutionPoint[]> => {
  if (!hasSupabaseConfig() || !/^[A-Z]{2}$/.test(countryId)) return [];

  let linhas: PontoBruto[];
  try {
    linhas = await rpc<PontoBruto[]>('iga_evolucao', { p_pais: countryId, p_idioma: lang }, { signal });
  } catch (err) {
    console.error('Falha ao ler a evolução histórica:', err);
    return [];
  }
  if (!Array.isArray(linhas)) return [];

  return linhas
    .map((linha): EvolutionPoint | null => {
      const momento = Number(linha.generatedAt);
      if (!Number.isFinite(momento) || momento <= 0) return null;

      const brutas = (linha.dimensions ?? {}) as Record<string, unknown>;
      const dimensions = {} as Record<DimensionKey, number>;
      for (const chave of DIMENSION_KEYS) {
        const valor = pontuacao(brutas[chave]);
        if (valor === null) return null;
        dimensions[chave] = valor;
      }

      const activos: DimensionKey[] = ['economic', 'political', 'security', 'international'];
      const igaScore = activos.reduce((soma, chave) => soma + dimensions[chave], 0) / activos.length;
      const escalao = stabilityFromScore(igaScore);

      return {
        generatedAt: momento,
        igaScore,
        // Derivado da pontuação recalculada, e não lido da base.
        stabilityKey: escalao,
        dimensions,
      };
    })
    .filter((ponto): ponto is EvolutionPoint => ponto !== null)
    .sort((a, b) => a.generatedAt - b.generatedAt);
};
