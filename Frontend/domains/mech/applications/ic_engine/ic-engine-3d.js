import * as THREE from 'three';

// Utility to initialize 3D Scenes
function init3DScene(canvasId, setupCallback, animateCallback) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    
    const resize = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (canvas.width !== width || canvas.height !== height) {
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    };

    const context = { renderer, scene, camera, clock: new THREE.Clock() };
    setupCallback(context);

    const renderLoop = () => {
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
            resize();
            animateCallback(context);
            renderer.render(scene, camera);
        }
        requestAnimationFrame(renderLoop);
    };
    renderLoop();
    return context;
}

// ---------------------------------------------------------
// CHAPTER 1: Introduction (Engine Kinematics)
// ---------------------------------------------------------
init3DScene('ch1-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 0, 10);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const block = new THREE.Group();
    scene.add(block);

    // Cylinder Block
    const cylGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 32, 1, true);
    const cylMat = new THREE.MeshPhongMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const cylinder = new THREE.Mesh(cylGeo, cylMat);
    block.add(cylinder);

    // Piston
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 32), new THREE.MeshPhongMaterial({ color: 0xcccccc }));
    block.add(piston);

    // Crank & Conrod
    const crank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5), new THREE.MeshPhongMaterial({ color: 0x888888 }));
    block.add(crank);
    const conrod = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), new THREE.MeshPhongMaterial({ color: 0xaaaaaa }));
    block.add(conrod);

    scene.userData = { cylinder, piston, crank, conrod, block };
}, ({ scene }) => {
    const ud = scene.userData;
    
    // View mode
    const viewSel = document.getElementById('ch1-view-3d');
    if(viewSel) {
        if(viewSel.value === 'internals') {
            ud.cylinder.visible = false;
        } else if(viewSel.value === 'cutaway') {
            ud.cylinder.visible = true;
            ud.cylinder.material.opacity = 0.1;
        } else {
            ud.cylinder.visible = true;
            ud.cylinder.material.opacity = 0.8;
        }
    }

    const crankInput = document.getElementById('ch1-crank-3d');
    if(crankInput && ud.piston) {
        const angle = parseFloat(crankInput.value) * (Math.PI / 180);
        const r = 1; 
        const l = 3; 
        
        const px = r * Math.sin(angle);
        const py = - r * Math.cos(angle);
        
        ud.crank.position.set(px/2, py/2 - 4, 0);
        ud.crank.rotation.z = angle;

        const pY = - (r * Math.cos(angle) + Math.sqrt(l*l - r*r*Math.sin(angle)*Math.sin(angle)));
        ud.piston.position.y = pY + 2; // Offset to put it in cylinder

        // Conrod connects crank pin to piston pin
        ud.conrod.position.set(px/2, (py - 4 + pY + 2)/2, 0);
        ud.conrod.rotation.z = Math.asin(px/l);
    }
});

// ---------------------------------------------------------
// CHAPTER 2: Engine Cycles
// ---------------------------------------------------------
init3DScene('ch2-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 3, 8);
    camera.lookAt(0,0,0);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(5,10,5);
    scene.add(dl);

    // Simple cylinder
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(2,2,4,32,1,true), new THREE.MeshPhongMaterial({color:0x333333, wireframe:true}));
    scene.add(cyl);
    
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(1.9,1.9,0.5,32), new THREE.MeshPhongMaterial({color:0x88ccff}));
    scene.add(piston);

    scene.userData = { piston, t: 0 };
}, ({ scene, clock }) => {
    const ud = scene.userData;
    
    const rInput = document.getElementById('ch2-r-3d');
    const r = rInput ? parseFloat(rInput.value) : 10;
    
    // Animation speed depends on r just to show visual change
    ud.t += 0.05 + (r / 200); 
    
    // Piston moves up and down
    // The higher the compression ratio, the higher the piston goes
    const strokeMax = 1.5; 
    const clearance = (4 - strokeMax) / r; // simplified
    ud.piston.position.y = strokeMax * Math.sin(ud.t) - (2 - clearance);

    const eff = document.getElementById('ch2-eff-3d');
    const cycle = document.getElementById('ch2-cycle-3d')?.value;
    const rho = document.getElementById('ch2-rho-3d')?.value;
    if(eff) {
        if(cycle === 'otto') eff.innerText = (100 * (1 - 1/Math.pow(r, 0.4))).toFixed(1);
        else eff.innerText = (100 * (1 - (1/Math.pow(r, 0.4)) * ((Math.pow(rho,1.4)-1)/(1.4*(rho-1))))).toFixed(1);
    }
});

