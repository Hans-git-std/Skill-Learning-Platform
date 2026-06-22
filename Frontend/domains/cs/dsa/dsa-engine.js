document.addEventListener("DOMContentLoaded", () => {
    const visualizer = document.getElementById('array-visualizer');
    const btnGenerate = document.getElementById('btn-generate');
    const btnBubble = document.getElementById('btn-bubble');
    const btnQuick = document.getElementById('btn-quick');
    const btnRadix = document.getElementById('btn-radix'); // New Button
    const statusText = document.getElementById('sort-status');

    let array = [];
    const ARRAY_SIZE = 40; 
    const ANIMATION_SPEED_MS = 25; 
    
    // THE INTERRUPT SYSTEM: Tracks the currently active operation
    let globalSortId = 0; 

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 1. Memory Initialization ---
    function generateArray() {
        globalSortId++; // Instantly kills any running sort
        array = [];
        visualizer.innerHTML = '';
        statusText.textContent = "Memory Block: Unsorted Chaos";
        statusText.style.color = "var(--text-muted)";

        for (let i = 0; i < ARRAY_SIZE; i++) {
            const val = Math.floor(Math.random() * 90) + 10;
            array.push(val);
            
            const bar = document.createElement('div');
            bar.classList.add('array-bar');
            bar.style.height = `${val}%`;
            bar.id = `bar-${i}`;
            visualizer.appendChild(bar);
        }
    }

    // --- 2. DOM Manipulation Helpers ---
    function setComparing(idx1, idx2) {
        document.getElementById(`bar-${idx1}`)?.classList.add('comparing');
        document.getElementById(`bar-${idx2}`)?.classList.add('comparing');
    }

    function removeComparing(idx1, idx2) {
        document.getElementById(`bar-${idx1}`)?.classList.remove('comparing');
        document.getElementById(`bar-${idx2}`)?.classList.remove('comparing');
    }

    async function swapDOM(idx1, idx2, localSortId) {
        const bar1 = document.getElementById(`bar-${idx1}`);
        const bar2 = document.getElementById(`bar-${idx2}`);
        
        bar1.classList.add('swapping');
        bar2.classList.add('swapping');
        
        await sleep(ANIMATION_SPEED_MS);
        if (localSortId !== globalSortId) return; // Interrupt check
        
        const tempHeight = bar1.style.height;
        bar1.style.height = bar2.style.height;
        bar2.style.height = tempHeight;

        let temp = array[idx1];
        array[idx1] = array[idx2];
        array[idx2] = temp;

        bar1.classList.remove('swapping');
        bar2.classList.remove('swapping');
    }

    function markSorted(idx) {
        const bar = document.getElementById(`bar-${idx}`);
        if (bar) {
            bar.classList.add('sorted');
            bar.classList.remove('comparing', 'swapping');
        }
    }

    function resetVisuals() {
        for(let i=0; i<array.length; i++) {
            const bar = document.getElementById(`bar-${i}`);
            if(bar) bar.className = 'array-bar';
        }
    }

    // --- 3. ALGORITHMS ---

    // O(n^2) Bubble Sort
    async function bubbleSort() {
        globalSortId++;
        const localSortId = globalSortId;
        resetVisuals();
        
        statusText.textContent = "Executing O(n²) Bubble Sort...";
        statusText.style.color = "#ef4444";

        for (let i = 0; i < array.length - 1; i++) {
            for (let j = 0; j < array.length - i - 1; j++) {
                if (localSortId !== globalSortId) return; // Interrupt check
                
                setComparing(j, j + 1);
                await sleep(ANIMATION_SPEED_MS);

                if (array[j] > array[j + 1]) {
                    await swapDOM(j, j + 1, localSortId);
                }
                removeComparing(j, j + 1);
            }
            markSorted(array.length - i - 1);
        }
        markSorted(0);
        if (localSortId === globalSortId) statusText.textContent = "O(n²) Execution Complete.";
    }

    // O(n log n) Quick Sort
    async function executeQuickSort() {
        globalSortId++;
        const localSortId = globalSortId;
        resetVisuals();

        statusText.textContent = "Executing O(n log n) Quick Sort...";
        statusText.style.color = "#10b981";

        await quickSort(0, array.length - 1, localSortId);
        if (localSortId !== globalSortId) return;
        
        for (let i = 0; i < array.length; i++) {
            if (localSortId !== globalSortId) return;
            markSorted(i);
            await sleep(10); 
        }
        statusText.textContent = "O(n log n) Execution Complete.";
    }

    async function quickSort(start, end, localSortId) {
        if (start >= end || localSortId !== globalSortId) return;
        let index = await partition(start, end, localSortId);
        if (localSortId !== globalSortId) return;
        
        await Promise.all([
            quickSort(start, index - 1, localSortId),
            quickSort(index + 1, end, localSortId)
        ]);
    }

    async function partition(start, end, localSortId) {
        let pivotIndex = start;
        let pivotValue = array[end];
        document.getElementById(`bar-${end}`)?.classList.add('comparing');

        for (let i = start; i < end; i++) {
            if (localSortId !== globalSortId) return;
            document.getElementById(`bar-${i}`)?.classList.add('swapping');
            await sleep(ANIMATION_SPEED_MS);
            
            if (array[i] < pivotValue) {
                await swapDOM(i, pivotIndex, localSortId);
                document.getElementById(`bar-${pivotIndex}`)?.classList.remove('swapping');
                pivotIndex++;
            } else {
                document.getElementById(`bar-${i}`)?.classList.remove('swapping');
            }
        }
        await swapDOM(pivotIndex, end, localSortId);
        document.getElementById(`bar-${end}`)?.classList.remove('comparing');
        return pivotIndex;
    }

    // O(n * k) Radix Sort
    async function executeRadixSort() {
        globalSortId++;
        const localSortId = globalSortId;
        resetVisuals();

        statusText.textContent = "Executing O(n) Radix Sort. Sorting digit by digit...";
        statusText.style.color = "#a855f7"; // Purple

        let max = Math.max(...array);
        
        // Loop through each digit place (1s, 10s, 100s)
        for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
            if (localSortId !== globalSortId) return;
            await countingSortForRadix(exp, localSortId);
        }

        if (localSortId !== globalSortId) return;
        for (let i = 0; i < array.length; i++) {
            if (localSortId !== globalSortId) return;
            markSorted(i);
            await sleep(10);
        }
        statusText.textContent = "O(n) Radix Execution Complete.";
    }

    async function countingSortForRadix(exp, localSortId) {
        let output = new Array(array.length).fill(0);
        let count = new Array(10).fill(0);

        // Count occurrences
        for (let i = 0; i < array.length; i++) {
            count[Math.floor(array[i] / exp) % 10]++;
        }

        // Calculate positions
        for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        // Build the output array
        for (let i = array.length - 1; i >= 0; i--) {
            output[count[Math.floor(array[i] / exp) % 10] - 1] = array[i];
            count[Math.floor(array[i] / exp) % 10]--;
        }

        // Visually update the DOM to match the new bucket order
        for (let i = 0; i < array.length; i++) {
            if (localSortId !== globalSortId) return;
            array[i] = output[i];
            
            const bar = document.getElementById(`bar-${i}`);
            bar.style.height = `${array[i]}%`;
            bar.classList.add('swapping');
            await sleep(ANIMATION_SPEED_MS + 10);
            bar.classList.remove('swapping');
        }
    }

    // --- 4. Event Listeners ---
    btnGenerate.addEventListener('click', generateArray);
    btnBubble.addEventListener('click', bubbleSort);
    btnQuick.addEventListener('click', executeQuickSort);
    btnRadix.addEventListener('click', executeRadixSort); // New Listener

    // Initialize
    generateArray();
});