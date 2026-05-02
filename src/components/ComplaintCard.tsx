'use client';
// src/components/ComplaintCard.tsx
import { useState } from 'react';
import Image from 'next/image';
import { verifyToken } from '@/lib/auth';

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  Canteen:        { bg: '#E1F5EE', text: '#0F6E56' },
  Hostel:         { bg: '#E6F1FB', text: '#185FA5' },
  Faculty:        { bg: '#FAEEDA', text: '#854F0B' },
  Infrastructure: { bg: '#EAF3DE', text: '#3B6D11' },
  Exams:          { bg: '#EEEDFE', text: '#534AB7' },
  Administration: { bg: '#FAECE7', text: '#993C1D' },
  Transport:      { bg: '#FBEAF0', text: '#993556' },
  Library:        { bg: '#F1EFE8', text: '#444441' },
};

const AVATAR_COLORS = [
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#EAF3DE', text: '#3B6D11' },
  { bg: '#FBEAF0', text: '#993556' },
  { bg: '#EEEDFE', text: '#534AB7' },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#FAEEDA', text: '#854F0B', label: '⏳ Pending' },
  review:   { bg: '#E6F1FB', text: '#185FA5', label: '🔍 Under Review' },
  resolved: { bg: '#E1F5EE', text: '#0F6E56', label: '✅ Resolved' },
};

interface Comment { id: string; anonName: string; text: string; timeAgo: string; }
interface ComplaintProps {
  complaint: {
    id: string; anonId: string; anonName: string; category: string;
    text: string; imageUrl?: string; upvotes: number; downvotes: number;
    status: string; comments: Comment[]; timeAgo: string;
  };
  token: string | null;
  onVote: (id: string, action: 'upvote' | 'downvote') => void;
  currentAnonId?: string;
  onResolve?: (id: string) => void;
}

