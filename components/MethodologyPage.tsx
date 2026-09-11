import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { CheckCircle, Globe, History, Scale, Send, Shield, Sigma } from 'lucide-react';
import { t } from '../utils/translations';
import { DimensionKey, Language } from '../types';
import { PILLARS } from '../utils/pillars';
import { STABILITY_BADGE_CLASSES } from '../utils/stability';
import { PILLAR_DETAILS, PRINCIPLES, TIERS } from '../utils/methodology';
import { Callout, PageHeader, PageShell, SectionHeading, Tag } from './Layout';

interface MethodologyPageProps {
  language: Language;
}

const PILLAR_ICONS: Record<DimensionKey, React.ElementType> = {
  economic: Sigma,
  political: Scale,
  security: Shield,
  international: Globe,
  historical: History,
};

const STORAGE_KEY = 'iga.contributions';

interface ContributionForm {
  name: string;
  institution: string;
  email: string;
  suggestion: string;
}

const EMPTY_FORM: ContributionForm = { name: '', institution: '', email: '', suggestion: '' };

/**
 * Limites de comprimento por campo.
 *
 * Sem eles, o formulário aceita um texto arbitrariamente longo, que ou enche o
 * armazenamento local do navegador ou segue para o endpoint de recolha como um
 * pedido desproporcionado. São aplicados no elemento e outra vez na submissão,
 * porque o atributo `maxLength` só vale para quem escreve pelo teclado.
 */
const LIMITES: Record<keyof ContributionForm, number> = {
  name: 120,
  institution: 160,
  email: 254,
  suggestion: 4000,
};

