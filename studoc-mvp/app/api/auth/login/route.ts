import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail } from '@/lib/userStore';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const email = String(form.get('email') ?? '').toLowerCase();
        const password = String(form.get('password') ?? '');

        if (!email || !password) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        // User aus Store holen (local -> .data/users.json, aws -> DynamoDB)
        const user = await getUserByEmail(email);
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

        const roles  = user.Roles  ?? user.roles  ?? [];
        const groups = user.Groups ?? user.groups ?? ['default'];

        const token = jwt.sign(
            {
                sub: user.UserID ?? user.userId ?? email,
                email: user.Email ?? user.email ?? email,
                roles,
                groups,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const resp = NextResponse.redirect(new URL('/dashboard', req.url));
        resp.cookies.set('token', token, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });
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
