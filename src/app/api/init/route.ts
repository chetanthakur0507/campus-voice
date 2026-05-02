// src/app/api/init/route.ts - Initialize MongoDB data on first run
import { NextRequest, NextResponse } from 'next/server';
import { initializeSampleData } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await initializeSampleData();
    return NextResponse.json({ message: 'Database initialized successfully!' });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ error: 'Initialization failed', details: String(error) }, { status: 500 });
  }
}
