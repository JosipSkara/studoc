// handlers/listModuleFiles.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

// --------------------------------------------------
// ⚙️ Konfiguration
// --------------------------------------------------
const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE_NAME = process.env.FILES_TABLE_NAME || "StuDoc-Files_Dev";
const INDEX_NAME = "moduleId-index"; // Muss existieren (in serverless.yml definiert)

// DynamoDB DocumentClient (automatische Typ-Konvertierung)
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// --------------------------------------------------
// 🧠 Handler – GET /modules/{moduleId}/files
// --------------------------------------------------
async function listModuleFilesHandler(event) {
    console.log("📩 GET /modules/{moduleId}/files:", JSON.stringify(event, null, 2));

    // 1️⃣ Pfadparameter prüfen
    const moduleId = event.pathParameters?.moduleId;
    if (!moduleId) {
        return apiResponse(400, { error: "Fehlende Modul-ID im Pfad" });
    }

    // 2️⃣ Cognito-Benutzer und Gruppen prüfen (optional)
    const userClaims = event.requestContext?.authorizer?.jwt?.claims || {};
    const userId = userClaims.sub || null;
    const groups = userClaims["cognito:groups"] || [];

    console.log("👤 Benutzer:", { userId, groups, moduleId });

    try {
        // 3️⃣ Dateien für das Modul aus DynamoDB abrufen
        const data = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: INDEX_NAME,
                KeyConditionExpression: "moduleId = :m",
                ExpressionAttributeValues: { ":m": moduleId },
            })
        );

        let files = data.Items || [];

        // 4️⃣ Optional: Zugriffsbeschränkung
        if (!groups.includes("Admins") && !groups.includes("Dozenten")) {
            files = files.filter((f) => f.owner === userId);
        }

        console.log(`📦 ${files.length} Dateien gefunden für Modul ${moduleId}.`);

        // 5️⃣ Erfolgsmeldung zurückgeben
        return apiResponse(200, files);
    } catch (err) {
        console.error("❌ Fehler in listModuleFiles:", err);
        return apiResponse(500, {
            error: "Fehler beim Laden der Dateien",
            details: err.message,
        });
    }
}

// --------------------------------------------------
// 🚀 Export mit automatischem CORS-Support
// --------------------------------------------------
export const handler = withCors(listModuleFilesHandler);
