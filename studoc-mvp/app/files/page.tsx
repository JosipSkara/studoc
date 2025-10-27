
'use client';
import { useEffect, useState } from 'react';

type FileItem = { fileId:string; filename:string; groupId:string; tags:string[]; key:string; size:number };

export default function FilesPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);

  useEffect(()=>{ (async ()=>{
    const res = await fetch('/api/files/list?q=' + encodeURIComponent(q));
    const data = await res.json();
    setItems(data.items || []);
  })(); }, [q]);

  return (
    <div className="card">
      <h1>Files</h1>
      <input placeholder="Suche (Dateiname, Tag)" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="grid" style={{marginTop:12}}>
        {items.map(it => (
          <div className="card" key={it.fileId}>
            <b>{it.filename}</b>
            <div className="row"><span className="tag">Gruppe: {it.groupId}</span><span className="tag">{Math.round(it.size/1024)} KB</span></div>
            <div className="row" style={{marginTop:8, gap:8}}>{it.tags?.map(t => <span className="tag" key={t}>{t}</span>)}</div>
            <form action={`/api/files/download?key=${encodeURIComponent(it.key)}`} method="get" style={{marginTop:8}}>
              <button>Download</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
