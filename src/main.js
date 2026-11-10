// TaskBoard: team task planning (Board, Grid, Calendar, Timeline, Charts, Admin console)
"use strict";
import { configured, isProd, auth, api } from "./backend.js";
import { AR, PAT } from "./i18n.js";
/* ---------- constants ---------- */
const PROG=[{k:"notstarted",n:"Not started"},{k:"inprogress",n:"In progress"},{k:"completed",n:"Completed"}];
const PRI=[{k:"urgent",n:"Urgent"},{k:"important",n:"Important"},{k:"medium",n:"Medium"},{k:"low",n:"Low"}];
const PRI_RANK={urgent:0,important:1,medium:2,low:3};
const LABEL_COLORS=["#c2366b","#c53030","#c05621","#a8770f","#2f855a","#0f7c80","#2b6cb0","#6b46c1","#8a5a3c","#5a6672"];
const DEFAULT_LABELS=["Critical","Blocked","Client","Finance","HSE","Contracts","Engineering","Procurement","Reporting","Admin"];
const PLAN_COLORS=["#0d6b70","#2b6cb0","#6b46c1","#c05621","#2f855a","#c2366b","#a8770f","#5a6672"];
const STATUS_COL={notstarted:"#9aa7b0",inprogress:"#2a64a8",late:"#c0392f",completed:"#2c7a4f"};
const TEMPLATES=[
  {k:"blank",n:"Blank plan",d:"One “To do” bucket",b:["To do"]},
  {k:"kanban",n:"Simple workflow",d:"To do · Doing · Review · Done",b:["To do","Doing","Review","Done"]},
  {k:"project",n:"Project lifecycle",d:"Initiation to closeout",b:["Initiation","Planning","Execution","Monitoring & control","Closeout"]},
  {k:"followup",n:"Follow-up office",d:"Actions tracked by stage",b:["New actions","With project team","Awaiting response","Escalated","Closed"]}
];
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ICON={
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  my:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  admin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  board:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  sched:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  tl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h9M8 12h10M6 18h8"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 7 2 2 3-3M4 15l2 2 3-3M13 8h7M13 16h7"/></svg>',
  notes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  dl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m-5-5 5 5 5-5M4 20h16"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  urgent:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6.5v7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17" r="1.5" fill="#fff"/></svg>',
  important:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 4v10"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/></svg>',
  low:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-6-6 6 6 6-6"/></svg>',
  medium:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>'
};

/* ---------- state ---------- */
const S={
  myId:null,myEmail:"",myProfile:null,role:null,isOwner:false,isAdmin:false,canWrite:false,
  plans:[],tasks:[],people:[],
  loaded:{plans:false,tasks:false,people:false},stale:false,offline:!navigator.onLine,fatal:"",ready:false,
  route:{page:"home",planId:null},
  view:{tab:"board",groupBy:"bucket",filter:{},sort:{key:"due",dir:1},month:null,tlStart:null,adminTab:"overview",myGroup:"due"},
  adding:null,addText:"",openDone:{},
  modal:null, comments:[], commentUnsub:null,
  authView:"signin", authMsg:null, authEmail:"", installEvt:null
};
/* ---------- language (English / Arabic) ---------- */
let LANG="en";
try{LANG=localStorage.getItem("tb-lang")||((navigator.language||"").toLowerCase().startsWith("ar")?"ar":"en")}catch(e){}

function tr(s){
  if(LANG!=="ar"||s==null)return s;
  const str=String(s);const t=str.trim();if(!t)return str;
  let out=AR[t];
  if(out===undefined){for(const [re,fn] of PAT){const m=t.match(re);if(m){out=fn(m);break}}}
  if(out===undefined)return str;
  const lead=str.match(/^\s*/)[0],trail=str.match(/\s*$/)[0];
  return lead+out+trail;
}
function LOC(){return LANG==="ar"?"ar-OM-u-nu-latn":"en-GB"}
const SKIP_SEL='[dir="auto"],[data-nt],script,style,textarea';
function translateTree(root){
  if(LANG!=="ar"||!root)return;
  if(root.nodeType===3){const p=root.parentElement;if(p&&!p.closest(SKIP_SEL)){const v=tr(root.nodeValue);if(v!==root.nodeValue)root.nodeValue=v}return}
  if(root.nodeType!==1)return;
  const els=[root,...root.querySelectorAll("*")];
  for(const el of els){
    const skip=el.closest(SKIP_SEL);
    for(const a of ["placeholder","title","aria-label"]){if(el.hasAttribute(a)){const v=el.getAttribute(a);if(skip&&a==="title")continue;const n=tr(v);if(n!==v)el.setAttribute(a,n)}}
    if(skip)continue;
    for(const n of el.childNodes){if(n.nodeType===3){const v=tr(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}}
  }
}
new MutationObserver(ms=>{if(LANG!=="ar")return;for(const m of ms)for(const n of m.addedNodes)translateTree(n)}).observe(document.body,{childList:true,subtree:true});
function applyLang(){document.documentElement.lang=LANG;document.documentElement.dir=LANG==="ar"?"rtl":"ltr"}
function setLang(l){LANG=l;try{localStorage.setItem("tb-lang",l)}catch(e){}applyLang();render();if(S.modal)renderModal()}
applyLang();

/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function parseYmd(s){const [y,m,d]=String(s).split("-").map(Number);return new Date(y,(m||1)-1,d||1)}
function today(){return ymd(new Date())}
function addDays(s,n){const d=parseYmd(s);d.setDate(d.getDate()+n);return ymd(d)}
function diffDays(a,b){return Math.round((parseYmd(b)-parseYmd(a))/86400000)}
function fmtDate(s,long){if(!s)return "";const d=parseYmd(s);const o={day:"numeric",month:"short"};if(long||d.getFullYear()!==new Date().getFullYear())o.year="numeric";return d.toLocaleDateString(LOC(),o)}
function fmtTime(iso){if(!iso)return "";const d=new Date(iso);return d.toLocaleDateString(LOC(),{day:"numeric",month:"short"})+" "+d.toLocaleTimeString(LOC(),{hour:"2-digit",minute:"2-digit"})}
function endOfWeek(s){const d=parseYmd(s);return addDays(s,6-d.getDay())}
function isLate(t){return !!t.due&&t.progress!=="completed"&&t.due<today()}
function statusOf(t){return t.progress==="completed"?"completed":isLate(t)?"late":t.progress==="inprogress"?"inprogress":"notstarted"}
function dueBucket(t){
  if(!t.due)return "none";const T=today();
  if(t.due<T)return "late";if(t.due===T)return "today";if(t.due===addDays(T,1))return "tomorrow";
  const ew=endOfWeek(T);if(t.due<=ew)return "thisweek";if(t.due<=addDays(ew,7))return "nextweek";return "future";
}
const DUE=[{k:"late",n:"Late"},{k:"today",n:"Today"},{k:"tomorrow",n:"Tomorrow"},{k:"thisweek",n:"This week"},{k:"nextweek",n:"Next week"},{k:"future",n:"Later"},{k:"none",n:"No date"}];
function personOf(id){return S.people.find(x=>x.id===id)}
function nameOf(id){const p=personOf(id);if(p&&p.name)return p.name;if(id&&id===S.myId)return (S.myProfile&&S.myProfile.name)||tr("You");return tr("Someone")}
function emailOf(id){const p=personOf(id);return p&&p.email?p.email:""}
function initials(n){return (n||"?").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()}
function avatarSrc(id){
  const n=nameOf(id);const AV_COLORS=["#2b6cb0","#c05621","#6b46c1","#2f855a","#c2366b","#0f7c80","#a8770f","#5a6672"];
  let hsh=0;for(const ch of String(id||""))hsh=(hsh*31+ch.charCodeAt(0))|0;const c=AV_COLORS[Math.abs(hsh)%AV_COLORS.length];
  return "data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="'+c+'"/><text x="20" y="25" font-size="15" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">'+esc(initials(n))+'</text></svg>');
}
function av(id,cls){return '<img class="av '+(cls||"")+'" src="'+esc(avatarSrc(id))+'" alt="" title="'+esc(nameOf(id))+'">'}
function avStack(ids,max){max=max||3;ids=ids||[];if(!ids.length)return "";return '<div class="avs">'+ids.slice(0,max).map(i=>av(i,"sm")).join("")+(ids.length>max?'<span class="more">+'+(ids.length-max)+'</span>':"")+'</div>'}
function priHtml(k,withText){const p=PRI.find(x=>x.k===k)||PRI[2];if(k==="medium"&&!withText)return "";return '<span class="pri '+p.k+'" title="'+p.n+' priority">'+ICON[p.k]+(withText?"<span>"+p.n+"</span>":"")+'</span>'}
function labelOf(plan,id){return (plan&&plan.labels||[]).find(l=>l.id===id)}
function lblHtml(plan,id,bar){const l=labelOf(plan,id);if(!l)return "";return bar?'<span class="lbl bar" style="background:'+esc(l.color)+'" title="'+esc(l.name)+'"></span>':'<span class="lbl" style="background:'+esc(l.color)+'" dir="auto">'+esc(l.name||"Label")+'</span>'}
function uid(){return Math.random().toString(36).slice(2,10)}
function planById(id){return S.plans.find(p=>p.id===id)}
function taskById(id){return S.tasks.find(t=>t.id===id)}
function tasksOf(planId){return S.tasks.filter(t=>t.planId===planId)}
function visiblePlans(){const l=S.isAdmin?S.plans:S.plans.filter(p=>(p.members||[]).includes(S.myId));return l.slice().sort((a,b)=>(a.name||"").localeCompare(b.name||""))}
function canSeePlan(p){return !!p&&(S.isAdmin||(p.members||[]).includes(S.myId))}
function taskCode(t){const p=planById(t.planId);const pre=((p&&p.code)||"TSK");return pre+"-"+(t.num||"")}
function clone(o){return JSON.parse(JSON.stringify(o==null?null:o))}
function toast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;$("#toast").appendChild(el);setTimeout(()=>el.remove(),3800)}
function canDeleteTask(t){return S.canWrite&&(S.isAdmin||t.createdBy===S.myId)}

/* ---------- writes: optimistic, one at a time per record ---------- */
const queues=new Map();
function enqueue(key,fn){const prev=queues.get(key)||Promise.resolve();const p=prev.catch(()=>{}).then(fn);queues.set(key,p);return p}
async function run(key,op){
  return enqueue(key,async()=>{
    try{return await op()}
    catch(e){
      if(e&&e.kind==="network"){await sleep(400+Math.random()*600);try{return await op()}catch(e2){e=e2}}
      writeError(e);throw e;
    }
  });
}
function writeError(e){
  if(e&&e.kind==="permission")toast("That change wasn't saved because your role doesn't allow it.");
  else if(e&&e.kind==="network")toast("Couldn't save the change. Check your connection and try again.");
  else toast((e&&e.message)?("Couldn't save: "+e.message):"Couldn't save the change. Check your connection and try again.");
  scheduleReload();
}
function logEntry(text){return {at:new Date().toISOString(),by:S.myId,text}}
function patchLocalTask(id,patch){const i=S.tasks.findIndex(t=>t.id===id);if(i>=0){S.tasks[i]=Object.assign({},S.tasks[i],patch);changed()}}
async function updateTask(id,patch,logText){
  const t=taskById(id);if(!t)return;
  const body=Object.assign({},patch);
  if(logText){const a=(t.activity||[]).slice(-39);a.push(logEntry(logText));body.activity=a}
  patchLocalTask(id,Object.assign({},body,{updatedAt:new Date().toISOString(),updatedBy:S.myId}));
  return run("task:"+id,()=>api.updateTask(id,body)).catch(()=>{});
}
async function createTask(planId,data){
  const plan=planById(planId);if(!plan)return null;
  const inPlan=tasksOf(planId);
  const bucketId=data.bucketId||(plan.buckets[0]||{}).id||"";
  const minOrder=inPlan.filter(t=>t.bucketId===bucketId).reduce((m,t)=>Math.min(m,t.order==null?0:t.order),1000);
  const t=Object.assign({planId,bucketId,title:"Untitled task",notes:"",assignees:[],priority:"medium",progress:"notstarted",start:"",due:"",labels:[],checklist:[],showChecklist:false,links:[],order:minOrder-1000,completedAt:"",completedBy:"",activity:[logEntry("created the task")]},data,{bucketId});
  try{
    const row=await run("plan-new-task:"+planId,()=>api.createTask(t));
    if(row&&!taskById(row.id)){S.tasks.push(row);changed()}
    return row&&row.id;
  }catch(e){return null}
}
function setProgressPatch(t,progress){
  const p={progress};
  if(progress==="completed"){p.completedAt=new Date().toISOString();p.completedBy=S.myId}else{p.completedAt="";p.completedBy=""}
  return p;
}
async function toggleComplete(id){
  const t=taskById(id);if(!t||!S.canWrite)return;
  const next=t.progress==="completed"?"notstarted":"completed";
  await updateTask(id,setProgressPatch(t,next),next==="completed"?"completed the task":"reopened the task");
}
async function deleteTask(id){
  const t=taskById(id);if(!t)return;
  try{await run("task:"+id,()=>api.deleteTask(id))}catch(e){return}
  S.tasks=S.tasks.filter(x=>x.id!==id);changed();
  toast("Task deleted");
}
async function updatePlan(id,patch){
  const i=S.plans.findIndex(p=>p.id===id);
  if(i>=0){S.plans[i]=Object.assign({},S.plans[i],patch);changed()}
  return run("plan:"+id,()=>api.updatePlan(id,patch));
}

/* ---------- loading & live updates ---------- */
let reloadTimer=null;
function scheduleReload(what){clearTimeout(reloadTimer);reloadTimer=setTimeout(()=>loadAll(what),350)}
async function loadAll(){
  if(!S.myId)return;
  try{
    const [me,profiles,plans,tasks]=await Promise.all([api.myProfile(S.myId),api.loadProfiles(),api.loadPlans(),api.loadTasks()]);
    S.myProfile=me;S.people=profiles;S.plans=plans;S.tasks=tasks;
    S.loaded={plans:true,tasks:true,people:true};S.stale=false;
    computeRole();changed();
  }catch(e){
    S.stale=true;S.loaded.plans=S.loaded.tasks=true;changed();
  }
}
function startLive(){
  if(S.liveOff)S.liveOff();
  S.liveOff=api.subscribe({
    task:(evt,obj)=>{
      if(evt==="delete"){S.tasks=S.tasks.filter(t=>t.id!==obj)}
      else{const i=S.tasks.findIndex(t=>t.id===obj.id);if(i>=0)S.tasks[i]=obj;else S.tasks.push(obj)}
      changed();
    },
    plans:()=>scheduleReload(),
    profiles:()=>scheduleReload(),
    status:s=>{if(s==="SUBSCRIBED"&&S.wasLive)scheduleReload();if(s==="SUBSCRIBED")S.wasLive=true;S.live=s==="SUBSCRIBED";}
  });
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&S.myId&&S.ready)scheduleReload()});
window.addEventListener("online",()=>{S.offline=false;if(S.myId&&S.ready)scheduleReload();render()});
window.addEventListener("offline",()=>{S.offline=true;render()});

/* ---------- rendering pipeline ---------- */
let rq=false;
function changed(){if(rq)return;rq=true;requestAnimationFrame(()=>{rq=false;render();renderModalIfIdle()})}
function withFocus(fn){
  const a=document.activeElement;const id=a&&a.id;let s=null,e=null;
  try{s=a.selectionStart;e=a.selectionEnd}catch(x){}
  const scrolls=[...document.querySelectorAll("[data-keep-scroll]")].map(el=>[el.dataset.keepScroll,el.scrollLeft,el.scrollTop]);
  fn();
  scrolls.forEach(([k,l,t])=>{const el=document.querySelector('[data-keep-scroll="'+k+'"]');if(el){el.scrollLeft=l;el.scrollTop=t}});
  if(id){const n=document.getElementById(id);if(n&&n!==document.activeElement){n.focus();try{if(s!=null)n.setSelectionRange(s,e)}catch(x){}}}
}
function render(){withFocus(()=>{renderRail();renderMain()})}

