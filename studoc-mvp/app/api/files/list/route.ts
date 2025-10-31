import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.STUDOC_BUCKET!;
const s3 = new S3Client({ region: REGION });

export async function GET(req: NextRequest) {
    try {
        // ✅ Authentifizierung prüfen
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        let email = "anonymous";
        try {
            const user = jwt.verify(token, JWT_SECRET) as any;
            email = String(user?.email || user?.sub || "anonymous").toLowerCase();
        } catch {
            return NextResponse.json({ error: "invalid_token" }, { status: 403 });
        }

        // ✅ Optionaler Suchparameter
        const q = new URL(req.url).searchParams.get("q")?.toLowerCase() || "";

        // ✅ Dateien aus S3 abrufen (nur User-spezifische)
        const prefix = `default/${email}/`;
        const result = await s3.send(
            new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix,
            })
        );

        // ✅ Daten aufbereiten
        const items =
            result.Contents?.filter((obj) => obj.Key)
                .filter((obj) => !q || obj.Key!.toLowerCase().includes(q))
                .map((obj) => ({
                    key: obj.Key!,
                    filename: obj.Key!.split("/").pop(),
                    size: obj.Size || 0,
                    lastModified: obj.LastModified,
                    url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${obj.Key}`,
                })) || [];

        return NextResponse.json({ items });
    } catch (err: any) {
        console.error("❌ Fehler beim Laden der Dateien:", err);
        return NextResponse.json(
            { error: err.name || "ListError", message: err.message || "unknown" },
            { status: 500 }
        );
    }
}
