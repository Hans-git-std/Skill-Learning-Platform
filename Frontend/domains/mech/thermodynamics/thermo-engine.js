import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- SHARED UTILITIES ---
function createEngineScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Mount renderer canvas
    renderer.domElement.classList.add('webgl-canvas');
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';
    
    container.insertBefore(renderer.domElement, container.firstChild);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false; // Prevent unwanted scrolling on mobile

    // Handle Resize
    window.addEventListener('resize', () => {
        if(container.clientWidth > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    return { scene, camera, renderer, controls, container };
}

// --- PART 1: CHAPTERS 1, 2, 3 ---

function initCh1PVT() {
    const sys = createEngineScene('sim-ch1-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls } = sys;
    camera.position.set(20, 15, 20);
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
    scene.add(new THREE.AxesHelper(10));

    const gridSize = 40;
    const geometry = new THREE.BufferGeometry();
    const vertices = [], colors = [], indices = [];
    const minV = 1, maxV = 10, minT = 1, maxT = 10;

    for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
            const v = minV + (i / gridSize) * (maxV - minV);
            const t = minT + (j / gridSize) * (maxT - minT);
            const p = (t / v) * 5; 
            vertices.push(v, p, t);
            const color = new THREE.Color();
            color.setHSL(0.7 - (p / 10), 1.0, 0.5); 
            colors.push(color.r, color.g, color.b);
        }
    }
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const a = i * (gridSize + 1) + j;
            const b = i * (gridSize + 1) + j + 1;
            const c = (i + 1) * (gridSize + 1) + j;
            const d = (i + 1) * (gridSize + 1) + j + 1;
            indices.push(a, b, d);
            indices.push(a, d, c);
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Mesh(geometry, material));
    
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.1 });
    scene.add(new THREE.Mesh(geometry, wireMat));

    const clipPlanes = [
        new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), 
        new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), 
        new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)  
    ];
    renderer.localClippingEnabled = true;

    document.getElementById('ch1-slice')?.addEventListener('change', (e) => {
        const mode = e.target.value;
        material.clippingPlanes = [];
        if(mode === 'pv') { clipPlanes[2].constant = -5; material.clippingPlanes = [clipPlanes[2]]; }
        else if(mode === 'tv') { clipPlanes[0].constant = -2.5; material.clippingPlanes = [clipPlanes[0]]; }
        else if(mode === 'pt') { clipPlanes[1].constant = -5; material.clippingPlanes = [clipPlanes[1]]; }
    });

    const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
}

