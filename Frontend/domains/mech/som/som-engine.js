// =====================================================================================
// SCME - STRENGTH OF MATERIALS (SOM) - SIMULATOR ENGINE (PART 1: Chapters 1-4)
// =====================================================================================

console.log("SOM Engine Initialized. Loading Part 1 Simulators...");

// Utility to handle canvas resizing and high-DPI displays
function setupCanvas(canvasId) {
    const canvas = document.querySelector(`#${canvasId} canvas`) || document.createElement('canvas');
    const container = document.getElementById(canvasId);
    
    // Remove placeholder text if it exists
    const placeholder = container.querySelector('.placeholder-text');
    if (placeholder) {
        placeholder.remove();
    }
    
    if (!container.contains(canvas)) {
        container.appendChild(canvas);
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
    
    return { canvas, ctx, container };
}

// Utility to get current theme colors
function getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        text: isDark ? '#f8fafc' : '#0f172a',
        textSec: isDark ? '#94a3b8' : '#475569',
        accent: isDark ? '#f59e0b' : '#d97706',
        bg: isDark ? '#050508' : '#e2e8f0',
        grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        tension: '#ef4444',
        compression: '#3b82f6',
        shear: '#10b981'
    };
}

// Draw a grid for background
function drawGrid(ctx, width, height, colors) {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 40) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();
}

// =====================================================================================
// CHAPTER 1: 3D Tensile Test Machine (UTM)
// =====================================================================================
function initSim1() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-1');
    const matSelect = document.getElementById('sim1-mat');
    const runBtn = document.getElementById('sim1-run');
    const forceEl = document.getElementById('sim1-force');
    const stressEl = document.getElementById('sim1-stress');
    const statusEl = document.getElementById('sim1-status');
    
    let isRunning = false;
    let progress = 0; // 0 to 1
    let animId;

    const materials = {
        steel: { E: 200, yield: 250, uts: 400, fractureStrain: 0.25, necking: true, color: '#94a3b8' },
        aluminum: { E: 70, yield: 200, uts: 310, fractureStrain: 0.15, necking: true, color: '#e2e8f0' },
        castiron: { E: 100, yield: 150, uts: 200, fractureStrain: 0.02, necking: false, color: '#334155' }
    };

    function draw() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, c);
        
        const mat = materials[matSelect.value];
        const rectW = width / 2; // Left half for machine, right half for graph
        
        // --- DRAW GRAPH ---
        const gX = width * 0.55;
        const gY = height * 0.85;
        const gW = width * 0.4;
        const gH = height * 0.7;
        
        // Axes
        ctx.strokeStyle = c.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gX, gY - gH); ctx.lineTo(gX, gY); ctx.lineTo(gX + gW, gY);
        ctx.stroke();
        
        ctx.fillStyle = c.textSec;
        ctx.font = '12px Inter';
        ctx.fillText('Strain (ε)', gX + gW - 40, gY + 20);
        ctx.save();
        ctx.translate(gX - 20, gY - gH + 40);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('Stress (σ)', 0, 0);
        ctx.restore();

        // Calculate current state
        let currentStrain = progress * mat.fractureStrain;
        let currentStress = 0;
        let isFractured = progress >= 1;
        
        if (!isFractured) {
            let yieldStrain = mat.yield / mat.E / 1000;
            if (currentStrain <= yieldStrain) {
                currentStress = currentStrain * mat.E * 1000; // Linear elastic
            } else {
                // Plastic region curve (simplified)
                let plasticProgress = (currentStrain - yieldStrain) / (mat.fractureStrain - yieldStrain);
                if (mat.necking && plasticProgress > 0.6) {
                    // Necking phase (stress drops)
                    let neckingProg = (plasticProgress - 0.6) / 0.4;
                    currentStress = mat.uts - (mat.uts - mat.yield * 0.9) * neckingProg;
                } else {
                    // Strain hardening
                    let hardeningProg = plasticProgress / 0.6;
                    if (!mat.necking) hardeningProg = plasticProgress; // Brittle just goes up and snaps
                    currentStress = mat.yield + (mat.uts - mat.yield) * Math.sin(hardeningProg * Math.PI / 2);
                }
            }
        }
        
        // Draw Curve
        ctx.beginPath();
        ctx.moveTo(gX, gY);
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 3;
        for (let p = 0; p <= progress; p += 0.01) {
            let e = p * mat.fractureStrain;
            let s = 0;
            let ey = mat.yield / mat.E / 1000;
            if (e <= ey) s = e * mat.E * 1000;
            else {
                let pp = (e - ey) / (mat.fractureStrain - ey);
                if (mat.necking && pp > 0.6) {
                    s = mat.uts - (mat.uts - mat.yield * 0.9) * ((pp - 0.6) / 0.4);
                } else {
                    let hp = mat.necking ? pp / 0.6 : pp;
                    s = mat.yield + (mat.uts - mat.yield) * Math.sin(hp * Math.PI / 2);
                }
            }
            let px = gX + (e / mat.fractureStrain) * gW;
            let py = gY - (s / (mat.uts * 1.2)) * gH;
            ctx.lineTo(px, py);
        }
        if (progress > 0) ctx.stroke();
        
        // --- DRAW MACHINE & SPECIMEN ---
        const midX = rectW * 0.5;
        const topGripY = height * 0.2;
        const bottomGripY = height * 0.8;
        
        // Displacement
        let displacement = currentStrain * 200; // visual scalar
        let currentBottom = isFractured ? bottomGripY + 30 : bottomGripY + displacement;
        
        // Grips
        ctx.fillStyle = '#64748b';
        ctx.fillRect(midX - 40, topGripY - 40, 80, 40);
        ctx.fillRect(midX - 40, currentBottom, 80, 40);
        
        // Specimen
        let specWidth = 20;
        if (mat.necking && currentStrain > (mat.yield / mat.E / 1000)) {
            // Visualize necking
            let pp = (currentStrain - (mat.yield / mat.E / 1000)) / (mat.fractureStrain - (mat.yield / mat.E / 1000));
            if (pp > 0.6) {
                let shrink = ((pp - 0.6) / 0.4) * 10;
                specWidth -= shrink;
            }
        }
        
        ctx.fillStyle = mat.color;
        if (!isFractured) {
            // Draw continuous specimen
            ctx.beginPath();
            ctx.moveTo(midX - 10, topGripY);
            if (mat.necking && specWidth < 20) {
                let neckY = (topGripY + currentBottom) / 2;
                ctx.lineTo(midX - specWidth/2, neckY);
                ctx.lineTo(midX - 10, currentBottom);
                ctx.lineTo(midX + 10, currentBottom);
                ctx.lineTo(midX + specWidth/2, neckY);
                ctx.lineTo(midX + 10, topGripY);
            } else {
                ctx.lineTo(midX - 10, currentBottom);
                ctx.lineTo(midX + 10, currentBottom);
                ctx.lineTo(midX + 10, topGripY);
            }
            ctx.fill();
        } else {
            // Fractured
            let neckY = (topGripY + bottomGripY + 200 * mat.fractureStrain) / 2;
            ctx.beginPath();
            ctx.moveTo(midX - 10, topGripY);
            ctx.lineTo(midX - specWidth/2, neckY - 5);
            ctx.lineTo(midX + specWidth/2, neckY - 5);
            ctx.lineTo(midX + 10, topGripY);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(midX - 10, currentBottom);
            ctx.lineTo(midX - specWidth/2, neckY + 15);
            ctx.lineTo(midX + specWidth/2, neckY + 15);
            ctx.lineTo(midX + 10, currentBottom);
            ctx.fill();
            
            // X mark on graph
            let fx = gX + gW;
            let fy = gY - (currentStress / (mat.uts * 1.2)) * gH;
            ctx.strokeStyle = c.tension;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(fx - 10, fy - 10); ctx.lineTo(fx + 10, fy + 10);
            ctx.moveTo(fx + 10, fy - 10); ctx.lineTo(fx - 10, fy + 10);
            ctx.stroke();
        }

        // UI Updates
        forceEl.innerText = isFractured ? '0' : (currentStress * 0.05).toFixed(1); // dummy area
        stressEl.innerText = isFractured ? '0' : currentStress.toFixed(0);
    }

    function animate() {
        if (!isRunning) return;
        progress += 0.003;
        
        if (progress >= 1) {
            progress = 1;
            isRunning = false;
            statusEl.innerText = "FRACTURED";
            statusEl.style.color = '#ef4444';
            runBtn.innerText = "Reset Test";
        }
        
        draw();
        if (isRunning) animId = requestAnimationFrame(animate);
    }

    runBtn.addEventListener('click', () => {
        if (progress >= 1) {
            progress = 0;
            statusEl.innerText = "Ready";
            statusEl.style.color = getColors().accent;
            runBtn.innerText = "Initiate Test";
            draw();
            return;
        }
        
        if (!isRunning) {
            isRunning = true;
            statusEl.innerText = "Testing...";
            statusEl.style.color = '#10b981';
            runBtn.innerText = "Pause Test";
            animate();
        } else {
            isRunning = false;
            statusEl.innerText = "Paused";
            statusEl.style.color = '#f59e0b';
            runBtn.innerText = "Resume Test";
        }
    });

    matSelect.addEventListener('change', () => {
        progress = 0;
        isRunning = false;
        statusEl.innerText = "Ready";
        statusEl.style.color = getColors().accent;
        runBtn.innerText = "Initiate Test";
        draw();
    });

    draw();
}

