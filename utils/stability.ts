/**
 * Ponto único de verdade para traduzir uma StabilityKey em cor e em texto.
 * Reflete os 6 escalões estatísticos robustos do IGA Reformulado (E1 a E6).
 */

import { Language, StabilityKey } from '../types';
import { t } from './translations';

/** Cor de preenchimento no mapa e nos indicadores para os 6 escalões estatísticos. */
export const STABILITY_COLORS: Record<StabilityKey, string> = {
  e1: '#2563eb', // blue-600 — E1: Alta Autonomia e Capacidade
  e2: '#059669', // emerald-600 — E2: Capacidade Consolidada
  e3: '#0d9488', // teal-600 — E3: Capacidade Intermédia
  e4: '#ca8a04', // yellow-600 — E4: Vulnerabilidade Estrutural
  e5: '#ea580c', // orange-600 — E5: Fragilidade Institucional
  e6: '#dc2626', // red-600 — E6: Crise Severa
};

/** Classes Tailwind para os badges dos 6 escalões. Estáticas — nunca interpoladas. */
export const STABILITY_BADGE_CLASSES: Record<StabilityKey, string> = {
  e1: 'border-blue-500 bg-blue-500/10 text-blue-400',
  e2: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  e3: 'border-teal-500 bg-teal-500/10 text-teal-400',
  e4: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  e5: 'border-orange-500 bg-orange-500/10 text-orange-400',
  e6: 'border-red-500 bg-red-500/10 text-red-400',
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
