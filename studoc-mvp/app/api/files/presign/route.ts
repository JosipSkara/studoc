import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bucket, region } from "@/lib/aws";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: NextRequest) {
    try {
        // 🔐 Token aus Cookie
        const cookieToken = req.cookies.get("token")?.value;
        if (!cookieToken) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        let email = "anonymous";
        try {
            const u = jwt.verify(cookieToken, JWT_SECRET) as any;
            email = String(u?.email || u?.sub || "anonymous").toLowerCase();
        } catch {
            return NextResponse.json({ error: "invalid_token" }, { status: 403 });
        }

        // 📦 Body lesen (wie bisher)
        const bodyText = await req.text();
        const meta = JSON.parse(bodyText || "{}") as {
            groupId?: string;
            filename?: string;
            contentType?: string;
        };

        if (!meta.groupId || !meta.filename) {
            return NextResponse.json(
                { error: "missing_fields", message: "groupId und filename sind Pflicht." },
                { status: 400 }
            );
        }

        // S3-Key wie vorher: <Modul>/<User>/<Timestamp>_<Filename>
        const key = `${meta.groupId}/${email}/${Date.now()}_${meta.filename}`;

        const client = new S3Client({ region });

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: meta.contentType || "application/octet-stream",
        });

        // ✅ NEU: getSignedUrl statt S3RequestPresigner.presign(...)
        const url = await getSignedUrl(client, command, { expiresIn: 900 });

        return NextResponse.json({ url, key });
    } catch (err: any) {
        console.error("❌ Fehler im presign-Handler:", err);
        return NextResponse.json(
            {
                error: err?.name || "PresignError",
                message: err?.message || "unknown",
            },
            { status: 500 }
        );
    }
}
