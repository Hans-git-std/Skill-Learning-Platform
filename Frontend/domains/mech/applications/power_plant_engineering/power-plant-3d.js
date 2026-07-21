// Power Plant Engineering 3D Simulators
import * as THREE from 'three';
function init3DScene(canvasId, setupCallback, animateCallback) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    
    function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();
    
    const clock = new THREE.Clock();
    
    setupCallback({ scene, camera, renderer });
    
    function animate() {
        requestAnimationFrame(animate);
        if (animateCallback) animateCallback({ scene, camera, clock });
        renderer.render(scene, camera);
    }
    animate();
}

// ---------------------------------------------------------
// CHAPTER 1: Plant Economics & Load Curves
// ---------------------------------------------------------
init3DScene('ch1-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0,0,0);
    
    const sun = new THREE.DirectionalLight(0xffddaa, 1.5);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x404040)); // soft white light
    
    // City block
    const city = new THREE.Group();
    for(let i=0; i<20; i++) {
        const h = Math.random()*3 + 1;
        const b = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), new THREE.MeshPhongMaterial({color:0x888888}));
        b.position.set((Math.random()-0.5)*8, h/2, (Math.random()-0.5)*8);
        city.add(b);
    }
    scene.add(city);
    
    scene.userData = { sun, time: 12.0, playing: false };
    
    const btn = document.getElementById('ch1-play-3d');
    if(btn) {
        btn.onclick = () => {
            scene.userData.playing = !scene.userData.playing;
            btn.innerText = scene.userData.playing ? "Pause" : "Play Day Cycle";
        };
    }
}, ({ scene }) => {
    const ud = scene.userData;
    if(ud.playing) {
        ud.time += 0.05;
        if(ud.time >= 24) ud.time = 0;
    }
    
    const timeSpan = document.getElementById('ch1-time-3d');
    if(timeSpan) {
        const hrs = Math.floor(ud.time);
        const mins = Math.floor((ud.time - hrs) * 60);
        timeSpan.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    const angle = ((ud.time - 6) / 12) * Math.PI; // 6am = 0
    ud.sun.position.set(Math.cos(angle)*10, Math.sin(angle)*10, 5);
    
    const isDay = ud.time > 6 && ud.time < 18;
    ud.sun.intensity = isDay ? Math.sin(angle)*1.5 : 0;
});

// ---------------------------------------------------------
// CHAPTER 3: Steam Generators (Boilers)
// ---------------------------------------------------------
init3DScene('ch3-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 2, 8);
    camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    // Boiler
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4, 32), new THREE.MeshPhongMaterial({color: 0x555555, transparent: true, opacity: 0.5}));
    scene.add(boiler);
    
    // Fire particles
    const pGeo = new THREE.BufferGeometry();
    const count = 200;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) { pos[i*3] = (Math.random()-0.5)*3; pos[i*3+1] = -2; pos[i*3+2] = (Math.random()-0.5)*3; }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(pGeo, new THREE.PointsMaterial({color: 0xff5500, size: 0.2}));
    scene.add(points);
    
    scene.userData = { points };
}, ({ scene }) => {
    const fuel = parseFloat(document.getElementById('ch3-fuel-3d')?.value || 50);
    const tempSpan = document.getElementById('ch3-temp-3d');
    
    if(tempSpan) tempSpan.innerText = (200 + fuel * 2).toFixed(0);
    
    const p = scene.userData.points.geometry.attributes.position.array;
    const flameH = (fuel / 100) * 3;
    for(let i=0; i<p.length/3; i++) {
        p[i*3+1] += 0.1;
        if(p[i*3+1] > -2 + flameH) {
            p[i*3+1] = -2;
            p[i*3] = (Math.random()-0.5)*3;
            p[i*3+2] = (Math.random()-0.5)*3;
        }
    }
    scene.userData.points.geometry.attributes.position.needsUpdate = true;
});

