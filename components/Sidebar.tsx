
import React from 'react';
import { X, Shield, TrendingUp, Users, Database, BookOpen, Scale, Globe, Landmark, GitCompare, History } from 'lucide-react';
import { IGAReport, DimensionData, Language } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { t } from '../utils/translations';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  countryName: string | null;
  data: IGAReport | null;
  loading: boolean;
  error: string | null;
  onCompare: (data: IGAReport) => void;
  isComparing: boolean;
  language: Language;
}

const DimensionCard: React.FC<{ 
  title: string; 
  data: DimensionData; 
  icon: React.ReactNode; 
  color: string;
}> = ({ title, data, icon, color }) => (
  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <div>
          <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-wider">{title}</h4>
        </div>
      </div>
      <span className="text-white font-mono font-bold">{data.score}/100</span>
    </div>
    
    <div className="w-full bg-slate-700 h-1.5 rounded-full mb-2 overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`} 
        style={{ width: `${data.score}%` }}
      ></div>
    </div>
    
    <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed border-t border-slate-700/50 pt-1">
      {data.analysis}
    </p>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, countryName, data, loading, error, onCompare, isComparing, language }) => {
  const sidebarClasses = `fixed inset-y-0 right-0 w-full md:w-1/2 bg-geo-panel shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-slate-700 overflow-y-auto ${
    isOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  return (
    <div className={sidebarClasses}>
      {/* Header */}
      <div className="sticky top-0 bg-geo-panel/95 backdrop-blur z-10 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide truncate pr-4">
          {data?.countryName || countryName || t('countryDetails', language)}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {!loading && data && (
            <button 
              onClick={() => onCompare(data)}
              disabled={isComparing}
              className={`p-2 rounded-full transition-colors border ${
                isComparing 
                  ? 'bg-geo-accent border-geo-accent text-white cursor-default' 
                  : 'border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isComparing ? t('addedToCompare', language) : t('compare', language)}
            >
              <GitCompare size={20} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <LoadingSpinner />
            <p className="text-geo-accent font-mono text-sm animate-pulse">{t('loading', language)}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Erro</h3>
            <p>{t('errorAnalysis', language)}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            
            {/* Demographics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex items-center gap-3">
                <div className="bg-slate-700/50 p-2 rounded-full text-blue-400">
                  <Landmark size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('capital', language)}</p>
                  <p className="text-sm font-semibold text-white">{data.capital}</p>
                </div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex items-center gap-3">
                 <div className="bg-slate-700/50 p-2 rounded-full text-green-400">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('population', language)}</p>
                  <p className="text-sm font-semibold text-white">{data.population}</p>
                </div>
              </div>
            </div>

            {/* Score Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-xs uppercase tracking-widest text-geo-muted font-bold">{t('igaScore', language)}</span>
                <div className="text-5xl md:text-6xl font-bold text-white mt-2 flex items-baseline">
                  {data.igaScore.toFixed(1)}
                  <span className="text-lg text-slate-500 font-normal ml-1">/100</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-4 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-wide border ${
                  data.stabilityLevel.includes('Crítico') || data.stabilityLevel.includes('Critic') ? 'border-red-500 bg-red-500/10 text-red-400' :
                  data.stabilityLevel.includes('Instável') || data.stabilityLevel.includes('Unstable') ? 'border-orange-500 bg-orange-500/10 text-orange-400' :
                  data.stabilityLevel.includes('Moderado') || data.stabilityLevel.includes('Moderate') ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' :
                  'border-green-500 bg-green-500/10 text-green-400'
                }`}>
                  {data.stabilityLevel}
                </span>
                <p className="text-xs text-slate-400 mt-2">{t('generalRank', language)}</p>
              </div>
            </div>

            {/* The 5 Pillars Section */}
            <section>
              <h3 className="text-slate-200 font-serif font-bold text-lg mb-4 flex items-center gap-2">
                <Database size={20} className="text-geo-accent" />
                {t('pillarsTitle', language)}
              </h3>
              <div className="space-y-3">
                <DimensionCard 
                  title={t('p1', language)}
                  data={data.dimensions.economic}
                  icon={<TrendingUp size={16} />}
                  color="text-blue-400"
                />
                <DimensionCard 
                  title={t('p2', language)}
                  data={data.dimensions.political}
                  icon={<Scale size={16} />}
                  color="text-purple-400"
                />
                 <DimensionCard 
                  title={t('p3', language)} 
                  data={data.dimensions.security}
                  icon={<Shield size={16} />}
                  color="text-red-400"
                />
                <DimensionCard 
                  title={t('p4', language)}
                  data={data.dimensions.international}
                  icon={<Globe size={16} />}
                  color="text-emerald-400"
                />
                <DimensionCard 
                  title={t('p5', language)}
                  data={data.dimensions.historical}
                  icon={<History size={16} />}
                  color="text-amber-400"
                />
              </div>
            </section>

            {/* Long Analysis */}
            <section className="border-t border-slate-700 pt-6">
              <h3 className="font-serif font-bold text-xl text-white mb-4">{t('strategicSummary', language)}</h3>
              <div className="prose prose-invert prose-sm md:prose-base max-w-none text-slate-300 leading-relaxed text-justify">
                 {data.longAnalysis.split('\n').map((paragraph, idx) => (
                   <p key={idx} className="mb-4">
                     {paragraph}
                   </p>
                 ))}
              </div>
            </section>

             {/* Sources */}
             <section className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
               <div className="flex items-center gap-2 mb-3 text-slate-400">
                 <BookOpen size={16} />
                 <h4 className="font-bold uppercase text-xs tracking-wider">{t('sources', language)}</h4>
               </div>
               <p className="text-xs text-slate-500 mb-2">
                 Dados compilados via IGA:
               </p>
               <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                 {data.sources?.map((source, idx) => (
                   <li key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                     <span className="w-1 h-1 bg-geo-accent rounded-full"></span>
                     {source}
                   </li>
                 ))}
               </ul>
             </section>

          </div>
        )}
        
        {!loading && !data && !error && (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
             <Globe size={48} className="mb-4 opacity-20" />
             <p>{t('selectCountryPrompt', language)}</p>
          </div>
        )}
      </div>
    </div>
  );
};
