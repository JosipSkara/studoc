import { NextRequest, NextResponse } from "next/server";

function createLogoutResponse(request: NextRequest) {
    // Absoluter URL für Redirect (wichtig in Route-Handlern)
    const redirectUrl = new URL("/", request.url);
    const res = NextResponse.redirect(redirectUrl);

    // Token-Cookie löschen
    res.cookies.set("token", "", {
        httpOnly: true,
        secure: false,     // lokal ruhig false lassen
        sameSite: "lax",
        expires: new Date(0),
        path: "/",
    });

    return res;
}

export async function GET(request: NextRequest) {
    return createLogoutResponse(request);
}

export async function POST(request: NextRequest) {
    return createLogoutResponse(request);
}
