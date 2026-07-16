import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Utility to initialize a basic Three.js scene within a container
function initScene(containerId, backgroundColor = 0x18181b) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    if (container.clientWidth === 0 || container.clientHeight === 0) return null; // Abort if hidden (e.g. on mobile)

    // Set container to position relative if not already to contain absolute overlays
    container.style.position = 'relative';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Handle resize
    window.addEventListener('resize', () => {
        if(container.clientWidth === 0) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Add overlay UI container
    const uiContainer = document.createElement('div');
    uiContainer.className = 'sim-overlay';
    container.appendChild(uiContainer);

    return { scene, camera, renderer, controls, uiContainer, container };
}

// ---------------------------------------------------------
// Chapter 1: 3D Heat Transfer Sandbox
// ---------------------------------------------------------
function initCh1() {
    const env = initScene('sim-ch1-desktop');
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(0, 5, 10);
    
    // UI Setup
    uiContainer.innerHTML = `
        <h4>Heat Transfer Sandbox</h4>
        <div class="sim-controls">
            <label>Insulation Level: <span id="ch1-insulation-val">0%</span>
                <input type="range" id="ch1-insulation" min="0" max="100" value="0">
            </label>
        </div>
        <div class="sim-stats">
            Heat Flow Rate (Q): <span id="ch1-q">High</span>
        </div>
    `;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Objects
    const hotMat = new THREE.MeshPhongMaterial({ color: 0xff3300, emissive: 0x440000 });
    const coldMat = new THREE.MeshPhongMaterial({ color: 0x0066ff, emissive: 0x001144 });
    const bridgeMat = new THREE.MeshPhongMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });

    const hotBox = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), hotMat);
    hotBox.position.set(-3, 0, 0);
    scene.add(hotBox);

    const coldBox = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), coldMat);
    coldBox.position.set(3, 0, 0);
    scene.add(coldBox);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 1), bridgeMat);
    scene.add(bridge);

    // Particles representing heat
    const particleCount = 100;
    const particles = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
        particleCount
    );
    scene.add(particles);

    const particleData = [];
    for(let i=0; i<particleCount; i++) {
        particleData.push({
            progress: Math.random(),
            speed: 0.01 + Math.random() * 0.02,
            offset: new THREE.Vector3((Math.random()-0.5)*0.8, (Math.random()-0.5)*0.4 + 0.25, (Math.random()-0.5)*0.8)
        });
    }

    const dummy = new THREE.Object3D();
    const insulationSlider = document.getElementById('ch1-insulation');
    const qLabel = document.getElementById('ch1-q');
    const insValLabel = document.getElementById('ch1-insulation-val');

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        const insulation = parseInt(insulationSlider.value) / 100;
        const currentSpeedMult = 1.0 - (insulation * 0.9); // 10% speed at max insulation
        
        insValLabel.innerText = Math.round(insulation * 100) + '%';
        if (insulation < 0.3) qLabel.innerText = "High";
        else if (insulation < 0.7) qLabel.innerText = "Medium";
        else qLabel.innerText = "Low";

        // Update particles
        for(let i=0; i<particleCount; i++) {
            let data = particleData[i];
            data.progress += data.speed * currentSpeedMult;
            if(data.progress > 1) data.progress = 0;

            // Interpolate from hotbox (-2) to coldbox (2)
            const x = -2 + (4 * data.progress);
            
            // Arch trajectory
            const y = Math.sin(data.progress * Math.PI) * 1.5 + data.offset.y;
            
            dummy.position.set(x, y, data.offset.z);
            
            // Color shifts from hot to cold
            dummy.scale.setScalar(1 - (insulation*0.5));
            dummy.updateMatrix();
            particles.setMatrixAt(i, dummy.matrix);
        }
        particles.instanceMatrix.needsUpdate = true;

        renderer.render(scene, camera);
    }
    animate();
}