export default function ComplaintCard({ complaint, token, onVote, currentAnonId, onResolve }: ComplaintProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>(complaint.comments);
  const [posting, setPosting] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [likedByUser, setLikedByUser] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [localStatus, setLocalStatus] = useState(complaint.status);

  const catStyle = CAT_COLORS[complaint.category] || { bg: '#F1EFE8', text: '#444441' };
  const avatarCol = AVATAR_COLORS[complaint.id.charCodeAt(0) % AVATAR_COLORS.length];
  const initials = complaint.anonName.split(' ').map(w => w[0]).join('').slice(0, 2);
  const statusStyle = STATUS_STYLE[localStatus] || STATUS_STYLE.pending;
  const isOriginalPoster = currentAnonId && currentAnonId === complaint.anonId;

  console.log('ComplaintCard Debug:', {
    complaintAnonId: complaint.anonId,
    currentAnonId,
    isOriginalPoster,
    canResolve: isOriginalPoster && localStatus !== 'resolved',
  });

  async function submitComment() {
    if (!token || !commentText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'comment', commentText }),
      });
      if (res.ok) {
        const newCmt = await res.json();
        setLocalComments(prev => [...prev, newCmt]);
        setCommentText('');
      }
    } finally {
      setPosting(false);
    }
  }

  async function handleResolve() {
    if (!token || !isOriginalPoster || localStatus === 'resolved') return;
    setResolving(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'resolve' }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalStatus('resolved');
        onResolve?.(complaint.id);
      } else {
        const err = await res.json();
        alert('Error: ' + (err.error || 'Resolve nahi ho saki'));
      }
    } catch (error) {
      console.error('Resolve error:', error);
      alert('Server se connect nahi ho saka');
    } finally {
      setResolving(false);
    }
  }

  async function handleShare() {
    const text = `CampusVoice: "${complaint.text.slice(0, 100)}..."\n${complaint.anonName} • ${complaint.timeAgo}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CampusVoice',
          text: text,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Share text copied to clipboard! ✅');
    }
  }

  async function handleLike() {
    if (!token) return;
    setLikedByUser(!likedByUser);
    onVote(complaint.id, 'upvote');
  }

  return (
    <div className="fade-up" style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', marginBottom: '0.75rem',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      overflow: 'hidden',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: isOriginalPoster ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: avatarCol.bg, color: avatarCol.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, flexShrink: 0,
            border: isOriginalPoster ? '3px solid var(--green)' : 'none',
          }}>{initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {complaint.anonName}
              {isOriginalPoster && <span style={{ fontSize: 10, background: 'var(--green)', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>YOU</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{complaint.timeAgo}</div>
          </div>
        </div>
        <span style={{
          fontSize: 11, padding: '4px 12px', borderRadius: 'var(--radius-full)',
          background: catStyle.bg, color: catStyle.text, fontWeight: 600,
        }}>{complaint.category}</span>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', marginBottom: complaint.imageUrl ? '0.75rem' : 0 }}>
          {complaint.text}
        </p>

        {/* Image */}
        {complaint.imageUrl && (
          <div
            onClick={() => setImageOpen(true)}
            style={{
              position: 'relative', width: 'calc(100% + 2.5rem)', marginLeft: '-1.25rem', marginRight: '-1.25rem',
              marginBottom: '1rem', maxHeight: 320, overflow: 'hidden',
              borderRadius: 0, cursor: 'pointer',
            }}
          >
            <img
              src={complaint.imageUrl} alt="Complaint evidence"
              style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 320 }}
            />
          </div>
        )}

        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <span style={{
            fontSize: 12, padding: '5px 12px', borderRadius: 'var(--radius-full)',
            background: statusStyle.bg, color: statusStyle.text, fontWeight: 600,
          }}>{statusStyle.label}</span>
        </div>
      </div>

      {/* Action Buttons - Instagram Style */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 1, borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', padding: '0.5rem 0.75rem',
      }}>
        <button onClick={handleLike} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', background: 'transparent', border: 'none',
          fontSize: 13, fontWeight: 500, color: likedByUser ? '#E94B3C' : 'var(--text-muted)',
          cursor: 'pointer', transition: 'color 0.2s',
        }}>
          {likedByUser ? '❤️' : '🤍'} Like {complaint.upvotes > 0 && `(${complaint.upvotes})`}
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <button onClick={() => setShowComments(!showComments)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', background: 'transparent', border: 'none',
          fontSize: 13, fontWeight: 500, color: showComments ? 'var(--green)' : 'var(--text-muted)',
          cursor: 'pointer', transition: 'color 0.2s',
        }}>
          💬 Comment {localComments.length > 0 && `(${localComments.length})`}
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <button onClick={handleShare} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', background: 'transparent', border: 'none',
          fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
          cursor: 'pointer', transition: 'color 0.2s',
        }}>
          📤 Share
        </button>
        {localStatus !== 'resolved' && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            {isOriginalPoster ? (
              <button 
                onClick={handleResolve} 
                disabled={resolving}
                title="Click to mark as resolved"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', background: 'transparent', border: 'none',
                  fontSize: 13, fontWeight: 600, color: 'var(--green)',
                  cursor: resolving ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.2s',
                  opacity: resolving ? 0.5 : 1,
                }}
              >
                ✅ {resolving ? 'Resolve ho raha...' : 'Resolved'}
              </button>
            ) : (
              <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', fontWeight: 500 }}>
                🔒 Sirf original poster resolve kar sakte hain
              </div>
            )}
          </>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          {localComments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, padding: '1rem 0' }}>
              Koi comment nahi abhi. Pehla comment likho! 💬
            </div>
          ) : (
            <div style={{ marginBottom: '1rem', maxHeight: 300, overflowY: 'auto' }}>
              {localComments.map(cm => (
                <div key={cm.id} style={{ display: 'flex', gap: 10, marginBottom: '0.75rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: '#D3D1C7', color: '#444441',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>#{cm.id.slice(-3)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        {cm.anonName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {cm.timeAgo}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, background: 'var(--surface2)', padding: '8px 12px', borderRadius: 8 }}>
                      {cm.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {token && (
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <input
                value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitComment()}
                placeholder="Apna anonymous comment likho..."
                style={{
                  flex: 1, padding: '10px 14px', fontSize: 13,
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-full)',
                  background: 'var(--surface)', color: 'var(--text)', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--green)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button onClick={submitComment} disabled={posting || !commentText.trim()} style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--green)', border: 'none', color: '#fff',
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer', transition: 'opacity 0.2s',
                opacity: posting || !commentText.trim() ? 0.5 : 1,
              }}>➤</button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {imageOpen && complaint.imageUrl && (
        <div onClick={() => setImageOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, cursor: 'zoom-out', padding: '1rem',
        }}>
          <img src={complaint.imageUrl} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
