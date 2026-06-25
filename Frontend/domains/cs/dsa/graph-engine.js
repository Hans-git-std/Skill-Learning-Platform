document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('network-canvas');
    const btnDFS = document.getElementById('btn-dfs');
    const btnBFS = document.getElementById('btn-bfs');
    const btnReset = document.getElementById('btn-reset-graph');
    const statusText = document.getElementById('graph-status');

    let globalGraphId = 0; // The Interrupt System to stop running searches
    const SLEEP_MS = 600;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // The Network Topology (Tree/Graph structure)
    // Coordinates are percentages relative to the container
    const nodes = {
        0: { x: 50, y: 15, label: 'A' },
        1: { x: 25, y: 45, label: 'B' },
        2: { x: 75, y: 45, label: 'C' },
        3: { x: 10, y: 80, label: 'D' },
        4: { x: 40, y: 80, label: 'E' },
        5: { x: 60, y: 80, label: 'F' },
        6: { x: 90, y: 80, label: 'G' }
    };

    // Adjacency List representing the Edges
    const adjacencyList = {
        0: [1, 2],
        1: [0, 3, 4],
        2: [0, 5, 6],
        3: [1],
        4: [1],
        5: [2],
        6: [2]
    };

    function initGraph() {
        canvas.innerHTML = '';
        
        // 1. Draw Edges (Lines) First so they sit behind the nodes
        const drawnEdges = new Set();
        Object.keys(adjacencyList).forEach(node => {
            adjacencyList[node].forEach(neighbor => {
                // Prevent drawing the same line twice (A->B and B->A)
                const edgeKey = [node, neighbor].sort().join('-');
                if (!drawnEdges.has(edgeKey)) {
                    drawEdge(node, neighbor, edgeKey);
                    drawnEdges.add(edgeKey);
                }
            });
        });

        // 2. Draw Nodes
        Object.keys(nodes).forEach(id => {
            const div = document.createElement('div');
            div.className = 'graph-node';
            div.id = `node-${id}`;
            div.textContent = nodes[id].label;
            
            // Position using percentages so it's responsive
            div.style.left = `calc(${nodes[id].x}% - 20px)`; // Center the 40px node
            div.style.top = `calc(${nodes[id].y}% - 20px)`;
            
            canvas.appendChild(div);
        });

        statusText.textContent = "Network Topology: Idle. Awaiting traversal command.";
        statusText.style.color = "var(--text-muted)";
    }

    function drawEdge(node1, node2, edgeId) {
        const n1 = nodes[node1];
        const n2 = nodes[node2];

        // We use absolute percentages. We need to calculate the hypotenuse and angle.
        // Since percentages are tricky for angles if the aspect ratio changes, 
        // we'll rely on the parent container's actual pixel width/height.
        
        const line = document.createElement('div');
        line.className = 'graph-edge';
        line.id = `edge-${edgeId}`;
        canvas.appendChild(line);

        // Update lines dynamically based on container size
        function updateLine() {
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0) return; // Hidden element
            
            const x1 = (n1.x / 100) * rect.width;
            const y1 = (n1.y / 100) * rect.height;
            const x2 = (n2.x / 100) * rect.width;
            const y2 = (n2.y / 100) * rect.height;

            const length = Math.hypot(x2 - x1, y2 - y1);
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

            line.style.width = `${length}px`;
            line.style.left = `${x1}px`;
            line.style.top = `${y1}px`;
            line.style.transform = `rotate(${angle}deg)`;
        }

        updateLine();
        window.addEventListener('resize', updateLine); // Keep lines attached on window resize
    }

    function resetVisuals() {
        document.querySelectorAll('.graph-node').forEach(n => {
            n.className = 'graph-node';
        });
        document.querySelectorAll('.graph-edge').forEach(e => {
            e.className = 'graph-edge';
        });
    }

    // --- Graph Algorithms ---

    async function runDFS() {
        globalGraphId++;
        const localId = globalGraphId;
        resetVisuals();
        
        statusText.textContent = "Executing O(V+E) DFS: Plunging deep down path A → B → D first...";
        statusText.style.color = "#ef4444"; // Danger Red

        const visited = new Set();
        
        async function explore(nodeId, parentId) {
            if (localId !== globalGraphId || visited.has(Number(nodeId))) return;
            
            visited.add(Number(nodeId));
            
            // Highlight Edge from parent
            if (parentId !== null) {
                const edgeId = [parentId, nodeId].sort().join('-');
                document.getElementById(`edge-${edgeId}`)?.classList.add('active-dfs');
            }

            // Highlight Node
            const domNode = document.getElementById(`node-${nodeId}`);
            domNode.classList.add('visiting');
            await sleep(SLEEP_MS);
            if (localId !== globalGraphId) return;

            domNode.classList.remove('visiting');
            domNode.classList.add('visited-dfs');

            // Recursive deep dive
            const neighbors = adjacencyList[nodeId];
            for (let neighbor of neighbors) {
                await explore(neighbor, nodeId);
            }
        }

        // Start at Root (0)
        await explore(0, null);
        if (localId === globalGraphId) statusText.textContent = "DFS Traversal Complete. Network fully mapped.";
    }

    async function runBFS() {
        globalGraphId++;
        const localId = globalGraphId;
        resetVisuals();
        
        statusText.textContent = "Executing O(V+E) BFS: Expanding in concentric rings (A, then B&C)...";
        statusText.style.color = "#10b981"; // Success Green

        const visited = new Set([0]);
        const queue = [{ id: 0, parent: null }];

        while (queue.length > 0) {
            if (localId !== globalGraphId) return;
            
            // Dequeue
            const current = queue.shift();
            
            // Highlight Edge
            if (current.parent !== null) {
                const edgeId = [current.parent, current.id].sort().join('-');
                document.getElementById(`edge-${edgeId}`)?.classList.add('active-bfs');
            }

            // Highlight Node
            const domNode = document.getElementById(`node-${current.id}`);
            domNode.classList.add('visiting');
            await sleep(SLEEP_MS);
            if (localId !== globalGraphId) return;

            domNode.classList.remove('visiting');
            domNode.classList.add('visited-bfs');

            // Enqueue neighbors
            for (let neighbor of adjacencyList[current.id]) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push({ id: neighbor, parent: current.id });
                }
            }
        }
        
        if (localId === globalGraphId) statusText.textContent = "BFS Traversal Complete. Shortest paths guaranteed.";
    }

    // --- Event Listeners ---
    btnDFS.addEventListener('click', runDFS);
    btnBFS.addEventListener('click', runBFS);
    btnReset.addEventListener('click', () => {
        globalGraphId++;
        resetVisuals();
        statusText.textContent = "Network Topology: Idle. Awaiting traversal command.";
        statusText.style.color = "var(--text-muted)";
    });

    initGraph();
});