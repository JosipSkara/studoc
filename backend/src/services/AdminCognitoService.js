// backend/src/services/AdminCognitoService.js
import {
    CognitoIdentityProviderClient,
    ListGroupsCommand,
    CreateGroupCommand,
    DeleteGroupCommand,
    AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand, // 👈 hinzugefügt
    ListUsersCommand,
    ListUsersInGroupCommand, // 👈 hinzugefügt
} from "@aws-sdk/client-cognito-identity-provider";

// -------------------- 🔧 Konfiguration --------------------
const REGION = "us-east-1";
const USER_POOL_ID = "us-east-1_Y9732eTGf"; // 👈 dein User Pool ID
const cognito = new CognitoIdentityProviderClient({ region: REGION });

/* -------------------- 📋 ALLE GRUPPEN LADEN -------------------- */
export async function listGroups() {
    const cmd = new ListGroupsCommand({ UserPoolId: USER_POOL_ID });
    const res = await cognito.send(cmd);
    return res.Groups || [];
}

/* -------------------- ➕ GRUPPE ERSTELLEN -------------------- */
export async function createGroup(name) {
    const cmd = new CreateGroupCommand({
        UserPoolId: USER_POOL_ID,
        GroupName: name,
        Description: `Group ${name}`,
    });
    const res = await cognito.send(cmd);
    return res.Group;
}

/* -------------------- ❌ GRUPPE LÖSCHEN -------------------- */
export async function deleteGroup(groupName) {
    const cmd = new DeleteGroupCommand({
        UserPoolId: USER_POOL_ID,
        GroupName: groupName,
    });
    await cognito.send(cmd);
    return { message: `Group ${groupName} deleted.` };
}

/* -------------------- 👥 BENUTZER ZU GRUPPE HINZUFÜGEN -------------------- */
export async function addUserToGroup(username, groupName) {
    const cmd = new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: groupName,
    });
    await cognito.send(cmd);
    return { message: `✅ Benutzer ${username} zu ${groupName} hinzugefügt.` };
}

/* -------------------- ❌ BENUTZER AUS GRUPPE ENTFERNEN -------------------- */
export async function removeUserFromGroup(username, groupName) {
    const cmd = new AdminRemoveUserFromGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: groupName,
    });
    await cognito.send(cmd);
    return { message: `✅ Benutzer ${username} aus ${groupName} entfernt.` };
}

/* -------------------- 📋 MITGLIEDER EINER GRUPPE LADEN -------------------- */
export async function listUsersInGroup(groupName) {
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
        })) || []
    );
}

/* -------------------- 📇 ALLE BENUTZER LADEN -------------------- */
export async function listAllUsers() {
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
        })) || []
    );
}
