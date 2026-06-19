// ===== IFRS Dip Tracker — App Logic =====

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

let state = (() => {
  try { return JSON.parse(localStorage.getItem('ifrs_pro_v3')||'null') || defaultState(); }
  catch(e){ return defaultState(); }
})();

function defaultState(){
  return {
    startDate: new Date().toISOString().slice(0,10),
    studyDays: 115,
    reviewDays: 45,
    dailyHrs: 2.5,
    unitStatus: {},
    logs: [],
    notifTime: '20:00',
    notifEnabled: false
  };
}

function save(){ try{localStorage.setItem('ifrs_pro_v3',JSON.stringify(state));}catch(e){} }

function dateStr(d){ return d.toISOString().slice(0,10); }
function addDays(ds, n){ const d=new Date(ds); d.setDate(d.getDate()+n); return d; }
function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
function todayStr(){ return dateStr(new Date()); }

function computeSchedule(){
  let cursor = new Date(state.startDate);
  return STANDARDS.map(s=>{
    const from = dateStr(cursor);
    const to = dateStr(addDays(from, s.days-1));
    cursor = addDays(to, 1);
    return {...s, from, to};
  });
}

function getTodayTask(sched){
  const today = todayStr();
  const active = sched.find(s=>s.from<=today && s.to>=today);
  if(active) return active;
  const upcoming = sched.find(s=>s.from>today);
  if(upcoming) return {...upcoming, upcoming:true};
  return null;
}

function getStreak(){
  const days = new Set(state.logs.map(l=>l.date));
  let streak=0;
  for(let i=0;i<365;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    if(days.has(dateStr(d))) streak++;
    else if(i>0) break;
  }
  return streak;
}

function getWeekLogs(){
  const days={};
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    days[dateStr(d)] = state.logs.filter(l=>l.date===dateStr(d));
  }
  return days;
}

function getWeekHrs(){
  const d=new Date(); d.setDate(d.getDate()-6);
  const start=dateStr(d);
  return state.logs.filter(l=>l.date>=start).reduce((a,l)=>a+parseFloat(l.hrs),0);
}

function getMonthLogs(){
  const ym=todayStr().slice(0,7);
  return state.logs.filter(l=>l.date.startsWith(ym));
}

function getDoneCount(){ return Object.values(state.unitStatus).filter(v=>v==='done').length; }
function getTotalHrs(){ return state.logs.reduce((a,l)=>a+parseFloat(l.hrs),0); }

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}

