import React, { useMemo, useState } from 'react';
import { ExternalLink, Quote } from 'lucide-react';
import { DimensionKey, Language } from '../types';
import { t } from '../utils/translations';
import { PILLARS } from '../utils/pillars';
import {
  DATA_SOURCES,
  REFERENCES,
  SOURCE_ORIGIN_CLASSES,
  SOURCE_ORIGIN_LABEL,
  SourceOrigin,
} from '../utils/sources';
import { PageHeader, PageShell, SectionHeading, Tag } from './Layout';

interface SourcesPageProps {
  language: Language;
}

const ORIGINS: SourceOrigin[] = ['pan-africana', 'multilateral', 'academica'];

/** Rótulo curto do pilar, para as etiquetas de "alimenta". */
const pillarShortKey = (key: DimensionKey) => PILLARS.find((p) => p.key === key)!.shortKey;
const pillarTextClass = (key: DimensionKey) => PILLARS.find((p) => p.key === key)!.textClass;

export const SourcesPage: React.FC<SourcesPageProps> = ({ language }) => {
  const [filter, setFilter] = useState<DimensionKey | 'all'>('all');

  const visible = useMemo(
    () => (filter === 'all' ? DATA_SOURCES : DATA_SOURCES.filter((s) => s.pillars.includes(filter))),
    [filter]
  );

  const countByOrigin = useMemo(
    () =>
      ORIGINS.map((origin) => ({
        origin,
        count: DATA_SOURCES.filter((s) => s.origin === origin).length,
      })),
    []
  );

  const filterClass = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'border-geo-primary bg-geo-primary text-white'
        : 'border-geo-line bg-geo-surface text-geo-body hover:border-geo-strong'
    }`;

  return (
    <PageShell>
      <PageHeader
        eyebrow={t('techDocs', language)}
        title={t('sourcesTitle', language)}
        lede={t('sourcesSubtitle', language)}
      />

      {/* Composição do catálogo por origem institucional. */}
      <div className="mb-14 grid gap-px overflow-hidden rounded-xl border border-geo-line bg-geo-line sm:grid-cols-3">
        {countByOrigin.map(({ origin, count }) => (
          <div key={origin} className="bg-geo-surface p-6">
            <div className="font-serif text-2xl font-bold text-geo-primary tabular">{count}</div>
            <div className="mt-1 text-xs text-geo-muted">{SOURCE_ORIGIN_LABEL[origin]}</div>
          </div>
        ))}
      </div>

      <section className="mb-20">
        <SectionHeading index="01" id="catalogo" title={t('sourcesCatalogue', language)} />

        <div className="mb-8 flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={filterClass(filter === 'all')}>
            {t('filterAll', language)}
          </button>
          {PILLARS.map((pillar) => (
            <button
              key={pillar.key}
              onClick={() => setFilter(pillar.key)}
              className={filterClass(filter === pillar.key)}
            >
              {t(pillar.shortKey, language)}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {visible.map((source) => (
            <article key={source.id} className="card p-6 md:p-7">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-lg font-bold leading-snug">{source.name}</h3>
                  <p className="mt-1 text-sm text-geo-muted">{source.organisation}</p>
                </div>
                <Tag className={SOURCE_ORIGIN_CLASSES[source.origin]}>
                  {SOURCE_ORIGIN_LABEL[source.origin]}
                </Tag>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-geo-muted">
                    {t('labelIndicators', language)}
                  </p>
                  <p className="text-sm leading-relaxed text-geo-body">{source.indicator}</p>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-geo-muted">
                    {t('labelWhySource', language)}
                  </p>
                  <p className="text-sm leading-relaxed text-geo-body">{source.rationale}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-geo-line pt-4">
                {source.pillars.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-geo-muted">
                      {t('labelFeeds', language)}
                    </span>
                    {source.pillars.map((key) => (
                      <span key={key} className={`text-xs font-medium ${pillarTextClass(key)}`}>
                        {t(pillarShortKey(key), language)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-geo-muted">
                    {t('labelCadence', language)}
                  </span>
                  <span className="text-xs text-geo-body">{source.cadence}</span>
                </div>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-geo-primary hover:underline"
                >
                  {t('openSource', language)}
                  <ExternalLink size={13} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          index="02"
          id="referencias"
          title={t('referencesTitle', language)}
          description="As opções metodológicas do índice assentam em literatura explícita. Cada referência responde por uma decisão concreta."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {REFERENCES.map((reference) => (
            <div key={reference.author} className="card p-6">
              <Quote size={16} className="mb-3 text-geo-accent" />
              <h3 className="font-serif text-base font-bold">{reference.author}</h3>
              <p className="mt-0.5 text-sm italic text-geo-muted">{reference.work}</p>
              <p className="mt-3 text-sm leading-relaxed text-geo-body">{reference.contribution}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
};
