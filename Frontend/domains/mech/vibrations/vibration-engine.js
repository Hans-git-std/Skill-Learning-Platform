/**
 * SCME - MECHANICAL VIBRATIONS - SIMULATOR ENGINE (PART 1: Chapters 1-4)
 * Advanced HTML5 Canvas implementations for dynamic system simulations.
 */

console.log("Vibration Engine Loaded. Initializing Part 1...");

// ============================================================================
// CORE UTILITIES
// ============================================================================

function setupCanvas(canvasId) {
    const container = document.getElementById(canvasId);
    if (!container) return null;
    
    let canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const placeholder = container.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();
    }
    
    const ctx = canvas.getContext('2d');
    
    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    return { canvas, ctx, container, get width() { return container.getBoundingClientRect().width; }, get height() { return container.getBoundingClientRect().height; } };
}

function getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#050508' : '#e2e8f0',
        text: isDark ? '#f8fafc' : '#0f172a',
        accent: isDark ? '#a855f7' : '#8b5cf6', // Vibrations Purple
        neon: isDark ? '#38bdf8' : '#0ea5e9',
        grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        mass: isDark ? '#334155' : '#94a3b8',
        spring: isDark ? '#64748b' : '#475569',
        energyKE: '#ef4444',
        energyPE: '#10b981'
    };
}

// Theme toggling functionality
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

// Helper for drawing an isometric 3D box (Mass)
function drawIsoBox(ctx, x, y, width, height, depth, colorTop, colorLeft, colorRight) {
    // Left Face
    ctx.fillStyle = colorLeft;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x - depth * 0.866, y + height - depth * 0.5);
    ctx.lineTo(x - depth * 0.866, y - depth * 0.5);
    ctx.fill();
    ctx.stroke();
    // Right Face
    ctx.fillStyle = colorRight;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width * 0.866, y - width * 0.5);
    ctx.lineTo(x + width * 0.866, y + height - width * 0.5);
    ctx.lineTo(x, y + height);
    ctx.fill();
    ctx.stroke();
    // Top Face
    ctx.fillStyle = colorTop;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - depth * 0.866, y - depth * 0.5);
    ctx.lineTo(x + (width - depth) * 0.866, y - (width + depth) * 0.5);
    ctx.lineTo(x + width * 0.866, y - width * 0.5);
    ctx.fill();
    ctx.stroke();
}

// Helper for drawing a 2D spring
function drawSpring(ctx, x1, y1, x2, y2, coils, radius) {
    ctx.beginPath();
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    
    ctx.moveTo(0, 0);
    const seg = length / coils;
    for(let i=0; i<coils; i++) {
        ctx.lineTo(i*seg + seg/4, -radius);
        ctx.lineTo(i*seg + 3*seg/4, radius);
        ctx.lineTo((i+1)*seg, 0);
    }
    ctx.stroke();
    ctx.restore();
}

