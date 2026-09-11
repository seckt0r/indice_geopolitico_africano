/**
 * Pré-calcula o Índice Geopolítico Africano para os 54 Estados.
 *
 * Corre fora do browser, na compilação ou a partir de um cron, e escreve
 * `public/dados/relatorios.json`. É esse ficheiro que a aplicação carrega ao
 * arrancar, o que faz com que o mapa apareça já colorido e o painel mostre um
 * país sem esperar minutos pelo modelo.
 *
 * Reutiliza `services/igaService.ts`: o prompt, o schema, a validação e o
 * cálculo são exactamente os mesmos da geração a pedido. Duplicá-los
 * garantiria que as duas versões divergiriam.
 *
 * CUSTO REAL: medido nesta máquina, cerca de 9 minutos por país em CPU. Uma
 * passagem completa aos 54 Estados demora perto de 8 horas. Por isso o script
 * é incremental e reentrante:
 *   - salta relatórios ainda dentro da validade (por omissão 24 horas);
 *   - grava o ficheiro depois de cada país, para que uma interrupção não perca
 *     o trabalho já feito;
 *   - continua para o país seguinte quando um falha, e resume as falhas no fim.
 *
 * Uso:
 *   npm run dados:gerar                     # incremental, só o que expirou
 *   npm run dados:gerar -- --force          # regenera tudo
 *   npm run dados:gerar -- --only=AO,GH     # apenas estes países
 *   npm run dados:gerar -- --limit=5        # no máximo 5 países nesta execução
 *   npm run dados:gerar -- --max-age=12     # validade de 12 horas
 *   npm run dados:gerar -- --lang=en        # outro idioma (outro ficheiro)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { IGAReport, Language, ReportDataset } from '../types';
import { AFRICAN_COUNTRIES, type CountryEntry } from '../utils/countries';

/**
 * Carrega o `.env` da raiz para `process.env`.
 *
 * Em Node não há Vite a fazê-lo, e a configuração do Ollama é lida no topo dos
 * módulos de serviço. Por isso isto corre ANTES dos imports dinâmicos abaixo:
 * um import estático seria içado e leria a configuração antes de ela existir.
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

const LANGUAGES: Language[] = ['pt', 'en', 'fr', 'zh', 'ru', 'es', 'de', 'it'];

interface Options {
  force: boolean;
  only: string[] | null;
  limit: number | null;
  maxAgeMs: number;
  language: Language;
  outFile: string;
}

const parseArgs = (argv: string[]): Options => {
  const get = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    const hit = argv.find((a) => a.startsWith(prefix));
    return hit?.slice(prefix.length);
  };

  const language = (get('lang') ?? 'pt') as Language;
  if (!LANGUAGES.includes(language)) {
    throw new Error(`Idioma desconhecido: ${language}. Use um de: ${LANGUAGES.join(', ')}`);
  }

  const maxAgeHours = Number(get('max-age') ?? 24);
  const limit = get('limit') ? Number(get('limit')) : null;

  // O idioma por omissão fica em relatorios.json; os outros ganham sufixo, para
  // que um conjunto não sobreponha o outro.
  const fileName = language === 'pt' ? 'relatorios.json' : `relatorios.${language}.json`;

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
    outFile: resolve(process.cwd(), 'public', 'dados', fileName),
  };
};

/** Lê o conjunto existente; um ficheiro ausente ou corrompido começa do zero. */
const readExisting = async (path: string, language: Language): Promise<ReportDataset> => {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as ReportDataset;
    if (parsed && typeof parsed === 'object' && parsed.reports) return parsed;
  } catch {
    /* primeiro arranque, ou ficheiro inutilizável: recomeça */
  }
  return { generatedAt: 0, model: OLLAMA_MODEL, language, reports: {} };
};

const writeDataset = async (path: string, dataset: ReportDataset): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
};

const formatDuration = (ms: number): string => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}m${String(total % 60).padStart(2, '0')}s`;
};

const isFresh = (report: IGAReport | undefined, maxAgeMs: number): boolean =>
  Boolean(report && Date.now() - report.generatedAt < maxAgeMs);

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const dataset = await readExisting(options.outFile, options.language);

  let queue: CountryEntry[] = AFRICAN_COUNTRIES;
  if (options.only) queue = queue.filter((c) => options.only!.includes(c.id));
  if (!options.force) queue = queue.filter((c) => !isFresh(dataset.reports[c.id], options.maxAgeMs));
  if (options.limit) queue = queue.slice(0, options.limit);

  console.log(`IGA · geração de dados`);
  console.log(`  Ollama:  ${OLLAMA_URL} · modelo ${OLLAMA_MODEL}`);
  console.log(`  Idioma:  ${options.language}`);
  console.log(`  Destino: ${options.outFile}`);
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
      dataset.reports[country.id] = report;
      dataset.generatedAt = Date.now();
      dataset.model = OLLAMA_MODEL;
      // Grava a cada país: uma interrupção não desperdiça as horas já gastas.
      await writeDataset(options.outFile, dataset);
      console.log(
        `IGA ${report.igaScore.toFixed(1)} (${report.stabilityKey}) · ${formatDuration(Date.now() - countryStart)}`
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: country.id, reason });
      console.log(`FALHOU · ${reason}`);
    }
  }

  const done = Object.keys(dataset.reports).length;
  console.log(`\nConcluído em ${formatDuration(Date.now() - startedAt)}.`);
  console.log(`Relatórios no conjunto: ${done}/${AFRICAN_COUNTRIES.length}`);

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
