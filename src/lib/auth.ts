// src/lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'campusvoice-dev-secret-change-in-prod';

export interface TokenPayload {
  collegeId: string;
  displayName: string;
  anonId: string;
  anonName: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

export async function comparePassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function generateAnonId(): string {
  return 'anon_' + uuidv4().split('-')[0];
}

export function isValidCollegeId(collegeId: string): boolean {
  // Accept college ID format like BCS2023186, CSE2024001, etc.
  // Pattern: 2-4 letters (department) + 4 digits (year) + 2-3 digits (serial)
  return /^[A-Z]{2,4}\d{4}\d{2,3}$/.test(collegeId);
}
