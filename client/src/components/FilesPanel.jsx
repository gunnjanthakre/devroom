import { useCallback, useEffect, useState } from 'react';
import api from '../api.js';
export default function FilesPanel({ room }) {
  const base = `/rooms/${room._id}`; const canEdit = room.role !== 'viewer';
  const [files, setFiles] = useState([]); const [nodes, setNodes] = useState([]); const [sel, setSel] = useState(null);
  const [versions, setVersions] = useState([]); const [form, setForm] = useState({ content: '', changeNote: '', nodeId: '' }); const [name, setName] = useState('');
  const load = useCallback(() => { api.get(`${base}/files`).then((r) => setFiles(r.data)); api.get(`${base}/canvas`).then((r) => setNodes(r.data.nodes)); }, [base]);
  useEffect(() => { load(); }, [load]);
  const open = async (f) => { const { data } = await api.get(`${base}/files/${f._id}`); setSel(data); setName(data.name);
    setForm({ content: data.content, changeNote: '', nodeId: data.links[0]?.nodeId || '' }); setVersions((await api.get(`${base}/files/${f._id}/versions`)).data); };
  const newFile = () => { setSel({ _id: null, name: '', currentVersion: 0 }); setName(''); setForm({ content: '', changeNote: '', nodeId: '' }); setVersions([]); };
  const upload = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setSel({ _id: null, currentVersion: 0 }); setName(f.name); setForm({ content: r.result, changeNote: '', nodeId: '' }); setVersions([]); }; r.readAsText(f); };
  const save = async () => {
    const body = { ...form, nodeId: form.nodeId || undefined };
    const { data } = sel._id ? await api.put(`${base}/files/${sel._id}`, body) : await api.post(`${base}/files`, { ...body, name });
    load(); open(data);
  };
  const restore = async (v) => { await api.post(`${base}/files/${sel._id}/versions/${v}/restore`); load(); open(sel); };
  return (<div className="panel split"><div><div className="row"><h2>Files</h2>{canEdit && <span><button onClick={newFile}>New</button> <label className="btn">Upload<input type="file" hidden onChange={upload} /></label></span>}</div>
    {files.map((f) => <div key={f._id} className="item" onClick={() => open(f)}><b>{f.name}</b><span className="muted">v{f.currentVersion}</span></div>)}{!files.length && <p className="muted">No files yet.</p>}</div>
    {sel && <div className="card"><input placeholder="File name" value={name} disabled={!!sel._id} onChange={(e) => setName(e.target.value)} />
      <textarea rows={14} value={form.content} readOnly={!canEdit} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      {canEdit && <><input placeholder="Change note (optional)" value={form.changeNote} onChange={(e) => setForm({ ...form, changeNote: e.target.value })} />
        <select value={form.nodeId} onChange={(e) => setForm({ ...form, nodeId: e.target.value })}><option value="">Link to canvas node…</option>{nodes.map((n) => <option key={n._id} value={n._id}>{n.label} ({n.type})</option>)}</select>
        <button onClick={save}>Save as new version</button></>}
      {versions.length > 0 && <><h4>Version history</h4>{versions.map((v) => <div key={v._id} className="item"><b>v{v.versionNumber}</b><span>{v.changeNote || '—'}</span><span className="muted">{v.author?.name}</span>
        {canEdit && <button className="ghost" onClick={() => restore(v.versionNumber)}>Restore</button>}</div>)}</>}</div>}</div>);
}
