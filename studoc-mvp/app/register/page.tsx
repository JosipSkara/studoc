
'use client';
import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="card">
      <h1>Registrieren</h1>
      <form method="post" action="/api/auth/register" className="grid">
        <div><label>Name</label><input name="name" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><label>E-Mail</label><input name="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><label>Passwort</label><input name="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button>Konto erstellen</button>
      </form>
    </div>
  );
}
