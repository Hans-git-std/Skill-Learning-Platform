/* ==========================================
   TURING MACHINE ENGINE - Infinite Tape
   ========================================== */
(function() {
    const container = document.getElementById('turing-canvas-container');
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
    container.appendChild(canvas);
    container.style.minHeight = '480px';
    container.style.padding = '0';
    const ctx = canvas.getContext('2d');

    // Turing Machine: Unary incrementer
    // Tape: 1 1 1 _ → 1 1 1 1 _
    // States: q0=scan right, q1=write 1, q_accept
    // Transitions: (q0, 1) → (q0, 1, R), (q0, _) → (q1, 1, L), (q1, 1) → (q1, 1, L), (q1, B) → (q_accept, B, R)
    const BLANK = '□';
    let tape = ['1','1','1', BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK];
    let head = 0;
    let state = 'q₀';
    let running = false;
    let runTimer = null;
    let statusMsg = 'Turing Machine: Unary Incrementer (1+1+1 = 4)';
    let halted = false;
    let offset = 0;      // tape scroll offset (in cells)
    let headAnimX = 0;   // smooth head animation
    let headTargetX = 0;
    let animId = null;
    let stepCount = 0;

    const TRANSITIONS = {
        'q₀,1':  { newState: 'q₀', write: '1',   move: 1  },
        'q₀,□':  { newState: 'q₁', write: '1',   move: -1 },
        'q₁,1':  { newState: 'q₁', write: '1',   move: -1 },
        'q₁,B':  { newState: 'q_a', write: 'B',  move: 1  },
        'q₁,□':  { newState: 'q_a', write: '□',  move: 1  },
    };

    function getTape(i) {
        if (i < 0) return BLANK;
        if (i >= tape.length) { tape.push(BLANK); }
        return tape[i];
    }
    function setTape(i, v) {
        while (tape.length <= i) tape.push(BLANK);
        tape[i] = v;
    }

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width  || 700;
        canvas.height = rect.height || 480;
        headAnimX = headTargetX = canvas.width / 2;
        draw();
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#0a0f1e');
        bg.addColorStop(1, '#070e1d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // --- Tape ---
        const CELL_W = Math.min(60, W / 12);
        const CELL_H = 56;
        const tapeY  = H * 0.46 - CELL_H / 2;
        const CENTER_X = W / 2;
        const visibleCells = Math.ceil(W / CELL_W) + 2;
        const startCell = head - Math.floor(visibleCells / 2) + Math.round(offset);

        for (let i = 0; i < visibleCells; i++) {
            const cellIdx = startCell + i;
            const cellX   = CENTER_X + (cellIdx - head) * CELL_W - CELL_W / 2;
            const isHead  = cellIdx === head;
            const sym     = getTape(cellIdx < 0 ? -1 : cellIdx);
            const isWritten = sym !== BLANK;

            const borderColor = isHead ? '#f59e0b' : (isWritten ? '#3b82f6' : '#1e293b');
            const bgColor1 = isHead ? '#2d1b00' : (isWritten ? '#0f1e36' : '#0d1525');
            const bgColor2 = '#070e1d';

            const grad = ctx.createLinearGradient(cellX, tapeY, cellX, tapeY + CELL_H);
            grad.addColorStop(0, bgColor1);
            grad.addColorStop(1, bgColor2);
            ctx.fillStyle  = grad;
            ctx.strokeStyle= borderColor;
            ctx.lineWidth  = isHead ? 2.5 : 1;

            if (isHead) {
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur  = 16;
            }
            ctx.fillRect(cellX, tapeY, CELL_W, CELL_H);
            ctx.strokeRect(cellX, tapeY, CELL_W, CELL_H);
            ctx.shadowBlur = 0;

            ctx.fillStyle = isHead ? '#f59e0b' : (isWritten ? '#93c5fd' : '#1e3a5f');
            ctx.font = `bold ${Math.round(CELL_W * 0.42)}px Fira Code, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sym === BLANK ? BLANK : sym, cellX + CELL_W / 2, tapeY + CELL_H / 2);

            // cell address (small)
            if (cellIdx >= 0) {
                ctx.fillStyle = '#1e3a5f';
                ctx.font = '9px Fira Code, monospace';
                ctx.fillText(cellIdx, cellX + CELL_W / 2, tapeY + CELL_H - 8);
            }
        }

        // read/write head indicator (triangle above tape)
        const headX = CENTER_X;
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(headX, tapeY - 6);
        ctx.lineTo(headX - 10, tapeY - 22);
        ctx.lineTo(headX + 10, tapeY - 22);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // head label
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HEAD', headX, tapeY - 28);

        // --- State Machine Box ---
        const SMX = W * 0.12, SMY = H * 0.18;
        const SMW = 130, SMH = 80;
        const stateColor = halted ? '#10b981' : '#3b82f6';
        const smGrad = ctx.createLinearGradient(SMX, SMY, SMX, SMY + SMH);
        smGrad.addColorStop(0, '#0f1e36');
        smGrad.addColorStop(1, '#070e1d');
        ctx.fillStyle = smGrad;
        ctx.strokeStyle = stateColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = stateColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(SMX, SMY, SMW, SMH, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#64748b';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('FINITE CONTROL', SMX + SMW/2, SMY + 8);

        ctx.fillStyle = stateColor;
        ctx.font = 'bold 20px Fira Code, monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(state, SMX + SMW/2, SMY + SMH/2 + 6);

        // connector from SM to tape head
        ctx.strokeStyle = '#1e3a5f';
        ctx.setLineDash([4, 8]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(SMX + SMW/2, SMY + SMH);
        ctx.lineTo(SMX + SMW/2, tapeY - 30);
        ctx.lineTo(headX, tapeY - 30);
        ctx.stroke();
        ctx.setLineDash([]);

        // --- Transition info ---
        const lastKey = `${state},${getTape(head)}`;
        const trans = TRANSITIONS[lastKey];
        const transBox = trans
            ? `δ(${state}, ${getTape(head)}) → (${trans.newState}, ${trans.write}, ${trans.move > 0 ? 'R' : 'L'})`
            : halted ? 'HALTED — Accept state reached' : 'No transition defined';

        const boxW = Math.min(W - 20, 500);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(W/2 - boxW/2, H - 68, boxW, 48, 8);
        ctx.fill();
        ctx.fillStyle = halted ? '#10b981' : '#60a5fa';
        ctx.font = `bold ${W < 450 ? 11 : 13}px Fira Code, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(transBox, W/2, H - 52);

        ctx.fillStyle = '#475569';
        ctx.font = `${W < 450 ? 9 : 11}px Fira Code, monospace`;
        ctx.fillText(`Step: ${stepCount} | Head: cell[${head}]${W < 450 ? '' : ' | ' + statusMsg}`, W/2, H - 28);
    }

    function step() {
        if (halted) return;
        const sym = getTape(head);
        const key = `${state},${sym}`;
        const t = TRANSITIONS[key];
        if (!t) {
            halted = true;
            statusMsg = 'HALTED';
            draw();
            return;
        }
        setTape(head, t.write);
        state = t.newState;
        head += t.move;
        if (head < 0) head = 0;
        stepCount++;
        if (state === 'q_a') {
            halted = true;
            statusMsg = '✓ Done — Unary incremented!';
        }
        draw();
    }

    document.getElementById('btn-tm-step').addEventListener('click', () => {
        if (!halted) step();
    });

    document.getElementById('btn-tm-run').addEventListener('click', () => {
        if (running) {
            running = false;
            clearInterval(runTimer);
            return;
        }
        // reset
        tape = ['1','1','1', BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK];
        head = 0;
        state = 'q₀';
        halted = false;
        stepCount = 0;
        statusMsg = 'Auto-Computing...';
        running = true;
        draw();
        runTimer = setInterval(() => {
            if (halted) { clearInterval(runTimer); running = false; return; }
            step();
        }, 400);
    });

    document.getElementById('btn-tm-reset').addEventListener('click', () => {
        clearInterval(runTimer);
        running = false;
        halted  = false;
        tape    = ['1','1','1', BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK, BLANK];
        head    = 0;
        state   = 'q₀';
        stepCount = 0;
        statusMsg = 'Turing Machine: Unary Incrementer (1+1+1 = 4)';
        draw();
    });

    window.addEventListener('resize', resize);
    resize();
})();
