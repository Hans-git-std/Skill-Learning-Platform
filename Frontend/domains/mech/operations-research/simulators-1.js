// simulators-1.js - Logic for Chapters 1-4 Simulators

document.addEventListener("DOMContentLoaded", () => {
    initChapter1Simulator();
    initChapter2Simulator();
    initChapter3Simulator();
    initChapter4Simulator();
});

// Chapter 1: 3D Factory Layout Optimizer (Simplified 2D Drag & Drop for now)
function initChapter1Simulator() {
    const grid = document.getElementById("ch1-factory-grid");
    if (!grid) return;
    
    // Grid Setup
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(4, 1fr)";
    grid.style.gap = "10px";
    grid.style.background = "var(--bg-panel)";
    grid.style.padding = "10px";
    grid.style.borderRadius = "8px";
    grid.style.minHeight = "200px";

    const machines = ["Lathe", "Mill", "CNC", "Assembly"];
    let positions = [0, 1, 2, 3]; // initial slots

    let selectedIdx = null;

    function renderGrid() {
        grid.innerHTML = "";
        for (let i = 0; i < 8; i++) {
            const cell = document.createElement("div");
            cell.style.border = "2px dashed var(--border-color)";
            cell.style.borderRadius = "4px";
            cell.style.height = "80px";
            cell.dataset.index = i;
            cell.style.cursor = "pointer";
            
            const machineIndex = positions.indexOf(i);
            if (machineIndex !== -1) {
                const machine = document.createElement("div");
                machine.textContent = machines[machineIndex];
                machine.style.background = selectedIdx === i ? "var(--accent-warning)" : "var(--accent-primary)";
                machine.style.color = "white";
                machine.style.height = "100%";
                machine.style.display = "flex";
                machine.style.alignItems = "center";
                machine.style.justifyContent = "center";
                machine.style.fontWeight = "bold";
                machine.style.borderRadius = "4px";
                machine.style.pointerEvents = "none"; // Let the cell handle clicks
                
                cell.appendChild(machine);
            }
            
            cell.addEventListener("click", () => {
                if (selectedIdx === null) {
                    if (machineIndex !== -1) {
                        selectedIdx = i; // Select the cell containing the machine
                        renderGrid();
                    }
                } else {
                    if (selectedIdx !== i) {
                        // Swap
                        const m1 = positions.indexOf(selectedIdx);
                        const m2 = positions.indexOf(i);
                        
                        if (m1 !== -1) positions[m1] = i;
                        if (m2 !== -1) positions[m2] = selectedIdx;
                    }
                    selectedIdx = null;
                    renderGrid();
                    calculateCost();
                }
            });
            
            grid.appendChild(cell);
        }
    }

    function calculateCost() {
        // Simple distance calculation (Manhattan distance on 4x2 grid)
        let totalCost = 0;
        for(let i=0; i<machines.length-1; i++) {
            const p1 = positions[i];
            const p2 = positions[i+1];
            const r1 = Math.floor(p1/4), c1 = p1%4;
            const r2 = Math.floor(p2/4), c2 = p2%4;
            const dist = Math.abs(r1-r2) + Math.abs(c1-c2);
            totalCost += dist * 100; // $100 per unit distance
        }
        document.getElementById("ch1-val-cost").textContent = "$" + totalCost;
        document.getElementById("ch1-val-dist").textContent = (totalCost/100) * 10 + "m";
    }

    document.getElementById("ch1-btn-reset").addEventListener("click", () => {
        positions = [0, 1, 2, 3];
        renderGrid();
        calculateCost();
    });

    document.getElementById("ch1-btn-optimize").addEventListener("click", () => {
        // Optimal is sequential in a line
        positions = [0, 1, 2, 3];
        renderGrid();
        calculateCost();
    });

    renderGrid();
    calculateCost();
}

