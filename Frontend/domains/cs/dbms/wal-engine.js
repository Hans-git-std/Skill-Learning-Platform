document.addEventListener("DOMContentLoaded", () => {
    // System State
    let ramBuffer = [];
    let walDisk = [];
    let physicalDisk = [];
    let isCrashed = false;

    // DOM Elements
    const input = document.getElementById('tx-input');
    const executeBtn = document.getElementById('btn-execute');
    const checkpointBtn = document.getElementById('btn-checkpoint');
    const crashBtn = document.getElementById('btn-crash');
    const rebootBtn = document.getElementById('btn-reboot');
    
    const ramDisplay = document.getElementById('ram-display');
    const walDisplay = document.getElementById('wal-display');
    const dataDisplay = document.getElementById('data-display');
    const statusText = document.getElementById('wal-status');
    const container = document.querySelector('.wal-container');

    // Render Engine
    function render() {
        ramDisplay.innerHTML = ramBuffer.map(tx => `<div class="log-entry dirty">[Dirty Page] ${tx}</div>`).join('');
        walDisplay.innerHTML = walDisk.map(tx => `<div class="log-entry safe">[LSN Log] ${tx}</div>`).join('');
        dataDisplay.innerHTML = physicalDisk.map(tx => `<div class="log-entry safe">[Data Block] ${tx}</div>`).join('');
    }

    function setStatus(msg, isError = false) {
        statusText.textContent = msg;
        statusText.style.color = isError ? '#ef4444' : 'var(--text-muted)';
    }

    // 1. Execute Transaction (Hits RAM + WAL immediately)
    function executeTx() {
        if (isCrashed) return;
        const tx = input.value || `TX-${Math.floor(Math.random()*1000)}`;
        
        ramBuffer.push(tx); // Update RAM
        walDisk.push(tx);   // Append to WAL sequentially
        
        input.value = '';
        render();
        setStatus(`Transaction committed. Saved to WAL. RAM page is now dirty.`);
    }

    // 2. Checkpoint (Flush RAM to Disk)
    function triggerCheckpoint() {
        if (isCrashed || ramBuffer.length === 0) return;
        
        // Move everything from RAM to physical disk
        physicalDisk = physicalDisk.concat(ramBuffer);
        ramBuffer = []; // RAM is no longer dirty
        
        render();
        setStatus(`Checkpoint complete. Dirty pages flushed to Physical Disk. WAL can be safely truncated.`);
    }

    // 3. Crash Server (Wipes RAM)
    function crashServer() {
        if (isCrashed) return;
        isCrashed = true;
        
        ramBuffer = []; // Volatile memory lost!
        
        container.classList.add('crashed');
        executeBtn.classList.add('hidden');
        checkpointBtn.classList.add('hidden');
        crashBtn.classList.add('hidden');
        rebootBtn.classList.remove('hidden');
        
        render();
        setStatus(`⚡ KERNEL PANIC! Power lost. RAM wiped completely. Unsaved dirty pages are gone.`, true);
    }

    // 4. Reboot (Recover from WAL)
    function rebootServer() {
        isCrashed = false;
        
        // Read WAL to figure out what was in RAM before the crash
        // We only replay logs that haven't been checkpointed to physical disk
        const uncheckpointedLogs = walDisk.slice(physicalDisk.length);
        ramBuffer = [...uncheckpointedLogs]; 
        
        container.classList.remove('crashed');
        executeBtn.classList.remove('hidden');
        checkpointBtn.classList.remove('hidden');
        crashBtn.classList.remove('hidden');
        rebootBtn.classList.add('hidden');
        
        render();
        setStatus(`Server rebooted. Redo logs read from WAL. RAM state successfully reconstructed!`);
    }

    // Event Listeners
    executeBtn.addEventListener('click', executeTx);
    checkpointBtn.addEventListener('click', triggerCheckpoint);
    crashBtn.addEventListener('click', crashServer);
    rebootBtn.addEventListener('click', rebootServer);
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeTx();
    });

    render();
});