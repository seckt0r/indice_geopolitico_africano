import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Database,
  GitCompare,
  Globe,
  History,
  Info,
  Landmark,
  LineChart,
  MousePointerClick,
  RefreshCw,
  Scale,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DimensionData, EvolutionPoint, IGAReport, Language, ReportDataset, StabilityKey } from '../types';
import { STABILITY_KEYS } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { t } from '../utils/translations';
import { STABILITY_BADGE_CLASSES, STABILITY_COLORS, stabilityLabel } from '../utils/stability';
import { PILLARS } from '../utils/pillars';
import { COUNTRY_COUNT } from '../utils/countries';
import { loadEvolution } from '../services/reportDataset';
import { EvolutionChart } from './EvolutionChart';

interface ReportPanelProps {
  countryName: string | null;
  data: IGAReport | null;
  loading: boolean;
  /** Mensagem já traduzida, ou null. */
  error: string | null;
  /** Segundos decorridos desde o início da geração — o modelo local é lento. */
  elapsedSeconds: number;
  /** Caracteres já recebidos do modelo, via streaming. */
  progressChars: number;
  onCompare: (data: IGAReport) => void;
  isComparing: boolean;
  language: Language;
  /** Conjunto pré-calculado, para a síntese continental do estado inicial. */
  dataset: ReportDataset | null;
  /** Escalão por país, usado para contar a distribuição continental. */
  statusMap: Record<string, StabilityKey>;
}

const PILLAR_ICONS = {
  economic: TrendingUp,
  political: Scale,
  security: Shield,
  international: Globe,
  historical: History,
} as const;

const DimensionCard: React.FC<{
  title: string;
  data: DimensionData;
  icon: React.ReactNode;
  textClass: string;
  barClass: string;
}> = ({ title, data, icon, textClass, barClass }) => (
  <div className="rounded-lg border border-geo-line bg-geo-surface p-4 transition-colors hover:border-geo-strong">
    <div className="mb-2.5 flex items-start justify-between gap-3">
      <div className={`flex items-center gap-2 ${textClass}`}>
        {icon}
        <h4 className="text-xs font-semibold uppercase tracking-wider">{title}</h4>
      </div>
      <span className="shrink-0 font-mono text-sm font-bold text-geo-ink tabular">{data.score}/100</span>
    </div>

    <div className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-geo-subtle">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${barClass}`}
        style={{ width: `${data.score}%` }}
      ></div>
    </div>

    {data.analysis && (
      <p className="border-t border-geo-line pt-2 text-xs leading-relaxed text-geo-body">{data.analysis}</p>
    )}
  </div>
);

/**
 * Estado inicial do painel.
 *
 * O painel está permanentemente aberto, por isso não pode ficar vazio à espera
 * de um clique: mostra a distribuição continental já calculada e a frescura do
 * conjunto de dados, que é informação útil por si só.
 */