function initCh2Piston() {
    const sys = createEngineScene('sim-ch2-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls, container } = sys;
    camera.position.set(0, 5, 12);
    controls.target.set(0, 2, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pl = new THREE.PointLight(0xffaa00, 2, 50);
    pl.position.set(0, 2, 0);
    scene.add(pl);

    const cylMat = new THREE.MeshPhysicalMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6, 32, 1, true), cylMat);
    cylinder.position.y = 3;
    scene.add(cylinder);

    const particleCount = 1500;
    const pPos = new Float32Array(particleCount * 3);
    const pVel = [];
    for(let i=0; i<particleCount; i++) {
        pPos[i*3] = (Math.random() - 0.5) * 3.8;
        pPos[i*3+1] = Math.random() * 2.8;
        pPos[i*3+2] = (Math.random() - 0.5) * 3.8;
        pVel.push(new THREE.Vector3((Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1));
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({color: 0x0ea5e9, size: 0.1, transparent: true, opacity: 0.8});
    const gasParticles = new THREE.Points(pGeo, pMat);
    scene.add(gasParticles);

    const pistonMat = new THREE.MeshStandardMaterial({color: 0x444444, metalness: 0.9});
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.98, 0.4, 32), pistonMat);
    piston.position.y = 3;
    scene.add(piston);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 16), pistonMat);
    rod.position.y = 2.5;
    piston.add(rod);
    
    // P-V Diagram DOM Overlay for responsiveness
    const pvOverlay = document.createElement('div');
    pvOverlay.style.position = 'absolute';
    pvOverlay.style.bottom = '10px';
    pvOverlay.style.right = '10px';
    pvOverlay.style.zIndex = '20';
    pvOverlay.style.background = 'rgba(0,0,0,0.7)';
    pvOverlay.style.border = '2px solid #e11d48';
    pvOverlay.style.borderRadius = '8px';
    pvOverlay.style.padding = '10px';
    
    const canvas2d = document.createElement('canvas');
    canvas2d.width = window.innerWidth > 600 ? 250 : 150;
    canvas2d.height = window.innerWidth > 600 ? 250 : 150;
    pvOverlay.appendChild(canvas2d);
    container.appendChild(pvOverlay);
    
    const ctx = canvas2d.getContext('2d');
    let time = 0, mode = 'isothermal';
    
    document.getElementById('ch2-process')?.addEventListener('change', (e) => { mode = e.target.value; time = 0; });

    const animate = () => {
        requestAnimationFrame(animate);
        time += 0.02;
        let pistonHeight = 3, pVolume = 1, pPressure = 1;
        
        if(mode === 'isothermal') {
            pistonHeight = 3 + Math.sin(time) * 1.5; pVolume = pistonHeight; pPressure = 4.5 / pVolume; pMat.color.setHex(0x0ea5e9);
        } else if (mode === 'isobaric') {
            pistonHeight = 3 + Math.sin(time) * 1.5; pVolume = pistonHeight; pPressure = 2.0;
            pMat.color.setHSL(0.6 - ((pVolume - 1.5)/3 * 0.6), 1, 0.5); 
        } else if (mode === 'adiabatic') {
            pistonHeight = 3 + Math.sin(time) * 1.5; pVolume = pistonHeight; pPressure = Math.pow(4.5 / pVolume, 1.4);
            pMat.color.setHSL(0.7 - ((pPressure*pVolume)/6)*0.7, 1, 0.5);
        }
        
        piston.position.y = pistonHeight;
        
        const pos = gasParticles.geometry.attributes.position.array;
        for(let i=0; i<particleCount; i++) {
            pos[i*3] += pVel[i].x; pos[i*3+1] += pVel[i].y; pos[i*3+2] += pVel[i].z;
            if(Math.sqrt(pos[i*3]**2 + pos[i*3+2]**2) > 1.9) { pVel[i].x *= -1; pVel[i].z *= -1; }
            if(pos[i*3+1] < 0) { pos[i*3+1] = 0; pVel[i].y *= -1; }
            if(pos[i*3+1] > pistonHeight - 0.2) { pos[i*3+1] = pistonHeight - 0.2; pVel[i].y *= -1; }
        }
        gasParticles.geometry.attributes.position.needsUpdate = true;
        
        // Render 2D Chart
        const cw = canvas2d.width;
        const ch = canvas2d.height;
        ctx.clearRect(0,0,cw,ch);
        ctx.strokeStyle = '#555';
        ctx.beginPath(); ctx.moveTo(cw*0.1,ch*0.9); ctx.lineTo(cw*0.9,ch*0.9); ctx.stroke(); // V axis
        ctx.beginPath(); ctx.moveTo(cw*0.1,ch*0.9); ctx.lineTo(cw*0.1,ch*0.1); ctx.stroke(); // P axis
        
        const plotX = cw*0.1 + (pVolume / 5) * (cw*0.8);
        const plotY = ch*0.9 - (pPressure / 5) * (ch*0.8);
        
        ctx.fillStyle = '#e11d48';
        ctx.beginPath(); ctx.arc(plotX, plotY, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(225, 29, 72, 0.2)';
        ctx.fillRect(cw*0.1, plotY, plotX - (cw*0.1), ch*0.9 - plotY); 

        controls.update(); renderer.render(scene, camera);
    };
    animate();
}

