import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "studoc-backend" });
});

// Beispiel-API
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from StuDoc Backend!" });
});

app.listen(PORT, () => {
    console.log(`StuDoc backend listening on port ${PORT}`);
});
