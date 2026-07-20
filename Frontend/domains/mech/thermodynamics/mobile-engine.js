// Mobile 2D Simulation Engine for Thermodynamics

// Utility to setup a basic 2D Canvas with high-DPI scaling
function setupCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    
    // Fallback if layout hasn't fully computed
    const w = rect.width || 300;
    const h = rect.height || 300;
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    
    ctx.scale(dpr, dpr);
    
    return { canvas, ctx, width: w, height: h };
}

// --- CHAPTER 1: P-V-T Surface (2D Isotherms) ---
function initCh1Mobile() {
    const sys = setupCanvas('ch1-mob-canvas');
    if(!sys) return;
    const { canvas, ctx, width, height } = sys;
    const slider = document.getElementById('ch1-mob-temp');
    
    const draw = () => {
        ctx.clearRect(0, 0, width, height);
        
        // Draw Axes
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 20); ctx.lineTo(30, height - 30); // P (y-axis)
        ctx.lineTo(width - 20, height - 30); // V (x-axis)
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText('P', 10, 30);
        ctx.fillText('V', width - 30, height - 10);
        
        const T = slider ? parseFloat(slider.value) : 5; // 1 to 10
        
        // Draw Isotherm (P = c*T / V)
        ctx.strokeStyle = 'hsl(' + (200 - T*15) + ', 80%, 50%)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for(let v = 5; v <= width - 40; v += 2) {
            // map v to scaled V
            const scaledV = v / 10;
            const scaledP = (20 * T) / scaledV;
            
            const plotX = 30 + v;
            const plotY = (height - 30) - scaledP;
            
            if (plotY > 20 && plotY < height - 30) {
                if (v === 5) ctx.moveTo(plotX, plotY);
                else ctx.lineTo(plotX, plotY);
            }
        }
        ctx.stroke();
    };
    
    if (slider) {
        slider.addEventListener('input', draw);
        slider.addEventListener('change', draw);
    }
    
    window.addEventListener('resize', () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const w = rect.width || 300;
        const h = rect.height || 300;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        draw();
    });
    draw();
}

// --- CHAPTER 2: Boundary Work (2D P-V Area) ---
function initCh2Mobile() {
    const sys = setupCanvas('ch2-mob-canvas');
    if(!sys) return;
    const { canvas, ctx } = sys;
    const select = document.getElementById('ch2-mob-process');
    
    let time = 0;
    
    const draw = () => {
        requestAnimationFrame(draw);
        time += 0.02;
        const mode = select ? select.value : 'isothermal';
        
        // Use live dimensions
        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width || 300;
        const height = rect.height || 300;
        
        ctx.clearRect(0, 0, width, height);
        
        // Axes
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 20); ctx.lineTo(30, height - 30);
        ctx.lineTo(width - 20, height - 30);
        ctx.stroke();
        
        // Process parameters
        let pVolume = 3 + Math.sin(time) * 1.5; // V from 1.5 to 4.5
        let pPressure = 1;
        let pColor = '#0ea5e9';
        
        if (mode === 'isothermal') {
            pPressure = 4.5 / pVolume;
            pColor = '#0ea5e9';
        } else if (mode === 'isobaric') {
            pPressure = 2.0;
            pColor = '#10b981';
        } else if (mode === 'adiabatic') {
            pPressure = Math.pow(4.5 / pVolume, 1.4);
            pColor = '#e11d48';
        }
        
        const plotX = 30 + (pVolume / 5) * (width - 60);
        const plotY = (height - 30) - (pPressure / 5) * (height - 60);
        
        // Draw Fill (Work)
        ctx.fillStyle = pColor + '44'; // Add alpha
        ctx.fillRect(30, plotY, plotX - 30, (height - 30) - plotY);
        
        // Draw Point
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(plotX, plotY, 8, 0, Math.PI*2);
        ctx.fill();
    };
    draw();
}

