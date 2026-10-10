---
# cspell: ignore mindovermachine
title: Getting started
description: Build a documentation site from a content-only repo using this theme.
sidebar:
  order: 1
---

`mom-doc-theme` is a complete [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) project. You do not copy it. A content repo references it by git coordinate, and [remote-astro-theme](https://github.com/mindovermachine-dev/remote-astro-theme) fetches it and builds your content with it.

## What your repo contains

```txt
my-docs-repo/
├── package.json            # devDependency on remote-astro-theme + scripts
└── docs/
    ├── site.config.mjs     # steering config (theme, title, sidebar, ...)
    ├── content/            # your .md / .mdx pages
    └── assets/             # optional images, referenced from content
```

There is no Astro config, no `src/` and no Starlight setup in your repo.

## Set up

1. Add the CLI and scripts to `package.json`:

   ```json
   {
     "scripts": {
       "dev": "remote-astro-theme dev",
       "build": "remote-astro-theme build",
       "preview": "remote-astro-theme preview"
     },
     "devDependencies": {
       "@mindovermachine-dev/remote-astro-theme": "^0.1.0"
     }
   }
   ```

2. Create `docs/site.config.mjs`:

   ```js
   export default {
     theme: "mindovermachine-dev/mom-doc-theme@main",
     title: "My docs",
     defaultLocale: "root",
     locales: { root: { label: "English", lang: "en" } },
     rootRedirect: null,
     sidebar: [
       { label: "Guide", items: [{ autogenerate: { directory: "guide" } }] },
     ],
   };
   ```

3. Add pages under `docs/content/`. Each page needs `title` and `description` frontmatter.
4. Run `npm install`, then `npm run dev`. The site is built to `dist/` by `npm run build`.

:::caution
The theme ships a Danish/English demo configuration as its defaults. Always override `locales`, `defaultLocale`, `rootRedirect` and `sidebar`, or you will inherit the demo values. See [Steering config](/mom-doc-theme/guide/steering-config/).
:::

## Pin the theme

`@main` is re-fetched on every run. For CI and production, pin a tag or a full commit SHA: `mindovermachine-dev/mom-doc-theme@v1.0.0`. Only full 40-character SHAs are cached.

## Hosting under a sub-path

For GitHub Pages project sites, set `astro.base` and `astro.site` (see [Steering config](/mom-doc-theme/guide/steering-config/)). Root-absolute links in content, such as hero action links, do not get the base added. Include it yourself, for example `/my-repo/guide/intro/`.
