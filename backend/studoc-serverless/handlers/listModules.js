// handlers/listModules.js
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

// --------------------------------------------------
// ⚙️ Konfiguration
// --------------------------------------------------
const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE_NAME = process.env.MODULES_TABLE_NAME || "StuDoc-Modules_Dev";

const dynamoClient = new DynamoDBClient({ region: REGION });

// --------------------------------------------------
// 🧠 Handler – GET /modules
// --------------------------------------------------
async function listModulesHandler(event) {
    console.log("📩 GET /modules - Event:", JSON.stringify(event, null, 2));

    try {
        // 1️⃣ Cognito-Claims (optional) → z. B. zur Filterung nach Owner
        const userClaims = event.requestContext?.authorizer?.jwt?.claims;
        const userId = userClaims?.sub || null;
        const groups = userClaims?.["cognito:groups"] || [];

        console.log("👤 Benutzer:", { userId, groups });

        // 2️⃣ Alle Module abrufen
        const data = await dynamoClient.send(new ScanCommand({ TableName: TABLE_NAME }));

        // 3️⃣ Ergebnis umwandeln
        const modules =
            data.Items?.map((item) => ({
                moduleId: item.moduleId?.S,
                name: item.name?.S ?? "Unbenanntes Modul",
                description: item.description?.S ?? "",
                ownerId: item.ownerId?.S ?? null,
                createdAt: item.createdAt?.S ?? null,
            })) ?? [];

        // 4️⃣ Optional: Filtern nach Besitzer oder Gruppen
        let filteredModules = modules;
        if (!groups.includes("Admins") && !groups.includes("Dozenten")) {
            // Normale Benutzer sehen nur ihre eigenen Module
            filteredModules = modules.filter((m) => m.ownerId === userId);
        }

        console.log(`📦 ${filteredModules.length} Module gefunden.`);

        return apiResponse(200, filteredModules);
    } catch (err) {
        console.error("❌ Fehler beim Laden der Module:", err);
        return apiResponse(500, { error: "Fehler beim Laden der Module", details: err.message });
    }
}

// --------------------------------------------------
// 🚀 Export mit CORS Wrapper
// --------------------------------------------------
export const handler = withCors(listModulesHandler);
