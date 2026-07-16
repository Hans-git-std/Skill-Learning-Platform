/**
 * SCME Mobile Engine (2D Interactive Dashboards)
 * No Three.js dependencies. Runs natively on all mobile browsers.
 */

function initCh1Mobile() {
    const select = document.getElementById('ch1-mobile-mode');
    if(!select) return;
    
    const qout = document.getElementById('ch1-mob-qout');
    const temp = document.getElementById('ch1-mob-temp');
    const graphic = document.getElementById('ch1-mob-graphic');
    
    select.addEventListener('change', (e) => {
        const mode = e.target.value;
        if(mode === 'conduction') {
            qout.innerText = '500 W';
            temp.innerText = '350 K';
            graphic.style.background = 'linear-gradient(to right, #ff3300, #0ea5e9)';
            graphic.innerHTML = '<div style="color: white; font-weight: bold; padding: 1rem;">Solid Wall Heat Flow &rarr;</div>';
        } else if(mode === 'convection') {
            qout.innerText = '1200 W';
            temp.innerText = '320 K';
            graphic.style.background = 'linear-gradient(to top, #ff3300, rgba(14,165,233,0.2))';
            graphic.innerHTML = '<div style="color: white; font-weight: bold; padding: 1rem;">Fluid Rising &uarr;</div>';
        } else {
            qout.innerText = '450 W';
            temp.innerText = '380 K';
            graphic.style.background = 'radial-gradient(circle, #ffaa00, transparent)';
            graphic.innerHTML = '<div style="color: white; font-weight: bold; padding: 1rem;">Waves Emitted &harr;</div>';
        }
    });
    
    // trigger initial
    select.dispatchEvent(new Event('change'));
}

function initCh2Mobile() {
    const btn = document.getElementById('ch2-mob-add');
    if(!btn) return;
    
    const container = document.getElementById('ch2-mob-wall-container');
    const select = document.getElementById('ch2-mob-mat');
    const rthEl = document.getElementById('ch2-mob-rth');
    const fluxEl = document.getElementById('ch2-mob-flux');
    
    let layers = []; // store thicknesses
    
    function render() {
        container.innerHTML = '';
        let totalR = 0;
        layers.forEach((t, i) => {
            totalR += t;
            const div = document.createElement('div');
            div.style.flex = t;
            div.style.background = i % 2 === 0 ? '#b91c1c' : '#f59e0b';
            div.style.borderRight = i < layers.length - 1 ? '2px solid black' : 'none';
            container.appendChild(div);
        });
        
        rthEl.innerText = totalR.toFixed(3);
        const flux = totalR === 0 ? 0 : 500 / totalR;
        fluxEl.innerText = flux.toFixed(1);
    }
    
    btn.addEventListener('click', () => {
        const mat = select.value;
        if(mat === 'brick') layers.push(0.7);
        else if(mat === 'fiber') layers.push(0.04);
        else layers.push(200);
        
        if(layers.length > 5) layers.shift(); // keep it from overflowing visually
        render();
    });
    
    // initial state
    layers.push(0.7);
    layers.push(0.04);
    render();
}

function initCh3Mobile() {
    const slider = document.getElementById('ch3-mob-length');
    if(!slider) return;
    
    const fin = document.getElementById('ch3-mob-fin');
    const effEl = document.getElementById('ch3-mob-eff');
    
    slider.addEventListener('input', (e) => {
        const len = parseFloat(e.target.value);
        fin.style.width = (len * 10) + 'px'; // up to 100px
        
        // dummy efficiency calc
        const eff = Math.max(0, 100 - (len * 2));
        effEl.innerText = eff.toFixed(1);
        
        const r = Math.floor(255 * (eff/100));
        const b = Math.floor(255 * (1 - eff/100));
        fin.style.background = `linear-gradient(to right, rgb(${r},0,0), rgb(0,0,${b}))`;
    });
}

