import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, Handle, Position, ViewportPortal,
  addEdge, applyNodeChanges, applyEdgeChanges, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const TEMPLATES = [
  { type: 'frontend', label: 'Frontend', color: '#3b82f6', icon: '🖥' }, { type: 'backend', label: 'Backend', color: '#10b981', icon: '⚙' },
  { type: 'service', label: 'Service', color: '#8b5cf6', icon: '🧩' }, { type: 'database', label: 'Database', color: '#f97316', icon: '🗄' },
  { type: 'cache', label: 'Cache', color: '#ef4444', icon: '⚡' }, { type: 'queue', label: 'Queue', color: '#14b8a6', icon: '📨' },
  { type: 'gateway', label: 'Gateway', color: '#6366f1', icon: '🚪' }, { type: 'jwt', label: 'JWT Generator', color: '#eab308', icon: '🔑' },
  { type: 'note', label: 'Note', color: '#fde68a', icon: '📝' },
];
const T = Object.fromEntries(TEMPLATES.map((t) => [t.type, t]));
const sourceSides = ['right', 'bottom'];
const targetSides = ['left', 'top'];
const Handles = () => (<>
  {targetSides.map((p) => <Handle key={`target-${p}`} id={p} type="target" position={Position[p[0].toUpperCase() + p.slice(1)]} style={{ background: '#fff', borderColor: '#475569' }} />)}
  {sourceSides.map((p) => <Handle key={`source-${p}`} id={p} type="source" position={Position[p[0].toUpperCase() + p.slice(1)]} style={{ background: '#fff', borderColor: '#475569' }} />)}
</>);

function ArchNode({ data }) {
  const t = T[data.kind];
  return (<div className="anode" style={{ borderColor: t.color, background: t.color + '22' }}><Handles /><span>{t.icon}</span><div>{data.label}</div><small>{t.label}</small></div>);
}
function NoteNode({ id, data }) {
  return (<div className="note"><Handles /><textarea className="nodrag" value={data.text} readOnly={data.readOnly} onChange={(e) => data.onText(id, e.target.value)} placeholder="Note…" /></div>);
}
const nodeTypes = { arch: ArchNode, note: NoteNode };

const fromNode = (d) => ({ id: d._id, type: 'arch', position: d.position, data: { kind: d.type, label: d.label } });
const fromEdge = (d) => ({ id: d._id, source: d.source, target: d.target });
const fromNote = (d) => ({ id: d._id, type: 'note', position: d.position, data: { text: d.text } });
const isTmp = (id) => String(id).startsWith('tmp_');

