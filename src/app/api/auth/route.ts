// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findUser, createUser, getAnonName, ANON_NAMES, getUserCount } from '@/lib/db';
import { hashPassword, comparePassword, signToken, generateAnonId, isValidCollegeId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { action, collegeId, password, displayName, course } = await req.json();

  if (!collegeId || !password) {
    return NextResponse.json({ error: 'College ID aur password zaroori hai' }, { status: 400 });
  }

  if (!isValidCollegeId(collegeId)) {
    return NextResponse.json({ error: 'College ID galat format mein hai (e.g., BCS2023186)' }, { status: 400 });
  }

  if (action === 'register') {
    // Registration: require displayName and course
    if (!displayName || !course) {
      return NextResponse.json({ error: 'Display name aur course zaroori hain' }, { status: 400 });
    }

    if (displayName.trim().length < 3) {
      return NextResponse.json({ error: 'Display name kam se kam 3 characters ka hona chahiye' }, { status: 400 });
    }

    const existingUser = await findUser(collegeId);
    if (existingUser) {
      return NextResponse.json({ error: 'Yeh college ID pehle se registered hai' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const anonId = generateAnonId();
    const userCount = await getUserCount();
    const anonIndex = userCount % ANON_NAMES.length;
    const anonName = getAnonName(anonIndex);

    await createUser({
      collegeId,
      displayName: displayName.trim(),
      course: course.trim(),
      passwordHash,
      anonSalt: anonId,
    });

    const token = signToken({ collegeId, displayName, anonId, anonName });
    return NextResponse.json({ token, displayName, anonName, anonId, message: 'Account ban gaya!' });
  }

  if (action === 'login') {
    // Login: strict - must be registered and password must match
    const user = await findUser(collegeId);

    if (!user) {
      return NextResponse.json({ error: 'College ID ya password galat hai' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'College ID ya password galat hai' }, { status: 401 });
    }

    const userCount = await getUserCount();
    const anonIndex = userCount % ANON_NAMES.length;
    const anonName = getAnonName(anonIndex);
    const token = signToken({ collegeId, displayName: user.displayName, anonId: user.anonSalt, anonName });

    return NextResponse.json({ token, displayName: user.displayName, anonName, anonId: user.anonSalt });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
