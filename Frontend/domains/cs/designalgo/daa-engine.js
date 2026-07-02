document.addEventListener('DOMContentLoaded', () => {
    injectEngineStyles();
    initChapter1();
    initChapter2();
    initChapter3();
    initChapter4();
    initChapter5();
    initChapter6();
    initChapter7();
    initChapter8();
    initChapter9();
    initChapter10();
});

function injectEngineStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Step 3.1 Simulator Styles */
        .race-lane { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .algo-label { width: 90px; font-family: var(--font-mono); font-weight: bold; text-align: right; }
        .track { flex-grow: 1; height: 30px; background: rgba(0,0,0,0.1); border-radius: 15px; overflow: hidden; position: relative; box-shadow: inset 0 2px 5px rgba(0,0,0,0.2); }
        [data-theme="dark"] .track { background: rgba(255,255,255,0.05); }
        .particle-bar { height: 100%; width: 0%; border-radius: 15px; transition: width 0.1s linear, box-shadow 0.2s ease; background-image: linear-gradient(90deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent); background-size: 20px 20px; animation: move-stripes 1s linear infinite; }
        @keyframes move-stripes { 0% { background-position: 0 0; } 100% { background-position: 20px 0; } }

        /* Ch2 Fractal Tree */
        .fractal-container { height: 400px; display: flex; justify-content: center; position: relative; perspective: 1000px; overflow: hidden !important; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color); margin-top: 1.5rem; }
        .array-block { display: inline-flex; padding: 4px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 15px 35px rgba(0,0,0,0.15); transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); position: absolute; transform-style: preserve-3d; }
        .array-cell { width: 35px; height: 45px; display: flex; justify-content: center; align-items: center; border-right: 1px solid var(--border-color); font-family: var(--font-mono); font-weight: bold; color: var(--accent-neon); background: var(--bg-primary); }
        .array-cell:last-child { border-right: none; }
        .array-cell.sorted { background: rgba(16, 185, 129, 0.2); color: var(--accent-green); }

        /* Ch3 Huffman */
        .huffman-container { height: 450px; position: relative; overflow: hidden !important; background: radial-gradient(circle at center, var(--bg-panel) 0%, var(--bg-secondary) 100%); border-radius: 8px; margin-top: 1.5rem; border: 1px solid var(--border-color); box-shadow: inset 0 0 20px rgba(0,0,0,0.05); }
        .huffman-node { width: 46px; height: 46px; border-radius: 50%; background: var(--accent-purple); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; position: absolute; box-shadow: 0 5px 15px rgba(109, 40, 217, 0.4); transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); font-family: var(--font-mono); z-index: 2; transform: translate(-50%, -50%); border: 2px solid rgba(255,255,255,0.2); }
        .huffman-node.leaf { background: var(--accent-neon); box-shadow: 0 5px 15px rgba(6, 182, 212, 0.4); }
        .huffman-node .char { font-weight: bold; font-size: 1.1rem; line-height: 1; }
        .huffman-node .freq { font-size: 0.65rem; opacity: 0.9; margin-top: 2px; }
        .huffman-edge { position: absolute; background: var(--border-color); height: 2px; transform-origin: 0 50%; z-index: 1; transition: all 0.8s ease-out; opacity: 0; }
        .huffman-edge.visible { opacity: 1; }
        .huffman-label { position: absolute; color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.8rem; font-weight: bold; z-index: 3; transition: all 0.8s ease-out; opacity: 0; background: var(--bg-primary); padding: 0 4px; border-radius: 4px; }
        .compression-stats { text-align: center; margin-top: 1.5rem; font-family: var(--font-mono); font-size: 1.1rem; padding: 1rem; background: var(--bg-panel); border-radius: 8px; }
        .compression-stats span { font-weight: bold; color: var(--accent-green); }

        /* Ch4 DP Matrix */
        .fib-node { position: absolute; padding: 5px 10px; background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-mono); font-weight: bold; transition: all 0.3s; transform: translate(-50%, 0); z-index: 2; }
        .fib-node.computing { border-color: var(--accent-neon); box-shadow: 0 0 10px rgba(6, 182, 212, 0.5); }
        .fib-node.cached { border-color: var(--accent-green); background: rgba(16, 185, 129, 0.2); }
        .fib-node.redundant { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); }
        .fib-edge { position: absolute; width: 2px; background: var(--border-color); transform-origin: top center; z-index: 1; }
        .cache-cell { display: flex; justify-content: space-between; padding: 5px 10px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-mono); }
        .cache-cell.hit { background: rgba(16, 185, 129, 0.2); border-color: var(--accent-green); }
        
        /* Ch5 Knapsack */
        .knapsack-grid { display: grid; gap: 4px; padding: 10px; background: var(--bg-panel); border-radius: 8px; font-family: var(--font-mono); }
        .ks-cell { display: flex; justify-content: center; align-items: center; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; width: 40px; height: 40px; font-weight: bold; transition: all 0.3s; }
        .ks-cell.header { background: var(--bg-secondary); color: var(--accent-neon); border: none; }
        .ks-cell.active { background: rgba(139, 92, 246, 0.2); border-color: var(--accent-purple); box-shadow: 0 0 10px rgba(139, 92, 246, 0.5); transform: scale(1.1); z-index: 10; }
        .ks-cell.checking { background: rgba(245, 158, 11, 0.2); border-color: var(--accent-warning); }

        /* Ch6 N-Queens */
        .chess-board { display: grid; grid-template-columns: repeat(4, 60px); grid-template-rows: repeat(4, 60px); gap: 2px; border: 4px solid var(--border-color); background: var(--border-color); margin: 0 auto; width: max-content; }
        .chess-cell { background: var(--bg-primary); display: flex; justify-content: center; align-items: center; font-size: 2rem; transition: all 0.3s; position: relative; }
        .chess-cell:nth-child(odd) { background: var(--bg-secondary); }
        .chess-row:nth-child(even) .chess-cell:nth-child(odd), .chess-row:nth-child(odd) .chess-cell:nth-child(even) { background: var(--bg-primary); }
        .chess-row:nth-child(even) .chess-cell:nth-child(even), .chess-row:nth-child(odd) .chess-cell:nth-child(odd) { background: var(--bg-secondary); }
        .queen { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; text-shadow: 0 0 10px var(--accent-neon); }
        .queen.invalid { color: #ef4444; text-shadow: 0 0 10px rgba(239, 68, 68, 0.8); }
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

        /* Ch7 TSP */
        .tsp-container { height: 350px; position: relative; background: var(--bg-panel); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; }
        .tsp-node { position: absolute; width: 40px; height: 40px; border-radius: 50%; background: var(--bg-primary); border: 2px solid var(--accent-neon); display: flex; justify-content: center; align-items: center; font-family: var(--font-mono); font-weight: bold; z-index: 2; transition: all 0.3s; }
        .tsp-node.visited { background: var(--accent-neon); color: var(--bg-primary); }
        .tsp-edge { position: absolute; height: 2px; background: var(--border-color); transform-origin: 0 50%; z-index: 1; transition: all 0.3s; }
        .tsp-edge.active { background: var(--accent-neon); box-shadow: 0 0 8px var(--accent-neon); height: 3px; z-index: 1; }
        .tsp-edge.pruned { background: #ef4444; opacity: 0.3; }
        .tsp-info { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 6px; font-family: var(--font-mono); color: white; z-index: 10; border: 1px solid var(--border-color); }

        /* Ch8 Dijkstra */
        .graph-area { height: 350px; position: relative; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; margin-top: 1rem; }
        .dnode { position: absolute; width: 40px; height: 40px; border-radius: 50%; background: var(--bg-panel); border: 2px solid var(--border-color); display: flex; justify-content: center; align-items: center; font-family: var(--font-mono); font-weight: bold; z-index: 2; transition: all 0.3s; transform: translate(-50%, -50%); }
        .dnode.active { border-color: var(--accent-neon); box-shadow: 0 0 15px var(--accent-neon); }
        .dnode.settled { background: var(--accent-purple); color: white; border-color: var(--accent-purple); }
        .dedge { position: absolute; height: 2px; background: var(--border-color); transform-origin: 0 50%; z-index: 1; transition: all 0.3s; }
        .dedge.active { background: var(--accent-neon); height: 4px; z-index: 2; }

        /* Ch9 KMP */
        .kmp-container { padding: 2rem 1rem; background: var(--bg-panel); border-radius: 8px; border: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 1.5rem; overflow-x: auto; margin-top: 1rem; }
        .kmp-row { display: flex; gap: 4px; margin-bottom: 10px; position: relative; transition: transform 0.5s ease-in-out; }
        .kmp-char { width: 35px; height: 45px; display: flex; justify-content: center; align-items: center; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; }
        .kmp-char.match { background: rgba(16, 185, 129, 0.2); border-color: var(--accent-green); color: var(--accent-green); }
        .kmp-char.mismatch { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; }

        /* Ch10 Gravity Well */
        .gravity-well { height: 350px; position: relative; background: radial-gradient(circle at center, #000 0%, var(--bg-primary) 70%); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; display: flex; justify-content: center; align-items: center; margin-top: 1rem; }
        .black-hole { width: 100px; height: 100px; border-radius: 50%; background: black; box-shadow: 0 0 40px 10px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(255,255,255,0.1); position: relative; animation: pulseHole 3s infinite alternate; }
        @keyframes pulseHole { 0% { box-shadow: 0 0 30px 5px rgba(139, 92, 246, 0.3); transform: scale(1); } 100% { box-shadow: 0 0 50px 15px rgba(139, 92, 246, 0.6); transform: scale(1.05); } }
        .complexity-bubble { position: absolute; padding: 10px 15px; border-radius: 20px; background: rgba(255,255,255,0.1); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.2); font-family: var(--font-mono); font-weight: bold; transition: all 1s ease-in; }
        .bubble-p { top: 20%; left: 10%; border-color: var(--accent-green); color: var(--accent-green); }
        .bubble-np { bottom: 20%; right: 10%; border-color: var(--accent-neon); color: var(--accent-neon); }
        .bubble-nphard { top: 30%; right: 20%; border-color: #ef4444; color: #ef4444; }
        .event-horizon { position: absolute; border: 1px dashed rgba(255,255,255,0.2); border-radius: 50%; width: 250px; height: 250px; animation: spin 20s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}

// -------------------------------------------
// Chapter 1: Big-O Particle Race
// -------------------------------------------
function initChapter1() {
    const container = document.getElementById('sim-ch1');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls">
            <div style="display:flex; align-items:center; gap: 1rem; width: 100%;">
                <label style="font-family: var(--font-mono); font-weight: bold; min-width: 160px; font-size: 1.1rem;">Input Size (n): <span id="ch1-n-val" style="color:var(--accent-neon);">10</span></label>
                <input type="range" id="ch1-slider" min="1" max="100" value="10" style="flex-grow: 1; cursor: pointer; accent-color: var(--accent-neon);">
            </div>
        </div>
        <div class="architecture-layout" style="display:flex; flex-direction:column; width:100%; margin-top: 1.5rem;">
            <div class="race-lane"><span class="algo-label">O(1)</span><div class="track"><div class="particle-bar" id="bar-o1" style="background:var(--accent-green);"></div></div></div>
            <div class="race-lane"><span class="algo-label">O(log n)</span><div class="track"><div class="particle-bar" id="bar-ologn" style="background:var(--accent-neon);"></div></div></div>
            <div class="race-lane"><span class="algo-label">O(n)</span><div class="track"><div class="particle-bar" id="bar-on" style="background:var(--accent-purple);"></div></div></div>
            <div class="race-lane"><span class="algo-label">O(n log n)</span><div class="track"><div class="particle-bar" id="bar-onlogn" style="background:var(--accent-warning);"></div></div></div>
            <div class="race-lane"><span class="algo-label">O(n²)</span><div class="track"><div class="particle-bar" id="bar-on2" style="background:#ef4444;"></div></div></div>
        </div>
        <p class="engine-caption" style="text-align:center; margin-top:1rem; opacity:0.8; font-size:0.9rem;">Slide 'n' to witness how quadratic time explodes exponentially compared to logarithmic time.</p>
    `;

    const slider = document.getElementById('ch1-slider');
    const valDisplay = document.getElementById('ch1-n-val');
    const bars = {
        'o1': document.getElementById('bar-o1'),
        'ologn': document.getElementById('bar-ologn'),
        'on': document.getElementById('bar-on'),
        'onlogn': document.getElementById('bar-onlogn'),
        'on2': document.getElementById('bar-on2')
    };

    function updateRace() {
        const n = parseInt(slider.value);
        valDisplay.innerText = n;
        
        const scaleFactor = 10000;
        
        const o1 = 50; 
        const ologn = Math.log2(n) * 150;
        const on = n * 40;
        const onlogn = n * Math.log2(n) * 12;
        const on2 = n * n;

        const mapW = (val) => Math.min((Math.pow(val, 0.7) / Math.pow(scaleFactor, 0.7)) * 100, 100);

        bars['o1'].style.width = mapW(o1) + '%';
        bars['ologn'].style.width = mapW(ologn) + '%';
        bars['on'].style.width = mapW(on) + '%';
        bars['onlogn'].style.width = mapW(onlogn) + '%';
        bars['on2'].style.width = mapW(on2) + '%';
        
        bars['on2'].style.boxShadow = n > 50 ? `0 0 ${n-50}px rgba(239, 68, 68, ${n/100})` : 'none';
    }

    slider.addEventListener('input', updateRace);
    updateRace();
}

// -------------------------------------------
// Chapter 2: Fractal Recursion Tree
// -------------------------------------------
function initChapter2() {
    const container = document.getElementById('sim-ch2');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <button id="btn-ch2-run" class="btn-retro primary-btn">Execute Merge Sort Split</button>
            <button id="btn-ch2-reset" class="btn-retro secondary-btn">Reset Memory</button>
        </div>
        <div class="fractal-container" id="ch2-fractal-area"></div>
    `;

    const runBtn = document.getElementById('btn-ch2-run');
    const resetBtn = document.getElementById('btn-ch2-reset');
    const area = document.getElementById('ch2-fractal-area');

    let baseArray = [38, 27, 43, 3, 9, 82, 10, 19];
    let isRunning = false;

    function createBlock(arr, x, y, z, id) {
        const block = document.createElement('div');
        block.className = 'array-block';
        block.id = id;
        block.style.left = `calc(50% - ${arr.length * 17.5}px)`;
        block.style.top = `${y}px`;
        block.style.transform = `translate3d(${x}px, 0px, ${z}px)`;
        
        arr.forEach(num => {
            const cell = document.createElement('div');
            cell.className = 'array-cell';
            cell.innerText = num;
            block.appendChild(cell);
        });
        return block;
    }

    function renderInitial() {
        area.innerHTML = '';
        const root = createBlock(baseArray, 0, 20, 0, 'node-root');
        area.appendChild(root);
    }

    async function executeMergeSortViz() {
        if(isRunning) return;
        isRunning = true;
        
        const root = document.getElementById('node-root');
        
        // Level 1 split
        await sleep(800);
        root.style.opacity = '0.3';
        
        const l1_left = createBlock([38, 27, 43, 3], -100, 100, 100, 'node-l1-left');
        const l1_right = createBlock([9, 82, 10, 19], 100, 100, -100, 'node-l1-right');
        area.appendChild(l1_left);
        area.appendChild(l1_right);

        // Level 2 split
        await sleep(1000);
        l1_left.style.opacity = '0.3';
        l1_right.style.opacity = '0.3';

        const l2_1 = createBlock([38, 27], -180, 180, 200, 'node-l2-1');
        const l2_2 = createBlock([43, 3], -40, 180, 50, 'node-l2-2');
        const l2_3 = createBlock([9, 82], 40, 180, -50, 'node-l2-3');
        const l2_4 = createBlock([10, 19], 180, 180, -200, 'node-l2-4');
        area.appendChild(l2_1); area.appendChild(l2_2);
        area.appendChild(l2_3); area.appendChild(l2_4);

        // Merge Base (Simplification for visual brevity)
        await sleep(1000);
        l2_1.innerHTML = '<div class="array-cell sorted">27</div><div class="array-cell sorted">38</div>';
        l2_2.innerHTML = '<div class="array-cell sorted">3</div><div class="array-cell sorted">43</div>';
        l2_3.innerHTML = '<div class="array-cell sorted">9</div><div class="array-cell sorted">82</div>';
        l2_4.innerHTML = '<div class="array-cell sorted">10</div><div class="array-cell sorted">19</div>';

        // Merge L1
        await sleep(1000);
        l2_1.style.opacity = '0'; l2_2.style.opacity = '0'; l2_3.style.opacity = '0'; l2_4.style.opacity = '0';
        l1_left.style.opacity = '1'; l1_right.style.opacity = '1';
        l1_left.innerHTML = '<div class="array-cell sorted">3</div><div class="array-cell sorted">27</div><div class="array-cell sorted">38</div><div class="array-cell sorted">43</div>';
        l1_right.innerHTML = '<div class="array-cell sorted">9</div><div class="array-cell sorted">10</div><div class="array-cell sorted">19</div><div class="array-cell sorted">82</div>';

        // Merge Root
        await sleep(1000);
        l1_left.style.opacity = '0'; l1_right.style.opacity = '0';
        root.style.opacity = '1';
        root.innerHTML = '<div class="array-cell sorted">3</div><div class="array-cell sorted">9</div><div class="array-cell sorted">10</div><div class="array-cell sorted">19</div><div class="array-cell sorted">27</div><div class="array-cell sorted">38</div><div class="array-cell sorted">43</div><div class="array-cell sorted">82</div>';
        root.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.5)';

        isRunning = false;
    }

    runBtn.addEventListener('click', executeMergeSortViz);
    resetBtn.addEventListener('click', () => { if(!isRunning) renderInitial(); });

    renderInitial();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// -------------------------------------------
// Chapter 3: Holographic Huffman Compressor
// -------------------------------------------
function initChapter3() {
    const container = document.getElementById('sim-ch3');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <input type="text" id="ch3-input" value="BEEP BOOP" class="btn-retro" style="background:var(--bg-panel); color:var(--text-primary); text-transform:none; font-family:var(--font-mono); font-size:1.1rem; width:250px;">
            <button id="btn-ch3-run" class="btn-retro primary-btn">Generate Huffman Tree</button>
        </div>
        <div class="huffman-container" id="ch3-huffman-area"></div>
        <div class="compression-stats" id="ch3-stats">
            Awaiting Data Sequence...
        </div>
    `;

    const input = document.getElementById('ch3-input');
    const runBtn = document.getElementById('btn-ch3-run');
    const area = document.getElementById('ch3-huffman-area');
    const stats = document.getElementById('ch3-stats');
    let isRunning = false;

    async function buildHuffman() {
        if(isRunning) return;
        isRunning = true;
        area.innerHTML = '';
        
        const text = input.value.toUpperCase() || "DAA";
        const freqMap = {};
        for(let char of text) freqMap[char] = (freqMap[char] || 0) + 1;
        
        class HNode {
            constructor(char, freq, left=null, right=null) {
                this.char = char; this.freq = freq; this.left = left; this.right = right;
                this.id = 'hnode_' + Math.random().toString(36).substr(2, 9);
            }
        }

        let pq = Object.keys(freqMap).map(k => new HNode(k, freqMap[k]));
        
        const nodesDOM = {};
        
        const renderNode = (n, x, y, isLeaf) => {
            const el = document.createElement('div');
            el.className = 'huffman-node' + (isLeaf ? ' leaf' : '');
            el.id = n.id;
            el.innerHTML = `<span class="char">${n.char===' '?'_':n.char}</span><span class="freq">${n.freq}</span>`;
            el.style.left = `${x}%`;
            el.style.top = `${y}px`;
            area.appendChild(el);
            nodesDOM[n.id] = {el, x, y};
            return el;
        };

        const drawEdge = (n1, n2, bit) => {
            const el1 = nodesDOM[n1.id].el; const el2 = nodesDOM[n2.id].el;
            const x1 = nodesDOM[n1.id].x; const y1 = nodesDOM[n1.id].y;
            const x2 = nodesDOM[n2.id].x; const y2 = nodesDOM[n2.id].y;
            
            const line = document.createElement('div');
            line.className = 'huffman-edge';
            
            const w = area.offsetWidth;
            const px1 = (x1 / 100) * w; const py1 = y1;
            const px2 = (x2 / 100) * w; const py2 = y2;
            
            const length = Math.sqrt((px2-px1)**2 + (py2-py1)**2);
            const angle = Math.atan2(py2-py1, px2-px1) * 180 / Math.PI;
            
            line.style.width = `${length}px`;
            line.style.left = `${px1}px`;
            line.style.top = `${py1}px`;
            line.style.transform = `rotate(${angle}deg)`;
            
            area.appendChild(line);
            
            const lbl = document.createElement('div');
            lbl.className = 'huffman-label';
            lbl.innerText = bit;
            lbl.style.left = `${(px1+px2)/2}px`;
            lbl.style.top = `${(py1+py2)/2 - 10}px`;
            area.appendChild(lbl);

            setTimeout(() => { line.classList.add('visible'); lbl.style.opacity=1; }, 50);
        };

        const totalLeaves = pq.length;
        let spacing = 100 / (totalLeaves + 1);
        pq.sort((a,b) => a.freq - b.freq); 
        
        pq.forEach((n, idx) => {
            renderNode(n, spacing * (idx+1), 380, true);
        });

        await sleep(800);

        let currentY = 280;
        
        while(pq.length > 1) {
            pq.sort((a,b) => a.freq - b.freq);
            let left = pq.shift();
            let right = pq.shift();
            
            let parent = new HNode('*', left.freq + right.freq, left, right);
            pq.push(parent);
            
            let midX = (nodesDOM[left.id].x + nodesDOM[right.id].x) / 2;
            renderNode(parent, midX, currentY, false);
            
            drawEdge(parent, left, '0');
            drawEdge(parent, right, '1');
            
            currentY -= 60; 
            await sleep(600);
        }

        const uncompressedBits = text.length * 8;
        const calculateBits = (node, depth) => {
            if(!node) return 0;
            if(!node.left && !node.right) return depth * node.freq;
            return calculateBits(node.left, depth+1) + calculateBits(node.right, depth+1);
        };
        const compressedBits = calculateBits(pq[0], 0);
        const ratio = ((1 - compressedBits/uncompressedBits)*100).toFixed(1);

        stats.innerHTML = `Original: ${uncompressedBits} bits | Compressed: <span>${compressedBits} bits</span> | Saved: <span>${ratio}%</span>`;
        
        isRunning = false;
    }

    runBtn.addEventListener('click', buildHuffman);
}

// -------------------------------------------
// Chapter 4: Memoization Matrix (Fibonacci)
// -------------------------------------------
function initChapter4() {
    const container = document.getElementById('sim-ch4');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <button id="btn-ch4-run" class="btn-retro primary-btn">Calculate Fib(5)</button>
            <button id="btn-ch4-reset" class="btn-retro secondary-btn">Clear Cache</button>
        </div>
        <div style="display:flex; gap:1rem; height: 350px; width:100%;">
            <div class="sys-component" style="flex:1; position:relative; overflow:hidden; border-radius:8px;" id="ch4-tree">
            </div>
            <div class="sys-component" style="width:200px; display:flex; flex-direction:column; align-items:center; border-radius:8px;">
                <h4 style="margin-top:0;">DP Cache</h4>
                <div id="ch4-cache" style="display:flex; flex-direction:column; gap:5px; width:100%; overflow-y:auto; flex:1;">
                </div>
            </div>
        </div>
    `;

    const treeArea = document.getElementById('ch4-tree');
    const cacheArea = document.getElementById('ch4-cache');
    const runBtn = document.getElementById('btn-ch4-run');
    const resetBtn = document.getElementById('btn-ch4-reset');
    
    let isRunning = false;
    let cache = {};
    let nodeCounter = 0;

    function reset() {
        if(isRunning) return;
        treeArea.innerHTML = '';
        cacheArea.innerHTML = '';
        cache = {};
        nodeCounter = 0;
    }

    function renderCache() {
        cacheArea.innerHTML = '';
        Object.keys(cache).sort().forEach(k => {
            const el = document.createElement('div');
            el.className = 'cache-cell';
            el.id = `cache-f${k}`;
            el.innerHTML = `<span>F(${k})</span><span>${cache[k]}</span>`;
            cacheArea.appendChild(el);
        });
    }

    function highlightCache(n) {
        const el = document.getElementById(`cache-f${n}`);
        if(el) {
            el.classList.add('hit');
            setTimeout(() => el.classList.remove('hit'), 500);
        }
    }

    async function fib(n, x, y, width) {
        nodeCounter++;
        const id = 'fib-' + nodeCounter;
        
        const node = document.createElement('div');
        node.className = 'fib-node computing';
        node.id = id;
        node.innerText = `F(${n})`;
        node.style.left = `${x}%`;
        node.style.top = `${y}px`;
        treeArea.appendChild(node);

        await sleep(400);

        if (cache[n] !== undefined) {
            node.classList.remove('computing');
            node.classList.add('redundant');
            node.innerText = `F(${n}) = ${cache[n]}`;
            highlightCache(n);
            await sleep(400);
            return cache[n];
        }

        let res;
        if (n <= 1) {
            res = n;
        } else {
            const drawEdge = (dx, dy) => {
                const edge = document.createElement('div');
                edge.className = 'fib-edge';
                const len = Math.sqrt(dx*dx + dy*dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                edge.style.height = `${len}px`;
                edge.style.left = `${x}%`;
                edge.style.top = `${y + 15}px`;
                edge.style.transform = `rotate(${angle - 90}deg)`;
                treeArea.appendChild(edge);
            };
            
            drawEdge(-width/2, 60);
            const leftVal = await fib(n - 1, x - width/4, y + 60, width/2);
            
            drawEdge(width/2, 60);
            const rightVal = await fib(n - 2, x + width/4, y + 60, width/2);
            
            res = leftVal + rightVal;
        }

        cache[n] = res;
        renderCache();
        node.classList.remove('computing');
        node.classList.add('cached');
        node.innerText = `F(${n}) = ${res}`;
        await sleep(400);
        return res;
    }

    runBtn.addEventListener('click', async () => {
        if(isRunning) return;
        isRunning = true;
        reset();
        await fib(5, 50, 20, 100);
        isRunning = false;
    });

    resetBtn.addEventListener('click', reset);
}

// -------------------------------------------
// Chapter 5: 0/1 Geometric Knapsack
// -------------------------------------------
function initChapter5() {
    const container = document.getElementById('sim-ch5');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <button id="btn-ch5-run" class="btn-retro primary-btn">Run DP Knapsack</button>
            <button id="btn-ch5-reset" class="btn-retro secondary-btn">Reset Grid</button>
        </div>
        <div style="display:flex; gap:2rem; justify-content:center; flex-wrap:wrap;">
            <div class="knapsack-grid" id="ch5-grid"></div>
            <div class="sys-component" id="ch5-inspector" style="width:250px; display:flex; flex-direction:column; gap:10px;">
                <h4 style="margin:0;">Item Pool</h4>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:0.9rem; border-bottom:1px solid var(--border-color); padding-bottom:5px;"><span>Item</span><span>Wt</span><span>Val</span></div>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:0.9rem;"><span>A</span><span>1</span><span>$10</span></div>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:0.9rem;"><span>B</span><span>2</span><span>$15</span></div>
                <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:0.9rem;"><span>C</span><span>3</span><span>$40</span></div>
                <h4 style="margin:1rem 0 0 0;">Evaluation</h4>
                <div id="ch5-eval" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary); min-height:80px; background:var(--bg-primary); padding:10px; border-radius:4px; border:1px solid var(--border-color);">
                    Waiting to start...
                </div>
            </div>
        </div>
    `;

    const grid = document.getElementById('ch5-grid');
    const evalBox = document.getElementById('ch5-eval');
    const runBtn = document.getElementById('btn-ch5-run');
    const resetBtn = document.getElementById('btn-ch5-reset');
    
    const items = [{w:0,v:0}, {w:1,v:10}, {w:2,v:15}, {w:3,v:40}];
    const W = 4;
    let isRunning = false;
    let cells = [];

    function initGrid() {
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `auto repeat(${W+1}, 40px)`;
        cells = [];
        
        grid.appendChild(createCell('W:', 'header'));
        for(let w=0; w<=W; w++) grid.appendChild(createCell(w, 'header'));
        
        for(let i=0; i<items.length; i++) {
            grid.appendChild(createCell(i===0? '0' : String.fromCharCode(64+i), 'header'));
            cells[i] = [];
            for(let w=0; w<=W; w++) {
                const c = createCell('0');
                cells[i][w] = c;
                grid.appendChild(c);
            }
        }
        evalBox.innerHTML = 'Waiting to start...';
    }

    function createCell(text, className='') {
        const c = document.createElement('div');
        c.className = `ks-cell ${className}`;
        c.innerText = text;
        return c;
    }

    async function runKnapsack() {
        if(isRunning) return;
        isRunning = true;
        initGrid();

        for(let i=1; i<items.length; i++) {
            for(let w=1; w<=W; w++) {
                cells[i][w].classList.add('active');
                
                const item = items[i];
                let excludedVal = parseInt(cells[i-1][w].innerText);
                cells[i-1][w].classList.add('checking');
                
                let includedVal = 0;
                if(item.w <= w) {
                    cells[i-1][w-item.w].classList.add('checking');
                    includedVal = item.v + parseInt(cells[i-1][w-item.w].innerText);
                    evalBox.innerHTML = `Testing Item ${String.fromCharCode(64+i)} (w:${item.w}, v:${item.v})<br><br>Exclude: $${excludedVal}<br>Include: $${item.v} + $${includedVal-item.v} = $${includedVal}<br><br>Max: <b>$${Math.max(excludedVal, includedVal)}</b>`;
                } else {
                    evalBox.innerHTML = `Testing Item ${String.fromCharCode(64+i)} (w:${item.w}, v:${item.v})<br><br>Too heavy for capacity ${w}.<br>Exclude: $${excludedVal}`;
                }

                await sleep(800);
                
                const maxVal = Math.max(excludedVal, includedVal);
                cells[i][w].innerText = maxVal;
                
                cells[i-1][w].classList.remove('checking');
                if(item.w <= w) cells[i-1][w-item.w].classList.remove('checking');
                cells[i][w].classList.remove('active');
                cells[i][w].style.background = `rgba(16, 185, 129, ${maxVal/50})`;
                cells[i][w].style.color = maxVal > 25 ? 'white' : 'var(--text-primary)';
            }
        }
        evalBox.innerHTML = `<span style="color:var(--accent-green); font-weight:bold; font-size:1rem;">Optimal Value: $${cells[items.length-1][W].innerText}</span>`;
        cells[items.length-1][W].style.border = '2px solid var(--accent-neon)';
        isRunning = false;
    }

    runBtn.addEventListener('click', runKnapsack);
    resetBtn.addEventListener('click', () => { if(!isRunning) initGrid(); });
    initGrid();
}

// -------------------------------------------
// Chapter 6: N-Queens Backtracking
// -------------------------------------------
function initChapter6() {
    const container = document.getElementById('sim-ch6');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <button id="btn-ch6-run" class="btn-retro primary-btn">Solve 4-Queens</button>
            <button id="btn-ch6-reset" class="btn-retro secondary-btn">Clear Board</button>
        </div>
        <div class="chess-board" id="ch6-board">
        </div>
        <p class="engine-caption" style="text-align:center; margin-top:1rem; opacity:0.8; font-size:0.9rem;" id="ch6-status">Ready to explore timeline...</p>
    `;

    const board = document.getElementById('ch6-board');
    const status = document.getElementById('ch6-status');
    const runBtn = document.getElementById('btn-ch6-run');
    const resetBtn = document.getElementById('btn-ch6-reset');
    
    const N = 4;
    let isRunning = false;
    let cells = [];

    function initBoard() {
        board.innerHTML = '';
        cells = [];
        for(let r=0; r<N; r++) {
            const rowArr = [];
            const rowDiv = document.createElement('div');
            rowDiv.className = 'chess-row';
            rowDiv.style.display = 'contents';
            for(let c=0; c<N; c++) {
                const cell = document.createElement('div');
                cell.className = 'chess-cell';
                board.appendChild(cell);
                rowArr.push(cell);
            }
            cells.push(rowArr);
        }
        status.innerText = 'Ready to explore timeline...';
    }

    function isSafe(boardState, row, col) {
        for(let i=0; i<row; i++) {
            if(boardState[i] === col) return false;
            if(Math.abs(boardState[i] - col) === Math.abs(i - row)) return false;
        }
        return true;
    }

    async function solve(row, boardState) {
        if(row === N) return true;

        for(let col=0; col<N; col++) {
            cells[row][col].innerHTML = '<div class="queen">♕</div>';
            
            if(isSafe(boardState, row, col)) {
                status.innerText = `Queen placed at (${row}, ${col}). Valid state.`;
                boardState[row] = col;
                await sleep(600);
                
                if(await solve(row+1, boardState)) return true;
                
                status.innerText = `Dead end reached. Backtracking from (${row}, ${col})...`;
                cells[row][col].innerHTML = '<div class="queen invalid">♕</div>';
                await sleep(500);
                cells[row][col].innerHTML = '';
            } else {
                status.innerText = `Conflict at (${row}, ${col}). Pruning timeline.`;
                cells[row][col].querySelector('.queen').classList.add('invalid');
                await sleep(400);
                cells[row][col].innerHTML = '';
            }
        }
        return false;
    }

    runBtn.addEventListener('click', async () => {
        if(isRunning) return;
        isRunning = true;
        initBoard();
        let boardState = [-1,-1,-1,-1];
        await solve(0, boardState);
        status.innerHTML = '<span style="color:var(--accent-green); font-weight:bold;">Perfect Timeline Found!</span>';
        isRunning = false;
    });

    resetBtn.addEventListener('click', () => { if(!isRunning) initBoard(); });
    initBoard();
}

// -------------------------------------------
// Chapter 7: Branch and Bound (TSP)
// -------------------------------------------
function initChapter7() {
    const container = document.getElementById('sim-ch7');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <button id="btn-ch7-run" class="btn-retro primary-btn">Run B&B Router</button>
            <button id="btn-ch7-reset" class="btn-retro secondary-btn">Reset</button>
        </div>
        <div class="tsp-container" id="ch7-area">
            <div class="tsp-info" id="ch7-info">Upper Bound (Best): ∞<br>Current Cost: 0</div>
            <div class="tsp-node" id="n0" style="left:50%; top:20px; transform:translateX(-50%);">0</div>
            <div class="tsp-node" id="n1" style="left:10%; top:150px;">1</div>
            <div class="tsp-node" id="n2" style="right:10%; top:150px;">2</div>
            <div class="tsp-node" id="n3" style="left:30%; top:300px;">3</div>
            <div class="tsp-node" id="n4" style="right:30%; top:300px;">4</div>
        </div>
    `;

    const area = document.getElementById('ch7-area');
    const info = document.getElementById('ch7-info');
    const runBtn = document.getElementById('btn-ch7-run');
    const resetBtn = document.getElementById('btn-ch7-reset');
    
    const coords = [
        {x: 50, y: 10},
        {x: 10, y: 45},
        {x: 90, y: 45},
        {x: 30, y: 90},
        {x: 70, y: 90}
    ];

    let isRunning = false;

    function drawEdge(u, v, isPruned=false) {
        const line = document.createElement('div');
        line.className = 'tsp-edge' + (isPruned ? ' pruned' : ' active');
        
        const w = area.offsetWidth;
        const h = area.offsetHeight;
        
        const px1 = (coords[u].x / 100) * w;
        const py1 = (coords[u].y / 100) * h;
        const px2 = (coords[v].x / 100) * w;
        const py2 = (coords[v].y / 100) * h;
        
        const length = Math.sqrt((px2-px1)**2 + (py2-py1)**2);
        const angle = Math.atan2(py2-py1, px2-px1) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.left = `${px1}px`;
        line.style.top = `${py1}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        area.appendChild(line);
        return line;
    }

    function clearEdges() {
        const edges = area.querySelectorAll('.tsp-edge');
        edges.forEach(e => e.remove());
        const nodes = area.querySelectorAll('.tsp-node');
        nodes.forEach(n => n.classList.remove('visited'));
    }

    async function runTSP() {
        if(isRunning) return;
        isRunning = true;
        clearEdges();
        
        info.innerHTML = `Upper Bound: ∞<br>Exploring 0 → 1`;
        document.getElementById('n0').classList.add('visited');
        let e1 = drawEdge(0, 1);
        await sleep(800);
        
        info.innerHTML = `Upper Bound: ∞<br>Exploring 1 → 3`;
        document.getElementById('n1').classList.add('visited');
        let e2 = drawEdge(1, 3);
        await sleep(800);
        
        info.innerHTML = `Cost: 150. Valid path found.<br>Upper Bound: 150`;
        await sleep(1200);
        
        e2.remove();
        document.getElementById('n1').classList.remove('visited');
        info.innerHTML = `Upper Bound: 150<br>Exploring 0 → 2`;
        let e3 = drawEdge(0, 2);
        await sleep(800);
        
        info.innerHTML = `Upper Bound: 150<br>Lower Bound of branch: 160<br><span style="color:#ef4444;">160 > 150. PRUNING BRANCH!</span>`;
        e3.classList.replace('active', 'pruned');
        await sleep(1500);
        
        info.innerHTML = `Upper Bound: 150<br>Exploring 0 → 4`;
        let e4 = drawEdge(0, 4);
        await sleep(800);
        
        info.innerHTML = `Cost: 120. Valid path found.<br><span style="color:var(--accent-green);">Upper Bound updated: 120</span>`;
        e4.classList.replace('active', 'pruned'); 
        e1.remove(); e3.remove(); e4.remove();
        await sleep(800);

        drawEdge(0, 4); drawEdge(4, 3); drawEdge(3, 1); drawEdge(1, 2); drawEdge(2, 0);
        document.querySelectorAll('.tsp-node').forEach(n => n.classList.add('visited'));
        info.innerHTML = `<span style="color:var(--accent-green); font-weight:bold;">Optimal Global Tour Found!<br>Total Cost: 120</span>`;
        
        isRunning = false;
    }

    runBtn.addEventListener('click', runTSP);
    resetBtn.addEventListener('click', () => { if(!isRunning) { clearEdges(); info.innerHTML="Upper Bound (Best): ∞<br>Current Cost: 0"; } });
}

// -------------------------------------------
// Chapter 8: Dijkstra's Visualizer
// -------------------------------------------
function initChapter8() {
    const container = document.getElementById('sim-ch8');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <button id="btn-ch8-run" class="btn-retro primary-btn">Run Dijkstra</button>
            <button id="btn-ch8-reset" class="btn-retro secondary-btn">Reset Network</button>
        </div>
        <div class="graph-area" id="ch8-area">
            <div class="dnode" id="dnode-A" style="left:10%; top:50%;">A</div>
            <div class="dnode" id="dnode-B" style="left:30%; top:20%;">B</div>
            <div class="dnode" id="dnode-C" style="left:30%; top:80%;">C</div>
            <div class="dnode" id="dnode-D" style="left:60%; top:50%;">D</div>
            <div class="dnode" id="dnode-E" style="left:85%; top:50%;">E</div>
        </div>
        <p class="engine-caption" style="text-align:center; margin-top:1rem; opacity:0.8; font-size:0.9rem;" id="ch8-status">Network Idle.</p>
    `;

    const area = document.getElementById('ch8-area');
    const status = document.getElementById('ch8-status');
    const runBtn = document.getElementById('btn-ch8-run');
    const resetBtn = document.getElementById('btn-ch8-reset');
    
    const nodes = {
        'A': {x: 10, y: 50, el: document.getElementById('dnode-A')},
        'B': {x: 30, y: 20, el: document.getElementById('dnode-B')},
        'C': {x: 30, y: 80, el: document.getElementById('dnode-C')},
        'D': {x: 60, y: 50, el: document.getElementById('dnode-D')},
        'E': {x: 85, y: 50, el: document.getElementById('dnode-E')}
    };

    const edges = [
        {u: 'A', v: 'B', w: 4}, {u: 'A', v: 'C', w: 2},
        {u: 'B', v: 'D', w: 5}, {u: 'C', v: 'D', w: 1},
        {u: 'C', v: 'B', w: 1}, {u: 'D', v: 'E', w: 3}
    ];

    let edgeEls = {};
    let isRunning = false;

    function drawEdges() {
        area.querySelectorAll('.dedge').forEach(e => e.remove());
        edges.forEach(edge => {
            const line = document.createElement('div');
            line.className = 'dedge';
            
            const w = area.offsetWidth;
            const h = area.offsetHeight;
            
            const px1 = (nodes[edge.u].x / 100) * w;
            const py1 = (nodes[edge.u].y / 100) * h;
            const px2 = (nodes[edge.v].x / 100) * w;
            const py2 = (nodes[edge.v].y / 100) * h;
            
            const length = Math.sqrt((px2-px1)**2 + (py2-py1)**2);
            const angle = Math.atan2(py2-py1, px2-px1) * 180 / Math.PI;
            
            line.style.width = `${length}px`;
            line.style.left = `${px1}px`;
            line.style.top = `${py1}px`;
            line.style.transform = `rotate(${angle}deg)`;
            
            area.appendChild(line);
            edgeEls[`${edge.u}-${edge.v}`] = line;
        });
    }

    function reset() {
        Object.values(nodes).forEach(n => {
            n.el.className = 'dnode';
            n.el.innerHTML = n.el.id.split('-')[1];
        });
        Object.values(edgeEls).forEach(e => e.className = 'dedge');
        status.innerText = 'Network Idle.';
    }

    async function runDijkstra() {
        if(isRunning) return;
        isRunning = true;
        reset();
        
        let dist = {A: 0, B: 99, C: 99, D: 99, E: 99};
        let settled = new Set();
        nodes['A'].el.innerHTML = `A<br><span style="font-size:0.6rem">0</span>`;

        status.innerHTML = `Starting Dijkstra from A.`;
        await sleep(800);
        
        while(settled.size < 5) {
            let u = null;
            let minDist = 999;
            for(let key in dist) {
                if(!settled.has(key) && dist[key] < minDist) {
                    minDist = dist[key];
                    u = key;
                }
            }
            if(!u) break;

            nodes[u].el.classList.add('active');
            status.innerHTML = `Settling node ${u} (min dist: ${dist[u]})`;
            await sleep(800);
            
            for(let edge of edges) {
                if(edge.u === u && !settled.has(edge.v)) {
                    edgeEls[`${u}-${edge.v}`].classList.add('active');
                    let newD = dist[u] + edge.w;
                    if(newD < dist[edge.v]) {
                        dist[edge.v] = newD;
                        nodes[edge.v].el.innerHTML = `${edge.v}<br><span style="font-size:0.6rem; color:var(--accent-neon);">${newD}</span>`;
                        status.innerHTML = `Relaxing edge ${u}→${edge.v}. New dist: ${newD}`;
                        await sleep(800);
                    }
                    edgeEls[`${u}-${edge.v}`].classList.remove('active');
                }
            }
            
            nodes[u].el.classList.remove('active');
            nodes[u].el.classList.add('settled');
            settled.add(u);
        }
        
        status.innerHTML = `<span style="color:var(--accent-green); font-weight:bold;">Shortest paths computed! A to E is ${dist['E']}</span>`;
        isRunning = false;
    }

    window.addEventListener('resize', drawEdges);
    setTimeout(drawEdges, 100);

    runBtn.addEventListener('click', runDijkstra);
    resetBtn.addEventListener('click', () => { if(!isRunning) reset(); });
}

// -------------------------------------------
// Chapter 9: KMP Scanner
// -------------------------------------------
function initChapter9() {
    const container = document.getElementById('sim-ch9');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <button id="btn-ch9-run" class="btn-retro primary-btn">Scan with KMP</button>
            <button id="btn-ch9-reset" class="btn-retro secondary-btn">Reset</button>
        </div>
        <div class="kmp-container" id="ch9-area">
            <div class="kmp-row" id="kmp-text"></div>
            <div class="kmp-row" id="kmp-pat" style="margin-top: 10px;"></div>
        </div>
        <p class="engine-caption" style="text-align:center; margin-top:1rem; opacity:0.8; font-size:0.9rem;" id="ch9-status">LPS Array Precomputed. Ready to scan.</p>
    `;

    const txtRow = document.getElementById('kmp-text');
    const patRow = document.getElementById('kmp-pat');
    const status = document.getElementById('ch9-status');
    const runBtn = document.getElementById('btn-ch9-run');
    const resetBtn = document.getElementById('btn-ch9-reset');

    const txt = "ABABDABACDABABCABAB";
    const pat = "ABABCABAB";
    const lps = [0, 0, 1, 2, 0, 1, 2, 3, 4];
    let isRunning = false;

    function renderChars(parent, str) {
        parent.innerHTML = '';
        for(let c of str) {
            const d = document.createElement('div');
            d.className = 'kmp-char';
            d.innerText = c;
            parent.appendChild(d);
        }
    }

    function reset() {
        renderChars(txtRow, txt);
        renderChars(patRow, pat);
        patRow.style.transform = `translateX(0px)`;
        status.innerText = "LPS Array: [0, 0, 1, 2, 0, 1, 2, 3, 4]";
    }

    async function runKMP() {
        if(isRunning) return;
        isRunning = true;
        reset();
        
        let M = pat.length;
        let N = txt.length;
        let i = 0; 
        let j = 0; 
        
        while ((N - i) >= (M - j)) {
            const shiftPx = (i - j) * 39; // 35px width + 4px gap
            patRow.style.transform = `translateX(${shiftPx}px)`;
            
            const tCells = txtRow.children;
            const pCells = patRow.children;
            
            for(let k=0; k<M; k++) { pCells[k].className = 'kmp-char'; tCells[i-j+k].className = 'kmp-char'; }
            
            await sleep(600);
            
            if (pat[j] === txt[i]) {
                pCells[j].classList.add('match');
                tCells[i].classList.add('match');
                status.innerText = `Match at text[${i}] == pat[${j}]`;
                j++;
                i++;
                await sleep(400);
            }
            
            if (j === M) {
                status.innerHTML = `<span style="color:var(--accent-green); font-weight:bold;">Pattern Found at index ${i - j}!</span>`;
                break;
            } else if (i < N && pat[j] !== txt[i]) {
                pCells[j].classList.add('mismatch');
                tCells[i].classList.add('mismatch');
                status.innerText = `Mismatch! text[${i}] != pat[${j}].`;
                await sleep(800);
                
                if (j !== 0) {
                    status.innerText = `LPS[${j-1}] is ${lps[j-1]}. Shifting pattern skipping ${lps[j-1]} comparisons.`;
                    j = lps[j - 1];
                } else {
                    status.innerText = `j is 0. Moving text pointer to next char.`;
                    i = i + 1;
                }
                
                for(let k=0; k<M; k++) { pCells[k].className = 'kmp-char'; }
                for(let k=0; k<N; k++) { tCells[k].className = 'kmp-char'; }
                await sleep(500);
            }
        }
        isRunning = false;
    }

    runBtn.addEventListener('click', runKMP);
    resetBtn.addEventListener('click', () => { if(!isRunning) reset(); });
    reset();
}

// -------------------------------------------
// Chapter 10: Complexity Gravity Well
// -------------------------------------------
function initChapter10() {
    const container = document.getElementById('sim-ch10');
    if(!container) return;
    container.innerHTML = `
        <div class="engine-controls" style="justify-content:center;">
            <button id="btn-ch10-run" class="btn-retro primary-btn">Simulate Execution</button>
        </div>
        <div class="gravity-well" id="ch10-well">
            <div class="event-horizon"></div>
            <div class="black-hole"></div>
            <div class="complexity-bubble bubble-p" id="b-p">P (Polynomial)</div>
            <div class="complexity-bubble bubble-np" id="b-np">NP (Sudoku)</div>
            <div class="complexity-bubble bubble-nphard" id="b-nphard">NP-Hard (TSP)</div>
        </div>
        <p class="engine-caption" style="text-align:center; margin-top:1rem; opacity:0.8; font-size:0.9rem;" id="ch10-status">Intractability is a physical boundary.</p>
    `;

    const runBtn = document.getElementById('btn-ch10-run');
    const p = document.getElementById('b-p');
    const np = document.getElementById('b-np');
    const nph = document.getElementById('b-nphard');
    const status = document.getElementById('ch10-status');
    let isRunning = false;

    runBtn.addEventListener('click', async () => {
        if(isRunning) return;
        isRunning = true;
        
        status.innerText = "Attempting to solve NP-Hard in Polynomial Time...";
        
        // P solves instantly
        p.style.transform = 'translate(100px, 50px) scale(0.5)';
        p.style.opacity = '0';
        await sleep(1000);
        
        // NP struggles
        np.style.transform = 'translate(-50px, -50px) scale(0.8)';
        await sleep(1500);
        
        // NP-Hard gets sucked in
        status.innerHTML = "<span style='color:#ef4444'>Computation exploding... Intractability reached.</span>";
        nph.style.transform = 'translate(-80px, 80px) scale(0.1) rotate(720deg)';
        nph.style.opacity = '0.5';
        
        await sleep(2000);
        
        // Reset
        p.style.transform = 'none'; p.style.opacity = '1';
        np.style.transform = 'none';
        nph.style.transform = 'none'; nph.style.opacity = '1';
        status.innerText = "Intractability is a physical boundary.";
        
        isRunning = false;
    });
}
