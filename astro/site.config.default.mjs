// Default/demo site config used when this theme is run standalone (no
// generated override from remote-astro-theme). A calling content repo's
// docs/site.config.mjs values override these on a per-key basis.
export default {
  title: {
    da: "Mind over Machine",
    en: "Mind over machine",
  },
  rootRedirect: "/da/",
  favicon: "/mom-favicon.ico",
  logo: {
    src: "./src/assets/mom-logo.png",
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
      ],
    },
  ],
};
