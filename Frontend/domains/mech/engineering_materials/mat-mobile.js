// Mobile 2D Simulation Engine for Engineering Materials

function setupCanvas(containerId, height = 500) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    canvas.style.display = 'block';
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const resize = () => {
        const w = container.clientWidth;
        canvas.width = w > 0 ? w : (window.innerWidth < 768 ? window.innerWidth - 40 : 300);
        canvas.height = height;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener('resize', resize);
    resize();
    
    return { canvas, ctx, container };
}

function initCh1Mobile() {
    const mobileSim = setupCanvas('sim-ch1-mobile', 400);
    if(!mobileSim) return;
    
    const typeSelect = document.getElementById('ch1-type');
    let currentType = typeSelect ? typeSelect.value : 'BCC';
    if (typeSelect) typeSelect.addEventListener('change', (e) => currentType = e.target.value);
    
    const {canvas, ctx} = mobileSim;
    let t = 0;
    const animateMobile = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const ox = canvas.width/2, oy = canvas.height/2;
        
        ctx.strokeStyle = '#fff'; ctx.setLineDash([5,5]);
        ctx.strokeRect(ox - 60, oy - 60, 120, 120);
        ctx.setLineDash([]);
        
        const drawAtom = (x, y, r, color) => {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(ox + x, oy + y, r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
        };
        
        const r = 20;
        // Corners
        drawAtom(-60, -60, r, '#0ea5e9'); drawAtom(60, -60, r, '#0ea5e9');
        drawAtom(-60, 60, r, '#0ea5e9'); drawAtom(60, 60, r, '#0ea5e9');
        
        if(currentType === 'BCC') {
            drawAtom(0, 0, r, '#f97316');
        } else if(currentType === 'FCC') {
            drawAtom(0, -60, r, '#10b981'); drawAtom(0, 60, r, '#10b981');
            drawAtom(-60, 0, r, '#10b981'); drawAtom(60, 0, r, '#10b981');
            drawAtom(0, 0, r, '#10b981'); // center face
        } else if(currentType === 'HCP') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('HCP 2D Projection', ox, oy - 100);
            for(let i=0; i<6; i++) {
                const angle = (i/6)*Math.PI*2 + t;
                drawAtom(Math.cos(angle)*60, Math.sin(angle)*60, r, '#8b5cf6');
            }
            drawAtom(0, 0, r, '#8b5cf6');
        }
        
        ctx.fillStyle = '#fff'; ctx.font = '20px monospace'; ctx.textAlign = 'center';
        ctx.fillText(currentType, ox, oy + 120);
        
        t += 0.02;
        requestAnimationFrame(animateMobile);
    };
    animateMobile();
}

