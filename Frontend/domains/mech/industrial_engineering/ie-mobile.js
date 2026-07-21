// Mobile 2D Simulation Engine for Industrial Engineering

function setupCanvas(containerId, height = 500) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';
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

function initCh2Mobile() {
    const mobile = setupCanvas('sim-ch2-mobile', 400);
    if(!mobile) return;
    
    const st1 = document.getElementById('ch2-st1');
    const st2 = document.getElementById('ch2-st2');
    const st3 = document.getElementById('ch2-st3');
    const st4 = document.getElementById('ch2-st4');

    let items = [];
    let spawnTimer = 0;
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        const isMobile = true;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let stations = [
            { x: 80, y: 100, time: parseInt(st1?.value || 5), color: '#0ea5e9', busy: false },
            { x: 80, y: 200, time: parseInt(st2?.value || 8), color: '#10b981', busy: false },
            { x: 80, y: 300, time: parseInt(st3?.value || 4), color: '#f59e0b', busy: false },
            { x: 80, y: 400, time: parseInt(st4?.value || 6), color: '#8b5cf6', busy: false }
        ];
        
        const cycleTime = Math.max(...stations.map(s => s.time));
        
        spawnTimer++;
        if(spawnTimer >= cycleTime * 15) { 
            items.push({ pos: 0, state: 'moving', stIndex: -1, wait: 0 });
            spawnTimer = 0;
        }
        
        stations.forEach(s => s.busy = false);
        
        items.forEach(item => {
            if(item.state === 'moving') {
                item.pos += 2;
                for(let i=0; i<stations.length; i++) {
                    const sPos = stations[i].y;
                    if(Math.abs(item.pos - sPos) < 5 && item.stIndex < i) {
                        item.pos = sPos; 
                        item.state = 'processing';
                        item.wait = stations[i].time * 15; 
                        item.stIndex = i;
                        break;
                    }
                }
            } else if(item.state === 'processing') {
                stations[item.stIndex].busy = true;
                item.wait--;
                if(item.wait <= 0) {
                    item.state = 'moving';
                }
            }
        });
        
        items = items.filter(item => item.pos < canvas.height + 100);
        
        ctx.fillStyle = '#27272a';
        ctx.fillRect(30, 0, 20, canvas.height);
        
        stations.forEach((st, i) => {
            ctx.fillStyle = st.color;
            ctx.beginPath(); ctx.roundRect(st.x, st.y - 30, 80, 60, 8); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`ST ${i+1}`, st.x + 40, st.y - 5);
            ctx.fillText(`${st.time}s`, st.x + 40, st.y + 15);
            if(st.busy) {
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(st.x+10, st.y-20, 5, 0, Math.PI*2); ctx.fill();
            }
        });
        
        ctx.fillStyle = '#f97316';
        items.forEach(item => {
            ctx.fillRect(30, item.pos - 10, 20, 20);
        });
        
        const totalTime = stations.reduce((sum, s) => sum + s.time, 0);
        const efficiency = (totalTime / (stations.length * cycleTime)) * 100;
        
        ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`Cycle: ${cycleTime}s | Eff: ${efficiency.toFixed(1)}%`, 10, 30);
    };
    
    const animate = () => {
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh3Mobile() {
    const mobileSim = setupCanvas('sim-ch3-mobile', 400);
    if(!mobileSim) return;
    
    const btnToggle = document.getElementById('ch3-toggle');
    const btnRecord = document.getElementById('ch3-record');
    const spanRecords = document.getElementById('ch3-records');
    
    let isRunning = false;
    let t = 0;
    let records = [];
    
    if (btnToggle) btnToggle.addEventListener('click', () => isRunning = !isRunning);
    if (btnRecord) btnRecord.addEventListener('click', () => {
        if(isRunning) {
            records.push(t.toFixed(1));
            if(records.length > 3) records.shift();
            if(spanRecords) spanRecords.innerText = `Times: ${records.join('s, ')}s`;
            t = 0;
        }
    });

    const { canvas, ctx } = mobileSim;
    const animateMobile = () => {
        if (isRunning) t += 0.016; 
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#27272a';
        ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2, 40, 0, Math.PI*2); ctx.fill();
        
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(Math.cos(t) * 0.5);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-10, 0, 20, 100);
        ctx.restore();
        
        ctx.fillStyle = '#0ea5e9'; ctx.font = '24px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`SW: ${t.toFixed(2)}s`, canvas.width/2, 40);
        
        requestAnimationFrame(animateMobile);
    };
    animateMobile();
}

