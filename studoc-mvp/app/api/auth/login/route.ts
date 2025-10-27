
import { NextRequest, NextResponse } from 'next/server';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { doc, tables } from '@/lib/aws';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email')||'').toLowerCase();
  const password = String(form.get('password')||'');
  const res = await doc.send(new GetCommand({ TableName: tables.users, Key: { userId: email } }));
  const user = res.Item as any;
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: 'wrong password' }, { status: 401 });

  const token = jwt.sign({ sub: user.userId, email: user.email, roles: user.roles, groups: user.groups }, JWT_SECRET, { expiresIn: '7d' });
  const resp = NextResponse.redirect(new URL('/dashboard', req.url));
  resp.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return resp;
}
