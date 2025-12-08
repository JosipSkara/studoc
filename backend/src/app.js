import express from "express";
import cors from "cors";
import filesRoutes from "./routes/files.js";
import groupRoutes from "./routes/groups.js"; // 👈 HINZUGEFÜGT

const app = express();

// 🔧 Middleware
app.use(cors());
app.use(express.json());
console.log("🚀 Server startet...");
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const routesPath = path.join(__dirname, "routes", "groups.js");
console.log("📁 Suche groups.js unter:", routesPath);
console.log("📄 Existiert Datei?", fs.existsSync(routesPath));

// 🔍 Health Check
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "StuDoc Backend" });
});

// 🗂️ API-Routen
app.use("/api", filesRoutes);
app.use("/api/groups", groupRoutes); // ✅ nur einmal!

// 🚀 Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend läuft auf Port ${PORT}`));
