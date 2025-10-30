// app/api/files/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const UPLOAD_MODE = (process.env.UPLOAD_MODE || 'aws').toLowerCase();

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.STUDOC_BUCKET;
const s3 = new S3Client({ region: REGION });

export async function POST(req: NextRequest) {
    try {
        // User aus Cookie (für Pfad)
        const token = req.cookies.get('token')?.value;
        let email = 'anonymous';
        if (token) {
            try {
                const p = jwt.verify(token, JWT_SECRET) as any;
                email = String(p?.email || p?.sub || 'anonymous').toLowerCase();
            } catch {}
        }

        const form = await req.formData();
        const file = form.get('file') as File | null;
        const groupId = String(form.get('groupId') ?? 'default');
        const rawTags = String(form.get('tags') ?? '');
        const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);

        if (!file) return NextResponse.json({ error: 'missing_file' }, { status: 400 });

        const buf = Buffer.from(await file.arrayBuffer());
        const safeName = (file.name || 'upload.bin').replace(/[^\w.\-]/g, '_');
        const key = `${groupId}/${email}/${Date.now()}_${safeName}`;

        if (UPLOAD_MODE === 'local') {
            const target = path.join(process.cwd(), '.data', 'uploads', key);
            await fs.mkdir(path.dirname(target), { recursive: true });
            await fs.writeFile(target, buf);
            return NextResponse.json({ ok: true, mode: 'local', key, path: target });
        }

        if (!BUCKET) return NextResponse.json({ error: 'missing_bucket_env' }, { status: 500 });

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buf,
            ContentType: file.type || 'application/octet-stream',
            Metadata: { tags: tags.join(','), uploader: email },
        }));

        return NextResponse.json({ ok: true, mode: 'aws', key });
    } catch (err: any) {
        console.error('Upload failed:', err);
        return NextResponse.json(
            { error: err?.name || 'internal_error', message: err?.message || 'unknown' },
            { status: 500 }
        );
    }
}

export function GET() {
    return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
