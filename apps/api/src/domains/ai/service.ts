import { z } from 'zod';
import { AiService } from '../../services/ai/service';
import { DigitalOceanInferenceProvider } from '../../services/ai/providers/digitalocean';
import type { AiProviderName } from '../../services/ai/provider';

export const guestReplyRequestSchema = z.object({
  guestName: z.string().min(1).default('Guest'),
  propertyName: z.string().min(1).default('your stay'),
  message: z.string().min(1),
  amenities: z.array(z.string()).default([]),
  tone: z.enum(['warm', 'concise', 'formal']).default('warm')
});

export type GuestReplyRequest = z.infer<typeof guestReplyRequestSchema>;

export interface GuestReplyResult {
  reply: string;
  provider: AiProviderName | 'fallback';
  model: string;
  promptTokens: number;
  completionTokens: number;
}

function aiConfigured(): boolean {
  return Boolean(process.env.DO_INFERENCE_API_KEY);
}

function buildPrompt(input: GuestReplyRequest): string {
  const amenities = input.amenities.length ? `Known amenities: ${input.amenities.join(', ')}.` : '';
  return [
    `You are the host of "${input.propertyName}", a short-stay rental.`,
    `Write a ${input.tone}, helpful reply to the guest's message below. Keep it under 80 words, address them by name, and do not invent facts you were not given.`,
    amenities,
    `Guest (${input.guestName}) wrote: "${input.message}"`,
    'Reply:'
  ]
    .filter(Boolean)
    .join('\n');
}

// Deterministic, network-free reply used when no AI key is configured.
function fallbackReply(input: GuestReplyRequest): string {
  return `Hi ${input.guestName}, thanks for reaching out about ${input.propertyName}! I've noted your message and will get back to you shortly with the details. If it's urgent, just let me know and I'll prioritise it. — Your host`;
}

/**
 * Generates AI guest replies. Uses the DigitalOcean Inference provider when
 * DO_INFERENCE_API_KEY is set; otherwise returns a courteous templated reply so
 * the feature degrades gracefully (and is testable without network/keys).
 */
export class GuestReplyService {
  private readonly model = process.env.DO_INFERENCE_MODEL ?? 'llama3.3-70b-instruct';

  constructor(private readonly ai?: AiService) {}

  async generate(rawInput: unknown): Promise<GuestReplyResult> {
    const input = guestReplyRequestSchema.parse(rawInput);

    if (!aiConfigured()) {
      return { reply: fallbackReply(input), provider: 'fallback', model: 'fallback', promptTokens: 0, completionTokens: 0 };
    }

    const ai = this.ai ?? new AiService(new Map([['digitalocean', new DigitalOceanInferenceProvider(process.env.DO_INFERENCE_API_KEY as string)]]));
    const result = await ai.generate({ provider: 'digitalocean', model: this.model, prompt: buildPrompt(input), temperature: 0.5 });

    // If the model returns nothing, fall back rather than surface an empty reply.
    const reply = result.content || fallbackReply(input);
    return { reply, provider: 'digitalocean', model: this.model, promptTokens: result.promptTokens, completionTokens: result.completionTokens };
  }
}

export const __test = { buildPrompt, fallbackReply };
