
'use client';
import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [groupId, setGroupId] = useState('default');
  const [tags, setTags] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const meta = { filename: file.name, groupId, tags: tags.split(',').map(t=>t.trim()).filter(Boolean) };
    const presign = await fetch('/api/files/presign', { method:'POST', body: JSON.stringify(meta) });
    const data = await presign.json();

    await fetch(data.url, { method:'PUT', body:file, headers: {'Content-Type': file.type || 'application/octet-stream'} });
    await fetch('/api/files/record', { method:'POST', body: JSON.stringify({ ...meta, key: data.key, size:file.size, contentType:file.type }) });
    alert('Upload ok');
  };

  return (
    <div className="card">
      <h1>Upload</h1>
      <form onSubmit={onSubmit} className="grid">
        <div><label>Datei</label><input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} /></div>
        <div><label>Gruppen-ID</label><input value={groupId} onChange={e=>setGroupId(e.target.value)} /></div>
        <div><label>Tags (kommagetrennt)</label><input value={tags} onChange={e=>setTags(e.target.value)} /></div>
        <button>Hochladen</button>
      </form>
    </div>
  );
}
