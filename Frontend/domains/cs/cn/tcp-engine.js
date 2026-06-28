document.addEventListener("DOMContentLoaded", () => {
    const btnHandshake = document.getElementById('btn-handshake');
    const btnResetTcp = document.getElementById('btn-reset-tcp');
    const clientState = document.getElementById('client-state');
    const serverState = document.getElementById('server-state');
    const clientBox = document.getElementById('client-box');
    const serverBox = document.getElementById('server-box');
    const statusText = document.getElementById('tcp-status');
    const msgSyn = document.getElementById('msg-syn');
    const msgSynAck = document.getElementById('msg-synack');
    const msgAck = document.getElementById('msg-ack');

    const SLEEP_MS = 900;
    let runId = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function resetTcp() {
        runId++;
        clientState.textContent = 'CLOSED';
        serverState.textContent = 'LISTEN';
        clientBox.classList.remove('active');
        serverBox.classList.remove('active');
        [msgSyn, msgSynAck, msgAck].forEach(m => m.classList.remove('visible'));
        msgSyn.style.top = '10%';
        msgSynAck.style.top = '40%';
        msgAck.style.top = '70%';
        statusText.textContent = 'Both hosts idle. Click "Start Handshake" to establish a TCP connection.';
        statusText.style.color = 'var(--text-muted)';
    }

    async function startHandshake() {
        runId++;
        const localId = runId;
        resetTcp();
        runId = localId;

        // Step 1: SYN
        clientState.textContent = 'SYN-SENT';
        clientBox.classList.add('active');
        statusText.textContent = 'Step 1: Client sends SYN (Seq=100, wants to connect)';
        statusText.style.color = '#3b82f6';
        msgSyn.classList.add('visible');
        await sleep(SLEEP_MS);
        if (localId !== runId) return;

        // Step 2: SYN-ACK
        serverState.textContent = 'SYN-RCVD';
        serverBox.classList.add('active');
        statusText.textContent = 'Step 2: Server responds SYN-ACK (Seq=300, Ack=101)';
        statusText.style.color = '#10b981';
        msgSynAck.classList.add('visible');
        await sleep(SLEEP_MS);
        if (localId !== runId) return;

        // Step 3: ACK
        clientState.textContent = 'ESTABLISHED';
        serverState.textContent = 'ESTABLISHED';
        statusText.textContent = 'Step 3: Client sends ACK (Ack=301). Connection established!';
        statusText.style.color = '#8b5cf6';
        msgAck.classList.add('visible');
        await sleep(SLEEP_MS);
        if (localId !== runId) return;

        statusText.textContent = 'TCP connection ESTABLISHED. Both sides can now exchange data reliably.';
        statusText.style.color = '#10b981';
    }

    btnHandshake.addEventListener('click', startHandshake);
    btnResetTcp.addEventListener('click', resetTcp);
    resetTcp();
});
