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

const COLORS = ['#d97706', '#2563eb', '#10b981']; // Amber, Blue, Emerald

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
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>{t('noCountrySelected', language)}</p>
      </div>
    );
  }

  const gridCols = GRID_COLS[Math.min(countries.length, 3)] ?? 'md:grid-cols-3';

  return (
    <div className="w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">{t('compareTitle', language)}</h2>
        <p className="text-slate-400">{t('compareSubtitle', language)}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-12">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500"></div>
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-geo-accent" />
            {t('spectrum', language)}
          </h3>
          <div className="w-full max-w-lg h-[400px]">
            <RadarChart data={countries} colors={COLORS} language={language} />
          </div>

          <div className="flex flex-wrap gap-6 mt-4 justify-center">
            {countries.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></span>
                <span className="text-sm font-bold text-slate-300">{c.countryName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {countries.map((country, idx) => (
          <div
            key={country.id}
            className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-slate-700 flex justify-between items-start relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: COLORS[idx] }}
              ></div>
              <div className="pl-2 min-w-0">
                <h3 className="text-2xl font-serif font-bold text-white truncate">{country.countryName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${STABILITY_BADGE_CLASSES[country.stabilityKey]}`}
                  >
                    {stabilityLabel(country.stabilityKey, language)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(country.id)}
                className="text-slate-500 hover:text-red-400 transition-colors p-2 shrink-0"
                title={t('remove', language)}
                aria-label={`${t('remove', language)}: ${country.countryName}`}
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-700/50 bg-slate-800/20">
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider flex items-center gap-1">
                  <TrendingUp size={12} /> {t('igaScore', language)}
                </span>
                <span className="text-2xl font-bold text-white">{country.igaScore.toFixed(1)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider flex items-center gap-1">
                  <Users size={12} /> {t('population', language)}
                </span>
                <span className="text-sm font-medium text-slate-300 block truncate">
                  {country.population}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {PILLARS.map((pillar) => {
                const Icon = PILLAR_ICONS[pillar.key];
                const value = country.dimensions[pillar.key].score;
                return (
                  <div key={pillar.key} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      {/* Rótulo curto dedicado, em vez de partir o rótulo longo por "." */}
                      <span className="flex items-center gap-1">
                        <Icon size={12} /> {t(pillar.shortKey, language)}
                      </span>
                      <span className="text-white font-mono">{value}</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
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
