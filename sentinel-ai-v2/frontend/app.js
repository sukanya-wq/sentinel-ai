// ============================================================
//  SENTINEL AI v2 — Main Application Logic
//  app.js
// ============================================================

// ── Clock ─────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const ts = now.toLocaleTimeString('en', { hour12:false });
  const el = document.getElementById('topTime');
  if (el) el.textContent = ts;
  const sb = document.getElementById('sbTime');
  if (sb) sb.textContent = now.toLocaleDateString('en', {day:'2-digit',month:'short'}).toUpperCase();
}
setInterval(updateClock, 1000);
updateClock();

// ── Auth ──────────────────────────────────────────────────────
function selRole(el) {
  document.querySelectorAll('.login-role').forEach(r => r.classList.remove('active'));
  el.classList.add('active');
}
function doLogin() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appMain').style.display = 'flex';
  initApp();
}
function doLogout() {
  document.getElementById('appMain').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
}

// ── Navigation ────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'DASHBOARD', cctv: 'LIVE CCTV — 8 FEEDS', alerts: 'ALERT CENTER',
  suspects: 'SUSPECT DATABASE', victims: 'MISSING PERSONS', network: 'CRIMINAL NETWORK',
  risk: 'RISK PREDICTION', timeline: 'DETECTION HISTORY', map: 'SURVEILLANCE MAP',
  reports: 'INCIDENT REPORTS', evidence: 'EVIDENCE STORAGE', assistant: 'AI ASSISTANT', settings: 'SETTINGS',
};

function goPage(id, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + id);
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[id] || id.toUpperCase();

  if (id === 'cctv') {
    buildCCTVGrid();
    setTimeout(() => { initCCTV(); renderCCTV(); }, 120);
  }
  if (id === 'network') setTimeout(initNetwork, 100);
  if (id === 'map') setTimeout(initMap, 100);
  if (id === 'risk') setTimeout(initRiskCharts, 100);
}

// ── Charts ────────────────────────────────────────────────────
let chartsInited = false;
function initCharts() {
  if (chartsInited) return;
  chartsInited = true;

  const dc = document.getElementById('detChart');
  if (dc) new Chart(dc, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [
        { label:'Kidnap', data:[2,4,1,5,3,6,4], borderColor:'#e63946', backgroundColor:'rgba(230,57,70,0.1)', tension:.4, fill:true, pointBackgroundColor:'#e63946', pointRadius:3 },
        { label:'Theft', data:[3,5,3,7,4,8,5], borderColor:'#a855f7', backgroundColor:'rgba(168,85,247,0.1)', tension:.4, fill:true, pointBackgroundColor:'#a855f7', pointRadius:3 },
        { label:'Harass', data:[1,3,2,4,2,5,3], borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,0.08)', tension:.4, fill:true, pointBackgroundColor:'#f59e0b', pointRadius:3 },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{color:'#6a8aaa',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
        y:{ticks:{color:'#6a8aaa',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},
      },
    },
  });

  const tc = document.getElementById('threatChart');
  if (tc) new Chart(tc, {
    type: 'doughnut',
    data: {
      labels: ['Kidnapping','Theft','Harassment','Bag Stolen'],
      datasets: [{ data:[4,6,3,5], backgroundColor:['#e63946','#a855f7','#f59e0b','#f97316'], borderWidth:0 }],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'right',labels:{color:'#a8c0dc',font:{size:10},boxWidth:10,padding:8}}},
      cutout:'65%',
    },
  });
}

