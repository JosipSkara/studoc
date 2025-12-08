// backend/src/index.js
import express from "express";
import cors from "cors";
import axios from "axios";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

// ✅ Deine bestehenden Routendateien
import filesRoutes from "./src/routes/files.js";
import groupRoutes from "./src/routes/groups.js";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔧 Cognito-Konfiguration (aktuelle Werte)
const COGNITO_REGION = "us-east-1";
const COGNITO_USER_POOL_ID = "us-east-1_Y9732eTGf"; // Dein richtiger Pool
const COGNITO_CLIENT_ID = "67d491bms2kc7k1lkq8ugs6fm8";
const COGNITO_DOMAIN = "https://mydemoapp20251202.auth.us-east-1.amazoncognito.com";
const REDIRECT_URI = "http://localhost:5173/callback";
const JWKS_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

// 🧩 DynamoDB
const dynamoClient = new DynamoDBClient({ region: COGNITO_REGION });
const TABLE_NAME = "StuDoc-Modules";

// 🔹 Health-Check
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "StuDoc Backend" });
});

// ✅ Alle Routen einbinden
app.use("/api/files", filesRoutes);
app.use("/api/groups", groupRoutes); // <-- wichtig

// 🔹 Cognito-Callback
app.get("/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing authorization code");

    try {
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: COGNITO_CLIENT_ID,
            code,
            redirect_uri: REDIRECT_URI,
        });

        const { data } = await axios.post(`${COGNITO_DOMAIN}/oauth2/token`, params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        res.json({ message: "✅ Login erfolgreich!", tokens: data });
    } catch (err) {
        console.error("❌ Token-Exchange failed:", err.response?.data || err.message);
        res.status(500).json({
            message: "❌ Token-Exchange failed",
            details: err.response?.data || err.message,
        });
    }
});

// 🔐 Middleware: Token prüfen
async function verifyCognitoToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        const { data } = await axios.get(JWKS_URL);
        const header = jwt.decode(token, { complete: true }).header;
        const key = data.keys.find((k) => k.kid === header.kid);

        if (!key) throw new Error("Key not found in JWKS");

        const pem = jwkToPem(key);
        const decoded = jwt.verify(token, pem, { algorithms: ["RS256"] });

        if (decoded.aud !== COGNITO_CLIENT_ID) {
            throw new Error("Invalid audience");
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

// 🔹 Geschützte Test-Route
app.get("/api/secure", verifyCognitoToken, (req, res) => {
    res.json({
        message: "✅ Access granted!",
        user: req.user,
    });
});

// 🔹 DynamoDB-Beispiel
app.get("/api/modules", verifyCognitoToken, async (req, res) => {
    try {
        const data = await dynamoClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        const modules =
            data.Items?.map((item) => ({
                moduleId: item.moduleId.S,
                name: item.name?.S ?? "",
                description: item.description?.S ?? "",
            })) ?? [];

        res.json(modules);
    } catch (err) {
        console.error("❌ DynamoDB Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Server starten
app.listen(PORT, () => {
    console.log(`✅ Backend läuft jetzt auf http://localhost:${PORT}`);
});
