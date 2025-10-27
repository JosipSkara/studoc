
'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="card">
      <h1>Login</h1>
      <form method="post" action="/api/auth/login" className="grid">
        <div><label>E-Mail</label><input name="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><label>Passwort</label><input name="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button>Anmelden</button>
      </form>
    </div>
  );
}