function initRiskCharts() {
  const r1 = document.getElementById('riskChart');
  if (r1 && !r1._i) {
    r1._i = true;
    new Chart(r1, {
      type: 'bar',
      data: {
        labels: ['00','02','04','06','08','10','12','14','16','18','20','22'],
        datasets: [{ data:[65,45,30,20,15,18,25,35,48,61,72,68], backgroundColor:ctx => {
          const v = ctx.parsed.y;
          return v>60?'rgba(230,57,70,0.8)':v>40?'rgba(245,158,11,0.7)':'rgba(56,189,248,0.5)';
        }, borderRadius:3 }],
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#6a8aaa',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},y:{max:100,ticks:{color:'#6a8aaa',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}}}},
    });
  }
  const r2 = document.getElementById('zoneChart');
  if (r2 && !r2._i) {
    r2._i = true;
    new Chart(r2, {
      type: 'bar',
      data: {
        labels: ['Railway Stn','Bus Terminal','Airport T2','Industrial N','City Centre','Hotel Zone'],
        datasets: [{ data:[72,61,44,38,29,22], backgroundColor:['rgba(230,57,70,0.8)','rgba(230,57,70,0.6)','rgba(245,158,11,0.7)','rgba(56,189,248,0.6)','rgba(56,189,248,0.4)','rgba(56,189,248,0.3)'], borderRadius:4 }],
      },
      options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{max:100,ticks:{color:'#6a8aaa',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#a8c0dc',font:{size:9}},grid:{color:'rgba(255,255,255,0.04)'}}}},
    });
  }
}

// ── Live Activity Feed ────────────────────────────────────────
const ACTIVITIES = [
  { t:'KIDNAPPING ALERT', m:'Suspect dragging victim — CAM-01 Platform Entry', col:'#e63946', ts:'14:32:18' },
  { t:'THEFT CONFIRMED',  m:'Pocket dip confirmed — CAM-02 Car Park',           col:'#a855f7', ts:'14:31:04' },
  { t:'HARASSMENT',       m:'Two suspects cornering victim — CAM-03 Hall',       col:'#f59e0b', ts:'14:29:47' },
  { t:'BAG STOLEN',       m:'Suspect running with luggage — CAM-04 Passage',     col:'#f97316', ts:'14:28:22' },
  { t:'KIDNAPPING',       m:'Child separation detected — CAM-05 Tunnel',         col:'#e63946', ts:'14:26:11' },
  { t:'THEFT',            m:'Repeat proximity pattern — CAM-06 Tickets',         col:'#a855f7', ts:'14:24:38' },
  { t:'AI REIDENTIFIED',  m:'Suspect matched across CAM-01 and CAM-05',          col:'#38bdf8', ts:'14:22:10' },
];
let actIdx = 0;

function updateActivityFeed() {
  const feed = document.getElementById('liveActivity');
  if (!feed) return;
  const a = ACTIVITIES[actIdx % ACTIVITIES.length]; actIdx++;
  const item = document.createElement('div');
  item.style.cssText = 'display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid var(--border3);animation:fadeIn .3s ease';
  item.innerHTML = `<div style="width:5px;height:5px;border-radius:50%;flex-shrink:0;background:${a.col}"></div><div style="font-size:10px;font-weight:600;color:${a.col};min-width:90px;font-family:var(--mono)">${a.t}</div><div style="flex:1;font-size:10px;color:var(--text2)">${a.m}</div><div style="font-size:8px;font-family:var(--mono);color:var(--text4)">${a.ts}</div>`;
  feed.prepend(item);
  if (feed.children.length > 7) feed.removeChild(feed.lastChild);
}

// ── Criminal Network Graph ────────────────────────────────────
let netAF = null;
function initNetwork() {
  const cv = document.getElementById('netCanvas');
  if (!cv || cv._i) return;
  cv._i = true;
  const ctx = cv.getContext('2d');
  cv.width = cv.offsetWidth; cv.height = cv.offsetHeight;
  const W = cv.width, H = cv.height;

  const nodes = [
    { id:0, x:W/2,     y:H/2-25,  label:'Suresh Babu',  type:'leader',  r:20 },
    { id:1, x:W/2-170, y:H/2-75,  label:'Ramesh Kumar', type:'suspect', r:17 },
    { id:2, x:W/2+150, y:H/2-85,  label:'Priya Menon',  type:'suspect', r:15 },
    { id:3, x:W/2-210, y:H/2+75,  label:'Arjun Rao',    type:'suspect', r:13 },
    { id:4, x:W/2+190, y:H/2+65,  label:'Meena K.',     type:'suspect', r:13 },
    { id:5, x:W/2-75,  y:H/2+130, label:'Fatima S.',    type:'suspect', r:11 },
    { id:6, x:W/2+75,  y:H/2+130, label:'Unknown #1',   type:'suspect', r:11 },
    { id:7, x:W/2-320, y:H/2,     label:'Sunita D.',    type:'victim',  r:11 },
    { id:8, x:W/2-280, y:H/2-140, label:'Kavita S.',    type:'victim',  r:10 },
    { id:9, x:W/2+265, y:H/2-35,  label:'Case #2820',   type:'victim',  r:10 },
    { id:10,x:W/2+225, y:H/2+140, label:'Case #2831',   type:'victim',  r:10 },
    { id:11,x:W/2,     y:H/2-150, label:'INC-001',      type:'incident',r:9  },
    { id:12,x:W/2+130, y:H/2+160, label:'INC-002',      type:'incident',r:9  },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[1,2],[1,7],[1,8],[2,9],[3,7],[3,5],[4,9],[4,10],[4,6],[5,10],[1,11],[0,11],[2,12],[4,12]];
  const colors = { leader:'#22c55e', suspect:'#e63946', victim:'#f59e0b', incident:'#38bdf8' };
  let vx = nodes.map(()=>0), vy = nodes.map(()=>0);
  let drag = null, doff = null;

  function tick() {
    for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
      const dx=nodes[j].x-nodes[i].x, dy=nodes[j].y-nodes[i].y;
      const d=Math.sqrt(dx*dx+dy*dy)||1;
      const f=Math.min(1800/(d*d),3);
      vx[i]-=f*dx/d; vy[i]-=f*dy/d; vx[j]+=f*dx/d; vy[j]+=f*dy/d;
    }
    edges.forEach(([a,b])=>{
      const dx=nodes[b].x-nodes[a].x, dy=nodes[b].y-nodes[a].y;
      const d=Math.sqrt(dx*dx+dy*dy)||1;
      const f=(d-95)*.003;
      vx[a]+=f*dx/d; vy[a]+=f*dy/d; vx[b]-=f*dx/d; vy[b]-=f*dy/d;
    });
    nodes.forEach((n,i)=>{
      vx[i]+=(W/2-n.x)*.001; vy[i]+=(H/2-n.y)*.001;
      vx[i]*=.85; vy[i]*=.85;
      if (i!==drag){n.x+=vx[i];n.y+=vy[i];}
      n.x=Math.max(n.r+4,Math.min(W-n.r-4,n.x));
      n.y=Math.max(n.r+4,Math.min(H-n.r-4,n.y));
    });
    // Draw
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#040a12'; ctx.fillRect(0,0,W,H);
    edges.forEach(([a,b])=>{
      ctx.beginPath(); ctx.moveTo(nodes[a].x,nodes[a].y); ctx.lineTo(nodes[b].x,nodes[b].y);
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.stroke();
    });
    nodes.forEach(n=>{
      const col=colors[n.type]||'#888';
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r+4,0,Math.PI*2);
      ctx.fillStyle=col+'22'; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
      ctx.fillStyle=col+'44'; ctx.fill();
      ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.85)';
      ctx.font=`${Math.max(8,n.r*.55)}px monospace`; ctx.textAlign='center';
      ctx.fillText(n.label,n.x,n.y+n.r+10);
    });
    netAF = requestAnimationFrame(tick);
  }

  cv.onmousedown=e=>{
    const rect=cv.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    nodes.forEach((n,i)=>{ if(Math.hypot(mx-n.x,my-n.y)<n.r+8){drag=i;doff={x:mx-n.x,y:my-n.y};} });
  };
  cv.onmousemove=e=>{
    if(drag!==null){const rect=cv.getBoundingClientRect(); nodes[drag].x=e.clientX-rect.left-doff.x; nodes[drag].y=e.clientY-rect.top-doff.y;}
  };
  cv.onmouseup=()=>{drag=null;};
  tick();
}

