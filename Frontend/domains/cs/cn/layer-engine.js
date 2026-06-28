document.addEventListener("DOMContentLoaded", () => {
    const btnEncapsulate = document.getElementById('btn-encapsulate');
    const btnResetLayer = document.getElementById('btn-reset-layer');
    const statusText = document.getElementById('layer-status');
    const layers = document.querySelectorAll('.layer-row');

    const SLEEP_MS = 700;
    let runId = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const payloads = {
        app: '"GET /api/users HTTP/1.1"',
        transport: '[TCP Hdr | Src:49152 Dst:443 Seq:1000] + "GET /api/users..."',
        network: '[IP Hdr | Src:192.168.1.5 Dst:93.184.216.34] + [TCP Hdr | ...]',
        link: '[Eth Hdr | MAC:AA:BB → GW:CC:DD] + [IP Hdr | ...] + [TCP Hdr | ...]',
        physical: '01011010... (Electrical signals on wire)'
    };

    function resetLayers() {
        runId++;
        layers.forEach(row => {
            row.classList.remove('active');
            const payload = row.querySelector('.layer-payload');
            if (payload) payload.textContent = '—';
        });
        statusText.textContent = 'Stack idle. Click "Encapsulate Packet" to watch headers wrap your data.';
        statusText.style.color = 'var(--text-muted)';
    }

    async function encapsulate() {
        runId++;
        const localId = runId;
        resetLayers();
        runId = localId;

        statusText.textContent = 'Application layer: HTTP request created...';
        statusText.style.color = '#8b5cf6';

        const order = ['app', 'transport', 'network', 'link', 'physical'];

        for (let i = 0; i < order.length; i++) {
            if (localId !== runId) return;

            const layerName = order[i];
            const row = document.getElementById(`layer-${layerName}`);
            const payload = row.querySelector('.layer-payload');

            row.classList.add('active');
            payload.textContent = payloads[layerName];

            const labels = {
                app: 'Layer 7 — Application',
                transport: 'Layer 4 — Transport (TCP header added)',
                network: 'Layer 3 — Network (IP header added)',
                link: 'Layer 2 — Data Link (Ethernet frame added)',
                physical: 'Layer 1 — Physical (bits on the wire)'
            };

            statusText.textContent = labels[layerName];
            statusText.style.color = row.querySelector('.layer-label').style.backgroundColor || 'var(--accent)';

            await sleep(SLEEP_MS);
        }

        if (localId === runId) {
            statusText.textContent = 'Encapsulation complete. Frame transmitted. Receiver will decapsulate in reverse order.';
            statusText.style.color = '#10b981';
        }
    }

    btnEncapsulate.addEventListener('click', encapsulate);
    btnResetLayer.addEventListener('click', resetLayers);
    resetLayers();
});