// ---------------------------------------------------------
// CHAPTER 4: Steam Turbines
// ---------------------------------------------------------
init3DScene('ch4-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 0, 8);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    const rotor = new THREE.Group();
    scene.add(rotor);
    
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.5, 32), new THREE.MeshPhongMaterial({color: 0x4a90e2}));
    hub.rotation.x = Math.PI/2;
    rotor.add(hub);
    
    for(let i=0; i<16; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.5), new THREE.MeshPhongMaterial({color: 0xaaaaaa}));
        blade.position.y = 1.5;
        const pivot = new THREE.Group();
        pivot.rotation.z = (i/16) * Math.PI * 2;
        pivot.add(blade);
        rotor.add(pivot);
    }
    
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2, 16), new THREE.MeshPhongMaterial({color: 0xe24a4a}));
    scene.add(nozzle);
    
    scene.userData = { rotor, nozzle };
}, ({ scene, clock }) => {
    const ud = scene.userData;
    const v1 = parseFloat(document.getElementById('ch4-v1-3d')?.value || 400);
    const u = parseFloat(document.getElementById('ch4-u-3d')?.value || 150);
    const alpha = parseFloat(document.getElementById('ch4-alpha-3d')?.value || 20);
    
    ud.rotor.rotation.z -= (u / 500); // Rotate wheel
    
    // Position nozzle
    ud.nozzle.position.set(Math.sin(alpha*Math.PI/180)*3.5, Math.cos(alpha*Math.PI/180)*3.5, 0);
    ud.nozzle.rotation.z = -alpha * Math.PI/180;
});

// ---------------------------------------------------------
// CHAPTER 5: Gas Turbines (Brayton Cycle)
// ---------------------------------------------------------
init3DScene('ch5-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 5, 10);
    camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    const comp = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshPhongMaterial({color:0x4a90e2}));
    comp.position.x = -3; scene.add(comp);
    
    const comb = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 32), new THREE.MeshPhongMaterial({color:0xe24a4a}));
    comb.position.z = -3; scene.add(comb);
    
    const turb = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshPhongMaterial({color:0xf5a623}));
    turb.position.x = 3; scene.add(turb);
    
    const inter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), new THREE.MeshPhongMaterial({color:0x4a90e2}));
    inter.position.set(-3, 0, 3); scene.add(inter);
    
    const regen = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), new THREE.MeshPhongMaterial({color:0x888888}));
    regen.position.set(0, 0, 3); scene.add(regen);
    
    const reheat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), new THREE.MeshPhongMaterial({color:0xe24a4a}));
    reheat.position.set(3, 0, 3); scene.add(reheat);
    
    scene.userData = { inter, regen, reheat };
}, ({ scene }) => {
    scene.userData.inter.visible = document.getElementById('ch5-intercooler-3d')?.checked;
    scene.userData.regen.visible = document.getElementById('ch5-regenerator-3d')?.checked;
    scene.userData.reheat.visible = document.getElementById('ch5-reheater-3d')?.checked;
});

// ---------------------------------------------------------
// CHAPTER 6: Combined Cycle
// ---------------------------------------------------------
init3DScene('ch6-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 2, 8);
    camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    const comb = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 4, 32), new THREE.MeshPhongMaterial({color:0x555555, transparent:true, opacity:0.6}));
    scene.add(comb);
    
    const pGeo = new THREE.BufferGeometry();
    const count = 300;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) { pos[i*3] = (Math.random()-0.5); pos[i*3+1] = -2; pos[i*3+2] = (Math.random()-0.5); }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(pGeo, new THREE.PointsMaterial({color: 0xff5500, size: 0.3}));
    scene.add(points);
    
    scene.userData = { points };
}, ({ scene }) => {
    const temp = parseFloat(document.getElementById('ch6-temp-3d')?.value || 1300);
    const effSpan = document.getElementById('ch6-eff-3d');
    
    if(effSpan) effSpan.innerText = (35 + (temp - 1000) * 0.04).toFixed(1);
    
    const p = scene.userData.points.geometry.attributes.position.array;
    const flameH = (temp - 1000) / 600 * 4;
    for(let i=0; i<p.length/3; i++) {
        p[i*3+1] += 0.15;
        if(p[i*3+1] > -2 + flameH) {
            p[i*3+1] = -2;
            p[i*3] = (Math.random()-0.5);
            p[i*3+2] = (Math.random()-0.5);
        }
    }
    scene.userData.points.geometry.attributes.position.needsUpdate = true;
});

