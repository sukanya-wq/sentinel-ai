// ============================================================
//  SENTINEL AI v2 — CCTV Animated Rendering Engine
//  cctv-engine.js
//  Renders 8 animated threat scenes with realistic human figures
// ============================================================

const PI = Math.PI, TAU = PI * 2;
const rnd = (a, b) => Math.random() * (b - a) + a;
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ── Camera Definitions ────────────────────────────────────────
const CCTV_CAMS = [
  { id:'CAM-01', loc:'Platform Entry',  type:'kidnap'  },
  { id:'CAM-02', loc:'Car Park',        type:'theft'   },
  { id:'CAM-03', loc:'Main Hall',       type:'harass'  },
  { id:'CAM-04', loc:'Side Passage',    type:'stolen'  },
  { id:'CAM-05', loc:'Tunnel Exit',     type:'kidnap'  },
  { id:'CAM-06', loc:'Ticket Area',     type:'theft'   },
  { id:'CAM-07', loc:'Concourse',       type:'harass'  },
  { id:'CAM-08', loc:'Exit Gate',       type:'stolen'  },
];

const BADGE_TEXT = {
  kidnap: '⚠ KIDNAPPING',
  theft:  '⚠ THEFT',
  harass: '⚠ HARASSMENT',
  stolen: '⚠ BAG STOLEN',
};

const DETECTION_LOGS = [
  { m:'Victim being forcibly dragged — kidnapping in progress',   c:'CAM-01', col:'#e63946', v:96 },
  { m:'Pickpocket reach gesture confirmed near victim',           c:'CAM-02', col:'#a855f7', v:89 },
  { m:'Two suspects cornering and blocking victim',               c:'CAM-03', col:'#f59e0b', v:84 },
  { m:'Bag snatched — suspect fleeing eastbound',                 c:'CAM-04', col:'#f97316', v:92 },
  { m:'Child separation — adult coercion detected',               c:'CAM-05', col:'#e63946', v:95 },
  { m:'Pocket-dip pattern repeated 3x — theft confirmed',         c:'CAM-06', col:'#a855f7', v:81 },
  { m:'Physical harassment — grab-and-block pattern active',      c:'CAM-07', col:'#f59e0b', v:87 },
  { m:'Luggage stolen — perpetrator identified and tracked',      c:'CAM-08', col:'#f97316', v:90 },
  { m:'Suspect re-identified across CAM-01 and CAM-05',           c:'CAM-01', col:'#38bdf8', v:92 },
  { m:'Victim trajectory anomaly — forced movement confirmed',    c:'CAM-05', col:'#e63946', v:97 },
];

// ── Scene Builders ────────────────────────────────────────────
function buildScene(type, W, H) {
  if (type === 'kidnap')  return buildKidnap(W, H);
  if (type === 'theft')   return buildTheft(W, H);
  if (type === 'harass')  return buildHarass(W, H);
  if (type === 'stolen')  return buildStolen(W, H);
}

function makeFig(role, x, y, color, opts = {}) {
  return {
    role, x, y, color,
    tx: x, ty: y,
    spd: opts.spd || 0.8,
    w: opts.w || 13, h: opts.h || 42,
    walk: rnd(0, TAU),
    phase: rnd(0, TAU),
    running: opts.running || false,
    dragged: opts.dragged || false,
    cornered: opts.cornered || false,
    distress: opts.distress || false,
    unaware: opts.unaware || false,
    hasBag: opts.hasBag || false,
    resist: opts.resist || false,
    dir: 1,
    arrived: false,
  };
}

function buildKidnap(W, H) {
  return {
    bgType: 'platform',
    figures: [
      makeFig('S',  W*.65, H*.42, '#e63946', { spd:0.9, w:14, h:44 }),
      makeFig('V',  W*.62, H*.44, '#fbbf24', { spd:0.0, w:11, h:38, dragged:true, resist:true }),
      makeFig('B',  W*.18, H*.38, '#38bdf8', { spd:0.5, w:11, h:36 }),
      makeFig('B',  W*.82, H*.36, '#38bdf8', { spd:0.45, w:10, h:34 }),
    ],
  };
}

