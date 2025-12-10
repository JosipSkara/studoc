// src/services/apiService.js

import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE = import.meta.env.VITE_API_BASE; // https://vbkh5c3abb.execute-api...

/**
 * Wrapper für geschützte API-Aufrufe, der das JWT von Amplify abruft.
 */
export const fetchProtected = async (path, options = {}) => {
    try {
        const session = await fetchAuthSession();
        // Wir verwenden das Access Token, da der Cognito Authorizer es benötigt.
        const token = session.tokens?.accessToken?.toString();

        if (!token) {
            throw new Error("AUTHENTICATION_REQUIRED: Benutzer nicht eingeloggt oder Token fehlt.");
        }

        const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        };

        const response = await fetch(url, {
            ...options,
            headers: headers,
        });

        const data = await response.json();

        if (!response.ok) {
            // Wirft den Fehler der API (z.B. 403 Forbidden oder Backend 500 mit JSON-Body)
            throw new Error(data.message || data.error || `API Fehler: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error("❌ Geschützter Aufruf fehlgeschlagen:", error);
        throw error;
    }
};

// --------------- SPEZIFISCHE API FUNKTIONEN ---------------

export const apiListGroups = () => fetchProtected("groups");

// 🟢 KORRIGIERT: Verwendet den korrekten Backend-Pfad "/users/all"
export const apiFetchAllUsers = () => fetchProtected("users/all");
// ⚠️ Hinweis: apiListAllUsers ist jetzt redundant, aber ich behalte sie bei, falls sie irgendwo verwendet wird.
export const apiListAllUsers = () => fetchProtected("users/all");

export const apiFetchMembers = (groupName) => fetchProtected(`groups/${groupName}/members`);
export const apiCreateGroup = (name) => fetchProtected("groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
});
export const apiAddUserToGroup = (groupName, username) => fetchProtected(`groups/${groupName}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
});
export const apiRemoveUser = (groupName, username) => fetchProtected(`groups/${groupName}/members/${username}`, {
    method: "DELETE",
});
export const apiDeleteGroup = (groupName) => fetchProtected(`groups/${groupName}`, {
    method: "DELETE",
});

// --------------- MODULES API ---------------

/** 📋 Alle Module abrufen (GET /modules) */
export const apiListModules = () => fetchProtected("modules");

/** ➕ Neues Modul erstellen (POST /modules) */
export const apiCreateModule = (name, description = "") =>
    fetchProtected("modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
    });

// --------------- MODULES ACCESS API ---------------

/** 👥 Benutzer eines Moduls abrufen (GET /modules/{id}/users) */
export const apiListModuleUsers = (moduleId) =>
    fetchProtected(`modules/${moduleId}/users`);

/** ➕ Benutzer zu Modul hinzufügen (POST /modules/{id}/users) */
export const apiAddUserToModule = (moduleId, username) =>
    fetchProtected(`modules/${moduleId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
    });

/** ❌ Benutzer von Modul entfernen (DELETE /modules/{id}/users/{username}) */
export const apiRemoveUserFromModule = (moduleId, username) =>
    fetchProtected(`modules/${moduleId}/users/${username}`, {
        method: "DELETE",
    });

export const apiDeleteModule = (moduleName) =>
    fetchProtected(`modules/${moduleName}`, {
        method: "DELETE",
    });

// ⚠️ Hinweis: apiListAllUsers und apiFetchAllUsers sind nun identisch.
// Wenn Sie die App mit dieser Datei neu starten, sollte der 404/CORS-Fehler behoben sein.