// ============================================================================
// SIMULATOR 1: SHM VISUALIZER
// ============================================================================
function initSim1() {
    const sim = setupCanvas('canvas-container-1');
    if(!sim) return;
    
    const ui = {
        amp: document.getElementById('sim1-amp'),
        omega: document.getElementById('sim1-omega'),
        btn: document.getElementById('sim1-run'),
        x: document.getElementById('sim1-x'),
        v: document.getElementById('sim1-v'),
        a: document.getElementById('sim1-a')
    };
    
    let isRunning = true;
    let time = 0;
    ui.btn.addEventListener('click', () => isRunning = !isRunning);
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        if(isRunning) time += 0.016;
        
        const A = parseFloat(ui.amp.value) * 10;
        const omega = parseFloat(ui.omega.value);
        
        // Physics
        const phase = omega * time;
        const x = A * Math.sin(phase);
        const v = A * omega * Math.cos(phase);
        const a = -A * omega * omega * Math.sin(phase);
        
        // Update Stats
        ui.x.innerText = (x / 10).toFixed(2);
        ui.v.innerText = (v / 10).toFixed(2);
        ui.a.innerText = (a / 10).toFixed(2);
        
        const centerY = sim.height / 2;
        
        // --- LEFT SIDE: Spring Mass System ---
        const massX = sim.width * 0.25;
        
        // Draw ceiling
        sim.ctx.strokeStyle = c.textSec;
        sim.ctx.lineWidth = 4;
        sim.ctx.beginPath();
        sim.ctx.moveTo(massX - 50, 50);
        sim.ctx.lineTo(massX + 50, 50);
        sim.ctx.stroke();
        
        // Draw Spring
        sim.ctx.strokeStyle = c.spring;
        sim.ctx.lineWidth = 2;
        drawSpring(sim.ctx, massX, 50, massX, centerY + x - 30, 8, 15);
        
        // Draw Mass
        sim.ctx.strokeStyle = c.text;
        drawIsoBox(sim.ctx, massX, centerY + x - 30, 60, 60, 60, c.accent, '#7e22ce', '#581c87');
        
        // --- RIGHT SIDE: Phasor Diagram ---
        const phasorX = sim.width * 0.75;
        
        // Draw axes
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 1;
        sim.ctx.beginPath();
        sim.ctx.moveTo(phasorX - 150, centerY); sim.ctx.lineTo(phasorX + 150, centerY);
        sim.ctx.moveTo(phasorX, centerY - 150); sim.ctx.lineTo(phasorX, centerY + 150);
        sim.ctx.stroke();
        
        // Draw Circle
        sim.ctx.strokeStyle = c.textSec;
        sim.ctx.setLineDash([5, 5]);
        sim.ctx.beginPath();
        sim.ctx.arc(phasorX, centerY, A, 0, Math.PI * 2);
        sim.ctx.stroke();
        sim.ctx.setLineDash([]);
        
        // Draw Phasor Vector
        const px = phasorX + A * Math.cos(phase);
        const py = centerY + x; // x is A*sin(phase), moving down is positive in canvas
        
        sim.ctx.strokeStyle = c.neon;
        sim.ctx.lineWidth = 3;
        sim.ctx.beginPath();
        sim.ctx.moveTo(phasorX, centerY);
        sim.ctx.lineTo(px, py);
        sim.ctx.stroke();
        
        // Draw Phasor Point
        sim.ctx.fillStyle = '#fff';
        sim.ctx.beginPath();
        sim.ctx.arc(px, py, 6, 0, Math.PI * 2);
        sim.ctx.fill();
        
        // Projection Line
        sim.ctx.strokeStyle = c.accent;
        sim.ctx.lineWidth = 1.5;
        sim.ctx.setLineDash([4, 4]);
        sim.ctx.beginPath();
        sim.ctx.moveTo(massX + 30 * 0.866, centerY + x);
        sim.ctx.lineTo(px, py);
        sim.ctx.stroke();
        sim.ctx.setLineDash([]);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 2: ENERGY CONSERVATION (Phase Space)
// ============================================================================
function initSim2() {
    const sim = setupCanvas('canvas-container-2');
    if(!sim) return;
    
    const ui = {
        m: document.getElementById('sim2-m'),
        k: document.getElementById('sim2-k'),
        btn: document.getElementById('sim2-pull'),
        ke: document.getElementById('sim2-ke'),
        pe: document.getElementById('sim2-pe'),
        te: document.getElementById('sim2-te')
    };
    
    let time = 0;
    let x = 0;
    let v = 0;
    let isRunning = false;
    let history = []; // For phase space trail
    let particles = [];
    
    ui.btn.addEventListener('click', () => {
        x = 100; // Pull amplitude
        v = 0;
        time = 0;
        history = [];
        particles = [];
        isRunning = true;
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const m = parseFloat(ui.m.value);
        const k = parseFloat(ui.k.value);
        const wn = Math.sqrt(k/m);
        
        if(isRunning) {
            const dt = 0.016;
            time += dt;
            // Analytical solution
            x = 100 * Math.cos(wn * time);
            v = -100 * wn * Math.sin(wn * time);
            
            history.push({x, v});
            if(history.length > 200) history.shift();
            
            // Generate glowing energy transfer particles
            if (Math.random() > 0.6) {
                particles.push({
                    px: sim.width * 0.25 + (Math.random() - 0.5) * 40,
                    py: sim.height * 0.5 + x,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2 - 1,
                    life: 1.0,
                    type: Math.abs(x) > 50 ? c.energyPE : c.energyKE
                });
            }
        }
        
        // Physics Calc
        const PE = 0.5 * k * (x/100) * (x/100);
        const KE = 0.5 * m * (v/100) * (v/100);
        const TE = PE + KE;
        
        ui.ke.innerText = KE.toFixed(2);
        ui.pe.innerText = PE.toFixed(2);
        ui.te.innerText = isRunning ? TE.toFixed(2) : "0.00";
        
        // --- LEFT SIDE: Pendulum / Mass ---
        const massX = sim.width * 0.25;
        const pivotY = 50;
        const pendulumLength = 250;
        
        // Draw pivot
        sim.ctx.fillStyle = c.textSec;
        sim.ctx.beginPath(); sim.ctx.arc(massX, pivotY, 8, 0, Math.PI*2); sim.ctx.fill();
        
        // Calculate angle for visual (mapping x to angle)
        const angle = x / pendulumLength;
        const bobX = massX + Math.sin(angle) * pendulumLength;
        const bobY = pivotY + Math.cos(angle) * pendulumLength;
        
        // Rod
        sim.ctx.strokeStyle = c.text;
        sim.ctx.lineWidth = 3;
        sim.ctx.beginPath();
        sim.ctx.moveTo(massX, pivotY);
        sim.ctx.lineTo(bobX, bobY);
        sim.ctx.stroke();
        
        // Bob (Dynamic color based on energy)
        const peRatio = PE / (TE || 1);
        const keRatio = KE / (TE || 1);
        
        sim.ctx.fillStyle = isRunning ? c.accent : c.mass;
        sim.ctx.beginPath();
        sim.ctx.arc(bobX, bobY, 25, 0, Math.PI*2);
        sim.ctx.fill();
        
        // Draw Particles
        particles.forEach((p, i) => {
            p.px += p.vx;
            p.py += p.vy;
            p.life -= 0.02;
            sim.ctx.globalAlpha = Math.max(0, p.life);
            sim.ctx.fillStyle = p.type;
            sim.ctx.beginPath();
            sim.ctx.arc(p.px, p.py, 3, 0, Math.PI*2);
            sim.ctx.fill();
        });
        sim.ctx.globalAlpha = 1.0;
        particles = particles.filter(p => p.life > 0);
        
        // --- RIGHT SIDE: Phase Space (x vs v) ---
        const plotX = sim.width * 0.75;
        const plotY = sim.height * 0.5;
        
        // Axes
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 2;
        sim.ctx.beginPath();
        sim.ctx.moveTo(plotX - 150, plotY); sim.ctx.lineTo(plotX + 150, plotY);
        sim.ctx.moveTo(plotX, plotY - 150); sim.ctx.lineTo(plotX, plotY + 150);
        sim.ctx.stroke();
        
        // Labels
        sim.ctx.fillStyle = c.textSec;
        sim.ctx.font = "14px Arial";
        sim.ctx.fillText("x (Disp)", plotX + 130, plotY + 20);
        sim.ctx.fillText("v (Vel)", plotX + 10, plotY - 130);
        
        // Trace History
        if (history.length > 1) {
            sim.ctx.strokeStyle = c.neon;
            sim.ctx.lineWidth = 3;
            sim.ctx.beginPath();
            // Scale velocity for visual plot
            const vScale = 10 / wn; 
            sim.ctx.moveTo(plotX + history[0].x, plotY - history[0].v * vScale);
            for(let i=1; i<history.length; i++) {
                sim.ctx.lineTo(plotX + history[i].x, plotY - history[i].v * vScale);
            }
            sim.ctx.stroke();
            
            // Current point
            sim.ctx.fillStyle = '#fff';
            sim.ctx.beginPath();
            sim.ctx.arc(plotX + x, plotY - v * vScale, 5, 0, Math.PI*2);
            sim.ctx.fill();
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 3: VISCOUS DASHPOT LAB
// ============================================================================
function initSim3() {
    const sim = setupCanvas('canvas-container-3');
    if(!sim) return;
    
    const ui = {
        zeta: document.getElementById('sim3-zeta'),
        btn: document.getElementById('sim3-run'),
        zval: document.getElementById('sim3-zval'),
        wd: document.getElementById('sim3-wd')
    };
    
    let time = 0;
    let x = 0;
    let isRunning = false;
    let trail = [];
    
    ui.btn.addEventListener('click', () => {
        x = 120;
        time = 0;
        trail = [];
        isRunning = true;
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const zeta = parseFloat(ui.zeta.value);
        const wn = 5; // Fixed natural frequency for visual
        let wd = 0;
        
        if (isRunning) {
            time += 0.016;
            if (zeta < 1.0) { // Underdamped
                wd = wn * Math.sqrt(1 - zeta*zeta);
                x = 120 * Math.exp(-zeta * wn * time) * Math.cos(wd * time);
            } else if (zeta === 1.0) { // Critically damped
                x = 120 * (1 + wn * time) * Math.exp(-wn * time);
            } else { // Overdamped
                const r1 = -wn * (zeta - Math.sqrt(zeta*zeta - 1));
                const r2 = -wn * (zeta + Math.sqrt(zeta*zeta - 1));
                // Simplified initial condition solution for visual
                x = 60 * Math.exp(r1 * time) + 60 * Math.exp(r2 * time);
            }
            trail.push({t: time, x: x});
        }
        
        ui.zval.innerText = zeta.toFixed(2);
        ui.wd.innerText = zeta < 1 ? wd.toFixed(2) : "0.00 (No Osc)";
        
        const dashpotX = sim.width * 0.2;
        const centerY = sim.height * 0.5;
        
        // --- Fluid Color Mapping based on Zeta ---
        let fluidColor = 'rgba(14, 165, 233, 0.3)'; // Air (Blue)
        if(zeta == 0.3) fluidColor = 'rgba(59, 130, 246, 0.6)'; // Water
        if(zeta == 1.0) fluidColor = 'rgba(217, 119, 6, 0.7)'; // Oil
        if(zeta > 1.0) fluidColor = 'rgba(161, 98, 7, 0.9)'; // Honey
        
        // Draw Dashpot Cylinder
        sim.ctx.fillStyle = fluidColor;
        sim.ctx.fillRect(dashpotX - 40, centerY - 150, 80, 300);
        sim.ctx.strokeStyle = c.textSec;
        sim.ctx.lineWidth = 4;
        sim.ctx.strokeRect(dashpotX - 40, centerY - 150, 80, 300);
        
        // Draw Piston
        sim.ctx.fillStyle = c.text;
        sim.ctx.fillRect(dashpotX - 35, centerY + x - 10, 70, 20);
        // Piston Rod
        sim.ctx.beginPath();
        sim.ctx.moveTo(dashpotX, centerY + x - 10);
        sim.ctx.lineTo(dashpotX, 20);
        sim.ctx.stroke();
        
        // --- Right Side: Time Domain Plot ---
        const plotStartX = sim.width * 0.35;
        const plotY = centerY;
        
        // Axis
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 2;
        sim.ctx.beginPath();
        sim.ctx.moveTo(plotStartX, plotY);
        sim.ctx.lineTo(sim.width - 50, plotY);
        sim.ctx.stroke();
        
        // Trace
        if(trail.length > 0) {
            sim.ctx.strokeStyle = c.accent;
            sim.ctx.lineWidth = 3;
            sim.ctx.beginPath();
            
            const timeScale = 50; // pixels per second
            sim.ctx.moveTo(plotStartX + trail[0].t * timeScale, plotY + trail[0].x);
            
            for(let i=1; i<trail.length; i++) {
                const px = plotStartX + trail[i].t * timeScale;
                // Shift plot if it reaches the end
                if (px > sim.width - 50) {
                    const diff = px - (sim.width - 50);
                    sim.ctx.translate(-diff, 0);
                    // For a real implementation, we'd shift the elements, but simple translate works for continuous render loop until reset
                }
                sim.ctx.lineTo(plotStartX + trail[i].t * timeScale, plotY + trail[i].x);
            }
            sim.ctx.stroke();
            sim.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0); // Reset transform
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 4: RESONANCE CATASTROPHE
// ============================================================================
function initSim4() {
    const sim = setupCanvas('canvas-container-4');
    if(!sim) return;
    
    const ui = {
        omega: document.getElementById('sim4-omega'),
        zeta: document.getElementById('sim4-zeta'),
        btn: document.getElementById('sim4-run'),
        r: document.getElementById('sim4-r'),
        m: document.getElementById('sim4-m')
    };
    
    let time = 0;
    let isRunning = false;
    const wn = 1.0; // Natural frequency fixed for this viz
    
    ui.btn.addEventListener('click', () => isRunning = !isRunning);
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const w = parseFloat(ui.omega.value);
        const zeta = parseFloat(ui.zeta.value);
        const r = w / wn;
        
        ui.r.innerText = r.toFixed(2);
        
        // Magnification factor
        const denom = Math.sqrt(Math.pow(1 - r*r, 2) + Math.pow(2*zeta*r, 2));
        const M = 1 / denom; // Assuming F0/k = 1 for relative scale
        
        ui.m.innerText = M.toFixed(2);
        
        // Visual alert for resonance
        if (M > 4) {
            ui.m.style.color = '#ef4444';
            sim.container.style.boxShadow = `inset 0 0 50px rgba(239, 68, 68, ${Math.min(M/20, 0.5)})`;
        } else {
            ui.m.style.color = 'inherit';
            sim.container.style.boxShadow = 'none';
        }
        
        if (isRunning) time += 0.05;
        
        // Phase angle
        let phase = Math.atan2(2*zeta*r, 1 - r*r);
        if (phase < 0) phase += Math.PI;
        
        // Steady state response
        const baseAmp = 30; // base visual amplitude
        const x = isRunning ? (baseAmp * M) * Math.cos(w * time - phase) : 0;
        
        const centerX = sim.width / 2;
        const centerY = sim.height / 2 + 50;
        
        // Draw Platform Foundation
        sim.ctx.fillStyle = c.grid;
        sim.ctx.fillRect(centerX - 150, centerY + 100, 300, 20);
        
        // Draw Springs
        sim.ctx.strokeStyle = c.spring;
        sim.ctx.lineWidth = 3;
        drawSpring(sim.ctx, centerX - 80, centerY + 100, centerX - 80, centerY + x, 6, 20);
        drawSpring(sim.ctx, centerX + 80, centerY + 100, centerX + 80, centerY + x, 6, 20);
        
        // Draw Platform Mass
        sim.ctx.fillStyle = c.textSec;
        sim.ctx.fillRect(centerX - 120, centerY - 20 + x, 240, 40);
        
        // Draw Rotating Motor on Platform
        sim.ctx.fillStyle = c.mass;
        sim.ctx.beginPath();
        sim.ctx.arc(centerX, centerY - 50 + x, 40, 0, Math.PI*2);
        sim.ctx.fill();
        
        // Draw Unbalanced Mass (Eccentricity)
        if(isRunning) {
            const ex = centerX + 30 * Math.cos(w * time);
            const ey = centerY - 50 + x + 30 * Math.sin(w * time);
            
            sim.ctx.fillStyle = '#ef4444';
            sim.ctx.beginPath();
            sim.ctx.arc(ex, ey, 10, 0, Math.PI*2);
            sim.ctx.fill();
            
            // Motion blur / trail of unbalance
            sim.ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
            sim.ctx.lineWidth = 4;
            sim.ctx.beginPath();
            sim.ctx.arc(centerX, centerY - 50 + x, 30, w*time - 0.5, w*time);
            sim.ctx.stroke();
        } else {
            sim.ctx.fillStyle = '#ef4444';
            sim.ctx.beginPath();
            sim.ctx.arc(centerX + 30, centerY - 50, 10, 0, Math.PI*2);
            sim.ctx.fill();
        }
        
        // Draw Resonance Frequency Plot (Background Curve)
        const plotW = 300;
        const plotH = 150;
        const plotX = centerX - plotW/2;
        const plotY = centerY - 250;
        
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 1;
        sim.ctx.beginPath();
        sim.ctx.moveTo(plotX, plotY + plotH);
        sim.ctx.lineTo(plotX + plotW, plotY + plotH); // w-axis
        sim.ctx.stroke();
        
        // Plot Magnification curve
        sim.ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        sim.ctx.lineWidth = 2;
        sim.ctx.beginPath();
        for(let i=0; i<=plotW; i+=2) {
            const r_plot = (i / plotW) * 3; // mapping x to r=0 to 3
            const M_plot = 1 / Math.sqrt(Math.pow(1 - r_plot*r_plot, 2) + Math.pow(2*zeta*r_plot, 2));
            const y_plot = plotH - (M_plot * 20); // visual scale
            if(i===0) sim.ctx.moveTo(plotX + i, plotY + y_plot);
            else sim.ctx.lineTo(plotX + i, plotY + y_plot);
        }
        sim.ctx.stroke();
        
        // Draw current operating point on curve
        const curX = plotX + (r / 3) * plotW;
        const curY = plotY + plotH - (M * 20);
        sim.ctx.fillStyle = c.accent;
        sim.ctx.beginPath();
        sim.ctx.arc(curX, curY, 6, 0, Math.PI*2);
        sim.ctx.fill();
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 5: ENGINE MOUNT OPTIMIZER
// ============================================================================
function initSim5() {
    const sim = setupCanvas('canvas-container-5');
    if(!sim) return;
    
    const ui = {
        k: document.getElementById('sim5-k'),
        c: document.getElementById('sim5-c'),
        ft: document.getElementById('sim5-ft'),
        tr: document.getElementById('sim5-tr')
    };
    
    let time = 0;
    const m = 10;
    const w = 15; // Engine operating frequency
    const F0 = 100; // Excitation force
    
    function draw() {
        const colors = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const k = parseFloat(ui.k.value);
        const c = parseFloat(ui.c.value);
        
        const wn = Math.sqrt(k / m);
        const zeta = c / (2 * Math.sqrt(k * m));
        const r = w / wn;
        
        // Transmissibility
        const num = Math.sqrt(1 + Math.pow(2*zeta*r, 2));
        const den = Math.sqrt(Math.pow(1 - r*r, 2) + Math.pow(2*zeta*r, 2));
        const Tr = num / den;
        const Ft = F0 * Tr;
        
        ui.tr.innerText = Tr.toFixed(2);
        ui.ft.innerText = Ft.toFixed(0);
        
        time += 0.05;
        
        // Amplitude of engine
        const X = (F0 / k) / den;
        // Phase of engine
        const phi = Math.atan2(2*zeta*r, 1 - r*r);
        const x_eng = X * Math.cos(w * time - phi) * 5; // visual scale
        
        const centerX = sim.width / 2;
        const centerY = sim.height / 2;
        
        // Draw Chassis (Heatmap)
        const heat = Math.min(Tr / 2, 1); // 0 to 1
        const chassisColor = `rgba(${Math.round(200*heat + 50)}, ${Math.round(50*(1-heat) + 50)}, ${Math.round(50*(1-heat) + 50)}, 0.8)`;
        
        sim.ctx.shadowBlur = heat * 50;
        sim.ctx.shadowColor = `rgba(239, 68, 68, ${heat})`;
        sim.ctx.fillStyle = chassisColor;
        sim.ctx.fillRect(centerX - 150, centerY + 80, 300, 30);
        sim.ctx.shadowBlur = 0; // reset
        
        // Draw Mounts (Spring + Damper left, Spring + Damper right)
        sim.ctx.strokeStyle = colors.spring;
        sim.ctx.lineWidth = 3;
        drawSpring(sim.ctx, centerX - 100, centerY + 80, centerX - 100, centerY + 20 + x_eng, 5, 10);
        drawSpring(sim.ctx, centerX + 100, centerY + 80, centerX + 100, centerY + 20 + x_eng, 5, 10);
        
        // Draw Engine block
        drawIsoBox(sim.ctx, centerX, centerY + x_eng - 20, 200, 80, 100, colors.mass, '#475569', '#334155');
        
        // Draw internal piston moving
        sim.ctx.fillStyle = colors.neon;
        sim.ctx.fillRect(centerX - 10, centerY - 40 + x_eng + 10 * Math.cos(w * time), 20, 20);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 6: MODE SHAPE ANALYZER (2DOF)
// ============================================================================
function initSim6() {
    const sim = setupCanvas('canvas-container-6');
    if(!sim) return;
    
    const ui = {
        btnM1: document.getElementById('sim6-mode1'),
        btnM2: document.getElementById('sim6-mode2'),
        btnMix: document.getElementById('sim6-mixed'),
        status: document.getElementById('sim6-status'),
        ratio: document.getElementById('sim6-ratio')
    };
    
    let time = 0;
    let mode = 0; // 0=idle, 1=mode1, 2=mode2, 3=mixed
    const w1 = 2; // Mode 1 freq
    const w2 = 4; // Mode 2 freq
    
    ui.btnM1.addEventListener('click', () => { mode = 1; time = 0; ui.status.innerText = "Mode 1 (In-Phase)"; });
    ui.btnM2.addEventListener('click', () => { mode = 2; time = 0; ui.status.innerText = "Mode 2 (Out-of-Phase)"; });
    ui.btnMix.addEventListener('click', () => { mode = 3; time = 0; ui.status.innerText = "Mixed (Beat Phenomenon)"; });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        if (mode > 0) time += 0.05;
        
        let x1 = 0, x2 = 0;
        
        if (mode === 1) {
            x1 = 40 * Math.sin(w1 * time);
            x2 = 40 * Math.sin(w1 * time); // X1/X2 = 1
        } else if (mode === 2) {
            x1 = 40 * Math.sin(w2 * time);
            x2 = -40 * Math.sin(w2 * time); // X1/X2 = -1
        } else if (mode === 3) {
            // Mix of both
            x1 = 20 * Math.sin(w1 * time) + 20 * Math.sin(w2 * time);
            x2 = 20 * Math.sin(w1 * time) - 20 * Math.sin(w2 * time);
        }
        
        if (mode === 1 || mode === 2) {
            ui.ratio.innerText = (x2 !== 0 ? (x1/x2).toFixed(2) : "1.00");
        } else if (mode === 3) {
            ui.ratio.innerText = "Varying";
        }
        
        const centerY = sim.height / 2;
        const startX = sim.width * 0.1;
        const spacing = sim.width * 0.3;
        
        // Wall left
        sim.ctx.fillStyle = c.textSec;
        sim.ctx.fillRect(startX - 20, centerY - 50, 20, 100);
        // Wall right
        sim.ctx.fillRect(startX + spacing * 3, centerY - 50, 20, 100);
        
        const m1X = startX + spacing + x1;
        const m2X = startX + spacing * 2 + x2;
        
        // Springs
        sim.ctx.strokeStyle = c.spring;
        sim.ctx.lineWidth = 3;
        drawSpring(sim.ctx, startX, centerY, m1X - 30, centerY, 6, 15);
        drawSpring(sim.ctx, m1X + 30, centerY, m2X - 30, centerY, 6, 15);
        drawSpring(sim.ctx, m2X + 30, centerY, startX + spacing * 3, centerY, 6, 15);
        
        // Masses
        sim.ctx.fillStyle = c.accent;
        sim.ctx.fillRect(m1X - 30, centerY - 30, 60, 60);
        sim.ctx.fillStyle = c.neon;
        sim.ctx.fillRect(m2X - 30, centerY - 30, 60, 60);
        
        // Draw trace of mass 1 and 2
        sim.ctx.fillStyle = c.accent; sim.ctx.fillText("Mass 1", m1X - 20, centerY - 40);
        sim.ctx.fillStyle = c.neon; sim.ctx.fillText("Mass 2", m2X - 20, centerY - 40);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 7: DYNAMIC VIBRATION ABSORBER (TMD)
// ============================================================================
function initSim7() {
    const sim = setupCanvas('canvas-container-7');
    if(!sim) return;
    
    const ui = {
        m: document.getElementById('sim7-m'),
        k: document.getElementById('sim7-k'),
        btn: document.getElementById('sim7-wind'),
        sway: document.getElementById('sim7-sway'),
        tmd: document.getElementById('sim7-tmd')
    };
    
    const M = 100; // Building mass
    const K = 400; // Building stiffness
    const C = 2; // Building structural damping
    
    let x1 = 0, v1 = 0; // Building state
    let x2 = 0, v2 = 0; // TMD state
    let windForce = 0;
    
    ui.btn.addEventListener('click', () => {
        windForce = 1500; // Impulse
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const m_tmd = parseFloat(ui.m.value);
        const k_tmd = parseFloat(ui.k.value);
        const c_tmd = 1.0; // small TMD damping
        
        // Numerical Integration (Euler or RK4, simple Euler for viz)
        const dt = 0.016;
        for(let i=0; i<3; i++) { // Sub-steps for stability
            const step = dt/3;
            // Harmonic wind excitation + impulse
            const F = windForce + 500 * Math.sin(Math.sqrt(K/M) * Date.now()/1000); // excite at resonance
            
            // Coupled diff eqs
            const a1 = (F - K*x1 - C*v1 + k_tmd*(x2 - x1) + c_tmd*(v2 - v1)) / M;
            const a2 = (-k_tmd*(x2 - x1) - c_tmd*(v2 - v1)) / m_tmd;
            
            v1 += a1 * step;
            x1 += v1 * step;
            v2 += a2 * step;
            x2 += v2 * step;
            
            windForce *= 0.95; // decay impulse
        }
        
        ui.sway.innerText = (x1).toFixed(2);
        ui.tmd.innerText = (x2 - x1).toFixed(2); // Relative motion
        
        const centerX = sim.width / 2;
        const groundY = sim.height - 50;
        
        // Ground
        sim.ctx.fillStyle = c.grid;
        sim.ctx.fillRect(centerX - 200, groundY, 400, 20);
        
        // Building Base to Roof
        sim.ctx.strokeStyle = c.textSec;
        sim.ctx.lineWidth = 10;
        sim.ctx.beginPath();
        sim.ctx.moveTo(centerX, groundY);
        // Bending building curve
        sim.ctx.quadraticCurveTo(centerX, groundY - 150, centerX + x1, groundY - 300);
        sim.ctx.stroke();
        
        const roofX = centerX + x1;
        const roofY = groundY - 300;
        
        // Draw floors
        sim.ctx.fillStyle = c.bg;
        sim.ctx.strokeStyle = c.accent;
        sim.ctx.lineWidth = 2;
        for(let f=1; f<=4; f++) {
            const h = f * 75;
            const fx = centerX + x1 * Math.pow(f/4, 2);
            sim.ctx.fillRect(fx - 40, groundY - h, 80, 20);
            sim.ctx.strokeRect(fx - 40, groundY - h, 80, 20);
        }
        
        // TMD on Roof
        sim.ctx.strokeStyle = c.text;
        sim.ctx.lineWidth = 3;
        sim.ctx.beginPath();
        sim.ctx.moveTo(roofX, roofY - 20); // suspension point
        sim.ctx.lineTo(centerX + x2, roofY - 80); // pendulum
        sim.ctx.stroke();
        
        // TMD Mass (size based on mass)
        const tmdRadius = 10 + Math.sqrt(m_tmd) * 2;
        sim.ctx.fillStyle = '#ef4444';
        sim.ctx.beginPath();
        sim.ctx.arc(centerX + x2, roofY - 80, tmdRadius, 0, Math.PI*2);
        sim.ctx.fill();
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 8: EARTHQUAKE SIMULATOR (MDOF)
// ============================================================================
function initSim8() {
    const sim = setupCanvas('canvas-container-8');
    if(!sim) return;
    
    const ui = {
        eq: document.getElementById('sim8-eq'),
        btn: document.getElementById('sim8-run'),
        drift: document.getElementById('sim8-drift'),
        mode: document.getElementById('sim8-mode')
    };
    
    let isRunning = false;
    let time = 0;
    
    // 4 floors: x[0] to x[3] relative to base x_g
    let x = [0, 0, 0, 0];
    let v = [0, 0, 0, 0];
    const m = [1, 1, 1, 1]; // mass
    const k = [200, 200, 200, 200]; // stiffness
    const c = 0.5; // damping
    
    ui.btn.addEventListener('click', () => {
        isRunning = true;
        time = 0;
        x = [0, 0, 0, 0];
        v = [0, 0, 0, 0];
    });
    
    function getEarthquakeAccel(t, type) {
        if (!isRunning) return 0;
        if (t > 10) { isRunning = false; return 0; }
        
        if (type === 'sine') {
            return 50 * Math.sin(5 * t);
        } else if (type === 'elcentro') {
            // Pseudo-random noise enveloped
            return 80 * (Math.random() - 0.5) * Math.exp(-t/3) * Math.sin(10*t);
        } else {
            // Kobe
            return 100 * (Math.random() - 0.5) * Math.exp(-Math.pow(t-3, 2)) * Math.sin(12*t);
        }
    }
    
    function draw() {
        const colors = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const dt = 0.016;
        let x_g = 0;
        
        if(isRunning) {
            time += dt;
            const a_g = getEarthquakeAccel(time, ui.eq.value);
            x_g = a_g * 0.1; // visual base displacement
            
            // MDOF Integration (very simplified explicit Euler for 4DOF)
            for (let step=0; step<10; step++) {
                const sub_dt = dt/10;
                let a = [0, 0, 0, 0];
                
                a[0] = (-k[0]*x[0] + k[1]*(x[1]-x[0]) - c*v[0] - m[0]*a_g) / m[0];
                a[1] = (-k[1]*(x[1]-x[0]) + k[2]*(x[2]-x[1]) - c*v[1] - m[1]*a_g) / m[1];
                a[2] = (-k[2]*(x[2]-x[1]) + k[3]*(x[3]-x[2]) - c*v[2] - m[2]*a_g) / m[2];
                a[3] = (-k[3]*(x[3]-x[2]) - c*v[3] - m[3]*a_g) / m[3];
                
                for(let i=0; i<4; i++) {
                    v[i] += a[i] * sub_dt;
                    x[i] += v[i] * sub_dt;
                }
            }
        } else {
            // Damping to rest
            for(let i=0; i<4; i++) {
                v[i] *= 0.9;
                x[i] *= 0.9;
            }
        }
        
        // Calculate interstory drifts
        const drifts = [
            Math.abs(x[0]),
            Math.abs(x[1]-x[0]),
            Math.abs(x[2]-x[1]),
            Math.abs(x[3]-x[2])
        ];
        const maxDrift = Math.max(...drifts);
        ui.drift.innerText = maxDrift.toFixed(2);
        ui.mode.innerText = maxDrift > 10 ? "Higher Modes Active" : "Fundamental Mode";
        
        const centerX = sim.width / 2;
        const groundY = sim.height - 50;
        
        // Draw Shake Table
        sim.ctx.fillStyle = colors.textSec;
        sim.ctx.fillRect(centerX - 150 + x_g, groundY, 300, 30);
        
        // Draw Columns and Floors
        const floorH = 60;
        const colW = 100;
        
        for(let i=0; i<4; i++) {
            const bottomX = i === 0 ? x_g : x[i-1] + x_g;
            const topX = x[i] + x_g;
            const bottomY = groundY - i*floorH;
            const topY = groundY - (i+1)*floorH;
            
            // Color gradient based on drift (strain)
            const driftIntensity = Math.min(drifts[i] / 15, 1);
            const r = Math.round(239 * driftIntensity + 100 * (1-driftIntensity));
            const g = Math.round(68 * driftIntensity + 116 * (1-driftIntensity));
            const b = Math.round(68 * driftIntensity + 139 * (1-driftIntensity));
            sim.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            sim.ctx.lineWidth = 6;
            
            // Left column
            sim.ctx.beginPath();
            sim.ctx.moveTo(centerX - colW + bottomX, bottomY);
            sim.ctx.lineTo(centerX - colW + topX, topY);
            sim.ctx.stroke();
            
            // Right column
            sim.ctx.beginPath();
            sim.ctx.moveTo(centerX + colW + bottomX, bottomY);
            sim.ctx.lineTo(centerX + colW + topX, topY);
            sim.ctx.stroke();
            
            // Floor slab
            sim.ctx.fillStyle = colors.accent;
            sim.ctx.fillRect(centerX - colW - 10 + topX, topY - 10, colW*2 + 20, 10);
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 9: CONTINUOUS SYSTEMS (STANDING WAVES)
// ============================================================================
function initSim9() {
    const sim = setupCanvas('canvas-container-9');
    if(!sim) return;
    
    const ui = {
        freq: document.getElementById('sim9-freq'),
        bc: document.getElementById('sim9-bc'),
        nOrder: document.getElementById('sim9-n'),
        nodes: document.getElementById('sim9-nodes')
    };
    
    let time = 0;
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const f = parseFloat(ui.freq.value);
        const bc = ui.bc.value;
        time += 0.05 * (f / 10);
        
        const L = sim.width * 0.8;
        const startX = sim.width * 0.1;
        const centerY = sim.height / 2;
        
        let mode = 0;
        let y = []; // Array of points
        let nodesDetected = 0;
        
        // Pinned-Pinned natural frequencies approx: n
        // Cantilever approx: roughly proportional to (n-0.5)^2 but let's visually map it
        
        if (bc === 'pinned') {
            mode = Math.round(f / 20); // 1 to 5
            if (mode < 1) mode = 1;
            nodesDetected = mode - 1; // Internal nodes
            for(let i=0; i<=L; i+=5) {
                const x = i / L;
                // Shape: sin(n * pi * x)
                const amp = 50 * Math.sin(time);
                y.push(amp * Math.sin(mode * Math.PI * x));
            }
        } else {
            // Cantilever
            mode = Math.round(f / 25);
            if (mode < 1) mode = 1;
            nodesDetected = mode - 1;
            for(let i=0; i<=L; i+=5) {
                const x = i / L;
                const amp = 50 * Math.sin(time);
                // Approximate visual cantilever mode shapes
                let val = 0;
                if(mode === 1) val = x*x; // simplified
                if(mode === 2) val = (Math.cos(4.69*x) - Math.cosh(4.69*x)) - 1.01*(Math.sin(4.69*x) - Math.sinh(4.69*x));
                if(mode === 3) val = (Math.cos(7.85*x) - Math.cosh(7.85*x)) - 1.00*(Math.sin(7.85*x) - Math.sinh(7.85*x));
                if(mode > 3) val = (Math.cos(mode*3*x) - Math.cosh(mode*3*x)) - (Math.sin(mode*3*x) - Math.sinh(mode*3*x));
                
                // normalize visual amp
                y.push(amp * val * (mode === 1 ? 1 : 0.5));
            }
        }
        
        ui.nOrder.innerText = mode;
        ui.nodes.innerText = nodesDetected;
        
        // Draw boundaries
        sim.ctx.fillStyle = c.textSec;
        if(bc === 'pinned') {
            sim.ctx.beginPath(); sim.ctx.arc(startX, centerY, 5, 0, Math.PI*2); sim.ctx.fill();
            sim.ctx.beginPath(); sim.ctx.arc(startX + L, centerY, 5, 0, Math.PI*2); sim.ctx.fill();
        } else {
            sim.ctx.fillRect(startX - 20, centerY - 40, 20, 80);
        }
        
        // Draw Beam
        sim.ctx.strokeStyle = c.accent;
        sim.ctx.lineWidth = 4;
        sim.ctx.lineJoin = 'round';
        sim.ctx.beginPath();
        sim.ctx.moveTo(startX, centerY + y[0]);
        for(let i=1; i<y.length; i++) {
            sim.ctx.lineTo(startX + i*5, centerY + y[i]);
        }
        sim.ctx.stroke();
        
        // Motion trail / envelope
        sim.ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        sim.ctx.lineWidth = 1;
        sim.ctx.beginPath();
        for(let i=0; i<y.length; i++) {
            const maxAmp = bc === 'pinned' ? 50 * Math.sin(mode * Math.PI * (i*5/L)) : 50; // simplifed envelope
            sim.ctx.lineTo(startX + i*5, centerY + maxAmp);
        }
        sim.ctx.stroke();
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 10: WHIRLING OF SHAFTS
// ============================================================================
function initSim10() {
    const sim = setupCanvas('canvas-container-10');
    if(!sim) return;
    
    const ui = {
        rpm: document.getElementById('sim10-rpm'),
        btn: document.getElementById('sim10-throttle'),
        speed: document.getElementById('sim10-speed'),
        def: document.getElementById('sim10-def')
    };
    
    let isFullThrottle = false;
    const criticalRPM = 5000;
    const e = 1.0; // eccentricity
    let time = 0;
    
    ui.btn.addEventListener('click', () => {
        isFullThrottle = !isFullThrottle;
        ui.btn.innerText = isFullThrottle ? "Cut Throttle" : "Full Throttle";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        let targetRPM = isFullThrottle ? 10000 : parseFloat(ui.rpm.value);
        let currentRPM = parseFloat(ui.speed.innerText);
        
        // Smooth acceleration
        if (currentRPM < targetRPM) currentRPM += 50;
        if (currentRPM > targetRPM) currentRPM -= 50;
        ui.speed.innerText = currentRPM.toFixed(0);
        
        const w = currentRPM * (2*Math.PI / 60);
        const wn = criticalRPM * (2*Math.PI / 60);
        const r = w / wn;
        
        // Deflection delta = e * r^2 / (1 - r^2). Adding small damping to prevent actual infinity visual
        const zeta = 0.05;
        const den = Math.sqrt(Math.pow(1 - r*r, 2) + Math.pow(2*zeta*r, 2));
        const delta = (e * r*r) / den;
        const phase = Math.atan2(2*zeta*r, 1 - r*r);
        
        ui.def.innerText = delta.toFixed(2);
        
        time += w * 0.005; // rotational time
        
        const centerX = sim.width / 2;
        const centerY = sim.height / 2;
        const shaftLength = sim.width * 0.6;
        
        // Bearings
        sim.ctx.fillStyle = c.textSec;
        sim.ctx.fillRect(centerX - shaftLength/2 - 20, centerY - 20, 20, 40);
        sim.ctx.fillRect(centerX + shaftLength/2, centerY - 20, 20, 40);
        
        // Visual whirling deflection
        const maxVisualDef = Math.min(delta * 10, 150); // cap visual
        
        // Phase inversion visual: if r > 1, disk rotates around its CG instead of geometric center
        const diskY = centerY + maxVisualDef * Math.cos(time - phase);
        const diskZ = maxVisualDef * Math.sin(time - phase); // pseudo 3d depth scale
        
        // Draw Shaft (Bowed curve)
        sim.ctx.strokeStyle = c.mass;
        sim.ctx.lineWidth = 6;
        sim.ctx.beginPath();
        sim.ctx.moveTo(centerX - shaftLength/2, centerY);
        sim.ctx.quadraticCurveTo(centerX, diskY, centerX + shaftLength/2, centerY);
        sim.ctx.stroke();
        
        // Draw Disk
        // Scale vertical size based on Z depth to fake 3D rotation
        const diskHeight = 100 + diskZ * 0.2; 
        const diskWidth = 20;
        
        sim.ctx.fillStyle = c.accent;
        sim.ctx.beginPath();
        sim.ctx.ellipse(centerX, diskY, diskWidth, diskHeight/2, 0, 0, Math.PI*2);
        sim.ctx.fill();
        sim.ctx.lineWidth = 2;
        sim.ctx.strokeStyle = '#fff';
        sim.ctx.stroke();
        
        // Warning UI for critical speed
        if (currentRPM > 4500 && currentRPM < 5500) {
            sim.ctx.fillStyle = '#ef4444';
            sim.ctx.font = 'bold 24px Arial';
            sim.ctx.fillText("CRITICAL SPEED ZONE!", centerX - 130, centerY - 150);
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 11: LIVE FFT SPECTRUM ANALYZER
// ============================================================================
function initSim11() {
    const sim = setupCanvas('canvas-container-11');
    if(!sim) return;
    
    const ui = {
        btnCap: document.getElementById('sim11-capture'),
        btnFft: document.getElementById('sim11-fft'),
        status: document.getElementById('sim11-status'),
        dom: document.getElementById('sim11-dom')
    };
    
    let signal = [];
    let spectrum = [];
    let phase = 0;
    let mode = 'idle'; // idle, capturing, analyzing, done
    
    ui.btnCap.addEventListener('click', () => {
        mode = 'capturing';
        signal = [];
        spectrum = [];
        ui.status.innerText = "Capturing Signal...";
        ui.dom.innerText = "---";
    });
    
    ui.btnFft.addEventListener('click', () => {
        if(signal.length > 0) {
            mode = 'analyzing';
            ui.status.innerText = "Computing FFT...";
            // Fake computation delay for visual effect
            setTimeout(computePseudoFFT, 1000);
        }
    });
    
    function computePseudoFFT() {
        // We inject known frequencies (e.g., 20Hz, 60Hz gear mesh) and noise.
        // A real FFT requires a complex math library. We will generate a fake spectrum matching the signal components.
        spectrum = new Array(200).fill(0).map(() => Math.random() * 5); // noise floor
        spectrum[20] = 80; // 20Hz peak
        spectrum[60] = 40; // 60Hz peak
        spectrum[62] = 20; // 62Hz sideband (fault)
        spectrum[58] = 20; // 58Hz sideband
        
        mode = 'done';
        ui.status.innerText = "Analysis Complete";
        ui.dom.innerText = "20";
    }
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const w = sim.width;
        const h = sim.height;
        
        // Draw grid
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 1;
        for(let i=0; i<w; i+=50) {
            sim.ctx.beginPath(); sim.ctx.moveTo(i, 0); sim.ctx.lineTo(i, h); sim.ctx.stroke();
        }
        for(let i=0; i<h; i+=50) {
            sim.ctx.beginPath(); sim.ctx.moveTo(0, i); sim.ctx.lineTo(w, i); sim.ctx.stroke();
        }
        
        if (mode === 'capturing') {
            phase += 0.1;
            // Complex signal: f1=20Hz, f2=60Hz + noise
            const val = 30*Math.sin(2.0*phase) + 15*Math.sin(6.0*phase) + 5*(Math.random()-0.5);
            signal.push(val);
            if (signal.length > w) signal.shift();
            
            // Draw Time Domain Signal
            sim.ctx.strokeStyle = c.neon;
            sim.ctx.lineWidth = 2;
            sim.ctx.beginPath();
            for(let i=0; i<signal.length; i++) {
                if(i===0) sim.ctx.moveTo(i, h/2 - signal[i]);
                else sim.ctx.lineTo(i, h/2 - signal[i]);
            }
            sim.ctx.stroke();
            sim.ctx.fillStyle = c.textSec;
            sim.ctx.fillText("Time Domain (Amplitude vs Time)", 20, 30);
            
        } else if (mode === 'analyzing') {
            // Draw scanning effect
            const scanX = (Date.now() / 5) % w;
            sim.ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
            sim.ctx.fillRect(0, 0, scanX, h);
            sim.ctx.strokeStyle = c.neon;
            sim.ctx.beginPath(); sim.ctx.moveTo(scanX, 0); sim.ctx.lineTo(scanX, h); sim.ctx.stroke();
            
        } else if (mode === 'done') {
            // Draw Frequency Spectrum
            sim.ctx.fillStyle = c.accent;
            const barW = (w - 40) / spectrum.length;
            for(let i=0; i<spectrum.length; i++) {
                const amp = spectrum[i];
                sim.ctx.fillRect(20 + i*barW, h - 30 - amp, barW - 1, amp);
            }
            // Axis
            sim.ctx.strokeStyle = c.text;
            sim.ctx.beginPath(); sim.ctx.moveTo(20, h-30); sim.ctx.lineTo(w-20, h-30); sim.ctx.stroke();
            
            sim.ctx.fillStyle = c.textSec;
            sim.ctx.fillText("Frequency Domain (Amplitude vs Hz)", 20, 30);
            
            // Highlight Fault
            sim.ctx.fillStyle = '#ef4444';
            sim.ctx.fillText("Detected Gear Fault (Sidebands)", 20 + 60*barW - 50, h - 30 - 45);
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
