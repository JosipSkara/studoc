// handlers/listGroups.js
import { listGroups } from "../services/AdminCognitoService.js";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

/**
 * Lambda-Handler: Gibt alle Cognito-Gruppen des User Pools zurück.
 * Route: GET /groups
 */
async function listGroupsHandler() {
    try {
        console.log("📋 Lade alle Cognito-Gruppen...");

        const groups = await listGroups();

        // Optional: Nur relevante Informationen zurückgeben
        const cleanGroups = groups.map((g) => ({
            groupName: g.GroupName,
            description: g.Description || "",
            precedence: g.Precedence ?? null,
            lastModified: g.LastModifiedDate || null,
            created: g.CreationDate || null,
        }));

        return apiResponse(200, cleanGroups);
    } catch (error) {
        console.error("❌ Fehler in listGroupsHandler:", error);
        return apiResponse(500, {
            error: error.message || "Interner Serverfehler beim Laden der Gruppen.",
        });
    }
}

export const handler = withCors(listGroupsHandler);