function buildTheft(W, H) {
  return {
    bgType: 'carpark',
    figures: [
      makeFig('S',  W*.42, H*.42, '#a855f7', { spd:0.55, w:13, h:42 }),
      makeFig('V',  W*.48, H*.42, '#fbbf24', { spd:0.5,  w:12, h:40, unaware:true }),
      makeFig('B',  W*.15, H*.38, '#38bdf8', { spd:0.42, w:11, h:36 }),
      makeFig('B',  W*.78, H*.50, '#38bdf8', { spd:0.40, w:10, h:34 }),
    ],
  };
}

function buildHarass(W, H) {
  return {
    bgType: 'hall',
    figures: [
      makeFig('S',  W*.28, H*.42, '#e63946', { spd:0.7,  w:14, h:44 }),
      makeFig('S2', W*.70, H*.42, '#f97316', { spd:0.65, w:13, h:42 }),
      makeFig('V',  W*.50, H*.44, '#fbbf24', { spd:0.0,  w:11, h:38, cornered:true }),
      makeFig('B',  W*.10, H*.52, '#38bdf8', { spd:0.35, w:10, h:34 }),
    ],
  };
}

function buildStolen(W, H) {
  return {
    bgType: 'passage',
    figures: [
      makeFig('S',  W*.18, H*.44, '#f97316', { spd:1.6, w:13, h:42, running:true, hasBag:true }),
      makeFig('V',  W*.30, H*.46, '#fbbf24', { spd:0.0, w:12, h:38, distress:true }),
      makeFig('B',  W*.62, H*.40, '#38bdf8', { spd:0.40, w:11, h:36 }),
      makeFig('B',  W*.85, H*.44, '#38bdf8', { spd:0.38, w:10, h:34 }),
    ],
  };
}

