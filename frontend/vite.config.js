import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": "http://localhost:3000",
        },
    },
    build: {
        // Deaktiviert Source Maps für den endgültigen Produktions-Build
        // (Gut für saubere Konsolen, schlecht fürs Debuggen in der Produktion)
        sourcemap: false,
    },
});