// --- CHAPTER 3: Joule's Experiment (DOM Animation) ---
function initCh3Mobile() {
    const btn = document.getElementById('ch3-mob-drop');
    const weight = document.getElementById('ch3-mob-weight');
    const fluid = document.getElementById('ch3-mob-fluid');
    const tempSpan = document.getElementById('ch3-mob-temp');
    if(!btn || !weight) return;
    
    let temp = 20.0;
    let isDropping = false;
    
    btn.addEventListener('click', () => {
        if(isDropping) return;
        isDropping = true;
        
        // Drop animation
        weight.style.transform = 'translateY(110px)';
        weight.style.transition = 'transform 2s linear';
        
        // Fluid heat up
        let t = 0;
        const interval = setInterval(() => {
            temp += 0.1;
            if(tempSpan) tempSpan.innerText = temp.toFixed(1);
            // shift color towards red
            if(fluid) fluid.style.background = 'hsl(' + (200 - (temp-20)*5) + ', 80%, 40%)';
            t++;
            if(t >= 20) {
                clearInterval(interval);
                // reset
                setTimeout(() => {
                    weight.style.transition = 'transform 0.5s ease';
                    weight.style.transform = 'translateY(0)';
                    isDropping = false;
                }, 1000);
            }
        }, 100);
    });
}

// --- CHAPTER 4: Steady Flow (2D Particles) ---
function initCh4Mobile() {
    const sys = setupCanvas('ch4-mob-canvas');
    if(!sys) return;
    const { canvas, ctx } = sys;
    const select = document.getElementById('ch4-mob-device');
    
    let particles = [];
    // initialize assuming width ~ 300
    for(let i=0; i<30; i++) {
        particles.push({
            x: Math.random() * 300,
            y: 150 + (Math.random()-0.5)*40,
            speed: 2 + Math.random()
        });
    }
    
    const draw = () => {
        requestAnimationFrame(draw);
        const width = canvas.parentElement.getBoundingClientRect().width || 300;
        const height = canvas.parentElement.getBoundingClientRect().height || 300;
        
        const mode = select ? select.value : 'turbine';
        ctx.clearRect(0, 0, width, height);
        
        // Draw Device Outline
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (mode === 'turbine') {
            ctx.moveTo(20, height/2 - 20); ctx.lineTo(width-20, height/2 - 40);
            ctx.moveTo(20, height/2 + 20); ctx.lineTo(width-20, height/2 + 40);
        } else if (mode === 'compressor') {
            ctx.moveTo(20, height/2 - 40); ctx.lineTo(width-20, height/2 - 20);
            ctx.moveTo(20, height/2 + 40); ctx.lineTo(width-20, height/2 + 20);
        } else { // nozzle
            ctx.moveTo(20, height/2 - 40); ctx.lineTo(width-20, height/2 - 10);
            ctx.moveTo(20, height/2 + 40); ctx.lineTo(width-20, height/2 + 10);
        }
        ctx.stroke();
        
        // Update & Draw particles
        ctx.fillStyle = '#fff';
        particles.forEach(p => {
            let s = p.speed;
            if (mode === 'nozzle') s *= 1 + (p.x / width); // speeds up
            if (mode === 'compressor') s *= 1 - (p.x / width)*0.5; // slows down
            
            p.x += s;
            if(p.x > width - 10) {
                p.x = 10;
                // constrain y based on entrance height
                let hIn = mode === 'compressor' || mode === 'nozzle' ? 80 : 40;
                p.y = height/2 + (Math.random()-0.5)*hIn;
            }
            
            // Constrain y dynamically based on x position to stay inside walls
            let maxH = 40;
            if (mode === 'turbine') maxH = 40 + (p.x/width)*40;
            if (mode === 'compressor') maxH = 80 - (p.x/width)*40;
            if (mode === 'nozzle') maxH = 80 - (p.x/width)*60;
            
            if (p.y < height/2 - maxH/2) p.y = height/2 - maxH/2;
            if (p.y > height/2 + maxH/2) p.y = height/2 + maxH/2;
            
            // Color logic
            if (mode === 'turbine') ctx.fillStyle = '#38bdf8'; // cools
            else if (mode === 'compressor') ctx.fillStyle = '#e11d48'; // heats
            else ctx.fillStyle = '#a78bfa'; // nozzle
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
            ctx.fill();
        });
    };
    draw();
}

