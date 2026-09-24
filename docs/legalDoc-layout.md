# LegalDoc Layout in Astro/Starlight

This page documents the layout system used for legal-style documents in this repository.

It focuses on:

- what the layout supports right now
- how to use it in content
- what is coupled to Starlight
- what it would take to reuse in another Astro project

## Scope and design intent

The LegalDoc layout is intentionally scoped. It only activates when a page sets:

```yaml
docLayout: legalDoc
```

The scoped behavior is implemented as a combination of:

1. content frontmatter (`docLayout`)
2. a wrapper class on the rendered content panel (`content-panel--legal-doc`)
3. legal-specific CSS in `legal-doc.scss`
4. a legal-only remark transform that adds `legal-clause` classes for paragraph numbering

This keeps the generic markdown/MDX attribute behavior separate from legal layout behavior.

## What the layout supports

Current support is implemented in `astro/src/styles/legal-doc.scss` and `astro/src/components/overrides/ContentPanel.astro`.

### 1. Scoped activation by layout class

When the page has `docLayout: legalDoc`, the content panel receives:

- `content-panel--legal-doc`

All legal CSS selectors are scoped to that class.

### 2. Section numbering for H2 headings

Inside legal scope, each top-level `h2` wrapper increments a section counter.

Rendered output pattern:

- `1 Tiltrædelsesdato og arbejdssted`
- `2 Ansvar og kompetencer`
- `3 Løn og lønforhandling`

### 3. Automatic paragraph clause numbering

Paragraphs marked with `legal-clause` are rendered with clause numbers using CSS counters:

- `1.1 ...`
- `1.2 ...`
- `2.1 ...`

The `legal-clause` class is added by the legal-only remark plugin for ordinary paragraphs under `h2` sections.

### 4. Opt-out from auto numbering

Any paragraph with `skip-number` is excluded from auto-tagging and auto-number rendering.

### 5. Optional list-based legal numbering

The stylesheet includes optional list styles for structured clauses:

- `ol.legal-clauses > li` renders as `section.clause`
- nested `ol.legal-subclauses > li` renders as `section.clause.subclause`

This enables explicit legal list structures when paragraph auto-numbering is not enough.

### 6. Borderless legal table helper

Within legal scope, elements using `table-no-border` remove table borders.

This is used for signature and party-information table layouts.

## How to use it in this repository

### Step 1: Set frontmatter on a page

```yaml
---
title: Example Legal Document
description: Example
docLayout: legalDoc
---
```

### Step 2: Author headings and paragraphs normally

Use `##` headings for section boundaries and plain paragraphs for clauses.

The legal plugin + CSS counters do the numbering.

### Step 3: Exclude specific paragraphs when needed

Use a trailing remark-attr directive to apply `skip-number`:

```mdx
Arbejdsstedet er ... <remark-attr class="skip-number" />
```

You can combine attributes:

```mdx
Arbejdsstedet er ... <remark-attr style="text-decoration: underline;" class="skip-number" />
```

### Step 4: Use optional list styles for explicit nested clauses

```mdx
<ol class="legal-clauses">
  <li>
    First clause
    <ol class="legal-subclauses">
      <li>First subclause</li>
    </ol>
  </li>
</ol>
```

### Step 5: Use borderless legal tables where needed

```mdx
<table class="table-no-border">...</table>
```

## Implementation map

These files together define the LegalDoc layout behavior:

- `astro/src/content.config.ts`
  - defines `docLayout` schema values (`default`, `legalDoc`)
- `astro/src/components/overrides/ContentPanel.astro`
  - applies `content-panel--legal-doc` only for legal pages
- `astro/src/styles/legal-doc.scss`
  - contains all legal-scoped counters and helper styles
- `astro/src/config/remark-legal-clauses.mjs`
  - auto-tags eligible paragraphs with `legal-clause` only for legal pages
- `astro/astro.config.mjs`
  - registers the legal remark plugin in markdown pipeline

## Known constraints

1. Counter selectors currently target Starlight DOM wrappers (`.sl-markdown-content`, `.sl-heading-wrapper.level-h2`).
2. Clause auto-tagging currently depends on `h2` as the section boundary.
3. Paragraph auto-tagging is top-level and structure-sensitive by design.
4. If content manually prefixes numbers (for example `**2.3**`), those visual numbers can duplicate generated numbering.

## Reuse in another Astro project

Reusing this in another Astro repo is practical, and there are three paths.

### Path A: Astro + Starlight target (lowest friction)

1. Copy `remark-legal-clauses.mjs`.
2. Register it in `markdown.remarkPlugins` after the generic attr plugin.
3. Add `docLayout` to your content schema.
4. Add a content wrapper class toggle equivalent to `content-panel--legal-doc`.
5. Copy legal CSS and keep selectors aligned with your rendered Starlight structure.
6. Mark target pages with `docLayout: legalDoc`.

### Path B: Astro without Starlight (moderate adaptation)

1. Keep the same plugin strategy (`docLayout`-gated legal clause tagging).
2. Keep the same scoped class strategy.
3. Rewrite CSS selectors to your renderer DOM (heading wrappers and content container differ from Starlight).
4. Verify counters with real rendered HTML before rollout.

### Path C: Non-Astro markdown pipeline (highest adaptation)

1. Port legal clause tagging logic to your markdown AST toolchain.
2. Recreate frontmatter gating in that toolchain.
3. Reapply scoped CSS counters in the host renderer.
4. Revisit syntax support for trailing directives if MDX/JSX parsing differs.

## Minimal portability checklist

1. A frontmatter field to opt pages into legal layout.
2. A scoped wrapper class that appears only for legal pages.
3. A transform that adds `legal-clause` classes only for opted-in pages.
4. CSS counters scoped to the wrapper class.
5. Test fixtures with:
   - multiple `h2` sections
   - skip-number paragraphs
   - structured clause lists
   - borderless legal tables

## Relationship to remark-attr-for-mdx

- `remark-attr-for-mdx` is generic and reusable across all documents.
- LegalDoc layout is a separate, optional layer.
- Keeping them separate avoids layout coupling in the generic authoring plugin.
