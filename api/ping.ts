/**
 * Sonda mínima do runtime de funções.
 *
 * Sem imports e sem lógica: existe apenas para separar "o runtime não consegue
 * invocar a função" de "uma das dependências não é incluída no pacote". A
 * função de geração falhava antes de o corpo correr, o que nenhum try/catch
 * apanha, e sem esta separação o diagnóstico seria adivinhação.
 *
 * Pode ser removida assim que a geração periódica estiver estável.
 */

interface RespostaNode {
  statusCode: number;
  setHeader: (nome: string, valor: string) => void;
  end: (corpo: string) => void;
}

export default async function handler(request: unknown, res?: RespostaNode): Promise<Response | void> {
  const corpo = JSON.stringify({
    ok: true,
    // Diz qual das duas assinaturas o runtime usou.
    assinatura: res ? 'node' : 'web',
    temImportMeta: typeof (import.meta as unknown as { url?: string })?.url === 'string',
    node: typeof process !== 'undefined' ? process.version : 'desconhecido',
  });

  if (res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(corpo);
    return;
  }
  return new Response(corpo, { status: 200, headers: { 'Content-Type': 'application/json' } });
}
