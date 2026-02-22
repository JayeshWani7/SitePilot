import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { GeminiService } from "../lib/gemini.js";

const requestSchema = z.object({
  mobileTrafficPercent: z.number().min(0).max(100),
  bounceRatePercent: z.number().min(0).max(100),
  topPages: z.array(z.object({ path: z.string(), views: z.number().min(0) })).min(1),
  conversionGoal: z.string().min(3)
});

const gemini = new GeminiService();

export const usageCoachModule: FastifyPluginAsync = async (app) => {
  app.post("/recommend", async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { mobileTrafficPercent, bounceRatePercent, topPages, conversionGoal } = parsed.data;

    const result = await gemini.generateJson<{
      insights: string[];
      prioritizedActions: Array<{
        action: string;
        rationale: string;
        estimatedImpact: "low" | "medium" | "high";
      }>;
      experiments: string[];
    }>(
      "You are SitePilot Usage Coach. Convert traffic patterns into practical optimization actions.",
      [
        `Mobile traffic: ${mobileTrafficPercent}%`,
        `Bounce rate: ${bounceRatePercent}%`,
        `Top pages: ${JSON.stringify(topPages)}`,
        `Conversion goal: ${conversionGoal}`,
        "Prioritize actions by likely business impact."
      ].join("\n")
    );

    return reply.send(result);
  });
};
