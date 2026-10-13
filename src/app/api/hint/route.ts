import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAuth, checkRateLimit, incrementRateLimit, getCachedHint, cacheHint } from '@/lib/ai-utils';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Login required to use AI features' }, { status: 401 });
    }

    const { problemTitle, problemDescription, userCode } = await req.json();

    if (!problemTitle || !problemDescription) {
      return NextResponse.json({ error: 'Problem details required' }, { status: 400 });
    }

    // Check cache first
    const cachedHint = await getCachedHint(problemTitle);
    if (cachedHint) {
      return NextResponse.json({ hint: cachedHint, cached: true });
    }

    // Check rate limit
    const { allowed, remaining } = await checkRateLimit(session.user!.id!);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily AI request limit reached (10/day). Try again tomorrow!' },
        { status: 429 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    let hint = '';

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: 'You are an encouraging DSA mentor who explains concepts in natural Hinglish (Hindi written in English/Latin script, e.g., "Pehle socho ki...", "Aapko formula use karna hai..."). ALWAYS give the hint in friendly Hinglish (2-3 sentences max). DO NOT give the full solution or full code. Just give a conceptual nudge to help the student solve it themselves.',
          },
          {
            role: 'user',
            content: `Problem: ${problemTitle}\nDescription: ${problemDescription}\n${userCode ? `Student's current code:\n${userCode}` : ''}`,
          },
        ],
      });
      hint = response.choices[0]?.message?.content || '';
    }

    // Cache the hint
    await cacheHint(problemTitle, hint);
    await incrementRateLimit(session.user!.id!);

    return NextResponse.json({ hint, remaining: remaining - 1 });
  } catch (error) {
    console.error('Hint API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong with the AI service. Please try again later.' },
      { status: 500 }
    );
  }
}
