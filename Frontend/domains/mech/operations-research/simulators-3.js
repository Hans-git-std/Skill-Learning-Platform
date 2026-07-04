// simulators-3.js - Logic for Chapters 9-12 Simulators

document.addEventListener("DOMContentLoaded", () => {
    initChapter9Simulator();
    initChapter10Simulator();
    initChapter11Simulator();
    initChapter12Simulator();
});

// Chapter 9: Competitor Strategy Matrix
function initChapter9Simulator() {
    const canvas = document.getElementById("ch9-prob-canvas");
    if (!canvas) return;
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    
    const btnSolve = document.getElementById("ch9-btn-solve");
    const btnRandom = document.getElementById("ch9-btn-random");
    const status = document.getElementById("ch9-status");
    
    function drawProbabilities(p1, p2) {
        ctx.clearRect(0,0,400,150);
        
        ctx.fillStyle = window.getCssVar('--text-primary');
        ctx.font = "14px var(--font-body)";
        
        // Strat 1 Bar
        ctx.fillText("Strat 1: " + (p1*100).toFixed(1) + "%", 10, 40);
        ctx.fillStyle = window.getCssVar('--bg-panel');
        ctx.fillRect(130, 25, 250, 20);
        ctx.fillStyle = window.getCssVar('--accent-primary');
        ctx.fillRect(130, 25, 250 * p1, 20);
        
        // Strat 2 Bar
        ctx.fillStyle = window.getCssVar('--text-primary');
        ctx.fillText("Strat 2: " + (p2*100).toFixed(1) + "%", 10, 90);
        ctx.fillStyle = window.getCssVar('--bg-panel');
        ctx.fillRect(130, 75, 250, 20);
        ctx.fillStyle = window.getCssVar('--accent-secondary');
        ctx.fillRect(130, 75, 250 * p2, 20);
    }
    
    function solveGame() {
        const a11 = parseFloat(document.getElementById("ch9-a11").value);
        const a12 = parseFloat(document.getElementById("ch9-a12").value);
        const a21 = parseFloat(document.getElementById("ch9-a21").value);
        const a22 = parseFloat(document.getElementById("ch9-a22").value);
        
        // Minimax & Maximin for Saddle Point
        const row1Min = Math.min(a11, a12);
        const row2Min = Math.min(a21, a22);
        const maximin = Math.max(row1Min, row2Min);
        
        const col1Max = Math.max(a11, a21);
        const col2Max = Math.max(a12, a22);
        const minimax = Math.min(col1Max, col2Max);
        
        if (maximin === minimax) {
            status.textContent = "Saddle Point Exists! Pure Strategy.";
            status.style.color = window.getCssVar('--accent-tertiary');
            
            if(row1Min === maximin) drawProbabilities(1, 0);
            else drawProbabilities(0, 1);
        } else {
            status.textContent = "No Saddle Point. Using Mixed Strategy.";
            status.style.color = window.getCssVar('--accent-warning');
            
            let p1 = (a22 - a21) / ((a11 + a22) - (a12 + a21));
            // Clamp floating errors
            if (p1 < 0) p1 = 0; if (p1 > 1) p1 = 1;
            let p2 = 1 - p1;
            
            drawProbabilities(p1, p2);
        }
    }
    
    btnSolve.addEventListener("click", solveGame);
    btnRandom.addEventListener("click", () => {
        document.getElementById("ch9-a11").value = Math.floor(Math.random() * 10);
        document.getElementById("ch9-a12").value = Math.floor(Math.random() * 10);
        document.getElementById("ch9-a21").value = Math.floor(Math.random() * 10);
        document.getElementById("ch9-a22").value = Math.floor(Math.random() * 10);
        solveGame();
    });
    
    solveGame();
    window.addEventListener("theme-changed", solveGame);
}