// Chapter 2: Interactive 2D Feasible Region Plotter
function initChapter2Simulator() {
    const canvas = document.getElementById("ch2-canvas");
    if (!canvas) return;
    
    // Explicitly set internal resolution
    canvas.width = 400;
    canvas.height = 300;
    
    const ctx = canvas.getContext("2d");
    
    const sliderC1 = document.getElementById("ch2-c1-slider");
    const sliderC2 = document.getElementById("ch2-c2-slider");
    
    let zLineOffset = 0;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const c1 = parseInt(sliderC1.value);
        const c2 = parseInt(sliderC2.value);
        
        // Axes
        ctx.beginPath();
        ctx.moveTo(30, 10);
        ctx.lineTo(30, 270);
        ctx.lineTo(380, 270);
        ctx.strokeStyle = "#a1a1aa";
        ctx.stroke();
        
        // Constraints
        // C1: 2x1 + x2 <= 100 -> intersects at (50,0) and (0,100)
        // C2: x1 + 2x2 <= 80  -> intersects at (80,0) and (0,40)
        // Scaled for canvas (x: *4, y: *2)
        
        const p1 = {x: 30 + (100/2)*4, y: 270 - 0}; // (50,0)
        const p2 = {x: 30 + 0, y: 270 - 100*2}; // (0,100)
        
        const p3 = {x: 30 + 80*4, y: 270 - 0}; // (80,0)
        const p4 = {x: 30 + 0, y: 270 - 40*2}; // (0,40)
        
        const intersect = {x: 30 + 40*4, y: 270 - 20*2}; // (40,20)
        
        // Fill Feasible Region
        ctx.beginPath();
        ctx.moveTo(30, 270); // Origin
        ctx.lineTo(p3.x, p3.y); // (80,0) - wait, it's min of constraints. So (50,0)
        ctx.lineTo(p1.x, p1.y); // (50,0)
        ctx.lineTo(intersect.x, intersect.y); // (40,20)
        ctx.lineTo(p4.x, p4.y); // (0,40)
        ctx.closePath();
        ctx.fillStyle = "rgba(129, 140, 248, 0.3)";
        ctx.fill();
        ctx.strokeStyle = "#818cf8";
        ctx.stroke();
        
        // Z Line (Objective Function: Z = c1*x1 + c2*x2)
        // c1*x1 + c2*x2 = Z => x2 = -c1/c2 * x1 + Z/c2
        // We animate Z increasing
        const slope = -c1 / c2;
        const zValue = zLineOffset;
        
        ctx.beginPath();
        const startX = 0;
        const startY = slope * startX + zValue;
        const endX = 100;
        const endY = slope * endX + zValue;
        
        // Map to canvas
        ctx.moveTo(30 + startX*4, 270 - startY*2);
        ctx.lineTo(30 + endX*4, 270 - endY*2);
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Find Optimal (Max Z at intersection 40,20)
        const maxZ = c1 * 40 + c2 * 20;
        document.getElementById("ch2-val-z").textContent = Math.round(maxZ);
        document.getElementById("ch2-val-x1").textContent = "40";
        document.getElementById("ch2-val-x2").textContent = "20";
        
        zLineOffset += 0.5;
        if(zLineOffset > (40 * (-slope) + 20)) zLineOffset = 0;
        
        requestAnimationFrame(draw);
    }
    
    draw();
}

