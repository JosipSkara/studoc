// backend/src/routes/groups.js
import express from "express";
import {
    listGroups,
    createGroup,
    deleteGroup,
    addUserToGroup,
    listAllUsers,
    listUsersInGroup,
    removeUserFromGroup,
} from "../services/AdminCognitoService.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* -------------------- 👥 ALLE BENUTZER LADEN (für Dropdown) -------------------- */
router.get("/users", verifyToken, async (req, res) => {
    try {
        const users = await listAllUsers();
        res.json(users);
    } catch (err) {
        console.error("❌ Fehler beim Laden der Benutzer:", err);
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- 👥 MITGLIEDER EINER BESTIMMTEN GRUPPE -------------------- */
router.get("/:groupName/users", verifyToken, async (req, res) => {
    try {
        const { groupName } = req.params;
        const members = await listUsersInGroup(groupName);
        res.json(members);
    } catch (err) {
        console.error("❌ Fehler beim Laden der Gruppenmitglieder:", err);
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- ➕ BENUTZER ZU GRUPPE HINZUFÜGEN -------------------- */
router.post("/:groupName/users", verifyToken, async (req, res) => {
    try {
        const { username } = req.body;
        const { groupName } = req.params;

        await addUserToGroup(username, groupName);
        res.json({ message: `✅ Benutzer ${username} zu Gruppe ${groupName} hinzugefügt` });
    } catch (err) {
        console.error("❌ Fehler beim Hinzufügen:", err);
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- ❌ BENUTZER AUS GRUPPE ENTFERNEN -------------------- */
router.delete("/:groupName/users/:username", verifyToken, async (req, res) => {
    try {
        const { groupName, username } = req.params;
        await removeUserFromGroup(username, groupName);
        res.json({ message: `✅ Benutzer ${username} aus ${groupName} entfernt` });
    } catch (err) {
        console.error("❌ Fehler beim Entfernen des Benutzers:", err);
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- 📋 ALLE GRUPPEN ABRUFEN -------------------- */
router.get("/", verifyToken, async (req, res) => {
    try {
        const groups = await listGroups();
        res.json(groups);
    } catch (err) {
        console.error("❌ Fehler beim Laden der Gruppen:", err);
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- ➕ NEUE GRUPPE ERSTELLEN -------------------- */
router.post("/", verifyToken, async (req, res) => {
    try {
        const { name } = req.body;
        const group = await createGroup(name);
        res.json(group);
    } catch (err) {
        console.error("❌ Fehler beim Erstellen der Gruppe:", err);
        res.status(500).json({ error: err.message });
    }
});

/* -------------------- ❌ GRUPPE LÖSCHEN -------------------- */
router.delete("/:groupName", verifyToken, async (req, res) => {
    try {
        const { groupName } = req.params;
        await deleteGroup(groupName);
        res.json({ message: `✅ Gruppe ${groupName} gelöscht` });
    } catch (err) {
        console.error("❌ Fehler beim Löschen der Gruppe:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
