import { getDb } from '@/lib/mongodb';
import { auth } from '@/lib/auth';

const AI_RATE_LIMIT = 10; // per user per day

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];

  const user = await db.collection('users').findOne({ _id: userId as unknown as import('mongodb').ObjectId });

  if (!user) {
    return { allowed: false, remaining: 0 };
  }

  // Reset count if it's a new day
  if (user.aiRequestDate !== today) {
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { aiRequestCount: 0, aiRequestDate: today } }
    );
    return { allowed: true, remaining: AI_RATE_LIMIT };
  }

  if (user.aiRequestCount >= AI_RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: AI_RATE_LIMIT - user.aiRequestCount };
}

export async function incrementRateLimit(userId: string): Promise<void> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];

  await db.collection('users').updateOne(
    { _id: userId as unknown as import('mongodb').ObjectId },
    {
      $inc: { aiRequestCount: 1 },
      $set: { aiRequestDate: today },
    }
  );
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export async function getCachedHint(problemId: string): Promise<string | null> {
  const db = await getDb();
  const cached = await db.collection('hint_cache').findOne({ problemId });
  return cached?.hint || null;
}

export async function cacheHint(problemId: string, hint: string): Promise<void> {
  const db = await getDb();
  await db.collection('hint_cache').updateOne(
    { problemId },
    { $set: { problemId, hint, updatedAt: new Date() } },
    { upsert: true }
  );
}
