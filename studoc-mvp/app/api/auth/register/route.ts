
import { NextRequest, NextResponse } from 'next/server';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { doc, tables } from '@/lib/aws';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get('name')||'');
  const email = String(form.get('email')||'').toLowerCase();
  const password = String(form.get('password')||'');
  if (!email || !password) return NextResponse.json({ error: 'missing' }, { status: 400 });

  const userId = email; // use email as PK
  const pwd = await bcrypt.hash(password, 10);
  await doc.send(new PutCommand({ TableName: tables.users, Item: { userId, name, email, password: pwd, roles:['user'], groups: ['default'] } }));
  return NextResponse.redirect(new URL('/login', req.url));
}