// ── Map ───────────────────────────────────────────────────────
function initMap() {
  const el = document.getElementById('mapSvg');
  if (!el || el._i) return;
  el._i = true;
  const cams = [
    {x:38,y:42,alert:true,name:'CAM-01 Platform'},{x:58,y:28,alert:false,name:'CAM-02 Entrance'},
    {x:72,y:58,alert:true,name:'CAM-03 Concourse'},{x:22,y:67,alert:true,name:'CAM-04 Parking'},
    {x:82,y:22,alert:false,name:'CAM-05 Entry'},{x:47,y:72,alert:false,name:'CAM-06 Main Hall'},
    {x:67,y:82,alert:false,name:'CAM-07 Exit S'},{x:32,y:82,alert:true,name:'CAM-08 Tunnel'},
  ];
  el.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" style="background:#06101e">
    <defs><filter id="glow"><feGaussianBlur stdDeviation="1.5" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${Array.from({length:11},(_,i)=>`<line x1="${i*10}" y1="0" x2="${i*10}" y2="100" stroke="rgba(30,58,95,0.35)" stroke-width="0.3"/>`).join('')}
    ${Array.from({length:11},(_,i)=>`<line x1="0" y1="${i*10}" x2="100" y2="${i*10}" stroke="rgba(30,58,95,0.35)" stroke-width="0.3"/>`).join('')}
    <ellipse cx="47" cy="47" rx="30" ry="22" fill="rgba(230,57,70,0.07)" stroke="rgba(230,57,70,0.18)" stroke-width="0.3" stroke-dasharray="1,1"/>
    <ellipse cx="76" cy="72" rx="18" ry="13" fill="rgba(245,158,11,0.05)" stroke="rgba(245,158,11,0.14)" stroke-width="0.3" stroke-dasharray="1,1"/>
    <line x1="0" y1="52" x2="100" y2="52" stroke="rgba(255,255,255,0.05)" stroke-width="0.8"/>
    <line x1="52" y1="0" x2="52" y2="100" stroke="rgba(255,255,255,0.05)" stroke-width="0.8"/>
    <rect x="32" y="32" width="22" height="17" fill="rgba(20,35,70,0.75)" stroke="rgba(30,58,95,0.5)" stroke-width="0.3" rx="0.5"/>
    <rect x="60" y="37" width="16" height="13" fill="rgba(20,35,70,0.75)" stroke="rgba(30,58,95,0.5)" stroke-width="0.3" rx="0.5"/>
    <rect x="14" y="57" width="13" height="19" fill="rgba(20,35,70,0.75)" stroke="rgba(30,58,95,0.5)" stroke-width="0.3" rx="0.5"/>
    <text x="43" y="43" fill="rgba(150,190,220,0.35)" font-size="2.1" text-anchor="middle" font-family="monospace">CENTRAL STATION</text>
    ${cams.map(c=>`<g transform="translate(${c.x},${c.y})" style="cursor:pointer"><title>${c.name}</title><circle r="3" fill="${c.alert?'#e63946':'#22c55e'}" opacity="0.15" filter="url(#glow)"/><circle r="1.5" fill="${c.alert?'#e63946':'#22c55e'}"/><circle r="0.7" fill="white"/></g>`).join('')}
    <text x="47" y="70" fill="rgba(230,57,70,0.55)" font-size="1.9" text-anchor="middle" font-family="monospace">HIGH RISK ZONE</text>
    <text x="76" y="83" fill="rgba(245,158,11,0.48)" font-size="1.7" text-anchor="middle" font-family="monospace">MED RISK</text>
  </svg>`;
}

// ── Chatbot ───────────────────────────────────────────────────
const BOT = {
  threat: () => `<strong>Active Threats (4 confirmed):</strong><br>1. Kidnapping — CAM-01 Platform Entry (96%)<br>2. Theft — CAM-02 Car Park (89%)<br>3. Harassment — CAM-03 Main Hall (84%)<br>4. Bag Stolen — CAM-04 Passage (92%)<br><br>CAM-05/06/07/08 also showing same threat types.`,
  kidnap: () => `<strong>Kidnapping Detected:</strong><br>• Camera: CAM-01 Platform Entry<br>• Time: 14:32:18 · Confidence: 96%<br>• Behaviour: Suspect forcibly dragging victim<br>• Also detected: CAM-05 Tunnel Exit (95%)<br>• Status: DISPATCH RECOMMENDED`,
  theft: () => `<strong>Theft Activity:</strong><br>• CAM-02 Car Park · 14:31:04 · Conf 89%<br>• CAM-06 Ticket Area · 14:24:38 · Conf 81%<br>• Pattern: Pocket-dip and proximity orbiting<br>• Suspect: Purple-tagged, male, 30s`,
  harass: () => `<strong>Harassment Alert:</strong><br>• Camera: CAM-03 Main Hall + CAM-07 Concourse<br>• Pattern: Two suspects cornering single victim<br>• Confidence: 84–87%<br>• Action: Plain-clothes officer recommended`,
  suspect: () => `<strong>Primary Suspect — Ramesh Kumar:</strong><br>• ID: #S-0041 · Male · Age 34<br>• Crime: Kidnapping, Human Trafficking<br>• Network: N-004<br>• Last seen: CAM-01 · 14:32:18<br>• Risk: CRITICAL · Status: WANTED`,
  camera: () => `<strong>Camera Status:</strong><br>• Total: 8 · All ONLINE<br>• Active threats: 4 cameras alerting<br>• CAM-01: KIDNAP · CAM-02: THEFT<br>• CAM-03: HARASS · CAM-04: STOLEN<br>• CAM-05–08: Same threat types`,
};

function getBotReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes('threat') || m.includes('current')) return BOT.threat();
  if (m.includes('kidnap')) return BOT.kidnap();
  if (m.includes('theft') || m.includes('pick')) return BOT.theft();
  if (m.includes('harass')) return BOT.harass();
  if (m.includes('suspect') || m.includes('ramesh') || m.includes('main')) return BOT.suspect();
  if (m.includes('camera') || m.includes('cam') || m.includes('feed')) return BOT.camera();
  return `Query processed: <em>"${msg}"</em><br>Searching surveillance database… Specify a camera ID, threat type, suspect name, or case number for detailed results.`;
}

function sendChat() {
  const input = document.getElementById('chatIn');
  const msg = input.value.trim(); if (!msg) return;
  const msgs = document.getElementById('chatMsgs');
  const uDiv = document.createElement('div'); uDiv.className = 'chat-msg user'; uDiv.textContent = msg;
  msgs.appendChild(uDiv); input.value = ''; msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    const bDiv = document.createElement('div'); bDiv.className = 'chat-msg bot'; bDiv.innerHTML = getBotReply(msg);
    msgs.appendChild(bDiv); msgs.scrollTop = msgs.scrollHeight;
  }, 380);
}
function sendPreset(msg) { document.getElementById('chatIn').value = msg; sendChat(); }

