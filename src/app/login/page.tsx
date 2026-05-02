'use client';
// src/app/login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [collegeId, setCollegeId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [course, setCourse] = useState('BCS');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const courses = ['BCS', 'CSE', 'IT', 'ECE', 'MECHANICAL', 'CIVIL', 'ELECTRICAL', 'OTHER'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: tab,
          collegeId,
          password,
          ...(tab === 'register' && { displayName, course }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      localStorage.setItem('cv_token', data.token);
      localStorage.setItem('cv_displayName', data.displayName);
      localStorage.setItem('cv_anonName', data.anonName);
      localStorage.setItem('cv_anonId', data.anonId);
      router.push('/');
    } catch {
      setError('Server se connection nahi ho pa raha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1rem',
    }}>
      <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: 28,
          }}>🎓</div>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.5px' }}>CampusVoice</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            Apni awaaz, bina darr ke
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
            background: 'var(--green-light)', color: 'var(--green-text)',
            fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-full)',
          }}>
            🔒 Poori tarah anonymous platform
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '2rem',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--surface2)',
            borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: '1.5rem',
          }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                flex: 1, padding: '8px 0', fontSize: 14, fontWeight: 500,
                border: 'none', borderRadius: 6, transition: 'all 0.2s',
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: tab === t ? 'var(--shadow)' : 'none',
              }}>
                {t === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                College ID
              </label>
              <input
                type="text" value={collegeId} onChange={e => setCollegeId(e.target.value.toUpperCase())}
                placeholder="BCS2023186" required
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 14,
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)', color: 'var(--text)', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--green)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {tab === 'register' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Display Name (Username)
                  </label>
                  <input
                    type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Apna username dalo" required
                    style={{
                      width: '100%', padding: '11px 14px', fontSize: 14,
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg)', color: 'var(--text)', outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--green)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    Course
                  </label>
                  <select value={course} onChange={e => setCourse(e.target.value)} required
                    style={{
                      width: '100%', padding: '11px 14px', fontSize: 14,
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg)', color: 'var(--text)', outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--green)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  >
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 14,
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)', color: 'var(--text)', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--green)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)',
                padding: '10px 14px', fontSize: 13, color: '#991B1B', marginBottom: '1rem',
              }}>⚠️ {error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', fontSize: 15, fontWeight: 600,
              background: loading ? 'var(--green-dark)' : 'var(--green)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
              transition: 'background 0.2s', letterSpacing: '0.2px',
            }}>
              {loading ? '⏳ Wait karo...' : tab === 'login' ? 'Login Karo' : 'Account Banao'}
            </button>
          </form>

          <div style={{
            marginTop: '1.25rem', paddingTop: '1.25rem',
            borderTop: '1px solid var(--border)',
            fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.8,
          }}>
            {tab === 'register' ? (
              <>Pehle register karo, phir login kro.<br />Real name nahi daalna, sirf username dalo!</>
            ) : (
              <>Sirf registered students hi login kar sakte hain.<br />Aapki real identity kabhi kisi ko nahi dikhegi — guaranteed.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
