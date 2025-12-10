// src/components/ModuleUserManagement.jsx

import React, { useState, useEffect } from 'react';
import {
    Loader2,
    Plus,
    X,
    User,
    Users
} from "lucide-react"; // Importiere Icons für besseres Feedback
import {
    apiListModuleUsers,
    apiAddUserToModule,
    apiRemoveUserFromModule,
    apiListAllUsers
} from '../services/apiService';

// Typ-Definition für Benutzerdaten (wird von apiListAllUsers erwartet)
// Angenommen: { username: string, given_name?: string, family_name?: string, email?: string }

function ModuleUserManagement({ moduleId, moduleOwner }) {
    // Speichert vollständige Benutzerobjekte
    const [allUsers, setAllUsers] = useState([]);
    // Speichert nur die Benutzernamen, die zugewiesen sind (wie vom Backend zurückgegeben)
    const [assignedUsernames, setAssignedUsernames] = useState([]);
    const [selectedUsername, setSelectedUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hilfsfunktion: Findet den Anzeigenamen
    const getDisplayName = (username) => {
        const user = allUsers.find(u => u.username === username);
        if (!user) return username;

        // Versuche, Vorname Nachname anzuzeigen
        if (user.given_name && user.family_name) {
            return `${user.given_name} ${user.family_name}`;
        }
        // Fallback zur E-Mail oder Username
        return user.email || username;
    };

    // 1. Daten laden
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // A) Alle Benutzer (Objekte) laden (Handler /users/all)
            const all = await apiListAllUsers();

            // B) Aktuelle Modul-Benutzer (Array von Usernames) laden (Handler /modules/{id}/users)
            const assigned = await apiListModuleUsers(moduleId);

            setAllUsers(all);
            setAssignedUsernames(assigned);

            // Setzt den ersten unzugewiesenen Benutzer als Standard
            const unassignedUsernames = all
                .map(u => u.username)
                .filter(u => !assigned.includes(u));

            if (unassignedUsernames.length > 0) {
                setSelectedUsername(unassignedUsernames[0]);
            } else {
                setSelectedUsername('');
            }

        } catch (err) {
            setError(`Fehler beim Laden der Benutzerdaten: ${err.message || 'Netzwerkfehler'}`);
            console.error("❌ Fetch-Fehler:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (moduleId) {
            fetchData();
        }
    }, [moduleId]);

    // 2. Benutzer zuweisen
    const handleAddUser = async () => {
        if (!selectedUsername) return;
        setIsLoading(true);
        try {
            await apiAddUserToModule(moduleId, selectedUsername);
            await fetchData(); // Liste neu laden
        } catch (err) {
            setError(`Fehler beim Zuweisen von ${selectedUsername}.`);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Benutzer entfernen
    const handleRemoveUser = async (username) => {
        if (username === moduleOwner) {
            alert("Der Modulbesitzer kann nicht entfernt werden!");
            return;
        }
        if (!window.confirm(`Soll der Benutzer ${username} wirklich entfernt werden?`)) return;

        setIsLoading(true);
        try {
            await apiRemoveUserFromModule(moduleId, username);
            await fetchData(); // Liste neu laden
        } catch (err) {
            setError(`Fehler beim Entfernen von ${username}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const unassignedCount = allUsers.length - assignedUsernames.length;

    // 🧩 UI Render
    return (
        <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-blue-400 flex items-center gap-2">
                <Users className="w-6 h-6" /> Zugriff für Modul `{moduleId}` verwalten
            </h3>

            {/* Lade- / Fehlerzustand */}
            {isLoading && (
                <div className="text-center p-4 text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin w-5 h-5" /> Lade Benutzerdaten...
                </div>
            )}
            {error && (
                <div className="bg-red-900/50 text-red-300 p-3 rounded-lg border border-red-700 mb-4">
                    {error}
                </div>
            )}

            {/* Zuweisungsformular */}
            <div className="bg-gray-700 p-4 rounded-lg mb-8 border border-gray-600">
                <h4 className="text-lg font-semibold mb-3 text-gray-200">Benutzer zuweisen ({unassignedCount} verfügbar)</h4>
                <div className="flex space-x-3">
                    <select
                        value={selectedUsername}
                        onChange={(e) => setSelectedUsername(e.target.value)}
                        disabled={isLoading || unassignedCount === 0}
                        className="bg-gray-900 text-white rounded-lg p-2.5 flex-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {unassignedCount === 0 && <option value="">Alle Benutzer zugewiesen</option>}
                        {allUsers
                            .filter(u => !assignedUsernames.includes(u.username))
                            .map(u => (
                                <option key={u.username} value={u.username}>
                                    {getDisplayName(u.username)} ({u.username})
                                </option>
                            ))}
                    </select>
                    <button
                        onClick={handleAddUser}
                        disabled={isLoading || unassignedCount === 0}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold text-white transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" /> Zuweisen
                    </button>
                </div>
            </div>

            {/* Zugewiesene Benutzerliste */}
            <h4 className="text-lg font-semibold mb-3 text-gray-200">Aktuell zugewiesene Benutzer ({assignedUsernames.length}):</h4>
            <ul className="space-y-2">
                {assignedUsernames.map(username => (
                    <li
                        key={username}
                        className="flex justify-between items-center bg-gray-700 p-3 rounded-lg border border-gray-600"
                    >
                        <span className="text-gray-200 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-300" />
                            {getDisplayName(username)} <span className="text-sm text-gray-400">({username})</span>
                        </span>

                        {username === moduleOwner ? (
                            <span className="bg-blue-600 px-3 py-1 text-xs rounded-full font-semibold text-white">
                                Besitzer
                            </span>
                        ) : (
                            <button
                                onClick={() => handleRemoveUser(username)}
                                disabled={isLoading}
                                className="text-red-400 hover:text-red-500 transition disabled:opacity-50 flex items-center gap-1"
                            >
                                <X className="w-4 h-4" /> Entfernen
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ModuleUserManagement;