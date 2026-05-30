import type {
  AiGenerateRequest,
  AiGenerateResponse,
  AiProvider,
} from "../provider";

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * DigitalOcean GradientAI Serverless Inference provider.
 *
 * Talks to the OpenAI-compatible chat-completions endpoint
 * (default https://inference.do-ai.run/v1). Configure via:
 *   DO_INFERENCE_API_KEY  (required to activate)
 *   DO_INFERENCE_BASE_URL (optional, defaults to the DO endpoint)
 *   DO_INFERENCE_MODEL    (optional, default model)
 */
export class DigitalOceanInferenceProvider implements AiProvider {
  readonly name = "digitalocean" as const;

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = process.env.DO_INFERENCE_BASE_URL ??
      "https://inference.do-ai.run/v1",
  ) {}

  async generate(input: AiGenerateRequest): Promise<AiGenerateResponse> {
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: input.model,
          messages: [{ role: "user", content: input.prompt }],
          temperature: input.temperature,
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `DigitalOcean Inference error ${response.status}: ${detail.slice(0, 300)}`,
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;
    return {
      content: data.choices?.[0]?.message?.content?.trim() ?? "",
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    };
  }
}
