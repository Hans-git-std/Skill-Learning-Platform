document.addEventListener("DOMContentLoaded", () => {
    const runBtn = document.getElementById('btn-run-race');
    const resetBtn = document.getElementById('btn-reset-race');
    const isoSelect = document.getElementById('iso-level');
    
    const txALog = document.getElementById('tx-a-log');
    const txBLog = document.getElementById('tx-b-log');
    const statusText = document.getElementById('iso-status');

    let isRunning = false;

    function appendLog(element, text, isWarning = false) {
        const div = document.createElement('div');
        div.className = 'log-entry';
        if (isWarning) {
            div.style.borderLeftColor = '#ef4444'; // Red warning
            div.style.color = '#ef4444';
        }
        div.textContent = text;
        element.appendChild(div);
        element.scrollTop = element.scrollHeight;
    }

    function runSimulation() {
        if (isRunning) return;
        isRunning = true;
        
        txALog.innerHTML = '';
        txBLog.innerHTML = '';
        const level = isoSelect.value;
        statusText.textContent = `Running under ${isoSelect.options[isoSelect.selectedIndex].text}...`;

        // Timeline Simulation using exact millisecond delays
        setTimeout(() => appendLog(txALog, "T=0: BEGIN TRANSACTION;"), 500);
        setTimeout(() => appendLog(txBLog, "T=1: BEGIN TRANSACTION;"), 1000);
        
        setTimeout(() => appendLog(txALog, "T=2: UPDATE users SET balance=500;"), 2000);
        setTimeout(() => appendLog(txALog, "↳ (Uncommitted dirty page in RAM)"), 2500);

        setTimeout(() => {
            appendLog(txBLog, "T=3: SELECT balance FROM users;");
            
            // Logic changes based on Isolation Level
            if (level === 'RU') {
                appendLog(txBLog, "↳ Returns $500 (DIRTY READ)", true);
            } else if (level === 'RC') {
                appendLog(txBLog, "↳ Returns $100 (Reads old committed snapshot)");
            } else if (level === 'RR') {
                appendLog(txBLog, "↳ Returns $100 (Reads isolated snapshot)");
            }
        }, 4000);

        setTimeout(() => {
            appendLog(txALog, "T=4: FATAL ERROR! ROLLBACK;", true);
            appendLog(txALog, "↳ Balance restored to $100");
        }, 5500);

        setTimeout(() => {
            if (level === 'RU') {
                statusText.textContent = "Simulation Complete: Tx B made a decision on $500, but the real balance is $100. Data corruption occurred.";
                statusText.style.color = '#ef4444';
            } else {
                statusText.textContent = "Simulation Complete: Tx B successfully avoided the dirty read.";
                statusText.style.color = '#10b981';
            }
            isRunning = false;
        }, 7000);
    }

    function resetSimulation() {
        if (isRunning) return;
        txALog.innerHTML = '';
        txBLog.innerHTML = '';
        statusText.textContent = "Initial State: User Balance = $100";
        statusText.style.color = "var(--text-muted)";
    }

    runBtn.addEventListener('click', runSimulation);
    resetBtn.addEventListener('click', resetSimulation);
});