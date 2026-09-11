/**
 * Sonda de resolução de módulos.
 *
 * Igual à `ping`, mas importa um módulo de fora da pasta `api/`. Se esta
 * falhar e a `ping` passar, o problema é o empacotamento das dependências
 * partilhadas, não o runtime.
 *
 * Pode ser removida assim que a geração periódica estiver estável.
 */

// Extensão explícita: em ESM o Node não resolve especificadores sem ela, e é
// essa a hipótese que esta sonda testa. O TypeScript aceita o sufixo .js a
// apontar para a fonte .ts, e o Vite também.
import { AFRICAN_COUNTRIES } from '../utils/countries.js';

interface RespostaNode {
  statusCode: number;
  setHeader: (nome: string, valor: string) => void;
  end: (corpo: string) => void;
}

export default async function handler(request: unknown, res?: RespostaNode): Promise<Response | void> {
  const corpo = JSON.stringify({ ok: true, paises: AFRICAN_COUNTRIES.length });

  if (res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(corpo);
    return;
  }
  return new Response(corpo, { status: 200, headers: { 'Content-Type': 'application/json' } });
}
