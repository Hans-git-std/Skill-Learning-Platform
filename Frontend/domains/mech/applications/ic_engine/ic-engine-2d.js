// Utility to initialize 2D Canvas
function init2DScene(canvasId, renderCallback) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    const renderLoop = () => {
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
            // Match CSS size
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
            renderCallback(ctx, width, height);
        }
        requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return ctx;
}

// ---------------------------------------------------------
// CHAPTER 1: Introduction (Engine Kinematics)
// ---------------------------------------------------------
init2DScene('ch1-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const crank = document.getElementById('ch1-crank-2d');
    const angle = crank ? parseFloat(crank.value) * (Math.PI / 180) : 0;
    
    const cx = w/2, cy = h/2 + 50;
    const r = 30, l = 90;
    const px = cx + r * Math.sin(angle);
    const py = cy - r * Math.cos(angle);
    
    const py_piston = cy - (r * Math.cos(angle) + Math.sqrt(l*l - r*r*Math.sin(angle)*Math.sin(angle)));

    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 4;
    ctx.strokeRect(cx - 30, cy - 150, 60, 100); // cylinder

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke(); // crank path
    
    // Conrod
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.lineTo(cx, py_piston); ctx.strokeStyle = '#ccc'; ctx.stroke();
    
    // Piston
    ctx.fillStyle = '#ccc';
    ctx.fillRect(cx - 25, py_piston - 20, 50, 20);
});

// ---------------------------------------------------------
// CHAPTER 2: Engine Cycles
// ---------------------------------------------------------
init2DScene('ch2-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    
    const cycleSelect = document.getElementById('ch2-cycle-2d');
    const rInput = document.getElementById('ch2-r-2d');
    const rhoInput = document.getElementById('ch2-rho-2d');
    
    const cycle = cycleSelect ? cycleSelect.value : 'otto';
    const compRatio = rInput ? parseFloat(rInput.value) : 10;
    const cutRatio = rhoInput ? parseFloat(rhoInput.value) : 1.5;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    // Axes
    ctx.beginPath(); ctx.moveTo(30, 20); ctx.lineTo(30, h-30); ctx.lineTo(w-20, h-30); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillText('V', w-25, h-15); ctx.fillText('P', 15, 25);
    
    // Base coordinates
    const vMin = 50; 
    const vMax = 50 + (w - 100) * (compRatio / 25); // Scale visual stroke by r
    const pMin = h - 40; 
    const pMax = 40;

    ctx.strokeStyle = '#e24a4a';
    ctx.beginPath();
    
    if (cycle === 'otto') {
        // 1 -> 2 (Isentropic comp)
        ctx.moveTo(vMax, pMin); 
        ctx.quadraticCurveTo(vMax*0.7, pMin, vMin, pMax); 
        // 2 -> 3 (Const Vol Heat Add)
        ctx.lineTo(vMin, pMax - 20); 
        // 3 -> 4 (Isentropic exp)
        ctx.quadraticCurveTo(vMax*0.7, pMax - 20, vMax, pMin - 20); 
        // 4 -> 1 (Const Vol Heat Reject)
        ctx.lineTo(vMax, pMin);
    } else {
        // Diesel
        // 1 -> 2 (Isentropic comp)
        ctx.moveTo(vMax, pMin); 
        ctx.quadraticCurveTo(vMax*0.7, pMin, vMin, pMax); 
        // 2 -> 3 (Const Press Heat Add)
        const vCut = vMin + (vMax - vMin) * (cutRatio / 3);
        ctx.lineTo(vCut, pMax); 
        // 3 -> 4 (Isentropic exp)
        ctx.quadraticCurveTo(vMax*0.8, pMax, vMax, pMin - 20); 
        // 4 -> 1 (Const Vol)
        ctx.lineTo(vMax, pMin);
    }
    ctx.stroke();

    const eff = document.getElementById('ch2-eff-2d');
    if(eff) {
        if(cycle === 'otto') {
            eff.innerText = (100 * (1 - 1/Math.pow(compRatio, 0.4))).toFixed(1);
        } else {
            const num = Math.pow(cutRatio, 1.4) - 1;
            const den = 1.4 * (cutRatio - 1);
            eff.innerText = (100 * (1 - (1/Math.pow(compRatio, 0.4)) * (num/den))).toFixed(1);
        }
    }
});

