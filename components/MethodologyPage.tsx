import React, { useState } from 'react';
import { Database, Scale, Shield, Globe, History, CheckCircle, Send, FileText, Sigma } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    // Simulate API call
    setTimeout(() => {
      setFormStatus('success');
      // Reset after 3 seconds
      setTimeout(() => setFormStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Abstract Header */}
      <div className="mb-16 text-center">
        <span className="text-geo-accent font-bold tracking-widest uppercase text-xs border border-geo-accent/30 px-3 py-1 rounded-full bg-geo-accent/5">
          Documentação Técnica v1.0
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mt-6 mb-4">
          O Algoritmo IGA
        </h2>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Uma estrutura metodológica para análise estratégica no contexto da globalização e da construção do Estado Pós-Colonial em África.
        </p>
      </div>

      {/* Introduction */}
      <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="prose prose-invert prose-lg text-slate-300">
          <h3 className="flex items-center gap-2 text-white font-bold text-2xl mb-4">
            <Sigma className="text-geo-accent" />
            Fundamentação Teórica
          </h3>
          <p>
            O Índice Geopolítico Africano (IGA) rejeita as métricas tradicionais de poder (apenas PIB ou força militar) como insuficientes para o contexto africano.
          </p>
          <p>
            A premissa central é que o poder geopolítico em África é definido pela <strong>coesão interna</strong>, <strong>resiliência soberana</strong> e pela gestão da <strong>interdependência assimétrica</strong>. O algoritmo calcula uma média ponderada de cinco pilares fundamentais, normalizando dados de fontes heterogéneas para uma escala de 0 a 100.
          </p>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
          <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Equação Geral</h4>
          <div className="font-mono text-sm text-blue-300 bg-slate-900 p-4 rounded border border-blue-900/30 overflow-x-auto">
            IGA = (Σ P1...P5) / 5
            <br/><br/>
            Onde:
            <br/>
            P1 = Capacidade Económica (Inv. Maldição de Recursos)
            <br/>
            P2 = Governação & Legitimidade
            <br/>
            P3 = Segurança (Inv. Conflito)
            <br/>
            P4 = Influência Internacional
            <br/>
            P5 = Contexto Histórico (Path Dependency)
          </div>
        </div>
      </section>

      {/* The 5 Pillars Detail */}
      <div className="space-y-12 mb-20">
        <h3 className="text-3xl font-serif font-bold text-white border-b border-slate-800 pb-4">Detalhamento dos Pilares</h3>

        {/* P1 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
          <div className="bg-blue-900/20 p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded text-blue-400"><Database size={24} /></div>
            <h4 className="text-xl font-bold text-blue-100">Pilar 1: Capacidade Económica e Resiliência</h4>
          </div>
          <div className="p-6 md:grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 text-slate-400 text-sm leading-relaxed space-y-3">
              <p>Mede a base material do poder estatal, focando não apenas no volume, mas na qualidade e diversificação.</p>
              <p className="text-yellow-500/80 italic text-xs border-l-2 border-yellow-600 pl-3">
                <strong>Nota Algorítmica:</strong> O indicador "Rendas de Recursos Naturais (% PIB)" sofre inversão de escala. Alta dependência é considerada uma vulnerabilidade ("Maldição dos Recursos"), penalizando a pontuação.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">Fontes de Dados</h5>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li>• World Bank Open Data (GDP)</li>
                <li>• UNCTADstat (FDI)</li>
                <li>• Métricas de Diversificação Económica</li>
              </ul>
            </div>
          </div>
        </div>

        {/* P2 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
          <div className="bg-purple-900/20 p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded text-purple-400"><Scale size={24} /></div>
            <h4 className="text-xl font-bold text-purple-100">Pilar 2: Governação e Legitimidade</h4>
          </div>
          <div className="p-6 md:grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 text-slate-400 text-sm leading-relaxed space-y-3">
              <p>Avalia a eficácia do Estado e a sua legitimidade democrática. Combina a capacidade de fornecer serviços com a liberdade política.</p>
              <p>Utiliza uma média ponderada entre processos democráticos e eficácia burocrática (controlo de corrupção e qualidade regulatória).</p>
            </div>
            <div className="mt-4 md:mt-0">
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">Fontes de Dados</h5>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li>• V-Dem Institute (Liberal Democracy Index)</li>
                <li>• World Bank WGI</li>
                <li>• Ibrahim Index (IIAG)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* P3 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
          <div className="bg-red-900/20 p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-red-500/10 p-2 rounded text-red-400"><Shield size={24} /></div>
            <h4 className="text-xl font-bold text-red-100">Pilar 3: Estabilidade e Segurança Interna</h4>
          </div>
          <div className="p-6 md:grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 text-slate-400 text-sm leading-relaxed space-y-3">
              <p>Mede o controlo territorial e o monopólio da violência. Crucial para a soberania efetiva.</p>
              <p className="text-yellow-500/80 italic text-xs border-l-2 border-yellow-600 pl-3">
                <strong>Nota Algorítmica:</strong> Todos os indicadores de conflito (ACLED, Terrorismo) são invertidos. Um país com 0 incidentes recebe pontuação máxima (100).
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">Fontes de Dados</h5>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li>• ACLED Conflict Index</li>
                <li>• Global Terrorism Index (IEP)</li>
                <li>• Fragile States Index (FSI)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* P4 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
          <div className="bg-emerald-900/20 p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded text-emerald-400"><Globe size={24} /></div>
            <h4 className="text-xl font-bold text-emerald-100">Pilar 4: Alinhamento e Influência Internacional</h4>
          </div>
          <div className="p-6 md:grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 text-slate-400 text-sm leading-relaxed space-y-3">
              <p>Quantifica a "nova corrida a África". Mede o alinhamento de voto na ONU e a dependência financeira (Dívida/Ajuda) vis-à-vis China e Ocidente.</p>
              <p>Analisa também a liderança regional em organizações como a UA, SADC e CEDEAO.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">Fontes de Dados</h5>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li>• UN General Assembly Votes</li>
                <li>• CARI (China-Africa Research)</li>
                <li>• OECD DAC Data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* P5 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
          <div className="bg-amber-900/20 p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded text-amber-400"><History size={24} /></div>
            <h4 className="text-xl font-bold text-amber-100">Pilar 5: Trajetória e Contexto Histórico</h4>
          </div>
          <div className="p-6 md:grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 text-slate-400 text-sm leading-relaxed space-y-3">
              <p>Implementa a teoria de "Path Dependency". A história não é apenas contexto, é uma variável causal.</p>
              <p>Quantifica o legado colonial (jurídico/institucional), o tipo de luta pela independência e a volatilidade histórica (golpes de estado) para determinar a inércia estrutural.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">Fontes de Dados</h5>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li>• Center for Systemic Peace (Polity V)</li>
                <li>• Registos Históricos Académicos</li>
                <li>• Bases de Dados de Golpes (Powell & Thyne)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Form */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 md:p-12 shadow-2xl">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-serif font-bold text-white mb-2">Contribua para o Algoritmo</h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            O IGA é um projeto vivo. Se é um académico, analista ou especialista em dados africanos, envie as suas sugestões de novas fontes de dados ou ajustes na ponderação das variáveis.
          </p>
        </div>

        {formStatus === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-8 rounded-xl text-center animate-in fade-in zoom-in">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">Contribuição Recebida</h4>
            <p>Obrigado pela sua colaboração científica. A nossa equipa irá analisar os dados.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome Completo</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-geo-accent focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Dr. João Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instituição / Afiliação</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-geo-accent focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Universidade..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Académico</label>
              <input 
                required
                type="email" 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-geo-accent focus:border-transparent outline-none transition-all"
                placeholder="nome@universidade.edu"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sugestão Metodológica ou Fonte de Dados</label>
              <textarea 
                required
                rows={5}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-geo-accent focus:border-transparent outline-none transition-all resize-none"
                placeholder="Descreva a sua sugestão técnica ou indique a fonte de dados (URL/DOI)..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={formStatus === 'submitting'}
              className="w-full bg-geo-accent hover:bg-amber-700 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 group"
            >
              {formStatus === 'submitting' ? (
                <span className="animate-pulse">Enviando...</span>
              ) : (
                <>
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                  Submeter Contribuição
                </>
              )}
            </button>
          </form>
        )}
      </section>

    </div>
  );
};