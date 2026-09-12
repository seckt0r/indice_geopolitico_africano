/**
 * Ponto único de verdade para traduzir uma StabilityKey em cor e em texto.
 * Reflete os 6 escalões estatísticos robustos do IGA (E1 a E6).
 */

import { Language, StabilityKey } from '../types';
import { t } from './translations';

/**
 * Cor de cada escalão no mapa e nos indicadores.
 *
 * A escala E1–E6 é ORDINAL, não categórica: o que tem de ser percebido é a
 * ordem, não a identidade de seis categorias soltas. Por isso é uma rampa
 * sequencial construída com luminosidade estritamente monótona — cerca de 8,5
 * de diferença em OKLab entre passos consecutivos. A luminosidade mantém-se
 * sob qualquer tipo de daltonismo, pelo que é ela que carrega a ordem; o
 * varrimento de matiz, do azul claro ao vermelho escuro, acrescenta leitura a
 * quem tem visão cromática completa sem ser a única pista.
 *
 * A versão anterior usava seis matizes independentes e falhava: o par E4/E5
 * tinha ΔE de 0,6 em deuteranopia — indistinguível — e o par E2/E3 tinha 3,9
 * mesmo em visão normal. Nesta rampa os mesmos piores casos passam a 6,4 e
 * 9,0. Continuam abaixo do mínimo de 15 exigido a uma paleta CATEGÓRICA, o que
 * não se aplica aqui, e em toda a interface o escalão aparece também por
 * extenso: legenda, tooltip, badge e faixas do gráfico.
 */
export const STABILITY_COLORS: Record<StabilityKey, string> = {
  e1: '#a4c8fd', // L 0.83 — E1: Alta Autonomia e Capacidade
  e2: '#3cbbe1', // L 0.74 — E2: Capacidade Consolidada
  e3: '#00a4b2', // L 0.66 — E3: Capacidade Intermédia
  e4: '#967107', // L 0.57 — E4: Vulnerabilidade Estrutural
  e5: '#9d3d00', // L 0.49 — E5: Fragilidade Institucional
  e6: '#86111b', // L 0.40 — E6: Crise Severa
};

/**
 * Classes Tailwind para os badges. Estáticas — nunca interpoladas.
 * O texto vai sempre no tom 900 da família: o badge tem palavras por cima e
 * essas precisam de contraste, ao contrário do preenchimento do mapa.
 */
export const STABILITY_BADGE_CLASSES: Record<StabilityKey, string> = {
  e1: 'border-blue-200 bg-blue-50 text-blue-900',
  e2: 'border-sky-200 bg-sky-50 text-sky-900',
  e3: 'border-cyan-200 bg-cyan-50 text-cyan-900',
  e4: 'border-amber-200 bg-amber-50 text-amber-900',
  e5: 'border-orange-200 bg-orange-50 text-orange-900',
  e6: 'border-red-200 bg-red-50 text-red-900',
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
