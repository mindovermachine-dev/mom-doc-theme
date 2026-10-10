// Steering config: this theme documents itself using remote-astro-theme.
export default {
  theme: "file:.", // Local path to this theme's root, so the CLI can build its own docs.
  title: "mom-doc-theme",
  site: "https://docs.mindovermachine.dev",
  rootRedirect: null,
  defaultLocale: "root",
  locales: { root: { label: "English", lang: "en" } },
  astro: { base: "/mom-doc-theme", server: { host: true } },
  social: [
    {
      icon: "github",
      label: "GitHub",
      href: "https://github.com/mindovermachine-dev/mom-doc-theme",
    },
  ],
  sidebar: [
    { label: "Guide", items: [{ autogenerate: { directory: "guide" } }] },
    { label: "Features", items: [{ autogenerate: { directory: "features" } }] },
  ],
};
