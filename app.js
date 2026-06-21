// ===== IFRS Dip Tracker — App Logic =====

const JSONBIN_MASTER_KEY = '$2a$10$B96C8MtRfq7iNFn3KKSn1.Yb9a3IYnSEjpPSwoBB2CKccogYuTpVq';
const JSONBIN_BASE = 'https://api.jsonbin.io/v3';
const CHAT_ADMIN_PASSWORD = 'Mossaed@12345'; // غيّرها لكلمة سر الأدمن بتاعتك

const STANDARDS = [
  {id:'s01',name:'IFRS 15 — إيرادات العقود مع العملاء',days:5,color:'#6D28D9'},
  {id:'s02',name:'IAS 16 — الممتلكات والمنشآت والمعدات',days:4,color:'#0D9488'},
  {id:'s03',name:'IAS 40 — الاستثمارات العقارية',days:3,color:'#F43F5E'},
  {id:'s04',name:'IAS 38 — الأصول غير الملموسة',days:3,color:'#EC4899'},
  {id:'s05',name:'IAS 20 — المنح الحكومية',days:2,color:'#F59E0B'},
  {id:'s06',name:'IAS 2 — المخزون',days:3,color:'#6D28D9'},
  {id:'s07',name:'IAS 41 — الزراعة',days:2,color:'#0D9488'},
  {id:'s08',name:'IAS 36 — انخفاض قيمة الأصول',days:4,color:'#F43F5E'},
  {id:'s09',name:'IAS 23 — تكاليف الاقتراض',days:2,color:'#EC4899'},
  {id:'s10',name:'IAS 37 — المخصصات والالتزامات الاحتمالية',days:3,color:'#F59E0B'},
  {id:'s11',name:'IFRS 5 — الأصول غير المتداولة للبيع',days:3,color:'#6D28D9'},
  {id:'s12',name:'IFRS 3 — اندماج الأعمال',days:5,color:'#0D9488'},
  {id:'s13',name:'IFRS 8 — القطاعات التشغيلية',days:2,color:'#F43F5E'},
  {id:'s14',name:'IAS 10 — الأحداث اللاحقة للميزانية',days:2,color:'#EC4899'},
  {id:'s15',name:'IFRS 16 — عقود الإيجار',days:5,color:'#F59E0B'},
  {id:'s16',name:'IAS 33 — ربحية السهم (EPS)',days:3,color:'#6D28D9'},
  {id:'s17',name:'IAS 24 — الإفصاح عن الأطراف ذات العلاقة',days:2,color:'#0D9488'},
  {id:'s18',name:'IFRS 2 — المدفوعات على أساس الأسهم',days:3,color:'#F43F5E'},
  {id:'s19',name:'IFRS S1 & S2 — معايير الاستدامة',days:3,color:'#EC4899'},
  {id:'s20',name:'IAS 21 — آثار تغيرات أسعار صرف العملات',days:3,color:'#F59E0B'},
  {id:'s21',name:'IAS 8 — أسس إعداد القوائم المالية',days:2,color:'#6D28D9'},
  {id:'s22',name:'IFRS 6 — استكشاف الموارد المعدنية',days:2,color:'#0D9488'},
  {id:'s23',name:'IAS 32 + IFRS 7 + IFRS 9 — الأدوات المالية',days:7,color:'#F43F5E'},
  {id:'s24',name:'IAS 28 — الاستثمار في الشركات الزميلة',days:4,color:'#EC4899'},
  {id:'s25',name:'IFRS 11 — الترتيبات المشتركة',days:3,color:'#F59E0B'},
  {id:'s26',name:'IAS 19 — منافع الموظفين',days:4,color:'#6D28D9'},
  {id:'s27',name:'IAS 12 — ضرائب الدخل',days:4,color:'#0D9488'},
  {id:'s28',name:'IFRS 13 — قياس القيمة العادلة',days:3,color:'#F43F5E'},
  {id:'s29',name:'IFRS for SMEs — المنشآت الصغيرة والمتوسطة',days:4,color:'#EC4899'},
  {id:'s30',name:'IFRS 18 — العرض والإفصاح في القوائم المالية',days:3,color:'#F59E0B'},
  {id:'s31',name:'IFRS 19 — الشركات التابعة بدون مساءلة عامة',days:2,color:'#6D28D9'},
  {id:'s32',name:'Workshop — القوائم الموحدة (IFRS 10)',days:5,color:'#0D9488'},
];

const TODAY_AR=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const MONTHS_AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function defaultState(){
  return { startDate:new Date().toISOString().slice(0,10), studyDays:115, reviewDays:45,
    dailyHrs:2.5, unitStatus:{}, logs:[], notifTime:'20:00', notifEnabled:false };
}

let state = defaultState();
let currentUserKey = null;
let currentUserName = null;
let currentBinId = null;
let saveTimer = null;

