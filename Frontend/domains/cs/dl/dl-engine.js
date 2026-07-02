// dl-engine.js
document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // CHAPTER 1: DATA STREAM VISUALIZER
    // ==========================================
    const ch1BitRow = document.getElementById('ch1-bit-row');
    const ch1ValUnsigned = document.getElementById('ch1-val-unsigned');
    const ch1ValSigned = document.getElementById('ch1-val-signed');
    const ch1ValHex = document.getElementById('ch1-val-hex');
    const btnCh1Random = document.getElementById('btn-ch1-random');
    const btnCh1Zero = document.getElementById('btn-ch1-zero');
    
    let bits = [0,0,0,0,0,0,0,0];

    function renderCh1() {
        if(!ch1BitRow) return;
        ch1BitRow.innerHTML = '';
        bits.forEach((b, i) => {
            const div = document.createElement('div');
            div.className = 'bit-box';
            div.dataset.val = b;
            div.textContent = b;
            div.addEventListener('click', () => {
                bits[i] = bits[i] === 1 ? 0 : 1;
                updateCh1Values();
                renderCh1();
            });
            ch1BitRow.appendChild(div);
        });
    }

    function updateCh1Values() {
        if(!ch1ValUnsigned) return;
        // Calculate Unsigned
        let unsigned = 0;
        for(let i = 0; i < 8; i++) {
            unsigned += bits[i] * Math.pow(2, 7 - i);
        }
        ch1ValUnsigned.textContent = unsigned;

        // Calculate Signed (Two's Complement)
        let signed = unsigned;
        if(bits[0] === 1) {
            signed = unsigned - 256;
        }
        ch1ValSigned.textContent = signed;

        // Calculate Hex
        let hex = unsigned.toString(16).toUpperCase();
        if(hex.length < 2) hex = '0' + hex;
        ch1ValHex.textContent = '0x' + hex;
    }

    if(btnCh1Random) {
        btnCh1Random.addEventListener('click', () => {
            bits = bits.map(() => Math.random() > 0.5 ? 1 : 0);
            updateCh1Values();
            renderCh1();
        });
    }

    if(btnCh1Zero) {
        btnCh1Zero.addEventListener('click', () => {
            bits = [0,0,0,0,0,0,0,0];
            updateCh1Values();
            renderCh1();
        });
    }

    renderCh1();
    updateCh1Values();

    // ==========================================
    // CHAPTER 2: NEON GATE SANDBOX
    // ==========================================
    const ch2InA = document.getElementById('ch2-in-a');
    const ch2InB = document.getElementById('ch2-in-b');
    const ch2GateSelect = document.getElementById('ch2-gate-select');
    const ch2ActiveGate = document.getElementById('ch2-active-gate');
    const ch2Bulb = document.getElementById('ch2-bulb');
    const wireA = document.getElementById('wire-a');
    const wireB = document.getElementById('wire-b');
    const wireOut = document.getElementById('wire-out');

    let stateA = 0;
    let stateB = 0;
    let currentGate = 'AND';

    function evaluateGate() {
        let out = 0;
        switch(currentGate) {
            case 'AND': out = (stateA && stateB) ? 1 : 0; break;
            case 'OR': out = (stateA || stateB) ? 1 : 0; break;
            case 'XOR': out = (stateA !== stateB) ? 1 : 0; break;
            case 'NAND': out = !(stateA && stateB) ? 1 : 0; break;
            case 'NOR': out = !(stateA || stateB) ? 1 : 0; break;
        }
        
        // Update UI
        if(ch2Bulb) {
            if(out === 1) {
                ch2Bulb.classList.add('on');
                ch2Bulb.textContent = 'ON';
                wireOut.classList.add('active');
            } else {
                ch2Bulb.classList.remove('on');
                ch2Bulb.textContent = 'OFF';
                wireOut.classList.remove('active');
            }
        }
    }

    function toggleInput(target, id) {
        if(id === 'A') {
            stateA = stateA === 1 ? 0 : 1;
            target.dataset.state = stateA;
            target.textContent = `A: ${stateA}`;
            if(stateA) wireA.classList.add('active');
            else wireA.classList.remove('active');
        } else {
            stateB = stateB === 1 ? 0 : 1;
            target.dataset.state = stateB;
            target.textContent = `B: ${stateB}`;
            if(stateB) wireB.classList.add('active');
            else wireB.classList.remove('active');
        }
        evaluateGate();
    }

    if(ch2InA) ch2InA.addEventListener('click', (e) => toggleInput(e.target, 'A'));
    if(ch2InB) ch2InB.addEventListener('click', (e) => toggleInput(e.target, 'B'));
    if(ch2GateSelect) {
        ch2GateSelect.addEventListener('change', (e) => {
            currentGate = e.target.value;
            if(ch2ActiveGate) ch2ActiveGate.textContent = currentGate;
            evaluateGate();
        });
    }
    
    // Init ch2
    evaluateGate();

    // ==========================================
    // CHAPTER 3: K-MAP OPTIMIZER
    // ==========================================
    const kmapCells = document.querySelectorAll('.kmap-cell');
    const ch3Equation = document.getElementById('ch3-equation');
    const btnCh3Reset = document.getElementById('btn-ch3-reset');
    const btnCh3Example = document.getElementById('btn-ch3-example');

    let kmapGrid = [
        [0, 0], // row 0: A=0 (B=0, B=1)
        [0, 0]  // row 1: A=1 (B=0, B=1)
    ];

    function updateKMapUI() {
        kmapCells.forEach(cell => {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            cell.dataset.val = kmapGrid[r][c];
            cell.textContent = kmapGrid[r][c];
        });
        solveKMap();
    }

    function solveKMap() {
        if(!ch3Equation) return;
        
        let ones = 0;
        kmapGrid.forEach(r => r.forEach(c => { if(c===1) ones++; }));
        
        if (ones === 0) {
            ch3Equation.textContent = 'OUT = 0';
            return;
        }
        if (ones === 4) {
            ch3Equation.textContent = 'OUT = 1';
            return;
        }
        
        let groups = [];
        let cov = [[0,0],[0,0]];
        if(kmapGrid[0][0] && kmapGrid[0][1]) { groups.push("A'"); cov[0][0]=1; cov[0][1]=1;}
        if(kmapGrid[1][0] && kmapGrid[1][1]) { groups.push("A"); cov[1][0]=1; cov[1][1]=1;}
        if(kmapGrid[0][0] && kmapGrid[1][0]) { groups.push("B'"); cov[0][0]=1; cov[1][0]=1;}
        if(kmapGrid[0][1] && kmapGrid[1][1]) { groups.push("B"); cov[0][1]=1; cov[1][1]=1;}
        
        if(kmapGrid[0][0] && !cov[0][0]) groups.push("A'B'");
        if(kmapGrid[0][1] && !cov[0][1]) groups.push("A'B");
        if(kmapGrid[1][0] && !cov[1][0]) groups.push("AB'");
        if(kmapGrid[1][1] && !cov[1][1]) groups.push("AB");

        ch3Equation.textContent = 'OUT = ' + groups.join(' + ');
    }

    kmapCells.forEach(cell => {
        cell.addEventListener('click', () => {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            kmapGrid[r][c] = kmapGrid[r][c] === 1 ? 0 : 1;
            updateKMapUI();
        });
    });

    if(btnCh3Reset) {
        btnCh3Reset.addEventListener('click', () => {
            kmapGrid = [[0,0],[0,0]];
            updateKMapUI();
        });
    }

    if(btnCh3Example) {
        btnCh3Example.addEventListener('click', () => {
            kmapGrid = [[0,1],[1,1]]; // A + B (Wait: A'B + AB' + AB = A + B)
            updateKMapUI();
        });
    }

    // Init Ch3
    solveKMap();

    // ==========================================
    // CHAPTER 4: ALU RIPPLE-CARRY ARCHITECT
    // ==========================================
    const inputA = document.getElementById('ch4-input-a');
    const inputB = document.getElementById('ch4-input-b');
    const btnCh4Add = document.getElementById('btn-ch4-add');
    const btnCh4Reset = document.getElementById('btn-ch4-reset');
    const aluCircuit = document.getElementById('ch4-alu-circuit');
    const ch4Result = document.getElementById('ch4-result');

    function renderALU(a, b, stepIndex) {
        if(!aluCircuit) return;
        aluCircuit.innerHTML = '';
        
        let aBits = a.toString(2).padStart(4, '0').split('').reverse().map(Number);
        let bBits = b.toString(2).padStart(4, '0').split('').reverse().map(Number);
        
        let cIn = 0;
        let sumBits = [];

        // Build the physical DOM layout from Left (MSB) to Right (LSB)
        // Array index 0 is LSB, so index 3 is MSB.
        for(let i = 3; i >= 0; i--) {
            // We calculate everything synchronously but only display up to 'stepIndex'
            let isCurrentOrPast = (i <= stepIndex); 
            
            const block = document.createElement('div');
            block.className = 'adder-block';
            
            if(isCurrentOrPast) {
                // Calculate logic up to this block to get actual C_in and C_out
                let tempC = 0;
                let s = 0;
                for(let j = 0; j <= i; j++) {
                    let sum = aBits[j] + bBits[j] + tempC;
                    s = sum % 2;
                    tempC = sum > 1 ? 1 : 0;
                }
                sumBits[i] = s;
                
                block.innerHTML = `
                    <div class="adder-bits">A: ${aBits[i]}</div>
                    <div class="adder-bits">B: ${bBits[i]}</div>
                    <div class="adder-bits" style="color:var(--accent-green); margin-top:5px; font-weight:bold;">S: ${s}</div>
                `;
            } else {
                block.innerHTML = `<div class="adder-bits">Pending</div>`;
            }

            aluCircuit.appendChild(block);

            if(i > 0) {
                const wire = document.createElement('div');
                wire.className = 'carry-wire';
                // Active if the previous block (i-1) had a carry out, and we've reached step i-1
                if(isCurrentOrPast || i-1 === stepIndex) {
                    let tempC = 0;
                    for(let j = 0; j <= i-1; j++) {
                        tempC = (aBits[j] + bBits[j] + tempC) > 1 ? 1 : 0;
                    }
                    if(tempC && i-1 <= stepIndex) wire.classList.add('active');
                }
                aluCircuit.appendChild(wire);
            }
        }
        
        if(stepIndex >= 3) {
            let finalResult = parseInt(sumBits.reverse().join(''), 2);
            ch4Result.textContent = finalResult;
        } else {
            ch4Result.textContent = '?';
        }
    }

    let currentAluStep = -1;
    if(btnCh4Add) {
        btnCh4Add.addEventListener('click', () => {
            let a = parseInt(inputA.value) || 0;
            let b = parseInt(inputB.value) || 0;
            if(currentAluStep < 3) {
                currentAluStep++;
                renderALU(a, b, currentAluStep);
            }
        });
    }

    if(btnCh4Reset) {
        btnCh4Reset.addEventListener('click', () => {
            currentAluStep = -1;
            renderALU(0, 0, currentAluStep);
            if(ch4Result) ch4Result.textContent = '?';
        });
    }

    // Init Ch4
    renderALU(0, 0, -1);


    // ==========================================
    // CHAPTER 5: CYBERPUNK MUX
    // ==========================================
    const sel0 = document.getElementById('ch5-sel-0');
    const sel1 = document.getElementById('ch5-sel-1');
    const ch5Out = document.getElementById('ch5-out');
    
    let s0 = 0;
    let s1 = 0;

    function updateMUX() {
        if(!ch5Out) return;
        // Reset all
        document.querySelectorAll('.mux-inputs .mux-channel').forEach(el => {
            el.classList.remove('active');
        });
        
        // Calculate decimal channel
        const channel = (s1 * 2) + s0;
        
        // Activate specific channel
        const activeInput = document.getElementById(`ch5-in-${s1}${s0}`);
        if(activeInput) {
            activeInput.classList.add('active');
            ch5Out.textContent = activeInput.textContent;
            
            // Blink output to simulate routing
            ch5Out.style.opacity = '0';
            setTimeout(() => { ch5Out.style.opacity = '1'; }, 100);
        }
    }

    if(sel0) {
        sel0.addEventListener('click', (e) => {
            s0 = s0 === 1 ? 0 : 1;
            e.target.dataset.state = s0;
            e.target.textContent = `S0: ${s0}`;
            updateMUX();
        });
    }
    if(sel1) {
        sel1.addEventListener('click', (e) => {
            s1 = s1 === 1 ? 0 : 1;
            e.target.dataset.state = s1;
            e.target.textContent = `S1: ${s1}`;
            updateMUX();
        });
    }

    updateMUX();


    // ==========================================
    // CHAPTER 6: CLOCK PULSE (D-FLIP FLOP)
    // ==========================================
    const btnCh6Data = document.getElementById('ch6-data-in');
    const btnCh6Clock = document.getElementById('btn-ch6-clock');
    const ch6QOut = document.getElementById('ch6-q-out');
    const ch6QPin = document.getElementById('ch6-q-pin');
    const ch6QnotPin = document.getElementById('ch6-qnot-pin');
    const ch6DPin = document.getElementById('ch6-d-pin');
    const ch6ClkPin = document.getElementById('ch6-clk-pin');

    let dState = 0;
    let qState = 0;

    function initFlipFlop() {
        if(ch6QnotPin) ch6QnotPin.classList.add('active'); // Q' is 1 initially since Q is 0
    }

    if(btnCh6Data) {
        btnCh6Data.addEventListener('click', function() {
            dState = dState === 1 ? 0 : 1;
            btnCh6Data.dataset.state = dState;
            btnCh6Data.textContent = `D: ${dState}`;
            
            // Highlight the D pin physically on the chip so the user sees immediate feedback
            if(ch6DPin) {
                if(dState === 1) ch6DPin.classList.add('active');
                else ch6DPin.classList.remove('active');
            }
        });
    }

    if(btnCh6Clock) {
        btnCh6Clock.addEventListener('click', function() {
            // Flash clock pin to simulate pulse
            if(ch6ClkPin) {
                ch6ClkPin.classList.add('active');
                setTimeout(() => { 
                    if(ch6ClkPin) ch6ClkPin.classList.remove('active'); 
                }, 200);
            }
            
            // Now Q updates on the rising edge
            qState = dState;
            if(ch6QOut) ch6QOut.textContent = qState;
            
            if(ch6QPin) {
                if(qState === 1) ch6QPin.classList.add('active');
                else ch6QPin.classList.remove('active');
            }
            if(ch6QnotPin) {
                if(qState === 0) ch6QnotPin.classList.add('active');
                else ch6QnotPin.classList.remove('active');
            }
        });
    }
    
    initFlipFlop();

    // ==========================================
    // CHAPTER 7: SHIFT REGISTER
    // ==========================================
    const ch7DataIn = document.getElementById('ch7-data-in');
    const btnCh7Clock = document.getElementById('btn-ch7-clock');
    const ch7SrArray = document.getElementById('ch7-sr-array');

    let srBits = [0,0,0,0,0,0,0,0];
    let srDataIn = 1;

    function renderShiftRegister(animateIdx = -1) {
        if(!ch7SrArray) return;
        ch7SrArray.innerHTML = '';
        srBits.forEach((bit, idx) => {
            const ff = document.createElement('div');
            ff.className = 'sr-ff';
            if(idx === animateIdx) ff.classList.add('shift-anim');
            ff.innerHTML = `
                <div style="font-size:0.7rem; color:var(--text-secondary); margin-bottom:5px;">FF ${idx}</div>
                <div class="sr-val">${bit}</div>
            `;
            ch7SrArray.appendChild(ff);
        });
    }

    if(ch7DataIn) {
        ch7DataIn.addEventListener('click', function() {
            srDataIn = srDataIn === 1 ? 0 : 1;
            ch7DataIn.dataset.state = srDataIn;
            ch7DataIn.textContent = srDataIn;
        });
    }

    if(btnCh7Clock) {
        btnCh7Clock.addEventListener('click', function() {
            // Shift right logic
            srBits.unshift(srDataIn);
            srBits.pop();
            renderShiftRegister(0); // animate the new bit entering
            
            setTimeout(() => {
                const ffs = document.querySelectorAll('.sr-ff');
                if(ffs[0]) ffs[0].classList.remove('shift-anim');
            }, 300);
        });
    }
    renderShiftRegister();


    // ==========================================
    // CHAPTER 8: MODULO COUNTER & TIMING
    // ==========================================
    const ch8Display = document.getElementById('ch8-display');
    const ch8ModAlert = document.getElementById('ch8-mod-alert');
    const btnCh8Clock = document.getElementById('btn-ch8-clock');
    const btnCh8Auto = document.getElementById('btn-ch8-auto');
    const waves = {
        clk: document.getElementById('wave-clk'),
        q0: document.getElementById('wave-q0'),
        q1: document.getElementById('wave-q1'),
        q2: document.getElementById('wave-q2'),
        q3: document.getElementById('wave-q3')
    };

    let counterVal = 0;
    let clkState = 0;
    let autoClockInt = null;

    function renderTimingWave(target, val) {
        if(!target) return;
        const seg = document.createElement('div');
        seg.className = 'wave-segment';
        seg.dataset.val = val;
        target.appendChild(seg);
        if(target.children.length > 30) {
            target.removeChild(target.firstChild);
        }
    }

    function triggerCh8Clock() {
        clkState = clkState === 1 ? 0 : 1;
        renderTimingWave(waves.clk, clkState);
        
        // On falling edge of clock, counter increments (ripple counter logic)
        if(clkState === 0) {
            counterVal++;
            if(counterVal >= 10) {
                counterVal = 0;
                if(ch8ModAlert) {
                    ch8ModAlert.classList.add('active');
                    setTimeout(() => ch8ModAlert.classList.remove('active'), 400);
                }
            }
            if(ch8Display) ch8Display.textContent = counterVal;
        }

        const b = counterVal.toString(2).padStart(4, '0').split('').reverse().map(Number);
        renderTimingWave(waves.q0, b[0]);
        renderTimingWave(waves.q1, b[1]);
        renderTimingWave(waves.q2, b[2]);
        renderTimingWave(waves.q3, b[3]);
    }

    if(btnCh8Clock) {
        btnCh8Clock.addEventListener('click', triggerCh8Clock);
    }

    if(btnCh8Auto) {
        btnCh8Auto.addEventListener('click', function() {
            if(autoClockInt) {
                clearInterval(autoClockInt);
                autoClockInt = null;
                btnCh8Auto.textContent = 'Auto-Clock: OFF';
                btnCh8Auto.style.color = 'var(--accent-green)';
            } else {
                autoClockInt = setInterval(triggerCh8Clock, 200);
                btnCh8Auto.textContent = 'Auto-Clock: ON';
                btnCh8Auto.style.color = 'var(--accent-neon)';
            }
        });
    }

    // Init Ch8
    for(let i=0; i<30; i++) {
        renderTimingWave(waves.clk, 0);
        renderTimingWave(waves.q0, 0);
        renderTimingWave(waves.q1, 0);
        renderTimingWave(waves.q2, 0);
        renderTimingWave(waves.q3, 0);
    }

    // ==========================================
    // CHAPTER 9: FINITE STATE MACHINE
    // ==========================================
    const btnCh9Insert = document.getElementById('btn-ch9-insert');
    const btnCh9Reset = document.getElementById('btn-ch9-reset');
    const fsmDispenser = document.getElementById('fsm-dispenser');
    const states = [
        document.getElementById('state-0'),
        document.getElementById('state-1'),
        document.getElementById('state-2')
    ];
    const edges = [
        document.getElementById('edge-0-1'),
        document.getElementById('edge-1-2')
    ];

    let fsmState = 0; // 0, 1, 2

    function updateFSM() {
        states.forEach(s => s && s.classList.remove('active'));
        edges.forEach(e => e && e.classList.remove('active'));
        
        if(states[fsmState]) states[fsmState].classList.add('active');
        
        if(fsmDispenser) {
            if(fsmState === 2) {
                fsmDispenser.textContent = '🥤 SODA DISPENSED! 🥤';
                fsmDispenser.classList.add('dispense');
            } else {
                fsmDispenser.textContent = '[ WAIT ] OUTPUT OFF';
                fsmDispenser.classList.remove('dispense');
            }
        }
    }

    if(btnCh9Insert) {
        btnCh9Insert.addEventListener('click', function() {
            if(fsmState < 2) {
                if(edges[fsmState]) edges[fsmState].classList.add('active');
                setTimeout(() => {
                    fsmState++;
                    updateFSM();
                }, 300);
            }
        });
    }

    if(btnCh9Reset) {
        btnCh9Reset.addEventListener('click', function() {
            fsmState = 0;
            updateFSM();
        });
    }


    // ==========================================
    // CHAPTER 10: FPGA LUT CONFIGURATOR
    // ==========================================
    const lutInA = document.getElementById('ch10-in-a');
    const lutInB = document.getElementById('ch10-in-b');
    const lutAddrBus = document.getElementById('lut-addr-bus');
    const lutFinalOut = document.getElementById('lut-final-out');
    
    // Default SRAM is 0000
    let sram = { '00': 0, '01': 0, '10': 0, '11': 0 };
    let inputStr = '00';

    document.querySelectorAll('.sram-cell').forEach(cell => {
        cell.addEventListener('click', function(e) {
            let val = parseInt(this.dataset.state) === 1 ? 0 : 1;
            this.dataset.state = val;
            this.textContent = val;
            
            // Rebuild sram dict
            sram['00'] = parseInt(document.querySelector('#sram-00 .sram-cell').dataset.state);
            sram['01'] = parseInt(document.querySelector('#sram-01 .sram-cell').dataset.state);
            sram['10'] = parseInt(document.querySelector('#sram-10 .sram-cell').dataset.state);
            sram['11'] = parseInt(document.querySelector('#sram-11 .sram-cell').dataset.state);
            
            updateLUT();
        });
    });

    function updateLUT() {
        // Highlight active SRAM row
        document.querySelectorAll('.sram-row').forEach(row => row.classList.remove('active'));
        const activeRow = document.getElementById(`sram-${inputStr}`);
        if(activeRow) activeRow.classList.add('active');
        
        if(lutAddrBus) lutAddrBus.textContent = `Routing: ${inputStr}`;
        if(lutFinalOut) {
            lutFinalOut.textContent = sram[inputStr];
            
            // Visual pop
            lutFinalOut.style.transform = 'scale(1.2)';
            setTimeout(() => { lutFinalOut.style.transform = 'scale(1)'; }, 150);
        }
    }

    if(lutInA) {
        lutInA.addEventListener('click', function() {
            let v = this.dataset.state === '1' ? '0' : '1';
            this.dataset.state = v;
            this.textContent = v;
            inputStr = v + inputStr[1];
            updateLUT();
        });
    }
    if(lutInB) {
        lutInB.addEventListener('click', function() {
            let v = this.dataset.state === '1' ? '0' : '1';
            this.dataset.state = v;
            this.textContent = v;
            inputStr = inputStr[0] + v;
            updateLUT();
        });
    }

    updateLUT();

});
