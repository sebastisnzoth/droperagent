/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_DROPERAGENT_API_URL?: string;
  readonly VITE_ENABLE_LIVE_READONLY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
