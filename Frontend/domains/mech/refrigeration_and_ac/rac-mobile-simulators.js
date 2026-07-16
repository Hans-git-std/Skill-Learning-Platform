// ---------------------------------------------------------
// Mobile DOM Simulators (Chapters 1, 2, 3)
// Separate file to ensure CORS/ESModule isolation from Three.js
// ---------------------------------------------------------

function initMobileSimulators() {
    // --- Chapter 1 Mobile ---
    const ch1Ins = document.getElementById('ch1-mob-insulation');
    const ch1Particle = document.getElementById('ch1-mob-particle');
    const ch1Q = document.getElementById('ch1-mob-q');
    
    if(ch1Ins && ch1Particle && ch1Q) {
        let ch1Progress = 0;
        function animCh1() {
            requestAnimationFrame(animCh1);
            const insVal = parseInt(ch1Ins.value) / 100;
            const speed = 2 - (insVal * 1.8); // High speed when 0, low when 100
            
            if (insVal < 0.3) { ch1Q.innerText = 'High'; ch1Q.style.color = '#ff3300'; }
            else if (insVal < 0.7) { ch1Q.innerText = 'Medium'; ch1Q.style.color = '#ffaa00'; }
            else { ch1Q.innerText = 'Low'; ch1Q.style.color = '#0066ff'; }

            ch1Progress += speed;
            if(ch1Progress > 100) ch1Progress = -20;
            ch1Particle.style.left = ch1Progress + '%';
            ch1Particle.style.opacity = 1 - insVal;
        }
        animCh1();
    }

    // --- Chapter 2 Mobile ---
    const ch2Btn = document.getElementById('ch2-mob-btn');
    const ch2Status = document.getElementById('ch2-mob-status');
    const ch2Blocks = {
        'comp': document.getElementById('ch2-mob-comp'),
        'cond': document.getElementById('ch2-mob-cond'),
        'valve': document.getElementById('ch2-mob-valve'),
        'evap': document.getElementById('ch2-mob-evap')
    };

    // Ensure all elements exist before binding
    if(ch2Btn && ch2Status && ch2Blocks.comp && ch2Blocks.cond && ch2Blocks.valve && ch2Blocks.evap) {
        let isRunning = false;
        ch2Btn.addEventListener('click', () => {
            if(isRunning) return;
            isRunning = true;
            ch2Btn.style.opacity = '0.5';
            
            const sequence = [
                { id: 'comp', text: 'Compressing (Hot Gas)', color: '#ff4444', duration: 1000 },
                { id: 'cond', text: 'Condensing (Hot Liquid)', color: '#ffaa00', duration: 1000 },
                { id: 'valve', text: 'Expanding (Cold Mix)', color: '#44aaff', duration: 1000 },
                { id: 'evap', text: 'Evaporating (Cold Gas)', color: '#aaaaaa', duration: 1000 }
            ];

            let step = 0;
            function nextStep() {
                // Reset all
                Object.values(ch2Blocks).forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = b.style.borderColor;
                });

                if (step >= sequence.length) {
                    ch2Status.innerText = 'Cycle Complete. Idle.';
                    isRunning = false;
                    ch2Btn.style.opacity = '1';
                    return;
                }

                const s = sequence[step];
                ch2Status.innerText = s.text;
                const block = ch2Blocks[s.id];
                block.style.background = s.color;
                block.style.color = '#000';

                step++;
                setTimeout(nextStep, s.duration);
            }
            nextStep();
        });
    }

    // --- Chapter 3 Mobile ---
    const ch3Temp = document.getElementById('ch3-mob-temp');
    const ch3Mol = document.getElementById('ch3-mob-molecule');
    if(ch3Temp && ch3Mol) {
        function animCh3() {
            requestAnimationFrame(animCh3);
            const temp = parseInt(ch3Temp.value) / 100;
            const jitter = temp * 5; // max 5px jitter
            
            if(jitter > 0) {
                const dx = (Math.random() - 0.5) * jitter;
                const dy = (Math.random() - 0.5) * jitter;
                ch3Mol.style.transform = `translate(${dx}px, ${dy}px)`;
            } else {
                ch3Mol.style.transform = 'translate(0px, 0px)';
            }
        }
        animCh3();
    }

    // --- Chapter 4 Mobile ---
    const ch4Heat = document.getElementById('ch4-mob-heat');
    const ch4FlowTop = document.getElementById('ch4-mob-flow-top');
    const ch4FlowBot = document.getElementById('ch4-mob-flow-bot');
    const ch4Cop = document.getElementById('ch4-mob-cop');
    if(ch4Heat && ch4FlowTop) {
        let ch4Time = 0;
        function animCh4() {
            requestAnimationFrame(animCh4);
            const heat = parseInt(ch4Heat.value) / 100;
            const speed = 1 + (heat * 15); // Much more obvious speed change
            ch4Time -= speed;
            ch4FlowTop.style.backgroundPosition = `${ch4Time}px 0`;
            ch4FlowBot.style.backgroundPosition = `${-ch4Time}px 0`;
            
            // Just animate a repeating gradient to look like flow
            ch4FlowTop.style.background = `repeating-linear-gradient(90deg, #aa3333, #3333aa 20px, #aa3333 40px)`;
            ch4FlowBot.style.background = `repeating-linear-gradient(-90deg, #3333aa, #aa3333 20px, #3333aa 40px)`;

            if(ch4Cop) {
                const cop = 0.4 + (heat * 0.4); // COP ranges from 0.4 to 0.8
                ch4Cop.innerText = cop.toFixed(2);
            }
        }
        animCh4();
    }

    // --- Chapter 5 Mobile ---
    const ch5Alt = document.getElementById('ch5-mob-alt');
    const ch5AltVal = document.getElementById('ch5-mob-alt-val');
    const ch5Amb = document.getElementById('ch5-mob-amb');
    const ch5Pres = document.getElementById('ch5-mob-pres');
    if(ch5Alt) {
        ch5Alt.addEventListener('input', () => {
            const alt = parseInt(ch5Alt.value);
            ch5AltVal.innerText = alt.toLocaleString() + ' ft';
            const temp = Math.round(15 - (alt / 1000) * 2);
            ch5Amb.innerText = temp + '°C';
            
            if(alt > 30000) { ch5Pres.innerText = 'Very Low'; ch5Pres.style.color = '#ff4444'; }
            else if (alt > 15000) { ch5Pres.innerText = 'Low'; ch5Pres.style.color = '#ffaa00'; }
            else { ch5Pres.innerText = 'High'; ch5Pres.style.color = '#44aaff'; }
        });
    }

    // --- Chapter 6 Mobile ---
    const ch6Load = document.getElementById('ch6-mob-load');
    const ch6Lt = document.getElementById('ch6-mob-lt');
    const ch6Temp = document.getElementById('ch6-mob-temp');
    const ch6Cond = document.getElementById('ch6-mob-cond');
    if(ch6Load && ch6Lt) {
        ch6Load.addEventListener('input', () => {
            const load = parseInt(ch6Load.value);
            
            // Map 0-100 load to temperature -30 to -80
            const temp = -30 - Math.round(load * 0.5);
            ch6Temp.innerText = temp;

            // Visual intensity of LT cycle increases
            const opacity = 0.2 + (load * 0.006);
            ch6Lt.style.background = `rgba(68, 68, 255, ${opacity})`;
            
            // Visual intensity of Condenser increases
            const condGlow = Math.floor((load / 100) * 50);
            ch6Cond.style.boxShadow = `0 0 ${condGlow}px rgba(255, 68, 255, 0.8)`;
        });
    }

    // --- Chapter 7 Mobile ---
    const ch7Rh = document.getElementById('ch7-mob-rh');
    const ch7RhVal = document.getElementById('ch7-mob-rh-val');
    const ch7Fog = document.getElementById('ch7-mob-fog');
    const ch7State = document.getElementById('ch7-mob-state');
    if(ch7Rh) {
        ch7Rh.addEventListener('input', () => {
            const rh = parseInt(ch7Rh.value);
            ch7RhVal.innerText = rh + '%';
            if (rh > 90) {
                ch7Fog.style.background = 'rgba(255,255,255,0.8)';
                ch7Fog.style.backdropFilter = 'blur(4px)';
                ch7State.innerText = 'Heavy Fog';
            } else if (rh > 70) {
                ch7Fog.style.background = 'rgba(255,255,255,0.4)';
                ch7Fog.style.backdropFilter = 'blur(2px)';
                ch7State.innerText = 'Condensation';
            } else {
                ch7Fog.style.background = 'rgba(255,255,255,0)';
                ch7Fog.style.backdropFilter = 'blur(0px)';
                ch7State.innerText = 'Clear';
            }
        });
    }

    // --- Chapter 8 Mobile ---
    const ch8Fan = document.getElementById('ch8-mob-fan');
    const ch8Water = document.getElementById('ch8-mob-water');
    const ch8Air = document.getElementById('ch8-mob-air');
    const ch8Leaving = document.getElementById('ch8-mob-leaving');
    if(ch8Fan && ch8Water && ch8Air) {
        let ch8WTime = 0;
        let ch8ATime = 0;
        function animCh8() {
            requestAnimationFrame(animCh8);
            const fan = parseInt(ch8Fan.value);
            ch8WTime += 2; // Water always falls at constant speed
            ch8ATime -= (0.5 * fan); // Air rises faster with fan
            
            ch8Water.style.backgroundPosition = `0 ${ch8WTime}px`;
            ch8Air.style.backgroundPosition = `0 ${ch8ATime}px`;
            ch8Leaving.innerText = (35 - fan).toFixed(1) + '°C';
        }
        animCh8();
    }

    // --- Chapter 9 Mobile ---
    const ch9Clo = document.getElementById('ch9-mob-clo');
    const ch9CloVal = document.getElementById('ch9-mob-clo-val');
    const ch9Avatar = document.getElementById('ch9-mob-avatar');
    const ch9Status = document.getElementById('ch9-mob-status');
    if(ch9Clo) {
        ch9Clo.addEventListener('input', () => {
            const clo = parseInt(ch9Clo.value) / 10;
            ch9CloVal.innerText = clo.toFixed(1);

            if (clo < 0.5) {
                ch9Avatar.style.background = '#bbddff';
                ch9Status.innerText = 'Shivering (Too Cold)';
                ch9Status.style.color = '#44aaff';
            } else if (clo > 1.5) {
                ch9Avatar.style.background = '#ff4444';
                ch9Status.innerText = 'Sweating (Too Hot)';
                ch9Status.style.color = '#ff4444';
            } else {
                ch9Avatar.style.background = '#ffccaa';
                ch9Status.innerText = 'Comfortable (Neutral)';
                ch9Status.style.color = '#00ff00';
            }
        });
    }

    // --- Chapter 10 Mobile ---
    const ch10Frost = document.getElementById('ch10-mob-frost');
    const ch10FrostVal = document.getElementById('ch10-mob-frost-val');
    const ch10Coil = document.getElementById('ch10-mob-coil');
    const ch10Btn = document.getElementById('ch10-mob-btn');
    const ch10Temp = document.getElementById('ch10-mob-temp');
    if(ch10Frost && ch10Coil && ch10Btn) {
        let isDefrosting = false;
        
        function updateFrost() {
            const val = parseInt(ch10Frost.value);
            if(ch10FrostVal) ch10FrostVal.innerText = val + '%';
            
            // Increase opacity of blue overlay based on frost
            ch10Coil.style.background = `linear-gradient(rgba(200,240,255,${val/100}), rgba(200,240,255,${val/100})), #eee`;
        }
        ch10Frost.addEventListener('input', updateFrost);
        updateFrost();

        ch10Btn.addEventListener('click', () => {
            if(isDefrosting) return;
            isDefrosting = true;
            ch10Btn.style.opacity = '0.5';
            ch10Btn.innerText = 'Defrosting...';
            if(ch10Temp) {
                ch10Temp.innerText = '30°C (Melting)';
                ch10Temp.style.color = '#ff3300';
            }

            const meltInterval = setInterval(() => {
                let current = parseInt(ch10Frost.value);
                current -= 2;
                if(current <= 0) {
                    current = 0;
                    clearInterval(meltInterval);
                    isDefrosting = false;
                    ch10Btn.style.opacity = '1';
                    ch10Btn.innerText = 'Defrost';
                    if(ch10Temp) {
                        ch10Temp.innerText = '-5°C (Freezing)';
                        ch10Temp.style.color = '#44aaff';
                    }
                }
                ch10Frost.value = current;
                updateFrost();
            }, 50);
        });
    }
}

// Bind strictly after DOM content is fully loaded
document.addEventListener('DOMContentLoaded', initMobileSimulators);
