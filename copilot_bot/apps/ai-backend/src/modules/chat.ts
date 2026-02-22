import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { GeminiService } from "../lib/gemini.js";

const moduleIds = [
  "general",
  "onboarding",
  "component-suggester",
  "brand-consistency",
  "usage-coach",
  "seo-copilot"
] as const;

const visualizationTypes = ["kpi", "bar", "progress", "timeline"] as const;

const requestSchema = z.object({
  module: z.enum(moduleIds).default("general"),
  message: z.string().min(2),
  tenantContext: z.string().optional()
});

const visualizationSchema = z.object({
  title: z.string().min(2).max(80),
  type: z.enum(visualizationTypes),
  insight: z.string().min(2).max(220),
  unit: z.string().max(20).optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1).max(40),
        value: z.number()
      })
    )
    .min(1)
    .max(6)
});

const generatedResponseSchema = z.object({
  reply: z.string().min(2),
  visualizations: z.array(visualizationSchema).max(3).default([])
});

type ChatVisualization = z.infer<typeof visualizationSchema>;

const modulePrompts: Record<(typeof moduleIds)[number], string> = {
  general:
    "You are SitePilot Copilot, a concise SaaS website assistant. Give practical recommendations with short steps.",
  onboarding:
    "You are SitePilot Onboarding Copilot. Help generate site structure, page ideas, navigation, and hero copy from business context.",
  "component-suggester":
    "You are SitePilot Component Suggester. Recommend components based on page goals and explain placement clearly.",
  "brand-consistency":
    "You are SitePilot Brand Consistency Guard. Review tone and color usage and suggest aligned rewrites.",
  "usage-coach":
    "You are SitePilot Usage Coach. Turn traffic and behavior patterns into prioritized optimization actions.",
  "seo-copilot":
    "You are SitePilot SEO Copilot. Generate concise SEO improvements: title, meta, keyword usage, alt text, and structured data ideas."
};

const gemini = new GeminiService();

const sanitizeVisualizationText = (raw: string): string => {
  const noFenceMarkers = raw.replace(/```[a-zA-Z0-9_-]*\n?/g, "").replace(/```/g, "");

  const cleanedLines = noFenceMarkers
    .split("\n")
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s*/g, "").replace(/^\s*>\s?/g, ""))
    .map((line) => line.replace(/^\s*(?:[-*•]+|\d+[.)])\s+/g, ""))
    .map((line) => line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1"))
    .map((line) => line.replace(/__(.*?)__/g, "$1").replace(/_(.*?)_/g, "$1"))
    .map((line) => line.replace(/`([^`]+)`/g, "$1"))
    .map((line) => line.replace(/[*`]/g, "").replace(/\s+[-–—]{2,}\s+/g, " "))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => !/^[-*_]{3,}$/.test(line));

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const normalizeVisualizations = (visualizations: ChatVisualization[]): ChatVisualization[] => {
  return visualizations
    .map((visualization) => ({
      ...visualization,
      title: sanitizeVisualizationText(visualization.title),
      insight: sanitizeVisualizationText(visualization.insight),
      unit: visualization.unit ? sanitizeVisualizationText(visualization.unit) : undefined,
      items: visualization.items
        .map((item) => ({
          label: sanitizeVisualizationText(item.label),
          value: Number(item.value)
        }))
        .filter((item) => item.label.length > 0 && Number.isFinite(item.value))
        .slice(0, 6)
    }))
    .filter((visualization) => visualization.title.length > 0 && visualization.items.length > 0)
    .slice(0, 3);
};

export const chatModule: FastifyPluginAsync = async (app) => {
  app.post("/respond", async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { module, message, tenantContext } = parsed.data;
    const contextBlock = tenantContext?.trim() ? `Tenant context:\n${tenantContext.trim()}\n\n` : "";

    const structuredPrompt = [
      contextBlock,
      `User message:\n${message}`,
      "Return strict JSON with keys: reply, visualizations.",
      "reply: Provide a comprehensive, human-readable response formatted in Markdown. Include tables, Mermaid diagrams, and figures where appropriate. Ensure proper separation between paragraphs. Reference and compare with other web development bots (like v0, GitHub Copilot, Webflow AI, Canva, etc.) to illustrate your points.",
      "visualizations: 1 to 3 compact objects that explain the recommendation.",
      "Allowed visualization types: kpi, bar, progress, timeline.",
      "Each visualization must contain title, type, insight, optional unit, items[{label,value}].",
      "If exact numbers are unavailable, use transparent estimated values that still help decision-making."
    ].join("\n\n");

    try {
      const generated = await gemini.generateJson<z.infer<typeof generatedResponseSchema>>(
        `${modulePrompts[module]} Respond with valid JSON only.`,
        structuredPrompt
      );

      const validated = generatedResponseSchema.parse(generated);
      return reply.send({
        module,
        reply: validated.reply,
        visualizations: normalizeVisualizations(validated.visualizations)
      });
    } catch {
      const fallbackPrompt = `${contextBlock}User message:\n${message}\n\nProvide a comprehensive, human-readable response formatted in Markdown. Include tables, Mermaid diagrams, and figures where appropriate. Ensure proper separation between paragraphs. Reference and compare with other web development bots (like v0, GitHub Copilot, etc.) to illustrate your points.`;
      const text = await gemini.generateText(modulePrompts[module], fallbackPrompt);

      return reply.send({
        module,
        reply: text,
        visualizations: []
      });
    }
  });
};
