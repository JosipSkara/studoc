// StuDoc-UploadFile Lambda Code (Node.js CommonJS Syntax)
// Datei: index.js

// WICHTIGE ÄNDERUNG: ALLES AUF require() UMGESTELLT
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const busboy = require('busboy');

// --- Konfiguration ---
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "StuDoc-Files_Test";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "ihr-tatsächlicher-s3-bucket-name";
const REGION = process.env.AWS_REGION || "us-east-1";

const s3Client = new S3Client({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

/**
 * Parst den multipart/form-data Body aus dem Lambda Event mit busboy.
 * Gibt den Dateipuffer und Metadaten zurück.
 */
function parseMultipartBody(event) {
    return new Promise((resolve, reject) => {
        let fileContent = null;
        let fileName = null;
        let mimeType = null;

        // Body-Daten dekodieren, falls Base64-kodiert
        const buffer = event.isBase64Encoded ?
            Buffer.from(event.body, 'base64') : Buffer.from(event.body, 'binary');

        // Boundary aus dem Content-Type Header extrahieren
        const contentType = event.headers['content-type'] || event.headers['Content-Type'];
        if (!contentType) {
            return reject(new Error("Content-Type Header fehlt oder ist ungültig."));
        }
        const bb = busboy({ headers: { 'content-type': contentType } });

        bb.on('file', (fieldname, file, info) => {
            if (fieldname === 'file') { // 'file' ist der Name des Feldes vom Proxy
                const chunks = [];
                file.on('data', (data) => chunks.push(data));
                file.on('end', () => {
                    fileContent = Buffer.concat(chunks);
                    fileName = info.filename;
                    mimeType = info.mimeType;
                });
            } else {
                file.resume();
            }
        }).on('field', (fieldname, val) => {
            // Textfelder werden hier nicht benötigt
        }).on('error', (err) => {
            reject(err);
        }).on('finish', () => {
            resolve({ fileContent, fileName, mimeType });
        });

        // Den gesamten Buffer an Busboy senden
        bb.end(buffer);
    });
}


// WICHTIGE ÄNDERUNG: EXPORT AUF CJS UMGESTELLT
exports.handler = async (event) => {
    try {
        // --- DEBUG: Eingehende Parameter protokollieren ---
        console.log('Eingehendes Event (Path, Headers, Auth):', JSON.stringify({
            pathParameters: event.pathParameters,
            headers: event.headers,
            authorizer: event.requestContext.authorizer || 'N/A'
        }, null, 2));

        const { moduleId } = event.pathParameters || {};

        // 1. Authentifizierung und Validierung
        const ownerId = event.requestContext.authorizer?.claims?.sub || 'anonymous';

        console.log('Validierungswerte:', { ownerId, moduleId });

        if (ownerId === 'anonymous' || !moduleId) {
            console.error(`❌ Validierungsfehler: ownerId=${ownerId}, moduleId=${moduleId}`);
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: "Authentifizierung oder Modul-ID fehlt." })
            };
        }

        // 2. Multipart Body Parsen
        const { fileContent, fileName, mimeType } = await parseMultipartBody(event);

        if (!fileContent || fileContent.length === 0 || !fileName) {
            throw new Error("Dateiinhalte oder Dateiname fehlen nach dem Parsen.");
        }

        // 3. Datei nach S3 hochladen
        const fileKey = `${moduleId}/${ownerId}/${Date.now()}-${fileName}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: fileKey,
            Body: fileContent,
            ContentType: mimeType,
            ACL: 'private'
        }));

        // 4. Metadaten in DynamoDB speichern
        const fileMetadata = {
            fileId: Date.now().toString(),
            moduleId: moduleId,
            name: fileName,
            s3Key: fileKey,
            owner: ownerId,
            size: fileContent.length,
            createdAt: new Date().toISOString()
        };

        await ddbDocClient.send(new PutCommand({
            TableName: DYNAMODB_TABLE_NAME,
            Item: fileMetadata,
        }));

        // 5. Erfolgsantwort
        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({
                message: "Datei erfolgreich hochgeladen.",
                bucket: S3_BUCKET_NAME,
                key: fileKey,
                metadata: fileMetadata
            }),
        };

    } catch (err) {
        console.error("❌ UPLOAD LAMBDA FEHLER:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Fehler beim Dateiupload.", details: err.message }),
        };
    }
};ich