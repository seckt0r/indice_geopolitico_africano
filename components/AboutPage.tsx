import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Database,
  GraduationCap,
  Map as MapIcon,
  ShieldAlert,
  Sigma,
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';
import { PILLAR_DETAILS } from '../utils/methodology';
import { PILLARS } from '../utils/pillars';
import { Callout, PageShell, SectionHeading, Stat, Tag } from './Layout';
import { InstitutionLogo, type Institution } from './InstitutionLogo';

interface AboutPageProps {
  language: Language;
  onOpenMap: () => void;
  onOpenMethodology: () => void;
  onOpenSources: () => void;
}

/**
 * Prosa de apresentação do projecto, em pt-PT.
 *
 * Os títulos e rótulos em redor passam por `t()` nas 8 línguas; o texto
 * científico longo permanece em português, como o restante conteúdo
 * metodológico — traduzi-lo exige revisão humana por idioma, não tradução
 * automática. Ver `utils/methodology.ts`.
 */
const ABOUT_PT = {
  what: [
    'O Índice Geopolítico Africano é um índice compósito numa escala de 0 a 100 que avalia a posição geopolítica, a capacidade institucional e a margem de manobra dos 54 Estados soberanos de África. Recusa deliberadamente o reducionismo do produto interno bruto como medida única de poder, e recusa igualmente a dependência das notações de risco produzidas por consultoras do Norte Global.',
    'Em vez disso, assenta numa estrutura multidimensional construída sobre dados abertos e sobre instituições pan-africanas. A pontuação de cada Estado resulta de quatro pilares activos com peso igual, complementados por um quinto pilar que enquadra a leitura sem entrar na aritmética.',
  ],
  why: [
    'Duas decisões moldam tudo o resto, e ambas são restrições antes de serem escolhas. A primeira é a recusa de publicar uma ordenação de 1 a 54. A simulação de Monte Carlo mostra que os intervalos de confiança a 90 % têm amplitude média de quase treze posições: a totalidade dos 53 pares consecutivos seria estatisticamente indistinguível, o que faria da ordenação linear informação sem conteúdo. Os seis escalões são a granularidade máxima que os dados sustentam.',
    'A segunda é de natureza teórica. O pilar de trajetória histórica é composto por variáveis nominais — tradição jurídica herdada, padrão de inserção colonial — e calcular a média de variáveis nominais viola a teoria de escalas de medida. Por isso não entra na soma: funciona como quadro moderador da leitura, e a totalidade do peso reparte-se pelos quatro pilares activos.',
  ],
  how: [
    'Os relatórios são produzidos antes de chegarem a quem consulta o índice. Periodicamente, cada um dos 54 Estados é submetido a um modelo de linguagem com um prompt metodológico que transporta a definição dos pilares, os indicadores admissíveis e as regras de safra. O modelo devolve uma pontuação justificada para cada pilar, em formato estruturado, e o resultado fica guardado numa base de dados de onde o mapa o lê de imediato.',
    'Cada geração acrescenta um registo em vez de substituir o anterior. É esse histórico que permite acompanhar a evolução da classificação de um país ao longo do tempo, em vez de mostrar apenas o estado presente.',
    'A aritmética nunca é delegada ao modelo. A agregação dos quatro pilares activos e a atribuição do escalão são recalculadas no cliente, a partir das pontuações por pilar, porque modelos de linguagem erram contas e essa é exactamente a parte do processo que tem de ser determinística e auditável.',
  ],
  scope: [
    'As pontuações são estimativas geradas por um modelo de linguagem a partir do seu conhecimento sobre indicadores reais, e não medições extraídas directamente das bases de dados citadas. O catálogo de fontes documenta a proveniência pretendida de cada indicador e serve de referência para verificação independente.',
    'O índice destina-se a diagnóstico de estrangulamentos, preparação diplomática e alerta precoce. É expressamente vedado usar a pontuação composta como variável independente univariada em regressões de causalidade linear.',
  ],
};

/**
 * Instituições parceiras mostradas no quadro de colaboração académica.
 *
 * Os ficheiros vivem em `public/instituicoes/`. Enquanto não existirem, cada
 * caixa mostra um monograma com a sigla — ver `InstitutionLogo`.
 */
