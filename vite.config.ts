import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Alvo do proxy de desenvolvimento. A app fala com "/ollama" e o Vite
  // encaminha para a instância local. Isto evita CORS por completo e permite
  // servir em 0.0.0.0 sem ter de mexer em OLLAMA_ORIGINS.
  const ollamaTarget = env.OLLAMA_HOST || 'http://127.0.0.1:11434';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/ollama': {
          target: ollamaTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/ollama/, ''),
          // Medido: ~9 minutos por relatório em CPU. O default do proxy
          // cortaria a ligação muito antes disso.
          timeout: 1_200_000,
          proxyTimeout: 1_200_000,
        },
      },
    },
    preview: {
      port: 3000,
      proxy: {
        '/ollama': {
          target: ollamaTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/ollama/, ''),
          timeout: 1_200_000,
          proxyTimeout: 1_200_000,
        },
      },
    },
    plugins: [react()],
    // Sem `define` de chaves de API: o modelo corre localmente e não há
    // segredo nenhum para injectar no bundle. A configuração do Ollama passa
    // por variáveis VITE_* lidas via import.meta.env.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
