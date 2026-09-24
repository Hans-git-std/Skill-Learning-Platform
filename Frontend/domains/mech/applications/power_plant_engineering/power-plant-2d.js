// Power Plant Engineering 2D Simulators

function init2DScene(canvasId, renderCallback) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    
    function animate() {
        requestAnimationFrame(animate);
        renderCallback(ctx, canvas.width, canvas.height);
    }
    animate();
}

// ---------------------------------------------------------
// CHAPTER 1: Plant Economics & Load Curves
// ---------------------------------------------------------
init2DScene('ch1-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (ctx.time === undefined) ctx.time = 12.0; // noon
    if (ctx.playing === undefined) ctx.playing = false;
    
    const btn = document.getElementById('ch1-play-2d');
    const timeSpan = document.getElementById('ch1-time-2d');
    
    if(btn && !btn.onclick) {
        btn.onclick = () => { ctx.playing = !ctx.playing; btn.innerText = ctx.playing ? "Pause" : "Play Day Cycle"; };
    }
    
    if(ctx.playing) {
        ctx.time += 0.05;
        if(ctx.time >= 24) ctx.time = 0;
    }
    
    if(timeSpan) {
        const hrs = Math.floor(ctx.time);
        const mins = Math.floor((ctx.time - hrs) * 60);
        timeSpan.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    // Draw Sky Background
    const isDay = ctx.time > 6 && ctx.time < 18;
    ctx.fillStyle = isDay ? '#88ccff' : '#111133';
    ctx.fillRect(0, 0, w, h);
    
    // Draw Sun/Moon
    const angle = ((ctx.time - 6) / 12) * Math.PI; // 6am = 0, 6pm = PI
    const cx = w/2, cy = h;
    const r = w * 0.4;
    const sx = cx - Math.cos(angle) * r;
    const sy = cy - Math.sin(angle) * r;
    
    ctx.beginPath();
    ctx.arc(sx, sy, 30, 0, Math.PI*2);
    ctx.fillStyle = isDay ? '#f5a623' : '#aaaaaa';
    ctx.fill();
    
    // Draw Load Graph
    const load = (Math.sin((ctx.time - 8) / 12 * Math.PI) + 1) * 50 + 20; // Peak around 14:00
    ctx.fillStyle = 'rgba(74, 144, 226, 0.5)';
    ctx.fillRect(50, h - 50, w - 100, -load);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(`Demand: ${load.toFixed(0)} MW`, w/2, h - 20);
});

// ---------------------------------------------------------
// CHAPTER 3: Steam Generators (Boilers)
// ---------------------------------------------------------
init2DScene('ch3-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (!ctx.bubbles) ctx.bubbles = [];
    
    const fuel = parseFloat(document.getElementById('ch3-fuel-2d')?.value || 50);
    const tempSpan = document.getElementById('ch3-temp-2d');
    
    const temp = 200 + fuel * 2; // 220 to 400
    if(tempSpan) tempSpan.innerText = temp.toFixed(0);
    
    // Boiler Tank
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.strokeRect(w/2 - 50, h/2 - 60, 100, 120);
    
    // Water
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(w/2 - 48, h/2, 96, 58);
    
    // Fire
    ctx.fillStyle = '#e24a4a';
    ctx.beginPath();
    ctx.moveTo(w/2 - 30, h/2 + 70);
    ctx.lineTo(w/2 + 30, h/2 + 70);
    ctx.lineTo(w/2, h/2 + 70 - (fuel/100)*40);
    ctx.fill();
    
    // Bubbles
    if (Math.random() < fuel/100) {
        ctx.bubbles.push({ x: w/2 - 40 + Math.random()*80, y: h/2 + 50, r: 2 + Math.random()*3 });
    }
    
    ctx.fillStyle = '#fff';
    for(let i=ctx.bubbles.length-1; i>=0; i--) {
        const b = ctx.bubbles[i];
        b.y -= (fuel/100)*2 + 1;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
        if(b.y < h/2 - 50) ctx.bubbles.splice(i, 1);
    }
});

