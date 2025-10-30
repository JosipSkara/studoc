import { NextRequest, NextResponse } from 'next/server';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { doc, tables } from '@/lib/aws';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const email = String(form.get('email') ?? '').toLowerCase();
        const password = String(form.get('password') ?? '');

        if (!email || !password) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        // Robust: finde den User per Scan – egal ob PK UserID/userId ist oder Email als Attribut existiert
        const scan = await doc.send(new ScanCommand({
            TableName: tables.users,
            FilterExpression:
                '#uid = :e OR #uid2 = :e OR #em = :e OR #em2 = :e',
            ExpressionAttributeNames: {
                '#uid': 'UserID',
                '#uid2': 'userId',
                '#em': 'Email',
                '#em2': 'email',
            },
            ExpressionAttributeValues: { ':e': email },
            Limit: 1,
        }));

        const user = scan.Items?.[0] as any;
        if (!user) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 });
        }

        const storedHash = user.Password ?? user.password;
        if (!storedHash) {
            return NextResponse.json({ error: 'no_password_field' }, { status: 500 });
        }

        const ok = await bcrypt.compare(password, storedHash);
        if (!ok) {
            return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
        }

        const sub    = user.UserID ?? user.userId ?? email;
        const mail   = user.Email  ?? user.email  ?? email;
        const roles  = user.Roles  ?? user.roles  ?? [];
        const groups = user.Groups ?? user.groups ?? ['default'];

        const token = jwt.sign({ sub, email: mail, roles, groups }, JWT_SECRET, { expiresIn: '7d' });

        const resp = NextResponse.redirect(new URL('/dashboard', req.url));
        resp.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
        return resp;
    } catch (err: any) {
        console.error('Login failed:', err);
        return NextResponse.json(
            { error: err?.name || 'internal_error', message: err?.message || 'unknown' },
            { status: 500 }
        );
    }
}

export function GET() {
    return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
