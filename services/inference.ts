/**
 * Escolha do motor de inferência.
 *
 * Dois caminhos, a mesma interface:
 *   - Ollama local, gratuito, usado em desenvolvimento e pelo cron da máquina
 *     que tem o modelo descarregado;
 *   - AI Gateway do Vercel, com modelos alojados, que é o único que uma função
 *     na nuvem consegue alcançar — nenhuma função do Vercel chega ao localhost
 *     de quem desenvolve.
 *
 * A selecção é explícita por `IGA_PROVIDER`, e automática quando não o for:
 * havendo chave do gateway e não havendo Ollama configurado, usa-se o gateway.
 */

import { AiError, generateJson as generateViaOllama, JsonSchema } from './ollamaClient';
import { generateJsonViaGateway, GATEWAY_MODEL, hasGateway } from './gatewayClient';

const nodeEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

export type Provider = 'ollama' | 'gateway';

export const activeProvider = (): Provider => {
  const escolhido = nodeEnv.IGA_PROVIDER?.trim().toLowerCase();
  if (escolhido === 'ollama' || escolhido === 'gateway') return escolhido;
  return hasGateway() ? 'gateway' : 'ollama';
};

/** Nome do modelo em uso, para registo de proveniência no relatório. */
export const activeModel = async (): Promise<string> => {
  if (activeProvider() === 'gateway') return GATEWAY_MODEL;
  const { OLLAMA_MODEL } = await import('./ollamaClient');
  return OLLAMA_MODEL;
};

interface GenerateOptions {
  prompt: string;
  schema: JsonSchema;
  temperature?: number;
  signal?: AbortSignal;
  onProgress?: (charsReceived: number) => void;
}

export async function generateJson<T>(options: GenerateOptions): Promise<T> {
  if (activeProvider() === 'gateway') {
    // O gateway não transmite em fluxo contínuo neste cliente, por isso não há
    // progresso parcial para reportar. Quem chama trata `onProgress` como
    // opcional, e a geração alojada é rápida o suficiente para não precisar.
    return generateJsonViaGateway<T>(options);
  }
  return generateViaOllama<T>(options);
}

export { AiError };
export type { JsonSchema };