// --- CHAPTER 5: Sankey Diagram (2D) ---
function initCh5Mobile() {
    const sys = setupCanvas('ch5-mob-canvas');
    if(!sys) return;
    const { canvas, ctx } = sys;
    const thSlider = document.getElementById('ch5-mob-th');
    const tlSlider = document.getElementById('ch5-mob-tl');
    
    let time = 0;
    
    const draw = () => {
        requestAnimationFrame(draw);
        const width = canvas.parentElement.getBoundingClientRect().width || 300;
        const height = canvas.parentElement.getBoundingClientRect().height || 300;
        
        time += 0.05;
        
        let th = thSlider ? parseFloat(thSlider.value) : 1000;
        let tl = tlSlider ? parseFloat(tlSlider.value) : 300;
        if(tl >= th) { 
            tl = th - 10; 
            if(tlSlider) tlSlider.value = tl; 
        }
        
        const eff = 1 - (tl / th);
        
        ctx.clearRect(0, 0, width, height);
        
        // Base width
        const totalW = width * 0.4;
        const wWork = totalW * eff;
        const wLoss = totalW - wWork;
        
        const cx = width / 2;
        
        // Hot Reservoir
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(cx - totalW/2, 20, totalW, 40);
        ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Q_H (High Temp)', cx, 45);
        
        // Flow Down
        ctx.fillStyle = 'rgba(225, 29, 72, ' + (0.5 + Math.sin(time)*0.2) + ')';
        ctx.fillRect(cx - totalW/2, 60, totalW, 40);
        
        // Engine Block
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(cx, 120, 20, 0, Math.PI*2);
        ctx.fill();
        
        // Flow Right (Work)
        ctx.fillStyle = 'rgba(217, 119, 6, ' + (0.5 + Math.sin(time)*0.2) + ')';
        ctx.fillRect(cx + 20, 110, width/2 - 40, wWork);
        ctx.fillStyle = '#fff';
        ctx.fillText('W (' + (eff*100).toFixed(0) + '%)', width - 30, 115 + wWork/2);
        
        // Flow Down (Loss)
        ctx.fillStyle = 'rgba(14, 165, 233, ' + (0.5 + Math.sin(time)*0.2) + ')';
        ctx.fillRect(cx - wLoss/2, 140, wLoss, height - 200);
        
        // Cold Reservoir
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(cx - wLoss/2, height - 60, wLoss, 40);
        ctx.fillStyle = '#fff';
        ctx.fillText('Q_L', cx, height - 35);
    };
    draw();
}

