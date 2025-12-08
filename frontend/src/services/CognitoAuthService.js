    // @ts-nocheck
    import { Amplify } from "aws-amplify";
    import {
        signInWithRedirect,
        signOut,
        getCurrentUser,
        fetchAuthSession,
    } from "aws-amplify/auth";

    // 🔍 Debug: ENV prüfen
    console.log("🔍 Amplify ENV", {
        region: import.meta.env.VITE_AWS_REGION,
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        domain: import.meta.env.VITE_COGNITO_DOMAIN,
        redirectSignIn: import.meta.env.VITE_REDIRECT_URI,
        redirectSignOut: import.meta.env.VITE_LOGOUT_URI,
    });

    // ⚙️ Amplify konfigurieren
    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
                userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
                region: import.meta.env.VITE_AWS_REGION,
                loginWith: {
                    oauth: {
                        domain: import.meta.env.VITE_COGNITO_DOMAIN,
                        scopes: ["email", "openid", "profile"],
                        redirectSignIn: [import.meta.env.VITE_REDIRECT_URI],
                        redirectSignOut: [import.meta.env.VITE_LOGOUT_URI],
                        responseType: "code",
                    },
                },
            },
        },
    });

    //
    // 🔐 LOGIN mit Hosted UI
    //
    export async function signInWithHostedUI() {
        try {
            console.log("🌀 Redirecting to Cognito Hosted UI...");
            await signInWithRedirect({
                provider: "COGNITO",
                redirectTo: import.meta.env.VITE_REDIRECT_URI,
            });
        } catch (error) {
            if (error.name === "UserAlreadyAuthenticatedException") {
                console.warn("⚠️ Benutzer ist bereits angemeldet — Redirect übersprungen.");
            } else {
                console.error("❌ Fehler beim Redirect zu Cognito:", error);
            }
        }
    }

    //
    // 🔁 CALLBACK – Tauscht Code gegen Tokens (automatisch erkannt)
    //
    export async function exchangeCodeForTokens() {
        try {
            // AWS Amplify erkennt ?code= automatisch in der URL
            const session = await fetchAuthSession();
            console.log("✅ Tokens erfolgreich empfangen:", session);
            return session;
        } catch (error) {
            console.error("❌ Fehler beim Token-Austausch:", error);
            throw error;
        }
    }

    //
    // 👤 Aktuellen Benutzer abrufen
    //
    export async function getUser() {
        try {
            return await getCurrentUser();
        } catch {
            return null;
        }
    }

    //
    // 🔄 Session prüfen (Tokens auslesen)
    //
    export async function completeRedirectFlow() {
        try {
            const session = await fetchAuthSession();
            console.log("🟢 Aktuelle Session:", session);
            return session;
        } catch (err) {
            console.error("❌ Fehler beim Abrufen der Session:", err);
        }
    }

    //
    // 🚪 LOGOUT mit Redirect
    //
    export async function logout() {
        try {
            await signOut({
                global: true,
                redirectTo: import.meta.env.VITE_LOGOUT_URI,
            });
        } catch (err) {
            console.error("❌ Fehler beim Logout:", err);
        }
    }
