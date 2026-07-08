import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.154.0/examples/jsm/controls/OrbitControls.js';

/**
 * Heat Transfer Simulator Engine
 * Contains logic for 3D visualizers across all 10 chapters.
 * Developed in batches.
 * 
 * BATCH 1: Chapters 1, 2, 3
 */

// --- UTILITY: Create a standard 3D scene ---
function createStandardScene(containerId) {
    const container = document.getElementById(containerId);
    // If container is missing or hidden (mobile), do not initialize Three.js
    if (!container || container.clientWidth === 0) return null;

    const scene = new THREE.Scene();
    // Default dark background matching theme
    scene.background = new THREE.Color('#18181b'); 
    
    // Add some default lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.classList.add('webgl-canvas');
    
    // Insert canvas as the first child so overlay stays on top
    container.insertBefore(renderer.domElement, container.firstChild);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Handle Resize (Original working logic)
    window.addEventListener('resize', () => {
        if(!container || container.clientWidth === 0) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    return { scene, camera, renderer, controls, container };
}

// ==========================================
// CHAPTER 1: The 3D Heat Room (All Modes)
// ==========================================
function initCh1Simulator() {
    const sys = createStandardScene('sim-ch1-desktop');
    if (!sys) return;
    
    sys.camera.position.set(15, 10, 15);
    sys.controls.target.set(0, 2, 0);

    // Create a simple room
    const roomGeo = new THREE.BoxGeometry(10, 6, 10);
    const roomMat = new THREE.MeshPhysicalMaterial({ 
        color: 0x444444, side: THREE.BackSide, transparent: true, opacity: 0.8 
    });
    const room = new THREE.Mesh(roomGeo, roomMat);
    room.position.y = 3;
    sys.scene.add(room);

    // Heat Sources
    // 1. Radiator (Convection)
    const radGeo = new THREE.BoxGeometry(2, 1.5, 0.5);
    const radMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 });
    const radiator = new THREE.Mesh(radGeo, radMat);
    radiator.position.set(-4.5, 1, 0);
    sys.scene.add(radiator);

    // 2. Fireplace (Radiation)
    const fireGeo = new THREE.BoxGeometry(2, 2, 1);
    const fireMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const fireplace = new THREE.Mesh(fireGeo, fireMat);
    fireplace.position.set(0, 1, -4.5);
    sys.scene.add(fireplace);
    
    // Fake fire glow
    const fireLight = new THREE.PointLight(0xff5500, 5, 10);
    fireLight.position.set(0, 1, -4.0);
    sys.scene.add(fireLight);

    // 3. Window (Conduction to outside cold)
    const winGeo = new THREE.PlaneGeometry(3, 3);
    const winMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const windowMesh = new THREE.Mesh(winGeo, winMat);
    windowMesh.rotation.y = Math.PI / 2;
    windowMesh.position.set(4.9, 3, 0);
    sys.scene.add(windowMesh);

    // Particles system for visualization
    const particleCount = 200;
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velArray = [];
    const colorArray = new Float32Array(particleCount * 3);
    
    for(let i=0; i<particleCount; i++) {
        posArray[i*3] = (Math.random() - 0.5) * 8;
        posArray[i*3+1] = Math.random() * 5;
        posArray[i*3+2] = (Math.random() - 0.5) * 8;
        
        velArray.push({
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() * 0.05),
            z: (Math.random() - 0.5) * 0.02
        });
        
        colorArray[i*3] = 1.0; // R
        colorArray[i*3+1] = 0.5; // G
        colorArray[i*3+2] = 0.0; // B
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    const pMaterial = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    const particles = new THREE.Points(particlesGeo, pMaterial);
    sys.scene.add(particles);

    let mode = 'all';
    let vectorsVisible = true;
    
    let targetQout = 850;
    let targetTemp = 295.0;
    
    document.getElementById('ch1-mode-select').addEventListener('change', (e) => {
        mode = e.target.value;
        if (mode === 'all') {
            targetQout = 850; targetTemp = 295.0;
        } else if (mode === 'conduction') {
            targetQout = 150; targetTemp = 290.0;
        } else if (mode === 'convection') {
            targetQout = 400; targetTemp = 298.0;
        } else if (mode === 'radiation') {
            targetQout = 300; targetTemp = 305.0;
        }
    });
    
    document.getElementById('ch1-toggle-vectors').addEventListener('click', () => {
        vectorsVisible = !vectorsVisible;
        particles.visible = vectorsVisible;
    });

    let currentQout = 850;
    let currentTemp = 295.0;
    const qoutEl = document.getElementById('ch1-qout');
    const tempEl = document.getElementById('ch1-temp');

    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();

        // Smooth transition for stats
        currentQout += (targetQout - currentQout) * 0.05;
        currentTemp += (targetTemp - currentTemp) * 0.05;

        // Update particles based on mode
        const positions = particles.geometry.attributes.position.array;
        const colors = particles.geometry.attributes.color.array;
        
        for(let i=0; i<particleCount; i++) {
            let px = positions[i*3];
            let py = positions[i*3+1];
            let pz = positions[i*3+2];
            
            // Convection logic (rising from radiator)
            if(mode === 'all' || mode === 'convection') {
                if(px < -2 && py < 5) {
                    py += 0.05;
                    colors[i*3] = 1.0; colors[i*3+1] = 0.2; colors[i*3+2] = 0.0;
                }
            }
            
            // Conduction logic (sucked out of window)
            if(mode === 'all' || mode === 'conduction') {
                if(px > 2 && py > 1 && py < 4) {
                    px += 0.04;
                    colors[i*3] = 0.0; colors[i*3+1] = 0.5; colors[i*3+2] = 1.0;
                }
            }

            // Radiation logic (straight lines from fire)
            if(mode === 'all' || mode === 'radiation') {
                if(pz < -2) {
                    pz += 0.06;
                    px += velArray[i].x * 2;
                    colors[i*3] = 1.0; colors[i*3+1] = 0.8; colors[i*3+2] = 0.0;
                }
            }
            
            // Reset particles that go out of bounds
            if(py > 5.5 || px > 4.5 || pz > 4.5) {
                positions[i*3] = (Math.random() - 0.5) * 8;
                positions[i*3+1] = Math.random() * 2;
                positions[i*3+2] = (Math.random() - 0.5) * 8;
            } else {
                positions[i*3] = px;
                positions[i*3+1] = py;
                positions[i*3+2] = pz;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;
        
        // Flicker fire light
        fireLight.intensity = 5 + Math.random() * 1.5;
        
        // Randomly fluctuate stats slightly around the current smooth target for realism
        qoutEl.innerText = (currentQout + (Math.random()*2 - 1)).toFixed(1);
        tempEl.innerText = (currentTemp + (Math.random()*0.1 - 0.05)).toFixed(1);

        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// CHAPTER 2: Composite Wall Builder
// ==========================================
function initCh2Simulator() {
    const sys = createStandardScene('sim-ch2-desktop');
    if (!sys) return;
    
    sys.camera.position.set(8, 4, 8);
    sys.controls.target.set(0, 0, 0);

    const layers = [];
    const materialsData = {
        copper: { k: 400, color: 0xb87333 },
        brick: { k: 0.7, color: 0x8b0000 },
        insulation: { k: 0.04, color: 0xf5deb3 }
    };

    const wallGroup = new THREE.Group();
    sys.scene.add(wallGroup);
    
    let totalX = 0;

    function renderWall() {
        // Clear previous
        while(wallGroup.children.length > 0){ 
            wallGroup.remove(wallGroup.children[0]); 
        }
        
        totalX = 0;
        let rTh = 0;
        
        layers.forEach((layer, idx) => {
            const data = materialsData[layer.type];
            const width = 1.0; // standard visual thickness
            const geo = new THREE.BoxGeometry(width, 4, 4);
            const mat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.7 });
            const mesh = new THREE.Mesh(geo, mat);
            
            mesh.position.x = totalX + (width / 2);
            wallGroup.add(mesh);
            
            totalX += width;
            rTh += (width / data.k); // L / kA (assuming A=1)
        });
        
        // Center the wall group
        wallGroup.position.x = -totalX / 2;
        
        // Update stats
        document.getElementById('ch2-rth').innerText = rTh.toFixed(3);
        const tempDiff = 100; // Assuming 100K difference across
        const flux = rTh > 0 ? (tempDiff / rTh) : 0;
        document.getElementById('ch2-flux').innerText = flux.toFixed(1);
    }

    document.getElementById('ch2-add-layer').addEventListener('click', () => {
        if(layers.length >= 5) {
            alert("Maximum 5 layers allowed.");
            return;
        }
        const sel = document.getElementById('ch2-layer-material').value;
        layers.push({ type: sel });
        renderWall();
    });

    // Initial state
    layers.push({ type: 'brick' });
    layers.push({ type: 'insulation' });
    renderWall();

    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}


// ==========================================
// CHAPTER 3: 3D Heat Sink Optimizer
// ==========================================
function initCh3Simulator() {
    const sys = createStandardScene('sim-ch3-desktop');
    if (!sys) return;
    
    sys.camera.position.set(12, 10, 12);
    sys.controls.target.set(0, 0, 0);

    const sinkGroup = new THREE.Group();
    sys.scene.add(sinkGroup);
    
    // CPU Base (Hot)
    const baseGeo = new THREE.BoxGeometry(6, 0.5, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0x440000 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.25;
    sinkGroup.add(baseMesh);
    
    let fins = [];

    function generateFins(type, length) {
        // Remove old fins
        fins.forEach(f => sinkGroup.remove(f));
        fins = [];
        
        const count = 7;
        const spacing = 6 / count;
        
        // Calculate artificial efficiency based on type and length
        // Longer fins -> drop in efficiency. Pin fins -> slightly different.
        let efficiency = 100 * Math.exp(-length * 5); 
        let totalHeat = (type === 'pin' ? 120 : 150) * (length * 10) * (efficiency / 100);

        // Color mapping function based on height (Hot at bottom, cool at top)
        for(let i=0; i<count; i++) {
            for(let j=0; j<count; j++) {
                if (type === 'rectangular' && j > 0) continue; // Only one row of fins for rectangular

                let geo;
                let mesh;
                
                if (type === 'rectangular') {
                    geo = new THREE.BoxGeometry(0.2, length * 100, 6);
                    // Use a ShaderMaterial for color gradient
                    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc }); 
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(-3 + (i * spacing) + (spacing/2), (length * 100)/2, 0);
                } else {
                    geo = new THREE.CylinderGeometry(0.15, 0.15, length * 100, 16);
                    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(-3 + (i * spacing) + (spacing/2), (length * 100)/2, -3 + (j * spacing) + (spacing/2));
                }
                
                // Color gradient hack for visual purposes (red to blue)
                mesh.material.color.lerpColors(new THREE.Color(0xff3300), new THREE.Color(0x0055ff), 1 - (efficiency/100));
                
                sinkGroup.add(mesh);
                fins.push(mesh);
            }
        }
        
        document.getElementById('ch3-eff').innerText = efficiency.toFixed(1);
        document.getElementById('ch3-qtot').innerText = totalHeat.toFixed(1);
    }

    const typeSel = document.getElementById('ch3-profile');
    const lenInput = document.getElementById('ch3-length');

    typeSel.addEventListener('change', () => generateFins(typeSel.value, parseFloat(lenInput.value)));
    lenInput.addEventListener('input', () => generateFins(typeSel.value, parseFloat(lenInput.value)));

    // Initial state
    generateFins('rectangular', 0.05);

    function animate() {
        requestAnimationFrame(animate);
        sinkGroup.rotation.y += 0.005; // slowly rotate the heat sink
        sys.controls.update();
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// CHAPTER 4: Transient Conduction (Quenching)
// ==========================================
function initCh4Simulator() {
    const sys = createStandardScene('sim-ch4-desktop');
    if (!sys) return;
    
    sys.camera.position.set(5, 5, 5);
    sys.controls.target.set(0, 0, 0);
    
    // Create water tank
    const tankGeo = new THREE.BoxGeometry(4, 3, 4);
    const tankMat = new THREE.MeshPhongMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.3, depthWrite: false });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.y = -1.5;
    sys.scene.add(tank);
    
    // Create hot sphere
    const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMat = new THREE.MeshPhongMaterial({ color: 0xff3300, emissive: 0xcc0000 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.y = 2;
    sys.scene.add(sphere);
    
    let isQuenching = false;
    let time = 0;
    let temp = 1000;
    let coolingRate = 0.05;
    
    document.getElementById('ch4-material').addEventListener('change', (e) => {
        const mat = e.target.value;
        if(mat === 'copper') coolingRate = 0.1;
        if(mat === 'steel') coolingRate = 0.03;
        if(mat === 'glass') coolingRate = 0.005;
    });
    
    document.getElementById('ch4-quench').addEventListener('click', () => {
        isQuenching = true;
        time = 0;
        temp = 1000;
        sphere.position.y = 2;
    });
    
    const timeEl = document.getElementById('ch4-time');
    const tempEl = document.getElementById('ch4-temp');
    
    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();
        
        if (isQuenching) {
            if (sphere.position.y > -1.5) {
                sphere.position.y -= 0.1;
            } else {
                time += 0.016;
                temp = 300 + 700 * Math.exp(-coolingRate * time * 10);
                
                const ratio = (temp - 300) / 700;
                sphereMat.color.setHSL(0, 1.0, 0.3 + 0.2*ratio);
                sphereMat.emissive.setHSL(0, 1.0, 0.5*ratio);
                
                timeEl.innerText = time.toFixed(1);
                tempEl.innerText = temp.toFixed(0);
            }
        }
        
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// CHAPTER 5: Wind Tunnel (Boundary Layer)
// ==========================================
function initCh5Simulator() {
    const sys = createStandardScene('sim-ch5-desktop');
    if (!sys) return;
    
    sys.camera.position.set(0, 4, 10);
    sys.controls.target.set(0, 0, 0);
    
    const plateGeo = new THREE.BoxGeometry(8, 0.2, 4);
    const plateMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    sys.scene.add(plate);
    
    const particleGeo = new THREE.BufferGeometry();
    const pCount = 500;
    const positions = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
        positions[i*3] = -4 + Math.random() * 8;
        positions[i*3+1] = 0.1 + Math.random() * 2;
        positions[i*3+2] = -2 + Math.random() * 4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x0ea5e9, size: 0.1 });
    const particles = new THREE.Points(particleGeo, particleMat);
    sys.scene.add(particles);
    
    let vel = 10;
    let pr = 0.7;
    document.getElementById('ch5-vel').addEventListener('input', (e) => vel = parseFloat(e.target.value));
    document.getElementById('ch5-pr').addEventListener('change', (e) => pr = parseFloat(e.target.value));
    
    const reEl = document.getElementById('ch5-re');
    const hEl = document.getElementById('ch5-h');
    
    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();
        
        const pos = particles.geometry.attributes.position.array;
        let blThickness = 1.0 / Math.sqrt(vel);
        
        for(let i=0; i<pCount; i++) {
            let y = pos[i*3+1];
            let localVel = vel;
            if (y < blThickness) {
                localVel = vel * (y / blThickness);
            }
            
            pos[i*3] += localVel * 0.01;
            
            if(pos[i*3] > 4) {
                pos[i*3] = -4;
                pos[i*3+1] = 0.1 + Math.random() * 2;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        const Re = vel * 1000;
        reEl.innerText = Re.toLocaleString();
        
        const Nu = 0.664 * Math.sqrt(Re) * Math.pow(pr, 1/3);
        const h = Nu * 0.026 / 8;
        hEl.innerText = h.toFixed(2);
        
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// CHAPTER 6: Pipe Flow
// ==========================================
function initCh6Simulator() {
    const sys = createStandardScene('sim-ch6-desktop');
    if (!sys) return;
    
    sys.camera.position.set(0, 0, 8);
    
    const pipeGeo = new THREE.CylinderGeometry(2, 2, 8, 32, 1, true, 0, Math.PI);
    const pipeMat = new THREE.MeshPhongMaterial({ color: 0x444444, side: THREE.DoubleSide });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.z = Math.PI/2;
    pipe.rotation.x = -Math.PI/2;
    sys.scene.add(pipe);
    
    const pCount = 800;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
        const r = Math.random() * 1.9;
        const theta = Math.random() * Math.PI * 2;
        pos[i*3] = -4 + Math.random()*8;
        pos[i*3+1] = r * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(theta);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x0ea5e9, size: 0.08 });
    const pts = new THREE.Points(geo, mat);
    sys.scene.add(pts);
    
    let re = 2000;
    document.getElementById('ch6-re').addEventListener('input', (e) => re = parseFloat(e.target.value));
    
    const regEl = document.getElementById('ch6-regime');
    const nuEl = document.getElementById('ch6-nu');
    
    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();
        
        const isTurbulent = re > 4000;
        regEl.innerText = isTurbulent ? 'Turbulent' : (re > 2300 ? 'Transition' : 'Laminar');
        regEl.style.color = isTurbulent ? 'var(--accent-warning)' : 'var(--accent-neon)';
        
        let nu = 4.36;
        if(isTurbulent) {
            nu = 0.023 * Math.pow(re, 0.8) * Math.pow(0.7, 0.4);
        } else if (re > 2300) {
            nu = 4.36 + ((re-2300)/1700)*(0.023*Math.pow(4000, 0.8)*Math.pow(0.7,0.4) - 4.36);
        }
        nuEl.innerText = nu.toFixed(1);
        
        const posArr = pts.geometry.attributes.position.array;
        const velBase = re / 50000;
        
        for(let i=0; i<pCount; i++) {
            let x = posArr[i*3];
            let y = posArr[i*3+1];
            let z = posArr[i*3+2];
            
            let r = Math.sqrt(y*y + z*z);
            let v = velBase * (1 - (r/2)*(r/2));
            
            if(isTurbulent) {
                v = velBase;
                y += (Math.random()-0.5)*0.2 * (velBase*10);
                z += (Math.random()-0.5)*0.2 * (velBase*10);
                if(y*y + z*z > 3.8) {
                    y *= 0.9; z *= 0.9;
                }
            }
            
            x += v * 0.5 + 0.05;
            if (x > 4) {
                x = -4;
            }
            posArr[i*3] = x;
            posArr[i*3+1] = y;
            posArr[i*3+2] = z;
        }
        pts.geometry.attributes.position.needsUpdate = true;
        
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// CHAPTER 7: Natural Convection (Plume Tracker)
// ==========================================
function initCh7Simulator() {
    const sys = createStandardScene('sim-ch7-desktop');
    if (!sys) return;
    
    sys.camera.position.set(0, 5, 12);
    
    const plateGeo = new THREE.BoxGeometry(4, 0.2, 4);
    const plateMat = new THREE.MeshPhongMaterial({ color: 0xff3300, emissive: 0x550000 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    sys.scene.add(plate);
    
    const pCount = 600;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
        pos[i*3] = (Math.random()-0.5)*3.8;
        pos[i*3+1] = Math.random()*8;
        pos[i*3+2] = (Math.random()-0.5)*3.8;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffaa00, size: 0.15, transparent: true, opacity: 0.6 });
    const pts = new THREE.Points(geo, mat);
    sys.scene.add(pts);
    
    let dt = 20;
    document.getElementById('ch7-dt').addEventListener('input', (e) => dt = parseFloat(e.target.value));
    
    const raEl = document.getElementById('ch7-ra');
    const flowEl = document.getElementById('ch7-flow');
    
    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();
        
        const Ra = dt * 5e7;
        raEl.innerText = Ra.toExponential(2);
        
        const isTurb = Ra > 1e9;
        flowEl.innerText = isTurb ? 'Turbulent' : 'Laminar';
        flowEl.style.color = isTurb ? 'var(--accent-warning)' : 'var(--accent-neon)';
        
        plateMat.color.setHSL(0, 1.0, 0.2 + (dt/100)*0.3);
        
        const posArr = pts.geometry.attributes.position.array;
        
        for(let i=0; i<pCount; i++) {
            let x = posArr[i*3];
            let y = posArr[i*3+1];
            let z = posArr[i*3+2];
            
            let v_y = 0.05 + (dt/100)*0.1;
            y += v_y;
            
            x += -x * 0.01;
            z += -z * 0.01;
            
            if(isTurb) {
                x += (Math.random()-0.5)*0.2 * (dt/50);
                z += (Math.random()-0.5)*0.2 * (dt/50);
            }
            
            if(y > 8) {
                y = 0.2;
                x = (Math.random()-0.5)*3.8;
                z = (Math.random()-0.5)*3.8;
            }
            posArr[i*3] = x;
            posArr[i*3+1] = y;
            posArr[i*3+2] = z;
        }
        pts.geometry.attributes.position.needsUpdate = true;
        
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// MOBILE 2D DASHBOARDS (BATCH 1 & 2)
// ==========================================

function initCh1Mobile() {
    const select = document.getElementById('ch1-mobile-mode');
    if(!select) return;
    
    const qout = document.getElementById('ch1-mob-qout');
    const temp = document.getElementById('ch1-mob-temp');
    const graphic = document.getElementById('ch1-mob-graphic');
    
    select.addEventListener('change', (e) => {
        const mode = e.target.value;
        if (mode === 'all') {
            qout.innerText = '850 W'; temp.innerText = '295.0 K';
            graphic.style.background = 'linear-gradient(90deg, var(--accent-mech), var(--accent-neon))';
        } else if (mode === 'conduction') {
            qout.innerText = '150 W'; temp.innerText = '290.0 K';
            graphic.style.background = 'var(--accent-neon)';
        } else if (mode === 'convection') {
            qout.innerText = '400 W'; temp.innerText = '298.0 K';
            graphic.style.background = 'var(--accent-warning)';
        } else if (mode === 'radiation') {
            qout.innerText = '300 W'; temp.innerText = '305.0 K';
            graphic.style.background = 'var(--accent-mech)';
        }
    });
}

function initCh2Mobile() {
    const btn = document.getElementById('ch2-mob-add');
    if(!btn) return;
    
    const container = document.getElementById('ch2-mob-wall-container');
    const select = document.getElementById('ch2-mob-mat');
    const rthEl = document.getElementById('ch2-mob-rth');
    const fluxEl = document.getElementById('ch2-mob-flux');
    
    const layers = [];
    
    function render() {
        container.innerHTML = '';
        let rth = 0;
        layers.forEach(k => {
            const div = document.createElement('div');
            div.style.flex = '1';
            div.style.width = '100%';
            div.style.background = k == 400 ? '#b87333' : (k == 0.7 ? '#8b0000' : '#f5deb3');
            container.appendChild(div);
            rth += (1 / k);
        });
        
        rthEl.innerText = rth.toFixed(3);
        fluxEl.innerText = (rth > 0 ? (100 / rth) : 0).toFixed(1);
    }
    
    btn.addEventListener('click', () => {
        if(layers.length >= 5) {
            alert('Max 5 layers');
            return;
        }
        layers.push(parseFloat(select.value));
        render();
    });
    
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
        const eff = 100 * Math.exp(-len * 5);
        
        fin.style.height = (len * 1000) + 'px';
        
        const ratio = eff / 100;
        fin.style.background = `linear-gradient(to top, var(--accent-mech), rgba(2, 132, 199, ${1 - ratio}))`;
        
        effEl.innerText = eff.toFixed(1);
    });
}

function initCh4Mobile() {
    const btn = document.getElementById('ch4-mob-quench');
    if(!btn) return;
    
    const sphere = document.getElementById('ch4-mob-sphere');
    const timeEl = document.getElementById('ch4-mob-time');
    const tempEl = document.getElementById('ch4-mob-temp');
    const matSelect = document.getElementById('ch4-mob-mat');
    
    let isQuenching = false;
    let time = 0;
    let temp = 1000;
    
    btn.addEventListener('click', () => {
        isQuenching = true;
        time = 0;
        temp = 1000;
        
        const k = parseFloat(matSelect.value); // 0.1, 0.03, 0.005
        let interval = setInterval(() => {
            time += 0.05;
            temp = 300 + 700 * Math.exp(-k * time * 10);
            
            timeEl.innerText = time.toFixed(1);
            tempEl.innerText = temp.toFixed(0);
            
            const ratio = (temp - 300) / 700;
            const r = Math.floor(100 + 155*ratio);
            const gb = Math.floor(100 * (1-ratio));
            sphere.style.background = `rgb(${r}, ${gb}, ${gb})`;
            sphere.style.boxShadow = `0 0 ${15*ratio}px rgb(${r}, 0, 0)`;
            
            if(temp < 305) clearInterval(interval);
        }, 50);
    });
}

function initCh5Mobile() {
    const slider = document.getElementById('ch5-mob-vel');
    if(!slider) return;
    
    const particle = document.getElementById('ch5-mob-particle');
    const reEl = document.getElementById('ch5-mob-re');
    const hEl = document.getElementById('ch5-mob-h');
    
    let vel = 10;
    let pos = -10;
    
    slider.addEventListener('input', (e) => {
        vel = parseFloat(e.target.value);
        const re = vel * 1000;
        reEl.innerText = re.toLocaleString();
        
        const h = 0.664 * Math.sqrt(re) * Math.pow(0.7, 1/3) * 0.026 / 8;
        hEl.innerText = h.toFixed(2);
    });
    
    function anim() {
        pos += vel * 0.2;
        if(pos > 110) {
            pos = -10;
            particle.style.top = (20 + Math.random()*60) + '%';
        }
        particle.style.left = pos + '%';
        requestAnimationFrame(anim);
    }
    anim();
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

// ==========================================
// CHAPTER 8: Boiling Curve Explorer (Desktop)
// ==========================================
function initCh8Simulator() {
    const sys = createStandardScene('sim-ch8-desktop');
    if (!sys) return;
    
    sys.camera.position.set(0, 5, 12);
    
    // Heater plate
    const plateGeo = new THREE.BoxGeometry(6, 0.5, 6);
    const plateMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    sys.scene.add(plate);
    
    // Water volume (visual only)
    const waterGeo = new THREE.BoxGeometry(6, 4, 6);
    const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.3, depthWrite: false });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 2.25;
    sys.scene.add(water);
    
    // Vapor film (for film boiling)
    const filmGeo = new THREE.BoxGeometry(5.8, 0.4, 5.8);
    const filmMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const film = new THREE.Mesh(filmGeo, filmMat);
    film.position.y = 0.45;
    sys.scene.add(film);
    
    // Bubbles
    const bCount = 200;
    const bGeo = new THREE.BufferGeometry();
    const bPos = new Float32Array(bCount * 3);
    for(let i=0; i<bCount; i++) {
        bPos[i*3] = (Math.random()-0.5)*5;
        bPos[i*3+1] = 0.5 + Math.random()*3.5;
        bPos[i*3+2] = (Math.random()-0.5)*5;
    }
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    const bMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.8 });
    const bubbles = new THREE.Points(bGeo, bMat);
    sys.scene.add(bubbles);
    
    let dTe = 15;
    document.getElementById('ch8-temp').addEventListener('input', (e) => dTe = parseFloat(e.target.value));
    
    const regEl = document.getElementById('ch8-regime');
    const fluxEl = document.getElementById('ch8-flux');
    
    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();
        
        // Heat plate color
        plateMat.color.setHSL(0, 1.0, 0.2 + (dTe/150)*0.5);
        plateMat.emissive.setHSL(0, 1.0, (dTe/150)*0.4);
        
        let flux = 0;
        let regime = '';
        let bSpeed = 0;
        
        if (dTe < 5) {
            regime = 'Free Convection';
            flux = dTe * 0.05;
            bSpeed = 0.01;
            filmMat.opacity = 0;
            bMat.opacity = 0.2;
        } else if (dTe < 30) {
            regime = 'Nucleate Boiling';
            flux = 0.25 + (dTe-5)*0.1; // rapid rise
            bSpeed = 0.1 + (dTe/30)*0.2;
            filmMat.opacity = 0;
            bMat.opacity = 0.8;
        } else if (dTe < 120) {
            regime = 'Transition Boiling';
            flux = 2.75 - ((dTe-30)/90)*2.0; // drops
            bSpeed = 0.05;
            filmMat.opacity = 0.4 + ((dTe-30)/90)*0.4;
            bMat.opacity = 0.4;
        } else {
            regime = 'Film Boiling';
            flux = 0.75 + ((dTe-120)/30)*0.2; // slow rise via radiation
            bSpeed = 0.02;
            filmMat.opacity = 0.9;
            bMat.opacity = 0.1;
        }
        
        regEl.innerText = regime;
        if(regime === 'Transition Boiling') regEl.style.color = 'var(--accent-warning)';
        else if(regime === 'Film Boiling') regEl.style.color = 'var(--accent-mech)';
        else regEl.style.color = 'var(--accent-neon)';
        
        fluxEl.innerText = flux.toFixed(2);
        
        const pos = bubbles.geometry.attributes.position.array;
        for(let i=0; i<bCount; i++) {
            pos[i*3+1] += bSpeed * (1 + Math.random()*0.5);
            if(pos[i*3+1] > 4) {
                pos[i*3+1] = 0.5;
                pos[i*3] = (Math.random()-0.5)*5;
                pos[i*3+2] = (Math.random()-0.5)*5;
            }
        }
        bubbles.geometry.attributes.position.needsUpdate = true;
        
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// CHAPTER 9: Heat Exchangers (Desktop)
// ==========================================
function initCh9Simulator() {
    const sys = createStandardScene('sim-ch9-desktop');
    if (!sys) return;
    
    sys.camera.position.set(0, 4, 12);
    
    // Outer tube (Cold)
    const outGeo = new THREE.CylinderGeometry(2, 2, 10, 32, 1, true, 0, Math.PI); // half cylinder
    const outMat = new THREE.MeshPhongMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const outTube = new THREE.Mesh(outGeo, outMat);
    outTube.rotation.z = Math.PI/2;
    outTube.rotation.x = -Math.PI/2;
    sys.scene.add(outTube);
    
    // Inner tube (Hot)
    const inGeo = new THREE.CylinderGeometry(0.8, 0.8, 10, 32);
    const inMat = new THREE.MeshPhongMaterial({ color: 0xff3300, transparent: true, opacity: 0.8 });
    const inTube = new THREE.Mesh(inGeo, inMat);
    inTube.rotation.z = Math.PI/2;
    sys.scene.add(inTube);
    
    // Particles
    const pCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pColor = new Float32Array(pCount * 3);
    
    for(let i=0; i<pCount; i++) {
        const isHot = i < pCount/2;
        const r = isHot ? (Math.random()*0.7) : (0.9 + Math.random()*1.0);
        const theta = Math.random() * Math.PI * 2;
        pPos[i*3] = -5 + Math.random()*10;
        pPos[i*3+1] = r * Math.sin(theta);
        pPos[i*3+2] = r * Math.cos(theta);
        
        if(isHot) {
            pColor[i*3]=1; pColor[i*3+1]=0.2; pColor[i*3+2]=0;
        } else {
            pColor[i*3]=0; pColor[i*3+1]=0.5; pColor[i*3+2]=1;
        }
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColor, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.2, vertexColors: true });
    const pts = new THREE.Points(pGeo, pMat);
    sys.scene.add(pts);
    
    let isPlaying = false;
    let flowType = 'counter';
    
    document.getElementById('ch9-type').addEventListener('change', (e) => flowType = e.target.value);
    document.getElementById('ch9-play').addEventListener('click', () => isPlaying = !isPlaying);
    
    const effEl = document.getElementById('ch9-eff');
    const tcEl = document.getElementById('ch9-tc');
    
    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();
        
        if (isPlaying) {
            const pos = pts.geometry.attributes.position.array;
            for(let i=0; i<pCount; i++) {
                const isHot = i < pCount/2;
                if (isHot) {
                    pos[i*3] += 0.05; // Hot always flows left to right
                    if (pos[i*3] > 5) pos[i*3] = -5;
                } else {
                    if (flowType === 'counter') {
                        pos[i*3] -= 0.05; // Right to left
                        if (pos[i*3] < -5) pos[i*3] = 5;
                    } else {
                        pos[i*3] += 0.05; // Left to right
                        if (pos[i*3] > 5) pos[i*3] = -5;
                    }
                }
            }
            pts.geometry.attributes.position.needsUpdate = true;
        }
        
        // Counter flow is more effective
        const eff = flowType === 'counter' ? 85.4 : 62.1;
        const tcOut = 300 + (eff/100)*100; // Assuming 100K max transfer
        
        effEl.innerText = eff.toFixed(1);
        tcEl.innerText = tcOut.toFixed(1);
        
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// CHAPTER 10: View Factor Ray-Tracer (Desktop)
// ==========================================
function initCh10Simulator() {
    const sys = createStandardScene('sim-ch10-desktop');
    if (!sys) return;
    
    sys.camera.position.set(5, 5, 10);
    sys.controls.target.set(0, 0, 0);
    
    const p1Geo = new THREE.PlaneGeometry(4, 4);
    const p1Mat = new THREE.MeshBasicMaterial({ color: 0xff5500, side: THREE.DoubleSide });
    const p1 = new THREE.Mesh(p1Geo, p1Mat);
    p1.rotation.x = -Math.PI/2;
    p1.position.y = -2;
    sys.scene.add(p1);
    
    const p2Geo = new THREE.PlaneGeometry(4, 4);
    const p2Mat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const p2 = new THREE.Mesh(p2Geo, p2Mat);
    sys.scene.add(p2);
    
    let orient = 'parallel';
    
    document.getElementById('ch10-orient').addEventListener('change', (e) => {
        orient = e.target.value;
        if(orient === 'parallel') {
            p2.rotation.x = -Math.PI/2;
            p2.position.set(0, 2, 0);
        } else {
            p2.rotation.x = 0;
            p2.position.set(0, 0, -2);
        }
        // clear rays
        sys.scene.children = sys.scene.children.filter(c => c.type !== 'Line');
        document.getElementById('ch10-f12').innerText = "0.00";
    });
    
    // Trigger initial setup
    document.getElementById('ch10-orient').dispatchEvent(new Event('change'));
    
    document.getElementById('ch10-trace').addEventListener('click', () => {
        // Clear old rays
        sys.scene.children = sys.scene.children.filter(c => c.type !== 'Line');
        
        const rayCount = 200;
        let hits = 0;
        
        // Define target bounds for simple AABB intersection
        // p1 is at y=-2, x:[-2,2], z:[-2,2]
        
        for(let i=0; i<rayCount; i++) {
            const start = new THREE.Vector3(
                (Math.random()-0.5)*4,
                -2,
                (Math.random()-0.5)*4
            );
            
            // Random diffuse emission (hemisphere)
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1) / 2; // only top hemisphere
            
            const dir = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta)
            );
            
            let hit = false;
            let dist = 10;
            
            if (orient === 'parallel') {
                // p2 is at y=2, x:[-2,2], z:[-2,2]
                if (dir.y > 0) {
                    const t = (2 - start.y) / dir.y;
                    const hx = start.x + dir.x * t;
                    const hz = start.z + dir.z * t;
                    if (hx >= -2 && hx <= 2 && hz >= -2 && hz <= 2) {
                        hit = true;
                        dist = t;
                    }
                }
            } else {
                // p2 is at z=-2, x:[-2,2], y:[-2,2]
                if (dir.z < 0) {
                    const t = (-2 - start.z) / dir.z;
                    const hx = start.x + dir.x * t;
                    const hy = start.y + dir.y * t;
                    if (hx >= -2 && hx <= 2 && hy >= -2 && hy <= 2) {
                        hit = true;
                        dist = t;
                    }
                }
            }
            
            if(hit) hits++;
            
            const end = start.clone().add(dir.multiplyScalar(dist));
            const points = [start, end];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ color: hit ? 0xffffff : 0x444444, transparent: true, opacity: 0.5 });
            const line = new THREE.Line(lineGeo, lineMat);
            sys.scene.add(line);
        }
        
        const F12 = hits / rayCount;
        document.getElementById('ch10-f12').innerText = F12.toFixed(2);
        document.getElementById('ch10-qrad').innerText = (F12 * 5000).toFixed(1); // arbitrary scale for visual
    });
    
    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();
        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
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
}

