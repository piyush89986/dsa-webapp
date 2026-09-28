'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      suppressHydrationWarning
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          textDecoration: 'none',
        }}>
          <span style={{
            fontSize: '1.5rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}>
            {'<DSA/>'}
          </span>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            Practice
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <Link
            href="/"
            className="btn btn-ghost"
            style={{
              fontSize: '0.85rem',
              padding: '0.4rem 0.8rem',
              borderColor: pathname === '/' ? 'var(--accent-blue)' : undefined,
              color: pathname === '/' ? 'var(--accent-blue)' : undefined,
            }}
          >
            Problems
          </Link>
          
          {status === 'authenticated' && (
            <Link
              href="/profile"
              className="btn btn-ghost"
              style={{
                fontSize: '0.85rem',
                padding: '0.4rem 0.8rem',
                borderColor: pathname === '/profile' ? 'var(--accent-blue)' : undefined,
                color: pathname === '/profile' ? 'var(--accent-blue)' : undefined,
              }}
            >
              Profile
            </Link>
          )}

          {status === 'loading' ? (
            <div className="skeleton" style={{ width: 80, height: 34 }} />
          ) : status === 'authenticated' ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'white',
                }}>
                  {session.user?.name?.[0]?.toUpperCase() || '?'}
                </span>
                {session.user?.name}
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  minWidth: '150px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                }}>
                  <button
                    onClick={() => signOut()}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'var(--accent-red)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-red-dim)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
