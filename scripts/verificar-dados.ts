/**
 * Valida o índice guardado na base de dados.
 *
 * Um conjunto incompleto ou com pontuações fora do intervalo passaria
 * despercebido até chegar ao browser, onde se traduz em países sem cor e num
 * painel vazio. Este script falha cedo, no cron ou no CI.
 *
 * Uso: npm run dados:verificar [-- --lang=pt]
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DIMENSION_KEYS, STABILITY_KEYS, type DimensionKey, type Language } from '../types';

const loadDotEnv = (): void => {
  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  } catch {
    return;
  }
  for (const line of contents.split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match || line.trim().startsWith('#')) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
  }
};

loadDotEnv();

const { rpc, hasSupabaseConfig, SUPABASE_URL } = await import('../services/supabaseClient');
const { AFRICAN_COUNTRIES } = await import('../utils/countries');

interface LinhaRelatorio {
  id?: string;
  countryName?: string;
  igaScore?: number;
  stabilityKey?: string;
  longAnalysis?: string;
  generatedAt?: number;
  dimensions?: Record<string, { score?: number; analysis?: string }>;
}

const ACTIVOS: DimensionKey[] = ['economic', 'political', 'security', 'international'];

async function main(): Promise<void> {
  const idioma = (process.argv.find((a) => a.startsWith('--lang='))?.slice(7) ?? 'pt') as Language;

  if (!hasSupabaseConfig()) {
    console.error('A base de dados não está configurada. Faltam o URL ou a chave.');
    process.exit(1);
  }

  const linhas = await rpc<LinhaRelatorio[]>('iga_relatorios_actuais', { p_idioma: idioma });
  const problemas: string[] = [];

  for (const linha of linhas ?? []) {
    const id = linha.id ?? '(sem id)';

    if (!STABILITY_KEYS.includes(linha.stabilityKey as never)) {
      problemas.push(`${id}: escalão inválido "${linha.stabilityKey}".`);
    }
    if (!(Number(linha.igaScore) >= 0 && Number(linha.igaScore) <= 100)) {
      problemas.push(`${id}: igaScore fora de 0-100.`);
    }
    if (!linha.longAnalysis?.trim()) problemas.push(`${id}: síntese vazia.`);

    for (const pilar of DIMENSION_KEYS) {
      const pontuacao = linha.dimensions?.[pilar]?.score;
      if (!Number.isInteger(pontuacao) || Number(pontuacao) < 0 || Number(pontuacao) > 100) {
        problemas.push(`${id}: pontuação inválida no pilar ${pilar} (${pontuacao}).`);
      }
    }

    // A média dos quatro pilares activos é autoridade do cliente; se a base não
    // a respeitar, foi escrita por uma versão divergente ou alterada à mão.
    const esperado =
      ACTIVOS.reduce((soma, pilar) => soma + Number(linha.dimensions?.[pilar]?.score ?? 0), 0) /
      ACTIVOS.length;
    if (Math.abs(esperado - Number(linha.igaScore)) > 0.01) {
      problemas.push(`${id}: igaScore ${linha.igaScore} não corresponde à média ${esperado.toFixed(2)}.`);
    }
  }

  const total = linhas?.length ?? 0;
  const maisRecente = (linhas ?? []).reduce((max, l) => Math.max(max, Number(l.generatedAt) || 0), 0);

  console.log(`Base: ${SUPABASE_URL?.replace(/\/\/([a-z0-9]{4})[a-z0-9]*/i, '//$1…')}`);
  console.log(`Idioma: ${idioma}`);
  console.log(`Países com relatório: ${total}/${AFRICAN_COUNTRIES.length}`);
  console.log(`Geração mais recente: ${maisRecente ? new Date(maisRecente).toISOString() : '—'}`);

  if (total === 0) {
    console.error('O índice está vazio.');
    process.exit(1);
  }
  if (total < AFRICAN_COUNTRIES.length) {
    console.warn(`Aviso: faltam ${AFRICAN_COUNTRIES.length - total} países.`);
  }

  if (problemas.length) {
    console.error(`\n${problemas.length} problemas:`);
    for (const problema of problemas) console.error(`  ${problema}`);
    process.exit(1);
  }

  console.log('Sem problemas.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
