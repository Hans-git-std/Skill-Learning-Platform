import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function initScene(containerId, backgroundColor = 0x18181b) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    if (container.clientWidth === 0 || container.clientHeight === 0) return null; 

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
// Chapter 8: AC Cooling Coil / Cooling Tower
// ---------------------------------------------------------
function initCh8() {
    const env = initScene('sim-ch8-desktop', 0x1a2233);
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(0, 5, 15);

    uiContainer.innerHTML = `
        <h4>Evaporative Cooling Tower</h4>
        <div class="sim-controls">
            <label>Fan Speed (Airflow):
                <input type="range" id="ch8-fan" min="1" max="10" value="5">
            </label>
        </div>
        <div class="sim-stats">
            Water Entering: <span style="color:#ff6666">35°C</span><br>
            Water Leaving: <span id="ch8-leaving" style="color:#44aaff">30.0°C</span>
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(5, 10, 5);
    scene.add(dl);

    // Tower Shell (Hyperbolic)
    const points = [];
    for ( let i = 0; i <= 10; i ++ ) {
        points.push( new THREE.Vector2( 2 + Math.cos( (i-5)*0.2 ), i - 5 ) );
    }
    const towerGeo = new THREE.LatheGeometry(points, 32);
    const towerMat = new THREE.MeshStandardMaterial({color: 0x888888, transparent: true, opacity: 0.4, side: THREE.DoubleSide});
    const tower = new THREE.Mesh(towerGeo, towerMat);
    scene.add(tower);

    // Particles (Water falling, Air rising)
    const maxP = 200;
    const waterMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({color: 0x44aaff}), maxP);
    const airMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), new THREE.MeshBasicMaterial({color: 0xdddddd, transparent:true, opacity:0.6}), maxP);
    scene.add(waterMesh);
    scene.add(airMesh);

    const wData = [];
    const aData = [];
    for(let i=0; i<maxP; i++) {
        wData.push({ x: (Math.random()-0.5)*4, y: 5, z: (Math.random()-0.5)*4, speed: 0.05 + Math.random()*0.05 });
        aData.push({ x: (Math.random()-0.5)*4, y: -5, z: (Math.random()-0.5)*4, speed: 0.02 + Math.random()*0.02 });
    }

    const fanSlider = document.getElementById('ch8-fan');
    const leavingTemp = document.getElementById('ch8-leaving');
    const dummy = new THREE.Object3D();

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        const fanSpeed = parseInt(fanSlider.value);
        leavingTemp.innerText = (35 - fanSpeed).toFixed(1) + '°C';

        wData.forEach((p, i) => {
            p.y -= p.speed;
            if(p.y < -5) p.y = 5;
            dummy.position.set(p.x, p.y, p.z);
            dummy.updateMatrix();
            waterMesh.setMatrixAt(i, dummy.matrix);
        });

        aData.forEach((p, i) => {
            p.y += p.speed * (fanSpeed * 0.3);
            if(p.y > 5) p.y = -5;
            dummy.position.set(p.x, p.y, p.z);
            dummy.updateMatrix();
            airMesh.setMatrixAt(i, dummy.matrix);
        });

        waterMesh.instanceMatrix.needsUpdate = true;
        airMesh.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
    }
    animate();
}

// ---------------------------------------------------------
// Chapter 9: Thermal Comfort Avatar & Load Calculator
// ---------------------------------------------------------
function initCh9() {
    const env = initScene('sim-ch9-desktop', 0x222222);
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(0, 2, 8);

    uiContainer.innerHTML = `
        <h4>Human Thermal Comfort</h4>
        <div class="sim-controls">
            <label>Clothing Insulation (Clo): <span id="ch9-clo-val">1.0</span>
                <input type="range" id="ch9-clo" min="0" max="20" value="10">
            </label>
        </div>
        <div class="sim-stats">
            Body State: <span id="ch9-status" style="color:#00ff00">Comfortable</span>
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(0, 5, 5);
    scene.add(dl);

    // Abstract Human Avatar
    const head = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial({color: 0xffccaa}));
    head.position.y = 2.5;
    scene.add(head);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3, 32), new THREE.MeshStandardMaterial({color: 0x44aaff})); // Shirt
    scene.add(body);

    const cloSlider = document.getElementById('ch9-clo');
    const cloVal = document.getElementById('ch9-clo-val');
    const statusVal = document.getElementById('ch9-status');

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        const clo = parseInt(cloSlider.value) / 10;
        cloVal.innerText = clo.toFixed(1);

        // Adjust body color (clothing thickness) based on clo
        // If clo is low (0), they are cold. If clo is high (2.0), they are hot.
        if (clo < 0.5) {
            body.material.color.setHex(0x44aaff); // Blue/cold
            head.material.color.setHex(0xbbddff); // Pale
            statusVal.innerText = 'Shivering (Too Cold)';
            statusVal.style.color = '#44aaff';
            head.position.x = Math.sin(Date.now() * 0.05) * 0.05; // Shivering shake
        } else if (clo > 1.5) {
            body.material.color.setHex(0xff4444); // Red/thick
            head.material.color.setHex(0xff7777); // Flushed
            statusVal.innerText = 'Sweating (Too Hot)';
            statusVal.style.color = '#ff4444';
            head.position.x = 0;
            // Expand body to simulate thick coat
            body.scale.set(1.5, 1, 1.5);
        } else {
            body.material.color.setHex(0x88cc88); // Green/comfortable
            head.material.color.setHex(0xffccaa); // Normal
            statusVal.innerText = 'Comfortable (Neutral)';
            statusVal.style.color = '#00ff00';
            head.position.x = 0;
            body.scale.set(1.1, 1, 1.1);
        }

        renderer.render(scene, camera);
    }
    animate();
}

