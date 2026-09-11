/**
 * Ponto único de verdade para traduzir uma StabilityKey em cor e em texto.
 * Reflete os 6 escalões estatísticos robustos do IGA Reformulado (E1 a E6).
 */

import { Language, StabilityKey } from '../types';
import { t } from './translations';

/**
 * Cor de preenchimento no mapa e nos indicadores para os 6 escalões.
 * Escalão 700/800 para manter contraste AA sobre o papel claro.
 */
export const STABILITY_COLORS: Record<StabilityKey, string> = {
  e1: '#1d4ed8', // blue-700 — E1: Alta Autonomia e Capacidade
  e2: '#047857', // emerald-700 — E2: Capacidade Consolidada
  e3: '#0f766e', // teal-700 — E3: Capacidade Intermédia
  e4: '#a16207', // yellow-700 — E4: Vulnerabilidade Estrutural
  e5: '#c2410c', // orange-700 — E5: Fragilidade Institucional
  e6: '#b91c1c', // red-700 — E6: Crise Severa
};

/** Classes Tailwind para os badges dos 6 escalões. Estáticas — nunca interpoladas. */
export const STABILITY_BADGE_CLASSES: Record<StabilityKey, string> = {
  e1: 'border-blue-200 bg-blue-50 text-blue-800',
  e2: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  e3: 'border-teal-200 bg-teal-50 text-teal-800',
  e4: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  e5: 'border-orange-200 bg-orange-50 text-orange-800',
  e6: 'border-red-200 bg-red-50 text-red-800',
};

const LABEL_KEYS = {
  e1: 'stability_e1',
  e2: 'stability_e2',
  e3: 'stability_e3',
  e4: 'stability_e4',
  e5: 'stability_e5',
  e6: 'stability_e6',
} as const;

/** Texto visível do escalão, no idioma activo. */
export const stabilityLabel = (key: StabilityKey, lang: Language): string => t(LABEL_KEYS[key], lang);

/** Cor de um país no mapa; `undefined` quando ainda não foi analisado. */
export const stabilityColor = (key?: StabilityKey): string | undefined =>
  key ? STABILITY_COLORS[key] : undefined;
