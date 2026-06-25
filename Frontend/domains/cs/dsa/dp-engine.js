document.addEventListener("DOMContentLoaded", () => {
    const gridContainer = document.getElementById('dp-grid');
    const btnRun = document.getElementById('btn-dp-run');
    const btnReset = document.getElementById('btn-dp-reset');
    const statusText = document.getElementById('dp-status');

    let globalDpId = 0; // Interrupt system
    const SLEEP_MS = 150; // Speed of calculation

    const ROWS = 6;
    const COLS = 6;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function initGrid() {
        globalDpId++;
        gridContainer.innerHTML = '';
        
        // Dynamically set CSS Grid columns based on our constant
        gridContainer.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
        
        statusText.textContent = "DP Table: Uninitialized (0s). Waiting to build cache.";
        statusText.style.color = "var(--text-muted)";

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'dp-cell';
                cell.id = `dp-${r}-${c}`;
                cell.textContent = '0';
                gridContainer.appendChild(cell);
            }
        }
    }

    function resetHighlights() {
        document.querySelectorAll('.dp-cell').forEach(cell => {
            cell.classList.remove('calculating', 'source-cell', 'computed', 'base-case', 'target-cell');
        });
    }

    async function runTabulation() {
        globalDpId++;
        const localId = globalDpId;
        
        // Soft reset: Keep grid structure, but clear numbers and colors
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.getElementById(`dp-${r}-${c}`);
                cell.textContent = '0';
                cell.className = 'dp-cell';
            }
        }

        statusText.textContent = "Step 1: Initializing Base Cases (Top Row & Left Col = 1 way to reach)";
        statusText.style.color = "#3b82f6"; // Blue

        // --- Step 1: Base Cases ---
        // Top row and left column only have 1 way to be reached (moving straight right or straight down)
        for (let r = 0; r < ROWS; r++) {
            if (localId !== globalDpId) return;
            const cell = document.getElementById(`dp-${r}-0`);
            cell.textContent = '1';
            cell.classList.add('base-case');
            await sleep(50);
        }
        for (let c = 1; c < COLS; c++) {
            if (localId !== globalDpId) return;
            const cell = document.getElementById(`dp-0-${c}`);
            cell.textContent = '1';
            cell.classList.add('base-case');
            await sleep(50);
        }

        await sleep(500);
        if (localId !== globalDpId) return;

        statusText.textContent = "Step 2: Bottom-Up Tabulation. Reusing cached answers...";
        statusText.style.color = "#f59e0b"; // Orange

        // --- Step 2: Tabulation (Filling the cache) ---
        for (let r = 1; r < ROWS; r++) {
            for (let c = 1; c < COLS; c++) {
                if (localId !== globalDpId) return;

                const topCell = document.getElementById(`dp-${r-1}-${c}`);
                const leftCell = document.getElementById(`dp-${r}-${c-1}`);
                const currentCell = document.getElementById(`dp-${r}-${c}`);

                // Highlight sources
                topCell.classList.add('source-cell');
                leftCell.classList.add('source-cell');
                currentCell.classList.add('calculating');

                await sleep(SLEEP_MS);
                if (localId !== globalDpId) return;

                // O(1) Math using cached data
                const topVal = parseInt(topCell.textContent);
                const leftVal = parseInt(leftCell.textContent);
                currentCell.textContent = topVal + leftVal;

                await sleep(SLEEP_MS);
                if (localId !== globalDpId) return;

                // Cleanup highlights
                topCell.classList.remove('source-cell');
                leftCell.classList.remove('source-cell');
                currentCell.classList.remove('calculating');
                currentCell.classList.add('computed');
            }
        }

        if (localId !== globalDpId) return;

        // --- Step 3: The Target ---
        const targetCell = document.getElementById(`dp-${ROWS-1}-${COLS-1}`);
        targetCell.classList.remove('computed');
        targetCell.classList.add('target-cell');

        statusText.textContent = `O(n*m) Execution Complete! Total unique paths: ${targetCell.textContent}`;
        statusText.style.color = "#10b981"; // Green
    }

    // --- Event Listeners ---
    btnRun.addEventListener('click', runTabulation);
    btnReset.addEventListener('click', initGrid);

    // Startup
    initGrid();
});