function renderRail(){
  const r=S.route;const plans=visiblePlans();
  const myOpen=S.tasks.filter(t=>(t.assignees||[]).includes(S.myId)&&t.progress!=="completed"&&canSeePlan(planById(t.planId))).length;
  if(!S.myId){$("#rail").innerHTML="";return}
  const role=S.isOwner?'<span class="role admin">Owner</span>':S.isAdmin?'<span class="role admin">Admin</span>':S.canWrite?'<span class="role member">Member</span>':S.role==="viewer"?'<span class="role viewer">View only</span>':S.role==="pending"?'<span class="role viewer">Pending approval</span>':'<span class="role viewer">No access</span>';
  const gated=S.role==="pending"||S.role==="disabled"||!S.myProfile;
  const pendingN=S.isAdmin?S.people.filter(p=>p.role==="pending").length:0;
  $("#rail").innerHTML=
    '<div class="brand"><div class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h6M4 12h10M4 18h7"/><path d="m15 17 2 2 4-5"/></svg></div><div><div class="brand-name">TaskBoard</div><div class="brand-sub">Team planning</div></div></div>'+
    (gated?'<nav class="rail-scroll"></nav>':'<nav class="rail-scroll">'+
      '<a class="nav '+(r.page==="home"?"on":"")+'" href="#home">'+ICON.home+'<span class="t">Home</span></a>'+
      '<a class="nav '+(r.page==="my"?"on":"")+'" href="#my-tasks">'+ICON.my+'<span class="t">My tasks</span>'+(myOpen?'<span class="count num">'+myOpen+'</span>':"")+'</a>'+
      (S.isAdmin?'<a class="nav '+(r.page==="admin"?"on":"")+'" href="#admin">'+ICON.admin+'<span class="t">Admin console</span>'+(pendingN?'<span class="count num badge" title="Waiting for approval">'+pendingN+'</span>':"")+'</a>':"")+
      '<div class="rail-h"><span>Plans</span>'+(S.isAdmin&&S.canWrite?'<button data-act="new-plan" title="New plan" aria-label="New plan">+</button>':"")+'</div>'+
      (plans.length?plans.map(p=>{const open=tasksOf(p.id).filter(t=>t.progress!=="completed").length;return '<a class="nav '+(r.page==="plan"&&r.planId===p.id?"on":"")+'" href="#plan-'+esc(p.id)+'"><span class="dot" style="background:'+esc(p.color||PLAN_COLORS[0])+'"></span><span class="t" dir="auto">'+esc(p.name)+'</span><span class="count num">'+open+'</span></a>'}).join(""):'<div class="nav" style="color:var(--rail-muted);cursor:default">No plans yet</div>')+
    '</nav>')+
    (canOfferInstall()?'<button class="install-btn" data-act="install">'+ICON.dl+'<span>Install app</span></button>':"")+
    '<div class="me"><button class="me-btn" data-act="account" title="My account">'+av(S.myId,"lg")+'<div class="who"><div class="nm" dir="auto">'+esc(nameOf(S.myId))+'</div>'+role+'</div></button><button class="lang-btn" data-act="lang" data-nt title="'+(LANG==="ar"?"Switch to English":"التبديل إلى العربية")+'">'+(LANG==="ar"?"English":"عربي")+'</button></div>';
}

function renderMain(){
  const m=$("#main");
  if(!S.myId){m.innerHTML="";return}
  if(S.fatal){m.innerHTML='<div class="loading"><div><h2 style="margin-bottom:8px">Board unavailable</h2><div>'+esc(S.fatal)+'</div></div></div>';return}
  if(S.role==="pending"||S.role==="disabled"||(S.ready&&!S.myProfile)){
    const pend=S.role!=="disabled";
    m.innerHTML='<div class="loading"><div class="gate"><div class="gate-icon">'+(pend?ICON.cal:ICON.admin)+'</div><h2>'+(pend?"Waiting for approval":"Your access is turned off")+'</h2><p class="muted">'+(pend?"Your account is ready. An administrator needs to approve it before you can see plans. This page updates by itself once you're approved.":"An administrator has turned off your access to this board. Contact them if you think this is a mistake.")+'</p><div class="frow" style="justify-content:center"><button class="btn" data-act="sign-out">Sign out</button></div></div></div>';return;
  }
  if(!(S.loaded.plans&&S.loaded.tasks)&&!S.plans.length&&!S.tasks.length){
    m.innerHTML='<div class="loading"><div><div class="spinner"></div>'+(S.stale?"The board's data can't be reached yet. It will appear as soon as the connection recovers.":"Loading the board…")+'</div></div>';return;
  }
  let banner="";
  if(S.offline)banner='<div class="banner warn">You\'re offline. Changes can\'t be saved until the connection is back.</div>';
  else if(S.stale)banner='<div class="banner warn">The latest data couldn\'t be loaded. It may be out of date until the connection recovers.</div>';
  else if(!S.canWrite)banner='<div class="banner">You have view-only access. Ask an administrator if you need to update tasks.</div>';
  const r=S.route;
  if(r.page==="plan"){const p=planById(r.planId);if(!canSeePlan(p)){m.innerHTML=banner+'<div class="page"><div class="empty"><h3>This plan isn\'t available</h3>It may have been deleted, or you aren\'t a member of it.<br><br><a class="btn" href="#home">Back to Home</a></div></div>';return}
    m.innerHTML=banner+renderPlan(p);afterPlanRender(p);return}
  if(r.page==="my"){m.innerHTML=banner+'<div class="page">'+renderMy()+'</div>';return}
  if(r.page==="admin"&&S.isAdmin){m.innerHTML=banner+'<div class="page">'+renderAdmin()+'</div>';return}
  m.innerHTML=banner+'<div class="page">'+renderHome()+'</div>';
}

/* ---------- home ---------- */
function planStats(pid){
  const ts=tasksOf(pid);const c={total:ts.length,notstarted:0,inprogress:0,late:0,completed:0};
  ts.forEach(t=>c[statusOf(t)]++);c.pct=c.total?Math.round(c.completed/c.total*100):0;return c;
}
function statusBar(c){
  if(!c.total)return '<div class="pbar"></div>';
  return '<div class="pbar" role="img" aria-label="'+c.completed+' completed, '+c.inprogress+' in progress, '+c.late+' late, '+c.notstarted+' not started">'+["completed","inprogress","late","notstarted"].map(k=>c[k]?'<i style="width:'+(c[k]/c.total*100)+'%;background:'+STATUS_COL[k]+'"></i>':"").join("")+'</div>';
}
function renderHome(){
  const plans=visiblePlans();
  const mine=S.tasks.filter(t=>(t.assignees||[]).includes(S.myId)&&canSeePlan(planById(t.planId)));
  const open=mine.filter(t=>t.progress!=="completed");
  const late=open.filter(isLate).length;
  const dueWeek=open.filter(t=>t.due&&t.due>=today()&&t.due<=endOfWeek(today())).length;
  const doneMine=mine.filter(t=>t.progress==="completed").length;
  const hr=new Date().getHours();const greet=hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const first=(nameOf(S.myId)||"").split(" ")[0];
  let h='<div class="ph"><div><div class="crumb">'+esc(new Date().toLocaleDateString(LOC(),{weekday:"long",day:"numeric",month:"long",year:"numeric"}))+'</div><h1>'+greet+(first&&first!==tr("Someone")?'<span>'+(LANG==="ar"?"، ":", ")+'</span><span dir="auto">'+esc(first)+'</span>':"")+'</h1><div class="sub">Here\'s where your work stands across '+plans.length+' plan'+(plans.length===1?"":"s")+'.</div></div>'+
    (S.isAdmin&&S.canWrite?'<button class="btn primary" data-act="new-plan">'+ICON.plus+'New plan</button>':"")+'</div>';
  h+='<div class="tiles"><div class="tile acc"><div class="k">My open tasks</div><div class="v">'+open.length+'</div></div><div class="tile late"><div class="k">Late</div><div class="v">'+late+'</div></div><div class="tile info"><div class="k">Due this week</div><div class="v">'+dueWeek+'</div></div><div class="tile ok"><div class="k">Completed</div><div class="v">'+doneMine+'</div></div></div>';
  h+='<div class="ph" style="margin-bottom:12px"><h2 style="font-size:18px">'+(S.isAdmin?"All plans":"My plans")+'</h2></div>';
  if(!plans.length){
    h+='<div class="empty"><h3>'+(S.isAdmin?"Create your first plan":"No plans yet")+'</h3>'+(S.isAdmin?"A plan holds a team's buckets and tasks. Start from a template and add members.<br><br><button class=\"btn primary\" data-act=\"new-plan\">"+ICON.plus+"New plan</button>":"You'll see plans here once an admin adds you as a member.")+'</div>';
  }else{
    h+='<div class="plans">'+plans.map(p=>{const c=planStats(p.id);return '<a class="pcard" style="--pc:'+esc(p.color||PLAN_COLORS[0])+';text-decoration:none;color:inherit" href="#plan-'+esc(p.id)+'"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><h3 dir="auto">'+esc(p.name)+'</h3><span class="mono">'+esc(p.code||"")+'</span></div><div class="desc" dir="auto">'+esc(p.description||tr("No description"))+'</div>'+statusBar(c)+'<div class="pstats num"><span>'+c.total+' tasks · '+c.pct+'% done</span>'+(c.late?'<span class="chip late">'+c.late+' late</span>':"<span></span>")+'</div><div style="display:flex;justify-content:space-between;align-items:center">'+avStack(p.members,5)+'<span class="muted" style="font-size:12px">'+(p.members||[]).length+' member'+((p.members||[]).length===1?"":"s")+'</span></div></a>'}).join("")+'</div>';
  }
  return h;
}

/* ---------- my tasks ---------- */
function renderMy(){
  const mine=S.tasks.filter(t=>(t.assignees||[]).includes(S.myId)&&canSeePlan(planById(t.planId)));
  const open=mine.filter(t=>t.progress!=="completed");
  const done=mine.filter(t=>t.progress==="completed").sort((a,b)=>(b.completedAt||"").localeCompare(a.completedAt||""));
  let groups;
  if(S.view.myGroup==="plan"){groups=visiblePlans().map(p=>({n:p.name,user:true,list:open.filter(t=>t.planId===p.id)}))}
  else if(S.view.myGroup==="priority"){groups=PRI.map(p=>({n:p.n,list:open.filter(t=>(t.priority||"medium")===p.k)}))}
  else{groups=DUE.map(d=>({n:d.n,list:open.filter(t=>dueBucket(t)===d.k)}))}
  let h='<div class="ph"><div><div class="crumb">Assigned to you</div><h1>My tasks</h1><div class="sub">'+open.length+' open, '+open.filter(isLate).length+' late, across every plan you belong to.</div></div><div class="field-inline"><label for="my-group">Group by</label><select class="sel" id="my-group" data-change="my-group"><option value="due"'+(S.view.myGroup==="due"?" selected":"")+'>Due date</option><option value="plan"'+(S.view.myGroup==="plan"?" selected":"")+'>Plan</option><option value="priority"'+(S.view.myGroup==="priority"?" selected":"")+'>Priority</option></select></div></div>';
  if(!mine.length)return h+'<div class="empty"><h3>Nothing assigned to you</h3>Tasks assigned to you in any plan will collect here.</div>';
  h+='<div class="stack">';
  groups.filter(g=>g.list.length).forEach(g=>{
    h+='<div class="panel"><div class="panel-h"><h2'+(g.user?' dir="auto"':"")+'>'+esc(g.user?g.n:tr(g.n))+' <span class="muted num" style="font-weight:400;font-size:14px">'+g.list.length+'</span></h2></div>'+taskTable(g.list,{plan:true,compact:true})+'</div>';
  });
  if(done.length){h+='<div class="panel"><div class="panel-h"><button class="completed-toggle '+(S.openDone.my?"open":"")+'" data-act="toggle-done" data-key="my">'+ICON.chev+'Completed ('+done.length+')</button></div>'+(S.openDone.my?taskTable(done.slice(0,100),{plan:true,compact:true}):"")+'</div>'}
  return h+'</div>';
}

/* ---------- task table (grid view & lists) ---------- */
function taskTable(list,opt){
  opt=opt||{};
  const cols=[["title","Task"]];
  if(opt.plan)cols.push(["plan","Plan"]);
  cols.push(["assignees","Assigned to"]);
  if(!opt.plan)cols.push(["bucket","Bucket"]);
  cols.push(["progress","Progress"],["priority","Priority"]);
  if(!opt.compact)cols.push(["start","Start"]);
  cols.push(["due","Due"]);
  if(!opt.compact)cols.push(["labels","Labels"]);
  const sortable=!!opt.sortable;const s=S.view.sort;
  if(sortable)list=sortTasks(list,s.key,s.dir);
  let h='<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:34px"><span class="sr">Complete</span></th>'+cols.map(c=>'<th'+(sortable?' class="sortable" data-act="sort" data-key="'+c[0]+'"':"")+'>'+c[1]+(sortable&&s.key===c[0]?(s.dir>0?" ↑":" ↓"):"")+'</th>').join("")+'</tr></thead><tbody>';
  if(!list.length)h+='<tr><td colspan="'+(cols.length+1)+'" class="muted" style="text-align:center;padding:24px">No tasks match.</td></tr>';
  list.forEach(t=>{
    const p=planById(t.planId);const st=statusOf(t);
    h+='<tr class="click '+(t.progress==="completed"?"done":"")+'" data-act="open-task" data-id="'+esc(t.id)+'"><td>'+chkHtml(t)+'</td>';
    cols.forEach(c=>{
      switch(c[0]){
        case "title":h+='<td class="ttl"><div style="display:flex;flex-direction:column"><span dir="auto" style="font-weight:500">'+esc(t.title)+'</span><span class="mono">'+esc(taskCode(t))+'</span></div></td>';break;
        case "plan":h+='<td><span class="chip"><span class="dot" style="width:8px;height:8px;border-radius:2px;background:'+esc((p&&p.color)||"#999")+'"></span><span dir="auto">'+esc(p?p.name:"")+'</span></span></td>';break;
        case "assignees":h+='<td>'+((t.assignees||[]).length?'<div class="cell-user">'+avStack(t.assignees,3)+((t.assignees||[]).length===1?'<span dir="auto">'+esc(nameOf(t.assignees[0]))+'</span>':"")+'</div>':'<span class="muted">Unassigned</span>')+'</td>';break;
        case "bucket":{const b=(p&&p.buckets||[]).find(b=>b.id===t.bucketId);h+='<td dir="auto">'+esc(b?b.name:"")+'</td>';break}
        case "progress":h+='<td>'+(st==="late"?'<span class="chip late">Late</span>':st==="completed"?'<span class="chip ok">Completed</span>':'<span class="chip">'+(PROG.find(x=>x.k===t.progress)||PROG[0]).n+'</span>')+'</td>';break;
        case "priority":h+='<td>'+priHtml(t.priority||"medium",true)+'</td>';break;
        case "start":h+='<td class="num">'+esc(fmtDate(t.start))+'</td>';break;
        case "due":h+='<td class="num" style="'+(isLate(t)?"color:var(--late);font-weight:600":"")+'">'+esc(fmtDate(t.due))+'</td>';break;
        case "labels":h+='<td><div style="display:flex;gap:4px;flex-wrap:wrap">'+(t.labels||[]).map(l=>lblHtml(p,l)).join("")+'</div></td>';break;
      }
    });
    h+='</tr>';
  });
  return h+'</tbody></table></div>';
}
function sortTasks(list,key,dir){
  const v=t=>{switch(key){
    case "title":return (t.title||"").toLowerCase();
    case "assignees":return (t.assignees||[]).map(nameOf).join(",").toLowerCase()||"~";
    case "bucket":{const p=planById(t.planId);return (p&&p.buckets||[]).findIndex(b=>b.id===t.bucketId)}
    case "progress":return {late:0,inprogress:1,notstarted:2,completed:3}[statusOf(t)];
    case "priority":return PRI_RANK[t.priority||"medium"];
    case "start":return t.start||"9999";
    case "due":return t.due||"9999";
    case "labels":return (t.labels||[]).length?-(t.labels.length):0;
    case "plan":return (planById(t.planId)||{}).name||"";
    default:return 0}};
  return list.slice().sort((a,b)=>{const x=v(a),y=v(b);return (x<y?-1:x>y?1:0)*dir});
}
function chkHtml(t){
  const on=t.progress==="completed";
  return '<button class="chk '+(on?"on":t.progress==="inprogress"?"half":"")+'" data-act="complete" data-id="'+esc(t.id)+'" aria-label="'+(on?"Mark as not complete":"Mark complete")+'" title="'+(on?"Mark as not complete":"Mark complete")+'"'+(S.canWrite?"":" disabled")+'>'+ICON.check+'</button>';
}

