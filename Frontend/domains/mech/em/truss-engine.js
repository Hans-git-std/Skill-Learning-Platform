document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('bridge-canvas');
    const btnCenter = document.getElementById('btn-load-center');
    const btnSide = document.getElementById('btn-load-side');
    const btnReset = document.getElementById('btn-reset-truss');
    const statusText = document.getElementById('truss-status');

    // Truss Geometry (Percentages for responsiveness)
    const nodes = {
        0: { x: 10, y: 80 }, // Bottom Left Support
        1: { x: 50, y: 80 }, // Bottom Center
        2: { x: 90, y: 80 }, // Bottom Right Support
        3: { x: 30, y: 30 }, // Top Left
        4: { x: 70, y: 30 }  // Top Right
    };

    // Connections between nodes
    const members = [
        { id: 'm-0-1', n1: 0, n2: 1 }, // Bottom Chord Left
        { id: 'm-1-2', n1: 1, n2: 2 }, // Bottom Chord Right
        { id: 'm-0-3', n1: 0, n2: 3 }, // Outer Diagonal Left
        { id: 'm-3-4', n1: 3, n2: 4 }, // Top Chord
        { id: 'm-4-2', n1: 4, n2: 2 }, // Outer Diagonal Right
        { id: 'm-1-3', n1: 1, n2: 3 }, // Inner Diagonal Left
        { id: 'm-1-4', n1: 1, n2: 4 }  // Inner Diagonal Right
    ];

    let currentLoadArrow = null;

    function initTruss() {
        canvas.innerHTML = '';
        
        // 1. Draw Members (Lines)
        members.forEach(m => {
            const line = document.createElement('div');
            line.className = 'truss-member';
            line.id = m.id;
            canvas.appendChild(line);
        });

        // 2. Draw Nodes (Pins)
        Object.keys(nodes).forEach(id => {
            const div = document.createElement('div');
            div.className = 'truss-node';
            div.id = `node-${id}`;
            div.style.left = `${nodes[id].x}%`;
            div.style.top = `${nodes[id].y}%`;
            canvas.appendChild(div);
        });

        // 3. Draw Supports (Visual only)
        const leftSupport = document.createElement('div');
        leftSupport.style.cssText = "position: absolute; width: 30px; height: 15px; background: var(--text-muted); bottom: 0; left: calc(10% - 15px); clip-path: polygon(50% 0%, 0% 100%, 100% 100%);";
        const rightSupport = document.createElement('div');
        rightSupport.style.cssText = "position: absolute; width: 30px; height: 15px; background: var(--text-muted); bottom: 0; left: calc(90% - 15px); border-radius: 15px 15px 0 0;";
        
        canvas.appendChild(leftSupport);
        canvas.appendChild(rightSupport);

        updateGeometry();
    }

    // Calculates lengths and angles based on the current window size
    function updateGeometry() {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return;

        members.forEach(m => {
            const node1 = nodes[m.n1];
            const node2 = nodes[m.n2];

            const x1 = (node1.x / 100) * rect.width;
            const y1 = (node1.y / 100) * rect.height;
            const x2 = (node2.x / 100) * rect.width;
            const y2 = (node2.y / 100) * rect.height;

            const length = Math.hypot(x2 - x1, y2 - y1);
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

            const el = document.getElementById(m.id);
            if (el) {
                el.style.width = `${length}px`;
                el.style.left = `${x1}px`;
                el.style.top = `${y1}px`;
                el.style.transform = `rotate(${angle}deg)`;
            }
        });
    }

    // Applies physical states to the members
    function setMemberStates(states) {
        members.forEach(m => {
            const el = document.getElementById(m.id);
            el.className = 'truss-member'; // Reset
            if (states[m.id]) {
                el.classList.add(states[m.id]);
            }
        });
    }

    function drawLoadArrow(nodeId) {
        if (currentLoadArrow) currentLoadArrow.remove();
        
        const targetNode = nodes[nodeId];
        currentLoadArrow = document.createElement('div');
        currentLoadArrow.className = 'load-arrow';
        
        // Position above the node pointing down
        currentLoadArrow.style.left = `calc(${targetNode.x}% - 2px)`;
        currentLoadArrow.style.top = `calc(${targetNode.y}% - 65px)`;
        
        canvas.appendChild(currentLoadArrow);
    }

    // --- Event Listeners ---

    btnCenter.addEventListener('click', () => {
        drawLoadArrow(1); // Load on Bottom Center Node
        
        // Physics Mapping for a Center Load
        setMemberStates({
            'm-0-1': 'tension',      // Bottom stretches
            'm-1-2': 'tension',      // Bottom stretches
            'm-0-3': 'compression',  // Pushed into support
            'm-3-4': 'compression',  // Top pinches together
            'm-4-2': 'compression',  // Pushed into support
            'm-1-3': 'tension',      // Holds the center up
            'm-1-4': 'tension'       // Holds the center up
        });

        statusText.textContent = "10kN Center Load applied. Notice how the internal diagonals must pull (Tension) to keep the bridge from sagging.";
        statusText.style.color = "#ef4444";
    });

    btnSide.addEventListener('click', () => {
        drawLoadArrow(3); // Load on Top Left Node
        
        // Physics Mapping for an Asymmetrical Side Load
        setMemberStates({
            'm-0-1': 'tension',      
            'm-1-2': 'tension',      
            'm-0-3': 'compression',  // Takes massive crushing load
            'm-3-4': 'compression',  
            'm-4-2': 'compression',  
            'm-1-3': 'compression',  // Load pushes this diagonal into the center pin
            'm-1-4': 'tension'       
        });

        statusText.textContent = "10kN Asymmetrical Load on Top Left. The left support takes the brunt of the crushing force.";
        statusText.style.color = "#f59e0b";
    });

    btnReset.addEventListener('click', () => {
        if (currentLoadArrow) currentLoadArrow.remove();
        setMemberStates({}); // Clears all states
        statusText.textContent = "Truss Status: Unloaded. All members at 0kN.";
        statusText.style.color = "var(--text-muted)";
    });

    // Recalculate angles and lengths if the user resizes the browser
    window.addEventListener('resize', updateGeometry);

    // Startup
    initTruss();
});