// Chapter 10: Machine Replacement DP Explorer
function initChapter10Simulator() {
    const canvas = document.getElementById("ch10-dp-canvas");
    if (!canvas) return;
    canvas.width = 500;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");
    
    const btnSolve = document.getElementById("ch10-btn-solve");
    const btnReset = document.getElementById("ch10-btn-reset");
    
    let solved = false;
    
    function drawTree() {
        ctx.clearRect(0,0,500,250);
        
        // Simple 3-stage tree
        const nodes = [
            {x: 50, y: 125, r: 15, label: "Y1", active: true},
            {x: 200, y: 70, r: 15, label: "Y2", active: true},
            {x: 200, y: 180, r: 15, label: "Y2", active: true},
            {x: 350, y: 40, r: 15, label: "Y3", active: true},
            {x: 350, y: 125, r: 15, label: "Y3", active: true},
            {x: 350, y: 210, r: 15, label: "Y3", active: true}
        ];
        
        const edges = [
            {from: 0, to: 1, type: 'K', active: !solved || true, opt: solved && false},
            {from: 0, to: 2, type: 'R', active: !solved || true, opt: solved && true},
            {from: 1, to: 3, type: 'K', active: !solved || false, opt: solved && false},
            {from: 1, to: 4, type: 'R', active: !solved || true, opt: solved && false},
            {from: 2, to: 4, type: 'K', active: !solved || true, opt: solved && true},
            {from: 2, to: 5, type: 'R', active: !solved || false, opt: solved && false}
        ];
        
        edges.forEach(e => {
            if(!e.active) return;
            const n1 = nodes[e.from];
            const n2 = nodes[e.to];
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = e.opt ? window.getCssVar('--accent-tertiary') : window.getCssVar('--border-color');
            ctx.lineWidth = e.opt ? 3 : 1;
            ctx.stroke();
            
            ctx.fillStyle = window.getCssVar('--text-secondary');
            ctx.font = "12px var(--font-body)";
            ctx.fillText(e.type, (n1.x+n2.x)/2, (n1.y+n2.y)/2 - 5);
        });
        
        nodes.forEach(n => {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
            ctx.fillStyle = window.getCssVar('--bg-panel');
            ctx.fill();
            ctx.strokeStyle = window.getCssVar('--text-primary');
            ctx.stroke();
            
            ctx.fillStyle = window.getCssVar('--text-primary');
            ctx.font = "12px var(--font-body)";
            ctx.textAlign = "center";
            ctx.fillText(n.label, n.x, n.y + 4);
        });
    }
    
    btnSolve.addEventListener("click", () => { solved = true; drawTree(); });
    btnReset.addEventListener("click", () => { solved = false; drawTree(); });
    
    drawTree();
    window.addEventListener("theme-changed", drawTree);
}