// ========== HASH ==========
async function deriveKey(name,pin){
  const raw=`ifrs-tracker::${name.trim().toLowerCase()}::${pin.trim()}`;
  const enc=new TextEncoder().encode(raw);
  const buf=await crypto.subtle.digest('SHA-256',enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// ========== SESSION ==========
function saveSession(name,pin,binId){ try{localStorage.setItem('ifrs_session_v1',JSON.stringify({name,pin,binId}));}catch(e){} }
function loadSession(){ try{const s=localStorage.getItem('ifrs_session_v1');return s?JSON.parse(s):null;}catch(e){return null;} }
function clearSession(){ try{localStorage.removeItem('ifrs_session_v1');}catch(e){} }
function cacheLocally(){ if(!currentUserKey)return; try{localStorage.setItem('ifrs_cache_'+currentUserKey,JSON.stringify(state));}catch(e){} }

// ========== FETCH WITH TIMEOUT ==========
async function fetchWithTimeout(url,options={},ms=12000){
  const ctrl=new AbortController();
  const t=setTimeout(()=>ctrl.abort(),ms);
  try{ return await fetch(url,{...options,signal:ctrl.signal}); }
  finally{ clearTimeout(t); }
}

// ========== JSONBIN USERS ==========
let _mainBinIdCache=null;
async function getOrCreateMainBin(){
  if(_mainBinIdCache) return _mainBinIdCache;
  if(window.IFRS_MAIN_BIN_ID){ _mainBinIdCache=window.IFRS_MAIN_BIN_ID; return _mainBinIdCache; }
  let id=localStorage.getItem('ifrs_main_bin_id');
  if(id){ _mainBinIdCache=id; return id; }
  const res=await fetchWithTimeout(`${JSONBIN_BASE}/b`,{method:'POST',headers:{'Content-Type':'application/json','X-Master-Key':JSONBIN_MASTER_KEY,'X-Bin-Name':'ifrs-tracker-all-users'},body:JSON.stringify({users:{}})});
  const json=await res.json(); id=json.metadata.id;
  localStorage.setItem('ifrs_main_bin_id',id); _mainBinIdCache=id;
  return id;
}
async function readAllUsers(){
  const binId=await getOrCreateMainBin();
  const res=await fetchWithTimeout(`${JSONBIN_BASE}/b/${binId}/latest`,{headers:{'X-Master-Key':JSONBIN_MASTER_KEY}});
  if(!res.ok) throw new Error('فشل الاتصال ('+res.status+')');
  const json=await res.json();
  return {binId, users:(json.record&&json.record.users)?json.record.users:{}};
}
async function writeAllUsers(binId,users){
  const res=await fetchWithTimeout(`${JSONBIN_BASE}/b/${binId}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Master-Key':JSONBIN_MASTER_KEY},body:JSON.stringify({users})});
  if(!res.ok) throw new Error('فشل الحفظ ('+res.status+')');
  return res.json();
}

// ========== JSONBIN CHAT ==========
let _chatBinId = null;

async function getOrCreateChatBin(){
  if(_chatBinId) return _chatBinId;
  if(window.IFRS_CHAT_BIN_ID){ _chatBinId=window.IFRS_CHAT_BIN_ID; return _chatBinId; }
  let id=localStorage.getItem('ifrs_chat_bin_id');
  if(id){ _chatBinId=id; return id; }
  const res=await fetchWithTimeout(`${JSONBIN_BASE}/b`,{method:'POST',headers:{'Content-Type':'application/json','X-Master-Key':JSONBIN_MASTER_KEY,'X-Bin-Name':'ifrs-tracker-chat'},body:JSON.stringify({messages:[]})});
  const json=await res.json(); id=json.metadata.id;
  localStorage.setItem('ifrs_chat_bin_id',id); _chatBinId=id;
  console.warn('⚠️ Chat bin created:',id,'— add window.IFRS_CHAT_BIN_ID =',JSON.stringify(id),'to index.html');
  return id;
}
async function readChatMessages(){
  const binId=await getOrCreateChatBin();
  const res=await fetchWithTimeout(`${JSONBIN_BASE}/b/${binId}/latest`,{headers:{'X-Master-Key':JSONBIN_MASTER_KEY}});
  if(!res.ok) throw new Error('chat read failed');
  const json=await res.json();
  return {binId, messages:(json.record&&json.record.messages)?json.record.messages:[]};
}
async function writeChatMessages(binId,messages){
  // keep last 200 messages max
  const trimmed=messages.slice(-200);
  const res=await fetchWithTimeout(`${JSONBIN_BASE}/b/${binId}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Master-Key':JSONBIN_MASTER_KEY},body:JSON.stringify({messages:trimmed})});
  if(!res.ok) throw new Error('chat write failed');
  return res.json();
}

async function deleteChatMessage(msgTs){
  const pwd = prompt('اكتب كلمة سر الأدمن لحذف الرسالة:');
  if(pwd === null) return; // user cancelled
  if(pwd !== CHAT_ADMIN_PASSWORD){
    showToast('كلمة السر غلط ❌');
    return;
  }
  try{
    const {binId, messages} = await readChatMessages();
    const filtered = messages.filter(m => m.ts !== msgTs);
    await writeChatMessages(binId, filtered);
    chatMessages = filtered;
    lastChatCount = filtered.length;
    renderChatMessages();
    showToast('تم حذف الرسالة ✓');
  }catch(e){
    showToast('فشل الحذف. جرب تاني.');
  }
}

// ========== AUTH ==========
function switchAuthTab(tab){
  document.getElementById('tab-login').classList.toggle('active',tab==='login');
  document.getElementById('tab-signup').classList.toggle('active',tab==='signup');
  document.getElementById('auth-submit-btn').dataset.mode=tab;
  document.getElementById('auth-submit-btn').textContent=tab==='login'?'دخول':'إنشاء حساب جديد';
  document.getElementById('auth-error').textContent='';
  document.getElementById('auth-footer').innerHTML=tab==='login'
    ?'مفيش حساب؟ <a onclick="switchAuthTab(\'signup\')">اعمل حساب جديد</a>'
    :'عندك حساب فعلاً؟ <a onclick="switchAuthTab(\'login\')">سجّل دخولك</a>';
}

async function handleAuthSubmit(){
  const name=document.getElementById('auth-email').value.trim();
  const pin=document.getElementById('auth-password').value.trim();
  const errEl=document.getElementById('auth-error');
  const btn=document.getElementById('auth-submit-btn');
  const mode=btn.dataset.mode||'login';
  errEl.textContent='';
  if(!name){errEl.textContent='اكتب اسمك';return;}
  if(!pin||pin.length<4){errEl.textContent='الكود لازم 4 أحرف أو أرقام على الأقل';return;}
  btn.disabled=true; const orig=btn.textContent; btn.textContent='جاري المعالجة...';
  try{
    const userKey=await deriveKey(name,pin);
    const {binId,users}=await readAllUsers();
    const existing=users[userKey];
    if(mode==='signup'){
      if(existing){errEl.textContent='الاسم والكود دول مستخدمين. جرب تسجيل الدخول.';btn.disabled=false;btn.textContent=orig;return;}
      const initial=defaultState(); users[userKey]={name,state:initial};
      await writeAllUsers(binId,users); loginSuccess(userKey,name,binId,initial,pin);
    } else {
      if(!existing){errEl.textContent='مفيش حساب بهذا الاسم والكود.';btn.disabled=false;btn.textContent=orig;return;}
      loginSuccess(userKey,name,binId,{...defaultState(),...existing.state},pin);
    }
  }catch(e){
    console.error(e);
    try{
      const userKey=await deriveKey(name,pin);
      const cached=(()=>{try{const c=localStorage.getItem('ifrs_cache_'+userKey);return c?JSON.parse(c):null;}catch(_){return null;}})();
      if(cached){const s=(()=>{try{const x=localStorage.getItem('ifrs_session_v1');return x?JSON.parse(x):null;}catch(_){return null;}})();
        loginSuccess(userKey,name,s&&s.binId||null,cached,pin);showSyncStatus('offline');showToast('دخول بدون إنترنت');return;}
    }catch(_){}
    errEl.textContent='خطأ في الاتصال. تأكد من النت وجرب تاني.';btn.disabled=false;btn.textContent=orig;
  }
}

function loginSuccess(userKey,name,binId,loadedState,pin){
  currentUserKey=userKey; currentUserName=name; currentBinId=binId; state=loadedState;
  const pinVal=pin||(document.getElementById('auth-password')?document.getElementById('auth-password').value.trim():'');
  saveSession(name,pinVal,binId); cacheLocally();
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('account-name-display').textContent=name;
  const nb=document.getElementById('user-name-badge'); if(nb) nb.textContent=name;
  renderAll(); showSyncStatus('synced');
  if(state.notifEnabled) scheduleNotification();
}

async function logoutUser(){
  if(!confirm('هل تريد تسجيل الخروج؟')) return;
  clearSession(); currentUserKey=null;currentUserName=null;currentBinId=null; state=defaultState();
  stopChatPolling();
  document.getElementById('app').style.display='none';
  document.getElementById('auth-screen').style.display='flex';
  document.getElementById('auth-email').value=''; document.getElementById('auth-password').value='';
}

async function initAuth(){
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('app').style.display='none';
  const session=loadSession();
  if(session&&session.name&&session.pin){
    try{
      const userKey=await deriveKey(session.name,session.pin);
      const {binId,users}=await readAllUsers();
      const existing=users[userKey];
      if(existing){ loginSuccess(userKey,session.name,binId,{...defaultState(),...existing.state},session.pin); return; }
      const cached=(()=>{try{const c=localStorage.getItem('ifrs_cache_'+userKey);return c?JSON.parse(c):null;}catch(_){return null;}})();
      if(cached){loginSuccess(userKey,session.name,session.binId||binId,cached,session.pin);showSyncStatus('offline');return;}
    }catch(e){
      console.error('Auto-login failed',e);
      try{
        const userKey=await deriveKey(session.name,session.pin);
        const cached=(()=>{try{const c=localStorage.getItem('ifrs_cache_'+userKey);return c?JSON.parse(c):null;}catch(_){return null;}})();
        if(cached){loginSuccess(userKey,session.name,null,cached,session.pin);showSyncStatus('offline');return;}
      }catch(_){}
    }
  }
  document.getElementById('login-screen').style.display='none';
  document.getElementById('auth-screen').style.display='flex';
}

// ========== SYNC STATUS ==========
function showSyncStatus(status){
  const el=document.getElementById('sync-badge'); if(!el) return;
  const map={saving:'⏳ بيحفظ...',synced:'☁️ محفوظ',offline:'⚠️ غير متصل'};
  const sp=el.querySelector('span'); if(sp) sp.textContent=map[status]||'';
  el.className='sync-badge sync-'+status;
}

function save(){
  cacheLocally();
  if(!currentUserKey||!currentBinId) return;
  if(saveTimer) clearTimeout(saveTimer);
  showSyncStatus('saving');
  saveTimer=setTimeout(async()=>{
    try{
      const {binId,users}=await readAllUsers();
      users[currentUserKey]={name:currentUserName,state};
      await writeAllUsers(binId,users); showSyncStatus('synced');
    }catch(e){ console.error('Save failed',e); showSyncStatus('offline'); }
  },900);
}

// ========== DATE HELPERS ==========
function dateStr(d){return d.toISOString().slice(0,10);}
function addDays(ds,n){const d=new Date(ds);d.setDate(d.getDate()+n);return d;}
function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/86400000);}
function todayStr(){return dateStr(new Date());}

function computeSchedule(){
  let cursor=new Date(state.startDate);
  return STANDARDS.map(s=>{
    const from=dateStr(cursor); const to=dateStr(addDays(from,s.days-1));
    cursor=addDays(to,1); return {...s,from,to};
  });
}

function getTodayTask(sched){
  const today=todayStr();
  const active=sched.find(s=>s.from<=today&&s.to>=today);
  if(active) return active;
  const upcoming=sched.find(s=>s.from>today);
  if(upcoming) return {...upcoming,upcoming:true};
  return null;
}

function getStreak(){
  const days=new Set(state.logs.map(l=>l.date)); let streak=0;
  for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);if(days.has(dateStr(d)))streak++;else if(i>0)break;}
  return streak;
}

