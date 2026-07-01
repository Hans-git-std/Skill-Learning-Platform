/* ==========================================
   NFA ENGINE - Parallel Universe Execution
   ========================================== */
(function() {
    const container = document.getElementById('nfa-canvas-container');
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
    container.appendChild(canvas);
    container.style.minHeight = '460px';
    container.style.padding = '0';
    const ctx = canvas.getContext('2d');

    // NFA: accepts strings ending in 'ab'
    // States: q0, q1, q2(accept)
    // Transitions: q0 --a--> q0, q0 --b--> q0, q0 --a--> q1 (nondeterministic), q1 --b--> q2
    const INPUT = 'baab';
    const nfaDef = {
        states:  ['q₀', 'q₁', 'q₂*'],
        start:   0,
        accept:  [2],
        trans:   { '0,a': [0,1], '0,b': [0], '1,b': [2], '2,a': [], '2,b': [] }
    };

    let threads = [];  // { stateIdx, stepIdx, x, y, targetX, targetY, color, alive, accepted }
    let stepIdx = 0;
    let animating = false;
    let timer = null;
    let statusMsg = `Input: "${INPUT}" — Press Trigger ε-Fork to start`;
    let phase = 'idle'; // idle | running | done

    const COLORS = ['#3b82f6','#a855f7','#f59e0b','#10b981','#ef4444','#ec4899','#06b6d4'];
    const STATE_X = [0.15, 0.5, 0.85];
    const STATE_Y = 0.55;
    const R = 34;

    function px(r) { return r * canvas.width; }
    function py(r) { return r * canvas.height; }

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width  || 700;
        canvas.height = rect.height || 460;
        draw();
    }

    function drawState(sx, sy, label, isAccept, color, pulse) {
        if (pulse > 0) {
            const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 2.8);
            glow.addColorStop(0, color + '60');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(sx, sy, R * 2.8, 0, Math.PI * 2);
            ctx.fill();
        }
        const grad = ctx.createRadialGradient(sx - R*0.3, sy - R*0.3, 0, sx, sy, R);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0a0f1e');
        ctx.fillStyle = grad;
        ctx.strokeStyle = pulse > 0 ? color : '#334155';
        ctx.lineWidth   = pulse > 0 ? 3 : 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (isAccept) {
            ctx.strokeStyle = pulse > 0 ? color : '#475569';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, R - 6, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, sx, sy);
    }

    function drawThread(t) {
        if (!t.alive) return;
        const tx = t.x, ty = t.y;
        // glow halo
        const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 22);
        g.addColorStop(0, t.color + 'cc');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tx, ty, 22, 0, Math.PI * 2);
        ctx.fill();
        // core dot
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(tx, ty, 10, 0, Math.PI * 2);
        ctx.fill();
        // label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('T'+(threads.indexOf(t)+1), tx, ty);
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // bg
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#0a0f1e');
        bg.addColorStop(1, '#0f172a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // arrows between states
        const arrowDefs = [
            { fx:0, tx:0, label:'a,b', self:true },
            { fx:0, tx:1, label:'a', self:false },
            { fx:1, tx:2, label:'b', self:false },
        ];
        arrowDefs.forEach(a => {
            const fsx = px(STATE_X[a.fx]), fsy = py(STATE_Y);
            const tsx = px(STATE_X[a.tx]), tsy = py(STATE_Y);
            ctx.strokeStyle = '#334155';
            ctx.fillStyle   = '#334155';
            ctx.lineWidth   = 1.5;
            if (a.self) {
                ctx.beginPath();
                ctx.arc(fsx, fsy - R * 1.15, R * 0.9, 0.4, Math.PI - 0.4, false);
                ctx.stroke();
                ctx.font = '12px Fira Code, monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#64748b';
                ctx.fillText(a.label, fsx, fsy - R * 2.15);
            } else {
                const mx = (fsx+tsx)/2, my = fsy - 20;
                ctx.beginPath();
                ctx.moveTo(fsx + R, fsy);
                ctx.quadraticCurveTo(mx, my, tsx - R, tsy);
                ctx.stroke();
                const ang = Math.atan2(tsy - my, tsx - R - mx);
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.moveTo(tsx - R, tsy);
                ctx.lineTo(tsx - R - 10*Math.cos(ang-0.4), tsy - 10*Math.sin(ang-0.4));
                ctx.lineTo(tsx - R - 10*Math.cos(ang+0.4), tsy - 10*Math.sin(ang+0.4));
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#64748b';
                ctx.font = '12px Fira Code, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(a.label, mx, my - 10);
            }
        });

        // pulse per state: which threads are on each state?
        const pulseMap = {};
        threads.forEach(t => {
            if (t.alive) {
                if (!pulseMap[t.stateIdx]) pulseMap[t.stateIdx] = t.color;
            }
        });

        // states
        nfaDef.states.forEach((lbl, i) => {
            const sx = px(STATE_X[i]), sy = py(STATE_Y);
            drawState(sx, sy, lbl, nfaDef.accept.includes(i), pulseMap[i] || '#3b82f6', pulseMap[i] ? 1 : 0);
        });

        // threads
        threads.forEach(t => drawThread(t));

        // input display
        const charW = 28, charH = 34, totalW = INPUT.length * (charW+4);
        const startX = (W - totalW)/2, topY = 16;
        for (let i = 0; i < INPUT.length; i++) {
            const cx = startX + i*(charW+4);
            ctx.fillStyle = i < stepIdx ? '#1e4d2b' : (i === stepIdx ? '#1e3a5f' : '#1e293b');
            ctx.strokeStyle = i < stepIdx ? '#10b981' : (i === stepIdx ? '#3b82f6' : '#334155');
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx, topY, charW, charH, 4);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = i < stepIdx ? '#10b981' : (i === stepIdx ? '#f8fafc' : '#64748b');
            ctx.font = 'bold 16px Fira Code, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(INPUT[i], cx + charW/2, topY + charH/2);
        }

        // legend (thread colors)
        if (threads.length > 0) {
            threads.forEach((t, i) => {
                const lx = 16 + i * 80, ly = H - 40;
                ctx.fillStyle = t.alive ? t.color : '#334155';
                ctx.beginPath();
                ctx.arc(lx + 8, ly, 7, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = t.alive ? '#f8fafc' : '#475569';
                ctx.font = '11px Fira Code, monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const stLbl = nfaDef.states[t.stateIdx] || '?';
                ctx.fillText(`T${i+1}:${stLbl}${!t.alive?(t.accepted?'✓':'✗'):''}`, lx + 20, ly);
            });
        }

        // status
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, H-44, W, 44);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusMsg, W/2, H-22);
    }

    function computeNextStates(stateIdx, sym) {
        const key = `${stateIdx},${sym}`;
        return nfaDef.trans[key] || [];
    }

    function advanceStep() {
        if (stepIdx >= INPUT.length) {
            // evaluate
            const anyAccepted = threads.some(t => t.alive && nfaDef.accept.includes(t.stateIdx));
            threads.forEach(t => {
                if (t.alive) { t.accepted = nfaDef.accept.includes(t.stateIdx); t.alive = true; }
            });
            statusMsg = anyAccepted
                ? `✓ ACCEPTED — At least 1 thread reached accepting state q₂.`
                : `✗ REJECTED — No thread reached an accepting state.`;
            animating = false;
            draw();
            return;
        }
        const sym = INPUT[stepIdx];
        const newThreads = [];
        threads.forEach(t => {
            if (!t.alive) { newThreads.push(t); return; }
            const nexts = computeNextStates(t.stateIdx, sym);
            if (nexts.length === 0) {
                t.alive = false;
                t.accepted = false;
                newThreads.push(t);
            } else if (nexts.length === 1) {
                t.stateIdx = nexts[0];
                t.x = px(STATE_X[nexts[0]]);
                t.y = py(STATE_Y);
                newThreads.push(t);
            } else {
                nexts.forEach((ns, ni) => {
                    newThreads.push({
                        stateIdx: ns,
                        x: px(STATE_X[ns]),
                        y: py(STATE_Y),
                        color: COLORS[(newThreads.length) % COLORS.length],
                        alive: true,
                        accepted: false
                    });
                });
            }
        });
        threads = newThreads;
        stepIdx++;
        const aliveCount = threads.filter(t => t.alive).length;
        statusMsg = `Read '${sym}' → ${aliveCount} active thread(s) running in parallel`;
        draw();
        if (animating) timer = setTimeout(advanceStep, 1100);
    }

    document.getElementById('btn-nfa-fork').addEventListener('click', () => {
        if (animating) return;
        clearTimeout(timer);
        stepIdx = 0;
        threads = [{ stateIdx: 0, x: px(STATE_X[0]), y: py(STATE_Y), color: COLORS[0], alive: true, accepted: false }];
        statusMsg = `Starting NFA on "${INPUT}" — Watch threads fork!`;
        animating = true;
        draw();
        timer = setTimeout(advanceStep, 700);
    });

    document.getElementById('btn-nfa-reset').addEventListener('click', () => {
        clearTimeout(timer);
        animating = false;
        stepIdx = 0;
        threads = [];
        statusMsg = `Input: "${INPUT}" — Press Trigger ε-Fork to start`;
        draw();
    });

    window.addEventListener('resize', resize);
    resize();
})();
