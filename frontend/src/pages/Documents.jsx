import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiListModules, apiCreateModule } from "../services/apiService.js";

const Documents = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔹 Module beim Laden abrufen
    useEffect(() => {
        fetchModules();
    }, []);

    // 📦 Module abrufen
    const fetchModules = async () => {
        try {
            setLoading(true);
            const data = await apiListModules(); // ✅ nutzt Access Token automatisch
            setModules(data);
        } catch (error) {
            console.error("❌ Fehler beim Laden der Module:", error);
            alert("Fehler beim Laden der Module. Bitte versuche es später erneut.");
        } finally {
            setLoading(false);
        }
    };

    // ➕ Neues Modul erstellen
    const handleCreateModule = async () => {
        const name = document.getElementById("modulname").value.trim();
        const description = document.getElementById("beschreibung").value.trim();
        if (!name) return alert("Bitte gib einen Modulnamen ein!");

        try {
            await apiCreateModule(name, description); // ✅ nutzt automatisch fetchProtected
            await fetchModules(); // Liste neu laden
            document.getElementById("modulname").value = "";
            document.getElementById("beschreibung").value = "";
        } catch (error) {
            console.error("❌ Fehler beim Erstellen:", error);
            alert(`Fehler: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">📁 Module</h1>
                <p className="text-gray-400 mb-8">
                    Wähle ein Modul, um Studienunterlagen zu sehen oder ein neues Modul zu erstellen.
                </p>

                {/* 🆕 Modul erstellen */}
                <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 mb-8">
                    <h2 className="text-lg font-semibold mb-3">Neues Modul erstellen</h2>
                    <div className="flex gap-2 flex-wrap">
                        <input
                            type="text"
                            placeholder="Modulname"
                            id="modulname"
                            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none border border-gray-700 focus:border-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="Beschreibung (optional)"
                            id="beschreibung"
                            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none border border-gray-700 focus:border-blue-500"
                        />
                        <button
                            onClick={handleCreateModule}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                            Erstellen
                        </button>
                    </div>
                </div>

                {/* 📋 Module */}
                {loading ? (
                    <p className="text-gray-400 text-center mt-10">📡 Lade Module...</p>
                ) : (
                    <div
                        className="grid"
                        style={{
                            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                            gap: 20,
                        }}
                    >
                        {modules.length === 0 ? (
                            <p className="text-gray-400 col-span-full">Keine Module gefunden 😅</p>
                        ) : (
                            modules.map((m, index) => (
                                <Link
                                    key={m.moduleId || `${m.name}-${index}`}
                                    to={`/files/${m.moduleId}`}
                                    className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-blue-500/30 transform hover:scale-[1.02] flex items-center gap-3"
                                >
                                    <span className="text-3xl">📂</span>
                                    <div>
                                        <div className="font-semibold text-lg">
                                            {m.name || m.moduleId || `Modul ${index + 1}`}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {m.description || "Keine Beschreibung"}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;
