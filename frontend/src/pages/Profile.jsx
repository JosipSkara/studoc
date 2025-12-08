// src/pages/Profile.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
    const { roles, attributes, loading } = useAuth(); // 👈 mehrere Rollen statt 'role'

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-white text-lg">
                Lade Benutzerdaten...
            </div>
        );
    }

    const { given_name, family_name, email, sub, studiengang } = attributes;
    const fullName = [given_name, family_name].filter(Boolean).join(" ") || "–";

    return (
        <main className="flex flex-col items-center p-10 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <h2 className="text-4xl font-bold mb-8 flex items-center space-x-3">
                👤 <span>Profil</span>
            </h2>

            <div className="max-w-lg bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-lg shadow-blue-400/10">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold mb-1">{fullName}</h3>
                    <p className="text-gray-400">{email || "Keine E-Mail vorhanden"}</p>
                </div>

                <div className="text-left space-y-3">
                    <p>
                        <span className="font-semibold text-blue-400">Rollen:</span>{" "}
                        {roles?.length ? roles.join(", ") : "Keine"}
                    </p>
                    <p>
                        <span className="font-semibold text-blue-400">User-ID (sub):</span>{" "}
                        {sub}
                    </p>
                    {studiengang && (
                        <p>
                            <span className="font-semibold text-blue-400">Studiengang:</span>{" "}
                            {studiengang}
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
};

export default Profile;
