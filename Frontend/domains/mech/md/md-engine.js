/**
 * Machine Design Simulator Engine - Batch 1
 * Chapters 1 - 4
 */

document.addEventListener("DOMContentLoaded", () => {
    // Shared Theme colors
    let colors = getThemeColors();
    window.addEventListener('themeChanged', () => {
        colors = getThemeColors();
    });

    function getThemeColors() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        return {
            bg: isDark ? "#000000" : "#ffffff",
            text: isDark ? "#f8fafc" : "#0f172a",
            grid: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            primary: isDark ? "#ef4444" : "#dc2626", // Red
            secondary: isDark ? "#38bdf8" : "#0284c7", // Blue
            safe: isDark ? "#10b981" : "#059669", // Green
            warning: isDark ? "#f59e0b" : "#d97706"
        };
    }

    // Helper: setup canvas
    function setupCanvas(id) {
        const canvas = document.getElementById(id);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        
        // High DPI setup
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        return { canvas, ctx, width: rect.width, height: rect.height };
    }

    window.addEventListener('resize', () => {
        // Simple reload on resize for canvas bounds
        // In production, might want soft resize, but for this demo a hard reset is fine
        location.reload(); 
    });


    // ==========================================
    // SIMULATOR 1: Tensile Test
    // ==========================================
    const sim1 = setupCanvas('sim1-canvas');
    if (sim1) {
        const materials = {
            steel: { E: 200, Sy: 250, Sut: 400, maxStrain: 0.25, type: 'ductile' },
            aluminum: { E: 70, Sy: 150, Sut: 250, maxStrain: 0.15, type: 'ductile' },
            castiron: { E: 100, Sy: 200, Sut: 200, maxStrain: 0.02, type: 'brittle' }
        };

        let running = false;
        let currentStrain = 0;
        let currentMaterial = materials.steel;
        let history = [];
        let animationId;

        const btnRun = document.getElementById('sim1-run');
        const selMat = document.getElementById('sim1-mat');
        const outStress = document.getElementById('sim1-stress');
        const outStrain = document.getElementById('sim1-strain');
        const outStatus = document.getElementById('sim1-status');

        selMat.addEventListener('change', (e) => {
            currentMaterial = materials[e.target.value];
            resetSim1();
            drawSim1();
        });

        btnRun.addEventListener('click', () => {
            if (running) return;
            resetSim1();
            running = true;
            outStatus.textContent = "Testing...";
            outStatus.style.color = colors.warning;
            loopSim1();
        });

        function resetSim1() {
            running = false;
            currentStrain = 0;
            history = [];
            if(animationId) cancelAnimationFrame(animationId);
            outStress.textContent = "0";
            outStrain.textContent = "0.000";
            outStatus.textContent = "Idle";
            outStatus.style.color = colors.secondary;
        }

        function calculateStress(strain, mat) {
            // Very simplified pseudo-physics curve for Stress-Strain
            const yieldStrain = mat.Sy / mat.E / 1000; // rough scale
            
            if (mat.type === 'brittle') {
                if (strain > mat.maxStrain) return 0; // Broken
                return mat.E * 1000 * strain; // Linear to fracture
            } else {
                if (strain <= yieldStrain) {
                    return mat.E * 1000 * strain; // Linear Elastic
                } else if (strain > mat.maxStrain) {
                    return 0; // Broken
                } else {
                    // Strain hardening to necking
                    const plasticStrain = strain - yieldStrain;
                    const maxPlastic = mat.maxStrain - yieldStrain;
                    const ratio = plasticStrain / maxPlastic;
                    
                    // Parabolic hardening then necking drop
                    const harden = (mat.Sut - mat.Sy) * Math.sin(ratio * Math.PI);
                    return mat.Sy + harden;
                }
            }
        }

        function loopSim1() {
            if (!running) return;
            
            currentStrain += 0.0005; // speed
            const stress = calculateStress(currentStrain, currentMaterial);
            
            if (stress <= 0 && currentStrain > 0.001) {
                // Fractured
                running = false;
                outStatus.textContent = "FRACTURED";
                outStatus.style.color = colors.primary;
                drawSim1();
                return;
            }

            history.push({e: currentStrain, s: stress});
            outStress.textContent = Math.round(stress);
            outStrain.textContent = currentStrain.toFixed(4);

            drawSim1();
            animationId = requestAnimationFrame(loopSim1);
        }

        function drawSim1() {
            const { ctx, width, height } = sim1;
            ctx.clearRect(0, 0, width, height);

            // Layout: Responsive
            let cx, graphX, graphWidth;
            if (width < 768) {
                // Mobile layout
                cx = width * 0.3; 
                graphX = width * 0.6;
                graphWidth = width * 0.35;
            } else {
                // Desktop layout
                cx = Math.max(380, width * 0.4); 
                graphX = Math.max(cx + 100, width * 0.65);
                graphWidth = width - graphX - 40;
            }
            
            // --- Draw Specimen (Pseudo 3D) ---
            const cy = height / 2;
            
            ctx.save();
            ctx.translate(cx, cy);
            
            // Specimen elongation
            const elong = currentStrain * 500;
            const necking = (currentStrain > currentMaterial.Sy/currentMaterial.E/1000 && currentMaterial.type === 'ductile') 
                            ? Math.max(0.4, 1 - (currentStrain * 2)) : 1;
            
            const l0 = 100; // initial length
            const l = l0 + elong;
            const r0 = 20;
            const r = r0 * (running ? necking : 1);

            // Draw grips
            ctx.fillStyle = "#555";
            ctx.fillRect(-30, -l/2 - 40, 60, 40);
            ctx.fillRect(-30, l/2, 60, 40);

            // Draw Dogbone
            ctx.beginPath();
            ctx.moveTo(-r0, -l/2);
            // Neck curve
            const lastStress = history.length > 0 ? history[history.length-1].s : 0;
            if (!running || (currentStrain > 0.001 && lastStress <= 0)) {
                // If fractured
                if (!running && currentStrain > 0) {
                    // Broken
                    ctx.lineTo(-r, -10);
                    ctx.lineTo(r, -10);
                    ctx.lineTo(r0, -l/2);
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(-r, 10);
                    ctx.lineTo(-r0, l/2);
                    ctx.lineTo(r0, l/2);
                    ctx.lineTo(r, 10);
                    ctx.fillStyle = colors.text;
                    ctx.fill();
                } else {
                    ctx.lineTo(-r0, l/2);
                    ctx.lineTo(r0, l/2);
                    ctx.lineTo(r0, -l/2);
                }
            } else {
                ctx.quadraticCurveTo(-r, 0, -r0, l/2);
                ctx.lineTo(r0, l/2);
                ctx.quadraticCurveTo(r, 0, r0, -l/2);
            }
            
            if (running || currentStrain === 0) {
                ctx.fillStyle = currentMaterial.type === 'ductile' ? "#a1a1aa" : "#4b5563"; // Steel vs Cast Iron
                ctx.fill();
            }
            ctx.restore();

            // --- Draw Graph ---
            ctx.save();
            ctx.translate(graphX, height - 40); // Origin at bottom left of graph area
            
            // Axes
            ctx.beginPath();
            ctx.moveTo(0, -(height - 100));
            ctx.lineTo(0, 0);
            ctx.lineTo(graphWidth, 0);
            ctx.strokeStyle = colors.text;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Grid
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 1;
            for(let i=1; i<5; i++) {
                ctx.beginPath(); ctx.moveTo(0, -i*50); ctx.lineTo(graphWidth, -i*50); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(i*(graphWidth/5), 0); ctx.lineTo(i*(graphWidth/5), -(height-100)); ctx.stroke();
            }

            // Labels
            ctx.fillStyle = colors.text;
            ctx.font = "12px monospace";
            ctx.fillText("Strain (ε)", graphWidth - 60, 20);
            ctx.fillText("Stress (MPa)", -40, -(height - 80));

            // Plot curve
            if (history.length > 0) {
                ctx.beginPath();
                const scaleX = graphWidth / (currentMaterial.maxStrain * 1.1);
                const scaleY = (height - 100) / (currentMaterial.Sut * 1.2);
                
                ctx.moveTo(0, 0);
                for(let pt of history) {
                    ctx.lineTo(pt.e * scaleX, -pt.s * scaleY);
                }
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Current point
                const last = history[history.length-1];
                ctx.beginPath();
                ctx.arc(last.e * scaleX, -last.s * scaleY, 6, 0, Math.PI*2);
                ctx.fillStyle = colors.secondary;
                ctx.fill();
            }

            ctx.restore();
        }

        drawSim1();
    }

    // ==========================================
    // SIMULATOR 2: Failure Envelope Explorer
    // ==========================================
    const sim2 = setupCanvas('sim2-canvas');
    if (sim2) {
        const inSx = document.getElementById('sim2-sx');
        const inSy = document.getElementById('sim2-sy');
        const inTxy = document.getElementById('sim2-txy');
        
        const valSx = document.getElementById('sim2-sx-val');
        const valSy = document.getElementById('sim2-sy-val');
        const valTxy = document.getElementById('sim2-txy-val');
        
        const outS1 = document.getElementById('sim2-s1');
        const outS2 = document.getElementById('sim2-s2');
        const outVm = document.getElementById('sim2-vm');
        const outStatus2 = document.getElementById('sim2-status');

        const Sy = 250; // Yield strength

        function updateSim2() {
            const sx = parseFloat(inSx.value);
            const sy = parseFloat(inSy.value);
            const txy = parseFloat(inTxy.value);

            valSx.textContent = sx;
            valSy.textContent = sy;
            valTxy.textContent = txy;

            // Calculate Principals
            const avg = (sx + sy) / 2;
            const diff = (sx - sy) / 2;
            const R = Math.sqrt(diff*diff + txy*txy);
            
            const s1 = avg + R;
            const s2 = avg - R;

            // Von Mises
            const vm = Math.sqrt(s1*s1 - s1*s2 + s2*s2);

            outS1.textContent = s1.toFixed(1);
            outS2.textContent = s2.toFixed(1);
            outVm.textContent = vm.toFixed(1);

            if (vm > Sy) {
                outStatus2.textContent = "YIELD (FAILED)";
                outStatus2.style.color = colors.primary;
            } else {
                outStatus2.textContent = "SAFE";
                outStatus2.style.color = colors.safe;
            }

            drawSim2(s1, s2);
        }

        function drawSim2(s1, s2) {
            const { ctx, width, height } = sim2;
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width/2, height/2 + 50); // Center

            const scale = Math.min(width, height) / 800; // Fit graphs

            // Draw Axes
            ctx.beginPath();
            ctx.moveTo(-400*scale, 0); ctx.lineTo(400*scale, 0); // sA
            ctx.moveTo(0, -300*scale); ctx.lineTo(0, 300*scale); // sB
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = colors.text;
            ctx.font = "14px monospace";
            ctx.fillText("σ_A", 380*scale, -10);
            ctx.fillText("σ_B", 10, -280*scale);

            // Draw Tresca Hexagon
            ctx.beginPath();
            ctx.moveTo(Sy*scale, 0);
            ctx.lineTo(Sy*scale, Sy*scale);
            ctx.lineTo(0, Sy*scale);
            ctx.lineTo(-Sy*scale, 0);
            ctx.lineTo(-Sy*scale, -Sy*scale);
            ctx.lineTo(0, -Sy*scale);
            ctx.closePath();
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();

            // Draw Von Mises Ellipse
            ctx.beginPath();
            ctx.setLineDash([]);
            // Parametric ellipse for s1^2 - s1s2 + s2^2 = Sy^2
            // Rotated by 45 degrees
            const a = Math.sqrt(2) * Sy; // Major axis
            const b = Math.sqrt(2/3) * Sy; // Minor axis
            
            for(let t=0; t<=Math.PI*2; t+=0.05) {
                const x_prime = a * Math.cos(t);
                const y_prime = b * Math.sin(t);
                // Rotate 45 deg
                const x = (x_prime - y_prime) * Math.cos(Math.PI/4) * scale;
                const y = (x_prime + y_prime) * Math.sin(Math.PI/4) * scale;
                if(t===0) ctx.moveTo(x, -y); // Invert y for canvas
                else ctx.lineTo(x, -y);
            }
            ctx.closePath();
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Labels for boundaries
            ctx.fillStyle = colors.secondary;
            ctx.fillText("Tresca", Sy*scale + 10, 20);
            ctx.fillStyle = colors.primary;
            ctx.fillText("Von Mises", Sy*scale + 20, -Sy*scale);

            // Draw Current Point
            ctx.beginPath();
            ctx.arc(s1*scale, -s2*scale, 8, 0, Math.PI*2);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.stroke();

            // Draw line from origin
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(s1*scale, -s2*scale);
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.setLineDash([2,2]);
            ctx.stroke();

            ctx.restore();
        }

        inSx.addEventListener('input', updateSim2);
        inSy.addEventListener('input', updateSim2);
        inTxy.addEventListener('input', updateSim2);
        updateSim2();
    }


    // ==========================================
    // SIMULATOR 3: Fatigue Diagram Builder
    // ==========================================
    const sim3 = setupCanvas('sim3-canvas');
    if (sim3) {
        const inSm = document.getElementById('sim3-sm');
        const inSa = document.getElementById('sim3-sa');
        const valSm = document.getElementById('sim3-sm-val');
        const valSa = document.getElementById('sim3-sa-val');
        const outGoodman = document.getElementById('sim3-goodman');
        const outSoderberg = document.getElementById('sim3-soderberg');
        const outStatus3 = document.getElementById('sim3-status');

        const Sut = 600; // Ultimate
        const Sy = 450;  // Yield
        const Se = 250;  // Endurance limit

        let time = 0;
        let animationId3;

        function updateSim3() {
            const sm = parseFloat(inSm.value);
            const sa = parseFloat(inSa.value);

            valSm.textContent = sm;
            valSa.textContent = sa;

            // FoS Calculations
            const goodmanFoS = 1 / ( (sa/Se) + (sm/Sut) );
            const soderbergFoS = 1 / ( (sa/Se) + (sm/Sy) );

            outGoodman.textContent = goodmanFoS.toFixed(2);
            outSoderberg.textContent = soderbergFoS.toFixed(2);

            if (goodmanFoS < 1) {
                outStatus3.textContent = "FATIGUE FAILURE";
                outStatus3.style.color = colors.primary;
            } else {
                outStatus3.textContent = "INFINITE LIFE";
                outStatus3.style.color = colors.safe;
            }
        }

        function loopSim3() {
            time += 0.05;
            drawSim3();
            animationId3 = requestAnimationFrame(loopSim3);
        }

        function drawSim3() {
            const { ctx, width, height } = sim3;
            ctx.clearRect(0, 0, width, height);

            const sm = parseFloat(inSm.value);
            const sa = parseFloat(inSa.value);

            const padX = width * 0.4; // left side for wave
            
            // --- Left side: Time History Wave ---
            ctx.save();
            ctx.translate(50, height/2 + 50);
            
            // Axis
            ctx.beginPath();
            ctx.moveTo(0, -250); ctx.lineTo(0, 100);
            ctx.moveTo(0, 0); ctx.lineTo(padX - 100, 0);
            ctx.strokeStyle = colors.grid; ctx.stroke();

            ctx.fillStyle = colors.text;
            ctx.fillText("Time", padX - 100, 15);
            ctx.fillText("Stress", -40, -240);

            // Draw Sine Wave
            const scaleY = 0.4;
            ctx.beginPath();
            for(let x=0; x < padX - 100; x++) {
                const y = sm + sa * Math.sin(time + x * 0.05);
                if (x===0) ctx.moveTo(x, -y * scaleY);
                else ctx.lineTo(x, -y * scaleY);
            }
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw mean line
            ctx.beginPath();
            ctx.moveTo(0, -sm * scaleY); ctx.lineTo(padX - 100, -sm * scaleY);
            ctx.strokeStyle = colors.primary; ctx.setLineDash([5,5]); ctx.stroke();
            ctx.restore();

            // --- Right side: Diagram ---
            ctx.save();
            ctx.translate(padX + 50, height - 50);
            const scaleG = (width - padX - 100) / 700;

            // Axis
            ctx.beginPath();
            ctx.moveTo(0, -400*scaleG); ctx.lineTo(0, 0);
            ctx.moveTo(0, 0); ctx.lineTo(700*scaleG, 0);
            ctx.strokeStyle = colors.grid; ctx.setLineDash([]); ctx.stroke();

            ctx.fillStyle = colors.text;
            ctx.fillText("Mean Stress (σ_m)", 550*scaleG, -10);
            ctx.fillText("Alt Stress (σ_a)", -100, -350*scaleG);

            // Points
            // Se = 250 (y-axis)
            // Sy = 450 (x-axis)
            // Sut = 600 (x-axis)

            // Yield Line (Langer)
            ctx.beginPath();
            ctx.moveTo(0, -Sy*scaleG); ctx.lineTo(Sy*scaleG, 0);
            ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke();

            // Soderberg
            ctx.beginPath();
            ctx.moveTo(0, -Se*scaleG); ctx.lineTo(Sy*scaleG, 0);
            ctx.strokeStyle = colors.warning; ctx.stroke();
            ctx.fillStyle = colors.warning;
            ctx.fillText("Soderberg", Sy*scaleG - 60, -10);

            // Goodman
            ctx.beginPath();
            ctx.moveTo(0, -Se*scaleG); ctx.lineTo(Sut*scaleG, 0);
            ctx.strokeStyle = colors.primary; ctx.stroke();
            ctx.fillStyle = colors.primary;
            ctx.fillText("Goodman", Sut*scaleG - 50, -10);

            // Current Operating Point
            ctx.beginPath();
            ctx.arc(sm*scaleG, -sa*scaleG, 6, 0, Math.PI*2);
            ctx.fillStyle = "#fff";
            ctx.fill();

            // Load line
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.lineTo(sm*scaleG, -sa*scaleG);
            ctx.strokeStyle = colors.secondary; ctx.setLineDash([3,3]); ctx.stroke();

            ctx.restore();
        }

        inSm.addEventListener('input', updateSim3);
        inSa.addEventListener('input', updateSim3);
        updateSim3();
        loopSim3();
    }


    // ==========================================
    // SIMULATOR 4: Shaft Stress Heatmap
    // ==========================================
    const sim4 = setupCanvas('sim4-canvas');
    if (sim4) {
        const inM = document.getElementById('sim4-m');
        const inT = document.getElementById('sim4-t');
        const inD = document.getElementById('sim4-d');
        
        const valM = document.getElementById('sim4-m-val');
        const valT = document.getElementById('sim4-t-val');
        const valD = document.getElementById('sim4-d-val');
        
        const outSb = document.getElementById('sim4-sb');
        const outTau = document.getElementById('sim4-tau');
        const outVm = document.getElementById('sim4-vm');

        let rotation = 0;
        let vmMax = 0;

        function updateSim4() {
            const M = parseFloat(inM.value) * 1000; // N-mm
            const T = parseFloat(inT.value) * 1000; // N-mm
            const d = parseFloat(inD.value);

            valM.textContent = parseFloat(inM.value);
            valT.textContent = parseFloat(inT.value);
            valD.textContent = d;

            // Stresses
            const sb = (32 * M) / (Math.PI * Math.pow(d, 3));
            const tau = (16 * T) / (Math.PI * Math.pow(d, 3));
            
            // Von Mises
            const vm = Math.sqrt(Math.pow(sb, 2) + 3 * Math.pow(tau, 2));
            vmMax = vm;

            outSb.textContent = sb.toFixed(1);
            outTau.textContent = tau.toFixed(1);
            outVm.textContent = vm.toFixed(1);
            
            if(vm > 300) outVm.style.color = colors.primary; // Danger
            else outVm.style.color = colors.safe;
        }

        function getHeatmapColor(val, maxVal) {
            // Map 0 -> maxVal to Blue -> Green -> Red
            let ratio = val / maxVal;
            if (ratio > 1) ratio = 1;
            // HSL: 240 (Blue) to 0 (Red)
            const h = (1 - ratio) * 240;
            return `hsl(${h}, 100%, 50%)`;
        }

        function loopSim4() {
            rotation += 0.02;
            drawSim4();
            requestAnimationFrame(loopSim4);
        }

        function drawSim4() {
            const { ctx, width, height } = sim4;
            ctx.clearRect(0, 0, width, height);

            const d = parseFloat(inD.value);
            const radius = d * 1.5; // Visual scale
            const length = 400;

            ctx.save();
            ctx.translate(width/2, height/2 + 50);

            // Pseudo 3D Isometric Projection
            // Rotate the cylinder
            const angleX = 0.3; // Pitch
            const angleY = rotation; // Yaw

            // Draw Heatmap Cylinder
            const segments = 40;
            for(let i=0; i<segments; i++) {
                const x = -length/2 + (i/segments)*length;
                const nextX = -length/2 + ((i+1)/segments)*length;
                
                // Color based on Von Mises (constant across length for this basic loading, 
                // but we will make it highest in center to simulate bending moment diagram)
                const normalizedX = (x + length/2) / length; 
                // Bending moment is usually parabolic, max in middle
                const localFactor = Math.sin(normalizedX * Math.PI); 
                
                // Apply local factor to bending, torsion is constant
                const M = parseFloat(inM.value) * 1000 * localFactor;
                const T = parseFloat(inT.value) * 1000;
                const localSb = (32 * M) / (Math.PI * Math.pow(d, 3));
                const localTau = (16 * T) / (Math.PI * Math.pow(d, 3));
                const localVm = Math.sqrt(Math.pow(localSb, 2) + 3 * Math.pow(localTau, 2));

                ctx.fillStyle = getHeatmapColor(localVm, 400); // 400 MPa scale max
                ctx.beginPath();
                // Draw a 3D isometric slice
                // Simplified 2D projection of cylinder
                ctx.fillRect(x, -radius, length/segments + 1, radius*2);
            }

            // Draw grid lines to show rotation
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.lineWidth = 1;
            for(let a=0; a<Math.PI*2; a+=Math.PI/4) {
                const y = Math.sin(a + rotation) * radius;
                // Only draw front half
                if (Math.cos(a + rotation) > 0) {
                    ctx.beginPath();
                    ctx.moveTo(-length/2, y);
                    ctx.lineTo(length/2, y);
                    ctx.stroke();
                }
            }

            // Draw End caps
            ctx.fillStyle = "#333";
            ctx.beginPath();
            ctx.ellipse(-length/2, 0, 10, radius, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.ellipse(length/2, 0, 10, radius, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();

            // Legend
            ctx.restore();
            ctx.save();
            ctx.translate(width - 150, height - 150);
            const grad = ctx.createLinearGradient(0, 100, 0, 0);
            grad.addColorStop(0, "hsl(240, 100%, 50%)"); // Blue (0 MPa)
            grad.addColorStop(0.5, "hsl(120, 100%, 50%)"); // Green (200 MPa)
            grad.addColorStop(1, "hsl(0, 100%, 50%)"); // Red (400+ MPa)
            ctx.fillStyle = grad;
            ctx.fillRect(0,0, 20, 100);
            ctx.fillStyle = colors.text;
            ctx.font = "12px sans-serif";
            ctx.fillText("400+ MPa", 30, 10);
            ctx.fillText("0 MPa", 30, 100);
            ctx.restore();
        }

        inM.addEventListener('input', updateSim4);
        inT.addEventListener('input', updateSim4);
        inD.addEventListener('input', updateSim4);
        
        updateSim4();
        loopSim4();
    }

    // ==========================================
    // SIMULATOR 5: Power Screw Lifting
    // ==========================================
    const sim5 = setupCanvas('sim5-canvas');
    if (sim5) {
        const inW = document.getElementById('sim5-w');
        const inDm = document.getElementById('sim5-d');
        const inMu = document.getElementById('sim5-mu');
        const valW = document.getElementById('sim5-w-val');
        const valDm = document.getElementById('sim5-d-val');
        const valMu = document.getElementById('sim5-mu-val');
        const outTr = document.getElementById('sim5-tr');
        const outEff = document.getElementById('sim5-eff');
        const outStatus5 = document.getElementById('sim5-status');

        let rotAngle = 0;
        let liftPos = 0;

        function updateSim5() {
            const W = parseFloat(inW.value);
            const dm = parseFloat(inDm.value);
            const mu = parseFloat(inMu.value);

            valW.textContent = W;
            valDm.textContent = dm;
            valMu.textContent = mu.toFixed(2);

            const pitch = 5; // standard 5mm pitch
            const alpha = Math.atan(pitch / (Math.PI * dm));
            const phi = Math.atan(mu);

            const Tr = (W * (dm / 1000) / 2) * Math.tan(alpha + phi); // N-m
            const eff = Math.tan(alpha) / Math.tan(alpha + phi) * 100;

            outTr.textContent = Tr.toFixed(1);
            outEff.textContent = eff.toFixed(1);

            if (alpha <= phi) {
                outStatus5.textContent = "SELF-LOCKING";
                outStatus5.style.color = colors.safe;
            } else {
                outStatus5.textContent = "BACK-DRIVING (DANGER)";
                outStatus5.style.color = colors.primary;
            }
        }

        function loopSim5() {
            rotAngle += 0.05;
            liftPos = Math.sin(rotAngle * 0.2) * 40; // Simulate lifting up and down
            drawSim5();
            requestAnimationFrame(loopSim5);
        }

        function drawSim5() {
            const { ctx, width, height } = sim5;
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width/2 + 50, height/2 + 50);

            const dm = parseFloat(inDm.value);
            const r = dm * 1.5;

            // Draw screw shaft
            ctx.fillStyle = "#555";
            ctx.fillRect(-r, -150, r*2, 300);

            // Draw threads (angled lines)
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 4;
            const pitchVis = 15;
            const offset = (rotAngle * 10) % pitchVis;
            for(let y = -150; y < 150; y += pitchVis) {
                ctx.beginPath();
                ctx.moveTo(-r, y + offset);
                ctx.lineTo(r, y + offset + 10);
                ctx.stroke();
            }

            // Draw Nut/Block
            ctx.fillStyle = "rgba(56, 189, 248, 0.8)"; // Tech blue block
            ctx.fillRect(-r-20, liftPos - 20, r*2 + 40, 40);
            
            // Draw Load Arrow
            ctx.beginPath();
            ctx.moveTo(0, liftPos - 20);
            ctx.lineTo(0, liftPos - 70);
            ctx.lineTo(-10, liftPos - 60);
            ctx.moveTo(0, liftPos - 70);
            ctx.lineTo(10, liftPos - 60);
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = colors.primary;
            ctx.font = "16px sans-serif";
            ctx.fillText("Load (W)", 15, liftPos - 50);

            ctx.restore();
        }

        inW.addEventListener('input', updateSim5);
        inDm.addEventListener('input', updateSim5);
        inMu.addEventListener('input', updateSim5);
        updateSim5();
        loopSim5();
    }


    // ==========================================
    // SIMULATOR 6: Eccentric Rivet Vector Analyzer
    // ==========================================
    const sim6 = setupCanvas('sim6-canvas');
    if (sim6) {
        const inP = document.getElementById('sim6-p');
        const inE = document.getElementById('sim6-e');
        const valP = document.getElementById('sim6-p-val');
        const valE = document.getElementById('sim6-e-val');
        const outP1 = document.getElementById('sim6-p1');
        const outP2 = document.getElementById('sim6-p2');
        const outR = document.getElementById('sim6-r');

        function updateSim6() {
            const P = parseFloat(inP.value);
            const e = parseFloat(inE.value);
            valP.textContent = P;
            valE.textContent = e;

            // 4 Rivets in a square, 100mm apart
            const x = 50; const y = 50;
            const r_dist = Math.sqrt(x*x + y*y); // 70.7mm
            const sum_r2 = 4 * (r_dist * r_dist);

            const P1 = P / 4; // Primary shear (down)
            
            // Moment
            const M = P * e;
            const P2 = (M * r_dist) / sum_r2; // Secondary shear

            // Resultant on top right rivet (angle between P1 and P2 is acute)
            // P1 is straight down (270 deg). P2 is perpendicular to radius.
            // Radius is at 45 deg, so P2 is at 315 deg.
            // Angle between them is 45 degrees.
            const cosTheta = Math.cos(45 * Math.PI / 180);
            const R = Math.sqrt(P1*P1 + P2*P2 + 2*P1*P2*cosTheta);

            outP1.textContent = P1.toFixed(1);
            outP2.textContent = P2.toFixed(1);
            outR.textContent = R.toFixed(1);

            drawSim6(P, e, P1, P2, R);
        }

        function drawSim6(P, e, P1, P2, R) {
            const { ctx, width, height } = sim6;
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width/2 - 100, height/2);

            // Draw Plate
            ctx.fillStyle = "rgba(100, 116, 139, 0.3)";
            ctx.fillRect(-100, -100, 200 + e, 200);

            // Center of Gravity
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI*2);
            ctx.fillStyle = colors.text;
            ctx.fill();

            // Draw Rivets
            const rivets = [
                {x: 50, y: -50, crit: true}, {x: -50, y: -50},
                {x: 50, y: 50}, {x: -50, y: 50}
            ];

            for(let rv of rivets) {
                ctx.beginPath();
                ctx.arc(rv.x, rv.y, 10, 0, Math.PI*2);
                ctx.fillStyle = rv.crit ? colors.primary : "#555";
                ctx.fill();

                if(rv.crit) {
                    // Draw Vectors on Critical Rivet
                    // Primary (Down)
                    ctx.beginPath();
                    ctx.moveTo(rv.x, rv.y);
                    ctx.lineTo(rv.x, rv.y + P1*2);
                    ctx.strokeStyle = colors.secondary;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Secondary (Tangential 315 deg)
                    const p2x = P2 * 2 * Math.cos(-Math.PI/4);
                    const p2y = P2 * 2 * Math.sin(-Math.PI/4);
                    ctx.beginPath();
                    ctx.moveTo(rv.x, rv.y);
                    ctx.lineTo(rv.x + p2x, rv.y + p2y);
                    ctx.strokeStyle = colors.warning;
                    ctx.stroke();

                    // Resultant
                    ctx.beginPath();
                    ctx.moveTo(rv.x, rv.y);
                    ctx.lineTo(rv.x + p2x, rv.y + P1*2 + p2y);
                    ctx.strokeStyle = colors.primary;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }

            // Draw Applied Load P
            ctx.beginPath();
            ctx.moveTo(e, 0);
            ctx.lineTo(e, 50);
            ctx.lineTo(e-5, 40);
            ctx.moveTo(e, 50);
            ctx.lineTo(e+5, 40);
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.fillStyle = colors.primary;
            ctx.fillText("Load P", e + 10, 25);

            ctx.restore();
        }

        inP.addEventListener('input', updateSim6);
        inE.addEventListener('input', updateSim6);
        updateSim6();
    }

    // ==========================================
    // SIMULATOR 7: Helical Spring
    // ==========================================
    const sim7 = setupCanvas('sim7-canvas');
    if (sim7) {
        const inF = document.getElementById('sim7-f');
        const inD_wire = document.getElementById('sim7-d');
        const inD_coil = document.getElementById('sim7-D');
        const valF = document.getElementById('sim7-f-val');
        const valD_wire = document.getElementById('sim7-d-val');
        const valD_coil = document.getElementById('sim7-D-val');
        const outKw = document.getElementById('sim7-kw');
        const outTau = document.getElementById('sim7-tau');
        const outDef = document.getElementById('sim7-def');

        let time7 = 0;

        function updateSim7() {
            const F = parseFloat(inF.value);
            const d = parseFloat(inD_wire.value);
            const D = parseFloat(inD_coil.value);

            valF.textContent = F;
            valD_wire.textContent = d;
            valD_coil.textContent = D;

            const C = D / d;
            const Kw = ((4*C - 1)/(4*C - 4)) + (0.615/C);
            const tau = Kw * (8 * F * D) / (Math.PI * Math.pow(d, 3));
            
            const G = 79300; // MPa for steel
            const Na = 10;
            const def = (8 * F * Math.pow(D, 3) * Na) / (G * Math.pow(d, 4));

            outKw.textContent = Kw.toFixed(2);
            outTau.textContent = tau.toFixed(1);
            outDef.textContent = def.toFixed(2);
            
            if(tau > 500) outTau.style.color = colors.primary;
            else outTau.style.color = colors.text;
        }

        function loopSim7() {
            time7 += 0.1;
            drawSim7();
            requestAnimationFrame(loopSim7);
        }

        function drawSim7() {
            const { ctx, width, height } = sim7;
            ctx.clearRect(0, 0, width, height);
            
            ctx.save();
            ctx.translate(width/2 + 50, 50);

            const F = parseFloat(inF.value);
            const d = parseFloat(inD_wire.value);
            const D = parseFloat(inD_coil.value);
            
            const G = 79300;
            const def = (8 * F * Math.pow(D, 3) * 10) / (G * Math.pow(d, 4));
            
            // Base length
            const L0 = 300;
            const L_current = Math.max(50, L0 - def * 3); // Visual scale

            // Draw spring
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const coils = 10;
            for(let i=0; i<=100; i++) {
                const t = i/100;
                const x = Math.sin(t * coils * Math.PI * 2) * (D * 1.5);
                const y = t * L_current;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = colors.text;
            ctx.lineWidth = d * 1.5;
            ctx.lineJoin = "round";
            ctx.stroke();

            // Draw force plate
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(-D*2, L_current, D*4, 10);
            
            // Force Arrow
            if (F > 0) {
                ctx.beginPath();
                ctx.moveTo(0, L_current - 50);
                ctx.lineTo(0, L_current);
                ctx.lineTo(-10, L_current - 10);
                ctx.moveTo(0, L_current);
                ctx.lineTo(10, L_current - 10);
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 4;
                ctx.stroke();
            }

            ctx.restore();
        }

        inF.addEventListener('input', updateSim7);
        inD_wire.addEventListener('input', updateSim7);
        inD_coil.addEventListener('input', updateSim7);
        updateSim7();
        loopSim7();
    }

    // ==========================================
    // SIMULATOR 8: Hydrodynamic Bearing
    // ==========================================
    const sim8 = setupCanvas('sim8-canvas');
    if (sim8) {
        const inN = document.getElementById('sim8-n');
        const inP = document.getElementById('sim8-p');
        const valN = document.getElementById('sim8-n-val');
        const valP = document.getElementById('sim8-p-val');
        const outS = document.getElementById('sim8-s');
        const outH0 = document.getElementById('sim8-h0');
        const outStatus = document.getElementById('sim8-status');

        let rot8 = 0;

        function updateSim8() {
            const Ns = parseFloat(inN.value) / 60; // Rev/s
            const P = parseFloat(inP.value);
            
            valN.textContent = parseFloat(inN.value);
            valP.textContent = P;

            // Simplified Sommerfeld
            // r/c = 1000, mu = 0.05 Pa-s
            const S = (1000 * 1000) * (0.05 * Ns) / (P * 1000); // Scaled pseudo-number
            
            outS.textContent = S.toFixed(3);
            
            // Film thickness relates to S. Low S = low film
            const h0 = Math.max(0, S * 15); 
            outH0.textContent = h0.toFixed(1);

            if (h0 < 1.0) {
                outStatus.textContent = "BOUNDARY (RUBBING)";
                outStatus.style.color = colors.primary;
            } else {
                outStatus.textContent = "HYDRODYNAMIC LIFT";
                outStatus.style.color = colors.safe;
            }
        }

        function loopSim8() {
            const N = parseFloat(inN.value);
            rot8 += (N / 1500) * 0.1; // visual rotation speed
            drawSim8();
            requestAnimationFrame(loopSim8);
        }

        function drawSim8() {
            const { ctx, width, height } = sim8;
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width/2 + 50, height/2);

            const R_bearing = 150;
            const R_shaft = 140;
            const clearance = R_bearing - R_shaft; // 10px visual

            const Ns = parseFloat(inN.value) / 60;
            const P = parseFloat(inP.value);
            const S = (1000 * 1000) * (0.05 * Ns) / (P * 1000);
            
            // Eccentricity ratio (epsilon) approaches 1 as S approaches 0
            const epsilon = Math.min(0.99, 1 / (1 + S * 5));
            const ex = -epsilon * clearance * Math.sin(Math.PI/4); // offset left/down
            const ey = epsilon * clearance * Math.cos(Math.PI/4);

            // Draw Oil Film (gradient wedge)
            const grad = ctx.createRadialGradient(ex, ey, R_shaft, 0, 0, R_bearing);
            grad.addColorStop(0, "rgba(255, 200, 0, 0.8)"); // High pressure wedge
            grad.addColorStop(1, "rgba(50, 150, 250, 0.2)"); // Low pressure
            
            ctx.beginPath();
            ctx.arc(0, 0, R_bearing, 0, Math.PI*2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw Shaft
            ctx.beginPath();
            ctx.arc(ex, ey, R_shaft, 0, Math.PI*2);
            ctx.fillStyle = colors.bg;
            ctx.fill();
            ctx.strokeStyle = colors.text;
            ctx.stroke();

            // Draw shaft cross to show rotation
            ctx.beginPath();
            ctx.moveTo(ex + Math.cos(rot8)*R_shaft, ey + Math.sin(rot8)*R_shaft);
            ctx.lineTo(ex - Math.cos(rot8)*R_shaft, ey - Math.sin(rot8)*R_shaft);
            ctx.moveTo(ex + Math.cos(rot8+Math.PI/2)*R_shaft, ey + Math.sin(rot8+Math.PI/2)*R_shaft);
            ctx.lineTo(ex - Math.cos(rot8+Math.PI/2)*R_shaft, ey - Math.sin(rot8+Math.PI/2)*R_shaft);
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Warning spark if rubbing
            if(epsilon > 0.95) {
                ctx.beginPath();
                ctx.arc(ex + Math.cos(Math.PI/4)*R_shaft, ey + Math.sin(Math.PI/4)*R_shaft, 15, 0, Math.PI*2);
                ctx.fillStyle = colors.primary;
                ctx.fill();
            }

            ctx.restore();
        }

        inN.addEventListener('input', updateSim8);
        inP.addEventListener('input', updateSim8);
        updateSim8();
        loopSim8();
    }

    // ==========================================
    // SIMULATOR 9: Gear Drives
    // ==========================================
    const sim9 = setupCanvas('sim9-canvas');
    if (sim9) {
        const inNp = document.getElementById('sim9-np');
        const inNg = document.getElementById('sim9-ng');
        const inM = document.getElementById('sim9-m');
        const valNp = document.getElementById('sim9-np-val');
        const valNg = document.getElementById('sim9-ng-val');
        const valM = document.getElementById('sim9-m-val');
        const outDp = document.getElementById('sim9-dp');
        const outDg = document.getElementById('sim9-dg');
        const outStatus = document.getElementById('sim9-status');

        let rot9 = 0;

        function updateSim9() {
            const Np = parseInt(inNp.value);
            const Ng = parseInt(inNg.value);
            const m = parseFloat(inM.value);

            valNp.textContent = Np;
            valNg.textContent = Ng;
            valM.textContent = m;

            const dp = Np * m;
            const dg = Ng * m;

            outDp.textContent = dp.toFixed(1);
            outDg.textContent = dg.toFixed(1);

            if (Np < 18) {
                outStatus.textContent = "INTERFERENCE (N < 18)";
                outStatus.style.color = colors.primary;
            } else {
                outStatus.textContent = "MESH OK";
                outStatus.style.color = colors.safe;
            }
        }

        function loopSim9() {
            rot9 += 0.02;
            drawSim9();
            requestAnimationFrame(loopSim9);
        }

        function drawSim9() {
            const { ctx, width, height } = sim9;
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width/2 + 50, height/2);

            const Np = parseInt(inNp.value);
            const Ng = parseInt(inNg.value);
            const m = parseFloat(inM.value);

            const dp = Np * m;
            const dg = Ng * m;
            const C = (dp + dg) / 2;

            // Visual scaling so it fits on screen
            const scale = Math.min(150 / dp, 200 / dg, 1.5);

            // Draw Pinion (Left)
            ctx.save();
            ctx.translate(-C * scale / 2, 0);
            ctx.rotate(rot9);
            drawGear(ctx, dp * scale / 2, Np, colors.secondary);
            ctx.restore();

            // Draw Gear (Right)
            ctx.save();
            ctx.translate(C * scale / 2, 0);
            // Gear ratio determines rotation speed and direction
            const ratio = Np / Ng;
            // Add phase offset so teeth mesh (roughly)
            ctx.rotate(-rot9 * ratio + Math.PI / Ng);
            drawGear(ctx, dg * scale / 2, Ng, colors.text);
            ctx.restore();

            ctx.restore();
        }

        function drawGear(ctx, R, N, color) {
            ctx.beginPath();
            const toothDepth = R * 0.15;
            for (let i = 0; i < N * 2; i++) {
                const angle = (i * Math.PI) / N;
                const r = i % 2 === 0 ? R + toothDepth : R - toothDepth;
                if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
                else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
            }
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Pitch circle
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = colors.grid;
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Hub
            ctx.beginPath();
            ctx.arc(0, 0, R * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = colors.bg;
            ctx.fill();
            ctx.stroke();
        }

        inNp.addEventListener('input', updateSim9);
        inNg.addEventListener('input', updateSim9);
        inM.addEventListener('input', updateSim9);
        updateSim9();
        loopSim9();
    }

    // ==========================================
    // SIMULATOR 10: Clutches
    // ==========================================
    const sim10 = setupCanvas('sim10-canvas');
    if (sim10) {
        const inRi = document.getElementById('sim10-ri');
        const inRo = document.getElementById('sim10-ro');
        const inF = document.getElementById('sim10-f');
        const valRi = document.getElementById('sim10-ri-val');
        const valRo = document.getElementById('sim10-ro-val');
        const valF = document.getElementById('sim10-f-val');
        const outTuw = document.getElementById('sim10-tuw');
        const outTup = document.getElementById('sim10-tup');
        const outDiff = document.getElementById('sim10-diff');

        let rot10 = 0;

        function updateSim10() {
            const ri = parseFloat(inRi.value);
            const ro = Math.max(ri + 10, parseFloat(inRo.value)); // Ensure ro > ri
            inRo.value = ro;
            const F = parseFloat(inF.value);
            const mu = 0.3; // standard clutch friction

            valRi.textContent = ri;
            valRo.textContent = ro;
            valF.textContent = F;

            const ri_m = ri / 1000;
            const ro_m = ro / 1000;

            const Tuw = mu * F * ((ro_m + ri_m) / 2);
            const Tup = (2/3) * mu * F * ((Math.pow(ro_m, 3) - Math.pow(ri_m, 3)) / (Math.pow(ro_m, 2) - Math.pow(ri_m, 2)));

            outTuw.textContent = Tuw.toFixed(1);
            outTup.textContent = Tup.toFixed(1);

            const diff = ((Tup - Tuw) / Tuw) * 100;
            outDiff.textContent = diff.toFixed(1);
        }

        function loopSim10() {
            rot10 += 0.05;
            drawSim10();
            requestAnimationFrame(loopSim10);
        }

        function drawSim10() {
            const { ctx, width, height } = sim10;
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width/2 + 50, height/2);

            const ri = parseFloat(inRi.value);
            const ro = parseFloat(inRo.value);

            // Draw friction disk (isometric tilt)
            ctx.scale(1, 0.4);

            // Shadow/thickness
            ctx.beginPath();
            ctx.arc(0, 20, ro, 0, Math.PI*2);
            ctx.fillStyle = "#333";
            ctx.fill();

            // Face
            ctx.beginPath();
            ctx.arc(0, 0, ro, 0, Math.PI*2);
            ctx.arc(0, 0, ri, 0, Math.PI*2, true); // counter-clockwise for hole
            ctx.fillStyle = "rgba(100, 116, 139, 0.8)";
            ctx.fill();
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw heat/wear gradient on the face
            const grad = ctx.createRadialGradient(0,0,ri, 0,0,ro);
            grad.addColorStop(0, "rgba(239, 68, 68, 0.1)"); // inner
            grad.addColorStop(1, "rgba(239, 68, 68, 0.6)"); // outer wears faster initially
            ctx.beginPath();
            ctx.arc(0, 0, ro, 0, Math.PI*2);
            ctx.arc(0, 0, ri, 0, Math.PI*2, true);
            ctx.fillStyle = grad;
            ctx.fill();

            // Spinning markers
            ctx.rotate(rot10);
            ctx.beginPath();
            ctx.moveTo(ri, 0); ctx.lineTo(ro, 0);
            ctx.moveTo(-ri, 0); ctx.lineTo(-ro, 0);
            ctx.moveTo(0, ri); ctx.lineTo(0, ro);
            ctx.moveTo(0, -ri); ctx.lineTo(0, -ro);
            ctx.strokeStyle = colors.bg;
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.restore();
        }

        inRi.addEventListener('input', updateSim10);
        inRo.addEventListener('input', updateSim10);
        inF.addEventListener('input', updateSim10);
        updateSim10();
        loopSim10();
    }

    // ==========================================
    // SIMULATOR 11: Belt Drives
    // ==========================================
    const sim11 = setupCanvas('sim11-canvas');
    if (sim11) {
        const inV = document.getElementById('sim11-v');
        const inTmax = document.getElementById('sim11-t');
        const inM = document.getElementById('sim11-m');
        const valV = document.getElementById('sim11-v-val');
        const valTmax = document.getElementById('sim11-t-val');
        const valM = document.getElementById('sim11-m-val');
        const outTc = document.getElementById('sim11-tc');
        const outP = document.getElementById('sim11-p');
        const outStatus = document.getElementById('sim11-status');

        let rot11 = 0;

        function updateSim11() {
            const v = parseFloat(inV.value);
            const Tmax = parseFloat(inTmax.value);
            const m = parseFloat(inM.value);

            valV.textContent = v;
            valTmax.textContent = Tmax;
            valM.textContent = m.toFixed(1);

            const Tc = m * v * v;
            outTc.textContent = Math.round(Tc);

            if (Tc >= Tmax) {
                outP.textContent = "0.00";
                outStatus.textContent = "SLIPPING (Tc > Tmax)";
                outStatus.style.color = colors.primary;
            } else {
                const T1 = Tmax - Tc;
                // Assume T1/T2 = e^(mu*theta) = 3 for a standard belt
                const T2 = T1 / 3;
                const P = (T1 - T2) * v / 1000; // kW
                outP.textContent = P.toFixed(2);
                
                if (Tc > Tmax * 0.8) {
                    outStatus.textContent = "WARNING: HIGH FLUTTER";
                    outStatus.style.color = colors.warning;
                } else {
                    outStatus.textContent = "SOLID GRIP";
                    outStatus.style.color = colors.safe;
                }
            }
        }

        function loopSim11() {
            const v = parseFloat(inV.value);
            rot11 += v * 0.01;
            drawSim11();
            requestAnimationFrame(loopSim11);
        }

        function drawSim11() {
            const { ctx, width, height } = sim11;
            ctx.clearRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width/2 + 50, height/2);

            const R = 80;
            const dist = 200;

            const v = parseFloat(inV.value);
            const Tmax = parseFloat(inTmax.value);
            const m = parseFloat(inM.value);
            const Tc = m * v * v;
            
            // Belt flutter amount based on Tc
            const flutter = Math.min(40, Math.max(0, (Tc / Tmax) * 40));
            const randomFlutter = (Math.random() - 0.5) * flutter;

            // Draw Pulleys
            ctx.fillStyle = "#444";
            ctx.strokeStyle = colors.text;
            ctx.lineWidth = 2;

            // Left Pulley
            ctx.beginPath();
            ctx.arc(-dist/2, 0, R, 0, Math.PI*2);
            ctx.fill(); ctx.stroke();
            
            // Right Pulley
            ctx.beginPath();
            ctx.arc(dist/2, 0, R, 0, Math.PI*2);
            ctx.fill(); ctx.stroke();

            // Spokes for rotation
            ctx.save();
            ctx.translate(-dist/2, 0);
            ctx.rotate(rot11);
            ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R);
            ctx.strokeStyle = "#888"; ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(dist/2, 0);
            ctx.rotate(rot11);
            ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R);
            ctx.strokeStyle = "#888"; ctx.stroke();
            ctx.restore();

            // Draw Belt
            ctx.strokeStyle = (Tc >= Tmax) ? colors.primary : colors.secondary;
            ctx.lineWidth = 6;
            ctx.lineJoin = "round";
            
            // Top belt (tight side)
            ctx.beginPath();
            ctx.moveTo(-dist/2, -R);
            ctx.lineTo(dist/2, -R);
            ctx.stroke();

            // Bottom belt (slack side, showing centrifugal flutter)
            ctx.beginPath();
            ctx.moveTo(dist/2, R);
            // Parabolic droop/flutter
            ctx.quadraticCurveTo(0, R + flutter + randomFlutter, -dist/2, R);
            ctx.stroke();

            // If slipping, draw speed lines breaking off
            if (Tc >= Tmax) {
                ctx.beginPath();
                ctx.moveTo(-dist/2, -R - 10);
                ctx.lineTo(-dist/2 + 40, -R - 20);
                ctx.moveTo(dist/2, R + 10);
                ctx.lineTo(dist/2 - 40, R + 20);
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.restore();
        }

        inV.addEventListener('input', updateSim11);
        inTmax.addEventListener('input', updateSim11);
        inM.addEventListener('input', updateSim11);
        updateSim11();
        loopSim11();
    }

});