function Canvas({ room, socket, online }) {
  const { user } = useAuth(); const canEdit = room.role !== 'viewer'; const rf = useReactFlow();
  const [nodes, setNodes] = useState([]); const [edges, setEdges] = useState([]); const [cursors, setCursors] = useState({});
  const [saving, setSaving] = useState(false); const wrap = useRef(null); const last = useRef(0);

  const onText = useCallback((id, text) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, text } } : n))), []);
  const withNote = useCallback((n) => (n.type === 'note' ? { ...n, data: { ...n.data, readOnly: !canEdit, onText } } : n), [canEdit, onText]);
  const apply = useCallback((c) => { setNodes([...c.nodes.map(fromNode), ...c.notes.map(fromNote)].map(withNote)); setEdges(c.edges.map(fromEdge)); }, [withNote]);
  const refetch = useCallback(() => api.get(`/rooms/${room._id}/canvas`).then((r) => apply(r.data)), [room._id, apply]);
  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {   // remote events
    const pos = (id, position) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, position } : n)));
    const h = {
      'node-drag': ({ id, position }) => pos(id, position), 'note-drag': ({ id, position }) => pos(id, position),
      'node-created': (d) => setNodes((ns) => (ns.some((n) => n.id === d._id) ? ns : [...ns, fromNode(d)])),
      'node-deleted': ({ id }) => { setNodes((ns) => ns.filter((n) => n.id !== id)); setEdges((es) => es.filter((e) => e.source !== id && e.target !== id)); },
      'edge-created': (d) => setEdges((es) => (es.some((e) => e.id === d._id) ? es : [...es, fromEdge(d)])),
      'edge-deleted': ({ id }) => setEdges((es) => es.filter((e) => e.id !== id)),
      'canvas-updated': refetch,
      'cursor-move': (c) => setCursors((p) => ({ ...p, [c.userId]: c })),
    };
    Object.entries(h).forEach(([k, f]) => socket.on(k, f)); return () => Object.entries(h).forEach(([k, f]) => socket.off(k, f));
  }, [socket, refetch]);
  useEffect(() => setCursors((p) => Object.fromEntries(Object.entries(p).filter(([id]) => online.some((u) => u.userId === id)))), [online]);

  const add = async (tpl) => {   // optimistic add, then persist and swap the temp id
    const b = wrap.current.getBoundingClientRect();
    const position = rf.screenToFlowPosition({ x: b.left + b.width / 2 + Math.random() * 60, y: b.top + b.height / 2 + Math.random() * 60 });
    const tmp = 'tmp_' + Math.random().toString(36).slice(2);
    if (tpl.type === 'note') return setNodes((ns) => [...ns, withNote({ id: tmp, type: 'note', position, data: { text: '' } })]);   // notes persist on Save
    setNodes((ns) => [...ns, { id: tmp, type: 'arch', position, data: { kind: tpl.type, label: tpl.label } }]);
    try {
      const { data } = await api.post(`/rooms/${room._id}/nodes`, { type: tpl.type, label: tpl.label, position });
      setNodes((ns) => ns.map((n) => (n.id === tmp ? { ...n, id: data._id } : n)));
    } catch { setNodes((ns) => ns.filter((n) => n.id !== tmp)); }   // revert on REST failure
  };
  const onConnect = async (c) => {
    const tmp = 'tmp_' + Math.random().toString(36).slice(2); setEdges((es) => addEdge({ ...c, id: tmp }, es));
    if (isTmp(c.source) || isTmp(c.target)) return;                 // persisted by Save
    try { const { data } = await api.post(`/rooms/${room._id}/edges`, { source: c.source, target: c.target }); setEdges((es) => es.map((e) => (e.id === tmp ? { ...e, id: data._id } : e))); }
    catch { setEdges((es) => es.filter((e) => e.id !== tmp)); }
  };
  const onNodesDelete = (ds) => ds.forEach((n) => n.type === 'arch' && !isTmp(n.id) && api.delete(`/rooms/${room._id}/nodes/${n.id}`));
  const onEdgesDelete = (ds) => ds.forEach((e) => !isTmp(e.id) && api.delete(`/rooms/${room._id}/edges/${e.id}`).catch(() => {}));
  const drag = (_, n) => socket.emit(n.type === 'note' ? 'note-drag' : 'node-drag', { id: n.id, position: n.position });
  const move = (e) => { const now = Date.now(); if (now - last.current < 30) return; last.current = now;
    const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }); socket.emit('cursor-move', p); };
  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/rooms/${room._id}/canvas`, {
        nodes: nodes.filter((n) => n.type === 'arch').map((n) => ({ id: n.id, type: n.data.kind, label: n.data.label, position: n.position })),
        edges: edges.map((e) => ({ source: e.source, target: e.target })),
        notes: nodes.filter((n) => n.type === 'note').map((n) => ({ text: n.data.text, position: n.position })) });
      apply(data);
    } finally { setSaving(false); }
  };
  const rename = (_, n) => { if (!canEdit || n.type !== 'arch') return; const l = prompt('Label', n.data.label); if (l) setNodes((ns) => ns.map((x) => (x.id === n.id ? { ...x, data: { ...x.data, label: l } } : x))); };

  return (<div className="canvas-wrap">
    <aside className="palette"><h4>Components</h4>{TEMPLATES.map((t) => <button key={t.type} disabled={!canEdit} onClick={() => add(t)} style={{ borderLeft: `4px solid ${t.color}` }}>{t.icon} {t.label}</button>)}
      <button className="primary" disabled={!canEdit || saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button>{!canEdit && <small className="muted">Viewer: read-only</small>}</aside>
    <div className="flow" ref={wrap} onMouseMove={move}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView deleteKeyCode={canEdit ? ['Backspace', 'Delete'] : null}
        nodesDraggable={canEdit} nodesConnectable={canEdit} onNodesChange={(c) => setNodes((ns) => applyNodeChanges(c, ns))}
        onEdgesChange={(c) => setEdges((es) => applyEdgeChanges(c, es))} onConnect={onConnect} onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete} onNodeDrag={drag} onNodeDoubleClick={rename}>
        <Background /><Controls /><MiniMap />
        <ViewportPortal>{Object.values(cursors).filter((c) => c.userId !== user.id).map((c) =>
          <div key={c.userId} className="cursor" style={{ transform: `translate(${c.x}px, ${c.y}px)` }}>➤<span>{c.name}</span></div>)}</ViewportPortal>
      </ReactFlow></div></div>);
}
export default function ReactFlowCanvas(props) { return <ReactFlowProvider><Canvas {...props} /></ReactFlowProvider>; }
