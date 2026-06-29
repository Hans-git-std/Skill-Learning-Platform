document.addEventListener("DOMContentLoaded", () => {
    const btnLifecycle = document.getElementById('btn-lifecycle');
    const btnReset = document.getElementById('btn-reset-process');
    const statusText = document.getElementById('process-status');
    const states = {
        new: document.getElementById('state-new'),
        ready: document.getElementById('state-ready'),
        running: document.getElementById('state-running'),
        waiting: document.getElementById('state-waiting'),
        terminated: document.getElementById('state-terminated')
    };
    const arrows = document.querySelectorAll('.state-arrow');
    const pcbPid = document.getElementById('pcb-pid');
    const pcbState = document.getElementById('pcb-state');
    const pcbPc = document.getElementById('pcb-pc');
    const pcbFds = document.getElementById('pcb-fds');

    const SLEEP_MS = 800;
    let runId = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const lifecycle = [
        { state: 'new', msg: 'fork() called. Kernel allocates PCB and assigns PID 4821.', pcb: { pid: '4821', state: 'NEW', pc: '0x00400000', fds: '0' }, color: '#8b5cf6' },
        { state: 'ready', msg: 'Process admitted to Ready Queue. Waiting for CPU dispatch.', pcb: { pid: '4821', state: 'READY', pc: '0x00400000', fds: '0' }, color: '#f59e0b' },
        { state: 'running', msg: 'Scheduler dispatches. CPU registers loaded from PCB. Executing main().', pcb: { pid: '4821', state: 'RUNNING', pc: '0x004012A4', fds: '3 (stdin, stdout, stderr)' }, color: '#3b82f6' },
        { state: 'waiting', msg: 'read() blocks on disk I/O. Process moved to Waiting Queue.', pcb: { pid: '4821', state: 'WAITING', pc: '0x004015F0', fds: '3, 4 (config.json)' }, color: '#a855f7' },
        { state: 'ready', msg: 'I/O complete. Interrupt handler moves process back to Ready Queue.', pcb: { pid: '4821', state: 'READY', pc: '0x004015F4', fds: '3, 4' }, color: '#f59e0b' },
        { state: 'running', msg: 'Re-dispatched. Resuming from saved program counter.', pcb: { pid: '4821', state: 'RUNNING', pc: '0x004015F4', fds: '3, 4' }, color: '#3b82f6' },
        { state: 'terminated', msg: 'exit(0) called. PCB freed. Resources reclaimed. Zombie reaped by init.', pcb: { pid: '4821', state: 'TERMINATED', pc: '—', fds: '—' }, color: '#10b981' }
    ];

    function resetProcess() {
        runId++;
        Object.values(states).forEach(s => s.classList.remove('active', 'done'));
        arrows.forEach(a => a.classList.remove('active'));
        pcbPid.textContent = '—';
        pcbState.textContent = '—';
        pcbPc.textContent = '—';
        pcbFds.textContent = '—';
        statusText.textContent = 'Process idle. Click "Run Full Lifecycle" to simulate fork → exit.';
        statusText.style.color = 'var(--text-muted)';
    }

    function updatePcb(pcb) {
        pcbPid.textContent = pcb.pid;
        pcbState.textContent = pcb.state;
        pcbPc.textContent = pcb.pc;
        pcbFds.textContent = pcb.fds;
    }

    async function runLifecycle() {
        runId++;
        const localId = runId;
        resetProcess();
        runId = localId;

        let prevState = null;

        for (let i = 0; i < lifecycle.length; i++) {
            if (localId !== runId) return;

            const step = lifecycle[i];
            const node = states[step.state];

            if (prevState && prevState !== step.state) {
                states[prevState].classList.remove('active');
                states[prevState].classList.add('done');
            }

            node.classList.add('active');
            node.classList.remove('done');
            updatePcb(step.pcb);
            statusText.textContent = step.msg;
            statusText.style.color = step.color;

            if (i < arrows.length) arrows[i].classList.add('active');

            prevState = step.state;
            await sleep(SLEEP_MS);
        }

        if (localId === runId) {
            states.terminated.classList.remove('active');
            states.terminated.classList.add('done');
            statusText.textContent = 'Lifecycle complete. PCB destroyed. PID 4821 available for reuse.';
            statusText.style.color = '#10b981';
        }
    }

    btnLifecycle.addEventListener('click', runLifecycle);
    btnReset.addEventListener('click', resetProcess);
    resetProcess();
});
