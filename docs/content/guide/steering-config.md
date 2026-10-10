---
# cspell:ignore serialised
title: Steering config
description: Every key supported in docs/site.config.mjs when using this theme.
sidebar:
  order: 2
---

`docs/site.config.mjs` default-exports a plain object. Values override the theme's defaults key by key (shallow). The file is serialised to JSON for the build, so it can only contain plain data, not functions or plugins.

| Key             | Purpose                                                                                    |
| :-------------- | :----------------------------------------------------------------------------------------- |
| `theme`         | Required. `org/repo@ref` or a local path such as `file:../mom-doc-theme`. Read by the CLI. |
| `title`         | Site title: a string, or an object per locale (`{ en: "...", da: "..." }`).                |
| `site`          | Absolute site origin. Needed for the sitemap.                                              |
| `favicon`       | Favicon path, relative to the theme's `public/`.                                           |
| `logo`          | Starlight `logo` option, for example `{ src: "./src/assets/remote/logo.png" }`.            |
| `customCss`     | Array of CSS/SCSS paths. Replaces the theme's list.                                        |
| `defaultLocale` | `"root"` for an unprefixed single-language site, otherwise a locale key such as `"da"`.    |
| `locales`       | Starlight `locales` object. Use `root` for the unprefixed locale.                          |
| `rootRedirect`  | Where `/` redirects. Set `null` to disable. The default points at `/da/`.                  |
| `social`        | Starlight `social` links.                                                                  |
| `sidebar`       | Starlight `sidebar`. See below.                                                            |
| `astro`         | Raw Astro config merged over the theme's. Use for `base`, `server`, `vite` and similar.    |

## Sidebar

Use `autogenerate` per folder. Starlight 0.39 needs the group `label` and an `items` array:

```js
sidebar: [
  { label: "Guide", items: [{ autogenerate: { directory: "guide" } }] },
];
```

Order pages inside a group with `sidebar: { order: N }` in frontmatter. Lower numbers come first.

## Frontmatter

Standard Starlight frontmatter applies, plus:

| Field                           | Purpose                                                                                    |
| :------------------------------ | :----------------------------------------------------------------------------------------- |
| `redirect-from`, `redirectFrom` | One or more old URLs that redirect to this page.                                           |
| `giscus`                        | Boolean. Enables or disables the Giscus comment widget on the page.                        |
| `pdf`                           | Boolean. Also render this page to PDF (needs Chromium).                                    |
| `docLayout`                     | `default` or `legalDoc`. See [LegalDoc layout](/mom-doc-theme/features/legal-doc-layout/). |

## Not yet configurable

Giscus settings and PDF options are still defined inside the theme (`astro/src/config/giscus.mjs`). PDF output needs a Chromium binary at a standard path, or `PDF_BROWSER_PATH` set.