// ---------------------------------------------------------
// CHAPTER 4: Steam Turbines
// ---------------------------------------------------------
init2DScene('ch4-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (ctx.rot === undefined) ctx.rot = 0;
    
    const v1 = parseFloat(document.getElementById('ch4-v1-2d')?.value || 400);
    const u = parseFloat(document.getElementById('ch4-u-2d')?.value || 150);
    const alpha = parseFloat(document.getElementById('ch4-alpha-2d')?.value || 20);
    
    ctx.rot -= (u / 500); // Reverse rotation to match nozzle
    
    const cx = w/2, cy = h/2;
    
    // Turbine Rotor
    ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI*2); ctx.stroke();
    for(let i=0; i<12; i++) {
        const a = ctx.rot + (i/12)*Math.PI*2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a)*45, cy + Math.sin(a)*45); ctx.stroke();
    }
    
    // Nozzle
    ctx.save();
    ctx.translate(cx, cy);
    const alphaRad = (alpha * Math.PI) / 180;
    ctx.rotate(alphaRad);
    
    ctx.fillStyle = '#e24a4a';
    ctx.beginPath();
    ctx.moveTo(60, -10);
    ctx.lineTo(90, -20);
    ctx.lineTo(90, 20);
    ctx.lineTo(60, 10);
    ctx.fill();
    
    // Steam particle
    ctx.fillStyle = '#fff';
    const dist = 60 + (Date.now() % 500) / 500 * 30; // 60 to 90
    ctx.beginPath(); ctx.arc(dist, 0, 4, 0, Math.PI*2); ctx.fill();
    
    ctx.restore();
});

// ---------------------------------------------------------
// CHAPTER 5: Gas Turbines (Brayton Cycle)
// ---------------------------------------------------------
init2DScene('ch5-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    
    const inter = document.getElementById('ch5-intercooler-2d')?.checked;
    const regen = document.getElementById('ch5-regenerator-2d')?.checked;
    const reheat = document.getElementById('ch5-reheater-2d')?.checked;
    
    const cx = w/2, cy = h/2;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.fillStyle = '#333';
    
    // Basic Components
    ctx.fillRect(cx - 80, cy - 20, 40, 40); ctx.strokeRect(cx - 80, cy - 20, 40, 40); // Compressor
    ctx.fillStyle = '#4a90e2'; ctx.fillText('COMP', cx - 60, cy + 5);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - 20, cy - 80, 40, 40); ctx.strokeRect(cx - 20, cy - 80, 40, 40); // Combustor
    ctx.fillStyle = '#e24a4a'; ctx.fillText('COMB', cx, cy - 55);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(cx + 40, cy - 20, 40, 40); ctx.strokeRect(cx + 40, cy - 20, 40, 40); // Turbine
    ctx.fillStyle = '#f5a623'; ctx.fillText('TURB', cx + 60, cy + 5);
    
    // Lines
    ctx.strokeStyle = '#aaa';
    ctx.beginPath(); ctx.moveTo(cx - 40, cy); ctx.lineTo(cx - 20, cy - 60); ctx.stroke(); // C -> Comb
    ctx.beginPath(); ctx.moveTo(cx + 20, cy - 60); ctx.lineTo(cx + 40, cy); ctx.stroke(); // Comb -> T
    
    // Optional Components
    if(inter) {
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(cx - 100, cy + 40, 40, 20);
        ctx.fillStyle = '#fff'; ctx.fillText('INTER', cx - 80, cy + 55);
    }
    if(regen) {
        ctx.fillStyle = '#888';
        ctx.fillRect(cx - 20, cy + 40, 40, 20);
        ctx.fillStyle = '#fff'; ctx.fillText('REGEN', cx, cy + 55);
    }
    if(reheat) {
        ctx.fillStyle = '#e24a4a';
        ctx.fillRect(cx + 40, cy + 40, 40, 20);
        ctx.fillStyle = '#fff'; ctx.fillText('REHEAT', cx + 60, cy + 55);
    }
});

