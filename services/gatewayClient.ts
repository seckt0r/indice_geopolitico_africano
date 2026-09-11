/**
 * Geração de relatórios através do AI Gateway do Vercel.
 *
 * Existe para responder a uma limitação concreta: uma função no Vercel não
 * alcança o Ollama que corre na máquina de quem desenvolve. Para que a
 * actualização periódica possa correr na nuvem, a inferência tem de vir de um
 * modelo alojado, e o gateway serve-os todos atrás de uma interface
 * compatível com a da OpenAI.
 *
 * A saída não é restringida por gramática como no Ollama: o esquema vai no
 * prompt e a resposta é extraída e validada aqui. `buildReport` em
 * `igaService.ts` continua a ser a última palavra sobre o que é um relatório
 * válido, por isso um modelo que devolva lixo falha de forma limpa.
 */

import { AiError, JsonSchema } from './ollamaClient';

const viteEnv: Record<string, string | undefined> =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const nodeEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

const readEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = viteEnv[key] ?? nodeEnv[key];
    if (value) return value.trim();
  }
  return undefined;
};

export const GATEWAY_URL: string =
  readEnv('AI_GATEWAY_URL') ?? 'https://ai-gateway.vercel.sh/v1/chat/completions';

/** Chave do AI Gateway. Sem ela, este caminho fica simplesmente indisponível. */
export const GATEWAY_KEY: string | undefined = readEnv('AI_GATEWAY_API_KEY');

/** Modelo alojado. Configurável: o gateway expõe vários fornecedores. */
export const GATEWAY_MODEL: string = readEnv('AI_GATEWAY_MODEL') ?? 'anthropic/claude-sonnet-4.5';

const GATEWAY_TIMEOUT_MS: number = Number(readEnv('AI_GATEWAY_TIMEOUT_MS')) || 120_000;

export const hasGateway = (): boolean => Boolean(GATEWAY_KEY);

/**
 * Extrai o objecto JSON de uma resposta em texto livre.
 * Modelos alojados envolvem frequentemente a resposta em cercas de código,
 * mesmo quando instruídos a não o fazer.
 */
const extrairJson = (texto: string): string => {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const inicio = limpo.indexOf('{');
  const fim = limpo.lastIndexOf('}');
  if (inicio === -1 || fim === -1 || fim < inicio) return limpo;
  return limpo.slice(inicio, fim + 1);
};

interface GatewayOptions {
  prompt: string;
  schema: JsonSchema;
  temperature?: number;
  signal?: AbortSignal;
}

export async function generateJsonViaGateway<T>({
  prompt,
  schema,
  temperature = 0.2,
  signal,
}: GatewayOptions): Promise<T> {
  if (!GATEWAY_KEY) {
    throw new AiError('offline', 'O AI Gateway não está configurado (falta AI_GATEWAY_API_KEY).');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  const instrucao =
    `${prompt}\n\n` +
    'Responde EXCLUSIVAMENTE com um objecto JSON válido que respeite este JSON Schema. ' +
    'Sem texto antes ou depois, sem cercas de código.\n' +
    `${JSON.stringify(schema)}`;

  let response: Response;
  try {
    response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GATEWAY_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GATEWAY_MODEL,
        temperature,
        max_tokens: 4096,
        messages: [{ role: 'user', content: instrucao }],
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) {
      throw new AiError('timeout', `O modelo ${GATEWAY_MODEL} não respondeu a tempo.`);
    }
    throw new AiError('offline', `Não foi possível contactar o AI Gateway: ${String(err)}`);
  }
  clearTimeout(timer);

  if (!response.ok) {
    const detalhe = await response.text().catch(() => '');
    // O gateway exige cartão registado antes de servir pedidos; dizer isso é
    // mais útil do que repetir um 4xx genérico.
    if (/credit card|customer_verification_required/i.test(detalhe)) {
      throw new AiError(
        'offline',
        'O AI Gateway exige um cartão registado na conta Vercel antes de servir pedidos.'
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new AiError('offline', `O AI Gateway recusou a chave (${response.status}).`);
    }
    throw new AiError('unknown', `AI Gateway devolveu ${response.status}: ${detalhe.slice(0, 200)}`);
  }

  const corpo = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const texto = corpo.choices?.[0]?.message?.content;
  if (!texto) throw new AiError('bad_response', 'O AI Gateway devolveu uma resposta vazia.');

  try {
    return JSON.parse(extrairJson(texto)) as T;
  } catch {
    throw new AiError(
      'bad_response',
      `O modelo não produziu JSON válido. Início da resposta: ${texto.slice(0, 120)}`
    );
  }
}
