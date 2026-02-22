import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { GeminiService } from "../lib/gemini.js";

const requestSchema = z.object({
  pageTitle: z.string().min(3),
  pageSummary: z.string().min(10),
  primaryKeyword: z.string().min(2),
  imageContext: z.string().min(3)
});

const gemini = new GeminiService();

export const seoCopilotModule: FastifyPluginAsync = async (app) => {
  app.post("/generate", async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { pageTitle, pageSummary, primaryKeyword, imageContext } = parsed.data;

    const result = await gemini.generateJson<{
      metaTitle: string;
      metaDescription: string;
      canonicalSlug: string;
      altText: string;
      jsonLd: Record<string, unknown>;
    }>(
      "You are SitePilot SEO Copilot. Produce concise, search-friendly SEO artifacts.",
      [
        `Page title: ${pageTitle}`,
        `Page summary: ${pageSummary}`,
        `Primary keyword: ${primaryKeyword}`,
        `Image context: ${imageContext}`,
        "Meta description max 155 chars."
      ].join("\n")
    );

    return reply.send(result);
  });
};
