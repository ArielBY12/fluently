/**
 * POST /api/placement-quiz  — SERVER-SIDE (Expo Router API route).
 *
 * Body: { claimedLevel: CEFRLevel }
 * Returns: { questions: PlacementQuestion[] }
 *
 * On any error the client falls back to the built-in sample quiz.
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildQuizPrompt, validateQuiz, extractJson, CLAUDE_MODEL } from '@/lib/claude';

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 502 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const claimedLevel = body?.claimedLevel ?? 'A1';

  try {
    const anthropic = new Anthropic({ apiKey });
    const { system, user } = buildQuizPrompt(claimedLevel);

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const questions = validateQuiz(extractJson(text));
    return Response.json({ questions });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? 'generation failed' }, { status: 502 });
  }
}
