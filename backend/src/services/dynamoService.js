// src/services/dynamoService.js (MIGRATED TO AWS SDK V3)

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";

// ⚠️ ACHTUNG: Die Region muss mit der Region Ihrer DynamoDB-Tabelle übereinstimmen!
const REGION = "us-east-1";
const TABLE_NAME = "StuDoc-Modules_Test"; // ⚠️ Tabellennamen überprüfen!

// 1. Initialisierung des DynamoDB-Clients (v3 Base Client)
const client = new DynamoDBClient({ region: REGION });

// 2. Erstellung des DocumentClients zur Vereinfachung (keine {S: "..."} Objekte mehr)
const dynamoDocClient = DynamoDBDocumentClient.from(client);


/* -------------------- 📋 ALLE MODULE -------------------- */
export async function getAllModules() {
    console.log(`🔍 Scanning table: ${TABLE_NAME}`);

    const params = { TableName: TABLE_NAME };

    try {
        // V3: Verwenden Sie den ScanCommand und .send() anstelle von .scan().promise()
        const data = await dynamoDocClient.send(new ScanCommand(params));

        console.log("✅ DynamoDB Items:", JSON.stringify(data.Items, null, 2));

        // data.Items ist bereits das "unmarshalled" JavaScript-Objekt
        return data.Items || [];
    } catch (error) {
        console.error("❌ DynamoDB Scan Error:", error);
        // Behandelt ResourceNotFoundException falls der Tabellenname falsch ist
        if (error.name === 'ResourceNotFoundException') {
            throw new Error(`Failed to retrieve modules. Table '${TABLE_NAME}' not found in region '${REGION}'.`);
        }
        throw new Error("Failed to retrieve modules from database.");
    }
}

/* -------------------- ➕ NEUES MODUL ERSTELLEN -------------------- */
export async function createModule(name, description, owner) {
    const moduleId = Date.now().toString();

    const params = {
        TableName: TABLE_NAME,
        Item: {
            moduleId,
            name,
            description: description || "",
            owner,
            createdAt: new Date().toISOString(),
            users: [owner],
        },
    };

    try {
        // V3: Verwenden Sie den PutCommand und .send()
        await dynamoDocClient.send(new PutCommand(params));
        console.log(`✅ Neues Modul '${name}' erstellt.`);
        return params.Item;
    } catch (error) {
        console.error("❌ DynamoDB Put Error:", error);
        throw new Error("Failed to create module.");
    }
}

/* -------------------- 👥 BENUTZER ZU MODUL HINZUFÜGEN -------------------- */
export async function addUserToModule(moduleId, username) {
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
        // V3: Verwenden Sie den UpdateCommand und .send()
        await dynamoDocClient.send(new UpdateCommand(params));
        console.log(`👤 Benutzer '${username}' zum Modul '${moduleId}' hinzugefügt.`);
        return { message: `Benutzer ${username} zum Modul hinzugefügt.` };
    } catch (error) {
        console.error("❌ DynamoDB Update Error:", error);
        throw new Error("Failed to add user to module.");
    }
}