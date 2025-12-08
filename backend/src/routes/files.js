// backend/src/routes/files.js

import express from "express";
import fileUpload from "express-fileupload"; // Wird für die Dateiverarbeitung verwendet
import FormData from 'form-data'; // 💡 NEU: Zum Erstellen des multipart-Body für den AWS-Proxy
import fetch from "node-fetch"; // Für die Weiterleitung an AWS (falls Node < 18)
import { verifyToken } from "../middleware/verifyToken.js";

// *******************************************************************
// ACHTUNG: Die lokalen dynamodService/s3Service Imports wurden entfernt.
// Die gesamte Logik wird jetzt an AWS weitergeleitet, um inkonsistente
// lokale und Cloud-Logik zu vermeiden.
// *******************************************************************

const router = express.Router();
router.use(fileUpload());

// --- AWS API Gateway URL ---
// WICHTIG: Stellen Sie sicher, dass diese Umgebungsvariable gesetzt ist!
const AWS_API_URL = process.env.AWS_API_URL || "https://afud5pdeii.execute-api.us-east-1.amazonaws.com/prod";


/* -------------------- 📋 ALLE MODULE LADEN (Proxy) -------------------- */
router.get("/modules", verifyToken, async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await fetch(`${AWS_API_URL}/modules`, {
            method: "GET",
            headers: { "Authorization": token },
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            return res.status(response.status).json(errorDetails);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("❌ API Error (GET /modules):", error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});


/* -------------------- 📦 EINZELNES MODUL LADEN (Proxy) -------------------- */
router.get("/modules/:moduleId", verifyToken, async (req, res) => {
    try {
        const { moduleId } = req.params;
        const token = req.headers.authorization;
        const response = await fetch(`${AWS_API_URL}/modules/${moduleId}`, {
            method: "GET",
            headers: { "Authorization": token },
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            return res.status(response.status).json(errorDetails);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("❌ Fehler beim Laden des Moduls (Proxy):", error);
        res.status(500).json({ error: error.message });
    }
});


/* -------------------- ➕ MODUL ERSTELLEN (Proxy) -------------------- */
router.post("/modules", verifyToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const token = req.headers.authorization;

        const response = await fetch(`${AWS_API_URL}/modules`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify({ name, description }),
        });

        if (!response.ok) {
            let errorDetails = { error: "Unbekannter Fehler beim AWS-Proxy" };
            try {
                errorDetails = await response.json();
            } catch (e) {
                const responseText = await response.text();
                errorDetails = { error: `AWS Fehler (Status ${response.status})`, details: responseText };
            }
            return res.status(response.status).json(errorDetails);
        }

        const data = await response.json();
        console.log("✅ AWS-Proxy-Antwortstatus:", response.status);
        console.log("✅ AWS-Proxy-Antwortdaten:", data);
        res.status(201).json(data);

    } catch (err) {
        console.error("❌ Fehler beim AWS-Proxy/Fetch (POST /modules):", err);
        res.status(500).json({ error: "Fehler beim Erstellen des Moduls durch Proxy-Fehler", details: err.message });
    }
});


/* -------------------- 👥 BENUTZER ZU MODUL HINZUFÜGEN (Proxy) -------------------- */
// WICHTIG: Diese Logik sollte idealerweise auch an eine Lambda-Funktion weitergeleitet werden.
router.post("/modules/:moduleId/users", verifyToken, async (req, res) => {
    try {
        const { username } = req.body;
        const { moduleId } = req.params;
        const token = req.headers.authorization;

        const response = await fetch(`${AWS_API_URL}/modules/${moduleId}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify({ username }),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            return res.status(response.status).json(errorDetails);
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("❌ Fehler beim Hinzufügen des Benutzers (Proxy):", err);
        res.status(500).json({ error: "Fehler beim Hinzufügen des Benutzers", details: err.message });
    }
});


/* -------------------- 📂 DATEIEN IN MODUL LISTEN (Proxy) -------------------- */
router.get("/modules/:moduleId/files", verifyToken, async (req, res) => {
    try {
        const { moduleId } = req.params;
        const token = req.headers.authorization;

        // Weiterleitung an AWS API Gateway (z.B. StuDoc-ListFiles Lambda)
        const awsResponse = await fetch(`${AWS_API_URL}/modules/${moduleId}/files`, {
            method: "GET",
            headers: { "Authorization": token },
        });

        if (!awsResponse.ok) {
            const errorDetails = await awsResponse.json();
            return res.status(awsResponse.status).json(errorDetails);
        }

        const data = await awsResponse.json();
        res.json(data);

    } catch (err) {
        console.error("❌ Fehler beim Laden der Dateien über Proxy:", err);
        res.status(500).json({ error: err.message });
    }
});


/* -------------------- ⬆️ DATEI HOCHLADEN (Proxy an AWS) -------------------- */
router.post("/modules/:moduleId/files", verifyToken, async (req, res) => {
    try {
        const { moduleId } = req.params;
        // Dateiname im Frontend muss 'file' sein, damit es hier unter req.files.file landet
        const file = req.files?.file;

        if (!file) {
            return res.status(400).json({ error: "Keine Datei hochgeladen (Erwartet 'file' im FormData)" });
        }

        const token = req.headers.authorization;
        const form = new FormData();

        // 1. Datei als Buffer dem FormData-Objekt hinzufügen
        form.append('file', file.data, {
            filename: file.name,
            contentType: file.mimetype,
            knownLength: file.data.length // Essentiell für fetch/Proxy
        });
        // 2. Modul-ID als separates Feld hinzufügen, falls nötig (kann auch aus der URL extrahiert werden)
        form.append('moduleId', moduleId);

        // 3. Weiterleitung an den AWS API Gateway Endpunkt (StuDoc-UploadFile Lambda)
        const awsResponse = await fetch(`${AWS_API_URL}/modules/${moduleId}/files`, {
            method: "POST",
            body: form,
            headers: {
                "Authorization": token,
                // WICHTIG: Fügt den Boundary-String zum Content-Type hinzu
                ...form.getHeaders(),
            },
        });

        // 4. Fehlerbehandlung
        if (!awsResponse.ok) {
            let errorDetails = { error: "Unbekannter Fehler beim AWS-Proxy" };
            try {
                errorDetails = await awsResponse.json();
            } catch (e) {
                const responseText = await awsResponse.text();
                errorDetails = { error: `AWS Fehler (Status ${awsResponse.status})`, details: responseText };
            }

            return res.status(awsResponse.status).json(errorDetails);
        }

        // 5. Bei Erfolg
        const data = await awsResponse.json();
        console.log("✅ AWS-Proxy-Upload-Antwort:", data);
        res.status(201).json(data);

    } catch (err) {
        console.error("❌ Fehler beim AWS-Proxy/Upload:", err);
        res.status(500).json({ error: "Fehler beim Hochladen durch Proxy-Fehler", details: err.message });
    }
});


export default router;