// ---------------------------------------------------------
// CHAPTER 6: Combined Cycle
// ---------------------------------------------------------
init2DScene('ch6-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    
    const temp = parseFloat(document.getElementById('ch6-temp-2d')?.value || 1300);
    const effSpan = document.getElementById('ch6-eff-2d');
    
    const eff = 35 + (temp - 1000) * 0.04;
    if(effSpan) effSpan.innerText = eff.toFixed(1);
    
    ctx.fillStyle = '#e24a4a';
    const flameH = (temp - 1000) / 600 * 60 + 20;
    
    ctx.beginPath();
    ctx.moveTo(w/2 - 20, h/2 + 40);
    ctx.lineTo(w/2 + 20, h/2 + 40);
    ctx.lineTo(w/2 + (Math.random()-0.5)*10, h/2 + 40 - flameH);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.fillText('Gas Turbine Firing', w/2, h/2 + 60);
});

// ---------------------------------------------------------
// CHAPTER 8: Hydroelectric
// ---------------------------------------------------------
init2DScene('ch8-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    
    const head = parseFloat(document.getElementById('ch8-head-2d')?.value || 100);
    const typeSpan = document.getElementById('ch8-type-2d');
    
    let type = 'Kaplan';
    if(head > 300) type = 'Pelton';
    else if(head > 50) type = 'Francis';
    
    if(typeSpan) typeSpan.innerText = type;
    
    // Dam structure
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.moveTo(w/2, h); ctx.lineTo(w/2, h/2); ctx.lineTo(w/2 + 40, h); ctx.fill();
    
    // Water
    ctx.fillStyle = '#4a90e2';
    const waterH = (head / 500) * (h/2) + 10;
    ctx.fillRect(w/2 - 100, h - waterH, 100, waterH);
    
    // Penstock
    ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(w/2, h - waterH + 10); ctx.lineTo(w/2 + 20, h - 20); ctx.lineTo(w/2 + 80, h - 20); ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.fillText(`Head: ${head}m`, w/2 - 50, h - waterH - 10);
});

// ---------------------------------------------------------
// CHAPTER 9: Nuclear
// ---------------------------------------------------------
init2DScene('ch9-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    
    const rods = parseFloat(document.getElementById('ch9-rods-2d')?.value || 50);
    const tempSpan = document.getElementById('ch9-temp-2d');
    
    const temp = 200 + (100 - rods) * 5; // 0 rods = 700C, 100 rods = 200C
    if(tempSpan) tempSpan.innerText = temp.toFixed(0);
    
    // Core Vessel
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 4;
    ctx.strokeRect(w/2 - 40, h/2 - 60, 80, 120);
    
    // Core glow (based on temp)
    const glow = (temp - 200) / 500; // 0 to 1
    ctx.fillStyle = `rgba(74, 226, 144, ${glow})`;
    ctx.fillRect(w/2 - 38, h/2 - 58, 76, 116);
    
    // Control Rods
    ctx.fillStyle = '#333';
    const rodDrop = (rods / 100) * 100; // 0 to 100 px down
    ctx.fillRect(w/2 - 20, h/2 - 80, 10, 40 + rodDrop);
    ctx.fillRect(w/2 + 10, h/2 - 80, 10, 40 + rodDrop);
});

// ---------------------------------------------------------
// CHAPTER 10: Non-Conventional (Renewables)
// ---------------------------------------------------------
init2DScene('ch10-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if(ctx.rot === undefined) ctx.rot = 0;
    
    const wind = parseFloat(document.getElementById('ch10-wind-2d')?.value || 10);
    const pitch = parseFloat(document.getElementById('ch10-pitch-2d')?.value || 0);
    const pwrSpan = document.getElementById('ch10-power-2d');
    
    // Effective wind speed considering pitch
    const effWind = wind * (1 - pitch/90);
    const power = Math.pow(effWind, 3) * 0.1; // Power ~ v^3
    
    if(pwrSpan) pwrSpan.innerText = power.toFixed(1);
    
    ctx.rot += (effWind / 60);
    
    const cx = w/2, cy = h/2 - 20;
    
    // Tower
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx + 10, h); ctx.lineTo(cx - 10, h); ctx.fill();
    
    // Rotor
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    for(let i=0; i<3; i++) {
        const a = ctx.rot + (i/3)*Math.PI*2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a)*40, cy + Math.sin(a)*40); ctx.stroke();
    }
});

