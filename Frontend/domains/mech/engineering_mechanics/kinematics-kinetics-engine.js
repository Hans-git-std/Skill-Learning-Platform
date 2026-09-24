/**
 * Engineering Mechanics: Chapters 4 & 5 Interactive Simulators
 * Developed for SCME Platform
 */

document.addEventListener("DOMContentLoaded", () => {
    initKinematicsSimulator();
    initKineticsSimulator();
});

// ============================================================================
// CHAPTER 4: KINEMATICS SIMULATOR (Projectile Motion)
// ============================================================================
function initKinematicsSimulator() {
    const canvas = document.getElementById("kinematics-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const vInput = document.getElementById("proj-velocity");
    const vDisplay = document.getElementById("proj-velocity-val");
    const aInput = document.getElementById("proj-angle");
    const aDisplay = document.getElementById("proj-angle-val");
    const gSelect = document.getElementById("proj-gravity");
    const btnFire = document.getElementById("btn-proj-fire");
    const btnReset = document.getElementById("btn-proj-reset");

    const spanFlight = document.getElementById("proj-flight-time");
    const spanHeight = document.getElementById("proj-max-height");
    const spanRange = document.getElementById("proj-total-range");

    let v0 = 35;
    let angleDeg = 45;
    let g = 9.81;

    let isFlying = false;
    let flightTime = 0;
    let trail = [];
    let animId = null;

    function resize() {
        if (!canvas.parentElement) return;
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 360;
    }
    window.addEventListener("resize", resize);
    resize();

    function calculateMetrics() {
        const rad = angleDeg * (Math.PI / 180);
        const tTotal = (2 * v0 * Math.sin(rad)) / g;
        const hMax = (Math.pow(v0 * Math.sin(rad), 2)) / (2 * g);
        const rTotal = (Math.pow(v0, 2) * Math.sin(2 * rad)) / g;

        if (spanFlight) spanFlight.innerText = `${tTotal.toFixed(2)} s`;
        if (spanHeight) spanHeight.innerText = `${hMax.toFixed(1)} m`;
        if (spanRange) spanRange.innerText = `${rTotal.toFixed(1)} m`;
        return { tTotal, hMax, rTotal, rad };
    }

    function drawScene(currentT = 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const textColor = isDark ? "#fafafa" : "#18181b";
        const groundY = canvas.height - 40;
        const originX = 50;

        // Ground line
        ctx.strokeStyle = isDark ? "#3f3f46" : "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvas.width, groundY);
        ctx.stroke();

        // Ground hash marks
        ctx.strokeStyle = isDark ? "#27272a" : "#e2e8f0";
        for (let x = 0; x < canvas.width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x - 10, groundY + 12);
            ctx.stroke();
        }

        const { tTotal, hMax, rTotal, rad } = calculateMetrics();

        // Calculate visual scale so trajectory fits canvas
        const scaleX = Math.min(6, (canvas.width - 120) / Math.max(10, rTotal));
        const scaleY = Math.min(4, (groundY - 60) / Math.max(10, hMax));
        const scale = Math.min(scaleX, scaleY);

        // Draw parabolic planned arc
        ctx.strokeStyle = "rgba(59, 130, 246, 0.35)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let t = 0; t <= tTotal; t += tTotal / 50) {
            const x = originX + (v0 * Math.cos(rad) * t) * scale;
            const y = groundY - (v0 * Math.sin(rad) * t - 0.5 * g * t * t) * scale;
            if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw trajectory trail
        if (trail.length > 1) {
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 3;
            ctx.beginPath();
            trail.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
        }

        // Draw Cannon / Launch Base
        ctx.fillStyle = isDark ? "#71717a" : "#475569";
        ctx.beginPath();
        ctx.arc(originX, groundY, 15, Math.PI, 0);
        ctx.fill();

        // Cannon barrel
        ctx.save();
        ctx.translate(originX, groundY);
        ctx.rotate(-rad);
        ctx.fillStyle = isDark ? "#a1a1aa" : "#334155";
        ctx.fillRect(0, -6, 28, 12);
        ctx.restore();

        // Current projectile position
        const tCur = Math.min(currentT, tTotal);
        const curPx = originX + (v0 * Math.cos(rad) * tCur) * scale;
        const curPy = groundY - (v0 * Math.sin(rad) * tCur - 0.5 * g * tCur * tCur) * scale;

        // Projectile ball
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(curPx, curPy, 7, 0, Math.PI * 2);
        ctx.fill();

        // Instantaneous Velocity Vectors
        if (isFlying || currentT > 0) {
            const vx = v0 * Math.cos(rad);
            const vy = v0 * Math.sin(rad) - g * tCur;
            const vLen = Math.sqrt(vx * vx + vy * vy);

            // Vector arrow
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(curPx, curPy);
            ctx.lineTo(curPx + (vx / v0) * 35, curPy - (vy / v0) * 35);
            ctx.stroke();

            // Label
            ctx.fillStyle = textColor;
            ctx.font = "11px monospace";
            ctx.fillText(`v = ${vLen.toFixed(1)} m/s (t=${tCur.toFixed(2)}s)`, curPx + 12, curPy - 10);
        }
    }

    function fire() {
        if (isFlying) return;
        isFlying = true;
        trail = [];
        flightTime = 0;
        const { tTotal } = calculateMetrics();
        const startTime = performance.now();

        function step(now) {
            const dt = (now - startTime) / 1000 * 1.4; // Simulation speed multiplier
            flightTime = dt;

            const rad = angleDeg * (Math.PI / 180);
            const rTotal = (Math.pow(v0, 2) * Math.sin(2 * rad)) / g;
            const hMax = (Math.pow(v0 * Math.sin(rad), 2)) / (2 * g);
            const groundY = canvas.height - 40;
            const scale = Math.min((canvas.width - 120) / Math.max(10, rTotal), (groundY - 60) / Math.max(10, hMax));

            const curPx = 50 + (v0 * Math.cos(rad) * flightTime) * scale;
            const curPy = groundY - (v0 * Math.sin(rad) * flightTime - 0.5 * g * flightTime * flightTime) * scale;
            trail.push({ x: curPx, y: curPy });

            drawScene(flightTime);

            if (flightTime < tTotal) {
                animId = requestAnimationFrame(step);
            } else {
                isFlying = false;
                drawScene(tTotal);
            }
        }
        animId = requestAnimationFrame(step);
    }

    function reset() {
        if (animId) cancelAnimationFrame(animId);
        isFlying = false;
        trail = [];
        flightTime = 0;
        drawScene(0);
    }

    if (vInput) vInput.oninput = (e) => {
        v0 = parseFloat(e.target.value);
        if (vDisplay) vDisplay.innerText = `${v0} m/s`;
        reset();
    };
    if (aInput) aInput.oninput = (e) => {
        angleDeg = parseFloat(e.target.value);
        if (aDisplay) aDisplay.innerText = `${angleDeg}°`;
        reset();
    };
    if (gSelect) gSelect.onchange = (e) => {
        g = parseFloat(e.target.value);
        reset();
    };
    if (btnFire) btnFire.onclick = fire;
    if (btnReset) btnReset.onclick = reset;

    calculateMetrics();
    drawScene(0);
}