// Chapter 11: Branch and Bound Visualizer
function initChapter11Simulator() {
    const canvas = document.getElementById("ch11-ip-canvas");
    if (!canvas) return;
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");
    
    const btnBranch = document.getElementById("ch11-btn-branch");
    const btnReset = document.getElementById("ch11-btn-reset");
    const treeStatus = document.getElementById("ch11-tree-status");
    
    let state = 0; // 0=LP, 1=Branch1, 2=Branch2
    
    function draw() {
        ctx.clearRect(0,0,400,250);
        
        // Axes
        ctx.beginPath(); ctx.moveTo(30,10); ctx.lineTo(30,230); ctx.lineTo(380,230);
        ctx.strokeStyle = window.getCssVar('--border-color'); ctx.stroke();
        
        // Base Feasible Region (LP)
        ctx.beginPath();
        ctx.moveTo(30, 230);
        ctx.lineTo(30 + 5*40, 230);
        ctx.lineTo(30 + 2.5*40, 230 - 3*40); // Continuous Opt
        ctx.lineTo(30, 230 - 4*40);
        ctx.fillStyle = "rgba(129, 140, 248, 0.2)";
        ctx.fill();
        ctx.strokeStyle = window.getCssVar('--accent-primary');
        ctx.stroke();
        
        if (state >= 1) {
            // Branch constraint x1 <= 2
            ctx.beginPath();
            ctx.moveTo(30 + 2*40, 10);
            ctx.lineTo(30 + 2*40, 230);
            ctx.strokeStyle = window.getCssVar('--accent-warning');
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        if (state >= 2) {
            // Branch constraint x1 >= 3
            ctx.beginPath();
            ctx.moveTo(30 + 3*40, 10);
            ctx.lineTo(30 + 3*40, 230);
            ctx.strokeStyle = window.getCssVar('--accent-warning');
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Draw Integer Points
        ctx.fillStyle = window.getCssVar('--text-primary');
        for(let x=0; x<=6; x++) {
            for(let y=0; y<=5; y++) {
                ctx.beginPath();
                ctx.arc(30 + x*40, 230 - y*40, 3, 0, Math.PI*2);
                ctx.fill();
            }
        }
        
        // Highlight Opt
        ctx.fillStyle = window.getCssVar('--accent-tertiary');
        ctx.beginPath();
        if (state === 0) {
            ctx.arc(30 + 2.5*40, 230 - 3*40, 6, 0, Math.PI*2);
            treeStatus.innerHTML = "Node 0 (LP Relaxation):<br>Z = 14.5<br>x1 = 2.5, x2 = 3<br><br><span style='color:var(--accent-warning)'>x1 is fractional. Branch on x1!</span>";
        } else if (state === 1) {
            ctx.arc(30 + 2*40, 230 - 3.2*40, 6, 0, Math.PI*2); // still fractional
            treeStatus.innerHTML = "Node 1 (x1 <= 2):<br>Z = 14.1<br>x1 = 2, x2 = 3.2<br><br><span style='color:var(--accent-warning)'>x2 is fractional. Needs more branching.</span>";
        } else {
            ctx.arc(30 + 3*40, 230 - 2*40, 6, 0, Math.PI*2); // integer
            treeStatus.innerHTML = "Node 2 (x1 >= 3):<br>Z = 13.0<br>x1 = 3, x2 = 2<br><br><span style='color:var(--accent-tertiary)'>Integer Solution Found! Lower Bound updated.</span>";
        }
        ctx.fill();
    }
    
    btnBranch.addEventListener("click", () => {
        state++;
        if(state > 2) state = 2;
        draw();
    });
    
    btnReset.addEventListener("click", () => {
        state = 0;
        draw();
    });
    
    draw();
    window.addEventListener("theme-changed", draw);
}

// Chapter 12: Monte Carlo Risk Engine
function initChapter12Simulator() {
    const canvas = document.getElementById("ch12-mc-canvas");
    if (!canvas) return;
    canvas.width = 500;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");
    
    const btnSim = document.getElementById("ch12-btn-sim");
    const distSelect = document.getElementById("ch12-dist");
    
    let bins = new Array(20).fill(0);
    let isRunning = false;
    
    function draw() {
        ctx.clearRect(0,0,500,250);
        
        ctx.fillStyle = window.getCssVar('--text-primary');
        ctx.font = "12px var(--font-body)";
        ctx.fillText("Failure Time (Hours) →", 200, 240);
        
        const binWidth = 500 / 20;
        const maxBin = Math.max(...bins, 1);
        
        for(let i=0; i<20; i++) {
            const h = (bins[i] / maxBin) * 200;
            ctx.fillStyle = window.getCssVar('--accent-primary');
            ctx.fillRect(i * binWidth, 220 - h, binWidth - 2, h);
        }
    }
    
    function runSim() {
        if(isRunning) return;
        isRunning = true;
        bins = new Array(20).fill(0);
        const isNorm = distSelect.value === "normal";
        
        let count = 0;
        const total = 1000;
        
        function iter() {
            for(let k=0; k<50; k++) { // 50 per frame
                if(count >= total) break;
                
                let val = 0;
                if(isNorm) {
                    // Box-Muller normal approximation
                    let u = 0, v = 0;
                    while(u === 0) u = Math.random();
                    while(v === 0) v = Math.random();
                    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
                    val = (num / 3.0 + 0.5) * 20; 
                } else {
                    // Exponential
                    val = -Math.log(1 - Math.random()) * 5;
                }
                
                let bin = Math.floor(val);
                if(bin < 0) bin = 0;
                if(bin > 19) bin = 19;
                
                bins[bin]++;
                count++;
            }
            
            draw();
            
            if(count < total) {
                requestAnimationFrame(iter);
            } else {
                isRunning = false;
                document.getElementById("ch12-val-mean").textContent = isNorm ? "10,000 Hrs" : "5,000 Hrs";
                document.getElementById("ch12-val-risk").textContent = isNorm ? "5,000 Hrs" : "250 Hrs";
            }
        }
        
        iter();
    }
    
    btnSim.addEventListener("click", runSim);
    draw();
    window.addEventListener("theme-changed", draw);
}
