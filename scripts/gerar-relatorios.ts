/**
 * Gera o Índice Geopolítico Africano para os 54 Estados e grava-o na base.
 *
 * Corre fora do browser, a partir de um cron ou do CI, e escreve na base de
 * dados através de `iga_gravar_relatorio`. Cada execução ACRESCENTA uma linha
 * por país em vez de substituir a anterior: é esse histórico que sustenta o
 * gráfico de evolução das classificações.
 *
 * Reutiliza `services/igaService.ts`: o prompt, o schema, a validação e o
 * cálculo são exactamente os mesmos da geração a pedido. Duplicá-los garantiria
 * que as duas versões divergiriam.
 *
 * O script é incremental e reentrante:
 *   - salta países cujo relatório mais recente ainda está dentro da validade
 *     (por omissão 24 horas);
 *   - grava cada país mal o gera, para que uma interrupção não perca trabalho;
 *   - continua para o país seguinte quando um falha, e resume as falhas no fim.
 *
 * Uso:
 *   npm run dados:gerar                     # incremental, só o que expirou
 *   npm run dados:gerar -- --force          # regenera tudo
 *   npm run dados:gerar -- --only=AO,GH     # apenas estes países
 *   npm run dados:gerar -- --limit=5        # no máximo 5 países nesta execução
 *   npm run dados:gerar -- --max-age=12     # validade de 12 horas
 *   npm run dados:gerar -- --lang=en        # gera noutro idioma
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { IGAReport, Language } from '../types';
import { AFRICAN_COUNTRIES, type CountryEntry } from '../utils/countries';

/**
 * Carrega o `.env` da raiz para `process.env`.
 *
 * Em Node não há Vite a fazê-lo, e a configuração do Ollama e da base é lida no
 * topo dos módulos de serviço. Por isso isto corre ANTES dos imports dinâmicos
 * abaixo: um import estático seria içado e leria a configuração antes de ela
 * existir.
 */
const loadDotEnv = (): void => {
  let contents: string;
  try {
    contents = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  } catch {
    return; // sem .env: valem as omissões e o ambiente do processo
  }
  for (const line of contents.split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match || line.trim().startsWith('#')) continue;
    const [, key, rawValue] = match;
    // Uma variável já definida no ambiente ganha ao ficheiro, para que um cron
    // possa sobrepor o modelo sem editar o .env.
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
  }
};

loadDotEnv();

const { fetchCountryAnalysis } = await import('../services/igaService');
const { OLLAMA_MODEL, OLLAMA_URL } = await import('../services/ollamaClient');
const { rpc, SUPABASE_SERVICE_KEY, SUPABASE_URL } = await import('../services/supabaseClient');

const LANGUAGES: Language[] = ['pt', 'en', 'fr', 'zh', 'ru', 'es', 'de', 'it'];

interface Options {
  force: boolean;
  only: string[] | null;
  limit: number | null;
  maxAgeMs: number;
  language: Language;
}

const parseArgs = (argv: string[]): Options => {
  const get = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    return argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
  };

  const language = (get('lang') ?? 'pt') as Language;
  if (!LANGUAGES.includes(language)) {
    throw new Error(`Idioma desconhecido: ${language}. Use um de: ${LANGUAGES.join(', ')}`);
  }

  const maxAgeHours = Number(get('max-age') ?? 24);
  const limit = get('limit') ? Number(get('limit')) : null;

  return {
    force: argv.includes('--force'),
    only:
      get('only')
        ?.split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean) ?? null,
    limit: limit && Number.isFinite(limit) ? limit : null,
    maxAgeMs: (Number.isFinite(maxAgeHours) ? maxAgeHours : 24) * 60 * 60 * 1000,
    language,
  };
};

/** Momento da geração mais recente de cada país, para decidir o que regenerar. */
const lerFrescura = async (language: Language): Promise<Record<string, number>> => {
  const linhas = await rpc<Array<{ id?: string; generatedAt?: number }>>('iga_relatorios_actuais', {
    p_idioma: language,
  });
  const mapa: Record<string, number> = {};
  for (const linha of linhas ?? []) {
    if (typeof linha.id === 'string' && Number.isFinite(Number(linha.generatedAt))) {
      mapa[linha.id.toUpperCase()] = Number(linha.generatedAt);
    }
  }
  return mapa;
};

/** Grava um relatório e os seus pilares numa só transacção. */
const gravar = async (report: IGAReport, nomePt: string): Promise<void> => {
  await rpc<number>(
    'iga_gravar_relatorio',
    { p: { ...report, nomePt, model: OLLAMA_MODEL } },
    { privileged: true, timeoutMs: 30_000 }
  );
};

const formatDuration = (ms: number): string => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}m${String(total % 60).padStart(2, '0')}s`;
};

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(
      'Falta configuração da base de dados. São precisos o URL do Supabase e a chave de ' +
        'serviço (iga_SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY).'
    );
    process.exit(1);
  }

  const frescura = await lerFrescura(options.language);

  let queue: CountryEntry[] = AFRICAN_COUNTRIES;
  if (options.only) queue = queue.filter((c) => options.only!.includes(c.id));
  if (!options.force) {
    queue = queue.filter((c) => {
      const ultimo = frescura[c.id];
      return !ultimo || Date.now() - ultimo >= options.maxAgeMs;
    });
  }
  if (options.limit) queue = queue.slice(0, options.limit);

  console.log('IGA · geração de dados');
  console.log(`  Ollama:  ${OLLAMA_URL} · modelo ${OLLAMA_MODEL}`);
  console.log(`  Base:    ${SUPABASE_URL.replace(/\/\/([a-z0-9]{4})[a-z0-9]*/i, '//$1…')}`);
  console.log(`  Idioma:  ${options.language}`);
  console.log(`  Em fila: ${queue.length} de ${AFRICAN_COUNTRIES.length} países`);

  if (queue.length === 0) {
    console.log('Nada a fazer: todos os relatórios estão dentro da validade.');
    return;
  }

  const failures: Array<{ id: string; reason: string }> = [];
  const startedAt = Date.now();

  for (const [index, country] of queue.entries()) {
    const position = `[${index + 1}/${queue.length}]`;
    const countryStart = Date.now();
    process.stdout.write(`${position} ${country.id} ${country.name}… `);

    try {
      const report = await fetchCountryAnalysis(country, options.language);
      await gravar(report, country.name);
      console.log(
        `IGA ${report.igaScore.toFixed(1)} (${report.stabilityKey}) · ${formatDuration(Date.now() - countryStart)}`
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: country.id, reason });
      console.log(`FALHOU · ${reason}`);
    }
  }

  const total = Object.keys(await lerFrescura(options.language)).length;
  console.log(`\nConcluído em ${formatDuration(Date.now() - startedAt)}.`);
  console.log(`Países com relatório na base: ${total}/${AFRICAN_COUNTRIES.length}`);

  if (failures.length) {
    console.log(`\nFalharam ${failures.length}:`);
    for (const failure of failures) console.log(`  ${failure.id}: ${failure.reason}`);
    // Sai com erro para que um cron ou um pipeline de CI sinalize o problema,
    // mas só depois de gravar tudo o que correu bem.
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