function getWeekLogs(){
  const days={};
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days[dateStr(d)]=state.logs.filter(l=>l.date===dateStr(d));}
  return days;
}

function getWeekHrs(){
  const d=new Date();d.setDate(d.getDate()-6);const start=dateStr(d);
  return state.logs.filter(l=>l.date>=start).reduce((a,l)=>a+parseFloat(l.hrs),0);
}

function getMonthLogs(){const ym=todayStr().slice(0,7);return state.logs.filter(l=>l.date.startsWith(ym));}
function getDoneCount(){return Object.values(state.unitStatus).filter(v=>v==='done').length;}
function getTotalHrs(){return state.logs.reduce((a,l)=>a+parseFloat(l.hrs),0);}

function showToast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}

// ========== RENDER TODAY ==========
function renderToday(){
  const sched=computeSchedule(); const task=getTodayTask(sched); const today=new Date();
  document.getElementById('topdate').textContent=TODAY_AR[today.getDay()]+' '+today.getDate()+' '+MONTHS_AR[today.getMonth()];
  const hero=document.getElementById('today-hero');
  if(task){
    const dayNum=daysBetween(state.startDate,todayStr())+1;
    const inStudy=dayNum<=state.studyDays;
    const phase=inStudy?'مرحلة المذاكرة':'مرحلة المراجعة';
    const phaseDay=inStudy?dayNum:dayNum-state.studyDays;
    const phaseTotal=inStudy?state.studyDays:state.reviewDays;
    const pct=Math.max(0,Math.min(100,Math.round(phaseDay/phaseTotal*100)));
    const status=state.unitStatus[task.id]||'todo';
    const statusMap={todo:'لم يبدأ',active:'جاري',done:'مكتمل ✓',review:'مراجعة'};
    hero.innerHTML=`<div class="hero-phase">${phase} — اليوم ${dayNum}</div>
      <div class="hero-task">${task.upcoming?'<span style="font-size:10px;background:rgba(255,255,255,0.3);padding:2px 8px;border-radius:8px;margin-left:6px">قادماً</span>':''}${task.name}</div>
      <div class="hero-chips"><span class="hero-chip">📅 ${task.from} — ${task.to}</span><span class="hero-chip">⏱ ${task.days} أيام</span><span class="hero-chip">${statusMap[status]}</span></div>
      <div class="hero-bar-wrap"><div class="hero-bar-fill" style="width:${pct}%"></div></div>
      <div class="hero-pct-lbl">${phase}: ${pct}%</div>`;
  } else {
    hero.innerHTML='<div style="font-size:15px;font-weight:700;position:relative;z-index:1">🎉 أكملت كل المعايير!</div>';
  }
  const dayNum=daysBetween(state.startDate,todayStr())+1;
  document.getElementById('days-left-study').textContent=Math.max(0,state.studyDays-dayNum+1);
  document.getElementById('streak-val').textContent=getStreak();
  document.getElementById('week-hrs').textContent=getWeekHrs().toFixed(1);
  document.getElementById('done-count').textContent=getDoneCount();
  const sel=document.getElementById('log-unit'); sel.innerHTML='';
  STANDARDS.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.name.slice(0,42);sel.appendChild(o);});
  if(task) sel.value=task.id;
  const recent=[...state.logs].reverse().slice(0,5);
  const rl=document.getElementById('recent-logs');
  if(!recent.length){rl.innerHTML='<div class="empty-state">لا توجد إنجازات مسجلة بعد<br>سجّل أول جلسة مذاكرة دلوقتي 👆</div>';}
  else{rl.innerHTML=recent.map(l=>{const s=STANDARDS.find(x=>x.id===l.unitId);const sl={active:'جاري',done:'مكتمل',review:'مراجعة'};
    return`<div class="log-item"><div class="log-dot" style="background:${s?s.color:'#888'}"></div><div class="log-info"><div class="log-name">${s?s.name.split('—')[0].trim():l.unitId}</div><div class="log-meta">${l.date} · ${sl[l.status]||''} ${l.note?'· '+l.note:''}</div></div><div class="log-hrs">${parseFloat(l.hrs).toFixed(1)}س</div></div>`;}).join('');}
  renderTimer(); renderWeekSummary(); renderMonthSummary();
}