// =====================================================================================
// CHAPTER 2: Interactive 3D Mohr's Circle
// =====================================================================================
function initSim2() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-2');
    const sxInput = document.getElementById('sim2-sigmax');
    const syInput = document.getElementById('sim2-sigmay');
    const txyInput = document.getElementById('sim2-tau');
    const thetaInput = document.getElementById('sim2-theta');
    
    function draw() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, width, height);
        drawGrid(ctx, width, height, c);
        
        let sx = parseFloat(sxInput.value);
        let sy = parseFloat(syInput.value);
        let txy = parseFloat(txyInput.value);
        let thetaDeg = parseFloat(thetaInput.value);
        let theta = thetaDeg * Math.PI / 180;
        
        // Calculations
        let center = (sx + sy) / 2;
        let R = Math.sqrt(Math.pow((sx - sy)/2, 2) + Math.pow(txy, 2));
        let s1 = center + R;
        let s2 = center - R;
        
        // Transformed stresses
        let st = center + ((sx - sy)/2)*Math.cos(2*theta) + txy*Math.sin(2*theta);
        let tt = -((sx - sy)/2)*Math.sin(2*theta) + txy*Math.cos(2*theta);

        // Responsive positioning
        let isMobile = width < 768;
        const elX = isMobile ? width * 0.5 : width * 0.25;
        const elY = isMobile ? height * 0.25 : height * 0.5;
        const size = isMobile ? 80 : 120;
        
        // --- DRAW STRESS ELEMENT ---
        ctx.save();
        ctx.translate(elX, elY);
        ctx.rotate(-theta);
        
        // Block
        ctx.fillStyle = c.bg;
        ctx.strokeStyle = c.text;
        ctx.lineWidth = 2;
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.strokeRect(-size/2, -size/2, size, size);
        
        // Draw transformed stress arrows (simplified for visual)
        ctx.fillStyle = c.tension;
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        
        // Normal st
        if (Math.abs(st) > 1) {
            let dir = st > 0 ? 1 : -1;
            drawArrow(ctx, size/2 * dir, 0, (size/2 + 30) * dir, 0, st > 0 ? c.tension : c.compression);
            drawArrow(ctx, -size/2 * dir, 0, (-size/2 - 30) * dir, 0, st > 0 ? c.tension : c.compression);
            ctx.fillText(`σθ=${st.toFixed(1)}`, (size/2 + 40) * dir, 5);
        }
        
        // Shear tt
        if (Math.abs(tt) > 1) {
            let dir = tt > 0 ? 1 : -1;
            drawArrow(ctx, size/2, -size/2*dir, size/2, -size/2*dir - 20*dir, c.shear);
            drawArrow(ctx, -size/2, size/2*dir, -size/2, size/2*dir + 20*dir, c.shear);
            ctx.fillStyle = c.shear;
            ctx.fillText(`τθ=${tt.toFixed(1)}`, size/2 + 10, -size/2*dir - 25*dir);
        }
        
        ctx.restore();
        
        // --- DRAW MOHR'S CIRCLE ---
        const gX = isMobile ? width * 0.5 : width * 0.7;
        const gY = isMobile ? height * 0.75 : height * 0.5;
        const scale = isMobile ? 0.9 : 1.5; // pixels per MPa
        
        // Axes
        ctx.strokeStyle = c.textSec;
        ctx.lineWidth = 1;
        ctx.beginPath();
        let axisLen = isMobile ? 150 : 250;
        ctx.moveTo(gX - axisLen, gY); ctx.lineTo(gX + axisLen, gY); // Sigma axis
        ctx.moveTo(gX, gY - axisLen); ctx.lineTo(gX, gY + axisLen); // Tau axis
        ctx.stroke();
        ctx.fillStyle = c.textSec;
        ctx.fillText('σ', gX + 240, gY - 10);
        ctx.fillText('τ', gX + 10, gY - 190);
        
        // Circle
        let cx = gX + center * scale;
        let rPx = R * scale;
        
        ctx.beginPath();
        ctx.arc(cx, gY, rPx, 0, 2*Math.PI);
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.fillStyle = c.bg;
        ctx.fill();
        ctx.stroke();
        
        // Original X and Y face points
        let px1 = gX + sx * scale;
        let py1 = gY - txy * scale; // standard convention
        let px2 = gX + sy * scale;
        let py2 = gY + txy * scale;
        
        ctx.beginPath();
        ctx.moveTo(px1, py1); ctx.lineTo(px2, py2);
        ctx.strokeStyle = c.textSec;
        ctx.stroke();
        
        // Current Theta Point
        let tx = gX + st * scale;
        let ty = gY - tt * scale;
        
        ctx.beginPath();
        ctx.moveTo(cx, gY); ctx.lineTo(tx, ty);
        ctx.strokeStyle = '#10b981';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(tx, ty, 6, 0, 2*Math.PI);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        
        // Principal Stresses
        ctx.fillStyle = c.tension;
        ctx.beginPath(); ctx.arc(gX + s1 * scale, gY, 4, 0, 2*Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(gX + s2 * scale, gY, 4, 0, 2*Math.PI); ctx.fill();
        
        ctx.fillText(`σ1: ${s1.toFixed(1)}`, gX + s1 * scale, gY - 10);
        ctx.fillText(`σ2: ${s2.toFixed(1)}`, gX + s2 * scale, gY - 10);
    }
    
    // Helper to draw arrows
    function drawArrow(ctx, fromx, fromy, tox, toy, color) {
        let headlen = 10;
        let dx = tox - fromx;
        let dy = toy - fromy;
        let angle = Math.atan2(dy, dx);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(tox, toy);
        ctx.fill();
    }

    [sxInput, syInput, txyInput, thetaInput].forEach(el => {
        el.addEventListener('input', draw);
    });

    draw();
}

