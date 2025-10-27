
import { NextRequest, NextResponse } from 'next/server';
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { formatUrl } from "@aws-sdk/util-format-url";
import { bucket, region } from '@/lib/aws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const meta = JSON.parse(body||"{}");
  const c = req.cookies.get('token')?.value;
  if (!c) return NextResponse.json({ error:'unauthorized' }, { status:401 });
  const u = jwt.verify(c, JWT_SECRET) as any;

  const key = `${meta.groupId || 'default'}/${u.sub}/${Date.now()}_${meta.filename}`;

  const client = new S3Client({ region });
  const presigner = new S3RequestPresigner({ ...client.config });
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'application/octet-stream' });
  const url = await presigner.presign(command, { expiresIn: 900 });
  return NextResponse.json({ url: formatUrl(url), key });
}
