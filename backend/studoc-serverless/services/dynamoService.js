// src/services/dynamoService.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    UpdateCommand,
    GetCommand, // ⬅️ DIESER BEFEHL MUSS HIER IMPORTIERT WERDEN
} from "@aws-sdk/lib-dynamodb";

// ----------------------------------------------------
// ⚙️ Globale Konfiguration
// ----------------------------------------------------
const REGION = process.env.AWS_REGION || "us-east-1";
// ⚠️ HIER WICHTIG: Ersetzen Sie den Platzhalter durch Ihre ENV Variable
const TABLE_NAME = process.env.MODULES_TABLE_NAME || "StuDoc-Modules_dev";

// 1. Initialisiere den Standard-Client
const ddbClient = new DynamoDBClient({ region: REGION });

// 2. Initialisiere den DocumentClient (für einfachere JSON-Handhabung)
// 💡 DIES IST DIE VARIABLE, DIE FEHLT:
const dynamoDocClient = DynamoDBDocumentClient.from(ddbClient);


export async function getModuleById(moduleId) {
    const params = {
        TableName: TABLE_NAME,
        Key: { moduleId },
    };

    try {
        const data = await dynamoDocClient.send(new GetCommand(params));
        return data.Item;
    } catch (error) {
        console.error("❌ DynamoDB Get Error:", error);
        throw new Error("Failed to retrieve module.");
    }
}


/* -------------------- 👥 BENUTZER ZU MODUL HINZUFÜGEN (Vollständigkeitshalber) -------------------- */
// Existiert bereits in Ihrem Code
export async function addUserToModule(moduleId, username) {
    // ... (Ihr bestehender Code mit UpdateCommand)
    const params = {
        TableName: TABLE_NAME,
        Key: { moduleId },
        UpdateExpression:
            "SET #u = list_append(if_not_exists(#u, :emptyList), :newUser)",
        ExpressionAttributeNames: { "#u": "users" },
        ExpressionAttributeValues: {
            ":newUser": [username],
            ":emptyList": [],
        },
        ReturnValues: "UPDATED_NEW",
    };

    try {
        await dynamoDocClient.send(new UpdateCommand(params));
        console.log(`👤 Benutzer '${username}' zum Modul '${moduleId}' hinzugefügt.`);
        return { message: `Benutzer ${username} zum Modul hinzugefügt.` };
    } catch (error) {
        console.error("❌ DynamoDB Update Error:", error);
        throw new Error("Failed to add user to module.");
    }
}


/* -------------------- 🚫 BENUTZER VON MODUL ENTFERNEN -------------------- */
export async function removeUserFromModule(moduleId, username) {
    const module = await getModuleById(moduleId);
    if (!module || !module.users) {
        throw new Error(`Modul mit ID ${moduleId} oder Benutzerliste nicht gefunden.`);
    }

    // ACHTUNG: Der Modul-Besitzer darf nicht entfernt werden (Zugriffsschutz)
    if (module.owner === username) {
        throw new Error(`Der Modul-Besitzer '${username}' kann nicht entfernt werden.`);
    }

    // Index des zu entfernenden Benutzers finden
    const indexToRemove = module.users.indexOf(username);

    if (indexToRemove === -1) {
        return { message: `Benutzer ${username} ist bereits entfernt.` };
    }

    // Update-Kommando: Entfernt den Eintrag anhand des Indexes aus der Liste
    const params = {
        TableName: TABLE_NAME,
        Key: { moduleId },
        UpdateExpression: `REMOVE #u[${indexToRemove}]`,
        ExpressionAttributeNames: { "#u": "users" },
        ReturnValues: "UPDATED_NEW",
    };

    try {
        await dynamoDocClient.send(new UpdateCommand(params));
        console.log(`👤 Benutzer '${username}' von Modul '${moduleId}' entfernt.`);
        return { message: `Benutzer ${username} vom Modul entfernt.` };
    } catch (error) {
        console.error("❌ DynamoDB Update Error (Remove User):", error);
        throw new Error("Fehler beim Entfernen des Benutzers vom Modul.");
    }
}