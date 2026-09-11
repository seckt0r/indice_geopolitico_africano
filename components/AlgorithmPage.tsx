import React from 'react';
import { AlertTriangle, Cpu, MonitorCheck } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';
import { ALGORITHM_STEPS, TIERS, UNCERTAINTY_FINDINGS } from '../utils/methodology';
import { STABILITY_BADGE_CLASSES } from '../utils/stability';
import { Callout, PageHeader, PageShell, SectionHeading, Tag } from './Layout';

interface AlgorithmPageProps {
  language: Language;
}

/**
 * Documenta o pipeline de geração de um relatório.
 *
 * A distinção entre o que o modelo produz e o que o cliente calcula é o ponto
 * central desta página: é ela que explica porque é que a pontuação composta é
 * reprodutível apesar de a inferência não o ser.
 */
export const AlgorithmPage: React.FC<AlgorithmPageProps> = ({ language }) => (
  <PageShell>
    <PageHeader
      eyebrow={t('techDocs', language)}
      title={t('algorithmTitle', language)}
      lede={t('algorithmSubtitle', language)}
    />

    {/* Pipeline ------------------------------------------------------------ */}
    <section className="mb-20">
      <SectionHeading index="01" id="pipeline" title={t('howTitle', language)} />

      <ol className="relative space-y-0 border-l border-geo-line">
        {ALGORITHM_STEPS.map((step) => {
          const isModel = step.actor === 'modelo';
          return (
            <li key={step.n} className="relative pb-10 pl-8 last:pb-0 md:pl-10">
              <span
                className={`absolute -left-[9px] top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 bg-geo-paper font-mono text-[10px] font-bold ${
                  isModel ? 'border-geo-accent text-geo-accent' : 'border-geo-primary text-geo-primary'
                }`}
              >
                {step.n}
              </span>

              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h3 className="font-serif text-lg font-bold">{step.title}</h3>
                <Tag
                  className={
                    isModel
                      ? 'border-amber-200 bg-geo-accentSoft text-amber-800'
                      : 'border-geo-line bg-geo-primarySoft text-geo-primary'
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    {isModel ? <Cpu size={11} /> : <MonitorCheck size={11} />}
                    {isModel ? t('actorModel', language) : t('actorClient', language)}
                  </span>
                </Tag>
              </div>

              <p className="max-w-prose leading-relaxed text-geo-body">{step.body}</p>

              {step.technical && (
                <code className="mt-3 inline-block rounded-md border border-geo-line bg-geo-subtle px-3 py-1.5 font-mono text-xs text-geo-primary">
                  {step.technical}
                </code>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-10 max-w-prose">
        <Callout
          icon={<AlertTriangle size={18} />}
          tone="warning"
          title="Porque é que o modelo não faz contas"
        >
          Numa medição desta instância o modelo devolveu uma pontuação composta de 42 quando a média real dos
          pilares era 41,2. Modelos de linguagem aproximam aritmética em vez de a executarem, e por isso a
          média, o escalão e qualquer comparação entre países são calculados no cliente, a partir das
          pontuações por pilar.
        </Callout>
      </div>
    </section>

    {/* Agregação ----------------------------------------------------------- */}
    <section className="mb-20">
      <SectionHeading
        index="02"
        id="agregacao"
        title={t('formulaLabel', language)}
        description="A agregação é linear e sem pesos ocultos. Qualquer leitor pode reproduzir a pontuação a partir dos quatro valores de pilar apresentados no relatório."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6 md:p-8">
          <code className="block font-mono text-lg text-geo-primary">IGA = (P1 + P2 + P3 + P4) / 4</code>
          <dl className="mt-6 space-y-2 text-sm">
            {[
              ['P1', 'Capacidade económica e resiliência estrutural', '0,25'],
              ['P2', 'Efectividade institucional e governação endógena', '0,25'],
              ['P3', 'Segurança, coesão interna e controlo territorial', '0,25'],
              ['P4', 'Gestão da interdependência e margem de manobra', '0,25'],
              ['P5', 'Trajetória histórica — quadro moderador', '0,00'],
            ].map(([symbol, name, weight]) => (
              <div
                key={symbol}
                className="flex items-baseline gap-3 border-b border-geo-line pb-2 last:border-0"
              >
                <dt className="w-7 shrink-0 font-mono text-xs font-bold text-geo-accent">{symbol}</dt>
                <dd className="flex-1 leading-snug text-geo-body">{name}</dd>
                <dd className="font-mono text-xs text-geo-muted tabular">{weight}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-6 md:p-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-geo-muted">
            {t('tiersTitle', language)}
          </p>
          <ul className="space-y-2.5">
            {TIERS.map((tier) => (
              <li key={tier.id} className="flex items-center gap-3">
                <span
                  className={`w-9 shrink-0 rounded border px-1.5 py-0.5 text-center font-mono text-[11px] font-bold ${STABILITY_BADGE_CLASSES[tier.id]}`}
                >
                  {tier.tier}
                </span>
                <span className="flex-1 text-sm leading-snug text-geo-body">{tier.name}</span>
                <span className="shrink-0 font-mono text-xs text-geo-muted tabular">{tier.range}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-geo-line pt-4 font-mono text-[11px] leading-relaxed text-geo-muted">
            stabilityFromScore(iga) → e1 … e6
          </p>
        </div>
      </div>
    </section>

    {/* Incerteza ----------------------------------------------------------- */}
    <section className="mb-20">
      <SectionHeading
        index="03"
        id="incerteza"
        title={t('uncertaintyTitle', language)}
        description="O protocolo de propagação de incerteza é o que justifica a existência de escalões em vez de posições. Estes são os seus resultados."
      />

      <div className="mb-8 grid gap-px overflow-hidden rounded-xl border border-geo-line bg-geo-line sm:grid-cols-2 lg:grid-cols-4">
        {UNCERTAINTY_FINDINGS.map((finding) => (
          <div key={finding.label} className="bg-geo-surface p-6">
            <div className="font-serif text-2xl font-bold text-geo-primary tabular">{finding.value}</div>
            <div className="mt-1.5 text-xs leading-snug text-geo-muted">{finding.label}</div>
          </div>
        ))}
      </div>

      <div className="max-w-prose space-y-4 leading-relaxed">
        <p>
          A simulação faz variar os pesos dos quatro pilares por uma distribuição de Dirichlet e injecta o
          erro empírico de medida declarado por cada fonte. Repetido dez mil vezes, o procedimento devolve,
          para cada Estado, uma distribuição de posições em vez de uma posição única.
        </p>
        <p>
          O resultado é inequívoco. A amplitude média do intervalo a 90 % é de perto de treze posições e
          nenhum dos 53 pares consecutivos do ranking é separável com confiança. Publicar uma ordenação de 1 a
          54 seria, portanto, publicar ruído com aparência de precisão. Os seis escalões são a granularidade
          máxima que os dados sustentam.
        </p>
      </div>
    </section>

    {/* Limitações ---------------------------------------------------------- */}
    <section>
      <SectionHeading index="04" id="limitacoes" title={t('limitationsTitle', language)} />
      <div className="grid gap-5 md:grid-cols-2">
        {[
          {
            title: 'Estimativas, não medições',
            body: 'As pontuações são inferidas por um modelo de linguagem a partir do seu conhecimento dos indicadores, e não lidas directamente das bases de dados citadas. Duas gerações do mesmo país podem divergir alguns pontos.',
          },
          {
            title: 'Fontes declaradas, não verificadas',
            body: 'A lista de fontes que acompanha cada relatório é declarada pelo modelo e não é validada automaticamente contra o catálogo de fontes do projecto.',
          },
          {
            title: 'Sem série temporal',
            body: 'Cada relatório é um instantâneo gerado no momento do pedido. O índice ainda não guarda histórico, pelo que não suporta análise de tendência.',
          },
          {
            title: 'Cobertura desigual dos dados de base',
            body: 'Estados em conflito aberto têm registos estatísticos interrompidos. A regra de safra protege contra observações anacrónicas, mas não cria dados onde eles não existem.',
          },
        ].map((limitation) => (
          <div key={limitation.title} className="card p-6">
            <h3 className="mb-2 font-serif text-lg font-bold">{limitation.title}</h3>
            <p className="text-sm leading-relaxed text-geo-body">{limitation.body}</p>
          </div>
        ))}
      </div>
    </section>
  </PageShell>
);
