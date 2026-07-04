// Core UI interactions for Fluid Mechanics Page (Step 2)

document.addEventListener('DOMContentLoaded', () => {
    
    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check local storage for theme preference
    const currentTheme = localStorage.getItem('scme-theme') || 'dark';
    htmlElement.setAttribute('data-theme', currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        const isDark = htmlElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('scme-theme', newTheme);
    });

    // Smooth Scrolling & Sidebar Active State
    const chapterLinks = document.querySelectorAll('.chapter-list a');
    const chapters = document.querySelectorAll('.chapter-header');

    chapterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Intersection Observer for highlighting sidebar links
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

    const chapterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                // Remove active from all
                chapterLinks.forEach(link => link.classList.remove('active'));
                // Add active to current
                const activeLink = document.querySelector(`.chapter-list a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    chapters.forEach(chapter => {
        chapterObserver.observe(chapter);
    });

    // Initialize Simulators Part 1 (Chapters 1, 2, 3)
    initSim1Viscometer();
    initSim2Hydrostatics();
    initSim3Kinematics();
    
    // Initialize Simulators Part 2 (Chapters 4, 6, 7)
    initSim4Venturi();
    initSim6Similitude();
    initSim7Moody();
    
    // Initialize Simulators Part 3 (Chapters 8, 10, 11)
    initSim8BoundaryLayer();
    initSim10HydraulicJump();
    initSim11Pump();
});

// ==========================================
// SIMULATOR 1: Viscometer Drop Test
// ==========================================
function initSim1Viscometer() {
    const canvas = document.getElementById('sim1-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const fluidSelect = document.getElementById('sim1-fluid');
    const dropBtn = document.getElementById('sim1-drop-btn');
    const velDisplay = document.getElementById('sim1-vel');
    const timeDisplay = document.getElementById('sim1-time');

    // Fluid properties (dynamic viscosity mu in Pa.s approx)
    const fluids = {
        water: { mu: 0.001, rho: 1000, color: 'rgba(6, 182, 212, 0.4)' },
        oil: { mu: 0.25, rho: 880, color: 'rgba(217, 119, 6, 0.6)' },
        honey: { mu: 10.0, rho: 1420, color: 'rgba(234, 179, 8, 0.8)' }
    };

    let sphere = {
        y: 20,
        x: width / 2, // will be updated dynamically
        r: 15,
        v: 0,
        rho: 7800, // steel
        isDropping: false
    };

    let t = 0;
    let lastTime = 0;
    let animFrame;

    function getDropX() {
        return width > 600 ? width / 2 : Math.max(width - 80, 150);
    }

    function draw(timestamp) {
        if (!lastTime) lastTime = timestamp;
        let dt = (timestamp - lastTime) / 1000; // seconds
        lastTime = timestamp;

        const fluid = fluids[fluidSelect.value];
        const dropX = getDropX();
        if (!sphere.isDropping) {
            sphere.x = dropX;
        }

        // Physics update (Stokes' law simplified for visual purposes)
        if (sphere.isDropping && sphere.y < height - sphere.r - 10) {
            t += dt;
            
            // Fg = m*g, Fb = V_f * rho_f * g, Fd = 6 * pi * mu * r * v
            const V = (4/3) * Math.PI * Math.pow(sphere.r/1000, 3); // m^3
            const m = sphere.rho * V;
            const Fg = m * 9.81;
            const Fb = fluid.rho * V * 9.81;
            const Fd = 6 * Math.PI * fluid.mu * (sphere.r/1000) * sphere.v;
            
            const a = (Fg - Fb - Fd) / m;
            sphere.v += a * dt;
            // Visual scale factor (speed up visually)
            sphere.y += sphere.v * dt * 200; 
            
            velDisplay.innerText = sphere.v.toFixed(3);
            timeDisplay.innerText = t.toFixed(2);
        } else if (sphere.isDropping) {
            sphere.isDropping = false;
        }

        // Render
        ctx.clearRect(0, 0, width, height);
        
        // Draw fluid
        ctx.fillStyle = fluid.color;
        ctx.fillRect(0, 0, width, height);
        
        // Draw cylinder walls
        const computed = getComputedStyle(document.documentElement);
        ctx.strokeStyle = computed.getPropertyValue('--border-color').trim() || '#475569';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sphere.x - 50, 0); ctx.lineTo(sphere.x - 50, height);
        ctx.moveTo(sphere.x + 50, 0); ctx.lineTo(sphere.x + 50, height);
        ctx.stroke();

        // Draw sphere
        ctx.beginPath();
        ctx.arc(sphere.x, sphere.y, sphere.r, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8'; // steel color
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        animFrame = requestAnimationFrame(draw);
    }

    dropBtn.addEventListener('click', () => {
        sphere.y = 20;
        sphere.x = getDropX();
        sphere.v = 0;
        t = 0;
        lastTime = 0;
        sphere.isDropping = true;
    });

    // Resize handling
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
        if (!sphere.isDropping) sphere.x = getDropX();
    });

    animFrame = requestAnimationFrame(draw);
}

// ==========================================
// SIMULATOR 2: Submerged Gate Hydrostatics
// ==========================================
function initSim2Hydrostatics() {
    const canvas = document.getElementById('sim2-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const depthSlider = document.getElementById('sim2-depth');
    const depthVal = document.getElementById('sim2-depth-val');
    const forceDisplay = document.getElementById('sim2-force');
    const ypDisplay = document.getElementById('sim2-yp');

    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        const h = parseFloat(depthSlider.value); // max 10m
        depthVal.innerText = h.toFixed(1) + ' m';

        const scale = height / 12; // 12m total height visual
        const waterY = height - (h * scale);
        const computed = getComputedStyle(document.documentElement);
        
        const gateX = width > 500 ? width - 100 : width - 40;
        
        // Draw water filling up to the gate
        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.fillRect(0, waterY, gateX, height - waterY);
        
        // Draw Wall / Gate on the right
        ctx.fillStyle = computed.getPropertyValue('--text-secondary').trim() || '#52525b';
        ctx.fillRect(gateX, 0, 15, height);

        // Draw some grid/floor lines to make the tank feel more real
        ctx.strokeStyle = computed.getPropertyValue('--border-color').trim() || '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < height; i += scale) {
            ctx.moveTo(0, i);
            ctx.lineTo(gateX, i);
        }
        ctx.stroke();

        // Hydrostatics Math (Assume gate is 1m wide, from bottom to water surface)
        const rho = 1000;
        const g = 9.81;
        const A = h * 1; // 1m width
        const hc = h / 2; // centroid depth
        const Fr = (rho * g * hc * A) / 1000; // kN
        
        const Ixc = (1 * Math.pow(h, 3)) / 12;
        const yp = hc + (Ixc / (hc * A));

        forceDisplay.innerText = Fr.toFixed(1);
        ypDisplay.innerText = (h - yp).toFixed(2); // From bottom for visual sense, or depth from top

        // Draw Pressure Prism pointing LEFT against the gate
        ctx.beginPath();
        ctx.moveTo(gateX, waterY);
        const maxPrismWidth = Math.min(gateX - 20, 200);
        const prismBase = gateX - (h / 10 * maxPrismWidth);
        ctx.lineTo(prismBase, height); 
        ctx.lineTo(gateX, height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(225, 29, 72, 0.4)'; // Red prism
        ctx.fill();
        ctx.strokeStyle = computed.getPropertyValue('--accent-mech').trim() || '#e11d48';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw resultant force vector
        const ypPixel = waterY + (yp * scale);
        const forceStart = gateX - ((yp / h) * (gateX - prismBase)) - 60;
        
        ctx.beginPath();
        ctx.moveTo(forceStart, ypPixel);
        ctx.lineTo(gateX, ypPixel);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(gateX, ypPixel);
        ctx.lineTo(gateX - 10, ypPixel - 5);
        ctx.lineTo(gateX - 10, ypPixel + 5);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Label F_R
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px var(--font-mono)';
        ctx.fillText('F_R', forceStart - 30, ypPixel + 4);
    }

    depthSlider.addEventListener('input', draw);
    
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
        draw();
    });

    draw();
}

// ==========================================
// SIMULATOR 3: Kinematic Wind Tunnel
// ==========================================
function initSim3Kinematics() {
    const canvas = document.getElementById('sim3-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const shapeSelect = document.getElementById('sim3-shape');
    const particlesBtn = document.getElementById('sim3-particles-btn');

    let particles = [];
    let isEmitting = true;
    const U = 3; // Free stream velocity

    // Cylinder params
    const R = 40;
    const cx = width / 2;
    const cy = height / 2;

    function spawnParticle(y) {
        particles.push({
            x: 0,
            y: y,
            age: 0
        });
    }

    particlesBtn.addEventListener('click', () => {
        isEmitting = !isEmitting;
    });

    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        const computed = getComputedStyle(document.documentElement);

        // Draw Shape
        ctx.fillStyle = computed.getPropertyValue('--text-secondary').trim() || '#52525b';
        if (shapeSelect.value === 'cylinder') {
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(cx - 5, cy - 60, 10, 120);
        }

        // Emit particles
        if (isEmitting && Math.random() < 0.3) {
            spawnParticle(cy + (Math.random() - 0.5) * 200);
        }

        // Update and draw particles
        ctx.fillStyle = computed.getPropertyValue('--accent-neon').trim() || '#06b6d4';
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            
            let vx = U;
            let vy = 0;

            if (shapeSelect.value === 'cylinder') {
                // Potential flow around a cylinder
                const dx = p.x - cx;
                const dy = p.y - cy;
                const r2 = dx*dx + dy*dy;
                if (r2 > R*R) {
                    const r = Math.sqrt(r2);
                    const theta = Math.atan2(dy, dx);
                    // Vr = U(1 - R^2/r^2)cos(t), Vtheta = -U(1 + R^2/r^2)sin(t)
                    const vr = U * (1 - (R*R)/r2) * Math.cos(theta);
                    const vtheta = -U * (1 + (R*R)/r2) * Math.sin(theta);
                    
                    vx = vr * Math.cos(theta) - vtheta * Math.sin(theta);
                    vy = vr * Math.sin(theta) + vtheta * Math.cos(theta);
                } else {
                    vx = 0; vy = 0;
                }
            } else {
                // Flat plate (approximate deflection)
                const dx = p.x - cx;
                const dy = p.y - cy;
                if (Math.abs(dx) < 40 && Math.abs(dy) < 65) {
                    vy = dy > 0 ? U : -U;
                    vx = U * 0.1;
                }
            }

            p.x += vx * 2;
            p.y += vy * 2;
            p.age++;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();

            if (p.x > width || p.age > 500) {
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(draw);
    }
    
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    });

    draw();
}

// ==========================================
// SIMULATOR 4: Venturi Tube Dynamics
// ==========================================
function initSim4Venturi() {
    const canvas = document.getElementById('sim4-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const v1Slider = document.getElementById('sim4-v1');
    const ratioSlider = document.getElementById('sim4-ratio');
    const v1Val = document.getElementById('sim4-v1-val');
    const ratioVal = document.getElementById('sim4-ratio-val');
    const v2Display = document.getElementById('sim4-v2');
    const dpDisplay = document.getElementById('sim4-dp');

    let particles = [];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * width,
            y: (Math.random() - 0.5), // normalized -0.5 to 0.5
            age: Math.random() * 100
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const computed = getComputedStyle(document.documentElement);

        const v1 = parseFloat(v1Slider.value);
        const ratio = parseFloat(ratioSlider.value);
        v1Val.innerText = v1.toFixed(1);
        ratioVal.innerText = ratio.toFixed(1);

        // Bernoulli Math
        const rho = 1000;
        const v2 = v1 / ratio; // A1*V1 = A2*V2 -> V2 = V1 * (A1/A2) = V1 / ratio
        const dp = 0.5 * rho * (v2*v2 - v1*v1) / 1000; // kPa

        v2Display.innerText = v2.toFixed(1);
        dpDisplay.innerText = dp.toFixed(1);

        // Drawing pipe
        const midY = height / 2;
        const D1 = 100;
        const D2 = D1 * Math.sqrt(ratio); // A proportional to D^2

        // Shifted further right to avoid the overlay on desktop
        const p1x = Math.max(width * 0.35, 280); 
        const p2x = width * 0.75;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.strokeStyle = computed.getPropertyValue('--border-color').trim() || '#475569';
        ctx.lineWidth = 4;

        // Top Wall
        ctx.beginPath();
        ctx.moveTo(0, midY - D1/2);
        ctx.lineTo(p1x, midY - D1/2);
        ctx.lineTo(p2x, midY - D2/2);
        ctx.lineTo(width, midY - D2/2);
        ctx.stroke();

        // Bottom Wall
        ctx.beginPath();
        ctx.moveTo(0, midY + D1/2);
        ctx.lineTo(p1x, midY + D1/2);
        ctx.lineTo(p2x, midY + D2/2);
        ctx.lineTo(width, midY + D2/2);
        ctx.stroke();

        // Update & Draw Particles
        ctx.fillStyle = computed.getPropertyValue('--accent-neon').trim() || '#06b6d4';
        particles.forEach(p => {
            // Determine local velocity and pipe radius
            let currentV = v1;
            let currentR = D1/2;
            if (p.x > p2x) {
                currentV = v2;
                currentR = D2/2;
            } else if (p.x > p1x) {
                // interpolate
                const t = (p.x - p1x) / (p2x - p1x);
                currentR = (D1/2) * (1 - t) + (D2/2) * t;
                const currentRatio = Math.pow(currentR / (D1/2), 2);
                currentV = v1 / currentRatio;
            }

            p.x += currentV * 0.5; // scaled for visual
            if (p.x > width) {
                p.x = 0;
                p.y = (Math.random() - 0.5);
            }

            const py = midY + p.y * (currentR - 5);

            ctx.beginPath();
            ctx.arc(p.x, py, 2, 0, Math.PI*2);
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    v1Slider.addEventListener('input', () => {});
    ratioSlider.addEventListener('input', () => {});
    
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    });

    draw();
}

// ==========================================
// SIMULATOR 6: Towing Tank Similitude
// ==========================================
function initSim6Similitude() {
    const canvas = document.getElementById('sim6-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const scaleSlider = document.getElementById('sim6-scale');
    const scaleVal = document.getElementById('sim6-scale-val');
    const vmDisplay = document.getElementById('sim6-vm');

    let waveOffset = 0;

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const computed = getComputedStyle(document.documentElement);
        
        const lambda = parseFloat(scaleSlider.value);
        scaleVal.innerText = lambda;

        // Froude Scaling: V_p / sqrt(L_p) = V_m / sqrt(L_m)
        // V_m = V_p / sqrt(lambda)
        const Vp = 15.0; // prototype speed
        const Vm = Vp / Math.sqrt(lambda);
        vmDisplay.innerText = Vm.toFixed(2);

        // Draw Tank Background
        ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // Draw Model Boat (Top Down)
        const cx = width / 2;
        const cy = height / 2;
        
        // Boat size scales visually slightly to give feedback, but not linearly to 100x
        const visualScale = 1 + (100 - lambda) / 100; 
        const blen = 80 * visualScale;
        const bwid = 20 * visualScale;

        // Draw Wakes (Kelvin Wake Pattern)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        waveOffset += (Vm * 0.5); // Wake animation speed based on model speed
        if (waveOffset > 20) waveOffset -= 20;

        for (let i = 0; i < 5; i++) {
            const wX = cx - blen/2 - i*30 - waveOffset;
            const wSpread = 30 + i*20 + waveOffset;
            ctx.beginPath();
            ctx.moveTo(wX, cy - wSpread);
            ctx.lineTo(cx + blen/2, cy);
            ctx.lineTo(wX, cy + wSpread);
            ctx.stroke();
        }

        // Draw Boat shape
        ctx.fillStyle = computed.getPropertyValue('--accent-mech').trim() || '#e11d48';
        ctx.beginPath();
        ctx.moveTo(cx + blen/2, cy); // Bow
        ctx.lineTo(cx, cy - bwid/2);
        ctx.lineTo(cx - blen/2, cy - bwid/2); // Stern top
        ctx.lineTo(cx - blen/2, cy + bwid/2); // Stern bot
        ctx.lineTo(cx, cy + bwid/2);
        ctx.closePath();
        ctx.fill();

        requestAnimationFrame(draw);
    }
    
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    });

    draw();
}

// ==========================================
// SIMULATOR 7: Moody Chart & Velocity Profile
// ==========================================
function initSim7Moody() {
    const canvas = document.getElementById('sim7-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const reSlider = document.getElementById('sim7-re');
    const roughSlider = document.getElementById('sim7-rough');
    const reVal = document.getElementById('sim7-re-val');
    const roughVal = document.getElementById('sim7-rough-val');
    const regimeVal = document.getElementById('sim7-regime');
    const fDisplay = document.getElementById('sim7-f');

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const computed = getComputedStyle(document.documentElement);
        
        const Re = parseFloat(reSlider.value);
        const relRough = parseFloat(roughSlider.value);
        reVal.innerText = Re;
        roughVal.innerText = relRough.toFixed(3);

        let f = 0;
        let isLaminar = Re < 2300;
        regimeVal.innerText = isLaminar ? "(Laminar)" : "(Turbulent)";
        
        if (isLaminar) {
            f = 64 / Re;
        } else {
            // Haaland approximation for turbulent friction factor
            const tmp = Math.pow(relRough / 3.7, 1.11) + 6.9 / Re;
            f = Math.pow(-1.8 * Math.log10(tmp), -2);
        }
        
        fDisplay.innerText = f.toFixed(4);

        // Canvas split: Left side velocity profile, Right side Moody point
        const splitX = width / 2;

        // --- Left: Velocity Profile ---
        const pipeY1 = height * 0.2;
        const pipeY2 = height * 0.8;
        const R = (pipeY2 - pipeY1) / 2;
        const cy = pipeY1 + R;
        
        ctx.strokeStyle = computed.getPropertyValue('--border-color').trim() || '#475569';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(50, pipeY1); ctx.lineTo(splitX - 50, pipeY1);
        ctx.moveTo(50, pipeY2); ctx.lineTo(splitX - 50, pipeY2);
        ctx.stroke();

        ctx.strokeStyle = computed.getPropertyValue('--accent-neon').trim() || '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const profileBaseX = 100;
        const maxV = isLaminar ? 100 : 120; // visual max V length
        
        for (let y = pipeY1; y <= pipeY2; y += 2) {
            const r = (y - cy) / R;
            let v = 0;
            if (isLaminar) {
                v = maxV * (1 - r*r); // parabolic
            } else {
                // Turbulent 1/7th power law approx
                v = maxV * Math.pow(1 - Math.abs(r), 1/7);
            }
            if (y === pipeY1) ctx.moveTo(profileBaseX + v, y);
            else ctx.lineTo(profileBaseX + v, y);
        }
        ctx.lineTo(profileBaseX, pipeY2);
        ctx.lineTo(profileBaseX, pipeY1);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.fill();
        ctx.stroke();

        // --- Right: Simplified Moody Plot Point ---
        const plotX = splitX + 50;
        const plotW = splitX - 100;
        const plotH = height * 0.6;
        const plotY = height * 0.2;

        ctx.strokeStyle = computed.getPropertyValue('--border-color').trim() || '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(plotX, plotY, plotW, plotH);
        ctx.fillStyle = computed.getPropertyValue('--text-secondary').trim() || '#52525b';
        ctx.font = '12px var(--font-mono)';
        ctx.fillText("Log(Re)", plotX + plotW/2 - 20, plotY + plotH + 20);
        
        ctx.save();
        ctx.translate(plotX - 10, plotY + plotH/2 + 30);
        ctx.rotate(-Math.PI/2);
        ctx.fillText("Friction Factor f", 0, 0);
        ctx.restore();

        // Map Re (1000 to 100000) logarithmically to X
        const logReMin = Math.log10(1000);
        const logReMax = Math.log10(100000);
        const px = plotX + plotW * ((Math.log10(Re) - logReMin) / (logReMax - logReMin));
        
        // Map f (0.01 to 0.07) to Y
        const fMin = 0.01;
        const fMax = 0.07;
        let fVisual = Math.min(Math.max(f, fMin), fMax);
        const py = plotY + plotH - plotH * ((fVisual - fMin) / (fMax - fMin));

        ctx.fillStyle = computed.getPropertyValue('--accent-mech').trim() || '#e11d48';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    reSlider.addEventListener('input', draw);
    roughSlider.addEventListener('input', draw);
    
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
        draw();
    });

    draw();
}

// ==========================================
// SIMULATOR 8: Airfoil Boundary Layer
// ==========================================
function initSim8BoundaryLayer() {
    const canvas = document.getElementById('sim8-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const aoaSlider = document.getElementById('sim8-aoa');
    const velSlider = document.getElementById('sim8-vel');
    const aoaVal = document.getElementById('sim8-aoa-val');
    const velVal = document.getElementById('sim8-vel-val');
    const clDisplay = document.getElementById('sim8-cl');
    const cdDisplay = document.getElementById('sim8-cd');
    const stallWarning = document.getElementById('sim8-stall');

    let particles = [];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * width,
            y: height * 0.2 + Math.random() * height * 0.6,
            speedOffset: Math.random() * 0.5 + 0.5
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const computed = getComputedStyle(document.documentElement);
        
        const aoa = parseFloat(aoaSlider.value);
        const U = parseFloat(velSlider.value);
        aoaVal.innerText = aoa;
        velVal.innerText = U;

        // Simplified aerodynamics
        const isStalled = aoa > 15;
        stallWarning.style.display = isStalled ? 'block' : 'none';

        let Cl = isStalled ? (1.5 - (aoa - 15) * 0.1) : (0.1 * aoa);
        let Cd = isStalled ? (0.05 + Math.pow(aoa/10, 2)) : (0.01 + 0.001 * aoa * aoa);

        clDisplay.innerText = Math.max(Cl, 0).toFixed(2);
        cdDisplay.innerText = Math.max(Cd, 0).toFixed(3);

        const cx = width / 2;
        const cy = height / 2;
        const chord = 200;

        // Draw Airfoil
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-aoa * Math.PI / 180);
        
        ctx.fillStyle = computed.getPropertyValue('--text-secondary').trim() || '#52525b';
        ctx.beginPath();
        // Simple teardrop shape
        ctx.moveTo(chord/2, 0); // Trailing edge
        ctx.quadraticCurveTo(0, -30, -chord/2, 0); // Top surface
        ctx.quadraticCurveTo(0, 15, chord/2, 0); // Bottom surface
        ctx.fill();
        ctx.restore();

        // Update and draw particles (streamlines)
        ctx.fillStyle = computed.getPropertyValue('--accent-neon').trim() || '#06b6d4';
        particles.forEach(p => {
            let vx = U * 0.1 * p.speedOffset;
            let vy = 0;

            // Simple deflection logic around airfoil
            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 150) {
                // If in stall and over top surface, turbulent scattering
                if (isStalled && dy < 0 && dx > -50) {
                    vx = (Math.random() - 0.5) * U * 0.05;
                    vy = (Math.random() - 0.5) * U * 0.05;
                    ctx.fillStyle = 'rgba(225, 29, 72, 0.6)'; // red turbulence
                } else {
                    // Deflect around
                    const angle = Math.atan2(dy, dx);
                    vy = (Math.sin(angle) * 50) / (dist/50);
                    ctx.fillStyle = computed.getPropertyValue('--accent-neon').trim() || '#06b6d4';
                }
            } else {
                ctx.fillStyle = computed.getPropertyValue('--accent-neon').trim() || '#06b6d4';
            }

            p.x += vx;
            p.y += vy;

            if (p.x > width || p.y < 0 || p.y > height) {
                p.x = 0;
                p.y = height * 0.2 + Math.random() * height * 0.6;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    aoaSlider.addEventListener('input', () => {});
    velSlider.addEventListener('input', () => {});
    
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    });

    draw();
}

// ==========================================
// SIMULATOR 10: Hydraulic Jump
// ==========================================
function initSim10HydraulicJump() {
    const canvas = document.getElementById('sim10-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const fr1Slider = document.getElementById('sim10-fr1');
    const y1Slider = document.getElementById('sim10-y1');
    const fr1Val = document.getElementById('sim10-fr1-val');
    const y1Val = document.getElementById('sim10-y1-val');
    const y2Display = document.getElementById('sim10-y2');
    const elossDisplay = document.getElementById('sim10-eloss');

    let t = 0;

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const computed = getComputedStyle(document.documentElement);
        
        const fr1 = parseFloat(fr1Slider.value);
        const y1 = parseFloat(y1Slider.value);
        fr1Val.innerText = fr1.toFixed(1);
        y1Val.innerText = y1.toFixed(1);

        // Belanger Equation for conjugate depth
        const y2 = (y1 / 2) * (-1 + Math.sqrt(1 + 8 * fr1 * fr1));
        
        // Energy loss
        const eloss = Math.pow(y2 - y1, 3) / (4 * y1 * y2);

        y2Display.innerText = y2.toFixed(2);
        elossDisplay.innerText = eloss.toFixed(2);

        // Draw Channel Bed
        const bedY = height - 40;
        ctx.fillStyle = computed.getPropertyValue('--text-secondary').trim() || '#52525b';
        ctx.fillRect(0, bedY, width, 40);

        // Draw Water
        const scale = 50; // pixels per meter
        const visualY1 = y1 * scale;
        const visualY2 = y2 * scale;
        
        const jumpStart = width * 0.4;
        const jumpEnd = width * 0.6;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        
        ctx.beginPath();
        ctx.moveTo(0, bedY - visualY1);
        ctx.lineTo(jumpStart, bedY - visualY1);
        
        // The Jump (turbulent surface)
        t += 0.1;
        for(let x = jumpStart; x <= jumpEnd; x += 5) {
            const progress = (x - jumpStart) / (jumpEnd - jumpStart);
            const interpY = visualY1 + (visualY2 - visualY1) * progress;
            const noise = Math.sin(x * 0.1 + t) * 10 * Math.sin(progress * Math.PI); // roller effect
            ctx.lineTo(x, bedY - interpY + noise);
        }

        ctx.lineTo(width, bedY - visualY2);
        ctx.lineTo(width, bedY);
        ctx.lineTo(0, bedY);
        ctx.fill();

        // Draw Roller Bubbles in the jump
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 30; i++) {
            const bx = jumpStart + Math.random() * (jumpEnd - jumpStart);
            const progress = (bx - jumpStart) / (jumpEnd - jumpStart);
            const baseDepth = visualY1 + (visualY2 - visualY1) * progress;
            const by = bedY - baseDepth + Math.random() * 20;
            
            ctx.beginPath();
            ctx.arc(bx, by, Math.random() * 3 + 1, 0, Math.PI*2);
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    fr1Slider.addEventListener('input', () => {});
    y1Slider.addEventListener('input', () => {});
    
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    });

    draw();
}

// ==========================================
// SIMULATOR 11: Centrifugal Pump Impeller
// ==========================================
function initSim11Pump() {
    const canvas = document.getElementById('sim11-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const rpmSlider = document.getElementById('sim11-rpm');
    const betaSlider = document.getElementById('sim11-beta');
    const rpmVal = document.getElementById('sim11-rpm-val');
    const betaVal = document.getElementById('sim11-beta-val');
    const headDisplay = document.getElementById('sim11-head');
    const flowDisplay = document.getElementById('sim11-flow');

    let rotation = 0;
    let particles = [];
    
    // Ensure we don't draw under the overlay
    const cx = Math.max(width / 2, 280);
    const cy = height / 2;
    const rOuter = 100;
    const rInner = 30;

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const computed = getComputedStyle(document.documentElement);
        
        const rpm = parseFloat(rpmSlider.value);
        const beta = parseFloat(betaSlider.value);
        rpmVal.innerText = rpm;
        betaVal.innerText = beta;

        const omega = (rpm * 2 * Math.PI) / 60; // rad/s
        
        // Simplified Pump Math
        const u2 = omega * (rOuter / 1000); // blade tip speed (scaled)
        const flow = (rpm / 1500) * 0.15; // roughly proportional
        const cm2 = flow / (2 * Math.PI * (rOuter/1000) * 0.05); // radial velocity
        
        // Euler Head H = (u2 * vu2) / g. For backward swept, vu2 = u2 - cm2 * cot(beta)
        const vu2 = u2 - cm2 / Math.tan(beta * Math.PI / 180);
        const head = (u2 * vu2) / 9.81;

        headDisplay.innerText = Math.max(head, 0).toFixed(1);
        flowDisplay.innerText = flow.toFixed(3);

        // Spin
        rotation += (rpm / 1000) * 0.1;

        // Draw Volute Casing (Background)
        ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter + 20, 0, Math.PI * 2);
        ctx.fill();

        // Draw Impeller
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        ctx.strokeStyle = computed.getPropertyValue('--text-secondary').trim() || '#52525b';
        ctx.lineWidth = 2;
        
        // Draw 6 blades
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(rInner, 0);
            
            // Sweep angle based on beta (backward curved)
            const sweep = (90 - beta) * (Math.PI / 180);
            ctx.quadraticCurveTo(rOuter * 0.5, rOuter * 0.2 * sweep, rOuter, -rOuter * 0.3 * sweep);
            
            ctx.stroke();
            ctx.restore();
        }
        
        // Inner eye
        ctx.beginPath();
        ctx.arc(0, 0, rInner, 0, Math.PI * 2);
        ctx.fillStyle = computed.getPropertyValue('--bg-secondary').trim() || '#121214';
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();

        // Emit water particles from eye
        if (particles.length < 50 && Math.random() < 0.5) {
            particles.push({
                angle: Math.random() * Math.PI * 2,
                r: rInner,
                speed: cm2 * 10
            });
        }

        // Draw Particles
        ctx.fillStyle = computed.getPropertyValue('--accent-neon').trim() || '#06b6d4';
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.r += p.speed;
            p.angle += (rpm / 1000) * 0.05; // swirl

            const px = cx + Math.cos(p.angle) * p.r;
            const py = cy + Math.sin(p.angle) * p.r;

            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();

            if (p.r > rOuter + 20) {
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(draw);
    }

    rpmSlider.addEventListener('input', () => {});
    betaSlider.addEventListener('input', () => {});
    
    window.addEventListener('resize', () => {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    });

    draw();
}
