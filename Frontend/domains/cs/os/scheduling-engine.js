document.addEventListener("DOMContentLoaded", () => {
    const algoSelect = document.getElementById('sched-algo');
    const btnSchedule = document.getElementById('btn-schedule');
    const btnReset = document.getElementById('btn-reset-sched');
    const statusText = document.getElementById('sched-status');
    const ganttChart = document.getElementById('gantt-chart');
    const tableBody = document.getElementById('sched-table-body');

    const SLEEP_MS = 400;
    let runId = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const processes = [
        { id: 'P1', burst: 24, color: 'p1' },
        { id: 'P2', burst: 3, color: 'p2' },
        { id: 'P3', burst: 3, color: 'p3' }
    ];

    function resetSched() {
        runId++;
        ganttChart.innerHTML = '';
        tableBody.innerHTML = '';
        statusText.textContent = 'Scheduler idle. P1(24ms), P2(3ms), P3(3ms) waiting in Ready Queue.';
        statusText.style.color = 'var(--text-muted)';
    }

    function runFCFS() {
        const timeline = [];
        let time = 0;
        const results = processes.map(p => {
            const start = time;
            const waiting = start;
            time += p.burst;
            for (let t = 0; t < p.burst; t++) {
                timeline.push({ process: p.id, color: p.color, time: start + t });
            }
            return { id: p.id, burst: p.burst, waiting, turnaround: waiting + p.burst };
        });
        return { timeline, results, totalTime: time };
    }

    function runRR(quantum) {
        const remaining = processes.map(p => ({ ...p, rem: p.burst }));
        const timeline = [];
        const completion = Array(processes.length).fill(-1);
        let time = 0;
        let queue = [0, 1, 2];
        let completed = 0;

        while (completed < processes.length) {
            const idx = queue.shift();
            const p = remaining[idx];
            if (p.rem === 0) continue;

            const slice = Math.min(quantum, p.rem);
            for (let t = 0; t < slice; t++) {
                timeline.push({ process: p.id, color: p.color, time: time + t });
            }
            time += slice;
            p.rem -= slice;

            if (p.rem === 0) {
                completion[idx] = time;
                completed++;
            } else {
                queue.push(idx);
            }
        }

        const results = processes.map((p, i) => ({
            id: p.id,
            burst: p.burst,
            waiting: completion[i] - p.burst,
            turnaround: completion[i]
        }));

        return { timeline, results, totalTime: time };
    }

    function renderGantt(timeline) {
        ganttChart.innerHTML = '';
        const maxTime = timeline.length;
        const track = document.createElement('div');
        track.className = 'gantt-row';
        track.innerHTML = '<div class="gantt-label">CPU</div>';
        const ganttTrack = document.createElement('div');
        ganttTrack.className = 'gantt-track';

        timeline.forEach((slot, i) => {
            const block = document.createElement('div');
            block.className = `gantt-block ${slot.color}`;
            block.textContent = slot.process;
            block.style.flex = '1';
            block.style.animationDelay = `${i * 0.05}s`;
            ganttTrack.appendChild(block);
        });

        track.appendChild(ganttTrack);
        ganttChart.appendChild(track);

        const timeRow = document.createElement('div');
        timeRow.className = 'gantt-row';
        timeRow.innerHTML = `<div class="gantt-label"></div><div style="flex:1;display:flex;justify-content:space-between;font-family:monospace;font-size:0.7rem;color:var(--text-muted);padding:0 4px;"><span>0</span><span>${maxTime}ms</span></div>`;
        ganttChart.appendChild(timeRow);
    }

    function renderTable(results) {
        tableBody.innerHTML = results.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.burst}ms</td>
                <td>${r.waiting}ms</td>
                <td>${r.turnaround}ms</td>
            </tr>
        `).join('');
    }

    async function runScheduler() {
        runId++;
        const localId = runId;
        resetSched();
        runId = localId;

        const algo = algoSelect.value;
        const quantum = 4;

        statusText.textContent = algo === 'fcfs'
            ? 'Running FCFS: P1 runs to completion first (convoy effect)...'
            : `Running Round Robin with quantum=${quantum}ms...`;
        statusText.style.color = '#3b82f6';
        await sleep(SLEEP_MS);
        if (localId !== runId) return;

        const { timeline, results, totalTime } = algo === 'fcfs' ? runFCFS() : runRR(quantum);

        renderGantt(timeline);
        renderTable(results);

        const avgWait = (results.reduce((s, r) => s + r.waiting, 0) / results.length).toFixed(1);
        const avgTurn = (results.reduce((s, r) => s + r.turnaround, 0) / results.length).toFixed(1);

        if (localId === runId) {
            statusText.textContent = algo === 'fcfs'
                ? `FCFS complete in ${totalTime}ms. Avg waiting: ${avgWait}ms. P2 and P3 starved behind P1.`
                : `Round Robin complete in ${totalTime}ms. Avg waiting: ${avgWait}ms. All processes got fair CPU slices.`;
            statusText.style.color = '#10b981';
        }
    }

    btnSchedule.addEventListener('click', runScheduler);
    btnReset.addEventListener('click', resetSched);
    resetSched();
});
