document.addEventListener("DOMContentLoaded", () => {
    let keys = [];
    let hasSplit = false;

    const input = document.getElementById('node-value');
    const insertBtn = document.getElementById('insert-btn');
    const resetBtn = document.getElementById('reset-btn');
    const rootLevel = document.getElementById('root-level');
    const leafLevel = document.getElementById('leaf-level');

    // Core render function
    function render() {
        rootLevel.innerHTML = '';
        leafLevel.innerHTML = '';

        if (!hasSplit) {
            // Stage 1: Filling a single page
            const node = createNode(keys, 3);
            rootLevel.appendChild(node);
            
            // If it hits 4, trigger the split
            if (keys.length > 3) {
                setTimeout(() => {
                    hasSplit = true;
                    render();
                }, 400); // Small delay so the user sees it overflow first
            }
        } else {
            // Stage 2: Page has split. Find median and promote it.
            const medianIndex = Math.floor(keys.length / 2);
            const median = keys[medianIndex];
            
            const leftKeys = keys.slice(0, medianIndex);
            const rightKeys = keys.slice(medianIndex + 1);

            const rootNode = createNode([median], 1, true); // Root
            const leftNode = createNode(leftKeys, 2);       // Left Leaf
            const rightNode = createNode(rightKeys, 2);     // Right Leaf

            rootLevel.appendChild(rootNode);
            leafLevel.appendChild(leftNode);
            leafLevel.appendChild(rightNode);
        }
    }

    // Helper to generate the HTML blocks dynamically
    function createNode(dataArray, minSize, isRoot = false) {
        const div = document.createElement('div');
        div.className = 'db-node';
        
        // Ensure the node visually has enough slots
        const slots = Math.max(dataArray.length, minSize);
        
        for (let i = 0; i < slots; i++) {
            const span = document.createElement('span');
            span.className = 'node-cell';
            
            if (i < dataArray.length) {
                span.textContent = dataArray[i];
                if (isRoot) span.classList.add('promoted');
            } else {
                span.textContent = '-';
                span.classList.add('empty');
            }
            div.appendChild(span);
        }
        return div;
    }

    // Event Listeners
    insertBtn.addEventListener('click', processInput);
    
    // Allow hitting 'Enter' to insert
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processInput();
    });

    function processInput() {
        const val = parseInt(input.value);
        if (!isNaN(val) && !keys.includes(val)) {
            keys.push(val);
            keys.sort((a, b) => a - b); // Database indexes are always sorted
            input.value = '';
            render();
        }
    }

    resetBtn.addEventListener('click', () => {
        keys = [];
        hasSplit = false;
        render();
    });

    // Initial render of empty node
    render();
});