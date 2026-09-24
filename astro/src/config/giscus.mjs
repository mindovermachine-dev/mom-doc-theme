export const giscusEnabledByDefault = false;

export const giscusClientConfig = {
  src: "https://giscus.app/client.js",
  attributes: {
    "data-repo": "mindovermachine-dev/giscus-public",
    "data-repo-id": "R_kgDOSOq5OQ",
    "data-category": "docs.mindovermachine.dk",
    "data-category-id": "DIC_kwDOSOq5Oc4C73LV",
    "data-mapping": "pathname",
    "data-strict": "0",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "0",
    "data-input-position": "bottom",
    "data-theme": "preferred_color_scheme",
  },
};

export function isGiscusEnabled(frontmatterValue) {
  if (frontmatterValue === true) {
    return true;
  }

  if (frontmatterValue === false) {
    return false;
  }

  return giscusEnabledByDefault;
}
