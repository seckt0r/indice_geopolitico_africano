/**
 * Valida o conjunto de relatórios antes de o publicar.
 *
 * Um ficheiro truncado ou com pontuações fora do intervalo passaria despercebido
 * até chegar ao browser, onde se traduz em países sem cor e num painel vazio.
 * Este script falha cedo, no cron ou no CI.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const PILLARS = ['economic', 'political', 'security', 'international', 'historical'];
const TIERS = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'];
const EXPECTED = 54;

const path = resolve(process.cwd(), 'public', 'dados', process.argv[2] ?? 'relatorios.json');

let dataset;
try {
  dataset = JSON.parse(await readFile(path, 'utf8'));
} catch (err) {
  console.error(`Não foi possível ler ${path}: ${err.message}`);
  process.exit(1);
}

const problems = [];
const reports = Object.entries(dataset.reports ?? {});

if (reports.length === 0) problems.push('O conjunto não tem relatórios.');

for (const [id, report] of reports) {
  if (report.id !== id) problems.push(`${id}: o campo id é "${report.id}".`);
  if (!TIERS.includes(report.stabilityKey))
    problems.push(`${id}: escalão inválido "${report.stabilityKey}".`);
  if (!(report.igaScore >= 0 && report.igaScore <= 100)) problems.push(`${id}: igaScore fora de 0-100.`);

  for (const pillar of PILLARS) {
    const score = report.dimensions?.[pillar]?.score;
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      problems.push(`${id}: pontuação inválida no pilar ${pillar} (${score}).`);
    }
  }

  // A média dos quatro pilares activos é autoridade do cliente; se o ficheiro
  // não a respeitar, foi adulterado ou gerado por uma versão divergente.
  const active = ['economic', 'political', 'security', 'international'];
  const expected = active.reduce((sum, k) => sum + (report.dimensions?.[k]?.score ?? 0), 0) / active.length;
  if (Math.abs(expected - report.igaScore) > 0.01) {
    problems.push(`${id}: igaScore ${report.igaScore} não corresponde à média ${expected.toFixed(2)}.`);
  }

  if (!report.longAnalysis?.trim()) problems.push(`${id}: síntese vazia.`);
}

console.log(`Conjunto: ${path}`);
console.log(`Relatórios: ${reports.length}/${EXPECTED}`);
console.log(`Gerado em: ${dataset.generatedAt ? new Date(dataset.generatedAt).toISOString() : '—'}`);

if (reports.length < EXPECTED) {
  console.warn(`Aviso: faltam ${EXPECTED - reports.length} países.`);
}

if (problems.length) {
  console.error(`\n${problems.length} problemas:`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log('Sem problemas.');
