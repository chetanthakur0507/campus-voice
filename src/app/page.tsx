'use client';
// src/app/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ComplaintCard from '@/components/ComplaintCard';
import PostBox from '@/components/PostBox';

const CATEGORIES = ['all','Canteen','Hostel','Faculty','Infrastructure','Exams','Administration','Transport','Library'];

interface Complaint {
  id: string; anonId: string; anonName: string; category: string;
  text: string; imageUrl?: string; upvotes: number; downvotes: number;
  status: string; comments: Array<{id:string;anonName:string;text:string;timeAgo:string}>;
  timeAgo: string;
}

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [anonName, setAnonName] = useState('');
  const [anonId, setAnonId] = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'feed' | 'trending' | 'resolved'>('feed');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const t = localStorage.getItem('cv_token');
    const dn = localStorage.getItem('cv_displayName');
    const n = localStorage.getItem('cv_anonName');
    const aid = localStorage.getItem('cv_anonId');
    console.log('📱 localStorage values:', { token: t?.slice(0, 20) + '...', displayName: dn, anonName: n, anonId: aid });
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setDisplayName(dn || 'Student');
    setAnonName(n || 'Gumnaam Student');
    setAnonId(aid || '');
    fetchComplaints(tab, category, t);
  }, []);

  const fetchComplaints = useCallback(async (currentTab: string, currentCat: string, tk?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentCat !== 'all') params.set('category', currentCat);
      if (currentTab === 'trending') params.set('sort', 'trending');
      if (currentTab === 'resolved') params.set('status', 'resolved');
      const res = await fetch(`/api/complaints?${params}`);
      const data = await res.json();
      setComplaints(data);
    } finally {
      setLoading(false);
    }
  }, []);

  function changeTab(newTab: 'feed' | 'trending' | 'resolved') {
    setTab(newTab);
    setCategory('all');
    fetchComplaints(newTab, 'all', token || undefined);
  }

  function changeCategory(cat: string) {
    setCategory(cat);
    fetchComplaints(tab, cat, token || undefined);
  }

  async function handleVote(id: string, action: 'upvote' | 'downvote') {
    if (!token) return;
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const { upvotes, downvotes } = await res.json();
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, upvotes, downvotes } : c));
    }
  }

  function handleNewPost(complaint: Record<string, unknown>) {
    setComplaints(prev => [complaint as unknown as Complaint, ...prev]);
  }

  function handleResolve(id: string) {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
    // Refetch to ensure all users see the update
    setTimeout(() => fetchComplaints(tab, category, token || undefined), 500);
  }

  function logout() {
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_displayName');
    localStorage.removeItem('cv_anonName');
    localStorage.removeItem('cv_anonId');
    router.push('/login');
  }

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    pending: complaints.filter(c => c.status === 'pending').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 720, margin: '0 auto', padding: '0.75rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🎓</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>CampusVoice</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Anonymous • Verified • Fearless</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-full)',
              background: 'var(--green-light)', color: 'var(--green-text)', fontWeight: 500,
            }}>� {displayName}</span>
            <span style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-full)',
              background: '#E0F2FE', color: '#0369A1', fontWeight: 500,
            }}>�🔒 {anonName}</span>
            <button onClick={logout} style={{
              fontSize: 12, padding: '5px 12px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'transparent', color: 'var(--text-muted)',
            }}>Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          maxWidth: 720, margin: '0 auto', padding: '0 1.25rem',
          display: 'flex', gap: 0, borderTop: '1px solid var(--border)',
          overflowX: 'auto',
        }}>
          {([
            ['feed','🔥 Feed'],
            ['trending','📈 Trending'],
            ['resolved','✅ Solved'],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => changeTab(t)} style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 500,
              border: 'none', borderBottom: tab === t ? '2px solid var(--green)' : '2px solid transparent',
              background: 'transparent', color: tab === t ? 'var(--green)' : 'var(--text-muted)',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '1.25rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
          {[
            { num: complaints.length || '—', label: 'Complaints' },
            { num: stats.resolved || '—', label: 'Solve Hui' },
            { num: '100%', label: 'Anonymous' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Post Box */}
        {tab === 'feed' && token && (
          <PostBox token={token} onPost={handleNewPost} />
        )}

        {/* Category Filter */}
        {tab === 'feed' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => changeCategory(cat)} style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)', whiteSpace: 'nowrap',
                background: category === cat ? 'var(--green)' : 'var(--surface)',
                color: category === cat ? '#fff' : 'var(--text-muted)',
                fontWeight: category === cat ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                {cat === 'all' ? 'Sabhi' : cat}
              </button>
            ))}
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: 24, marginBottom: 8, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
            <div style={{ fontSize: 14 }}>Load ho raha hai...</div>
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🫥</div>
            <div style={{ fontSize: 15 }}>Koi complaint nahi mili</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Pehli awaaz tum uthao!</div>
          </div>
        ) : (
          complaints.map(c => (
            <ComplaintCard key={c.id} complaint={c} token={token} onVote={handleVote} currentAnonId={anonId} onResolve={handleResolve} />
          ))
        )}
      </main>
    </div>
  );
}
