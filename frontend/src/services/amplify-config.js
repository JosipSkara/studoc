// src/services/amplify-config.js

import { Amplify } from "aws-amplify";

// Variablen aus der .env-Datei abrufen (z.B. VITE_COGNITO_DOMAIN = mydemoapp20251202.auth.us-east-1.amazoncognito.com)
const {
    VITE_AWS_REGION,
    VITE_COGNITO_USER_POOL_ID,
    VITE_COGNITO_CLIENT_ID,
    VITE_COGNITO_DOMAIN,
    VITE_REDIRECT_URI,
    VITE_LOGOUT_URI
} = import.meta.env;


Amplify.configure({
    Auth: {
        region: VITE_AWS_REGION,
        userPoolId: VITE_COGNITO_USER_POOL_ID,
        // WICHTIG: userPoolWebClientId für Frontends (Web-App)
        userPoolWebClientId: VITE_COGNITO_CLIENT_ID,
        oauth: {
            // Die Domain muss ohne Protokoll (https://) übergeben werden
            domain: VITE_COGNITO_DOMAIN.replace("https://", ""),

            // Scopes definieren, welche Informationen angefordert werden (muss in Cognito erlaubt sein)
            scope: ["email", "openid", "profile"],

            // ✅ KORREKTUR: Umleitungs-URLs müssen als Array übergeben werden
            redirectSignIn: [VITE_REDIRECT_URI],
            redirectSignOut: [VITE_LOGOUT_URI],

            // Fordert den sicheren Autorisierungscode an
            responseType: "code",
        },
    },
});