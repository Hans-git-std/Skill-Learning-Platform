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
