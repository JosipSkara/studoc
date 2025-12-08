import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// ⚙️ Cognito-Konfiguration
const region = process.env.AWS_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

// JWKS Client zum Laden der Cognito-Public Keys
const client = jwksClient({
    jwksUri: `${issuer}/.well-known/jwks.json`,
});

// 🔑 Public Key abrufen
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

// ✅ Token verifizieren
export function verifyCognitoToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            getKey,
            {
                algorithms: ["RS256"],
                issuer,
            },
            (err, decoded) => {
                if (err) return reject(err);
                resolve(decoded);
            }
        );
    });
}

// 👤 Userinfo aus Token extrahieren
export const getUserInfo = (decodedToken) => {
    return {
        email: decodedToken.email,
        sub: decodedToken.sub,
        roles: decodedToken["cognito:groups"] || [],
    };
};
