'use client';

import Link from 'next/link';

const MODULES = ['MSTW', 'BUSW', 'ASPR', 'CLDE', 'OOPR', 'DSAI'];

export default function FilesIndexPage() {
    return (
        <div className="card">
            <h1>📁 Module</h1>
            <p className="mt-2">Wähle ein Modul, um die Studienunterlagen zu sehen.</p>

            <div
                className="grid"
                style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 16,
                    marginTop: 16,
                }}
            >
                {MODULES.map((m) => (
                    <Link key={m} href={`/files/${m}`} className="card hover:opacity-90">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>📂</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>{m}</div>
                                <div style={{ fontSize: 12, opacity: 0.75 }}></div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
