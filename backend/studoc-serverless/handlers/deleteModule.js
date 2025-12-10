// handlers/deleteModule.js

// --- DynamoDB Imports ---
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    DeleteCommand,
    ScanCommand // NEUER IMPORT: Wird für die Suche in der Files-Tabelle benötigt
} from "@aws-sdk/lib-dynamodb";

// --- S3 Imports (für Datei-Löschung) ---
import {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectsCommand
} from "@aws-sdk/client-s3";

// --- Utility Imports
import { apiResponse } from "./utils/apiResponse.js";
import { getGroupsFromToken } from "./utils/auth.js";

// --------------------------------------------------------------------------------
// --- KONFIGURATION & INITIALISIERUNG ---
// --------------------------------------------------------------------------------

// --- AWS/S3 KONFIGURATION ---
const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "studoc-files-bucket";

const s3 = new S3Client({ region: REGION });

// --- DynamoDB KONFIGURATION & CLIENT ---
const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Tabellennamen aus Umgebungsvariablen (oder Fallback vom .env)
const MODULES_TABLE_NAME = process.env.MODULES_TABLE_NAME || "StuDoc-Modules_dev";
const FILES_TABLE_NAME = process.env.FILES_TABLE_NAME || "StuDoc-Files_dev"; // NEU: Dateimetadaten-Tabelle

// --------------------------------------------------------------------------------
// --- HELPER FUNKTIONEN (S3 & DynamoDB) ---
// --------------------------------------------------------------------------------

// 🛑 INLINED CORS WRAPPER (Behebt den ReferenceError)
const withCors = (handlerFn) => async (event, context) => {
    if (event?.requestContext?.http?.method === "OPTIONS") {
        return apiResponse(200, { message: "CORS preflight ok" }, event);
    }
    // ... (restlicher withCors Code)
    try {
        const result = await handlerFn(event, context);
        const existingHeaders = result?.headers || {};
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        };

        return {
            ...result,
            headers: { ...existingHeaders, ...corsHeaders },
        };
    } catch (error) {
        console.error("❌ Fehler im withCors Wrapper:", error);
        return apiResponse(500, { error: error.message || "Interner Serverfehler" }, event);
    }
};

/** Ruft alle S3-Objekt-Keys ab, die zu einem Modul gehören */
async function listS3KeysForModule(moduleId) {
    const prefix = `${moduleId}/`;
    const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
    });

    try {
        const data = await s3.send(command);
        return data.Contents?.map(file => ({ Key: file.Key })) || [];
    } catch (err) {
        console.error("❌ Fehler beim Auflisten der S3-Dateien:", err);
        return [];
    }
}

/** Löscht eine Liste von S3-Objekten effizient (Batch-Löschung) */
async function deleteS3Files(keys) {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
            Objects: keys,
            Quiet: true,
        },
    });

    try {
        const data = await s3.send(command);
        if (data.Errors) {
            data.Errors.forEach(err => {
                console.error(`❌ S3 Delete Error: Key: ${err.Key}, Code: ${err.Code}`);
            });
        }
        return true;
    } catch (err) {
        console.error("❌ Kritischer S3-Löschfehler:", err);
        throw new Error("Interner Fehler beim Versuch, S3-Objekte zu löschen.");
    }
}

