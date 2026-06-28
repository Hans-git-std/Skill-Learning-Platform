document.addEventListener("DOMContentLoaded", () => {
    const domainInput = document.getElementById('dns-domain');
    const btnResolve = document.getElementById('btn-resolve');
    const btnResetDns = document.getElementById('btn-reset-dns');
    const statusText = document.getElementById('dns-status');
    const steps = document.querySelectorAll('.dns-step');
    const arrows = document.querySelectorAll('.dns-arrow');

    const SLEEP_MS = 800;
    let runId = 0;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const stepDetails = [
        { query: 'Query: example.com → ?', response: 'I don\'t know. Try Root (.com TLD)' },
        { query: 'Query: .com TLD nameserver?', response: 'a.gtld-servers.net (192.5.6.30)' },
        { query: 'Query: example.com @ TLD?', response: 'NS: a.iana-servers.net' },
        { query: 'Query: example.com @ Authoritative?', response: 'A: 93.184.216.34' },
        { query: 'Cached: example.com = 93.184.216.34', response: 'Browser opens TCP connection' }
    ];

    function resetDns() {
        runId++;
        steps.forEach(step => {
            step.classList.remove('active', 'done');
            const p = step.querySelector('.dns-query');
            if (p) p.textContent = 'Waiting...';
        });
        arrows.forEach(a => a.classList.remove('active'));
        statusText.textContent = 'DNS resolver idle. Enter a domain and click Resolve.';
        statusText.style.color = 'var(--text-muted)';
    }

    async function resolveDomain() {
        runId++;
        const localId = runId;
        const domain = domainInput.value.trim() || 'example.com';

        resetDns();
        runId = localId;

        statusText.textContent = `Resolving ${domain} via recursive DNS lookup...`;
        statusText.style.color = '#3b82f6';

        for (let i = 0; i < steps.length; i++) {
            if (localId !== runId) return;

            steps[i].classList.add('active');
            const queryEl = steps[i].querySelector('.dns-query');
            if (queryEl) {
                queryEl.textContent = stepDetails[i].query.replace('example.com', domain);
            }

            if (i > 0) arrows[i - 1].classList.add('active');

            statusText.textContent = stepDetails[i].response.replace('example.com', domain);
            statusText.style.color = i === steps.length - 1 ? '#10b981' : '#f59e0b';

            await sleep(SLEEP_MS);
            if (localId !== runId) return;

            steps[i].classList.remove('active');
            steps[i].classList.add('done');
            if (queryEl) {
                queryEl.textContent = stepDetails[i].response.replace('example.com', domain);
            }
        }

        if (localId === runId) {
            statusText.textContent = `${domain} → 93.184.216.34. Resolution complete. Result cached for TTL.`;
            statusText.style.color = '#10b981';
        }
    }

    btnResolve.addEventListener('click', resolveDomain);
    btnResetDns.addEventListener('click', resetDns);
    domainInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') resolveDomain(); });
});
