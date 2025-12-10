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
// INDEX_NAME wird verwendet, um nach moduleId zu suchen (muss in serverless.yml definiert sein)
const INDEX_NAME = "moduleId-index";

// DynamoDB DocumentClient (automatische Typ-Konvertierung)
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Helferfunktion, die die User-ID (sub-Claim) aus dem Token holt
const getUserIdFromToken = (event) => {
    return event.requestContext?.authorizer?.jwt?.claims?.sub || null;
};

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

    // 2️⃣ Cognito-Benutzer und Gruppen prüfen
    const userClaims = event.requestContext?.authorizer?.jwt?.claims || {};
    const userId = getUserIdFromToken(event);
    const groupsRaw = userClaims["cognito:groups"] || "[]";

    // Gruppen robust in Kleinbuchstaben konvertieren
    let groups = [];
    try {
        let processed = groupsRaw.replace(/[\[\]"]/g, '').trim();
        groups = processed.split(/[,\s]+/).map(g => g.toLowerCase()).filter(g => g.length > 0);
    } catch {
        groups = [];
    }

    const isAdminOrDozent = groups.includes("admin") || groups.includes("dozenten");

    console.log("👤 Benutzer:", { userId, isAdminOrDozent, moduleId });

    try {
        // 3️⃣ Dateien für das Modul aus DynamoDB abrufen
        // Wir verwenden QueryCommand auf dem GSI (moduleId-index), um alle Dateien des Moduls zu holen.
        const data = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: INDEX_NAME,
                KeyConditionExpression: "moduleId = :m",
                ExpressionAttributeValues: { ":m": moduleId },
            })
        );

        let files = data.Items || [];

        // 4️⃣ KORREKTUR: Zugriffsbeschränkung entfernt/angepasst.
        // Wenn der Benutzer diesen Endpunkt erreicht (und er im Frontend das Modul sieht),
        // soll er alle Dateien dieses Moduls sehen, unabhängig davon, wer sie hochgeladen hat.

        // Der restriktive Filter ist nur notwendig, wenn z.B. Studierende nur ihre eigenen
        // Uploads sehen sollen, was hier nicht der Fall zu sein scheint.
        /*
        // ❌ ENTFERNT: Würde zugewiesenen Benutzern die Dateien von Uploadern wegfiltern!
        if (!groups.includes("Admins") && !groups.includes("Dozenten")) {
            files = files.filter((f) => f.owner === userId);
        }
        */

        // Wenn Sie möchten, dass nur Admins/Dozenten alle Metadaten sehen,
        // könnten Sie hier sensible Daten filtern, aber die Dateiliste bleibt gleich.
        // Da wir den Filter komplett entfernt haben, sieht jeder, der Zugriff auf den Endpunkt hat, alle Dateien.

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