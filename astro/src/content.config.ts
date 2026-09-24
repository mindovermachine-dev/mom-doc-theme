import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { resolveSiteConfig } from "./config/site-config.mjs";

// remote-astro-theme injects a content root (a symlink into the calling
// content repo's docs/content) via the generated site config; falls back to
// this theme's own bundled demo content when run standalone.
const { contentRoot } = await resolveSiteConfig();

export const collections = {
  docs: defineCollection({
    loader: glob({ base: contentRoot, pattern: "**/*.{md,mdx}" }),
    schema: docsSchema({
      extend: z.object({
        redirectFrom: z.union([z.string(), z.array(z.string())]).optional(),
        "redirect-from": z.union([z.string(), z.array(z.string())]).optional(),
        giscus: z.boolean().optional(),
        pdf: z.boolean().optional(),
        docLayout: z.enum(["default", "legalDoc"]).optional(),
      }),
    }),
  }),
};
