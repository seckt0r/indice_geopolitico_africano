/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OLLAMA_URL?: string;
  readonly VITE_OLLAMA_MODEL?: string;
  readonly VITE_OLLAMA_TIMEOUT_MS?: string;
  readonly VITE_OLLAMA_NUM_CTX?: string;
  readonly VITE_CONTRIBUTION_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
