document.addEventListener("DOMContentLoaded", () => {
    const destInput = document.getElementById('route-dest');
    const btnRoute = document.getElementById('btn-route');
    const btnResetRoute = document.getElementById('btn-reset-route');
    const statusText = document.getElementById('route-status');
    const hopDisplay = document.getElementById('hop-display');
    const tableBody = document.getElementById('route-table-body');

    const SLEEP_MS = 800;
    let runId = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const routingTable = [
        { network: '192.168.1.0/24', nextHop: 'direct', iface: 'eth0', metric: 0 },
        { network: '10.0.0.0/8', nextHop: '10.0.0.1', iface: 'eth1', metric: 1 },
        { network: '93.184.0.0/16', nextHop: '192.168.1.1', iface: 'eth0', metric: 1 },
        { network: '0.0.0.0/0', nextHop: '192.168.1.1', iface: 'eth0', metric: 100 }
    ];

    const paths = {
        '192.168.1.10': ['R1 (Home Router)', 'Destination: 192.168.1.10 (Local LAN)'],
        '10.0.5.20': ['R1 (Home Router)', 'R2 (Corporate Gateway)', 'Destination: 10.0.5.20'],
        '93.184.216.34': ['R1 (Home Router)', 'R3 (ISP Edge)', 'R4 (Internet Core)', 'Destination: 93.184.216.34']
    };

    function renderTable(highlightNetwork) {
        tableBody.innerHTML = routingTable.map(entry => {
            const isMatch = entry.network === highlightNetwork;
            return `<tr class="${isMatch ? 'match-row' : ''}">
                <td>${entry.network}</td>
                <td>${entry.nextHop}</td>
                <td>${entry.iface}</td>
                <td>${entry.metric}</td>
            </tr>`;
        }).join('');
    }

    function longestPrefixMatch(ip) {
        if (ip.startsWith('192.168.1.')) return '192.168.1.0/24';
        if (ip.startsWith('10.')) return '10.0.0.0/8';
        if (ip.startsWith('93.184.')) return '93.184.0.0/16';
        return '0.0.0.0/0';
    }

    function resetRoute() {
        runId++;
        hopDisplay.innerHTML = '';
        renderTable(null);
        statusText.textContent = 'Router idle. Enter a destination IP and click Route Packet.';
        statusText.style.color = 'var(--text-muted)';
    }

    async function routePacket() {
        runId++;
        const localId = runId;
        const dest = destInput.value.trim() || '93.184.216.34';

        if (!paths[dest]) {
            statusText.textContent = `Unknown destination ${dest}. Try: 192.168.1.10, 10.0.5.20, or 93.184.216.34`;
            statusText.style.color = '#ef4444';
            return;
        }

        hopDisplay.innerHTML = '';
        const matched = longestPrefixMatch(dest);
        renderTable(matched);

        statusText.textContent = `Longest Prefix Match: ${matched} → forwarding via ${routingTable.find(r => r.network === matched).nextHop}`;
        statusText.style.color = '#f59e0b';
        await sleep(SLEEP_MS);
        if (localId !== runId) return;

        const hops = paths[dest];
        for (let i = 0; i < hops.length; i++) {
            if (localId !== runId) return;

            const div = document.createElement('div');
            div.className = 'router-node hop-active';
            div.textContent = `Hop ${i + 1}: ${hops[i]}`;
            hopDisplay.appendChild(div);

            statusText.textContent = `Packet at hop ${i + 1}/${hops.length}: ${hops[i]}`;
            statusText.style.color = '#3b82f6';

            await sleep(SLEEP_MS);
            if (localId !== runId) return;

            div.classList.remove('hop-active');
            div.classList.add('hop-visited');
        }

        if (localId === runId) {
            statusText.textContent = `Delivery complete. ${dest} reached in ${hops.length} hops.`;
            statusText.style.color = '#10b981';
        }
    }

    btnRoute.addEventListener('click', routePacket);
    btnResetRoute.addEventListener('click', resetRoute);
    destInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') routePacket(); });

    renderTable(null);
});
