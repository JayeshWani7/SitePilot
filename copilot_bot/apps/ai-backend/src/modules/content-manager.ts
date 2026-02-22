import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { GeminiService } from "../lib/gemini.js";

const generateSiteRequestSchema = z.object({
    tenantContext: z.string().optional(),
    requirements: z.string().min(5),
    planLimits: z.object({
        maxPages: z.number().int().min(1).default(5),
        allowedComponents: z.array(z.string()).default(["header", "text", "image", "gallery", "form", "footer"])
    }).optional()
});

const pageSchema = z.object({
    path: z.string(),
    title: z.string(),
    components: z.array(z.object({
        type: z.string(),
        props: z.record(z.any()).optional()
    }))
});

const generatedSiteSchema = z.object({
    navigation: z.array(z.object({
        label: z.string(),
        path: z.string()
    })),
    pages: z.array(pageSchema),
    theme: z.object({
        primaryColor: z.string().optional(),
        fontFamily: z.string().optional()
    }).optional()
});

const gemini = new GeminiService();

export const contentManagerModule: FastifyPluginAsync = async (app) => {
    app.post("/generate-site", async (request, reply) => {
        const parsed = generateSiteRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten() });
        }

        const { tenantContext, requirements, planLimits } = parsed.data;
        const contextBlock = tenantContext?.trim() ? `Tenant Context:\n${tenantContext.trim()}\n\n` : "";
        const limitsBlock = planLimits ? `Plan Limits:\nMax Pages: ${planLimits.maxPages}\nAllowed Components: ${planLimits.allowedComponents.join(", ")}\n\n` : "";

        const systemPrompt = `You are SitePilot Content Manager. Your job is to generate a structured website layout (pages, navigation, and components) based on the user's requirements. Maintain consistency in design and enforce the provided plan limits. Respond with valid JSON only matching the requested schema.`;

        const userPrompt = `${contextBlock}${limitsBlock}User Requirements:\n${requirements}\n\Generate a structured site with navigation, pages, and an optional theme. Each page should have a list of components (type and optional props) to be rendered. Only use allowed components if specified.`;

        try {
            const generated = await gemini.generateJson<z.infer<typeof generatedSiteSchema>>(
                systemPrompt,
                userPrompt
            );

            // We can add some runtime validation here to strictly enforce plan limits
            // just in case the LLM hallucinates beyond limits.
            const maxPages = planLimits?.maxPages ?? 5;
            if (generated.pages.length > maxPages) {
                generated.pages = generated.pages.slice(0, maxPages);
            }

            const allowedComponents = planLimits?.allowedComponents;
            if (allowedComponents) {
                generated.pages.forEach(page => {
                    page.components = page.components.filter(comp => allowedComponents.includes(comp.type));
                });
            }

            const validated = generatedSiteSchema.parse(generated);
            return reply.send(validated);
        } catch (error) {
            return reply.status(500).send({ error: "Failed to generate structured site content." });
        }
    });
};
