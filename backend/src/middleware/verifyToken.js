import axios from "axios";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

const REGION = "us-east-1";
const USER_POOL_ID = "us-east-1_Y9732eTGf";
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;

let cachedKeys = null;
let lastFetch = 0;

/**
 * Lädt JWKS-Schlüssel mit Caching (1h)
 */
async function getJwksKeys() {
    const now = Date.now();
    if (!cachedKeys || now - lastFetch > 60 * 60 * 1000) {
        const { data } = await axios.get(JWKS_URL);
        cachedKeys = data.keys;
        lastFetch = now;
    }
    return cachedKeys;
}

/**
 * Prüft Cognito JWT auf Gültigkeit
 */
export async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const keys = await getJwksKeys();
        const decodedHeader = jwt.decode(token, { complete: true });

        if (!decodedHeader) {
            return res.status(400).json({ error: "Invalid token format" });
        }

        const key = keys.find(k => k.kid === decodedHeader.header.kid);
        if (!key) throw new Error("Public key not found");

        const pem = jwkToPem(key);

        const verified = jwt.verify(token, pem, {
            algorithms: ["RS256"],
            issuer: ISSUER,
        });

        console.log("✅ Token verified for:", verified.username || verified.email);

        req.user = {
            email: verified.email,
            sub: verified.sub,
            username: verified["cognito:username"],
            groups: verified["cognito:groups"] || [],
        };

        next();
    } catch (err) {
        console.error("❌ Token verification failed:", err.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

/**
 * Middleware für Admin-Zugriff
 */
export function requireAdmin(req, res, next) {
    if (!req.user || !req.user.groups.includes("admin")) {
        return res.status(403).json({ error: "Adminrechte erforderlich" });
    }
    next();
}
