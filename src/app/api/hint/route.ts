import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set ANTHROPIC_API_KEY.' },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a DSA tutor. Give a SHORT hint for this problem. DO NOT give the full solution or any code. Just give a conceptual nudge to help the student figure it out themselves.

Problem: ${problemTitle}
Description: ${problemDescription}
${userCode ? `Student's current code:\n${userCode}` : ''}

Give a brief, encouraging hint (2-3 sentences max).`,
        },
      ],
    });

    const hint = message.content[0].type === 'text' ? message.content[0].text : '';

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