const ContinentalOverview: React.FC<{
  language: Language;
  dataset: ReportDataset | null;
  statusMap: Record<string, StabilityKey>;
}> = ({ language, dataset, statusMap }) => {
  const entries = Object.values(statusMap);
  const counts = STABILITY_KEYS.map((key) => ({
    key,
    count: entries.filter((value) => value === key).length,
  }));
  const total = entries.length;

  const updated = dataset?.generatedAt
    ? new Date(dataset.generatedAt).toLocaleDateString(language === 'pt' ? 'pt-PT' : language, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-geo-line bg-geo-surface p-5">
        <p className="eyebrow mb-3">{t('continentalOverview', language)}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-bold text-geo-primary tabular">{total}</span>
          <span className="text-sm text-geo-muted">
            / {COUNTRY_COUNT} {t('statesCovered', language)}
          </span>
        </div>
        {updated && (
          <p className="mt-3 flex items-center gap-1.5 border-t border-geo-line pt-3 text-xs text-geo-muted">
            <RefreshCw size={12} />
            {t('lastUpdate', language)}: {updated}
          </p>
        )}
      </div>

      {total > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-geo-muted">
            {t('tiersTitle', language)}
          </p>
          <ul className="space-y-2">
            {counts.map(({ key, count }) => (
              <li key={key} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: STABILITY_COLORS[key] }}
                />
                <span className="flex-1 truncate text-sm text-geo-body">{stabilityLabel(key, language)}</span>
                <span className="shrink-0 font-mono text-sm text-geo-ink tabular">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-geo-line bg-geo-subtle p-3 text-xs leading-relaxed text-geo-muted">
        <MousePointerClick size={14} className="mt-0.5 shrink-0" />
        <span>{t('selectCountryPrompt', language)}</span>
      </div>
    </div>
  );
};

/**
 * Painel de relatório, permanentemente visível à direita do mapa.
 *
 * Deixou de ser uma gaveta deslizante: com o índice pré-calculado, abrir um
 * país é instantâneo e não há razão para esconder o painel entre cliques.
 */
export const ReportPanel: React.FC<ReportPanelProps> = ({
  countryName,
  data,
  loading,
  error,
  elapsedSeconds,
  progressChars,
  onCompare,
  isComparing,
  language,
  dataset,
  statusMap,
}) => {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const title = data?.countryName || countryName || t('countryDetails', language);

  // Série histórica do país aberto. É um pedido leve e independente do
  // relatório: se falhar, o painel continua completo, apenas sem o gráfico.
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const countryId = data?.id ?? null;

  useEffect(() => {
    if (!countryId) {
      setEvolution([]);
      return;
    }
    const controller = new AbortController();
    loadEvolution(countryId, language, controller.signal).then((pontos) => {
      if (!controller.signal.aborted) setEvolution(pontos);
    });
    return () => controller.abort();
  }, [countryId, language]);

  return (
    <div className="flex h-full flex-col bg-geo-paper">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-geo-line bg-geo-surface/95 px-5 py-4 backdrop-blur">
        <h2 className="truncate font-serif text-lg font-bold tracking-tight md:text-xl">{title}</h2>
        {!loading && data && (
          <button
            onClick={() => onCompare(data)}
            disabled={isComparing}
            className={`shrink-0 rounded-full border p-2 transition-colors ${
              isComparing
                ? 'cursor-default border-geo-primary bg-geo-primary text-white'
                : 'border-geo-line text-geo-body hover:bg-geo-subtle hover:text-geo-ink'
            }`}
            title={isComparing ? t('addedToCompare', language) : t('compare', language)}
          >
            <GitCompare size={17} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24">
        {loading && (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <LoadingSpinner />
            <p className="text-center font-mono text-sm text-geo-primary">{t('generating', language)}</p>
            {/* O modelo local demora minutos. Sem contador, a espera parece uma falha. */}
            <p className="font-mono text-xs text-geo-muted tabular">
              {minutes}:{String(seconds).padStart(2, '0')} {t('elapsed', language)}
              {progressChars > 0 && (
                <span className="ml-2">
                  · {progressChars} {t('chars', language)}
                </span>
              )}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
            <h3 className="mb-1.5 font-semibold">{t('errorTitle', language)}</h3>
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-geo-line bg-geo-surface p-3">
                <span className="shrink-0 rounded-full bg-geo-primarySoft p-2 text-geo-primary">
                  <Landmark size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-geo-muted">
                    {t('capital', language)}
                  </p>
                  <p className="truncate text-sm font-semibold text-geo-ink">{data.capital}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-geo-line bg-geo-surface p-3">
                <span className="shrink-0 rounded-full bg-emerald-50 p-2 text-emerald-700">
                  <Users size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-geo-muted">
                    {t('population', language)}
                  </p>
                  <p className="truncate text-sm font-semibold text-geo-ink">{data.population}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-geo-line bg-geo-surface p-5 shadow-card">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-geo-muted">
                  {t('igaScore', language)}
                </span>
                <div className="mt-1 flex items-baseline font-serif text-4xl font-bold text-geo-ink tabular">
                  {data.igaScore.toFixed(1)}
                  <span className="ml-1 text-base font-normal text-geo-muted">/100</span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    STABILITY_BADGE_CLASSES[data.stabilityKey]
                  }`}
                >
                  {stabilityLabel(data.stabilityKey, language)}
                </span>
                <p className="mt-1.5 text-[11px] text-geo-muted">{t('generalRank', language)}</p>
              </div>
            </div>

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold">
                <Database size={16} className="text-geo-accent" />
                {t('pillarsTitle', language)}
              </h3>
              <div className="space-y-3">
                {PILLARS.map((pillar) => {
                  const Icon = PILLAR_ICONS[pillar.key];
                  return (
                    <DimensionCard
                      key={pillar.key}
                      title={t(pillar.labelKey, language)}
                      data={data.dimensions[pillar.key]}
                      icon={<Icon size={15} />}
                      textClass={pillar.textClass}
                      barClass={pillar.barClass}
                    />
                  );
                })}
              </div>
            </section>

            <section className="border-t border-geo-line pt-5">
              <h3 className="mb-3 flex items-center gap-2 font-serif text-base font-bold">
                <LineChart size={16} className="text-geo-accent" />
                {t('evolutionTitle', language)}
              </h3>
              <EvolutionChart points={evolution} language={language} />
            </section>

            {data.longAnalysis && (
              <section className="border-t border-geo-line pt-5">
                <h3 className="mb-3 font-serif text-lg font-bold">{t('strategicSummary', language)}</h3>
                <div className="space-y-3 text-sm leading-relaxed text-geo-body">
                  {data.longAnalysis
                    .split('\n')
                    .filter((p) => p.trim())
                    .map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                </div>
              </section>
            )}

            {/* Aviso explícito sobre a natureza dos dados: são estimativas de um
                modelo de linguagem, não medições verificadas. */}
            <div className="flex items-start gap-2 rounded-lg border border-geo-line bg-geo-subtle p-3 text-xs leading-relaxed text-geo-muted">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>{t('analysisLocal', language)}</span>
            </div>

            {data.sources.length > 0 && (
              <section className="rounded-lg border border-geo-line bg-geo-surface p-4">
                <div className="mb-2 flex items-center gap-2 text-geo-ink">
                  <BookOpen size={15} />
                  <h4 className="text-xs font-semibold uppercase tracking-wider">{t('sources', language)}</h4>
                </div>
                <p className="mb-2.5 text-xs text-geo-muted">{t('sourcesNote', language)}</p>
                <ul className="space-y-1.5">
                  {data.sources.map((source, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-geo-body">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-geo-accent"></span>
                      {source}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {!loading && !data && !error && (
          <ContinentalOverview language={language} dataset={dataset} statusMap={statusMap} />
        )}
      </div>
    </div>
  );
};
