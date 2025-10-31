import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import jwt from 'jsonwebtoken';
import { bucket, region } from '@/lib/aws';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function GET(req: NextRequest) {
    try {
        // ✅ Token aus Cookie prüfen
        const token = req.cookies.get('token')?.value;
        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        try {
            jwt.verify(token, JWT_SECRET);
        } catch {
            return new NextResponse('Invalid token', { status: 403 });
        }

        // ✅ Key (Pfad der Datei) aus URL-Query lesen
        const key = new URL(req.url).searchParams.get('key');
        if (!key) return new NextResponse('Missing file key', { status: 400 });

        // ✅ S3-Client
        const s3 = new S3Client({ region });

        // ✅ Datei von S3 abrufen
        const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

        // ✅ Dateiinhalt in Buffer umwandeln
        const body = await result.Body?.transformToByteArray();
        if (!body) return new NextResponse('File not found or empty', { status: 404 });

        // ✅ Dateiname aus Key extrahieren
        const filename = key.split('/').pop() || 'download.bin';

        // ✅ Response erzeugen
        return new Response(body, {
            headers: {
                'Content-Type': result.ContentType || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (err: any) {
        console.error('❌ File download failed:', err);
        return NextResponse.json(
            { error: err.name || 'DownloadError', message: err.message || 'unknown' },
            { status: 500 }
        );
    }
}
