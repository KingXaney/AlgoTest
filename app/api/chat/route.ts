import {convertToModelMessages, streamText, stepCountIs, type UIMessage} from "ai";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {z} from "zod";
import {ADVISOR_SYSTEM_PROMPT} from "@/lib/ai/system-prompt";
import {buildTools} from "@/lib/ai/tools";
import {getCurrentUserId} from "@/lib/actions/watchlist.actions";

// The Google provider defaults to GOOGLE_GENERATIVE_AI_API_KEY; this project keeps the same key
// under GEMINI_API_KEY (shared with the inngest news pipeline), so we wire it explicitly.
const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const runtime = 'nodejs'; // mongoose + better-auth need Node, not edge
export const maxDuration = 30;

// Bounds on what one request may cost: history is trimmed to the newest turns and
// the total text is capped before anything reaches the model.
const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 24_000;
const MAX_OUTPUT_TOKENS = 2_048;

const bodySchema = z.object({
    messages: z.array(z.object({
        id: z.string().max(200),
        role: z.enum(['user', 'assistant', 'system']),
        parts: z.array(z.record(z.string(), z.unknown())).max(50),
    }).passthrough()).min(1).max(200),
});

const textLength = (message: UIMessage): number =>
    message.parts.reduce((n, part) => n + (part.type === 'text' ? part.text.length : 0), 0);

export async function POST(req: Request) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return new Response('Unauthorized', {status: 401});
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return new Response('Bad request', {status: 400});
    }
    // Shape-checked above; the SDK's UIMessage union is too wide to express in zod.
    const messages = parsed.data.messages.slice(-MAX_MESSAGES) as unknown as UIMessage[];
    if (messages.reduce((n, m) => n + textLength(m), 0) > MAX_TOTAL_CHARS) {
        return new Response('Conversation too long — start a new chat.', {status: 413});
    }

    const result = streamText({
        model: google('gemini-2.5-flash'),
        system: ADVISOR_SYSTEM_PROMPT,
        messages: await convertToModelMessages(messages),
        tools: buildTools(userId),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        stopWhen: stepCountIs(5), // allow tool → model → tool chains, capped
    });

    return result.toUIMessageStreamResponse();
}