/** 🆕 NEUE FUNKTION: Löscht alle Metadaten-Einträge aus StuDoc-Files_dev */
async function deleteFileMetadata(moduleId) {
    // 1. Scan/Query die Files-Tabelle, um alle verknüpften fileId's zu finden
    const scanParams = {
        TableName: FILES_TABLE_NAME,
        // Da moduleId kein Key ist, müssen wir einen Filterausdruck verwenden.
        FilterExpression: "moduleId = :mid",
        ExpressionAttributeValues: {
            ":mid": moduleId,
        },
        ProjectionExpression: "fileId",
    };

    try {
        const scanResult = await ddbDocClient.send(new ScanCommand(scanParams));
        const fileEntries = scanResult.Items || [];

        if (fileEntries.length === 0) {
            console.log(`ℹ️ Keine Metadaten in ${FILES_TABLE_NAME} für Modul ${moduleId} gefunden.`);
            return;
        }

        console.log(`➡️ Lösche ${fileEntries.length} Dateimetadaten-Einträge aus ${FILES_TABLE_NAME}...`);

        // 2. Lösche jeden Eintrag basierend auf dem Primary Key (fileId)
        const deletePromises = fileEntries.map(entry => {
            const deleteParams = {
                TableName: FILES_TABLE_NAME,
                Key: { fileId: entry.fileId }, // fileId ist der Primärschlüssel
            };
            return ddbDocClient.send(new DeleteCommand(deleteParams));
        });

        await Promise.all(deletePromises);
        console.log(`✅ ${fileEntries.length} Dateimetadaten erfolgreich gelöscht.`);

    } catch (error) {
        console.error("❌ Fehler beim Löschen der Metadaten aus Files Table:", error);
        // Wir werfen keinen Fehler, damit die Funktion zumindest den Moduleintrag löschen kann,
        // aber wir loggen ihn.
    }
}


// --------------------------------------------------------------------------------
// --- HAUPT-HANDLER: deleteModuleHandler ---
// --------------------------------------------------------------------------------

async function deleteModuleHandler(event) {

    let userGroups = [];
    let isAdmin = false;

    // 1. Rollen-Check (Autorisierung)
    try {
        userGroups = getGroupsFromToken(event);

        isAdmin = userGroups.includes("admin") ||
            userGroups.includes("Admin") ||
            userGroups.includes("Admins") ||
            userGroups.includes("Dozenten");

        if (!isAdmin) {
            return apiResponse(403, {
                error: "Zugriff verweigert. Nur Administratoren dürfen Module löschen."
            });
        }
    } catch (authError) {
        console.error("❌ Kritischer Fehler beim Auslesen der Gruppen:", authError);
        return apiResponse(500, {
            error: "Fehler beim Laden der Benutzerrollen."
        });
    }

    // 2. DynamoDB & S3 Löschlogik
    try {
        const moduleId = event.pathParameters?.id;

        if (!moduleId) {
            return apiResponse(400, { error: "Modul-ID fehlt in der URL." });
        }

        console.log(`🗑️ Starte vollständige Löschung für Modul-ID: ${moduleId}`);

        // ----------------------------------------------------
        // 🚨 SCHRITT A: S3-Dateien suchen und löschen (Physische Daten)
        // ----------------------------------------------------
        const filesToDelete = await listS3KeysForModule(moduleId);

        if (filesToDelete.length > 0) {
            console.log(`➡️ Gefunden ${filesToDelete.length} S3-Dateien zum Löschen...`);
            await deleteS3Files(filesToDelete);
            console.log(`✅ ${filesToDelete.length} S3-Dateien erfolgreich gelöscht.`);
        } else {
            console.log("ℹ️ Keine S3-Dateien für dieses Modul gefunden.");
        }

        // ----------------------------------------------------
        // 🚨 SCHRITT B: Files-Metadaten aus StuDoc-Files_dev löschen (Metadaten-Bereinigung)
        // ----------------------------------------------------
        await deleteFileMetadata(moduleId); // <-- NEUER WICHTIGER SCHRITT

        // ----------------------------------------------------
        // 🚨 SCHRITT C: Modul-Eintrag aus StuDoc-Modules_dev löschen (Haupteintrag)
        // ----------------------------------------------------
        const deleteParams = {
            TableName: MODULES_TABLE_NAME,
            Key: { moduleId: moduleId },
        };

        await ddbDocClient.send(new DeleteCommand(deleteParams));
        console.log(`✅ Modul-Eintrag ${moduleId} erfolgreich aus DB gelöscht.`);

        // 3. Erfolgsantwort
        return apiResponse(200, {
            message: `✅ Modul ${moduleId} und zugehörige Daten erfolgreich gelöscht.`,
            deletedId: moduleId
        });

    } catch (error) {
        console.error("❌ KRITISCHER FEHLER beim Löschen (S3, Files-Table oder Modules-Table):", error);
        return apiResponse(500, {
            error: error.message || "Interner Serverfehler beim Löschen des Moduls.",
        });
    }
}

export const handler = withCors(deleteModuleHandler);