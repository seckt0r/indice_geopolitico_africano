/**
 * Primitivas de composição das páginas de conteúdo.
 *
 * Existem para que Metodologia, Algoritmo, Fontes e Sobre partilhem a mesma
 * métrica tipográfica e o mesmo ritmo vertical, em vez de cada página repetir
 * as suas próprias classes de título e de cartão.
 */

import React from 'react';

/** Coluna de leitura de uma página de documentação. */
export const PageShell: React.FC<{
  children: React.ReactNode;
  /** 'wide' para páginas com grelhas de cartões; 'text' para prosa contínua. */
  width?: 'wide' | 'text';
}> = ({ children, width = 'wide' }) => (
  <div
    className={`mx-auto px-6 py-14 md:px-10 md:py-20 animate-in fade-in duration-500 ${
      width === 'wide' ? 'max-w-6xl' : 'max-w-3xl'
    }`}
  >
    {children}
  </div>
);

/** Cabeçalho de página: eyebrow, título em serifa e lead. */
export const PageHeader: React.FC<{
  eyebrow: string;
  title: string;
  lede?: string;
}> = ({ eyebrow, title, lede }) => (
  <header className="mb-14 md:mb-20 max-w-3xl">
    <p className="eyebrow mb-4">{eyebrow}</p>
    <h1 className="font-serif text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">{title}</h1>
    {lede && <p className="mt-6 text-lg md:text-xl leading-relaxed text-geo-body">{lede}</p>}
  </header>
);

/** Título de secção com régua, numerado como num artigo. */
export const SectionHeading: React.FC<{
  index?: string;
  title: string;
  description?: string;
  id?: string;
}> = ({ index, title, description, id }) => (
  <div id={id} className="rule scroll-mt-24">
    <div className="flex items-baseline gap-3">
      {index && <span className="font-mono text-xs text-geo-accent tabular">{index}</span>}
      <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
    </div>
    {description && <p className="mt-3 max-w-prose leading-relaxed text-geo-body">{description}</p>}
  </div>
);

/** Número em destaque com legenda — usado nas faixas de síntese. */
export const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div>
    <div className="font-serif text-3xl md:text-4xl font-bold text-geo-primary tabular">{value}</div>
    <div className="mt-1 text-xs uppercase tracking-wider text-geo-muted">{label}</div>
  </div>
);

/** Nota lateral destacada: avisos metodológicos e limitações. */
export const Callout: React.FC<{
  icon?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  tone?: 'neutral' | 'warning';
}> = ({ icon, title, children, tone = 'neutral' }) => (
  <aside
    className={`rounded-xl border p-5 md:p-6 ${
      tone === 'warning' ? 'border-amber-200 bg-geo-accentSoft' : 'border-geo-line bg-geo-subtle'
    }`}
  >
    <div className="flex gap-3">
      {icon && <span className="shrink-0 text-geo-accent">{icon}</span>}
      <div className="min-w-0">
        {title && <h3 className="mb-1 text-sm font-semibold text-geo-ink">{title}</h3>}
        <div className="text-sm leading-relaxed text-geo-body">{children}</div>
      </div>
    </div>
  </aside>
);

/** Etiqueta neutra para metadados curtos (peso, papel, periodicidade). */
export const Tag: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = 'border-geo-line bg-geo-subtle text-geo-muted',
}) => (
  <span
    className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5 ${className}`}
  >
    {children}
  </span>
);