// =====================================================================================
// CHAPTER 3: SFD & BMD Sandbox
// =====================================================================================
function initSim3() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-3');
    const typeSelect = document.getElementById('sim3-support');
    const addPtBtn = document.getElementById('sim3-add-point');
    const addUdlBtn = document.getElementById('sim3-add-udl');
    const clearBtn = document.getElementById('sim3-clear');
    
    let length = 10; // meters
    let loads = []; // {type: 'point'|'udl', pos: x, val: kN, endPos: x2}
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        
        let beamY = h * 0.2;
        let sfdY = h * 0.55;
        let bmdY = h * 0.85;
        
        let padding = w * 0.1;
        let span = w - 2 * padding;
        let scaleX = span / length;
        
        // Calculate Reactions (Simplified for statically determinate)
        let R1 = 0, R2 = 0;
        let M1 = 0; // for cantilever
        let type = typeSelect.value;
        
        if (type === 'simply' || type === 'overhang') {
            let sup1 = type === 'simply' ? 0 : 2;
            let sup2 = type === 'simply' ? length : length - 2;
            
            let momentAbout2 = 0;
            let totalForce = 0;
            loads.forEach(l => {
                if (l.type === 'point') {
                    totalForce += l.val;
                    momentAbout2 += l.val * (sup2 - l.pos);
                } else if (l.type === 'udl') {
                    let force = l.val * (l.endPos - l.pos);
                    let cg = l.pos + (l.endPos - l.pos)/2;
                    totalForce += force;
                    momentAbout2 += force * (sup2 - cg);
                }
            });
            R1 = momentAbout2 / (sup2 - sup1);
            R2 = totalForce - R1;
        } else if (type === 'cantilever') {
            let totalForce = 0;
            let momentAbout1 = 0;
            loads.forEach(l => {
                if (l.type === 'point') {
                    totalForce += l.val;
                    momentAbout1 += l.val * l.pos;
                } else if (l.type === 'udl') {
                    let force = l.val * (l.endPos - l.pos);
                    let cg = l.pos + (l.endPos - l.pos)/2;
                    totalForce += force;
                    momentAbout1 += force * cg;
                }
            });
            R1 = totalForce;
            M1 = momentAbout1;
        }

        // --- DRAW BEAM ---
        ctx.lineWidth = 6;
        ctx.strokeStyle = c.textSec;
        ctx.beginPath();
        ctx.moveTo(padding, beamY);
        ctx.lineTo(padding + span, beamY);
        ctx.stroke();
        
        // Draw Supports
        ctx.fillStyle = c.accent;
        if (type === 'simply' || type === 'overhang') {
            let sup1 = type === 'simply' ? 0 : 2;
            let sup2 = type === 'simply' ? length : length - 2;
            ctx.beginPath(); ctx.moveTo(padding + sup1*scaleX, beamY); ctx.lineTo(padding + sup1*scaleX - 10, beamY + 20); ctx.lineTo(padding + sup1*scaleX + 10, beamY + 20); ctx.fill();
            ctx.beginPath(); ctx.moveTo(padding + sup2*scaleX, beamY); ctx.lineTo(padding + sup2*scaleX - 10, beamY + 20); ctx.lineTo(padding + sup2*scaleX + 10, beamY + 20); ctx.fill();
        } else if (type === 'cantilever') {
            ctx.fillRect(padding - 20, beamY - 30, 20, 60);
        }
        
        // Draw Loads
        ctx.fillStyle = c.tension;
        ctx.strokeStyle = c.tension;
        loads.forEach(l => {
            if (l.type === 'point') {
                let lx = padding + l.pos * scaleX;
                drawArrowDown(ctx, lx, beamY - 40, lx, beamY - 5, c.tension);
                ctx.fillText(l.val + 'kN', lx - 10, beamY - 45);
            } else if (l.type === 'udl') {
                let start = padding + l.pos * scaleX;
                let end = padding + l.endPos * scaleX;
                ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.fillRect(start, beamY - 20, end - start, 20);
                for (let x = start; x <= end; x += 20) {
                    drawArrowDown(ctx, x, beamY - 20, x, beamY, c.tension);
                }
                ctx.fillStyle = c.tension;
                ctx.fillText(l.val + 'kN/m', start + (end-start)/2 - 15, beamY - 25);
            }
        });

        // Calculate V and M Arrays
        let V = [];
        let M = [];
        let pts = 500;
        let maxV = 0.001, maxM = 0.001;
        
        let sup1Pos = (type === 'simply') ? 0 : (type === 'overhang' ? 2 : 0);
        let sup2Pos = (type === 'simply') ? length : (type === 'overhang' ? length - 2 : length);

        for (let i = 0; i <= pts; i++) {
            let x = (i / pts) * length;
            let cv = 0;
            let cm = 0;
            
            // Reactions contribution
            if (type === 'cantilever') {
                cv += R1;
                cm -= M1;
                cm += R1 * x;
            } else {
                if (x >= sup1Pos) { cv += R1; cm += R1 * (x - sup1Pos); }
                if (x >= sup2Pos) { cv += R2; cm += R2 * (x - sup2Pos); }
            }
            
            // Loads contribution
            loads.forEach(l => {
                if (l.type === 'point' && x > l.pos) {
                    cv -= l.val;
                    cm -= l.val * (x - l.pos);
                } else if (l.type === 'udl' && x > l.pos) {
                    let dist = Math.min(x, l.endPos) - l.pos;
                    let force = l.val * dist;
                    cv -= force;
                    cm -= force * (x - (l.pos + dist/2));
                }
            });
            
            V.push({x, v: cv});
            M.push({x, m: cm});
            maxV = Math.max(maxV, Math.abs(cv));
            maxM = Math.max(maxM, Math.abs(cm));
        }

        // --- DRAW SFD ---
        ctx.strokeStyle = c.textSec;
        ctx.beginPath(); ctx.moveTo(padding, sfdY); ctx.lineTo(padding + span, sfdY); ctx.stroke();
        ctx.fillText('SFD', 10, sfdY);
        
        ctx.beginPath();
        ctx.moveTo(padding, sfdY);
        V.forEach(p => {
            ctx.lineTo(padding + p.x * scaleX, sfdY - (p.v / maxV) * 50);
        });
        ctx.lineTo(padding + span, sfdY);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- DRAW BMD ---
        ctx.strokeStyle = c.textSec;
        ctx.beginPath(); ctx.moveTo(padding, bmdY); ctx.lineTo(padding + span, bmdY); ctx.stroke();
        ctx.fillText('BMD', 10, bmdY);
        
        ctx.beginPath();
        ctx.moveTo(padding, bmdY);
        M.forEach(p => {
            // Note: Positive bending moment drawn below line standard in some regions, above in others. 
            // We draw positive up.
            ctx.lineTo(padding + p.x * scaleX, bmdY - (p.m / maxM) * 60);
        });
        ctx.lineTo(padding + span, bmdY);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function drawArrowDown(ctx, fromx, fromy, tox, toy, color) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tox, toy); ctx.lineTo(tox - 4, toy - 8); ctx.lineTo(tox + 4, toy - 8); ctx.fill();
    }

    addPtBtn.addEventListener('click', () => {
        loads.push({ type: 'point', pos: Math.random() * length, val: Math.floor(Math.random() * 40 + 10) });
        draw();
    });
    
    addUdlBtn.addEventListener('click', () => {
        let pos1 = Math.random() * length;
        let pos2 = Math.random() * length;
        loads.push({ type: 'udl', pos: Math.min(pos1, pos2), endPos: Math.max(pos1, pos2), val: Math.floor(Math.random() * 20 + 5) });
        draw();
    });
    
    clearBtn.addEventListener('click', () => { loads = []; draw(); });
    typeSelect.addEventListener('change', draw);

    draw();
}

