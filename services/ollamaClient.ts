/**
 * Cliente de baixo nível para uma instância LOCAL do Ollama.
 *
 * Substitui a integração anterior com a API do Google Gemini. Como o modelo
 * corre na máquina do utilizador, deixa de existir qualquer chave de API — o
 * que elimina o problema de a chave ser embutida no bundle público.
 *
 * Configuração (ficheiro .env na raiz, prefixo VITE_ obrigatório):
 *   VITE_OLLAMA_URL        base da API      (omissão: "/ollama", proxy do Vite)
 *   VITE_OLLAMA_MODEL      modelo           (omissão: "qwen3:8b")
 *   VITE_OLLAMA_TIMEOUT_MS timeout por pedido (omissão: 900000 = 15 min)
 *   VITE_OLLAMA_NUM_CTX    janela de contexto (omissão: 8192)
 *
 * Em desenvolvimento, VITE_OLLAMA_URL aponta por omissão para "/ollama", que o
 * vite.config.ts encaminha para http://127.0.0.1:11434. Esse proxy evita
 * completamente problemas de CORS e permite servir a app em 0.0.0.0.
 */

/**
 * Configuração tolerante ao ambiente.
 *
 * No browser a configuração vem de `import.meta.env` (prefixo VITE_); no Node
 * vem de `process.env`. Isto existe porque o script que pré-calcula o índice na
 * compilação (`scripts/gerar-relatorios.ts`) reutiliza este mesmo cliente: o
 * prompt, o schema e a validação têm de existir num só sítio, sob pena de a
 * versão gerada em build divergir da gerada a pedido.
 */
const viteEnv: Record<string, string | undefined> =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const nodeEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};
const IS_NODE = typeof process !== 'undefined' && Boolean(process.versions?.node);

const readEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = viteEnv[key] ?? nodeEnv[key];
    if (value) return value;
  }
  return undefined;
};

/**
 * Base da API.
 *
 * No browser falamos com "/ollama", que o Vite encaminha. Em Node não existe
 * proxy nenhum, por isso uma base relativa — que é o valor habitual de
 * VITE_OLLAMA_URL no .env — não serve e é descartada a favor do host directo.
 */
const resolveUrl = (): string => {
  const configured = readEnv('VITE_OLLAMA_URL');
  if (!IS_NODE) return configured ?? '/ollama';
  if (configured && /^https?:\/\//i.test(configured)) return configured;
  return readEnv('OLLAMA_HOST') ?? 'http://127.0.0.1:11434';
};

export const OLLAMA_URL: string = resolveUrl();
export const OLLAMA_MODEL: string = readEnv('VITE_OLLAMA_MODEL', 'OLLAMA_MODEL') ?? 'qwen3:8b';
// 15 minutos. Medido nesta máquina: um relatório completo (~1500 tokens) demora
// 8m49s em CPU, a cerca de 2,8 tokens/s. Um timeout de 5 minutos cortaria
// praticamente todos os pedidos a meio.
export const OLLAMA_TIMEOUT_MS: number =
  Number(readEnv('VITE_OLLAMA_TIMEOUT_MS', 'OLLAMA_TIMEOUT_MS')) || 900_000;
const NUM_CTX: number = Number(readEnv('VITE_OLLAMA_NUM_CTX', 'OLLAMA_NUM_CTX')) || 8192;

/** Tipos de falha distinguíveis, para a UI poder dar uma mensagem útil. */
export type AiErrorKind =
  | 'offline' // Ollama não está a responder
  | 'model_missing' // o modelo não está descarregado
  | 'timeout' // excedeu VITE_OLLAMA_TIMEOUT_MS
  | 'bad_response' // respondeu, mas não em JSON utilizável
  | 'unknown';

export class AiError extends Error {
  kind: AiErrorKind;
  constructor(kind: AiErrorKind, message: string) {
    super(message);
    this.name = 'AiError';
    this.kind = kind;
  }
}

/** Subconjunto de JSON Schema aceite pelo campo `format` do Ollama. */
export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
  description?: string;
}

interface GenerateOptions {
  prompt: string;
  schema: JsonSchema;
  /** Baixa por omissão: pontuações reprodutíveis entre execuções. */
  temperature?: number;
  signal?: AbortSignal;
  /** Chamado à medida que o texto chega, com o número de caracteres acumulados. */
  onProgress?: (charsReceived: number) => void;
}

/**
 * Gera JSON validado contra `schema` usando o Ollama.
 *
 * Notas sobre o qwen3 (aprendidas a medir contra a instância local):
 *  - É um modelo "thinking". Enviamos `think: false` para suprimir o bloco
 *    <think>, que de outro modo consome centenas de tokens antes do JSON.
 *  - Em CPU o débito ronda 3-5 tokens/s, pelo que um relatório completo demora
 *    minutos. Daí o timeout generoso e o cache em igaService.
 *  - Campos numéricos DEVEM ser declarados como "integer" no schema. Com
 *    "number", a geração com gramática produz ocasionalmente literais como
 *    4.25e-2000000000000000, que o JSON.parse converte silenciosamente para 0.
 */
