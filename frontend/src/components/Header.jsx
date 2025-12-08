import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "aws-amplify/auth";

export default function Header() {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) return null; // Header nur anzeigen, wenn eingeloggt

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/"); // zurück zur Login-Seite
        } catch (error) {
            console.error("Logout fehlgeschlagen:", error);
        }
    };

    return (
        <header className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg border-b border-gray-700">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
                <h1 className="text-2xl font-extrabold text-blue-400 tracking-tight">
                    StuDoc
                </h1>

                <nav className="flex gap-6 text-gray-300">
                    <Link to="/home" className="hover:text-blue-400 transition">Home</Link>
                    <Link to="/documents" className="hover:text-blue-400 transition">Documents</Link>
                    <Link to="/groups" className="hover:text-blue-400 transition">Groups</Link>
                    <Link to="/profile" className="hover:text-blue-400 transition">Profile</Link>
                </nav>

                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-white transition"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