// ========== RENDER: TODAY ==========
function renderToday(){
  const sched = computeSchedule();
  const task = getTodayTask(sched);
  const today = new Date();
  document.getElementById('topdate').textContent = TODAY_AR[today.getDay()]+' '+today.getDate()+' '+MONTHS_AR[today.getMonth()];

  const hero = document.getElementById('today-hero');
  if(task){
    const dayNum = daysBetween(state.startDate, todayStr())+1;
    const inStudy = dayNum<=state.studyDays;
    const phase = inStudy ? 'مرحلة المذاكرة' : 'مرحلة المراجعة';
    const phaseDay = inStudy ? dayNum : dayNum-state.studyDays;
    const phaseTotal = inStudy ? state.studyDays : state.reviewDays;
    const pct = Math.max(0,Math.min(100,Math.round(phaseDay/phaseTotal*100)));
    const status = state.unitStatus[task.id]||'todo';
    const statusMap={todo:'لم يبدأ',active:'جاري',done:'مكتمل ✓',review:'مراجعة'};
    hero.innerHTML=`
      <div class="hero-phase">${phase} — اليوم ${dayNum}</div>
      <div class="hero-task">${task.upcoming?'<span style="font-size:10px;background:rgba(255,255,255,0.3);padding:2px 8px;border-radius:8px;margin-left:6px">قادماً</span>':''}${task.name}</div>
      <div class="hero-chips">
        <span class="hero-chip">📅 ${task.from} — ${task.to}</span>
        <span class="hero-chip">⏱ ${task.days} أيام</span>
        <span class="hero-chip">${statusMap[status]}</span>
      </div>
      <div class="hero-bar-wrap"><div class="hero-bar-fill" style="width:${pct}%"></div></div>
      <div class="hero-pct-lbl">${phase}: ${pct}%</div>`;
  } else {
    hero.innerHTML='<div style="font-size:15px;font-weight:700;position:relative;z-index:1">🎉 أكملت كل المعايير! وقت المراجعة النهائية</div>';
  }

  const dayNum = daysBetween(state.startDate, todayStr())+1;
  const daysLeftStudy = Math.max(0, state.studyDays - dayNum + 1);
  document.getElementById('days-left-study').textContent = daysLeftStudy;
  document.getElementById('streak-val').textContent = getStreak();
  document.getElementById('week-hrs').textContent = getWeekHrs().toFixed(1);
  document.getElementById('done-count').textContent = getDoneCount();

  const sel = document.getElementById('log-unit');
  sel.innerHTML = '';
  STANDARDS.forEach(s=>{
    const o=document.createElement('option');
    o.value=s.id; o.textContent=s.name.slice(0,42);
    sel.appendChild(o);
  });
  if(task) sel.value=task.id;

  const recent = [...state.logs].reverse().slice(0,5);
  const rl = document.getElementById('recent-logs');
  if(!recent.length){
    rl.innerHTML='<div class="empty-state">لا توجد إنجازات مسجلة بعد<br>سجّل أول جلسة مذاكرة دلوقتي 👆</div>';
  } else {
    rl.innerHTML = recent.map(l=>{
      const s=STANDARDS.find(x=>x.id===l.unitId);
      const statusLabel={active:'جاري',done:'مكتمل',review:'مراجعة'};
      return `<div class="log-item">
        <div class="log-dot" style="background:${s?s.color:'#888'}"></div>
        <div class="log-info">
          <div class="log-name">${s?s.name.split('—')[0].trim():l.unitId}</div>
          <div class="log-meta">${l.date} · ${statusLabel[l.status]||''} ${l.note?'· '+l.note:''}</div>
        </div>
        <div class="log-hrs">${parseFloat(l.hrs).toFixed(1)}س</div>
      </div>`;
    }).join('');
  }

  renderWeekSummary();
  renderMonthSummary();
}

function renderWeekSummary(){
  const weekLogs = getWeekLogs();
  const totalHrs = Object.values(weekLogs).flat().reduce((a,l)=>a+parseFloat(l.hrs),0);
  const studiedDays = Object.values(weekLogs).filter(v=>v.length>0).length;
  const target = state.dailyHrs*7;
  const pct = Math.min(100,Math.round(totalHrs/target*100));
  const unitsThisWeek = [...new Set(Object.values(weekLogs).flat().map(l=>l.unitId))];
  document.getElementById('week-summary').innerHTML=`
    <div class="summary-row">
      <div class="summary-item"><div class="num" style="color:var(--turquoise)">${totalHrs.toFixed(1)}</div><div class="lbl">ساعة من ${target.toFixed(0)}</div></div>
      <div class="summary-item"><div class="num" style="color:var(--turquoise)">${studiedDays}</div><div class="lbl">أيام ذاكرت</div></div>
      <div class="summary-item"><div class="num" style="color:var(--turquoise)">${unitsThisWeek.length}</div><div class="lbl">معيار هذا الأسبوع</div></div>
    </div>
    <div style="height:7px;background:var(--bg-soft);border-radius:4px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:var(--grad-turq);border-radius:4px"></div>
    </div>
    <div style="font-size:11px;color:var(--text-secondary);margin-top:5px;font-weight:600">${pct}% من الهدف الأسبوعي</div>`;
}