/* ---------- plan workspace ---------- */
function filterCount(){return Object.values(S.view.filter).filter(Boolean).length}
function applyFilter(list){
  const f=S.view.filter;
  return list.filter(t=>{
    if(f.q){const q=f.q.toLowerCase();if(!((t.title||"").toLowerCase().includes(q)||(t.notes||"").toLowerCase().includes(q)||taskCode(t).toLowerCase().includes(q)))return false}
    if(f.assignee){if(f.assignee==="none"){if((t.assignees||[]).length)return false}else if(!(t.assignees||[]).includes(f.assignee))return false}
    if(f.priority&&(t.priority||"medium")!==f.priority)return false;
    if(f.label&&!(t.labels||[]).includes(f.label))return false;
    if(f.status&&statusOf(t)!==f.status)return false;
    if(f.due&&dueBucket(t)!==f.due)return false;
    return true;
  });
}
function renderPlan(p){
  const v=S.view;const tabs=[["board","Board",ICON.board],["grid","Grid",ICON.grid],["schedule","Schedule",ICON.sched],["timeline","Timeline",ICON.tl],["charts","Charts",ICON.chart]];
  const c=planStats(p.id);
  let h='<div class="plan-top"><div class="plan-title"><div class="pdot" style="background:'+esc(p.color||PLAN_COLORS[0])+'">'+esc(initials(p.name))+'</div><div style="min-width:0"><h1 dir="auto">'+esc(p.name)+'</h1><div class="muted" style="font-size:12.5px" dir="auto">'+esc(p.description||"")+'</div></div><div class="sp"></div>'+
    '<div class="num muted" style="font-size:12.5px;display:flex;gap:12px;align-items:center"><span>'+c.total+' tasks</span><span>'+c.pct+'% done</span>'+(c.late?'<span class="chip late">'+c.late+' late</span>':"")+'</div>'+
    avStack(p.members,5)+
    '<button class="btn" data-act="export" title="Export tasks to a CSV file for Excel">'+ICON.dl+'Export</button>'+
    (S.isAdmin&&S.canWrite?'<button class="btn" data-act="plan-settings" data-id="'+esc(p.id)+'">'+ICON.gear+'Plan settings</button>':"")+
    '</div><div class="tabs" role="tablist">'+tabs.map(t=>'<button class="tab '+(v.tab===t[0]?"on":"")+'" role="tab" aria-selected="'+(v.tab===t[0])+'" data-act="tab" data-tab="'+t[0]+'">'+t[2]+t[1]+'</button>').join("")+'</div></div>';
  // toolbar
  const f=v.filter;const fc=filterCount();
  h+='<div class="toolbar"><div class="search">'+ICON.search+'<input class="inp" id="f-q" type="search" placeholder="Search tasks" value="'+esc(f.q||"")+'" data-input="filter" data-key="q" aria-label="Search tasks"></div>'+
    sel("f-assignee","assignee",[["","Anyone"],[S.myId,"Assigned to me"],["none","Unassigned"]].concat((p.members||[]).filter(i=>i!==S.myId).map(i=>[i,nameOf(i),1])),f.assignee,"Assigned")+
    sel("f-status","status",[["","Any status"],["notstarted","Not started"],["inprogress","In progress"],["late","Late"],["completed","Completed"]],f.status,"Status")+
    sel("f-priority","priority",[["","Any priority"]].concat(PRI.map(x=>[x.k,x.n])),f.priority,"Priority")+
    sel("f-due","due",[["","Any due date"]].concat(DUE.map(x=>[x.k,x.n])),f.due,"Due")+
    sel("f-label","label",[["","Any label"]].concat((p.labels||[]).filter(l=>l.name).map(l=>[l.id,l.name,1])),f.label,"Label")+
    (fc?'<button class="btn ghost" data-act="clear-filter">Clear filters <span class="fcount">'+fc+'</span></button>':"")+
    '<div class="sp"></div>'+
    (v.tab==="board"?'<div class="field-inline"><label for="group-by">Group by</label><select class="sel" id="group-by" data-change="group-by">'+[["bucket","Bucket"],["progress","Progress"],["priority","Priority"],["assignee","Assigned to"],["due","Due date"],["labels","Labels"]].map(o=>'<option value="'+o[0]+'"'+(v.groupBy===o[0]?" selected":"")+'>'+o[1]+'</option>').join("")+'</select></div>':"")+
    '</div>';
  const list=applyFilter(tasksOf(p.id));
  h+='<div class="workspace" data-keep-scroll="ws">';
  if(v.tab==="grid")h+=renderGrid(p,list);
  else if(v.tab==="schedule")h+=renderSchedule(p,list);
  else if(v.tab==="timeline")h+=renderTimeline(p,list);
  else if(v.tab==="charts")h+=renderCharts(p,list);
  else h+=renderBoard(p,list);
  return h+'</div>';
}
function sel(id,key,opts,val,label){return '<label class="sr" for="'+id+'">'+label+'</label><select class="sel" id="'+id+'" data-change="filter" data-key="'+key+'">'+opts.map(o=>'<option value="'+esc(o[0])+'"'+((val||"")===o[0]?" selected":"")+(o[2]?' dir="auto"':"")+'>'+esc(o[1])+'</option>').join("")+'</select>'}

/* board */
function boardColumns(p,list){
  const T=today(),ew=endOfWeek(T);
  switch(S.view.groupBy){
    case "progress":return PROG.map(x=>({key:"pg-"+x.k,fixed:true,title:x.n,tasks:list.filter(t=>t.progress===x.k),drop:t=>setProgressPatch(t,x.k),log:"set progress to "+x.n,newData:{progress:x.k}}));
    case "priority":return PRI.map(x=>({key:"pr-"+x.k,fixed:true,title:x.n,icon:priHtml(x.k),tasks:list.filter(t=>(t.priority||"medium")===x.k),drop:()=>({priority:x.k}),log:"set priority to "+x.n,newData:{priority:x.k}}));
    case "assignee":{
      const cols=[{key:"as-none",fixed:true,title:"Unassigned",tasks:list.filter(t=>!(t.assignees||[]).length),drop:()=>({assignees:[]}),log:"removed all assignees",newData:{}}];
      (p.members||[]).forEach(m=>cols.push({key:"as-"+m,title:nameOf(m),av:m,tasks:list.filter(t=>(t.assignees||[]).includes(m)),drop:(t,fromKey)=>{let a=(t.assignees||[]).filter(x=>"as-"+x!==fromKey);if(!a.includes(m))a.push(m);return {assignees:a}},log:"assigned "+nameOf(m),newData:{assignees:[m]}}));
      return cols;}
    case "due":return DUE.map(x=>{
      const target={today:T,tomorrow:addDays(T,1),thisweek:ew,nextweek:addDays(ew,7),none:""}[x.k];
      return {key:"du-"+x.k,fixed:true,title:x.n,tasks:list.filter(t=>dueBucket(t)===x.k),drop:target===undefined?null:()=>({due:target}),log:target?"set due date to "+fmtDate(target):"removed the due date",newData:target===undefined?null:{due:target}}});
    case "labels":{
      const cols=(p.labels||[]).filter(l=>l.name).map(l=>({key:"lb-"+l.id,title:l.name,color:l.color,tasks:list.filter(t=>(t.labels||[]).includes(l.id)),drop:(t,fromKey)=>{let a=(t.labels||[]).filter(x=>"lb-"+x!==fromKey);if(!a.includes(l.id))a.push(l.id);return {labels:a}},log:"added label "+l.name,newData:{labels:[l.id]}}));
      cols.unshift({key:"lb-none",fixed:true,title:"No label",tasks:list.filter(t=>!(t.labels||[]).length),drop:()=>({labels:[]}),log:"removed labels",newData:{}});
      return cols;}
    default:{
      const ids=new Set((p.buckets||[]).map(b=>b.id));const first=(p.buckets||[])[0];
      return (p.buckets||[]).map(b=>({key:"bk-"+b.id,bucket:b,title:b.name,tasks:list.filter(t=>t.bucketId===b.id||(!ids.has(t.bucketId)&&first&&b.id===first.id)),drop:()=>({bucketId:b.id}),log:"moved to "+b.name,newData:{bucketId:b.id},splitDone:true}));
    }
  }
}
function cardHtml(t,p,colKey){
  const st=statusOf(t);const cl=t.checklist||[];const done=cl.filter(c=>c.done).length;
  let h='<div class="card '+(t.progress==="completed"?"done":"")+'" draggable="'+(S.canWrite?"true":"false")+'" data-act="open-task" data-id="'+esc(t.id)+'" data-col="'+esc(colKey)+'" tabindex="0">';
  if((t.labels||[]).length)h+='<div class="labels">'+t.labels.map(l=>lblHtml(p,l)).join("")+'</div>';
  h+='<div class="ct">'+chkHtml(t)+'<span dir="auto">'+esc(t.title)+'</span></div>';
  const meta=[];
  if(t.priority&&t.priority!=="medium")meta.push(priHtml(t.priority));
  if(t.progress==="inprogress"&&st!=="late")meta.push('<span class="chip" style="background:var(--accent-soft)">In progress</span>');
  if(t.due)meta.push('<span class="chip '+(st==="late"?"late":"")+'">'+ICON.cal+esc((t.start?fmtDate(t.start)+" – ":"")+fmtDate(t.due))+'</span>');
  if(cl.length)meta.push('<span class="m num" title="Checklist">'+ICON.list+done+'/'+cl.length+'</span>');
  if(t.notes)meta.push('<span class="m" title="Has notes">'+ICON.notes+'</span>');
  if((t.links||[]).length)meta.push('<span class="m num" title="Links">'+ICON.link+t.links.length+'</span>');
  if(meta.length)h+='<div class="meta">'+meta.join("")+'</div>';
  if(t.showChecklist&&cl.length)h+='<div class="cl">'+cl.slice(0,6).map(c=>'<div><span class="b '+(c.done?"on":"")+'"></span><span dir="auto">'+esc(c.text)+'</span></div>').join("")+(cl.length>6?'<div class="muted">+'+(cl.length-6)+' more</div>':"")+'</div>';
  h+='<div class="card-foot"><span class="mono">'+esc(taskCode(t))+'</span>'+avStack(t.assignees,3)+'</div>';
  return h+'</div>';
}
function renderBoard(p,list){
  const cols=boardColumns(p,list);
  const byOrder=(a,b)=>(a.order||0)-(b.order||0)||(a.createdAt||"").localeCompare(b.createdAt||"");
  let h='<div class="board">';
  cols.forEach(c=>{
    let active=c.tasks,done=[];
    if(c.splitDone){active=c.tasks.filter(t=>t.progress!=="completed");done=c.tasks.filter(t=>t.progress==="completed")}
    active=active.slice().sort(byOrder);done=done.slice().sort((a,b)=>(b.completedAt||"").localeCompare(a.completedAt||""));
    const canAdd=S.canWrite&&c.newData!==null&&c.newData!==undefined;
    h+='<section class="col" aria-label="'+esc(c.title)+'"><div class="col-h">'+(c.av?av(c.av,"sm"):"")+(c.color?'<span class="lbl bar" style="background:'+esc(c.color)+';width:10px;height:10px"></span>':"")+(c.icon||"")+'<h3 dir="auto">'+esc(c.fixed?tr(c.title):c.title)+'</h3><span class="n num">'+c.tasks.length+'</span>'+
      (c.bucket&&S.isAdmin&&S.canWrite?'<button class="icon-btn" data-act="plan-settings" data-id="'+esc(p.id)+'" title="Edit buckets" aria-label="Edit buckets">'+ICON.gear+'</button>':"")+'</div>';
    if(canAdd){
      if(S.adding===c.key)h+='<div class="add-box"><input id="add-'+esc(c.key)+'" placeholder="Enter a task name" value="'+esc(S.addText)+'" data-input="add-text" data-key="'+esc(c.key)+'" aria-label="New task name"><div class="row"><button class="btn ghost" data-act="add-cancel">Cancel</button><button class="btn primary" data-act="add-commit" data-key="'+esc(c.key)+'">Add task</button></div></div>';
      else h+='<button class="add-task" data-act="add-start" data-key="'+esc(c.key)+'">'+ICON.plus+'Add task</button>';
    }
    h+='<div class="drop" data-drop="'+esc(c.key)+'">'+active.map(t=>cardHtml(t,p,c.key)).join("")+'</div>';
    if(done.length){const k=p.id+c.key;h+='<button class="completed-toggle '+(S.openDone[k]?"open":"")+'" data-act="toggle-done" data-key="'+esc(k)+'">'+ICON.chev+'Completed tasks ('+done.length+')</button>'+(S.openDone[k]?'<div class="drop">'+done.map(t=>cardHtml(t,p,c.key)).join("")+'</div>':"")}
    h+='</section>';
  });
  if(S.view.groupBy==="bucket"&&S.isAdmin&&S.canWrite)h+='<div class="add-bucket"><label class="sr" for="new-bucket">New bucket name</label><input class="inp" id="new-bucket" placeholder="+ Add new bucket" data-enter="add-bucket"></div>';
  return h+'</div>';
}
let BOARD_COLS=[];
function afterPlanRender(p){if(S.view.tab==="board")BOARD_COLS=boardColumns(p,applyFilter(tasksOf(p.id)))}

/* grid */
function renderGrid(p,list){
  let h='<div class="gridview"><div class="panel">';
  if(S.canWrite)h+='<div class="panel-h"><div class="frow" style="flex:1"><label class="sr" for="grid-new">New task name</label><input class="inp" id="grid-new" placeholder="Add a task and press Enter" style="flex:1;min-width:180px" data-enter="grid-add"><label class="sr" for="grid-bucket">Bucket</label><select class="sel" id="grid-bucket">'+(p.buckets||[]).map(b=>'<option dir="auto" value="'+esc(b.id)+'">'+esc(b.name)+'</option>').join("")+'</select></div><span class="muted num" style="font-size:12.5px">'+list.length+' tasks</span></div>';
  h+=taskTable(list,{sortable:true});
  return h+'</div></div>';
}

