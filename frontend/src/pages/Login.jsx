import { useAuth } from "../context/AuthContext";
import { signInWithHostedUI, logout } from "../services/CognitoAuthService";

export default function Login() {
    const { user, loading } = useAuth();

    if (loading) return <p className="text-gray-400">Lade...</p>;

    // ✅ Wenn User schon eingeloggt ist → keinen Login-Button anzeigen
    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-blue-400">
                        Willkommen, {user.username} 👋
                    </h1>
                    <button
                        onClick={logout}
                        className="mt-5 bg-red-600 hover:bg-red-700 transition-all py-3 px-6 rounded-lg font-semibold"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    // ❌ Nicht eingeloggt → Login anzeigen
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-6">
            <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-md border border-gray-800 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] p-10 animate-fadeIn">
                <h1 className="text-5xl font-extrabold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                    StuDoc Login
                </h1>

                <button
                    onClick={signInWithHostedUI}
                    className="bg-blue-600 hover:bg-blue-700 transition-all py-3 rounded-lg font-semibold shadow-md hover:shadow-lg hover:shadow-blue-600/40 active:scale-95 w-full"
                >
                    Login mit Cognito
                </button>
            </div>
        </div>
    );
}
