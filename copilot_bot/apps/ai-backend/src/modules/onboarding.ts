import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { GeminiService } from "../lib/gemini.js";

const requestSchema = z.object({
  tenantName: z.string().min(2),
  businessDescription: z.string().min(10),
  audience: z.string().min(3),
  goals: z.string().min(3)
});

const gemini = new GeminiService();

export const onboardingModule: FastifyPluginAsync = async (app) => {
  app.post("/generate-site", async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { tenantName, businessDescription, audience, goals } = parsed.data;

    const result = await gemini.generateJson<{
      brandProfile: {
        tone: string;
        colors: string[];
        typographyStyle: string;
      };
      pages: Array<{ title: string; slug: string; summary: string; sections: string[] }>;
      nav: string[];
      hero: { headline: string; subheadline: string; primaryCta: string; secondaryCta: string };
    }>(
      "You are SitePilot Onboarding Copilot. Generate a production-ready starter website blueprint.",
      [
        `Tenant: ${tenantName}`,
        `Business: ${businessDescription}`,
        `Audience: ${audience}`,
        `Goals: ${goals}`,
        "Output keys: brandProfile, pages, nav, hero.",
        "Pages should be practical and conversion oriented."
      ].join("\n")
    );

    return reply.send(result);
  });
};
