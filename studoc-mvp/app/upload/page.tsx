'use client';

import { useState } from 'react';

const MODULES = ['MSTW', 'BUSW', 'ASPR', 'CLDE', 'OOPR', 'DSAI'] as const;

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [groupId, setGroupId] = useState<string>(MODULES[0]); // Startwert: MSTW
    const [tags, setTags] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        if (!file) {
            setMsg('Bitte eine Datei auswählen.');
            return;
        }

        setBusy(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('groupId', groupId);
            fd.append('tags', tags);

            const r = await fetch('/api/files/upload', { method: 'POST', body: fd });
            const j = await r.json();

            if (!r.ok || !j?.ok) {
                throw new Error(j?.error || 'Upload fehlgeschlagen');
            }

            setMsg(
                j.mode === 'aws'
                    ? 'Upload erfolgreich (S3).'
                    : 'Upload erfolgreich (lokal, siehe .data/uploads).'
            );

            setFile(null);
            const input = document.getElementById('file-input') as HTMLInputElement | null;
            if (input) input.value = '';
        } catch (err: any) {
            console.error(err);
            setMsg(err?.message || 'Upload fehlgeschlagen.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="card">
            <h1>Upload</h1>
            <form onSubmit={onSubmit} className="grid gap-3">
                <div>
                    <label>Datei</label><br />
                    <input
                        id="file-input"
                        type="file"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                </div>

                <div>
                    <label>Modul</label><br />
                    <select
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                    >
                        {MODULES.map(mod => (
                            <option key={mod} value={mod}>
                                {mod}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Tags (kommagetrennt)</label><br />
                    <input
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="z.B. Skript, Übung, Prüfung"
                    />
                </div>

                <button disabled={busy}>{busy ? 'Lädt…' : 'Hochladen'}</button>
            </form>

            {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
        </div>
    );
}