// ---------------------------------------------------------
// CHAPTER 3: Actual Cycles
// ---------------------------------------------------------
init3DScene('ch3-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 0, 5);
    const particleGeo = new THREE.BufferGeometry();
    const count = 500;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) pos[i] = (Math.random()-0.5)*4;
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    
    const pMat = new THREE.PointsMaterial({ color: 0x4ae290, size: 0.1 });
    const points = new THREE.Points(particleGeo, pMat);
    scene.add(points);
    scene.userData = { points, baseColor: new THREE.Color(0x4ae290) };
}, ({ scene, clock }) => {
    const ud = scene.userData;
    const dissoc = document.getElementById('ch3-dissoc-3d')?.checked;
    const pump = document.getElementById('ch3-pump-loss-3d')?.checked;
    
    // Rotate and change color based on checkboxes to show visual feedback
    ud.points.rotation.y = clock.getElapsedTime() * (pump ? 0.2 : 0.8);
    ud.points.rotation.x = clock.getElapsedTime() * 0.5;
    
    ud.points.material.color.setHex(dissoc ? 0xe24a4a : 0x4ae290);
});

// ---------------------------------------------------------
// CHAPTER 4: SI Combustion (HIGH FIDELITY)
// ---------------------------------------------------------
init3DScene('ch4-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 0, 6);
    
    const cylGeo = new THREE.CylinderGeometry(2.5, 2.5, 4, 32, 1, true);
    const cylMat = new THREE.MeshPhongMaterial({ color: 0x333333, transparent: true, opacity: 0.2 });
    scene.add(new THREE.Mesh(cylGeo, cylMat));

    const pGeo = new THREE.BufferGeometry();
    const count = 2000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    for(let i=0; i<count; i++) {
        pos[i*3] = (Math.random()-0.5)*4; pos[i*3+1] = (Math.random()-0.5)*4; pos[i*3+2] = (Math.random()-0.5)*4;
        col[i*3] = 0.3; col[i*3+1] = 0.3; col[i*3+2] = 0.3; 
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    
    const pMat = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    scene.userData = { points, igniting: false, flameRadius: 0 };

    const btn = document.getElementById('ch4-ignite-3d');
    if(btn) btn.onclick = () => { scene.userData.igniting = true; scene.userData.flameRadius = 0.1; };
}, ({ scene }) => {
    const ud = scene.userData;
    const octaneInput = document.getElementById('ch4-octane-3d');
    const sparkInput = document.getElementById('ch4-spark-3d');
    const statusSpan = document.getElementById('ch4-status-3d');
    
    if (octaneInput && sparkInput && statusSpan) {
        const octane = parseFloat(octaneInput.value);
        const spark = parseFloat(sparkInput.value);
        const isKnock = (octane < 90 && spark > 10) || (octane < 85);
        
        if (!ud.igniting && !isKnock) {
            statusSpan.innerText = "Normal";
            statusSpan.style.color = "#10b981";
        }

        if(ud.igniting) {
            ud.flameRadius += 0.1; // Flame propagation
            const p = ud.points.geometry.attributes.position.array;
            const c = ud.points.geometry.attributes.color.array;
            
            for(let i=0; i<p.length/3; i++) {
                const d = Math.sqrt(p[i*3]*p[i*3] + p[i*3+1]*p[i*3+1] + p[i*3+2]*p[i*3+2]);
                if (d < ud.flameRadius) {
                    c[i*3] = 1.0; c[i*3+1] = 0.4 + Math.random()*0.2; c[i*3+2] = 0.0; // Fire color
                    // Expand slightly
                    p[i*3] *= 1.01; p[i*3+1] *= 1.01; p[i*3+2] *= 1.01;
                } else if (isKnock && ud.flameRadius > 2.0 && d > 3.0) {
                    c[i*3] = 1.0; c[i*3+1] = 1.0; c[i*3+2] = 1.0; // Autoignition (white)
                } else {
                    c[i*3] = 0.3; c[i*3+1] = 0.3; c[i*3+2] = 0.3; // Unburned
                }
            }
            ud.points.geometry.attributes.position.needsUpdate = true;
            ud.points.geometry.attributes.color.needsUpdate = true;

            const t = document.getElementById('ch4-temp-3d');
            const pSpan = document.getElementById('ch4-press-3d');
            if(t) t.innerText = Math.min(2500, 300 + ud.flameRadius * 600).toFixed(0);
            if(pSpan) pSpan.innerText = Math.min(60, 1 + Math.pow(ud.flameRadius, 2) * 2).toFixed(1);

            if(ud.flameRadius > 4.0) {
                ud.igniting = false;
                if(isKnock) { statusSpan.innerText = "KNOCK DETECTED"; statusSpan.style.color = "red"; }
            }
        }
    }
});

