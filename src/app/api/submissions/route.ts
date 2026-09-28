import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { problemId, code, result, passedTests, totalTests } = body;

    if (!problemId || !code || !result) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDb();

    const submission = {
      userId: session?.user?.id || 'anonymous',
      problemId,
      code,
      result,
      passedTests,
      totalTests,
      timestamp: new Date(),
    };

    await db.collection('submissions').insertOne(submission);

    return NextResponse.json({ message: 'Submission saved', submission });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get('problemId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { userId: session.user.id };
    if (problemId) {
      filter.problemId = problemId;
    }

    const submissions = await db
      .collection('submissions')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
