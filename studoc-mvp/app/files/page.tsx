'use client';
import { useEffect, useState } from 'react';

type FileEntry = {
    filename: string;
    key: string;
    size: number;
    lastModified?: string;
};

type GroupData = Record<string, Record<string, FileEntry[]>>;

export default function FilesPage() {
    const [q, setQ] = useState('');
    const [groups, setGroups] = useState<GroupData>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await fetch('/api/files/list?q=' + encodeURIComponent(q));
            const data = await res.json();
            setGroups(data.groups || {});
            setLoading(false);
        })();
    }, [q]);

    if (loading) return <p>🔄 Lade Dateien...</p>;

    return (
        <div className="card">
            <h1>📁 Dateien nach Gruppen</h1>
            <input
                placeholder="Suche nach Dateinamen"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="input"
            />

            {Object.keys(groups).length === 0 ? (
                <p style={{ marginTop: 20 }}>Keine Dateien gefunden.</p>
            ) : (
                Object.entries(groups).map(([groupId, users]) => (
                    <div key={groupId} className="card" style={{ marginTop: 20 }}>
                        <h2>📂 Gruppe: {groupId}</h2>

                        {Object.entries(users).map(([userEmail, files]) => (
                            <div key={userEmail} style={{ marginLeft: 20, marginTop: 12 }}>
                                <h3>👤 {userEmail}</h3>
                                <ul style={{ marginLeft: 20 }}>
                                    {files.map((f) => (
                                        <li key={f.key} style={{ marginBottom: 6 }}>
                                            <a
                                                href={`https://${process.env.NEXT_PUBLIC_STUDOC_BUCKET || 'studoc-stodjo-30.10.2025'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${f.key}`}
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
                        ))}
                    </div>
                ))
            )}
        </div>
    );
}
