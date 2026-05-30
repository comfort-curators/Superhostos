import type {
  AiGenerateRequest,
  AiGenerateResponse,
  AiProvider,
} from "./provider";

export class AiService {
  constructor(private readonly providers: Map<string, AiProvider>) {}

  async generate(input: AiGenerateRequest): Promise<AiGenerateResponse> {
    const provider = this.providers.get(input.provider);
    if (!provider) {
      throw new Error(`Unsupported provider: ${input.provider}`);
    }

    return provider.generate(input);
  }
}
