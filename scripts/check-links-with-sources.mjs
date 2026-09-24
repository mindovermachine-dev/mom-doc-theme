import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const LINKINATOR_ARGS = [
  ".",
  "/da/",
  "/en/",
  "--config",
  "linkinator.config.json",
  "--server-root",
  "astro/dist",
  "--recurse",
  "--format",
  "json",
  "--silent",
];

function extractJson(text) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function isBroken(link) {
  const status = Number(link?.status || 0);
  const state = String(link?.state || "").toUpperCase();
  return (
    status >= 400 ||
    state.includes("BROKEN") ||
    state.includes("ERROR") ||
    state.includes("FAIL")
  );
}

function normalizeInternalTarget(url) {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return null;
  if (
    raw.startsWith("#") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("javascript:")
  )
    return null;

  const noHash = raw.split("#")[0];
  const noQuery = noHash.split("?")[0];
  if (!noQuery) return null;

  let path = noQuery.replace(/^\.\//, "");
  path = path.replace(/^\//, "");
  if (!path) return "/";

  return `/${path}`;
}

function walkDocsFiles(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      const ext = extname(entry.name);
      if (ext === ".md" || ext === ".mdx") {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

function buildNeedles(targetPath) {
  const withSlash = targetPath;
  const withoutSlash = targetPath.endsWith("/")
    ? targetPath.slice(0, -1)
    : targetPath;
  const relWithSlash = withSlash.slice(1);
  const relWithoutSlash = withoutSlash.startsWith("/")
    ? withoutSlash.slice(1)
    : withoutSlash;

  return new Set([
    withSlash,
    withoutSlash,
    relWithSlash,
    relWithoutSlash,
    `(${withSlash})`,
    `(${withoutSlash})`,
    `(${relWithSlash})`,
    `(${relWithoutSlash})`,
    `\"${withSlash}\"`,
    `\"${withoutSlash}\"`,
    `'${withSlash}'`,
    `'${withoutSlash}'`,
  ]);
}

function findSourceFilesForTarget(targetPath, docsFiles) {
  const needles = buildNeedles(targetPath);
  const matches = [];

  for (const file of docsFiles) {
    const content = readFileSync(file, "utf8");
    for (const needle of needles) {
      if (needle && content.includes(needle)) {
        matches.push(
          file.replace(/^.*?\/workspaces\/lean-crowd-manifest\//, ""),
        );
        break;
      }
    }
  }

  return matches;
}

const linkinatorRun = spawnSync("npx", ["linkinator", ...LINKINATOR_ARGS], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

const stdout = linkinatorRun.stdout || "";
const parsed = extractJson(stdout);

if (!parsed) {
  process.stderr.write("Could not parse Linkinator JSON output.\n");
  if (linkinatorRun.stderr) process.stderr.write(`${linkinatorRun.stderr}\n`);
  process.exit(linkinatorRun.status ?? 2);
}

const brokenLinks = parsed.filter(isBroken);

if (brokenLinks.length === 0) {
  process.stdout.write("No broken links found.\n");
  process.exit(0);
}

const docsFiles = walkDocsFiles("astro/src/content/docs");
const grouped = new Map();

for (const link of brokenLinks) {
  const target = normalizeInternalTarget(link.url);
  const key = target || String(link.url);
  if (!grouped.has(key)) {
    grouped.set(key, {
      target: key,
      statuses: new Set(),
      parentUrls: new Set(),
    });
  }

  const bucket = grouped.get(key);
  if (link.status) bucket.statuses.add(String(link.status));

  if (Array.isArray(link.parent)) {
    for (const parent of link.parent) {
      if (parent) bucket.parentUrls.add(String(parent));
    }
  } else if (link.parent) {
    bucket.parentUrls.add(String(link.parent));
  }
}

process.stdout.write(
  `Detected ${brokenLinks.length} broken links (${grouped.size} unique targets).\n\n`,
);

for (const [, item] of grouped) {
  process.stdout.write(
    `- ${item.target} [${Array.from(item.statuses).join(", ")}]\n`,
  );

  const sourceCandidates = item.target.startsWith("/")
    ? findSourceFilesForTarget(item.target, docsFiles)
    : [];

  if (sourceCandidates.length > 0) {
    process.stdout.write("  Source files:\n");
    for (const file of sourceCandidates) {
      process.stdout.write(`  - ${file}\n`);
    }
  } else {
    process.stdout.write("  Source files: (no direct MD/MDX match found)\n");
  }

  const parents = Array.from(item.parentUrls);
  if (parents.length > 0) {
    process.stdout.write("  Linked from built pages:\n");
    for (const parent of parents) {
      process.stdout.write(`  - ${parent}\n`);
    }
  }

  process.stdout.write("\n");
}

process.exit(1);