function renderMonthSummary(){
  const mlogs = getMonthLogs();
  const totalHrs = mlogs.reduce((a,l)=>a+parseFloat(l.hrs),0);
  const studiedDays = [...new Set(mlogs.map(l=>l.date))].length;
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
  const target = state.dailyHrs*daysInMonth;
  const pct = Math.min(100,Math.round(totalHrs/target*100));
  const unitsThisMonth = [...new Set(mlogs.map(l=>l.unitId))];
  document.getElementById('month-summary').innerHTML=`
    <div class="summary-row">
      <div class="summary-item"><div class="num" style="color:var(--coral)">${totalHrs.toFixed(1)}</div><div class="lbl">ساعة من ${target.toFixed(0)}</div></div>
      <div class="summary-item"><div class="num" style="color:var(--coral)">${studiedDays}</div><div class="lbl">أيام ذاكرت</div></div>
      <div class="summary-item"><div class="num" style="color:var(--coral)">${unitsThisMonth.length}</div><div class="lbl">معيار هذا الشهر</div></div>
    </div>
    <div style="height:7px;background:var(--bg-soft);border-radius:4px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:var(--grad-coral);border-radius:4px"></div>
    </div>
    <div style="font-size:11px;color:var(--text-secondary);margin-top:5px;font-weight:600">${pct}% من الهدف الشهري — ${MONTHS_AR[today.getMonth()]}</div>`;
}

// ========== RENDER: SCHEDULE ==========
function renderSchedule(){
  const sched = computeSchedule();
  const today = todayStr();
  const studyEnd = dateStr(addDays(state.startDate, state.studyDays-1));
  const examDate = dateStr(addDays(state.startDate, state.studyDays+state.reviewDays-1));
  const inStudy = today <= studyEnd;
  const pi = document.getElementById('phase-info');
  if(inStudy){
    const dLeft = daysBetween(today, studyEnd)+1;
    pi.innerHTML=`<strong>📘 مرحلة المذاكرة</strong> — متبقي ${dLeft} يوم حتى ${studyEnd}<br>بعدها: 45 يوم مراجعة وحل امتحانات حتى ${examDate}`;
    pi.style.background='#D7F5E9'; pi.style.color='#0E8050';
  } else {
    const dLeft = daysBetween(today, examDate)+1;
    pi.innerHTML=`<strong>📝 مرحلة المراجعة والامتحانات</strong> — متبقي ${dLeft} يوم حتى ${examDate}`;
    pi.style.background='#FFE8D1'; pi.style.color='#B9560A';
  }

  const studyStds = sched.filter(s=>s.from<=studyEnd);
  let html='<div class="section-title"><span class="dot" style="background:var(--purple)"></span>مرحلة المذاكرة — 115 يوم</div>';
  studyStds.forEach((s,i)=>{
    const status = state.unitStatus[s.id]||'todo';
    const isPast = s.to < today;
    const isCurrent = s.from<=today && s.to>=today;
    const statusMap={todo:'لم يبدأ',active:'جاري',done:'مكتمل',review:'مراجعة'};
    const statusClass={todo:'s-todo',active:'s-active',done:'s-done',review:'s-review'};
    html+=`<div class="std-card ${isCurrent?'current':''}" style="opacity:${isPast&&status!=='done'?0.55:1}">
      <div class="std-num" style="color:${s.color}">${String(i+1).padStart(2,'0')}</div>
      <div class="std-info">
        <div class="std-name">${isCurrent?'<span class="today-tag">اليوم</span>':''}${s.name}</div>
        <div class="std-dates">${s.from} — ${s.to} (${s.days} أيام)</div>
      </div>
      <button class="status-pill ${statusClass[status]}" onclick="cycleStatus('${s.id}')">${statusMap[status]}</button>
    </div>`;
  });
  html+='<div class="section-title"><span class="dot" style="background:var(--amber)"></span>مرحلة المراجعة — 45 يوم</div>';
  html+=`<div class="std-card" style="background:linear-gradient(135deg,#FFF7ED,#FFF1E0)">
    <div class="std-num" style="color:var(--amber)">📚</div>
    <div class="std-info">
      <div class="std-name">مراجعة شاملة + حل امتحانات Past Papers</div>
      <div class="std-dates">${dateStr(addDays(studyEnd,1))} — ${examDate}</div>
    </div>
  </div>`;
  document.getElementById('schedule-list').innerHTML=html;
}

function cycleStatus(id){
  const cur = state.unitStatus[id]||'todo';
  const next = {todo:'active',active:'done',done:'review',review:'todo'};
  state.unitStatus[id]=next[cur]||'active';
  save(); renderAll();
  showToast('تم تحديث الحالة ✓');
}

