// handlers/listModules.js

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";
// Die Hilfsfunktion getUsernameFromToken wird hier nicht benötigt, da wir 'sub' direkt verwenden.

// --------------------------------------------------
// ⚙️ Konfiguration
// --------------------------------------------------
const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE_NAME = process.env.MODULES_TABLE_NAME || "StuDoc-Modules_Dev";

// Low-Level DynamoDB Client
const dynamoClient = new DynamoDBClient({ region: REGION });

// Helferfunktion, die die User-ID (sub-Claim) aus dem Token holt
const getUserIdFromToken = (event) => {
    // Die Modul-Tabelle speichert die User-ID ('sub' claim)
    return event.requestContext?.authorizer?.jwt?.claims?.sub || null;
};

// --------------------------------------------------
// 🧠 Handler – GET /modules
// --------------------------------------------------
async function listModulesHandler(event) {
    console.log("📩 GET /modules - Event:", JSON.stringify(event, null, 2));

    const userId = getUserIdFromToken(event);

    try {
        // 1️⃣ Cognito-Claims abrufen und Gruppen robust verarbeiten
        const userClaims = event.requestContext?.authorizer?.jwt?.claims;
        const groupsRaw = userClaims?.["cognito:groups"] || "[]";
        let groups = [];

        // Robustes Parsen der Gruppen-Claims (konvertiert zu Kleinbuchstaben)
        try {
            let processed = groupsRaw.replace(/[\[\]"]/g, '').trim();
            groups = processed.split(/[,\s]+/).map(g => g.toLowerCase()).filter(g => g.length > 0);
        } catch {
            groups = [];
        }

        // 2️⃣ Alle Module abrufen (Scan)
        const data = await dynamoClient.send(new ScanCommand({ TableName: TABLE_NAME }));

        // 3️⃣ Ergebnis umwandeln und Daten für die Filterung vorbereiten
        // Wir konvertieren hier nur die offensichtlichen Attribute
        const modules =
            data.Items?.map((item) => ({
                // Konvertiert S-Type zu String
                moduleId: item.moduleId?.S,
                name: item.name?.S ?? "Unbenanntes Modul",
                description: item.description?.S ?? "",
                ownerId: item.ownerId?.S ?? null,
                createdAt: item.createdAt?.S ?? null,

                // ⚠️ WICHTIG: Das 'users'-Attribut (Typ L) wird als Low-Level-Struktur beibehalten!
                usersRaw: item.users?.L,
                // ... andere Attribute ...
            })) ?? [];

        // 4️⃣ Autorisierungsprüfung und Filterung
        const isAdminOrDozent = groups.includes("admin") || groups.includes("dozenten");

        let filteredModules = modules;

        if (!isAdminOrDozent) {

            filteredModules = modules.filter((m) => {
                // Prüfung 1: Ist der Benutzer der Besitzer? (Korrigiert auf 'ownerId')
                const isOwner = m.ownerId === userId;

                // Prüfung 2: Ist der Benutzer zugewiesen? (Korrigiert für Low-Level-List-Typ)
                // m.usersRaw ist ein Array von { S: "..." } Objekten.
                const assignedUserIds = m.usersRaw?.map(userItem => userItem.S) || [];
                const isAssigned = assignedUserIds.includes(userId);

                return isOwner || isAssigned;
            });
        }

        console.log(`👤 ${userId} fand ${filteredModules.length} Module (Admin/Dozent: ${isAdminOrDozent}).`);

        // Entfernen des temporären 'usersRaw' Attributs vor der Rückgabe
        const finalModules = filteredModules.map(({ usersRaw, ...rest }) => rest);

        return apiResponse(200, finalModules);
    } catch (err) {
        console.error("❌ Fehler beim Laden der Module:", err);
        return apiResponse(500, { error: "Fehler beim Laden der Module", details: err.message });
    }
}

// --------------------------------------------------
// 🚀 Export mit CORS Wrapper
// --------------------------------------------------
export const handler = withCors(listModulesHandler);