// handlers/listGroupMembers.js
import { listUsersInGroup } from "../services/AdminCognitoService.js";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

/**
 * Lambda-Handler: Listet alle Benutzer einer bestimmten Cognito-Gruppe auf.
 * Route: GET /groups/{groupName}/members
 */
async function listGroupMembersHandler(event) {
    try {
        const groupName = event.pathParameters?.groupName;

        if (!groupName) {
            console.warn("⚠️ Kein Gruppenname angegeben.");
            return apiResponse(400, { error: "Gruppenname fehlt in der URL." });
        }

        console.log(`👥 Lade Mitglieder für Gruppe: ${groupName}`);

        const members = await listUsersInGroup(groupName);

        // Falls Service schon vereinfacht zurückgibt → keine zweite Transformation
        if (!Array.isArray(members)) {
            console.error("❌ Unerwartetes Antwortformat:", members);
            return apiResponse(500, { error: "Ungültiges Antwortformat aus AdminCognitoService." });
        }

        console.log(`✅ ${members.length} Mitglieder in Gruppe '${groupName}' gefunden.`);

        return apiResponse(200, members);
    } catch (error) {
        console.error("❌ Fehler in listGroupMembersHandler:", error);

        // Spezifischer Cognito-Fehler (z. B. Gruppe existiert nicht)
        if (error.name === "ResourceNotFoundException") {
            return apiResponse(404, { error: `Gruppe '${event.pathParameters?.groupName}' nicht gefunden.` });
        }

        return apiResponse(500, {
            error: error.message || "Interner Serverfehler beim Laden der Gruppenmitglieder.",
            stack: error.stack,
        });
    }
}

export const handler = withCors(listGroupMembersHandler);
