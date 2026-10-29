import { defineConfig, mergeConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import pdf from "astro-pdf";
import { accessSync, constants, readFileSync } from "node:fs";
import rehypeExternalLinks from "rehype-external-links";
import remarkAttrForMdx from "./src/config/remark-attr-for-mdx.mjs";
import remarkLegalClauses from "./src/config/remark-legal-clauses.mjs";
import { collectFrontmatterRedirects } from "./src/config/frontmatter-redirects.mjs";
import { collectFrontmatterPdfPages } from "./src/config/frontmatter-pdf-pages.mjs";
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

function getVersionFooterText() {
  try {
    const versionText = readFileSync(
      new URL("./public/version.txt", import.meta.url),
      "utf8",
    );
    const normalized = versionText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" | ");

    return normalized || "NO VERSION INFO";
  } catch {
    return "NO VERSION INFO";
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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

function findExecutablePath(candidates) {
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

function getPdfBrowserExecutablePath() {
  const envPath =
    process.env.PDF_BROWSER_PATH ?? process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath) {
    return envPath;
  }

  return findExecutablePath([
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/snap/bin/chromium",
  ]);
}

const pdfPages = collectFrontmatterPdfPages({
  docsRoot: new URL(siteConfig.contentRoot, import.meta.url),
  localePrefixes,
});

const pdfPageSet = new Set(pdfPages.map(normalizePathname));
const footerVersionText = escapeHtml(getVersionFooterText());
const pdfBrowserExecutablePath = getPdfBrowserExecutablePath();
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

if (pdfPageSet.size > 0 && !pdfBrowserExecutablePath) {
  throw new Error(
    "No PDF browser executable found. Run 'gh insitu run post-create' or 'gh insitu run prep-runner' so Chromium is installed, or set PDF_BROWSER_PATH.",
  );
}

const pdfIntegration =
  pdfPageSet.size > 0
    ? pdf({
        launch: {
          executablePath: pdfBrowserExecutablePath,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
        pages: (pathname) =>
          pdfPageSet.has(normalizePathname(pathname)) ? true : false,
        baseOptions: {
          path: "/pdf[pathname].pdf",
          throwOnFail: true,
          pdf: {
            format: "A4",
            printBackground: true,
            displayHeaderFooter: true,
            margin: {
              top: "20mm",
              right: "12mm",
              bottom: "22mm",
              left: "12mm",
            },
            headerTemplate: "<div></div>",
            footerTemplate: `<div style=\"width:100%;font-size:8px;padding:0 16px;color:#555;text-align:center;\">${footerVersionText}</div>`,
          },
        },
      })
    : null;

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
    ...(pdfIntegration ? [pdfIntegration] : []),
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