// ==========================================
// Initialization
// ==========================================
const safeInit = (fn, name) => {
    try {
        fn();
    } catch (e) {
        console.error(`Error initializing ${name}:`, e);
    }
};

const runAll = () => {
    safeInit(initCh1Simulator, 'Ch1 Desktop');
    safeInit(initCh2Simulator, 'Ch2 Desktop');
    safeInit(initCh3Simulator, 'Ch3 Desktop');
    safeInit(initCh4Simulator, 'Ch4 Desktop');
    safeInit(initCh5Simulator, 'Ch5 Desktop');
    safeInit(initCh6Simulator, 'Ch6 Desktop');
    safeInit(initCh7Simulator, 'Ch7 Desktop');
    safeInit(initCh8Simulator, 'Ch8 Desktop');
    safeInit(initCh9Simulator, 'Ch9 Desktop');
    safeInit(initCh10Simulator, 'Ch10 Desktop');
    
    safeInit(initCh1Mobile, 'Ch1 Mobile');
    safeInit(initCh2Mobile, 'Ch2 Mobile');
    safeInit(initCh3Mobile, 'Ch3 Mobile');
    safeInit(initCh4Mobile, 'Ch4 Mobile');
    safeInit(initCh5Mobile, 'Ch5 Mobile');
    safeInit(initCh6Mobile, 'Ch6 Mobile');
    safeInit(initCh7Mobile, 'Ch7 Mobile');
    safeInit(initCh8Mobile, 'Ch8 Mobile');
    safeInit(initCh9Mobile, 'Ch9 Mobile');
    safeInit(initCh10Mobile, 'Ch10 Mobile');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAll);
} else {
    runAll();
}
