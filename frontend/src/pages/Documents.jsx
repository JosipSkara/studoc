// src/pages/Documents.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Folder, Trash2, Loader2 } from "lucide-react"; // Importiere Trash2
import { useAuth } from "../context/AuthContext";
import {
    apiListModules,
    apiCreateModule,
    apiDeleteModule // Importiere die Löschfunktion
} from "../services/apiService.js";

const Documents = () => {
    const { roles, loading: authLoading } = useAuth();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔑 Prüfen, ob der Benutzer Admin-Rechte hat
    const isAdmin = roles.includes("admin") || roles.includes("Admin");

    // 🔹 Module beim Laden abrufen
    useEffect(() => {
        if (!authLoading) {
            fetchModules();
        }
    }, [authLoading]);

    // 📦 Module abrufen
    const fetchModules = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiListModules();
            setModules(data.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("❌ Fehler beim Laden der Module:", error);
            setError("Fehler beim Laden der Module. Bitte stellen Sie sicher, dass Sie angemeldet sind.");
        } finally {
            setLoading(false);
        }
    };

    // ➕ Neues Modul erstellen
    const handleCreateModule = async () => {
        const nameInput = document.getElementById("modulname");
        const descriptionInput = document.getElementById("beschreibung");

        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();

        if (!name) return alert("Bitte gib einen Modulnamen ein!");
        if (!isAdmin) return alert("Fehler: Nur Administratoren dürfen Module erstellen.");

        try {
            setLoading(true);
            await apiCreateModule(name, description);
            await fetchModules();

            nameInput.value = "";
            descriptionInput.value = "";
        } catch (error) {
            console.error("❌ Fehler beim Erstellen:", error);
            setError(error.message || "Fehler beim Erstellen des Moduls.");
        } finally {
            setLoading(false);
        }
    };

    // ❌ Modul löschen (NEUE FUNKTION)
    const handleDeleteModule = async (moduleName) => {
        if (!isAdmin) return alert("Fehler: Nur Administratoren dürfen Module löschen.");
        if (!window.confirm(`Modul "${moduleName}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) return;

        try {
            setLoading(true);
            await apiDeleteModule(moduleName); // API-Aufruf zum Löschen
            await fetchModules(); // Liste neu laden
        } catch (err) {
            alert(`❌ Fehler beim Löschen des Moduls: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <Folder className="w-8 h-8 text-blue-400" /> Modulübersicht
                </h1>
                <p className="text-gray-400 mb-8">
                    Wähle ein Modul, um Studienunterlagen zu sehen.
                </p>

                {/* 🆕 Modul erstellen (Nur sichtbar für Admins) */}
                {isAdmin && (
                    <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 mb-8 shadow-lg">
                        <h2 className="text-xl font-semibold mb-3 text-blue-300">Neues Modul erstellen (Admin)</h2>
                        <div className="flex gap-3 flex-wrap">
                            <input
                                type="text"
                                placeholder="Modulname"
                                id="modulname"
                                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none border border-gray-700 focus:border-blue-500 min-w-[150px]"
                                disabled={loading}
                            />
                            <input
                                type="text"
                                placeholder="Beschreibung (optional)"
                                id="beschreibung"
                                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none border border-gray-700 focus:border-blue-500 min-w-[200px]"
                                disabled={loading}
                            />
                            <button
                                onClick={handleCreateModule}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                Erstellen
                            </button>
                        </div>
                    </div>
                )}

                {/* 📋 Modul-Liste */}
                {authLoading || loading ? (
                    <p className="text-gray-400 text-center mt-10 flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" /> Lade Daten...
                    </p>
                ) : error ? (
                    <p className="text-red-400 col-span-full mt-8">{error}</p>
                ) : (
                    <div
                        className="grid"
                        style={{
                            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                            gap: 20,
                        }}
                    >
                        {modules.length === 0 ? (
                            <p className="text-gray-400 col-span-full mt-8">Keine Module gefunden 😅</p>
                        ) : (
                            modules.map((m, index) => (
                                <div
                                    key={m.moduleId || `${m.name}-${index}`}
                                    // CONTAINER: Flex-Spalte, um Link und Button zu trennen
                                    className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 shadow-md transform hover:scale-[1.02] flex flex-col justify-between transition-all duration-300"
                                >
                                    {/* Link-Bereich: Zum Klicken auf das Modul */}
                                    <Link
                                        to={`/files/${m.moduleId}`}
                                        className="hover:bg-gray-800 p-2 -m-2 rounded-lg flex items-center gap-3 flex-1 min-h-[80px]"
                                    >
                                        <span className="text-3xl text-yellow-400">📚</span>
                                        <div>
                                            <div className="font-semibold text-lg">
                                                {m.name || m.moduleId || `Modul ${index + 1}`}
                                            </div>
                                            <div className="text-gray-400 text-sm truncate">
                                                {m.description || "Keine Beschreibung verfügbar"}
                                            </div>
                                        </div>
                                    </Link>

                                    {/* LÖSCHBUTTON - Nur für Admins sichtbar */}
                                    {isAdmin && (
                                        <div className="mt-4 pt-3 border-t border-gray-700">
                                            <button
                                                onClick={() => handleDeleteModule(m.moduleId)}
                                                disabled={loading}
                                                className="bg-red-600 hover:bg-red-700 w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" /> Modul löschen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;