// ── Modals ────────────────────────────────────────────────────
const MODALS = {
  suspect: {
    title: 'Suspect Profile',
    body: `<div style="display:flex;align-items:center;gap:13px;margin-bottom:14px">
      <div style="width:56px;height:56px;border-radius:9px;background:var(--bg3);border:2px solid var(--red);display:flex;align-items:center;justify-content:center;font-size:26px">👤</div>
      <div><div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:3px">Ramesh Kumar</div><div style="font-family:var(--mono);font-size:10px;color:var(--text3)">ID: #S-0041 · MALE · AGE 34</div><div style="margin-top:4px"><span class="risk-badge critical">CRITICAL</span></div></div>
    </div>
    <div class="divider"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:11px">
      <div><div class="section-title">Crime</div><div style="font-size:11px;color:var(--text)">Kidnapping · Human Trafficking</div></div>
      <div><div class="section-title">Network</div><div style="font-size:11px;color:var(--amber)">N-004 (Member)</div></div>
      <div><div class="section-title">Last Location</div><div style="font-family:var(--mono);font-size:10px;color:var(--blue)">CAM-01 · 14:32:18</div></div>
      <div><div class="section-title">Victims</div><div style="font-size:11px;color:var(--amber)">Case #2847, #2831</div></div>
    </div>
    <div class="divider"></div>
    <div style="display:flex;gap:7px"><button class="btn r" style="flex:1">🚨 Dispatch Unit</button><button class="btn b" style="flex:1">📄 Generate Report</button><button class="btn gh" style="flex:1">🕸 View Network</button></div>`,
  },
  alert: {
    title: 'Active Alert',
    body: `<div style="background:rgba(230,57,70,.08);border:1px solid rgba(230,57,70,.3);border-radius:7px;padding:11px;margin-bottom:13px">
      <div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:3px">⚠ CRITICAL — KIDNAPPING IN PROGRESS</div>
      <div style="font-size:10px;color:var(--text2)">Suspect Ramesh Kumar forcibly dragging victim. Threat AI confidence 96%. Immediate response required.</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;font-size:10px;margin-bottom:11px">
      <div><div class="section-title">Camera</div><div style="font-family:var(--mono);color:var(--blue)">CAM-01 Platform Entry</div></div>
      <div><div class="section-title">Time</div><div style="font-family:var(--mono)">14:32:18 · 15 Mar 2026</div></div>
      <div><div class="section-title">Confidence</div><div style="color:var(--green)">96%</div></div>
      <div><div class="section-title">Alert ID</div><div style="font-family:var(--mono);color:var(--text3)">#ALT-20260315-001</div></div>
    </div>
    <div style="display:flex;gap:7px"><button class="btn r" style="flex:1">🚨 Dispatch Unit</button><button class="btn a" style="flex:1">📸 Save Evidence</button><button class="btn gh" style="flex:1">✓ Acknowledge</button></div>`,
  },
  report: {
    title: 'Incident Report',
    body: `<div style="margin-bottom:11px;padding-bottom:11px;border-bottom:1px solid var(--border)">
      <div style="font-family:var(--mono);font-size:9px;color:var(--blue);margin-bottom:3px">INCIDENT REPORT — RPT-2026-0847</div>
      <div style="font-size:13px;font-weight:700;color:var(--text)">Kidnapping — Victim Dragged · CAM-01</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;font-size:10px;margin-bottom:11px">
      <div><div class="section-title">Date & Time</div><div>15 Mar 2026 14:32:18</div></div>
      <div><div class="section-title">Location</div><div>Platform Entry</div></div>
      <div><div class="section-title">Camera</div><div style="font-family:var(--mono)">CAM-01</div></div>
      <div><div class="section-title">Risk</div><div><span class="risk-badge critical">CRITICAL</span></div></div>
      <div><div class="section-title">AI Confidence</div><div style="color:var(--green)">96%</div></div>
      <div><div class="section-title">Threat Type</div><div style="color:var(--red)">KIDNAPPING</div></div>
    </div>
    <div style="margin-bottom:9px"><div class="section-title">Suspect</div><div style="font-size:10px;color:var(--text2)">Ramesh Kumar (#S-0041) · Network N-004</div></div>
    <div style="margin-bottom:11px"><div class="section-title">Action Required</div><div style="font-size:10px;color:var(--text2)">Deploy armed response unit immediately. Intercept at Platform Entry. Alert border control. Notify Case #2847 team.</div></div>
    <div style="display:flex;gap:7px"><button class="btn b" style="flex:1">📥 Export PDF</button><button class="btn gh" style="flex:1">✏ Edit</button></div>`,
  },
};

function showModal(type) {
  const m = MODALS[type]; if (!m) return;
  document.getElementById('modalOv').style.display = 'flex';
  document.getElementById('modalTitle').textContent = m.title;
  document.getElementById('modalBody').innerHTML = m.body;
}
function closeModal() { document.getElementById('modalOv').style.display = 'none'; }

// ── App Init ──────────────────────────────────────────────────
function initApp() {
  setTimeout(initCharts, 200);
  updateActivityFeed();
  setInterval(updateActivityFeed, 4200);
  // Auto-start CCTV when on cctv page
  if (document.getElementById('page-cctv').classList.contains('active')) {
    buildCCTVGrid();
    setTimeout(() => { initCCTV(); renderCCTV(); }, 150);
  }
}
