// services/AdminCognitoService.js
import {
    CognitoIdentityProviderClient,
    ListGroupsCommand,
    CreateGroupCommand,
    DeleteGroupCommand,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand,
    ListUsersCommand,
    ListUsersInGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// ----------------------------------------------------
// ⚙️ Konfiguration
// ----------------------------------------------------
const REGION = process.env.AWS_REGION || "us-east-1";
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || process.env.USER_POOL_ID;

if (!USER_POOL_ID) {
    console.error("❌ FATAL: USER_POOL_ID / COGNITO_USER_POOL_ID fehlt in Umgebungsvariablen.");
    throw new Error("Configuration Error: USER_POOL_ID missing.");
}

const cognito = new CognitoIdentityProviderClient({ region: REGION });

// ----------------------------------------------------
// 📋 1. Alle Gruppen abrufen
// ----------------------------------------------------
export async function listGroups() {
    try {
        const cmd = new ListGroupsCommand({ UserPoolId: USER_POOL_ID });
        const res = await cognito.send(cmd);
        return res.Groups || [];
    } catch (err) {
        console.error("❌ Fehler bei listGroups:", err);
        throw new Error("Fehler beim Abrufen der Gruppen aus Cognito.");
    }
}

// ----------------------------------------------------
// ➕ 2. Gruppe erstellen
// ----------------------------------------------------
export async function createGroup(name, description = `Group ${name}`) {
    try {
        const cmd = new CreateGroupCommand({
            UserPoolId: USER_POOL_ID,
            GroupName: name,
            Description: description,
        });
        const res = await cognito.send(cmd);
        return res.Group;
    } catch (err) {
        console.error("❌ Fehler bei createGroup:", err);
        throw new Error(`Fehler beim Erstellen der Gruppe "${name}".`);
    }
}


// ----------------------------------------------------
// ❌ 3. Gruppe löschen
// ----------------------------------------------------
export async function deleteGroup(groupName) {
    try {
        const cmd = new DeleteGroupCommand({
            UserPoolId: USER_POOL_ID,
            GroupName: groupName,
        });
        await cognito.send(cmd);
        return { message: `✅ Gruppe ${groupName} gelöscht.` };
    } catch (err) {
        console.error(`❌ Fehler bei deleteGroup (${groupName}):`, err);
        throw new Error(`Fehler beim Löschen der Gruppe "${groupName}".`);
    }
}


// ----------------------------------------------------
// 👥 4. Alle Benutzer abrufen
// ----------------------------------------------------
export async function listAllUsers() {
    try {
        const cmd = new ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Limit: 60,
        });
        const res = await cognito.send(cmd);
        return (
            res.Users?.map((u) => ({
                username: u.Username,
                email: u.Attributes.find((a) => a.Name === "email")?.Value,
                given_name: u.Attributes.find((a) => a.Name === "given_name")?.Value,
                family_name: u.Attributes.find((a) => a.Name === "family_name")?.Value,
                enabled: u.Enabled,
                status: u.UserStatus,
            })) || []
        );
    } catch (err) {
        console.error("❌ Fehler bei listAllUsers:", err);
        throw new Error("Fehler beim Laden der Benutzerliste.");
    }
}

// ----------------------------------------------------
// 📂 5. Mitglieder einer Gruppe abrufen
// ----------------------------------------------------
export async function listUsersInGroup(groupName) {
    try {
        const cmd = new ListUsersInGroupCommand({
            UserPoolId: USER_POOL_ID,
            GroupName: groupName,
        });
        const res = await cognito.send(cmd);
        return (
            res.Users?.map((u) => ({
                username: u.Username,
                email: u.Attributes.find((a) => a.Name === "email")?.Value,
                given_name: u.Attributes.find((a) => a.Name === "given_name")?.Value,
                family_name: u.Attributes.find((a) => a.Name === "family_name")?.Value,
                enabled: u.Enabled,
                status: u.UserStatus,
            })) || []
        );
    } catch (err) {
        console.error(`❌ Fehler bei listUsersInGroup (${groupName}):`, err);
        throw new Error(`Fehler beim Laden der Mitglieder für Gruppe "${groupName}".`);
    }
}

// ----------------------------------------------------
// 👤 6. Benutzer zu einer Gruppe hinzufügen
// ----------------------------------------------------
export async function addUserToGroup(username, groupName) {
    try {
        const cmd = new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: username,
            GroupName: groupName,
        });
        await cognito.send(cmd);
        return { message: `✅ Benutzer ${username} wurde zu ${groupName} hinzugefügt.` };
    } catch (err) {
        console.error(`❌ Fehler bei addUserToGroup (${username} → ${groupName}):`, err);
        throw new Error(`Fehler beim Hinzufügen von Benutzer "${username}" zur Gruppe "${groupName}".`);
    }
}

// ----------------------------------------------------
// 🚫 7. Benutzer aus einer Gruppe entfernen
// ----------------------------------------------------
export async function removeUserFromGroup(username, groupName) {
    try {
        const cmd = new AdminRemoveUserFromGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: username,
            GroupName: groupName,
        });
        await cognito.send(cmd);
        return { message: `✅ Benutzer ${username} wurde aus ${groupName} entfernt.` };
    } catch (err) {
        console.error(`❌ Fehler bei removeUserFromGroup (${username} → ${groupName}):`, err);
        throw new Error(`Fehler beim Entfernen von Benutzer "${username}" aus Gruppe "${groupName}".`);
    }
}
