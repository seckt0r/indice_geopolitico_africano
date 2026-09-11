/**
 * Carrega o conjunto de relatórios pré-calculado na compilação.
 *
 * O ficheiro é produzido por `scripts/gerar-relatorios.ts` e servido como
 * recurso estático. Carregá-lo ao arrancar é o que permite que o mapa apareça
 * já colorido e que o painel mostre um país imediatamente, em vez de esperar
 * minutos pela inferência local.
 */

import { IGAReport, Language, ReportDataset, StabilityKey } from '../types';
import { hydrateReports } from './igaService';

/** O idioma por omissão vive em relatorios.json; os outros levam sufixo. */
const fileFor = (lang: Language): string => (lang === 'pt' ? 'relatorios.json' : `relatorios.${lang}.json`);

const urlFor = (lang: Language): string => `${import.meta.env.BASE_URL}dados/${fileFor(lang)}`;

export interface LoadedDataset {
  dataset: ReportDataset;
  /** Escalão por país, pronto a colorir o mapa. */
  statusMap: Record<string, StabilityKey>;
  /** Verdadeiro quando o idioma pedido não tinha conjunto e se usou o de base. */
  usedFallback: boolean;
}

const asStatusMap = (reports: Record<string, IGAReport>): Record<string, StabilityKey> =>
  Object.fromEntries(Object.entries(reports).map(([id, report]) => [id, report.stabilityKey]));

const fetchDataset = async (lang: Language, signal?: AbortSignal): Promise<ReportDataset | null> => {
  try {
    const response = await fetch(urlFor(lang), { signal, cache: 'no-cache' });
    if (!response.ok) return null;
    const parsed = (await response.json()) as ReportDataset;
    if (!parsed?.reports || typeof parsed.reports !== 'object') return null;
    return parsed;
  } catch {
    // Ficheiro ausente ou inválido não é um erro fatal: a aplicação continua a
    // funcionar com geração a pedido, apenas sem o arranque instantâneo.
    return null;
  }
};

/**
 * Carrega o conjunto do idioma pedido e alimenta a cache de relatórios.
 * Quando esse idioma ainda não foi gerado, recorre ao conjunto de base em
 * português: as pontuações são as mesmas e o mapa fica colorido à mesma.
 */
export const loadReportDataset = async (
  lang: Language,
  signal?: AbortSignal
): Promise<LoadedDataset | null> => {
  let usedFallback = false;
  let dataset = await fetchDataset(lang, signal);

  if (!dataset && lang !== 'pt') {
    dataset = await fetchDataset('pt', signal);
    usedFallback = dataset !== null;
  }

  if (!dataset) return null;

  const reports = Object.values(dataset.reports);
  hydrateReports(reports, dataset.language);

  // Quando se recorreu ao conjunto de base, alimenta também a cache do idioma
  // pedido. Sem isto, cada clique voltaria a pagar uma inferência completa só
  // para obter o mesmo texto; a faixa de aviso explica que o texto vem em
  // português.
  if (usedFallback) hydrateReports(reports, lang);

  return { dataset, statusMap: asStatusMap(dataset.reports), usedFallback };
};