function renderWeekSummary(){
  const wl=getWeekLogs();const th=Object.values(wl).flat().reduce((a,l)=>a+parseFloat(l.hrs),0);
  const sd=Object.values(wl).filter(v=>v.length>0).length;const target=state.dailyHrs*7;
  const pct=Math.min(100,Math.round(th/target*100));const un=[...new Set(Object.values(wl).flat().map(l=>l.unitId))];
  document.getElementById('week-summary').innerHTML=`<div class="summary-row">
    <div class="summary-item"><div class="num" style="color:var(--turquoise)">${th.toFixed(1)}</div><div class="lbl">ساعة من ${target.toFixed(0)}</div></div>
    <div class="summary-item"><div class="num" style="color:var(--turquoise)">${sd}</div><div class="lbl">أيام ذاكرت</div></div>
    <div class="summary-item"><div class="num" style="color:var(--turquoise)">${un.length}</div><div class="lbl">معيار هذا الأسبوع</div></div></div>
    <div style="height:7px;background:var(--bg-soft);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--grad-turq);border-radius:4px"></div></div>
    <div style="font-size:11px;color:var(--text-secondary);margin-top:5px;font-weight:600">${pct}% من الهدف الأسبوعي</div>`;
}

function renderMonthSummary(){
  const ml=getMonthLogs();const th=ml.reduce((a,l)=>a+parseFloat(l.hrs),0);
  const sd=[...new Set(ml.map(l=>l.date))].length;const today=new Date();
  const dim=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
  const target=state.dailyHrs*dim;const pct=Math.min(100,Math.round(th/target*100));
  const un=[...new Set(ml.map(l=>l.unitId))];
  document.getElementById('month-summary').innerHTML=`<div class="summary-row">
    <div class="summary-item"><div class="num" style="color:var(--coral)">${th.toFixed(1)}</div><div class="lbl">ساعة من ${target.toFixed(0)}</div></div>
    <div class="summary-item"><div class="num" style="color:var(--coral)">${sd}</div><div class="lbl">أيام ذاكرت</div></div>
    <div class="summary-item"><div class="num" style="color:var(--coral)">${un.length}</div><div class="lbl">معيار هذا الشهر</div></div></div>
    <div style="height:7px;background:var(--bg-soft);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--grad-coral);border-radius:4px"></div></div>
    <div style="font-size:11px;color:var(--text-secondary);margin-top:5px;font-weight:600">${pct}% من الهدف الشهري — ${MONTHS_AR[today.getMonth()]}</div>`;
}

// ========== RENDER SCHEDULE ==========
function renderSchedule(){
  const sched=computeSchedule();const today=todayStr();
  const studyEnd=dateStr(addDays(state.startDate,state.studyDays-1));
  const examDate=dateStr(addDays(state.startDate,state.studyDays+state.reviewDays-1));
  const inStudy=today<=studyEnd;const pi=document.getElementById('phase-info');
  if(inStudy){const dLeft=daysBetween(today,studyEnd)+1;pi.innerHTML=`<strong>📘 مرحلة المذاكرة</strong> — متبقي ${dLeft} يوم حتى ${studyEnd}<br>بعدها: 45 يوم مراجعة وحل امتحانات حتى ${examDate}`;pi.style.background='#D7F5E9';pi.style.color='#0E8050';}
  else{const dLeft=daysBetween(today,examDate)+1;pi.innerHTML=`<strong>📝 مرحلة المراجعة والامتحانات</strong> — متبقي ${dLeft} يوم حتى ${examDate}`;pi.style.background='#FFE8D1';pi.style.color='#B9560A';}
  const studyStds=sched.filter(s=>s.from<=studyEnd);
  let html='<div class="section-title"><span class="dot" style="background:var(--purple)"></span>مرحلة المذاكرة — 115 يوم</div>';
  studyStds.forEach((s,i)=>{
    const status=state.unitStatus[s.id]||'todo';const isPast=s.to<today;const isCurrent=s.from<=today&&s.to>=today;
    const sm={todo:'لم يبدأ',active:'جاري',done:'مكتمل',review:'مراجعة'};const sc={todo:'s-todo',active:'s-active',done:'s-done',review:'s-review'};
    html+=`<div class="std-card ${isCurrent?'current':''}" style="opacity:${isPast&&status!=='done'?0.55:1}">
      <div class="std-num" style="color:${s.color}">${String(i+1).padStart(2,'0')}</div>
      <div class="std-info"><div class="std-name">${isCurrent?'<span class="today-tag">اليوم</span>':''}${s.name}</div><div class="std-dates">${s.from} — ${s.to} (${s.days} أيام)</div></div>
      <button class="status-pill ${sc[status]}" onclick="cycleStatus('${s.id}')">${sm[status]}</button></div>`;
  });
  html+='<div class="section-title"><span class="dot" style="background:var(--amber)"></span>مرحلة المراجعة — 45 يوم</div>';
  html+=`<div class="std-card" style="background:linear-gradient(135deg,#FFF7ED,#FFF1E0)">
    <div class="std-num" style="color:var(--amber)">📚</div>
    <div class="std-info"><div class="std-name">مراجعة شاملة + حل امتحانات Past Papers</div><div class="std-dates">${dateStr(addDays(studyEnd,1))} — ${examDate}</div></div></div>`;
  document.getElementById('schedule-list').innerHTML=html;
}

