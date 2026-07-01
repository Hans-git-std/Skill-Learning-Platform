/* ==========================================
   REGEX ENGINE - Animated Pipeline Filter
   ========================================== */
(function() {
    const container = document.getElementById('regex-canvas-container');
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
    container.appendChild(canvas);
    container.style.minHeight = '460px';
    container.style.padding = '0';
    const ctx = canvas.getContext('2d');

    const REGEX = /^[a-z]+@[a-z]+\.com$/;
    const STREAMS = [
        'hello@world.com', 'invalid-email', 'user@site.com',
        'bad@', 'test@domain.com', '123@xyz', 'alice@corp.com',
        'noatsign.com', 'dev@app.com', 'x@y.com'
    ];

    let blocks = [];
    let streaming = false;
    let streamTimer = null;
    let spawnIdx = 0;
    let compiled = false;
    let gates = []; // pipeline gate positions
    let animId = null;
    const BELT_Y_FRAC = 0.55;
    const BLOCK_W = 120, BLOCK_H = 38;
    const SPEED = 1.6;

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width  || 700;
        canvas.height = rect.height || 460;
        buildGates();
        draw();
    }

    function buildGates() {
        const W = canvas.width;
        gates = [
            { x: W * 0.28, label: '[a-z]+', desc: 'Username' },
            { x: W * 0.50, label: '@',      desc: 'Symbol'   },
            { x: W * 0.68, label: '[a-z]+', desc: 'Domain'   },
            { x: W * 0.84, label: '\\.com',  desc: 'TLD'      },
        ];
    }

    function spawnBlock() {
        if (spawnIdx >= STREAMS.length) { streaming = false; return; }
        const text = STREAMS[spawnIdx++];
        blocks.push({
            text,
            x: -BLOCK_W - 10,
            y: canvas.height * BELT_Y_FRAC - BLOCK_H / 2,
            passed: REGEX.test(text),
            state: 'moving', // moving | zapping | accepted | rejected
            alpha: 1,
            zapAnim: 0,
            color: '#3b82f6'
        });
        if (streaming && spawnIdx < STREAMS.length) {
            streamTimer = setTimeout(spawnBlock, 900);
        }
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // bg
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0a0f1e');
        bg.addColorStop(1, '#0f172a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const beltY = H * BELT_Y_FRAC;

        if (!compiled) {
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Click "Compile Pipeline" to build the regex filter', W/2, H/2);
            return;
        }

        // conveyer belt
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, beltY + BLOCK_H + 6);
        ctx.lineTo(W, beltY + BLOCK_H + 6);
        ctx.stroke();

        // belt dashes
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 12]);
        ctx.beginPath();
        ctx.moveTo(0, beltY + BLOCK_H + 6);
        ctx.lineTo(W, beltY + BLOCK_H + 6);
        ctx.stroke();
        ctx.setLineDash([]);

        // gate pillars
        gates.forEach(g => {
            const gx = g.x;
            // pillar
            ctx.fillStyle = '#1e3a5f';
            ctx.fillRect(gx - 3, beltY - 80, 6, BLOCK_H + 80 + 10);
            // gate laser bar
            ctx.fillStyle = '#3b82f6';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 10;
            ctx.fillRect(gx - 2, beltY - 80, 4, 80);
            ctx.shadowBlur = 0;
            // label
            ctx.fillStyle = '#60a5fa';
            ctx.font = 'bold 13px Fira Code, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(g.label, gx, beltY - 84);
            if (W > 450) {
                ctx.fillStyle = '#475569';
                ctx.font = '11px Inter, sans-serif';
                ctx.fillText(g.desc, gx, beltY - 70);
            }
        });

        // exit zone
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fillRect(W - 12, beltY - 10, 12, BLOCK_H + 20);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PASS', W - 6, beltY - 18);

        // blocks
        blocks.forEach(b => {
            if (b.alpha <= 0) return;
            ctx.globalAlpha = b.alpha;

            // zap flash effect
            if (b.state === 'zapping' && b.zapAnim > 0) {
                const zapColor = b.passed ? '#10b981' : '#ef4444';
                ctx.fillStyle = zapColor + '33';
                ctx.beginPath();
                ctx.ellipse(b.x + BLOCK_W/2, beltY + BLOCK_H/2, BLOCK_W/1.3, 40, 0, 0, Math.PI*2);
                ctx.fill();
            }

            const borderColor = b.state === 'accepted' ? '#10b981' : (b.state === 'rejected' ? '#ef4444' : '#3b82f6');
            ctx.strokeStyle = borderColor;
            ctx.lineWidth   = 2;
            ctx.shadowColor = borderColor;
            ctx.shadowBlur  = b.state !== 'moving' ? 14 : 0;

            const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BLOCK_H);
            grad.addColorStop(0, '#1e293b');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, BLOCK_W, BLOCK_H, 6);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = b.state === 'accepted' ? '#10b981' : (b.state === 'rejected' ? '#ef4444' : '#94a3b8');
            ctx.font = '11px Fira Code, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.text.length > 14 ? b.text.slice(0, 13)+'…' : b.text, b.x + BLOCK_W/2, b.y + BLOCK_H/2);

            ctx.globalAlpha = 1;
        });

        // title
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 14px Fira Code, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('REGEX: /^[a-z]+@[a-z]+\\.com$/', 16, 16);

        // counter
        const passed  = blocks.filter(b => b.state === 'accepted').length;
        const rejected= blocks.filter(b => b.state === 'rejected').length;
        if (W > 450) {
            ctx.fillStyle = '#10b981';
            ctx.font = '13px Fira Code, monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`✓ ${passed} passed`, W - 16, 16);
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`✗ ${rejected} rejected`, W - 16, 36);
        } else {
            ctx.fillStyle = '#10b981';
            ctx.font = '12px Fira Code, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`✓ ${passed} passed`, 16, 36);
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`✗ ${rejected} rejected`, 16, 52);
        }
    }

    function animate() {
        const W = canvas.width;
        const beltY = canvas.height * BELT_Y_FRAC;

        blocks.forEach(b => {
            if (b.state === 'moving') {
                b.x += SPEED;
                // check if hitting a gate
                const hitGate = gates.find(g => Math.abs(b.x + BLOCK_W/2 - g.x) < SPEED + 1);
                if (hitGate && !b.passed) {
                    b.state = 'zapping';
                    b.zapAnim = 20;
                }
                // passed all gates — reaching exit
                if (b.x + BLOCK_W > W - 20 && b.passed) {
                    b.state = 'accepted';
                }
            }
            if (b.state === 'zapping') {
                b.zapAnim--;
                if (b.zapAnim <= 0) b.state = 'rejected';
            }
            if (b.state === 'rejected') {
                b.y += 2.5;
                b.alpha -= 0.03;
            }
            if (b.state === 'accepted' && b.x > W + 50) {
                b.alpha -= 0.05;
            }
        });
        blocks = blocks.filter(b => b.alpha > 0);
        draw();
        animId = requestAnimationFrame(animate);
    }

    document.getElementById('btn-regex-compile').addEventListener('click', () => {
        compiled = true;
        blocks = [];
        spawnIdx = 0;
        draw();
    });

    document.getElementById('btn-regex-stream').addEventListener('click', () => {
        if (!compiled) { compiled = true; }
        if (streaming) return;
        streaming = true;
        spawnIdx = 0;
        blocks = [];
        if (!animId) animId = requestAnimationFrame(animate);
        spawnBlock();
    });

    document.getElementById('btn-regex-reset').addEventListener('click', () => {
        clearTimeout(streamTimer);
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        streaming = false;
        compiled = false;
        blocks = [];
        spawnIdx = 0;
        draw();
    });

    window.addEventListener('resize', resize);
    resize();
})();
