/**
 * Actualização periódica do índice, executada pelo Vercel.
 *
 * Invocada pelo Vercel Cron (ver a chave `crons` em vercel.json). Percorre os
 * países cujo relatório mais recente já passou da validade, gera-os e grava-os
 * na base. A próxima execução continua onde esta parou, porque o critério é a
 * frescura do relatório e não uma posição guardada.
 *
 * LIMITE QUE MOLDA O DESENHO. Uma função tem tempo máximo de execução, e uma
 * passagem aos 54 países não cabe lá. Por isso o ciclo respeita um orçamento
 * de tempo e devolve o que conseguiu fazer, em vez de ser interrompido a meio
 * de uma escrita. Quantos países cabem depende do plano e do modelo:
 *   60 s  (limite típico do plano gratuito) → 2 a 4 países por execução;
 *   800 s (plano Pro)                        → a maioria do continente.
 *
 * INFERÊNCIA. Uma função na nuvem não alcança o Ollama da máquina de quem
 * desenvolve. Aqui a inferência vem do AI Gateway do Vercel, seleccionado
 * automaticamente por `services/inference.ts` quando existe AI_GATEWAY_API_KEY.
 */

import { AFRICAN_COUNTRIES } from '../../utils/countries';
import type { Language } from '../../types';

export const config = {
  // Ajustável conforme o plano. No plano gratuito, valores acima do limite
  // fazem a publicação falhar.
  maxDuration: Number(process.env.IGA_CRON_MAX_DURATION) || 60,
};

/** Margem para fechar a resposta antes de a função ser terminada à força. */
const MARGEM_MS = 8_000;

const naoAutorizado = (motivo: string): Response =>
  new Response(JSON.stringify({ erro: motivo }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });

export default async function handler(request: Request): Promise<Response> {
  const inicio = Date.now();

  /**
   * O Vercel Cron envia `Authorization: Bearer $CRON_SECRET` quando essa
   * variável existe no projecto. Sem o segredo definido, o endpoint ficaria
   * aberto a qualquer pessoa e a geração custa dinheiro em tokens.
   */
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return naoAutorizado('CRON_SECRET não está definido no projecto. Endpoint desactivado.');
  }
  if (request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return naoAutorizado('Pedido não autorizado.');
  }

  // Importados aqui e não no topo: assim um pedido não autorizado não paga o
  // custo de carregar os clientes nem de ler configuração.
  const { rpc, SUPABASE_SERVICE_KEY, SUPABASE_URL } = await import('../../services/supabaseClient');
  const { fetchCountryAnalysis } = await import('../../services/igaService');
  const { activeModel, activeProvider } = await import('../../services/inference');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response(
      JSON.stringify({ erro: 'Falta a configuração da base de dados ou a chave de serviço.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const idioma = (url.searchParams.get('lang') ?? 'pt') as Language;
  const validadeMs = (Number(url.searchParams.get('max-age')) || 24) * 60 * 60 * 1000;
  const orcamentoMs = config.maxDuration * 1000 - MARGEM_MS;

  // Relatório mais recente de cada país, para saber o que já não precisa.
  const actuais = await rpc<Array<{ id?: string; generatedAt?: number }>>('iga_relatorios_actuais', {
    p_idioma: idioma,
  });
  const frescura: Record<string, number> = {};
  for (const linha of actuais ?? []) {
    if (linha.id) frescura[linha.id.toUpperCase()] = Number(linha.generatedAt) || 0;
  }

  const fila = AFRICAN_COUNTRIES.filter((pais) => {
    const ultimo = frescura[pais.id];
    return !ultimo || Date.now() - ultimo >= validadeMs;
  });

  const modelo = await activeModel();
  const gerados: string[] = [];
  const falhas: Array<{ id: string; motivo: string }> = [];
  let interrompidoPorTempo = false;

  for (const pais of fila) {
    // Parar antes de começar mais um é a única forma de garantir que nenhuma
    // geração fica a meio: o tempo gasto não é recuperável nem retomável.
    if (Date.now() - inicio > orcamentoMs) {
      interrompidoPorTempo = true;
      break;
    }

    try {
      const relatorio = await fetchCountryAnalysis(pais, idioma);
      await rpc<number>(
        'iga_gravar_relatorio',
        { p: { ...relatorio, nomePt: pais.name, model: modelo } },
        { privileged: true, timeoutMs: 30_000 }
      );
      gerados.push(pais.id);
    } catch (err) {
      falhas.push({ id: pais.id, motivo: err instanceof Error ? err.message : String(err) });
    }
  }

  const resumo = {
    idioma,
    fornecedor: activeProvider(),
    modelo,
    emFila: fila.length,
    gerados,
    falhas,
    restantes: fila.length - gerados.length - falhas.length,
    interrompidoPorTempo,
    duracaoMs: Date.now() - inicio,
  };

  // Falhas não devolvem 500: a execução fez o que pôde e a próxima continua.
  // Um 500 só assinalaria ruído no painel do Vercel.
  return new Response(JSON.stringify(resumo, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
