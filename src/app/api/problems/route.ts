import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);

    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (topic && topic !== 'all') {
      filter.topic = topic;
    }

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const problems = await db
      .collection('problems')
      .find(filter, {
        projection: {
          id: 1,
          number: 1,
          title: 1,
          slug: 1,
          topic: 1,
          difficulty: 1,
        },
      })
      .sort({ number: 1 })
      .toArray();

    return NextResponse.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problems' },
      { status: 500 }
    );
  }
}