function initCh3Joule() {
    const sys = createEngineScene('sim-ch3-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls } = sys;
    camera.position.set(0, 8, 15);
    controls.target.set(0, 3, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0xffffff, 1);
    dLight.position.set(5, 10, 5);
    scene.add(dLight);

    const tankMat = new THREE.MeshPhysicalMaterial({color: 0xaaaaaa, transparent: true, opacity: 0.4, side: THREE.DoubleSide, metalness: 0.1});
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4, 32, 1, true), tankMat);
    tank.position.y = 2;
    scene.add(tank);
    
    const waterMat = new THREE.MeshPhongMaterial({color: 0x0284c7, transparent: true, opacity: 0.8});
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 3.5, 32), waterMat);
    water.position.y = 1.75;
    scene.add(water);

    const paddleGroup = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 16), new THREE.MeshStandardMaterial({color: 0x333333}));
    shaft.position.y = 2.5; paddleGroup.add(shaft);
    for(let i=0; i<4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 0.1), new THREE.MeshStandardMaterial({color: 0xd97706}));
        blade.position.y = 1.5; blade.rotation.y = (Math.PI / 2) * i;
        blade.position.x = Math.cos((Math.PI/2)*i) * 1.25; blade.position.z = Math.sin((Math.PI/2)*i) * 1.25;
        paddleGroup.add(blade);
    }
    scene.add(paddleGroup);

    const pulley = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 32), new THREE.MeshStandardMaterial({color: 0x222222}));
    pulley.rotation.z = Math.PI/2; pulley.position.set(0, 5.5, 0); scene.add(pulley);
    const weightBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({color: 0x444444}));
    weightBox.position.set(1, 5, 0); scene.add(weightBox);
    
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 5.5, 0), new THREE.Vector3(1, 5.5, 0), new THREE.Vector3(1, 5, 0)]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({color: 0xffffff}));
    scene.add(line);
    
    let isDropping = false, dropHeight = 5, currentHeight = 5, temperature = 20;

    document.getElementById('ch3-height')?.addEventListener('input', (e) => {
        if(!isDropping) {
            dropHeight = parseFloat(e.target.value); currentHeight = dropHeight; weightBox.position.y = currentHeight;
            lineGeo.setFromPoints([new THREE.Vector3(0, 5.5, 0), new THREE.Vector3(1, 5.5, 0), new THREE.Vector3(1, currentHeight, 0)]);
        }
    });
    document.getElementById('ch3-drop')?.addEventListener('click', () => { if(!isDropping) isDropping = true; });
    
    const tempHUD = document.createElement('div');
    tempHUD.style.position = 'absolute'; tempHUD.style.bottom = '20px'; tempHUD.style.right = '20px';
    tempHUD.style.padding = '5px 10px'; tempHUD.style.background = 'rgba(225, 29, 72, 0.8)';
    tempHUD.style.color = '#fff'; tempHUD.style.borderRadius = '5px'; tempHUD.style.fontFamily = 'monospace';
    tempHUD.style.zIndex = '20'; tempHUD.innerHTML = `Temp: 20.00 °C`;
    sys.container.appendChild(tempHUD);

    const animate = () => {
        requestAnimationFrame(animate);
        if(isDropping) {
            currentHeight -= 0.05; paddleGroup.rotation.y += 0.2; pulley.rotation.x += 0.2;
            temperature += 0.05; tempHUD.innerHTML = `Temp: ${temperature.toFixed(2)} °C`;
            waterMat.color.setHSL(0.6 - (temperature-20)*0.01, 1, 0.5);
            weightBox.position.y = currentHeight;
            lineGeo.setFromPoints([new THREE.Vector3(0, 5.5, 0), new THREE.Vector3(1, 5.5, 0), new THREE.Vector3(1, currentHeight, 0)]);
            if(currentHeight <= 0) {
                isDropping = false;
                setTimeout(() => {
                    currentHeight = dropHeight; weightBox.position.y = currentHeight;
                    lineGeo.setFromPoints([new THREE.Vector3(0, 5.5, 0), new THREE.Vector3(1, 5.5, 0), new THREE.Vector3(1, currentHeight, 0)]);
                }, 2000);
            }
        }
        controls.update(); renderer.render(scene, camera);
    };
    animate();
}

// --- PART 2: CHAPTERS 4, 5, 6 ---