// ============================================================================
// CHAPTER 5: KINETICS SIMULATOR (Conservation of Momentum & Collision)
// ============================================================================
function initKineticsSimulator() {
    const canvas = document.getElementById("kinetics-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const m1Input = document.getElementById("col-m1");
    const m1Display = document.getElementById("col-m1-val");
    const v1Input = document.getElementById("col-v1");
    const v1Display = document.getElementById("col-v1-val");
    const m2Input = document.getElementById("col-m2");
    const m2Display = document.getElementById("col-m2-val");
    const v2Input = document.getElementById("col-v2");
    const v2Display = document.getElementById("col-v2-val");
    const eInput = document.getElementById("col-e");
    const eDisplay = document.getElementById("col-e-val");

    const btnRun = document.getElementById("btn-col-run");
    const btnReset = document.getElementById("btn-col-reset");

    const spanP1 = document.getElementById("col-p-initial");
    const spanP2 = document.getElementById("col-p-final");
    const spanKeLoss = document.getElementById("col-ke-loss");

    let m1 = 4, v1 = 12;
    let m2 = 6, v2 = -6;
    let e = 0.8;

    let pos1 = 100, pos2 = 400;
    let curV1 = v1, curV2 = v2;
    let hasCollided = false;
    let isRunning = false;
    let animId = null;

    function resize() {
        if (!canvas.parentElement) return;
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 300;
    }
    window.addEventListener("resize", resize);
    resize();

    function updateMetrics() {
        const pInitial = (m1 * v1 + m2 * v2).toFixed(1);
        // Collision mechanics formulas:
        // v1_final = (m1*v1 + m2*v2 - m2*e*(v1 - v2)) / (m1 + m2)
        // v2_final = (m1*v1 + m2*v2 + m1*e*(v1 - v2)) / (m1 + m2)
        const v1Prime = ((m1 * v1 + m2 * v2) - m2 * e * (v1 - v2)) / (m1 + m2);
        const v2Prime = ((m1 * v1 + m2 * v2) + m1 * e * (v1 - v2)) / (m1 + m2);
        const pFinal = (m1 * v1Prime + m2 * v2Prime).toFixed(1);

        const keInitial = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
        const keFinal = 0.5 * m1 * v1Prime * v1Prime + 0.5 * m2 * v2Prime * v2Prime;
        const keLoss = Math.max(0, keInitial - keFinal).toFixed(1);

        if (spanP1) spanP1.innerText = `${pInitial} kg·m/s`;
        if (spanP2) spanP2.innerText = `${pFinal} kg·m/s`;
        if (spanKeLoss) spanKeLoss.innerText = `${keLoss} J (${((keLoss / Math.max(1, keInitial)) * 100).toFixed(0)}%)`;

        return { v1Prime, v2Prime };
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const textColor = isDark ? "#fafafa" : "#18181b";
        const trackY = canvas.height - 60;

        // Frictionless Track
        ctx.strokeStyle = isDark ? "#3f3f46" : "#cbd5e1";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(20, trackY);
        ctx.lineTo(canvas.width - 20, trackY);
        ctx.stroke();

        // Body 1
        const size1 = Math.min(80, Math.max(40, 30 + m1 * 4));
        const y1 = trackY - size1;
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(pos1 - size1 / 2, y1, size1, size1);
        ctx.strokeStyle = "#1d4ed8";
        ctx.lineWidth = 2;
        ctx.strokeRect(pos1 - size1 / 2, y1, size1, size1);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`m₁=${m1}kg`, pos1, y1 + size1 / 2);
        ctx.fillText(`v₁=${curV1.toFixed(1)}m/s`, pos1, y1 - 8);

        // Body 2
        const size2 = Math.min(80, Math.max(40, 30 + m2 * 4));
        const y2 = trackY - size2;
        ctx.fillStyle = "#10b981";
        ctx.fillRect(pos2 - size2 / 2, y2, size2, size2);
        ctx.strokeStyle = "#047857";
        ctx.lineWidth = 2;
        ctx.strokeRect(pos2 - size2 / 2, y2, size2, size2);

        ctx.fillStyle = "#ffffff";
        ctx.fillText(`m₂=${m2}kg`, pos2, y2 + size2 / 2);
        ctx.fillText(`v₂=${curV2.toFixed(1)}m/s`, pos2, y2 - 8);

        // Velocity Arrows
        drawArrow(pos1, y1 - 22, curV1 * 3, "#3b82f6");
        drawArrow(pos2, y2 - 22, curV2 * 3, "#10b981");

        // Impact spark effect
        if (hasCollided && Math.abs(pos1 - pos2) < (size1 + size2) / 2 + 10) {
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc((pos1 + pos2) / 2, trackY - 30, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.textAlign = "left";
    }

    function drawArrow(x, y, length, color) {
        if (Math.abs(length) < 2) return;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y);
        ctx.stroke();

        const dir = length > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(x + length, y);
        ctx.lineTo(x + length - dir * 6, y - 4);
        ctx.lineTo(x + length - dir * 6, y + 4);
        ctx.closePath();
        ctx.fill();
    }

    function run() {
        if (isRunning) return;
        isRunning = true;
        const { v1Prime, v2Prime } = updateMetrics();

        function loop() {
            const size1 = Math.min(80, Math.max(40, 30 + m1 * 4));
            const size2 = Math.min(80, Math.max(40, 30 + m2 * 4));
            const minDist = (size1 + size2) / 2;

            pos1 += curV1 * 0.15;
            pos2 += curV2 * 0.15;

            // Check collision
            if (!hasCollided && (pos2 - pos1) <= minDist) {
                hasCollided = true;
                curV1 = v1Prime;
                curV2 = v2Prime;
            }

            draw();

            // Stop when leaving canvas
            if (pos1 < -100 || pos2 > canvas.width + 100 || pos1 > canvas.width + 100 || pos2 < -100) {
                isRunning = false;
                return;
            }

            animId = requestAnimationFrame(loop);
        }
        animId = requestAnimationFrame(loop);
    }

    function reset() {
        if (animId) cancelAnimationFrame(animId);
        isRunning = false;
        hasCollided = false;
        pos1 = Math.max(80, canvas.width * 0.2);
        pos2 = Math.min(canvas.width - 80, canvas.width * 0.7);
        curV1 = v1;
        curV2 = v2;
        updateMetrics();
        draw();
    }

    if (m1Input) m1Input.oninput = (e) => {
        m1 = parseFloat(e.target.value);
        if (m1Display) m1Display.innerText = `${m1} kg`;
        reset();
    };
    if (v1Input) v1Input.oninput = (e) => {
        v1 = parseFloat(e.target.value);
        if (v1Display) v1Display.innerText = `${v1} m/s`;
        reset();
    };
    if (m2Input) m2Input.oninput = (e) => {
        m2 = parseFloat(e.target.value);
        if (m2Display) m2Display.innerText = `${m2} kg`;
        reset();
    };
    if (v2Input) v2Input.oninput = (e) => {
        v2 = parseFloat(e.target.value);
        if (v2Display) v2Display.innerText = `${v2} m/s`;
        reset();
    };
    if (eInput) eInput.oninput = (evt) => {
        e = parseFloat(evt.target.value);
        if (eDisplay) eDisplay.innerText = e.toFixed(2);
        reset();
    };

    if (btnRun) btnRun.onclick = run;
    if (btnReset) btnReset.onclick = reset;

    reset();
}