function cycleStatus(id){
  const cur=state.unitStatus[id]||'todo';const next={todo:'active',active:'done',done:'review',review:'todo'};
  state.unitStatus[id]=next[cur]||'active'; save(); renderAll(); showToast('تم تحديث الحالة ✓');
}

// ========== RENDER PROGRESS ==========
function renderProgress(){
  const done=getDoneCount();const total=STANDARDS.length;const pct=Math.round(done/total*100);
  document.getElementById('big-pct').textContent=pct+'%';
  document.getElementById('main-prog').style.width=pct+'%';
  document.getElementById('prog-done-lbl').textContent=done+' معيار من '+total;
  document.getElementById('prog-hrs-lbl').textContent=getTotalHrs().toFixed(1)+' ساعة';
  const studiedSet=new Set(state.logs.map(l=>l.date));const dayNames=['أح','إث','ثل','أر','خم','جم','سب'];
  let ws='';
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dateStr(d);const studied=studiedSet.has(k);const isToday=i===0;const cls=studied?'w-studied':isToday?'w-today':'w-miss';
    ws+=`<div class="wday"><div class="wday-dot ${cls}">${d.getDate()}</div><div class="wday-lbl">${dayNames[d.getDay()]}</div></div>`;}
  document.getElementById('week-strip').innerHTML=ws;
  renderBarChart(); renderDonutChart();
  let spHtml='';
  STANDARDS.forEach(s=>{
    const status=state.unitStatus[s.id]||'todo';const unitHrs=state.logs.filter(l=>l.unitId===s.id).reduce((a,l)=>a+parseFloat(l.hrs),0);
    const pct2=status==='done'?100:Math.min(90,Math.round(unitHrs/(s.days*state.dailyHrs)*100));
    const sc={todo:'s-todo',active:'s-active',done:'s-done',review:'s-review'};const sm={todo:'لم يبدأ',active:'جاري',done:'مكتمل',review:'مراجعة'};
    spHtml+=`<div class="std-prog-row"><div class="spr-top"><span class="spr-name">${s.name}</span><span class="status-pill ${sc[status]}" style="font-size:9.5px;padding:3px 8px">${sm[status]}</span></div>
      <div style="display:flex;align-items:center;gap:8px"><div class="spr-bar-wrap"><div class="spr-bar-fill" style="width:${pct2}%;background:${s.color}"></div></div><span class="spr-hrs">${unitHrs.toFixed(1)}س</span></div></div>`;
  });
  document.getElementById('std-progress-list').innerHTML=spHtml;
}

function renderBarChart(){
  const svg=document.getElementById('bar-chart');const days=[];
  for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=dateStr(d);const hrs=state.logs.filter(l=>l.date===k).reduce((a,l)=>a+parseFloat(l.hrs),0);days.push({date:d,hrs});}
  const maxHrs=Math.max(3,...days.map(d=>d.hrs));const w=320,h=140,padBottom=20,padTop=10;
  const barW=(w/14)*0.6;const gap=(w/14)*0.4;let bars='';
  days.forEach((d,i)=>{
    const x=i*(w/14)+gap/2;const barH=d.hrs>0?Math.max(3,(d.hrs/maxHrs)*(h-padBottom-padTop)):0;const y=h-padBottom-barH;const isToday=i===13;
    const color=d.hrs>=state.dailyHrs?'#0D9488':d.hrs>0?'#F59E0B':'#E8E4F3';
    bars+=`<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${isToday?'#6D28D9':color}"/>`;
    if(i%2===0||isToday) bars+=`<text x="${x+barW/2}" y="${h-4}" font-size="8" fill="#6B6480" text-anchor="middle" font-family="Outfit">${d.date.getDate()}</text>`;
  });
  const targetY=h-padBottom-((state.dailyHrs/maxHrs)*(h-padBottom-padTop));
  bars+=`<line x1="0" y1="${targetY}" x2="${w}" y2="${targetY}" stroke="#F43F5E" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>`;
  bars+=`<text x="${w-2}" y="${targetY-4}" font-size="7.5" fill="#F43F5E" text-anchor="end" font-family="Cairo" font-weight="600">الهدف اليومي</text>`;
  svg.innerHTML=bars;
}

