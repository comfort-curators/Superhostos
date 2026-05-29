export type AiProviderName = 'openai' | 'anthropic' | 'gemini';

export interface AiGenerateRequest {
  provider: AiProviderName;
  model: string;
  prompt: string;
  temperature: number;
}

export interface AiGenerateResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

export interface AiProvider {
  readonly name: AiProviderName;
  generate(input: AiGenerateRequest): Promise<AiGenerateResponse>;
}
