import { useEffect, useState } from "react";
import GroupCard from "../components/GroupCard";
import { listGroups, createGroup, deleteGroup } from "../services/AdminCognitoService";
import { useAuth } from "../context/AuthContext";

export default function GroupManager() {
    const { roles } = useAuth();
    const [groups, setGroups] = useState([]);
    const [newGroup, setNewGroup] = useState("");
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false);
    const isAdmin = roles.includes("admin");

    const loadGroups = async () => {
        setLoading(true);
        const res = await listGroups();
        setGroups(res);
        setLoading(false);
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const handleCreate = async () => {
        if (!newGroup) return alert("Bitte Gruppennamen eingeben!");
        try {
            await createGroup(newGroup, desc);
            setNewGroup("");
            setDesc("");
            loadGroups();
        } catch (err) {
            console.error("❌ Fehler beim Erstellen:", err);
            alert("Fehler beim Erstellen der Gruppe");
        }
    };

    const handleDelete = async (name) => {
        if (!confirm(`Gruppe "${name}" wirklich löschen?`)) return;
        try {
            await deleteGroup(name);
            loadGroups();
        } catch (err) {
            console.error("❌ Fehler beim Löschen:", err);
            alert("Fehler beim Löschen");
        }
    };

    if (!isAdmin)
        return (
            <div className="flex justify-center items-center h-screen text-red-400">
                Zugriff verweigert (nur Admins)
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-10">
            <h1 className="text-4xl font-bold mb-8 text-blue-400">Gruppenverwaltung</h1>

            <div className="bg-gray-900/70 border border-gray-700 rounded-xl p-6 mb-10 max-w-xl">
                <h2 className="text-2xl font-semibold mb-4">Neue Gruppe erstellen</h2>
                <input
                    type="text"
                    placeholder="Gruppenname"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700"
                />
                <input
                    type="text"
                    placeholder="Beschreibung (optional)"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700"
                />
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold"
                >
                    ➕ Gruppe erstellen
                </button>
            </div>

            {loading ? (
                <p>Lade Gruppen...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((g) => (
                        <GroupCard
                            key={g.GroupName}
                            name={g.GroupName}
                            members={g.Precedence || 0}
                            isAdmin={isAdmin}
                            onEdit={() => alert("Funktion folgt")}
                            onDelete={() => handleDelete(g.GroupName)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
