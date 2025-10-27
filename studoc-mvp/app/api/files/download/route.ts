
import { NextRequest } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { bucket, region } from '@/lib/aws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function GET(req: NextRequest) {
  const c = req.cookies.get('token')?.value;
  if (!c) return new Response('unauthorized', { status:401 });
  jwt.verify(c, JWT_SECRET);

  const key = new URL(req.url).searchParams.get('key')!;
  const s3 = new S3Client({ region });
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = (await res.Body?.transformToByteArray()) || new Uint8Array();
  return new Response(body, { headers: { 'Content-Type': res.ContentType || 'application/octet-stream', 'Content-Disposition': 'attachment' } });
}