// ---------------------------------------------------------
// CHAPTER 3: Actual Cycles
// ---------------------------------------------------------
init2DScene('ch3-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    
    // Draw Ideal cycle faintly
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2; 
    ctx.beginPath();
    ctx.moveTo(w-50, h-40); ctx.quadraticCurveTo(w/2, h-40, 50, 40); ctx.lineTo(50, 20); ctx.quadraticCurveTo(w/2, 20, w-50, h-60); ctx.lineTo(w-50, h-40);
    ctx.stroke();
    
    const varCp = document.getElementById('ch3-var-cp-2d')?.checked;
    const dissoc = document.getElementById('ch3-dissoc-2d')?.checked;
    const timeLoss = document.getElementById('ch3-time-loss-2d')?.checked;
    const pumpLoss = document.getElementById('ch3-pump-loss-2d')?.checked;

    ctx.strokeStyle = '#4ae290'; ctx.lineWidth = 3;
    
    const pPeak = 20 + (varCp ? 20 : 0) + (dissoc ? 30 : 0);
    const pExh = h-60 + (timeLoss ? 10 : 0);

    ctx.beginPath();
    // Start of comp
    ctx.moveTo(w-50, h-40); 
    // Comp curve
    ctx.quadraticCurveTo(w/2, h-40, 50, pPeak + 20); 
    
    // Heat addition (rounded if timeLoss)
    if (timeLoss) {
        ctx.quadraticCurveTo(60, pPeak, 80, pPeak + 10); 
        ctx.quadraticCurveTo(w/2, pPeak + 20, w-50, pExh);
    } else {
        ctx.lineTo(50, pPeak); 
        ctx.quadraticCurveTo(w/2, pPeak, w-50, pExh); 
    }
    
    // Blowdown (rounded if timeLoss)
    if (timeLoss) {
        ctx.quadraticCurveTo(w-40, h-40, w-50, h-40);
    } else {
        ctx.lineTo(w-50, h-40);
    }

    if (pumpLoss) {
        // Pumping loop
        ctx.lineTo(50, h-40);
        ctx.lineTo(50, h-20);
        ctx.lineTo(w-50, h-20);
        ctx.lineTo(w-50, h-40);
    }
    ctx.stroke();
});

// ---------------------------------------------------------
// CHAPTER 4: SI Combustion (HIGH FIDELITY)
// ---------------------------------------------------------
init2DScene('ch4-canvas-2d', (ctx, w, h) => {
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, w, h);
    
    if(ctx.radius === undefined) ctx.radius = 0;
    
    const octaneInput = document.getElementById('ch4-octane-2d');
    const sparkInput = document.getElementById('ch4-spark-2d');
    const btn = document.getElementById('ch4-ignite-2d');
    const statusSpan = document.getElementById('ch4-status-2d');

    if(btn && !btn.onclick) {
        btn.onclick = () => { ctx.radius = 0.1; ctx.igniting = true; };
    }

    // Continuously check knock status to reset if inputs are fixed
    if (octaneInput && sparkInput && statusSpan) {
        const octane = parseFloat(octaneInput.value);
        const spark = parseFloat(sparkInput.value);
        const isKnockCondition = (octane < 90 && spark > 10) || (octane < 85);
        if (!ctx.igniting && !isKnockCondition) {
            statusSpan.innerText = "Normal";
            statusSpan.style.color = "#10b981";
        }
    }

    if(ctx.igniting) {
        ctx.radius += 2;
        ctx.beginPath();
        ctx.arc(w/2, h/2, ctx.radius, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.fill();
        
        if (octaneInput && sparkInput && statusSpan) {
            const octane = parseFloat(octaneInput.value);
            const spark = parseFloat(sparkInput.value);
            // Knock simulation
            if ((octane < 90 && spark > 10 || octane < 85) && ctx.radius > w/3) {
                ctx.fillStyle = 'white';
                ctx.beginPath(); ctx.arc(w/2 + w/3, h/2 - 20, 20, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(w/2 - w/3, h/2 + 20, 15, 0, Math.PI*2); ctx.fill();
                statusSpan.innerText = "KNOCK DETECTED";
                statusSpan.style.color = "#e24a4a";
            }
        }
        
        if(ctx.radius > w) ctx.igniting = false;
    }
});

// ---------------------------------------------------------
// CHAPTER 5: CI Combustion (Fuel Spray)
// ---------------------------------------------------------
init2DScene('ch5-canvas-2d', (ctx, w, h) => {
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, w, h);
    
    if(!ctx.particles) ctx.particles = [];
    
    const btn = document.getElementById('ch5-inject-2d');
    if(btn && !btn.onclick) {
        btn.onclick = () => {
            const press = document.getElementById('ch5-pressure-2d');
            const pVal = press ? parseFloat(press.value) : 1000;
            for(let i=0; i<100; i++) {
                ctx.particles.push({
                    x: w/2, y: 10,
                    vx: (Math.random() - 0.5) * (2000/pVal),
                    vy: (Math.random() * 2 + 2) * (pVal / 500),
                    life: 1.0
                });
            }
        };
    }
    
    ctx.fillStyle = '#88ccff';
    for(let i=ctx.particles.length-1; i>=0; i--) {
        const p = ctx.particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.95; p.vy *= 0.98; 
        p.life -= 0.02;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
        if(p.life <= 0) ctx.particles.splice(i, 1);
    }
});


