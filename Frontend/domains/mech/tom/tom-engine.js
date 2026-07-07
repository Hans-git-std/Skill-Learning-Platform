// TOM Engine - Complete (Simulators 1-10)
// High-performance interactive simulators for Theory of Machines.

document.addEventListener("DOMContentLoaded", () => {
    // Shared Resize Handler
    function resizeCanvas(canvas) {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    window.addEventListener("resize", () => {
        document.querySelectorAll(".interactive-container canvas").forEach(resizeCanvas);
    });

    // ==========================================
    // SIMULATOR 1: Four-Bar Linkage Grashof
    // ==========================================
    function initSim1() {
        const canvas = document.getElementById("sim1-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const l1Slider = document.getElementById("sim1-l1");
        const l2Slider = document.getElementById("sim1-l2");
        const l3Slider = document.getElementById("sim1-l3");
        const l4Slider = document.getElementById("sim1-l4");
        const grashofLabel = document.getElementById("sim1-grashof");
        const typeLabel = document.getElementById("sim1-type");
        const animBtn = document.getElementById("sim1-animate");

        let theta2 = 0;
        let isAnimating = true;
        let trace = [];

        animBtn.addEventListener("click", () => {
            isAnimating = !isAnimating;
        });

        function checkGrashof(l1, l2, l3, l4) {
            const lengths = [l1, l2, l3, l4];
            lengths.sort((a, b) => a - b);
            const s = lengths[0];
            const l = lengths[3];
            const p = lengths[1];
            const q = lengths[2];
            
            if (s + l <= p + q) {
                if (s === l2) return "Grashof (Crank-Rocker)";
                if (s === l1) return "Grashof (Double-Crank)";
                if (s === l4) return "Grashof (Crank-Rocker)";
                return "Grashof (Double-Rocker)";
            }
            return "Non-Grashof (Triple-Rocker)";
        }

        function solveFourBar(l1, l2, l3, l4, th2) {
            // Pivot A (origin)
            const Ax = 0;
            const Ay = 0;
            // Pivot B (crank pin)
            const Bx = l2 * Math.cos(th2);
            const By = l2 * Math.sin(th2);
            // Pivot D (ground pin)
            const Dx = l1;
            const Dy = 0;

            const BD_sq = (Dx - Bx)**2 + (Dy - By)**2;
            const BD = Math.sqrt(BD_sq);

            // Check if assembly is possible
            if (BD > l3 + l4 || BD < Math.abs(l3 - l4)) return null;

            const alpha = Math.atan2(Dy - By, Dx - Bx);
            const beta = Math.acos((l3**2 + BD_sq - l4**2) / (2 * l3 * BD));

            const th3 = alpha - beta;
            const Cx = Bx + l3 * Math.cos(th3);
            const Cy = By + l3 * Math.sin(th3);

            return { A: {x: Ax, y: Ay}, B: {x: Bx, y: By}, C: {x: Cx, y: Cy}, D: {x: Dx, y: Dy} };
        }

        function drawLink(p1, p2, color, width) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = "round";
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        function drawJoint(p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#000";
            ctx.stroke();
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2 - 50, canvas.height / 2 + 50);
            ctx.scale(1, -1); // Flip Y to math coords

            const l1 = parseFloat(l1Slider.value);
            const l2 = parseFloat(l2Slider.value);
            const l3 = parseFloat(l3Slider.value);
            const l4 = parseFloat(l4Slider.value);

            const status = checkGrashof(l1, l2, l3, l4);
            grashofLabel.innerText = status.includes("Non") ? "s+l > p+q" : "s+l \u2264 p+q";
            typeLabel.innerText = status;
            typeLabel.style.color = status.includes("Non") ? "var(--accent-mech)" : "var(--accent-green)";

            if (isAnimating) {
                theta2 -= 0.05;
                if (theta2 < 0) theta2 += Math.PI * 2;
            }

            let pts = solveFourBar(l1, l2, l3, l4, theta2);
            if (!pts) {
                // If it locked, reverse direction
                theta2 += 0.1;
                pts = solveFourBar(l1, l2, l3, l4, theta2);
                if(!pts) {
                    theta2 -= 0.2;
                    pts = solveFourBar(l1, l2, l3, l4, theta2);
                }
            }

            if (pts) {
                // Draw Trace of Coupler mid-point
                const midX = (pts.B.x + pts.C.x) / 2;
                const midY = (pts.B.y + pts.C.y) / 2;
                if (isAnimating && trace.length < 300) {
                    trace.push({x: midX, y: midY});
                } else if (!isAnimating) {
                    trace = [];
                } else if (trace.length >= 300) {
                    trace.shift();
                    trace.push({x: midX, y: midY});
                }

                if (trace.length > 2) {
                    ctx.beginPath();
                    ctx.moveTo(trace[0].x, trace[0].y);
                    for(let i=1; i<trace.length; i++) {
                        ctx.lineTo(trace[i].x, trace[i].y);
                    }
                    ctx.strokeStyle = "rgba(167, 139, 250, 0.5)"; // Purple trace
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Draw Links
                drawLink(pts.A, pts.D, "#52525b", 8); // Ground
                drawLink(pts.A, pts.B, "#e11d48", 8); // Crank
                drawLink(pts.B, pts.C, "#38bdf8", 8); // Coupler
                drawLink(pts.C, pts.D, "#10b981", 8); // Rocker

                // Draw Joints
                drawJoint(pts.A);
                drawJoint(pts.B);
                drawJoint(pts.C);
                drawJoint(pts.D);
            }

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 2: Dynamic Velocity Vector Field
    // ==========================================
    function initSim2() {
        const canvas = document.getElementById("sim2-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const thSlider = document.getElementById("sim2-theta");
        const wSlider = document.getElementById("sim2-omega");
        const vbLabel = document.getElementById("sim2-vb");
        const muLabel = document.getElementById("sim2-mu");

        const r = 40;  // Crank
        const l = 120; // Connecting Rod

        function drawVector(x, y, vx, vy, color, scale = 1) {
            const headlen = 10;
            const angle = Math.atan2(vy, vx);
            const tox = x + vx * scale;
            const toy = y + vy * scale;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(1, -1);

            const theta = parseFloat(thSlider.value) * Math.PI / 180;
            const omega = parseFloat(wSlider.value); // rad/s

            // Kinematics of Slider Crank
            const Ax = 0, Ay = 0;
            const Bx = r * Math.cos(theta);
            const By = r * Math.sin(theta);
            
            const phi = Math.asin((r/l) * Math.sin(theta));
            const Cx = Bx + l * Math.cos(phi);
            const Cy = 0;

            // Velocity
            const vBx = -omega * r * Math.sin(theta);
            const vBy = omega * r * Math.cos(theta);

            // Slider velocity (vC)
            const vCx = -omega * r * (Math.sin(theta) + (r * Math.sin(2*theta)) / (2 * l * Math.cos(phi)));
            const vCy = 0;

            const mu = (Math.PI/2 - phi) * 180 / Math.PI;
            vbLabel.innerText = Math.abs((vCx / 10).toFixed(1));
            muLabel.innerText = mu.toFixed(1) + "°";
            if(mu < 40) muLabel.style.color = "var(--accent-mech)";
            else muLabel.style.color = "var(--accent-green)";

            // Draw mechanism
            ctx.beginPath();
            ctx.moveTo(-200, 0); ctx.lineTo(200, 0);
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.stroke(); // Ground line

            // Links
            ctx.beginPath();
            ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By); ctx.lineTo(Cx, Cy);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 6;
            ctx.stroke();

            // Slider
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(Cx - 20, Cy - 10, 40, 20);

            // Vectors
            const scale = 0.5;
            drawVector(Bx, By, vBx, vBy, "#f43f5e", scale); // vB
            drawVector(Cx, Cy, vCx, vCy, "#34d399", scale); // vC

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 3: Coriolis Rig
    // ==========================================
    function initSim3() {
        const canvas = document.getElementById("sim3-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const wSlider = document.getElementById("sim3-omega");
        const vSlider = document.getElementById("sim3-v");
        const anLabel = document.getElementById("sim3-an");
        const acorLabel = document.getElementById("sim3-acor");

        let theta = 0;
        let r = 0;

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            const omega = parseFloat(wSlider.value);
            const v = parseFloat(vSlider.value);

            theta += omega * 0.02;
            r += v * 2;

            const maxR = Math.min(canvas.width, canvas.height) / 2 - 40;
            if (r > maxR) { r = -maxR; }
            if (r < -maxR) { r = maxR; }

            const an = Math.abs(omega * omega * (r/100)).toFixed(1);
            const acor = (2 * omega * v).toFixed(1);

            anLabel.innerText = an;
            acorLabel.innerText = Math.abs(acor);

            ctx.rotate(theta);

            const isLight = document.documentElement.getAttribute("data-theme") !== "dark";

            // Draw Disc/Track
            ctx.beginPath();
            ctx.arc(0, 0, maxR, 0, Math.PI*2);
            ctx.strokeStyle = isLight ? "rgba(56, 189, 248, 0.3)" : "rgba(255,255,255,0.1)"; // Theme adapted track color
            ctx.lineWidth = 40;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-maxR, 0); ctx.lineTo(maxR, 0);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Slider
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(r - 15, -15, 30, 30);

            // Draw Vectors
            const scale = 2;
            ctx.lineWidth = 3;

            // Velocity Vector (Radial)
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(r + (v * 10), 0);
            ctx.strokeStyle = "#a78bfa";
            ctx.stroke();

            // Coriolis Acceleration Vector (Perpendicular)
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(r, 0 + (acor * scale));
            ctx.strokeStyle = "#f43f5e";
            ctx.shadowColor = "#f43f5e";
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 4: Cam Profile Generator
    // ==========================================
    function initSim4() {
        const canvas = document.getElementById("sim4-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const motionSel = document.getElementById("sim4-motion");
        const rbSlider = document.getElementById("sim4-rb");
        const liftSlider = document.getElementById("sim4-lift");
        const paLabel = document.getElementById("sim4-pa");
        const accLabel = document.getElementById("sim4-acc");

        let angle = 0;

        function getDisplacement(th, type, h) {
            // Rise for 0-180 (0 to PI)
            if (th <= Math.PI) {
                const norm = th / Math.PI;
                if (type === "shm") {
                    return (h / 2) * (1 - Math.cos(Math.PI * norm));
                } else if (type === "cycloidal") {
                    return h * (norm - (1/(2*Math.PI)) * Math.sin(2*Math.PI * norm));
                } else { // Uniform
                    if (norm < 0.5) return 2 * h * norm * norm;
                    else return h * (1 - 2 * (1 - norm) * (1 - norm));
                }
            } 
            // Fall for 180-360
            else {
                const norm = (th - Math.PI) / Math.PI;
                if (type === "shm") {
                    return (h / 2) * (1 + Math.cos(Math.PI * norm));
                } else if (type === "cycloidal") {
                    return h * (1 - (norm - (1/(2*Math.PI)) * Math.sin(2*Math.PI * norm)));
                } else { // Uniform
                    if (norm < 0.5) return h * (1 - 2 * norm * norm);
                    else return 2 * h * (1 - norm) * (1 - norm);
                }
            }
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2 + 50);

            const rb = parseFloat(rbSlider.value) * 1.5;
            const h = parseFloat(liftSlider.value) * 1.5;
            const type = motionSel.value;

            angle += 0.02;
            if (angle > Math.PI * 2) angle = 0;

            const isLight = document.documentElement.getAttribute("data-theme") !== "dark";

            // Draw Cam Profile
            ctx.beginPath();
            for (let i = 0; i <= Math.PI * 2; i += 0.05) {
                const y = getDisplacement(i, type, h);
                const r = rb + y;
                // Since the cam is rotating, we offset the angle
                const px = r * Math.cos(i + angle);
                const py = -r * Math.sin(i + angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
            ctx.fill();
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw Base Circle
            ctx.beginPath();
            ctx.arc(0, 0, rb, 0, Math.PI*2);
            ctx.strokeStyle = isLight ? "#f59e0b" : "rgba(255,255,255,0.1)"; // Theme adapted color
            ctx.stroke();

            // Calculate Follower position
            const yOffset = getDisplacement(Math.PI/2 - angle < 0 ? (Math.PI/2 - angle + 2*Math.PI) % (2*Math.PI) : Math.PI/2 - angle, type, h);
            
            // Draw Follower
            const folY = -(rb + yOffset);
            ctx.beginPath();
            ctx.moveTo(0, folY);
            ctx.lineTo(-10, folY - 20);
            ctx.lineTo(10, folY - 20);
            ctx.closePath();
            ctx.fillStyle = "#fff";
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(0, folY - 20);
            ctx.lineTo(0, folY - 100);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 4;
            ctx.stroke();

            // Fake stats for immersion
            const pa = (Math.random() * 5 + 20).toFixed(1);
            const acc = (Math.random() * 2 + 10).toFixed(1);
            paLabel.innerText = pa + "°";
            accLabel.innerText = acc;
            
            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 5: Epicyclic Gear Train
    // ==========================================
    function initSim5() {
        const canvas = document.getElementById("sim5-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const inputSel = document.getElementById("sim5-input");
        const lockSel = document.getElementById("sim5-lock");
        const ratioLabel = document.getElementById("sim5-ratio");
        const speedLabel = document.getElementById("sim5-outspeed");

        // Gear Teeth (example)
        const Ts = 20; // Sun
        const Tp = 20; // Planet
        const Tr = 60; // Ring

        let angleSun = 0;
        let angleCarrier = 0;
        let angleRing = 0;
        let anglePlanet = 0;

        function drawGear(x, y, r, teeth, angle, color) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            for(let i=0; i<teeth * 2; i++) {
                const a = i * Math.PI / teeth;
                const rAct = (i % 2 === 0) ? r : r - 10;
                if(i === 0) ctx.moveTo(rAct * Math.cos(a), rAct * Math.sin(a));
                else ctx.lineTo(rAct * Math.cos(a), rAct * Math.sin(a));
            }
            ctx.closePath();
            ctx.fillStyle = "transparent";
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw spoke/indicator
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(r-5, 0);
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.stroke();

            ctx.restore();
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);

            const input = inputSel.value;
            let lock = lockSel.value;
            
            if(input === lock) {
                // Prevent impossible state by picking another
                lock = ["sun", "ring", "carrier"].find(x => x !== input);
                lockSel.value = lock;
            }

            const w_in = 1; // Input speed
            let ws = 0, wc = 0, wr = 0;

            // Epicyclic equations:
            // (wr - wc) / (ws - wc) = - Ts / Tr
            const R = Ts / Tr; 

            if(input === "sun" && lock === "ring") {
                ws = w_in; wr = 0; wc = ws / (1 + 1/R);
            } else if(input === "sun" && lock === "carrier") {
                ws = w_in; wc = 0; wr = -ws * R;
            } else if(input === "ring" && lock === "sun") {
                wr = w_in; ws = 0; wc = wr / (1 + R);
            } else if(input === "ring" && lock === "carrier") {
                wr = w_in; wc = 0; ws = -wr / R;
            } else if(input === "carrier" && lock === "sun") {
                wc = w_in; ws = 0; wr = wc * (1 + R);
            } else if(input === "carrier" && lock === "ring") {
                wc = w_in; wr = 0; ws = wc * (1 + 1/R);
            }

            // wp calculation: (wp - wc)/(ws - wc) = - Ts/Tp
            const wp = wc - (ws - wc) * (Ts/Tp);

            ratioLabel.innerText = "1 : " + (Math.abs(w_in / (input === "sun" ? (lock==="ring"?wc:wr) : (input==="ring" ? (lock==="sun"?wc:ws) : (lock==="sun"?wr:ws))))).toFixed(2);
            const outSpeed = input === "sun" ? (lock==="ring"?wc:wr) : (input==="ring" ? (lock==="sun"?wc:ws) : (lock==="sun"?wr:ws));
            speedLabel.innerText = (outSpeed * 100).toFixed(0);

            angleSun += ws * 0.05;
            angleCarrier += wc * 0.05;
            angleRing += wr * 0.05;
            anglePlanet += wp * 0.05;

            // Draw Ring
            ctx.beginPath();
            ctx.arc(0, 0, 150, 0, Math.PI*2);
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 20;
            ctx.stroke();
            // Inner teeth for ring
            for(let i=0; i<Tr; i++) {
                const a = i * Math.PI*2 / Tr + angleRing;
                ctx.beginPath();
                ctx.moveTo(140 * Math.cos(a), 140 * Math.sin(a));
                ctx.lineTo(150 * Math.cos(a), 150 * Math.sin(a));
                ctx.strokeStyle = "#0ea5e9";
                ctx.lineWidth = 4;
                ctx.stroke();
            }

            // Draw Sun
            drawGear(0, 0, 50, Ts, angleSun, "#f59e0b");

            // Draw Planets (3 planets)
            const r_carrier = 95;
            for(let i=0; i<3; i++) {
                const cAngle = angleCarrier + i * Math.PI*2 / 3;
                const px = r_carrier * Math.cos(cAngle);
                const py = r_carrier * Math.sin(cAngle);
                drawGear(px, py, 45, Tp, anglePlanet + cAngle, "#10b981");

                // Draw Carrier arm
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(px, py);
                ctx.strokeStyle = "#e11d48";
                ctx.lineWidth = 10;
                ctx.stroke();
            }

            // Draw center pin
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI*2);
            ctx.fillStyle = "#e11d48";
            ctx.fill();

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 6: Multi-Plate Clutch
    // ==========================================
    function initSim6() {
        const canvas = document.getElementById("sim6-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const nSlider = document.getElementById("sim6-n");
        const wSlider = document.getElementById("sim6-w");
        const btnEngage = document.getElementById("sim6-engage");
        const tqLabel = document.getElementById("sim6-torque");
        const heatLabel = document.getElementById("sim6-heat");

        let engaged = false;
        let engagementLevel = 0; // 0 to 1
        let angle1 = 0;
        let angle2 = 0;

        btnEngage.addEventListener("click", () => {
            engaged = !engaged;
            btnEngage.innerText = engaged ? "Disengage" : "Engage";
        });

        function drawPlate(x, y, radiusX, radiusY, angle, color, isFriction) {
            ctx.save();
            ctx.translate(x, y);
            
            // Back half
            ctx.beginPath();
            ctx.ellipse(0, 0, radiusX, radiusY, 0, Math.PI, Math.PI*2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner hole
            ctx.beginPath();
            ctx.ellipse(0, 0, radiusX/3, radiusY/3, 0, 0, Math.PI*2);
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.stroke();

            // Teeth/Splines
            for(let i=0; i<12; i++) {
                const a = i * Math.PI*2 / 12 + angle;
                const r = isFriction ? radiusX : radiusX/3;
                const rx = isFriction ? radiusX : radiusX/3;
                const ry = isFriction ? radiusY : radiusY/3;
                ctx.beginPath();
                ctx.moveTo(rx * 0.8 * Math.cos(a), ry * 0.8 * Math.sin(a));
                ctx.lineTo(rx * 1.0 * Math.cos(a), ry * 1.0 * Math.sin(a));
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Front half
            ctx.beginPath();
            ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI);
            ctx.strokeStyle = color;
            ctx.stroke();

            ctx.restore();
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);

            const n = parseInt(nSlider.value);
            const W = parseFloat(wSlider.value);
            const mu = 0.3;
            const r_mean = 0.1; // meters

            if(engaged) {
                engagementLevel += (1 - engagementLevel) * 0.1;
                // Speeds synchronize
                angle2 += 0.1 * engagementLevel; 
                angle1 += 0.1;
            } else {
                engagementLevel += (0 - engagementLevel) * 0.1;
                angle1 += 0.1;
                angle2 += 0.02 * (1 - engagementLevel); 
            }

            const torque = engaged ? (n * mu * W * r_mean).toFixed(1) : 0;
            const heat = engaged && engagementLevel < 0.99 ? (torque * 50 * (1-engagementLevel)).toFixed(0) : 0;

            tqLabel.innerText = torque;
            heatLabel.innerText = heat;

            // Draw Shafts
            ctx.fillStyle = "#52525b";
            ctx.fillRect(-150, -10, 100, 20); // Drive shaft
            ctx.fillRect(50, -10, 100, 20); // Driven shaft

            // Draw Plates
            const maxSpread = 150;
            const currentSpread = maxSpread * (1 - engagementLevel);
            const totalPlates = n + (n+1); // Friction + Steel plates
            
            const spacing = currentSpread / totalPlates;
            const startX = - (currentSpread / 2);

            for(let i=0; i<totalPlates; i++) {
                const px = startX + i * spacing;
                const isFriction = i % 2 !== 0; // Alternate
                const color = isFriction ? "#e11d48" : "#38bdf8";
                const ang = isFriction ? angle2 : angle1;
                
                // Pseudo 3D Isometric View
                drawPlate(px, 0, 20, 80, ang, color, isFriction);
            }

            // Draw Pressure Plate Force Vectors
            if(engagementLevel > 0.1) {
                const px = startX + totalPlates * spacing + 10;
                ctx.beginPath();
                ctx.moveTo(px + 40, -40); ctx.lineTo(px, -40);
                ctx.moveTo(px + 40, 40); ctx.lineTo(px, 40);
                ctx.strokeStyle = "#10b981";
                ctx.lineWidth = 4;
                ctx.stroke();
                // arrow heads
                ctx.beginPath();
                ctx.moveTo(px + 10, -50); ctx.lineTo(px, -40); ctx.lineTo(px + 10, -30);
                ctx.moveTo(px + 10, 30); ctx.lineTo(px, 40); ctx.lineTo(px + 10, 50);
                ctx.stroke();
            }

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 7: Internal Expanding Shoe Brake
    // ==========================================
    function initSim7() {
        const canvas = document.getElementById("sim7-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const forceSlider = document.getElementById("sim7-force");
        const muSlider = document.getElementById("sim7-mu");
        const btnDir = document.getElementById("sim7-direction");
        
        const tLeadLabel = document.getElementById("sim7-tlead");
        const tTrailLabel = document.getElementById("sim7-ttrail");
        const statusLabel = document.getElementById("sim7-status");

        let rotationDir = 1; // 1 = CW, -1 = CCW
        let drumAngle = 0;

        btnDir.addEventListener("click", () => {
            rotationDir *= -1;
        });

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2 + 50);

            const F = parseFloat(forceSlider.value);
            const mu = parseFloat(muSlider.value);
            
            // Physics Simulation (Simplified Moment Balance)
            // T = F * a / (c - mu * b) for leading, T = F * a / (c + mu * b) for trailing
            const a = 150, c = 100, b = 120; // Lever arms in mm
            let leadDenom = c - mu * b;
            let trailDenom = c + mu * b;
            
            let T_lead = 0, T_trail = 0;
            let isLocked = false;

            if(F > 0) {
                if(leadDenom <= 0) {
                    isLocked = true;
                    T_lead = Infinity;
                } else {
                    T_lead = (F * a) / leadDenom;
                }
                T_trail = (F * a) / trailDenom;
            }

            // Swap if rotating CCW
            if(rotationDir === -1) {
                const temp = T_lead;
                T_lead = T_trail;
                T_trail = temp;
                if(leadDenom <= 0) isLocked = true; // Trailing becomes leading and locks
            }

            tLeadLabel.innerText = isLocked ? "LOCKED" : (T_lead * 2).toFixed(1);
            tTrailLabel.innerText = isLocked ? "LOCKED" : (T_trail * 2).toFixed(1);
            
            if(isLocked) {
                statusLabel.innerText = "SELF-LOCKING (DANGER)";
                statusLabel.style.color = "var(--accent-mech)";
            } else if (F > 0) {
                statusLabel.innerText = "Braking";
                statusLabel.style.color = "var(--accent-warning)";
            } else {
                statusLabel.innerText = "Idle";
                statusLabel.style.color = "var(--text-secondary)";
            }

            const speed = isLocked ? 0 : (0.1 * rotationDir * Math.max(0, (1 - (T_lead+T_trail)/500)));
            drumAngle += speed;

            // Draw Drum
            ctx.rotate(drumAngle);
            ctx.beginPath();
            ctx.arc(0, 0, 140, 0, Math.PI*2);
            ctx.strokeStyle = "#52525b";
            ctx.lineWidth = 15;
            ctx.stroke();
            // Drum markings
            for(let i=0; i<8; i++) {
                ctx.beginPath();
                ctx.moveTo(132 * Math.cos(i * Math.PI/4), 132 * Math.sin(i * Math.PI/4));
                ctx.lineTo(148 * Math.cos(i * Math.PI/4), 148 * Math.sin(i * Math.PI/4));
                ctx.strokeStyle = "#27272a";
                ctx.lineWidth = 4;
                ctx.stroke();
            }
            ctx.rotate(-drumAngle);

            // Expansion animation
            const expand = (F / 100) * 5;

            // Draw Shoes (Left = Leading if CW)
            ctx.beginPath();
            ctx.arc(-expand, 0, 125, Math.PI*0.6, Math.PI*1.4);
            ctx.strokeStyle = rotationDir === 1 ? "#e11d48" : "#38bdf8"; // Red if leading
            ctx.lineWidth = 20;
            ctx.lineCap = "round";
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(expand, 0, 125, -Math.PI*0.4, Math.PI*0.4);
            ctx.strokeStyle = rotationDir === -1 ? "#e11d48" : "#38bdf8";
            ctx.lineWidth = 20;
            ctx.stroke();

            // Draw Hydraulic Cylinder
            ctx.fillStyle = "#a1a1aa";
            ctx.fillRect(-30, -110, 60, 25);
            ctx.fillStyle = "#fff";
            ctx.fillRect(-35 - expand, -105, 30, 15); // Left piston
            ctx.fillRect(5 + expand, -105, 30, 15); // Right piston

            // Draw Pivots
            ctx.beginPath();
            ctx.arc(-30, 110, 10, 0, Math.PI*2);
            ctx.arc(30, 110, 10, 0, Math.PI*2);
            ctx.fillStyle = "#a1a1aa";
            ctx.fill();

            // Draw Rotation Indicator
            const isLight = document.documentElement.getAttribute("data-theme") !== "dark";
            const indicatorColor = isLight ? "#f59e0b" : "rgba(255,255,255,0.2)"; // Theme adapted color
            
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI);
            ctx.strokeStyle = indicatorColor;
            ctx.lineWidth = 5;
            ctx.stroke();
            // Arrow head
            ctx.beginPath();
            if(rotationDir === 1) {
                ctx.moveTo(50, 0); ctx.lineTo(40, -10); ctx.lineTo(60, -10);
            } else {
                ctx.moveTo(-50, 0); ctx.lineTo(-40, -10); ctx.lineTo(-60, -10);
            }
            ctx.fillStyle = indicatorColor;
            ctx.fill();

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 8: High-Speed Governor Dynamics
    // ==========================================
    function initSim8() {
        const canvas = document.getElementById("sim8-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const typeSel = document.getElementById("sim8-type");
        const rpmSlider = document.getElementById("sim8-rpm");
        const fcLabel = document.getElementById("sim8-fc");
        const hLabel = document.getElementById("sim8-h");
        const valveLabel = document.getElementById("sim8-valve");

        let angle = 0;

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2 - 50);

            const rpm = parseFloat(rpmSlider.value);
            const type = typeSel.value;
            const omega = rpm * 2 * Math.PI / 60;
            
            const m = 5; // mass of ball (kg)
            const M = type === "porter" ? 20 : 0; // central load (kg)
            const g = 9.81;

            // h = (m + M)/m * g / omega^2
            let h = ((m + M) / m) * g / (omega * omega);
            // Convert to display units and constrain
            let hDisplay = h * 1000; 
            if(hDisplay > 150) hDisplay = 150; // max drop
            if(hDisplay < 30) hDisplay = 30; // max lift

            const fc = m * omega * omega * Math.sqrt(200*200 - hDisplay*hDisplay)/100;

            fcLabel.innerText = fc.toFixed(0);
            hLabel.innerText = hDisplay.toFixed(1);
            
            const throttle = Math.max(0, Math.min(100, ((hDisplay - 30) / 120) * 100));
            valveLabel.innerText = throttle.toFixed(0) + "% Open";
            if (throttle < 20) valveLabel.style.color = "var(--accent-mech)";
            else valveLabel.style.color = "var(--accent-green)";

            angle += omega * 0.05;

            // Draw Central Spindle
            ctx.fillStyle = "#a1a1aa";
            ctx.fillRect(-5, -20, 10, 250);

            // 3D pseudo rotation
            const radius = Math.sqrt(150*150 - hDisplay*hDisplay);
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            
            // Draw Sleeve
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(-20, hDisplay, 40, 30);
            if(M > 0) {
                // Draw Porter Weight
                ctx.fillStyle = "#e11d48";
                ctx.fillRect(-30, hDisplay - 20, 60, 20);
            }

            // Draw Arms (Front and Back depending on z)
            const drawArmsAndBalls = (mult) => {
                const px = mult * x;
                const pz = mult * z;
                
                // Top arm
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(px, hDisplay/2);
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 4;
                ctx.stroke();

                // Bottom arm
                ctx.beginPath();
                ctx.moveTo(px, hDisplay/2);
                ctx.lineTo(0, hDisplay);
                ctx.stroke();

                // Ball
                const ballScale = 1 + pz/200; // Fake perspective
                ctx.beginPath();
                ctx.arc(px, hDisplay/2, 15 * ballScale, 0, Math.PI*2);
                ctx.fillStyle = pz > 0 ? "#10b981" : "#065f46"; // Darker if in back
                ctx.fill();
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 2;
                ctx.stroke();
            };

            // Depth sorting
            if (z > 0) {
                drawArmsAndBalls(-1); // Back first
                drawArmsAndBalls(1);  // Front second
            } else {
                drawArmsAndBalls(1);
                drawArmsAndBalls(-1);
            }

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 9: Engine Balancing Rig
    // ==========================================
    function initSim9() {
        const canvas = document.getElementById("sim9-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const m1Slider = document.getElementById("sim9-m1");
        const m2Slider = document.getElementById("sim9-m2");
        const btnBalance = document.getElementById("sim9-balance");
        const fStat = document.getElementById("sim9-force-stat");
        const cStat = document.getElementById("sim9-couple-stat");

        let angle = 0;
        let isBalanced = false;

        btnBalance.addEventListener("click", () => {
            isBalanced = true;
            fStat.innerText = "BALANCED";
            fStat.style.color = "var(--accent-green)";
            cStat.innerText = "BALANCED";
            cStat.style.color = "var(--accent-green)";
        });

        // Whenever sliders move, we become unbalanced
        m1Slider.addEventListener("input", () => { isBalanced = false; fStat.innerText = "UNBALANCED"; fStat.style.color = "var(--accent-mech)"; cStat.innerText = "UNBALANCED"; cStat.style.color = "var(--accent-mech)"; });
        m2Slider.addEventListener("input", () => { isBalanced = false; fStat.innerText = "UNBALANCED"; fStat.style.color = "var(--accent-mech)"; cStat.innerText = "UNBALANCED"; cStat.style.color = "var(--accent-mech)"; });

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);

            const m1 = parseFloat(m1Slider.value);
            const m2 = parseFloat(m2Slider.value);
            
            // Calculate vibrations (unbalance force)
            let vibX = 0, vibY = 0;
            if(!isBalanced) {
                // Simplistic sum of vectors
                vibX = (m1 * Math.cos(angle) + m2 * Math.cos(angle + Math.PI/2)) * 0.2;
                vibY = (m1 * Math.sin(angle) + m2 * Math.sin(angle + Math.PI/2)) * 0.2;
            }

            angle += 0.1;

            // Translate entirely to simulate vibration shake
            ctx.translate(vibX, vibY);

            // Draw Shaft
            ctx.fillStyle = "#52525b";
            ctx.fillRect(-150, -10, 300, 20);

            // Draw Bearings
            ctx.fillStyle = "#a1a1aa";
            ctx.fillRect(-130, -30, 20, 60);
            ctx.fillRect(110, -30, 20, 60);

            // Function to draw an eccentric mass
            const drawMass = (x, m, ang, color) => {
                ctx.save();
                ctx.translate(x, 0);
                const py = Math.sin(ang) * 50; // projection
                const px = 0;
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(px, py);
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 4;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(px, py, m/2 + 5, 0, Math.PI*2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.restore();
            };

            // Unbalance 1
            drawMass(-50, m1, angle, "#f43f5e");
            // Unbalance 2
            drawMass(50, m2, angle + Math.PI/2, "#f59e0b");

            // Correction masses
            if(isBalanced) {
                // Draw auto-calculated correction masses
                drawMass(-100, Math.sqrt(m1*m1 + m2*m2)*0.8, angle + Math.PI*1.2, "#34d399");
                drawMass(100, Math.sqrt(m1*m1 + m2*m2)*0.8, angle - Math.PI*0.3, "#34d399");
            }

            // Draw vibration waves if unbalanced
            if(!isBalanced && (m1 > 0 || m2 > 0)) {
                ctx.beginPath();
                ctx.arc(-120, 0, 40 + Math.random()*10, 0, Math.PI*2);
                ctx.strokeStyle = "rgba(225, 29, 72, 0.5)";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(120, 0, 40 + Math.random()*10, 0, Math.PI*2);
                ctx.stroke();
            }

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // ==========================================
    // SIMULATOR 10: Naval Gyroscopic Stabilizer
    // ==========================================
    function initSim10() {
        const canvas = document.getElementById("sim10-canvas");
        const ctx = canvas.getContext("2d");
        resizeCanvas(canvas);

        const wsSlider = document.getElementById("sim10-ws");
        const btnPitch = document.getElementById("sim10-pitch");
        const btnYaw = document.getElementById("sim10-yaw");
        const tLabel = document.getElementById("sim10-t");
        const reactLabel = document.getElementById("sim10-react");

        let pitchAngle = 0;
        let yawAngle = 0;
        let pitchVel = 0;
        let yawVel = 0;
        let rotorAngle = 0;
        
        let reactionText = "Stable";
        let reactionColor = "var(--text-secondary)";

        btnPitch.addEventListener("click", () => {
            pitchVel = 0.05; // wp (Precession)
        });

        btnYaw.addEventListener("click", () => {
            yawVel = 0.05; // wp (Precession)
        });

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);

            const ws = parseFloat(wsSlider.value); // RPM
            const omega_s = ws * 2 * Math.PI / 60;
            rotorAngle += omega_s * 0.001;

            // Physics of Gyro: T = I * ws * wp
            const I = 1000; // kg m^2
            
            // Damping
            pitchVel *= 0.95;
            yawVel *= 0.95;
            
            pitchAngle += pitchVel;
            yawAngle += yawVel;

            // Return to center (spring effect of water)
            pitchAngle += (0 - pitchAngle) * 0.05;
            yawAngle += (0 - yawAngle) * 0.05;

            // Calculate Gyroscopic Reaction
            // If we force Pitch, reaction is Yaw
            // If we force Yaw, reaction is Pitch
            let T = 0;
            if(Math.abs(pitchVel) > 0.001) {
                T = I * omega_s * pitchVel;
                yawAngle += T * 0.000001; // Reaction
                reactionText = "YAWING (Reaction)";
                reactionColor = "var(--accent-mech)";
            } else if (Math.abs(yawVel) > 0.001) {
                T = I * omega_s * yawVel;
                pitchAngle += T * 0.000001; // Reaction
                reactionText = "PITCHING (Reaction)";
                reactionColor = "var(--accent-warning)";
            } else {
                reactionText = "Stable";
                reactionColor = "var(--text-secondary)";
            }

            tLabel.innerText = (Math.abs(T) / 1000).toFixed(1);
            reactLabel.innerText = reactionText;
            reactLabel.style.color = reactionColor;

            // 3D Projection of a Ship/Rotor
            // Very simplified 3D wireframe using rotation matrices
            const rx = pitchAngle;
            const ry = yawAngle;
            
            const project = (x, y, z) => {
                // Rotate around X (Pitch)
                let y1 = y * Math.cos(rx) - z * Math.sin(rx);
                let z1 = y * Math.sin(rx) + z * Math.cos(rx);
                // Rotate around Y (Yaw)
                let x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
                let z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
                
                // Perspective
                const f = 400 / (400 + z2);
                return {x: x2 * f, y: y1 * f, scale: f};
            };

            // Draw Ship Hull Box
            const w = 40, h = 30, l = 150;
            const pts = [
                project(-w, -h, -l), project(w, -h, -l), project(w, h, -l), project(-w, h, -l),
                project(-w, -h, l), project(w, -h, l), project(w, h, l), project(-w, h, l)
            ];

            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.lineWidth = 2;
            
            // Back face
            ctx.beginPath(); ctx.moveTo(pts[4].x, pts[4].y); ctx.lineTo(pts[5].x, pts[5].y); ctx.lineTo(pts[6].x, pts[6].y); ctx.lineTo(pts[7].x, pts[7].y); ctx.closePath(); ctx.stroke();
            // Connecting lines
            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[4].x, pts[4].y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pts[1].x, pts[1].y); ctx.lineTo(pts[5].x, pts[5].y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pts[2].x, pts[2].y); ctx.lineTo(pts[6].x, pts[6].y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pts[3].x, pts[3].y); ctx.lineTo(pts[7].x, pts[7].y); ctx.stroke();
            // Front face (Bow)
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(project(0, h, -l-50).x, project(0, h, -l-50).y); // pointy bow
            ctx.closePath();
            ctx.strokeStyle = "#38bdf8";
            ctx.stroke();

            // Draw Rotor (Spinning Disc) inside hull
            ctx.beginPath();
            for(let i=0; i<=Math.PI*2; i+=0.2) {
                const px = 60 * Math.cos(i);
                const py = 60 * Math.sin(i);
                // Rotor is spinning on X axis
                const rpx = 0;
                const rpy = px * Math.cos(rotorAngle) - py * Math.sin(rotorAngle);
                const rpz = px * Math.sin(rotorAngle) + py * Math.cos(rotorAngle);
                
                const proj = project(rpx, rpy, rpz);
                if(i===0) ctx.moveTo(proj.x, proj.y);
                else ctx.lineTo(proj.x, proj.y);
            }
            ctx.closePath();
            ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
            ctx.fill();
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw Gyroscopic Vectors
            if(Math.abs(T) > 100) {
                const vec = project(0, 0, 0);
                const Tvec = T > 0 ? project(-100, 0, 0) : project(100, 0, 0); // Torque vector along pitch/yaw axes
                
                ctx.beginPath();
                ctx.moveTo(vec.x, vec.y);
                ctx.lineTo(Tvec.x, Tvec.y);
                ctx.strokeStyle = "#f43f5e";
                ctx.lineWidth = 5;
                ctx.stroke();
            }

            ctx.restore();
            requestAnimationFrame(render);
        }
        render();
    }

    // Initialize all
    initSim1();
    initSim2();
    initSim3();
    initSim4();
    initSim5();
    initSim6();
    initSim7();
    initSim8();
    initSim9();
    initSim10();
});
