import { NextRequest, NextResponse } from "next/server";
import {
    S3Client,
    ListObjectsV2Command,
    HeadObjectCommand,
    _Object as S3Object,
} from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.STUDOC_BUCKET!;

// ⚙️ Learner-Lab: Session-Token aus ENV mitgeben (falls vorhanden)
const s3 = new S3Client({
    region: REGION,
    credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN, // wichtig bei temporären Credentials
        }
        : undefined,
});

type FileJson = {
    filename: string;
    key: string;
    size: number;
    lastModified?: string;
    tags?: string;          // ASCII-Codes: leistungsnachweis | aufgabe | zusammenfassung | skript
    uploader?: string;
};

type Grouped = Record<string, Record<string, FileJson[]>>;

// kleine Helferfunktion: parallele Requests begrenzen
async function mapLimit<T, R>(
    arr: T[],
    limit: number,
    fn: (x: T) => Promise<R>
): Promise<R[]> {
    const ret: R[] = [];
    const it = arr[Symbol.iterator]();
    const workers = Array.from({ length: limit }, async () => {
        for (let n = it.next(); !n.done; n = it.next()) {
            ret.push(await fn(n.value));
        }
    });
    await Promise.all(workers);
    return ret;
}

export async function GET(req: NextRequest) {
    try {
        // 🔐 Auth
        const token = req.cookies.get("token")?.value;
        if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

        try {
            jwt.verify(token, JWT_SECRET);
        } catch {
            return NextResponse.json({ error: "invalid_token" }, { status: 403 });
        }

        const url = new URL(req.url);
        const q = (url.searchParams.get("q") || "").toLowerCase().trim();        // Dateiname (legacy)
        const tagParam = (url.searchParams.get("tag") || "").toLowerCase().trim(); // Tag-Filter

        // 📦 Liste aller Objekte
        const listed = await s3.send(
            new ListObjectsV2Command({
                Bucket: BUCKET,
            })
        );

        const objs = (listed.Contents || []).filter((o): o is S3Object & { Key: string } => !!o.Key);

        // 🔎 pro Objekt: Metadaten nachladen (tags/uploader)
        const enriched = await mapLimit(objs, 8, async (o) => {
            let tags = "";
            let uploader = "";
            try {
                const head = await s3.send(
                    new HeadObjectCommand({ Bucket: BUCKET, Key: o.Key! })
                );
                // S3 speichert Metadata-Keys lowercase
                tags = head.Metadata?.["tags"] ?? "";
                uploader = head.Metadata?.["uploader"] ?? "";
            } catch {
                // wenn HeadObject fehlschlägt, bleiben tags/uploader leer
            }

            // Key-Format: <groupId>/<userEmail>/<filename>
            const parts = o.Key!.split("/");
            const groupId = parts[0] || "UNKNOWN";
            const userEmail = parts[1] || "UNKNOWN";
            const filename = parts.slice(2).join("/") || o.Key!;

            const item: FileJson = {
                filename,
                key: o.Key!,
                size: o.Size ?? 0,
                lastModified: o.LastModified?.toISOString(),
                tags,       // <- kommt aus S3 Metadata (ASCII: leistungsnachweis/aufgabe/zusammenfassung/skript)
                uploader,
            };

            return { groupId, userEmail, item };
        });

        // 🧠 gruppieren
        const grouped: Grouped = {};
        for (const e of enriched) {
            (grouped[e.groupId] ??= {});
            (grouped[e.groupId][e.userEmail] ??= []);
            grouped[e.groupId][e.userEmail].push(e.item);
        }

        // 🔎 optional filtern: erst Tag, dann (legacy) Dateiname
        if (tagParam) {
            for (const g of Object.keys(grouped)) {
                for (const u of Object.keys(grouped[g])) {
                    grouped[g][u] = grouped[g][u].filter((f) => {
                        const t = (f.tags || "").toLowerCase();
                        // tags kann CSV sein → aufteilen
                        const set = t.split(",").map((x) => x.trim()).filter(Boolean);
                        return set.includes(tagParam);
                    });
                }
            }
        }

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
