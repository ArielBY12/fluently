/**
 * POST /api/generate-lesson  — SERVER-SIDE (Expo Router API route).
 *
 * Body: { lessonId: string, level: CEFRLevel, categories: string[] }
 * Returns: a validated Lesson JSON.
 *
 * The ANTHROPIC_API_KEY lives here, never in the app bundle. If the key is
 * missing or Claude errors, we return 502 and the client falls back to its
 * built-in sample lesson.
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildLessonPrompt, validateLesson, extractJson, CLAUDE_MODEL } from '@/lib/claude';

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

  const { lessonId, level = 'A1', categories = [] } = body ?? {};
  if (!lessonId) return Response.json({ error: 'lessonId required' }, { status: 400 });

  try {
    const anthropic = new Anthropic({ apiKey });
    const { system, user } = buildLessonPrompt(lessonId, level, categories);

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

    const lesson = validateLesson(extractJson(text));
    return Response.json(lesson);
  } catch (err: any) {
    return Response.json({ error: err?.message ?? 'generation failed' }, { status: 502 });
  }
}