// ---------------------------------------------------------
// CHAPTER 5: CI Combustion (Fuel Spray)
// ---------------------------------------------------------
init3DScene('ch5-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 0, 10);
    const pGeo = new THREE.BufferGeometry();
    const count = 500;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for(let i=0; i<count; i++) pos[i*3+1] = 4;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('velocity', new THREE.BufferAttribute(vel, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x88ccff, size: 0.1 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);
    scene.userData = { points, injecting: false, time: 0 };
    
    const btn = document.getElementById('ch5-inject-3d');
    if(btn) {
        btn.onclick = () => {
            scene.userData.injecting = true;
            scene.userData.time = 0;
            const press = document.getElementById('ch5-pressure-3d')?.value || 1000;
            const p = points.geometry.attributes.position.array;
            const v = points.geometry.attributes.velocity.array;
            for(let i=0; i<count; i++) {
                p[i*3] = 0; p[i*3+1] = 4; p[i*3+2] = 0;
                v[i*3] = (Math.random() - 0.5) * (1000/press); 
                v[i*3+1] = - (Math.random() * 0.5 + 0.5) * (press / 200); 
                v[i*3+2] = (Math.random() - 0.5) * (1000/press);
            }
        };
    }
}, ({ scene }) => {
    const ud = scene.userData;
    if(ud.injecting) {
        ud.time += 0.016;
        const p = ud.points.geometry.attributes.position.array;
        const v = ud.points.geometry.attributes.velocity.array;
        let maxPen = 0;
        for(let i=0; i<p.length/3; i++) {
            p[i*3] += v[i*3] * 0.1; p[i*3+1] += v[i*3+1] * 0.1; p[i*3+2] += v[i*3+2] * 0.1;
            v[i*3] *= 0.95; v[i*3+1] *= 0.98; v[i*3+2] *= 0.95;
            const pen = 4 - p[i*3+1];
            if(pen > maxPen) maxPen = pen;
        }
        ud.points.geometry.attributes.position.needsUpdate = true;
        const smd = document.getElementById('ch5-smd-3d');
        const penD = document.getElementById('ch5-pen-3d');
        const press = document.getElementById('ch5-pressure-3d');
        if(smd && press) smd.innerText = (50000 / parseFloat(press.value)).toFixed(1);
        if(penD) penD.innerText = (maxPen * 10).toFixed(1);
        if(ud.time > 2) ud.injecting = false;
    }
});

// ---------------------------------------------------------
// CHAPTER 6: Fuels (Molecules)
// ---------------------------------------------------------
init3DScene('ch6-canvas-3d', ({ scene, camera }) => {
    camera.position.z = 8;
    const group = new THREE.Group();
    scene.add(group);
    
    const cMat = new THREE.MeshPhongMaterial({ color: 0x333333 }); 
    const hMat = new THREE.MeshPhongMaterial({ color: 0xffffff }); 
    const sphereGeo = new THREE.SphereGeometry(0.5, 16, 16);
    
    const buildMolecule = (type) => {
        while(group.children.length > 0) group.remove(group.children[0]);
        if (type === 'hydrogen') {
            // H2
            const h1 = new THREE.Mesh(sphereGeo, hMat); h1.position.set(-0.4, 0, 0); group.add(h1);
            const h2 = new THREE.Mesh(sphereGeo, hMat); h2.position.set(0.4, 0, 0); group.add(h2);
            return;
        }
        
        let carbons = 8;
        if (type === 'dodecane') carbons = 12;
        if (type === 'ethanol') carbons = 2; // simplified

        for(let i=0; i<carbons; i++) {
            const c = new THREE.Mesh(sphereGeo, cMat);
            c.position.set((i - carbons/2)*1.2, 0, Math.sin(i)*0.5);
            group.add(c);
            const h1 = new THREE.Mesh(sphereGeo, hMat); h1.scale.set(0.6,0.6,0.6);
            h1.position.set(c.position.x, 0.8, c.position.z);
            group.add(h1);
            const h2 = new THREE.Mesh(sphereGeo, hMat); h2.scale.set(0.6,0.6,0.6);
            h2.position.set(c.position.x, -0.8, c.position.z);
            group.add(h2);
        }
    };
    buildMolecule('octane');
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(5,5,5); scene.add(dl);
    scene.userData = { group, buildMolecule };
    
    const select = document.getElementById('ch6-fuel-3d');
    if(select) {
        select.onchange = (e) => {
            const val = e.target.value;
            buildMolecule(val);
            const en = document.getElementById('ch6-energy-3d');
            const oc = document.getElementById('ch6-octane-3d');
            if(en && oc) {
                if(val==='octane') { en.innerText='44.4'; oc.innerText='100'; }
                if(val==='dodecane') { en.innerText='43.0'; oc.innerText='~15'; }
                if(val==='ethanol') { en.innerText='26.8'; oc.innerText='108'; }
                if(val==='hydrogen') { en.innerText='120.0'; oc.innerText='>130'; }
            }
        };
    }
}, ({ scene, clock }) => {
    if(scene.userData.group) scene.userData.group.rotation.y = clock.getElapsedTime() * 0.5;
});