// =====================================================================================
// CHAPTER 4: 3D Cross-Section Stress Visualizer
// =====================================================================================
function initSim4() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-4');
    const secSelect = document.getElementById('sim4-section');
    const mInput = document.getElementById('sim4-moment');
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, c);
        
        let type = secSelect.value;
        let M = parseFloat(mInput.value); // kNm
        
        let cx = w/2;
        let cy = h/2;
        
        ctx.save();
        // Create an isometric-like tilt
        ctx.translate(cx, cy);
        // ctx.scale(1, 0.8);
        // ctx.rotate(Math.PI / 12);
        
        // Define paths for sections
        ctx.beginPath();
        if (type === 'ibeam') {
            ctx.moveTo(-60, -100); ctx.lineTo(60, -100); ctx.lineTo(60, -80); ctx.lineTo(10, -80);
            ctx.lineTo(10, 80); ctx.lineTo(60, 80); ctx.lineTo(60, 100); ctx.lineTo(-60, 100);
            ctx.lineTo(-60, 80); ctx.lineTo(-10, 80); ctx.lineTo(-10, -80); ctx.lineTo(-60, -80);
        } else if (type === 'rect') {
            ctx.rect(-50, -100, 100, 200);
        } else if (type === 'tbeam') {
            ctx.moveTo(-60, -100); ctx.lineTo(60, -100); ctx.lineTo(60, -70); ctx.lineTo(15, -70);
            ctx.lineTo(15, 100); ctx.lineTo(-15, 100); ctx.lineTo(-15, -70); ctx.lineTo(-60, -70);
        } else if (type === 'tube') {
            ctx.arc(0, 0, 100, 0, Math.PI*2);
            ctx.moveTo(80, 0);
            ctx.arc(0, 0, 80, 0, Math.PI*2, true);
        }
        ctx.closePath();
        
        // Clip to shape
        ctx.clip();
        
        // Draw Stress Gradient
        let grad = ctx.createLinearGradient(0, -120, 0, 120);
        
        if (M > 0) {
            // Sagging: Top Compression (Blue), Bottom Tension (Red)
            grad.addColorStop(0, `rgba(59, 130, 246, ${Math.abs(M)/200})`);
            grad.addColorStop(0.5, 'rgba(255,255,255,0)'); // Neutral Axis
            grad.addColorStop(1, `rgba(239, 68, 68, ${Math.abs(M)/200})`);
        } else if (M < 0) {
            // Hogging: Top Tension, Bottom Compression
            grad.addColorStop(0, `rgba(239, 68, 68, ${Math.abs(M)/200})`);
            grad.addColorStop(0.5, 'rgba(255,255,255,0)');
            grad.addColorStop(1, `rgba(59, 130, 246, ${Math.abs(M)/200})`);
        } else {
            grad.addColorStop(0, c.bg);
        }
        
        ctx.fillStyle = c.bg; // Base fill
        ctx.fillRect(-150, -150, 300, 300);
        
        ctx.fillStyle = grad; // Stress overlay
        ctx.fillRect(-150, -150, 300, 300);
        
        // Draw Outline
        ctx.restore(); // Remove clip
        ctx.save();
        ctx.translate(cx, cy);
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = c.textSec;
        ctx.stroke(); // strokes the path created before clipping
        
        // Neutral Axis Line
        ctx.beginPath();
        let naY = 0; // For symmetric shapes. T-beam is offset in reality, simplified here.
        if (type === 'tbeam') naY = -20; 
        
        ctx.moveTo(-150, naY);
        ctx.lineTo(150, naY);
        ctx.strokeStyle = '#10b981';
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        
        ctx.fillStyle = '#10b981';
        ctx.font = '14px Inter';
        ctx.fillText('N.A. (Neutral Axis)', 60, naY - 10);
        
        ctx.restore();
    }
    
    secSelect.addEventListener('change', draw);
    mInput.addEventListener('input', draw);
    draw();
}