function initCh4SteadyFlow() {
    const sys = createEngineScene('sim-ch4-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls } = sys;
    camera.position.set(0, 3, 10);
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(0, 10, 5);
    scene.add(dl);

    // Group to hold the current device
    const deviceGroup = new THREE.Group();
    scene.add(deviceGroup);

    // Particle flow
    const flowParticles = new THREE.Group();
    scene.add(flowParticles);
    
    let mode = 'turbine'; // default
    let parts = [];

    const buildDevice = () => {
        deviceGroup.clear();
        flowParticles.clear();
        parts = [];
        
        let geo;
        const mat = new THREE.MeshPhysicalMaterial({color: 0x555555, metalness: 0.8, transparent:true, opacity: 0.5, side: THREE.DoubleSide});
        
        if (mode === 'turbine') {
            geo = new THREE.CylinderGeometry(1, 3, 6, 32, 1, true); // expands
            geo.rotateZ(Math.PI/2);
            // internal blades
            const blades = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 4), new THREE.MeshStandardMaterial({color:0xd97706}));
            deviceGroup.add(blades);
        } else if (mode === 'compressor') {
            geo = new THREE.CylinderGeometry(3, 1, 6, 32, 1, true); // converges
            geo.rotateZ(Math.PI/2);
            const blades = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 4), new THREE.MeshStandardMaterial({color:0x0ea5e9}));
            deviceGroup.add(blades);
        } else {
            // nozzle
            geo = new THREE.CylinderGeometry(2, 0.5, 6, 32, 1, true); // highly converges
            geo.rotateZ(Math.PI/2);
        }
        
        const shell = new THREE.Mesh(geo, mat);
        deviceGroup.add(shell);
        
        // Create particles
        const pGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({color: 0xffffff});
        for(let i=0; i<100; i++) {
            const mesh = new THREE.Mesh(pGeo, pMat);
            resetParticle(mesh);
            flowParticles.add(mesh);
            parts.push(mesh);
        }
    };

    const resetParticle = (mesh) => {
        mesh.position.x = -4 - Math.random() * 2;
        mesh.position.y = (Math.random() - 0.5) * 1.5;
        mesh.position.z = (Math.random() - 0.5) * 1.5;
    };

    document.getElementById('ch4-device')?.addEventListener('change', (e) => {
        mode = e.target.value;
        buildDevice();
    });

    buildDevice();

    const animate = () => {
        requestAnimationFrame(animate);
        
        if(deviceGroup.children.length > 1) { // has blades
            deviceGroup.children[1].rotation.x += (mode==='turbine' ? 0.2 : 0.4);
        }

        parts.forEach(p => {
            let speed = 0.1;
            if(mode === 'nozzle') speed = 0.1 + ((p.position.x + 3) / 6) * 0.3; // speeds up
            if(mode === 'compressor') speed = 0.2 - ((p.position.x + 3) / 6) * 0.1;
            
            p.position.x += speed;
            if(p.position.x > 4) resetParticle(p);
            
            // color based on enthalpy (redder if compressor, bluer if turbine)
            if(mode === 'turbine') p.material.color.setHSL(0.7 - ((p.position.x+3)/6)*0.2, 1, 0.5);
            else if(mode === 'compressor') p.material.color.setHSL(0.5 - ((p.position.x+3)/6)*0.5, 1, 0.5);
            else p.material.color.setHSL(0.1, 1, 0.5); // nozzle
        });

        controls.update(); renderer.render(scene, camera);
    };
    animate();
}

