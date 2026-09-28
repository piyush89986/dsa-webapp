'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { runCode, RunnerInput } from '@/lib/runner';
import { Problem, RunResult, TestResult } from '@/types';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session } = useSession();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RunResult | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'console'>('tests');
  const [aiTab, setAiTab] = useState<'hint' | 'review' | 'explain' | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [leftWidth, setLeftWidth] = useState(45);
  const resizerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProblem();
  }, [slug]);

  async function fetchProblem() {
    try {
      const res = await fetch(`/api/problems/${slug}`);
      if (!res.ok) throw new Error('Problem not found');
      const data = await res.json();
      setProblem(data);
      setCode(data.starterCode);
    } catch {
      setProblem(null);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRun() {
    if (!problem) return;
    setRunning(true);
    setResults(null);
    setActiveTab('tests');

    const input: RunnerInput = {
      code,
      functionName: problem.functionName,
      testCases: problem.testCases,
      isSubmit: false,
    };

    const result = await runCode(input);
    setResults(result);
    setRunning(false);
  }

  async function handleSubmit() {
    if (!problem) return;
    setSubmitting(true);
    setResults(null);
    setActiveTab('tests');

    const input: RunnerInput = {
      code,
      functionName: problem.functionName,
      testCases: problem.testCases,
      hiddenTestCases: problem.hiddenTestCases,
      isSubmit: true,
    };

    const result = await runCode(input);
    setResults(result);
    setSubmitting(false);

    const allPassed = result.totalPassed === result.totalTests;
    if (allPassed) {
      setSolved(true);
      showToast('🎉 All test cases passed! Problem solved!', 'success');
    } else {
      showToast(`❌ ${result.totalPassed}/${result.totalTests} test cases passed`, 'error');
    }

    // Save submission
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          code,
          result: allPassed ? 'accepted' : result.error?.includes('Time Limit') ? 'timeout' : 'wrong_answer',
          passedTests: result.totalPassed,
          totalTests: result.totalTests,
        }),
      });
    } catch {
      // silent fail
    }
  }

  async function handleAI(type: 'hint' | 'review' | 'explain') {
    if (!problem) return;
    if (aiTab === type) {
      setAiTab(null);
      return;
    }

    setAiTab(type);
    setAiLoading(true);
    setAiResponse('');

    try {
      const endpoint = `/api/${type}`;
      const body: Record<string, string> = {
        problemTitle: problem.title,
        problemDescription: problem.description,
      };

      if (type === 'review') body.userCode = code;
      if (type === 'hint') body.userCode = code;
      if (type === 'explain') body.problemId = problem.id;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiResponse(data.error || 'Something went wrong');
      } else {
        setAiResponse(data.hint || data.review || data.explanation || 'No response');
      }
    } catch {
      setAiResponse('Failed to connect to AI service. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  // Resizable panel
  const handleMouseDown = useCallback(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(25, Math.min(75, newWidth)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 60px)',
        padding: '1rem',
        gap: '6px',
      }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 40, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 200, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 12 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: '100%' }} />
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 60px)',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <span style={{ fontSize: '3rem' }}>😕</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Problem Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>The problem you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
      }}
    >
      {/* Left: Problem Description */}
      <div style={{
        width: `${leftWidth}%`,
        overflow: 'auto',
        padding: '1.5rem',
        borderRight: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}>
              #{problem.number}
            </span>
            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}>
              {problem.title}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`badge badge-${problem.difficulty.toLowerCase()}`}>
              {problem.difficulty}
            </span>
            <span className="badge badge-topic">
              {problem.topic}
            </span>
            {solved && (
              <span className="badge" style={{
                background: 'var(--accent-green-dim)',
                color: 'var(--accent-green)',
              }}>
                ✓ Solved
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div
          className="prose-dark"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(problem.description) }}
        />

        {/* AI Buttons */}
        {session && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className={`btn ${aiTab === 'hint' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleAI('hint')}
                style={{ fontSize: '0.8rem' }}
              >
                💡 Get Hint
              </button>
              <button
                className={`btn ${aiTab === 'review' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleAI('review')}
                style={{ fontSize: '0.8rem' }}
              >
                🔍 Code Review
              </button>
              <button
                className={`btn ${aiTab === 'explain' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleAI('explain')}
                style={{ fontSize: '0.8rem' }}
              >
                📖 Explain
              </button>
            </div>

            {aiTab && (
              <div className="ai-panel" style={{ marginTop: '0.75rem' }}>
                {aiLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="skeleton" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      AI is thinking...
                    </span>
                  </div>
                ) : (
                  <div className="ai-response">{aiResponse}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resizer */}
      <div
        ref={resizerRef}
        className="resizer"
        onMouseDown={handleMouseDown}
      />

      {/* Right: Code Editor + Results */}
      <div style={{
        width: `${100 - leftWidth}%`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Editor Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 1rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent-yellow)',
              display: 'inline-block',
            }} />
            JavaScript
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-ghost"
              onClick={handleRun}
              disabled={running || submitting}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {running ? '⏳ Running...' : '▶ Run'}
            </button>
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={running || submitting}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {submitting ? '⏳ Submitting...' : '🚀 Submit'}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <MonacoEditor
            height="100%"
            language="javascript"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              padding: { top: 12 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>

        {/* Results Panel */}
        <div style={{
          borderTop: '1px solid var(--border)',
          maxHeight: '280px',
          overflow: 'auto',
          background: 'var(--bg-secondary)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
          }}>
            <button
              className={`tab ${activeTab === 'tests' ? 'active' : ''}`}
              onClick={() => setActiveTab('tests')}
            >
              Test Results
              {results && (
                <span style={{
                  marginLeft: '0.4rem',
                  fontSize: '0.75rem',
                  color: results.totalPassed === results.totalTests
                    ? 'var(--accent-green)'
                    : 'var(--accent-red)',
                }}>
                  ({results.totalPassed}/{results.totalTests})
                </span>
              )}
            </button>
            <button
              className={`tab ${activeTab === 'console' ? 'active' : ''}`}
              onClick={() => setActiveTab('console')}
            >
              Console
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '0.75rem 1rem' }}>
            {running || submitting ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                padding: '1rem 0',
              }}>
                <span className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%' }} />
                Running your code...
              </div>
            ) : results?.error && results.results.length === 0 ? (
              <div style={{
                padding: '0.75rem',
                background: 'var(--accent-red-dim)',
                borderRadius: '8px',
                color: 'var(--accent-red)',
                fontSize: '0.85rem',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {results.error}
              </div>
            ) : results ? (
              activeTab === 'tests' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {results.results.map((r: TestResult, i: number) => (
                    <div
                      key={i}
                      className="animate-fade-in"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        background: r.passed ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
                        border: `1px solid ${r.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: r.isHidden ? 0 : '0.3rem',
                      }}>
                        <span style={{
                          fontSize: '0.9rem',
                          color: r.passed ? 'var(--accent-green)' : 'var(--accent-red)',
                        }}>
                          {r.passed ? '✓' : '✗'}
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: r.passed ? 'var(--accent-green)' : 'var(--accent-red)',
                        }}>
                          {r.isHidden ? `Hidden Test ${i + 1}` : `Test ${i + 1}`}
                          {r.passed ? ' — Passed' : ' — Failed'}
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}>
                          {r.runtime}ms
                        </span>
                      </div>
                      {!r.isHidden && !r.passed && (
                        <div style={{
                          fontSize: '0.8rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          marginTop: '0.3rem',
                        }}>
                          <div style={{ color: 'var(--text-muted)' }}>
                            Input: {JSON.stringify(r.input)}
                          </div>
                          <div style={{ color: 'var(--accent-green)' }}>
                            Expected: {JSON.stringify(r.expected)}
                          </div>
                          <div style={{ color: 'var(--accent-red)' }}>
                            Got: {r.error ? `Error: ${r.error}` : JSON.stringify(r.actual)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}>
                  {results.results.flatMap(r => r.consoleOutput).length > 0 ? (
                    results.results.flatMap(r => r.consoleOutput).map((line, i) => (
                      <div key={i} style={{ marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>{'>'}</span>
                        {line}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>
                      No console output. Use console.log() in your code to see output here.
                    </div>
                  )}
                </div>
              )
            ) : (
              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                padding: '1rem 0',
                textAlign: 'center',
              }}>
                Click &quot;Run&quot; to test your code or &quot;Submit&quot; to check all test cases.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Simple markdown to HTML converter
function markdownToHtml(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[\s-:]+$/.test(c))) return '';
      const tag = 'td';
      return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`;
    })
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br/>');

  // Wrap tables
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table>$1</table>');
  // Clean up multiple table tags
  html = html.replace(/<\/table><br\/><table>/g, '');

  return `<p>${html}</p>`;
}
