import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class MatDesktopSimulators {
    constructor() {
        this.initCh1();
        this.initCh2();
        this.initCh3();
        this.initCh4();
        this.initCh5();
        this.initCh8();
        this.initCh9();
        this.initCh10();
        this.initCh11();
    }

    setupCanvas(containerId, height = 500) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = `${height}px`;
        canvas.style.display = 'block';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const resize = () => {
            const w = container.clientWidth;
            canvas.width = w > 0 ? w : (window.innerWidth < 768 ? window.innerWidth - 40 : 300);
            canvas.height = height;
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        window.addEventListener('resize', resize);
        resize();
        
        return { canvas, ctx, container };
    }

    initCh1() {
        const desktopContainer = document.getElementById('sim-ch1-desktop');
        if(!desktopContainer) return;
        
        const typeSelect = document.getElementById('ch1-type');
        let currentType = typeSelect ? typeSelect.value : 'BCC';
        if (typeSelect) typeSelect.addEventListener('change', (e) => currentType = e.target.value);
        
        let scene, camera, renderer, controls, group;
        const check3D = () => {
            if (scene || desktopContainer.clientWidth === 0) return;
            try {
                scene = new THREE.Scene();
                scene.background = new THREE.Color('#121214');
                camera = new THREE.PerspectiveCamera(45, desktopContainer.clientWidth / 600, 0.1, 100);
                camera.position.set(4, 3, 4);

                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(desktopContainer.clientWidth, 600);
                desktopContainer.appendChild(renderer.domElement);

                controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;

                const light = new THREE.DirectionalLight(0xffffff, 1);
                light.position.set(5, 5, 5);
                scene.add(light);
                scene.add(new THREE.AmbientLight(0x404040));

                group = new THREE.Group();
                scene.add(group);

                const buildLattice = (type) => {
                    while(group.children.length > 0) group.remove(group.children[0]);
                    
                    const material = new THREE.MeshPhongMaterial({ color: 0x0ea5e9, shininess: 100 });
                    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
                    
                    const addAtom = (x, y, z) => {
                        const sphere = new THREE.Mesh(geometry, material);
                        sphere.position.set(x, y, z);
                        group.add(sphere);
                    };

                    for(let x=-1; x<=1; x+=2) {
                        for(let y=-1; y<=1; y+=2) {
                            for(let z=-1; z<=1; z+=2) addAtom(x, y, z);
                        }
                    }

                    if(type === 'BCC') {
                        addAtom(0, 0, 0);
                        material.color.setHex(0xf97316);
                    } else if(type === 'FCC') {
                        addAtom(0, 0, 1); addAtom(0, 0, -1);
                        addAtom(0, 1, 0); addAtom(0, -1, 0);
                        addAtom(1, 0, 0); addAtom(-1, 0, 0);
                        material.color.setHex(0x10b981);
                    } else if(type === 'HCP') {
                        while(group.children.length > 0) group.remove(group.children[0]);
                        material.color.setHex(0x8b5cf6);
                        for(let i=0; i<6; i++) {
                            const angle = (i/6)*Math.PI*2;
                            addAtom(Math.cos(angle)*1.5, -1, Math.sin(angle)*1.5);
                            addAtom(Math.cos(angle)*1.5, 1, Math.sin(angle)*1.5);
                        }
                        addAtom(0, -1, 0); addAtom(0, 1, 0);
                        addAtom(0.5, 0, 0.5); addAtom(-0.5, 0, 0.5); addAtom(0, 0, -0.5);
                    }
                    
                    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2));
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
                    if(type !== 'HCP') group.add(line);
                };

                let lastType = '';
                const animateDesktop = () => {
                    if(lastType !== currentType) {
                        buildLattice(currentType);
                        lastType = currentType;
                    }
                    group.rotation.y += 0.01;
                    group.rotation.x += 0.005;
                    controls.update();
                    renderer.render(scene, camera);
                    requestAnimationFrame(animateDesktop);
                };
                animateDesktop();
            } catch(e) {
                console.warn("WebGL not supported", e);
            }
        };

        check3D();
        window.addEventListener('resize', () => {
            check3D();
            if(scene && desktopContainer.clientWidth > 0) {
                camera.aspect = desktopContainer.clientWidth / 600;
                camera.updateProjectionMatrix();
                renderer.setSize(desktopContainer.clientWidth, 600);
            }
        });
    }

    initCh2() {
        const desktop = this.setupCanvas('sim-ch2-desktop', 400);
        if(!desktop) return;
        
        const btnShear = document.getElementById('ch2-shear');
        const btnReset = document.getElementById('ch2-reset');
        
        let offset = 0;
        let isShearing = false;
        
        if (btnShear) btnShear.addEventListener('click', () => isShearing = true);
        if (btnReset) btnReset.addEventListener('click', () => { isShearing = false; offset = 0; });
        
        const draw = (sim, currentOffset) => {
            const {canvas, ctx} = sim;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const r = 20;
            const sp = 50;
            const rows = 4, cols = 10;
            const startX = (canvas.width - cols*sp)/2 + 20;
            const startY = 100;
            
            const scaledOffset = currentOffset;
            
            for(let row=0; row<rows; row++) {
                for(let col=0; col<cols; col++) {
                    let x = startX + col*sp;
                    let y = startY + row*sp;
                    
                    if(row < 2) x += scaledOffset;
                    
                    ctx.fillStyle = row < 2 ? '#0ea5e9' : '#10b981';
                    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
                }
            }
            
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
            ctx.beginPath(); ctx.moveTo(0, startY + 1.5*sp); ctx.lineTo(canvas.width, startY + 1.5*sp); ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
            ctx.fillText('Slip Plane', 10, startY + 1.5*sp - 10);
        };
        
        const animate = () => {
            if(isShearing && offset < 50) {
                offset += 1;
            } else if(isShearing && offset >= 50) {
                isShearing = false;
                offset = 0;
            }
            if(desktop.container.clientWidth > 0) draw(desktop, offset);
            requestAnimationFrame(animate);
        };
        animate();
    }

    initCh3() {
        const desktop = this.setupCanvas('sim-ch3-desktop', 500);
        if(!desktop) return;
        
        const btnTest = document.getElementById('ch3-test');
        const matSelect = document.getElementById('ch3-mat');
        
        let t = 0;
        let isTesting = false;
        let currentMat = matSelect ? matSelect.value : 'steel';
        
        if (matSelect) matSelect.addEventListener('change', (e) => { currentMat = e.target.value; t = 0; isTesting = false; });
        if (btnTest) btnTest.addEventListener('click', () => { t = 0; isTesting = true; });
        
        const curves = {
            'steel': { E: 5, Y: 100, UTS: 150, frac: 300, color: '#f97316' },
            'aluminum': { E: 2, Y: 50, UTS: 80, frac: 400, color: '#0ea5e9' },
            'glass': { E: 8, Y: 200, UTS: 200, frac: 50, color: '#10b981' }
        };

        const draw = (sim) => {
            const {canvas, ctx} = sim;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const ox = 50, oy = canvas.height - 50;
            const w = canvas.width - 100, h = canvas.height - 100;
            
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(ox, oy-h); ctx.lineTo(ox, oy); ctx.lineTo(ox+w, oy); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
            ctx.fillText('Strain (ε)', ox + w/2, oy + 40);
            ctx.save(); ctx.translate(ox - 30, oy - h/2); ctx.rotate(-Math.PI/2); ctx.fillText('Stress (σ)', 0, 0); ctx.restore();
            
            const mat = curves[currentMat];
            
            ctx.beginPath(); ctx.strokeStyle = mat.color; ctx.lineWidth = 3;
            
            let maxStrain = isTesting ? t : 0;
            if(maxStrain > mat.frac) maxStrain = mat.frac;
            
            for(let s=0; s<=maxStrain; s+=2) {
                let stress = 0;
                if(s < mat.Y / mat.E) {
                    stress = s * mat.E;
                } else if(mat.frac === mat.Y / mat.E) {
                    stress = s * mat.E;
                } else {
                    const plasticStrain = s - (mat.Y / mat.E);
                    const range = mat.frac - (mat.Y / mat.E);
                    stress = mat.Y + (mat.UTS - mat.Y) * Math.sin((plasticStrain / range) * Math.PI);
                }
                
                const x = ox + (s / 500) * w;
                const y = oy - (stress / 250) * h;
                
                if(s===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            if(maxStrain >= mat.frac) {
                ctx.fillStyle = '#ef4444'; ctx.font = '20px sans-serif';
                ctx.fillText('FRACTURE', ox + (mat.frac/500)*w - 40, oy - 20);
            }
            
            if(isTesting && t < mat.frac + 10) t+=2;
        };
        
        const animate = () => {
            if(desktop.container.clientWidth > 0) draw(desktop);
            requestAnimationFrame(animate);
        };
        animate();
    }

    initCh4() {
        const desktop = this.setupCanvas('sim-ch4-desktop', 500);
        if(!desktop) return;
        
        const cInput = document.getElementById('ch4-c');
        const tInput = document.getElementById('ch4-t');
        
        const draw = (sim) => {
            const {canvas, ctx} = sim;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const c = parseFloat(cInput?.value || 0.76);
            const temp = parseFloat(tInput?.value || 727);
            
            const ox = 50, oy = canvas.height - 50;
            const w = canvas.width - 100, h = canvas.height - 100;
            
            ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = 2;
            
            const getX = (pct) => ox + (pct / 2.14) * w;
            const getY = (tmp) => oy - (tmp / 1500) * h;
            
            ctx.beginPath();
            ctx.moveTo(getX(0), getY(912)); ctx.lineTo(getX(0.76), getY(727));
            ctx.lineTo(getX(2.14), getY(1147));
            ctx.moveTo(getX(0), getY(727)); ctx.lineTo(getX(2.14), getY(727));
            ctx.stroke();
            
            ctx.fillStyle = '#a1a1aa'; ctx.font = '14px sans-serif';
            ctx.fillText('Austenite (γ)', getX(0.5), getY(1000));
            ctx.fillText('Ferrite + Pearlite', getX(0.2), getY(500));
            ctx.fillText('Pearlite + Cementite', getX(1.2), getY(500));
            
            const px = getX(c);
            const py = getY(temp);
            
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff';
            
            let phase = 'Austenite';
            if(temp < 727) {
                phase = c < 0.76 ? 'Ferrite + Pearlite' : (c === 0.76 ? '100% Pearlite' : 'Pearlite + Cementite');
            } else if(c > 0.76 && temp < (727 + ((1147-727)/(2.14-0.76))*(c-0.76))) {
                phase = 'Austenite + Cementite';
            } else if(c < 0.76 && temp < (912 - ((912-727)/0.76)*c)) {
                phase = 'Ferrite + Austenite';
            }
            
            ctx.fillText(`C: ${c.toFixed(2)}%, T: ${temp}°C`, px + 10, py - 10);
            ctx.fillStyle = '#0ea5e9'; ctx.font = '20px sans-serif';
            ctx.fillText(`Microstructure: ${phase}`, ox, 30);
        };
        
        const animate = () => {
            if(desktop.container.clientWidth > 0) draw(desktop);
            requestAnimationFrame(animate);
        };
        animate();
    }

    initCh5() {
        const desktopContainer = document.getElementById('sim-ch5-desktop');
        if(!desktopContainer) return;
        
        const btnQuench = document.getElementById('ch5-quench');
        const btnAir = document.getElementById('ch5-air');
        
        let temp = 900;
        let cooling = false;
        let rate = 0;
        let phase = 'Austenite';
        
        if (btnQuench) btnQuench.addEventListener('click', () => { temp = 900; cooling = true; rate = 15; if(blockMesh) blockMesh.position.y = 2; });
        if (btnAir) btnAir.addEventListener('click', () => { temp = 900; cooling = true; rate = 2; if(blockMesh) blockMesh.position.y = 2; });
        
        let scene, camera, renderer, controls, blockMesh, waterMesh, ui;
        
        const check3D = () => {
            if (scene || desktopContainer.clientWidth === 0) return;
            try {
                scene = new THREE.Scene();
                scene.background = new THREE.Color('#121214');
                camera = new THREE.PerspectiveCamera(45, desktopContainer.clientWidth / 600, 0.1, 100);
                camera.position.set(3, 3, 5);

                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(desktopContainer.clientWidth, 600);
                desktopContainer.appendChild(renderer.domElement);

                controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;

                const light = new THREE.DirectionalLight(0xffffff, 1);
                light.position.set(5, 10, 5);
                scene.add(light);
                scene.add(new THREE.AmbientLight(0x404040));

                blockMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 0.8, roughness: 0.2 })
                );
                blockMesh.position.y = 2;
                scene.add(blockMesh);

                waterMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(4, 2, 4),
                    new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.5, transmission: 0.9 })
                );
                waterMesh.position.y = -1.5;
                scene.add(waterMesh);
                
                ui = document.createElement('div');
                ui.style.position = 'absolute'; ui.style.top = '20px'; ui.style.left = '20px';
                ui.style.color = '#fff'; ui.style.background = 'rgba(0,0,0,0.8)'; ui.style.padding = '10px';
                ui.style.borderRadius = '5px'; ui.style.fontFamily = 'monospace';
                desktopContainer.appendChild(ui);
            } catch(e) {
                console.warn("WebGL not supported", e);
            }
        };

        check3D();
        window.addEventListener('resize', () => {
            check3D();
            if(scene && desktopContainer.clientWidth > 0) {
                camera.aspect = desktopContainer.clientWidth / 600;
                camera.updateProjectionMatrix();
                renderer.setSize(desktopContainer.clientWidth, 600);
            }
        });
        
        const animate = () => {
            if(cooling) {
                temp -= rate;
                if(temp <= 25) {
                    temp = 25;
                    cooling = false;
                    phase = rate > 10 ? 'Martensite (Hard, Brittle)' : 'Pearlite (Ductile)';
                }
            }
            
            if (desktopContainer.clientWidth > 0 && scene) {
                let colorHex = 0x10b981; 
                let emInt = 0.0;
                if (temp > 727) {
                    colorHex = 0xf97316;
                    emInt = (temp - 727) / 200;
                } else if (phase.includes('Martensite') || rate > 10) {
                    colorHex = 0x8b5cf6; 
                }
                
                blockMesh.material.color.setHex(colorHex);
                blockMesh.material.emissive.setHex(colorHex);
                blockMesh.material.emissiveIntensity = emInt;
                
                if (waterMesh) waterMesh.visible = (rate > 10);
                
                if(rate > 10 && temp < 900 && temp > 25) {
                    blockMesh.position.y -= 0.1;
                    if(blockMesh.position.y < -0.5) blockMesh.position.y = -0.5;
                } else if (!cooling && temp === 900) {
                    blockMesh.position.y = 2;
                }
                
                ui.innerHTML = `Temp: ${temp.toFixed(0)}°C<br>Phase: ${temp > 727 ? 'Austenite' : phase}`;
                controls.update();
                renderer.render(scene, camera);
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    }

    initCh8() {
        const desktop = this.setupCanvas('sim-ch8-desktop', 400);
        if(!desktop) return;
        
        const tempInput = document.getElementById('ch8-temp');
        
        let chains = [];
        for(let i=0; i<10; i++) {
            let chain = [];
            for(let j=0; j<20; j++) chain.push({x: Math.random()*500, y: Math.random()*300});
            chains.push(chain);
        }
        
        const draw = (sim) => {
            const {canvas, ctx} = sim;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const temp = parseFloat(tempInput?.value || 20);
            const tg = 100;
            const isRubbery = temp > tg;
            const speed = isRubbery ? (temp - tg)/5 : 0.1;
            
            ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
            ctx.fillText(`State: ${isRubbery ? 'Viscoelastic (Rubbery)' : 'Glassy (Rigid)'}`, 20, 40);
            
            chains.forEach((chain, i) => {
                ctx.beginPath();
                let hue = isRubbery ? 20 + i*10 : 200 + i*5; 
                ctx.strokeStyle = `hsl(${hue%360}, 80%, 60%)`;
                ctx.lineWidth = isRubbery ? 5 : 2;
                chain.forEach((p, j) => {
                    p.x += (Math.random()-0.5)*speed*5;
                    p.y += (Math.random()-0.5)*speed*5;
                    if(p.x < 0) p.x = canvas.width; if(p.x > canvas.width) p.x = 0;
                    if(p.y < 0) p.y = canvas.height; if(p.y > canvas.height) p.y = 0;
                    
                    if(j===0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                });
                ctx.stroke();
            });
        };
        
        const animate = () => {
            if(desktop.container.clientWidth > 0) draw(desktop);
            requestAnimationFrame(animate);
        };
        animate();
    }

    initCh9() {
        const desktop = this.setupCanvas('sim-ch9-desktop', 400);
        if(!desktop) return;
        
        const vfInput = document.getElementById('ch9-vf');
        
        const draw = (sim) => {
            const {canvas, ctx} = sim;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const vf = parseFloat(vfInput?.value || 60) / 100;
            const vm = 1 - vf;
            const Ef = 250;
            const Em = 3;
            
            const Ec = Ef * vf + Em * vm; 
            
            ctx.fillStyle = '#27272a';
            ctx.fillRect(50, 100, 200, 200);
            
            ctx.fillStyle = '#0ea5e9';
            const fiberCount = Math.floor(vf * 100);
            const gridSize = 10;
            let drawn = 0;
            
            for(let i=0; i<gridSize; i++) {
                for(let j=0; j<gridSize; j++) {
                    if(drawn < fiberCount) {
                        ctx.beginPath();
                        ctx.arc(60 + j*20, 110 + i*20, 6, 0, Math.PI*2);
                        ctx.fill();
                        drawn++;
                    }
                }
            }
            
            ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
            ctx.fillText(`Matrix Volume: ${(vm*100).toFixed(0)}%`, 300, 140);
            ctx.fillText(`Fiber Volume: ${(vf*100).toFixed(0)}%`, 300, 180);
            ctx.fillStyle = '#10b981';
            ctx.fillText(`Composite Modulus: ${Ec.toFixed(1)} GPa`, 300, 240);
        };
        
        const animate = () => {
            if(desktop.container.clientWidth > 0) draw(desktop);
            requestAnimationFrame(animate);
        };
        animate();
    }

    initCh10() {
        const desktop = this.setupCanvas('sim-ch10-desktop', 400);
        if(!desktop) return;
        
        const envSelect = document.getElementById('ch10-env');
        const zincCheck = document.getElementById('ch10-zinc');
        
        let t = 0;
        const draw = (sim) => {
            const {canvas, ctx} = sim;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const env = envSelect?.value || 'water';
            const zinc = zincCheck?.checked || false;
            const rate = env === 'salt' ? 2 : 0.5;
            
            ctx.fillStyle = env === 'salt' ? 'rgba(14, 165, 233, 0.4)' : 'rgba(14, 165, 233, 0.1)';
            ctx.fillRect(0, 150, canvas.width, canvas.height - 150);
            
            ctx.fillStyle = '#71717a';
            const pipeThick = zinc ? 40 : Math.max(10, 40 - (t * rate * 0.1));
            ctx.fillRect(100, 150, 60, pipeThick);
            ctx.fillText('Steel', 105, 140);
            
            if(zinc) {
                ctx.fillStyle = '#f59e0b';
                const zincThick = Math.max(0, 30 - (t * rate * 0.2));
                ctx.fillRect(250, 150, 40, zincThick);
                ctx.fillText('Zinc', 255, 140);
                
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(130, 140); ctx.lineTo(130, 100); ctx.lineTo(270, 100); ctx.lineTo(270, 140); ctx.stroke();
                
                ctx.fillStyle = '#fbbf24';
                let ex = 270 - (t*2 % 140);
                ctx.beginPath(); ctx.arc(ex, 100, 4, 0, Math.PI*2); ctx.fill();
                
                ctx.fillStyle = '#10b981'; ctx.font = '20px sans-serif';
                ctx.fillText('Cathodic Protection Active', 150, 50);
            } else {
                ctx.fillStyle = '#ef4444'; ctx.font = '20px sans-serif';
                ctx.fillText('Corroding...', 150, 50);
            }
        };
        
        const animate = () => {
            t++;
            if(desktop.container.clientWidth > 0) draw(desktop);
            requestAnimationFrame(animate);
        };
        animate();
    }

    initCh11() {
        const desktop = this.setupCanvas('sim-ch11-desktop', 400);
        if(!desktop) return;
        
        const matSelect = document.getElementById('ch11-mat');
        
        let t = 0;
        const draw = (sim) => {
            const {canvas, ctx} = sim;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const mat = matSelect?.value || 'soft';
            const Hc = mat === 'soft' ? 20 : 80;
            const Br = mat === 'soft' ? 120 : 100;
            
            const ox = canvas.width/2, oy = canvas.height/2;
            
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(canvas.width, oy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, canvas.height); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
            ctx.fillText('H (Field)', canvas.width - 60, oy - 10);
            ctx.fillText('B (Flux)', ox + 10, 20);
            
            ctx.beginPath(); ctx.strokeStyle = mat === 'soft' ? '#0ea5e9' : '#f97316'; ctx.lineWidth = 3;
            for(let ang=0; ang<=Math.PI*2; ang+=0.1) {
                const h = Math.cos(ang) * 150;
                let b;
                if(ang < Math.PI) {
                    b = Math.tanh((h - Hc)/50) * Br;
                } else {
                    b = Math.tanh((h + Hc)/50) * Br;
                }
                if(ang===0) ctx.moveTo(ox + h, oy - b);
                else ctx.lineTo(ox + h, oy - b);
            }
            ctx.stroke();
            
            const H = Math.cos(t*0.05) * 150;
            let B = Math.sin(t*0.05) > 0 ? Math.tanh((H + Hc)/50) * Br : Math.tanh((H - Hc)/50) * Br;
            
            ctx.fillStyle = '#f97316';
            ctx.beginPath(); ctx.arc(ox + H, oy + B, 6, 0, Math.PI*2); ctx.fill();
        };
        
        const animate = () => {
            t++;
            if(desktop.container.clientWidth > 0) draw(desktop);
            requestAnimationFrame(animate);
        };
        animate();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MatDesktopSimulators();
});