// ========== RENDER: PROGRESS + CHARTS ==========
function renderProgress(){
  const done = getDoneCount();
  const total = STANDARDS.length;
  const pct = Math.round(done/total*100);
  document.getElementById('big-pct').textContent=pct+'%';
  document.getElementById('main-prog').style.width=pct+'%';
  document.getElementById('prog-done-lbl').textContent=done+' معيار من '+total;
  document.getElementById('prog-hrs-lbl').textContent=getTotalHrs().toFixed(1)+' ساعة';

  // week strip
  const studiedSet = new Set(state.logs.map(l=>l.date));
  const dayNames=['أح','إث','ثل','أر','خم','جم','سب'];
  let ws='';
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const k=dateStr(d);
    const studied=studiedSet.has(k);
    const isToday=i===0;
    const cls=studied?'w-studied':isToday?'w-today':'w-miss';
    ws+=`<div class="wday"><div class="wday-dot ${cls}">${d.getDate()}</div><div class="wday-lbl">${dayNames[d.getDay()]}</div></div>`;
  }
  document.getElementById('week-strip').innerHTML=ws;

  renderBarChart();
  renderDonutChart();

  // per-standard progress
  let spHtml='';
  STANDARDS.forEach(s=>{
    const status=state.unitStatus[s.id]||'todo';
    const unitHrs=state.logs.filter(l=>l.unitId===s.id).reduce((a,l)=>a+parseFloat(l.hrs),0);
    const pct2=status==='done'?100:Math.min(90,Math.round(unitHrs/(s.days*state.dailyHrs)*100));
    const statusClass={todo:'s-todo',active:'s-active',done:'s-done',review:'s-review'};
    const statusMap={todo:'لم يبدأ',active:'جاري',done:'مكتمل',review:'مراجعة'};
    spHtml+=`<div class="std-prog-row">
      <div class="spr-top">
        <span class="spr-name">${s.name}</span>
        <span class="status-pill ${statusClass[status]}" style="font-size:9.5px;padding:3px 8px">${statusMap[status]}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="spr-bar-wrap"><div class="spr-bar-fill" style="width:${pct2}%;background:${s.color}"></div></div>
        <span class="spr-hrs">${unitHrs.toFixed(1)}س</span>
      </div>
    </div>`;
  });
  document.getElementById('std-progress-list').innerHTML=spHtml;
}

function renderBarChart(){
  const svg = document.getElementById('bar-chart');
  const days = [];
  for(let i=13;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const k=dateStr(d);
    const hrs = state.logs.filter(l=>l.date===k).reduce((a,l)=>a+parseFloat(l.hrs),0);
    days.push({date:d, hrs});
  }
  const maxHrs = Math.max(3, ...days.map(d=>d.hrs));
  const w=320, h=140, padBottom=20, padTop=10;
  const barW = (w/14)*0.6;
  const gap = (w/14)*0.4;
  let bars='';
  days.forEach((d,i)=>{
    const x = i*(w/14) + gap/2;
    const barH = d.hrs>0 ? Math.max(3,(d.hrs/maxHrs)*(h-padBottom-padTop)) : 0;
    const y = h-padBottom-barH;
    const isToday = i===13;
    const color = d.hrs>=state.dailyHrs ? '#0D9488' : d.hrs>0 ? '#F59E0B' : '#E8E4F3';
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${isToday?'#6D28D9':color}"/>`;
    if(i%2===0 || isToday){
      bars += `<text x="${x+barW/2}" y="${h-4}" font-size="8" fill="#6B6480" text-anchor="middle" font-family="Outfit">${d.date.getDate()}</text>`;
    }
  });
  // target line
  const targetY = h-padBottom-((state.dailyHrs/maxHrs)*(h-padBottom-padTop));
  bars += `<line x1="0" y1="${targetY}" x2="${w}" y2="${targetY}" stroke="#F43F5E" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>`;
  bars += `<text x="${w-2}" y="${targetY-4}" font-size="7.5" fill="#F43F5E" text-anchor="end" font-family="Cairo" font-weight="600">الهدف اليومي</text>`;
  svg.innerHTML = bars;
}

