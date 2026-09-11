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

/**
 * Duração máxima da função, em segundos.
 *
 * O limite da plataforma é declarado em `vercel.json`, na chave `functions`, e
 * não aqui: o Vercel analisa estaticamente um `export const config` e rejeita
 * qualquer expressão — um `Number(...) || 60` faz a publicação falhar com
 * "Unhandled type: LogicalExpression". Este valor é só o orçamento que o ciclo
 * respeita, e tem de acompanhar o que está no vercel.json.
 */
const DURACAO_MAXIMA_S = Number(process.env.IGA_CRON_MAX_DURATION) || 60;

/** Margem para fechar a resposta antes de a função ser terminada à força. */
const MARGEM_MS = 8_000;

/**
 * Adaptador de assinatura.
 *
 * O runtime Node do Vercel invoca a função ora com a assinatura web
 * (`Request` → `Response`), ora com a assinatura clássica do Node
 * (`req`, `res`), conforme a configuração do projecto. Assumir uma delas dava
 * `FUNCTION_INVOCATION_FAILED` logo à entrada, quando `request.headers.get`
 * não existia. Detectar qual é custa vinte linhas e elimina a adivinhação.
 */
interface RespostaNode {
  statusCode: number;
  setHeader: (nome: string, valor: string) => void;
  end: (corpo: string) => void;
}

interface PedidoNode {
  headers: Record<string, string | string[] | undefined>;
  url?: string;
}

const ehPedidoWeb = (valor: unknown): valor is Request =>
  typeof (valor as Request | undefined)?.headers?.get === 'function';

const lerCabecalho = (pedido: Request | PedidoNode, nome: string): string => {
  if (ehPedidoWeb(pedido)) return pedido.headers.get(nome) ?? '';
  const valor = pedido.headers[nome] ?? pedido.headers[nome.toLowerCase()];
  return Array.isArray(valor) ? (valor[0] ?? '') : (valor ?? '');
};

const lerUrl = (pedido: Request | PedidoNode): URL => {
  const bruto = ehPedidoWeb(pedido) ? pedido.url : (pedido.url ?? '/');
  // A base só serve para o URL ser analisável; nenhum campo dela é usado.
  return new URL(bruto, 'http://localhost');
};

const responder = (corpo: unknown, estado: number, res?: RespostaNode): Response | void => {
  const texto = JSON.stringify(corpo, null, 2);
  if (res) {
    res.statusCode = estado;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(texto);
    return;
  }
  return new Response(texto, {
    status: estado,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};

export default async function handler(
  request: Request | PedidoNode,
  res?: RespostaNode
): Promise<Response | void> {
  const inicio = Date.now();

  /**
   * O Vercel Cron envia `Authorization: Bearer $CRON_SECRET` quando essa
   * variável existe no projecto. Sem o segredo definido, o endpoint ficaria
   * aberto a qualquer pessoa e a geração custa dinheiro em tokens.
   */
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return responder({ erro: 'CRON_SECRET não está definido no projecto. Endpoint desactivado.' }, 401, res);
  }
  if (lerCabecalho(request, 'authorization') !== `Bearer ${segredo}`) {
    return responder({ erro: 'Pedido não autorizado.' }, 401, res);
  }

  try {
    return await executar(request, res, inicio);
  } catch (err) {
    // Um erro não tratado sai da plataforma como FUNCTION_INVOCATION_FAILED,
    // sem nada que se leia. Devolver a causa poupa uma ida aos registos.
    return responder(
      {
        erro: 'A geração falhou.',
        causa: err instanceof Error ? err.message : String(err),
        duracaoMs: Date.now() - inicio,
      },
      500,
      res
    );
  }
}

async function executar(
  request: Request | PedidoNode,
  res: RespostaNode | undefined,
  inicio: number
): Promise<Response | void> {
  // Importados aqui e não no topo: assim um pedido não autorizado não paga o
  // custo de carregar os clientes nem de ler configuração.
  const { rpc, SUPABASE_SERVICE_KEY, SUPABASE_URL } = await import('../../services/supabaseClient');
  const { fetchCountryAnalysis } = await import('../../services/igaService');
  const { activeModel, activeProvider } = await import('../../services/inference');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return responder({ erro: 'Falta a configuração da base de dados ou a chave de serviço.' }, 500, res);
  }

  const url = lerUrl(request);
  const idioma = (url.searchParams.get('lang') ?? 'pt') as Language;
  const validadeMs = (Number(url.searchParams.get('max-age')) || 24) * 60 * 60 * 1000;
  const orcamentoMs = DURACAO_MAXIMA_S * 1000 - MARGEM_MS;

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
  return responder(resumo, 200, res);
}
