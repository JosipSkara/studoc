
import { NextRequest, NextResponse } from 'next/server';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { doc, tables } from '@/lib/aws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const data = JSON.parse(body||"{}");
  const c = req.cookies.get('token')?.value;
  if (!c) return NextResponse.json({ error:'unauthorized' }, { status:401 });
  const u = jwt.verify(c, JWT_SECRET) as any;

  const fileId = 'f_' + Date.now().toString(36);
  const item = {
    fileId,
    ownerId: u.sub,
    filename: data.filename,
    key: data.key,
    groupId: data.groupId || 'default',
    tags: data.tags || [],
    size: data.size || 0,
    createdAt: new Date().toISOString(),
  };
  await doc.send(new PutCommand({ TableName: tables.files, Item: item }));
  return NextResponse.json({ ok:true, fileId });
}
