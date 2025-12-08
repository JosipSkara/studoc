import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForTokens, getUser } from "../services/CognitoAuthService";
import { useAuth } from "../context/AuthContext";

export default function Callback() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    useEffect(() => {
        const handleRedirect = async () => {
            try {
                console.log("🔁 Verarbeite Redirect...");
                await exchangeCodeForTokens(); // fetchAuthSession() erkennt Code automatisch

                const currentUser = await getUser();
                console.log("✅ Benutzer eingeloggt:", currentUser);

                setUser(currentUser);
                navigate("/home");
            } catch (err) {
                console.error("❌ Fehler im Callback:", err);
                navigate("/");
            }
        };

        handleRedirect();
    }, [navigate, setUser]);

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 to-black text-white">
            <h1 className="text-3xl font-bold text-blue-400">Authentifiziere...</h1>
            <p className="mt-3 text-gray-400">Bitte einen Moment warten.</p>
        </div>
    );
}
