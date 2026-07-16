/**
 * Manufacturing Technology - Interactive Simulator Engine
 * Contains 3D rendering and logic for chapters 1-11.
 */
console.log("Manufacturing Engine Loaded.");

// ============================================================================
// CORE UTILITIES
// ============================================================================
function setupCanvas(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Clear placeholders
    container.innerHTML = '';
    
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Auto-resize listener
    window.addEventListener('resize', () => {
        const newRect = container.getBoundingClientRect();
        canvas.width = newRect.width * dpr;
        canvas.height = newRect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${newRect.width}px`;
        canvas.style.height = `${newRect.height}px`;
    });
    
    return { canvas, ctx, width: rect.width, height: rect.height };
}

function getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#050508' : '#e2e8f0',
        text: isDark ? '#f8fafc' : '#0f172a',
        textSec: isDark ? '#94a3b8' : '#475569',
        accent: isDark ? '#f97316' : '#ea580c',      // Forge Orange
        accentGlow: isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(234, 88, 12, 0.1)',
        neon: isDark ? '#38bdf8' : '#0284c7',        // Steel Blue
        grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        metal: isDark ? '#475569' : '#cbd5e1',       // Neutral metal
        hotMetal: '#ef4444'                          // Red hot
    };
}

// ============================================================================
// SIMULATOR 1: CASTING FLUID DYNAMICS (CHVORINOV & BERNOULLI)
// ============================================================================
function initSim1() {
    const sim = setupCanvas('canvas-container-1');
    if(!sim) return;
    
    const ui = {
        taper: document.getElementById('sim1-taper'),
        btn: document.getElementById('sim1-pour'),
        velOut: document.getElementById('sim1-vel'),
        tsOut: document.getElementById('sim1-ts')
    };
    
    let isPouring = false;
    let fillLevel = 0; // 0 to 1
    let time = 0;
    
    ui.btn.addEventListener('click', () => {
        isPouring = true;
        fillLevel = 0;
        time = 0;
        ui.btn.innerText = "Pouring...";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const w = sim.width;
        const h = sim.height;
        
        // Define mold geometry
        const sprueX = w * 0.3;
        const sprueY = h * 0.2;
        const sprueH = h * 0.5;
        const sprueTopW = 60;
        const taper = ui.taper.value;
        const sprueBotW = taper === 'tapered' ? 20 : 60;
        
        const cavityW = 120;
        const cavityH = 120; // sphere/cube
        const cavityY = sprueY + sprueH - cavityH + 10; // Align bottom of cavity with runner
        
        const runnerY = sprueY + sprueH;
        const runnerH = 20;
        const runnerL = w * 0.3;
        const cavityX = sprueX + runnerL;
        
        // Draw Sand Mold (Background subtract)
        sim.ctx.fillStyle = isPouring ? '#d4a373' : '#e6ccb2'; // sand color
        sim.ctx.fillRect(0, 0, w, h);
        
        sim.ctx.globalCompositeOperation = 'destination-out';
        
        // Cut out Sprue
        sim.ctx.beginPath();
        sim.ctx.moveTo(sprueX - sprueTopW/2, sprueY);
        sim.ctx.lineTo(sprueX + sprueTopW/2, sprueY);
        sim.ctx.lineTo(sprueX + sprueBotW/2, runnerY);
        sim.ctx.lineTo(sprueX - sprueBotW/2, runnerY);
        sim.ctx.fill();
        
        // Cut out Runner
        sim.ctx.fillRect(sprueX - sprueBotW/2, runnerY, runnerL + sprueBotW, runnerH);
        
        // Cut out Cavity
        sim.ctx.beginPath();
        sim.ctx.arc(cavityX + cavityW/2, cavityY + cavityH/2, cavityW/2, 0, Math.PI*2);
        sim.ctx.fill();
        
        sim.ctx.globalCompositeOperation = 'source-over';
        
        // Physics update
        let v2 = 0;
        if(isPouring) {
            time += 0.016; // 60fps
            const g = 9.81;
            const h_meters = sprueH / 1000; // scale
            v2 = Math.sqrt(2 * g * h_meters) * 2; // exaggerated
            
            fillLevel += 0.01;
            if(fillLevel >= 1) {
                fillLevel = 1;
                isPouring = false;
                ui.btn.innerText = "Solidifying...";
                // Calculate Chvorinov
                const V = (4/3) * Math.PI * Math.pow(cavityW/2, 3);
                const A = 4 * Math.PI * Math.pow(cavityW/2, 2);
                const ts = 2.0 * Math.pow(V/A, 2) / 1000;
                ui.tsOut.innerText = ts.toFixed(1);
            }
            ui.velOut.innerText = v2.toFixed(2);
        }
        
        // Draw Molten Metal
        if(fillLevel > 0) {
            // Hot orange to cool solid metal gradient
            let tempColor = isPouring ? c.accent : (fillLevel === 1 ? c.metal : '#f97316');
            sim.ctx.fillStyle = tempColor;
            
            // Fill Sprue (simplified)
            sim.ctx.beginPath();
            sim.ctx.moveTo(sprueX - sprueBotW/2, runnerY);
            sim.ctx.lineTo(sprueX + sprueBotW/2, runnerY);
            sim.ctx.lineTo(sprueX + (sprueTopW/2)*fillLevel, runnerY - sprueH*fillLevel);
            sim.ctx.lineTo(sprueX - (sprueTopW/2)*fillLevel, runnerY - sprueH*fillLevel);
            sim.ctx.fill();
            
            // Fill Runner
            sim.ctx.fillRect(sprueX - sprueBotW/2, runnerY, runnerL * fillLevel, runnerH);
            
            // Fill Cavity
            if(fillLevel > 0.5) {
                const cavFill = (fillLevel - 0.5) * 2;
                sim.ctx.save();
                sim.ctx.beginPath();
                sim.ctx.arc(cavityX + cavityW/2, cavityY + cavityH/2, cavityW/2, 0, Math.PI*2);
                sim.ctx.clip();
                sim.ctx.fillRect(cavityX, cavityY + cavityH - cavityH*cavFill, cavityW, cavityH*cavFill);
                sim.ctx.restore();
            }
            
            // Turbulence visual in sprue if not tapered
            if(taper === 'straight' && isPouring) {
                sim.ctx.fillStyle = 'rgba(255,255,255,0.4)';
                for(let i=0; i<10; i++) {
                    sim.ctx.beginPath();
                    sim.ctx.arc(sprueX + (Math.random()-0.5)*sprueBotW, runnerY - Math.random()*sprueH, Math.random()*5, 0, Math.PI*2);
                    sim.ctx.fill();
                }
            }
        }
        
        // UI Labels
        sim.ctx.fillStyle = c.textSec;
        sim.ctx.font = '14px Inter';
        sim.ctx.fillText("Sprue (Head)", sprueX - 80, sprueY + 20);
        sim.ctx.fillText("Runner", sprueX + runnerL/2, runnerY + 40);
        sim.ctx.fillText("Mold Cavity", cavityX + 20, cavityY - 10);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 2: THE ROLLING MILL (BULK DEFORMATION)
// ============================================================================
function initSim2() {
    const sim = setupCanvas('canvas-container-2');
    if(!sim) return;
    
    const ui = {
        gap: document.getElementById('sim2-gap'),
        mu: document.getElementById('sim2-mu'),
        btn: document.getElementById('sim2-roll'),
        redOut: document.getElementById('sim2-red'),
        stressOut: document.getElementById('sim2-stress'),
        statusOut: document.getElementById('sim2-status')
    };
    
    let isRolling = false;
    let billetPos = 0;
    
    ui.btn.addEventListener('click', () => {
        isRolling = true;
        billetPos = 0;
        ui.btn.innerText = "Rolling...";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const w = sim.width;
        const h = sim.height;
        const cx = w/2;
        const cy = h/2;
        
        const R = 80; // Roll radius
        const h0 = 50; // Initial thickness
        const gapVal = parseFloat(ui.gap.value); // 1 to 10
        const hf = h0 - gapVal * 3; // Final thickness (exaggerated for visual)
        const mu = parseFloat(ui.mu.value);
        
        // Rolling limits logic
        const draft = h0 - hf;
        const dmax = mu * mu * R; 
        
        let status = "OK";
        let slip = false;
        if(draft > dmax * 5) { // scale factor for demo
            status = "SLIP! Draft > \u03BC\u00B2R";
            slip = true;
        }
        ui.statusOut.innerText = status;
        if(slip) ui.statusOut.style.color = '#ef4444';
        else ui.statusOut.style.color = c.textSec;
        
        const reduction = (draft / h0) * 100;
        ui.redOut.innerText = reduction.toFixed(1);
        
        // Flow stress K*e^n (fake values for visual)
        const strain = Math.log(h0/hf);
        const stress = 500 * Math.pow(strain, 0.2); 
        ui.stressOut.innerText = slip ? "0" : stress.toFixed(0);
        
        if(isRolling) {
            if(!slip) billetPos += 3;
            else billetPos += 0.5; // very slow slipping
            if(billetPos > w * 0.8) {
                isRolling = false;
                ui.btn.innerText = "Reset Billet";
            }
        }
        
        // Draw Rolls
        const topRollY = cy - hf/2 - R;
        const botRollY = cy + hf/2 + R;
        
        sim.ctx.fillStyle = c.neon;
        sim.ctx.strokeStyle = c.text;
        sim.ctx.lineWidth = 2;
        
        // Top Roll
        sim.ctx.beginPath(); sim.ctx.arc(cx, topRollY, R, 0, Math.PI*2); sim.ctx.fill(); sim.ctx.stroke();
        // Crosshair to show rotation
        sim.ctx.beginPath();
        sim.ctx.moveTo(cx, topRollY);
        sim.ctx.lineTo(cx + R*Math.cos(Date.now()*0.005), topRollY + R*Math.sin(Date.now()*0.005));
        sim.ctx.stroke();
        
        // Bot Roll
        sim.ctx.beginPath(); sim.ctx.arc(cx, botRollY, R, 0, Math.PI*2); sim.ctx.fill(); sim.ctx.stroke();
        sim.ctx.beginPath();
        sim.ctx.moveTo(cx, botRollY);
        sim.ctx.lineTo(cx + R*Math.cos(-Date.now()*0.005), botRollY + R*Math.sin(-Date.now()*0.005));
        sim.ctx.stroke();
        
        // Draw Billet
        const startX = cx - w*0.4 + billetPos;
        const volIn = Math.max(0, billetPos);
        const endX = cx + Math.max(0, startX + volIn - cx) * (h0/hf);
        
        const biteX = cx - Math.sqrt(Math.max(0, R*R - Math.pow(R - (h0-hf)/2, 2)));
        
        function getHalfHeight(x) {
            if (x < biteX) return h0/2;
            if (x >= cx) return hf/2;
            const dx = cx - x;
            const rollCenterY = cy - hf/2 - R;
            const surfaceY = rollCenterY + Math.sqrt(Math.max(0, R*R - dx*dx));
            return cy - surfaceY;
        }
        
        sim.ctx.fillStyle = slip ? c.metal : c.accent; 
        
        // Path of deformation
        sim.ctx.beginPath();
        const actualStartX = Math.min(startX, cx - 10);
        const actualEndX = startX > cx ? startX + (w*0.3)*(h0/hf) : Math.max(cx, startX + w*0.3); // simplified length logic
        
        const drawStartX = startX;
        let drawEndX = startX + w*0.3;
        if (drawEndX > cx) {
            drawEndX = cx + (drawEndX - cx) * (h0/hf);
        }
        
        sim.ctx.moveTo(drawStartX, cy);
        for(let x=drawStartX; x<=drawEndX; x+=2) {
            sim.ctx.lineTo(x, cy - getHalfHeight(x));
        }
        sim.ctx.lineTo(drawEndX, cy);
        for(let x=drawEndX; x>=drawStartX; x-=2) {
            sim.ctx.lineTo(x, cy + getHalfHeight(x));
        }
        sim.ctx.fill();
        
        // Draw Grain Elongation Visuals
        sim.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        sim.ctx.lineWidth = 1;
        for(let i=0; i<5; i++) {
            const hRatio = (i-2)*0.2; // -0.4 to 0.4
            sim.ctx.beginPath();
            sim.ctx.moveTo(drawStartX, cy + h0 * hRatio);
            for(let x=drawStartX; x<=drawEndX; x+=5) {
                sim.ctx.lineTo(x, cy + getHalfHeight(x) * 2 * hRatio);
            }
            sim.ctx.stroke();
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 3: DEEP DRAWING PRESS
// ============================================================================
function initSim3() {
    const sim = setupCanvas('canvas-container-3');
    if(!sim) return;
    
    const ui = {
        dr: document.getElementById('sim3-dr'),
        bh: document.getElementById('sim3-bh'),
        btn: document.getElementById('sim3-punch'),
        forceOut: document.getElementById('sim3-force'),
        resOut: document.getElementById('sim3-result')
    };
    
    let isDrawing = false;
    let punchY = 0; // 0 to 100
    
    ui.btn.addEventListener('click', () => {
        isDrawing = true;
        punchY = 0;
        ui.btn.innerText = "Drawing...";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cx = sim.width / 2;
        const cy = sim.height * 0.4; // die top line
        
        const Dp = 100; // Punch diameter scaled up
        const Db = parseFloat(ui.dr.value) * Dp; // Blank diameter visually
        const bhForce = parseFloat(ui.bh.value);
        
        // Physics logic
        const maxDr = 2.0;
        let isTorn = (parseFloat(ui.dr.value) > maxDr);
        let isWrinkled = (bhForce < 30);
        
        if (isDrawing) {
            punchY += 1.5;
            if (isTorn && punchY > 40) {
                isDrawing = false; // Tear stops progress
                ui.resOut.innerText = "TEAR (Tensile Failure)";
                ui.resOut.style.color = '#ef4444';
            } else if (punchY > 120) {
                isDrawing = false;
                if (isWrinkled) {
                    ui.resOut.innerText = "WRINKLED (Low BH Force)";
                    ui.resOut.style.color = '#ef4444';
                } else {
                    ui.resOut.innerText = "SUCCESSFUL DRAW";
                    ui.resOut.style.color = '#22c55e';
                }
            } else {
                ui.resOut.innerText = "Drawing...";
                ui.resOut.style.color = c.textSec;
            }
        }
        
        // Calculate dynamic force
        const force = 3.14 * Dp * 2 * 400 * (parseFloat(ui.dr.value) - 0.7) * (punchY/100);
        ui.forceOut.innerText = isDrawing ? (force/1000).toFixed(1) : (isTorn ? "0" : "0");
        
        // Draw Die
        sim.ctx.fillStyle = c.metal;
        sim.ctx.fillRect(cx - 250, cy, 250 - Dp/2 - 5, 150); // left die
        sim.ctx.fillRect(cx + Dp/2 + 5, cy, 250 - Dp/2 - 5, 150); // right die
        
        // Draw Blankholder
        sim.ctx.fillStyle = '#64748b';
        sim.ctx.fillRect(cx - Db/2, cy - 20, (Db - Dp)/2, 18);
        sim.ctx.fillRect(cx + Dp/2, cy - 20, (Db - Dp)/2, 18);
        
        // Draw Punch
        const currentPunchY = cy - 100 + punchY;
        sim.ctx.fillStyle = c.neon;
        sim.ctx.fillRect(cx - Dp/2, currentPunchY, Dp, 100);
        
        // Draw Sheet Metal (Red/Orange based on stress)
        sim.ctx.strokeStyle = isTorn ? '#ef4444' : c.accent;
        sim.ctx.lineWidth = 6;
        sim.ctx.lineJoin = 'round';
        
        sim.ctx.beginPath();
        if (punchY > 0) {
            const drawDepth = punchY;
            const flangeW = Math.max(0, Db/2 - Dp/2 - drawDepth*0.3); // Flange pulls in
            
            if (isTorn && punchY >= 40) {
                // Top halves
                sim.ctx.moveTo(cx - Dp/2 - flangeW, cy);
                sim.ctx.lineTo(cx - Dp/2, cy);
                sim.ctx.lineTo(cx - Dp/2, cy + 30);
                
                sim.ctx.moveTo(cx + Dp/2 + flangeW, cy);
                sim.ctx.lineTo(cx + Dp/2, cy);
                sim.ctx.lineTo(cx + Dp/2, cy + 30);
                
                // Bottom torn piece
                sim.ctx.moveTo(cx - Dp/2, currentPunchY + 100 - 15);
                sim.ctx.lineTo(cx - Dp/2, currentPunchY + 100);
                sim.ctx.lineTo(cx + Dp/2, currentPunchY + 100);
                sim.ctx.lineTo(cx + Dp/2, currentPunchY + 100 - 15);
            } else {
                sim.ctx.moveTo(cx - Dp/2 - flangeW, cy);
                sim.ctx.lineTo(cx - Dp/2, cy);
                sim.ctx.lineTo(cx - Dp/2, cy + drawDepth);
                sim.ctx.lineTo(cx + Dp/2, cy + drawDepth);
                sim.ctx.lineTo(cx + Dp/2, cy);
                sim.ctx.lineTo(cx + Dp/2 + flangeW, cy);
            }
        } else {
            // Flat blank
            sim.ctx.moveTo(cx - Db/2, cy);
            sim.ctx.lineTo(cx + Db/2, cy);
        }
        
        if (isWrinkled && punchY > 50 && !isTorn) {
            // Draw squiggles on flange
            sim.ctx.setLineDash([2, 4]);
        } else {
            sim.ctx.setLineDash([]);
        }
        sim.ctx.stroke();
        sim.ctx.setLineDash([]);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 4: ORTHOGONAL MACHINING & MERCHANT'S CIRCLE
// ============================================================================
function initSim4() {
    const sim = setupCanvas('canvas-container-4');
    if(!sim) return;
    
    const ui = {
        alpha: document.getElementById('sim4-alpha'),
        mu: document.getElementById('sim4-mu'),
        phiOut: document.getElementById('sim4-phi'),
        fcOut: document.getElementById('sim4-fc')
    };
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const alphaDeg = parseFloat(ui.alpha.value); // Rake angle
        const alpha = alphaDeg * Math.PI / 180;
        const mu = parseFloat(ui.mu.value);
        const beta = Math.atan(mu); // Friction angle
        
        // Merchant's assumption: phi = 45 + alpha/2 - beta/2
        let phi = Math.PI/4 + alpha/2 - beta/2;
        if(phi < 0.1) phi = 0.1; // clamp for visuals
        
        ui.phiOut.innerText = (phi * 180 / Math.PI).toFixed(1);
        
        // Scale factors
        const cx = sim.width * 0.4;
        const cy = sim.height * 0.6;
        const t0 = 30; // undeformed chip thickness
        
        // Chip thickness ratio r = sin(phi) / cos(phi - alpha)
        const r = Math.sin(phi) / Math.cos(phi - alpha);
        const tc = t0 / r; // deformed chip thickness
        
        // Draw Workpiece
        sim.ctx.fillStyle = c.metal;
        sim.ctx.beginPath();
        sim.ctx.moveTo(cx - 200, cy);
        sim.ctx.lineTo(cx, cy); // Cutting point
        sim.ctx.lineTo(cx, cy + 100);
        sim.ctx.lineTo(cx - 200, cy + 100);
        sim.ctx.fill();
        
        // Draw Uncut material layer
        sim.ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        sim.ctx.fillRect(cx - 200, cy - t0, 200, t0);
        
        // Draw Tool
        sim.ctx.fillStyle = c.neon;
        sim.ctx.strokeStyle = '#fff';
        sim.ctx.lineWidth = 2;
        
        const toolLen = 120;
        const clearance = 5 * Math.PI / 180;
        
        sim.ctx.beginPath();
        sim.ctx.moveTo(cx, cy);
        // Rake face
        sim.ctx.lineTo(cx + toolLen * Math.sin(alpha), cy - toolLen * Math.cos(alpha));
        // Tool body
        sim.ctx.lineTo(cx + toolLen, cy - toolLen);
        sim.ctx.lineTo(cx + toolLen, cy + toolLen * Math.tan(clearance));
        // Clearance face
        sim.ctx.lineTo(cx, cy);
        sim.ctx.fill(); sim.ctx.stroke();
        
        // Draw Chip flowing up the rake face
        sim.ctx.fillStyle = c.accent;
        sim.ctx.beginPath();
        sim.ctx.moveTo(cx, cy);
        
        // Up the shear plane
        const shearX = cx - t0 / Math.tan(phi);
        const shearY = cy - t0;
        sim.ctx.lineTo(shearX, shearY);
        
        // Curve the chip
        const chipL = 80;
        const topRakeX = cx + chipL * Math.sin(alpha);
        const topRakeY = cy - chipL * Math.cos(alpha);
        
        sim.ctx.lineTo(topRakeX - tc*Math.cos(alpha), topRakeY - tc*Math.sin(alpha));
        sim.ctx.lineTo(topRakeX, topRakeY);
        sim.ctx.fill();
        
        // Draw Shear Plane Line
        sim.ctx.strokeStyle = '#ef4444';
        sim.ctx.setLineDash([5, 5]);
        sim.ctx.beginPath();
        sim.ctx.moveTo(cx, cy);
        sim.ctx.lineTo(shearX, shearY);
        sim.ctx.stroke();
        sim.ctx.setLineDash([]);
        
        // Merchant's Force Circle overlay (Simplified Visualization)
        const circleCenterX = cx + 150;
        const circleCenterY = cy - 100;
        const R = 80; // Radius of force circle
        
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.beginPath(); sim.ctx.arc(circleCenterX, circleCenterY, R, 0, Math.PI*2); sim.ctx.stroke();
        
        // Draw Resultant R (diameter)
        function drawArrow(fx, fy, tx, ty, color, label) {
            sim.ctx.strokeStyle = color; sim.ctx.fillStyle = color;
            sim.ctx.beginPath(); sim.ctx.moveTo(fx, fy); sim.ctx.lineTo(tx, ty); sim.ctx.stroke();
            sim.ctx.beginPath(); sim.ctx.arc(tx, ty, 3, 0, Math.PI*2); sim.ctx.fill();
            sim.ctx.fillText(label, tx + 5, ty - 5);
        }
        
        sim.ctx.font = '12px Inter';
        const startR = {x: circleCenterX - R*Math.cos(beta-alpha), y: circleCenterY + R*Math.sin(beta-alpha)};
        const endR = {x: circleCenterX + R*Math.cos(beta-alpha), y: circleCenterY - R*Math.sin(beta-alpha)};
        
        // Cutting Force Fc (Horizontal)
        drawArrow(startR.x, startR.y, endR.x, startR.y, c.neon, "Fc");
        // Thrust force Ft (Vertical)
        drawArrow(endR.x, startR.y, endR.x, endR.y, c.text, "Ft");
        // Shear Force Fs (Along shear plane)
        const fsX = startR.x + 2*R*Math.cos(phi);
        const fsY = startR.y - 2*R*Math.sin(phi);
        drawArrow(startR.x, startR.y, fsX, fsY, '#ef4444', "Fs");
        
        // Calc magnitude of Fc for UI
        const tau = 400; // Shear strength
        const As = (2*t0) / Math.sin(phi); // Area of shear plane
        const Fs_mag = tau * As;
        const Fc_mag = Fs_mag * Math.cos(beta - alpha) / Math.cos(phi + beta - alpha);
        ui.fcOut.innerText = Fc_mag.toFixed(0);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 5: THERMAL TOOL WEAR ON LATHE
// ============================================================================
function initSim5() {
    const sim = setupCanvas('canvas-container-5');
    if(!sim) return;
    
    const ui = {
        v: document.getElementById('sim5-v'),
        btn: document.getElementById('sim5-run'),
        tempOut: document.getElementById('sim5-temp'),
        vbOut: document.getElementById('sim5-vb')
    };
    
    let isRunning = false;
    let wearVB = 0.0;
    let temperature = 20;
    
    ui.btn.addEventListener('click', () => {
        isRunning = !isRunning;
        ui.btn.innerText = isRunning ? "Stop Turning" : "Start Turning";
        if(wearVB >= 0.3) {
            wearVB = 0; // reset
            temperature = 20;
            isRunning = true;
            ui.btn.innerText = "Stop Turning";
        }
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cx = sim.width * 0.4;
        const cy = sim.height / 2;
        
        const V = parseFloat(ui.v.value);
        
        if (isRunning) {
            // Temperature dynamics: approaches steady state based on V
            const targetTemp = 20 + Math.pow(V, 1.2) * 1.5;
            temperature += (targetTemp - temperature) * 0.05;
            
            // Wear dynamics (Taylor's relation pseudo-math)
            // Wear rate increases exponentially with temperature
            const wearRate = 0.00001 * Math.exp(temperature / 200);
            wearVB += wearRate;
            
            if (wearVB >= 0.3) {
                isRunning = false;
                ui.btn.innerText = "Tool Failed! (Reset)";
            }
        } else {
            // Cool down
            temperature += (20 - temperature) * 0.02;
        }
        
        ui.tempOut.innerText = temperature.toFixed(0);
        ui.vbOut.innerText = wearVB.toFixed(3);
        if(wearVB >= 0.3) ui.vbOut.style.color = '#ef4444';
        else ui.vbOut.style.color = c.textSec;
        
        // Draw Workpiece (rotating cylinder)
        sim.ctx.fillStyle = c.metal;
        sim.ctx.fillRect(cx - 200, cy - 80, 200, 160);
        
        // Speed lines on workpiece to show rotation
        if (isRunning && wearVB < 0.3) {
            sim.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            for(let i=0; i<10; i++) {
                const y = cy - 80 + Math.random()*160;
                sim.ctx.beginPath(); sim.ctx.moveTo(cx - 200, y); sim.ctx.lineTo(cx, y); sim.ctx.stroke();
            }
        }
        
        // Draw Tool
        sim.ctx.fillStyle = '#1e293b'; // carbide body
        sim.ctx.beginPath();
        sim.ctx.moveTo(cx, cy); // tool tip
        sim.ctx.lineTo(cx + 100, cy + 20);
        sim.ctx.lineTo(cx + 100, cy + 80);
        sim.ctx.lineTo(cx + 10, cy + 80);
        sim.ctx.fill();
        
        // Draw Thermal Glow on Tool Tip
        if (temperature > 50) {
            const glowIntensity = Math.min(1, (temperature - 50) / 800);
            const gradient = sim.ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 * glowIntensity);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${glowIntensity})`);
            gradient.addColorStop(0.2, `rgba(255, 255, 0, ${glowIntensity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(239, 68, 68, ${glowIntensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            sim.ctx.fillStyle = gradient;
            sim.ctx.beginPath(); sim.ctx.arc(cx, cy, 50, 0, Math.PI*2); sim.ctx.fill();
        }
        
        // Draw Flank Wear visual (blunting the tip)
        if (wearVB > 0.01) {
            const wearPx = wearVB * 100; // visual scaling
            sim.ctx.fillStyle = '#ef4444';
            sim.ctx.beginPath();
            sim.ctx.moveTo(cx, cy);
            sim.ctx.lineTo(cx + wearPx, cy);
            sim.ctx.lineTo(cx + wearPx/2, cy + wearPx);
            sim.ctx.fill();
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 6: EDM SPARK EROSION
// ============================================================================
function initSim6() {
    const sim = setupCanvas('canvas-container-6');
    if(!sim) return;
    
    const ui = {
        i: document.getElementById('sim6-i'),
        btn: document.getElementById('sim6-spark'),
        freqOut: document.getElementById('sim6-freq'),
        mrrOut: document.getElementById('sim6-mrr')
    };
    
    let isPowerOn = false;
    let craters = []; // store {x, radius, depth}
    
    ui.btn.addEventListener('click', () => {
        isPowerOn = !isPowerOn;
        ui.btn.innerText = isPowerOn ? "Power OFF" : "Toggle Power Supply";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const w = sim.width;
        const h = sim.height;
        const cx = w/2;
        const cy = h/2;
        
        const I = parseFloat(ui.i.value);
        
        // Draw Dielectric Fluid
        sim.ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
        sim.ctx.fillRect(0, 0, w, h);
        
        // Draw Workpiece (Bottom)
        sim.ctx.fillStyle = c.metal;
        sim.ctx.fillRect(cx - 200, cy + 40, 400, 100);
        
        // Subtract craters
        sim.ctx.globalCompositeOperation = 'destination-out';
        for(let crater of craters) {
            sim.ctx.beginPath();
            sim.ctx.ellipse(crater.x, cy + 40, crater.r, crater.depth, 0, 0, Math.PI*2);
            sim.ctx.fill();
        }
        sim.ctx.globalCompositeOperation = 'source-over';
        
        // Draw Electrode (Top)
        sim.ctx.fillStyle = '#b45309'; // Copper electrode
        sim.ctx.fillRect(cx - 50, cy - 100, 100, 130);
        
        // Physics update
        let freq = 0;
        let mrr = 0;
        
        if (isPowerOn) {
            freq = I * 2; // kHz
            mrr = I * 0.15; // mm3/min
            
            // Generate Sparks
            if (Math.random() < 0.4) {
                const sparkX = cx - 40 + Math.random() * 80;
                const sparkYStart = cy + 30;
                const sparkYEnd = cy + 40;
                
                // Draw Plasma Channel
                sim.ctx.strokeStyle = '#fff';
                sim.ctx.lineWidth = 2 + Math.random()*2;
                sim.ctx.beginPath();
                sim.ctx.moveTo(sparkX, sparkYStart);
                sim.ctx.lineTo(sparkX + (Math.random()-0.5)*10, sparkYStart + 5);
                sim.ctx.lineTo(sparkX, sparkYEnd);
                sim.ctx.stroke();
                
                // Glow
                const grad = sim.ctx.createRadialGradient(sparkX, sparkYEnd, 0, sparkX, sparkYEnd, 20);
                grad.addColorStop(0, 'rgba(255,255,255,0.8)');
                grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.5)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                sim.ctx.fillStyle = grad;
                sim.ctx.beginPath(); sim.ctx.arc(sparkX, sparkYEnd, 20, 0, Math.PI*2); sim.ctx.fill();
                
                // Add crater
                craters.push({
                    x: sparkX,
                    r: I/2 + Math.random()*5,
                    depth: I/4 + Math.random()*2
                });
                
                // Keep craters array manageable
                if (craters.length > 500) craters.shift();
            }
            
            // Debris (flushing)
            sim.ctx.fillStyle = '#000';
            for(let i=0; i<3; i++) {
                sim.ctx.beginPath();
                sim.ctx.arc(cx - 60 + Math.random()*120, cy + 35 + Math.random()*10, 1, 0, Math.PI*2);
                sim.ctx.fill();
            }
        }
        
        ui.freqOut.innerText = freq.toFixed(1);
        ui.mrrOut.innerText = mrr.toFixed(2);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 7: ARC WELDING THERMAL LAB
// ============================================================================
function initSim7() {
    const sim = setupCanvas('canvas-container-7');
    if(!sim) return;
    
    const ui = {
        i: document.getElementById('sim7-i'),
        v: document.getElementById('sim7-v'),
        btn: document.getElementById('sim7-weld'),
        hiOut: document.getElementById('sim7-hi'),
        crOut: document.getElementById('sim7-cr')
    };
    
    let isWelding = false;
    let torchX = 0;
    
    ui.btn.addEventListener('click', () => {
        isWelding = true;
        torchX = 50;
        ui.btn.innerText = "Welding...";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const w = sim.width;
        const cy = sim.height / 2;
        
        const current = parseFloat(ui.i.value);
        const speed = parseFloat(ui.v.value);
        
        // Heat input calculation (Net = f1 * V * I / v)
        const voltage = 20; // Constant arc voltage
        const efficiency = 0.8; // TIG
        const heatInput = (efficiency * voltage * current) / speed; 
        
        ui.hiOut.innerText = heatInput.toFixed(0);
        let cooling = "Optimal";
        if (heatInput < 300) cooling = "Too Fast (Brittle Martensite!)";
        if (heatInput > 800) cooling = "Too Slow (Wide HAZ / Burn Through!)";
        ui.crOut.innerText = cooling;
        
        if (isWelding) {
            torchX += speed * 0.1;
            if(torchX > w - 50) {
                isWelding = false;
                ui.btn.innerText = "Reset Weld";
            }
        }
        
        // Draw Base Plates
        sim.ctx.fillStyle = '#64748b'; // Top plate
        sim.ctx.fillRect(0, cy - 100, w, 100);
        sim.ctx.fillStyle = '#475569'; // Bottom plate
        sim.ctx.fillRect(0, cy, w, 100);
        
        // Draw Weld Seam line
        sim.ctx.strokeStyle = '#0f172a';
        sim.ctx.beginPath(); sim.ctx.moveTo(0, cy); sim.ctx.lineTo(w, cy); sim.ctx.stroke();
        
        // Draw Heat Affected Zone (HAZ) - Historical trail
        if (torchX > 50) {
            const hazWidth = heatInput / 10; // HAZ size proportional to heat input
            const beadRadius = Math.max(3, heatInput / 60); // dynamic bead size
            
            const hazGrad = sim.ctx.createLinearGradient(0, cy - hazWidth, 0, cy + hazWidth);
            hazGrad.addColorStop(0, 'rgba(0,0,0,0)');
            hazGrad.addColorStop(0.3, 'rgba(125, 211, 252, 0.2)'); // Temper colors
            hazGrad.addColorStop(0.5, 'rgba(30, 64, 175, 0.4)');
            hazGrad.addColorStop(0.7, 'rgba(125, 211, 252, 0.2)');
            hazGrad.addColorStop(1, 'rgba(0,0,0,0)');
            
            sim.ctx.fillStyle = hazGrad;
            sim.ctx.fillRect(50, cy - hazWidth, torchX - 50, hazWidth*2);
            
            // Draw Weld Bead
            sim.ctx.fillStyle = c.metal;
            sim.ctx.strokeStyle = '#334155';
            sim.ctx.lineWidth = 1;
            sim.ctx.beginPath();
            sim.ctx.arc(50, cy, beadRadius, Math.PI/2, Math.PI*1.5);
            sim.ctx.lineTo(torchX, cy - beadRadius);
            sim.ctx.arc(torchX, cy, beadRadius, -Math.PI/2, Math.PI/2);
            sim.ctx.closePath();
            sim.ctx.fill(); sim.ctx.stroke();
            
            // Draw ripples
            for(let i=50; i<torchX; i+=beadRadius*0.8) {
                sim.ctx.beginPath();
                sim.ctx.arc(i, cy, beadRadius-1, -Math.PI/2, Math.PI/2);
                sim.ctx.stroke();
            }
        }
        
        // Draw Active Weld Pool & Arc
        if (isWelding) {
            // Weld Pool (Liquid metal)
            const poolRadius = heatInput / 40 + 2;
            sim.ctx.fillStyle = '#f97316';
            sim.ctx.beginPath(); sim.ctx.arc(torchX, cy, poolRadius, 0, Math.PI*2); sim.ctx.fill();
            
            // Arc Glow
            const arcGrad = sim.ctx.createRadialGradient(torchX, cy, 0, torchX, cy, poolRadius*2.5);
            arcGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            arcGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.8)');
            arcGrad.addColorStop(1, 'rgba(0,0,0,0)');
            
            sim.ctx.fillStyle = arcGrad;
            sim.ctx.beginPath(); sim.ctx.arc(torchX, cy, poolRadius*2.5, 0, Math.PI*2); sim.ctx.fill();
            
            // Torch Nozzle
            sim.ctx.fillStyle = '#e2e8f0';
            sim.ctx.beginPath();
            sim.ctx.arc(torchX, cy, 15, 0, Math.PI*2);
            sim.ctx.fill();
            sim.ctx.strokeStyle = '#94a3b8';
            sim.ctx.stroke();
            
            // Electrode Tip
            sim.ctx.fillStyle = '#334155'; // Tungsten
            sim.ctx.beginPath(); sim.ctx.arc(torchX, cy, 4, 0, Math.PI*2); sim.ctx.fill();
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 8: LIVE 3D CNC MILL (G-CODE)
// ============================================================================
function initSim8() {
    const sim = setupCanvas('canvas-container-8');
    if(!sim) return;
    
    const ui = {
        gcode: document.getElementById('sim8-gcode'),
        btn: document.getElementById('sim8-run'),
        posOut: document.getElementById('sim8-pos'),
        stateOut: document.getElementById('sim8-state')
    };
    
    let toolPos = { x: 50, y: 50, z: 0 };
    let targetPos = { x: 50, y: 50, z: 0 };
    let paths = []; // store lines cut
    let isMoving = false;
    
    ui.btn.addEventListener('click', () => {
        const cmd = ui.gcode.value.toUpperCase();
        parseGCode(cmd);
        ui.gcode.value = '';
    });
    
    // Allow enter key
    ui.gcode.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            const cmd = ui.gcode.value.toUpperCase();
            parseGCode(cmd);
            ui.gcode.value = '';
        }
    });
    
    function parseGCode(cmd) {
        if(!cmd) return;
        
        let newX = targetPos.x;
        let newY = targetPos.y;
        let newZ = targetPos.z;
        
        const matchX = cmd.match(/X([-\d.]+)/);
        if(matchX) newX = parseFloat(matchX[1]);
        
        const matchY = cmd.match(/Y([-\d.]+)/);
        if(matchY) newY = parseFloat(matchY[1]);
        
        const matchZ = cmd.match(/Z([-\d.]+)/);
        if(matchZ) newZ = parseFloat(matchZ[1]);
        
        targetPos = { x: newX, y: newY, z: newZ };
        isMoving = true;
    }
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cx = sim.width / 2;
        const cy = sim.height / 2;
        
        // Define Aluminum Block
        const blockOriginX = cx - 150;
        const blockOriginY = cy - 100;
        const blockW = 300;
        const blockH = 200;
        
        sim.ctx.fillStyle = c.metal;
        sim.ctx.fillRect(blockOriginX, blockOriginY, blockW, blockH);
        sim.ctx.strokeStyle = '#94a3b8';
        sim.ctx.strokeRect(blockOriginX, blockOriginY, blockW, blockH);
        
        // Interpolate movement
        if(isMoving) {
            const dx = targetPos.x - toolPos.x;
            const dy = targetPos.y - toolPos.y;
            const dz = targetPos.z - toolPos.z;
            
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if(dist < 0.5) {
                toolPos.x = targetPos.x;
                toolPos.y = targetPos.y;
                toolPos.z = targetPos.z;
                isMoving = false;
                paths.push({x: toolPos.x, y: toolPos.y, z: toolPos.z}); // lock point
            } else {
                const speed = 1.0;
                toolPos.x += (dx/dist) * speed;
                toolPos.y += (dy/dist) * speed;
                toolPos.z += (dz/dist) * speed;
                
                paths.push({x: toolPos.x, y: toolPos.y, z: toolPos.z});
            }
        }
        
        ui.posOut.innerText = `X${toolPos.x.toFixed(1)} Y${toolPos.y.toFixed(1)} Z${toolPos.z.toFixed(1)}`;
        ui.stateOut.innerText = isMoving ? "INTERPOLATING (G01)" : "IDLE";
        if(isMoving) ui.stateOut.style.color = c.neon;
        else ui.stateOut.style.color = c.textSec;
        
        // Map tool coords to screen (assume 0,0 is block origin, scale factor 3)
        const scale = 3;
        const screenX = blockOriginX + toolPos.x * scale;
        // Invert Y for standard CNC coord system (Y+ is UP)
        const screenY = blockOriginY + blockH - toolPos.y * scale; 
        
        // Draw Cut Paths
        sim.ctx.strokeStyle = '#1e293b'; // dark slot
        sim.ctx.lineWidth = 20; // 10px tool radius * 2
        sim.ctx.lineCap = 'round';
        sim.ctx.lineJoin = 'round';
        
        sim.ctx.beginPath();
        let isCutting = false;
        for(let i=0; i<paths.length; i++) {
            const px = blockOriginX + paths[i].x * scale;
            const py = blockOriginY + blockH - paths[i].y * scale;
            if(paths[i].z < 0) {
                if(!isCutting) {
                    sim.ctx.moveTo(px, py);
                    isCutting = true;
                } else {
                    sim.ctx.lineTo(px, py);
                }
            } else {
                isCutting = false;
            }
        }
        sim.ctx.stroke();
        
        // Draw Tool
        sim.ctx.fillStyle = c.accent;
        sim.ctx.beginPath();
        sim.ctx.arc(screenX, screenY, 10, 0, Math.PI*2);
        sim.ctx.fill();
        
        // Draw Tool Flutes (Rotation)
        if(toolPos.z < 0) { // Spindle ON
            sim.ctx.strokeStyle = '#fff';
            sim.ctx.beginPath();
            sim.ctx.moveTo(screenX - 10, screenY);
            sim.ctx.lineTo(screenX + 10, screenY);
            sim.ctx.moveTo(screenX, screenY - 10);
            sim.ctx.lineTo(screenX, screenY + 10);
            sim.ctx.translate(screenX, screenY);
            sim.ctx.rotate(Date.now() * 0.05);
            sim.ctx.stroke();
            sim.ctx.setTransform(sim.ctx.getTransform().a, 0, 0, sim.ctx.getTransform().d, 0, 0); // Reset rot, keep scaling
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 9: FDM 3D PRINTER (ADDITIVE MFG)
// ============================================================================
function initSim9() {
    const sim = setupCanvas('canvas-container-9');
    if(!sim) return;
    
    const ui = {
        sup: document.getElementById('sim9-sup'),
        btn: document.getElementById('sim9-print'),
        layerOut: document.getElementById('sim9-layer'),
        progOut: document.getElementById('sim9-prog')
    };
    
    let isPrinting = false;
    let currentLayer = 0;
    const maxLayers = 50;
    
    ui.btn.addEventListener('click', () => {
        isPrinting = true;
        currentLayer = 0;
        ui.btn.innerText = "Printing...";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cx = sim.width / 2;
        const cy = sim.height * 0.8;
        
        const supports = ui.sup.value === 'on';
        
        if (isPrinting) {
            currentLayer += 0.2; // speed
            if (currentLayer >= maxLayers) {
                currentLayer = maxLayers;
                isPrinting = false;
                ui.btn.innerText = "Reset Print";
            }
        }
        
        ui.layerOut.innerText = Math.floor(currentLayer);
        ui.progOut.innerText = ((currentLayer / maxLayers) * 100).toFixed(0);
        
        // Draw Build Plate
        sim.ctx.fillStyle = c.metal;
        sim.ctx.fillRect(cx - 150, cy, 300, 10);
        
        // Geometry: A pillar on the left with a massive overhang extending to the right
        const pillarW = 40;
        const overhangL = 120;
        const layerH = 4;
        
        // Draw Support Structure (if enabled)
        if (supports && currentLayer > 0) {
            sim.ctx.fillStyle = 'rgba(234, 88, 12, 0.2)'; // semi-transparent orange
            sim.ctx.strokeStyle = c.accentGlow;
            
            // Zig-zag support pattern under overhang
            sim.ctx.beginPath();
            for(let i=0; i<Math.floor(currentLayer); i++) {
                const y = cy - i*layerH;
                sim.ctx.moveTo(cx - 50 + pillarW, y);
                sim.ctx.lineTo(cx - 50 + pillarW + overhangL, y);
            }
            sim.ctx.stroke();
            sim.ctx.fillRect(cx - 50 + pillarW, cy - Math.floor(currentLayer)*layerH, overhangL, Math.floor(currentLayer)*layerH);
        }
        
        // Draw Printed Object
        sim.ctx.fillStyle = c.accent;
        
        for (let i=0; i<Math.floor(currentLayer); i++) {
            const y = cy - i*layerH - layerH;
            
            // Draw Pillar
            sim.ctx.fillRect(cx - 50, y, pillarW, layerH);
            
            // Draw Overhang (Starts halfway up)
            if (i > maxLayers / 2) {
                const layerLength = overhangL * ((i - maxLayers/2) / (maxLayers/2));
                
                if (supports) {
                    // Straight overhang
                    sim.ctx.fillRect(cx - 50 + pillarW, y, layerLength, layerH);
                } else {
                    // Drooping overhang (gravity failure)
                    const droop = Math.pow(layerLength / 20, 2); 
                    sim.ctx.fillRect(cx - 50 + pillarW, y + droop, layerLength, layerH);
                }
            }
        }
        
        // Draw Print Nozzle
        if (isPrinting) {
            let nozzleX = cx - 50 + pillarW/2;
            let nozzleY = cy - currentLayer*layerH;
            
            if (currentLayer > maxLayers/2) {
                const layerLength = overhangL * ((currentLayer - maxLayers/2) / (maxLayers/2));
                // Move nozzle back and forth along the current layer
                nozzleX = cx - 50 + pillarW + (Math.sin(Date.now()*0.01) * 0.5 + 0.5) * layerLength;
                
                if (!supports) {
                    const droop = Math.pow(layerLength / 20, 2);
                    nozzleY += droop;
                }
            } else {
                nozzleX = cx - 50 + (Math.sin(Date.now()*0.01) * 0.5 + 0.5) * pillarW;
            }
            
            sim.ctx.fillStyle = '#e2e8f0';
            sim.ctx.beginPath();
            sim.ctx.moveTo(nozzleX, nozzleY);
            sim.ctx.lineTo(nozzleX - 10, nozzleY - 20);
            sim.ctx.lineTo(nozzleX + 10, nozzleY - 20);
            sim.ctx.fill();
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 10: VIRTUAL METROLOGY LAB
// ============================================================================
function initSim10() {
    const sim = setupCanvas('canvas-container-10');
    if(!sim) return;
    
    const ui = {
        btnNew: document.getElementById('sim10-new'),
        btnMeas: document.getElementById('sim10-measure'),
        readOut: document.getElementById('sim10-read'),
        statusOut: document.getElementById('sim10-status')
    };
    
    const targetSize = 25.000;
    // ISO H7/g6 clearance fit. Target hole is 25.000 +0.021/0. 
    // Target shaft g6 is 25.000 -0.007 / -0.020
    const upperLimit = 24.993; 
    const lowerLimit = 24.980;
    
    let currentPartSize = 24.985;
    let isMeasuring = false;
    let caliperPos = 35; // open position
    
    ui.btnNew.addEventListener('click', () => {
        // Generate random size following normal-ish distribution
        const rand = (Math.random() + Math.random() + Math.random()) / 3;
        // Range from 24.970 to 25.000
        currentPartSize = 24.970 + rand * 0.030;
        
        isMeasuring = false;
        caliperPos = 35;
        ui.readOut.innerText = "0.000";
        ui.statusOut.innerText = "---";
        ui.statusOut.style.color = getColors().textSec;
    });
    
    ui.btnMeas.addEventListener('click', () => {
        isMeasuring = true;
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cx = sim.width / 2;
        const cy = sim.height / 2;
        
        // Draw the shaft (exaggerated for visual)
        const shaftRadius = currentPartSize; 
        sim.ctx.fillStyle = c.metal;
        sim.ctx.beginPath();
        sim.ctx.arc(cx, cy, shaftRadius*3, 0, Math.PI*2);
        sim.ctx.fill();
        
        // Caliper dynamics
        if (isMeasuring) {
            if (caliperPos > shaftRadius) {
                caliperPos -= 0.5;
            } else {
                caliperPos = shaftRadius; // clamped
                ui.readOut.innerText = currentPartSize.toFixed(3);
                
                // Tolerance Check
                if (currentPartSize <= upperLimit && currentPartSize >= lowerLimit) {
                    ui.statusOut.innerText = "ACCEPT (In Tolerance)";
                    ui.statusOut.style.color = '#22c55e';
                } else {
                    ui.statusOut.innerText = "REJECT (Out of Tolerance)";
                    ui.statusOut.style.color = '#ef4444';
                }
            }
        }
        
        // Draw Caliper Jaws
        sim.ctx.fillStyle = c.neon;
        // Top Jaw
        sim.ctx.fillRect(cx - 100, cy - caliperPos*3 - 10, 200, 10);
        // Bottom Jaw
        sim.ctx.fillRect(cx - 100, cy + caliperPos*3, 200, 10);
        
        // Draw measurement scale body
        sim.ctx.fillRect(cx - 120, cy - 150, 20, 300);
        
        // Tolerance Band visual (overlay on the shaft)
        sim.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        sim.ctx.beginPath();
        sim.ctx.arc(cx, cy, upperLimit*3, 0, Math.PI*2);
        sim.ctx.stroke();
        sim.ctx.beginPath();
        sim.ctx.arc(cx, cy, lowerLimit*3, 0, Math.PI*2);
        sim.ctx.stroke();
        
        sim.ctx.fillStyle = c.textSec;
        sim.ctx.fillText("g6 Tolerance Zone", cx + upperLimit*3 + 10, cy - upperLimit*3);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 11: AUTOMATED FACTORY (FMS BOTTLENECK)
// ============================================================================
function initSim11() {
    const sim = setupCanvas('canvas-container-11');
    if(!sim) return;
    
    const ui = {
        s2Speed: document.getElementById('sim11-s2'),
        btn: document.getElementById('sim11-run'),
        wipOut: document.getElementById('sim11-wip'),
        thrOut: document.getElementById('sim11-thr')
    };
    
    let isRunning = false;
    let parts = []; // {x, y, target, state}
    let completedCount = 0;
    
    ui.btn.addEventListener('click', () => {
        isRunning = !isRunning;
        ui.btn.innerText = isRunning ? "Stop Shift" : "Run Shift";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const w = sim.width;
        const cy = sim.height / 2;
        
        // Define Stations (Machines)
        const s1 = { x: w * 0.2, cap: 5 }; // parts per sec pseudo
        const s2 = { x: w * 0.5, cap: parseFloat(ui.s2Speed.value) }; // variable bottleneck
        const s3 = { x: w * 0.8, cap: 6 };
        
        sim.ctx.fillStyle = c.metal;
        sim.ctx.fillRect(s1.x - 30, cy - 30, 60, 60);
        sim.ctx.fillRect(s2.x - 30, cy - 30, 60, 60);
        sim.ctx.fillRect(s3.x - 30, cy - 30, 60, 60);
        
        sim.ctx.fillStyle = c.text;
        sim.ctx.fillText("St.1 (CNC)", s1.x - 25, cy - 40);
        sim.ctx.fillText(`St.2 (Mill) [Cap: ${s2.cap}]`, s2.x - 45, cy - 40);
        sim.ctx.fillText("St.3 (CMM)", s3.x - 25, cy - 40);
        
        // Conveyor Line
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 4;
        sim.ctx.beginPath(); sim.ctx.moveTo(0, cy); sim.ctx.lineTo(w, cy); sim.ctx.stroke();
        
        if(isRunning) {
            // Part generator at S1
            if(Math.random() < s1.cap / 100) {
                parts.push({x: 0, target: s1.x, state: 'to_s1', processingTime: 0});
            }
            
            // Global throughput calc
            const actualThroughput = Math.min(s1.cap, Math.min(s2.cap, s3.cap));
            ui.thrOut.innerText = (actualThroughput * 60).toFixed(0); // scale to hr
        }
        
        let activeWIP = 0;
        
        // Process parts
        for (let i = parts.length - 1; i >= 0; i--) {
            let p = parts[i];
            activeWIP++;
            
            // Move to target
            if (p.x < p.target) {
                p.x += 2;
            } else {
                // At station
                p.processingTime++;
                
                if (p.state === 'to_s1' && p.processingTime > 100/s1.cap) {
                    p.state = 'to_s2';
                    p.target = s2.x;
                    p.processingTime = 0;
                }
                else if (p.state === 'to_s2' && p.processingTime > 100/s2.cap) {
                    p.state = 'to_s3';
                    p.target = s3.x;
                    p.processingTime = 0;
                }
                else if (p.state === 'to_s3' && p.processingTime > 100/s3.cap) {
                    p.state = 'done';
                    p.target = w + 50;
                }
            }
            
            // Remove completed
            if (p.x > w) {
                parts.splice(i, 1);
                activeWIP--;
                completedCount++;
            }
        }
        
        ui.wipOut.innerText = activeWIP;
        
        // Highlight bottleneck red
        if(s2.cap < s1.cap && activeWIP > 15) {
            sim.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // red alert
            sim.ctx.fillRect(s2.x - 35, cy - 35, 70, 70);
            sim.ctx.fillStyle = '#ef4444';
            sim.ctx.fillText("BOTTLENECK!", s2.x - 30, cy + 50);
        }
        
        // Draw Parts (AGVs)
        sim.ctx.fillStyle = c.accent;
        for (let p of parts) {
            sim.ctx.beginPath();
            sim.ctx.arc(p.x, cy, 5, 0, Math.PI*2);
            sim.ctx.fill();
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// INITIALIZATION
// ============================================================================
window.onload = () => {
    initSim1();
    initSim2();
    initSim3();
    initSim4();
    initSim5();
    initSim6();
    initSim7();
    initSim8();
    initSim9();
    initSim10();
    initSim11();
};


// Theme toggling functionality (inherited standard)
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle');
    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            const html = document.documentElement;
            if(html.getAttribute('data-theme') === 'dark') {
                html.removeAttribute('data-theme');
            } else {
                html.setAttribute('data-theme', 'dark');
            }
        });
    }
});
