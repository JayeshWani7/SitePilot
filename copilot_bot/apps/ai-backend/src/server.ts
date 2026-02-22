import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./lib/config.js";
import { aiModules } from "./modules/index.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.CORS_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"]
});

app.get("/health", async () => ({ status: "ok" }));

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  return reply.status(500).send({ message: error.message });
});

await app.register(aiModules, { prefix: "/api/ai" });

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`AI backend running on http://localhost:${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
