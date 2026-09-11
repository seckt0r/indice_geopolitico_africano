/**
 * Cliente mínimo do PostgREST do Supabase.
 *
 * Não usa `@supabase/supabase-js` de propósito: a aplicação só precisa de
 * chamar duas funções de leitura, e o script de geração uma de escrita. Um
 * `fetch` tipado faz isso sem acrescentar uma dependência de runtime ao pacote
 * que o visitante descarrega.
 *
 * CHAVES. A chave publicável viaja no pacote JavaScript e é, por construção,
 * conhecida de todos: o que a torna segura é a segurança ao nível da linha na
 * base de dados, que só permite leitura. A chave de serviço contorna essa
 * segurança e por isso NUNCA pode ter prefixo VITE_ — seria embutida no pacote
 * pelo Vite e publicada com o site. Ver db/002_escrita.sql e SECURITY.md.
 */

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

/**
 * A integração do Supabase com o Vercel injecta as variáveis com prefixo do
 * projecto (`iga_`), e o `.env` local reproduz esses nomes. Aceitar as várias
 * grafias evita ter de duplicar variáveis só para as renomear.
 */
export const SUPABASE_URL: string | undefined = readEnv(
  'VITE_SUPABASE_URL',
  'iga_IGA_SUPABASE_URL',
  'iga_SUPABASE_URL',
  'SUPABASE_URL'
);

/** Chave pública de leitura. Segura por desenho: a RLS é que decide o acesso. */
export const SUPABASE_PUBLIC_KEY: string | undefined = readEnv(
  'VITE_SUPABASE_ANON_KEY',
  'iga_IGA_SUPABASE_PUBLISHABLE_KEY',
  'iga_SUPABASE_PUBLISHABLE_KEY',
  'iga_IGA_SUPABASE_ANON_KEY',
  'iga_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY'
);

/**
 * Chave de serviço. Só existe em Node; no browser é sempre `undefined`, porque
 * nenhum dos nomes tem prefixo VITE_ e o Vite não a expõe.
 */
export const SUPABASE_SERVICE_KEY: string | undefined = readEnv(
  'iga_SUPABASE_SECRET_KEY',
  'iga_SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY'
);

export const hasSupabaseConfig = (): boolean => Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);

export class DatabaseError extends Error {
  readonly status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'DatabaseError';
    this.status = status;
  }
}

interface RpcOptions {
  /** Usar a chave de serviço em vez da pública. Só válido em Node. */
  privileged?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Invoca uma função Postgres exposta pelo PostgREST.
 * `args` é o objecto de parâmetros nomeados da função.
 */
export async function rpc<T>(
  fn: string,
  args: Record<string, unknown>,
  { privileged = false, signal, timeoutMs = 15_000 }: RpcOptions = {}
): Promise<T> {
  if (!SUPABASE_URL) throw new DatabaseError('A base de dados não está configurada (URL em falta).');

  const key = privileged ? SUPABASE_SERVICE_KEY : SUPABASE_PUBLIC_KEY;
  if (!key) {
    throw new DatabaseError(
      privileged
        ? 'Falta a chave de serviço do Supabase. Sem ela não é possível escrever.'
        : 'Falta a chave pública do Supabase.'
    );
  }

  // Um pedido pendurado é indistinguível de uma base indisponível; o limite de
  // tempo transforma-o num erro que a interface sabe mostrar.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detalhe = await response.text().catch(() => '');
      throw new DatabaseError(
        `A base de dados devolveu ${response.status} em ${fn}. ${detalhe.slice(0, 200)}`,
        response.status
      );
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof DatabaseError) throw err;
    if (controller.signal.aborted) throw new DatabaseError(`Tempo esgotado ao contactar a base em ${fn}.`);
    throw new DatabaseError(err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timer);
  }
}