function renderDonutChart(){
  const svg = document.getElementById('donut-chart');
  const legend = document.getElementById('donut-legend');
  const hrsPerUnit = STANDARDS.map(s=>({
    ...s,
    hrs: state.logs.filter(l=>l.unitId===s.id).reduce((a,l)=>a+parseFloat(l.hrs),0)
  })).filter(s=>s.hrs>0).sort((a,b)=>b.hrs-a.hrs);

  if(!hrsPerUnit.length){
    svg.innerHTML = `<circle cx="100" cy="100" r="70" fill="none" stroke="#E8E4F3" stroke-width="22"/>
      <text x="100" y="104" font-size="13" fill="#6B6480" text-anchor="middle" font-family="Cairo">لا توجد بيانات</text>`;
    legend.innerHTML = '<div class="empty-state" style="padding:8px">سجّل أول جلسة مذاكرة لتظهر هنا</div>';
    return;
  }

  const top = hrsPerUnit.slice(0,6);
  const othersHrs = hrsPerUnit.slice(6).reduce((a,s)=>a+s.hrs,0);
  const segments = othersHrs>0 ? [...top, {name:'أخرى',color:'#CBD5E1',hrs:othersHrs}] : top;
  const total = segments.reduce((a,s)=>a+s.hrs,0);

  const cx=100, cy=100, r=70, strokeW=26;
  const circumference = 2*Math.PI*r;
  let offset=0;
  let paths='';
  segments.forEach(s=>{
    const frac = s.hrs/total;
    const len = frac*circumference;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${strokeW}"
      stroke-dasharray="${len} ${circumference-len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"/>`;
    offset += len;
  });
  svg.innerHTML = paths + `<text x="${cx}" y="${cy-4}" font-size="22" fill="#1E1B2E" text-anchor="middle" font-family="Outfit" font-weight="700">${total.toFixed(0)}</text>
    <text x="${cx}" y="${cy+16}" font-size="10" fill="#6B6480" text-anchor="middle" font-family="Cairo" font-weight="600">ساعة</text>`;

  legend.innerHTML = segments.map(s=>{
    const pct = Math.round(s.hrs/total*100);
    const shortName = s.name.includes('—') ? s.name.split('—')[0].trim() : s.name;
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11.5px">
      <div style="width:9px;height:9px;border-radius:3px;background:${s.color};flex-shrink:0"></div>
      <span style="flex:1;color:var(--text-primary);font-weight:600">${shortName}</span>
      <span style="color:var(--text-secondary);font-family:Outfit">${s.hrs.toFixed(1)}س · ${pct}%</span>
    </div>`;
  }).join('');
}

// ========== RENDER: SETTINGS ==========
function renderSettings(){
  document.getElementById('set-start').value=state.startDate;
  document.getElementById('set-study-days').value=state.studyDays;
  document.getElementById('set-review-days').value=state.reviewDays;
  document.getElementById('set-daily-hrs').value=state.dailyHrs;
  document.getElementById('notif-time').value=state.notifTime;
  const studyEnd=dateStr(addDays(state.startDate,state.studyDays-1));
  const examDate=dateStr(addDays(state.startDate,state.studyDays+state.reviewDays-1));
  const totalHrsNeeded=(state.studyDays*state.dailyHrs).toFixed(0);
  document.getElementById('calc-end-study').textContent=studyEnd;
  document.getElementById('calc-exam').textContent=examDate;
  document.getElementById('calc-total-hrs').textContent=totalHrsNeeded+' ساعة';
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
  const unitId=document.getElementById('log-unit').value;
  const hrs=parseFloat(document.getElementById('log-hrs').value)||2;
  const note=document.getElementById('log-note').value.trim();
  const status=document.getElementById('log-status').value;
  state.logs.push({unitId,hrs,note,status,date:todayStr(),ts:Date.now()});
  if(status==='done') state.unitStatus[unitId]='done';
  else if(status==='active' && state.unitStatus[unitId]!=='done') state.unitStatus[unitId]='active';
  document.getElementById('log-note').value='';
  save(); renderAll();
  showToast('تم حفظ الإنجاز ✓');
}