function initCh5Sankey() {
    const sys = createEngineScene('sim-ch5-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls } = sys;
    camera.position.set(0, 0, 15);
    controls.target.set(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(5, 5, 5); scene.add(dl);

    // Nodes
    const boxGeo = new THREE.BoxGeometry(4, 2, 2);
    const hotNode = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({color: 0xe11d48}));
    hotNode.position.set(-6, 4, 0); scene.add(hotNode);
    
    const engNode = new THREE.Mesh(new THREE.CylinderGeometry(2,2,1,32), new THREE.MeshStandardMaterial({color: 0x888888}));
    engNode.rotation.x = Math.PI/2; engNode.position.set(0, 0, 0); scene.add(engNode);

    const coldNode = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({color: 0x0ea5e9}));
    coldNode.position.set(-6, -4, 0); scene.add(coldNode);
    
    // Tubes (Flow Lines)
    const qInTube = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 5, 16), new THREE.MeshStandardMaterial({color: 0xe11d48, transparent:true, opacity:0.7}));
    qInTube.position.set(-3, 2, 0); qInTube.rotation.z = -Math.PI/4; scene.add(qInTube);

    const qOutTube = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 5, 16), new THREE.MeshStandardMaterial({color: 0x0ea5e9, transparent:true, opacity:0.7}));
    qOutTube.position.set(-3, -2, 0); qOutTube.rotation.z = Math.PI/4; scene.add(qOutTube);

    const wOutTube = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 6, 16), new THREE.MeshStandardMaterial({color: 0xd97706, transparent:true, opacity:0.7}));
    wOutTube.position.set(4, 0, 0); wOutTube.rotation.z = Math.PI/2; scene.add(wOutTube);

    // Text labels overlay
    const effHud = document.createElement('div');
    effHud.style.position = 'absolute'; effHud.style.top = '20px'; effHud.style.right = '20px';
    effHud.style.color = '#fff'; effHud.style.fontFamily = 'monospace'; effHud.style.fontSize = '1.2rem';
    sys.container.appendChild(effHud);

    const thSlider = document.getElementById('ch5-th');
    const tlSlider = document.getElementById('ch5-tl');

    const updateSankey = () => {
        let th = parseFloat(thSlider?.value || 1000);
        let tl = parseFloat(tlSlider?.value || 300);
        if(tl >= th) { tl = th - 10; if(tlSlider) tlSlider.value = tl; }

        const efficiency = 1 - (tl / th);
        effHud.innerHTML = `Carnot Efficiency: ${(efficiency*100).toFixed(1)}%`;

        // Scale tubes based on energy ratio
        // Total Q_in is proportional to T_H / 200 (arbitrary scale)
        const qH = th / 200;
        const wOut = qH * efficiency;
        const qL = qH - wOut;

        qInTube.scale.set(qH, 1, qH);
        wOutTube.scale.set(wOut, 1, wOut);
        qOutTube.scale.set(qL, 1, qL);
    };

    thSlider?.addEventListener('input', updateSankey);
    tlSlider?.addEventListener('input', updateSankey);
    updateSankey();

    let time = 0;
    const animate = () => {
        requestAnimationFrame(animate);
        time += 0.05;
        // Pulse tubes to simulate flow
        qInTube.material.opacity = 0.5 + Math.sin(time)*0.2;
        wOutTube.material.opacity = 0.5 + Math.sin(time + Math.PI/2)*0.2;
        qOutTube.material.opacity = 0.5 + Math.sin(time + Math.PI)*0.2;
        engNode.rotation.z -= 0.02; // spinning engine
        controls.update(); renderer.render(scene, camera);
    };
    animate();
}

function initCh6Entropy() {
    const sys = createEngineScene('sim-ch6-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls } = sys;
    camera.position.set(0, 0, 15);
    controls.target.set(0, 0, 0);

    const boxGeo = new THREE.BoxGeometry(10, 6, 4);
    const boxMat = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true, transparent:true, opacity: 0.2});
    const box = new THREE.Mesh(boxGeo, boxMat);
    scene.add(box);

    const partMat = new THREE.MeshBasicMaterial({color: 0x888888, transparent:true, opacity:0.5});
    const partition = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, 4), partMat);
    scene.add(partition);

    // Particles
    const pGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const hotMat = new THREE.MeshBasicMaterial({color: 0xe11d48});
    const coldMat = new THREE.MeshBasicMaterial({color: 0x0ea5e9});
    
    const particles = [];
    const count = 200;
    
    for(let i=0; i<count; i++) {
        const isHot = i < count/2;
        const mesh = new THREE.Mesh(pGeo, isHot ? hotMat : coldMat);
        mesh.position.x = isHot ? -4 + Math.random()*3 : 1 + Math.random()*3;
        mesh.position.y = (Math.random() - 0.5) * 5;
        mesh.position.z = (Math.random() - 0.5) * 3;
        
        const speed = isHot ? 0.2 : 0.05;
        const vel = new THREE.Vector3((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)).normalize().multiplyScalar(speed);
        
        scene.add(mesh);
        particles.push({mesh, vel, isHot});
    }

    let partitioned = true;
    document.getElementById('ch6-start')?.addEventListener('click', (e) => {
        partitioned = !partitioned;
        partition.visible = partitioned;
        e.target.innerText = partitioned ? "Remove Partition" : "Insert Partition (Impossible)";
    });

    const animate = () => {
        requestAnimationFrame(animate);
        
        particles.forEach(p => {
            p.mesh.position.add(p.vel);
            
            // Bounds
            if(Math.abs(p.mesh.position.y) > 3) p.vel.y *= -1;
            if(Math.abs(p.mesh.position.z) > 2) p.vel.z *= -1;
            
            if(partitioned) {
                if(p.isHot && p.mesh.position.x > -0.2) p.vel.x *= -1;
                else if(!p.isHot && p.mesh.position.x < 0.2) p.vel.x *= -1;
                else if(Math.abs(p.mesh.position.x) > 5) p.vel.x *= -1;
            } else {
                if(Math.abs(p.mesh.position.x) > 5) p.vel.x *= -1;
            }
        });
        
        controls.update(); renderer.render(scene, camera);
    };
    animate();
}

