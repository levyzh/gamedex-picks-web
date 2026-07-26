/// <reference types="vite/client" />

// Declares the environment variables this app reads, so TypeScript knows
// e.g. import.meta.env.VITE_PICKS_API_URL exists and is typed as a string.
// Same file exists in the main app with its own list — keep them separate,
// each app should only declare what it actually reads.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  // The Python service. Not read yet — step 3 wires the /recommendations call.
  readonly VITE_PICKS_API_URL: string;
  // Main Gamedex site, for the "sign up over there" link.
  readonly VITE_GAMEDEX_WEB_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
