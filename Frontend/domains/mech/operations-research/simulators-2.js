// simulators-2.js - Logic for Chapters 5-8 Simulators

document.addEventListener("DOMContentLoaded", () => {
    initChapter5Simulator();
    initChapter6Simulator();
    initChapter7Simulator();
    initChapter8Simulator();
});

// Chapter 5: Assignment Problem (Machine Shop Job Assigner)
function initChapter5Simulator() {
    const table = document.getElementById("ch5-matrix");
    const canvasLines = document.getElementById("ch5-canvas-lines");
    const canvasGraph = document.getElementById("ch5-canvas-graph");
    const btnStep = document.getElementById("ch5-btn-step");
    const btnReset = document.getElementById("ch5-btn-reset");
    const status = document.getElementById("ch5-status");
    
    if(!table || !canvasGraph) return;

    // Explicit sizes for graph
    canvasGraph.width = 400;
    canvasGraph.height = 250;
    const gctx = canvasGraph.getContext("2d");
    
    // Hardcoded matrix states for steps
    const states = [
        // 0: Initial
        [[10, 5, 13], [3, 9, 18], [10, 7, 2]],
        // 1: Row Reduction
        [[5, 0, 8], [0, 6, 15], [8, 5, 0]],
        // 2: Column Reduction (already done) / Lines
        [[5, 0, 8], [0, 6, 15], [8, 5, 0]]
    ];
    
    let step = 0;
    
    function renderTable() {
        table.innerHTML = "";
        const m = states[Math.min(step, 2)];
        
        const header = document.createElement("tr");
        header.innerHTML = "<th></th><th>Job 1</th><th>Job 2</th><th>Job 3</th>";
        table.appendChild(header);
        
        const machines = ["M1", "M2", "M3"];
        
        for(let i=0; i<3; i++) {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            th.textContent = machines[i];
            tr.appendChild(th);
            
            for(let j=0; j<3; j++) {
                const td = document.createElement("td");
                td.textContent = m[i][j];
                td.style.padding = "10px";
                td.style.textAlign = "center";
                td.style.border = "1px solid var(--border-color)";
                if(m[i][j] === 0) td.style.color = "var(--accent-warning)";
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        
        // Handle canvas lines over table (mocked)
        if(step >= 2) {
            // Add some CSS borders to simulate line drawing
            table.rows[1].style.background = "rgba(251, 146, 60, 0.2)";
            table.rows[2].style.background = "rgba(251, 146, 60, 0.2)";
            table.rows[3].style.background = "rgba(251, 146, 60, 0.2)";
        }
    }
    
    function renderGraph() {
        gctx.clearRect(0,0,400,250);
        gctx.font = "14px var(--font-body)";
        gctx.textAlign = "center";
        
        // Draw Nodes
        const nodesM = [{x: 50, y: 50}, {x: 50, y: 125}, {x: 50, y: 200}];
        const nodesJ = [{x: 350, y: 50}, {x: 350, y: 125}, {x: 350, y: 200}];
        
        gctx.strokeStyle = window.getCssVar('--border-color');
        if (step === 3) gctx.strokeStyle = window.getCssVar('--accent-tertiary');
        gctx.lineWidth = step === 3 ? 3 : 1;
        
        // Draw Edges
        if (step === 0 || step === 1) {
            // all edges
            for(let i=0; i<3; i++) {
                for(let j=0; j<3; j++) {
                    gctx.beginPath();
                    gctx.moveTo(nodesM[i].x, nodesM[i].y);
                    gctx.lineTo(nodesJ[j].x, nodesJ[j].y);
                    gctx.stroke();
                }
            }
        } else if (step >= 2) {
            // Only optimal edges
            gctx.beginPath(); gctx.moveTo(nodesM[0].x, nodesM[0].y); gctx.lineTo(nodesJ[1].x, nodesJ[1].y); gctx.stroke();
            gctx.beginPath(); gctx.moveTo(nodesM[1].x, nodesM[1].y); gctx.lineTo(nodesJ[0].x, nodesJ[0].y); gctx.stroke();
            gctx.beginPath(); gctx.moveTo(nodesM[2].x, nodesM[2].y); gctx.lineTo(nodesJ[2].x, nodesJ[2].y); gctx.stroke();
        }
        
        // Draw Circles
        for(let i=0; i<3; i++) {
            gctx.fillStyle = window.getCssVar('--accent-primary');
            gctx.beginPath(); gctx.arc(nodesM[i].x, nodesM[i].y, 20, 0, Math.PI*2); gctx.fill();
            gctx.beginPath(); gctx.arc(nodesJ[i].x, nodesJ[i].y, 20, 0, Math.PI*2); gctx.fill();
            
            gctx.fillStyle = "#fff"; // Text inside primary colored circle is always white
            gctx.fillText("M"+(i+1), nodesM[i].x, nodesM[i].y + 5);
            gctx.fillText("J"+(i+1), nodesJ[i].x, nodesJ[i].y + 5);
        }
    }
    
    btnStep.addEventListener("click", () => {
        step++;
        if(step > 3) step = 3;
        
        if(step === 1) status.textContent = "Step 1: Row Reduction (Subtract min from each row)";
        if(step === 2) status.textContent = "Step 2: Line Covering (Cover all zeros)";
        if(step === 3) {
            status.textContent = "Step 3: Optimal Assignment Found!";
            status.style.color = "var(--accent-tertiary)";
        }
        
        renderTable();
        renderGraph();
    });
    
    btnReset.addEventListener("click", () => {
        step = 0;
        status.textContent = "Step 0: Initial Cost Matrix";
        status.style.color = "var(--accent-warning)";
        renderTable();
        renderGraph();
    });
    
    renderTable();
    renderGraph();
    
    window.addEventListener("theme-changed", () => {
        renderGraph(); // Redraw with new theme colors
    });
}

// Chapter 6: Dynamic PERT/CPM Gantt Engine
function initChapter6Simulator() {
    const canvas = document.getElementById("ch6-network-canvas");
    const slider = document.getElementById("ch6-delay-slider");
    const delayVal = document.getElementById("ch6-delay-val");
    const totalTime = document.getElementById("ch6-val-time");
    
    if(!canvas) return;
    canvas.width = 500;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");
    
    function drawNetwork() {
        ctx.clearRect(0, 0, 500, 250);
        
        const delay = parseInt(slider.value);
        delayVal.textContent = "+" + delay + " Days";
        
        const tA = 5, tB = 3, tC = 4 + delay, tD = 2, tE = 6;
        const path1 = tA + tC + tE; // A -> C -> E
        const path2 = tB + tD + tE; // B -> D -> E
        
        const isCritical1 = path1 >= path2;
        const isCritical2 = path2 > path1;
        
        totalTime.textContent = Math.max(path1, path2) + " Days";
        if (isCritical1) {
            document.getElementById("ch6-val-path").textContent = "A → C → E";
        } else {
            document.getElementById("ch6-val-path").textContent = "B → D → E";
        }
        
        const nodes = {
            S: {x: 50, y: 125, label: "Start"},
            N1: {x: 200, y: 50, label: "A ("+tA+")"},
            N2: {x: 200, y: 200, label: "B ("+tB+")"},
            N3: {x: 350, y: 50, label: "C ("+tC+")"},
            N4: {x: 350, y: 200, label: "D ("+tD+")"},
            E: {x: 450, y: 125, label: "E ("+tE+")"}
        };
        
        function drawLine(n1, n2, critical) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = critical ? window.getCssVar('--accent-warning') : window.getCssVar('--border-color');
            ctx.lineWidth = critical ? 4 : 2;
            ctx.stroke();
        }
        
        drawLine(nodes.S, nodes.N1, isCritical1);
        drawLine(nodes.N1, nodes.N3, isCritical1);
        drawLine(nodes.N3, nodes.E, isCritical1);
        
        drawLine(nodes.S, nodes.N2, isCritical2);
        drawLine(nodes.N2, nodes.N4, isCritical2);
        drawLine(nodes.N4, nodes.E, isCritical2);
        
        for (const key in nodes) {
            const n = nodes[key];
            ctx.beginPath();
            ctx.arc(n.x, n.y, 20, 0, Math.PI*2);
            ctx.fillStyle = window.getCssVar('--bg-panel');
            ctx.fill();
            ctx.strokeStyle = window.getCssVar('--text-primary');
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = window.getCssVar('--text-primary');
            ctx.font = "12px var(--font-body)";
            ctx.textAlign = "center";
            ctx.fillText(n.label, n.x, n.y + 5);
        }
    }
    
    slider.addEventListener("input", drawNetwork);
    drawNetwork();
    
    window.addEventListener("theme-changed", drawNetwork);
}

// Chapter 7: Assembly Line Bottleneck Simulator
function initChapter7Simulator() {
    const queueArea = document.getElementById("ch7-queue-area");
    const sliderL = document.getElementById("ch7-lambda");
    const sliderM = document.getElementById("ch7-mu");
    const btnToggle = document.getElementById("ch7-btn-toggle");
    
    if(!queueArea) return;
    
    let isRunning = true;
    let queue = 0;
    
    function tick() {
        if(!isRunning) return;
        
        const lambda = parseFloat(sliderL.value);
        const mu = parseFloat(sliderM.value);
        
        // Utilization
        const rho = (lambda / mu) * 100;
        document.getElementById("ch7-val-rho").textContent = rho.toFixed(1) + "%";
        
        if (rho >= 100) {
            document.getElementById("ch7-val-rho").style.color = "var(--accent-warning)";
        } else {
            document.getElementById("ch7-val-rho").style.color = "var(--accent-tertiary)";
        }
        
        // Wait time Wq
        let wq = 0;
        if (lambda < mu) {
            wq = lambda / (mu * (mu - lambda));
            document.getElementById("ch7-val-wq").textContent = (wq * 60).toFixed(1) + "m";
        } else {
            document.getElementById("ch7-val-wq").textContent = "Infinite";
        }
        
        // Animate DOM queue
        // Random arrival based on lambda
        if (Math.random() < lambda / 100) {
            queue++;
        }
        // Random service based on mu
        if (queue > 0 && Math.random() < mu / 100) {
            queue--;
        }
        
        // Max visual queue is 10
        const vQueue = Math.min(queue, 15);
        
        // Clear existing parts
        const parts = queueArea.querySelectorAll('.part');
        parts.forEach(p => p.remove());
        
        for(let i=0; i<vQueue; i++) {
            const part = document.createElement("div");
            part.className = "part";
            part.style.width = "20px";
            part.style.height = "20px";
            part.style.background = "var(--text-secondary)";
            part.style.borderRadius = "50%";
            part.style.position = "absolute";
            part.style.right = (100 + i*25) + "px";
            queueArea.appendChild(part);
        }
        
        requestAnimationFrame(tick);
    }
    
    btnToggle.addEventListener("click", () => {
        isRunning = !isRunning;
        btnToggle.textContent = isRunning ? "Pause Engine" : "Resume Engine";
        if(isRunning) tick();
    });
    
    tick();
}

// Chapter 8: 3D Warehouse EOQ Balancer
function initChapter8Simulator() {
    const canvas = document.getElementById("ch8-graph-canvas");
    const sliderD = document.getElementById("ch8-demand");
    const sliderS = document.getElementById("ch8-setup");
    const sliderH = document.getElementById("ch8-holding");
    
    if(!canvas) return;
    canvas.width = 500;
    canvas.height = 250;
    const ctx = canvas.getContext("2d");
    
    let time = 0;
    
    function draw() {
        ctx.clearRect(0, 0, 500, 250);
        
        const D = parseInt(sliderD.value);
        const S = parseInt(sliderS.value);
        const H = parseInt(sliderH.value);
        
        // EOQ formula
        const Q = Math.sqrt((2 * D * S) / H);
        const TC = (D / Q) * S + (Q / 2) * H;
        
        document.getElementById("ch8-val-q").textContent = Math.round(Q) + " units";
        document.getElementById("ch8-val-tc").textContent = "$" + Math.round(TC);
        
        // Draw Sawtooth
        ctx.beginPath();
        ctx.moveTo(50, 220); // origin
        ctx.lineTo(50, 20); // y-axis
        ctx.moveTo(50, 220);
        ctx.lineTo(480, 220); // x-axis
        ctx.strokeStyle = window.getCssVar('--text-secondary');
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw teeth based on Q and D
        const maxQ = 2000;
        const normalizedQ = (Q / maxQ) * 200; // max height is 200
        
        const cycleWidth = (Q / D) * 1000; // arbitrary scale for width
        
        ctx.beginPath();
        let x = 50;
        while(x < 480) {
            ctx.lineTo(x, 220 - normalizedQ); // order arrives
            x += cycleWidth;
            if(x > 480) {
                // interpolate
                const ratio = (480 - (x - cycleWidth)) / cycleWidth;
                ctx.lineTo(480, (220 - normalizedQ) + ratio * normalizedQ);
            } else {
                ctx.lineTo(x, 220); // depletes
            }
        }
        
        ctx.strokeStyle = window.getCssVar('--accent-primary');
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Animate a moving line
        const animX = 50 + (time % (480 - 50));
        ctx.beginPath();
        ctx.moveTo(animX, 220);
        ctx.lineTo(animX, 20);
        ctx.strokeStyle = window.getCssVar('--accent-warning');
        ctx.lineWidth = 2;
        ctx.stroke();
        
        time += 2;
        requestAnimationFrame(draw);
    }
    
    sliderD.addEventListener("input", () => {});
    sliderS.addEventListener("input", () => {});
    sliderH.addEventListener("input", () => {});
    
    draw();
}
