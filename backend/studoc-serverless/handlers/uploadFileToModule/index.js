// handlers/uploadFileToModule/index.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const busboy = require("busboy");

// --------------------------------------------------
// ⚙️ Konfiguration
// --------------------------------------------------
const REGION = process.env.AWS_REGION || process.env.REGION || "us-east-1";
// ❗️WICHTIG: auf DYNAMODB_FILES_TABLE umstellen
const TABLE_NAME = process.env.DYNAMODB_FILES_TABLE || "StuDoc-Files_dev";
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "studoc-files-bucket";

const s3 = new S3Client({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// --------------------------------------------------
// 🧠 Multipart-Parser (robust: Header-Case & Base64)
// --------------------------------------------------
function parseMultipart(event) {
    return new Promise((resolve, reject) => {
        const headers = event.headers || {};
        const ct =
            headers["content-type"] ||
            headers["Content-Type"] ||
            headers["CONTENT-TYPE"];
        if (!ct) return reject(new Error("Content-Type Header fehlt."));

        const bb = busboy({ headers: { "content-type": ct } });

        const rawBody = event.body || "";
        const buffer = event.isBase64Encoded
            ? Buffer.from(rawBody, "base64")
            : Buffer.from(rawBody, "utf8");

        let fileData = null;
        let fileName = null;
        let mimeType = null;

        bb.on("file", (_field, file, info) => {
            const chunks = [];
            file.on("data", (d) => chunks.push(d));
            file.on("end", () => {
                fileData = Buffer.concat(chunks);
                fileName = info?.filename;
                mimeType = info?.mimeType || info?.mime || "application/octet-stream";
            });
        });

        bb.on("error", (e) => reject(e));
        bb.on("finish", () => {
            if (!fileData || !fileName)
                return reject(new Error("Keine Datei im multipart/form-data gefunden."));
            resolve({ fileData, fileName, mimeType });
        });

        bb.end(buffer);
    });
}

// --------------------------------------------------
// 🚀 Lambda Handler
// --------------------------------------------------
exports.handler = async (event) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
    };

    // OPTIONS Preflight
    if (event.requestContext?.http?.method === "OPTIONS") {
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ message: "CORS preflight ok" }) };
    }

    try {
        const moduleId = event.pathParameters?.moduleId;
        const claims = event.requestContext?.authorizer?.jwt?.claims || {};
        const ownerId = claims.sub || null;

        if (!ownerId) {
            return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Nicht authentifiziert" }) };
        }
        if (!moduleId) {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Modul-ID fehlt" }) };
        }

        const { fileData, fileName, mimeType } = await parseMultipart(event);
        const timestamp = Date.now();
        const fileKey = `${moduleId}/${ownerId}/${timestamp}-${fileName}`;

        // S3 Upload
        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: fileData,
            ContentType: mimeType,
        }));

        // DynamoDB Metadaten
        const fileRecord = {
            fileId: `${timestamp}`,
            moduleId,
            name: fileName,
            owner: ownerId,
            size: fileData.length,
            createdAt: new Date().toISOString(),
            s3Key: fileKey,
        };

        await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: fileRecord }));

        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Datei erfolgreich hochgeladen.", file: fileRecord }),
        };
    } catch (err) {
        console.error("❌ Upload-Fehler:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Interner Fehler beim Upload", details: err.message }),
        };
    }
};