// --- CHAPTER 6: Entropy (2D Bouncing Particles) ---
function initCh6Mobile() {
    const sys = setupCanvas('ch6-mob-canvas');
    if(!sys) return;
    const { canvas, ctx } = sys;
    const btn = document.getElementById('ch6-mob-start');
    
    let partitioned = true;
    if (btn) {
        btn.addEventListener('click', () => { 
            partitioned = !partitioned; 
            btn.innerText = partitioned ? "Remove Partition" : "Insert Partition"; 
        });
    }
    
    let particles = [];
    const initialWidth = canvas.parentElement.getBoundingClientRect().width || 300;
    const initialHeight = canvas.parentElement.getBoundingClientRect().height || 300;
    
    for(let i=0; i<100; i++) {
        const isHot = i < 50;
        particles.push({
            x: isHot ? 10 + Math.random()*(initialWidth/2 - 20) : initialWidth/2 + 10 + Math.random()*(initialWidth/2 - 20),
            y: 10 + Math.random()*(initialHeight - 20),
            vx: (Math.random()-0.5) * (isHot ? 4 : 1),
            vy: (Math.random()-0.5) * (isHot ? 4 : 1),
            color: isHot ? '#e11d48' : '#0ea5e9'
        });
    }
    
    const draw = () => {
        requestAnimationFrame(draw);
        const width = canvas.parentElement.getBoundingClientRect().width || 300;
        const height = canvas.parentElement.getBoundingClientRect().height || 300;
        
        ctx.clearRect(0, 0, width, height);
        
        // Box
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, width-10, height-10);
        
        // Partition
        if(partitioned) {
            ctx.beginPath();
            ctx.moveTo(width/2, 5); ctx.lineTo(width/2, height-5);
            ctx.stroke();
        }
        
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            
            // Bounds
            if(p.y < 8 || p.y > height - 8) p.vy *= -1;
            
            if(partitioned) {
                if(p.color === '#e11d48' && p.x > width/2 - 5) { p.x = width/2 - 5; p.vx *= -1; }
                else if(p.color === '#e11d48' && p.x < 8) p.vx *= -1;
                
                if(p.color === '#0ea5e9' && p.x < width/2 + 5) { p.x = width/2 + 5; p.vx *= -1; }
                else if(p.color === '#0ea5e9' && p.x > width - 8) p.vx *= -1;
            } else {
                if(p.x < 8 || p.x > width - 8) p.vx *= -1;
            }
            
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
        });
    };
    draw();
}

// --- CHAPTER 8: Phase Dome (2D) ---
function initCh8Mobile() {
    const sys = setupCanvas('ch8-mob-canvas');
    if(!sys) return;
    const { canvas, ctx } = sys;
    const slider = document.getElementById('ch8-mob-quality');
    
    const draw = () => {
        const width = canvas.parentElement.getBoundingClientRect().width || 300;
        const height = canvas.parentElement.getBoundingClientRect().height || 300;
        
        ctx.clearRect(0, 0, width, height);
        const x = slider ? parseFloat(slider.value) : 0.5;
        
        // Axes
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 20); ctx.lineTo(30, height - 30);
        ctx.lineTo(width - 20, height - 30);
        ctx.stroke();
        
        // Dome (Parabola)
        ctx.strokeStyle = '#0ea5e9';
        ctx.beginPath();
        const startX = 50; const endX = width - 50; const midX = width/2;
        const base = height - 30; const peak = 40;
        ctx.moveTo(startX, base);
        ctx.quadraticCurveTo(midX, peak - 50, endX, base);
        ctx.stroke();
        
        // State Point on a horizontal boiling line
        const boilY = base - 60;
        ctx.strokeStyle = '#888'; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(30, boilY); ctx.lineTo(width-20, boilY); ctx.stroke();
        ctx.setLineDash([]);
        
        // Calculate intersection approx
        const dX = (endX - startX) * 0.7; // rough width at boilY
        const leftX = midX - dX/2;
        const rightX = midX + dX/2;
        
        const ptX = leftX + (x * (rightX - leftX));
        
        ctx.fillStyle = '#e11d48';
        ctx.beginPath(); ctx.arc(ptX, boilY, 8, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
        ctx.fillText('x = ' + x.toFixed(2), ptX - 20, boilY - 15);
    };
    
    if (slider) {
        slider.addEventListener('input', draw);
        slider.addEventListener('change', draw);
    }
    draw();
}

