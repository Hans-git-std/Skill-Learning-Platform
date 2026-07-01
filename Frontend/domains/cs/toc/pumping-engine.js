/* ==========================================
   PUMPING LEMMA ENGINE - String Stretcher
   ========================================== */
(function() {
    const container = document.getElementById('pumping-canvas-container');
    if (!container) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
    container.appendChild(canvas);
    container.style.minHeight = '400px';
    container.style.padding = '0';
    const ctx = canvas.getContext('2d');

    // Language: a^n b^n — we show that pumping breaks it
    // String: aabbbb (not in a^nb^n) — string decomposed into xyz
    // x = "a", y = "ab" (the pumpable section), z = "bbb"
    const ORIGINAL = ['a','a','b','b'];
    let pumpCount = 1; // y repeated pumpCount times
    const X_CHARS = ['a'];
    const Y_CHARS = ['a','b'];
    const Z_CHARS = ['b','b'];

    function buildString() {
        const pumped = [];
        for (let i = 0; i < pumpCount; i++) pumped.push(...Y_CHARS);
        return [...X_CHARS, ...pumped, ...Z_CHARS];
    }

    function isInLanguage(str) {
        let a = 0, b = 0;
        for (const c of str) { if (c === 'a') a++; else if (c === 'b') b++; }
        // Check if all a's come before all b's and counts match
        let seenB = false;
        for (const c of str) {
            if (c === 'b') seenB = true;
            if (c === 'a' && seenB) return false;
        }
        return a === b && str.length > 0;
    }

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width  = rect.width  || 700;
        canvas.height = rect.height || 400;
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

        const str = buildString();
        const inLang = isInLanguage(str);
        const charW = 42, charH = 48;
        const totalW = str.length * charW + (str.length - 1) * 6;
        const startX = Math.max(16, (W - totalW) / 2);
        const charY = H * 0.42 - charH / 2;

        // bracket for x
        const xLen = X_CHARS.length;
        const yLen = Y_CHARS.length * pumpCount;
        const zLen = Z_CHARS.length;

        const CELL = charW + 6;
        const xEnd = startX + xLen * CELL - 6;
        const yStart = startX + xLen * CELL;
        const yEnd = yStart + yLen * CELL - 6;
        const zStart = yStart + yLen * CELL;

        // section braces
        function drawBrace(x1, x2, label, color, above) {
            const mid = (x1 + x2) / 2;
            const baseY = above ? charY - 30 : charY + charH + 22;
            const armH = above ? -10 : 10;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, baseY);
            ctx.lineTo(x2, baseY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x1, baseY);
            ctx.lineTo(x1, baseY + armH);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x2, baseY);
            ctx.lineTo(x2, baseY + armH);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = 'bold 13px Fira Code, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = above ? 'bottom' : 'top';
            ctx.fillText(label, mid, baseY + (above ? -4 : 4));
        }

        drawBrace(startX,  xEnd,  'x',    '#64748b', true);
        drawBrace(yStart,  yEnd,  `y (×${pumpCount})`, '#f59e0b', true);
        drawBrace(zStart,  W - 16, 'z',   '#64748b', true);

        // draw characters
        str.forEach((c, i) => {
            const cx = startX + i * CELL;
            const isX  = i < xLen;
            const isY  = i >= xLen && i < xLen + yLen;
            const isZ  = i >= xLen + yLen;

            const col = isX ? '#334155' : (isY ? '#92400e' : '#334155');
            const bdr = isX ? '#475569' : (isY ? '#f59e0b' : '#475569');

            const grad = ctx.createLinearGradient(cx, charY, cx, charY + charH);
            grad.addColorStop(0, col);
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.strokeStyle = bdr;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx, charY, charW, charH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isY ? '#f59e0b' : '#94a3b8';
            ctx.font = `bold ${Math.min(22, charW * 0.5)}px Fira Code, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(c, cx + charW / 2, charY + charH / 2);
        });

        // result status
        const statusColor = inLang ? '#10b981' : '#ef4444';
        ctx.fillStyle = statusColor + '22';
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(W/2 - 220, H - 72, 440, 44, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = statusColor;
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const aCount = str.filter(c=>c==='a').length;
        const bCount = str.filter(c=>c==='b').length;
        ctx.fillText(
            inLang
                ? `✓ In a^n·b^n: ${aCount} a's = ${bCount} b's`
                : `✗ NOT in a^n·b^n: ${aCount} a's ≠ ${bCount} b's — Pumping breaks it!`,
            W/2, H - 50
        );

        // pump count display
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Pumping i = ${pumpCount} | y = "ab"`, W/2, charY - 40);

        // language definition
        ctx.fillStyle = '#60a5fa';
        ctx.font = '13px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Language: a^n b^n (equal number of a\'s and b\'s)', W/2, 16);
    }

    document.getElementById('btn-pump-up').addEventListener('click', () => {
        pumpCount++;
        draw();
    });
    document.getElementById('btn-pump-down').addEventListener('click', () => {
        pumpCount = Math.max(0, pumpCount - 1);
        draw();
    });
    document.getElementById('btn-pump-reset').addEventListener('click', () => {
        pumpCount = 1;
        draw();
    });

    window.addEventListener('resize', resize);
    resize();
})();
