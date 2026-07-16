import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Utility to initialize a basic Three.js scene within a container
function initScene(containerId, backgroundColor = 0x18181b) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    if (container.clientWidth === 0 || container.clientHeight === 0) return null; // Abort if hidden on mobile

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

    window.addEventListener('resize', () => {
        if(container.clientWidth === 0) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    const uiContainer = document.createElement('div');
    uiContainer.className = 'sim-overlay';
    container.appendChild(uiContainer);

    return { scene, camera, renderer, controls, uiContainer, container };
}

// ---------------------------------------------------------
// Chapter 4: VARS Flow Diagram
// ---------------------------------------------------------
function initCh4() {
    const env = initScene('sim-ch4-desktop', 0x111115);
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(0, 0, 15);

    uiContainer.innerHTML = `
        <h4>Ammonia-Water VARS</h4>
        <div class="sim-controls">
            <label>Generator Heat Input:
                <input type="range" id="ch4-heat" min="10" max="100" value="50">
            </label>
        </div>
        <div class="sim-stats">
            <span style="color: #ff33aa">■</span> Strong Solution (NH3 Rich)<br>
            <span style="color: #33aaff">■</span> Weak Solution (H2O Rich)
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(0, 5, 5);
    scene.add(dl);

    // Nodes
    const genBox = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 1), new THREE.MeshStandardMaterial({color: 0xaa3333}));
    genBox.position.set(-4, 3, 0);
    scene.add(genBox);

    const absBox = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 1), new THREE.MeshStandardMaterial({color: 0x3333aa}));
    absBox.position.set(-4, -3, 0);
    scene.add(absBox);

    const pumpBox = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 16), new THREE.MeshStandardMaterial({color: 0xaaaaaa}));
    pumpBox.position.set(-6, 0, 0);
    scene.add(pumpBox);

    // Dynamic Solution Particles
    const particleCount = 60;
    const particles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial(), particleCount);
    scene.add(particles);

    const pData = [];
    for(let i=0; i<particleCount; i++) {
        pData.push({ progress: Math.random() });
    }

    const heatSlider = document.getElementById('ch4-heat');
    const dummy = new THREE.Object3D();
    const colorStrong = new THREE.Color(0xff33aa); // Pink/Purple for NH3 rich
    const colorWeak = new THREE.Color(0x33aaff);   // Blue for H2O rich

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        const heat = parseInt(heatSlider.value) / 100;
        pumpBox.rotation.x += 0.05 + (heat * 0.1); // Pump spins faster with more heat/flow

        pData.forEach((p, i) => {
            p.progress += 0.005 + (heat * 0.01);
            if (p.progress > 1) p.progress = 0;

            let x, y, col;
            if (p.progress < 0.5) {
                // Absorber up to Generator (Strong Solution) via Pump
                const t = p.progress * 2; 
                x = -4 - (2 * Math.sin(t * Math.PI)); // arch to the left
                y = -3 + (6 * t);
                col = colorStrong;
            } else {
                // Generator down to Absorber (Weak Solution) via Valve
                const t = (p.progress - 0.5) * 2;
                x = -4 + (2 * Math.sin(t * Math.PI)); // arch to the right
                y = 3 - (6 * t);
                col = colorWeak;
            }

            dummy.position.set(x, y, 0);
            dummy.updateMatrix();
            particles.setMatrixAt(i, dummy.matrix);
            particles.setColorAt(i, col);
        });

        particles.instanceMatrix.needsUpdate = true;
        particles.instanceColor.needsUpdate = true;

        renderer.render(scene, camera);
    }
    animate();
}

// ---------------------------------------------------------
// Chapter 5: 3D Aircraft Environmental Control
// ---------------------------------------------------------
function initCh5() {
    const env = initScene('sim-ch5-desktop', 0x0a192f); // Deep sky blue
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(5, 5, 10);

    uiContainer.innerHTML = `
        <h4>Bell-Coleman Aircraft ECS</h4>
        <div class="sim-controls">
            <label>Altitude: <span id="ch5-alt-val">30,000 ft</span>
                <input type="range" id="ch5-alt" min="0" max="40000" step="1000" value="30000">
            </label>
        </div>
        <div class="sim-stats">
            Ambient Temp: <span id="ch5-amb">-44°C</span><br>
            Ram Air Pres: <span id="ch5-pres">High</span>
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(10, 10, 10);
    scene.add(dl);

    // Abstract Jet
    const jetGroup = new THREE.Group();
    scene.add(jetGroup);

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 16), new THREE.MeshStandardMaterial({color: 0xcccccc}));
    fuselage.rotation.z = Math.PI / 2;
    jetGroup.add(fuselage);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.5, 16), new THREE.MeshStandardMaterial({color: 0xcccccc}));
    nose.position.x = 2.75;
    nose.rotation.z = -Math.PI / 2;
    jetGroup.add(nose);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 4), new THREE.MeshStandardMaterial({color: 0xaaaaaa}));
    jetGroup.add(wing);

    // Clouds for speed effect
    const cloudGeo = new THREE.BoxGeometry(0.5, 0.2, 0.5);
    const cloudMat = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.3});
    const clouds = [];
    for(let i=0; i<20; i++) {
        const c = new THREE.Mesh(cloudGeo, cloudMat);
        c.position.set((Math.random()-0.5)*20, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
        scene.add(c);
        clouds.push(c);
    }

    const altSlider = document.getElementById('ch5-alt');
    const altVal = document.getElementById('ch5-alt-val');
    const ambVal = document.getElementById('ch5-amb');
    const presVal = document.getElementById('ch5-pres');

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        const alt = parseInt(altSlider.value);
        altVal.innerText = alt.toLocaleString() + ' ft';
        
        // standard lapse rate approx: -2C per 1000ft, starting at 15C
        const temp = Math.round(15 - (alt / 1000) * 2);
        ambVal.innerText = temp + '°C';
        
        if(alt > 30000) presVal.innerText = 'Very Low';
        else if (alt > 15000) presVal.innerText = 'Low';
        else presVal.innerText = 'High (Dense)';

        // Animate clouds to simulate flight
        clouds.forEach(c => {
            c.position.x -= 0.2;
            if(c.position.x < -10) {
                c.position.x = 10;
                c.position.y = (Math.random()-0.5)*10;
            }
        });

        // Turbulence
        jetGroup.position.y = Math.sin(Date.now() * 0.005) * 0.2;

        renderer.render(scene, camera);
    }
    animate();
}