// ---------------------------------------------------------
// CHAPTER 2: Steam Power Plants (Rankine Cycle T-s Engine)
// ---------------------------------------------------------
init2DScene('ch2-canvas', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (ctx.flowOffset === undefined) ctx.flowOffset = 0;
    ctx.flowOffset = (ctx.flowOffset + 1) % 40;

    const pBoiler = parseFloat(document.getElementById('ch2-boiler-p')?.value || 60);
    const tSuper = parseFloat(document.getElementById('ch2-temp')?.value || 500);
    const pCond = parseFloat(document.getElementById('ch2-cond-p')?.value || 0.08);

    const spanP = document.getElementById('ch2-p-val');
    const spanT = document.getElementById('ch2-t-val');
    const spanPc = document.getElementById('ch2-pc-val');
    if (spanP) spanP.innerText = pBoiler;
    if (spanT) spanT.innerText = tSuper;
    if (spanPc) spanPc.innerText = pCond;

    // Thermodynamic Calculations (Rankine Cycle Approximation)
    const h1 = 2500 + 2.1 * tSuper + (pBoiler * 0.8); // Superheated steam
    const s1 = 6.8 + (tSuper / 1000) - Math.log(pBoiler / 10) * 0.15;
    const sf = 0.6, sg = 8.1, hf = 175, hfg = 2400;
    const x2 = Math.min(0.98, Math.max(0.78, (s1 - sf) / (sg - sf)));
    const h2 = hf + x2 * hfg; // Turbine exit
    const h3 = hf; // Condenser exit
    const wp = (pBoiler - pCond * 10) * 0.1; // Pump work
    const h4 = h3 + wp; // Boiler inlet
    const wt = Math.max(100, Math.round(h1 - h2));
    const qin = Math.max(500, Math.round(h1 - h4));
    const eta = Math.min(48, Math.max(22, (((wt - wp) / qin) * 100))).toFixed(1);

    const spanWt = document.getElementById('ch2-wt');
    const spanQin = document.getElementById('ch2-qin');
    const spanEta = document.getElementById('ch2-eta');
    if (spanWt) spanWt.innerText = wt;
    if (spanQin) spanQin.innerText = qin;
    if (spanEta) spanEta.innerText = `${eta}%`;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#fafafa' : '#18181b';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    // Left half: T-s Diagram
    const tsW = Math.min(w * 0.48, 320);
    const tsH = h - 40;
    const ox = 40, oy = h - 30;

    // Axes
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(ox + tsW, oy);
    ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - tsH);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = '10px monospace';
    ctx.fillText('Entropy (s) →', ox + tsW - 70, oy + 15);
    ctx.fillText('Temp (T) ↑', ox - 30, oy - tsH + 12);

    // Draw Saturation Vapor Dome
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let s = 0; s <= 100; s += 2) {
        const normS = s / 100;
        const normT = Math.sin(normS * Math.PI) * 0.72; // bell curve dome
        const dx = ox + normS * tsW;
        const dy = oy - normT * tsH;
        if (s === 0) ctx.moveTo(dx, dy); else ctx.lineTo(dx, dy);
    }
    ctx.stroke();

    // Rankine Cycle Points on T-s
    const p1x = ox + (s1 / 8.5) * tsW, p1y = oy - Math.min(tsH * 0.95, (tSuper / 650) * tsH);
    const p2x = ox + (s1 / 8.5) * tsW, p2y = oy - (tsH * 0.22); // Turbine expansion
    const p3x = ox + (sf / 8.5) * tsW, p3y = oy - (tsH * 0.22); // Condenser
    const p4x = ox + (sf / 8.5) * tsW, p4y = oy - (tsH * 0.25); // Pump

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p4x, p4y);
    ctx.lineTo(ox + 0.3 * tsW, oy - tsH * 0.55); // Heating along isobar
    ctx.lineTo(p1x, p1y); // Superheat peak
    ctx.lineTo(p2x, p2y); // Isentropic expansion
    ctx.lineTo(p3x, p3y); // Heat rejection
    ctx.closePath();
    ctx.stroke();

    // State dots
    [p1x, p2x, p3x, p4x].forEach((px, idx) => {
        const py = [p1y, p2y, p3y, p4y][idx];
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = textColor;
        ctx.fillText(`State ${idx + 1}`, px + 6, py - 4);
    });

    // Right half: Component Cycle Flow Diagram
    const rx = Math.max(tsW + 70, w * 0.52);
    const rw = w - rx - 20;
    const cy = h / 2;

    const boilerBox = { x: rx + rw * 0.05, y: cy - 90, w: rw * 0.38, h: 55, name: 'Boiler / SG', col: '#ef4444' };
    const turbBox   = { x: rx + rw * 0.55, y: cy - 90, w: rw * 0.38, h: 55, name: 'Turbine', col: '#f59e0b' };
    const condBox   = { x: rx + rw * 0.55, y: cy + 40, w: rw * 0.38, h: 55, name: 'Condenser', col: '#0284c7' };
    const pumpBox   = { x: rx + rw * 0.05, y: cy + 40, w: rw * 0.38, h: 55, name: 'Feed Pump', col: '#10b981' };

    [boilerBox, turbBox, condBox, pumpBox].forEach(b => {
        ctx.fillStyle = isDark ? '#27272a' : '#f4f4f5';
        ctx.strokeStyle = b.col;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, b.x + b.w / 2, b.y + b.h / 2 + 4);
    });
    ctx.textAlign = 'left';

    // Flow Pipes with animated dashes
    ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -ctx.flowOffset;

    ctx.beginPath();
    // Boiler to Turbine
    ctx.moveTo(boilerBox.x + boilerBox.w, boilerBox.y + boilerBox.h / 2);
    ctx.lineTo(turbBox.x, turbBox.y + turbBox.h / 2);
    // Turbine to Condenser
    ctx.moveTo(turbBox.x + turbBox.w / 2, turbBox.y + turbBox.h);
    ctx.lineTo(condBox.x + condBox.w / 2, condBox.y);
    // Condenser to Pump
    ctx.moveTo(condBox.x, condBox.y + condBox.h / 2);
    ctx.lineTo(pumpBox.x + pumpBox.w, pumpBox.y + pumpBox.h / 2);
    // Pump to Boiler
    ctx.moveTo(pumpBox.x + pumpBox.w / 2, pumpBox.y);
    ctx.lineTo(boilerBox.x + boilerBox.w / 2, boilerBox.y + boilerBox.h);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
});

