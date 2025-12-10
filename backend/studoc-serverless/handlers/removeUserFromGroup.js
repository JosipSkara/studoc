// handlers/removeUserFromGroup.js
import { removeUserFromGroup } from "../services/AdminCognitoService.js";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

async function removeUserFromGroupHandler(event) {
    const groupName = event.pathParameters?.groupName;
    const username = event.pathParameters?.username;

    if (!groupName || !username)
        return apiResponse(400, { error: "Gruppenname oder Benutzername fehlt" });

    try {
        const result = await removeUserFromGroup(username, groupName);
        return apiResponse(200, result);
    } catch (error) {
        console.error("❌ Fehler beim Entfernen des Benutzers:", error);
        return apiResponse(500, { error: error.message });
    }
}

export const handler = withCors(removeUserFromGroupHandler);
