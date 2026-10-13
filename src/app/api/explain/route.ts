import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAuth, checkRateLimit, incrementRateLimit } from '@/lib/ai-utils';
import { getDb } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Login required to use AI features' }, { status: 401 });
    }

    const { problemId, problemTitle, problemDescription } = await req.json();

    if (!problemId || !problemTitle || !problemDescription) {
      return NextResponse.json({ error: 'Problem details required' }, { status: 400 });
    }

    // Check if user has solved this problem
    const db = await getDb();
    const solvedSubmission = await db.collection('submissions').findOne({
      userId: session.user!.id,
      problemId,
      result: 'accepted',
    });

    if (!solvedSubmission) {
      return NextResponse.json(
        { error: 'You must solve this problem first to see the explanation.' },
        { status: 403 }
      );
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

    let explanation = '';

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: `You are a DSA tutor. Provide a detailed step-by-step walkthrough of the optimal solution for this problem.
Include:
1. Approach explanation (intuition)
2. Step-by-step algorithm
3. The JavaScript solution code
4. Time & space complexity analysis
5. Edge cases to consider

Format your response clearly with markdown headings and code blocks.`,
          },
          {
            role: 'user',
            content: `Problem: ${problemTitle}\nDescription: ${problemDescription}`,
          },
        ],
      });
      explanation = response.choices[0]?.message?.content || '';
    }

    await incrementRateLimit(session.user!.id!);

    return NextResponse.json({ explanation, remaining: remaining - 1 });
  } catch (error) {
    console.error('Explain API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong with the AI service. Please try again later.' },
      { status: 500 }
    );
  }
}