const INSTITUICOES_PARCEIRAS: Institution[] = [
  {
    sigla: 'ACITE',
    nome: 'Academia de Ciências Sociais e Tecnologias',
    ficheiro: '/instituicoes/acite.svg',
  },
  {
    sigla: 'ISA',
    nome: 'Instituto Superior de Angola',
    ficheiro: '/instituicoes/isa.svg',
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({
  language,
  onOpenMap,
  onOpenMethodology,
  onOpenSources,
}) => (
  <div>
    {/* Hero em papel claro, sem fotografia de fundo: a hierarquia é tipográfica. */}
    <section className="border-b border-geo-line bg-geo-surface">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
            <p className="eyebrow mb-5">{t('heroBadge', language)}</p>
            <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              {t('heroTitle', language)}
            </h1>
            <p className="mt-7 max-w-prose text-lg leading-relaxed text-geo-body md:text-xl">
              {t('heroSubtitle', language)}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onOpenMap}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-geo-primary px-6 py-3.5 font-semibold text-white shadow-card transition-colors hover:bg-[#0d2b46]"
              >
                <MapIcon size={18} />
                {t('accessMap', language)}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={onOpenMethodology}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-geo-strong bg-geo-surface px-6 py-3.5 font-semibold text-geo-ink transition-colors hover:bg-geo-subtle"
              >
                <BookOpen size={18} />
                {t('readMethodology', language)}
              </button>
            </div>
          </div>

          {/* Sinopse dos pilares: diz o que o índice mede antes de o utilizador clicar. */}
          <div className="card p-6">
            <p className="eyebrow mb-4">{t('pillarsTitle', language)}</p>
            <ul className="space-y-3">
              {PILLARS.map((pillar, idx) => {
                const detail = PILLAR_DETAILS[idx];
                return (
                  <li key={pillar.key} className="flex items-baseline gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${pillar.barClass}`} />
                    <span className="flex-1 text-sm font-medium text-geo-ink">
                      {t(pillar.shortKey, language)}
                    </span>
                    <span className="font-mono text-xs text-geo-muted tabular">
                      {detail.role === 'activo' ? '25 %' : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 border-t border-geo-line pt-3 text-xs leading-relaxed text-geo-muted">
              {t('methodologyIntro2', language)}
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Faixa de números: dá escala ao projecto numa linha. */}
    <section className="border-b border-geo-line bg-geo-subtle">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4 md:px-10">
        <Stat value="54" label={t('statesCovered', language)} />
        <Stat value="4" label={t('activePillars', language)} />
        <Stat value="6" label={t('tiersCount', language)} />
        <Stat value="≤ 5" label={t('vintageWindow', language)} />
      </div>
    </section>

    <PageShell>
      <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
        <div className="space-y-16">
          <section>
            <SectionHeading index="01" title={t('whatIsTitle', language)} />
            <div className="max-w-prose space-y-4 leading-relaxed">
              {ABOUT_PT.what.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading index="02" title={t('whyTitle', language)} />
            <div className="max-w-prose space-y-4 leading-relaxed">
              {ABOUT_PT.why.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading index="03" title={t('howTitle', language)} />
            <div className="max-w-prose space-y-4 leading-relaxed">
              {ABOUT_PT.how.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-6 max-w-prose rounded-xl border border-geo-line bg-geo-surface p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-geo-ink">
                <Sigma size={16} className="text-geo-accent" />
                {t('formulaLabel', language)}
              </div>
              <code className="mt-3 block font-mono text-sm text-geo-primary">
                IGA = (P1 + P2 + P3 + P4) / 4
              </code>
            </div>
          </section>

          <section>
            <SectionHeading index="04" title={t('scopeTitle', language)} />
            <div className="max-w-prose space-y-4 leading-relaxed">
              {ABOUT_PT.scope.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-6 max-w-prose">
              <Callout
                icon={<ShieldAlert size={18} />}
                title={t('limitationsTitle', language)}
                tone="warning"
              >
                {t('analysisLocal', language)}
              </Callout>
            </div>
          </section>
        </div>

        {/* Coluna institucional: quem assina o índice. */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="eyebrow mb-5">{t('institutionsTitle', language)}</p>
            <div className="space-y-6 text-sm">
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-geo-muted">
                  <Building2 size={13} /> {t('developedBy', language)}
                </div>
                <p className="leading-relaxed text-geo-body">
                  {t('researchGroup', language)} — {t('institute', language)}
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-geo-muted">
                  <Database size={13} /> {t('application', language)}
                </div>
                <p className="leading-relaxed text-geo-body">{t('lab', language)}</p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-geo-muted">
                  <GraduationCap size={13} /> {t('collab', language)}
                </div>
                <p className="leading-relaxed text-geo-body">{t('collabText', language)}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {INSTITUICOES_PARCEIRAS.map((instituicao) => (
                    <InstitutionLogo key={instituicao.sigla} instituicao={instituicao} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <p className="eyebrow mb-3">{t('sourcesTitle', language)}</p>
            <p className="text-sm leading-relaxed text-geo-body">{t('sourcesSubtitle', language)}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['BAD', 'UNECA', 'Afreximbank', 'Afrobarómetro', 'IIAG', 'UNCTADstat', 'UCDP'].map((name) => (
                <Tag key={name}>{name}</Tag>
              ))}
            </div>
            <button
              onClick={onOpenSources}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-geo-primary hover:underline"
            >
              {t('exploreSources', language)}
              <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
    </PageShell>
  </div>
);