// ---------------------------------------------------------
// CHAPTER 7: Injection Systems
// ---------------------------------------------------------
init3DScene('ch7-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 0, 10);
    
    // Simple Common Rail Tube
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6), new THREE.MeshPhongMaterial({color:0x333333}));
    rail.rotation.z = Math.PI/2;
    rail.position.y = 3;
    scene.add(rail);
    
    // Injector
    const injector = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 2), new THREE.MeshPhongMaterial({color:0xaaaaaa}));
    injector.position.y = 1.8;
    scene.add(injector);

    const pGeo = new THREE.BufferGeometry();
    const count = 300;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for(let i=0; i<count; i++) pos[i*3+1] = 0.8;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('velocity', new THREE.BufferAttribute(vel, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x88ccff, size: 0.1 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);
    scene.userData = { points, injecting: false, time: 0 };
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);

    const btn = document.getElementById('ch7-pulse-3d');
    if(btn) {
        btn.onclick = () => {
            scene.userData.injecting = true;
            scene.userData.time = 0;
            const press = document.getElementById('ch7-pressure-3d')?.value || 1500;
            const p = points.geometry.attributes.position.array;
            const v = points.geometry.attributes.velocity.array;
            for(let i=0; i<count; i++) {
                p[i*3] = 0; p[i*3+1] = 0.8; p[i*3+2] = 0;
                v[i*3] = (Math.random() - 0.5) * (press/500); 
                v[i*3+1] = - (Math.random() * 0.5 + 0.5) * (press/200); 
                v[i*3+2] = (Math.random() - 0.5) * (press/500);
            }
        };
    }
}, ({ scene }) => {
    const ud = scene.userData;
    if(ud.injecting) {
        ud.time += 0.016;
        const p = ud.points.geometry.attributes.position.array;
        const v = ud.points.geometry.attributes.velocity.array;
        for(let i=0; i<p.length/3; i++) {
            p[i*3] += v[i*3] * 0.1; p[i*3+1] += v[i*3+1] * 0.1; p[i*3+2] += v[i*3+2] * 0.1;
            v[i*3] *= 0.95; v[i*3+1] *= 0.98; v[i*3+2] *= 0.95;
        }
        ud.points.geometry.attributes.position.needsUpdate = true;
        if(ud.time > 2) ud.injecting = false;
    }
});

// ---------------------------------------------------------
// CHAPTER 8: Cooling & Lubrication
// ---------------------------------------------------------
init3DScene('ch8-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 3, 8);
    camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    // Engine block
    const blockMat = new THREE.MeshPhongMaterial({color: 0x4a90e2});
    const block = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), blockMat);
    block.position.x = -2;
    scene.add(block);
    
    // Radiator
    const rad = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 2), new THREE.MeshPhongMaterial({color: 0x888888}));
    rad.position.x = 2;
    scene.add(rad);
    
    // Fan
    const fan = new THREE.Group();
    fan.position.set(1.4, 0, 0);
    for(let i=0; i<4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.2), new THREE.MeshPhongMaterial({color: 0xffffff}));
        blade.rotation.x = (i/4) * Math.PI;
        fan.add(blade);
    }
    scene.add(fan);
    
    scene.userData = { blockMat, fan, temp: 80 };
}, ({ scene, clock }) => {
    const ud = scene.userData;
    const load = parseFloat(document.getElementById('ch8-load-3d')?.value || 50);
    const pump = document.getElementById('ch8-pump-3d')?.checked || false;
    const fanOn = document.getElementById('ch8-fan-3d')?.checked || false;
    
    ud.temp += (load * 0.01) - (pump ? 0.4 : 0) - (fanOn ? 0.3 : 0);
    if(ud.temp < 20) ud.temp = 20;
    if(ud.temp > 150) ud.temp = 150;
    
    // Color block based on temp
    if(ud.temp > 110) ud.blockMat.color.setHex(0xe24a4a);
    else if(ud.temp < 70) ud.blockMat.color.setHex(0x4a90e2);
    else ud.blockMat.color.setHex(0x4ae290);
    
    if(fanOn) ud.fan.rotation.x = clock.getElapsedTime() * 10;
});

