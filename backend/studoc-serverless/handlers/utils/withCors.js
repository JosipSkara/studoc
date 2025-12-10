// handlers/utils/withCors.js
import { apiResponse } from "./apiResponse.js";

/**
 * Wrapper-Funktion, die CORS-Header und Preflight-Handling automatisch übernimmt.
 *
 * @param {Function} handlerFn - Dein eigentlicher Lambda-Handler
 * @returns {Function} - Eingepackter Handler mit automatischem CORS-Support
 */
export const withCors = (handlerFn) => async (event, context) => {
    // 🔹 OPTIONS Preflight automatisch behandeln
    if (event?.requestContext?.http?.method === "OPTIONS") {
        return apiResponse(200, { message: "CORS preflight ok" }, event);
    }

    try {
        // 🔹 Deinen echten Handler ausführen
        const result = await handlerFn(event, context);

        // 🔹 Falls dein Handler bereits Headers hat → CORS anhängen
        const existingHeaders = result?.headers || {};
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        };

        return {
            ...result,
            headers: { ...existingHeaders, ...corsHeaders },
        };
    } catch (error) {
        console.error("❌ Fehler im withCors Wrapper:", error);
        return apiResponse(500, { error: error.message || "Interner Serverfehler" }, event);
    }
};
