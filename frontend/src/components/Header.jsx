// src/components/Header.jsx

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// ❌ Import von signOut ist hier NICHT MEHR NÖTIG, da wir die Context-Funktion verwenden!
// import { signOut } from "aws-amplify/auth";

export default function Header() {
    // 🆕 'user', 'roles' und die Context-Funktion 'logout' aus useAuth() extrahieren
    const { user, roles, logout } = useAuth();
    const navigate = useNavigate();

    // Zeige den Header nur, wenn ein Benutzer eingeloggt ist
    if (!user) return null;

    // Definiere, wer den Tab "Zugriffskontrolle" sehen darf
    const isElevatedUser =
        (roles?.includes("admin") || roles?.includes("Admin") || roles?.includes("dozenten") || roles?.includes("Dozenten"));

    // 🟢 KORRIGIERTE LOGOUT-FUNKTION
    const handleLogout = async () => {
        try {
            // Ruft die Context-Funktion auf, die den Cognito-Logout triggert
            await logout();

            // 🟢 KORREKTUR: Direkt zur Login-Seite navigieren, damit der Login-Button erscheint
            navigate("/login");
        } catch (error) {
            console.error("Logout fehlgeschlagen:", error);
            // Auch bei Fehler zur Login-Seite navigieren, um hängenden Zustand zu vermeiden
            navigate("/login");
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

                    {/* 👥 Link für Administratoren/Dozenten */}
                    {isElevatedUser && (
                        <Link
                            to="/access"
                            className="hover:text-blue-400 transition font-bold"
                        >
                            Zugriffskontrolle
                        </Link>
                    )}

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