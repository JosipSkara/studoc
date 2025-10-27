
import { NextRequest, NextResponse } from 'next/server';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { doc, tables } from '@/lib/aws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function GET(req: NextRequest) {
  const c = req.cookies.get('token')?.value;
  if (!c) return NextResponse.json({ error:'unauthorized' }, { status:401 });
  const u = jwt.verify(c, JWT_SECRET) as any;
  const q = new URL(req.url).searchParams.get('q')?.toLowerCase() || '';

  const out = await doc.send(new ScanCommand({ TableName: tables.files }));
  const items = (out.Items || []).filter((it:any) => (u.groups||[]).includes(it.groupId))
    .filter((it:any) => !q || it.filename.toLowerCase().includes(q) || (it.tags||[]).some((t:string)=>t.toLowerCase().includes(q)));

  return NextResponse.json({ items });
}