function initCh2Mobile() {
    const mobile = setupCanvas('sim-ch2-mobile', 300);
    if(!mobile) return;
    
    const btnShear = document.getElementById('ch2-shear');
    const btnReset = document.getElementById('ch2-reset');
    
    let offset = 0;
    let isShearing = false;
    
    if (btnShear) btnShear.addEventListener('click', () => isShearing = true);
    if (btnReset) btnReset.addEventListener('click', () => { isShearing = false; offset = 0; });
    
    const draw = (sim, currentOffset) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const r = 12;
        const sp = 30;
        const rows = 4, cols = 10;
        const startX = (canvas.width - cols*sp)/2 + 20;
        const startY = 100;
        
        const scaledOffset = currentOffset * (30/50);
        
        for(let row=0; row<rows; row++) {
            for(let col=0; col<cols; col++) {
                let x = startX + col*sp;
                let y = startY + row*sp;
                
                if(row < 2) x += scaledOffset;
                
                ctx.fillStyle = row < 2 ? '#0ea5e9' : '#10b981';
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
            }
        }
        
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(0, startY + 1.5*sp); ctx.lineTo(canvas.width, startY + 1.5*sp); ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
        ctx.fillText('Slip Plane', 10, startY + 1.5*sp - 10);
    };
    
    const animate = () => {
        if(isShearing && offset < 50) {
            offset += 1;
        } else if(isShearing && offset >= 50) {
            isShearing = false;
            offset = 0;
        }
        draw(mobile, offset);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh3Mobile() {
    const mobile = setupCanvas('sim-ch3-mobile', 400);
    if(!mobile) return;
    
    const btnTest = document.getElementById('ch3-test');
    const matSelect = document.getElementById('ch3-mat');
    
    let t = 0;
    let isTesting = false;
    let currentMat = matSelect ? matSelect.value : 'steel';
    
    if (matSelect) matSelect.addEventListener('change', (e) => { currentMat = e.target.value; t = 0; isTesting = false; });
    if (btnTest) btnTest.addEventListener('click', () => { t = 0; isTesting = true; });
    
    const curves = {
        'steel': { E: 5, Y: 100, UTS: 150, frac: 300, color: '#f97316' },
        'aluminum': { E: 2, Y: 50, UTS: 80, frac: 400, color: '#0ea5e9' },
        'glass': { E: 8, Y: 200, UTS: 200, frac: 50, color: '#10b981' }
    };

    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const ox = 50, oy = canvas.height - 50;
        const w = canvas.width - 100, h = canvas.height - 100;
        
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ox, oy-h); ctx.lineTo(ox, oy); ctx.lineTo(ox+w, oy); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
        ctx.fillText('Strain (ε)', ox + w/2, oy + 40);
        ctx.save(); ctx.translate(ox - 30, oy - h/2); ctx.rotate(-Math.PI/2); ctx.fillText('Stress (σ)', 0, 0); ctx.restore();
        
        const mat = curves[currentMat];
        
        ctx.beginPath(); ctx.strokeStyle = mat.color; ctx.lineWidth = 3;
        
        let maxStrain = isTesting ? t : 0;
        if(maxStrain > mat.frac) maxStrain = mat.frac;
        
        for(let s=0; s<=maxStrain; s+=2) {
            let stress = 0;
            if(s < mat.Y / mat.E) {
                stress = s * mat.E;
            } else if(mat.frac === mat.Y / mat.E) {
                stress = s * mat.E;
            } else {
                const plasticStrain = s - (mat.Y / mat.E);
                const range = mat.frac - (mat.Y / mat.E);
                stress = mat.Y + (mat.UTS - mat.Y) * Math.sin((plasticStrain / range) * Math.PI);
            }
            
            const x = ox + (s / 500) * w;
            const y = oy - (stress / 250) * h;
            
            if(s===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        if(maxStrain >= mat.frac) {
            ctx.fillStyle = '#ef4444'; ctx.font = '20px sans-serif';
            ctx.fillText('FRACTURE', ox + (mat.frac/500)*w - 40, oy - 20);
        }
        
        if(isTesting && t < mat.frac + 10) t+=2;
    };
    
    const animate = () => {
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh4Mobile() {
    const mobile = setupCanvas('sim-ch4-mobile', 400);
    if(!mobile) return;
    
    const cInput = document.getElementById('ch4-c');
    const tInput = document.getElementById('ch4-t');
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const c = parseFloat(cInput?.value || 0.76);
        const temp = parseFloat(tInput?.value || 727);
        
        const ox = 50, oy = canvas.height - 50;
        const w = canvas.width - 100, h = canvas.height - 100;
        
        ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = 2;
        
        const getX = (pct) => ox + (pct / 2.14) * w;
        const getY = (tmp) => oy - (tmp / 1500) * h;
        
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(912)); ctx.lineTo(getX(0.76), getY(727));
        ctx.lineTo(getX(2.14), getY(1147));
        ctx.moveTo(getX(0), getY(727)); ctx.lineTo(getX(2.14), getY(727));
        ctx.stroke();
        
        ctx.fillStyle = '#a1a1aa'; ctx.font = '14px sans-serif';
        ctx.fillText('Austenite (γ)', getX(0.5), getY(1000));
        ctx.fillText('Ferrite + Pearlite', getX(0.2), getY(500));
        ctx.fillText('Pearlite + Cementite', getX(1.2), getY(500));
        
        const px = getX(c);
        const py = getY(temp);
        
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        
        let phase = 'Austenite';
        if(temp < 727) {
            phase = c < 0.76 ? 'Ferrite + Pearlite' : (c === 0.76 ? '100% Pearlite' : 'Pearlite + Cementite');
        } else if(c > 0.76 && temp < (727 + ((1147-727)/(2.14-0.76))*(c-0.76))) {
            phase = 'Austenite + Cementite';
        } else if(c < 0.76 && temp < (912 - ((912-727)/0.76)*c)) {
            phase = 'Ferrite + Austenite';
        }
        
        ctx.fillText(`C: ${c.toFixed(2)}%, T: ${temp}°C`, px + 10, py - 10);
        ctx.fillStyle = '#0ea5e9'; ctx.font = '20px sans-serif';
        ctx.fillText(`Microstructure: ${phase}`, ox, 30);
    };
    
    const animate = () => {
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh5Mobile() {
    const mobile = setupCanvas('sim-ch5-mobile', 300);
    if(!mobile) return;
    
    const btnQuench = document.getElementById('ch5-quench');
    const btnAir = document.getElementById('ch5-air');
    
    let temp = 900;
    let cooling = false;
    let rate = 0;
    let phase = 'Austenite';
    
    if (btnQuench) btnQuench.addEventListener('click', () => { temp = 900; cooling = true; rate = 15; });
    if (btnAir) btnAir.addEventListener('click', () => { temp = 900; cooling = true; rate = 2; });
    
    const drawMobile = () => {
        const {canvas, ctx} = mobile;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = temp > 727 ? '#f97316' : (phase === 'Martensite (Hard, Brittle)' ? '#8b5cf6' : '#10b981');
        ctx.fillRect(canvas.width/2 - 100, canvas.height/2 - 50 + (rate > 10 && temp < 900 ? 50 : 0), 200, 100);
        
        if(rate > 10 && temp < 900) {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.5)';
            ctx.fillRect(0, canvas.height/2, canvas.width, canvas.height/2);
        }
        
        ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${temp.toFixed(0)} °C`, canvas.width/2, 40);
        ctx.fillText(temp > 727 ? 'Austenite' : phase, canvas.width/2, 70);
    };
    
    const animate = () => {
        if(cooling) {
            temp -= rate;
            if(temp <= 25) {
                temp = 25;
                cooling = false;
                phase = rate > 10 ? 'Martensite (Hard, Brittle)' : 'Pearlite (Ductile)';
            }
        }
        drawMobile();
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh8Mobile() {
    const mobile = setupCanvas('sim-ch8-mobile', 300);
    if(!mobile) return;
    
    const tempInput = document.getElementById('ch8-temp');
    
    let chains = [];
    for(let i=0; i<10; i++) {
        let chain = [];
        for(let j=0; j<20; j++) chain.push({x: Math.random()*500, y: Math.random()*300});
        chains.push(chain);
    }
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const temp = parseFloat(tempInput?.value || 20);
        const tg = 100;
        const isRubbery = temp > tg;
        const speed = isRubbery ? (temp - tg)/5 : 0.1;
        
        ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
        ctx.fillText(`State: ${isRubbery ? 'Viscoelastic (Rubbery)' : 'Glassy (Rigid)'}`, 20, 40);
        
        chains.forEach((chain, i) => {
            ctx.beginPath();
            let hue = isRubbery ? 20 + i*10 : 200 + i*5; 
            ctx.strokeStyle = `hsl(${hue%360}, 80%, 60%)`;
            ctx.lineWidth = isRubbery ? 5 : 2;
            chain.forEach((p, j) => {
                p.x += (Math.random()-0.5)*speed*5;
                p.y += (Math.random()-0.5)*speed*5;
                if(p.x < 0) p.x = canvas.width; if(p.x > canvas.width) p.x = 0;
                if(p.y < 0) p.y = canvas.height; if(p.y > canvas.height) p.y = 0;
                
                if(j===0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        });
    };
    
    const animate = () => {
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh9Mobile() {
    const mobile = setupCanvas('sim-ch9-mobile', 300);
    if(!mobile) return;
    
    const vfInput = document.getElementById('ch9-vf');
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const vf = parseFloat(vfInput?.value || 60) / 100;
        const vm = 1 - vf;
        const Ef = 250;
        const Em = 3;
        
        const Ec = Ef * vf + Em * vm;
        
        ctx.fillStyle = '#27272a';
        ctx.fillRect(50, 100, 200, 200);
        
        ctx.fillStyle = '#0ea5e9';
        const fiberCount = Math.floor(vf * 100);
        const gridSize = 10;
        let drawn = 0;
        
        for(let i=0; i<gridSize; i++) {
            for(let j=0; j<gridSize; j++) {
                if(drawn < fiberCount) {
                    ctx.beginPath();
                    ctx.arc(60 + j*20, 110 + i*20, 6, 0, Math.PI*2);
                    ctx.fill();
                    drawn++;
                }
            }
        }
        
        ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
        ctx.fillText(`Matrix Volume: ${(vm*100).toFixed(0)}%`, 300, 140);
        ctx.fillText(`Fiber Volume: ${(vf*100).toFixed(0)}%`, 300, 180);
        ctx.fillStyle = '#10b981';
        ctx.fillText(`Composite Modulus: ${Ec.toFixed(1)} GPa`, 300, 240);
    };
    
    const animate = () => {
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh10Mobile() {
    const mobile = setupCanvas('sim-ch10-mobile', 300);
    if(!mobile) return;
    
    const envSelect = document.getElementById('ch10-env');
    const zincCheck = document.getElementById('ch10-zinc');
    
    let t = 0;
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const env = envSelect?.value || 'water';
        const zinc = zincCheck?.checked || false;
        const rate = env === 'salt' ? 2 : 0.5;
        
        ctx.fillStyle = env === 'salt' ? 'rgba(14, 165, 233, 0.4)' : 'rgba(14, 165, 233, 0.1)';
        ctx.fillRect(0, 150, canvas.width, canvas.height - 150);
        
        ctx.fillStyle = '#71717a';
        const pipeThick = zinc ? 40 : Math.max(10, 40 - (t * rate * 0.1));
        ctx.fillRect(100, 150, 60, pipeThick);
        ctx.fillText('Steel', 105, 140);
        
        if(zinc) {
            ctx.fillStyle = '#f59e0b';
            const zincThick = Math.max(0, 30 - (t * rate * 0.2));
            ctx.fillRect(250, 150, 40, zincThick);
            ctx.fillText('Zinc', 255, 140);
            
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(130, 140); ctx.lineTo(130, 100); ctx.lineTo(270, 100); ctx.lineTo(270, 140); ctx.stroke();
            
            ctx.fillStyle = '#fbbf24';
            let ex = 270 - (t*2 % 140);
            ctx.beginPath(); ctx.arc(ex, 100, 4, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = '#10b981'; ctx.font = '20px sans-serif';
            ctx.fillText('Cathodic Protection Active', 150, 50);
        } else {
            ctx.fillStyle = '#ef4444'; ctx.font = '20px sans-serif';
            ctx.fillText('Corroding...', 150, 50);
        }
    };
    
    const animate = () => {
        t++;
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh11Mobile() {
    const mobile = setupCanvas('sim-ch11-mobile', 300);
    if(!mobile) return;
    
    const matSelect = document.getElementById('ch11-mat');
    
    let t = 0;
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const mat = matSelect?.value || 'soft';
        const Hc = mat === 'soft' ? 20 : 80;
        const Br = mat === 'soft' ? 120 : 100;
        
        const ox = canvas.width/2, oy = canvas.height/2;
        
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(canvas.width, oy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, canvas.height); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
        ctx.fillText('H (Field)', canvas.width - 60, oy - 10);
        ctx.fillText('B (Flux)', ox + 10, 20);
        
        ctx.beginPath(); ctx.strokeStyle = mat === 'soft' ? '#0ea5e9' : '#f97316'; ctx.lineWidth = 3;
        for(let ang=0; ang<=Math.PI*2; ang+=0.1) {
            const h = Math.cos(ang) * 150;
            let b;
            if(ang < Math.PI) {
                b = Math.tanh((h - Hc)/50) * Br;
            } else {
                b = Math.tanh((h + Hc)/50) * Br;
            }
            if(ang===0) ctx.moveTo(ox + h, oy - b);
            else ctx.lineTo(ox + h, oy - b);
        }
        ctx.stroke();
        
        const H = Math.cos(t*0.05) * 150;
        let B = Math.sin(t*0.05) > 0 ? Math.tanh((H + Hc)/50) * Br : Math.tanh((H - Hc)/50) * Br;
        
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(ox + H, oy + B, 6, 0, Math.PI*2); ctx.fill();
    };
    
    const animate = () => {
        t++;
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

document.addEventListener('DOMContentLoaded', () => {
    initCh1Mobile();
    initCh2Mobile();
    initCh3Mobile();
    initCh4Mobile();
    initCh5Mobile();
    initCh8Mobile();
    initCh9Mobile();
    initCh10Mobile();
    initCh11Mobile();
});
