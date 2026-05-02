// src/app/api/complaints/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getComplaintById, updateComplaint, addComment, updateVotes, getVote, setVote, timeAgo } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Vote on a complaint or add comment
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Login karo' }, { status: 401 });
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: 'Token invalid' }, { status: 401 });

    const complaint = await getComplaintById(params.id);
    if (!complaint) return NextResponse.json({ error: 'Complaint nahi mili' }, { status: 404 });

    const { action, commentText } = await req.json();

    if (action === 'upvote' || action === 'downvote') {
      const existingVote = await getVote(user.anonId, params.id);
      const dir = action === 'upvote' ? 1 : -1;
      let upvotes = complaint.upvotes;
      let downvotes = complaint.downvotes;

      if (existingVote === dir) {
        // Toggle off
        await setVote(user.anonId, params.id, 0);
        if (dir === 1) upvotes = Math.max(0, upvotes - 1);
        else downvotes = Math.max(0, downvotes - 1);
      } else {
        if (existingVote === 1) upvotes = Math.max(0, upvotes - 1);
        if (existingVote === -1) downvotes = Math.max(0, downvotes - 1);
        await setVote(user.anonId, params.id, dir);
        if (dir === 1) upvotes++;
        else downvotes++;
      }

      await updateVotes(params.id, upvotes, downvotes);
      const newVote = await getVote(user.anonId, params.id);
      return NextResponse.json({ upvotes, downvotes, userVote: newVote || 0 });
    }

    if (action === 'comment') {
      if (!commentText || commentText.trim().length < 2) {
        return NextResponse.json({ error: 'Comment bahut chota hai' }, { status: 400 });
      }
      const num = Math.floor(Math.random() * 999) + 1;
      const comment = {
        id: uuidv4(),
        anonName: `Gumnaam #${num}`,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };
      await addComment(params.id, comment);
      return NextResponse.json({ ...comment, timeAgo: 'Abhi abhi' }, { status: 201 });
    }

    if (action === 'resolve') {
      console.log('Resolve action triggered:', { complaintId: params.id, userAnonId: user.anonId, complaintAnonId: complaint.anonId });
      // Only original poster (anonId match) can resolve
      if (complaint.anonId !== user.anonId) {
        console.log('User is not the original poster');
        return NextResponse.json({ error: 'Sirf original poster hi resolve kar sakte hain' }, { status: 403 });
      }
      console.log('Updating complaint status to resolved');
      await updateComplaint(params.id, { status: 'resolved' });
      console.log('Complaint resolved successfully');
      return NextResponse.json({ status: 'resolved', id: params.id, message: 'Dikkat solve ho gayi! ✅' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
