import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get all accepted submissions for this user
    const submissions = await db
      .collection('submissions')
      .find({ userId: session.user.id })
      .sort({ timestamp: -1 })
      .toArray();

    // Get unique solved problem IDs
    const solvedProblemIds = [
      ...new Set(
        submissions
          .filter(s => s.result === 'accepted')
          .map(s => s.problemId)
      ),
    ];

    // Get problem details for solved problems
    const problems = await db
      .collection('problems')
      .find({ id: { $in: solvedProblemIds } })
      .toArray();

    // Count by topic
    const topicCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};

    problems.forEach(p => {
      topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1;
      difficultyCounts[p.difficulty] = (difficultyCounts[p.difficulty] || 0) + 1;
    });

    // Recent submissions (last 10)
    const recentSubmissions = submissions.slice(0, 10).map(s => ({
      problemId: s.problemId,
      result: s.result,
      passedTests: s.passedTests,
      totalTests: s.totalTests,
      timestamp: s.timestamp,
    }));

    // Get problem titles for recent submissions
    const recentProblemIds = recentSubmissions.map(s => s.problemId);
    const recentProblems = await db
      .collection('problems')
      .find({ id: { $in: recentProblemIds } })
      .toArray();

    const problemMap = Object.fromEntries(
      recentProblems.map(p => [p.id, { title: p.title, slug: p.slug }])
    );

    return NextResponse.json({
      totalSolved: solvedProblemIds.length,
      topicCounts,
      difficultyCounts,
      recentSubmissions: recentSubmissions.map(s => ({
        ...s,
        problemTitle: problemMap[s.problemId]?.title || 'Unknown',
        problemSlug: problemMap[s.problemId]?.slug || '',
      })),
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
