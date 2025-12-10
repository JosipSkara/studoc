// handlers/listModuleUser.js

import { apiResponse } from "./utils/apiResponse.js";
import { withCors } from "./utils/withCors.js";
import { getModuleById } from "../services/dynamoService.js";
import { listAllUsers } from "../services/AdminCognitoService.js";
import { getUsernameFromToken, getGroupsFromToken } from "./utils/auth.js";


/**
 * Lambda-Handler: Ruft alle zugewiesenen Benutzer für ein spezifisches Modul ab.
 * Zugriff: Nur Modulbesitzer oder Admin/Dozent.
 * Route: GET /modules/{id}/users
 */
async function listModuleUsersHandler(event) {
    try {
        // 1. JWT-Claims abrufen
        const username = getUsernameFromToken(event);
        const userGroups = getGroupsFromToken(event);

        // Annahme: Die Gruppen in Cognito heißen 'admin' und 'Dozenten' (oder 'dozenten')
        // Wir gehen davon aus, dass getGroupsFromToken die Claims in Kleinbuchstaben umwandelt.
        const isAdminOrDozent = userGroups.includes("admin") || userGroups.includes("dozenten");

        // Modul-ID aus dem Pfad extrahieren
        const moduleId = event.pathParameters?.id;

        if (!moduleId) {
            return apiResponse(400, { error: "Modul-ID fehlt im Pfad." });
        }

        // 2. Modul-Details aus DynamoDB abrufen
        const module = await getModuleById(moduleId);

        if (!module) {
            return apiResponse(404, { error: `Modul mit ID ${moduleId} nicht gefunden.` });
        }

        // 3. Autorisierung: Prüfung, ob der Benutzer berechtigt ist
        const isOwner = module.owner === username;

        if (!isAdminOrDozent && !isOwner) {
            console.log(`❌ Zugriff verweigert: ${username} versucht, Benutzer für Modul ${moduleId} abzurufen. Ist Admin: ${isAdminOrDozent}, Ist Owner: ${isOwner}`);
            // WICHTIG: Korrekter Statuscode für Zugriffsverweigerung (403 Forbidden)
            return apiResponse(403, {
                error: "Zugriff verweigert. Nur Modulbesitzer oder Admin/Dozent dürfen Benutzerdaten abrufen."
            });
        }

        // 4. Datenverarbeitung (Rückgabe der Liste der zugewiesenen Benutzer)
        // Die Liste der Benutzer-Usernames ist im Modul-Objekt gespeichert (z.B. module.users)

        // Sicherstellen, dass die Benutzerliste ein Array ist
        const assignedUsernames = Array.isArray(module.users) ? module.users : [];

        // HINWEIS: Wenn Sie vollständige Benutzerobjekte zurückgeben müssten,
        // müssten Sie hier listAllUsers() aufrufen und die Ergebnisse filtern.
        // Da das Frontend (ModuleUserManagement.jsx) die vollständigen Benutzer
        // bereits über apiListAllUsers() abruft und nur die Usernames benötigt,
        // geben wir hier nur die Liste der Usernames zurück.

        return apiResponse(200, assignedUsernames);

    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Modulbenutzer:", error);

        // Gibt einen generischen Fehler zurück, wenn ein interner Fehler auftritt (z.B. DynamoDB Fehler)
        return apiResponse(500, {
            error: error.message || "Interner Serverfehler beim Abrufen der Modulbenutzer.",
        });
    }
}

export const handler = withCors(listModuleUsersHandler);