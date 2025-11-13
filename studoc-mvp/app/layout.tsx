import './globals.css';
import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    let email: string | null = null;
    if (token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET) as any;
            email = String(payload?.email || payload?.sub || '').toLowerCase();
        } catch {
            email = null;
        }
    }

    const loggedIn = !!email;

    return (
        <html lang="de">
        <body>
        <div className="container">
            <header
                className="row"
                style={{ justifyContent: 'space-between', marginBottom: 16 }}
            >
                {/* --- Navigation Left --- */}
                <div className="row" style={{ gap: 16 }}>

                    {/* StuDoc Verhalten abhängig vom Login-Status */}
                    {!loggedIn ? (
                        <Link href="/">StuDoc</Link>
                    ) : (
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  StuDoc
                </span>
                    )}

                    {loggedIn && (
                        <>
                            <Link href="/dashboard">Dashboard</Link>
                            <Link href="/upload">Upload</Link>
                            <Link href="/files">Files</Link>
                        </>
                    )}
                </div>

                {/* --- Navigation Right --- */}
                <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                    {loggedIn && (
                        <>
                  <span style={{ fontSize: 14, opacity: 0.8 }}>
                    Eingeloggt als <strong>{email}</strong>
                  </span>

                            <form action="/api/auth/logout" method="post">
                                <button>Logout</button>
                            </form>
                        </>
                    )}
                </div>
            </header>

            {children}
        </div>
        </body>
        </html>
    );
}
