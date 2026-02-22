import { FastifyPluginAsync } from "fastify";
import { onboardingModule } from "./onboarding.js";
import { componentSuggesterModule } from "./component-suggester.js";
import { brandConsistencyModule } from "./brand-consistency.js";
import { usageCoachModule } from "./usage-coach.js";
import { seoCopilotModule } from "./seo-copilot.js";
import { chatModule } from "./chat.js";
import { contentManagerModule } from "./content-manager.js";

export const aiModules: FastifyPluginAsync = async (app) => {
  await app.register(chatModule, { prefix: "/chat" });
  await app.register(onboardingModule, { prefix: "/onboarding" });
  await app.register(componentSuggesterModule, { prefix: "/component-suggester" });
  await app.register(brandConsistencyModule, { prefix: "/brand-consistency" });
  await app.register(usageCoachModule, { prefix: "/usage-coach" });
  await app.register(seoCopilotModule, { prefix: "/seo-copilot" });
  await app.register(contentManagerModule, { prefix: "/content-manager" });
};
