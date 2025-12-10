// handlers/deleteGroup.js
import { deleteGroup } from "../services/AdminCognitoService.js";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

/**
 * Lambda-Handler: Löscht eine Cognito-Gruppe.
 * Route: DELETE /groups/{groupName}
 */
async function deleteGroupHandler(event) {
    try {
        const groupName = event.pathParameters?.groupName;

        if (!groupName) {
            console.warn("⚠️ Kein Gruppenname angegeben.");
            return apiResponse(400, { error: "Gruppenname fehlt in der URL." });
        }

        console.log(`🗑️ Lösche Gruppe: ${groupName}`);

        const result = await deleteGroup(groupName);

        console.log("✅ Gruppe gelöscht:", result);

        return apiResponse(200, result);
    } catch (error) {
        console.error("❌ Fehler in deleteGroupHandler:", error);
        return apiResponse(500, {
            error: error.message || "Interner Serverfehler beim Löschen der Gruppe.",
        });
    }
}

export const handler = withCors(deleteGroupHandler);