// ── Background Renderers ──────────────────────────────────────
function drawBackground(ctx, W, H, bgType, t) {
  // Base fill
  const fills = { platform:'#060e1c', carpark:'#08080e', hall:'#060e08', passage:'#0e0806' };
  ctx.fillStyle = fills[bgType] || '#06101e';
  ctx.fillRect(0, 0, W, H);

  if (bgType === 'platform') {
    // Tiled floor with perspective
    const fy = H * .68;
    ctx.fillStyle = 'rgba(18,35,80,0.25)';
    ctx.fillRect(0, fy, W, H - fy);
    for (let c = 0; c <= 8; c++) {
      const x = c * (W / 8);
      ctx.strokeStyle = 'rgba(40,80,180,0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(W/2 + (x - W/2) * .12, H); ctx.stroke();
    }
    for (let r = 0; r <= 5; r++) {
      const y = fy + (H - fy) * (r / 5);
      ctx.strokeStyle = 'rgba(40,80,180,0.08)'; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(30,60,150,0.3)'; ctx.fillRect(0, fy, W, 2);
    // Ceiling lights
    ctx.fillStyle = 'rgba(200,215,255,0.05)';
    [W*.08, W*.3, W*.52, W*.74, W*.92].forEach(lx => ctx.fillRect(lx, 0, W*.06, H*.05));
    // Wall panels
    ctx.fillStyle = 'rgba(14,30,80,0.18)';
    ctx.fillRect(0, 0, W*.04, fy); ctx.fillRect(W*.96, 0, W*.04, fy);
    // Platform signage
    ctx.fillStyle = 'rgba(10,30,90,0.45)'; ctx.fillRect(W*.2, H*.04, W*.6, H*.05);
    ctx.fillStyle = 'rgba(180,210,255,0.15)'; ctx.font = '5px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PLATFORM A  —  ALL TRAINS', W*.5, H*.08);
  }

  if (bgType === 'carpark') {
    ctx.fillStyle = 'rgba(12,12,18,0.5)'; ctx.fillRect(0, H*.6, W, H*.4);
    // Parking lines
    ctx.strokeStyle = 'rgba(210,190,50,0.1)'; ctx.lineWidth = 0.6; ctx.setLineDash([3, 3]);
    for (let x = W*.08; x < W; x += W*.18) {
      ctx.beginPath(); ctx.moveTo(x, H*.6); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.setLineDash([]);
    // Car silhouettes
    [[W*.04,H*.62,W*.13,H*.1],[W*.52,H*.63,W*.14,H*.09],[W*.80,H*.62,W*.13,H*.1]].forEach(([cx,cy,cw,ch]) => {
      ctx.fillStyle = 'rgba(18,22,38,0.75)'; ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeStyle = 'rgba(35,55,100,0.35)'; ctx.lineWidth = 0.4; ctx.strokeRect(cx, cy, cw, ch);
      ctx.fillStyle = 'rgba(50,90,180,0.08)'; ctx.fillRect(cx+cw*.1, cy+ch*.15, cw*.8, ch*.3);
      // Headlights
      ctx.fillStyle = 'rgba(255,240,180,0.15)'; ctx.fillRect(cx+2, cy+ch*.3, 3, 2);
      ctx.fillRect(cx+cw-5, cy+ch*.3, 3, 2);
    });
    // Overhead cone lights
    [W*.15, W*.44, W*.74].forEach(lx => {
      const lg = ctx.createRadialGradient(lx, 0, 0, lx, 0, H*.6);
      lg.addColorStop(0, 'rgba(200,210,240,0.06)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    });
  }

  if (bgType === 'hall') {
    // Tiled marble floor
    for (let tx = 0; tx < W; tx += W/10) {
      for (let ty = H*.65; ty < H; ty += H*.09) {
        ctx.fillStyle = `rgba(${15+Math.random()*6},${30+Math.random()*6},${15+Math.random()*5},0.4)`;
        ctx.fillRect(tx, ty, W/10, H*.09);
        ctx.strokeStyle = 'rgba(25,55,25,0.14)'; ctx.lineWidth = 0.3;
        ctx.strokeRect(tx, ty, W/10, H*.09);
      }
    }
    // Columns
    [W*.1, W*.48, W*.88].forEach(cx => {
      ctx.fillStyle = 'rgba(12,32,12,0.6)'; ctx.fillRect(cx-4, H*.08, 8, H*.6);
      ctx.fillStyle = 'rgba(25,70,25,0.12)'; ctx.fillRect(cx-2, H*.08, 4, H*.6);
    });
    // Overhead sign
    ctx.fillStyle = 'rgba(8,38,12,0.5)'; ctx.fillRect(W*.25, H*.06, W*.5, H*.055);
    ctx.fillStyle = 'rgba(180,240,180,0.12)'; ctx.font = '5px monospace'; ctx.textAlign = 'center';
    ctx.fillText('DEPARTURE HALL', W*.5, H*.105);
    // Ambient ceiling light
    const cg = ctx.createRadialGradient(W*.5, 0, 0, W*.5, 0, H*.8);
    cg.addColorStop(0, 'rgba(180,240,180,0.04)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
  }

  if (bgType === 'passage') {
    // Vanishing corridor
    const cx = W / 2;
    ctx.fillStyle = 'rgba(14,7,4,0.55)';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W,0); ctx.lineTo(cx+55,H*.5); ctx.lineTo(cx-55,H*.5); ctx.closePath(); ctx.fill();
    // Wall perspective lines
    for (let i = 1; i <= 6; i++) {
      const f = i / 7, yw = H * f * .5;
      ctx.strokeStyle = `rgba(110,50,22,${0.04*i})`; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(0, H*f*.28); ctx.lineTo(cx-55+yw, H*.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W, H*f*.28); ctx.lineTo(cx+55-yw, H*.5); ctx.stroke();
    }
    // Floor
    ctx.fillStyle = 'rgba(22,10,6,0.4)'; ctx.fillRect(0, H*.5, W, H*.5);
    // Wall lights
    [[W*.08,H*.18],[W*.92,H*.18],[W*.08,H*.52],[W*.92,H*.52]].forEach(([lx,ly]) => {
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, W*.2);
      lg.addColorStop(0, 'rgba(255,160,60,0.08)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,160,60,0.45)'; ctx.fillRect(lx-2, ly-1, 4, 2);
    });
  }

  // Film grain
  const grain = ctx.createImageData(W, H);
  for (let i = 0; i < grain.data.length; i += 4) {
    const v = Math.random() * 20; grain.data[i] = v; grain.data[i+1] = v; grain.data[i+2] = v; grain.data[i+3] = 15;
  }
  ctx.putImageData(grain, 0, 0);

  // Vignette
  const vg = ctx.createRadialGradient(W/2, H/2, W*.22, W/2, H/2, W*.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.58)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

  // Timestamp + REC
  const ts = new Date().toLocaleTimeString('en', { hour12:false });
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(W-72, H-13, 70, 11);
  ctx.fillStyle = 'rgba(140,190,220,0.6)'; ctx.font = '6px monospace'; ctx.textAlign = 'right';
  ctx.fillText(ts, W-3, H-4);
  if (Math.floor(t / 30) % 2 === 0) {
    ctx.fillStyle = '#e63946';
    ctx.beginPath(); ctx.arc(W-78, H-8, 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(230,57,70,0.7)'; ctx.font = '6px monospace'; ctx.textAlign = 'right';
    ctx.fillText('REC', W-82, H-4);
  }
}

// ── Human Figure Renderer ─────────────────────────────────────
function drawHuman(ctx, W, H, fig, t) {
  const px = cl(fig.x, fig.w * .5 + 2, W - fig.w * .5 - 2);
  const py = cl(fig.y, fig.h * .5 + 2, H - fig.h * .5 - 2);
  const ph = fig.h, pw = fig.w;
  const walkSin = Math.sin(fig.walk);
  const walkOff = walkSin * (fig.running ? 5.5 : 2.8);
  const col = fig.color;

  ctx.save();

  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(px, py + ph*.45, pw*.52, 2.5, 0, 0, TAU); ctx.fill();

  ctx.translate(px, py);

  // ── Legs ──
  const legSwing = walkSin * (fig.running ? 9 : 5);
  ctx.strokeStyle = col + 'aa'; ctx.lineWidth = pw * .27; ctx.lineCap = 'round';
  // Left leg
  ctx.beginPath();
  ctx.moveTo(-pw*.1, ph*.1);
  ctx.lineTo(-pw*.12 - legSwing, ph*.34);
  ctx.lineTo(-pw*.09 - legSwing*.35, ph*.47);
  ctx.stroke();
  // Right leg
  ctx.beginPath();
  ctx.moveTo(pw*.1, ph*.1);
  ctx.lineTo(pw*.12 + legSwing, ph*.34);
  ctx.lineTo(pw*.09 + legSwing*.35, ph*.47);
  ctx.stroke();
  // Shoes
  ctx.strokeStyle = col + '77'; ctx.lineWidth = pw*.18;
  ctx.beginPath(); ctx.moveTo(-pw*.09-legSwing*.35, ph*.47); ctx.lineTo(-pw*.18-legSwing*.35, ph*.49); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pw*.09+legSwing*.35, ph*.47); ctx.lineTo(pw*.18+legSwing*.35, ph*.49); ctx.stroke();

  // ── Body/Torso ──
  const bodyTilt = walkOff * .06;
  ctx.save(); ctx.rotate(bodyTilt);
  // Jacket
  ctx.fillStyle = col + 'cc';
  ctx.beginPath();
  ctx.moveTo(-pw*.34, ph*.0);
  ctx.lineTo(pw*.34, ph*.0);
  ctx.lineTo(pw*.28, ph*.22);
  ctx.lineTo(-pw*.28, ph*.22);
  ctx.closePath(); ctx.fill();
  // Shirt gap / lapel
  ctx.fillStyle = col + '44';
  ctx.beginPath();
  ctx.moveTo(-pw*.05, -ph*.02);
  ctx.lineTo(0, ph*.15);
  ctx.lineTo(pw*.05, -ph*.02);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // ── Arms ──
  const armSwing = walkSin * (fig.running ? 8 : 4);
  ctx.strokeStyle = col + '99'; ctx.lineWidth = pw * .22; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-pw*.3, ph*.0 + walkOff*.08);
  ctx.lineTo(-pw*.4 + armSwing*.4, ph*.22 + walkOff*.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pw*.3, ph*.0 + walkOff*.08);
  ctx.lineTo(pw*.4 - armSwing*.4, ph*.22 + walkOff*.05);
  ctx.stroke();

  // Dragging arm for kidnapper
  if (fig.role === 'S' && ctx._dragging) {
    ctx.strokeStyle = col + 'cc'; ctx.lineWidth = pw * .18;
    ctx.beginPath(); ctx.moveTo(pw*.4, ph*.05); ctx.lineTo(pw*.65, ph*.08); ctx.stroke();
  }

  // ── Head ──
  const headY = -ph * .37 + walkOff * .07;
  // Hair
  ctx.fillStyle = col + 'dd';
  ctx.beginPath(); ctx.ellipse(0, headY - ph*.08, pw*.22, ph*.115, 0, 0, TAU); ctx.fill();
  // Face (skin tone)
  const skinTones = { '#e63946':'#c49070', '#fbbf24':'#d4a574', '#38bdf8':'#b8956a', '#a855f7':'#c09060', '#f97316':'#c09060' };
  ctx.fillStyle = skinTones[col] || '#c49070';
  ctx.beginPath(); ctx.ellipse(0, headY, pw*.19, ph*.115, 0, 0, TAU); ctx.fill();
  // Eyes
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(-pw*.065, headY - ph*.015, pw*.038, ph*.028, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(pw*.065, headY - ph*.015, pw*.038, ph*.028, 0, 0, TAU); ctx.fill();
  // Eye whites
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.ellipse(-pw*.055, headY-ph*.018, pw*.018, ph*.016, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(pw*.055, headY-ph*.018, pw*.018, ph*.016, 0, 0, TAU); ctx.fill();
  // Nose
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, headY-ph*.01); ctx.lineTo(-pw*.015, headY+ph*.03); ctx.lineTo(pw*.015, headY+ph*.03); ctx.stroke();
  // Mouth
  ctx.beginPath(); ctx.arc(0, headY+ph*.05, pw*.06, 0, PI); ctx.stroke();
  // Ear
  ctx.fillStyle = skinTones[col] || '#c49070';
  ctx.beginPath(); ctx.ellipse(-pw*.19, headY, pw*.04, ph*.038, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(pw*.19, headY, pw*.04, ph*.038, 0, 0, TAU); ctx.fill();

  // ── Props ──
  // Bag for thief
  if (fig.hasBag) {
    ctx.fillStyle = '#8B6914'; ctx.strokeStyle = 'rgba(255,200,100,0.4)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.roundRect(pw*.3, ph*.0, pw*.42, ph*.2, 2); ctx.fill(); ctx.stroke();
    // Handle
    ctx.strokeStyle = '#A0800A'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(pw*.51, ph*.0, pw*.1, PI, 0); ctx.stroke();
  }

  // Distress waves
  if (fig.distress && Math.sin(t * .18) > 0) {
    ctx.restore(); ctx.save();
    ctx.translate(px, py);
    const dr = ph*.38 + 3 * Math.sin(t*.18);
    ctx.strokeStyle = col; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(0, 0, dr, 0, TAU); ctx.stroke();
    ctx.strokeStyle = col + '44';
    ctx.beginPath(); ctx.arc(0, 0, dr + 6, 0, TAU); ctx.stroke();
  }

  ctx.restore();

  // Bounding box
  ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.setLineDash([2, 2]);
  ctx.strokeRect(px - pw*.52, py - ph*.52, pw + 4, ph + 4);
  ctx.setLineDash([]);

  // Role label above box
  const isSuspect = fig.role === 'S' || fig.role === 'S2';
  const isVictim  = fig.role === 'V';
  if (isSuspect || isVictim) {
    const lbl = isSuspect ? 'SUSPECT' : 'VICTIM';
    ctx.fillStyle = col; ctx.font = `bold ${Math.max(6, pw*.28)}px monospace`; ctx.textAlign = 'center';
    ctx.fillText(lbl, px, py - ph*.52 - 3);
  }
}

// ── AI Threat Visualizations ──────────────────────────────────
function drawThreatFX(ctx, W, H, scene, t) {
  const figs = scene.figures;
  const type = scene.bgType;

  // AI reticle on ALL suspects
  figs.filter(f => f.role === 'S' || f.role === 'S2').forEach(f => {
    const r = f.h * .62 + 2;
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(t * .022);
    ctx.strokeStyle = `rgba(230,57,70,${.5 + .25*Math.sin(t*.12)})`;
    ctx.lineWidth = 0.7;
    const gap = PI * .22;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(0, 0, r, i*PI*.5+gap, i*PI*.5+PI*.5-gap); ctx.stroke();
    }
    ctx.restore();
    // Corner ticks
    ctx.save(); ctx.translate(f.x, f.y);
    const tk = 5;
    [[-r,-r],[r,-r],[r,r],[-r,r]].forEach(([cx2,cy2]) => {
      ctx.strokeStyle = `rgba(230,57,70,0.7)`; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx2 + (cx2>0?-tk:tk), cy2); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2, cy2 + (cy2>0?-tk:tk));
      ctx.stroke();
    });
    ctx.restore();
  });

  // KIDNAP: drag vector + struggle sparks
  if (type === 'platform') {
    const sus = figs.find(f => f.role === 'S');
    const vic = figs.find(f => f.role === 'V');
    if (sus && vic) {
      ctx.save();
      // Force arrow
      ctx.strokeStyle = `rgba(230,57,70,${.35 + .2*Math.sin(t*.1)})`;
      ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(sus.x, sus.y); ctx.lineTo(vic.x, vic.y); ctx.stroke();
      ctx.setLineDash([]);
      // Struggle sparks
      if (Math.sin(t*.16) > 0.2) {
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = `rgba(251,191,36,${rnd(.3,.8)})`;
          ctx.beginPath(); ctx.arc(vic.x + rnd(-10,10), vic.y + rnd(-10,10), rnd(1,2.5), 0, TAU); ctx.fill();
        }
      }
      // Victim struggle shake
      if (Math.floor(t/4) % 3 === 0) {
        ctx.strokeStyle = 'rgba(251,191,36,0.5)'; ctx.lineWidth = 0.8; ctx.setLineDash([1,2]);
        ctx.beginPath(); ctx.arc(vic.x + rnd(-3,3), vic.y, vic.h*.4, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      }
      // Red zone around suspect
      const pr = sus.h*.55 + 4*Math.sin(t*.1);
      ctx.fillStyle = `rgba(230,57,70,0.05)`;
      ctx.beginPath(); ctx.arc(sus.x, sus.y, pr, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(230,57,70,0.3)`; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(sus.x, sus.y, pr, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }

  // THEFT: proximity orbit ring + hand gesture detection
  if (type === 'carpark') {
    const sus = figs.find(f => f.role === 'S');
    const vic = figs.find(f => f.role === 'V');
    if (sus && vic) {
      const dist = Math.hypot(sus.x - vic.x, sus.y - vic.y);
      if (dist < 55) {
        ctx.save();
        const pr = 15 + 4*Math.sin(t*.14);
        ctx.strokeStyle = `rgba(168,85,247,${.55 + .2*Math.sin(t*.1)})`; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(sus.x, sus.y, pr, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(168,85,247,0.18)';
        ctx.beginPath(); ctx.arc(sus.x, sus.y, pr + 8, 0, TAU); ctx.stroke();
        // Pocket reach zone between figures
        ctx.fillStyle = `rgba(168,85,247,0.06)`;
        ctx.beginPath(); ctx.arc((sus.x+vic.x)/2, (sus.y+vic.y)/2, dist/2+5, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
  }

  // HARASS: zone + threat vectors from both suspects
  if (type === 'hall') {
    const vic = figs.find(f => f.role === 'V');
    const suss = figs.filter(f => f.role === 'S' || f.role === 'S2');
    if (vic && suss.length) {
      ctx.save();
      // Danger zone
      const zr = 52 + 5*Math.sin(t*.09);
      ctx.fillStyle = `rgba(245,158,11,${.04+.02*Math.sin(t*.09)})`;
      ctx.beginPath(); ctx.arc(vic.x, vic.y, zr, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(245,158,11,${.28+.15*Math.sin(t*.1)})`;
      ctx.lineWidth = 0.8; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(vic.x, vic.y, zr, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      // Threat vectors
      suss.forEach(s => {
        ctx.strokeStyle = `rgba(230,57,70,${.35+.15*Math.sin(t*.12)})`;
        ctx.lineWidth = 0.8; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(vic.x, vic.y); ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.restore();
    }
  }

  // STOLEN: running trail + bag indicator
  if (type === 'passage') {
    const sus = figs.find(f => f.role === 'S');
    const vic = figs.find(f => f.role === 'V');
    if (sus && sus.running) {
      ctx.save();
      // Motion trail
      for (let i = 1; i <= 5; i++) {
        ctx.fillStyle = `rgba(249,115,22,${0.38 - i*.07})`;
        ctx.beginPath(); ctx.arc(sus.x - i*11*sus.dir, sus.y + rnd(-2,2), 2.8 - i*.4, 0, TAU); ctx.fill();
      }
      // Speed lines
      ctx.strokeStyle = `rgba(249,115,22,0.28)`; ctx.lineWidth = 0.7; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(sus.x, sus.y); ctx.lineTo(sus.x - 42*sus.dir, sus.y + rnd(-3,3)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sus.x, sus.y - 6); ctx.lineTo(sus.x - 32*sus.dir, sus.y - 6 + rnd(-2,2)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (vic && vic.distress) {
      ctx.save();
      // Distress pulse
      const dr = vic.h*.4 + 4*Math.sin(t*.2);
      ctx.strokeStyle = `rgba(251,191,36,${.5+.3*Math.sin(t*.18)})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(vic.x, vic.y, dr, 0, TAU); ctx.stroke();
      // Exclamation
      ctx.fillStyle = `rgba(251,191,36,${.8+.2*Math.sin(t*.15)})`;
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('!', vic.x, vic.y - vic.h*.55 - 8);
      ctx.restore();
    }
  }
}

// ── Figure AI Updates ─────────────────────────────────────────
const DT = 1 / 60;

function updateScene(scene, W, H) {
  const type = scene.bgType;
  const figs = scene.figures;

  figs.forEach(f => {
    f.walk += DT * (f.running ? 25 : 15);
    if (f.spd === 0) return;

    const dx = f.tx - f.x, dy = f.ty - f.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 5) {
      // Assign new waypoint based on role/type
      if (type === 'platform' && f.role === 'S') {
        // Suspect drags victim toward exit and loops back
        f.tx = f.x < W * .3 ? rnd(W*.5, W*.75) : rnd(W*.05, W*.2);
        f.ty = rnd(H*.38, H*.58);
      } else if (type === 'carpark' && f.role === 'S') {
        // Thief orbits victim
        f.tx = rnd(W*.35, W*.72); f.ty = rnd(H*.38, H*.56);
      } else if (type === 'passage' && f.role === 'S') {
        // Stolen: runner loops
        f.tx = f.x > W*.7 ? rnd(W*.1, W*.25) : rnd(W*.72, W*.9);
        f.ty = rnd(H*.38, H*.54);
      } else if (f.role !== 'V') {
        f.tx = rnd(W*.08, W*.9); f.ty = rnd(H*.34, H*.64);
      }
    } else {
      const spd = f.running ? f.spd * 2.5 : f.spd;
      f.x += dx / dist * spd;
      f.y += dy / dist * spd;
      f.dir = dx > 0 ? 1 : -1;
    }
  });

  // Victim follows suspect in kidnap scene
  if (type === 'platform') {
    const sus = figs.find(f => f.role === 'S');
    const vic = figs.find(f => f.role === 'V');
    if (sus && vic) {
      const lag = vic.resist ? 0.55 : 0.88;
      vic.x = lerp(vic.x, sus.x + 9 + Math.sin(vic.walk*.9)*5, lag * DT * 2.2);
      vic.y = lerp(vic.y, sus.y + 5, lag * DT * 2.2);
    }
  }

  // Harassers close in on victim
  if (type === 'hall') {
    const vic = figs.find(f => f.role === 'V');
    const s1 = figs.find(f => f.role === 'S');
    const s2 = figs.find(f => f.role === 'S2');
    if (vic) {
      if (s1) {
        const d = Math.hypot(s1.x - vic.x, s1.y - vic.y);
        s1.tx = d > 28 ? vic.x - 20 : vic.x - 17 + Math.sin(s1.walk*.4)*4;
        s1.ty = vic.y;
      }
      if (s2) {
        const d = Math.hypot(s2.x - vic.x, s2.y - vic.y);
        s2.tx = d > 28 ? vic.x + 20 : vic.x + 17 + Math.sin(s2.walk*.4)*4;
        s2.ty = vic.y;
      }
    }
  }
}

// ── Main Render Loop ──────────────────────────────────────────
let cctvTick = 0;
let cctvScenes = [];
let cctvLogIdx = 0;
let cctvLastLog = 0;

function initCCTV() {
  const W = 320, H = 180;
  cctvScenes = CCTV_CAMS.map(c => buildScene(c.type, W, H));
}

function renderCCTV() {
  cctvTick++;
  const W = 320, H = 180;

  cctvScenes.forEach((scene, i) => {
    const cv = document.getElementById(`ccv${i}`);
    if (!cv) return;
    const ctx = cv.getContext('2d');

    updateScene(scene, W, H);
    drawBackground(ctx, W, H, scene.bgType, cctvTick);
    drawThreatFX(ctx, W, H, scene, cctvTick);

    // Draw figures sorted by y (depth)
    const sorted = [...scene.figures].sort((a, b) => a.y - b.y);
    sorted.forEach(f => drawHuman(ctx, W, H, f, cctvTick));

    // Scanline
    const sy = (cctvTick * 1.35) % H;
    ctx.fillStyle = 'rgba(56,189,248,0.045)'; ctx.fillRect(0, sy, W, 1.5);
  });

  // Detection log
  const now = Date.now();
  if (now - cctvLastLog > 3400) {
    appendCamLog(DETECTION_LOGS[cctvLogIdx % DETECTION_LOGS.length]);
    cctvLogIdx++; cctvLastLog = now;
  }

  requestAnimationFrame(renderCCTV);
}

function appendCamLog(ev) {
  const ts = new Date().toLocaleTimeString('en', { hour12:false });
  const ll = document.getElementById('camLog');
  if (!ll) return;
  const row = document.createElement('div');
  row.className = 'logrow';
  row.innerHTML = `<div class="ld" style="background:${ev.col}"></div><div class="lt">${ts}</div><div class="lm">${ev.m}</div><div style="width:28px;height:3px;background:#0e2235;border-radius:1px;overflow:hidden;flex-shrink:0"><div style="height:100%;width:${ev.v}%;background:${ev.col};border-radius:1px"></div></div><div class="lc">${ev.c}</div>`;
  ll.prepend(row);
  while (ll.children.length > 7) ll.removeChild(ll.lastChild);
}

// ── DOM Builder ───────────────────────────────────────────────
function buildCCTVGrid() {
  const grid = document.getElementById('cctvGrid');
  if (!grid) return;
  grid.innerHTML = '';

  CCTV_CAMS.forEach((cam, i) => {
    const cell = document.createElement('div');
    cell.className = `cctv-cell ${cam.type}`;

    const cv = document.createElement('canvas');
    cv.id = `ccv${i}`; cv.width = 320; cv.height = 180;

    const ov = document.createElement('div'); ov.className = 'cctv-ov';

    const badge = document.createElement('div');
    badge.className = `cam-badge ${cam.type}`;
    badge.textContent = BADGE_TEXT[cam.type];

    const dot = document.createElement('div'); dot.className = 'cam-dot';
    const scan = document.createElement('div'); scan.className = 'cam-scan';
    const cid = document.createElement('div');
    cid.className = 'cam-id'; cid.textContent = cam.id;
    const cloc = document.createElement('div');
    cloc.className = 'cam-loc'; cloc.textContent = cam.loc;

    ov.append(badge, dot, scan, cid, cloc);
    cell.append(cv, ov);
    grid.appendChild(cell);
  });
}
