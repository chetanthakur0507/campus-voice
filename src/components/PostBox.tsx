'use client';
// src/components/PostBox.tsx
import { useState, useRef } from 'react';

const CATEGORIES = ['Canteen','Hostel','Faculty','Infrastructure','Exams','Administration','Transport','Library'];

interface PostBoxProps {
  token: string;
  onPost: (complaint: Record<string, unknown>) => void;
}

export default function PostBox({ token, onPost }: PostBoxProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Canteen');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image 5MB se choti honi chahiye'); return; }
    setImage(file);
    setError('');
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit() {
    if (!text.trim() || text.trim().length < 10) {
      setError('Kam se kam 10 characters likhna zaroori hai'); return;
    }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('text', text.trim());
      fd.append('category', category);
      if (image) fd.append('image', image);

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onPost(data);
      setText('');
      removeImage();
    } catch {
      setError('Post nahi ho saki, dobara try karo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1rem',
    }}>
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder="Apni baat likho... koi nahi janega tum ho ✍️"
        rows={3}
        style={{
          width: '100%', border: 'none', outline: 'none', resize: 'none',
          fontSize: 14, color: 'var(--text)', background: 'transparent',
          lineHeight: 1.7, fontFamily: 'inherit',
        }}
      />

      {/* Image drop zone */}
      {!imagePreview ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleImageChange(f);
          }}
          style={{
            border: `2px dashed ${dragOver ? 'var(--green)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-sm)', padding: '1rem',
            textAlign: 'center', cursor: 'pointer', marginBottom: '0.875rem',
            background: dragOver ? 'var(--green-light)' : 'var(--surface2)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 4 }}>📷</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Photo proof daalo — click karo ya drag karo
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
            JPG, PNG, WebP, GIF • Max 5MB
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
          <img src={imagePreview} alt="Preview" style={{
            width: '100%', maxHeight: 200, objectFit: 'cover',
            borderRadius: 'var(--radius-sm)', display: 'block',
          }} />
          <button onClick={removeImage} style={{
            position: 'absolute', top: 8, right: 8, width: 28, height: 28,
            borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none',
            color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
          }}>✕</button>
          <div style={{
            position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)',
            color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4,
          }}>📎 {image?.name}</div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleImageChange(e.target.files?.[0] || null)} />

      {error && (
        <div style={{
          fontSize: 12, color: '#991B1B', background: '#FEF2F2',
          padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem',
        }}>⚠️ {error}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={category} onChange={e => setCategory(e.target.value)}
            style={{
              fontSize: 13, padding: '6px 12px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)', color: 'var(--text)', outline: 'none',
            }}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>🔒 Anonymous post hogi</span>
        </div>
        <button onClick={handleSubmit} disabled={loading || !text.trim()} style={{
          padding: '8px 20px', fontSize: 13, fontWeight: 600,
          background: loading ? 'var(--green-dark)' : 'var(--green)',
          color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
          opacity: !text.trim() ? 0.6 : 1,
          transition: 'all 0.15s',
        }}>
          {loading ? '⏳ Post ho rahi hai...' : 'Post Karo'}
        </button>
      </div>
    </div>
  );
}