/* schedule */
function renderSchedule(p,list){
  if(!S.view.month)S.view.month=today().slice(0,7);
  const [y,m]=S.view.month.split("-").map(Number);
  const first=new Date(y,m-1,1);const start=addDays(ymd(first),-first.getDay());
  const T=today();
  const byDay={};list.filter(t=>t.due).forEach(t=>{(byDay[t.due]=byDay[t.due]||[]).push(t)});
  let h='<div class="sched"><div><div class="cal-h"><button class="icon-btn" data-act="month" data-d="-1" aria-label="Previous month">'+ICON.left+'</button><h2>'+first.toLocaleDateString(LOC(),{month:"long",year:"numeric"})+'</h2><button class="icon-btn" data-act="month" data-d="1" aria-label="Next month">'+ICON.chev+'</button><button class="btn" data-act="month" data-d="0">Today</button></div><div class="cal">';
  DOW.forEach(d=>h+='<div class="dow">'+d+'</div>');
  for(let i=0;i<42;i++){
    const d=addDays(start,i);const dd=parseYmd(d);const out=dd.getMonth()!==m-1;const wk=dd.getDay()===5||dd.getDay()===6;
    if(i===35&&out)break;
    const evs=(byDay[d]||[]).sort((a,b)=>PRI_RANK[a.priority||"medium"]-PRI_RANK[b.priority||"medium"]);
    h+='<div class="day '+(out?"out ":"")+(d===T?"today ":"")+(wk&&!out?"weekend":"")+'" data-day="'+d+'"><span class="dn">'+dd.getDate()+'</span>'+(S.canWrite?'<button class="icon-btn plus" data-act="day-add" data-day="'+d+'" aria-label="Add task on '+fmtDate(d,true)+'">'+ICON.plus+'</button>':"")+
      evs.map(t=>'<button class="ev '+(isLate(t)?"late ":"")+(t.progress==="completed"?"done":"")+'" draggable="'+(S.canWrite?"true":"false")+'" data-act="open-task" data-id="'+esc(t.id)+'" dir="auto" title="'+esc(t.title)+'">'+esc(t.title)+'</button>').join("")+'</div>';
  }
  h+='</div></div><div><div class="panel"><div class="panel-h"><h2>Unscheduled</h2><span class="muted num">'+list.filter(t=>!t.due).length+'</span></div><div class="panel-b unsched" data-day="">'+
    (list.filter(t=>!t.due&&t.progress!=="completed").map(t=>'<button class="ev" draggable="'+(S.canWrite?"true":"false")+'" data-act="open-task" data-id="'+esc(t.id)+'" dir="auto">'+esc(t.title)+'</button>').join("")||'<div class="muted" style="font-size:13px">Every open task has a due date.</div>')+
    '<div class="muted" style="font-size:12px;margin-top:6px">Drag a task onto a day to set its due date.</div></div></div></div></div>';
  return h;
}

/* timeline */
function renderTimeline(p,list){
  const T=today();
  if(!S.view.tlStart)S.view.tlStart=addDays(T,-parseYmd(T).getDay()-7);
  const start=S.view.tlStart,days=56,dw=30,nameW=260;
  const dayList=[...Array(days)].map((_,i)=>addDays(start,i));
  const end=dayList[days-1];
  const months=[];dayList.forEach((d,i)=>{const k=d.slice(0,7);if(!months.length||months[months.length-1].k!==k)months.push({k,i,n:1});else months[months.length-1].n++});
  const cols='grid-template-columns:'+nameW+'px '+(days*dw)+'px';
  let h='<div class="tl"><div class="cal-h"><button class="icon-btn" data-act="tl" data-d="-28" aria-label="Earlier">'+ICON.left+'</button><h2 style="min-width:auto">'+fmtDate(start,true)+' – '+fmtDate(end,true)+'</h2><button class="icon-btn" data-act="tl" data-d="28" aria-label="Later">'+ICON.chev+'</button><button class="btn" data-act="tl" data-d="0">Today</button><span class="muted" style="font-size:12.5px;margin-inline-start:8px">Bars run from start to due date; a diamond marks a task with only a due date.</span></div>';
  h+='<div class="tl-grid" dir="ltr" style="'+cols+'" data-keep-scroll="tl">';
  h+='<div class="tl-head corner">Task</div><div class="tl-head"><div class="tl-months" style="grid-template-columns:'+months.map(m=>m.n*dw+"px").join(" ")+'">'+months.map(m=>'<div>'+parseYmd(m.k+"-01").toLocaleDateString(LOC(),{month:"short",year:"numeric"})+'</div>').join("")+'</div><div class="tl-days" style="grid-template-columns:repeat('+days+','+dw+'px)">'+dayList.map(d=>{const dd=parseYmd(d);return '<div class="'+((dd.getDay()===5||dd.getDay()===6)?"wk ":"")+(d===T?"td":"")+'">'+dd.getDate()+'</div>'}).join("")+'</div></div>';
  const bg='<div class="tl-bg" style="grid-template-columns:repeat('+days+','+dw+'px)">'+dayList.map(d=>{const g=parseYmd(d).getDay();return '<div class="'+((g===5||g===6)?"wk":"")+'"></div>'}).join("")+'</div>';
  const todayX=diffDays(start,T);
  const todayLine=(todayX>=0&&todayX<days)?'<div class="tl-today" style="left:'+(todayX*dw+dw/2)+'px"></div>':"";
  (p.buckets||[]).forEach(b=>{
    const ts=list.filter(t=>t.bucketId===b.id).sort((a,c)=>(a.start||a.due||"9999").localeCompare(c.start||c.due||"9999"));
    if(!ts.length)return;
    h+='<div class="tl-name grp" dir="auto">'+esc(b.name)+'</div><div class="tl-cell grp">'+bg+todayLine+'</div>';
    ts.forEach(t=>{
      const st=statusOf(t);
      let bar="";
      const s=t.start||t.due,e=t.due||t.start;
      if(s){
        const x0=diffDays(start,s),x1=diffDays(start,e);
        if(x1>=0&&x0<days){
          const a=Math.max(0,x0),z=Math.min(days-1,x1);
          const ms=!t.start&&t.due;
          bar='<button class="tl-bar '+(st==="late"?"late ":st==="completed"?"done ":"")+(ms?"ms":"")+'" data-act="open-task" data-id="'+esc(t.id)+'" style="left:'+(ms?a*dw+dw/2-7:a*dw+2)+'px;width:'+((z-a+1)*dw-4)+'px" title="'+esc(t.title+" · "+(t.start?fmtDate(t.start)+" – ":"")+fmtDate(t.due))+'">'+(ms?"":'<span dir="auto">'+esc(t.title)+'</span>')+'</button>';
        }
      }
      h+='<div class="tl-name" data-act="open-task" data-id="'+esc(t.id)+'">'+chkHtml(t)+'<span dir="auto">'+esc(t.title)+'</span></div><div class="tl-cell">'+bg+todayLine+bar+'</div>';
    });
  });
  if(!list.some(t=>t.start||t.due))h+='<div class="tl-name" style="grid-column:1/-1;color:var(--muted);cursor:default">Add start or due dates to tasks to see them on the timeline.</div>';
  return h+'</div></div>';
}