const aparar = (form: ContributionForm): ContributionForm => ({
  name: form.name.trim().slice(0, LIMITES.name),
  institution: form.institution.trim().slice(0, LIMITES.institution),
  email: form.email.trim().slice(0, LIMITES.email),
  suggestion: form.suggestion.trim().slice(0, LIMITES.suggestion),
});

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

    const payload = { ...aparar(form), language, submittedAt: new Date().toISOString() };
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
        const existing: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        const anteriores = Array.isArray(existing) ? existing.slice(-49) : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...anteriores, payload]));
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
        // Os 4 pilares activos têm peso de 25 % cada. O Pilar V é quadro moderador.
        labels: PILLARS.slice(0, 4).map((p) => t(p.shortKey, language)),
        datasets: [
          {
            data: [25, 25, 25, 25],
            backgroundColor: PILLARS.slice(0, 4).map((p) => p.hex),
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, boxHeight: 10, padding: 14, color: '#3b4859', font: { size: 12 } },
          },
          tooltip: {
            backgroundColor: '#16202e',
            callbacks: { label: (item) => ` ${item.label}: 25 %` },
          },
        },
      },
    });

    return () => {
      weightChartInstance.current?.destroy();
      weightChartInstance.current = null;
    };
  }, [language]);

  const inputClass =
    'w-full rounded-lg border border-geo-strong bg-geo-surface px-4 py-3 text-geo-ink outline-none transition-colors placeholder:text-geo-muted focus:border-geo-primary';
  const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-geo-muted';

  return (
    <PageShell>
      <PageHeader
        eyebrow={t('techDocs', language)}
        title={t('methodologyTitle', language)}
        lede={t('methodologySubtitle', language)}
      />

      {/* Estrutura de pesos ------------------------------------------------ */}
      <section className="mb-20">
        <SectionHeading
          index="01"
          id="estrutura"
          title={t('methodologyIntro1', language)}
          description={t('methodologyIntro2', language)}
        />
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-geo-line bg-geo-subtle p-5">
              <p className="mb-3 text-sm font-semibold text-geo-ink">{t('formulaLabel', language)}</p>
              <code className="block font-mono text-base text-geo-primary">
                IGA = (P1 + P2 + P3 + P4) / 4
              </code>
              <p className="mt-3 font-mono text-xs text-geo-muted">w₁ = w₂ = w₃ = w₄ = 0,25</p>
            </div>
            <Callout title={t('labelReformulation', language)}>
              O Pilar V deixou de pesar 20 % numa média de cinco pilares e passou a quadro moderador
              contextual, por imposição da teoria de escalas de medida de Stevens. Os quatro pilares dinâmicos
              repartiram entre si a totalidade do peso.
            </Callout>
          </div>

          <div className="card p-6">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-geo-muted">
              {t('activePillars', language)} · 100 %
            </p>
            <div className="h-64">
              <canvas ref={weightChartRef}></canvas>
            </div>
          </div>
        </div>
      </section>

      {/* Os cinco pilares -------------------------------------------------- */}
      <section className="mb-20">
        <SectionHeading index="02" id="pilares" title={t('pillarsTitle', language)} />
        <div className="space-y-6">
          {PILLARS.map((pillar, idx) => {
            const detail = PILLAR_DETAILS[idx];
            const Icon = PILLAR_ICONS[pillar.key];
            const isModerator = detail.role === 'moderador';
            return (
              <article
                key={pillar.key}
                className={`card overflow-hidden p-6 md:p-8 ${isModerator ? 'bg-geo-subtle' : ''}`}
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span
                      className={`mt-0.5 shrink-0 rounded-lg border border-geo-line p-2 ${pillar.textClass}`}
                    >
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="font-serif text-xl font-bold">{t(pillar.labelKey, language)}</h3>
                      <p className="mt-1 text-sm italic text-geo-muted">{detail.question}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Tag
                      className={
                        isModerator
                          ? 'border-amber-200 bg-geo-accentSoft text-amber-800'
                          : 'border-geo-line bg-geo-primarySoft text-geo-primary'
                      }
                    >
                      {isModerator ? t('roleModerator', language) : t('roleActive', language)}
                    </Tag>
                    {!isModerator && (
                      <Tag>
                        {t('labelWeight', language)} · {Math.round(detail.weight * 100)} %
                      </Tag>
                    )}
                  </div>
                </div>

                <p className="mb-6 max-w-prose leading-relaxed">{detail.summary}</p>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-geo-muted">
                      {t('labelIndicators', language)}
                    </p>
                    <ul className="space-y-2.5">
                      {detail.indicators.map((indicator) => (
                        <li key={indicator.name} className="border-l-2 border-geo-line pl-3">
                          <p className="text-sm leading-snug text-geo-ink">{indicator.name}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-geo-muted">{indicator.source}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-geo-line bg-geo-paper p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-geo-accent">
                      {t('labelReformulation', language)}
                    </p>
                    <p className="text-sm leading-relaxed text-geo-body">{detail.reformulation}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Escalões ---------------------------------------------------------- */}
      <section className="mb-20">
        <SectionHeading
          index="03"
          id="escaloes"
          title={t('tiersTitle', language)}
          description="A ordenação de 1 a 54 foi banida por ser estatisticamente insustentável. Os Estados são classificados em seis escalões separáveis, cada um com um gargalo dominante próprio."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-geo-strong text-xs uppercase tracking-wider text-geo-muted">
                <th className="py-3 pr-4 font-semibold">{t('generalRank', language)}</th>
                <th className="py-3 pr-4 font-semibold">{t('labelRange', language)}</th>
                <th className="py-3 pr-4 font-semibold">{t('labelTypicalStates', language)}</th>
                <th className="py-3 font-semibold">{t('labelBottleneck', language)}</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier) => (
                <tr key={tier.id} className="border-b border-geo-line align-top">
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STABILITY_BADGE_CLASSES[tier.id]}`}
                    >
                      {tier.tier}
                    </span>
                    <p className="mt-2 max-w-[14rem] font-medium leading-snug text-geo-ink">{tier.name}</p>
                  </td>
                  <td className="py-4 pr-4 font-mono text-geo-body tabular">{tier.range}</td>
                  <td className="max-w-[16rem] py-4 pr-4 leading-relaxed text-geo-body">{tier.examples}</td>
                  <td className="max-w-[20rem] py-4 leading-relaxed text-geo-muted">{tier.bottleneck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Princípios -------------------------------------------------------- */}
      <section className="mb-20">
        <SectionHeading index="04" id="principios" title={t('principlesTitle', language)} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((principle) => (
            <div key={principle.id} className="card p-6">
              <h3 className="mb-2 font-serif text-lg font-bold">{principle.title}</h3>
              <p className="text-sm leading-relaxed text-geo-body">{principle.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contribuições ----------------------------------------------------- */}
      <section className="card p-8 md:p-12">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold">{t('contributionTitle', language)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-geo-body">{t('contributionSubtitle', language)}</p>
        </div>

        {formStatus === 'success' ? (
          <div className="mx-auto max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center animate-in fade-in zoom-in">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-700" />
            <h3 className="mb-2 text-lg font-bold text-emerald-900">{t('success', language)}</h3>
            {storedLocally && (
              <p className="mx-auto max-w-md text-sm text-emerald-800">{t('contributionStored', language)}</p>
            )}
            <button
              onClick={() => setFormStatus('idle')}
              className="mt-6 text-xs font-medium text-geo-primary underline"
            >
              {t('submit', language)}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
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
                  maxLength={LIMITES.name}
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
                  maxLength={LIMITES.institution}
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
                maxLength={LIMITES.email}
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
                maxLength={LIMITES.suggestion}
                rows={4}
                className={`${inputClass} resize-none`}
              ></textarea>
            </div>

            {formStatus === 'error' && (
              <p className="text-center text-sm text-red-700">{t('errorTitle', language)}</p>
            )}

            <button
              type="submit"
              disabled={formStatus === 'submitting'}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-geo-primary py-3.5 font-semibold text-white transition-colors hover:bg-[#0d2b46] disabled:opacity-60"
            >
              {formStatus === 'submitting' ? (
                <span className="animate-pulse">{t('sending', language)}</span>
              ) : (
                <>
                  <Send size={17} /> {t('submit', language)}
                </>
              )}
            </button>
          </form>
        )}
      </section>
    </PageShell>
  );
};