function renderDonutChart(){
  const svg=document.getElementById('donut-chart');const legend=document.getElementById('donut-legend');
  const hrsPerUnit=STANDARDS.map(s=>({...s,hrs:state.logs.filter(l=>l.unitId===s.id).reduce((a,l)=>a+parseFloat(l.hrs),0)})).filter(s=>s.hrs>0).sort((a,b)=>b.hrs-a.hrs);
  if(!hrsPerUnit.length){svg.innerHTML=`<circle cx="100" cy="100" r="70" fill="none" stroke="#E8E4F3" stroke-width="22"/><text x="100" y="104" font-size="13" fill="#6B6480" text-anchor="middle" font-family="Cairo">لا توجد بيانات</text>`;legend.innerHTML='<div class="empty-state" style="padding:8px">سجّل أول جلسة</div>';return;}
  const top=hrsPerUnit.slice(0,6);const othersHrs=hrsPerUnit.slice(6).reduce((a,s)=>a+s.hrs,0);
  const segments=othersHrs>0?[...top,{name:'أخرى',color:'#CBD5E1',hrs:othersHrs}]:top;
  const total=segments.reduce((a,s)=>a+s.hrs,0);const cx=100,cy=100,r=70,strokeW=26;const circumference=2*Math.PI*r;
  let offset=0;let paths='';
  segments.forEach(s=>{const frac=s.hrs/total;const len=frac*circumference;
    paths+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${strokeW}" stroke-dasharray="${len} ${circumference-len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"/>`;offset+=len;});
  svg.innerHTML=paths+`<text x="${cx}" y="${cy-4}" font-size="22" fill="#1E1B2E" text-anchor="middle" font-family="Outfit" font-weight="700">${total.toFixed(0)}</text><text x="${cx}" y="${cy+16}" font-size="10" fill="#6B6480" text-anchor="middle" font-family="Cairo" font-weight="600">ساعة</text>`;
  legend.innerHTML=segments.map(s=>{const pct=Math.round(s.hrs/total*100);const sn=s.name.includes('—')?s.name.split('—')[0].trim():s.name;
    return`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11.5px"><div style="width:9px;height:9px;border-radius:3px;background:${s.color};flex-shrink:0"></div><span style="flex:1;color:var(--text-primary);font-weight:600">${sn}</span><span style="color:var(--text-secondary);font-family:Outfit">${s.hrs.toFixed(1)}س · ${pct}%</span></div>`;}).join('');
}

// ========== RENDER SETTINGS ==========
function renderSettings(){
  document.getElementById('set-start').value=state.startDate;
  document.getElementById('set-study-days').value=state.studyDays;
  document.getElementById('set-review-days').value=state.reviewDays;
  document.getElementById('set-daily-hrs').value=state.dailyHrs;
  document.getElementById('notif-time').value=state.notifTime;
  const studyEnd=dateStr(addDays(state.startDate,state.studyDays-1));
  const examDate=dateStr(addDays(state.startDate,state.studyDays+state.reviewDays-1));
  document.getElementById('calc-end-study').textContent=studyEnd;
  document.getElementById('calc-exam').textContent=examDate;
  document.getElementById('calc-total-hrs').textContent=(state.studyDays*state.dailyHrs).toFixed(0)+' ساعة';
  updateNotifBadge();
}

function saveSetting(){
  state.startDate=document.getElementById('set-start').value||state.startDate;
  state.studyDays=parseInt(document.getElementById('set-study-days').value)||115;
  state.reviewDays=parseInt(document.getElementById('set-review-days').value)||45;
  state.dailyHrs=parseFloat(document.getElementById('set-daily-hrs').value)||2.5;
  save(); renderSettings();
}

function addLog(){
  const unitId=document.getElementById('log-unit').value;const hrs=parseFloat(document.getElementById('log-hrs').value)||2;
  const note=document.getElementById('log-note').value.trim();const status=document.getElementById('log-status').value;
  state.logs.push({unitId,hrs,note,status,date:todayStr(),ts:Date.now()});
  if(status==='done') state.unitStatus[unitId]='done';
  else if(status==='active'&&state.unitStatus[unitId]!=='done') state.unitStatus[unitId]='active';
  document.getElementById('log-note').value=''; save(); renderAll(); showToast('تم حفظ الإنجاز ✓');
}

function resetAll(){
  if(confirm('هل أنت متأكد؟ سيتم مسح كل بياناتك!')){state=defaultState();save();renderAll();showToast('تم مسح البيانات');}
}

// ========== NAV ==========
let currentSec='today';
function go(sec){
  document.querySelectorAll('.nav-btn').forEach((b,i)=>{const secs=['today','schedule','progress','chat','settings'];b.classList.toggle('active',secs[i]===sec);});
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.getElementById('sec-'+sec).classList.add('active');
  currentSec=sec;
  if(sec==='schedule') renderSchedule();
  if(sec==='progress') renderProgress();
  if(sec==='settings') renderSettings();
  if(sec==='chat'){ initChat(); }
}

function renderAll(){
  renderToday();
  if(currentSec==='schedule') renderSchedule();
  if(currentSec==='progress') renderProgress();
  if(currentSec==='settings') renderSettings();
}

// ========== NOTIFICATIONS ==========
function updateNotifBadge(){
  const badge=document.getElementById('notif-status-badge');const dot=document.getElementById('bell-dot');
  if(state.notifEnabled&&Notification.permission==='granted'){badge.innerHTML='✓ مفعّل — يوميًا الساعة '+state.notifTime;badge.style.background='rgba(255,255,255,0.3)';dot.style.display='none';}
  else{badge.innerHTML='● غير مفعّل';dot.style.display='block';}
}

async function enableNotifications(){
  state.notifTime=document.getElementById('notif-time').value||'20:00'; save();
  if(!('Notification' in window)){showToast('المتصفح ده مش بيدعم التنبيهات');return;}
  let permission=Notification.permission;
  if(permission!=='granted') permission=await Notification.requestPermission();
  if(permission==='granted'){state.notifEnabled=true;save();updateNotifBadge();showToast('تم تفعيل التنبيه اليومي ✓');scheduleNotification();}
  else showToast('محتاج تسمح بالتنبيهات من إعدادات المتصفح');
}

let notifTimeoutId=null;
function scheduleNotification(){
  if(notifTimeoutId) clearTimeout(notifTimeoutId);if(!state.notifEnabled) return;
  const [hh,mm]=state.notifTime.split(':').map(Number);const now=new Date();let target=new Date();
  target.setHours(hh,mm,0,0);if(target<=now) target.setDate(target.getDate()+1);
  notifTimeoutId=setTimeout(()=>{fireStudyNotification();scheduleNotification();},target-now);
}

function fireStudyNotification(){
  const sched=computeSchedule();const task=getTodayTask(sched);
  const title='⏰ وقت مذاكرة IFRS Dip!';const body=task?`النهارده: ${task.name}`:'افتح التطبيق وسجّل تقدمك';
  if('serviceWorker' in navigator&&navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(reg=>{reg.showNotification(title,{body,icon:'icon-192.png',badge:'icon-192.png',vibrate:[200,100,200],tag:'ifrs-daily-reminder'});});}
  else if(Notification.permission==='granted') new Notification(title,{body,icon:'icon-192.png'});
}

// ========== STUDY TIMER (pause/resume) ==========
let timerInterval=null;
let timerEndTime=null;
let timerRunning=false;
let timerPaused=false;
let timerRemainingMs=0;
let timerDurationMs=0;

function renderTimer(){
  const container=document.getElementById('study-timer-section');if(!container) return;
  if(!timerRunning&&!timerPaused){
    const hrs=state.dailyHrs||2;
    container.innerHTML=`<div style="background:white;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:var(--shadow-card);border:1.5px solid var(--border)">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#6D28D9" stroke-width="2.3"/><path d="M12 7V12L15 14" stroke="#6D28D9" stroke-width="2.3" stroke-linecap="round"/></svg>
        مؤقت المذاكرة
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <label style="font-size:12px;color:var(--text-secondary);font-weight:600;min-width:62px">المدة</label>
        <select id="timer-hrs-select" style="flex:1;padding:9px 11px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg-soft);color:var(--text-primary);font-size:13px;font-family:'Cairo',sans-serif;direction:rtl">
          <option value="0.5">30 دقيقة</option>
          <option value="1">ساعة</option>
          <option value="1.5">ساعة ونص</option>
          <option value="2" ${hrs<=2?'selected':''}>ساعتين</option>
          <option value="2.5" ${hrs==2.5?'selected':''}>ساعتين ونص</option>
          <option value="3" ${hrs>=3?'selected':''}>3 ساعات</option>
        </select>
      </div>
      <button onclick="startTimer()" style="width:100%;padding:13px;border:none;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#EC4899);color:white;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:'Cairo',sans-serif;box-shadow:0 4px 14px rgba(109,40,217,0.3)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill="white"/></svg>
        ابدأ المذاكرة
      </button>
    </div>`;
    return;
  }
  const remaining=timerPaused?timerRemainingMs:Math.max(0,timerEndTime-Date.now());
  const total=timerDurationMs;const pct=Math.round((1-remaining/total)*100);
  const mins=Math.floor(remaining/60000);const secs=Math.floor((remaining%60000)/1000);
  const hh=Math.floor(mins/60);const mm=mins%60;
  const timeStr=hh>0?`${hh}:${String(mm).padStart(2,'0')}:${String(secs).padStart(2,'0')}`:`${String(mm).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const circumference=2*Math.PI*45;const dashOffset=circumference*(1-pct/100);
  const isPaused=timerPaused;
  container.innerHTML=`<div style="background:white;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:var(--shadow-card);border:1.5px solid ${isPaused?'var(--amber)':'var(--border)'}">
    <div style="font-size:14px;font-weight:700;margin-bottom:14px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="${isPaused?'#F59E0B':'#6D28D9'}" stroke-width="2.3"/><path d="M12 7V12L15 14" stroke="${isPaused?'#F59E0B':'#6D28D9'}" stroke-width="2.3" stroke-linecap="round"/></svg>
      ${isPaused?'⏸ متوقف مؤقتاً':'جلسة مذاكرة جارية...'}
    </div>
    <div style="display:flex;align-items:center;gap:16px">
      <div style="position:relative;width:110px;height:110px;flex-shrink:0">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="45" fill="none" stroke="#F3F0FA" stroke-width="8"/>
          <circle cx="55" cy="55" r="45" fill="none" stroke="url(#tgrad)" stroke-width="8"
            stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
            stroke-linecap="round" transform="rotate(-90 55 55)" style="transition:stroke-dashoffset 1s linear"/>
          <defs><linearGradient id="tgrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${isPaused?'#F59E0B':'#6D28D9'}"/><stop offset="100%" stop-color="${isPaused?'#F43F5E':'#EC4899'}"/>
          </linearGradient></defs>
          <text x="55" y="50" font-size="18" font-weight="700" text-anchor="middle" fill="#1E1B2E" font-family="Outfit">${timeStr}</text>
          <text x="55" y="68" font-size="9" text-anchor="middle" fill="#6B6480" font-family="Cairo">متبقي</text>
        </svg>
      </div>
      <div style="flex:1">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;font-weight:600">${pct}% مكتمل</div>
        <div style="height:7px;background:var(--bg-soft);border-radius:4px;overflow:hidden;margin-bottom:10px">
          <div style="height:100%;width:${pct}%;background:${isPaused?'linear-gradient(135deg,#F59E0B,#F43F5E)':'linear-gradient(135deg,#6D28D9,#EC4899)'};border-radius:4px;transition:width 1s linear"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <button onclick="${isPaused?'resumeTimer()':'pauseTimer()'}" style="padding:9px;border:1.5px solid var(--border);border-radius:10px;background:white;color:${isPaused?'#0D9488':'#F59E0B'};font-size:12px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif">
            ${isPaused?'▶ كمّل':'⏸ وقف'}
          </button>
          <button onclick="stopTimer()" style="padding:9px;border:1.5px solid var(--border);border-radius:10px;background:white;color:#F43F5E;font-size:12px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif">
            ⏹ إنهاء
          </button>
        </div>
      </div>
    </div>
  </div>`;
  if(!isPaused&&remaining===0) timerDone();
}

function startTimer(){
  const sel=document.getElementById('timer-hrs-select');
  const hrs=parseFloat(sel?sel.value:state.dailyHrs);
  timerDurationMs=hrs*3600000; timerEndTime=Date.now()+timerDurationMs;
  timerRunning=true; timerPaused=false; timerRemainingMs=0;
  renderTimer();
  if(timerInterval) clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    if(!timerPaused){renderTimer();if(Date.now()>=timerEndTime){clearInterval(timerInterval);timerDone();}}
  },1000);
}

function pauseTimer(){
  if(!timerRunning) return;
  timerRemainingMs=Math.max(0,timerEndTime-Date.now());
  timerPaused=true; timerRunning=false;
  clearInterval(timerInterval); renderTimer();
}

function resumeTimer(){
  if(!timerPaused) return;
  timerEndTime=Date.now()+timerRemainingMs;
  timerRunning=true; timerPaused=false;
  if(timerInterval) clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    if(!timerPaused){renderTimer();if(Date.now()>=timerEndTime){clearInterval(timerInterval);timerDone();}}
  },1000);
  renderTimer();
}

function stopTimer(){
  clearInterval(timerInterval); timerRunning=false; timerPaused=false;
  timerRemainingMs=0; timerInterval=null; renderTimer();
}

function timerDone(){
  timerRunning=false; timerPaused=false; clearInterval(timerInterval);
  if(Notification.permission==='granted') new Notification('🎉 انتهت جلسة المذاكرة!',{body:'أحسنت! لا تنسى تسجل إنجازك.',icon:'icon-192.png'});
  showToast('🎉 انتهت الجلسة! سجّل إنجازك دلوقتي'); renderTimer();
}

// ========== CHAT ==========
let chatMessages=[];
let chatBinId=null;
let chatPollInterval=null;
let lastChatCount=0;
let chatAttachment=null; // {type:'image'|'pdf', name, data:base64, mimeType}

function stopChatPolling(){ if(chatPollInterval){clearInterval(chatPollInterval);chatPollInterval=null;} }

async function initChat(){
  const el=document.getElementById('chat-messages');
  if(el) el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:13px">جاري تحميل الشات...</div>';
  try{
    const result=await readChatMessages();
    chatBinId=result.binId; chatMessages=result.messages; lastChatCount=chatMessages.length;
    renderChatMessages();
    stopChatPolling();
    chatPollInterval=setInterval(async()=>{
      if(currentSec!=='chat') return;
      try{
        const r=await readChatMessages();
        if(r.messages.length!==lastChatCount){chatMessages=r.messages;lastChatCount=chatMessages.length;renderChatMessages();}
      }catch(_){}
    },8000);
  }catch(e){
    if(el) el.innerHTML='<div style="text-align:center;padding:20px;color:var(--coral);font-size:13px">خطأ في تحميل الشات. تأكد من النت.</div>';
  }
}

function renderChatMessages(){
  const el=document.getElementById('chat-messages');if(!el) return;
  if(!chatMessages.length){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-secondary);font-size:13px;line-height:1.8">لا توجد رسائل بعد 💬<br>كن أول من يكتب!</div>';return;}
  el.innerHTML=chatMessages.map(m=>{
    const isMe=m.userKey===currentUserKey;
    const timeStr=new Date(m.ts).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
    let contentHtml='';
    if(m.type==='image'){
      contentHtml=`<img src="${m.data}" alt="صورة" style="max-width:200px;max-height:200px;border-radius:10px;display:block;cursor:pointer" onclick="window.open('${m.data}','_blank')"/>`;
    } else if(m.type==='pdf'){
      contentHtml=`<a href="${m.data}" download="${m.fileName||'file.pdf'}" style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.08);padding:10px 12px;border-radius:10px;text-decoration:none;color:inherit">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div><div style="font-size:12px;font-weight:700">${m.fileName||'ملف PDF'}</div><div style="font-size:10px;opacity:0.7">اضغط للتحميل</div></div></a>`;
    } else {
      contentHtml=`<div style="font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(m.text||'')}</div>`;
    }
    return`<div style="display:flex;flex-direction:${isMe?'row-reverse':'row'};align-items:flex-end;gap:8px;margin-bottom:14px">
      <div style="width:32px;height:32px;border-radius:50%;background:${isMe?'var(--grad-hero)':'linear-gradient(135deg,#0D9488,#5EEAD4)'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0">
        ${(m.userName||'?').charAt(0).toUpperCase()}
      </div>
      <div style="max-width:70%;position:relative">
        ${!isMe?`<div style="font-size:10.5px;color:var(--text-secondary);margin-bottom:3px;font-weight:600;padding-${isMe?'left':'right'}:4px">${escapeHtml(m.userName||'')}</div>`:''}
        <div style="background:${isMe?'var(--grad-hero)':'white'};color:${isMe?'white':'var(--text-primary)'};padding:10px 13px;border-radius:${isMe?'16px 4px 16px 16px':'4px 16px 16px 16px'};box-shadow:var(--shadow-card);border:${isMe?'none':'1.5px solid var(--border)'}">${contentHtml}</div>
        <div style="display:flex;align-items:center;gap:6px;justify-content:${isMe?'flex-start':'flex-end'};margin-top:3px;padding:0 4px">
          <button onclick="deleteChatMessage(${m.ts})" title="حذف الرسالة (أدمن فقط)" style="border:none;background:none;cursor:pointer;color:var(--text-secondary);opacity:0.5;padding:2px;display:flex;align-items:center">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M3 6H21M19 6L18 20A2 2 0 0116 22H8A2 2 0 016 20L5 6M10 6V4A2 2 0 0112 2H12A2 2 0 0114 4V6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <span style="font-size:9.5px;color:var(--text-secondary)">${timeStr}</span>
        </div>
      </div>
    </div>`;
  }).join('');
  el.scrollTop=el.scrollHeight;
}

