/**
 * Metadados de apresentação dos 5 pilares, num só sítio.
 *
 * Substitui as listas repetidas em Sidebar, ComparisonPage e RadarChart, e
 * elimina o `label.split('.')[1]` que assumia que todas as traduções começavam
 * por "N. " — agora existem chaves curtas dedicadas (p1Short..p5Short).
 */

import { DimensionKey } from '../types';
import type { TranslationKey } from './translations';

export interface PillarMeta {
  key: DimensionKey;
  /** Chave de tradução do rótulo completo, ex.: "1. Económico & Resiliência". */
  labelKey: TranslationKey;
  /** Chave de tradução do rótulo curto, ex.: "Económico". */
  shortKey: TranslationKey;
  /** Cor do texto/ícone (Tailwind). */
  textClass: string;
  /** Cor da barra de progresso (Tailwind), estática e não interpolada. */
  barClass: string;
  /** Cor equivalente em hex, para D3 e Chart.js. */
  hex: string;
}

export const PILLARS: PillarMeta[] = [
  {
    key: 'economic',
    labelKey: 'p1',
    shortKey: 'p1Short',
    textClass: 'text-blue-400',
    barClass: 'bg-blue-400',
    hex: '#60a5fa',
  },
  {
    key: 'political',
    labelKey: 'p2',
    shortKey: 'p2Short',
    textClass: 'text-purple-400',
    barClass: 'bg-purple-400',
    hex: '#c084fc',
  },
  {
    key: 'security',
    labelKey: 'p3',
    shortKey: 'p3Short',
    textClass: 'text-red-400',
    barClass: 'bg-red-400',
    hex: '#f87171',
  },
  {
    key: 'international',
    labelKey: 'p4',
    shortKey: 'p4Short',
    textClass: 'text-emerald-400',
    barClass: 'bg-emerald-400',
    hex: '#34d399',
  },
  {
    key: 'historical',
    labelKey: 'p5',
    shortKey: 'p5Short',
    textClass: 'text-amber-400',
    barClass: 'bg-amber-400',
    hex: '#fbbf24',
  },
];
