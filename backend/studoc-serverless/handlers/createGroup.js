// handlers/createGroup.js
import { createGroup } from "../services/AdminCognitoService.js";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

/**
 * Lambda-Handler: Erstellt eine neue Cognito-Gruppe.
 * Route: POST /groups
 */
async function createGroupHandler(event) {
    try {
        const body = JSON.parse(event.body || "{}");
        const { name, description } = body;

        if (!name) {
            return apiResponse(400, { error: "❌ Gruppenname fehlt." });
        }

        console.log(`🆕 Erstelle neue Gruppe: ${name}`);

        const result = await createGroup(name, description);

        console.log("✅ Gruppe erstellt:", result);

        return apiResponse(200, result);
    } catch (error) {
        console.error("❌ Fehler in createGroupHandler:", error);
        return apiResponse(500, {
            error: error.message || "Interner Serverfehler beim Erstellen der Gruppe.",
        });
    }
}

export const handler = withCors(createGroupHandler);
