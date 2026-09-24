function getFrontmatter(content) {
  if (typeof content !== "string") return "";
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return "";

  const startOffset = content.startsWith("---\r\n") ? 5 : 4;
  const endMarker = content.indexOf("\n---", startOffset);
  if (endMarker === -1) return "";

  return content.slice(startOffset, endMarker);
}

function getScalarField(frontmatter, fieldName) {
  const pattern = new RegExp(`^${fieldName}:[\\t ]*(.+)$`, "m");
  const match = frontmatter.match(pattern);
  if (!match) return null;

  const value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  return value;
}

function normalizeDocLayout(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getDocLayoutFromFileData(file) {
  const candidates = [
    file?.data?.astro?.frontmatter?.docLayout,
    file?.data?.frontmatter?.docLayout,
    file?.data?.starlightRoute?.entry?.data?.docLayout,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeDocLayout(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function getDocLayoutFromTree(tree) {
  if (!Array.isArray(tree?.children)) return null;

  for (const child of tree.children) {
    if (child?.type === "yaml" && typeof child.value === "string") {
      const fromYaml = getScalarField(child.value, "docLayout");
      const normalized = normalizeDocLayout(fromYaml);
      if (normalized) return normalized;
      continue;
    }

    if (child?.type === "mdxjsEsm" && typeof child.value === "string") {
      const match = child.value.match(/docLayout\s*:\s*(["']?)([^"'\n,}]+)\1/);
      const normalized = normalizeDocLayout(match?.[2]);
      if (normalized) return normalized;
    }
  }

  return null;
}

function getDocLayoutFromFileValue(file) {
  const frontmatter = getFrontmatter(String(file?.value ?? ""));
  if (!frontmatter) return null;

  return normalizeDocLayout(getScalarField(frontmatter, "docLayout"));
}

function isLegalDocPage(tree, file) {
  const docLayout =
    getDocLayoutFromFileData(file) ??
    getDocLayoutFromTree(tree) ??
    getDocLayoutFromFileValue(file);

  return docLayout === "legalDoc";
}

function hasClass(node, className) {
  const classValue = node?.data?.hProperties?.className;
  if (Array.isArray(classValue)) return classValue.includes(className);
  if (typeof classValue === "string") return classValue === className;
  return false;
}

function addClass(node, className) {
  const data = (node.data ??= {});
  const hProperties = (data.hProperties ??= {});
  const existing = hProperties.className;

  const classes = Array.isArray(existing)
    ? existing
    : typeof existing === "string" && existing.length > 0
      ? [existing]
      : [];

  if (classes.includes(className)) {
    hProperties.className = classes;
    return;
  }

  hProperties.className = [...classes, className];
}

function markLegalClauseParagraphs(tree) {
  if (!Array.isArray(tree?.children)) return;

  let inH2Section = false;

  for (const child of tree.children) {
    if (child?.type === "heading") {
      inH2Section = child.depth === 2;
      continue;
    }

    if (!inH2Section) continue;
    if (child?.type !== "paragraph") continue;
    if (hasClass(child, "skip-number")) continue;

    addClass(child, "legal-clause");
  }
}

export default function remarkLegalClauses() {
  return (tree, file) => {
    if (!isLegalDocPage(tree, file)) return;
    markLegalClauseParagraphs(tree);
  };
}