// ---------------------------------------------------------
// Chapter 10: 3D Reversible Valve Heat Pump (Defrost)
// ---------------------------------------------------------
function initCh10() {
    const env = initScene('sim-ch10-desktop', 0x111115);
    if (!env) return;
    const { scene, camera, renderer, controls, uiContainer } = env;

    camera.position.set(0, 0, 10);

    uiContainer.innerHTML = `
        <h4>Heat Pump Defrost Cycle</h4>
        <div class="sim-controls">
            <label>Coil Frost Level: <span id="ch10-frost-val">0%</span>
                <input type="range" id="ch10-frost" min="0" max="100" value="0">
            </label>
        </div>
        <div style="text-align:center; margin-top:10px;">
            <button id="ch10-btn" class="btn-retro">Initiate Defrost</button>
        </div>
        <div class="sim-stats" style="margin-top:10px;">
            Valve Mode: <span id="ch10-mode" style="color:#ff8800">Heating</span><br>
            Outdoor Coil Temp: <span id="ch10-temp" style="color:#44aaff">-5°C</span>
        </div>
    `;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dl = new THREE.DirectionalLight(0xffffff, 1);
    dl.position.set(0, 5, 10);
    scene.add(dl);

    // Outdoor Coil
    const coilMat = new THREE.MeshStandardMaterial({color: 0x666666});
    const coil = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 1), coilMat);
    scene.add(coil);

    // Frost Shell
    const frostMat = new THREE.MeshStandardMaterial({color: 0xffffff, transparent: true, opacity: 0});
    const frost = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.2, 1.2), frostMat);
    scene.add(frost);

    // Reversing Valve pipe
    const pipeMat = new THREE.MeshStandardMaterial({color: 0xffaa00}); // Orange = hot gas
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 16), pipeMat);
    pipe.position.set(0, 3, 0);
    pipe.rotation.z = Math.PI / 2;
    scene.add(pipe);

    const frostSlider = document.getElementById('ch10-frost');
    const frostVal = document.getElementById('ch10-frost-val');
    const defBtn = document.getElementById('ch10-btn');
    const mode = document.getElementById('ch10-mode');
    const tempVal = document.getElementById('ch10-temp');

    let isDefrosting = false;
    let autoFrost = 0;

    defBtn.addEventListener('click', () => {
        if (isDefrosting) return;
        isDefrosting = true;
        defBtn.style.opacity = '0.5';
        mode.innerText = 'Defrosting (Cooling Mode)';
        mode.style.color = '#00aaff';
        tempVal.innerText = '30°C (Melting)';
        tempVal.style.color = '#ff3300';
        
        pipeMat.color.setHex(0xff3300); 
        
        // Melt ice over 3 seconds
        const meltInterval = setInterval(() => {
            autoFrost -= 2;
            frostSlider.value = autoFrost;
            if (autoFrost <= 0) {
                autoFrost = 0;
                clearInterval(meltInterval);
                isDefrosting = false;
                defBtn.style.opacity = '1';
                mode.innerText = 'Heating Mode Resumed';
                mode.style.color = '#ff8800';
                tempVal.innerText = '-5°C (Freezing)';
                tempVal.style.color = '#44aaff';
                pipeMat.color.setHex(0x44aaff); // Goes back to cold
            }
        }, 50);
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();

        if(!isDefrosting) {
            autoFrost = parseInt(frostSlider.value);
            pipeMat.color.setHex(0x44aaff); // Normal heating mode, outdoor coil is cold
        }

        frostVal.innerText = autoFrost + '%';
        frostMat.opacity = autoFrost / 100; // Ice thickens

        // Gentle throb
        if(isDefrosting) {
            coil.scale.set(1 + Math.sin(Date.now()*0.01)*0.02, 1, 1);
        } else {
            coil.scale.set(1,1,1);
        }

        renderer.render(scene, camera);
    }
    animate();
}

// Run initializers
window.addEventListener('DOMContentLoaded', () => {
    initCh8();
    initCh9();
    initCh10();
});