// ---------------------------------------------------------
// CHAPTER 7: Diesel Engine Power Plants (Load & Governor Engine)
// ---------------------------------------------------------
init2DScene('ch7-canvas', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (ctx.crankAngle === undefined) ctx.crankAngle = 0;

    const load = parseFloat(document.getElementById('ch7-load')?.value || 75);
    const cr = parseFloat(document.getElementById('ch7-cr')?.value || 17);

    const spanLoad = document.getElementById('ch7-load-val');
    const spanCr = document.getElementById('ch7-cr-val');
    if (spanLoad) spanLoad.innerText = load;
    if (spanCr) spanCr.innerText = cr;

    // Performance physics calculations
    const gamma = 1.35;
    const rc = 1 + (load / 100) * 1.5; // Cutoff ratio increases with fuel load
    const dieselEff = (1 - (1 / Math.pow(cr, gamma - 1)) * ((Math.pow(rc, gamma) - 1) / (gamma * (rc - 1)))) * 100;
    const eff = Math.min(46, Math.max(28, dieselEff)).toFixed(1);
    const bsfc = (200 + Math.pow(Math.abs(load - 75), 1.5) * 0.6 + (20 - cr) * 2).toFixed(0);
    const freq = (50.0 - (load > 100 ? (load - 100) * 0.08 : 0)).toFixed(1);

    const spanBsfc = document.getElementById('ch7-bsfc');
    const spanFreq = document.getElementById('ch7-freq');
    const spanEff = document.getElementById('ch7-eff');
    if (spanBsfc) spanBsfc.innerText = bsfc;
    if (spanFreq) spanFreq.innerText = freq;
    if (spanEff) spanEff.innerText = `${eff}%`;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#fafafa' : '#18181b';

    // Engine speed tied to frequency
    const rpmSpeed = (parseFloat(freq) / 50) * 0.12;
    ctx.crankAngle = (ctx.crankAngle + rpmSpeed) % (Math.PI * 2);

    // Left side: Animated 2-Cylinder Engine & Crankshaft
    const cx = Math.min(w * 0.28, 180);
    const cy = h / 2 + 30;
    const strokeR = 25, rodL = 65;

    for (let cyl = 0; cyl < 2; cyl++) {
        const cylX = cx + (cyl - 0.5) * 60;
        const angle = ctx.crankAngle + (cyl * Math.PI);
        const pinX = cylX + Math.sin(angle) * strokeR;
        const pinY = cy - Math.cos(angle) * strokeR;
        const pistonY = cy - (Math.cos(angle) * strokeR + Math.sqrt(rodL * rodL - Math.pow(Math.sin(angle) * strokeR, 2)));

        // Cylinder walls
        ctx.strokeStyle = isDark ? '#52525b' : '#a1a1aa';
        ctx.lineWidth = 3;
        ctx.strokeRect(cylX - 22, cy - 130, 44, 85);

        // Combustion flash during expansion
        if (Math.cos(angle) > 0.8 && cyl === 0) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            ctx.fillRect(cylX - 20, cy - 128, 40, pistonY - (cy - 128));
        }

        // Connecting rod
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cylX, cy);
        ctx.lineTo(pinX, pinY);
        ctx.lineTo(cylX, pistonY);
        ctx.stroke();

        // Piston block
        ctx.fillStyle = isDark ? '#d4d4d8' : '#71717a';
        ctx.fillRect(cylX - 20, pistonY - 20, 40, 20);

        // Crank circle
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cylX, cy, strokeR, 0, Math.PI * 2); ctx.stroke();
    }

    // Center: Mechanical Centrifugal Governor
    const govX = Math.min(w * 0.55, 340);
    const govY = h / 2 - 10;
    const flySpread = 15 + (1 - (parseFloat(freq) / 52)) * 25; // Governor balls expand with speed

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    // Central spindle
    ctx.beginPath(); ctx.moveTo(govX, govY - 50); ctx.lineTo(govX, govY + 50); ctx.stroke();
    // Fly arms
    ctx.beginPath();
    ctx.moveTo(govX, govY - 35); ctx.lineTo(govX - flySpread, govY); ctx.lineTo(govX, govY + 35);
    ctx.moveTo(govX, govY - 35); ctx.lineTo(govX + flySpread, govY); ctx.lineTo(govX, govY + 35);
    ctx.stroke();

    // Flyballs
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(govX - flySpread, govY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(govX + flySpread, govY, 6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Watt Governor', govX, govY + 70);

    // Right: Alternator Output & Frequency Gauge
    const altX = Math.max(govX + 90, w * 0.78);
    const altY = h / 2 - 15;
    const radius = Math.min(h * 0.35, 60);

    ctx.beginPath();
    ctx.arc(altX, altY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Meter Needle
    const needleAngle = Math.PI * 0.75 + ((parseFloat(freq) - 48) / 4) * Math.PI * 1.5;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(altX, altY);
    ctx.lineTo(altX + Math.cos(needleAngle) * (radius - 10), altY + Math.sin(needleAngle) * (radius - 10));
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${freq} Hz`, altX, altY + 25);
    ctx.font = '10px monospace';
    ctx.fillText(`Load: ${load}%`, altX, altY + radius + 20);
    ctx.textAlign = 'left';
});

