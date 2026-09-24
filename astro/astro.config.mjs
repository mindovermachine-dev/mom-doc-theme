import { defineConfig } from "astro/config";
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

const frontmatterRedirects = collectFrontmatterRedirects({
  docsRoot: new URL("./src/content/docs", import.meta.url),
  localePrefixes: ["da", "en"],
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
  docsRoot: new URL("./src/content/docs", import.meta.url),
  localePrefixes: ["da"],
});

const pdfPageSet = new Set(pdfPages.map(normalizePathname));
const footerVersionText = escapeHtml(getVersionFooterText());
const pdfBrowserExecutablePath = getPdfBrowserExecutablePath();
const hasRequiredGiscusConfig =
  Boolean(giscusClientConfig.src) &&
  Boolean(giscusClientConfig.attributes["data-repo"]);

if (!hasRequiredGiscusConfig) {
  throw new Error(
    "Invalid Giscus configuration. Update src/config/giscus.mjs with a script URL and data-repo.",
  );
}

// Giscus defaults and widget parameters are centrally managed in src/config/giscus.mjs.
// Keep this false to make comments opt-in with `giscus: true` in page frontmatter.
if (giscusEnabledByDefault) {
  console.warn(
    "Giscus is enabled by default. Set giscusEnabledByDefault to false in src/config/giscus.mjs to make comments opt-in.",
  );
}

if (!pdfBrowserExecutablePath) {
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

// https://astro.build/config
export default defineConfig({
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
      title: {
        da: "Mind over Machine",
        en: "Mind over machine",
      },
      favicon: "/mom-favicon.ico",
      logo: {
        src: "./src/assets/mom-logo.png",
      },
      components: {
        ContentPanel: "./src/components/overrides/ContentPanel.astro",
        Footer: "./src/components/overrides/Footer.astro",
      },
      customCss: ["./src/styles/custom.scss", "./src/styles/legal-doc.scss"],
      defaultLocale: "da",
      locales: {
        da: {
          label: "Dansk",
          lang: "da",
        },
        en: {
          label: "English",
          lang: "en",
        },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/mindovermachine-dev",
        },
      ],
      sidebar: [
        {
          label: "Vision & Mission",
          translations: { da: "Vision & Mission" },
          items: [
            {
              label: "The Manifesto",
              translations: { da: "Manifestet" },
              slug: "vision/manifesto",
            },
            {
              label: "The Regenerative Charter",
              translations: { da: "Det regenerative Charter" },
              slug: "vision/charter",
            },
            {
              label: "The C.R.O.W.D. Values",
              translations: { da: "C.R.O.W.D. Værdierne" },
              slug: "vision/crowd-values",
            },
          ],
        },
        {
          label: "About Us",
          translations: { da: "Om Os" },
          items: [
            {
              label: "Join Us",
              translations: { da: "Vær med" },
              slug: "about/join",
            },
            {
              label: "Contact",
              translations: { da: "Kontakt" },
              slug: "about/contact",
            },
            {
              label: "Founder's Story",
              translations: { da: "Founder's Story" },
              slug: "about/founder-story",
            },
          ],
        },
        {
          label: "Organization",
          translations: { da: "Organisation" },
          items: [
            {
              label: "The Three Pillars",
              translations: { da: "De tre Søjler" },
              slug: "governance/three-pillars",
            },
            {
              label: "Initiative Circle",
              translations: { da: "Initiativkredsen" },
              slug: "governance/initiative-circle",
            },
            {
              label: "Registration & Founding Documents",
              translations: { da: "Stiftelsesdokumenter" },
              slug: "governance/registration",
            },
          ],
        },
        {
          label: "Personnel",
          translations: { da: "Personale" },
          items: [
            {
              label: "Director agreement",
              translations: { da: "Direktøraftale" },
              slug: "personnel/director-agreement",
            },
            {
              label: "Employee agreement",
              translations: { da: "Ansættelsesaftale" },
              slug: "personnel/employee-agreement",
            },
            {
              label: "Personnel Policy",
              translations: { da: "Personalepolitik" },
              slug: "personnel/personnel-policy",
            },
          ],
        },
        {
          label: "Methodology",
          translations: { da: "Metoder" },
          items: [
            {
              label: "Collaboration",
              translations: { da: "Samarbejde" },
              slug: "methodology/collaboration",
            },
            {
              label: "How We Work",
              translations: { da: "Sådan arbejder vi" },
              slug: "methodology/how-we-work",
            },
            //            {
            //              label: "The Toyota Way",
            //              translations: { da: "Toyota-vejen" },
            //              slug: "methodology/toyota-way",
            //            },
            //            {
            //              label: "Participatory Design",
            //              translations: { da: "Deltagende Design" },
            //              slug: "methodology/participatory-design",
            //            },
            //            {
            //              label: "Developer Experience (DevX)",
            //              translations: { da: "Udvikler Erfaring (DevX)" },
            //              slug: "methodology/devx",
            //            },
          ],
        },
      ],
    }),
    ...(pdfIntegration ? [pdfIntegration] : []),
  ],
  redirects: {
    "/": "/da/",
    ...frontmatterRedirects,
  },
});
