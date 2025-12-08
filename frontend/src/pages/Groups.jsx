// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Users, UserPlus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export default function Groups() {
    const { roles, user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [newGroup, setNewGroup] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState({}); // { groupName: [members] }

    const isAdmin = roles.includes("admin");

    /* 🔁 Gruppen laden */
    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const session = await import("aws-amplify/auth").then((mod) => mod.fetchAuthSession());
            const token = session.tokens.idToken.toString();

            const res = await fetch("http://localhost:3000/api/groups", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) setGroups(data);
            else setError(data.error || "Fehler beim Laden der Gruppen");
        } catch (err) {
            console.error("❌ Fehler beim Abrufen der Gruppen:", err);
            setError("Fehler beim Abrufen der Gruppen");
        } finally {
            setLoading(false);
        }
    };

    /* 👥 Benutzerliste laden (nur für Admins) */
    useEffect(() => {
        if (!isAdmin) return;
        fetchAllUsers();
    }, [isAdmin]);

    const fetchAllUsers = async () => {
        try {
            const session = await import("aws-amplify/auth").then((mod) => mod.fetchAuthSession());
            const token = session.tokens.idToken.toString();

            const res = await fetch("http://localhost:3000/api/groups/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) setUsers(data);
        } catch (err) {
            console.error("❌ Fehler beim Laden der Benutzer:", err);
        }
    };

    /* 📥 Mitglieder einer Gruppe laden */
    const fetchMembers = async (groupName) => {
        try {
            const session = await import("aws-amplify/auth").then((mod) => mod.fetchAuthSession());
            const token = session.tokens.idToken.toString();

            const res = await fetch(`http://localhost:3000/api/groups/${groupName}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (res.ok) {
                setGroupMembers((prev) => ({ ...prev, [groupName]: data }));
            }
        } catch (err) {
            console.error("❌ Fehler beim Laden der Mitglieder:", err);
        }
    };

    /* ➕ Neue Gruppe erstellen */
    const handleCreateGroup = async () => {
        if (!newGroup.trim()) return;
        try {
            setLoading(true);
            const session = await import("aws-amplify/auth").then((mod) => mod.fetchAuthSession());
            const token = session.tokens.idToken.toString();

            const res = await fetch("http://localhost:3000/api/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newGroup }),
            });

            const data = await res.json();
            if (res.ok) {
                setGroups((prev) => [...prev, data]);
                setNewGroup("");
            } else {
                alert(`❌ Fehler: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /* ➕ Benutzer zu Gruppe hinzufügen */
    const handleAddUserToGroup = async (groupName) => {
        if (!selectedUser) return alert("Bitte Benutzer auswählen.");
        try {
            const session = await import("aws-amplify/auth").then((mod) => mod.fetchAuthSession());
            const token = session.tokens.idToken.toString();

            const res = await fetch(`http://localhost:3000/api/groups/${groupName}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username: selectedUser }),
            });

            if (res.ok) {
                await fetchMembers(groupName); // 🔁 aktualisieren
                setSelectedUser("");
            } else {
                const data = await res.json();
                alert(`❌ Fehler: ${data.error}`);
            }
        } catch (err) {
            console.error("❌ Fehler beim Hinzufügen:", err);
        }
    };

    /* ❌ Benutzer aus Gruppe entfernen */
    const handleRemoveUser = async (groupName, username) => {
        if (!window.confirm(`Benutzer "${username}" wirklich entfernen?`)) return;

        try {
            const session = await import("aws-amplify/auth").then((mod) => mod.fetchAuthSession());
            const token = session.tokens.idToken.toString();

            const res = await fetch(`http://localhost:3000/api/groups/${groupName}/users/${username}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                await fetchMembers(groupName); // 🔁 automatisch aktualisieren
            } else {
                const err = await res.json();
                alert(`❌ Fehler: ${err.error}`);
            }
        } catch (err) {
            console.error("❌ Fehler beim Entfernen:", err);
        }
    };

    /* ❌ Gruppe löschen */
    const handleDeleteGroup = async (groupName) => {
        if (!window.confirm(`Gruppe "${groupName}" wirklich löschen?`)) return;

        try {
            const session = await import("aws-amplify/auth").then((mod) => mod.fetchAuthSession());
            const token = session.tokens.idToken.toString();

            const res = await fetch(`http://localhost:3000/api/groups/${groupName}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setGroups(groups.filter((g) => g.GroupName !== groupName));
            } else {
                const err = await res.json();
                alert(`❌ Fehler: ${err.error}`);
            }
        } catch (err) {
            console.error("❌ Fehler beim Löschen:", err);
        }
    };

    /* Toggle Gruppen-Ansicht */
    const toggleGroup = (groupName) => {
        if (expandedGroup === groupName) {
            setExpandedGroup(null);
        } else {
            setExpandedGroup(groupName);
            fetchMembers(groupName);
        }
    };

    /* ---------- 🖼️ RENDER ---------- */
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-10">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" /> Gruppenverwaltung
            </h1>

            {/* Adminbereich: Neue Gruppe */}
            {isAdmin && (
                <div className="bg-gray-800 p-6 rounded-2xl mb-10 border border-gray-700">
                    <h2 className="text-xl mb-3">Neue Gruppe erstellen</h2>
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
                            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                            {loading ? "Erstelle..." : "Erstellen"}
                        </button>
                    </div>
                </div>
            )}

            {/* Gruppenliste */}
            {loading ? (
                <p className="text-gray-400">Lade Gruppen...</p>
            ) : error ? (
                <p className="text-red-400">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups
                        .filter((g) => g.GroupName.toLowerCase() !== "admin") // 👈 Admin-Gruppe ausblenden
                        .map((g, i) => (

                            <div key={i} className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xl font-semibold">{g.GroupName}</h3>
                                <button
                                    onClick={() => toggleGroup(g.GroupName)}
                                    className="text-gray-400 hover:text-white transition"
                                >
                                    {expandedGroup === g.GroupName ? <ChevronUp /> : <ChevronDown />}
                                </button>
                            </div>

                            {/* Mitgliederliste */}
                            {expandedGroup === g.GroupName && (
                                <div className="bg-gray-700 p-3 rounded-xl mb-4">
                                    {groupMembers[g.GroupName]?.length ? (
                                        <ul className="space-y-2">
                                            {groupMembers[g.GroupName].map((member) => (
                                                <li
                                                    key={member.username}
                                                    className="flex justify-between items-center bg-gray-800 p-2 rounded-lg"
                                                >
                          <span>
                            {member.given_name
                                ? `${member.given_name} ${member.family_name}`
                                : member.email || member.username}
                          </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleRemoveUser(g.GroupName, member.username)}
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

                            {/* Benutzer hinzufügen */}
                            {isAdmin && (
                                <div className="flex flex-col space-y-2">
                                    <select
                                        className="bg-gray-700 rounded-lg p-2 text-white"
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        value={selectedUser}
                                    >
                                        <option value="">Benutzer auswählen...</option>
                                        {users.map((u) => (
                                            <option key={u.username} value={u.username}>
                                                {u.given_name
                                                    ? `${u.given_name} ${u.family_name}`
                                                    : u.email || u.username}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleAddUserToGroup(g.GroupName)}
                                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg flex items-center gap-2"
                                    >
                                        <UserPlus className="w-4 h-4" /> Benutzer hinzufügen
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGroup(g.GroupName)}
                                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg flex items-center gap-2"
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