function escapeHtml(str){ return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function sendChatMessage(){
  const input=document.getElementById('chat-input');
  const text=(input?input.value.trim():'');
  if(!text&&!chatAttachment) return;
  if(!chatBinId){showToast('الشات جاري التحميل...'); return;}

  const btn=document.getElementById('chat-send-btn');
  if(btn){btn.disabled=true;btn.textContent='...';}

  try{
    let msg={userKey:currentUserKey,userName:currentUserName,ts:Date.now()+Math.random()};
    if(chatAttachment){
      msg.type=chatAttachment.type; msg.data=chatAttachment.data;
      if(chatAttachment.name) msg.fileName=chatAttachment.name;
      if(text) msg.text=text;
      clearAttachment();
    } else {
      msg.type='text'; msg.text=text;
    }
    const {binId,messages}=await readChatMessages();
    chatBinId=binId; messages.push(msg);
    await writeChatMessages(binId,messages);
    chatMessages=messages; lastChatCount=messages.length;
    if(input) input.value='';
    renderChatMessages();
  }catch(e){showToast('فشل الإرسال. جرب تاني.');}
  finally{ if(btn){btn.disabled=false;btn.textContent='إرسال';} }
}

function handleFileAttach(event){
  const file=event.target.files[0];if(!file) return;
  const maxSize=900*1024; // 900KB limit for JSONBin
  if(file.size>maxSize){showToast('الملف كبير جداً! الحد الأقصى 900KB');event.target.value='';return;}
  const isImage=file.type.startsWith('image/');const isPDF=file.type==='application/pdf';
  if(!isImage&&!isPDF){showToast('فقط صور وملفات PDF مدعومة');event.target.value='';return;}
  const reader=new FileReader();
  reader.onload=e=>{
    chatAttachment={type:isImage?'image':'pdf',name:file.name,data:e.target.result,mimeType:file.type};
    renderAttachmentPreview();
  };
  reader.readAsDataURL(file);
  event.target.value='';
}

function renderAttachmentPreview(){
  const prev=document.getElementById('chat-attachment-preview');if(!prev) return;
  if(!chatAttachment){prev.innerHTML='';prev.style.display='none';return;}
  prev.style.display='flex';
  if(chatAttachment.type==='image'){
    prev.innerHTML=`<img src="${chatAttachment.data}" style="height:60px;border-radius:8px;object-fit:cover"/>
      <div style="flex:1;font-size:12px;font-weight:600;color:var(--text-primary)">${chatAttachment.name}</div>
      <button onclick="clearAttachment()" style="border:none;background:none;cursor:pointer;font-size:18px;color:var(--coral)">✕</button>`;
  } else {
    prev.innerHTML=`<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#6D28D9" stroke-width="2"/><polyline points="14,2 14,8 20,8" stroke="#6D28D9" stroke-width="2"/></svg>
      <div style="flex:1;font-size:12px;font-weight:600;color:var(--text-primary)">${chatAttachment.name}</div>
      <button onclick="clearAttachment()" style="border:none;background:none;cursor:pointer;font-size:18px;color:var(--coral)">✕</button>`;
  }
}

function clearAttachment(){chatAttachment=null;renderAttachmentPreview();}

// ========== PWA ==========
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault(); deferredInstallPrompt=e;
  if(localStorage.getItem('install_dismissed')!=='1'&&!window.matchMedia('(display-mode: standalone)').matches)
    document.getElementById('install-banner').classList.add('show');
});
function doInstall(){if(deferredInstallPrompt){deferredInstallPrompt.prompt();deferredInstallPrompt.userChoice.then(()=>document.getElementById('install-banner').classList.remove('show'));}}
function dismissInstall(){document.getElementById('install-banner').classList.remove('show');localStorage.setItem('install_dismissed','1');}

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(e=>console.log('SW failed',e)));

// ========== INIT ==========
document.addEventListener('DOMContentLoaded',()=>{
  const pwdEl=document.getElementById('auth-password');
  if(pwdEl) pwdEl.addEventListener('keypress',(e)=>{if(e.key==='Enter') handleAuthSubmit();});
  const chatInput=document.getElementById('chat-input');
  if(chatInput) chatInput.addEventListener('keypress',(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChatMessage();}});
});
initAuth();
