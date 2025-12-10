// handlers/utils/auth.js (FINAL KORREKTUR)

/**
 * Extrahiert Cognito-Gruppen aus den Claims des JWT-Tokens,
 * die vom Cognito Authorizer im Event-Kontext bereitgestellt werden.
 */
export const getGroupsFromToken = (event) => {
    const claims = event.requestContext?.authorizer?.jwt?.claims;

    // Extrahieren der Gruppen. Muss String-Check verwenden, da Cognito es so übergibt.
    let groupsRaw = claims?.['cognito:groups'];

    if (typeof groupsRaw === 'string') {
        // 1. Klammern entfernen: "[user admin]" -> "user admin"
        let processedGroups = groupsRaw.replace(/[\[\]]/g, '').trim();

        // 2. Nach Leerzeichen oder Komma splitten und trimmen
        // Fall 1: Leerzeichen-getrennt (wie in Ihrem Log)
        if (processedGroups.includes(' ')) {
            return processedGroups
                .split(' ')
                .map(g => g.trim())
                .filter(g => g.length > 0); // Leere Strings entfernen

            // Fall 2: Komma-getrennt (häufiger)
        } else if (processedGroups.includes(',')) {
            return processedGroups
                .split(',')
                .map(g => g.trim())
                .filter(g => g.length > 0);
        }

        // Wenn es nur eine Gruppe ohne Trennzeichen ist
        if (processedGroups.length > 0) {
            return [processedGroups];
        }
    }

    // Rückgabe als leeres Array, falls keine Gruppen gefunden wurden
    return [];
};


/**
 * 👤 Extrahiert den Benutzernamen (Username) aus den JWT-Claims.
 * Der Name wird üblicherweise unter dem Schlüssel 'username' gespeichert.
 */
export const getUsernameFromToken = (event) => {
    const claims = event.requestContext?.authorizer?.jwt?.claims;

    // Cognito verwendet standardmäßig den Claim 'username'
    const username = claims?.username;

    if (username && typeof username === 'string') {
        return username;
    }

    // Fallback, falls der Claim anders benannt ist (z.B. sub oder cognito:username)
    // Dies ist in AWS meistens nicht nötig, aber zur Sicherheit.
    return claims?.['cognito:username'] || claims?.sub || null;
};