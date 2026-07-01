/* ==========================================
   CFG ENGINE - 3D Parse Tree Generator
   ========================================== */
(function() {
    const container = document.getElementById('cfg-canvas-container');
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
    container.appendChild(canvas);
    container.style.minHeight = '480px';
    container.style.padding = '0';
    const ctx = canvas.getContext('2d');

    // Grammar: S → aSb | ab
    // We grow parse tree for: "aabb" step by step
    // Tree nodes
    const FULL_TREE = {
        label: 'S', type: 'var',
        children: [
            { label: 'a', type: 'term' },
            {
                label: 'S', type: 'var',
                children: [
                    { label: 'a', type: 'term' },
                    { label: 'b', type: 'term' }
                ]
            },
            { label: 'b', type: 'term' }
        ]
    };

    // Steps: reveal nodes one derivation at a time
    const STEPS = [
        { nodes: 1, desc: 'Start: Variable S (the start symbol)' },
        { nodes: 4, desc: 'Apply S → aSb — S expands into 3 children' },
        { nodes: 7, desc: 'Apply inner S → ab — Leaf terminals revealed: "aabb"' },
    ];

    let revealedNodes = 1;
    let stepIdx = 0;
    let animOffset = 0;
    let animId = null;

    function countNodes(node) {
        if (!node.children) return 1;
        return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
    }

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width  || 700;
        canvas.height = rect.height || 480;
        draw();
    }

    function layoutTree(node, x, y, width, depth) {
        node._x = x;
        node._y = y;
        if (!node.children || node.children.length === 0) return;
        const childW = width / node.children.length;
        node.children.forEach((child, i) => {
            const cx = x - width/2 + childW * i + childW/2;
            const cy = y + 80;
            layoutTree(child, cx, cy, childW * 0.9, depth + 1);
        });
    }

    let globalIdx = 0;
    function drawNode(node, parentX, parentY, revealed) {
        globalIdx++;
        const visible = globalIdx <= revealed;
        if (!visible) return;

        const sx = node._x, sy = node._y;
        const isVar  = node.type === 'var';
        const isRoot = parentX === null;

        // edge to parent
        if (!isRoot && parentX !== null) {
            ctx.strokeStyle = '#1e3a5f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(parentX, parentY + 20);
            ctx.lineTo(sx, sy - 20);
            ctx.stroke();
        }

        // node circle / rounded rect
        const R = 22;
        if (isVar) {
            const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 2);
            glow.addColorStop(0, '#1e3a5f88');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(sx, sy, R * 2, 0, Math.PI * 2);
            ctx.fill();

            const grad = ctx.createLinearGradient(sx - R, sy - R, sx + R, sy + R);
            grad.addColorStop(0, '#1e3a5f');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(sx, sy, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#60a5fa';
            ctx.font = 'bold 16px Fira Code, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, sx, sy);
        } else {
            // terminal: pill shape
            const tw = 30, th = 30;
            const grad = ctx.createLinearGradient(sx - tw/2, sy - th/2, sx + tw/2, sy + th/2);
            grad.addColorStop(0, '#1e4d2b');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(sx - tw/2, sy - th/2, tw, th, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 16px Fira Code, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, sx, sy);
        }

        if (node.children) {
            node.children.forEach(child => drawNode(child, sx, sy, revealed));
        }
    }

    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#0a0f1e');
        bg.addColorStop(1, '#0f172a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // grid lines for depth
        for (let d = 0; d < 4; d++) {
            const ly = 80 + d * 80;
            ctx.strokeStyle = '#0d1f33';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 10]);
            ctx.beginPath();
            ctx.moveTo(0, ly);
            ctx.lineTo(W, ly);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // layout and draw tree
        layoutTree(FULL_TREE, W / 2, 70, W * 0.85, 0);
        globalIdx = 0;
        drawNode(FULL_TREE, null, null, revealedNodes);

        // production rule display
        const step = STEPS[Math.min(stepIdx, STEPS.length - 1)];
        const boxW = Math.min(W - 20, 520);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(W/2 - boxW/2, H - 68, boxW, 48, 8);
        ctx.fill();

        ctx.fillStyle = '#60a5fa';
        ctx.font = `bold ${W < 450 ? 11 : 14}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let descText = step.desc;
        if (W < 450 && stepIdx === 1) descText = 'Apply S → aSb';
        if (W < 450 && stepIdx === 2) descText = 'Apply inner S → ab';
        ctx.fillText(descText, W / 2, H - 44);

        // grammar definition
        ctx.fillStyle = '#475569';
        ctx.font = `${W < 450 ? 11 : 13}px Fira Code, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('Grammar: S → aSb  |  ab', W / 2, H - 18);

        // legend
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.arc(16, 22, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Variable (non-terminal)', 30, 22);
        ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.roundRect(8, 38, 16, 16, 3); ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Terminal symbol', 30, 46);
    }

    document.getElementById('btn-cfg-derive').addEventListener('click', () => {
        if (stepIdx >= STEPS.length - 1) {
            stepIdx = 0;
            revealedNodes = 1;
            draw();
            return;
        }
        stepIdx++;
        revealedNodes = STEPS[stepIdx].nodes;
        draw();
    });

    document.getElementById('btn-cfg-reset').addEventListener('click', () => {
        stepIdx = 0;
        revealedNodes = 1;
        draw();
    });

    window.addEventListener('resize', resize);
    resize();
})();
