
import React from 'react';
import { IGAReport, Language } from '../types';
import { RadarChart } from './RadarChart';
import { Trash2, TrendingUp, Users, Shield, Globe, Scale, History } from 'lucide-react';
import { t } from '../utils/translations';

interface ComparisonPageProps {
  countries: IGAReport[];
  onRemove: (countryName: string) => void;
  language: Language;
}

const COLORS = ['#d97706', '#2563eb', '#10b981']; // Amber, Blue, Emerald

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ countries, onRemove, language }) => {
  if (countries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>{t('noCountrySelected', language)}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
      
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">{t('compareTitle', language)}</h2>
        <p className="text-slate-400">{t('compareSubtitle', language)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Radar Chart Section */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500"></div>
           <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
             <TrendingUp size={20} className="text-geo-accent" />
             {t('spectrum', language)}
           </h3>
           <div className="w-full max-w-lg h-[400px]">
             <RadarChart data={countries} colors={COLORS} />
           </div>
           
           {/* Legend */}
           <div className="flex flex-wrap gap-6 mt-4 justify-center">
              {countries.map((c, i) => (
                <div key={c.countryName} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></span>
                  <span className="text-sm font-bold text-slate-300">{c.countryName}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(countries.length, 3)} gap-6`}>
        {countries.map((country, idx) => (
          <div key={country.countryName} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-start relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: COLORS[idx] }}></div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-white">{country.countryName}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`text-xs px-2 py-0.5 rounded border ${
                      country.stabilityLevel.includes('Crític') || country.stabilityLevel.includes('Critic') ? 'border-red-500 text-red-400' :
                      country.stabilityLevel.includes('Instá') || country.stabilityLevel.includes('Unstab') ? 'border-orange-500 text-orange-400' :
                      country.stabilityLevel.includes('Moder') ? 'border-yellow-500 text-yellow-400' :
                      'border-green-500 text-green-400'
                   }`}>
                     {country.stabilityLevel}
                   </span>
                </div>
              </div>
              <button 
                onClick={() => onRemove(country.countryName)}
                className="text-slate-500 hover:text-red-400 transition-colors p-2"
                title={t('remove', language)}
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Core Stats */}
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
                <span className="text-sm font-medium text-slate-300">{country.population}</span>
              </div>
            </div>

            {/* Pillars Detail */}
            <div className="p-4 space-y-4 flex-1">
              
              {[
                { label: t('p1', language), val: country.dimensions.economic.score, color: 'bg-blue-500', icon: TrendingUp },
                { label: t('p2', language), val: country.dimensions.political.score, color: 'bg-purple-500', icon: Scale },
                { label: t('p3', language), val: country.dimensions.security.score, color: 'bg-red-500', icon: Shield },
                { label: t('p4', language), val: country.dimensions.international.score, color: 'bg-emerald-500', icon: Globe },
                { label: t('p5', language), val: country.dimensions.historical.score, color: 'bg-amber-500', icon: History },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1"><item.icon size={12}/> {item.label.split('.')[1]}</span>
                    <span className="text-white font-mono">{item.val}</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