function initCh4Mobile() {
    const mobile = setupCanvas('sim-ch4-mobile', 400);
    if(!mobile) return;
    
    const btnRand = document.getElementById('ch4-randomize');
    
    let nodes = [
        { id: 'A', mx: 100, my: 100 },
        { id: 'B', mx: 300, my: 150 },
        { id: 'C', mx: 200, my: 300 }
    ];
    
    let flows = [
        { from: 0, to: 1, volume: 50 },
        { from: 1, to: 2, volume: 20 },
        { from: 2, to: 0, volume: 100 }
    ];
    
    if (btnRand) btnRand.addEventListener('click', () => {
        flows.forEach(f => f.volume = Math.floor(Math.random() * 100) + 10);
    });

    let t = 0;
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        for(let i=0; i<canvas.width; i+=50) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
        }

        let totalCost = 0;
        
        flows.forEach(f => {
            const n1 = nodes[f.from];
            const n2 = nodes[f.to];
            const x1 = n1.mx;
            const y1 = n1.my;
            const x2 = n2.mx;
            const y2 = n2.my;
            
            const dist = Math.abs(x1 - x2) + Math.abs(y1 - y2);
            totalCost += dist * f.volume;
            
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(249, 115, 22, ${f.volume/100})`;
            ctx.lineWidth = f.volume / 15;
            ctx.stroke();
        });

        nodes.forEach(n => {
            const x = n.mx;
            const y = n.my;
            const ax = n.id === 'B' ? x + Math.sin(t)*30 : x;
            
            ctx.fillStyle = '#27272a';
            ctx.beginPath(); ctx.arc(ax, y, 30, 0, Math.PI*2); ctx.fill();
            ctx.lineWidth = 4; ctx.strokeStyle = '#0ea5e9'; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(n.id, ax, y);
        });

        ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`Cost: $${totalCost}`, canvas.width - 20, 40);
    };
    
    const animate = () => {
        t += 0.02;
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh6Mobile() {
    const mobile = setupCanvas('sim-ch6-mobile', 400);
    if(!mobile) return;
    
    const dInput = document.getElementById('ch6-d');
    const hInput = document.getElementById('ch6-h');
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const D = parseFloat(dInput?.value || 1000);
        const H = parseFloat(hInput?.value || 2);
        const S = 50; 
        
        const originX = 60, originY = canvas.height - 50;
        const width = canvas.width - 80;
        
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(originX, 50); ctx.lineTo(originX, originY); ctx.lineTo(originX + width, originY); ctx.stroke();
        
        ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
        ctx.fillText('Order Q', originX + width / 2, originY + 30);
        
        ctx.beginPath();
        let eoqX = 0, eoqY = 0;
        const qScale = 0.5;
        const cScale = 0.3;
        
        for(let q = 20; q < 800; q+=10) {
            const hCost = (q / 2) * H;
            const sCost = (D / q) * S;
            const tCost = hCost + sCost;
            
            const x = originX + q * qScale;
            const yH = originY - hCost * cScale;
            const yS = originY - sCost * cScale;
            const yT = originY - tCost * cScale;
            
            ctx.fillStyle = '#10b981'; ctx.fillRect(x, yH, 2, 2); 
            ctx.fillStyle = '#0ea5e9'; ctx.fillRect(x, yS, 2, 2); 
            if(q===20) ctx.moveTo(x, yT); else ctx.lineTo(x, yT); 
        }
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 3; ctx.stroke();

        const eoq = Math.sqrt((2 * D * S) / H);
        eoqX = originX + eoq * qScale;
        eoqY = originY - ((eoq/2)*H + (D/eoq)*S) * cScale;
        
        ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(eoqX, eoqY, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillText(`EOQ: ${eoq.toFixed(0)}`, eoqX - 20, eoqY - 20);
    };
    
    const animate = () => {
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh7Mobile() {
    const mobile = setupCanvas('sim-ch7-mobile', 400);
    if(!mobile) return;
    
    const btnShift = document.getElementById('ch7-shift');
    const btnFix = document.getElementById('ch7-fix');
    
    let data = [];
    let time = 0;
    let processMean = 10;
    
    if (btnShift) btnShift.addEventListener('click', () => processMean = 16);
    if (btnFix) btnFix.addEventListener('click', () => processMean = 10);
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const originX = 40, width = canvas.width - 80, originY = canvas.height / 2;
        const h = canvas.height / 2 - 40;
        
        ctx.fillStyle = '#18181b'; ctx.fillRect(originX, originY - h, width, h*2);
        
        ctx.strokeStyle = '#0ea5e9'; ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(originX+width, originY); ctx.stroke();
        ctx.strokeStyle = '#ef4444'; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(originX, originY - h*0.8); ctx.lineTo(originX+width, originY - h*0.8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(originX, originY + h*0.8); ctx.lineTo(originX+width, originY + h*0.8); ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
        ctx.fillText('UCL', originX + width + 5, originY - h*0.8);
        ctx.fillText('LCL', originX + width + 5, originY + h*0.8);
        
        if(data.length > 0) {
            ctx.beginPath(); ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2;
            data.forEach((val, i) => {
                const x = originX + (i / 50) * width;
                const y = originY - (val - 10) * (h/10);
                if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
            
            data.forEach((val, i) => {
                const x = originX + (i / 50) * width;
                const y = originY - (val - 10) * (h/10);
                ctx.fillStyle = Math.abs(val - 10) > 8 ? '#ef4444' : '#f97316'; 
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
            });
        }
    };
    
    const animate = () => {
        if(time % 5 === 0) {
            data.push(processMean + (Math.random() * 6 - 3));
            if(data.length > 50) data.shift();
        }
        time++;
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh8Mobile() {
    const mobile = setupCanvas('sim-ch8-mobile', 400);
    if(!mobile) return;
    
    const b1Input = document.getElementById('ch8-b1');
    const b2Input = document.getElementById('ch8-b2');
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const b1 = parseFloat(b1Input?.value || 10);
        const b2 = parseFloat(b2Input?.value || 12);
        
        const ox = 50, oy = canvas.height - 50, scale = 15;
        
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ox, 20); ctx.lineTo(ox, oy); ctx.lineTo(canvas.width - 20, oy); ctx.stroke();
        
        const p1 = {x: ox + (b1/2)*scale, y: oy};
        const p2 = {x: ox, y: oy - b1*scale};
        ctx.strokeStyle = '#0ea5e9';
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        
        const p3 = {x: ox + b2*scale, y: oy};
        const p4 = {x: ox, y: oy - (b2/2)*scale};
        ctx.strokeStyle = '#10b981';
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
        
        const intX2 = (2*b2 - b1)/3;
        const intX1 = b2 - 2*intX2;
        
        ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        
        if(intX1 >= 0 && intX2 >= 0) {
            ctx.lineTo(ox, oy - Math.min(b1, b2/2)*scale);
            ctx.lineTo(ox + intX1*scale, oy - intX2*scale);
            ctx.lineTo(ox + Math.min(b1/2, b2)*scale, oy);
        } else {
            ctx.lineTo(ox, oy - Math.min(b1, b2/2)*scale);
            ctx.lineTo(ox + Math.min(b1/2, b2)*scale, oy);
        }
        ctx.fill();
        
        if(intX1 >= 0 && intX2 >= 0) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(ox + intX1*scale, oy - intX2*scale, 6, 0, Math.PI*2); ctx.fill();
            ctx.fillText(`Optimal (${intX1.toFixed(1)}, ${intX2.toFixed(1)})`, ox + intX1*scale + 10, oy - intX2*scale - 10);
        }
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
    
    const lamInput = document.getElementById('ch9-lambda');
    const muInput = document.getElementById('ch9-mu');
    
    let entities = [];
    let isServerBusy = false;
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = isServerBusy ? '#ef4444' : '#27272a'; 
        ctx.fillRect(canvas.width - 120, 100, 80, 80);
        ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; 
        ctx.fillText(isServerBusy ? 'Busy' : 'Idle', canvas.width - 105, 145);
        
        ctx.strokeStyle = '#fff'; ctx.setLineDash([5,5]);
        ctx.beginPath(); ctx.moveTo(20, 120); ctx.lineTo(canvas.width - 120, 120); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, 160); ctx.lineTo(canvas.width - 120, 160); ctx.stroke();
        ctx.setLineDash([]);
        
        let queueCount = 0;
        for(let i=0; i<entities.length; i++) {
            let e = entities[i];
            if(e.status === 'queue') {
                const targetX = (canvas.width - 140) - queueCount*30;
                if(e.x < targetX) e.x += 2;
                queueCount++;
            } else if(e.status === 'service') {
                e.x = canvas.width - 80; e.y = 140;
            } else {
                e.x += 3;
            }
            ctx.fillStyle = '#f97316';
            ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
        ctx.fillText(`Queue Length: ${queueCount}`, 20, 30);
    };
    
    const animate = () => {
        const lam = parseFloat(lamInput?.value || 0.02);
        const mu = parseFloat(muInput?.value || 0.05);
        
        if(Math.random() < lam) entities.push({x: 0, y: 140, status: 'queue'});
        
        if(isServerBusy) {
            if(Math.random() < mu) {
                isServerBusy = false;
                const e = entities.find(x => x.status === 'service');
                if(e) e.status = 'done';
            }
        } else {
            const nextInQueue = entities.find(x => x.status === 'queue');
            if(nextInQueue) {
                nextInQueue.status = 'service';
                isServerBusy = true;
            }
        }
        
        entities = entities.filter(e => e.x < 2000);
        
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh10Mobile() {
    const mobile = setupCanvas('sim-ch10-mobile', 300);
    if(!mobile) return;
    
    const alphaInput = document.getElementById('ch10-alpha');
    
    let t = 0;
    let actual = [];
    let forecast = [];
    let f_prev = 50;
    
    const draw = (sim) => {
        const {canvas, ctx} = sim;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const ox = 40, oy = canvas.height - 40, dx = (canvas.width - 80) / 50;
        
        ctx.beginPath(); ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2; 
        actual.forEach((val, i) => {
            const y = oy - val * 1.5;
            if(i===0) ctx.moveTo(ox + i*dx, y); else ctx.lineTo(ox + i*dx, y);
        });
        ctx.stroke();

        ctx.beginPath(); ctx.strokeStyle = '#f97316'; ctx.lineWidth = 3; 
        forecast.forEach((val, i) => {
            const y = oy - val * 1.5;
            if(i===0) ctx.moveTo(ox + i*dx, y); else ctx.lineTo(ox + i*dx, y);
        });
        ctx.stroke();
    };
    
    const animate = () => {
        if(t % 5 === 0) {
            const a = 50 + Math.sin(t*0.05)*30 + (Math.random()*20 - 10);
            actual.push(a);
            const alpha = parseFloat(alphaInput?.value || 0.2);
            const f = alpha * a + (1 - alpha) * f_prev;
            forecast.push(f);
            f_prev = f;
            if(actual.length > 50) { actual.shift(); forecast.shift(); }
        }
        t++;
        draw(mobile);
        requestAnimationFrame(animate);
    };
    animate();
}

function initCh12Mobile() {
    const mobileSim = setupCanvas('sim-ch12-mobile', 400);
    if(!mobileSim) return;
    
    const angleInput = document.getElementById('ch12-angle');
    const weightInput = document.getElementById('ch12-weight');
    
    const {canvas, ctx} = mobileSim;
    const animateMobile = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const angle = parseFloat(angleInput?.value || 0) * (Math.PI / 180);
        const weight = parseFloat(weightInput?.value || 10);
        const rwl = 23 * (25 / (25 + angle * 50)); 
        
        const ox = canvas.width/2, oy = canvas.height - 100;
        
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy-100); ctx.stroke();
        
        ctx.strokeStyle = '#0ea5e9';
        ctx.beginPath(); ctx.moveTo(ox, oy-100); ctx.lineTo(ox + Math.sin(angle)*100, oy-100 - Math.cos(angle)*100); ctx.stroke();
        
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath(); ctx.moveTo(ox + Math.sin(angle)*100, oy-100 - Math.cos(angle)*100); 
        ctx.lineTo(ox + Math.sin(angle)*150, oy); ctx.stroke();
        
        ctx.fillStyle = weight > rwl ? '#ef4444' : '#10b981';
        ctx.fillRect(ox + Math.sin(angle)*150 - weight, oy - weight*2, weight*2, weight*2);
        
        ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`Limit: ${rwl.toFixed(1)}kg | Load: ${weight}kg`, canvas.width/2, 40);
        
        requestAnimationFrame(animateMobile);
    };
    animateMobile();
}

document.addEventListener('DOMContentLoaded', () => {
    initCh2Mobile();
    initCh3Mobile();
    initCh4Mobile();
    initCh6Mobile();
    initCh7Mobile();
    initCh8Mobile();
    initCh9Mobile();
    initCh10Mobile();
    initCh12Mobile();
});
