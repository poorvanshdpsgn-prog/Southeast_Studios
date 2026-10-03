const DB_NAME = 'botforge-studio';
const STORE_NAME = 'projects';
const LEGACY_KEY = 'botforge.projects.v1';
function makeId(prefix = 'id') { return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; }
export function newId(prefix) { return makeId(prefix); }
export function normalizeProject(project) {
  const now = new Date().toISOString();
  const normalized = { version: 1, id: project.id || makeId('project'), name: project.name || 'Untitled Game', description: project.description || project.pitch || '', type: project.type || project.genre || '2D Game', status: project.status || 'In progress', createdAt: project.createdAt || project.updated || now, updatedAt: project.updatedAt || project.updated || now, settings: { width: 960, height: 540, background: '#101922', grid: 32, ...(project.settings || {}) }, scenes: Array.isArray(project.scenes) && project.scenes.length ? project.scenes : [{ id: makeId('scene'), name: 'Main Scene', objects: [], events: [], variables: [] }], activeSceneId: project.activeSceneId || project.scenes?.[0]?.id || null, assets: Array.isArray(project.assets) ? project.assets : [], variables: Array.isArray(project.variables) ? project.variables : [] };
  normalized.scenes = normalized.scenes.map(s => ({ id: s.id || makeId('scene'), name: s.name || 'Scene', objects: (Array.isArray(s.objects) ? s.objects : []).map(o => ({ ...o, id: o.id || makeId('object'), name: o.name || o.type || 'Object', type: o.type || 'Sprite', x: o.x ?? 40, y: o.y ?? 40, width: o.width ?? 48, height: o.height ?? 48, rotation: o.rotation ?? 0, scale: o.scale ?? 1, visible: o.visible ?? true, opacity: o.opacity ?? 1, layer: o.layer ?? 0, fill: o.fill || '#37d9ff', behaviors: Array.isArray(o.behaviors) ? o.behaviors : [], variables: Array.isArray(o.variables) ? o.variables : [] })), events: (Array.isArray(s.events) ? s.events : []).map(e => ({ ...e, id: e.id || makeId('event'), name: e.name || 'Event', when: e.when || 'collision', actions: Array.isArray(e.actions) ? e.actions : [] })), variables: Array.isArray(s.variables) ? s.variables : [] }));
  if (!normalized.scenes.some(s => s.id === normalized.activeSceneId)) normalized.activeSceneId = normalized.scenes[0].id;
  return normalized;
}
let dbPromise;
function openDb() {
  if (!('indexedDB' in globalThis)) return Promise.resolve(null);
  if (!dbPromise) dbPromise = new Promise(resolve => { const req = indexedDB.open(DB_NAME, 1); req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE_NAME)) req.result.createObjectStore(STORE_NAME, { keyPath: 'id' }); }; req.onsuccess = () => resolve(req.result); req.onerror = req.onblocked = () => resolve(null); });
  return dbPromise;
}
async function transaction(mode, action) { const db = await openDb(); if (!db) return null; return new Promise(resolve => { try { const req = action(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)); req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(null); } catch { resolve(null); } }); }
function legacy() { try { return JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]'); } catch { return []; } }
export async function listProjects() { const records = await transaction('readonly', s => s.getAll()); const map = new Map((records || []).map(p => [p.id, p])); for (const old of legacy()) { const p = normalizeProject(old); if (!map.has(p.id)) { map.set(p.id, p); await saveProject(p); } } return [...map.values()].sort((a,b) => new Date(b.updatedAt)-new Date(a.updatedAt)); }
export async function getProject(id) { const p = await transaction('readonly', s => s.get(id)); return p ? normalizeProject(p) : (await listProjects()).find(x => x.id === id) || null; }
export async function saveProject(value) { const p = normalizeProject({...value, updatedAt:new Date().toISOString()}); const result = await transaction('readwrite', s => s.put(p)); if (result == null) { try { const all=legacy().filter(x=>x.id!==p.id); all.unshift(p); localStorage.setItem(LEGACY_KEY,JSON.stringify(all)); } catch(e) { throw new Error(`Could not save project in this browser: ${e.message}`); } } return p; }
export async function deleteProject(id) { await transaction('readwrite', s=>s.delete(id)); try { localStorage.setItem(LEGACY_KEY,JSON.stringify(legacy().filter(p=>p.id!==id))); } catch {} }
function refreshSceneIds(project) {
  const sceneIds = new Map(project.scenes.map(scene => [scene.id, makeId('scene')]));
  project.scenes = project.scenes.map(scene => ({
    ...scene,
    id: sceneIds.get(scene.id),
    objects: scene.objects.map(object => ({ ...object, id: makeId('object') })),
    events: scene.events.map(event => ({
      ...event,
      id: makeId('event'),
      actions: (event.actions || []).map(action => ({ ...action, sceneId: sceneIds.get(action.sceneId) || action.sceneId }))
    }))
  }));
  project.activeSceneId = project.scenes[0]?.id;
  return project;
}
export async function duplicateProject(id) {
  const source = await getProject(id);
  if (!source) return null;
  const copy = refreshSceneIds(structuredClone(source));
  copy.id = makeId('project');
  copy.name = `${source.name} Copy`;
  copy.createdAt = new Date().toISOString();
  return saveProject(copy);
}
export async function importProject(value) {
  const imported = normalizeProject({ ...value, id: makeId('project'), name: `${value.name || 'Imported Game'} (Imported)` });
  refreshSceneIds(imported);
  return saveProject(imported);
}
export function formatEdited(value) { const ms=Math.max(0,Date.now()-new Date(value||Date.now()).getTime());if(ms<60_000)return'Just now';if(ms<3_600_000)return`${Math.floor(ms/60_000)} min ago`;if(ms<86_400_000)return`${Math.floor(ms/3_600_000)} hr ago`;return new Date(value).toLocaleDateString(); }
