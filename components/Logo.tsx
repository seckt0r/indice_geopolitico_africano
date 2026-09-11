import React from 'react';

export interface LogoProps {
  /**
   * Variante de apresentação do logotipo:
   * - 'full': Símbolo + IGA + Índice Geopolítico Africano (+ descritor opcional)
   * - 'symbol': Apenas o isótipo continental com a constelação dos 5 pilares
   * - 'compact': Símbolo + sigla "IGA"
   * - 'vertical': Disposição empilhada e centrada para capas e cabeçalhos formais
   */
  variant?: 'full' | 'symbol' | 'compact' | 'vertical';
  /** Esquema cromático: 'light' (fundo claro/papel), 'dark' (fundo escuro/noite), 'mono' */
  theme?: 'light' | 'dark' | 'mono';
  /** Altura base em pixels ou classe de tamanho pré-definida */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Exibe a linha secundária "Catálogo de Análise Estratégica" */
  showDescriptor?: boolean;
  /** Ativa subtil animação de foco no isótipo */
  interactive?: boolean;
  className?: string;
}

/**
 * Componente oficial do Logotipo do Índice Geopolítico Africano (IGA).
 * Renderizado em SVG vetorial de precisão matemática, acessível e responsivo.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  theme = 'light',
  size = 'md',
  showDescriptor = true,
  interactive = false,
  className = '',
}) => {
  // Configuração de cores por tema
  const colors = {
    light: {
      primary: '#123A5E',
      continentFill: 'rgba(18, 58, 94, 0.08)',
      gold: '#A76B16',
      goldSoft: 'rgba(167, 107, 22, 0.75)',
      ink: '#16202E',
      muted: '#6E7887',
      nodeCenter: '#FAF9F6',
    },
    dark: {
      primary: '#FFFFFF',
      continentFill: 'rgba(234, 240, 245, 0.12)',
      gold: '#E5A84B',
      goldSoft: 'rgba(229, 168, 75, 0.85)',
      ink: '#EAF0F5',
      muted: '#9FB0C3',
      nodeCenter: '#121B27',
    },
    mono: {
      primary: 'currentColor',
      continentFill: 'currentColor',
      gold: 'currentColor',
      goldSoft: 'currentColor',
      ink: 'currentColor',
      muted: 'currentColor',
      nodeCenter: '#FFFFFF',
    },
  }[theme];

  // Cálculo de dimensões
  const sizeMap = {
    xs: { h: 22, symbolSize: 22 },
    sm: { h: 28, symbolSize: 28 },
    md: { h: 36, symbolSize: 36 },
    lg: { h: 48, symbolSize: 48 },
    xl: { h: 64, symbolSize: 64 },
  };

  const dim = typeof size === 'number' ? { h: size, symbolSize: size } : sizeMap[size];

  // Sub-componente do Isótipo (Emblema Continental e Constelação)
  const Isotype = (
    <svg
      viewBox="0 0 100 100"
      width={dim.symbolSize}
      height={dim.symbolSize}
      className={`shrink-0 overflow-visible ${interactive ? 'transition-transform duration-500 group-hover:scale-105' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`igaGradient-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity={theme === 'mono' ? 0.2 : 0.12} />
          <stop offset="100%" stopColor={colors.primary} stopOpacity={theme === 'mono' ? 0.05 : 0.03} />
        </linearGradient>
      </defs>

      {/* Anel Equatorial (traseira) */}
      <path
        d="M 6 55 C 6 44 94 44 94 55"
        fill="none"
        stroke={colors.gold}
        strokeWidth="1.3"
        strokeDasharray="2.5 2"
        opacity="0.65"
      />

      {/* Meridianos Geopolíticos */}
      <path
        d="M 50 10 C 35 32 37 68 55 95"
        fill="none"
        stroke={colors.primary}
        strokeWidth="1"
        opacity="0.25"
      />
      <path
        d="M 65 12 C 77 38 73 68 59 95"
        fill="none"
        stroke={colors.primary}
        strokeWidth="0.8"
        opacity="0.2"
      />

      {/* Silhueta do Continente Africano */}
      <path
        d="M 38 16 C 45 13 54 12 62 15 C 70 17 76 21 78 25 C 80 31 82 37 84 43 C 87 46 93 48 94 52 C 95 55 91 58 87 61 C 83 66 79 72 75 78 C 71 84 66 91 58 96 C 55 96 52 93 51 89 C 50 83 48 76 46 71 C 44 67 41 63 38 62 C 32 62 25 60 19 57 C 13 54 11 49 13 44 C 15 39 21 34 26 30 C 30 26 34 20 38 16 Z"
        fill={`url(#igaGradient-${theme})`}
        stroke={colors.primary}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Madagáscar */}
      <path
        d="M 88 68 C 91 65 93 67 92 72 C 90 78 86 84 84 88 C 82 90 81 89 82 86 C 84 81 87 74 88 68 Z"
        fill={`url(#igaGradient-${theme})`}
        stroke={colors.primary}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Arco Equatorial Frontal */}
      <path
        d="M 94 55 C 94 67 6 67 6 55"
        fill="none"
        stroke={colors.gold}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Linhas da Constelação dos 5 Pilares */}
      <g stroke={colors.gold} strokeWidth="1" opacity="0.75">
        <line x1="60" y1="24" x2="28" y2="48" />
        <line x1="60" y1="24" x2="76" y2="44" />
        <line x1="28" y1="48" x2="52" y2="58" />
        <line x1="76" y1="44" x2="52" y2="58" />
        <line x1="52" y1="58" x2="58" y2="84" />
      </g>

      {/* Nós dos 5 Pilares */}
      <circle cx="60" cy="24" r="3" fill={colors.nodeCenter} stroke={colors.gold} strokeWidth="1.5" />
      <circle cx="60" cy="24" r="1.5" fill={colors.gold} />

      <circle cx="28" cy="48" r="3" fill={colors.nodeCenter} stroke={colors.gold} strokeWidth="1.5" />
      <circle cx="28" cy="48" r="1.5" fill={colors.gold} />

      {/* Nó Central (Soberania / Economia & Recursos) */}
      <circle cx="52" cy="58" r="3.6" fill={colors.primary} stroke={colors.gold} strokeWidth="1.8" />
      <circle cx="52" cy="58" r="1.6" fill={colors.nodeCenter} />

      <circle cx="76" cy="44" r="3" fill={colors.nodeCenter} stroke={colors.gold} strokeWidth="1.5" />
      <circle cx="76" cy="44" r="1.5" fill={colors.gold} />

      <circle cx="58" cy="84" r="3" fill={colors.nodeCenter} stroke={colors.gold} strokeWidth="1.5" />
      <circle cx="58" cy="84" r="1.5" fill={colors.gold} />
    </svg>
  );

  if (variant === 'symbol') {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        role="img"
        aria-label="IGA - Logotipo Oficial"
      >
        {Isotype}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 ${className}`}
        role="img"
        aria-label="IGA - Índice Geopolítico Africano"
      >
        {Isotype}
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className="font-serif font-bold tracking-tight text-geo-ink"
            style={{ fontSize: `${dim.h * 0.72}px`, color: colors.primary }}
          >
            IGA
          </span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.gold }} />
        </div>
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div
        className={`flex flex-col items-center text-center ${className}`}
        role="img"
        aria-label="IGA - Índice Geopolítico Africano"
      >
        <div className="mb-3">{Isotype}</div>
        <div className="flex items-center justify-center gap-2">
          <span
            className="font-serif font-bold tracking-wide"
            style={{ fontSize: `${dim.h * 0.9}px`, color: colors.primary }}
          >
            IGA
          </span>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.gold }} />
        </div>
        <span className="mt-1 font-sans text-xs font-bold tracking-[0.18em]" style={{ color: colors.ink }}>
          ÍNDICE GEOPOLÍTICO AFRICANO
        </span>
        {showDescriptor && (
          <span
            className="mt-0.5 font-sans text-[10px] font-medium tracking-[0.14em]"
            style={{ color: colors.muted }}
          >
            CATÁLOGO DE ANÁLISE ESTRATÉGICA
          </span>
        )}
      </div>
    );
  }

  // Variante 'full' (Horizontal institucional padrão)
  return (
    <div
      className={`inline-flex items-center gap-3.5 select-none ${className}`}
      role="img"
      aria-label="IGA - Índice Geopolítico Africano"
    >
      {Isotype}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline gap-2">
          <span
            className="font-serif font-bold tracking-tight"
            style={{ fontSize: `${dim.h * 0.64}px`, color: colors.primary }}
          >
            IGA
          </span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.gold }} />
        </div>
        <span
          className="mt-1 font-sans text-[11px] font-bold tracking-[0.14em]"
          style={{ color: colors.ink }}
        >
          ÍNDICE GEOPOLÍTICO AFRICANO
        </span>
        {showDescriptor && (
          <span
            className="mt-0.5 font-sans text-[9px] font-medium tracking-[0.12em]"
            style={{ color: colors.muted }}
          >
            CATÁLOGO DE ANÁLISE ESTRATÉGICA
          </span>
        )}
      </div>
    </div>
  );
};
