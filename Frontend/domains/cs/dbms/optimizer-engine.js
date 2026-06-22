document.addEventListener("DOMContentLoaded", () => {
    const explainBtn = document.getElementById('btn-explain');
    const indexToggle = document.getElementById('index-toggle');
    const planDisplay = document.getElementById('plan-display');

    function runExplain() {
        planDisplay.innerHTML = '<p class="engine-caption">Analyzing statistics and calculating cost...</p>';
        
        setTimeout(() => {
            const hasIndex = indexToggle.value === 'indexed';
            
            if (!hasIndex) {
                // Bad Execution Plan
                planDisplay.innerHTML = `
                    <div class="log-entry" style="border-left-color: #ef4444; width: 100%;">
                        <strong>[Cost: 8,450.00] Hash Join</strong> (Inner)
                        <br><span style="color: var(--text-muted);">↳ Joins the two full table scans below in memory.</span>
                    </div>
                    <div class="log-entry" style="border-left-color: #ef4444; width: 90%; margin-left: 2rem;">
                        <strong>[Cost: 4,100.00] Sequential Scan</strong> on <em>orders</em>
                        <br><span style="color: var(--text-muted);">↳ Reads all 100,000 pages from disk. (No index available)</span>
                    </div>
                    <div class="log-entry" style="border-left-color: #ef4444; width: 90%; margin-left: 2rem;">
                        <strong>[Cost: 3,900.00] Sequential Scan</strong> on <em>users</em>
                        <br><span style="color: var(--text-muted);">↳ Reads all 50,000 pages from disk.</span>
                    </div>
                    <p class="engine-caption" style="color: #ef4444;">Warning: Heavy disk I/O detected. Consider adding an index to orders.user_id.</p>
                `;
            } else {
                // Optimized Execution Plan
                planDisplay.innerHTML = `
                    <div class="log-entry safe" style="width: 100%;">
                        <strong>[Cost: 14.50] Nested Loop Join</strong> (Inner)
                        <br><span style="color: var(--text-muted);">↳ Loops through users, uses index to fetch orders.</span>
                    </div>
                    <div class="log-entry safe" style="width: 90%; margin-left: 2rem;">
                        <strong>[Cost: 2.10] Index Scan</strong> on <em>users_pkey</em>
                        <br><span style="color: var(--text-muted);">↳ Quickly finds the specific user in the B-Tree.</span>
                    </div>
                    <div class="log-entry safe" style="width: 90%; margin-left: 2rem;">
                        <strong>[Cost: 8.40] Index Seek</strong> on <em>idx_orders_user_id</em>
                        <br><span style="color: var(--text-muted);">↳ Jumps directly to the order pages without scanning.</span>
                    </div>
                    <p class="engine-caption" style="color: #10b981;">Optimizer Success: Query executed via B-Tree index lookup.</p>
                `;
            }
        }, 600); // Artificial delay to make it feel like it's processing
    }

    explainBtn.addEventListener('click', runExplain);
});