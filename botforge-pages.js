// BotForge project launcher and storage utilities
const KEY='botforge.projects.v1', ACT='botforge.activity.v1';

const read = k => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const write = (k,v) => localStorage.setItem(k, JSON.stringify(v))

// Ensure some sample templates exist
const templates = [
  {
    id: 'tpl-platformer',
    name: 'Platformer',
    desc: 'Simple platformer with player, platforms and coins',
    seed: {
      version:1,
      name:'Platformer Template',
      settings:{},
      scenes:[{id:'scene-1',name:'Level 1',objects:['player-1','platform-1','coin-1']}],
      objects:[
        {id:'player-1',name:'Player',type:'Player',x:80,y:200,width:48,height:48,rotation:0,visible:true,opacity:1,layer:1,vars:{health:100},behaviors:['Platformer Character','Gravity','Collision']},
        {id:'platform-1',name:'Ground',type:'Platform',x:0,y:300,width:640,height:40,rotation:0,visible:true,opacity:1,layer:0,vars:{},behaviors:[]},
        {id:'coin-1',name:'Coin',type:'Coin',x:260,y:250,width:24,height:24,rotation:0,visible:true,opacity:1,layer:1,vars:{value:10},behaviors:[]}
      ],
      assets:[],
      events:[
        {id:crypto.randomUUID?crypto.randomUUID():"e1",sceneId:'scene-1',when:{type:'collision',a:'Player',b:'Coin'},actions:[{type:'destroy',target:'b'},{type:'modifyVar',varScope:'global',varName:'score',mode:'add',value:10}]}
      ],
      variables:{global:{score:0},scene:{},object:{}}
    }
  }
]

// Create new project
function createProjectFromTemplate(t){
  const id = crypto.randomUUID?crypto.randomUUID():String(Date.now())
  const p = JSON.parse(JSON.stringify(t.seed))
  p.id = id
  p.name = t.name + ' - ' + (new Date()).toLocaleString()
  p.created = Date.now()
  p.updated = Date.now()
  const all = read(KEY)
  all.unshift(p)
  write(KEY, all)
  return p
}

// Expose for pages to use
window.BotForgeStorage = {
  KEY, read, write, templates, createProjectFromTemplate,
  listProjects:()=>read(KEY),
  saveProject:(proj)=>{
    const all = read(KEY)
    const idx = all.findIndex(x=>x.id===proj.id)
    proj.updated = Date.now()
    if(idx>=0) { all[idx]=proj } else { all.unshift(proj) }
    write(KEY, all)
  },
  deleteProject:(id)=>{
    const all = read(KEY).filter(p=>p.id!==id)
    write(KEY, all)
  },
  duplicateProject:(id)=>{
    const all = read(KEY)
    const src = all.find(p=>p.id===id)
    if(!src) return null
    const copy = JSON.parse(JSON.stringify(src))
    copy.id = crypto.randomUUID?crypto.randomUUID():String(Date.now())
    copy.name = src.name + ' (copy)'
    copy.created = Date.now()
    copy.updated = Date.now()
    all.unshift(copy)
    write(KEY, all)
    return copy
  },
  renameProject:(id,newName)=>{
    const all=read(KEY)
    const p=all.find(x=>x.id===id); if(!p) return null; p.name=newName; p.updated=Date.now(); write(KEY,all); return p
  }
}

// UI bindings for existing pages
function renderWorkspace(){
  const list=document.querySelector('#workspaceProjects'); if(!list) return;
  const p=read(KEY);
  list.innerHTML = p.length ? p.map(x=>{
    const last = x.updated?new Date(x.updated).toLocaleString():'-'
    return `
      <div class="project-card">
        <div class="card-left">
          <div class="proj-icon">⚡</div>
        </div>
        <div class="card-body">
          <div class="proj-name">${x.name}</div>
          <div class="proj-meta">${x.scenes?.length||0} scenes • Edited ${last}</div>
        </div>
        <div class="card-actions">
          <a class="btn open" href="../botforge/editor/editor.html?id=${x.id}">OPEN</a>
          <button class="btn menu" data-id="${x.id}">•••</button>
        </div>
      </div>`
  }).join('\n') : '<div class="empty">No projects yet — create one.</div>';

  // attach menu handlers
  list.querySelectorAll('.menu').forEach(btn=>{
    btn.addEventListener('click',e=>{
      const id=btn.dataset.id; showProjectMenu(id,btn)
    })
  })
}

function showProjectMenu(id,btn){
  const menu = document.createElement('div'); menu.className='proj-menu';
  menu.innerHTML = `
    <button data-action="open">Open</button>
    <button data-action="duplicate">Duplicate</button>
    <button data-action="rename">Rename</button>
    <button data-action="delete">Delete</button>
  `
  document.body.appendChild(menu)
  const rect = btn.getBoundingClientRect(); menu.style.top = (rect.bottom+4)+'px'; menu.style.left=(rect.left)+'px';
  menu.addEventListener('click',e=>{
    const a=e.target.getAttribute('data-action')
    if(a==='open') window.location.href = `../botforge/editor/editor.html?id=${id}`
    if(a==='duplicate'){ const c=window.BotForgeStorage.duplicateProject(id); if(c) window.location.href=`../botforge/editor/editor.html?id=${c.id}` }
    if(a==='rename'){ const nm=prompt('New project name'); if(nm) { window.BotForgeStorage.renameProject(id,nm); renderWorkspace(); }}
    if(a==='delete'){ if(confirm('Delete project?')){ window.BotForgeStorage.deleteProject(id); renderWorkspace(); }}
    menu.remove()
  })
  const closeFn=()=>{ menu.remove(); document.removeEventListener('click',closeFn)}
  setTimeout(()=>document.addEventListener('click',closeFn),10)
}

// Render project library on other pages
const projectPage=document.querySelector('#projectLibrary'); if(projectPage){
  const projects=read(KEY);
  projectPage.innerHTML = projects.length ? projects.map(x=>`<article class="panel"><h3>${x.name}</h3><p>${x.scenes?.length||0} scenes • Edited ${x.updated?new Date(x.updated).toLocaleString():'-'}</p><p><a href="../botforge/editor/editor.html?id=${x.id}">Open</a></p></article>`).join('\n') : '<p>No projects</p>'
}

// Hook create new game form if present
const form=document.querySelector('#newGameForm');
if(form){
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const name = document.querySelector('#gameName').value || 'Untitled';
    const id = crypto.randomUUID?crypto.randomUUID():String(Date.now())
    const proj = {version:1,id,name,settings:{},scenes:[],objects:[],assets:[],events:[],variables:{global:{score:0},scene:{},object:{}},created:Date.now(),updated:Date.now()}
    const all=read(KEY); all.unshift(proj); write(KEY,all);
    window.location.href = `../botforge/editor/editor.html?id=${proj.id}`
  })
}

// Init render
document.addEventListener('DOMContentLoaded',()=>{
  renderWorkspace()
})
