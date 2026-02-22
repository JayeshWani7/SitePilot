import { env } from "./config.js";

export class GeminiService {
  private readonly apiKey = env.GEMINI_API_KEY;
  private readonly model = env.GEMINI_MODEL;

  private async request(systemInstruction: string, userPrompt: string, responseMimeType?: string) {
    const generationConfig = responseMimeType
      ? {
          responseMimeType,
          temperature: 0.3
        }
      : {
          temperature: 0.3
        };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig,
          contents: [{ role: "user", parts: [{ text: userPrompt }] }]
        })
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini API request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ??
      "";

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return text;
  }

  async generateJson<T>(systemInstruction: string, userPrompt: string): Promise<T> {
    const text = await this.request(
      `${systemInstruction}\nRespond with valid JSON only.`,
      userPrompt,
      "application/json"
    );

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("Gemini response was not valid JSON");
    }
  }

  async generateText(systemInstruction: string, userPrompt: string): Promise<string> {
    return this.request(systemInstruction, userPrompt);
  }
}
