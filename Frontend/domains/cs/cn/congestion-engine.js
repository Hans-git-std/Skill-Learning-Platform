/**
 * Computer Networks: Chapter 5 TCP Congestion Control Interactive Engine
 * Developed for SCME Platform
 */

document.addEventListener("DOMContentLoaded", () => {
    initCongestionSimulator();
});

function initCongestionSimulator() {
    const canvas = document.getElementById("cwnd-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const btnNext = document.getElementById("btn-cwnd-next");
    const btnLoss = document.getElementById("btn-cwnd-loss");
    const btnTimeout = document.getElementById("btn-cwnd-timeout");
    const btnReset = document.getElementById("btn-cwnd-reset");

    const spanCwnd = document.getElementById("cwnd-val");
    const spanSsthresh = document.getElementById("ssthresh-val");
    const spanState = document.getElementById("cwnd-state-val");

    let cwnd = 1; // in MSS
    let ssthresh = 16;
    let state = "Slow Start"; // "Slow Start", "Congestion Avoidance", "Fast Recovery"
    let history = [1];
    let maxRtt = 25;

    function resize() {
        if (!canvas.parentElement) return;
        canvas.width = canvas.parentElement.clientWidth || 320;
        canvas.height = 260;
    }
    window.addEventListener("resize", () => {
        resize();
        draw();
    });
    resize();

    function updateLabels() {
        if (spanCwnd) spanCwnd.innerText = `${cwnd.toFixed(1)} MSS`;
        if (spanSsthresh) spanSsthresh.innerText = `${ssthresh} MSS`;
        if (spanState) {
            spanState.innerText = state;
            if (state === "Slow Start") spanState.style.color = "#3b82f6";
            else if (state === "Congestion Avoidance") spanState.style.color = "#10b981";
            else spanState.style.color = "#ef4444";
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const axisColor = isDark ? "#52525b" : "#cbd5e1";
        const textColor = isDark ? "#e4e4e7" : "#18181b";

        const padLeft = 45;
        const padBottom = 30;
        const padTop = 20;
        const padRight = 20;

        const plotW = canvas.width - padLeft - padRight;
        const plotH = canvas.height - padBottom - padTop;
        const maxVal = Math.max(32, Math.max(...history) + 4);

        const toX = (i) => padLeft + (i / Math.max(history.length - 1, 10)) * plotW;
        const toY = (val) => (canvas.height - padBottom) - (val / maxVal) * plotH;

        // Draw axes
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padLeft, padTop);
        ctx.lineTo(padLeft, canvas.height - padBottom);
        ctx.lineTo(canvas.width - padRight, canvas.height - padBottom);
        ctx.stroke();

        // Labels
        ctx.fillStyle = axisColor;
        ctx.font = "10px monospace";
        ctx.fillText("CWND (MSS)", 10, padTop + 5);
        ctx.fillText("RTT Transmission Step", canvas.width - 130, canvas.height - 10);

        // Draw ssthresh line
        const sstY = toY(ssthresh);
        if (sstY >= padTop && sstY <= canvas.height - padBottom) {
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(padLeft, sstY);
            ctx.lineTo(canvas.width - padRight, sstY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "#f59e0b";
            ctx.fillText(`ssthresh = ${ssthresh}`, canvas.width - 105, sstY - 5);
        }

        // Draw CWND curve
        if (history.length > 1) {
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i < history.length; i++) {
                const x = toX(i);
                const y = toY(history[i]);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw points
            history.forEach((val, i) => {
                const x = toX(i);
                const y = toY(val);
                ctx.fillStyle = val >= ssthresh ? "#10b981" : "#3b82f6";
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    function stepNext() {
        if (state === "Slow Start") {
            cwnd = cwnd * 2;
            if (cwnd >= ssthresh) {
                state = "Congestion Avoidance";
            }
        } else if (state === "Congestion Avoidance") {
            cwnd += 1;
        } else if (state === "Fast Recovery") {
            state = "Congestion Avoidance";
            cwnd = ssthresh;
        }

        history.push(cwnd);
        if (history.length > 30) history.shift();
        updateLabels();
        draw();
    }

    function simulateLoss() {
        // Fast Retransmit (3 duplicate ACKs)
        ssthresh = Math.max(2, Math.floor(cwnd / 2));
        cwnd = ssthresh;
        state = "Fast Recovery (3x Dup ACKs)";
        history.push(cwnd);
        if (history.length > 30) history.shift();
        updateLabels();
        draw();
    }

    function simulateTimeout() {
        // Severe congestion: RTO Timeout
        ssthresh = Math.max(2, Math.floor(cwnd / 2));
        cwnd = 1;
        state = "Slow Start (RTO Timeout)";
        history.push(cwnd);
        if (history.length > 30) history.shift();
        updateLabels();
        draw();
    }

    function reset() {
        cwnd = 1;
        ssthresh = 16;
        state = "Slow Start";
        history = [1];
        updateLabels();
        draw();
    }

    if (btnNext) btnNext.onclick = stepNext;
    if (btnLoss) btnLoss.onclick = simulateLoss;
    if (btnTimeout) btnTimeout.onclick = simulateTimeout;
    if (btnReset) btnReset.onclick = reset;

    updateLabels();
    draw();
}