// ---------------------------------------------------------
// CHAPTER 9: Supercharging
// ---------------------------------------------------------
init3DScene('ch9-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 0, 6);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    const spool = new THREE.Group();
    scene.add(spool);
    
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), new THREE.MeshPhongMaterial({color:0x555555}));
    shaft.rotation.z = Math.PI/2;
    spool.add(shaft);
    
    const turbine = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.5, 12), new THREE.MeshPhongMaterial({color:0xe24a4a}));
    turbine.position.x = -2;
    turbine.rotation.z = Math.PI/2;
    spool.add(turbine);
    
    const comp = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 12), new THREE.MeshPhongMaterial({color:0x4a90e2}));
    comp.position.x = 2;
    comp.rotation.z = Math.PI/2;
    spool.add(comp);
    
    scene.userData = { spool, rot: 0 };
}, ({ scene, clock }) => {
    const ud = scene.userData;
    const throttle = parseFloat(document.getElementById('ch9-throttle-3d')?.value || 30);
    
    const rpm = throttle * 1000; // Simulated RPM
    ud.rot += (rpm / 60000) * 10;
    ud.spool.rotation.x = ud.rot;
    
    const boostSpan = document.getElementById('ch9-boost-3d');
    const rpmSpan = document.getElementById('ch9-rpm-3d');
    if(boostSpan) boostSpan.innerText = ((throttle > 40) ? (throttle - 40) * 0.2 : 0).toFixed(1);
    if(rpmSpan) rpmSpan.innerText = rpm.toFixed(0);
});

// ---------------------------------------------------------
// CHAPTER 10: Emissions
// ---------------------------------------------------------
init3DScene('ch10-canvas-3d', ({ scene, camera }) => {
    camera.position.set(0, 2, 8);
    camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5,5,5); scene.add(dl);
    
    // Tailpipe
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2), new THREE.MeshPhongMaterial({color:0x333333}));
    pipe.rotation.z = Math.PI/2;
    pipe.position.x = -2;
    scene.add(pipe);
    
    const pGeo = new THREE.BufferGeometry();
    const count = 200;
    const pos = new Float32Array(count * 3);
    const life = new Float32Array(count);
    for(let i=0; i<count; i++) {
        pos[i*3] = -1; pos[i*3+1] = 0; pos[i*3+2] = 0;
        life[i] = Math.random();
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('life', new THREE.BufferAttribute(life, 1));
    const pMat = new THREE.PointsMaterial({ color: 0xcccccc, size: 0.5, transparent: true, opacity: 0.8 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);
    
    scene.userData = { points };
}, ({ scene }) => {
    const ud = scene.userData;
    const afr = parseFloat(document.getElementById('ch10-afr-3d')?.value || 1.0);
    const egr = parseFloat(document.getElementById('ch10-egr-3d')?.value || 0);
    
    const noxSpan = document.getElementById('ch10-nox-3d');
    const coSpan = document.getElementById('ch10-co-3d');
    
    let isNox = afr > 1.05 && egr < 20;
    let isCO = afr < 0.95;
    
    if(noxSpan) {
        noxSpan.innerText = isNox ? "HIGH" : "Low";
        noxSpan.style.color = isNox ? "red" : "#10b981";
    }
    if(coSpan) {
        coSpan.innerText = isCO ? "HIGH" : "Low";
        coSpan.style.color = isCO ? "red" : "#10b981";
    }
    
    if(isNox) ud.points.material.color.setHex(0xe24a4a); // Red
    else if(isCO) ud.points.material.color.setHex(0x333333); // Dark
    else ud.points.material.color.setHex(0xaaaaaa); // Clean grey

    const p = ud.points.geometry.attributes.position.array;
    const l = ud.points.geometry.attributes.life.array;
    for(let i=0; i<p.length/3; i++) {
        p[i*3] += 0.1;
        p[i*3+1] += (Math.random()-0.5)*0.1;
        p[i*3+2] += (Math.random()-0.5)*0.1;
        l[i] -= 0.02;
        if(l[i] <= 0 || p[i*3] > 4) {
            p[i*3] = -1; p[i*3+1] = 0; p[i*3+2] = 0;
            l[i] = 1.0;
        }
    }
    ud.points.geometry.attributes.position.needsUpdate = true;
});