function resetAll(){
  if(confirm('هل أنت متأكد؟ سيتم مسح كل البيانات!')){
    state=defaultState(); save(); renderAll();
    showToast('تم مسح البيانات');
  }
}

// ========== NAVIGATION ==========
let currentSec='today';
function go(sec){
  document.querySelectorAll('.nav-btn').forEach((b,i)=>{
    const secs=['today','schedule','progress','settings'];
    b.classList.toggle('active',secs[i]===sec);
  });
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.getElementById('sec-'+sec).classList.add('active');
  currentSec=sec;
  if(sec==='schedule') renderSchedule();
  if(sec==='progress') renderProgress();
  if(sec==='settings') renderSettings();
}

function renderAll(){
  renderToday();
  if(currentSec==='schedule') renderSchedule();
  if(currentSec==='progress') renderProgress();
  if(currentSec==='settings') renderSettings();
}

// ========== NOTIFICATIONS ==========
function updateNotifBadge(){
  const badge = document.getElementById('notif-status-badge');
  const dot = document.getElementById('bell-dot');
  if(state.notifEnabled && Notification.permission==='granted'){
    badge.innerHTML = '✓ مفعّل — يوميًا الساعة '+state.notifTime;
    badge.style.background='rgba(255,255,255,0.3)';
    dot.style.display='none';
  } else {
    badge.innerHTML = '● غير مفعّل';
    dot.style.display='block';
  }
}

async function enableNotifications(){
  state.notifTime = document.getElementById('notif-time').value || '20:00';
  save();

  if(!('Notification' in window)){
    showToast('المتصفح ده مش بيدعم التنبيهات');
    return;
  }

  let permission = Notification.permission;
  if(permission !== 'granted'){
    permission = await Notification.requestPermission();
  }

  if(permission === 'granted'){
    state.notifEnabled = true;
    save();
    updateNotifBadge();
    showToast('تم تفعيل التنبيه اليومي ✓');
    scheduleNotification();
    if('serviceWorker' in navigator){
      navigator.serviceWorker.ready.then(reg=>{
        reg.active?.postMessage({type:'SCHEDULE_NOTIF', time: state.notifTime});
      });
    }
  } else {
    showToast('محتاج تسمح بالتنبيهات من إعدادات المتصفح');
  }
}

let notifTimeoutId = null;
function scheduleNotification(){
  if(notifTimeoutId) clearTimeout(notifTimeoutId);
  if(!state.notifEnabled) return;

  const [hh,mm] = state.notifTime.split(':').map(Number);
  const now = new Date();
  let target = new Date();
  target.setHours(hh,mm,0,0);
  if(target <= now) target.setDate(target.getDate()+1);
  const msUntil = target - now;

  notifTimeoutId = setTimeout(()=>{
    fireStudyNotification();
    scheduleNotification(); // reschedule for next day
  }, msUntil);
}

function fireStudyNotification(){
  const sched = computeSchedule();
  const task = getTodayTask(sched);
  const title = '⏰ وقت مذاكرة IFRS Dip!';
  const body = task ? `النهارده: ${task.name}` : 'افتح التطبيق وسجّل تقدمك';

  if('serviceWorker' in navigator && navigator.serviceWorker.controller){
    navigator.serviceWorker.ready.then(reg=>{
      reg.showNotification(title, {
        body,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        vibrate: [200,100,200],
        tag: 'ifrs-daily-reminder'
      });
    });
  } else if(Notification.permission==='granted'){
    new Notification(title, {body, icon:'icons/icon-192.png'});
  }
}

// ========== PWA INSTALL ==========
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  if(localStorage.getItem('install_dismissed')!=='1' && !window.matchMedia('(display-mode: standalone)').matches){
    document.getElementById('install-banner').classList.add('show');
  }
});

function doInstall(){
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(()=>{
      document.getElementById('install-banner').classList.remove('show');
    });
  }
}

function dismissInstall(){
  document.getElementById('install-banner').classList.remove('show');
  localStorage.setItem('install_dismissed','1');
}

// register service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(e=>console.log('SW failed', e));
  });
}

// init
renderAll();
if(state.notifEnabled) scheduleNotification();
updateNotifBadge();
