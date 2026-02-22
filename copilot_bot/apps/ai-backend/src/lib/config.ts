import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4001),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-3.1-pro-preview")
});

export const env = envSchema.parse(process.env);
