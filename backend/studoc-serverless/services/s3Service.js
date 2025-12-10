// src/services/s3Service.js
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ⚙️ AWS-Konfiguration
const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "studoc-files"; // ⚠️ deinen echten Bucketnamen hier eintragen

// 🧩 S3 Client
const s3 = new S3Client({ region: REGION });

/* -------------------- ⬆️ Direkter Datei-Upload (Backend → S3) -------------------- */
export async function uploadToS3(moduleId, file) {
    const key = `${moduleId}/${Date.now()}_${file.name}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.data,
        ContentType: file.mimetype,
    });

    try {
        await s3.send(command);
        const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
        console.log(`✅ Datei erfolgreich hochgeladen: ${url}`);
        return url;
    } catch (err) {
        console.error("❌ Upload-Fehler:", err);
        throw new Error("Fehler beim Hochladen zu S3");
    }
}

/* -------------------- 📥 Datei-Download-URL -------------------- */
export async function generateDownloadUrl(key) {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1h gültig
    return url;
}

/* -------------------- 📂 Dateien eines Moduls auflisten -------------------- */
export async function listFilesInModule(moduleId) {
    const prefix = `${moduleId}/`;
    const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
    });

    try {
        const data = await s3.send(command);
        const files = data.Contents?.map((file) => ({
            key: file.Key,
            url: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${file.Key}`,
            sizeKB: (file.Size / 1024).toFixed(1),
            lastModified: file.LastModified,
        })) || [];

        return files;
    } catch (err) {
        console.error("❌ Fehler beim Auflisten der Dateien:", err);
        throw new Error("Konnte Dateien nicht abrufen");
    }
}

/* -------------------- ❌ Datei löschen -------------------- */
export async function deleteFile(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        await s3.send(command);
        return { message: `✅ Datei ${key} gelöscht` };
    } catch (err) {
        console.error("❌ Fehler beim Löschen:", err);
        throw new Error("Fehler beim Löschen der Datei");
    }
}
