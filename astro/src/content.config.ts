import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// Spike: point the docs collection at an external content root when set,
// so content never has to live inside this theme's own src/ tree.
const contentRoot = process.env.REMOTE_THEME_CONTENT_ROOT ?? "./src/content/docs";

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
