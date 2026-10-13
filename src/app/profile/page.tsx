'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileData {
  totalSolved: number;
  topicCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  recentSubmissions: Array<{
    problemId: string;
    problemTitle: string;
    problemSlug: string;
    result: string;
    passedTests: number;
    totalTests: number;
    timestamp: string;
  }>;
}

const topicColors: Record<string, string> = {
  Basic: 'var(--accent-cyan)',
  Loops: 'var(--accent-blue)',
  Patterns: 'var(--accent-purple)',
  Arrays: 'var(--accent-green)',
  Strings: 'var(--accent-orange)',
  Sorting: 'var(--accent-pink)',
};

const topicTotals: Record<string, number> = {
  Basic: 6,
  Loops: 7,
  Patterns: 8,
  Arrays: 18,
  Strings: 4,
  Sorting: 3,
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: 32 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'white',
          }}>
            {session?.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{session?.user?.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="animate-slide-up" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.75rem',
        marginBottom: '2rem',
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {profile?.totalSolved || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Solved</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)' }}>
            {profile?.difficultyCounts?.Easy || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Easy</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>
            {profile?.difficultyCounts?.Medium || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Medium</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-red)' }}>
            {profile?.difficultyCounts?.Hard || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Hard</div>
        </div>
      </div>

      {/* Progress by Topic */}
      <div className="card animate-slide-up" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Progress by Topic
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(topicTotals).map(([topicName, total]) => {
            const solved = profile?.topicCounts?.[topicName] || 0;
            const percent = total > 0 ? (solved / total) * 100 : 0;
            return (
              <div key={topicName}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem',
                  fontSize: '0.85rem',
                }}>
                  <span style={{ fontWeight: 600 }}>{topicName}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{solved}/{total}</span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percent}%`,
                    background: topicColors[topicName] || 'var(--accent-blue)',
                    borderRadius: '4px',
                    transition: 'width 1s ease-out',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="card animate-slide-up">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Recent Submissions
        </h2>
        {!profile?.recentSubmissions?.length ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
            No submissions yet. Start solving problems!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {profile.recentSubmissions.map((sub, i) => (
              <Link
                key={i}
                href={`/problem/${sub.problemSlug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  background: 'var(--bg-tertiary)',
                  transition: 'all 0.15s ease',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    color: sub.result === 'accepted' ? 'var(--accent-green)' : 'var(--accent-red)',
                    fontSize: '1rem',
                  }}>
                    {sub.result === 'accepted' ? '✓' : '✗'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {sub.problemTitle}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: sub.result === 'accepted' ? 'var(--accent-green)' : 'var(--accent-red)',
                    fontWeight: 600,
                  }}>
                    {sub.passedTests}/{sub.totalTests}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(sub.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
