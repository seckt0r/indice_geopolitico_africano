import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  Globe,
  History,
  Layers,
  Scale,
  Send,
  Shield,
  Sigma,
} from 'lucide-react';
import { t } from '../utils/translations';
import { Language } from '../types';
import { PILLARS } from '../utils/pillars';
import { STABILITY_BADGE_CLASSES } from '../utils/stability';

interface MethodologyPageProps {
  language: Language;
}

const PILLAR_DETAILS = [
  {
    icon: Sigma,
    iconBg: 'bg-blue-500/10 text-blue-400',
    title: 'text-blue-100',
    hover: 'hover:border-blue-500/30',
    span: '',
    weightBadge: '25 % (Pilar Activo)',
  },
  {
    icon: Scale,
    iconBg: 'bg-purple-500/10 text-purple-400',
    title: 'text-purple-100',
    hover: 'hover:border-purple-500/30',
    span: '',
    weightBadge: '25 % (Pilar Activo)',
  },
  {
    icon: Shield,
    iconBg: 'bg-red-500/10 text-red-400',
    title: 'text-red-100',
    hover: 'hover:border-red-500/30',
    span: '',
    weightBadge: '25 % (Pilar Activo)',
  },
  {
    icon: Globe,
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    title: 'text-emerald-100',
    hover: 'hover:border-emerald-500/30',
    span: '',
    weightBadge: '25 % (Pilar Activo)',
  },
  {
    icon: History,
    iconBg: 'bg-amber-500/10 text-amber-400',
    title: 'text-amber-100',
    hover: 'hover:border-amber-500/30',
    span: 'md:col-span-2',
    weightBadge: 'Moderação Analítica (Stevens)',
  },
] as const;

const PILLAR_DESCRIPTIONS = [
  'Capacidade produtiva real (PPA log), capacidade fiscal doméstica não-recurso (Mkandawire - BAD/UNECA/ATAF) e diversificação de exportações via inverso de HHI da UNCTADstat, substituindo a distorção de manufacturas de entreposto.',
  'Capacidade de implementação administrativa e prestação de serviços públicos (IIAG/BAD), legitimidade cívica endógena e confiança pública nas instituições aferida por inquéritos probabilísticos do Afrobarómetro.',
  'Coesão e integridade territorial, ausência de conflitos armados organizados (UCDP/PRIO e Sistema de Alerta Precoce da UA - CEWS) e segurança humana contemporânea (safra estrita ≤ 5 anos).',
  'Reespecificado: Autonomia relacional avaliada pela Diversificação Multipolar de Parceiros Comerciais e Credores (Entropia de Shannon normalizada), integração no comércio intrarregional (ZLECAF) e sustentabilidade do serviço da dívida.',
  'Quadro analítico moderador e contextual (teoria das escalas de Stevens): tradição jurídico-administrativa herdada, densidade institucional pré-colonial e padrão histórico de inserção colonial na economia-mundo (Amin, Mamdani).',
];

const TIERS_DATA = [
  {
    id: 'e1',
    tier: 'Escalão E1',
    name: 'Alta Capacidade e Autonomia Estratégica',
    range: '≥ 78 / 100',
    examples: 'Botsuana, Seicheles, Marrocos, Maurícia',
    bottleneck:
      'Vulnerabilidade a choques externos de procura global e turismo; insularidade/pressão hídrica.',
  },
  {
    id: 'e2',
    tier: 'Escalão E2',
    name: 'Capacidade Consolidada com Vulnerabilidades',
    range: '66 a 77 / 100',
    examples: 'Gana, Cabo Verde, Egipto, África do Sul, Argélia, Namíbia, Costa do Marfim, Tunísia',
    bottleneck:
      'Tensões de coesão interna e criminalidade urbana ou serviço da dívida externa e transição energética.',
  },
  {
    id: 'e3',
    tier: 'Escalão E3',
    name: 'Capacidade Intermédia e Articulação Regional',
    range: '55 a 65 / 100',
    examples: 'Benim, Senegal, Ruanda, Tanzânia, Essuatíni, Quénia, Gabão, Guiné, Togo, Zimbábue...',
    bottleneck:
      'Base fiscal estreita e dependência de importações energéticas; limites de infraestruturas logísticas intra-africanas.',
  },
  {
    id: 'e4',
    tier: 'Escalão E4',
    name: 'Vulnerabilidade Estrutural com Resiliência',
    range: '45 a 54 / 100',
    examples: 'Angola, Nigéria, Etiópia, Uganda, Camarões, Madagáscar, Moçambique, Zâmbia...',
    bottleneck:
      'Elevada dependência de rendas voláteis de matérias-primas e assimetria na diversificação de parceiros credores.',
  },
  {
    id: 'e5',
    tier: 'Escalão E5',
    name: 'Fragilidade Institucional e Exposição a Choques',
    range: '35 a 44 / 100',
    examples: 'Burquina Faso, Mali, Chade, Eritreia, Rep. Dem. Congo, Burundi',
    bottleneck:
      'Pressão securitária transfronteiriça no Sahel/Grandes Lagos; descontinuidade da presença do Estado no interior territorial.',
  },
  {
    id: 'e6',
    tier: 'Escalão E6',
    name: 'Crise Severa e Conflito Sistémico',
    range: '< 35 / 100',
    examples: 'Sudão, Rep. Centro-Africana, Sudão do Sul, Somália',
    bottleneck:
      'Conflitos armados de alta intensidade e fragmentação da soberania territorial; crise humanitária aguda e quebra de registos estatísticos.',
  },
] as const;

