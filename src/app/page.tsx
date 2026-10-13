'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ProblemSummary {
  _id: string;
  id: string;
  number: number;
  title: string;
  slug: string;
  topic: string;
  difficulty: string;
}

const topics = ['all', 'Basic', 'Loops', 'Patterns', 'Arrays', 'Strings', 'Sorting'];
const difficulties = ['all', 'Easy', 'Medium', 'Hard'];

const topicIcons: Record<string, string> = {
  Basic: '🔧',
  Loops: '🔄',
  Patterns: '🎨',
  Arrays: '📦',
  Strings: '🔤',
  Sorting: '⚡',
};

export default function HomePage() {
  const { data: session } = useSession();
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProblems();
  }, [topic, difficulty, search]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSolvedProblems();
    }
  }, [session]);

  async function fetchProblems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (topic !== 'all') params.set('topic', topic);
      if (difficulty !== 'all') params.set('difficulty', difficulty);
      if (search) params.set('search', search);

      const res = await fetch(`/api/problems?${params}`);
      const data = await res.json();
      setProblems(Array.isArray(data) ? data : []);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSolvedProblems() {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const data = await res.json();
        const solved = new Set<string>(
          data
            .filter((s: { result: string }) => s.result === 'accepted')
            .map((s: { problemId: string }) => s.problemId)
        );
        setSolvedIds(solved);
      }
    } catch {
      // ignore
    }
  }

  const stats = {
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard: problems.filter(p => p.difficulty === 'Hard').length,
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Hero Section */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: '0.75rem',
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Master DSA in JavaScript
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Practice problems, run code in your browser, and get AI-powered feedback.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="animate-slide-up" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem',
        marginBottom: '2rem',
      }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--accent-blue)' },
          { label: 'Easy', value: stats.easy, color: 'var(--accent-green)' },
          { label: 'Medium', value: stats.medium, color: 'var(--accent-yellow)' },
          { label: 'Hard', value: stats.hard, color: 'var(--accent-red)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="animate-slide-up" style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="🔍 Search problems..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          style={{ flex: '1', minWidth: '200px' }}
        />
        <select
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="select"
        >
          {topics.map(t => (
            <option key={t} value={t}>
              {t === 'all' ? '📂 All Topics' : `${topicIcons[t] || ''} ${t}`}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          className="select"
        >
          {difficulties.map(d => (
            <option key={d} value={d}>
              {d === 'all' ? '🎯 All Levels' : d}
            </option>
          ))}
        </select>
      </div>

      {/* Problem Table */}
      <div className="card animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Status', '#', 'Title', 'Topic', 'Difficulty'].map(h => (
                <th key={h} style={{
                  padding: '0.85rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-tertiary)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: '0.85rem 1rem' }}>
                      <div className="skeleton" style={{ height: 20, width: j === 2 ? '60%' : '40%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}>
                  No problems found matching your filters.
                </td>
              </tr>
            ) : (
              problems.map((problem, idx) => (
                <tr
                  key={problem.id}
                  className="animate-fade-in"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    animationDelay: `${idx * 30}ms`,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.85rem 1rem', width: '60px' }}>
                    {solvedIds.has(problem.id) ? (
                      <span style={{
                        color: 'var(--accent-green)',
                        fontSize: '1.2rem',
                      }}>✓</span>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: '2px solid var(--border)',
                      }} />
                    )}
                  </td>
                  <td style={{
                    padding: '0.85rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    width: '60px',
                  }}>
                    {problem.number}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Link
                      href={`/problem/${problem.slug}`}
                      style={{
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-blue)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge badge-topic">
                      {topicIcons[problem.topic] || ''} {problem.topic}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className={`badge badge-${problem.difficulty.toLowerCase()}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
