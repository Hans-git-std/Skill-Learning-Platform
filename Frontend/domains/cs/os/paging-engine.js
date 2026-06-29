document.addEventListener("DOMContentLoaded", () => {
    const algoSelect = document.getElementById('replace-algo');
    const btnPage = document.getElementById('btn-page');
    const btnReset = document.getElementById('btn-reset-page');
    const statusText = document.getElementById('page-status');
    const refStringEl = document.getElementById('page-ref-string');
    const frameGrid = document.getElementById('frame-grid');
    const faultCount = document.getElementById('page-faults');
    const hitCount = document.getElementById('page-hits');

    const SLEEP_MS = 600;
    const FRAME_COUNT = 3;
    const REFERENCES = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
    let runId = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function renderRefString(activeIdx, results) {
        refStringEl.innerHTML = REFERENCES.map((page, i) => {
            let cls = 'ref-cell';
            if (i === activeIdx) cls += ' current';
            else if (i < activeIdx && results[i]) {
                cls += results[i].fault ? ' fault done' : ' hit done';
            }
            return `<div class="${cls}">${page}</div>`;
        }).join('');
    }

    function renderFrames(frames, highlightIdx) {
        frameGrid.innerHTML = frames.map((page, i) => {
            let cls = 'frame-slot';
            if (page !== null) cls += ' filled';
            if (i === highlightIdx) cls += ' loaded';
            return `<div class="frame-row">
                <div class="frame-label">Frame ${i}</div>
                <div class="${cls}">${page !== null ? page : '—'}</div>
            </div>`;
        }).join('');
    }

    function resetPaging() {
        runId++;
        refStringEl.innerHTML = REFERENCES.map(p =>
            `<div class="ref-cell">${p}</div>`
        ).join('');
        frameGrid.innerHTML = Array.from({ length: FRAME_COUNT }, (_, i) =>
            `<div class="frame-row"><div class="frame-label">Frame ${i}</div><div class="frame-slot">—</div></div>`
        ).join('');
        faultCount.textContent = 'Page Faults: 0';
        hitCount.textContent = 'Page Hits: 0';
        statusText.textContent = `${FRAME_COUNT} frames available. Reference string loaded.`;
        statusText.style.color = 'var(--text-muted)';
    }

    function simulateLRU() {
        const frames = Array(FRAME_COUNT).fill(null);
        const useOrder = [];
        const results = [];
        let faults = 0, hits = 0;

        for (const page of REFERENCES) {
            const idx = frames.indexOf(page);
            if (idx !== -1) {
                hits++;
                useOrder.splice(useOrder.indexOf(page), 1);
                useOrder.push(page);
                results.push({ fault: false, evicted: null });
            } else {
                faults++;
                let evicted = null;
                if (frames.every(f => f !== null)) {
                    evicted = useOrder.shift();
                    const evictIdx = frames.indexOf(evicted);
                    frames[evictIdx] = page;
                } else {
                    const emptyIdx = frames.indexOf(null);
                    frames[emptyIdx] = page;
                }
                useOrder.push(page);
                results.push({ fault: true, evicted });
            }
        }
        return { frames: Array(FRAME_COUNT).fill(null), useOrder: [], results, faults, hits, algo: 'LRU' };
    }

    function simulateFIFO() {
        const frames = Array(FRAME_COUNT).fill(null);
        let nextSlot = 0;
        const results = [];
        let faults = 0, hits = 0;

        for (const page of REFERENCES) {
            const idx = frames.indexOf(page);
            if (idx !== -1) {
                hits++;
                results.push({ fault: false, evicted: null });
            } else {
                faults++;
                let evicted = null;
                if (frames.every(f => f !== null)) {
                    evicted = frames[nextSlot];
                    frames[nextSlot] = page;
                    nextSlot = (nextSlot + 1) % FRAME_COUNT;
                } else {
                    const emptyIdx = frames.indexOf(null);
                    frames[emptyIdx] = page;
                }
                results.push({ fault: true, evicted });
            }
        }
        return { frames: Array(FRAME_COUNT).fill(null), results, faults, hits, algo: 'FIFO' };
    }

    async function runSimulation() {
        runId++;
        const localId = runId;
        resetPaging();
        runId = localId;

        const algo = algoSelect.value;
        statusText.textContent = `Simulating ${algo.toUpperCase()} page replacement on ${REFERENCES.length} references...`;
        statusText.style.color = '#3b82f6';

        const frames = Array(FRAME_COUNT).fill(null);
        const useOrder = [];
        let nextSlot = 0;
        let faults = 0, hits = 0;

        for (let i = 0; i < REFERENCES.length; i++) {
            if (localId !== runId) return;

            const page = REFERENCES[i];
            renderRefString(i, []);

            let isFault = false;
            let evicted = null;

            const idx = frames.indexOf(page);
            if (idx !== -1) {
                hits++;
                if (algo === 'lru') {
                    useOrder.splice(useOrder.indexOf(page), 1);
                    useOrder.push(page);
                }
                statusText.textContent = `Page ${page}: HIT in Frame ${idx}. No disk access needed.`;
                statusText.style.color = '#10b981';
            } else {
                faults++;
                isFault = true;
                if (frames.every(f => f !== null)) {
                    if (algo === 'lru') {
                        evicted = useOrder.shift();
                        const evictIdx = frames.indexOf(evicted);
                        frames[evictIdx] = page;
                    } else {
                        evicted = frames[nextSlot];
                        frames[nextSlot] = page;
                        nextSlot = (nextSlot + 1) % FRAME_COUNT;
                    }
                    statusText.textContent = `Page ${page}: FAULT. Evicting page ${evicted} → loading from disk.`;
                } else {
                    const emptyIdx = frames.indexOf(null);
                    frames[emptyIdx] = page;
                    statusText.textContent = `Page ${page}: FAULT. Loading into empty Frame ${emptyIdx}.`;
                }
                if (algo === 'lru') useOrder.push(page);
                statusText.style.color = '#ef4444';
            }

            renderFrames(frames, isFault ? frames.indexOf(page) : -1);
            faultCount.textContent = `Page Faults: ${faults}`;
            hitCount.textContent = `Page Hits: ${hits}`;

            await sleep(SLEEP_MS);
            if (localId !== runId) return;

            renderRefString(i + 1, Array(i + 1).fill({ fault: isFault }));
        }

        if (localId === runId) {
            statusText.textContent = `${algo.toUpperCase()} complete. ${faults} page faults, ${hits} hits out of ${REFERENCES.length} references.`;
            statusText.style.color = '#10b981';
        }
    }

    btnPage.addEventListener('click', runSimulation);
    btnReset.addEventListener('click', resetPaging);
    resetPaging();
});
