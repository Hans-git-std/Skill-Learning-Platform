import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
    if (!container) return null;

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

    // Handle Resize
    window.addEventListener('resize', () => {
        if(!container) return;
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
    const sys = createStandardScene('sim-ch1');
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
    
    document.getElementById('ch1-mode-select').addEventListener('change', (e) => {
        mode = e.target.value;
    });
    
    document.getElementById('ch1-toggle-vectors').addEventListener('click', () => {
        vectorsVisible = !vectorsVisible;
        particles.visible = vectorsVisible;
    });

    let qout = 500;
    const qoutEl = document.getElementById('ch1-qout');
    const tempEl = document.getElementById('ch1-temp');

    function animate() {
        requestAnimationFrame(animate);
        sys.controls.update();

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
        
        // Randomly fluctuate stats slightly for realism
        qoutEl.innerText = (qout + (Math.random()*10 - 5)).toFixed(1);
        tempEl.innerText = (293.0 + (Math.random()*0.2 - 0.1)).toFixed(1);

        sys.renderer.render(sys.scene, sys.camera);
    }
    animate();
}

// ==========================================
// CHAPTER 2: Composite Wall Builder
// ==========================================
function initCh2Simulator() {
    const sys = createStandardScene('sim-ch2');
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
    const sys = createStandardScene('sim-ch3');
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
// Initialization
// ==========================================
window.onload = () => {
    initCh1Simulator();
    initCh2Simulator();
    initCh3Simulator();
    // Subsequent chapters will be added in future batches
};
