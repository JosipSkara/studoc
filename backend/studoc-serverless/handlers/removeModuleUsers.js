// handlers/listModuleUsers.js
import { apiResponse } from "./utils/apiResponse.js";
import { withCors } from "./utils/withCors.js";
import { getGroupsFromToken, getUsernameFromToken } from "./utils/auth.js";
import { getModuleById } from "../services/dynamoService.js";

/**
 * Ruft die Liste der Benutzer ab, die einem bestimmten Modul zugewiesen sind.
 * Nur Modulbesitzer oder Admins dürfen diese Liste sehen.
 */
async function listModuleUsersHandler(event) {

    // 1. Modul-ID aus Path-Parametern abrufen
    const moduleId = event.pathParameters?.id;

    // 2. Benutzer- und Gruppeninformationen abrufen
    const requestingUsername = getUsernameFromToken(event);
    const userGroups = getGroupsFromToken(event);
    const isAdmin = userGroups.includes("Admins") || userGroups.includes("Dozenten");

    if (!moduleId) {
        return apiResponse(400, { error: "Modul-ID fehlt in der URL." });
    }

    try {
        const module = await getModuleById(moduleId);

        if (!module) {
            return apiResponse(404, { error: "Modul nicht gefunden." });
        }

        // 🛡️ BERECHTIGUNGSPRÜFUNG: Muss Admin oder Modulbesitzer sein
        if (!isAdmin && module.owner !== requestingUsername) {
            console.log(`❌ Zugriff verweigert: ${requestingUsername} versucht, Benutzer für Modul ${moduleId} abzurufen.`);
            return apiResponse(403, {
                error: "Zugriff verweigert. Nur Modulbesitzer oder Admin darf Benutzer verwalten."
            });
        }

        // Gib die Liste der zugewiesenen Benutzer zurück (inkl. Besitzer)
        return apiResponse(200, module.users || []);

    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Modulbenutzer:", error);
        return apiResponse(500, { error: error.message || "Interner Serverfehler" });
    }
}

export const handler = withCors(listModuleUsersHandler);