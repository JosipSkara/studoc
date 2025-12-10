// handlers/addUserToGroup.js
import { addUserToGroup } from "../services/AdminCognitoService.js";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

/**
 * Lambda-Handler: Fügt einen Benutzer zu einer Cognito-Gruppe hinzu.
 * Route: POST /groups/{groupName}/members
 */
async function addUserToGroupHandler(event) {
    try {
        const groupName = event.pathParameters?.groupName;
        const body = JSON.parse(event.body || "{}");
        const username = body.username;

        if (!groupName || !username) {
            console.warn("⚠️ Fehlende Parameter:", { groupName, username });
            return apiResponse(400, {
                error: "Gruppenname oder Benutzername fehlt.",
            });
        }

        console.log(`👤 Füge Benutzer ${username} zu Gruppe ${groupName} hinzu...`);

        const result = await addUserToGroup(username, groupName);

        console.log("✅ Erfolgreich hinzugefügt:", result);

        return apiResponse(200, result);
    } catch (error) {
        console.error("❌ Fehler in addUserToGroupHandler:", error);
        return apiResponse(500, {
            error: error.message || "Interner Serverfehler beim Hinzufügen des Benutzers.",
        });
    }
}

export const handler = withCors(addUserToGroupHandler);
