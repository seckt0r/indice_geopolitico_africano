import React from 'react';
import { Globe, History, Scale, Shield, Trash2, TrendingUp, Users } from 'lucide-react';
import { IGAReport, Language } from '../types';
import { RadarChart } from './RadarChart';
import { t } from '../utils/translations';
import { STABILITY_BADGE_CLASSES, stabilityLabel } from '../utils/stability';
import { PILLARS } from '../utils/pillars';

interface ComparisonPageProps {
  countries: IGAReport[];
  onRemove: (id: string) => void;
  language: Language;
}

/** Séries da comparação, em tons com contraste suficiente sobre papel claro. */
const COLORS = ['#123a5e', '#a76b16', '#0f766e']; // Azul institucional, ocre, verde-azulado

const PILLAR_ICONS = {
  economic: TrendingUp,
  political: Scale,
  security: Shield,
  international: Globe,
  historical: History,
} as const;

/**
 * Classes estáticas. Antes era `md:grid-cols-${n}` interpolado, o que só
 * funcionava porque o CDN do Tailwind observava o DOM em runtime — com o
 * Tailwind em build, essas classes nunca seriam geradas.
 */
const GRID_COLS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
};

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ countries, onRemove, language }) => {
  if (countries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-10 text-center text-geo-muted">
        <p>{t('noCountrySelected', language)}</p>
      </div>
    );
  }

  const gridCols = GRID_COLS[Math.min(countries.length, 3)] ?? 'md:grid-cols-3';

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14 md:px-10 md:py-20 animate-in fade-in duration-500">
      <header className="mb-12 max-w-3xl">
        <p className="eyebrow mb-4">{t('compare', language)}</p>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
          {t('compareTitle', language)}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-geo-body">{t('compareSubtitle', language)}</p>
      </header>

      <div className="grid grid-cols-1 gap-8 mb-12">
        <div className="card relative flex flex-col items-center overflow-hidden p-6 md:p-8">
          <h2 className="mb-6 flex items-center gap-2 font-serif text-lg font-bold">
            <TrendingUp size={18} className="text-geo-accent" />
            {t('spectrum', language)}
          </h2>
          <div className="w-full max-w-lg h-[400px]">
            <RadarChart data={countries} colors={COLORS} language={language} />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-6">
            {countries.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></span>
                <span className="text-sm font-semibold text-geo-ink">{c.countryName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {countries.map((country, idx) => (
          <div key={country.id} className="card flex flex-col overflow-hidden">
            <div className="relative flex items-start justify-between overflow-hidden border-b border-geo-line p-4">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: COLORS[idx] }}
              ></div>
              <div className="pl-2 min-w-0">
                <h3 className="truncate font-serif text-xl font-bold">{country.countryName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STABILITY_BADGE_CLASSES[country.stabilityKey]}`}
                  >
                    {stabilityLabel(country.stabilityKey, language)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(country.id)}
                className="shrink-0 p-2 text-geo-muted transition-colors hover:text-red-700"
                title={t('remove', language)}
                aria-label={`${t('remove', language)}: ${country.countryName}`}
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-geo-line bg-geo-subtle p-4">
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-geo-muted">
                  <TrendingUp size={12} /> {t('igaScore', language)}
                </span>
                <span className="font-serif text-2xl font-bold text-geo-ink tabular">
                  {country.igaScore.toFixed(1)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-geo-muted">
                  <Users size={12} /> {t('population', language)}
                </span>
                <span className="block truncate text-sm font-medium text-geo-body">{country.population}</span>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {PILLARS.map((pillar) => {
                const Icon = PILLAR_ICONS[pillar.key];
                const value = country.dimensions[pillar.key].score;
                return (
                  <div key={pillar.key} className="space-y-1">
                    <div className="mb-1 flex justify-between text-xs text-geo-muted">
                      {/* Rótulo curto dedicado, em vez de partir o rótulo longo por "." */}
                      <span className="flex items-center gap-1">
                        <Icon size={12} /> {t(pillar.shortKey, language)}
                      </span>
                      <span className="font-mono text-geo-ink tabular">{value}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-geo-subtle">
                      <div className={`h-full ${pillar.barClass}`} style={{ width: `${value}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
