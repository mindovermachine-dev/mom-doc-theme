function tokenizeAttributes(input) {
  const matches = input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
  return matches ?? [];
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseKramdownAttrs(raw) {
  const normalizedRaw = raw.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  const classes = [];
  const props = {};

  for (const token of tokenizeAttributes(normalizedRaw.trim())) {
    if (token.startsWith(".")) {
      classes.push(token.slice(1));
      continue;
    }

    if (token.startsWith("#")) {
      props.id = token.slice(1);
      continue;
    }

    const equalIndex = token.indexOf("=");
    if (equalIndex !== -1) {
      const key = token.slice(0, equalIndex);
      const value = stripQuotes(token.slice(equalIndex + 1));
      if (key) props[key] = value;
      continue;
    }

    props[token] = "";
  }

  if (classes.length > 0) {
    props.className = classes;
  }

  return props;
}

function extractRawAttrs(text) {
  return text
    .trim()
    .replace(/^\\?\{:\s+/, "")
    .replace(/\}\s*$/, "");
}

function attributeToPair(attribute) {
  if (!attribute || attribute.type !== "mdxJsxAttribute") return null;

  const rawValue = attribute.value;
  const normalizedValue =
    typeof rawValue === "string"
      ? rawValue
      : rawValue && typeof rawValue === "object" && "value" in rawValue
        ? rawValue.value
        : "";

  if (attribute.name.startsWith("#")) {
    return ["id", attribute.name.slice(1)];
  }

  if (attribute.name === "class" || attribute.name === "className") {
    const classes = Array.isArray(normalizedValue)
      ? normalizedValue
      : typeof normalizedValue === "string"
        ? normalizedValue.split(/\s+/).filter(Boolean)
        : [];

    return ["className", classes];
  }

  return [attribute.name, normalizedValue];
}

function parseMdxAttributeNode(node) {
  const classes = [];
  const props = {};

  for (const attribute of node.attributes ?? []) {
    const pair = attributeToPair(attribute);
    if (!pair) continue;

    const [key, value] = pair;
    if (key === "className") {
      classes.push(...value);
      continue;
    }

    props[key] = value;
  }

  if (classes.length > 0) {
    props.className = classes;
  }

  return props;
}

function isRemarkAttrNode(node) {
  return (
    node &&
    (node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement") &&
    node.name === "remark-attr"
  );
}

function applyPropsToNode(node, nextProps) {
  const data = (node.data ??= {});
  const hProperties = (data.hProperties ??= {});

  if (Array.isArray(nextProps.className) && nextProps.className.length > 0) {
    const existing = hProperties.className;
    const existingClasses = Array.isArray(existing)
      ? existing
      : typeof existing === "string" && existing.length > 0
        ? [existing]
        : [];

    hProperties.className = [...existingClasses, ...nextProps.className];
  }

  for (const [key, value] of Object.entries(nextProps)) {
    if (key === "className") continue;
    hProperties[key] = value;
  }
}

function processChildren(node) {
  if (!node || !Array.isArray(node.children)) return;

  for (const child of node.children) {
    processChildren(child);
  }

  const nextChildren = [];

  for (const child of node.children) {
    if (isRemarkAttrNode(child)) {
      if (node.type === "paragraph") {
        nextChildren.push(child);
        continue;
      }

      const target = nextChildren[nextChildren.length - 1];
      if (!target) continue;

      applyPropsToNode(target, parseMdxAttributeNode(child));
      continue;
    }

    const isStandaloneAttrParagraph =
      child?.type === "paragraph" &&
      child.children?.length === 1 &&
      child.children[0]?.type === "text" &&
      /^\\?\{:\s+[^}]+\s*\}$/.test(child.children[0].value.trim());

    if (child?.type === "paragraph" && Array.isArray(child.children)) {
      const trailingDirective = child.children[child.children.length - 1];
      if (isRemarkAttrNode(trailingDirective)) {
        applyPropsToNode(child, parseMdxAttributeNode(trailingDirective));
        child.children = child.children.slice(0, -1);
      }

      const lastChild = child.children[child.children.length - 1];
      if (lastChild?.type === "text" && !isStandaloneAttrParagraph) {
        const trailingMatch = lastChild.value.match(
          /\s*\\?\{:\s+([^}]+)\s*\}\s*$/,
        );

        if (trailingMatch) {
          const props = parseKramdownAttrs(trailingMatch[1]);
          applyPropsToNode(child, props);
          lastChild.value = lastChild.value
            .replace(/\s*\\?\{:\s+[^}]+\s*\}\s*$/, "")
            .trimEnd();
        }
      }
    }

    if (!isStandaloneAttrParagraph) {
      nextChildren.push(child);
      continue;
    }

    const target = nextChildren[nextChildren.length - 1];
    if (!target) {
      nextChildren.push(child);
      continue;
    }

    const raw = extractRawAttrs(child.children[0].value);
    const props = parseKramdownAttrs(raw);
    applyPropsToNode(target, props);
  }

  node.children = nextChildren;
}

export default function remarkAttrForMdx() {
  return (tree) => {
    processChildren(tree);
  };
}