// ---------------------------------------------------------
// CHAPTER 8: Hydroelectric
// ---------------------------------------------------------
init3DScene('ch8-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 2, 8);
    camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    // Dam
    const dam = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 1), new THREE.MeshPhongMaterial({color:0x888888}));
    dam.position.z = -1;
    scene.add(dam);
    
    // Water volume
    const water = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 3), new THREE.MeshPhongMaterial({color:0x4a90e2, transparent:true, opacity:0.8}));
    water.position.set(0, 0, -3);
    scene.add(water);
    
    scene.userData = { water };
}, ({ scene }) => {
    const head = parseFloat(document.getElementById('ch8-head-3d')?.value || 100);
    const typeSpan = document.getElementById('ch8-type-3d');
    
    if(typeSpan) {
        if(head > 300) typeSpan.innerText = 'Pelton';
        else if(head > 50) typeSpan.innerText = 'Francis';
        else typeSpan.innerText = 'Kaplan';
    }
    
    const wH = (head / 500) * 4;
    scene.userData.water.scale.y = wH / 4;
    scene.userData.water.position.y = -2 + wH/2;
});

// ---------------------------------------------------------
// CHAPTER 9: Nuclear
// ---------------------------------------------------------
init3DScene('ch9-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 2, 8);
    camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    // Core
    const core = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4, 32), new THREE.MeshPhongMaterial({color:0x333333, transparent:true, opacity:0.8}));
    scene.add(core);
    
    const glow = new THREE.PointLight(0x4ae290, 1, 10);
    scene.add(glow);
    
    // Rods
    const rods = new THREE.Group();
    for(let i=0; i<4; i++) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 16), new THREE.MeshPhongMaterial({color:0x111111}));
        rod.position.set(Math.cos(i*Math.PI/2), 0, Math.sin(i*Math.PI/2));
        rods.add(rod);
    }
    scene.add(rods);
    
    scene.userData = { rods, glow, core };
}, ({ scene }) => {
    const rodsVal = parseFloat(document.getElementById('ch9-rods-3d')?.value || 50);
    const tempSpan = document.getElementById('ch9-temp-3d');
    
    const temp = 200 + (100 - rodsVal) * 5;
    if(tempSpan) tempSpan.innerText = temp.toFixed(0);
    
    scene.userData.rods.position.y = (rodsVal / 100) * 3; // 0 to 3 up
    scene.userData.glow.intensity = (temp - 200) / 100;
    scene.userData.core.material.color.setHex(temp > 500 ? 0x4ae290 : 0x333333);
});

// ---------------------------------------------------------
// CHAPTER 10: Non-Conventional (Renewables)
// ---------------------------------------------------------
init3DScene('ch10-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 4, 10);
    camera.lookAt(0,2,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    // Tower
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 6, 16), new THREE.MeshPhongMaterial({color:0xaaaaaa}));
    tower.position.y = 3;
    scene.add(tower);
    
    // Rotor
    const rotor = new THREE.Group();
    rotor.position.set(0, 6, 0.5);
    scene.add(rotor);
    
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshPhongMaterial({color:0xffffff}));
    rotor.add(hub);
    
    for(let i=0; i<3; i++) {
        const bladeGroup = new THREE.Group();
        bladeGroup.rotation.z = (i/3) * Math.PI * 2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 0.1), new THREE.MeshPhongMaterial({color:0xffffff}));
        blade.position.y = 2;
        bladeGroup.add(blade);
        rotor.add(bladeGroup);
    }
    
    scene.userData = { rotor };
}, ({ scene, clock }) => {
    const wind = parseFloat(document.getElementById('ch10-wind-3d')?.value || 10);
    const pitch = parseFloat(document.getElementById('ch10-pitch-3d')?.value || 0);
    const pwrSpan = document.getElementById('ch10-power-3d');
    
    const effWind = wind * (1 - pitch/90);
    if(pwrSpan) pwrSpan.innerText = (Math.pow(effWind, 3) * 0.1).toFixed(1);
    
    // Rotate rotor blades by pitch
    scene.userData.rotor.children.forEach((group, i) => {
        if(i > 0) { // skip hub
            group.children[0].rotation.y = pitch * Math.PI/180;
        }
    });
    
    scene.userData.rotor.rotation.z -= (effWind / 60);
});
