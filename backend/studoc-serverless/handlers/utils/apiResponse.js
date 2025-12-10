// handlers/utils/apiResponse.js

/**
 * Einheitliche API Gateway-kompatible Antwort mit automatischem CORS-Handling.
 * Unterstützt auch Preflight-OPTIONS Requests.
 *
 * @param {number} statusCode - HTTP Statuscode (z. B. 200, 400, 500)
 * @param {object|string} body - Antwortinhalt (Objekt oder Text)
 * @param {object} event - (optional) Lambda Event (zur Erkennung von OPTIONS)
 * @returns {object} - API Gateway Response
 */
export function apiResponse(statusCode, body, event = null) {
    // 🔹 Standard CORS-Header für alle Antworten
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Content-Type": "application/json",
    };

    // 🔹 Falls der Request ein Preflight-OPTIONS war → sofort antworten
    if (event?.requestContext?.http?.method === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "CORS preflight ok" }),
        };
    }

    // 🔹 Normale Antwort zurückgeben
    return {
        statusCode,
        headers,
        body: typeof body === "string" ? body : JSON.stringify(body),
    };
}