function initCh4Mobile() {
    const btn = document.getElementById('ch4-mob-quench');
    if(!btn) return;
    
    const sphere = document.getElementById('ch4-mob-sphere');
    const timeEl = document.getElementById('ch4-mob-time');
    const tempEl = document.getElementById('ch4-mob-temp');
    const matSelect = document.getElementById('ch4-mob-mat');
    
    let time = 0;
    let temp = 1000;
    let interval = null;
    
    btn.addEventListener('click', () => {
        if(interval) clearInterval(interval);
        
        time = 0;
        temp = 1000;
        const mat = matSelect.value;
        const alpha = mat === 'copper' ? 1.1e-4 : 1.4e-5;
        
        interval = setInterval(() => {
            time += 0.5;
            temp = 300 + (700) * Math.exp(-alpha * time * 10000); // scaled for visual
            
            timeEl.innerText = time.toFixed(1);
            tempEl.innerText = temp.toFixed(0);
            
            const r = Math.floor(255 * ((temp-300)/700));
            const b = Math.floor(255 * (1 - (temp-300)/700));
            sphere.style.background = `rgb(${r}, 0, ${b})`;
            
            if (temp < 310) clearInterval(interval);
        }, 100);
    });
}

function initCh5Mobile() {
    const slider = document.getElementById('ch5-mob-vel');
    if(!slider) return;
    
    const particle = document.getElementById('ch5-mob-particle');
    const reEl = document.getElementById('ch5-mob-re');
    const hEl = document.getElementById('ch5-mob-h');
    
    slider.addEventListener('input', (e) => {
        const vel = parseFloat(e.target.value);
        
        const Re = (vel * 1.5) / 1.5e-5;
        reEl.innerText = Re.toExponential(2);
        
        const h = 5 + (vel * 2);
        hEl.innerText = h.toFixed(1);
        
        const dur = Math.max(0.2, 2.0 / vel);
        particle.style.animation = `flyRight ${dur}s linear infinite`;
    });
}

function initCh6Mobile() {
    const slider = document.getElementById('ch6-mob-re');
    if(!slider) return;
    
    const flow = document.getElementById('ch6-mob-flow');
    const regEl = document.getElementById('ch6-mob-regime');
    const nuEl = document.getElementById('ch6-mob-nu');
    
    slider.addEventListener('input', (e) => {
        const re = parseFloat(e.target.value);
        
        const isTurbulent = re > 4000;
        regEl.innerText = isTurbulent ? 'Turbulent' : (re > 2300 ? 'Transition' : 'Laminar');
        regEl.style.color = isTurbulent ? 'var(--accent-warning)' : 'var(--accent-neon)';
        
        let nu = 4.36;
        if(isTurbulent) {
            nu = 0.023 * Math.pow(re, 0.8) * Math.pow(0.7, 0.4);
            flow.style.height = '100%';
            flow.style.opacity = '0.3';
        } else if (re > 2300) {
            nu = 4.36 + ((re-2300)/1700)*(0.023*Math.pow(4000, 0.8)*Math.pow(0.7,0.4) - 4.36);
            flow.style.height = '50%';
            flow.style.opacity = '0.6';
        } else {
            flow.style.height = '2px';
            flow.style.opacity = '1.0';
        }
        
        nuEl.innerText = nu.toFixed(1);
    });
}

function initCh7Mobile() {
    const slider = document.getElementById('ch7-mob-dt');
    if(!slider) return;
    
    const plume = document.getElementById('ch7-mob-plume');
    const raEl = document.getElementById('ch7-mob-ra');
    const flowEl = document.getElementById('ch7-mob-flow');
    
    slider.addEventListener('input', (e) => {
        const dt = parseFloat(e.target.value);
        
        const Ra = dt * 5e7;
        raEl.innerText = Ra.toExponential(2);
        
        const isTurb = Ra > 1e9;
        flowEl.innerText = isTurb ? 'Turbulent' : 'Laminar';
        flowEl.style.color = isTurb ? 'var(--accent-warning)' : 'var(--accent-neon)';
        
        plume.style.height = (20 + (dt/100)*80) + '%';
        if(isTurb) {
            plume.style.filter = 'blur(8px)';
            plume.style.width = '80px';
        } else {
            plume.style.filter = 'blur(4px)';
            plume.style.width = '40px';
        }
    });
}

