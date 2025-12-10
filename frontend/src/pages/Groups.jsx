// src/pages/Groups.jsx
// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
    Users,
    UserPlus,
    Trash2,
    Loader2,
    ChevronDown,
    ChevronUp,
    RefreshCw
} from "lucide-react";
import {
    apiListGroups,
    apiFetchAllUsers,
    apiFetchMembers,
    apiCreateGroup,
    apiAddUserToGroup,
    apiRemoveUser,
    apiDeleteGroup
} from "../services/apiService";

export default function Groups() {
    const { roles } = useAuth();
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [groupMembers, setGroupMembers] = useState({});
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [newGroup, setNewGroup] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isAdmin = roles.includes("admin") || roles.includes("Admin");

    // 🔁 Gruppen & Benutzer beim Start laden
    useEffect(() => {
        fetchGroups();
        if (isAdmin) fetchUsers();
    }, [isAdmin]);

    // 📋 Gruppen abrufen
    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await apiListGroups();
            setGroups(data.sort((a, b) => a.groupName.localeCompare(b.groupName)));
        } catch (err) {
            console.error("❌ Fehler beim Abrufen der Gruppen:", err);
            setError("Fehler beim Laden der Gruppen.");
        } finally {
            setLoading(false);
        }
    };

    // 👥 Benutzer abrufen (nur für Admin)
    const fetchUsers = async () => {
        try {
            const data = await apiFetchAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("❌ Fehler beim Laden der Benutzer:", err);
        }
    };

    // 👤 Mitglieder einer Gruppe abrufen
    const fetchMembers = async (groupName) => {
        try {
            const members = await apiFetchMembers(groupName);
            setGroupMembers((prev) => ({ ...prev, [groupName]: members }));
        } catch (err) {
            console.error("❌ Fehler beim Laden der Mitglieder:", err);
            alert("Fehler beim Laden der Mitglieder.");
        }
    };

    // ➕ Neue Gruppe erstellen
    const handleCreateGroup = async () => {
        if (!newGroup.trim()) return alert("Bitte Gruppennamen eingeben!");
        try {
            setLoading(true);
            const res = await apiCreateGroup(newGroup.trim());
            setGroups((prev) => [...prev, res]);
            setNewGroup("");
        } catch (err) {
            alert(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ➕ Benutzer zu Gruppe hinzufügen
    const handleAddUser = async (groupName) => {
        if (!selectedUser) return alert("Bitte Benutzer auswählen!");
        try {
            await apiAddUserToGroup(groupName, selectedUser);
            await fetchMembers(groupName);
            setSelectedUser("");
        } catch (err) {
            alert(`❌ ${err.message}`);
        }
    };

    // ❌ Benutzer aus Gruppe entfernen
    const handleRemoveUser = async (groupName, username) => {
        if (!window.confirm(`Benutzer "${username}" wirklich entfernen?`)) return;
        try {
            await apiRemoveUser(groupName, username);
            await fetchMembers(groupName);
        } catch (err) {
            alert(`❌ ${err.message}`);
        }
    };

    // ❌ Gruppe löschen
    const handleDeleteGroup = async (groupName) => {
        if (!window.confirm(`Gruppe "${groupName}" wirklich löschen?`)) return;
        try {
            await apiDeleteGroup(groupName);
            setGroups((prev) => prev.filter((g) => g.groupName !== groupName));
        } catch (err) {
            alert(`❌ ${err.message}`);
        }
    };

    // 👁️ Gruppe aus-/einklappen
    const toggleGroup = (groupName) => {
        if (expandedGroup === groupName) {
            setExpandedGroup(null);
        } else {
            setExpandedGroup(groupName);
            if (!groupMembers[groupName]) fetchMembers(groupName);
        }
    };

    // 🧩 UI Render
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-400" /> Gruppenverwaltung
                </h1>
                <button
                    onClick={fetchGroups}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" /> Aktualisieren
                </button>
            </div>

            {/* Adminbereich: Neue Gruppe */}
            {isAdmin && (
                <div className="bg-gray-800 p-6 rounded-2xl mb-8 border border-gray-700">
                    <h2 className="text-xl mb-3 font-semibold text-blue-300">Neue Gruppe erstellen</h2>
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            value={newGroup}
                            onChange={(e) => setNewGroup(e.target.value)}
                            placeholder="Gruppenname"
                            className="bg-gray-700 rounded-lg p-2 flex-1 outline-none"
                        />
                        <button
                            onClick={handleCreateGroup}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                            Erstellen
                        </button>
                    </div>
                </div>
            )}

            {/* Gruppenliste */}
            {loading ? (
                <p className="text-gray-400">⏳ Lade Gruppen...</p>
            ) : error ? (
                <p className="text-red-400">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((g, i) => (
                        <div
                            key={`${g.groupName || "group"}-${i}`}
                            className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg"
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xl font-semibold text-blue-300">{g.groupName}</h3>
                                <button
                                    onClick={() => toggleGroup(g.groupName)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    {expandedGroup === g.groupName ? <ChevronUp /> : <ChevronDown />}
                                </button>
                            </div>

                            {/* Mitgliederliste */}
                            {expandedGroup === g.groupName && (
                                <div className="bg-gray-700 p-3 rounded-xl mb-4">
                                    {groupMembers[g.groupName]?.length ? (
                                        <ul className="space-y-2">
                                            {groupMembers[g.groupName].map((member, j) => (
                                                <li
                                                    key={`${g.groupName}-${member.username || j}`}
                                                    className="flex justify-between items-center bg-gray-800 p-2 rounded-lg"
                                                >
                                                    <span>
                                                        {member.given_name
                                                            ? `${member.given_name} ${member.family_name}`
                                                            : member.email || member.username}
                                                    </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveUser(g.groupName, member.username)
                                                            }
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-400">Keine Mitglieder.</p>
                                    )}
                                </div>
                            )}

                            {/* Aktionen */}
                            {isAdmin && (
                                <div className="space-y-2">
                                    <select
                                        className="bg-gray-700 rounded-lg p-2 w-full text-white"
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        value={selectedUser}
                                    >
                                        <option value="">Benutzer auswählen...</option>
                                        {users.map((u, idx) => (
                                            <option key={`${u.username}-${idx}`} value={u.username}>
                                                {u.given_name
                                                    ? `${u.given_name} ${u.family_name}`
                                                    : u.email || u.username}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => handleAddUser(g.groupName)}
                                        className="bg-green-600 hover:bg-green-700 w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="w-4 h-4" /> Benutzer hinzufügen
                                    </button>

                                    <button
                                        onClick={() => handleDeleteGroup(g.groupName)}
                                        className="bg-red-600 hover:bg-red-700 w-full px-3 py-2 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Gruppe löschen
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
