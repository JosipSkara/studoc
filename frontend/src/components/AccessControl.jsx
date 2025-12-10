// src/pages/AccessControl.jsx

import React, { useState, useEffect } from 'react';
import { apiListModules } from '../services/apiService';
import ModuleUserManagement from '../pages/ModuleUserManagement'; // ⚠️ Korrigierter Pfad (angenommen, die Komponente liegt in 'components')
import { Loader2, Box, CheckCircle } from 'lucide-react';

function AccessControl() {
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                // Lädt Module (sollte nur Module laden, für die der Benutzer Admin/Owner ist)
                const data = await apiListModules();
                setModules(data.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (err) {
                // Hier fangen wir Fehler ab, falls apiListModules fehlschlägt (z.B. 403)
                setError("Fehler beim Laden der Module. Bitte Berechtigungen prüfen.");
                console.error("❌ Fehler beim Abrufen der Modulliste:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, []);

    // 🧩 Lade- und Fehlerzustände der Hauptseite
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mr-2" /> Lade Module...
            </div>
        );
    }
    if (error) {
        return (
            <div className="min-h-screen p-10 bg-gray-900 text-white">
                <div className="bg-red-900/50 text-red-300 p-4 rounded-lg border border-red-700">
                    {error}
                </div>
            </div>
        );
    }

    // 🧩 Haupt-UI (Split-Screen)
    return (
        <div className="min-h-screen p-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <h1 className="text-3xl font-bold mb-6 text-blue-400 flex items-center gap-3">
                <Box className="w-8 h-8" /> Modul-Zugriffsverwaltung
            </h1>

            <div className="flex bg-gray-800 rounded-xl shadow-2xl border border-gray-700" style={{ height: 'calc(100vh - 150px)' }}>

                {/* ⬅️ Linke Spalte: Modulliste */}
                <div className="w-1/3 overflow-y-auto border-r border-gray-700 p-5">
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">Verfügbare Module ({modules.length})</h2>
                    {modules.map(module => (
                        <div
                            key={module.moduleId}
                            onClick={() => setSelectedModule(module)}
                            className={`p-3 rounded-lg cursor-pointer transition duration-150 mb-2 border 
                                ${selectedModule?.moduleId === module.moduleId
                                ? 'bg-blue-600 border-blue-400 shadow-md'
                                : 'bg-gray-700 hover:bg-gray-600 border-transparent'
                            }`}
                        >
                            <strong className={selectedModule?.moduleId === module.moduleId ? 'text-white' : 'text-blue-300'}>
                                {module.name}
                            </strong>
                            <p className={`m-0 text-xs ${selectedModule?.moduleId === module.moduleId ? 'text-blue-100' : 'text-gray-400'}`}>
                                Besitzer: {module.owner}
                            </p>
                            {selectedModule?.moduleId === module.moduleId && (
                                <span className="text-xs text-blue-100 flex items-center gap-1 mt-1">
                                    <CheckCircle className="w-3 h-3" /> Ausgewählt
                                </span>
                            )}
                        </div>
                    ))}
                    {modules.length === 0 && <p className="text-gray-400 mt-5">Keine Module gefunden. Sind Sie als Admin oder Dozent angemeldet?</p>}
                </div>

                {/* ➡️ Rechte Spalte: Benutzerverwaltung */}
                <div className="w-2/3 p-5 overflow-y-auto">
                    {selectedModule ? (
                        <ModuleUserManagement
                            moduleId={selectedModule.moduleId}
                            moduleOwner={selectedModule.owner}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-center">
                            <p className="p-8 border border-gray-600 rounded-xl bg-gray-700/50">
                                👈 Bitte wählen Sie ein Modul aus der Liste links, um die Zugriffsrechte für Benutzer zu definieren.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AccessControl;