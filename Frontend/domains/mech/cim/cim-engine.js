// CIM MODULE ENGINE
// Handles all 10 interactive Canvas simulators for Computer Integrated Mfg.

// Utility to get current theme colors
function getColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        bg: isDark ? '#0a0a0a' : '#f8fafc',
        metal: isDark ? '#334155' : '#cbd5e1',
        accent: isDark ? '#3b82f6' : '#2563eb', // Cyber Blue
        neon: isDark ? '#22c55e' : '#16a34a', // Terminal Green
        text: isDark ? '#f8fafc' : '#0f172a',
        textSec: isDark ? '#94a3b8' : '#475569',
        grid: isDark ? '#1e293b' : '#e2e8f0',
        alert: '#ef4444' // Red
    };
}

// Global resize handler and setup
function setupCanvas(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // Initial size
    let rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Resize observer
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            canvas.width = entry.contentRect.width;
            canvas.height = entry.contentRect.height;
        }
    });
    resizeObserver.observe(container);
    
    return { canvas, ctx, get width() { return canvas.width; }, get height() { return canvas.height; } };
}

// ============================================================================
// SIMULATOR 1: CAD GEOMETRIC MODELING (BEZIER)
// ============================================================================
function initSim1() {
    const sim = setupCanvas('canvas-container-1');
    if(!sim) return;
    
    const ui = {
        p2x: document.getElementById('sim1-p2x'),
        p2y: document.getElementById('sim1-p2y'),
        btnAnim: document.getElementById('sim1-anim'),
        ptOut: document.getElementById('sim1-pt')
    };
    
    let P0 = {x: 50, y: 300};
    let P1 = {x: 150, y: 50};
    // P2 from UI
    let P3 = {x: 450, y: 300};
    
    let tAnim = 1.0;
    let isAnimating = false;
    
    ui.btnAnim.addEventListener('click', () => {
        tAnim = 0;
        isAnimating = true;
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        let P2 = {
            x: parseFloat(ui.p2x.value) * (sim.width / 500), // simple scaling
            y: parseFloat(ui.p2y.value) * (sim.height / 400)
        };
        // Normalize P0, P1, P3 to canvas size
        P0.x = sim.width * 0.1; P0.y = sim.height * 0.8;
        P1.x = sim.width * 0.3; P1.y = sim.height * 0.2;
        P3.x = sim.width * 0.9; P3.y = sim.height * 0.8;
        
        if (isAnimating) {
            tAnim += 0.005;
            if (tAnim >= 1.0) { tAnim = 1.0; isAnimating = false; }
        } else {
            tAnim = 1.0; // Draw full curve
        }
        
        // Draw control polygon
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.setLineDash([5, 5]);
        sim.ctx.beginPath();
        sim.ctx.moveTo(P0.x, P0.y);
        sim.ctx.lineTo(P1.x, P1.y);
        sim.ctx.lineTo(P2.x, P2.y);
        sim.ctx.lineTo(P3.x, P3.y);
        sim.ctx.stroke();
        sim.ctx.setLineDash([]);
        
        // Draw Points
        sim.ctx.fillStyle = c.accent;
        [P0, P1, P2, P3].forEach((p, i) => {
            sim.ctx.beginPath();
            sim.ctx.arc(p.x, p.y, 6, 0, Math.PI*2);
            sim.ctx.fill();
            sim.ctx.fillStyle = c.text;
            sim.ctx.fillText(`P${i}`, p.x + 10, p.y - 10);
            sim.ctx.fillStyle = c.accent;
        });
        
        // Draw Bezier Curve up to tAnim
        sim.ctx.strokeStyle = c.neon;
        sim.ctx.lineWidth = 3;
        sim.ctx.beginPath();
        
        let currentPt = {x:0, y:0};
        
        for (let t = 0; t <= tAnim; t += 0.01) {
            const u = 1 - t;
            const x = u*u*u*P0.x + 3*u*u*t*P1.x + 3*u*t*t*P2.x + t*t*t*P3.x;
            const y = u*u*u*P0.y + 3*u*u*t*P1.y + 3*u*t*t*P2.y + t*t*t*P3.y;
            if (t === 0) sim.ctx.moveTo(x, y);
            else sim.ctx.lineTo(x, y);
            
            if(Math.abs(t - tAnim) < 0.01) {
                currentPt = {x, y};
            }
        }
        sim.ctx.stroke();
        
        ui.ptOut.innerText = `(${currentPt.x.toFixed(1)}, ${currentPt.y.toFixed(1)})`;
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 2: CNC INTERPOLATION (DDA ALGORITHM)
// ============================================================================
function initSim2() {
    const sim = setupCanvas('canvas-container-2');
    if(!sim) return;
    
    const ui = {
        tx: document.getElementById('sim2-x'),
        ty: document.getElementById('sim2-y'),
        btnStep: document.getElementById('sim2-step'),
        cntOut: document.getElementById('sim2-count')
    };
    
    let path = [];
    let currentX = 10;
    let currentY = 10;
    let stepCount = 0;
    
    // Scale factor for grid (100x100 logical units to canvas)
    
    ui.btnStep.addEventListener('click', () => {
        const tx = parseInt(ui.tx.value);
        const ty = parseInt(ui.ty.value);
        
        // DDA Step
        const dx = tx - currentX;
        const dy = ty - currentY;
        
        if (dx === 0 && dy === 0) {
            path = [];
            currentX = 10; currentY = 10; stepCount = 0;
            return;
        }
        
        const delta = Math.max(Math.abs(dx), Math.abs(dy));
        const xInc = dx / delta;
        const yInc = dy / delta;
        
        currentX += xInc;
        currentY += yInc;
        
        path.push({x: Math.round(currentX), y: Math.round(currentY)});
        stepCount++;
        
        ui.cntOut.innerText = stepCount;
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const scaleX = sim.width / 100;
        const scaleY = sim.height / 100;
        
        // Draw Grid
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 1;
        for(let i=0; i<=100; i+=10) {
            sim.ctx.beginPath(); sim.ctx.moveTo(i*scaleX, 0); sim.ctx.lineTo(i*scaleX, sim.height); sim.ctx.stroke();
            sim.ctx.beginPath(); sim.ctx.moveTo(0, i*scaleY); sim.ctx.lineTo(sim.width, i*scaleY); sim.ctx.stroke();
        }
        
        const tx = parseInt(ui.tx.value);
        const ty = parseInt(ui.ty.value);
        
        // Draw Ideal Line
        sim.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        sim.ctx.beginPath();
        sim.ctx.moveTo(10*scaleX, (100-10)*scaleY); // flip Y
        sim.ctx.lineTo(tx*scaleX, (100-ty)*scaleY);
        sim.ctx.stroke();
        
        // Draw DDA Steps (Rasterized path)
        sim.ctx.fillStyle = c.accent;
        sim.ctx.fillRect(10*scaleX - 4, (100-10)*scaleY - 4, 8, 8); // Start
        
        for (let p of path) {
            sim.ctx.fillRect(p.x*scaleX - 4, (100-p.y)*scaleY - 4, 8, 8);
        }
        
        // Draw Target
        sim.ctx.fillStyle = c.neon;
        sim.ctx.beginPath();
        sim.ctx.arc(tx*scaleX, (100-ty)*scaleY, 6, 0, Math.PI*2);
        sim.ctx.fill();
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 3: ROBOTIC KINEMATICS (IK)
// ============================================================================
function initSim3() {
    const sim = setupCanvas('canvas-container-3');
    if(!sim) return;
    
    const ui = {
        x: document.getElementById('sim3-x'),
        y: document.getElementById('sim3-y'),
        t1Out: document.getElementById('sim3-t1'),
        t2Out: document.getElementById('sim3-t2'),
        errOut: document.getElementById('sim3-err')
    };
    
    const L1 = 120;
    const L2 = 100;
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cx = sim.width / 2;
        const cy = sim.height * 0.9;
        
        const tx = parseInt(ui.x.value);
        const ty = parseInt(ui.y.value);
        
        // IK Calculation
        const distSq = tx*tx + ty*ty;
        let valid = true;
        let t1 = 0, t2 = 0;
        
        const cosT2 = (distSq - L1*L1 - L2*L2) / (2 * L1 * L2);
        
        if (cosT2 < -1 || cosT2 > 1) {
            valid = false;
            ui.errOut.innerText = "Target out of reach!";
        } else {
            ui.errOut.innerText = "";
            t2 = Math.acos(cosT2); // Elbow up
            
            const k1 = L1 + L2 * Math.cos(t2);
            const k2 = L2 * Math.sin(t2);
            t1 = Math.atan2(ty, tx) - Math.atan2(k2, k1);
            
            ui.t1Out.innerText = (t1 * 180 / Math.PI).toFixed(1);
            ui.t2Out.innerText = (t2 * 180 / Math.PI).toFixed(1);
        }
        
        // Draw Workspace envelope
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.beginPath();
        sim.ctx.arc(cx, cy, L1+L2, Math.PI, 0);
        sim.ctx.stroke();
        sim.ctx.beginPath();
        sim.ctx.arc(cx, cy, Math.abs(L1-L2), Math.PI, 0);
        sim.ctx.stroke();
        
        // Draw Target
        sim.ctx.fillStyle = c.neon;
        sim.ctx.beginPath(); sim.ctx.arc(cx + tx, cy - ty, 6, 0, Math.PI*2); sim.ctx.fill();
        
        // Draw Arm
        if (valid) {
            const j1x = cx + L1 * Math.cos(t1);
            const j1y = cy - L1 * Math.sin(t1);
            const j2x = j1x + L2 * Math.cos(t1 + t2);
            const j2y = j1y - L2 * Math.sin(t1 + t2);
            
            sim.ctx.strokeStyle = c.accent;
            sim.ctx.lineWidth = 12;
            sim.ctx.lineCap = 'round';
            sim.ctx.beginPath();
            sim.ctx.moveTo(cx, cy);
            sim.ctx.lineTo(j1x, j1y);
            sim.ctx.lineTo(j2x, j2y);
            sim.ctx.stroke();
            
            // Joints
            sim.ctx.fillStyle = c.metal;
            sim.ctx.beginPath(); sim.ctx.arc(cx, cy, 10, 0, Math.PI*2); sim.ctx.fill();
            sim.ctx.beginPath(); sim.ctx.arc(j1x, j1y, 8, 0, Math.PI*2); sim.ctx.fill();
            sim.ctx.beginPath(); sim.ctx.arc(j2x, j2y, 6, 0, Math.PI*2); sim.ctx.fill();
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 4: AGV PATH PLANNING (A*)
// ============================================================================
function initSim4() {
    const sim = setupCanvas('canvas-container-4');
    if(!sim) return;
    
    const ui = {
        btnObs: document.getElementById('sim4-obs'),
        btnRun: document.getElementById('sim4-run'),
        statusOut: document.getElementById('sim4-status')
    };
    
    const cols = 20;
    const rows = 15;
    let grid = [];
    let path = [];
    let agvPos = null;
    
    // Init Grid
    function initGrid() {
        grid = [];
        for(let x=0; x<cols; x++) {
            grid[x] = [];
            for(let y=0; y<rows; y++) {
                grid[x][y] = (Math.random() < 0.25) ? 1 : 0; // 1 = obstacle
            }
        }
        grid[0][0] = 0; // Start
        grid[cols-1][rows-1] = 0; // Goal
        path = [];
        agvPos = null;
        ui.statusOut.innerText = "Idle";
        ui.statusOut.style.color = getColors().textSec;
    }
    initGrid();
    
    ui.btnObs.addEventListener('click', initGrid);
    
    ui.btnRun.addEventListener('click', () => {
        // Very simplified Manhattan crawler (Visual proxy for A*)
        // Real A* in JS is long, we'll implement a fast greedy BFS here for visual
        path = [];
        let visited = Array(cols).fill(0).map(()=>Array(rows).fill(false));
        let queue = [{x: 0, y: 0, p: []}];
        visited[0][0] = true;
        
        let found = false;
        while(queue.length > 0) {
            queue.sort((a,b) => {
                let da = Math.abs(cols-1 - a.x) + Math.abs(rows-1 - a.y);
                let db = Math.abs(cols-1 - b.x) + Math.abs(rows-1 - b.y);
                return da - db;
            });
            
            let cur = queue.shift();
            if(cur.x === cols-1 && cur.y === rows-1) {
                path = cur.p;
                path.push({x: cur.x, y: cur.y});
                found = true;
                break;
            }
            
            const dirs = [[1,0], [0,1], [-1,0], [0,-1]];
            for(let d of dirs) {
                let nx = cur.x + d[0];
                let ny = cur.y + d[1];
                if(nx>=0 && nx<cols && ny>=0 && ny<rows && grid[nx][ny] === 0 && !visited[nx][ny]) {
                    visited[nx][ny] = true;
                    queue.push({x: nx, y: ny, p: [...cur.p, {x: cur.x, y: cur.y}]});
                }
            }
        }
        
        if(found) {
            ui.statusOut.innerText = "Path Found!";
            ui.statusOut.style.color = getColors().neon;
            // Animate AGV
            agvPos = 0;
        } else {
            ui.statusOut.innerText = "NO PATH (Blocked)";
            ui.statusOut.style.color = getColors().alert;
        }
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cellW = sim.width / cols;
        const cellH = sim.height / rows;
        
        // Draw Grid
        for(let x=0; x<cols; x++) {
            for(let y=0; y<rows; y++) {
                if(grid[x][y] === 1) {
                    sim.ctx.fillStyle = c.metal;
                    sim.ctx.fillRect(x*cellW, y*cellH, cellW-1, cellH-1);
                }
            }
        }
        
        // Draw Start/Goal
        sim.ctx.fillStyle = c.accent;
        sim.ctx.fillRect(0, 0, cellW-1, cellH-1);
        sim.ctx.fillStyle = c.neon;
        sim.ctx.fillRect((cols-1)*cellW, (rows-1)*cellH, cellW-1, cellH-1);
        
        // Draw Path
        if (path.length > 0) {
            sim.ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
            sim.ctx.lineWidth = 4;
            sim.ctx.beginPath();
            for(let i=0; i<path.length; i++) {
                const px = path[i].x * cellW + cellW/2;
                const py = path[i].y * cellH + cellH/2;
                if(i===0) sim.ctx.moveTo(px, py);
                else sim.ctx.lineTo(px, py);
            }
            sim.ctx.stroke();
        }
        
        // Draw AGV moving
        if (agvPos !== null && path.length > 0) {
            agvPos += 0.05;
            const idx = Math.floor(agvPos);
            if (idx < path.length) {
                const p = path[idx];
                sim.ctx.fillStyle = '#f59e0b'; // Amber AGV
                sim.ctx.beginPath();
                sim.ctx.arc(p.x*cellW + cellW/2, p.y*cellH + cellH/2, Math.min(cellW, cellH)*0.3, 0, Math.PI*2);
                sim.ctx.fill();
            } else {
                agvPos = path.length - 1;
            }
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 5: AUTOMATED STORAGE (AS/RS)
// ============================================================================
function initSim5() {
    const sim = setupCanvas('canvas-container-5');
    if(!sim) return;
    
    const ui = {
        r: document.getElementById('sim5-r'),
        c: document.getElementById('sim5-c'),
        btn: document.getElementById('sim5-go'),
        timeOut: document.getElementById('sim5-time')
    };
    
    let isMoving = false;
    let sr = {x: 0, y: 0}; // S/R machine pos (pixels)
    let target = {x: 0, y: 0};
    let timer = 0;
    
    ui.btn.addEventListener('click', () => {
        const rows = 5;
        const cols = 10;
        const cellW = sim.width / cols;
        const cellH = sim.height / rows;
        
        const tr = parseInt(ui.r.value);
        const tc = parseInt(ui.c.value);
        
        // S/R machine starts at bottom left usually (0, max_row)
        // Here we just move from current
        
        target.x = tc * cellW + cellW/2;
        target.y = tr * cellH + cellH/2;
        
        isMoving = true;
        timer = 0;
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const rows = 5;
        const cols = 10;
        const cellW = sim.width / cols;
        const cellH = sim.height / rows;
        
        // Draw Racks
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 2;
        for(let r=0; r<rows; r++) {
            for(let col=0; col<cols; col++) {
                sim.ctx.strokeRect(col*cellW, r*cellH, cellW, cellH);
                // Draw some bins
                if((r+col)%3 === 0) {
                    sim.ctx.fillStyle = c.metal;
                    sim.ctx.fillRect(col*cellW + 5, r*cellH + 5, cellW - 10, cellH - 10);
                }
            }
        }
        
        // Target Highlight
        if(isMoving || timer > 0) {
            sim.ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            sim.ctx.fillRect(target.x - cellW/2, target.y - cellH/2, cellW, cellH);
        }
        
        // Move S/R Machine (Chebyshev kinematics: constant velocity on both axes)
        if (isMoving) {
            const vx = 2.0;
            const vy = 1.5; // Z/Y axis usually slower
            
            const dx = target.x - sr.x;
            const dy = target.y - sr.y;
            
            let arrivedX = false;
            let arrivedY = false;
            
            if(Math.abs(dx) > vx) sr.x += Math.sign(dx) * vx; else arrivedX = true;
            if(Math.abs(dy) > vy) sr.y += Math.sign(dy) * vy; else arrivedY = true;
            
            timer += 0.016; // rough 60fps frame time
            
            if(arrivedX && arrivedY) {
                isMoving = false;
            }
        }
        
        ui.timeOut.innerText = timer.toFixed(1);
        
        // Draw S/R Mast and Shuttle
        sim.ctx.fillStyle = c.neon;
        // Mast
        sim.ctx.fillRect(sr.x - 5, 0, 10, sim.height);
        // Shuttle
        sim.ctx.fillRect(sr.x - 15, sr.y - 10, 30, 20);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 6: CELLULAR MFG (RANK ORDER CLUSTERING)
// ============================================================================
function initSim6() {
    const sim = setupCanvas('canvas-container-6');
    if(!sim) return;
    
    const ui = {
        btnScram: document.getElementById('sim6-scramble'),
        btnSort: document.getElementById('sim6-sort'),
        cellsOut: document.getElementById('sim6-cells')
    };
    
    const rows = 8; // Machines
    const cols = 8; // Parts
    let matrix = [];
    
    function scramble() {
        matrix = [];
        for(let r=0; r<rows; r++) {
            let row = [];
            for(let c=0; c<cols; c++) {
                // Create artificial clusters then scramble
                if( (r<4 && c<4) || (r>=4 && c>=4) ) {
                    row.push(Math.random() < 0.8 ? 1 : 0);
                } else {
                    row.push(Math.random() < 0.1 ? 1 : 0);
                }
            }
            matrix.push(row);
        }
        
        // Shuffle rows
        matrix.sort(()=>Math.random()-0.5);
        // Shuffle cols (transpose, shuffle, transpose)
        let t = Array(cols).fill(0).map((_,c)=>matrix.map(r=>r[c]));
        t.sort(()=>Math.random()-0.5);
        matrix = Array(rows).fill(0).map((_,r)=>t.map(c=>c[r]));
        
        ui.cellsOut.innerText = "Unsorted";
    }
    
    function sortROC() {
        // Simple 2-pass sort for visual
        // Sort rows by binary weight
        matrix.sort((a,b) => parseInt(b.join(''), 2) - parseInt(a.join(''), 2));
        // Sort cols
        let t = Array(cols).fill(0).map((_,c)=>matrix.map(r=>r[c]));
        t.sort((a,b) => parseInt(b.join(''), 2) - parseInt(a.join(''), 2));
        matrix = Array(rows).fill(0).map((_,r)=>t.map(c=>c[r]));
        
        ui.cellsOut.innerText = "2 (Identified)";
    }
    
    scramble();
    
    ui.btnScram.addEventListener('click', scramble);
    ui.btnSort.addEventListener('click', sortROC);
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cellW = sim.width / cols;
        const cellH = sim.height / rows;
        
        for(let r=0; r<rows; r++) {
            for(let col=0; col<cols; col++) {
                if(matrix[r][col] === 1) {
                    sim.ctx.fillStyle = c.accent;
                    sim.ctx.fillRect(col*cellW + 2, r*cellH + 2, cellW - 4, cellH - 4);
                }
                sim.ctx.strokeStyle = c.grid;
                sim.ctx.strokeRect(col*cellW, r*cellH, cellW, cellH);
            }
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 7: CMM LEAST SQUARES CIRCLE
// ============================================================================
function initSim7() {
    const sim = setupCanvas('canvas-container-7');
    if(!sim) return;
    
    const ui = {
        btnFit: document.getElementById('sim7-fit'),
        btnClear: document.getElementById('sim7-clear'),
        cOut: document.getElementById('sim7-c'),
        errOut: document.getElementById('sim7-err')
    };
    
    let pts = [];
    let fit = null;
    
    // Ideal geometry underneath
    const ideal = { x: sim.width/2, y: sim.height/2, r: 100 };
    
    sim.canvas.addEventListener('mousedown', (e) => {
        const rect = sim.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        pts.push({x, y});
        fit = null; // reset fit
    });
    
    ui.btnClear.addEventListener('click', () => {
        pts = [];
        fit = null;
        ui.cOut.innerText = "---";
        ui.errOut.innerText = "---";
    });
    
    ui.btnFit.addEventListener('click', () => {
        if(pts.length < 3) return;
        
        // Simple bounding box center for visual proxy of LS
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        for(let p of pts) {
            if(p.x < minX) minX = p.x;
            if(p.x > maxX) maxX = p.x;
            if(p.y < minY) minY = p.y;
            if(p.y > maxY) maxY = p.y;
        }
        
        const cx = (minX + maxX)/2;
        const cy = (minY + maxY)/2;
        
        // average radius
        let sumR = 0;
        for(let p of pts) {
            sumR += Math.sqrt((p.x-cx)**2 + (p.y-cy)**2);
        }
        const r = sumR / pts.length;
        
        // form error (max - min)
        let maxE = 0;
        for(let p of pts) {
            let pr = Math.sqrt((p.x-cx)**2 + (p.y-cy)**2);
            let e = Math.abs(pr - r);
            if(e > maxE) maxE = e;
        }
        
        fit = {cx, cy, r, e: maxE};
        ui.cOut.innerText = `(${cx.toFixed(0)}, ${cy.toFixed(0)})`;
        ui.errOut.innerText = maxE.toFixed(2) + " px";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        // Draw physical part
        sim.ctx.fillStyle = c.metal;
        sim.ctx.beginPath();
        sim.ctx.arc(ideal.x, ideal.y, ideal.r, 0, Math.PI*2);
        sim.ctx.fill();
        
        // Draw Points
        sim.ctx.fillStyle = c.alert;
        for(let p of pts) {
            sim.ctx.beginPath(); sim.ctx.arc(p.x, p.y, 4, 0, Math.PI*2); sim.ctx.fill();
        }
        
        // Draw Fit
        if(fit) {
            sim.ctx.strokeStyle = c.neon;
            sim.ctx.lineWidth = 2;
            sim.ctx.beginPath(); sim.ctx.arc(fit.cx, fit.cy, fit.r, 0, Math.PI*2); sim.ctx.stroke();
            
            sim.ctx.beginPath();
            sim.ctx.moveTo(fit.cx - 5, fit.cy); sim.ctx.lineTo(fit.cx + 5, fit.cy);
            sim.ctx.moveTo(fit.cx, fit.cy - 5); sim.ctx.lineTo(fit.cx, fit.cy + 5);
            sim.ctx.stroke();
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 8: FLEXIBLE MFG SYSTEM (FMS QUEUING)
// ============================================================================
function initSim8() {
    const sim = setupCanvas('canvas-container-8');
    if(!sim) return;
    
    const ui = {
        arr: document.getElementById('sim8-arr'),
        btnRun: document.getElementById('sim8-run'),
        bufOut: document.getElementById('sim8-buf'),
        utilOut: document.getElementById('sim8-util')
    };
    
    let isRunning = false;
    let buffer = 0;
    
    // 3 CNC machines
    let m = [
        {timer: 0, cap: 2},
        {timer: 0, cap: 2},
        {timer: 0, cap: 2}
    ];
    
    ui.btnRun.addEventListener('click', () => {
        isRunning = !isRunning;
        ui.btnRun.innerText = isRunning ? "Stop Shift" : "Start Shift";
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const w = sim.width;
        const cy = sim.height / 2;
        
        const lambda = parseFloat(ui.arr.value); // arrivals per sec
        const mu_total = 6; // sum of machine caps
        
        if (isRunning) {
            // Arrival
            if(Math.random() < lambda / 60) {
                buffer++;
            }
            
            // Processing
            let busyCount = 0;
            for(let i=0; i<3; i++) {
                if(m[i].timer > 0) {
                    m[i].timer -= (1/60);
                    busyCount++;
                } else if(buffer > 0) {
                    buffer--;
                    m[i].timer = 1 / m[i].cap; // Processing time
                    busyCount++;
                }
            }
            
            ui.utilOut.innerText = ((busyCount / 3) * 100).toFixed(0);
        }
        
        ui.bufOut.innerText = buffer;
        if(buffer > 20) ui.bufOut.style.color = c.alert;
        else ui.bufOut.style.color = c.textSec;
        
        // Draw Central Buffer ASRS
        sim.ctx.fillStyle = c.metal;
        sim.ctx.fillRect(w*0.1, cy - 80, 60, 160);
        sim.ctx.fillStyle = c.text;
        sim.ctx.fillText("BUFFER", w*0.1 + 10, cy - 90);
        
        // Draw items in buffer
        sim.ctx.fillStyle = c.accent;
        for(let i=0; i<Math.min(buffer, 30); i++) {
            const bx = w*0.1 + 10 + (i%3)*15;
            const by = cy + 60 - Math.floor(i/3)*15;
            sim.ctx.fillRect(bx, by, 10, 10);
        }
        if(buffer > 30) sim.ctx.fillText("...", w*0.1 + 20, cy - 70);
        
        // Draw Machines
        for(let i=0; i<3; i++) {
            const mx = w*0.6;
            const my = cy - 100 + i*80;
            
            // Conveyor line
            sim.ctx.strokeStyle = c.grid;
            sim.ctx.beginPath(); sim.ctx.moveTo(w*0.1 + 60, cy); sim.ctx.lineTo(mx, my + 20); sim.ctx.stroke();
            
            sim.ctx.fillStyle = m[i].timer > 0 ? c.neon : c.metal;
            sim.ctx.fillRect(mx, my, 60, 40);
            sim.ctx.fillStyle = c.text;
            sim.ctx.fillText(`CNC ${i+1}`, mx + 10, my - 10);
        }
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 9: PID CONTROL
// ============================================================================
function initSim9() {
    const sim = setupCanvas('canvas-container-9');
    if(!sim) return;
    
    const ui = {
        kp: document.getElementById('sim9-kp'),
        kd: document.getElementById('sim9-kd'),
        kpV: document.getElementById('sim9-kp-v'),
        kdV: document.getElementById('sim9-kd-v'),
        btnStep: document.getElementById('sim9-step'),
        errOut: document.getElementById('sim9-err')
    };
    
    let pos = 50; // pixels
    let vel = 0;
    let target = 50;
    
    ui.kp.addEventListener('input', e => ui.kpV.innerText = e.target.value);
    ui.kd.addEventListener('input', e => ui.kdV.innerText = e.target.value);
    
    ui.btnStep.addEventListener('click', () => {
        target = (target === 50) ? sim.width - 100 : 50;
    });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        const cy = sim.height / 2;
        
        const Kp = parseFloat(ui.kp.value) * 0.01; // scale for physics
        const Kd = parseFloat(ui.kd.value) * 0.05;
        
        // PID Loop
        const error = target - pos;
        const pTerm = Kp * error;
        const dTerm = -Kd * vel; // assuming target vel is 0
        
        const acceleration = pTerm + dTerm;
        vel += acceleration;
        pos += vel;
        
        ui.errOut.innerText = error.toFixed(1);
        
        // Draw Track
        sim.ctx.strokeStyle = c.grid;
        sim.ctx.lineWidth = 10;
        sim.ctx.beginPath(); sim.ctx.moveTo(50, cy); sim.ctx.lineTo(sim.width - 50, cy); sim.ctx.stroke();
        
        // Draw Target Marker
        sim.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        sim.ctx.fillRect(target - 20, cy - 30, 40, 60);
        
        // Draw Servo Carriage
        sim.ctx.fillStyle = c.accent;
        sim.ctx.fillRect(pos - 30, cy - 20, 60, 40);
        
        requestAnimationFrame(draw);
    }
    draw();
}

// ============================================================================
// SIMULATOR 10: IOT DASHBOARD
// ============================================================================
function initSim10() {
    const sim = setupCanvas('canvas-container-10');
    if(!sim) return;
    
    const ui = {
        btnFault: document.getElementById('sim10-fault'),
        btnRep: document.getElementById('sim10-repair'),
        oeeOut: document.getElementById('sim10-oee'),
        statusOut: document.getElementById('sim10-status')
    };
    
    let isFault = false;
    let temp = 40; // C
    let vib = 0.5; // mm/s
    let graphData = [];
    
    ui.btnFault.addEventListener('click', () => isFault = true);
    ui.btnRep.addEventListener('click', () => { isFault = false; temp = 40; vib = 0.5; });
    
    function draw() {
        const c = getColors();
        sim.ctx.clearRect(0, 0, sim.width, sim.height);
        
        if (isFault) {
            temp += 0.5;
            vib += 0.05;
        } else {
            // Normal noise
            temp += (Math.random() - 0.5);
            vib += (Math.random() - 0.5) * 0.1;
            temp = Math.max(40, Math.min(temp, 45));
            vib = Math.max(0.5, Math.min(vib, 1.0));
        }
        
        const isCritical = (temp > 80 || vib > 4.0);
        
        ui.statusOut.innerText = isCritical ? "HALTED (CRITICAL)" : (isFault ? "WARNING" : "ONLINE");
        ui.statusOut.style.color = isCritical ? c.alert : (isFault ? '#f59e0b' : c.neon);
        ui.oeeOut.innerText = isCritical ? "0" : (isFault ? "60" : "95");
        
        // Graphing
        graphData.push(temp);
        if(graphData.length > sim.width) graphData.shift();
        
        // Draw Graph
        sim.ctx.strokeStyle = isCritical ? c.alert : c.accent;
        sim.ctx.lineWidth = 2;
        sim.ctx.beginPath();
        for(let i=0; i<graphData.length; i++) {
            const x = i;
            // scale temp (0-100) to height
            const y = sim.height - (graphData[i] / 100) * sim.height;
            if(i===0) sim.ctx.moveTo(x,y);
            else sim.ctx.lineTo(x,y);
        }
        sim.ctx.stroke();
        
        // Draw Limit Line
        sim.ctx.strokeStyle = c.alert;
        sim.ctx.setLineDash([5,5]);
        sim.ctx.beginPath();
        const limitY = sim.height - (80 / 100) * sim.height;
        sim.ctx.moveTo(0, limitY); sim.ctx.lineTo(sim.width, limitY);
        sim.ctx.stroke();
        sim.ctx.setLineDash([]);
        
        sim.ctx.fillStyle = c.textSec;
        sim.ctx.fillText("Temp Threshold (80°C)", 10, limitY - 5);
        
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
};

// Theme toggling functionality (inherited standard)
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle');
    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            const root = document.documentElement;
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', newTheme);
        });
    }
});
