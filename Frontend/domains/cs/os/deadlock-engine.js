document.addEventListener("DOMContentLoaded", () => {
    const btnSafe = document.getElementById('btn-safe');
    const btnDeadlock = document.getElementById('btn-deadlock');
    const btnReset = document.getElementById('btn-reset-deadlock');
    const statusText = document.getElementById('deadlock-status');
    const tableBody = document.getElementById('banker-table-body');
    const safeSequence = document.getElementById('safe-sequence');
    const ragGraph = document.getElementById('rag-graph');

    const SLEEP_MS = 700;
    let runId = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const safeState = {
        available: [3, 3, 2],
        processes: [
            { id: 'P0', allocation: [0, 1, 0], max: [7, 5, 3] },
            { id: 'P1', allocation: [2, 0, 0], max: [3, 2, 2] },
            { id: 'P2', allocation: [3, 0, 2], max: [9, 0, 2] },
            { id: 'P3', allocation: [2, 1, 1], max: [2, 2, 2] },
            { id: 'P4', allocation: [0, 0, 2], max: [4, 3, 3] }
        ]
    };

    const deadlockState = {
        available: [0, 0, 0],
        processes: [
            { id: 'P0', allocation: [0, 1, 0], max: [7, 5, 3] },
            { id: 'P1', allocation: [2, 0, 0], max: [3, 2, 2] },
            { id: 'P2', allocation: [3, 0, 2], max: [9, 0, 2] },
            { id: 'P3', allocation: [2, 1, 1], max: [2, 2, 2] },
            { id: 'P4', allocation: [0, 0, 2], max: [4, 3, 3] }
        ]
    };

    let currentState = JSON.parse(JSON.stringify(safeState));

    function need(allocation, max) {
        return max.map((m, i) => m - allocation[i]);
    }

    function canAllocate(available, needArr) {
        return needArr.every((n, i) => n <= available[i]);
    }

    function renderTable(state) {
        tableBody.innerHTML = state.processes.map(p => {
            const n = need(p.allocation, p.max);
            return `<tr>
                <td>${p.id}</td>
                <td>${p.allocation.join(', ')}</td>
                <td>${n.join(', ')}</td>
                <td>—</td>
            </tr>`;
        }).join('') + `<tr style="font-weight:bold;background:var(--card-bg);">
            <td colspan="3">Available (A,B,C)</td>
            <td>${state.available.join(', ')}</td>
        </tr>`;
    }

    function renderRag(state, blockedSet) {
        ragGraph.innerHTML = state.processes.map(p => {
            const blocked = blockedSet && blockedSet.has(p.id);
            return `<div class="rag-process">
                <div class="rag-circle process ${blocked ? 'blocked' : ''}">${p.id}</div>
                <span style="font-size:0.7rem;color:var(--text-muted);">${p.allocation.join(',')}</span>
            </div>`;
        }).join('<div class="rag-edge">⇄</div>');
    }

    function findSafeSequence(state) {
        const work = [...state.available];
        const finish = Array(state.processes.length).fill(false);
        const sequence = [];

        let found;
        do {
            found = false;
            for (let i = 0; i < state.processes.length; i++) {
                if (finish[i]) continue;
                const p = state.processes[i];
                const n = need(p.allocation, p.max);
                if (canAllocate(work, n)) {
                    for (let j = 0; j < 3; j++) work[j] += p.allocation[j];
                    finish[i] = true;
                    sequence.push(p.id);
                    found = true;
                }
            }
        } while (found);

        return finish.every(f => f) ? sequence : null;
    }

    function resetDeadlock() {
        runId++;
        currentState = JSON.parse(JSON.stringify(safeState));
        safeSequence.innerHTML = '';
        renderTable(currentState);
        renderRag(currentState, null);
        statusText.textContent = 'System in safe state. Available: (3,3,2). Click "Check Safe State" to find execution order.';
        statusText.style.color = 'var(--text-muted)';
    }

    async function checkSafeState() {
        runId++;
        const localId = runId;
        currentState = JSON.parse(JSON.stringify(safeState));
        safeSequence.innerHTML = '';
        renderTable(currentState);
        renderRag(currentState, null);

        statusText.textContent = 'Running Banker\'s Algorithm safety check...';
        statusText.style.color = '#3b82f6';
        await sleep(SLEEP_MS);
        if (localId !== runId) return;

        const seq = findSafeSequence(currentState);

        if (seq) {
            for (let i = 0; i < seq.length; i++) {
                if (localId !== runId) return;

                const step = document.createElement('div');
                step.className = 'safe-step done';
                step.textContent = seq[i];
                step.style.animationDelay = `${i * 0.1}s`;
                safeSequence.appendChild(step);

                if (i < seq.length - 1) {
                    const arrow = document.createElement('span');
                    arrow.textContent = '→';
                    arrow.style.color = 'var(--text-muted)';
                    safeSequence.appendChild(arrow);
                }

                statusText.textContent = `Process ${seq[i]} can finish. Releasing resources: ${currentState.processes.find(p => p.id === seq[i]).allocation.join(', ')}`;
                statusText.style.color = '#10b981';

                await sleep(SLEEP_MS);
            }

            if (localId === runId) {
                statusText.textContent = `Safe sequence found: ${seq.join(' → ')}. System can avoid deadlock.`;
                statusText.style.color = '#10b981';
            }
        }
    }

    async function triggerDeadlock() {
        runId++;
        const localId = runId;
        currentState = JSON.parse(JSON.stringify(deadlockState));
        safeSequence.innerHTML = '';
        renderTable(currentState);

        statusText.textContent = 'All resources allocated. Available = (0,0,0). Checking for safe sequence...';
        statusText.style.color = '#f59e0b';
        await sleep(SLEEP_MS);
        if (localId !== runId) return;

        const seq = findSafeSequence(currentState);
        const blocked = new Set(currentState.processes.map(p => p.id));
        renderRag(currentState, blocked);

        if (!seq) {
            const step = document.createElement('div');
            step.className = 'safe-step deadlock';
            step.textContent = 'DEADLOCK';
            safeSequence.appendChild(step);

            statusText.textContent = 'No safe sequence exists! Circular wait detected. All processes blocked forever.';
            statusText.style.color = '#ef4444';
        }
    }

    btnSafe.addEventListener('click', checkSafeState);
    btnDeadlock.addEventListener('click', triggerDeadlock);
    btnReset.addEventListener('click', resetDeadlock);
    resetDeadlock();
});