// --- CHAPTER 9: Rankine Flowchart (2D) ---
function initCh9Mobile() {
    const sys = setupCanvas('ch9-mob-canvas');
    if(!sys) return;
    const { canvas, ctx } = sys;
    const slider = document.getElementById('ch9-mob-pressure');
    
    let time = 0;
    
    const draw = () => {
        requestAnimationFrame(draw);
        const width = canvas.parentElement.getBoundingClientRect().width || 300;
        const height = canvas.parentElement.getBoundingClientRect().height || 300;
        
        const p = slider ? parseFloat(slider.value) : 5;
        time += 0.02 * (p / 2);
        
        ctx.clearRect(0, 0, width, height);
        
        const cx = width/2, cy = height/2;
        const rx = 60, ry = 40;
        
        // Nodes
        const nodes = [
            {id: 'Boiler', x: cx, y: cy - ry*1.5, color: '#e11d48'},
            {id: 'Turbine', x: cx + rx*1.5, y: cy, color: '#d97706'},
            {id: 'Condenser', x: cx, y: cy + ry*1.5, color: '#0ea5e9'},
            {id: 'Pump', x: cx - rx*1.5, y: cy, color: '#888'}
        ];
        
        // Edges with moving dashes
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.lineDashOffset = -time * 20;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        ctx.lineTo(nodes[1].x, nodes[1].y);
        ctx.lineTo(nodes[2].x, nodes[2].y);
        ctx.lineTo(nodes[3].x, nodes[3].y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw Nodes
        nodes.forEach(n => {
            ctx.fillStyle = n.color;
            ctx.fillRect(n.x - 30, n.y - 20, 60, 40);
            ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(n.id, n.x, n.y + 4);
        });
    };
    draw();
}

// --- CHAPTER 10: IC Engine (2D) ---
function initCh10Mobile() {
    const sys = setupCanvas('ch10-mob-canvas');
    if(!sys) return;
    const { canvas, ctx } = sys;
    const btn = document.getElementById('ch10-mob-animate');
    
    let playing = false;
    let time = 0;
    
    if (btn) {
        btn.addEventListener('click', () => { playing = true; });
    }
    
    const draw = () => {
        requestAnimationFrame(draw);
        const width = canvas.parentElement.getBoundingClientRect().width || 300;
        const height = canvas.parentElement.getBoundingClientRect().height || 300;
        
        if(playing) {
            time += 0.05;
            if(time > Math.PI*4) { time = 0; playing = false; }
        }
        
        ctx.clearRect(0, 0, width, height);
        
        const cx = width/2;
        const cy = 40; // cylinder top
        const cWidth = 80;
        const cHeight = 120;
        
        // Cylinder
        ctx.strokeStyle = '#888'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - cWidth/2, cy); ctx.lineTo(cx - cWidth/2, cy + cHeight);
        ctx.moveTo(cx + cWidth/2, cy); ctx.lineTo(cx + cWidth/2, cy + cHeight);
        ctx.stroke();
        
        // Piston
        const pHeight = 30;
        const pY = cy + 20 + Math.cos(time) * 30; // moves down from top
        ctx.fillStyle = '#ccc';
        ctx.fillRect(cx - cWidth/2 + 2, pY, cWidth - 4, pHeight);
        
        // Rod
        ctx.strokeStyle = '#aaa'; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx, pY + pHeight);
        // crank pin
        const crankX = cx + Math.sin(time) * 20;
        const crankY = cy + cHeight + 20 + Math.cos(time) * 20;
        ctx.lineTo(crankX, crankY);
        ctx.stroke();
        
        // Spark
        const stroke = Math.floor(time / Math.PI);
        if (playing && stroke === 2 && time % Math.PI < 0.5) {
            ctx.fillStyle = 'yellow';
            ctx.beginPath(); ctx.arc(cx, cy + 10, 10 + Math.random()*5, 0, Math.PI*2); ctx.fill();
        }
        
        // Status Text
        ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        const labels = ["Intake", "Compression", "Power", "Exhaust"];
        ctx.fillText(labels[stroke % 4], cx, height - 20);
    };
    draw();
}

// --- INITIALIZATION ---
function initAll() {
    initCh1Mobile();
    initCh2Mobile();
    initCh3Mobile();
    initCh4Mobile();
    initCh5Mobile();
    initCh6Mobile();
    initCh8Mobile();
    initCh9Mobile();
    initCh10Mobile();
}

// Ensure execution happens correctly regardless of module deferral status
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}
