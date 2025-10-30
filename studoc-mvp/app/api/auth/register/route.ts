import { NextRequest, NextResponse } from 'next/server';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { doc, tables } from '@/lib/aws';
import bcrypt from 'bcryptjs';

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

        // Hash des Passworts erzeugen
        const hashedPassword = await bcrypt.hash(password, 10);

        // DynamoDB erwartet als Partition Key den Namen "UserID"
        const userItem = {
            UserID: email,           // Wichtig: Feldname exakt wie in DynamoDB
            Name: name,
            Email: email,
            Password: hashedPassword,
            Roles: ['user'],
            Groups: ['default'],
            CreatedAt: new Date().toISOString(),
        };

        // Speichern in DynamoDB
        await doc.send(new PutCommand({
            TableName: tables.users,
            Item: userItem,
        }));

        console.log('✅ Neuer Benutzer erfolgreich registriert:', email);

        // Nach erfolgreicher Registrierung weiterleiten zum Login
        return NextResponse.redirect(new URL('/login', req.url));
    } catch (err: any) {
        console.error('❌ Registrierung fehlgeschlagen:', err);
        return NextResponse.json(
            { error: err?.name || 'internal_error', message: err?.message || 'unknown' },
            { status: 500 }
        );
    }
}

// Blockiere direkte GET-Aufrufe (z. B. durch Browser)
export function GET() {
    return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}

