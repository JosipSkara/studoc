'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type FileEntry = {
    filename: string;
    key: string;
    size: number;
    lastModified?: string;
    tags?: string | string[]; // kommt von deiner API
};

type GroupData = Record<string, Record<string, FileEntry[]>>;

const TAGS = ['Leistungsnachweis', 'Aufgabe', 'Zusammenfassung', 'Skript'] as const;

export default function ModuleFilesPage({ params }: { params: { module: string } }) {
    const moduleParam = (params.module || '').toUpperCase();

    const [selectedTag, setSelectedTag] = useState<string>(''); // '' = alle
    const [groups, setGroups] = useState<GroupData>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            // keine Textsuche mehr – komplette Liste laden
            const res = await fetch('/api/files/list');
            const data = await res.json();
            setGroups(data.groups || {});
            setLoading(false);
        })();
    }, []);

    const norm = (s: string) => s.trim().toLowerCase();
    const tagWanted = norm(selectedTag);

    const getTags = (f: FileEntry): string[] => {
        if (!f.tags) return [];
        if (Array.isArray(f.tags)) return f.tags.map(t => norm(String(t))).filter(Boolean);
        return String(f.tags).split(',').map(t => norm(t)).filter(Boolean);
    };

    const moduleFiles = useMemo(() => {
        const forModule = groups[moduleParam] || {};
        if (!tagWanted) return forModule; // kein Filter -> alle zeigen

        const filtered: Record<string, FileEntry[]> = {};
        for (const [user, files] of Object.entries(forModule)) {
            const keep = files.filter(f => getTags(f).includes(tagWanted));
            if (keep.length) filtered[user] = keep;
        }
        return filtered;
    }, [groups, moduleParam, tagWanted]);

    if (loading) return <p>🔄 Lade Dateien…</p>;

    const s3Bucket = process.env.NEXT_PUBLIC_STUDOC_BUCKET || 'studoc-stodjo-30.10.2025';
    const region = process.env.AWS_REGION || 'us-east-1';

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link href="/files" className="text-blue-500 underline">⟵ Zur Modulübersicht</Link>
                <h1 style={{ margin: 0 }}>📂 {moduleParam}</h1>
            </div>

            {/* Tag-Dropdown */}
            <div style={{ marginTop: 12 }}>
                <label>Suche nach Tags</label><br />
                <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="input"
                >
                    <option value="">Alle Tags</option>
                    {TAGS.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            {Object.keys(moduleFiles).length === 0 ? (
                <p style={{ marginTop: 20 }}>Keine Dateien für {moduleParam} gefunden.</p>
            ) : (
                Object.entries(moduleFiles).map(([userEmail, files]) => (
                    <div key={userEmail} className="card" style={{ marginTop: 20 }}>
                        <h3>👤 {userEmail}</h3>
                        <ul style={{ marginLeft: 20 }}>
                            {files.map((f) => {
                                const tags = getTags(f);
                                return (
                                    <li key={f.key} style={{ marginBottom: 6 }}>
                                        <a
                                            href={`https://${s3Bucket}.s3.${region}.amazonaws.com/${f.key}`}
                                            target="_blank"
                                            className="text-blue-500 underline"
                                        >
                                            {f.filename}
                                        </a>{' '}
                                        <small>
                                            ({(f.size / 1024).toFixed(1)} KB • {f.lastModified ? new Date(f.lastModified).toLocaleString() : 'unbekannt'})
                                            {tags.length > 0 && <> • Tags: {tags.join(', ')}</>}
                                        </small>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))
            )}
        </div>
    );
}