// ---------------------------------------------------------
// Chapter 6: Cascade System Builder
// ---------------------------------------------------------
function initCh6() {
    const env = initScene('sim-ch6-desktop', 0x1a1a1a);
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(0, 0, 12);

    uiContainer.innerHTML = `
        <h4>Cascade System (Dual-Loop)</h4>
        <div class="sim-controls">
            <label>Thermal Load (Heat): <span id="ch6-load-val">50%</span>
                <input type="range" id="ch6-load" min="0" max="100" value="50">
            </label>
        </div>
        <div class="sim-stats">
            <span style="color: #ff4444">■</span> High Temp Cycle (e.g. Ammonia)<br>
            <span style="color: #4444ff">■</span> Low Temp Cycle (e.g. Ethane)<br>
            <strong>Cascade Condenser:</strong> Heat Exchange Zone
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(0, 0, 5);
    scene.add(dl);

    // HT Cycle (Top)
    const htLoop = new THREE.Mesh(new THREE.TorusGeometry(2, 0.2, 16, 50), new THREE.MeshStandardMaterial({color: 0xff4444}));
    htLoop.position.set(0, 3, 0);
    scene.add(htLoop);

    // LT Cycle (Bottom)
    const ltLoop = new THREE.Mesh(new THREE.TorusGeometry(2, 0.2, 16, 50), new THREE.MeshStandardMaterial({color: 0x4444ff}));
    ltLoop.position.set(0, -3, 0);
    scene.add(ltLoop);

    // Cascade Condenser (Middle Overlap)
    const cascadeExchanger = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 1), new THREE.MeshStandardMaterial({color: 0x8844aa, transparent: true, opacity: 0.8}));
    cascadeExchanger.position.set(0, 0, 0);
    scene.add(cascadeExchanger);

    const loadSlider = document.getElementById('ch6-load');
    const loadVal = document.getElementById('ch6-load-val');

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        const load = parseInt(loadSlider.value) / 100;
        loadVal.innerText = (load * 100).toFixed(0) + '%';

        // Rotate loops faster with more load
        htLoop.rotation.y -= 0.01 + (load * 0.05);
        ltLoop.rotation.y += 0.01 + (load * 0.05);

        // Heat changes Cascade Condenser color intensity
        const intensity = 0.5 + (load * 0.5);
        cascadeExchanger.material.color.setRGB(intensity * 0.8, 0.2, intensity);

        // Pulsing visual for heat exchange
        const scale = 1 + Math.sin(Date.now() * 0.005) * (0.05 * load * 2);
        cascadeExchanger.scale.set(scale, scale, scale);

        renderer.render(scene, camera);
    }
    animate();
}

// ---------------------------------------------------------
// Chapter 7: 3D Psychrometric Room
// ---------------------------------------------------------
function initCh7() {
    const env = initScene('sim-ch7-desktop', 0x222222);
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(3, 3, 5);

    uiContainer.innerHTML = `
        <h4>The Psychrometric Room</h4>
        <div class="sim-controls">
            <label>Relative Humidity: <span id="ch7-rh-val">50%</span>
                <input type="range" id="ch7-rh" min="10" max="100" value="50">
            </label>
        </div>
        <div class="sim-stats">
            Window State: <span id="ch7-win-state">Clear</span>
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(-2, 5, 2);
    scene.add(dl);

    // Room Walls
    const wallMat = new THREE.MeshStandardMaterial({color: 0xf5f5dc, side: THREE.BackSide});
    const room = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), wallMat);
    room.position.y = 2;
    scene.add(room);

    // Window
    const winMat = new THREE.MeshPhysicalMaterial({transmission: 0.9, opacity: 1, roughness: 0.1, color: 0xaaaaaa});
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.1), winMat);
    windowMesh.position.set(0, 2, -2.9);
    scene.add(windowMesh);

    const rhSlider = document.getElementById('ch7-rh');
    const rhVal = document.getElementById('ch7-rh-val');
    const winState = document.getElementById('ch7-win-state');

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        const rh = parseInt(rhSlider.value);
        rhVal.innerText = rh + '%';

        // Simulate Fog/Condensation
        if(rh > 90) {
            winMat.roughness = 0.9;
            winState.innerText = "Heavy Condensation (Fog)";
            scene.fog = new THREE.Fog(0xdddddd, 1, 6);
        } else if (rh > 70) {
            winMat.roughness = 0.5;
            winState.innerText = "Fogging Up";
            scene.fog = null;
        } else {
            winMat.roughness = 0.1;
            winState.innerText = "Clear";
            scene.fog = null;
        }

        renderer.render(scene, camera);
    }
    animate();
}

// Run initializers
window.addEventListener('DOMContentLoaded', () => {
    initCh4();
    initCh5();
    initCh6();
    initCh7();
});
