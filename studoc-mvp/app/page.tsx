
import Link from 'next/link';
export default function Home() {
  return (
    <main className="card">
      <h1>StuDoc – Dokumentenverwaltung (MVP)</h1>
      <p>Upload, Gruppenfreigabe, Tags und einfache Suche – auf AWS S3 + DynamoDB.</p>
      <div className="row" style={{marginTop:12}}>
        <Link href="/register"><button>Registrieren</button></Link>
        <Link href="/login"><button>Login</button></Link>
      </div>
    </main>
  );
}