const STORAGE_KEY = 'iga.contributions';

interface ContributionForm {
  name: string;
  institution: string;
  email: string;
  suggestion: string;
}

const EMPTY_FORM: ContributionForm = { name: '', institution: '', email: '', suggestion: '' };

export const MethodologyPage: React.FC<MethodologyPageProps> = ({ language }) => {
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [form, setForm] = useState<ContributionForm>(EMPTY_FORM);
  const [storedLocally, setStoredLocally] = useState(false);
  const weightChartRef = useRef<HTMLCanvasElement>(null);
  const weightChartInstance = useRef<Chart | null>(null);

  const update =
    (field: keyof ContributionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    const payload = { ...form, language, submittedAt: new Date().toISOString() };
    const endpoint = import.meta.env.VITE_CONTRIBUTION_ENDPOINT;

    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStoredLocally(false);
      } else {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, payload]));
        setStoredLocally(true);
      }
      setForm(EMPTY_FORM);
      setFormStatus('success');
    } catch (err) {
      console.error('Falha ao registar contribuição:', err);
      setFormStatus('error');
    }
  };

  useEffect(() => {
    if (!weightChartRef.current) return;
    weightChartInstance.current?.destroy();

    weightChartInstance.current = new Chart(weightChartRef.current, {
      type: 'doughnut',
      data: {
        // Os 4 pilares activos têm peso de 25% cada. O Pilar V é quadro moderador contextual.
        labels: PILLARS.slice(0, 4).map((p) => t(p.shortKey, language)),
        datasets: [
          {
            data: [25, 25, 25, 25],
            backgroundColor: PILLARS.slice(0, 4).map((p) => p.hex),
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, color: '#94a3b8' } },
          tooltip: { callbacks: { label: (item) => ` ${item.label}: 25% (Pilar Activo)` } },
        },
      },
    });

    return () => {
      weightChartInstance.current?.destroy();
      weightChartInstance.current = null;
    };
  }, [language]);

  const inputClass =
    'w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-geo-accent transition-all';
  const labelClass = 'block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2';

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="mb-16 text-center">
        <span className="text-geo-accent font-bold tracking-widest uppercase text-xs border border-geo-accent/30 px-3 py-1 rounded-full bg-geo-accent/5">
          {t('techDocs', language)} · IGA Reformulado
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mt-6 mb-4">
          {t('methodologyTitle', language)}
        </h2>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          {t('methodologySubtitle', language)}
        </p>
      </div>

      {/* Introdução & Gráfico de Pesos */}
      <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="prose prose-invert prose-lg text-slate-300">
          <h3 className="flex items-center gap-2 text-white font-bold text-2xl mb-4">
            <Sigma className="text-geo-accent" />
            {t('methodologyIntro1', language)}
          </h3>
          <p>{t('methodologyIntro2', language)}</p>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mt-4 space-y-2 text-sm text-slate-400">
            <p className="flex items-center gap-2 text-slate-300 font-semibold">
              <Check className="text-geo-accent w-4 h-4 shrink-0" />
              Agregação linear dos 4 pilares dinâmicos activos: w₁ = w₂ = w₃ = w₄ = 0,25.
            </p>
            <p className="flex items-center gap-2 text-slate-300 font-semibold">
              <Check className="text-geo-accent w-4 h-4 shrink-0" />
              Pilar V (Trajetória Histórica) reclassificado como quadro moderador (Stevens).
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-3">{t('analysisLocal', language)}</p>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">
            Estrutura Ponderada dos Pilares Activos (100 %)
          </h4>
          <div className="h-64">
            <canvas ref={weightChartRef}></canvas>
          </div>
          <p className="text-[11px] text-center text-slate-500 mt-4">
            Pilar V (Contexto Histórico) opera como moderador analítico, preservando a coerência métrica.
          </p>
        </div>
      </section>

      {/* Os 5 Pilares do IGA */}
      <div className="space-y-8 mb-20">
        <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
            <Layers className="text-geo-accent" />
            {t('pillarsTitle', language)}
          </h3>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 w-fit">
            Metodologia Reformulada · Fontes do Sul Global
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PILLARS.map((pillar, idx) => {
            const detail = PILLAR_DETAILS[idx];
            const Icon = detail.icon;
            return (
              <div
                key={pillar.key}
                className={`bg-slate-900/50 border border-slate-800 rounded-xl p-6 transition-colors ${detail.hover} ${detail.span} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`${detail.iconBg} p-2 rounded`}>
                        <Icon size={24} />
                      </div>
                      <h4 className={`font-bold ${detail.title}`}>{t(pillar.labelKey, language)}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {detail.weightBadge}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{PILLAR_DESCRIPTIONS[idx]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção: A Insustentabilidade do Ranking Linear e os 6 Escalões Estatísticos */}
      <section className="mb-20 bg-slate-900/40 border border-slate-800 rounded-2xl p-8 md:p-10 shadow-xl">
        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3 text-geo-accent mb-2">
            <Award size={24} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Incerteza & Validade Estatística
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
            Para Além da Classificação: Os Seis Escalões Estatísticos Robustos (E1 a E6)
          </h3>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            A auditoria técnico-científica e o protocolo de Monte Carlo (10 000 iterações com variação de
            pesos de Dirichlet e erro empírico de medida) demonstraram que a ordenação ordinal linear de 1 a
            54 é <strong className="text-red-400">cientificamente insustentável</strong>: os intervalos de
            confiança a 90 % têm amplitude média de 12,9 posições e a totalidade dos 53 pares consecutivos é
            estatisticamente indistinguível. O IGA substituiu o fetiche da classificação linear por{' '}
            <strong>seis escalões estatisticamente robustos</strong>:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIERS_DATA.map((tier) => (
            <div
              key={tier.id}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${STABILITY_BADGE_CLASSES[tier.id as any]}`}
                >
                  {tier.tier}
                </span>
                <span className="text-xs font-mono text-slate-400">{tier.range}</span>
              </div>
              <h4 className="text-white font-bold text-sm mb-2">{tier.name}</h4>
              <p className="text-xs text-slate-400 mb-2">
                <strong className="text-slate-300">Estados típicos:</strong> {tier.examples}
              </p>
              <p className="text-xs text-slate-500 border-t border-slate-800/60 pt-2">
                <strong className="text-slate-400">Gargalo dominante:</strong> {tier.bottleneck}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Seção: Princípios Epistémicos do IGA */}
      <section className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="bg-blue-500/10 text-blue-400 p-2 rounded w-fit mb-4">
            <Calendar size={20} />
          </div>
          <h4 className="text-white font-bold text-base mb-2">Regra Estrita de Safra (≤ 5 anos)</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Elimina observações anacrónicas (desfasamentos de até 50 anos em indicadores internacionais).
            Nenhuma observação anterior a 2021 entra no cômputo da edição actual.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded w-fit mb-4">
            <Globe size={20} />
          </div>
          <h4 className="text-white font-bold text-base mb-2">Soberania de Dados & Sul Global</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Prioridade a fontes abertas e africanas: BAD, UNECA, Afreximbank, Afrobarómetro, IIAG Mo Ibrahim,
            UNCTADstat e UCDP. Superação do viés contra a opacidade estatística (r parcial = 0,576).
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="bg-amber-500/10 text-amber-400 p-2 rounded w-fit mb-4">
            <BookOpen size={20} />
          </div>
          <h4 className="text-white font-bold text-base mb-2">Casos de Uso & Vedação Causal</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instrumento desenhado para diagnóstico de estrangulamentos, preparação diplomática e alerta
            precoce da UA. Expressamente <strong>vedada a inferência causal univariada</strong>.
          </p>
        </div>
      </section>

      {/* Formulário de Contribuição */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 md:p-12 shadow-2xl">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-serif font-bold text-white mb-2">
            {t('contributionTitle', language)}
          </h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">{t('contributionSubtitle', language)}</p>
        </div>

        {formStatus === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-8 rounded-xl text-center animate-in fade-in zoom-in">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('success', language)}</h4>
            {storedLocally && (
              <p className="text-sm text-green-300/80 max-w-md mx-auto">
                {t('contributionStored', language)}
              </p>
            )}
            <button
              onClick={() => setFormStatus('idle')}
              className="mt-6 text-xs text-slate-400 hover:text-white underline"
            >
              {t('submit', language)}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contrib-name" className={labelClass}>
                  {t('name', language)}
                </label>
                <input
                  id="contrib-name"
                  name="name"
                  value={form.name}
                  onChange={update('name')}
                  required
                  type="text"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="contrib-institution" className={labelClass}>
                  {t('institution', language)}
                </label>
                <input
                  id="contrib-institution"
                  name="institution"
                  value={form.institution}
                  onChange={update('institution')}
                  required
                  type="text"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="contrib-email" className={labelClass}>
                {t('email', language)}
              </label>
              <input
                id="contrib-email"
                name="email"
                value={form.email}
                onChange={update('email')}
                required
                type="email"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="contrib-suggestion" className={labelClass}>
                {t('suggestion', language)}
              </label>
              <textarea
                id="contrib-suggestion"
                name="suggestion"
                value={form.suggestion}
                onChange={update('suggestion')}
                required
                rows={4}
                className={`${inputClass} resize-none`}
              ></textarea>
            </div>

            {formStatus === 'error' && (
              <p className="text-sm text-red-400 text-center">{t('errorTitle', language)}</p>
            )}

            <button
              type="submit"
              disabled={formStatus === 'submitting'}
              className="w-full bg-geo-accent hover:bg-amber-700 disabled:opacity-60 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {formStatus === 'submitting' ? (
                <span className="animate-pulse">{t('sending', language)}</span>
              ) : (
                <>
                  <Send size={18} /> {t('submit', language)}
                </>
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
