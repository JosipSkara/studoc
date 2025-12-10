// src/pages/Callback.jsx (Angepasst für Ihren Context)

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Die folgenden Funktionen SIND NICHT nötig, wenn der Context die ganze Arbeit macht
// import { exchangeCodeForTokens, getUser } from "../services/CognitoAuthService";
import { useAuth } from "../context/AuthContext";
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'; // Import nötig

export default function Callback() {
    const navigate = useNavigate();
    const { setUser } = useAuth(); // Wir verwenden setUser nur, wenn nötig

    useEffect(() => {
        const handleRedirect = async () => {
            try {
                console.log("🔁 Callback-Weiterleitung erkannt. Initialisiere Session...");

                // 1. Session prüfen/neu laden. Amplify erkennt den 'code' in der URL
                //    und tauscht ihn automatisch gegen Tokens.
                await fetchAuthSession();

                // 2. Benutzerdaten erneut abrufen und den globalen Zustand aktualisieren
                //    (Dieser Schritt könnte redundant sein, wenn der Context bereits
                //    durch den URL-Wechsel neu geladen wurde, aber er ist sicher).
                const currentUser = await getCurrentUser();

                // Da Ihr AuthContext die setUser/setRoles-Logik in seinem useEffect hat,
                // genügt es oft, nur neu zu laden. Wenn Sie aber sicherstellen wollen,
                // dass der state sofort aktualisiert wird, setzen Sie den User hier.

                console.log("✅ Erfolgreich Tokens erhalten und Benutzer verifiziert.");
                navigate("/home", { replace: true });

            } catch (err) {
                console.error("❌ Fehler im Callback (wahrscheinlich Code Exchange fehlgeschlagen):", err);
                navigate("/"); // Zur Startseite oder Login-Seite umleiten
            }
        };

        handleRedirect();
    }, [navigate]);

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-black text-white">
            <h1 className="text-3xl font-bold text-blue-400">Authentifiziere...</h1>
            <p className="mt-3 text-gray-400">Bitte einen Moment warten.</p>
        </div>
    );
}