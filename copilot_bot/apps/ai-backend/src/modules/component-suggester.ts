import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { GeminiService } from "../lib/gemini.js";

const requestSchema = z.object({
  pageType: z.string().min(2),
  currentSections: z.array(z.string()).min(1),
  objective: z.string().min(4)
});

const gemini = new GeminiService();

export const componentSuggesterModule: FastifyPluginAsync = async (app) => {
  app.post("/recommend", async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { pageType, currentSections, objective } = parsed.data;

    const result = await gemini.generateJson<{
      suggestions: Array<{
        component: string;
        reason: string;
        placementHint: string;
        expectedImpact: string;
      }>;
    }>(
      "You are SitePilot Component Suggester. Recommend high-impact components for a page.",
      [
        `Page type: ${pageType}`,
        `Current sections: ${currentSections.join(", ")}`,
        `Objective: ${objective}`,
        "Return 3-5 suggestions with reasoning, placementHint, and expectedImpact."
      ].join("\n")
    );

    return reply.send(result);
  });
};
