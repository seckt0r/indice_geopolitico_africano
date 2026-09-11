/**
 * Importa para a base um ficheiro no formato antigo `relatorios.json`.
 *
 * Serviu a migração do ficheiro estático para a base de dados e continua a ser
 * o caminho de recuperação: um conjunto exportado, ou gerado noutra máquina,
 * entra por aqui sem ter de repetir horas de inferência.
 *
 * Uso: npm run dados:importar -- caminho/para/relatorios.json
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { IGAReport } from '../types';

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

const { rpc, SUPABASE_SERVICE_KEY, SUPABASE_URL } = await import('../services/supabaseClient');
const { COUNTRY_BY_ID } = await import('../utils/countries');

interface ConjuntoAntigo {
  model?: string;
  language?: string;
  reports?: Record<string, IGAReport>;
}

async function main(): Promise<void> {
  const caminho = process.argv[2] ?? 'public/dados/relatorios.json';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Falta a configuração da base de dados ou a chave de serviço.');
    process.exit(1);
  }

  const conjunto = JSON.parse(readFileSync(resolve(process.cwd(), caminho), 'utf8')) as ConjuntoAntigo;
  const relatorios = Object.values(conjunto.reports ?? {});

  if (relatorios.length === 0) {
    console.error(`Sem relatórios em ${caminho}.`);
    process.exit(1);
  }

  console.log(`A importar ${relatorios.length} relatórios de ${caminho}…`);

  let importados = 0;
  const falhas: string[] = [];

  for (const relatorio of relatorios) {
    try {
      await rpc<number>(
        'iga_gravar_relatorio',
        {
          p: {
            ...relatorio,
            nomePt: COUNTRY_BY_ID[relatorio.id]?.name ?? relatorio.countryName,
            model: conjunto.model ?? 'desconhecido',
          },
        },
        { privileged: true, timeoutMs: 30_000 }
      );
      importados += 1;
    } catch (err) {
      falhas.push(`${relatorio.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`Importados: ${importados}/${relatorios.length}`);
  if (falhas.length) {
    console.error(`\nFalharam ${falhas.length}:`);
    for (const falha of falhas) console.error(`  ${falha}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
