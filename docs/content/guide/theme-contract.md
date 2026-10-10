---
# csepll: ignore r
title: Theme contract
description: What a theme must provide to work with remote-astro-theme, and how this one does it.
sidebar:
  order: 3
---

This page is for people maintaining or forking the theme. A theme is an ordinary Astro project in a git repo. It is not an npm package.

## `remote-theme.json`

An optional manifest at the repo root tells the CLI where things are:

```json
{
  "astroRoot": "astro",
  "contentLink": "src/content/docs"
}
```

| Key           | Default                 | Meaning                                                                       |
| :------------ | :---------------------- | :---------------------------------------------------------------------------- |
| `astroRoot`   | `astro`                 | Folder of the Astro project, relative to the repo root.                       |
| `contentLink` | `.remote-theme/content` | Where the CLI symlinks the content repo's `docs/content`, inside `astroRoot`. |
| `assetsLink`  | `src/assets/remote`     | Where the CLI symlinks `docs/assets`, inside `astroRoot`.                     |

This theme sets `contentLink` to `src/content/docs` because Starlight's `autogenerate` only recognises that path.

## What the CLI hands to the theme

- **`REMOTE_THEME_SITE_CONFIG`**: absolute path of a generated module whose default export is the steering config (without `theme`), plus `contentRoot`. The theme's `src/config/site-config.mjs` merges it over `site.config.default.mjs`.
- **`REMOTE_THEME_OUT_DIR`**: where Astro must write its output (`outDir`).
- **A symlinked content folder.** Set `vite.resolve.preserveSymlinks: true` so bare imports in content files, such as `@astrojs/starlight/components`, still resolve from the theme.

## Rules for the theme

- Do not ship content at the `contentLink` path. The CLI refuses to replace a non-empty folder there.
- Keep the theme free of site-specific data. Titles, sidebars and locales belong in the content repo's steering config.
- Merge the `astro` key of the steering config over your own config with `mergeConfig`.

## Standalone use

Without the CLI the theme falls back to `site.config.default.mjs` and an empty content folder. It is meant to be driven by the CLI, and this repo's own `docs/` folder does exactly that.
