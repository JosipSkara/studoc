// app/api/files/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const UPLOAD_MODE = (process.env.UPLOAD_MODE || 'aws').toLowerCase();
const FALLBACK_LOCAL = (process.env.UPLOAD_FALLBACK_LOCAL || '0') === '1';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.STUDOC_BUCKET;
const s3 = new S3Client({ region: REGION });

function normalizeTags(raw: string) {
    return (raw || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
}

async function saveLocal(key: string, buf: Buffer) {
    const target = path.join(process.cwd(), '.data', 'uploads', key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buf);
    return target;
}

export async function POST(req: NextRequest) {
    try {
        // Benutzer aus Cookie (für Pfad/Metadaten)
        const token = req.cookies.get('token')?.value;
        let email = 'anonymous';
        if (token) {
            try {
                const p = jwt.verify(token, JWT_SECRET) as any;
                email = String(p?.email || p?.sub || 'anonymous').toLowerCase();
            } catch {
                /* ignore invalid token */
            }
        }

        const form = await req.formData();
        const file = form.get('file') as File | null;
        const groupId = String(form.get('groupId') ?? 'default');
        const tags = normalizeTags(String(form.get('tags') ?? ''));

        if (!file) {
            return NextResponse.json({ error: 'missing_file' }, { status: 400 });
        }

        const buf = Buffer.from(await file.arrayBuffer());
        const safeName = (file.name || 'upload.bin').replace(/[^\w.\-]/g, '_');
        const key = `${groupId}/${email}/${Date.now()}_${safeName}`;

        // --- rein lokal erzwingen ---
        if (UPLOAD_MODE === 'local') {
            const target = await saveLocal(key, buf);
            return NextResponse.json({ ok: true, mode: 'local', key, path: target });
        }

        // --- AWS-Upload ---
        if (!BUCKET) {
            return NextResponse.json({ error: 'missing_bucket_env' }, { status: 500 });
        }

        try {
            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: key,
                    Body: buf,
                    ContentType: file.type || 'application/octet-stream',
                    Metadata: { tags: tags.join(','), uploader: email },
                })
            );

            return NextResponse.json({ ok: true, mode: 'aws', key });
        } catch (e: any) {
            // Im Academy-Lab kommt hier oft ein "AccessDenied" – darauf sauber auf lokal ausweichen
            const msg = String(e?.message || '');
            const isAccessDenied =
                e?.name === 'AccessDenied' ||
                e?.Code === 'AccessDenied' ||
                /not authorized|accessdenied|explicit deny/i.test(msg);

            if (FALLBACK_LOCAL && isAccessDenied) {
                const target = await saveLocal(key, buf);
                return NextResponse.json({ ok: true, mode: 'local-fallback', key, path: target });
            }

            // sonst echter Fehler
            console.error('Upload failed:', e);
            return NextResponse.json(
                { error: e?.name || 'upload_failed', message: e?.message || 'unknown' },
                { status: 500 }
            );
        }
    } catch (err: any) {
        console.error('Upload failed (outer):', err);
        return NextResponse.json(
            { error: err?.name || 'internal_error', message: err?.message || 'unknown' },
            { status: 500 }
        );
    }
}

export function GET() {
    return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
