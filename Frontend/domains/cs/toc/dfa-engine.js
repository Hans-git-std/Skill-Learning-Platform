/* ==========================================
   DFA ENGINE - Animated State Graph Traversal
   ========================================== */
(function() {
    const container = document.getElementById('dfa-canvas-container');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'dfa-canvas';
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
    container.appendChild(canvas);
    container.style.minHeight = '420px';
    container.style.padding = '0';

    const ctx = canvas.getContext('2d');

    // --- DFA Definition: accepts binary strings ending in "11" ---
    const states = [
        { id: 'q0', label: 'q₀', x: 0.15, y: 0.5, start: true, accept: false },
        { id: 'q1', label: 'q₁', x: 0.5,  y: 0.5, start: false, accept: false },
        { id: 'q2', label: 'q₂', x: 0.85, y: 0.5, start: false, accept: true  },
    ];
    const transitions = [
        { from: 'q0', to: 'q0', label: '0', cx: 0, cy: -0.18 },
        { from: 'q0', to: 'q1', label: '1', cx: 0, cy:  0 },
        { from: 'q1', to: 'q0', label: '0', cx: 0, cy:  0.12 },
        { from: 'q1', to: 'q2', label: '1', cx: 0, cy:  0 },
        { from: 'q2', to: 'q0', label: '0', cx: 0, cy: -0.12 },
        { from: 'q2', to: 'q2', label: '1', cx: 0, cy: -0.18 },
    ];

    const INPUT_STR = '01011';
    let currentState = 'q0';
    let stepIndex = 0;
    let tokenPct = 0;
    let animating = false;
    let animFrame = null;
    let trail = [];
    let statusMsg = `Input: "${INPUT_STR}" — Press Execute to begin`;
    let accepted = null;
    const R = 38;

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width  || 700;
        canvas.height = rect.height || 420;
        draw();
    }

    function stateById(id) { return states.find(s => s.id === id); }
    function px(rel) { return rel * canvas.width; }
    function py(rel) { return rel * canvas.height; }

    function drawArrow(x1, y1, x2, y2, label, color, curved, selfLoop, fromState) {
        ctx.strokeStyle = color;
        ctx.fillStyle   = color;
        ctx.lineWidth   = 2;
        const headLen = 12;

        if (selfLoop) {
            const lx = px(fromState.x);
            const ly = py(fromState.y + curved);
            ctx.beginPath();
            ctx.arc(lx, ly - R * 0.6, R * 0.9, 0.4, Math.PI - 0.4, false);
            ctx.stroke();
            // arrowhead
            const tx = lx + R * 0.65;
            const ty = ly - R * 0.05;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - headLen, ty - 6);
            ctx.lineTo(tx - headLen + 4, ty + 5);
            ctx.closePath();
            ctx.fill();
            // label
            ctx.fillStyle = color;
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, lx, ly - R * 1.65);
            return;
        }

        const dx = x2 - x1, dy = y2 - y1;
        const dist = Math.sqrt(dx*dx+dy*dy);
        const nx = dx/dist, ny = dy/dist;
        const mx = (x1+x2)/2, my = (y1+y2)/2;
        const cpx = mx - ny * py(Math.abs(curved)) * (curved < 0 ? -1 : 1) * 0.4;
        const cpy = my + nx * py(Math.abs(curved)) * (curved < 0 ? -1 : 1) * 0.4;

        // adjust start/end to state edges
        const sx = x1 + nx * R, sy = y1 + ny * R;
        const ex = x2 - nx * R, ey = y2 - ny * R;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
        ctx.stroke();

        // arrowhead
        const ang = Math.atan2(ey - cpy, ex - cpx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(ang - 0.4), ey - headLen * Math.sin(ang - 0.4));
        ctx.lineTo(ex - headLen * Math.cos(ang + 0.4), ey - headLen * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();

        // label
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cpx, cpy - 10);
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // background gradient
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#0a0f1e');
        bg.addColorStop(1, '#0f172a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // draw transitions
        transitions.forEach(t => {
            const from = stateById(t.from), to = stateById(t.to);
            const isSelf = t.from === t.to;
            const isActive = trail.length > 0 && 
                trail[trail.length-1].from === t.from && 
                trail[trail.length-1].to === t.to && 
                trail[trail.length-1].label === t.label;
            const color = isActive ? '#3b82f6' : '#334155';
            drawArrow(px(from.x), py(from.y), px(to.x), py(to.y), t.label, color, t.cy, isSelf, from);
        });

        // start arrow
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(px(states[0].x) - R - 30, py(states[0].y));
        ctx.lineTo(px(states[0].x) - R - 5, py(states[0].y));
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(px(states[0].x) - R - 5, py(states[0].y));
        ctx.lineTo(px(states[0].x) - R - 17, py(states[0].y) - 6);
        ctx.lineTo(px(states[0].x) - R - 17, py(states[0].y) + 6);
        ctx.closePath();
        ctx.fill();

        // draw states
        states.forEach(s => {
            const sx = px(s.x), sy = py(s.y);
            const isActive = s.id === currentState;
            const isAccept = s.accept;

            // glow
            if (isActive) {
                const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 2.5);
                const ac = accepted === null ? '#3b82f6' : (accepted ? '#10b981' : '#ef4444');
                glow.addColorStop(0, ac + '55');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(sx, sy, R * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // circle
            const ac = accepted === null ? '#3b82f6' : (accepted ? '#10b981' : '#ef4444');
            ctx.strokeStyle = isActive ? ac : '#475569';
            ctx.lineWidth   = isActive ? 3 : 2;
            const grad = ctx.createRadialGradient(sx - R*0.3, sy - R*0.3, 0, sx, sy, R);
            grad.addColorStop(0, isActive ? '#1e3a5f' : '#1e293b');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // accept double ring
            if (isAccept) {
                ctx.strokeStyle = isActive ? ac : '#475569';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sx, sy, R - 6, 0, Math.PI * 2);
                ctx.stroke();
            }

            // label
            ctx.fillStyle = isActive ? '#f8fafc' : '#94a3b8';
            ctx.font = `bold ${H > 300 ? 16 : 13}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.label, sx, sy);
        });

        // status bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, H - 45, W, 45);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${W < 450 ? 10 : 13}px Fira Code, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusMsg, W / 2, H - 22);

        // input char display
        const charW = 28, charH = 34, totalW = INPUT_STR.length * (charW + 4);
        const startX = (W - totalW) / 2, topY = 18;
        for (let i = 0; i < INPUT_STR.length; i++) {
            const cx = startX + i * (charW + 4);
            ctx.fillStyle = i < stepIndex ? '#1e4d2b' : (i === stepIndex ? '#1e3a5f' : '#1e293b');
            ctx.strokeStyle = i < stepIndex ? '#10b981' : (i === stepIndex ? '#3b82f6' : '#334155');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx, topY, charW, charH, 4);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = i < stepIndex ? '#10b981' : (i === stepIndex ? '#f8fafc' : '#64748b');
            ctx.font = 'bold 16px Fira Code, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(INPUT_STR[i], cx + charW / 2, topY + charH / 2);
        }
    }

    function getTransition(fromId, symbol) {
        return transitions.find(t => t.from === fromId && t.label === symbol);
    }

    function runStep() {
        if (stepIndex >= INPUT_STR.length) {
            accepted = stateById(currentState).accept;
            statusMsg = accepted
                ? `✓ ACCEPTED — "${INPUT_STR}" ends in '11'. State ${currentState} is accepting.`
                : `✗ REJECTED — "${INPUT_STR}" rejected. State ${currentState} is not accepting.`;
            animating = false;
            draw();
            return;
        }
        const sym = INPUT_STR[stepIndex];
        const t = getTransition(currentState, sym);
        if (!t) { animating = false; return; }

        statusMsg = `Reading '${sym}' in state ${currentState} → ${t.to}`;
        trail = [t];
        currentState = t.to;
        stepIndex++;
        draw();
        if (animating) {
            animFrame = setTimeout(runStep, 900);
        }
    }

    document.getElementById('btn-dfa-run').addEventListener('click', () => {
        if (animating) return;
        currentState = 'q0';
        stepIndex = 0;
        trail = [];
        accepted = null;
        statusMsg = `Starting execution of "${INPUT_STR}"...`;
        animating = true;
        clearTimeout(animFrame);
        runStep();
    });

    document.getElementById('btn-dfa-reset').addEventListener('click', () => {
        clearTimeout(animFrame);
        animating = false;
        currentState = 'q0';
        stepIndex = 0;
        trail = [];
        accepted = null;
        statusMsg = `Input: "${INPUT_STR}" — Press Execute to begin`;
        draw();
    });

    window.addEventListener('resize', resize);
    resize();
})();
