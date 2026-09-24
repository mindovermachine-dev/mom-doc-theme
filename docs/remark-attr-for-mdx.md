# Remark-Attr for MDX in Astro

This repository implements a small, Astro-native attribute directive system inspired by the `remark-attr` family of plugins.

The goal is simple:

- keep authoring in plain Markdown/MDX
- allow a trailing directive to attach attributes to the immediately preceding element
- keep the attribute-directive behavior generic across documents

## What it does

The implementation supports one behavior:

1. A trailing attribute directive can attach classes and arbitrary HTML attributes to the previous Markdown element.

In practice, this lets you write authoring patterns like this:

```mdx
Arbejdsstedet er Mind over Machine ... <remark-attr style="text-decoration: underline;" class="underlined-note" />
```

or, in the current legacy brace syntax used in this repo:

```mdx
Arbejdsstedet er Mind over Machine ... \{: style="text-decoration: underline;" .underlined-note}
```

The important idea is not the exact syntax. The important idea is:

> take the attributes on the directive and apply them to the most recent rendered Markdown node.

## Why this exists

The repository uses `.mdx` content, not plain `.md` only. That means raw brace syntax can conflict with MDX parsing rules. A custom remark transform is a better fit than trying to force a Ruby-era Markdown syntax directly into MDX.

This approach keeps the authoring style close to the attribute-directive idea from Kramdown/Maruku, but the implementation stays in the Astro/remark world.

## Files in this implementation

If you want to move this feature to another Astro repo, these are the relevant files and what each one does.

### Markdown/MDX transform

- [astro/src/config/remark-attr-for-mdx.mjs](../astro/src/config/remark-attr-for-mdx.mjs)

This is the core remark plugin.

It currently:

- parses attribute syntax from a trailing directive node
- supports classes, ids, and key/value attributes
- normalizes curly quotes to regular quotes for attribute values
- attaches attributes to the preceding paragraph or block node

### Astro config wiring

- [astro/astro.config.mjs](../astro/astro.config.mjs)

This registers the plugin in `markdown.remarkPlugins`.

It also wires:

- the existing external links and PDF setup

## Transfer checklist for another Astro repo

If you want to port this to a different Astro project, the minimum setup is:

1. Add the generic remark-attr plugin file.
2. Register the plugin in `astro.config.mjs` under `markdown.remarkPlugins`.
3. Use MDX-compatible directive syntax in content (`<remark-attr ... />`) or keep legacy brace syntax where desired.
4. Add one or more content examples to validate class, id, and style propagation.

If you also want legal layout and numbering behavior, document and implement that separately in [LegalDoc Layout](./legalDoc-layout.md).

## Important Astro/MDX caveat

This implementation is Astro/MDX-native.

That means:

- it is not Ruby kramdown
- it is not `remark-attr` from a plain `.md` pipeline
- it is an Astro remark transform that intentionally mimics the useful parts of that workflow

MDX is stricter than plain Markdown, so the directive syntax has to be compatible with MDX parsing rules. That is why the plugin exists in the first place.

## Notes on naming

The current implementation supports the new MDX-friendly directive tag syntax, for example:

```mdx
<remark-attr style="text-decoration: underline;" class="underlined-note" />
```

That form is easier to read in MDX and clearer for future maintainers.

## What a maintainer should remember

- The attribute-directive feature is generic.
- The content should stay as plain Markdown/MDX as much as possible.
- Any syntax changes should be made in the remark plugin first, not by hand-editing many content files.

## Practical summary

If you want the shortest possible explanation:

- Astro uses remark for Markdown/MDX transforms.
- This repo uses a custom remark plugin instead of Ruby kramdown.
- The generic plugin applies trailing attribute directives to the previous node.
- The implementation is small and portable to another Astro repo.