// =====================================================================================
// CHAPTER 5: Transverse Shear Stress (Jouravski)
// =====================================================================================
function initSim5() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-5');
    const secSelect = document.getElementById('sim5-section');
    const vInput = document.getElementById('sim5-shear');
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, c);
        
        let type = secSelect.value;
        let V = parseFloat(vInput.value); // Shear force
        
        let cx = w * 0.3;
        let cy = h / 2;
        
        // --- DRAW CROSS SECTION ---
        ctx.save();
        ctx.translate(cx, cy);
        
        ctx.beginPath();
        if (type === 'rect') {
            ctx.rect(-50, -100, 100, 200);
        } else if (type === 'ibeam') {
            ctx.moveTo(-60, -100); ctx.lineTo(60, -100); ctx.lineTo(60, -80); ctx.lineTo(10, -80);
            ctx.lineTo(10, 80); ctx.lineTo(60, 80); ctx.lineTo(60, 100); ctx.lineTo(-60, 100);
            ctx.lineTo(-60, 80); ctx.lineTo(-10, 80); ctx.lineTo(-10, -80); ctx.lineTo(-60, -80);
        } else if (type === 'circle') {
            ctx.arc(0, 0, 100, 0, Math.PI*2);
        }
        ctx.closePath();
        
        ctx.fillStyle = c.bg;
        ctx.fill();
        ctx.strokeStyle = c.textSec;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Neutral Axis
        ctx.beginPath();
        ctx.moveTo(-100, 0); ctx.lineTo(100, 0);
        ctx.strokeStyle = '#10b981';
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        
        // --- DRAW SHEAR STRESS DISTRIBUTION (RIGHT) ---
        let gx = w * 0.6;
        let gy = h / 2;
        let scaleTau = V * 1.5; // Visual scalar
        
        // Axis
        ctx.beginPath();
        ctx.moveTo(gx, gy - 120); ctx.lineTo(gx, gy + 120);
        ctx.strokeStyle = c.textSec;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(gx, gy - 100);
        
        let pts = [];
        for (let y = -100; y <= 100; y += 2) {
            let tau = 0;
            if (type === 'rect') {
                // Parabola: tau = tau_max * (1 - (y/c)^2)
                tau = (1 - Math.pow(y/100, 2));
            } else if (type === 'circle') {
                // Parabola: tau = tau_max * (1 - (y/r)^2)
                tau = (1 - Math.pow(y/100, 2));
            } else if (type === 'ibeam') {
                // Web vs Flange
                if (Math.abs(y) > 80) {
                    tau = 0.2 * (1 - Math.pow(Math.abs(y)-80, 2)/400); // Small in flange
                } else {
                    tau = 0.8 + 0.2 * (1 - Math.pow(y/80, 2)); // Jump in web
                }
            }
            pts.push({x: gx + tau * scaleTau, y: gy + y});
        }
        
        ctx.strokeStyle = c.shear;
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        
        pts.forEach((p, i) => {
            if (i===0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        
        ctx.lineTo(gx, gy + 100);
        ctx.lineTo(gx, gy - 100);
        ctx.fill();
        
        pts.forEach((p, i) => {
            if (i===0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        
        // Add horizontal arrows inside the distribution
        ctx.fillStyle = c.shear;
        for (let i = 0; i < pts.length; i += 20) {
            if (pts[i].x > gx + 5) {
                drawArrowPlain(ctx, gx, pts[i].y, pts[i].x, pts[i].y, c.shear);
            }
        }
    }
    
    function drawArrowPlain(ctx, fromx, fromy, tox, toy, color) {
        let headlen = 6;
        let angle = Math.atan2(toy - fromy, tox - fromx);
        ctx.strokeStyle = color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen*Math.cos(angle - Math.PI/6), toy - headlen*Math.sin(angle - Math.PI/6));
        ctx.lineTo(tox - headlen*Math.cos(angle + Math.PI/6), toy - headlen*Math.sin(angle + Math.PI/6));
        ctx.fill();
    }
    
    secSelect.addEventListener('change', draw);
    vInput.addEventListener('input', draw);
    draw();
}

// =====================================================================================
// CHAPTER 6: Torsion of Circular Shafts
// =====================================================================================
function initSim6() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-6');
    const modeSelect = document.getElementById('sim6-mode');
    const tInput = document.getElementById('sim6-torque');
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, c);
        
        let mode = modeSelect.value;
        let T = parseFloat(tInput.value); // 0 to 100
        
        if (mode === 'single') {
            drawShaft(w/2, h/2, 60, 0, T * 0.5, 'Solid Shaft');
        } else {
            // Compare Equal Mass. If solid R=60 (A = 3600*pi). 
            // Hollow: R_outer = 80, R_inner = sqrt(80^2 - 60^2) = 52.9
            // J_solid = pi/2 * 60^4 = 20.3e6
            // J_hollow = pi/2 * (80^4 - 52.9^4) = 52.1e6 (2.5x stiffer!)
            drawShaft(w/2, h*0.3, 40, 0, T * 0.8, 'Solid Shaft (Heavy & Weak)');
            drawShaft(w/2, h*0.7, 53, 35, T * (0.8 / 2.5), 'Hollow Shaft (Same Mass, 2.5x Stiffer)');
        }
    }
    
    function drawShaft(cx, cy, rOuter, rInner, twistAngleDeg, label) {
        const c = getColors();
        let length = 300;
        let startX = cx - length/2;
        let endX = cx + length/2;
        
        // Draw Shaft Body
        ctx.fillStyle = c.bg;
        ctx.strokeStyle = c.textSec;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.rect(startX, cy - rOuter, length, rOuter*2);
        ctx.fill(); ctx.stroke();
        
        // Left fixed wall
        ctx.fillStyle = '#64748b';
        ctx.fillRect(startX - 20, cy - rOuter - 20, 20, rOuter*2 + 40);
        
        // Right face ellipse (isometric perspective)
        ctx.beginPath();
        ctx.ellipse(endX, cy, 15, rOuter, 0, 0, 2*Math.PI);
        ctx.fillStyle = c.bg; ctx.fill(); ctx.stroke();
        
        if (rInner > 0) {
            // Draw inner bore line
            ctx.beginPath(); ctx.moveTo(startX, cy - rInner); ctx.lineTo(endX, cy - rInner);
            ctx.moveTo(startX, cy + rInner); ctx.lineTo(endX, cy + rInner);
            ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            
            ctx.beginPath();
            ctx.ellipse(endX, cy, 15 * (rInner/rOuter), rInner, 0, 0, 2*Math.PI);
            ctx.fillStyle = c.bg; ctx.fill(); ctx.stroke();
        }
        
        // Draw Longitudinal Line showing twist
        ctx.beginPath();
        ctx.moveTo(startX, cy - rOuter); // Top of fixed end
        
        let twistRad = twistAngleDeg * Math.PI / 180;
        let endY = cy - rOuter * Math.cos(twistRad);
        let endZ = rOuter * Math.sin(twistRad); // for elliptical projection
        let ellipseX = endX + 15 * Math.sin(twistRad);
        
        ctx.lineTo(ellipseX, endY);
        ctx.strokeStyle = c.tension;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw angle indicator on right face
        ctx.beginPath();
        ctx.moveTo(endX, cy);
        ctx.lineTo(ellipseX, endY);
        ctx.stroke();
        
        ctx.fillStyle = c.text;
        ctx.font = '14px Inter';
        ctx.fillText(label, startX + 20, cy - rOuter - 10);
        ctx.fillStyle = c.accent;
        ctx.fillText(`Twist: ${twistAngleDeg.toFixed(1)}°`, endX + 25, cy);
    }
    
    modeSelect.addEventListener('change', draw);
    tInput.addEventListener('input', draw);
    draw();
}