// ---------------------------------------------------------
// CHAPTER 6: Fuels (Molecules)
// ---------------------------------------------------------
init2DScene('ch6-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#4a90e2';
    
    const select = document.getElementById('ch6-fuel-2d');
    const val = select ? select.value : 'octane';
    let energy = 44, octane = 100;
    if(val==='dodecane') { energy=43; octane=15; }
    if(val==='ethanol') { energy=26; octane=108; }
    if(val==='hydrogen') { energy=120; octane=130; }
    
    // Scale down bars if energy is huge
    const eScale = energy > 100 ? 0.8 : 2;
    ctx.fillRect(50, h - (energy*eScale), 40, energy*eScale);
    ctx.fillStyle = '#fff'; ctx.fillText('Energy (MJ/kg)', 30, h - (energy*eScale) - 10);
    
    const oScale = octane > 100 ? 1 : 1.5;
    ctx.fillStyle = '#e24a4a';
    ctx.fillRect(150, h - (octane*oScale), 40, octane*oScale);
    ctx.fillStyle = '#fff'; ctx.fillText('Octane', 150, h - (octane*oScale) - 10);
});

// ---------------------------------------------------------
// CHAPTER 7: Injection Systems
// ---------------------------------------------------------
init2DScene('ch7-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (!ctx.drops) ctx.drops = [];
    
    // Injector nozzle
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.moveTo(w/2 - 20, 0); ctx.lineTo(w/2 + 20, 0); ctx.lineTo(w/2 + 5, 40); ctx.lineTo(w/2 - 5, 40); ctx.fill();
    
    const press = document.getElementById('ch7-pressure-2d');
    const btn = document.getElementById('ch7-pulse-2d');
    
    if(btn && !btn.onclick) {
        btn.onclick = () => { ctx.injecting = 1.0; };
    }
    
    if (ctx.injecting > 0) {
        ctx.injecting -= 0.05;
        const pVal = press ? parseFloat(press.value) : 1500;
        for(let i=0; i<20; i++) {
            ctx.drops.push({
                x: w/2 + (Math.random()-0.5)*10,
                y: 40,
                vx: (Math.random()-0.5) * (pVal/200),
                vy: (Math.random()*2 + 2) * (pVal/500)
            });
        }
    }
    
    ctx.fillStyle = '#4a90e2';
    for(let i=ctx.drops.length-1; i>=0; i--) {
        const d = ctx.drops[i];
        d.x += d.vx; d.y += d.vy; d.vx *= 0.95; // drag
        ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI*2); ctx.fill();
        if(d.y > h) ctx.drops.splice(i, 1);
    }
});