// --- PART 3: CHAPTERS 8, 9, 10 ---

function initCh8Phase() {
    const sys = createEngineScene('sim-ch8-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls } = sys;
    camera.position.set(0, 5, 12);
    controls.target.set(0, 2, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(5, 10, 5));

    // Vapor Dome Surface (Parabola)
    const points = [];
    for(let i=0; i<=20; i++) {
        const x = -5 + (i/20)*10;
        const y = -0.2 * (x*x) + 5; // parabola
        points.push(new THREE.Vector3(x, Math.max(0, y), 0));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({color: 0x0ea5e9, linewidth: 2});
    scene.add(new THREE.Line(lineGeo, lineMat));

    // State point
    const stateGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const stateMat = new THREE.MeshPhongMaterial({color: 0xe11d48});
    const statePoint = new THREE.Mesh(stateGeo, stateMat);
    scene.add(statePoint);

    // Beaker Visualization
    const beakerGroup = new THREE.Group();
    beakerGroup.position.set(0, -3, 3);
    scene.add(beakerGroup);
    
    const beakerOut = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 3.1, 16, 1, true), new THREE.MeshBasicMaterial({color:0xffffff, wireframe:true, transparent:true, opacity:0.3}));
    beakerOut.position.y = 1.5; beakerGroup.add(beakerOut);
    
    const liquidMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16), new THREE.MeshStandardMaterial({color: 0x0284c7, transparent:true, opacity:0.8}));
    liquidMesh.position.y = 0.5; beakerGroup.add(liquidMesh);
    
    const vaporMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 16), new THREE.MeshStandardMaterial({color: 0x94a3b8, transparent:true, opacity:0.4}));
    vaporMesh.position.y = 2; beakerGroup.add(vaporMesh);

    document.getElementById('ch8-quality')?.addEventListener('input', (e) => {
        const x = parseFloat(e.target.value);
        // Position on dome line (approx horizontal isobaric boiling line)
        // x goes from 0 (saturated liquid, left) to 1 (saturated vapor, right)
        const root = Math.sqrt((5 - 2)/0.2); // y=2 for boiling line
        const leftX = -root; const rightX = root;
        statePoint.position.x = leftX + x * (rightX - leftX);
        statePoint.position.y = 2;

        // Update beaker
        liquidMesh.scale.y = 1 - x;
        liquidMesh.position.y = (1-x)/2;
        vaporMesh.scale.y = x;
        vaporMesh.position.y = (1-x) + (x)/2;
    });

    const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
}

