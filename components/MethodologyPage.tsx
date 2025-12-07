
import React, { useState, useEffect, useRef } from 'react';
import { Database, Scale, Shield, Globe, History, CheckCircle, Send, Sigma } from 'lucide-react';
import Chart from 'chart.js/auto';
import { t } from '../utils/translations';
import { Language } from '../types';

interface MethodologyPageProps {
  language: Language;
}

export const MethodologyPage: React.FC<MethodologyPageProps> = ({ language }) => {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const weightChartRef = useRef<HTMLCanvasElement>(null);
  const weightChartInstance = useRef<Chart | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    setTimeout(() => {
      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  useEffect(() => {
    if (weightChartRef.current) {
      if (weightChartInstance.current) {
        weightChartInstance.current.destroy();
      }

      weightChartInstance.current = new Chart(weightChartRef.current, {
        type: 'doughnut',
        data: {
          labels: [t('p1', language), t('p2', language), t('p3', language), t('p4', language), t('p5', language)],
          datasets: [{
            data: [20, 20, 20, 20, 20],
            backgroundColor: [
              '#60a5fa', // Blue
              '#c084fc', // Purple
              '#f87171', // Red
              '#34d399', // Emerald
              '#fbbf24'  // Amber
            ],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom', 
              labels: { 
                boxWidth: 12, 
                padding: 15,
                color: '#94a3b8' 
              } 
            },
            tooltip: {
               callbacks: {
                 label: (item) => ` ${item.label}`
               }
            }
          }
        }
      });
    }

    return () => {
      if (weightChartInstance.current) {
        weightChartInstance.current.destroy();
      }
    };
  }, [language]);

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="mb-16 text-center">
        <span className="text-geo-accent font-bold tracking-widest uppercase text-xs border border-geo-accent/30 px-3 py-1 rounded-full bg-geo-accent/5">
          Documentação Técnica 2025
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mt-6 mb-4">
          {t('methodologyTitle', language)}
        </h2>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          {t('methodologySubtitle', language)}
        </p>
      </div>

      {/* Intro */}
      <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="prose prose-invert prose-lg text-slate-300">
          <h3 className="flex items-center gap-2 text-white font-bold text-2xl mb-4">
            <Sigma className="text-geo-accent" />
            {t('methodologyIntro1', language)}
          </h3>
          <p>
            {t('methodologyIntro2', language)}
          </p>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
           <div className="h-64">
              <canvas ref={weightChartRef}></canvas>
           </div>
        </div>
      </section>

      {/* The 5 Pillars Detail - Hardcoded text kept concise as per instructions to maintain logic but allow UI translation */}
      <div className="space-y-8 mb-20">
        <h3 className="text-3xl font-serif font-bold text-white border-b border-slate-800 pb-4">{t('pillarsTitle', language)}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* P1 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-blue-500/10 p-2 rounded text-blue-400"><Sigma size={24} /></div>
               <h4 className="font-bold text-blue-100">{t('p1', language)}</h4>
             </div>
             <p className="text-sm text-slate-400 mb-2">Base material e resiliência (Inversão da Maldição dos Recursos).</p>
          </div>

          {/* P2 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 transition-colors">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-purple-500/10 p-2 rounded text-purple-400"><Scale size={24} /></div>
               <h4 className="font-bold text-purple-100">{t('p2', language)}</h4>
             </div>
             <p className="text-sm text-slate-400 mb-2">Legitimidade e eficácia estatal.</p>
          </div>

          {/* P3 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-red-500/30 transition-colors">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-red-500/10 p-2 rounded text-red-400"><Shield size={24} /></div>
               <h4 className="font-bold text-red-100">{t('p3', language)}</h4>
             </div>
             <p className="text-sm text-slate-400 mb-2">Coesão territorial e controlo da violência.</p>
          </div>

          {/* P4 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-colors">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-emerald-500/10 p-2 rounded text-emerald-400"><Globe size={24} /></div>
               <h4 className="font-bold text-emerald-100">{t('p4', language)}</h4>
             </div>
             <p className="text-sm text-slate-400 mb-2">Gestão da interdependência.</p>
          </div>

          {/* P5 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-amber-500/30 transition-colors md:col-span-2">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-amber-500/10 p-2 rounded text-amber-400"><History size={24} /></div>
               <h4 className="font-bold text-amber-100">{t('p5', language)}</h4>
             </div>
             <p className="text-sm text-slate-400 mb-2">Inércia estrutural e "Path Dependency".</p>
          </div>
        </div>
      </div>

      {/* Contribution Form */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 md:p-12 shadow-2xl">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-serif font-bold text-white mb-2">{t('contributionTitle', language)}</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            {t('contributionSubtitle', language)}
          </p>
        </div>

        {formStatus === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-8 rounded-xl text-center animate-in fade-in zoom-in">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('success', language)}</h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('name', language)}</label>
                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-geo-accent transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('institution', language)}</label>
                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-geo-accent transition-all" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('email', language)}</label>
              <input required type="email" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-geo-accent transition-all" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('suggestion', language)}</label>
              <textarea required rows={4} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-geo-accent transition-all resize-none"></textarea>
            </div>

            <button type="submit" disabled={formStatus === 'submitting'} className="w-full bg-geo-accent hover:bg-amber-700 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2">
              {formStatus === 'submitting' ? <span className="animate-pulse">{t('sending', language)}</span> : <><Send size={18} /> {t('submit', language)}</>}
            </button>
          </form>
        )}
      </section>

    </div>
  );
};