/**
 * Lê a resposta NDJSON do Ollama e devolve o texto concatenado.
 * Cada linha é um objecto JSON com um fragmento em `response`; a última traz
 * `done: true`. Um `error` no meio do fluxo também é reportado aqui.
 */
async function readStream(response: Response, onProgress?: (chars: number) => void): Promise<string> {
  const body = response.body;
  if (!body) throw new AiError('bad_response', 'O Ollama devolveu uma resposta sem corpo.');

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';

  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let chunk: { response?: string; error?: string };
    try {
      chunk = JSON.parse(trimmed);
    } catch {
      return; // linha parcial ou ruído: ignora
    }
    if (chunk.error) throw new AiError('unknown', `Ollama: ${chunk.error}`);
    if (chunk.response) {
      text += chunk.response;
      onProgress?.(text.length);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) consumeLine(line);
  }
  consumeLine(buffer);

  return text;
}

export async function generateJson<T>({
  prompt,
  schema,
  temperature = 0.2,
  signal,
  onProgress,
}: GenerateOptions): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  // Propaga um cancelamento externo (ex.: componente desmontado) para o nosso.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        // Streaming não é por estética: uma geração demora minutos e, sem
        // streaming, nada chega até ao fim. Qualquer intermediário com timeout
        // de inactividade corta a ligação — o undici do Node fá-lo aos 300s,
        // exactamente a meio de um relatório típico. Com stream, os headers
        // chegam de imediato e o corpo flui em NDJSON.
        stream: true,
        think: false,
        format: schema,
        options: { temperature, num_ctx: NUM_CTX },
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) {
      throw new AiError(
        'timeout',
        `O modelo ${OLLAMA_MODEL} não respondeu em ${Math.round(OLLAMA_TIMEOUT_MS / 1000)}s.`
      );
    }
    // Uma geração longa pode esbarrar num timeout da própria camada de rede
    // (o undici do Node corta os headers aos 300s, por exemplo). Chamar a isso
    // "Ollama offline" mandaria o utilizador diagnosticar o problema errado.
    // O undici embrulha a causa real: `TypeError: fetch failed` com
    // `cause: HeadersTimeoutError (UND_ERR_HEADERS_TIMEOUT)`. Sem olhar para a
    // causa, um timeout era reportado como "Ollama offline" e mandava o
    // utilizador diagnosticar o problema errado.
    const cause = err instanceof Error ? (err.cause as Error | undefined) : undefined;
    const name = err instanceof Error ? err.name : '';
    const detail = [
      err instanceof Error ? err.message : String(err),
      cause?.name,
      cause?.message,
      (cause as { code?: string } | undefined)?.code,
    ]
      .filter(Boolean)
      .join(' ');
    if (/timeout|timed out|UND_ERR_HEADERS_TIMEOUT|UND_ERR_BODY_TIMEOUT/i.test(name + ' ' + detail)) {
      throw new AiError('timeout', `A ligação ao Ollama expirou durante a geração. (${detail})`);
    }
    throw new AiError(
      'offline',
      `Não foi possível contactar o Ollama em ${OLLAMA_URL}. Está a correr? (ollama serve)`
    );
  }
  clearTimeout(timer);

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    if (response.status === 404 || /not found|pull the model/i.test(detail)) {
      throw new AiError(
        'model_missing',
        `O modelo "${OLLAMA_MODEL}" não está disponível. Corre: ollama pull ${OLLAMA_MODEL}`
      );
    }
    throw new AiError('unknown', `Ollama devolveu ${response.status}: ${detail.slice(0, 200)}`);
  }

  const text = (await readStream(response, onProgress)).trim();
  if (!text) throw new AiError('bad_response', 'O Ollama devolveu uma resposta vazia.');

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiError(
      'bad_response',
      `O modelo não produziu JSON válido. Início da resposta: ${text.slice(0, 120)}`
    );
  }
}

/** Verifica se o Ollama está acessível e se o modelo configurado existe. */
export async function checkOllamaHealth(): Promise<
  { ok: true } | { ok: false; kind: AiErrorKind; message: string }
> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, kind: 'offline', message: `Ollama devolveu ${res.status}.` };
    }
    const data: { models?: { name: string }[] } = await res.json();
    const names = (data.models ?? []).map((m) => m.name);
    if (names.length && !names.includes(OLLAMA_MODEL)) {
      return {
        ok: false,
        kind: 'model_missing',
        message: `O modelo "${OLLAMA_MODEL}" não está instalado. Corre: ollama pull ${OLLAMA_MODEL}`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      kind: 'offline',
      message: `Ollama inacessível em ${OLLAMA_URL}. Corre: ollama serve`,
    };
  }
}
