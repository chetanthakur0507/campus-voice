// src/app/api/complaints/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getComplaints_DB, createComplaint, timeAgo } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'latest';
    const status = searchParams.get('status');

    let result = await getComplaints_DB();

    if (category && category !== 'all') {
      result = result.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }
    if (status) {
      result = result.filter(c => c.status === status);
    }
    if (sort === 'trending') {
      result.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const sanitized = result.map(c => ({
      ...c,
      timeAgo: timeAgo(c.createdAt),
      comments: c.comments.map(cm => ({ ...cm, timeAgo: timeAgo(cm.createdAt) })),
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('GET complaints error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Login karo pehle' }, { status: 401 });

    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Token invalid hai' }, { status: 401 });
    
    console.log('🔍 User from token:', user);

    const formData = await req.formData();
    const text = formData.get('text') as string;
    const category = formData.get('category') as string;
    const imageFile = formData.get('image') as File | null;

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Complaint kam se kam 10 characters ki honi chahiye' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'Category select karo' }, { status: 400 });
    }

    let imageUrl: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        return NextResponse.json({ error: 'Image 5MB se choti honi chahiye' }, { status: 400 });
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Sirf JPG, PNG, WebP, GIF allowed hai' }, { status: 400 });
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `${uuidv4()}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');

      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      imageUrl = `/uploads/${filename}`;
    }

    const newComplaint = {
      id: uuidv4(),
      anonId: user.anonId,
      anonName: user.anonName,
      category,
      text: text.trim(),
      imageUrl,
      upvotes: 0,
      downvotes: 0,
      status: 'pending' as const,
      comments: [],
      createdAt: new Date().toISOString(),
    };
    
    console.log('📝 Creating complaint with:', { anonId: user.anonId, anonName: user.anonName });

    await createComplaint(newComplaint);
    return NextResponse.json({ ...newComplaint, timeAgo: 'Abhi abhi' }, { status: 201 });
  } catch (error) {
    console.error('POST complaint error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