// ---------------------------------------------------------
// Chapter 2: 3D Transparent VCRS Engine
// ---------------------------------------------------------
function initCh2() {
    const env = initScene('sim-ch2-desktop', 0x111115);
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(0, 6, 12);

    uiContainer.innerHTML = `
        <h4>Transparent VCRS Loop</h4>
        <div class="sim-stats">
            <span style="color: #ff4444">■</span> High Pres. Gas (Condensing)<br>
            <span style="color: #ffaa00">■</span> High Pres. Liquid<br>
            <span style="color: #44aaff">■</span> Low Pres. Mix (Evaporating)<br>
            <span style="color: #aaaaaa">■</span> Low Pres. Gas
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pl = new THREE.PointLight(0xffffff, 1, 100);
    pl.position.set(0, 5, 5);
    scene.add(pl);

    // Components
    const compMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
    const compBox = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 16), compMat);
    compBox.position.set(-4, -2, 0);
    scene.add(compBox);

    const condBox = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1), new THREE.MeshStandardMaterial({ color: 0xaa2222, transparent: true, opacity: 0.5 }));
    condBox.position.set(-4, 3, 0);
    scene.add(condBox);

    const valveBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xaaaa22 }));
    valveBox.position.set(4, 3, 0);
    scene.add(valveBox);

    const evapBox = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1), new THREE.MeshStandardMaterial({ color: 0x2244aa, transparent: true, opacity: 0.5 }));
    evapBox.position.set(4, -2, 0);
    scene.add(evapBox);

    // Pipes (Paths)
    class Pipe {
        constructor(start, end, colorStart, colorEnd) {
            this.start = start;
            this.end = end;
            this.colorStart = new THREE.Color(colorStart);
            this.colorEnd = new THREE.Color(colorEnd);
            
            // Draw visual pipe
            const pMat = new THREE.MeshPhysicalMaterial({ transmission: 0.9, opacity: 1, metalness: 0, roughness: 0, ior: 1.5, thickness: 0.5 });
            const dist = start.distanceTo(end);
            const pGeom = new THREE.CylinderGeometry(0.2, 0.2, dist, 8);
            const pMesh = new THREE.Mesh(pGeom, pMat);
            pMesh.position.copy(start).lerp(end, 0.5);
            pMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), end.clone().sub(start).normalize());
            scene.add(pMesh);
        }
    }

    const pipes = [
        new Pipe(new THREE.Vector3(-4, -1, 0), new THREE.Vector3(-4, 1.5, 0), 0xff4444, 0xff4444), // Comp to Cond (Hot Gas)
        new Pipe(new THREE.Vector3(-3, 3, 0), new THREE.Vector3(3.5, 3, 0), 0xff4444, 0xffaa00), // Cond to Valve (Liquid)
        new Pipe(new THREE.Vector3(4, 2.5, 0), new THREE.Vector3(4, -0.5, 0), 0x44aaff, 0x44aaff), // Valve to Evap (Mix)
        new Pipe(new THREE.Vector3(3, -2, 0), new THREE.Vector3(-3, -2, 0), 0x44aaff, 0xaaaaaa), // Evap to Comp (Cold Gas)
    ];

    // Flow particles
    const flowParticles = [];
    const sphereGeom = new THREE.SphereGeometry(0.08, 8, 8);
    
    pipes.forEach(pipe => {
        for(let i=0; i<15; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: pipe.colorStart });
            const mesh = new THREE.Mesh(sphereGeom, mat);
            scene.add(mesh);
            flowParticles.push({
                mesh: mesh,
                pipe: pipe,
                progress: Math.random()
            });
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // Rotate compressor
        compBox.rotation.y += 0.05;

        flowParticles.forEach(p => {
            p.progress += 0.01;
            if(p.progress > 1) p.progress = 0;
            p.mesh.position.copy(p.pipe.start).lerp(p.pipe.end, p.progress);
            p.mesh.material.color.copy(p.pipe.colorStart).lerp(p.pipe.colorEnd, p.progress);
        });

        renderer.render(scene, camera);
    }
    animate();
}

// ---------------------------------------------------------
// Chapter 3: Molecular Dynamics Refrigerant Lab
// ---------------------------------------------------------
function initCh3() {
    const env = initScene('sim-ch3-desktop', 0x050510);
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(0, 0, 10);

    uiContainer.innerHTML = `
        <h4>Refrigerant Molecule (R-134a)</h4>
        <div class="sim-controls">
            <label>Temperature (Vibration):
                <input type="range" id="ch3-temp" min="0" max="100" value="20">
            </label>
        </div>
        <div class="sim-stats">
            GWP: 1,430<br>
            ODP: 0
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(5, 5, 5);
    scene.add(dl);

    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);

    // Build R-134a (CH2F-CF3) roughly
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    const fluoroMat = new THREE.MeshStandardMaterial({ color: 0x11cc11, roughness: 0.3 }); // Green for Fluorine
    const hydroMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), carbonMat);
    c1.position.set(-1.2, 0, 0);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), carbonMat);
    c2.position.set(1.2, 0, 0);
    moleculeGroup.add(c1, c2);

    // Connect C1 and C2
    const bond = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.4), new THREE.MeshStandardMaterial({color: 0x888888}));
    bond.rotation.z = Math.PI / 2;
    moleculeGroup.add(bond);

    // Atoms attached
    const atoms = [];
    
    function addAtom(parent, mat, dx, dy, dz) {
        const a = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), mat);
        a.position.set(parent.position.x + dx, parent.position.y + dy, parent.position.z + dz);
        moleculeGroup.add(a);
        
        // Add bond
        const dist = parent.position.distanceTo(a.position);
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, dist), new THREE.MeshStandardMaterial({color: 0x888888}));
        b.position.copy(parent.position).lerp(a.position, 0.5);
        b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), a.position.clone().sub(parent.position).normalize());
        moleculeGroup.add(b);

        atoms.push({ mesh: a, bond: b, basePos: a.position.clone() });
    }

    // C1: 3 Fluorines
    addAtom(c1, fluoroMat, -1, 1, 0);
    addAtom(c1, fluoroMat, -1, -0.5, 0.866);
    addAtom(c1, fluoroMat, -1, -0.5, -0.866);

    // C2: 2 Hydrogens, 1 Fluorine
    addAtom(c2, hydroMat, 1, 1, 0);
    addAtom(c2, hydroMat, 1, -0.5, 0.866);
    addAtom(c2, fluoroMat, 1, -0.5, -0.866);

    const tempSlider = document.getElementById('ch3-temp');

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        moleculeGroup.rotation.y += 0.005;
        moleculeGroup.rotation.x += 0.002;

        const temp = parseInt(tempSlider.value) / 100; // 0 to 1
        const jitter = temp * 0.15;

        // Vibrate atoms
        const time = Date.now() * 0.01;
        atoms.forEach((atom, i) => {
            atom.mesh.position.x = atom.basePos.x + Math.sin(time + i) * jitter;
            atom.mesh.position.y = atom.basePos.y + Math.cos(time + i*2) * jitter;
            atom.mesh.position.z = atom.basePos.z + Math.sin(time + i*3) * jitter;
            
            // Re-orient bonds (simplified approximation)
            // Ideally we'd stretch/rotate the cylinder but for this demo, vibrating the atom alone is visually sufficient
        });

        renderer.render(scene, camera);
    }
    animate();
}

// Run initializers
window.addEventListener('DOMContentLoaded', () => {
    initCh1();
    initCh2();
    initCh3();
});
