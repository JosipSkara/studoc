import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { putUser, getUserByEmail } from '@/lib/userStore';

// (optional) explizit machen, dass diese Route im Node-Runtime läuft
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const name = String(form.get('name') ?? '');
        const email = String(form.get('email') ?? '').toLowerCase();
        const password = String(form.get('password') ?? '');

        // Eingabefelder prüfen
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        // Prüfen, ob User bereits existiert (funktioniert in local & aws)
        const existing = await getUserByEmail(email);
        if (existing) {
            return NextResponse.json({ error: 'user_exists' }, { status: 409 });
        }

        // Passwort hashen
        const hashedPassword = await bcrypt.hash(password, 10);

        // Einheitliches User-Objekt (AWS-kompatibel: PK = UserID)
        const userItem = {
            UserID: email,                 // Primärschlüssel (DynamoDB-kompatibel)
            Name: name,
            Email: email,
            Password: hashedPassword,
            Roles: ['user'],
            Groups: ['default'],
            CreatedAt: new Date().toISOString(),
        };

        // Speichern – wird im local-Mode in .data/users.json geschrieben,
        // im aws-Mode in die DynamoDB-Tabelle (tables.users)
        await putUser(userItem);

        console.log('✅ Neuer Benutzer registriert:', email);

        // Weiterleitung zum Login
        return NextResponse.redirect(new URL('/login', req.url));
    } catch (err: any) {
        console.error('❌ Registrierung fehlgeschlagen:', err);
        return NextResponse.json(
            { error: err?.name || 'internal_error', message: err?.message || 'unknown' },
            { status: 500 }
        );
    }
}

// Direkte GET-Aufrufe blocken
export function GET() {
    return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
