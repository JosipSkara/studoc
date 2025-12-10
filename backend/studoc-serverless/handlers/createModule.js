// handlers/createModule.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { apiResponse } from "./utils/apiResponse.js";

// --------------------------------------------------
// ⚙️ Konfiguration
// --------------------------------------------------
const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE_NAME = process.env.MODULES_TABLE_NAME || "StuDoc-Modules_Dev";

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// --------------------------------------------------
// 🧠 Lambda Handler – POST /modules
// --------------------------------------------------
export async function handler(event) {
    console.log("📩 Eingehendes Event:", JSON.stringify(event, null, 2));

    try {
        // 1️⃣ Prüfen, ob Nutzer authentifiziert ist
        const userClaims = event.requestContext?.authorizer?.jwt?.claims;
        const ownerId = userClaims?.sub || "anonymous";

        if (ownerId === "anonymous") {
            console.warn("❌ Kein gültiger Benutzer im Token gefunden!");
            return apiResponse(401, { error: "Authentifizierung erforderlich." });
        }

        // 2️⃣ Body parsen
        const body = JSON.parse(event.body || "{}");
        const { name, description } = body;

        if (!name || name.trim() === "") {
            return apiResponse(400, { error: "Modulname darf nicht leer sein." });
        }

        // 3️⃣ Neues Modulobjekt erstellen
        const newModule = {
            moduleId: Date.now().toString(), // einfache eindeutige ID
            name: name.trim(),
            description: description?.trim() || "",
            ownerId: ownerId,
            createdAt: new Date().toISOString(),
        };

        // 4️⃣ Modul speichern
        await docClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: newModule,
            })
        );

        console.log("✅ Modul erfolgreich erstellt:", newModule);

        // 5️⃣ Erfolg zurückgeben
        return apiResponse(201, {
            message: "Modul erfolgreich erstellt.",
            module: newModule,
        });

    } catch (err) {
        console.error("💥 Fehler beim Erstellen des Moduls:", err);
        return apiResponse(500, {
            error: "Interner Serverfehler beim Erstellen des Moduls.",
            details: err.message,
        });
    }
}
