/**
 * Lista canónica dos 54 Estados soberanos de África.
 *
 * Existe porque a geração passou a ser feita na compilação, fora do browser: o
 * script de dados precisa de saber que países gerar sem depender do GeoJSON,
 * que é carregado em runtime e é uma dependência de rede externa.
 *
 * A chave é o ISO 3166-1 alpha-2 e é a mesma que o mapa usa para colorir os
 * países e que a cache usa para indexar relatórios. O nome em português serve
 * de rótulo por omissão e de entrada no prompt; a UI mostra o nome localizado
 * pelo `Intl.DisplayNames`.
 */

export interface CountryEntry {
  /** ISO 3166-1 alpha-2, em maiúsculas. */
  id: string;
  /** Nome em pt-PT, usado no prompt e como fallback de exibição. */
  name: string;
}

export const AFRICAN_COUNTRIES: CountryEntry[] = [
  { id: 'AO', name: 'Angola' },
  { id: 'BF', name: 'Burquina Faso' },
  { id: 'BI', name: 'Burundi' },
  { id: 'BJ', name: 'Benim' },
  { id: 'BW', name: 'Botsuana' },
  { id: 'CD', name: 'República Democrática do Congo' },
  { id: 'CF', name: 'República Centro-Africana' },
  { id: 'CG', name: 'República do Congo' },
  { id: 'CI', name: 'Costa do Marfim' },
  { id: 'CM', name: 'Camarões' },
  { id: 'CV', name: 'Cabo Verde' },
  { id: 'DJ', name: 'Djibuti' },
  { id: 'DZ', name: 'Argélia' },
  { id: 'EG', name: 'Egipto' },
  { id: 'ER', name: 'Eritreia' },
  { id: 'ET', name: 'Etiópia' },
  { id: 'GA', name: 'Gabão' },
  { id: 'GH', name: 'Gana' },
  { id: 'GM', name: 'Gâmbia' },
  { id: 'GN', name: 'Guiné' },
  { id: 'GQ', name: 'Guiné Equatorial' },
  { id: 'GW', name: 'Guiné-Bissau' },
  { id: 'KE', name: 'Quénia' },
  { id: 'KM', name: 'Comores' },
  { id: 'LR', name: 'Libéria' },
  { id: 'LS', name: 'Lesoto' },
  { id: 'LY', name: 'Líbia' },
  { id: 'MA', name: 'Marrocos' },
  { id: 'MG', name: 'Madagáscar' },
  { id: 'ML', name: 'Mali' },
  { id: 'MR', name: 'Mauritânia' },
  { id: 'MU', name: 'Maurícia' },
  { id: 'MW', name: 'Maláui' },
  { id: 'MZ', name: 'Moçambique' },
  { id: 'NA', name: 'Namíbia' },
  { id: 'NE', name: 'Níger' },
  { id: 'NG', name: 'Nigéria' },
  { id: 'RW', name: 'Ruanda' },
  { id: 'SC', name: 'Seicheles' },
  { id: 'SD', name: 'Sudão' },
  { id: 'SL', name: 'Serra Leoa' },
  { id: 'SN', name: 'Senegal' },
  { id: 'SO', name: 'Somália' },
  { id: 'SS', name: 'Sudão do Sul' },
  { id: 'ST', name: 'São Tomé e Príncipe' },
  { id: 'SZ', name: 'Essuatíni' },
  { id: 'TD', name: 'Chade' },
  { id: 'TG', name: 'Togo' },
  { id: 'TN', name: 'Tunísia' },
  { id: 'TZ', name: 'Tanzânia' },
  { id: 'UG', name: 'Uganda' },
  { id: 'ZA', name: 'África do Sul' },
  { id: 'ZM', name: 'Zâmbia' },
  { id: 'ZW', name: 'Zimbabué' },
];

export const COUNTRY_COUNT = AFRICAN_COUNTRIES.length;

/** Índice por ISO alpha-2, para resolver um país sem percorrer a lista. */
export const COUNTRY_BY_ID: Record<string, CountryEntry> = Object.fromEntries(
  AFRICAN_COUNTRIES.map((c) => [c.id, c])
);