// Chapter 3: N-Dimensional Simplex Visualizer
function initChapter3Simulator() {
    const table = document.getElementById("ch3-tableau");
    const btnStep = document.getElementById("ch3-btn-step");
    const btnReset = document.getElementById("ch3-btn-reset");
    const status = document.getElementById("ch3-status");
    if(!table) return;
    
    const initialTableau = [
        ["Basic", "x1", "x2", "s1", "s2", "RHS"],
        ["s1", 2, 1, 1, 0, 100],
        ["s2", 1, 2, 0, 1, 80],
        ["Z", -50, -60, 0, 0, 0]
    ];
    
    let currentTableau = JSON.parse(JSON.stringify(initialTableau));
    let iteration = 0;
    
    function renderTableau() {
        table.innerHTML = "";
        
        // Header
        const trH = document.createElement("tr");
        currentTableau[0].forEach(cell => {
            const th = document.createElement("th");
            th.textContent = cell;
            th.style.padding = "8px";
            th.style.borderBottom = "2px solid var(--border-color)";
            th.style.textAlign = "center";
            trH.appendChild(th);
        });
        table.appendChild(trH);
        
        // Body
        for(let i=1; i<currentTableau.length; i++) {
            const tr = document.createElement("tr");
            currentTableau[i].forEach((cell, colIdx) => {
                const td = document.createElement("td");
                td.textContent = typeof cell === "number" ? cell.toFixed(2) : cell;
                td.style.padding = "8px";
                td.style.borderBottom = "1px solid var(--border-color)";
                td.style.textAlign = "center";
                tr.appendChild(td);
            });
            table.appendChild(tr);
        }
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
    }
    
    btnStep.addEventListener("click", () => {
        if(iteration >= 2) {
            status.textContent = "Optimal Solution Reached!";
            status.style.color = "var(--accent-tertiary)";
            return;
        }
        
        iteration++;
        status.textContent = `Iteration ${iteration}: Pivoting...`;
        
        // Hardcoded steps for simulation effect
        if(iteration === 1) {
            // Enter x2, Leave s2
            currentTableau[2] = ["x2", 0.5, 1, 0, 0.5, 40];
            currentTableau[1] = ["s1", 1.5, 0, 1, -0.5, 60];
            currentTableau[3] = ["Z", -20, 0, 0, 30, 2400];
        } else if (iteration === 2) {
            // Enter x1, Leave s1
            currentTableau[1] = ["x1", 1, 0, 0.67, -0.33, 40];
            currentTableau[2] = ["x2", 0, 1, -0.33, 0.67, 20];
            currentTableau[3] = ["Z", 0, 0, 13.33, 23.33, 3200];
            status.textContent = "Iteration 2: Optimal Solution Reached! All Z values >= 0.";
            status.style.color = "var(--accent-tertiary)";
        }
        renderTableau();
    });
    
    btnReset.addEventListener("click", () => {
        currentTableau = JSON.parse(JSON.stringify(initialTableau));
        iteration = 0;
        status.textContent = "Iteration 0: Initial Basic Feasible Solution";
        status.style.color = "var(--accent-warning)";
        renderTableau();
    });
    
    renderTableau();
}

// Chapter 4: Supply Chain Routing Map
function initChapter4Simulator() {
    const map = document.getElementById("ch4-map");
    const btnSolve = document.getElementById("ch4-btn-solve");
    const selectMethod = document.getElementById("ch4-method");
    const valCost = document.getElementById("ch4-val-cost");
    if(!map) return;
    
    map.style.height = "250px";
    map.style.background = "var(--bg-panel)";
    map.style.borderRadius = "8px";
    map.style.position = "relative";
    
    // Draw basic nodes
    const f1 = document.createElement("div");
    f1.textContent = "F1";
    f1.style.cssText = "position:absolute; top:20px; left:20px; padding:10px; background:var(--accent-primary); border-radius:50%; color:white; font-weight:bold;";
    
    const f2 = document.createElement("div");
    f2.textContent = "F2";
    f2.style.cssText = "position:absolute; bottom:20px; left:20px; padding:10px; background:var(--accent-primary); border-radius:50%; color:white; font-weight:bold;";
    
    const w1 = document.createElement("div");
    w1.textContent = "W1";
    w1.style.cssText = "position:absolute; top:20px; right:20px; padding:10px; background:var(--accent-warning); border-radius:50%; color:white; font-weight:bold;";
    
    const w2 = document.createElement("div");
    w2.textContent = "W2";
    w2.style.cssText = "position:absolute; bottom:20px; right:20px; padding:10px; background:var(--accent-warning); border-radius:50%; color:white; font-weight:bold;";
    
    map.appendChild(f1); map.appendChild(f2);
    map.appendChild(w1); map.appendChild(w2);
    
    btnSolve.addEventListener("click", () => {
        const m = selectMethod.value;
        if(m === "nw") {
            valCost.textContent = "$4,200 (Sub-optimal)";
            valCost.style.color = "var(--accent-warning)";
        } else if (m === "lc") {
            valCost.textContent = "$3,800 (Better)";
            valCost.style.color = "var(--accent-primary)";
        } else {
            valCost.textContent = "$3,500 (Optimal via VAM)";
            valCost.style.color = "var(--accent-tertiary)";
        }
        
        // Animate a "truck" dot
        const dot = document.createElement("div");
        dot.style.cssText = "position:absolute; top:35px; left:55px; width:10px; height:10px; background:var(--text-primary); border-radius:50%; transition: left 1s, top 1s;";
        map.appendChild(dot);
        
        setTimeout(() => {
            dot.style.left = "calc(100% - 65px)";
            if(m === "vam") dot.style.top = "calc(100% - 65px)";
        }, 100);
        
        setTimeout(() => dot.remove(), 1200);
    });
}
