/* ==========================================
   COMPLEXITY ENGINE - P vs NP Universe
   ========================================== */
(function() {
    const container = document.getElementById('complexity-canvas-container');
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;cursor:grab;';
    container.appendChild(canvas);
    container.style.minHeight = '520px';
    container.style.padding = '0';
    const ctx = canvas.getContext('2d');

    // Orbital rings: P (inner), NP (mid), NP-Hard (outer), NP-Complete (on NP boundary)
    const ORBITS = [
        { label: 'P', color: '#10b981', radius: 0.18, desc: 'Polynomial Time' },
        { label: 'NP', color: '#3b82f6', radius: 0.32, desc: 'Nondeterministic Poly' },
        { label: 'NP-Hard', color: '#f59e0b', radius: 0.44, desc: 'At least as hard as NP' },
    ];

    const PROBLEMS = [
        { name: 'Sorting',         orbit: 0, angle: 1.0,  color: '#10b981', size: 13 },
        { name: 'Shortest Path',   orbit: 0, angle: 3.5,  color: '#10b981', size: 13 },
        { name: 'Primality Test',  orbit: 0, angle: 5.5,  color: '#10b981', size: 11 },
        { name: 'Satisfiability (SAT)', orbit: 1, angle: 0.5, color: '#8b5cf6', size: 13, npComplete: true },
        { name: 'Graph Coloring',  orbit: 1, angle: 2.3,  color: '#8b5cf6', size: 12, npComplete: true },
        { name: 'Sudoku',          orbit: 1, angle: 4.0,  color: '#3b82f6', size: 12 },
        { name: 'Subset Sum',      orbit: 1, angle: 5.1,  color: '#8b5cf6', size: 11, npComplete: true },
        { name: 'Traveling Salesman', orbit: 2, angle: 1.2, color: '#ef4444', size: 13 },
        { name: 'Halting Problem', orbit: 2, angle: 3.0,  color: '#ef4444', size: 12 },
        { name: 'Chess (∞)',       orbit: 2, angle: 5.0,  color: '#f59e0b', size: 11 },
    ];

    let collapsed = false;
    let collapseAnim = 0;
    let animId = null;
    let extraProblems = [];
    let spawnCount = 0;
    let hovered = null;
    let rot = 0; // slow auto-rotation

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width  || 700;
        canvas.height = rect.height || 520;
        draw();
    }

    function cx() { return canvas.width / 2; }
    function cy() { return canvas.height / 2 + 10; }
    function radius(orbitIdx) {
        return Math.min(canvas.width, canvas.height) * ORBITS[orbitIdx].radius;
    }

    function problemPos(p, time) {
        const r = radius(p.orbit);
        const ang = p.angle + time * (p.orbit === 0 ? 0.2 : p.orbit === 1 ? 0.12 : 0.07);
        return {
            x: cx() + Math.cos(ang) * r,
            y: cy() + Math.sin(ang) * r
        };
    }

    function draw(time = 0) {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // deep space bg
        const bg = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), Math.max(W,H)*0.6);
        bg.addColorStop(0, '#0a1628');
        bg.addColorStop(1, '#020712');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 80; i++) {
            const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * W;
            const sy = (Math.sin(i * 311.7) * 0.5 + 0.5) * H;
            const ss = (Math.sin(i * 53.3) * 0.5 + 0.5) * 1.5 + 0.3;
            ctx.globalAlpha = 0.3 + Math.sin(time * 0.5 + i) * 0.15;
            ctx.beginPath();
            ctx.arc(sx, sy, ss, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        const collapseProgress = Math.min(1, collapseAnim / 60);

        // Draw orbital rings
        ORBITS.forEach((orbit, i) => {
            const r = radius(i);
            const targetR = collapsed ? radius(0) * (i + 1) * 0.4 : r;
            const animR = r + (targetR - r) * collapseProgress;

            // glow ring
            ctx.strokeStyle = orbit.color + '33';
            ctx.lineWidth = 18;
            ctx.beginPath();
            ctx.arc(cx(), cy(), animR, 0, Math.PI * 2);
            ctx.stroke();

            // main ring
            ctx.strokeStyle = orbit.color + '88';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 12]);
            ctx.beginPath();
            ctx.arc(cx(), cy(), animR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // label at top of orbit
            const lx = cx() + Math.cos(-Math.PI/2) * animR;
            const ly = cy() + Math.sin(-Math.PI/2) * animR - 18;
            ctx.fillStyle = orbit.color;
            ctx.font = `bold ${Math.max(10, Math.min(14, W/52))}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(orbit.label, lx, ly);
        });

        // P = NP collapse label
        if (collapsed && collapseProgress > 0.5) {
            ctx.globalAlpha = (collapseProgress - 0.5) * 2;
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('⚠ If P = NP: All orbits collapse!', cx(), 20);
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#f87171';
            ctx.fillText('Every NP problem becomes trivially solvable', cx(), 42);
            ctx.globalAlpha = 1;
        }

        // NP-Complete label (on boundary between NP and NP-Hard)
        const ncR = (radius(1) + radius(2)) / 2;
        ctx.fillStyle = '#8b5cf6';
        ctx.font = `bold ${Math.max(10, Math.min(13, W/55))}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NP-Complete', cx() + ncR * Math.cos(Math.PI * 0.18), cy() + ncR * Math.sin(Math.PI * 0.18));

        // Central nucleus (Decidable / Computable)
        const nucR = Math.min(canvas.width, canvas.height) * 0.065;
        const nucG = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), nucR);
        nucG.addColorStop(0, '#1e4d2b');
        nucG.addColorStop(1, '#0f172a');
        ctx.fillStyle = nucG;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cx(), cy(), nucR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#10b981';
        ctx.font = `bold ${Math.max(9, Math.min(12, W/65))}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Decidable', cx(), cy() - 7);
        ctx.fillText('Problems', cx(), cy() + 7);

        // Draw problems
        const allProblems = [...PROBLEMS, ...extraProblems];
        allProblems.forEach(p => {
            const pos = problemPos(p, time);
            const isHovered = hovered === p;

            if (p.npComplete) {
                // NP-Complete problems get purple diamond
                const sz = (p.size + (isHovered ? 4 : 0)) * 0.8;
                ctx.fillStyle = '#8b5cf6' + (isHovered ? 'ff' : 'cc');
                ctx.shadowColor = '#8b5cf6';
                ctx.shadowBlur = isHovered ? 20 : 8;
                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-sz/2, -sz/2, sz, sz);
                ctx.restore();
                ctx.shadowBlur = 0;
            } else {
                const sz = p.size + (isHovered ? 4 : 0);
                const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, sz * 2);
                glow.addColorStop(0, p.color + '66');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, sz * 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = isHovered ? 20 : 6;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, sz * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // label
            if (isHovered || W > 480) {
                ctx.fillStyle = '#f8fafc';
                ctx.font = `${isHovered ? 'bold ' : ''}${Math.max(9, Math.min(11, W/66))}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(p.name, pos.x, pos.y + (p.size + 3));
            }
        });

        // Legend
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(10, H - 56, 220, 46, 8);
        ctx.fill();
        const legendItems = [
            { color: '#10b981', label: 'Class P' },
            { color: '#3b82f6', label: 'Class NP' },
            { color: '#8b5cf6', label: 'NP-Complete' },
            { color: '#ef4444', label: 'NP-Hard / Undecidable' },
        ];
        ctx.font = '10px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        legendItems.slice(0,2).forEach((l, i) => {
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.arc(20, H - 40 + i * 16, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'left';
            ctx.fillText(l.label, 30, H - 40 + i * 16);
        });
        legendItems.slice(2).forEach((l, i) => {
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.arc(115, H - 40 + i * 16, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'left';
            ctx.fillText(l.label, 125, H - 40 + i * 16);
        });
    }

    let lastTime = 0;
    function animate(ts) {
        const t = ts / 3000;
        if (collapsed && collapseAnim < 60) collapseAnim++;
        if (!collapsed && collapseAnim > 0) collapseAnim--;
        draw(t);
        animId = requestAnimationFrame(animate);
    }

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        const t = performance.now() / 3000;
        hovered = null;
        [...PROBLEMS, ...extraProblems].forEach(p => {
            const pos = problemPos(p, t);
            const dx = pos.x - mx, dy = pos.y - my;
            if (Math.sqrt(dx*dx + dy*dy) < p.size + 10) hovered = p;
        });
    });

    const EXTRA_COLORS = ['#06b6d4','#ec4899','#84cc16'];
    const EXTRA_ORBITS = [0, 1, 2];
    document.getElementById('btn-spawn-problem').addEventListener('click', () => {
        const orbIdx = EXTRA_ORBITS[spawnCount % 3];
        extraProblems.push({
            name: `Problem #${spawnCount + 1}`,
            orbit: orbIdx,
            angle: Math.random() * Math.PI * 2,
            color: EXTRA_COLORS[spawnCount % EXTRA_COLORS.length],
            size: 10,
        });
        spawnCount++;
    });

    document.getElementById('btn-collapse-pnp').addEventListener('click', () => {
        collapsed = !collapsed;
    });

    document.getElementById('btn-complexity-reset').addEventListener('click', () => {
        extraProblems = [];
        spawnCount    = 0;
        collapsed     = false;
        collapseAnim  = 0;
        hovered       = null;
    });

    window.addEventListener('resize', resize);
    resize();
    animId = requestAnimationFrame(animate);
})();
