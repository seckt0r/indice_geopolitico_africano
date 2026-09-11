import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // `loadEnv` só lê ficheiros .env. Em CI e no Vercel a configuração chega por
  // `process.env`, por isso as duas fontes são fundidas — com o ficheiro a
  // ganhar, para que um .env local possa sobrepor o ambiente durante testes.
  const env = { ...process.env, ...loadEnv(mode, '.', '') } as Record<string, string | undefined>;

  const primeiro = (...chaves: string[]): string =>
    chaves
      .map((chave) => env[chave])
      .find((valor) => valor && valor.trim())
      ?.trim() ?? '';

  // Alvo do proxy de desenvolvimento. A app fala com "/ollama" e o Vite
  // encaminha para a instância local. Isto evita CORS por completo.
  const ollamaTarget = env.OLLAMA_HOST || 'http://127.0.0.1:11434';

  /**
   * Configuração pública do Supabase, resolvida na compilação.
   *
   * A integração do Vercel injecta as variáveis com o prefixo do projecto
   * (`iga_`), que o Vite não expõe ao cliente por não terem prefixo VITE_.
   * Reexportá-las aqui evita ter de duplicar variáveis no painel do Vercel só
   * para as renomear.
   *
   * Só a chave PÚBLICA passa por aqui. A chave de serviço não é lida neste
   * ficheiro em circunstância nenhuma: entraria no pacote e seria publicada.
   */
  const supabaseUrl = primeiro(
    'VITE_SUPABASE_URL',
    'iga_IGA_SUPABASE_URL',
    'iga_SUPABASE_URL',
    'SUPABASE_URL'
  );
  const supabaseKey = primeiro(
    'VITE_SUPABASE_ANON_KEY',
    'iga_IGA_SUPABASE_PUBLISHABLE_KEY',
    'iga_SUPABASE_PUBLISHABLE_KEY',
    'iga_IGA_SUPABASE_ANON_KEY',
    'iga_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY'
  );

  if (!supabaseUrl || !supabaseKey) {
    // Aviso, não erro: a aplicação ainda arranca e gera a pedido. Mas o mapa
    // abre sem cor nenhuma, e é melhor saber isso aqui do que em produção.
    console.warn(
      '[iga] Configuração do Supabase ausente na compilação. ' + 'O índice pré-calculado não será carregado.'
    );
  }

  const proxyOllama = {
    '/ollama': {
      target: ollamaTarget,
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/ollama/, ''),
      // Medido: vários minutos por relatório em CPU. O default do proxy
      // cortaria a ligação muito antes disso.
      timeout: 1_200_000,
      proxyTimeout: 1_200_000,
    },
  };

  return {
    server: {
      port: 3000,
      // Escutar em 0.0.0.0 expõe o proxy /ollama — e portanto o modelo local —
      // a quem alcance a porta 3000 na rede. Passou a ser opt-in explícito.
      host: env.VITE_DEV_HOST || '127.0.0.1',
      proxy: proxyOllama,
    },
    preview: {
      port: 3000,
      host: env.VITE_DEV_HOST || '127.0.0.1',
      proxy: proxyOllama,
    },
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
