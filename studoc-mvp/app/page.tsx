
import Link from 'next/link';
export default function Home() {
  return (
    <main className="card">
      <h1>StuDoc – Dokumentenverwaltung von Studierenden für Studierende</h1>
      <p>Lade jetzt relevante Studienunterlagen hoch und siehe im Gegenzug relevante Studienunterlagen ein, welche du benötigst!</p>
      <div className="row" style={{marginTop:12}}>
        <Link href="/register"><button>Registrieren</button></Link>
        <Link href="/login"><button>Login</button></Link>
      </div>
    </main>
  );
}