// =====================================================================================
// CHAPTER 7: Deflection of Beams
// =====================================================================================
function initSim7() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-7');
    const setupSelect = document.getElementById('sim7-setup');
    const scaleInput = document.getElementById('sim7-scale');
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        
        let type = setupSelect.value;
        let scale = parseFloat(scaleInput.value);
        
        let span = w * 0.8;
        let startX = w * 0.1;
        let cy = h * 0.4;
        
        // Draw un-deflected baseline
        ctx.beginPath();
        ctx.moveTo(startX, cy); ctx.lineTo(startX + span, cy);
        ctx.strokeStyle = c.grid; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
        
        // Deflection calculation (Normalized L = 1)
        let pts = [];
        let maxDef = 0;
        for (let x = 0; x <= 1; x += 0.01) {
            let y = 0;
            if (type === 'c-point') {
                // Cantilever with point load at end: y = (P x^2 / 6EI) * (3L - x)
                // Origin at fixed support
                y = (Math.pow(x, 2) / 6) * (3 - x) * 5; // scalar 5
            } else {
                // Simply supported with UDL: y = (w x / 24EI) * (L^3 - 2Lx^2 + x^3)
                // Origin at left support
                y = (x / 24) * (1 - 2*Math.pow(x, 2) + Math.pow(x, 3)) * 80;
            }
            pts.push({ px: startX + x * span, py: cy + y * scale * 0.1 }); // 0.1 visual factor
            maxDef = Math.max(maxDef, y * scale * 0.1);
        }
        
        // Draw deflected beam
        ctx.beginPath();
        pts.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
        });
        ctx.strokeStyle = c.textSec;
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // Supports and Loads
        ctx.fillStyle = c.accent;
        if (type === 'c-point') {
            ctx.fillRect(startX - 20, cy - 40, 20, 80); // Wall
            drawArrow(ctx, startX + span, cy - 60, startX + span, pts[pts.length-1].py - 5, c.tension);
        } else {
            // Pin & Roller
            ctx.beginPath(); ctx.moveTo(startX, cy); ctx.lineTo(startX-10, cy+20); ctx.lineTo(startX+10, cy+20); ctx.fill();
            ctx.beginPath(); ctx.moveTo(startX+span, cy); ctx.lineTo(startX+span-10, cy+20); ctx.lineTo(startX+span+10, cy+20); ctx.fill();
            // UDL
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.fillRect(startX, cy - 30, span, 30);
        }
        
        ctx.fillStyle = c.tension;
        ctx.font = '14px Inter';
        ctx.fillText(`Max Deflection Scale: ${scale}x`, w/2 - 60, cy + maxDef + 40);
    }
    
    function drawArrow(ctx, fromx, fromy, tox, toy, color) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tox, toy); ctx.lineTo(tox - 5, toy - 10); ctx.lineTo(tox + 5, toy - 10); ctx.fill();
    }
    
    setupSelect.addEventListener('change', draw);
    scaleInput.addEventListener('input', draw);
    draw();
}

// =====================================================================================
// CHAPTER 8: Strain Energy and Impact Loading
// =====================================================================================
function initSim8() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-8');
    const hInput = document.getElementById('sim8-height');
    const dropBtn = document.getElementById('sim8-drop');
    
    let isDropping = false;
    let t = 0; // time parameter for drop
    let massY = 0; // current height of mass (0 = at release, drops to target)
    let barY = 0; // deflection of the collar
    let maxDynStress = 0;
    const refreshBtn = document.getElementById('sim8-refresh');
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, c);
        
        let dropH = parseFloat(hInput.value); // 0 to 5 meters
        
        let cx = w * 0.3;
        let groundY = h * 0.8;
        let collarStart = groundY - 100; // un-deflected collar height
        
        // Static Stress vs Dynamic Stress math
        // Let E=200GPa, L=1m, static mass causes 5mm def.
        let dynFactor = 1 + Math.sqrt(1 + (dropH * 100) / 5); 
        let staticStress = 10; // arbitrary units
        let targetDynStress = staticStress * dynFactor;
        
        // Physics Simulation logic
        if (!isDropping) {
            massY = collarStart - 20 - dropH * 20; // 20px per meter visual scale
            barY = 0;
        } else {
            // Free fall
            let impactY = collarStart - 20;
            if (massY < impactY) {
                t += 0.05;
                massY += 9.81 * t * t; // accelerate
                if (massY > impactY) massY = impactY;
            } else {
                // Hit collar! Spring oscillation
                let t_impact = t; // save impact velocity conceptually
                t += 0.1;
                let omega = 2; // frequency
                let amplitude = (targetDynStress - staticStress) * 2; // visual amp
                
                // Damped sine wave
                let decay = Math.max(0, 1 - (t - t_impact) * 0.02);
                let osc = Math.sin((t - t_impact) * omega) * amplitude * decay;
                
                barY = amplitude * decay * Math.sin((t - t_impact) * omega);
                if (barY < 0) barY = 0; // can't pull up
                massY = collarStart - 20 + barY;
                
                // Track max stress achieved during this drop
                let currentStress = staticStress + (barY / (amplitude||1)) * (targetDynStress - staticStress);
                maxDynStress = Math.max(maxDynStress, currentStress);
                
                if (decay === 0) {
                    isDropping = false; // settled
                }
            }
        }
        
        // --- DRAW PHYSICAL MODEL ---
        // Guide rod
        ctx.fillStyle = c.textSec;
        ctx.fillRect(cx - 5, collarStart - 200, 10, 200 + barY);
        // Base
        ctx.fillRect(cx - 40, groundY, 80, 20);
        // Collar
        ctx.fillStyle = c.accent;
        ctx.fillRect(cx - 30, collarStart + barY, 60, 10);
        
        // Dropping Mass
        ctx.fillStyle = c.text;
        ctx.fillRect(cx - 20, massY, 40, 20);
        
        // --- DRAW STRESS COMPARISON (RIGHT) ---
        let gx = w * 0.7;
        let gy = groundY;
        
        // Static Bar
        ctx.fillStyle = c.bg;
        ctx.strokeStyle = c.textSec;
        ctx.strokeRect(gx - 40, gy - 200, 30, 200);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(gx - 40, gy - staticStress * 5, 30, staticStress * 5);
        ctx.fillStyle = c.text;
        ctx.fillText('Static', gx - 45, gy + 20);
        
        // Dynamic Bar
        ctx.fillStyle = c.bg;
        ctx.strokeRect(gx + 10, gy - 200, 30, 200);
        let currDrawStress = isDropping && massY >= collarStart - 20 ? staticStress + (barY / 20) * 10 : (isDropping ? 0 : staticStress);
        if(currDrawStress > maxDynStress && isDropping) maxDynStress = currDrawStress; // update tracker
        
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(gx + 10, gy - maxDynStress * 5, 30, maxDynStress * 5);
        ctx.fillStyle = c.text;
        ctx.fillText('Dynamic', gx + 5, gy + 20);
        
        ctx.fillStyle = c.accent;
        ctx.fillText(`Impact Factor: ${dynFactor.toFixed(1)}x`, gx - 20, gy - 220);
    }
    
    function animate() {
        if (!isDropping) return;
        draw();
        requestAnimationFrame(animate);
    }
    
    dropBtn.addEventListener('click', () => {
        if (!isDropping) {
            isDropping = true;
            t = 0;
            maxDynStress = 0;
            animate();
        }
    });
    
    refreshBtn.addEventListener('click', () => {
        isDropping = false;
        t = 0;
        maxDynStress = 0;
        draw();
    });
    
    hInput.addEventListener('input', draw);
    draw();
}