function initCh9Rankine() {
    const sys = createEngineScene('sim-ch9-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls } = sys;
    camera.position.set(0, 0, 15);
    controls.target.set(0, 0, 0);

    const createBlock = (color, pos, text) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(3,2,2), new THREE.MeshStandardMaterial({color}));
        mesh.position.copy(pos);
        scene.add(mesh);
        return mesh;
    };

    const boiler = createBlock(0xe11d48, new THREE.Vector3(-4, 3, 0), "Boiler");
    const turbine = createBlock(0xd97706, new THREE.Vector3(4, 3, 0), "Turbine");
    const condenser = createBlock(0x0ea5e9, new THREE.Vector3(4, -3, 0), "Condenser");
    const pump = createBlock(0x888888, new THREE.Vector3(-4, -3, 0), "Pump");

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(0, 10, 10));

    // Particles moving between them
    const particles = new THREE.Group();
    scene.add(particles);
    const pGeo = new THREE.SphereGeometry(0.2, 8, 8);
    for(let i=0; i<40; i++) {
        particles.add(new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({color: 0xffffff})));
    }

    let pressure = 5; // MPa
    document.getElementById('ch9-pressure')?.addEventListener('input', (e) => {
        pressure = parseFloat(e.target.value);
        boiler.material.color.setHSL(0, 1, 0.2 + (pressure/30)); // brighter red
    });

    let time = 0;
    const path = [
        new THREE.Vector3(-4,-3,0), // pump
        new THREE.Vector3(-4,3,0),  // boiler
        new THREE.Vector3(4,3,0),   // turbine
        new THREE.Vector3(4,-3,0)   // condenser
    ];

    const animate = () => {
        requestAnimationFrame(animate);
        time += 0.01 + (pressure/500); // faster flow with higher pressure
        
        turbine.rotation.x += 0.05 + (pressure/100);

        particles.children.forEach((p, idx) => {
            const t = (time + idx/40) % 1.0;
            const segment = Math.floor(t * 4);
            const subT = (t * 4) % 1.0;
            const start = path[segment];
            const end = path[(segment+1)%4];
            p.position.lerpVectors(start, end, subT);
            
            // Color mapping based on segment
            if(segment===1) p.material.color.setHex(0xe11d48); // boiling -> hot
            if(segment===2) p.material.color.setHex(0x94a3b8); // expanding
            if(segment===3) p.material.color.setHex(0x0ea5e9); // condensing -> cold
            if(segment===0) p.material.color.setHex(0x0284c7); // pumping
        });

        controls.update(); renderer.render(scene, camera);
    };
    animate();
}

function initCh10IC() {
    const sys = createEngineScene('sim-ch10-desktop');
    if (!sys) return;
    const { scene, camera, renderer, controls } = sys;
    camera.position.set(0, 4, 10);
    controls.target.set(0, 2, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    scene.add(new THREE.PointLight(0xffffff, 1, 100).position.set(5, 5, 5));

    const cylMat = new THREE.MeshPhysicalMaterial({color: 0x555555, transparent:true, opacity:0.3, side:THREE.DoubleSide});
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6, 32, 1, true), cylMat);
    cylinder.position.y = 3; scene.add(cylinder);

    const pistonMat = new THREE.MeshStandardMaterial({color: 0x888888, metalness:0.8});
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.5, 32), pistonMat);
    scene.add(piston);

    const sparkMat = new THREE.MeshBasicMaterial({color: 0xffaa00, transparent:true, opacity:0});
    const spark = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), sparkMat);
    spark.position.y = 5.5; scene.add(spark);

    let playing = false;
    let time = 0; // 0 to 4*PI (4 strokes)

    document.getElementById('ch10-animate')?.addEventListener('click', () => {
        playing = true;
    });

    const animate = () => {
        requestAnimationFrame(animate);
        
        if (playing) {
            time += 0.05;
            if (time > Math.PI * 4) {
                time = 0; playing = false;
                sparkMat.opacity = 0;
            }

            // Kinematics
            // 0 to PI: Intake (down)
            // PI to 2PI: Compression (up)
            // 2PI to 3PI: Power (down)
            // 3PI to 4PI: Exhaust (up)
            const stroke = Math.floor(time / Math.PI);
            
            piston.position.y = 3 + Math.cos(time) * 2; // from y=5 down to y=1

            if (stroke === 2 && time % Math.PI < 0.5) {
                sparkMat.opacity = 1 - (time%Math.PI)/0.5; // flash spark
            } else {
                sparkMat.opacity = 0;
            }
        }

        controls.update(); renderer.render(scene, camera);
    };
    animate();
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initCh1PVT();
    initCh2Piston();
    initCh3Joule();
    initCh4SteadyFlow();
    initCh5Sankey();
    initCh6Entropy();
    // Ch 7 has no simulator
    initCh8Phase();
    initCh9Rankine();
    initCh10IC();
});
