import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAuth, checkRateLimit, incrementRateLimit } from '@/lib/ai-utils';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Login required to use AI features' }, { status: 401 });
    }

    const { problemTitle, problemDescription, userCode } = await req.json();

    if (!problemTitle || !problemDescription || !userCode) {
      return NextResponse.json({ error: 'Problem details and code required' }, { status: 400 });
    }

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

    let review = '';

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: `You are a code reviewer for DSA problems. Review the student's code and:
1. Point out any bugs or logical errors
2. State the time complexity (Big O)
3. State the space complexity (Big O)
4. Suggest improvements (but don't rewrite the entire solution)

Be concise and helpful. Format your response with clear markdown headings and sections.`,
          },
          {
            role: 'user',
            content: `Problem: ${problemTitle}\nDescription: ${problemDescription}\nStudent's Code:\n\`\`\`javascript\n${userCode}\n\`\`\``,
          },
        ],
      });
      review = response.choices[0]?.message?.content || '';
    }

    await incrementRateLimit(session.user!.id!);

    return NextResponse.json({ review, remaining: remaining - 1 });
  } catch (error) {
    console.error('Review API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong with the AI service. Please try again later.' },
      { status: 500 }
    );
  }
}
