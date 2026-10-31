import { defineConfig, mergeConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import rehypeExternalLinks from "rehype-external-links";
import remarkAttrForMdx from "./src/config/remark-attr-for-mdx.mjs";
import remarkLegalClauses from "./src/config/remark-legal-clauses.mjs";
import { collectFrontmatterRedirects } from "./src/config/frontmatter-redirects.mjs";
import {
  giscusClientConfig,
  giscusEnabledByDefault,
} from "./src/config/giscus.mjs";
import { resolveSiteConfig } from "./src/config/site-config.mjs";

const siteConfig = await resolveSiteConfig();

// Root locale content (Starlight's `locales.root`) lives unprefixed; only
// non-root locales get a directory prefix under the content root.
const localePrefixes = Object.keys(siteConfig.locales ?? {}).filter(
  (locale) => locale !== "root",
);

const frontmatterRedirects = collectFrontmatterRedirects({
  docsRoot: new URL(siteConfig.contentRoot, import.meta.url),
  localePrefixes,
  onConflict: ({ source, existing, incoming, filePath }) => {
    console.warn(
      `[redirect-from] Skipping conflicting source '${source}' from '${filePath}'. Already mapped to '${existing}' and ignored '${incoming}'.`,
    );
  },
});

function normalizePathname(pathname) {
  if (!pathname) return "/";
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

const basePath = normalizePathname(siteConfig.astro?.base ?? "/");

function withBasePath(pathname) {
  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    basePath === "/"
  ) {
    return pathname;
  }

  const routePath = normalizePathname(pathname.split(/[?#]/, 1)[0]);
  if (routePath === basePath || routePath.startsWith(`${basePath}/`)) {
    return pathname;
  }

  return `${basePath}${pathname}`;
}

const hasRequiredGiscusConfig =
  Boolean(giscusClientConfig.src) &&
  Boolean(giscusClientConfig.attributes["data-repo"]);

if (!hasRequiredGiscusConfig) {
  // A content repo that doesn't configure Giscus simply doesn't get comments
  // (Giscus.astro already no-ops without a data-repo) rather than failing
  // the whole build — this theme has to work for repos that don't want it.
  console.warn(
    "Giscus is not configured (no data-repo). Comments will be disabled for this build.",
  );
}

// Giscus defaults and widget parameters are centrally managed in src/config/giscus.mjs.
// Keep this false to make comments opt-in with `giscus: true` in page frontmatter.
if (giscusEnabledByDefault) {
  console.warn(
    "Giscus is enabled by default. Set giscusEnabledByDefault to false in src/config/giscus.mjs to make comments opt-in.",
  );
}

const themeConfig = defineConfig({
  outDir: process.env.REMOTE_THEME_OUT_DIR || undefined,
  site: siteConfig.site,
  markdown: {
    remarkPlugins: [remarkAttrForMdx, remarkLegalClauses],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          protocols: ["https"],
          target: "_blank",
          rel: ["noopener", "noreferrer"],
        },
      ],
    ],
  },
  vite: {
    server: {
      host: true,
      allowedHosts: true,
    },
    resolve: {
      // Content can be symlinked in from outside this project; keep module
      // resolution anchored to the symlink's apparent location so bare
      // imports (e.g. @astrojs/starlight/components) still resolve here.
      preserveSymlinks: true,
    },
  },
  integrations: [
    starlight({
      title: siteConfig.title,
      favicon: siteConfig.favicon,
      logo: siteConfig.logo,
      components: {
        ContentPanel: "./src/components/overrides/ContentPanel.astro",
        Footer: "./src/components/overrides/Footer.astro",
      },
      customCss: siteConfig.customCss,
      // Starlight docs: omit defaultLocale entirely when the default
      // language is the root locale — passing the literal string "root"
      // breaks locale-aware URL generation (all links end up wrongly
      // prefixed with the root locale's `lang` code, e.g. "/en/...").
      defaultLocale:
        siteConfig.defaultLocale === "root"
          ? undefined
          : siteConfig.defaultLocale,
      locales: siteConfig.locales,
      social: siteConfig.social,
      sidebar: siteConfig.sidebar,
    }),
  ],
  redirects: {
    ...(siteConfig.rootRedirect
      ? { "/": withBasePath(siteConfig.rootRedirect) }
      : {}),
    ...Object.fromEntries(
      Object.entries(frontmatterRedirects).map(([source, target]) => [
        source,
        withBasePath(target),
      ]),
    ),
  },
});

// A content repo's `astro` key (raw Astro config) is merged over the theme's config.
export default mergeConfig(themeConfig, siteConfig.astro ?? {});
