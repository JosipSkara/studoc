
import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="container">
          <header className="row" style={{justifyContent:'space-between', marginBottom:16}}>
            <div className="row" style={{gap:16}}>
              <Link href="/">StuDoc</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/upload">Upload</Link>
              <Link href="/files">Files</Link>
            </div>
            <form action="/api/auth/logout" method="post">
              <button>Logout</button>
            </form>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
