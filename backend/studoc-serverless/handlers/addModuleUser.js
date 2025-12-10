// handlers/addModuleUser.js
import { apiResponse } from "./utils/apiResponse.js";
import { withCors } from "./utils/withCors.js";
import { getGroupsFromToken, getUsernameFromToken } from "./utils/auth.js";
import { getModuleById, addUserToModule } from "../services/dynamoService.js";

async function addModuleUserHandler(event) {
    const moduleId = event.pathParameters?.id;
    const { username } = JSON.parse(event.body || "{}"); // Benutzername aus dem Body

    const requestingUsername = getUsernameFromToken(event);
    const userGroups = getGroupsFromToken(event);
    const isAdmin = userGroups.includes("admin") || userGroups.includes("dozenten");

    if (!moduleId || !username) {
        return apiResponse(400, { error: "Modul-ID oder Benutzername fehlt." });
    }

    try {
        const module = await getModuleById(moduleId);

        if (!module) {
            return apiResponse(404, { error: "Modul nicht gefunden." });
        }

        // 🛡️ BERECHTIGUNGSPRÜFUNG
        if (!isAdmin && module.owner !== requestingUsername) {
            return apiResponse(403, {
                error: "Zugriff verweigert. Nur Modulbesitzer oder Admin dürfen Benutzer zuweisen."
            });
        }

        // ➕ Benutzer zu Modul hinzufügen
        const result = await addUserToModule(moduleId, username);

        return apiResponse(200, result);

    } catch (error) {
        console.error("❌ Fehler beim Hinzufügen des Benutzers:", error);
        return apiResponse(500, { error: error.message || "Interner Serverfehler" });
    }
}

export const handler = withCors(addModuleUserHandler);