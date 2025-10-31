import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.STUDOC_BUCKET!;
const s3 = new S3Client({ region: REGION });

export async function GET(req: NextRequest) {
    try {
        // 🔐 Benutzer authentifizieren
        const token = req.cookies.get("token")?.value;
        if (!token)
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });

        let email = "anonymous";
        try {
            const u = jwt.verify(token, JWT_SECRET) as any;
            email = String(u?.email || u?.sub || "anonymous").toLowerCase();
        } catch {
            return NextResponse.json({ error: "invalid_token" }, { status: 403 });
        }

        const q = new URL(req.url).searchParams.get("q")?.toLowerCase() || "";

        // 📦 Alle Dateien aus S3 holen (rekursiv)
        const result = await s3.send(
            new ListObjectsV2Command({
                Bucket: BUCKET,
            })
        );

        // 🧠 Gruppieren: groupId / user / file
        const grouped: Record<
            string,
            Record<
                string,
                { filename: string; key: string; size: number; lastModified?: Date }[]
            >
        > = {};

        for (const obj of result.Contents || []) {
            if (!obj.Key) continue;

            const parts = obj.Key.split("/");
            if (parts.length < 3) continue;

            const [groupId, userEmail, fileName] = parts;
            if (!groupId || !userEmail || !fileName) continue;

            if (!grouped[groupId]) grouped[groupId] = {};
            if (!grouped[groupId][userEmail]) grouped[groupId][userEmail] = [];

            grouped[groupId][userEmail].push({
                filename: fileName,
                key: obj.Key,
                size: obj.Size || 0,
                lastModified: obj.LastModified,
            });
        }

        // 🔎 Falls q angegeben ist, filtern
        if (q) {
            for (const g of Object.keys(grouped)) {
                for (const u of Object.keys(grouped[g])) {
                    grouped[g][u] = grouped[g][u].filter((f) =>
                        f.filename.toLowerCase().includes(q)
                    );
                }
            }
        }

        return NextResponse.json({ groups: grouped });
    } catch (err: any) {
        console.error("❌ Fehler beim Abrufen der Dateien:", err);
        return NextResponse.json(
            { error: err.name || "ListError", message: err.message || "unknown" },
            { status: 500 }
        );
    }
}
