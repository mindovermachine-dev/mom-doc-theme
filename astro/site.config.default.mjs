// Default/demo site config used when this theme is run standalone (no
// generated override from remote-astro-theme). A calling content repo's
// docs/site.config.mjs values override these on a per-key basis.
export default {
  title: {
    en: "Mind over machine",
  },
  rootRedirect: null,
  defaultLocale: "root",
  locales: { root: { label: "English", lang: "en" } },
  favicon: "/mom-favicon.ico",
  logo: {
    src: "./src/assets/mom-logo.png",
  },
  customCss: ["./src/styles/custom.scss", "./src/styles/legal-doc.scss"],
  social: [
    {
      icon: "github",
      label: "GitHub",
      href: "https://github.com/mindovermachine-dev",
    },
  ]
};
