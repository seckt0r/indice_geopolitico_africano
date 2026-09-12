/**
 * Verificação de saúde do runtime de funções.
 *
 * Não expõe nada e não toca na base. Serve o teste que corre depois de cada
 * publicação: se esta responder e a de geração não, o problema está nas
 * dependências dessa e não na plataforma.
 */

interface RespostaNode {
  statusCode: number;
  setHeader: (nome: string, valor: string) => void;
  end: (corpo: string) => void;
}

export default async function handler(_request: unknown, res?: RespostaNode): Promise<Response | void> {
  const corpo = JSON.stringify({ ok: true });

  if (res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(corpo);
    return;
  }
  return new Response(corpo, {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
