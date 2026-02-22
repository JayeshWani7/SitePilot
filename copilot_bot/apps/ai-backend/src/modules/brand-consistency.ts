import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { GeminiService } from "../lib/gemini.js";

const requestSchema = z.object({
  brandTone: z.string().min(3),
  brandColors: z.array(z.string()).min(1),
  candidateText: z.string().min(10),
  candidateColors: z.array(z.string()).optional()
});

const gemini = new GeminiService();

export const brandConsistencyModule: FastifyPluginAsync = async (app) => {
  app.post("/check", async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { brandTone, brandColors, candidateText, candidateColors = [] } = parsed.data;

    const result = await gemini.generateJson<{
      score: number;
      toneMatch: "aligned" | "needs-adjustment";
      colorMatch: "aligned" | "needs-adjustment";
      issues: string[];
      rewriteSuggestion: string;
      colorRecommendations: string[];
    }>(
      "You are SitePilot Brand Guard. Evaluate alignment against brand standards with clear fixes.",
      [
        `Brand tone: ${brandTone}`,
        `Brand colors: ${brandColors.join(", ")}`,
        `Candidate text: ${candidateText}`,
        `Candidate colors: ${candidateColors.join(", ") || "not provided"}`,
        "Score must be 0-100. Keep recommendations practical."
      ].join("\n")
    );

    return reply.send(result);
  });
};
