import { pathToFileURL } from "node:url";
import defaultSiteConfig from "../../site.config.default.mjs";

let cachedConfig;

/**
 * Resolves the effective site config: this theme's own bundled defaults,
 * overridden by the generated config a calling CLI (remote-astro-theme)
 * writes and points at via REMOTE_THEME_SITE_CONFIG. Also resolves
 * `contentRoot`, defaulting to this theme's own bundled demo content.
 */
export async function resolveSiteConfig() {
  if (cachedConfig) return cachedConfig;

  let overrides = {};
  const generatedConfigPath = process.env.REMOTE_THEME_SITE_CONFIG;
  if (generatedConfigPath) {
    const mod = await import(pathToFileURL(generatedConfigPath).href);
    overrides = mod.default ?? {};
  }

  cachedConfig = {
    ...defaultSiteConfig,
    ...overrides,
    contentRoot: overrides.contentRoot ?? "./src/content/docs",
  };

  return cachedConfig;
}
