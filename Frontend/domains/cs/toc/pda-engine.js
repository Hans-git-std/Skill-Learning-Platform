/* ==========================================
   PDA ENGINE - 3D Stack Memory Machine
   ========================================== */
(function() {
    const container = document.getElementById('pda-canvas-container');
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
    container.appendChild(canvas);
    container.style.minHeight = '460px';
    container.style.padding = '0';
    const ctx = canvas.getContext('2d');

    // PDA for a^n b^n — push a's, pop on b's
    const INPUT = 'aabb';
    let stack   = ['$']; // $ = bottom-of-stack marker
    let stepIdx  = 0;
    let pdaState = 'q0'; // q0=reading a's, q1=reading b's, q_accept=done
    let statusMsg= `Stack shows a^n b^n check for "${INPUT}". Press Push to begin.`;
    let lastOp   = null; // 'push' | 'pop'
    let animY    = 0;    // animation offset for top item
    let animating= false;

    const STACK_COLORS = {
        '$': '#475569',
        'a': '#3b82f6',
        'b': '#ef4444',
    };

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width  || 700;
        canvas.height = rect.height || 460;
        draw();
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#0a0f1e');
        bg.addColorStop(1, '#0f172a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // --- STACK VISUALIZER ---
        const SW = Math.min(160, W * 0.22);
        const SX = W / 2 - SW / 2;
        const CELL_H = 48, CELL_GAP = 4;
        const MAX_VISIBLE = 7;
        const SY_BOTTOM = H * 0.82;

        // Stack container walls
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        // left wall
        ctx.beginPath();
        ctx.moveTo(SX, SY_BOTTOM - MAX_VISIBLE * (CELL_H + CELL_GAP));
        ctx.lineTo(SX, SY_BOTTOM);
        ctx.stroke();
        // right wall
        ctx.beginPath();
        ctx.moveTo(SX + SW, SY_BOTTOM - MAX_VISIBLE * (CELL_H + CELL_GAP));
        ctx.lineTo(SX + SW, SY_BOTTOM);
        ctx.stroke();
        // bottom
        ctx.beginPath();
        ctx.moveTo(SX - 10, SY_BOTTOM);
        ctx.lineTo(SX + SW + 10, SY_BOTTOM);
        ctx.stroke();

        // "TOP" label with arrow
        const topLabelY = SY_BOTTOM - stack.length * (CELL_H + CELL_GAP) - 30;
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 12px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TOP', SX + SW + 40, topLabelY + 4);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(SX + SW + 14, topLabelY);
        ctx.lineTo(SX + SW + 6, topLabelY);
        ctx.stroke();

        // draw stack items (bottom to top)
        stack.forEach((item, i) => {
            const itemY = SY_BOTTOM - (i + 1) * (CELL_H + CELL_GAP);
            const isTop = (i === stack.length - 1);
            const yOff  = isTop ? animY : 0;

            const color = STACK_COLORS[item] || '#3b82f6';
            const grad  = ctx.createLinearGradient(SX, itemY + yOff, SX, itemY + yOff + CELL_H);
            grad.addColorStop(0, color + 'cc');
            grad.addColorStop(1, color + '44');
            ctx.fillStyle  = grad;
            ctx.strokeStyle= color;
            ctx.lineWidth  = 2;

            if (isTop && (lastOp === 'push' || lastOp === 'pop')) {
                ctx.shadowColor = color;
                ctx.shadowBlur  = 18;
            }
            ctx.beginPath();
            ctx.roundRect(SX + 4, itemY + yOff, SW - 8, CELL_H, 6);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#f8fafc';
            ctx.font = `bold ${CELL_H * 0.45}px Fira Code, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item, SX + SW / 2, itemY + yOff + CELL_H / 2);
        });

        // --- INPUT STRIP ---
        const charW = 36, charH = 36;
        const totalW = INPUT.length * (charW + 5);
        const stripX = (W - totalW) / 2;
        const stripY = 22;
        INPUT.split('').forEach((c, i) => {
            const cx = stripX + i * (charW + 5);
            const isRead = i < stepIdx;
            const isCurrent = i === stepIdx;
            ctx.fillStyle = isRead ? '#0f2b1f' : (isCurrent ? '#1e3a5f' : '#1e293b');
            ctx.strokeStyle= isRead ? '#10b981'  : (isCurrent ? '#3b82f6' : '#334155');
            ctx.lineWidth  = 2;
            ctx.beginPath();
            ctx.roundRect(cx, stripY, charW, charH, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = isRead ? '#10b981' : (isCurrent ? '#f8fafc' : '#64748b');
            ctx.font = 'bold 18px Fira Code, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(c, cx + charW / 2, stripY + charH / 2);
        });

        // read head triangle
        if (stepIdx < INPUT.length) {
            const hx = stripX + stepIdx * (charW + 5) + charW / 2;
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.moveTo(hx, stripY + charH + 8);
            ctx.lineTo(hx - 8, stripY + charH + 20);
            ctx.lineTo(hx + 8, stripY + charH + 20);
            ctx.closePath();
            ctx.fill();
        }

        // --- PDA State ---
        const stateX = W * 0.18, stateY = H * 0.45;
        const SR = 36;
        const sColor = pdaState === 'q_accept' ? '#10b981' : '#3b82f6';
        const sGlow  = ctx.createRadialGradient(stateX, stateY, 0, stateX, stateY, SR * 2.2);
        sGlow.addColorStop(0, sColor + '44');
        sGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = sGlow;
        ctx.beginPath();
        ctx.arc(stateX, stateY, SR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        const sGrad = ctx.createRadialGradient(stateX - SR*0.3, stateY - SR*0.3, 0, stateX, stateY, SR);
        sGrad.addColorStop(0, '#1e293b');
        sGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = sGrad;
        ctx.strokeStyle = sColor;
        ctx.lineWidth   = 3;
        ctx.beginPath();
        ctx.arc(stateX, stateY, SR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pdaState, stateX, stateY);

        // State label
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('Current State', stateX, stateY + SR + 16);

        // connector from state to stack
        ctx.strokeStyle = '#1e3a5f';
        ctx.setLineDash([5, 7]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(stateX + SR, stateY);
        ctx.lineTo(SX - 10, stateY);
        ctx.stroke();
        ctx.setLineDash([]);

        // --- Status bar ---
        const boxW = Math.min(W - 20, 540);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(W/2 - boxW/2, H - 66, boxW, 46, 8);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${W < 450 ? 10 : 13}px Fira Code, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusMsg, W / 2, H - 43);
    }

    function doStep() {
        if (stepIdx >= INPUT.length) return;
        const ch = INPUT[stepIdx];
        if (ch === 'a') {
            stack.push('a');
            lastOp = 'push';
            animY = -20;
            pdaState = 'q0';
            statusMsg = `Read 'a' → PUSH 'a' onto stack. Stack height: ${stack.length - 1}`;
        } else if (ch === 'b') {
            pdaState = 'q1';
            if (stack[stack.length - 1] === 'a') {
                stack.pop();
                lastOp = 'pop';
                animY = 20;
                statusMsg = `Read 'b' → POP 'a' from stack. Stack height: ${stack.length - 1}`;
            } else {
                statusMsg = `Read 'b' → Stack empty! Mismatch — REJECT.`;
                pdaState = 'q_reject';
                stepIdx++;
                draw();
                return;
            }
        }
        stepIdx++;
        if (stepIdx === INPUT.length) {
            if (stack.length === 1 && stack[0] === '$') {
                pdaState = 'q_accept';
                statusMsg = `✓ ACCEPTED — Stack empty (only $ marker). "${INPUT}" ∈ a^n·b^n`;
            } else {
                pdaState = 'q_reject';
                statusMsg = `✗ REJECTED — Stack still has items. Counts don't match.`;
            }
        }
        draw();
        // animate
        let frames = 0;
        const anim = () => {
            animY *= 0.7;
            if (Math.abs(animY) < 0.5) { animY = 0; return; }
            draw();
            requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
    }

    document.getElementById('btn-pda-push').addEventListener('click', () => {
        if (stepIdx >= INPUT.length) return;
        if (INPUT[stepIdx] !== 'a') { statusMsg = 'Next char is b — use Pop instead!'; draw(); return; }
        doStep();
    });

    document.getElementById('btn-pda-pop').addEventListener('click', () => {
        if (stepIdx >= INPUT.length) return;
        if (INPUT[stepIdx] !== 'b') { statusMsg = 'Next char is a — use Push instead!'; draw(); return; }
        doStep();
    });

    document.getElementById('btn-pda-reset').addEventListener('click', () => {
        stack   = ['$'];
        stepIdx  = 0;
        pdaState = 'q0';
        statusMsg = `Stack shows a^n b^n check for "${INPUT}". Press Push to begin.`;
        lastOp   = null;
        animY    = 0;
        draw();
    });

    window.addEventListener('resize', resize);
    resize();
})();
