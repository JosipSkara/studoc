// handlers/listAllUsers.js
import { listAllUsers } from "../services/AdminCognitoService.js";
import { withCors } from "./utils/withCors.js";
import { apiResponse } from "./utils/apiResponse.js";

/**
 * Lambda-Handler: Gibt alle Benutzer aus dem Cognito-User-Pool zurück.
 * Route: GET /users
 */
async function listAllUsersHandler() {
    try {
        console.log("👥 Lade alle Benutzer aus Cognito...");
        const users = await listAllUsers();

        return apiResponse(200, users);
    } catch (error) {
        console.error("❌ Fehler in listAllUsersHandler:", error);
        return apiResponse(500, {
            error: error.message || "Interner Serverfehler beim Laden der Benutzerliste.",
        });
    }
}

export const handler = withCors(listAllUsersHandler);