function initCh8Mobile() {
    const slider = document.getElementById('ch8-mob-temp');
    if(!slider) return;
    
    const visual = document.getElementById('ch8-mob-visual');
    const text = document.getElementById('ch8-mob-bubble-text');
    const regEl = document.getElementById('ch8-mob-regime');
    const fluxEl = document.getElementById('ch8-mob-flux');
    
    slider.addEventListener('input', (e) => {
        const dTe = parseFloat(e.target.value);
        let flux = 0;
        let regime = '';
        
        if (dTe < 5) {
            regime = 'Free Convection';
            flux = dTe * 0.05;
            visual.style.background = 'rgba(2,132,199,0.1)';
            text.innerText = 'Still';
        } else if (dTe < 30) {
            regime = 'Nucleate Boiling';
            flux = 0.25 + (dTe-5)*0.1;
            visual.style.background = 'rgba(2,132,199,0.8)';
            text.innerText = 'Bubbles!';
        } else if (dTe < 120) {
            regime = 'Transition Boiling';
            flux = 2.75 - ((dTe-30)/90)*2.0;
            visual.style.background = 'rgba(255,170,0,0.5)';
            text.innerText = 'Unstable';
        } else {
            regime = 'Film Boiling';
            flux = 0.75 + ((dTe-120)/30)*0.2;
            visual.style.background = 'rgba(255,51,0,0.3)';
            text.innerText = 'Vapor Film';
        }
        
        regEl.innerText = regime;
        if(regime === 'Transition Boiling') regEl.style.color = 'var(--accent-warning)';
        else if(regime === 'Film Boiling') regEl.style.color = 'var(--accent-mech)';
        else regEl.style.color = 'var(--accent-neon)';
        
        fluxEl.innerText = flux.toFixed(2);
    });
}

function initCh9Mobile() {
    const select = document.getElementById('ch9-mob-type');
    if(!select) return;
    
    const coldPipe = document.getElementById('ch9-mob-cold-pipe');
    const effEl = document.getElementById('ch9-mob-eff');
    const tcEl = document.getElementById('ch9-mob-tc');
    
    select.addEventListener('change', (e) => {
        const type = e.target.value;
        if(type === 'counter') {
            coldPipe.style.background = 'linear-gradient(to left, #0ea5e9, #0055ff)';
            coldPipe.innerText = '← Cold Flow';
            effEl.innerText = '85.4%';
            tcEl.innerText = '385.4 K';
        } else {
            coldPipe.style.background = 'linear-gradient(to right, #0055ff, #0ea5e9)';
            coldPipe.innerText = 'Cold Flow →';
            effEl.innerText = '62.1%';
            tcEl.innerText = '362.1 K';
        }
    });
    
    // trigger initial
    select.dispatchEvent(new Event('change'));
}

function initCh10Mobile() {
    const select = document.getElementById('ch10-mob-orient');
    if(!select) return;
    
    const f12El = document.getElementById('ch10-mob-f12');
    const qradEl = document.getElementById('ch10-mob-qrad');
    const graphic = document.getElementById('ch10-mob-graphic');
    const rays = document.getElementById('ch10-mob-rays');
    
    select.addEventListener('change', (e) => {
        const type = e.target.value;
        rays.style.opacity = '1';
        
        if(type === 'parallel') {
            graphic.style.borderRight = 'none';
            graphic.style.borderTop = '4px solid var(--accent-mech)';
            f12El.innerText = '0.42';
            qradEl.innerText = '2100.0 W';
        } else {
            graphic.style.borderTop = 'none';
            graphic.style.borderRight = '4px solid var(--accent-mech)';
            f12El.innerText = '0.15';
            qradEl.innerText = '750.0 W';
        }
        
        setTimeout(() => { rays.style.opacity = '0'; }, 1000);
    });
    
    // trigger initial
    select.dispatchEvent(new Event('change'));
}

// Ensure DOM is ready, then run
document.addEventListener("DOMContentLoaded", () => {
    initCh1Mobile();
    initCh2Mobile();
    initCh3Mobile();
    initCh4Mobile();
    initCh5Mobile();
    initCh6Mobile();
    initCh7Mobile();
    initCh8Mobile();
    initCh9Mobile();
    initCh10Mobile();
});