// ---------------------------------------------------------
// CHAPTER 8: Cooling & Lubrication
// ---------------------------------------------------------
init2DScene('ch8-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if(ctx.temp === undefined) ctx.temp = 80; // Celsius
    if(ctx.flow === undefined) ctx.flow = 0;
    
    const loadInput = document.getElementById('ch8-load-2d');
    const pumpInput = document.getElementById('ch8-pump-2d');
    
    const load = loadInput ? parseFloat(loadInput.value) : 50;
    const pumpOn = pumpInput ? pumpInput.checked : true;
    
    // Engine heats up based on load, cools based on pump
    ctx.temp += (load * 0.01) - (pumpOn ? 0.5 : 0.05);
    if(ctx.temp < 20) ctx.temp = 20;
    if(ctx.temp > 150) ctx.temp = 150;
    
    if(pumpOn) ctx.flow += 2;
    
    // Draw Engine Block
    ctx.fillStyle = ctx.temp > 110 ? '#e24a4a' : (ctx.temp < 70 ? '#4a90e2' : '#4ae290');
    ctx.fillRect(w/2 - 40, h/2 - 40, 80, 80);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('ENGINE', w/2, h/2);
    ctx.fillText(`${ctx.temp.toFixed(0)} °C`, w/2, h/2 + 20);
    
    // Draw Radiator & Coolant Loop
    ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 4;
    if(pumpOn) {
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -ctx.flow;
    } else {
        ctx.setLineDash([]);
    }
    ctx.beginPath(); ctx.moveTo(w/2 + 40, h/2 - 20); ctx.lineTo(w/2 + 100, h/2 - 20); ctx.lineTo(w/2 + 100, h/2 + 20); ctx.lineTo(w/2 + 40, h/2 + 20); ctx.stroke();
    
    ctx.fillStyle = '#888';
    ctx.fillRect(w/2 + 90, h/2 - 30, 20, 60); // Radiator
    ctx.fillStyle = '#fff'; ctx.fillText('RAD', w/2 + 100, h/2 + 45);
    ctx.setLineDash([]);
});

// ---------------------------------------------------------
// CHAPTER 9: Supercharging
// ---------------------------------------------------------
init2DScene('ch9-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if(ctx.rot === undefined) ctx.rot = 0;
    
    const throttle = document.getElementById('ch9-throttle-2d');
    const boostSpan = document.getElementById('ch9-boost-2d');
    const thVal = throttle ? parseFloat(throttle.value) : 30;
    
    const rpm = thVal * 1000;
    ctx.rot += (rpm / 60000) * Math.PI * 2;
    
    const boost = (thVal > 40) ? (thVal - 40) * 0.2 : 0;
    if(boostSpan) boostSpan.innerText = boost.toFixed(1);
    
    const cx = w/2, cy = h/2;
    
    // Draw Turbine Shell
    ctx.strokeStyle = '#555'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx - 30, cy, 40, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 30, cy, 40, 0, Math.PI*2); ctx.stroke();
    
    // Draw Turbine Wheels
    ctx.strokeStyle = '#e24a4a'; ctx.lineWidth = 2; // Exhaust turbine
    for(let i=0; i<6; i++) {
        const a = ctx.rot + (i/6)*Math.PI*2;
        ctx.beginPath(); ctx.moveTo(cx-30, cy); ctx.lineTo(cx-30 + Math.cos(a)*35, cy + Math.sin(a)*35); ctx.stroke();
    }
    
    ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 2; // Compressor
    for(let i=0; i<6; i++) {
        const a = ctx.rot + (i/6)*Math.PI*2;
        ctx.beginPath(); ctx.moveTo(cx+30, cy); ctx.lineTo(cx+30 + Math.cos(a)*35, cy + Math.sin(a)*35); ctx.stroke();
    }
    
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('EXHAUST', cx - 30, cy + 60);
    ctx.fillText('INTAKE', cx + 30, cy + 60);
});

// ---------------------------------------------------------
// CHAPTER 10: Emissions
// ---------------------------------------------------------
init2DScene('ch10-canvas-2d', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (!ctx.particles) ctx.particles = [];
    
    const afrInput = document.getElementById('ch10-afr-2d');
    const afr = afrInput ? parseFloat(afrInput.value) : 1.0;
    
    // Generate exhaust
    ctx.particles.push({
        x: w/2 - 20 + Math.random()*40, y: h,
        vx: (Math.random()-0.5)*2, vy: -2 - Math.random()*2,
        life: 1.0, type: afr > 1.05 ? 'nox' : (afr < 0.95 ? 'co' : 'clean')
    });
    
    for(let i=ctx.particles.length-1; i>=0; i--) {
        const p = ctx.particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.01;
        
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
        if(p.type === 'nox') ctx.fillStyle = `rgba(226, 74, 74, ${p.life})`; // Red for NOx
        else if(p.type === 'co') ctx.fillStyle = `rgba(50, 50, 50, ${p.life})`; // Dark grey for CO
        else ctx.fillStyle = `rgba(200, 200, 200, ${p.life})`; // Light grey for clean
        ctx.fill();
        
        if(p.life <= 0) ctx.particles.splice(i, 1);
    }
    
    // Draw exhaust pipe
    ctx.fillStyle = '#666'; ctx.fillRect(w/2 - 30, h - 50, 60, 50);
});
