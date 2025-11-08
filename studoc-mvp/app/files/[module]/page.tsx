'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type FileEntry = {
    filename: string;
    key: string;
    size: number;
    lastModified?: string;
};

type GroupData = Record<string, Record<string, FileEntry[]>>;

export default function ModuleFilesPage({
                                            params,
                                        }: {
    params: { module: string };
}) {
    const moduleParam = (params.module || '').toUpperCase(); // z.B. "BUSW"
    const [q, setQ] = useState('');
    const [groups, setGroups] = useState<GroupData>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            // Wir holen weiterhin die Gesamtliste und filtern clientseitig auf dieses Modul
            const res = await fetch('/api/files/list?q=' + encodeURIComponent(q));
            const data = await res.json();
            setGroups(data.groups || {});
            setLoading(false);
        })();
    }, [q, moduleParam]);

    const moduleFiles = useMemo(() => {
        // Nur den Eintrag für dieses Modul herausziehen
        const forModule = groups[moduleParam] || {};
        return forModule;
    }, [groups, moduleParam]);

    if (loading) return <p>🔄 Lade Dateien…</p>;

    const s3Bucket =
        process.env.NEXT_PUBLIC_STUDOC_BUCKET || 'studoc-stodjo-30.10.2025';
    const region = process.env.AWS_REGION || 'us-east-1';

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link href="/files" className="text-blue-500 underline">
                    ⟵ Zur Modulübersicht
                </Link>
                <h1 style={{ margin: 0 }}>📂 {moduleParam}</h1>
            </div>

            <div style={{ marginTop: 12 }}>
                <input
                    placeholder="Suche nach Dateinamen"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="input"
                />
            </div>

            {Object.keys(moduleFiles).length === 0 ? (
                <p style={{ marginTop: 20 }}>Keine Dateien für {moduleParam} gefunden.</p>
            ) : (
                Object.entries(moduleFiles).map(([userEmail, files]) => (
                    <div key={userEmail} className="card" style={{ marginTop: 20 }}>
                        <h3>👤 {userEmail}</h3>
                        <ul style={{ marginLeft: 20 }}>
                            {files.map((f) => (
                                <li key={f.key} style={{ marginBottom: 6 }}>
                                    <a
                                        href={`https://${s3Bucket}.s3.${region}.amazonaws.com/${f.key}`}
                                        target="_blank"
                                        className="text-blue-500 underline"
                                    >
                                        {f.filename}
                                    </a>{' '}
                                    <small>
                                        ({(f.size / 1024).toFixed(1)} KB •{' '}
                                        {f.lastModified
                                            ? new Date(f.lastModified).toLocaleString()
                                            : 'unbekannt'}
                                        )
                                    </small>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            )}
        </div>
    );
}