// Initialize all Simulators
// =====================================================================================
// CHAPTER 9: Thin and Thick Cylinders
// =====================================================================================
function initSim9() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-9');
    const typeSelect = document.getElementById('sim9-type');
    const pInput = document.getElementById('sim9-pressure');
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, c);
        
        let type = typeSelect.value;
        let p = parseFloat(pInput.value); // 0 to 100 MPa
        
        let cx = w * 0.3;
        let cy = h / 2;
        
        let ri = 60; // inner radius
        let ro = type === 'thin' ? 65 : 120; // outer radius
        
        // --- DRAW CYLINDER SECTION ---
        ctx.beginPath();
        ctx.arc(cx, cy, ro, 0, 2*Math.PI);
        ctx.arc(cx, cy, ri, 0, 2*Math.PI, true);
        ctx.fillStyle = c.bg;
        ctx.fill();
        ctx.strokeStyle = c.textSec;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw fluid inside
        ctx.beginPath();
        ctx.arc(cx, cy, ri - 2, 0, 2*Math.PI);
        ctx.fillStyle = `rgba(59, 130, 246, ${0.2 + p/200})`;
        ctx.fill();
        
        // Internal pressure arrows
        if (p > 0) {
            ctx.fillStyle = c.compression; // Using blue for fluid pressure
            for (let angle = 0; angle < 2*Math.PI; angle += Math.PI/4) {
                let startR = 20;
                let endR = ri - 5;
                let sx = cx + startR * Math.cos(angle);
                let sy = cy + startR * Math.sin(angle);
                let ex = cx + endR * Math.cos(angle);
                let ey = cy + endR * Math.sin(angle);
                drawArrow(ctx, sx, sy, ex, ey, c.compression);
            }
        }
        
        // --- DRAW LAME'S RADIAL PLOT (RIGHT) ---
        let gx = w * 0.6;
        let gy = h * 0.8;
        
        // Axes
        ctx.strokeStyle = c.textSec;
        ctx.beginPath();
        ctx.moveTo(gx, gy); ctx.lineTo(gx + 200, gy); // Radius axis
        ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 250); // Stress axis
        ctx.stroke();
        
        ctx.fillStyle = c.textSec;
        ctx.font = '12px Inter';
        ctx.fillText('Radius (r)', gx + 180, gy + 15);
        ctx.fillText('Hoop Stress (σh)', gx + 10, gy - 230);
        
        // Plot logic
        let pts = [];
        ctx.strokeStyle = c.tension;
        ctx.lineWidth = 3;
        
        if (type === 'thin') {
            // Constant hoop stress: p * r / t
            let t_wall = ro - ri;
            let sigmaH = (p * ri) / t_wall; // simplified
            let maxExpected = (100 * ri) / t_wall; // 1200
            let visualStress = (sigmaH / maxExpected) * 200; // max height 200
            
            ctx.beginPath();
            ctx.moveTo(gx + 20, gy - visualStress); // inner
            ctx.lineTo(gx + 40, gy - visualStress); // outer
            ctx.stroke();
            
            ctx.fillStyle = c.tension;
            ctx.fillText(`Uniform σh = ${sigmaH.toFixed(1)} MPa`, gx + 50, gy - visualStress - 10);
            
            // Shade under curve
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.beginPath();
            ctx.moveTo(gx + 20, gy);
            ctx.lineTo(gx + 20, gy - visualStress);
            ctx.lineTo(gx + 40, gy - visualStress);
            ctx.lineTo(gx + 40, gy);
            ctx.fill();
            
        } else {
            // Lame's Equations
            // Boundary conditions: p_r(ri) = p, p_r(ro) = 0
            // p_r = B/r^2 - A => A = p * ri^2 / (ro^2 - ri^2), B = p * ri^2 * ro^2 / (ro^2 - ri^2)
            // sigma_h = B/r^2 + A
            let A = (p * ri*ri) / (ro*ro - ri*ri);
            let B = (p * ri*ri * ro*ro) / (ro*ro - ri*ri);
            
            ctx.beginPath();
            let startY = 0;
            let maxExpected = (100 * ri*ri * ro*ro) / (ro*ro - ri*ri) / (ri*ri) + (100 * ri*ri) / (ro*ro - ri*ri); // at r=ri, p=100
            for (let r = ri; r <= ro; r += 2) {
                let sigmaH = B/(r*r) + A;
                let px = gx + (r - ri)*2 + 20; // scale r
                let py = gy - (sigmaH / maxExpected) * 200; // visual scale
                
                if (r === ri) {
                    ctx.moveTo(px, py);
                    startY = py;
                }
                else ctx.lineTo(px, py);
                
                // Track points for shading
                pts.push({x: px, y: py});
            }
            ctx.stroke();
            
            // Shade under curve
            if (pts.length > 0) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.beginPath();
                ctx.moveTo(pts[0].x, gy);
                pts.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.lineTo(pts[pts.length-1].x, gy);
                ctx.fill();
            }
            
            // Labels
            let maxSigma = B/(ri*ri) + A;
            let minSigma = B/(ro*ro) + A;
            ctx.fillStyle = c.tension;
            ctx.fillText(`Inner σh: ${maxSigma.toFixed(1)} MPa`, gx + 30, startY - 10);
            if (pts.length > 0) {
                ctx.fillText(`Outer σh: ${minSigma.toFixed(1)} MPa`, pts[pts.length-1].x + 10, pts[pts.length-1].y);
            }
        }
    }
    
    function drawArrow(ctx, fromx, fromy, tox, toy, color) {
        let headlen = 8;
        let dx = tox - fromx;
        let dy = toy - fromy;
        let angle = Math.atan2(dy, dx);
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.fill();
    }
    
    typeSelect.addEventListener('change', draw);
    pInput.addEventListener('input', draw);
    draw();
}

// =====================================================================================
// CHAPTER 10: Columns and Struts
// =====================================================================================
function initSim10() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-10');
    const endSelect = document.getElementById('sim10-ends');
    const loadInput = document.getElementById('sim10-load');
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, c);
        
        let type = endSelect.value;
        let P = parseFloat(loadInput.value); // Applied load (0 to 100)
        
        let cx = w / 2;
        let cy = h * 0.9; // bottom
        let length = h * 0.7; // column length
        
        // Critical Load calculation (Euler)
        // Pcr = pi^2 * E * I / Le^2. Let's normalize base Pcr (pinned-pinned) = 25.
        let LeFactor = 1;
        if (type === 'fixed-fixed') LeFactor = 0.5;
        if (type === 'fixed-free') LeFactor = 2;
        
        let Pcr = 25 / Math.pow(LeFactor, 2); 
        
        let isBuckled = P > Pcr;
        
        // Draw Supports
        ctx.fillStyle = c.textSec;
        if (type === 'fixed-fixed' || type === 'fixed-free') {
            ctx.fillRect(cx - 30, cy, 60, 20); // bottom fixed
        } else {
            // Pinned bottom
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx-15, cy+20); ctx.lineTo(cx+15, cy+20); ctx.fill();
        }
        
        if (type === 'fixed-fixed') {
            ctx.fillRect(cx - 30, cy - length - 20, 60, 20); // top fixed
        }
        
        // Buckling Curve Calculation
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        
        let maxDeflection = isBuckled ? (P - Pcr) * 1.5 : 0; // Visual deflection
        if (maxDeflection > 100) maxDeflection = 100;
        
        for (let y = cy; y >= cy - length; y -= 5) {
            let L_current = cy - y; // distance from bottom
            let defX = 0;
            
            if (isBuckled) {
                if (type === 'pinned-pinned') {
                    // Half sine wave
                    defX = maxDeflection * Math.sin((L_current / length) * Math.PI);
                } else if (type === 'fixed-fixed') {
                    // Full sine wave (1 - cos)
                    defX = maxDeflection * 0.5 * (1 - Math.cos((L_current / length) * 2 * Math.PI));
                } else if (type === 'fixed-free') {
                    // Quarter sine wave
                    defX = maxDeflection * (1 - Math.cos((L_current / length) * Math.PI / 2));
                }
            }
            
            ctx.lineTo(cx + defX, y);
        }
        
        ctx.strokeStyle = isBuckled ? c.tension : c.accent;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Top load arrow
        let topY = cy - length;
        let topX = cx;
        if (isBuckled && type === 'fixed-free') {
            topX += maxDeflection * (1 - Math.cos(Math.PI / 2)); // end of cantilever
        }
        
        if (P > 0) {
            drawArrowDown(ctx, topX, topY - 50 - P*0.5, topX, topY - 5, c.compression);
            ctx.fillStyle = c.compression;
            ctx.font = '14px Inter';
            ctx.fillText(`P = ${P} kN`, topX + 15, topY - 30);
        }
        
        // Status Text
        ctx.fillStyle = c.text;
        ctx.font = '16px Inter';
        ctx.fillText(`Critical Load (Pcr): ${Pcr.toFixed(1)} kN`, w*0.1, h*0.2);
        if (isBuckled) {
            ctx.fillStyle = c.tension;
            ctx.fillText(`⚠️ BUCKLED (Geometric Instability)`, w*0.1, h*0.2 + 30);
        } else {
            ctx.fillStyle = '#10b981';
            ctx.fillText(`Safe (Stable)`, w*0.1, h*0.2 + 30);
        }
    }
    
    function drawArrowDown(ctx, fromx, fromy, tox, toy, color) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(fromx, fromy); ctx.lineTo(tox, toy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tox, toy); ctx.lineTo(tox - 8, toy - 12); ctx.lineTo(tox + 8, toy - 12); ctx.fill();
    }
    
    endSelect.addEventListener('change', draw);
    loadInput.addEventListener('input', draw);
    draw();
}