/* charts */
function renderCharts(p,list){
  const c={notstarted:0,inprogress:0,late:0,completed:0};list.forEach(t=>c[statusOf(t)]++);
  const total=list.length;const remaining=total-c.completed;
  let h='<div class="charts">';
  // donut
  const R=70,CX=100,CY=100,SW=22,circ=2*Math.PI*R;let off=0;
  let donut='<svg viewBox="0 0 200 200" role="img" aria-label="Status: '+c.notstarted+' not started, '+c.inprogress+' in progress, '+c.late+' late, '+c.completed+' completed"><circle cx="'+CX+'" cy="'+CY+'" r="'+R+'" fill="none" stroke="var(--surface-2)" stroke-width="'+SW+'"/>';
  ["completed","inprogress","late","notstarted"].forEach(k=>{if(!c[k]||!total)return;const len=c[k]/total*circ;donut+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R+'" fill="none" stroke="'+STATUS_COL[k]+'" stroke-width="'+SW+'" stroke-dasharray="'+len+' '+(circ-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+CX+' '+CY+')"/>';off+=len});
  donut+='<text x="100" y="104" text-anchor="middle" class="big">'+remaining+'</text><text x="100" y="124" text-anchor="middle">tasks left</text></svg>';
  h+='<div class="panel chart"><div class="panel-h"><h2>Status</h2><span class="muted num">'+total+' tasks</span></div><div class="panel-b" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div style="width:190px">'+donut+'</div><div style="display:flex;flex-direction:column;gap:8px;flex:1;min-width:140px">'+[["notstarted","Not started"],["inprogress","In progress"],["late","Late"],["completed","Completed"]].map(([k,n])=>'<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+STATUS_COL[k]+';margin-inline-end:8px"></i>'+n+'</span><b class="num">'+c[k]+'</b></div>').join("")+'</div></div></div>';
  // buckets stacked
  const legend='<div class="legend">'+[["notstarted","Not started"],["inprogress","In progress"],["late","Late"],["completed","Completed"]].map(([k,n])=>'<span><i style="background:'+STATUS_COL[k]+'"></i>'+n+'</span>').join("")+'</div>';
  const stackRows=(rows)=>{const max=Math.max(1,...rows.map(r=>r.total));return rows.map(r=>'<div class="hbar"><div class="lb">'+(r.av?av(r.av,"sm"):"")+'<span dir="auto" title="'+esc(r.n)+'">'+esc(r.n)+'</span></div><div class="tw"><div class="track" style="width:'+(r.total/max*100)+'%;'+(r.total?"":"background:none")+'">'+["completed","inprogress","late","notstarted"].map(k=>r[k]?'<i style="width:'+(r[k]/Math.max(1,r.total)*100)+'%;background:'+STATUS_COL[k]+'" title="'+r[k]+'"></i>':"").join("")+'</div></div><span class="vv">'+r.total+'</span></div>').join("")};
  const bRows=(p.buckets||[]).map(b=>{const r={n:b.name,total:0,notstarted:0,inprogress:0,late:0,completed:0};list.filter(t=>t.bucketId===b.id).forEach(t=>{r[statusOf(t)]++;r.total++});return r});
  h+='<div class="panel chart"><div class="panel-h"><h2>Bucket</h2></div><div class="panel-b">'+stackRows(bRows)+legend+'</div></div>';
  // priority
  const pRows=PRI.map(x=>{const r={n:x.n,total:0,notstarted:0,inprogress:0,late:0,completed:0};list.filter(t=>(t.priority||"medium")===x.k).forEach(t=>{r[statusOf(t)]++;r.total++});return r});
  h+='<div class="panel chart"><div class="panel-h"><h2>Priority</h2></div><div class="panel-b">'+stackRows(pRows)+legend+'</div></div>';
  // members
  const mRows=(p.members||[]).map(m=>{const r={n:nameOf(m),av:m,total:0,notstarted:0,inprogress:0,late:0,completed:0};list.filter(t=>(t.assignees||[]).includes(m)).forEach(t=>{r[statusOf(t)]++;r.total++});return r}).sort((a,b)=>b.total-a.total);
  const un={n:"Unassigned",total:0,notstarted:0,inprogress:0,late:0,completed:0};list.filter(t=>!(t.assignees||[]).length).forEach(t=>{un[statusOf(t)]++;un.total++});
  h+='<div class="panel chart"><div class="panel-h"><h2>Members</h2><span class="muted" style="font-size:12px">Tasks per person</span></div><div class="panel-b">'+stackRows(mRows.concat(un.total?[un]:[]))+legend+'</div></div>';
  return h+'</div>';
}

/* ---------- admin console ---------- */
function allUserIds(){
  const ids=new Set(S.people.filter(p=>p.role!=="pending").map(p=>p.id));
  S.plans.forEach(p=>(p.members||[]).forEach(i=>ids.add(i)));
  S.tasks.forEach(t=>(t.assignees||[]).forEach(i=>ids.add(i)));
  return [...ids].filter(Boolean);
}
function renderAdmin(){
  const tab=S.view.adminTab;
  let h='<div class="ph"><div><div class="crumb">Administration</div><h1>Admin console</h1><div class="sub">Manage plans, members and workload across the whole board.</div></div>'+(S.canWrite?'<button class="btn primary" data-act="new-plan">'+ICON.plus+'New plan</button>':"")+'</div>';
  h+='<div class="admin-tabs">'+[["overview","Overview"],["users","Users"],["plans","Plans"],["access","Roles & access"]].map(t=>'<button class="tab '+(tab===t[0]?"on":"")+'" data-act="admin-tab" data-tab="'+t[0]+'">'+t[1]+'</button>').join("")+'</div>';
  if(tab==="users")return h+adminUsers();
  if(tab==="plans")return h+adminPlans();
  if(tab==="access")return h+adminAccess();
  // overview
  const all=S.tasks.filter(t=>planById(t.planId));
  const c={notstarted:0,inprogress:0,late:0,completed:0};all.forEach(t=>c[statusOf(t)]++);
  const weekAgo=addDays(today(),-7);
  const doneWeek=all.filter(t=>t.completedAt&&t.completedAt.slice(0,10)>=weekAgo).length;
  h+='<div class="tiles"><div class="tile acc"><div class="k">Users</div><div class="v">'+allUserIds().length+'</div></div><div class="tile info"><div class="k">Plans</div><div class="v">'+S.plans.length+'</div></div><div class="tile"><div class="k">Open tasks</div><div class="v">'+(c.notstarted+c.inprogress+c.late)+'</div></div><div class="tile late"><div class="k">Late</div><div class="v">'+c.late+'</div></div><div class="tile ok"><div class="k">Done in 7 days</div><div class="v">'+doneWeek+'</div></div></div>';
  h+='<div class="split"><div class="panel"><div class="panel-h"><h2>Plan health</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Plan</th><th>Progress</th><th>Open</th><th>Late</th><th>Members</th></tr></thead><tbody>'+
    (S.plans.slice().sort((a,b)=>planStats(b.id).late-planStats(a.id).late).map(p=>{const s=planStats(p.id);return '<tr class="click" data-act="go" data-href="#plan-'+esc(p.id)+'"><td><div class="cell-user"><span class="dot" style="width:10px;height:10px;border-radius:3px;background:'+esc(p.color)+'"></span><span dir="auto" style="font-weight:500">'+esc(p.name)+'</span></div></td><td style="min-width:140px"><div style="display:flex;align-items:center;gap:8px">'+statusBar(s).replace('class="pbar"','class="pbar" style="flex:1"')+'<span class="num muted" style="font-size:12px">'+s.pct+'%</span></div></td><td class="num">'+(s.notstarted+s.inprogress+s.late)+'</td><td class="num">'+(s.late?'<span class="chip late">'+s.late+'</span>':"0")+'</td><td>'+avStack(p.members,4)+'</td></tr>'}).join("")||'<tr><td colspan="5" class="muted" style="padding:20px;text-align:center">No plans yet.</td></tr>')+
    '</tbody></table></div></div>';
  const wl=allUserIds().map(id=>{const open=all.filter(t=>(t.assignees||[]).includes(id)&&t.progress!=="completed");return {id,open:open.length,late:open.filter(isLate).length}}).sort((a,b)=>b.open-a.open).slice(0,12);
  const max=Math.max(1,...wl.map(w=>w.open));
  h+='<div class="panel"><div class="panel-h"><h2>Workload</h2><span class="muted" style="font-size:12px">Open tasks per person</span></div><div class="panel-b">'+(wl.length?wl.map(w=>'<div class="hbar"><div class="lb">'+av(w.id,"sm")+'<span dir="auto">'+esc(nameOf(w.id))+'</span></div><div class="tw"><div class="track" style="width:'+(w.open/max*100)+'%">'+(w.late?'<i style="width:'+(w.late/Math.max(1,w.open)*100)+'%;background:'+STATUS_COL.late+'"></i>':"")+'<i style="flex:1;background:'+STATUS_COL.inprogress+'"></i></div></div><span class="vv">'+w.open+'</span></div>').join("")+'<div class="legend"><span><i style="background:'+STATUS_COL.late+'"></i>Late</span><span><i style="background:'+STATUS_COL.inprogress+'"></i>On track</span></div>':'<div class="muted">No users yet.</div>')+'</div></div></div>';
  return h;
}
function adminUsers(){
  const ids=allUserIds();
  const people=Object.fromEntries(S.people.map(p=>[p.id,p]));
  const pending=S.people.filter(p=>p.role==="pending");
  const rows=ids.filter(id=>(people[id]||{}).role!=="pending").map(id=>{const ts=S.tasks.filter(t=>(t.assignees||[]).includes(id)&&planById(t.planId));const open=ts.filter(t=>t.progress!=="completed");return {id,p:people[id]||{},plans:S.plans.filter(p=>(p.members||[]).includes(id)),open:open.length,late:open.filter(isLate).length,done:ts.length-open.length}}).sort((a,b)=>nameOf(a.id).localeCompare(nameOf(b.id)));
  let h="";
  if(pending.length){
    h+='<div class="panel" style="margin-bottom:16px;border-color:var(--warn)"><div class="panel-h"><h2>Waiting for approval <span class="muted num" style="font-weight:400">'+pending.length+'</span></h2><span class="muted" style="font-size:12.5px">These people created an account. Approve them to give access.</span></div><div class="tbl-wrap"><table class="tbl"><tbody>'+
      pending.map(p=>'<tr><td><div class="cell-user">'+av(p.id,"lg")+'<div><div dir="auto" style="font-weight:500">'+esc(nameOf(p.id))+'</div><div class="em">'+esc(p.email)+'</div></div></div></td><td class="num muted">'+esc(p.createdAt?fmtDate(String(p.createdAt).slice(0,10)):"")+'</td><td style="text-align:end"><div class="frow" style="justify-content:flex-end"><button class="btn" data-act="set-role" data-user="'+esc(p.id)+'" data-role="disabled">Decline</button><button class="btn primary" data-act="set-role" data-user="'+esc(p.id)+'" data-role="member">Approve</button></div></td></tr>').join("")+
      '</tbody></table></div></div>';
  }
  h+='<div class="panel"><div class="panel-h"><h2>Users <span class="muted num" style="font-weight:400">'+rows.length+'</span></h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>User</th><th>Role</th><th>Plans</th><th>Open</th><th>Late</th><th>Completed</th><th>Last active</th><th>Add to plan</th></tr></thead><tbody>';
  rows.forEach(r=>{
    const ro=r.p.role||"member";
    let role;
    const names={owner:"Owner",admin:"Admin",member:"Member",viewer:"Viewer",disabled:"No access"};
    if(ro==="owner"||r.id===S.myId)role='<span class="role '+(ro==="owner"||ro==="admin"?"admin":"member")+'" style="'+(ro==="owner"||ro==="admin"?"":"background:var(--surface-2);color:var(--ink)")+'">'+names[ro]+'</span>';
    else role='<label class="sr" for="role-'+esc(r.id)+'">Role</label><select class="sel" id="role-'+esc(r.id)+'" data-change="set-role" data-user="'+esc(r.id)+'">'+[["admin","Admin"],["member","Member"],["viewer","Viewer"],["disabled","No access"]].map(o=>'<option value="'+o[0]+'"'+(ro===o[0]?" selected":"")+'>'+o[1]+'</option>').join("")+'</select>';
    const avail=S.plans.filter(p=>!(p.members||[]).includes(r.id));
    const canAdd=S.canWrite&&avail.length&&ro!=="disabled";
    h+='<tr'+(ro==="disabled"?' style="opacity:.6"':"")+'><td><div class="cell-user">'+av(r.id,"lg")+'<div style="min-width:0"><div dir="auto" style="font-weight:500">'+esc(nameOf(r.id))+(r.id===S.myId?' <span class="muted">(you)</span>':"")+'</div>'+(emailOf(r.id)?'<div class="em">'+esc(emailOf(r.id))+'</div>':"")+'</div></div></td><td>'+role+'</td><td><div style="display:flex;gap:4px;flex-wrap:wrap;max-width:280px">'+(r.plans.map(p=>'<span class="chip"><span dir="auto">'+esc(p.name)+'</span>'+(S.canWrite?'<button class="x" data-act="remove-member" data-plan="'+esc(p.id)+'" data-user="'+esc(r.id)+'" aria-label="Remove from '+esc(p.name)+'" title="Remove from plan">×</button>':"")+'</span>').join("")||'<span class="muted">None</span>')+'</div></td><td class="num">'+r.open+'</td><td class="num">'+(r.late?'<span class="chip late">'+r.late+'</span>':"0")+'</td><td class="num">'+r.done+'</td><td class="num muted">'+esc(r.p.lastSeen?fmtDate(r.p.lastSeen):"—")+'</td><td>'+(canAdd?'<label class="sr" for="addp-'+esc(r.id)+'">Add to plan</label><select class="sel" id="addp-'+esc(r.id)+'" data-change="add-member" data-user="'+esc(r.id)+'"><option value="">Choose plan…</option>'+avail.map(p=>'<option dir="auto" value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join("")+'</select>':"")+'</td></tr>';
  });
  h+='</tbody></table></div></div>';
  h+='<div class="note" style="margin-top:14px"><b>Adding a new person:</b> send them this site\'s address. They create an account with their email, then appear under “Waiting for approval”. Approve them, choose their role and add them to plans.</div>';
  return h;
}
function adminPlans(){
  let h='<div class="panel"><div class="panel-h"><h2>Plans <span class="muted num" style="font-weight:400">'+S.plans.length+'</span></h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Plan</th><th>Code</th><th>Buckets</th><th>Tasks</th><th>Done</th><th>Members</th><th>Created</th><th></th></tr></thead><tbody>';
  S.plans.slice().sort((a,b)=>(a.name||"").localeCompare(b.name||"")).forEach(p=>{const s=planStats(p.id);
    h+='<tr><td><div class="cell-user"><span class="dot" style="width:10px;height:10px;border-radius:3px;background:'+esc(p.color)+'"></span><a href="#plan-'+esc(p.id)+'" dir="auto" style="color:inherit;font-weight:500">'+esc(p.name)+'</a></div></td><td class="mono">'+esc(p.code||"")+'</td><td class="num">'+(p.buckets||[]).length+'</td><td class="num">'+s.total+'</td><td class="num">'+s.pct+'%</td><td>'+avStack(p.members,5)+'</td><td class="num muted">'+esc(p.createdAt?fmtDate(p.createdAt.slice(0,10)):"")+'</td><td style="text-align:end">'+(S.canWrite?'<button class="btn" data-act="plan-settings" data-id="'+esc(p.id)+'">'+ICON.gear+'Settings</button>':"")+'</td></tr>'});
  if(!S.plans.length)h+='<tr><td colspan="8" class="muted" style="padding:20px;text-align:center">No plans yet.</td></tr>';
  return h+'</tbody></table></div></div>';
}
function adminAccess(){
  return '<div class="split"><div class="panel"><div class="panel-h"><h2>Roles</h2></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Capability</th><th>Admin</th><th>Member</th><th>Viewer</th></tr></thead><tbody>'+
  [["See plans","All plans","Plans they belong to","Plans they belong to"],["Create, edit, delete plans","✓","—","—"],["Manage buckets, labels, members","✓","—","—"],["Approve users and set roles","✓","—","—"],["Add and edit tasks","✓","✓","—"],["Assign, move, complete tasks","✓","✓","—"],["Comment on tasks","✓","✓","—"],["Delete tasks","Any task","Tasks they created","—"],["Admin console","✓","—","—"],["Export to CSV","✓","✓","✓"]].map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>').join("")+
  '</tbody></table></div></div><div class="panel"><div class="panel-h"><h2>How access works</h2></div><div class="panel-b stack" style="gap:10px;font-size:13.5px"><div><b>Owner</b> is the first person who created an account. The owner is always an admin, and nobody can change that.</div><div><b>Admin</b> can create and delete plans, manage members, buckets and roles, and open the Admin console.</div><div><b>Member</b> works on tasks in the plans you add them to.</div><div><b>Viewer</b> can read and export the plans they belong to, but can\'t change anything.</div><div><b>No access</b> blocks someone from seeing anything, without deleting their history.</div><div class="note">The database itself enforces these rules, so people only ever receive the plans and tasks their role allows.</div></div></div></div>';
}

/* ---------- modal: task details ---------- */
function openTask(id){
  closeModal(true);
  S.modal={type:"task",id,pop:null,linkForm:false};
  S.comments=[];
  const load=async()=>{try{const cs=await api.listComments(id);if(S.modal&&S.modal.id===id){S.comments=cs;changed()}}catch(e){}};
  load();
  try{S.commentUnsub=api.subscribeComments(id,load)}catch(e){}
  S.reloadComments=load;
  renderModal();
}
function closeModal(silent){
  if(S.commentUnsub){try{S.commentUnsub()}catch(e){}S.commentUnsub=null}
  S.modal=null;$("#modal-root").innerHTML="";
}
function modalBusy(){const a=document.activeElement;return a&&$("#modal-root").contains(a)&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&a.type!=="checkbox"}
function renderModalIfIdle(){if(!S.modal)return;if(S.modal.type==="task"&&!taskById(S.modal.id)){closeModal();toast("This task was deleted.");return}if(S.modal.type!=="task")return;if(modalBusy()){S.modal.dirty=true;return}renderModal()}
function renderModal(){
  const m=S.modal;if(!m)return;
  const root=$("#modal-root");const prevScroll=root.querySelector(".scrim")?root.querySelector(".scrim").scrollTop:0;
  if(m.type==="task")root.innerHTML=taskModalHtml();
  else if(m.type==="plan")root.innerHTML=planModalHtml();
  else if(m.type==="account")root.innerHTML=accountModalHtml();
  else if(m.type==="ios-install")root.innerHTML=iosInstallHtml();
  const sc=root.querySelector(".scrim");if(sc)sc.scrollTop=prevScroll;
  m.dirty=false;
}
function taskModalHtml(){
  const t=taskById(S.modal.id);if(!t)return "";
  const p=planById(t.planId)||{buckets:[],labels:[],members:[]};
  const ro=!S.canWrite;const dis=ro?" disabled":"";
  const b=(p.buckets||[]).find(b=>b.id===t.bucketId);
  const cl=t.checklist||[];const pop=S.modal.pop;
  let h='<div class="scrim" data-act="scrim"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="t-title">';
  h+='<div class="modal-h"><span class="mono">'+esc(taskCode(t))+'</span><span class="path" dir="auto">'+esc(p.name||"")+' › '+esc(b?b.name:"")+'</span>'+(isLate(t)?'<span class="chip late">Late</span>':"")+'<button class="icon-btn" data-act="close-modal" aria-label="Close">'+ICON.x+'</button></div>';
  h+='<div class="modal-b">';
  h+='<div><label class="sr" for="t-title">Task name</label><input class="title-in" id="t-title" dir="auto" value="'+esc(t.title)+'" data-tf="title"'+dis+'></div>';
  // assignees + labels
  h+='<div class="frow" style="gap:18px;align-items:flex-start">';
  h+='<div class="sec"><span class="flabel">Assigned to</span><div class="frow" style="gap:6px">'+(t.assignees||[]).map(i=>'<span class="chip" style="padding-inline-start:2px">'+av(i,"sm")+'<span dir="auto">'+esc(nameOf(i))+'</span>'+(ro?"":'<button class="x" data-act="unassign" data-user="'+esc(i)+'" aria-label="Remove '+esc(nameOf(i))+'">×</button>')+'</span>').join("")+
    (ro?"":'<div class="pop-wrap"><button class="btn ghost" data-act="pop" data-pop="assign">'+ICON.plus+'Assign</button>'+(pop==="assign"?'<div class="pop">'+((p.members||[]).length?(p.members||[]).map(i=>'<button class="opt" data-act="assign-toggle" data-user="'+esc(i)+'">'+av(i,"sm")+'<span dir="auto">'+esc(nameOf(i))+'</span>'+((t.assignees||[]).includes(i)?'<span class="tick">'+ICON.check.replace('<svg','<svg width="14" height="14"')+'</span>':"")+'</button>').join(""):'<div class="muted" style="padding:8px">This plan has no members yet. An admin can add them in Plan settings.</div>')+'</div>':"")+'</div>')+
    ((t.assignees||[]).length||!ro?"":'<span class="muted">Unassigned</span>')+'</div></div>';
  h+='<div class="sec"><span class="flabel">Labels</span><div class="frow" style="gap:6px">'+(t.labels||[]).map(l=>lblHtml(p,l)).join("")+
    (ro?"":'<div class="pop-wrap"><button class="btn ghost" data-act="pop" data-pop="labels">'+ICON.plus+'Label</button>'+(pop==="labels"?'<div class="pop">'+(p.labels||[]).map(l=>'<button class="opt" data-act="label-toggle" data-label="'+esc(l.id)+'"><span class="lbl" style="background:'+esc(l.color)+'" dir="auto">'+esc(l.name||tr("Unnamed label"))+'</span>'+((t.labels||[]).includes(l.id)?'<span class="tick">'+ICON.check.replace('<svg','<svg width="14" height="14"')+'</span>':"")+'</button>').join("")+'</div>':"")+'</div>')+
    ((t.labels||[]).length||!ro?"":'<span class="muted">None</span>')+'</div></div>';
  h+='</div>';
  // fields
  h+='<div class="fgrid">'+
    '<div class="f"><label for="t-bucket">Bucket</label><select class="sel" id="t-bucket" data-tf="bucketId"'+dis+'>'+(p.buckets||[]).map(x=>'<option dir="auto" value="'+esc(x.id)+'"'+(x.id===t.bucketId?" selected":"")+'>'+esc(x.name)+'</option>').join("")+'</select></div>'+
    '<div class="f"><label for="t-progress">Progress</label><select class="sel" id="t-progress" data-tf="progress"'+dis+'>'+PROG.map(x=>'<option value="'+x.k+'"'+(x.k===t.progress?" selected":"")+'>'+x.n+'</option>').join("")+'</select></div>'+
    '<div class="f"><label for="t-priority">Priority</label><select class="sel" id="t-priority" data-tf="priority"'+dis+'>'+PRI.map(x=>'<option value="'+x.k+'"'+(x.k===(t.priority||"medium")?" selected":"")+'>'+x.n+'</option>').join("")+'</select></div>'+
    '<div class="f"><label for="t-start">Start date</label><input class="inp" type="date" id="t-start" value="'+esc(t.start||"")+'" data-tf="start"'+dis+'></div>'+
    '<div class="f"><label for="t-due">Due date</label><input class="inp" type="date" id="t-due" value="'+esc(t.due||"")+'" data-tf="due"'+dis+' style="'+(isLate(t)?"border-color:var(--late);color:var(--late)":"")+'"></div>'+
  '</div>';
  h+='<div class="two"><div class="stack">';
  // notes
  h+='<div class="sec f"><label for="t-notes">Notes</label><textarea class="inp" id="t-notes" dir="auto" placeholder="Add a description, context or decisions" data-tf="notes"'+dis+'>'+esc(t.notes||"")+'</textarea></div>';
  // checklist
  const done=cl.filter(c=>c.done).length;
  h+='<div class="sec"><div class="sec-h"><span class="flabel" style="margin:0">Checklist <span class="num">'+(cl.length?done+" / "+cl.length:"")+'</span></span><label class="field-inline" style="font-size:12px"><input type="checkbox" class="cbox" id="t-showcl" data-act="show-cl"'+(t.showChecklist?" checked":"")+dis+'>Show on card</label></div>';
  if(cl.length)h+='<div class="pbar" style="height:4px"><i style="width:'+(done/cl.length*100)+'%;background:var(--ok)"></i></div>';
  h+='<div>'+cl.map((c,i)=>'<div class="cli '+(c.done?"on":"")+'"><input type="checkbox" class="cbox" id="cl-c-'+esc(c.id)+'" data-act="cl-check" data-id="'+esc(c.id)+'"'+(c.done?" checked":"")+dis+' aria-label="Done"><input type="text" id="cl-t-'+esc(c.id)+'" dir="auto" value="'+esc(c.text)+'" data-cl="'+esc(c.id)+'"'+dis+' aria-label="Checklist item"><button class="icon-btn" data-act="cl-up" data-id="'+esc(c.id)+'" aria-label="Move up"'+(i===0||ro?" disabled":"")+'>'+ICON.up+'</button>'+(ro?"":'<button class="icon-btn" data-act="cl-del" data-id="'+esc(c.id)+'" aria-label="Delete item">'+ICON.x+'</button>')+'</div>').join("")+'</div>';
  if(!ro)h+='<input class="inp" id="cl-new" placeholder="+ Add an item and press Enter" data-enter="cl-add" style="width:100%">';
  h+='</div>';
  // links
  const links=t.links||[];
  h+='<div class="sec"><div class="sec-h"><span class="flabel" style="margin:0">Links &amp; references</span>'+(ro?"":'<button class="btn ghost" data-act="link-form">'+ICON.plus+'Add link</button>')+'</div>';
  h+='<div class="links">'+(links.length?links.map(l=>'<div class="linkrow">'+ICON.link+'<a href="'+esc(safeUrl(l.url))+'" target="_blank" rel="noopener noreferrer" dir="auto">'+esc(l.name||l.url)+'</a><span style="flex:1"></span>'+(ro?"":'<button class="icon-btn" data-act="link-del" data-id="'+esc(l.id)+'" aria-label="Remove link">'+ICON.x+'</button>')+'</div>').join(""):(S.modal.linkForm?"":'<div class="muted" style="font-size:13px">Link documents on SharePoint, Teams files or other systems.</div>'))+'</div>';
  if(S.modal.linkForm)h+='<div class="frow"><label class="sr" for="ln-url">Link address</label><input class="inp" id="ln-url" placeholder="https://…" style="flex:2;min-width:160px"><label class="sr" for="ln-name">Display name</label><input class="inp" id="ln-name" placeholder="Display name (optional)" style="flex:1;min-width:120px" data-enter="link-add"><button class="btn primary" data-act="link-add">Add</button><button class="btn ghost" data-act="link-form">Cancel</button></div>';
  h+='</div>';
  h+='</div><div class="stack">';
  // comments
  h+='<div class="sec"><span class="flabel">Comments <span class="num">'+(S.comments.length||"")+'</span></span>';
  if(!ro)h+='<textarea class="inp" id="c-new" dir="auto" placeholder="Write a comment" style="min-height:64px"></textarea><div style="display:flex;justify-content:flex-end"><button class="btn primary" data-act="comment-post">Post comment</button></div>';
  h+='<div class="stack" style="gap:10px">'+(S.comments.slice().reverse().map(c=>'<div class="comment">'+av(c.author,"sm")+'<div class="bub"><div class="bh"><b dir="auto">'+esc(nameOf(c.author))+'</b><span>'+esc(fmtTime(c.at))+(c.author===S.myId||S.isAdmin?' · <button class="x" style="border:0;background:none;color:var(--muted);padding:0;font-size:12px;text-decoration:underline" data-act="comment-del" data-id="'+esc(c.id)+'">Delete</button>':"")+'</span></div><div class="txt" dir="auto">'+esc(c.text)+'</div></div></div>').join("")||'<div class="muted" style="font-size:13px">No comments yet.</div>')+'</div></div>';
  // activity
  const acts=(t.activity||[]).slice().reverse().slice(0,15);
  h+='<div class="sec"><span class="flabel">Activity</span>'+acts.map(a=>'<div class="act"><span><b dir="auto">'+esc(nameOf(a.by))+'</b> '+esc(a.text)+'<br><span style="font-size:11.5px">'+esc(fmtTime(a.at))+'</span></span></div>').join("")+'</div>';
  h+='</div></div></div>';
  h+='<div class="modal-f"><span class="muted" style="font-size:12.5px" data-nt>'+tr("Created by")+' <span dir="auto">'+esc(nameOf(t.createdBy))+'</span> · '+esc(fmtTime(t.createdAt))+(t.completedAt?' · '+tr("Completed by")+' <span dir="auto">'+esc(nameOf(t.completedBy))+'</span> · '+esc(fmtTime(t.completedAt)):"")+'</span>'+(canDeleteTask(t)?'<button class="btn danger" data-act="task-del">'+ICON.trash+'Delete task</button>':"")+'</div>';
  return h+'</div></div>';
}
function safeUrl(u){u=String(u||"").trim();return /^https?:\/\//i.test(u)?u:"https://"+u.replace(/^\/+/,"")}

/* ---------- modal: plan settings ---------- */
function openPlanSettings(id){
  closeModal(true);
  const p=id?planById(id):null;
  const draft=p?clone({name:p.name,description:p.description||"",color:p.color||PLAN_COLORS[0],code:p.code||"",members:p.members||[],buckets:p.buckets||[],labels:p.labels||[]}):
    {name:"",description:"",color:PLAN_COLORS[S.plans.length%PLAN_COLORS.length],code:"",members:S.myId?[S.myId]:[],buckets:[],labels:DEFAULT_LABELS.map((n,i)=>({id:"l"+(i+1),name:tr(n),color:LABEL_COLORS[i]})),template:"project"};
  S.modal={type:"plan",id:id||null,draft,search:[],confirmDelete:false,removedBuckets:[]};
  renderModal();
  setTimeout(()=>{const n=$("#ps-name");if(n&&!id)n.focus()},30);
}
function planModalHtml(){
  const m=S.modal,d=m.draft;const isNew=!m.id;
  let h='<div class="scrim" data-act="scrim"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="ps-h"><div class="modal-h"><h2 id="ps-h" style="font-size:18px;flex:1">'+(isNew?"New plan":"Plan settings")+'</h2><button class="icon-btn" data-act="close-modal" aria-label="Close">'+ICON.x+'</button></div><div class="modal-b">';
  h+='<div class="fgrid" style="grid-template-columns:2fr 1fr"><div class="f"><label for="ps-name">Plan name</label><input class="inp" id="ps-name" dir="auto" value="'+esc(d.name)+'" data-pd="name" placeholder="e.g. Q1 Project Follow-up"></div><div class="f"><label for="ps-code">Task ID prefix</label><input class="inp" id="ps-code" value="'+esc(d.code)+'" data-pd="code" maxlength="6" placeholder="Auto" style="text-transform:uppercase"></div></div>';
  h+='<div class="f"><label for="ps-desc">Description</label><textarea class="inp" id="ps-desc" dir="auto" data-pd="description" style="min-height:60px" placeholder="What this plan covers">'+esc(d.description)+'</textarea></div>';
  h+='<div class="sec"><span class="flabel">Color</span><div class="swatches">'+PLAN_COLORS.map(c=>'<button class="sw '+(d.color===c?"on":"")+'" style="background:'+c+'" data-act="ps-color" data-c="'+c+'" aria-label="Color '+c+'"></button>').join("")+'</div></div>';
  if(isNew)h+='<div class="sec"><span class="flabel">Start from</span><div class="tmpl">'+TEMPLATES.map(t=>'<button class="'+(d.template===t.k?"on":"")+'" data-act="ps-tmpl" data-k="'+t.k+'"><b>'+t.n+'</b><span>'+t.d+'</span></button>').join("")+'</div></div>';
  // members
  h+='<div class="two"><div class="sec"><span class="flabel">Members <span class="num">'+d.members.length+'</span></span><div class="pop-wrap" style="display:block"><label class="sr" for="ps-search">Add people</label><input class="inp" id="ps-search" placeholder="Search colleagues by name to add" style="width:100%" data-input="ps-search" autocomplete="off" value="'+esc(m.q||"")+'">'+(m.search.length?'<div class="pop" style="width:100%">'+m.search.map(x=>'<button class="opt" data-act="ps-add" data-user="'+esc(x.id)+'">'+'<img class="av sm" src="'+esc(x.avatarUrl)+'" alt=""><span><span dir="auto">'+esc(x.name)+'</span>'+(x.email?'<br><span class="muted" style="font-size:12px">'+esc(x.email)+'</span>':"")+'</span>'+(d.members.includes(x.id)?'<span class="tick">Added</span>':"")+'</button>').join("")+'</div>':"")+'</div>';
  const known=allUserIds().filter(i=>!d.members.includes(i)&&roleOf(i)!=="disabled");
  if(known.length)h+='<div class="frow" style="gap:6px"><span class="muted" style="font-size:12px">Quick add:</span>'+known.slice(0,8).map(i=>'<button class="chip" style="cursor:pointer" data-act="ps-add" data-user="'+esc(i)+'">'+av(i,"sm")+'<span dir="auto">'+esc(nameOf(i))+'</span>+</button>').join("")+'</div>';
  h+='<div>'+d.members.map(i=>'<div class="member-row">'+av(i,"lg")+'<div class="who"><div dir="auto">'+esc(nameOf(i))+(i===S.myId?' <span class="muted">(you)</span>':"")+'</div>'+(emailOf(i)?'<div class="em">'+esc(emailOf(i))+'</div>':"")+'</div><button class="btn ghost" data-act="ps-remove" data-user="'+esc(i)+'">Remove</button></div>').join("")+'</div></div>';
  // buckets & labels
  h+='<div class="stack">';
  if(!isNew){h+='<div class="sec"><span class="flabel">Buckets</span>'+d.buckets.map((b,i)=>'<div class="bk-row"><label class="sr" for="bk-'+esc(b.id)+'">Bucket name</label><input class="inp" id="bk-'+esc(b.id)+'" dir="auto" value="'+esc(b.name)+'" data-bk="'+esc(b.id)+'"><button class="icon-btn" data-act="bk-up" data-i="'+i+'" aria-label="Move up"'+(i===0?" disabled":"")+'>'+ICON.up+'</button><button class="icon-btn" data-act="bk-down" data-i="'+i+'" aria-label="Move down"'+(i===d.buckets.length-1?" disabled":"")+'>'+ICON.down+'</button><button class="icon-btn" data-act="bk-del" data-i="'+i+'" aria-label="Delete bucket"'+(d.buckets.length<2?" disabled":"")+'>'+ICON.trash+'</button></div>').join("")+'<button class="btn ghost" data-act="bk-add" style="align-self:flex-start">'+ICON.plus+'Add bucket</button>'+(m.removedBuckets.length?'<div class="muted" style="font-size:12px">Tasks in deleted buckets move to “'+esc((d.buckets[0]||{}).name||"")+'”.</div>':"")+'</div>'}
  h+='<div class="sec"><span class="flabel">Labels</span>'+d.labels.map(l=>'<div class="lab-row"><span class="lsw" style="background:'+esc(l.color)+'"></span><label class="sr" for="lb-'+esc(l.id)+'">Label name</label><input class="inp" id="lb-'+esc(l.id)+'" dir="auto" value="'+esc(l.name)+'" data-lb="'+esc(l.id)+'" placeholder="Unnamed (hidden)"></div>').join("")+'</div>';
  h+='</div></div>';
  if(!isNew){h+='<div class="danger-zone"><div><b>Delete this plan</b><div class="muted" style="font-size:12.5px">Removes the plan with all of its '+tasksOf(m.id).length+' tasks and their comments. This can\'t be undone.</div></div>'+(m.confirmDelete?'<div class="frow"><button class="btn" data-act="ps-del-cancel">Keep plan</button><button class="btn danger" data-act="ps-del-yes">Yes, delete everything</button></div>':'<button class="btn danger" data-act="ps-del">'+ICON.trash+'Delete plan</button>')+'</div>'}
  h+='</div><div class="modal-f"><span class="muted" style="font-size:12.5px">'+(isNew?"You can change all of this later.":"Changes apply for everyone when you save.")+'</span><div class="frow"><button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="ps-save">'+(isNew?"Create plan":"Save changes")+'</button></div></div></div></div>';
  return h;
}
function autoCode(name){const w=(name||"").replace(/[^A-Za-z0-9 ]/g," ").trim().split(/\s+/).filter(Boolean);let c=w.length>1?w.map(x=>x[0]).join(""):(w[0]||"PLN").slice(0,3);c=c.toUpperCase().slice(0,4);return c||"PLN"}
async function savePlan(){
  const m=S.modal,d=m.draft;
  d.name=(d.name||"").trim();
  if(!d.name){toast("Give the plan a name.");$("#ps-name")&&$("#ps-name").focus();return}
  const code=((d.code||"").trim()||autoCode(d.name)).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6)||"PLN";
  if(!m.id){
    const tmpl=TEMPLATES.find(t=>t.k===d.template)||TEMPLATES[0];
    const body={name:d.name,description:d.description.trim(),color:d.color,code,members:d.members,buckets:tmpl.b.map(n=>({id:"b"+uid(),name:tr(n)})),labels:d.labels.map(l=>({id:l.id,name:(l.name||"").trim(),color:l.color})),createdBy:S.myId,createdAt:new Date().toISOString()};
    let created;
    try{created=await run("plan-new",()=>api.createPlan(body))}catch(e){return}
    if(!planById(created.id))S.plans.push(created);
    closeModal();toast("Plan created");location.hash="plan-"+created.id;return;
  }
  const buckets=d.buckets.map(b=>({id:b.id,name:(b.name||"").trim()||"Untitled bucket"}));
  const body={name:d.name,description:d.description.trim(),color:d.color,code,members:d.members,buckets,labels:d.labels.map(l=>({id:l.id,name:(l.name||"").trim(),color:l.color}))};
  try{await updatePlan(m.id,body)}catch(e){return}
  const keep=new Set(buckets.map(b=>b.id));
  for(const t of tasksOf(m.id).filter(t=>!keep.has(t.bucketId))){await updateTask(t.id,{bucketId:buckets[0].id},"moved to "+buckets[0].name)}
  closeModal();toast("Plan saved");
}
async function deletePlan(id){
  closeModal();
  try{await run("plan:"+id,()=>api.deletePlan(id))}catch(e){return}
  S.plans=S.plans.filter(p=>p.id!==id);S.tasks=S.tasks.filter(t=>t.planId!==id);
  location.hash="home";toast("Plan deleted");changed();
}
async function addMember(planId,userId){
  const p=planById(planId);if(!p||(p.members||[]).includes(userId))return;
  const members=(p.members||[]).concat([userId]);
  try{await updatePlan(planId,{members});toast(nameOf(userId)+" added to "+p.name)}catch(e){}
}
async function removeMember(planId,userId){
  const p=planById(planId);if(!p)return;
  const members=(p.members||[]).filter(i=>i!==userId);
  try{await updatePlan(planId,{members});toast(nameOf(userId)+" removed from "+p.name)}catch(e){}
}

/* ---------- prompt dialog ---------- */
function promptDialog(title,placeholder){
  return new Promise(res=>{
    const root=$("#dialog-root");
    root.innerHTML='<div class="scrim" style="z-index:60;align-items:center"><div class="modal narrow" role="dialog" aria-modal="true" aria-labelledby="pd-h"><div class="modal-h"><h2 id="pd-h" style="font-size:17px;flex:1">'+esc(title)+'</h2></div><div class="modal-b"><label class="sr" for="pd-in">'+esc(placeholder)+'</label><input class="inp" id="pd-in" dir="auto" placeholder="'+esc(placeholder)+'" style="width:100%"></div><div class="modal-f"><span></span><div class="frow"><button class="btn" id="pd-cancel">Cancel</button><button class="btn primary" id="pd-ok">Add task</button></div></div></div></div>';
    const inp=$("#pd-in");inp.focus();
    const done=v=>{root.innerHTML="";res(v)};
    $("#pd-ok").onclick=()=>done(inp.value.trim()||null);
    $("#pd-cancel").onclick=()=>done(null);
    inp.onkeydown=e=>{if(e.key==="Enter")done(inp.value.trim()||null);if(e.key==="Escape")done(null)};
  });
}

/* ---------- export ---------- */
async function exportPlan(){
  const p=planById(S.route.planId);if(!p)return;
  const list=applyFilter(tasksOf(p.id)).sort((a,b)=>(a.num||0)-(b.num||0));
  const q=v=>{v=String(v==null?"":v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const head=["Task ID","Task name","Bucket","Progress","Late","Priority","Assigned to","Start date","Due date","Labels","Checklist items","Completed checklist items","Notes","Links","Created by","Created date","Completed by","Completed date"];
  const rows=list.map(t=>{const b=(p.buckets||[]).find(b=>b.id===t.bucketId);const cl=t.checklist||[];return [taskCode(t),t.title,b?b.name:"",tr((PROG.find(x=>x.k===t.progress)||PROG[0]).n),tr(isLate(t)?"Yes":"No"),tr((PRI.find(x=>x.k===(t.priority||"medium"))||PRI[2]).n),(t.assignees||[]).map(nameOf).join("; "),t.start||"",t.due||"",(t.labels||[]).map(l=>(labelOf(p,l)||{}).name||"").filter(Boolean).join("; "),cl.length,cl.filter(c=>c.done).length,t.notes||"",(t.links||[]).map(l=>l.url).join("; "),nameOf(t.createdBy),(t.createdAt||"").slice(0,10),t.completedBy?nameOf(t.completedBy):"",(t.completedAt||"").slice(0,10)]});
  const csv="﻿"+[head.map(h=>tr(h))].concat(rows).map(r=>r.map(q).join(",")).join("\r\n");
  const fname=(p.name||"plan").replace(/[\\/:*?"<>|]+/g," ").trim()+" "+today()+".csv";
  try{
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=fname;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }catch(e){try{await navigator.clipboard.writeText(csv);toast("Download isn't available here, so the CSV was copied to your clipboard.")}catch(e2){toast("Export isn't available in this view.")}}
}

/* ---------- events ---------- */
document.addEventListener("click",async e=>{
  const el=e.target.closest("[data-act]");if(!el)return;
  const a=el.dataset.act;
  if(a==="scrim"){if(e.target===el)closeModal();return}
  if(a==="open-task"){if(e.target.closest(".chk"))return;openTask(el.dataset.id);return}
  if(a==="cl-check"||a==="show-cl")return;
  e.preventDefault();
  switch(a){
    case "lang":setLang(LANG==="ar"?"en":"ar");break;
    case "go":location.hash=el.dataset.href.slice(1);break;
    case "complete":e.stopPropagation();toggleComplete(el.dataset.id);break;
    case "new-plan":if(S.isAdmin)openPlanSettings(null);break;
    case "plan-settings":openPlanSettings(el.dataset.id);break;
    case "tab":S.view.tab=el.dataset.tab;S.adding=null;render();break;
    case "admin-tab":S.view.adminTab=el.dataset.tab;render();break;
    case "clear-filter":S.view.filter={};render();break;
    case "toggle-done":S.openDone[el.dataset.key]=!S.openDone[el.dataset.key];render();break;
    case "sort":{const k=el.dataset.key;if(S.view.sort.key===k)S.view.sort.dir*=-1;else S.view.sort={key:k,dir:1};render();break}
    case "add-start":S.adding=el.dataset.key;S.addText="";render();setTimeout(()=>{const n=document.getElementById("add-"+el.dataset.key);n&&n.focus()},0);break;
    case "add-cancel":S.adding=null;S.addText="";render();break;
    case "add-commit":commitAdd(el.dataset.key);break;
    case "month":{const d=+el.dataset.d;if(!d)S.view.month=today().slice(0,7);else{const [y,m]=S.view.month.split("-").map(Number);S.view.month=ymd(new Date(y,m-1+d,1)).slice(0,7)}render();break}
    case "tl":{const d=+el.dataset.d;const T=today();S.view.tlStart=d?addDays(S.view.tlStart,d):addDays(T,-parseYmd(T).getDay()-7);render();break}
    case "day-add":{e.stopPropagation();const day=el.dataset.day;const name=await promptDialog("New task due "+fmtDate(day,true),"Task name");if(name){const id=await createTask(S.route.planId,{title:name,due:day});if(id)toast("Task added")}break}
    case "export":exportPlan();break;
    case "close-modal":closeModal();break;
    case "remove-member":removeMember(el.dataset.plan,el.dataset.user);break;
    // task modal
    case "pop":S.modal.pop=S.modal.pop===el.dataset.pop?null:el.dataset.pop;renderModal();break;
    case "assign-toggle":{const t=taskById(S.modal.id);const u=el.dataset.user;const has=(t.assignees||[]).includes(u);const as=has?t.assignees.filter(x=>x!==u):(t.assignees||[]).concat([u]);updateTask(t.id,{assignees:as},(has?"unassigned ":"assigned ")+nameOf(u));break}
    case "unassign":{const t=taskById(S.modal.id);const u=el.dataset.user;updateTask(t.id,{assignees:(t.assignees||[]).filter(x=>x!==u)},"unassigned "+nameOf(u));break}
    case "label-toggle":{const t=taskById(S.modal.id);const l=el.dataset.label;const has=(t.labels||[]).includes(l);const p=planById(t.planId);updateTask(t.id,{labels:has?t.labels.filter(x=>x!==l):(t.labels||[]).concat([l])},(has?"removed label ":"added label ")+((labelOf(p,l)||{}).name||""));break}
    case "cl-del":{const t=taskById(S.modal.id);const it=(t.checklist||[]).find(c=>c.id===el.dataset.id);updateTask(t.id,{checklist:(t.checklist||[]).filter(c=>c.id!==el.dataset.id)},"removed checklist item “"+(it?it.text:"")+"”");break}
    case "cl-up":{const t=taskById(S.modal.id);const cl=clone(t.checklist||[]);const i=cl.findIndex(c=>c.id===el.dataset.id);if(i>0){[cl[i-1],cl[i]]=[cl[i],cl[i-1]];updateTask(t.id,{checklist:cl})}break}
    case "link-form":S.modal.linkForm=!S.modal.linkForm;renderModal();if(S.modal.linkForm)setTimeout(()=>{$("#ln-url")&&$("#ln-url").focus()},0);break;
    case "link-add":addLink();break;
    case "link-del":{const t=taskById(S.modal.id);updateTask(t.id,{links:(t.links||[]).filter(l=>l.id!==el.dataset.id)},"removed a link");break}
    case "comment-post":postComment();break;
    case "comment-del":{const id=el.dataset.id;S.comments=S.comments.filter(c=>c.id!==id);renderModal();run("comment:"+id,()=>api.deleteComment(id)).catch(()=>{S.reloadComments&&S.reloadComments()});break}
    case "account":openAccount();break;
    case "sign-out":closeModal(true);auth.signOut();break;
    case "install":doInstall();break;
    case "auth-view":S.authView=el.dataset.v;S.authMsg=null;renderAuth();setTimeout(()=>{const n=$("#au-name")||$("#au-email");n&&n.focus()},0);break;
    case "set-role":setRole(el.dataset.user,el.dataset.role);break;
    case "task-del":{const t=taskById(S.modal.id);if(!t)return;if(!el.dataset.confirm){el.dataset.confirm="1";el.innerHTML=ICON.trash+"Click again to delete";el.style.background="var(--late)";el.style.color="#fff";setTimeout(()=>{if(el.isConnected){delete el.dataset.confirm;el.innerHTML=ICON.trash+"Delete task";el.style.background="";el.style.color=""}},4000);return}closeModal();deleteTask(t.id);break}
    // plan modal
    case "ps-color":S.modal.draft.color=el.dataset.c;renderModal();break;
    case "ps-tmpl":S.modal.draft.template=el.dataset.k;renderModal();break;
    case "ps-add":{const d=S.modal.draft;if(!d.members.includes(el.dataset.user))d.members.push(el.dataset.user);S.modal.search=[];S.modal.q="";renderModal();break}
    case "ps-remove":S.modal.draft.members=S.modal.draft.members.filter(i=>i!==el.dataset.user);renderModal();break;
    case "bk-add":S.modal.draft.buckets.push({id:"b"+uid(),name:LANG==="ar"?"مرحلة جديدة":"New bucket"});renderModal();break;
    case "bk-up":case "bk-down":{const b=S.modal.draft.buckets;const i=+el.dataset.i;const j=a==="bk-up"?i-1:i+1;if(j>=0&&j<b.length){[b[i],b[j]]=[b[j],b[i]];renderModal()}break}
    case "bk-del":{const b=S.modal.draft.buckets;if(b.length<2)return;S.modal.removedBuckets.push(b[+el.dataset.i].id);b.splice(+el.dataset.i,1);renderModal();break}
    case "ps-del":S.modal.confirmDelete=true;renderModal();break;
    case "ps-del-cancel":S.modal.confirmDelete=false;renderModal();break;
    case "ps-del-yes":deletePlan(S.modal.id);break;
    case "ps-save":savePlan();break;
  }
});
document.addEventListener("change",e=>{
  const el=e.target;
  if(el.dataset.change==="filter"){S.view.filter[el.dataset.key]=el.value;render();return}
  if(el.dataset.change==="group-by"){S.view.groupBy=el.value;S.adding=null;render();return}
  if(el.dataset.change==="my-group"){S.view.myGroup=el.value;render();return}
  if(el.dataset.change==="set-role"){setRole(el.dataset.user,el.value);return}
  if(el.dataset.change==="add-member"){if(el.value)addMember(el.value,el.dataset.user);return}
  if(el.dataset.tf&&S.modal&&S.modal.type==="task"){
    const t=taskById(S.modal.id);if(!t)return;const f=el.dataset.tf;const v=el.value;
    if(f==="title"||f==="notes")return; // saved on blur
    if((t[f]||"")===v)return;
    const p=planById(t.planId);
    if(f==="progress"){updateTask(t.id,setProgressPatch(t,v),"set progress to "+(PROG.find(x=>x.k===v)||{}).n);return}
    if(f==="priority"){updateTask(t.id,{priority:v},"set priority to "+(PRI.find(x=>x.k===v)||{}).n);return}
    if(f==="bucketId"){updateTask(t.id,{bucketId:v},"moved to "+(((p&&p.buckets)||[]).find(b=>b.id===v)||{}).name);return}
    if(f==="start"){if(v&&t.due&&v>t.due){toast("Start date is after the due date.")}updateTask(t.id,{start:v},v?"set start date to "+fmtDate(v):"removed the start date");return}
    if(f==="due"){updateTask(t.id,{due:v},v?"set due date to "+fmtDate(v):"removed the due date");return}
  }
  if(el.dataset.act==="show-cl"){const t=taskById(S.modal.id);updateTask(t.id,{showChecklist:el.checked});return}
  if(el.dataset.act==="cl-check"){const t=taskById(S.modal.id);const cl=clone(t.checklist||[]);const it=cl.find(c=>c.id===el.dataset.id);if(it){it.done=el.checked;updateTask(t.id,{checklist:cl},(el.checked?"checked “":"unchecked “")+it.text+"”")}return}
});
document.addEventListener("focusout",e=>{
  const el=e.target;
  if(S.modal&&S.modal.type==="task"){
    const t=taskById(S.modal.id);
    if(t&&el.dataset.tf==="title"){const v=el.value.trim();if(v&&v!==t.title)updateTask(t.id,{title:v},"renamed the task");else if(!v)el.value=t.title}
    if(t&&el.dataset.tf==="notes"){if(el.value!==(t.notes||""))updateTask(t.id,{notes:el.value},"updated the notes")}
    if(t&&el.dataset.cl){const cl=clone(t.checklist||[]);const it=cl.find(c=>c.id===el.dataset.cl);const v=el.value.trim();if(it&&v&&v!==it.text){it.text=v;updateTask(t.id,{checklist:cl})}}
    setTimeout(()=>{if(S.modal&&S.modal.dirty&&!modalBusy())renderModal()},150);
  }
});
document.addEventListener("input",e=>{
  const el=e.target;
  if(el.dataset.input==="filter"){S.view.filter[el.dataset.key]=el.value;clearTimeout(window.__ft);window.__ft=setTimeout(render,180);return}
  if(el.dataset.input==="add-text"){S.addText=el.value;return}
  if(el.dataset.pd&&S.modal&&S.modal.type==="plan"){S.modal.draft[el.dataset.pd]=el.value;return}
  if(el.dataset.bk&&S.modal&&S.modal.type==="plan"){const b=S.modal.draft.buckets.find(x=>x.id===el.dataset.bk);if(b)b.name=el.value;return}
  if(el.dataset.lb&&S.modal&&S.modal.type==="plan"){const l=S.modal.draft.labels.find(x=>x.id===el.dataset.lb);if(l)l.name=el.value;return}
  if(el.dataset.input==="ps-search"){
    const q=el.value;S.modal.q=q;
    const ql=q.trim().toLowerCase();
    S.modal.search=ql?S.people.filter(p=>(p.role!=="pending"&&p.role!=="disabled")&&((p.name||"").toLowerCase().includes(ql)||(p.email||"").toLowerCase().includes(ql))).slice(0,8).map(p=>({id:p.id,name:p.name||p.email,email:p.email,avatarUrl:avatarSrc(p.id)})):[];
    withFocus(renderModal);return;
  }
});
document.addEventListener("keydown",e=>{
  const el=e.target;
  if(e.key==="Escape"){
    if($("#dialog-root").innerHTML)return;
    if(S.modal&&S.modal.pop){S.modal.pop=null;renderModal();return}
    if(S.modal){closeModal();return}
    if(S.adding){S.adding=null;render();return}
  }
  if(e.key==="Enter"&&el.dataset.input==="add-text"){e.preventDefault();commitAdd(el.dataset.key);return}
  if(e.key==="Enter"&&el.dataset.tf==="title"){e.preventDefault();el.blur();return}
  if(e.key==="Enter"&&el.classList.contains("card")){openTask(el.dataset.id);return}
  if(e.key==="Enter"&&el.dataset.enter){
    e.preventDefault();
    const v=el.value.trim();
    if(el.dataset.enter==="cl-add"&&v){const t=taskById(S.modal.id);const cl=clone(t.checklist||[]);cl.push({id:uid(),text:v,done:false});el.value="";updateTask(t.id,{checklist:cl},"added checklist item “"+v+"”");return}
    if(el.dataset.enter==="add-bucket"&&v){const p=planById(S.route.planId);const buckets=clone(p.buckets||[]);buckets.push({id:"b"+uid(),name:v});el.value="";updatePlan(p.id,{buckets}).catch(()=>{});return}
    if(el.dataset.enter==="grid-add"&&v){const b=$("#grid-bucket");el.value="";createTask(S.route.planId,{title:v,bucketId:b?b.value:undefined}).then(id=>id&&toast("Task added"));return}
    if(el.dataset.enter==="link-add"){addLink();return}
  }
  if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)&&el.id==="c-new"){postComment();return}
});
async function commitAdd(key){
  const title=(S.addText||"").trim();if(!title){S.adding=null;render();return}
  const p=planById(S.route.planId);const col=boardColumns(p,[]).find(c=>c.key===key);if(!col||!col.newData)return;
  S.addText="";render();
  const data=Object.assign({title},clone(col.newData));
  if(data.progress==="completed"){Object.assign(data,setProgressPatch({},"completed"))}
  await createTask(p.id,data);
}
function addLink(){
  const u=($("#ln-url")||{}).value||"";const n=($("#ln-name")||{}).value||"";
  if(!u.trim()){toast("Enter a link address.");return}
  const t=taskById(S.modal.id);const links=clone(t.links||[]);links.push({id:uid(),url:safeUrl(u),name:n.trim()});
  S.modal.linkForm=false;updateTask(t.id,{links},"added a link");
}
async function postComment(){
  const ta=$("#c-new");if(!ta)return;const text=ta.value.trim();if(!text)return;
  const t=taskById(S.modal.id);if(!t)return;
  ta.value="";
  try{await run("comment-new",()=>api.addComment(t.id,t.planId,text));S.reloadComments&&S.reloadComments()}catch(e){ta.value=text}
}

/* ---------- drag & drop ---------- */
let drag=null;
document.addEventListener("dragstart",e=>{
  const card=e.target.closest&&e.target.closest(".card,.ev");if(!card||!S.canWrite)return;
  drag={id:card.dataset.id,from:card.dataset.col||null};
  card.classList.add("dragging");
  try{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",card.dataset.id)}catch(x){}
});
document.addEventListener("dragend",e=>{document.querySelectorAll(".dragging").forEach(n=>n.classList.remove("dragging"));document.querySelectorAll(".over").forEach(n=>n.classList.remove("over"));drag=null});
document.addEventListener("dragover",e=>{
  if(!drag)return;
  const z=e.target.closest("[data-drop],[data-day]");if(!z)return;
  if(z.dataset.drop){const col=BOARD_COLS.find(c=>c.key===z.dataset.drop);if(!col||!col.drop)return}
  e.preventDefault();
  document.querySelectorAll(".over").forEach(n=>n!==z&&n.classList.remove("over"));z.classList.add("over");
});
document.addEventListener("dragleave",e=>{const z=e.target.closest&&e.target.closest("[data-drop],[data-day]");if(z&&!z.contains(e.relatedTarget))z.classList.remove("over")});
document.addEventListener("drop",e=>{
  if(!drag)return;
  const z=e.target.closest("[data-drop],[data-day]");if(!z)return;
  e.preventDefault();z.classList.remove("over");
  const t=taskById(drag.id);if(!t)return;
  if(z.dataset.day!==undefined&&!z.dataset.drop){
    const day=z.dataset.day;if((t.due||"")===day)return;
    updateTask(t.id,{due:day},day?"set due date to "+fmtDate(day):"removed the due date");drag=null;return;
  }
  const col=BOARD_COLS.find(c=>c.key===z.dataset.drop);if(!col||!col.drop)return;
  // order position
  const cards=[...z.querySelectorAll(".card")].filter(c=>c.dataset.id!==t.id);
  let idx=cards.length;for(let i=0;i<cards.length;i++){const r=cards[i].getBoundingClientRect();if(e.clientY<r.top+r.height/2){idx=i;break}}
  const prev=cards[idx-1]&&taskById(cards[idx-1].dataset.id),next=cards[idx]&&taskById(cards[idx].dataset.id);
  let order;
  if(prev&&next)order=((prev.order||0)+(next.order||0))/2;
  else if(prev)order=(prev.order||0)+1000;
  else if(next)order=(next.order||0)-1000;
  else order=0;
  const patch=Object.assign({order},col.drop(t,drag.from));
  const sameCol=drag.from===col.key;
  updateTask(t.id,patch,sameCol?null:col.log);
  drag=null;
});

/* ---------- routing ---------- */
function route(){
  const h=(location.hash||"").slice(1);
  let r={page:"home",planId:null};
  if(h==="my-tasks")r.page="my";
  else if(h==="admin")r.page="admin";
  else if(h.startsWith("plan-"))r={page:"plan",planId:h.slice(5)};
  if(r.planId!==S.route.planId){S.view.filter={};S.adding=null;S.view.month=null;S.view.tlStart=null}
  S.route=r;if(!S.myId)return;render();
  const ws=document.querySelector(".page,.workspace");if(ws)ws.scrollTop=0;
}
window.addEventListener("hashchange",route);

/* ---------- roles ---------- */
function computeRole(){
  const p=S.myProfile;const r=p?p.role:"pending";
  const was=S.role;S.role=r;
  S.isOwner=r==="owner";S.isAdmin=r==="owner"||r==="admin";S.canWrite=S.isAdmin||r==="member";
  if(was&&was!==r){render();if(S.route.page==="admin"&&!S.isAdmin)location.hash="home"}
}
function roleOf(id){const p=S.people.find(x=>x.id===id);return p?p.role:"member"}
async function setRole(id,role){
  if(!S.isAdmin||id===S.myId)return;
  const p=S.people.find(x=>x.id===id);if(!p||p.role==="owner")return;
  const old=p.role;p.role=role;changed();
  try{await run("profile:"+id,()=>api.updateProfile(id,{role}));toast(role==="member"&&old==="pending"?"Approved":"Role updated")}catch(e){p.role=old;changed()}
}
async function touchLastSeen(){
  const T=today();if(!S.myProfile||S.myProfile.lastSeen===T)return;
  try{await api.updateProfile(S.myId,{lastSeen:T});S.myProfile.lastSeen=T}catch(e){}
}

/* ---------- sign in / sign up / reset ---------- */
const BRAND_MARK='<div class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h6M4 12h10M4 18h7"/><path d="m15 17 2 2 4-5"/></svg></div>';
function authShell(inner){
  return '<div class="auth"><div class="auth-card"><div class="auth-brand">'+BRAND_MARK+'<div><div class="brand-name">TaskBoard</div><div class="brand-sub">Team planning</div></div><button class="lang-btn" data-act="lang" data-nt>'+(LANG==="ar"?"English":"عربي")+'</button></div>'+inner+'</div></div>';
}
function renderAuth(){
  const a=S.authView||"signin";const msg=S.authMsg?'<div class="auth-msg '+(S.authMsg.err?"err":"")+'" role="'+(S.authMsg.err?"alert":"status")+'">'+esc(S.authMsg.text)+'</div>':"";
  let h="";
  if(a==="recovery"){
    h='<h1>Set a new password</h1><form class="auth-form" data-form="recovery">'+msg+'<div class="f"><label for="au-pw">New password</label><input class="inp" id="au-pw" type="password" autocomplete="new-password" minlength="8" required></div><button class="btn primary big" type="submit">Save password</button></form>';
  }else if(a==="forgot"){
    h='<h1>Reset your password</h1><p class="muted">Enter your email and we\'ll send you a link to set a new password.</p><form class="auth-form" data-form="forgot">'+msg+'<div class="f"><label for="au-email">Email</label><input class="inp" id="au-email" type="email" autocomplete="email" required value="'+esc(S.authEmail||"")+'"></div><button class="btn primary big" type="submit">Send reset link</button><button class="linkbtn" type="button" data-act="auth-view" data-v="signin">Back to sign in</button></form>';
  }else{
    const up=a==="signup";
    h='<div class="auth-tabs" role="tablist"><button class="'+(up?"":"on")+'" role="tab" aria-selected="'+(!up)+'" data-act="auth-view" data-v="signin">Sign in</button><button class="'+(up?"on":"")+'" role="tab" aria-selected="'+up+'" data-act="auth-view" data-v="signup">Create account</button></div>'+
      '<form class="auth-form" data-form="'+a+'">'+msg+
      (up?'<div class="f"><label for="au-name">Full name</label><input class="inp" id="au-name" dir="auto" autocomplete="name" required></div>':"")+
      '<div class="f"><label for="au-email">Email</label><input class="inp" id="au-email" type="email" autocomplete="email" required value="'+esc(S.authEmail||"")+'"></div>'+
      '<div class="f"><label for="au-pw">Password</label><input class="inp" id="au-pw" type="password" autocomplete="'+(up?"new-password":"current-password")+'" minlength="'+(up?8:1)+'" required>'+(up?'<div class="hint">At least 8 characters.</div>':"")+'</div>'+
      '<button class="btn primary big" type="submit">'+(up?"Create account":"Sign in")+'</button>'+
      (up?'<p class="hint">New accounts need an administrator\'s approval before they can see plans.</p>':'<button class="linkbtn" type="button" data-act="auth-view" data-v="forgot">Forgot your password?</button>')+
      '</form>';
  }
  $("#auth-root").innerHTML=authShell(h);
}
function showAuth(){document.body.classList.add("signed-out");document.body.classList.remove("signed-in");renderAuth()}
function hideAuth(){document.body.classList.remove("signed-out");document.body.classList.add("signed-in");$("#auth-root").innerHTML=""}
function authErr(e){
  const m=(e&&e.message)||"";
  if(/Invalid login credentials/i.test(m))return "Email or password is incorrect.";
  if(/Email not confirmed/i.test(m))return "Confirm your email first. Check your inbox for the confirmation link.";
  if(/already registered|already exists/i.test(m))return "An account with this email already exists. Sign in instead.";
  if(/Password should be/i.test(m))return "Choose a longer password (at least 8 characters).";
  if(/rate limit|too many/i.test(m))return "Too many attempts. Wait a minute and try again.";
  if(/Failed to fetch|network/i.test(m))return "Can't reach the server. Check your connection.";
  return m||"Something went wrong. Try again.";
}
document.addEventListener("submit",async e=>{
  const f=e.target.closest("[data-form]");if(!f)return;
  e.preventDefault();
  const kind=f.dataset.form;const btn=f.querySelector('button[type="submit"]');
  const email=(($("#au-email")||{}).value||"").trim();const pw=($("#au-pw")||{}).value||"";const name=(($("#au-name")||{}).value||"").trim();
  if(email)S.authEmail=email;
  btn.disabled=true;
  try{
    if(kind==="signin"){await auth.signIn(email,pw);S.authMsg=null}
    else if(kind==="signup"){
      const r=await auth.signUp(name,email,pw);
      if(!r.session){S.authView="signin";S.authMsg={text:"Account created. Check your email to confirm it, then sign in."}}
    }
    else if(kind==="forgot"){await auth.resetPassword(email);S.authMsg={text:"If that email has an account, a reset link is on its way."}}
    else if(kind==="recovery"){await auth.updatePassword(pw);S.authView="signin";S.authMsg=null;toast("Password updated");S.recovering=false;await startSession()}
  }catch(err){S.authMsg={err:true,text:authErr(err)}}
  btn.disabled=false;
  if(document.body.classList.contains("signed-out"))renderAuth();
});

/* ---------- account dialog ---------- */
function openAccount(){closeModal(true);S.modal={type:"account"};renderModal()}
function accountModalHtml(){
  const p=S.myProfile||{};
  const roleName={owner:"Owner",admin:"Admin",member:"Member",viewer:"Viewer",pending:"Pending approval",disabled:"No access"}[S.role]||S.role;
  return '<div class="scrim" data-act="scrim"><div class="modal narrow" role="dialog" aria-modal="true" aria-labelledby="ac-h"><div class="modal-h"><h2 id="ac-h" style="font-size:18px;flex:1">My account</h2><button class="icon-btn" data-act="close-modal" aria-label="Close">'+ICON.x+'</button></div><div class="modal-b">'+
    '<div class="frow" style="gap:12px">'+av(S.myId,"xl")+'<div><div style="font-weight:600" dir="auto">'+esc(nameOf(S.myId))+'</div><div class="muted" style="font-size:13px">'+esc(p.email||"")+'</div><span class="role admin" style="margin-top:4px">'+esc(roleName)+'</span></div></div>'+
    '<form class="stack" style="gap:10px" data-form2="name"><div class="f"><label for="ac-name">Display name</label><input class="inp" id="ac-name" dir="auto" value="'+esc(p.name||"")+'" required></div><button class="btn" type="submit" style="align-self:flex-start">Save name</button></form>'+
    '<form class="stack" style="gap:10px" data-form2="password"><div class="f"><label for="ac-pw">New password</label><input class="inp" id="ac-pw" type="password" autocomplete="new-password" minlength="8" required></div><button class="btn" type="submit" style="align-self:flex-start">Change password</button></form>'+
    '</div><div class="modal-f"><span></span><button class="btn danger" data-act="sign-out">Sign out</button></div></div></div>';
}
document.addEventListener("submit",async e=>{
  const f=e.target.closest("[data-form2]");if(!f)return;
  e.preventDefault();const btn=f.querySelector("button");btn.disabled=true;
  try{
    if(f.dataset.form2==="name"){const v=$("#ac-name").value.trim();if(v){await api.updateProfile(S.myId,{name:v});S.myProfile.name=v;const me=S.people.find(x=>x.id===S.myId);if(me)me.name=v;toast("Name saved");changed()}}
    else{await auth.updatePassword($("#ac-pw").value);$("#ac-pw").value="";toast("Password updated")}
  }catch(err){toast(authErr(err))}
  btn.disabled=false;
});

/* ---------- install as an app (PWA) ---------- */
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();S.installEvt=e;renderRail()});
window.addEventListener("appinstalled",()=>{S.installEvt=null;toast("TaskBoard is installed");renderRail()});
function isStandalone(){return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true}
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)}
function canOfferInstall(){return !isStandalone()&&(!!S.installEvt||isIOS())}
async function doInstall(){
  if(S.installEvt){S.installEvt.prompt();try{await S.installEvt.userChoice}catch(e){}S.installEvt=null;renderRail();return}
  closeModal(true);S.modal={type:"ios-install"};renderModal();
}
function iosInstallHtml(){
  return '<div class="scrim" data-act="scrim"><div class="modal narrow" role="dialog" aria-modal="true" aria-labelledby="ios-h"><div class="modal-h"><h2 id="ios-h" style="font-size:18px;flex:1">Install on iPhone or iPad</h2><button class="icon-btn" data-act="close-modal" aria-label="Close">'+ICON.x+'</button></div><div class="modal-b"><ol class="steps"><li>Open this page in Safari.</li><li>Tap the Share button at the bottom of the screen.</li><li>Choose “Add to Home Screen”, then tap Add.</li></ol><p class="muted">TaskBoard then opens from your home screen like any other app.</p></div></div></div>';
}

/* ---------- session start ---------- */
async function startSession(){
  const session=await auth.session().catch(()=>null);
  if(!session){S.myId=null;S.ready=false;if(S.liveOff){S.liveOff();S.liveOff=null}showAuth();return}
  if(S.recovering){showAuth();return}
  S.myId=session.user.id;S.myEmail=session.user.email;
  hideAuth();
  S.myProfile=await api.myProfile(S.myId).catch(()=>null);
  computeRole();
  render();
  if(S.role==="pending"||S.role==="disabled"||!S.myProfile){S.ready=true;startLive();return}
  await loadAll();
  S.ready=true;
  startLive();
  touchLastSeen();
  route();
}
async function boot(){
  if(!configured){
    hideAuth();
    $("#main").innerHTML='<div class="loading"><div style="max-width:520px;text-align:start"><h2 style="margin-bottom:10px">Connect a database to start</h2><p>This app needs a Supabase project. Add these two settings to a <code>.env</code> file (or to your hosting platform\'s environment variables), then reload:</p><pre class="code">VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co\nVITE_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY</pre><p class="muted">Then run <code>supabase/migrations/…_taskboard.sql</code> once in the Supabase SQL Editor. The README has the full steps.</p></div></div>';
    $("#rail").innerHTML="";return;
  }
  auth.onChange((event)=>{
    if(event==="PASSWORD_RECOVERY"){S.recovering=true;S.authView="recovery";S.authMsg=null;showAuth();return}
    if(event==="SIGNED_OUT"){S.myId=null;S.ready=false;S.plans=[];S.tasks=[];S.people=[];closeModal(true);if(S.liveOff){S.liveOff();S.liveOff=null}showAuth();return}
    if(event==="SIGNED_IN"&&!S.myId&&!S.recovering){setTimeout(startSession,0)}
  });
  await startSession();
}
if(isProd&&"serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})})}
applyLang();
render();
boot();
