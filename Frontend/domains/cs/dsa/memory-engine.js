document.addEventListener("DOMContentLoaded", () => {
    const arrayGrid = document.getElementById('array-grid');
    const heapGrid = document.getElementById('heap-grid');
    const btnArray = document.getElementById('btn-array-lookup');
    const btnLL = document.getElementById('btn-ll-traverse');
    const btnReset = document.getElementById('btn-reset-mem');
    const statusText = document.getElementById('memory-status');

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    let isExecuting = false;

    // We simulate 8 blocks of memory
    const ARRAY_BASE_HEX = 4096; // 0x1000
    const DATA_MULTIPLIER = 4;   // 4 bytes per int
    
    // Linked List structure (Scattered in memory)
    const LL_NODES = [
        { id: 0, addr: '0x2A40', data: 'Val: 10', next: '0x4F12' },
        { id: null, addr: '0x3B22', data: 'Empty', next: '' },
        { id: 1, addr: '0x4F12', data: 'Val: 20', next: '0x1C88' },
        { id: null, addr: '0x5C90', data: 'Empty', next: '' },
        { id: 2, addr: '0x1C88', data: 'Val: 30', next: '0x8D34' },
        { id: 3, addr: '0x8D34', data: 'Val: 40', next: '0x9E20' },
        { id: null, addr: '0x6A11', data: 'Empty', next: '' },
        { id: 4, addr: '0x9E20', data: 'Val: 50', next: 'NULL' }
    ];

    function initMemory() {
        arrayGrid.innerHTML = '';
        heapGrid.innerHTML = '';
        statusText.textContent = "System Ready. Awaiting execution command.";
        statusText.style.color = "var(--text-muted)";

        // Build Array Memory (Perfectly contiguous)
        for(let i=0; i<8; i++) {
            const hex = '0x' + (ARRAY_BASE_HEX + (i * DATA_MULTIPLIER)).toString(16).toUpperCase();
            const div = document.createElement('div');
            div.className = 'memory-cell array-cell';
            div.id = `arr-cell-${i}`;
            
            // Only fill first 5 slots to represent a 5-element array
            const dataStr = i < 5 ? `Val: ${(i+1)*10}` : 'Empty';
            
            div.innerHTML = `<span class="mem-address">${hex}</span><span class="mem-data">${dataStr}</span>`;
            arrayGrid.appendChild(div);
        }

        // Build Heap Memory (Scattered)
        LL_NODES.forEach((node, index) => {
            const div = document.createElement('div');
            div.className = 'memory-cell ll-cell';
            div.id = `ll-cell-${index}`;
            
            let html = `<span class="mem-address">${node.addr}</span>`;
            if (node.data !== 'Empty') {
                html += `<span class="mem-data">${node.data}</span> <span class="mem-pointer">➔ ${node.next}</span>`;
            } else {
                html += `<span class="mem-data" style="opacity: 0.3;">Garbage Bytes</span>`;
            }
            
            div.innerHTML = html;
            heapGrid.appendChild(div);
        });
    }

    function resetHighlights() {
        document.querySelectorAll('.memory-cell').forEach(cell => {
            cell.classList.remove('array-active', 'll-active', 'll-visited');
        });
    }

    async function executeArrayMath() {
        if (isExecuting) return;
        isExecuting = true;
        resetHighlights();

        statusText.textContent = "Calculating: 0x1000 + (4 * 4) = 0x1010. Jumping directly to memory address...";
        statusText.style.color = "#10b981";

        await sleep(600); // Artificial delay to let user read the text
        
        const targetCell = document.getElementById('arr-cell-4');
        targetCell.classList.add('array-active');
        
        statusText.textContent = "O(1) Complete. CPU instantly fetched 'Val: 50' without scanning other blocks.";
        isExecuting = false;
    }

    async function executeLLTraversal() {
        if (isExecuting) return;
        isExecuting = true;
        resetHighlights();

        statusText.textContent = "Starting at Base Address 0x2A40. Chasing pointers...";
        statusText.style.color = "#a855f7";

        // We have to physically jump around the nodes based on pointers
        const traverseOrder = [0, 2, 4, 5, 7]; // Indexes in the DOM array that hold the nodes
        
        for(let i=0; i<traverseOrder.length; i++) {
            const domIndex = traverseOrder[i];
            const cell = document.getElementById(`ll-cell-${domIndex}`);
            
            cell.classList.add('ll-active');
            
            if (i === traverseOrder.length - 1) {
                statusText.textContent = `O(n) Complete. Finally reached Target Node 4 at ${LL_NODES[domIndex].addr}.`;
            } else {
                statusText.textContent = `Read Address ${LL_NODES[domIndex].addr}. Pointer says go to ${LL_NODES[domIndex].next}...`;
            }

            await sleep(800); // Simulate expensive RAM fetch / Cache Miss
            
            if (i !== traverseOrder.length - 1) {
                cell.classList.remove('ll-active');
                cell.classList.add('ll-visited');
            }
        }
        isExecuting = false;
    }

    // Event Listeners
    btnArray.addEventListener('click', executeArrayMath);
    btnLL.addEventListener('click', executeLLTraversal);
    btnReset.addEventListener('click', () => {
        if(!isExecuting) {
            resetHighlights();
            statusText.textContent = "System Ready. Awaiting execution command.";
            statusText.style.color = "var(--text-muted)";
        }
    });

    initMemory();
});