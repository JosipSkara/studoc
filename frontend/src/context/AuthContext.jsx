// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]); // ✅ Normalisierte Rollen (z. B. ["admins"])
    const [attributes, setAttributes] = useState({});

    // 🟢 SYNTAX KORRIGIERT: Muss useState(true) verwenden
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                console.log("🔍 Prüfe aktuelle Cognito-Session...");

                const currentUser = await getCurrentUser();
                const session = await fetchAuthSession();
                const payload = session.tokens?.idToken?.payload;

                if (!payload) throw new Error("Kein ID Token vorhanden");

                setUser(currentUser);

                // 🔹 Gruppen auslesen & in Kleinbuchstaben umwandeln
                const groupsRaw = payload["cognito:groups"] ?? [];
                const normalizedGroups = Array.isArray(groupsRaw)
                    ? groupsRaw.map((g) => g.toLowerCase())
                    : [];
                setRoles(normalizedGroups);

                // Benutzerattribute setzen
                setAttributes({
                    given_name: payload?.given_name ?? "",
                    family_name: payload?.family_name ?? "",
                    email: payload?.email ?? "",
                    sub: payload?.sub ?? "",
                    studiengang: payload?.["custom:studiengang"] ?? "",
                });

                console.log("✅ Eingeloggter Benutzer:", currentUser.username);
                console.log("👥 Gruppen (normalisiert):", normalizedGroups);
            } catch (err) {
                console.warn("⚠️ Kein aktiver Benutzer gefunden:", err);
                setUser(null);
                setRoles([]);
                setAttributes({});
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    const logout = async () => {
        try {
            console.log("🚪 Melde Benutzer ab...");

            // 🟢 LOGIK KORRIGIERT: Entferne den problematischen 'redirectTo' Parameter,
            // da dies zu dem Fehler "Required String parameter 'redirect_uri' is not present" führt.
            await signOut({
                global: true,
            });

            // Setze den lokalen State nach erfolgreichem Cognito-Logout zurück
            setUser(null);
            setRoles([]);
        } catch (error) {
            console.error("❌ Fehler beim Logout:", error);
            // Setze den State auch bei einem Fehler zurück, um Hängenbleiben zu verhindern
            setUser(null);
            setRoles([]);
        }
    };

    return (
        <AuthContext.Provider value={{ user, roles, attributes, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);