// =====================================================================================
// CHAPTER 11: Theories of Failure
// =====================================================================================
function initSim11() {
    const { canvas, ctx, container } = setupCanvas('canvas-container-11');
    const s1Input = document.getElementById('sim11-sig1');
    const s2Input = document.getElementById('sim11-sig2');
    const s3Input = document.getElementById('sim11-sig3');
    
    function draw() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const c = getColors();
        
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, c);
        
        let s1 = parseFloat(s1Input.value);
        let s2 = parseFloat(s2Input.value);
        let s3 = parseFloat(s3Input.value); // Usually 0 for plane stress visual, but used in calculation
        
        let cx = w / 2;
        let cy = h / 2;
        let scale = 0.5; // pixels per MPa
        let Sy = 250; // Yield strength
        
        // --- DRAW 2D FAILURE ENVELOPES (sigma1 vs sigma2) ---
        // Axes
        ctx.strokeStyle = c.grid;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.stroke();
        
        ctx.fillStyle = c.textSec;
        ctx.font = '12px Inter';
        ctx.fillText('σ1 (MPa)', w - 60, cy - 10);
        ctx.fillText('σ2 (MPa)', cx + 10, 20);
        
        let syPx = Sy * scale;
        
        // 1. Rankine (Max Principal Stress) - Square
        ctx.beginPath();
        ctx.rect(cx - syPx, cy - syPx, syPx*2, syPx*2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 2. Tresca (Max Shear Stress) - Hexagon
        ctx.beginPath();
        ctx.moveTo(cx + syPx, cy);
        ctx.lineTo(cx + syPx, cy - syPx);
        ctx.lineTo(cx, cy - syPx);
        ctx.lineTo(cx - syPx, cy);
        ctx.lineTo(cx - syPx, cy + syPx);
        ctx.lineTo(cx, cy + syPx);
        ctx.closePath();
        ctx.strokeStyle = '#f59e0b'; // Amber
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 3. Von Mises (Distortion Energy) - Ellipse
        // Eq: s1^2 - s1*s2 + s2^2 = Sy^2
        // Parametric ellipse tilted 45 deg
        ctx.beginPath();
        for (let angle = 0; angle <= 2*Math.PI; angle += 0.05) {
            // Major axis a = sqrt(2)*Sy, Minor axis b = sqrt(2/3)*Sy
            let a = Math.sqrt(2) * syPx;
            let b = Math.sqrt(2/3) * syPx;
            let u = a * Math.cos(angle);
            let v = b * Math.sin(angle);
            
            // Rotate by 45 degrees
            let x = (u + v) / Math.sqrt(2);
            let y = (u - v) / Math.sqrt(2); // Canvas Y is inverted, so +v for up in world coords is -v in canvas
            
            if (angle === 0) ctx.moveTo(cx + x, cy - y);
            else ctx.lineTo(cx + x, cy - y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#10b981'; // Green
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // --- PLOT CURRENT STRESS POINT ---
        let px = cx + s1 * scale;
        let py = cy - s2 * scale; // Invert Y
        
        // Calculate Equivalent Stresses (3D)
        let maxS = Math.max(s1, s2, s3);
        let minS = Math.min(s1, s2, s3);
        let trescaEq = Math.abs(maxS - minS);
        
        let vonMisesEq = (1/Math.SQRT2) * Math.sqrt(Math.pow(s1-s2, 2) + Math.pow(s2-s3, 2) + Math.pow(s3-s1, 2));
        
        let failedTresca = trescaEq >= Sy;
        let failedVM = vonMisesEq >= Sy;
        
        // Draw point line from origin
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = c.textSec;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw point
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2*Math.PI);
        ctx.fillStyle = failedVM ? c.tension : (failedTresca ? '#f59e0b' : '#3b82f6');
        ctx.fill();
        
        // Legend & Data
        let isMobile = w < 768;
        let legX = isMobile ? 10 : 10;
        let legY = isMobile ? h - 120 : 10;
        
        ctx.fillStyle = c.bg;
        ctx.fillRect(legX, legY, 280, 110);
        ctx.strokeStyle = c.grid;
        ctx.strokeRect(legX, legY, 280, 110);
        
        ctx.fillStyle = c.text;
        ctx.fillText(`Material Yield (Sy): ${Sy} MPa`, legX + 10, legY + 20);
        
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`Tresca Eq Stress: ${trescaEq.toFixed(1)} MPa`, legX + 10, legY + 40);
        if (failedTresca) { ctx.fillStyle = c.tension; ctx.fillText('FAIL', legX + 220, legY + 40); }
        else { ctx.fillStyle = '#10b981'; ctx.fillText('SAFE', legX + 220, legY + 40); }
        
        ctx.fillStyle = '#10b981';
        ctx.fillText(`Von Mises Eq Stress: ${vonMisesEq.toFixed(1)} MPa`, legX + 10, legY + 60);
        if (failedVM) { ctx.fillStyle = c.tension; ctx.fillText('FAIL', legX + 220, legY + 60); }
        else { ctx.fillStyle = '#10b981'; ctx.fillText('SAFE', legX + 220, legY + 60); }
        
        if (s3 !== 0) {
            ctx.fillStyle = c.textSec;
            ctx.fillText(`(σ3 = ${s3} moves failure plane in 3D)`, legX + 10, legY + 90);
        }
    }
    
    [s1Input, s2Input, s3Input].forEach(el => el.addEventListener('input', draw));
    draw();
}

// Initialize all Simulators
document.addEventListener('DOMContentLoaded', () => {
    try {
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
    } catch (e) {
        console.error("Error initializing simulators:", e);
    }
});
