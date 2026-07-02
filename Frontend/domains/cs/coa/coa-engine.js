/**
 * COA Interactive Simulator Engine
 * Step 3.1: Chapters 1, 2, and 3 (Defensive Rewrite)
 */

(function() {
    function safeInit(name, initFn) {
        try {
            initFn();
            console.log(`[COA Engine] Successfully initialized: ${name}`);
        } catch (e) {
            console.error(`[COA Engine] Failed to initialize ${name}:`, e);
        }
    }

    /* =========================================
       CHAPTER 1: 3D Floating-Point Explainer
    ========================================= */
    function initChapter1() {
        const decInput = document.getElementById('ch1-dec-input');
        const btnConvert = document.getElementById('btn-ch1-convert');
        const btnRandom = document.getElementById('btn-ch1-random');
        
        const signCont = document.getElementById('fp-sign-container');
        const expCont = document.getElementById('fp-exp-container');
        const manCont = document.getElementById('fp-man-container');

        const calcSign = document.getElementById('fp-calc-sign');
        const calcExp = document.getElementById('fp-calc-exp');
        const calcMan = document.getElementById('fp-calc-man');
        const calcFinal = document.getElementById('fp-calc-final');

        if (!decInput || !btnConvert || !signCont) throw new Error("Ch1 elements missing.");

        let bits = new Array(32).fill(0);

        function createBitUI() {
            signCont.innerHTML = '';
            expCont.innerHTML = '';
            manCont.innerHTML = '';
            
            for(let i=0; i<32; i++) {
                let el = document.createElement('div');
                el.className = 'fp-bit';
                el.dataset.val = bits[i];
                el.textContent = bits[i];
                el.addEventListener('click', () => {
                    bits[i] = bits[i] === 0 ? 1 : 0;
                    el.dataset.val = bits[i];
                    el.textContent = bits[i];
                    updateDecimalFromBits();
                });
                
                if (i === 0) signCont.appendChild(el);
                else if (i <= 8) expCont.appendChild(el);
                else manCont.appendChild(el);
            }
        }

        function floatToBits(f) {
            const buf = new ArrayBuffer(4);
            const view = new DataView(buf);
            view.setFloat32(0, f, false); // Big endian
            const intVal = view.getUint32(0, false);
            
            const arr = [];
            for (let i = 31; i >= 0; i--) {
                arr.push((intVal >>> i) & 1); // Unsigned right shift is perfectly safe
            }
            return arr;
        }

        function bitsToFloat(bArr) {
            // Build the Uint32 by multiplication to avoid any sign-bit bitwise weirdness
            let intVal = 0;
            for (let i = 0; i < 32; i++) {
                intVal = (intVal * 2) + bArr[i];
            }
            const buf = new ArrayBuffer(4);
            const view = new DataView(buf);
            view.setUint32(0, intVal, false);
            return view.getFloat32(0, false);
        }

        function updateBitsFromInput() {
            let val = parseFloat(decInput.value);
            if (isNaN(val)) val = 0;
            bits = floatToBits(val);
            createBitUI();
            updateFormulaUI();
        }

        function updateDecimalFromBits() {
            let f = bitsToFloat(bits);
            decInput.value = f;
            updateFormulaUI();
        }

        function updateFormulaUI() {
            let s = bits[0] === 1 ? -1 : 1;
            let eBinary = bits.slice(1, 9).join('');
            let e = parseInt(eBinary, 2) - 127;
            
            let mBinary = bits.slice(9, 32);
            let m = 1.0;
            let frac = 0.5;
            for(let bit of mBinary) {
                if(bit === 1) m += frac;
                frac /= 2;
            }

            if (parseInt(eBinary, 2) === 0 && m === 1.0) {
                s = 1; e = 0; m = 0; // Special case for exactly 0
            }

            calcSign.textContent = s;
            calcExp.textContent = e;
            calcMan.textContent = m.toFixed(6).replace(/\.?0+$/, '');
            
            let finalVal = bitsToFloat(bits);
            calcFinal.textContent = finalVal;
        }

        btnConvert.addEventListener('click', updateBitsFromInput);
        btnRandom.addEventListener('click', () => {
            decInput.value = (Math.random() * 2000 - 1000).toFixed(4);
            updateBitsFromInput();
        });

        // Initialize state
        updateBitsFromInput();
    }


    /* =========================================
       CHAPTER 2: ALU Sandbox
    ========================================= */
    function initChapter2() {
        const selA = document.getElementById('ch2-input-a');
        const selB = document.getElementById('ch2-input-b');
        const selOp = document.getElementById('ch2-opcode');

        const busA = document.getElementById('bus-a');
        const busB = document.getElementById('bus-b');
        const busOut = document.getElementById('bus-out');
        
        const muxSel = document.getElementById('mux-sel');
        const flagZ = document.getElementById('flag-z');
        const flagC = document.getElementById('flag-c');
        const overflowMsg = document.getElementById('alu-overflow-msg');

        const blocks = {
            'AND': document.getElementById('lb-and'),
            'OR': document.getElementById('lb-or'),
            'XOR': document.getElementById('lb-xor'),
            'ADD': document.getElementById('lb-add')
        };

        if (!selA || !busA || !blocks['AND']) throw new Error("Ch2 elements missing.");

        function to4Bit(num) {
            return num.toString(2).padStart(4, '0');
        }

        function updateALU() {
            let a = parseInt(selA.value);
            let b = parseInt(selB.value);
            let op = selOp.value;

            if(isNaN(a) || isNaN(b)) return;

            busA.textContent = `A = ${to4Bit(a)}`;
            busB.textContent = `B = ${to4Bit(b)}`;

            // Safely remove active class from all
            Object.values(blocks).forEach(el => {
                if (el) el.classList.remove('active');
            });
            
            // Add active to selected
            if (blocks[op]) blocks[op].classList.add('active');

            let res = 0;
            let carry = 0;

            if (op === 'AND') { res = a & b; muxSel.textContent = "Sel = 00"; }
            else if (op === 'OR') { res = a | b; muxSel.textContent = "Sel = 01"; }
            else if (op === 'XOR') { res = a ^ b; muxSel.textContent = "Sel = 10"; }
            else if (op === 'ADD') { 
                res = a + b; 
                muxSel.textContent = "Sel = 11"; 
                if (res > 15) carry = 1;
            }

            res = res & 0xF; // constrain to 4 bit
            busOut.textContent = `OUT = ${to4Bit(res)} (${res})`;

            if (op === 'ADD' && (a + b) > 15) {
                if (overflowMsg) {
                    overflowMsg.style.display = 'block';
                    overflowMsg.innerHTML = `<strong>Wait, why is the output ${res} instead of ${a + b}?</strong><br>You just witnessed <em>Integer Overflow</em>! This ALU datapath is restricted to <strong>4 bits</strong>, meaning the maximum value it can hold is 15 (<code>1111</code>). The real mathematical sum is ${a + b} (<code>${(a+b).toString(2)}</code>, which requires 5 bits). The ALU simply truncates the 5th bit, storing only the lower 4 bits (which equals ${res}). However, notice that the <strong>Carry Flag</strong> has been set to 1! The processor can use this flag in the next clock cycle to prevent data loss.`;
                }
            } else {
                if (overflowMsg) overflowMsg.style.display = 'none';
            }

            flagZ.textContent = `Zero: ${res === 0 ? 1 : 0}`;
            if (res === 0) flagZ.classList.add('active'); 
            else flagZ.classList.remove('active');

            flagC.textContent = `Carry: ${carry}`;
            if (carry === 1) flagC.classList.add('active'); 
            else flagC.classList.remove('active');
        }

        selA.addEventListener('change', updateALU);
        selB.addEventListener('change', updateALU);
        selOp.addEventListener('change', updateALU);

        // Initialize state
        updateALU();
    }


    /* =========================================
       CHAPTER 3: Visual Assembly Engine
    ========================================= */
    function initChapter3() {
        const btnStep = document.getElementById('btn-ch3-step');
        const btnReset = document.getElementById('btn-ch3-reset');
        
        const uiRegs = {
            pc: document.getElementById('reg-pc'),
            ir: document.getElementById('reg-ir'),
            r1: document.getElementById('reg-r1'),
            r2: document.getElementById('reg-r2'),
            r3: document.getElementById('reg-r3')
        };
        const uiAnim = document.getElementById('cpu-anim-text');
        const uiLines = Array.from(document.querySelectorAll('.asm-line'));

        if (!btnStep || !uiRegs.pc || !uiAnim) throw new Error("Ch3 elements missing.");

        let state = {
            pc: 0,
            r1: 0, r2: 0, r3: 0,
            halted: false,
            stage: 'fetch'
        };

        const program = [
            { addr: 0x00, text: "MOV R1, #5", action: () => { state.r1 = 5; } },
            { addr: 0x04, text: "MOV R2, #10", action: () => { state.r2 = 10; } },
            { addr: 0x08, text: "ADD R3, R1, R2", action: () => { state.r3 = state.r1 + state.r2; } },
            { addr: 0x0C, text: "SUB R1, R2, R1", action: () => { state.r1 = state.r2 - state.r1; } },
            { addr: 0x10, text: "HALT", action: () => { state.halted = true; } }
        ];

        function toHex(n) { 
            return '0x' + n.toString(16).padStart(2, '0').toUpperCase(); 
        }

        function highlightUI(id, val) {
            if(!uiRegs[id]) return;
            uiRegs[id].textContent = val;
            uiRegs[id].classList.remove('highlight');
            void uiRegs[id].offsetWidth; // force reflow
            uiRegs[id].classList.add('highlight');
        }

        function updateVisuals() {
            if (state.pc < program.length) {
                uiRegs.pc.textContent = toHex(program[state.pc].addr);
            }
            
            uiLines.forEach(l => l.classList.remove('active'));
            if (state.pc < uiLines.length && uiLines[state.pc]) {
                uiLines[state.pc].classList.add('active');
            }
        }

        function step() {
            if (state.halted) {
                uiAnim.textContent = "[HALTED] System is halted. Please reset.";
                return;
            }

            if (state.pc >= program.length) return;

            let inst = program[state.pc];

            if (state.stage === 'fetch') {
                uiAnim.textContent = `[FETCH] PC = ${toHex(inst.addr)} -> Fetching Instruction.`;
                highlightUI('ir', inst.text);
                state.stage = 'execute';
            } else if (state.stage === 'execute') {
                uiAnim.textContent = `[EXECUTE] Executing: ${inst.text}`;
                
                try {
                    inst.action();
                } catch(e) {
                    console.error("Execution error", e);
                }
                
                uiRegs.r1.textContent = state.r1;
                uiRegs.r2.textContent = state.r2;
                uiRegs.r3.textContent = state.r3;

                if (inst.text.includes("R1,")) highlightUI('r1', state.r1);
                if (inst.text.includes("R2,")) highlightUI('r2', state.r2);
                if (inst.text.includes("R3,")) highlightUI('r3', state.r3);

                if (!state.halted) {
                    state.pc++;
                    updateVisuals();
                } else {
                    uiAnim.textContent = `[EXECUTE] HALT encountered. Execution stopped.`;
                }
                state.stage = 'fetch';
            }
        }

        function reset() {
            state = { pc: 0, r1: 0, r2: 0, r3: 0, halted: false, stage: 'fetch' };
            uiRegs.pc.textContent = "0x00";
            uiRegs.ir.textContent = "MOV R1, #5";
            uiRegs.r1.textContent = "0";
            uiRegs.r2.textContent = "0";
            uiRegs.r3.textContent = "0";
            uiAnim.textContent = "[System Ready] Click Step to Fetch instruction.";
            updateVisuals();
        }

        btnStep.addEventListener('click', step);
        btnReset.addEventListener('click', reset);

        // Init
        updateVisuals();
    }

    /* =========================================
       CHAPTER 4: Microcode Sequencer
    ========================================= */
    function initChapter4() {
        const btnMacro = document.getElementById('btn-ch4-macro');
        const btnMicro = document.getElementById('btn-ch4-micro');
        const macroIr = document.getElementById('ch4-macro-ir');
        const upcBox = document.getElementById('ch4-upc');
        const signalBox = document.getElementById('ch4-signals');
        
        if(!btnMacro) return;

        let state = 0; // 0=idle, 1=fetch1, 2=fetch2, 3=fetch3, 4=exec1, 5=exec2, 6=exec3
        const uLines = [
            document.getElementById('u-fetch1'),
            document.getElementById('u-fetch2'),
            document.getElementById('u-fetch3'),
            document.getElementById('u-exec1'),
            document.getElementById('u-exec2'),
            document.getElementById('u-exec3')
        ];

        function hideAll() { uLines.forEach(l => { if(l) { l.classList.remove('active'); l.style.display = 'block'; }}); }
        function showFetch() { hideAll(); uLines[3].style.display = 'none'; uLines[4].style.display = 'none'; uLines[5].style.display = 'none'; }
        function showExec() { hideAll(); uLines[0].style.display = 'none'; uLines[1].style.display = 'none'; uLines[2].style.display = 'none'; }
        function setActive(idx) { uLines.forEach(l => { if(l) l.classList.remove('active'); }); if(uLines[idx]) uLines[idx].classList.add('active'); }

        btnMacro.addEventListener('click', () => {
            state = 1;
            btnMacro.disabled = true;
            btnMicro.disabled = false;
            macroIr.textContent = "WAITING...";
            upcBox.textContent = "0x00";
            signalBox.textContent = "MemRead=1, IR_Write=1";
            showFetch();
            setActive(0);
        });

        btnMicro.addEventListener('click', () => {
            if (state === 1) {
                state = 2; upcBox.textContent = "0x01"; signalBox.textContent = "ALU_Add=1, PC_Write=1"; setActive(1);
            } else if (state === 2) {
                state = 3; upcBox.textContent = "0x02"; signalBox.textContent = "Decode(IR) -> 0x10"; setActive(2);
                macroIr.textContent = "ADD R1, R2, R3";
            } else if (state === 3) {
                state = 4; upcBox.textContent = "0x10"; signalBox.textContent = "RegRead=1, ALU_Add=1"; showExec(); setActive(3);
            } else if (state === 4) {
                state = 5; upcBox.textContent = "0x11"; signalBox.textContent = "RegWrite=1"; setActive(4);
            } else if (state === 5) {
                state = 6; upcBox.textContent = "0x12"; signalBox.textContent = "uPC_Load=1 (0x00)"; setActive(5);
            } else if (state === 6) {
                state = 0;
                btnMacro.disabled = false; btnMicro.disabled = true;
                upcBox.textContent = "0x00"; signalBox.textContent = "- NONE -";
                hideAll(); showFetch();
            }
        });
    }

    /* =========================================
       CHAPTER 5: Multi-Cycle Datapath
    ========================================= */
    function initChapter5() {
        const btnClock = document.getElementById('btn-ch5-clock');
        const cycleText = document.getElementById('ch5-cycle-count');
        if(!btnClock) return;

        let cycle = 0;
        let pipeline = [null, null, null, null, null]; // IF, ID, EX, MEM, WB
        const tokens = [
            document.getElementById('token-if'),
            document.getElementById('token-id'),
            document.getElementById('token-ex'),
            document.getElementById('token-mem'),
            document.getElementById('token-wb')
        ];

        btnClock.addEventListener('click', () => {
            if (cycle >= 5) {
                cycle = 0;
                pipeline = [null, null, null, null, null];
            }
            cycle++;
            cycleText.textContent = `Cycle: ${cycle}`;
            
            // Shift pipeline
            for(let i = 4; i > 0; i--) {
                pipeline[i] = pipeline[i-1];
            }
            pipeline[0] = (cycle === 1); // New instruction enters IF only on the first cycle of the sequence

            tokens.forEach((t, i) => {
                if(t) {
                    if (pipeline[i]) t.classList.add('active');
                    else t.classList.remove('active');
                }
            });
        });
    }

    /* =========================================
       CHAPTER 6: Pipeline Hazards
    ========================================= */
    function initChapter6() {
        const btnHazard = document.getElementById('btn-ch6-hazard');
        const btnReset = document.getElementById('btn-ch6-reset');
        const i2 = document.getElementById('pipe-i2');
        const i3 = document.getElementById('pipe-i3');
        if(!btnHazard) return;

        btnHazard.addEventListener('click', () => {
            if(i2 && i3) {
                i2.innerHTML = `<td>I2: SUB R4, <b>R1</b>, R5</td><td></td><td class="pipe-s">IF</td><td class="pipe-s">ID</td><td class="pipe-stall">STALL</td><td class="pipe-stall">STALL</td><td class="pipe-s">EX</td><td class="pipe-s">MEM</td><td class="pipe-s">WB</td>`;
                i3.innerHTML = `<td>I3: AND R6, R7, R8</td><td></td><td></td><td class="pipe-s">IF</td><td class="pipe-stall">STALL</td><td class="pipe-stall">STALL</td><td class="pipe-s">ID</td><td class="pipe-s">EX</td><td class="pipe-s">MEM</td>`;
            }
        });
        
        btnReset.addEventListener('click', () => {
            if(i2 && i3) {
                i2.innerHTML = `<td>I2: SUB R4, <b>R1</b>, R5</td><td></td><td class="pipe-s">IF</td><td class="pipe-s">ID</td><td class="pipe-s">EX</td><td class="pipe-s">MEM</td><td class="pipe-s">WB</td><td></td><td></td>`;
                i3.innerHTML = `<td>I3: AND R6, R7, R8</td><td></td><td></td><td class="pipe-s">IF</td><td class="pipe-s">ID</td><td class="pipe-s">EX</td><td class="pipe-s">MEM</td><td class="pipe-s">WB</td><td></td>`;
            }
        });
    }

    /* =========================================
       CHAPTER 7: Cache Spatial Locality
    ========================================= */
    function initChapter7() {
        const btnLoop = document.getElementById('btn-ch7-loop');
        const btnReset = document.getElementById('btn-ch7-reset');
        const cpu = document.getElementById('ch7-cpu');
        const latBox = document.getElementById('ch7-latency');
        const cacheBody = document.getElementById('ch7-cache-body');
        const status = document.getElementById('ch7-status');
        if(!btnLoop) return;

        let addr = 0;
        let cache = [ { v: 0, tag: -1 }, { v: 0, tag: -1 } ];

        function reset() {
            addr = 0;
            cache = [ { v: 0, tag: -1 }, { v: 0, tag: -1 } ];
            btnLoop.textContent = "Execute Loop (Access 0 to 3)";
            btnLoop.disabled = false;
            cpu.innerHTML = "Idle";
            latBox.textContent = "Latency: --";
            status.textContent = "System Ready";
            status.style.color = "";
            cacheBody.innerHTML = `
                <tr id="ch7-cblock-0"><td>0</td><td class="cache-v">0</td><td class="cache-d">Empty</td></tr>
                <tr id="ch7-cblock-1"><td>1</td><td class="cache-v">0</td><td class="cache-d">Empty</td></tr>
            `;
            for(let i=0; i<4; i++) {
                let m = document.getElementById(`ch7-mem-${i}`);
                if(m) { m.style.background = ""; m.style.borderColor = "var(--border-color)"; }
            }
        }

        btnReset.addEventListener('click', reset);

        btnLoop.addEventListener('click', () => {
            if (addr > 3) return reset();
            
            cpu.innerHTML = `Requesting<br>Address ${addr}`;
            btnLoop.disabled = true;

            // Block size is 2. So addr 0 and 1 map to block 0. Addr 2 and 3 map to block 1.
            let blockIdx = Math.floor(addr / 2);
            let hit = cache[blockIdx].v && cache[blockIdx].tag === blockIdx;

            if (hit) {
                status.textContent = `CACHE HIT! Address ${addr} found in Block ${blockIdx}.`;
                status.style.color = "var(--accent-green)";
                latBox.innerHTML = `<span style="color:var(--accent-green);">Latency: 1 Cycle (Fast!)</span>`;
                cpu.innerHTML = `Received<br>Address ${addr}`;
                
                let targetRow = document.getElementById(`ch7-cblock-${blockIdx}`);
                if(targetRow) {
                    targetRow.style.background = "rgba(16, 185, 129, 0.2)";
                    setTimeout(() => targetRow.style.background = "", 500);
                }
                
                addr++;
                btnLoop.disabled = false;
                if(addr <= 3) btnLoop.textContent = `Execute Loop (Access Addr ${addr})`;
                else btnLoop.textContent = `Loop Finished! Reset?`;
            } else {
                status.textContent = `CACHE MISS! Fetching Block ${blockIdx} (Addresses ${blockIdx*2} & ${blockIdx*2+1}) from Main Memory...`;
                status.style.color = "var(--accent-neon)";
                latBox.innerHTML = `<span style="color:var(--accent-neon);">Latency: 100 Cycles (Stall)</span>`;
                
                let m1 = document.getElementById(`ch7-mem-${blockIdx*2}`);
                let m2 = document.getElementById(`ch7-mem-${blockIdx*2+1}`);
                if(m1) { m1.style.background = "rgba(234, 88, 12, 0.2)"; m1.style.borderColor = "var(--accent-neon)"; }
                if(m2) { m2.style.background = "rgba(234, 88, 12, 0.2)"; m2.style.borderColor = "var(--accent-neon)"; }

                setTimeout(() => {
                    if(m1) { m1.style.background = ""; m1.style.borderColor = "var(--border-color)"; }
                    if(m2) { m2.style.background = ""; m2.style.borderColor = "var(--border-color)"; }

                    cache[blockIdx].v = 1;
                    cache[blockIdx].tag = blockIdx;
                    
                    let targetRow = document.getElementById(`ch7-cblock-${blockIdx}`);
                    if(targetRow) {
                        targetRow.querySelector('.cache-v').textContent = "1";
                        targetRow.querySelector('.cache-v').style.color = "var(--accent-green)";
                        targetRow.querySelector('.cache-v').style.fontWeight = "bold";
                        targetRow.querySelector('.cache-d').textContent = `[Addr ${blockIdx*2}, Addr ${blockIdx*2+1}]`;
                    }
                    
                    cpu.innerHTML = `Received<br>Address ${addr}`;
                    status.textContent = `Block ${blockIdx} loaded into Cache. Next request might be a hit!`;
                    status.style.color = "var(--text-primary)";
                    
                    addr++;
                    btnLoop.disabled = false;
                    if(addr <= 3) btnLoop.textContent = `Execute Loop (Access Addr ${addr})`;
                    else btnLoop.textContent = `Loop Finished! Reset?`;
                }, 1500);
            }
        });
    }

    /* =========================================
       CHAPTER 8: Virtual Memory (Swapping)
    ========================================= */
    function initChapter8() {
        const btnB = document.getElementById('btn-ch8-alloc-browser');
        const btnG = document.getElementById('btn-ch8-alloc-game');
        const btnM = document.getElementById('btn-ch8-alloc-music');
        const btnR = document.getElementById('btn-ch8-reset');
        
        const bPages = document.getElementById('ch8-browser-pages');
        const gPages = document.getElementById('ch8-game-pages');
        const mPages = document.getElementById('ch8-music-pages');
        
        const ram = document.getElementById('ch8-ram');
        const disk = document.getElementById('ch8-disk');
        const ramStat = document.getElementById('ch8-ram-status');
        const msg = document.getElementById('ch8-msg');
        
        if(!btnB) return;

        let framesUsed = 0;
        let memoryPages = []; // { app: string, color: string, id: number }
        let pageIdCounter = 0;
        
        function allocate(appName, color, numPages) {
            msg.style.color = "var(--text-primary)";
            
            for(let i=0; i<numPages; i++) {
                let pId = pageIdCounter++;
                let pageObj = { app: appName, color: color, id: pId };
                memoryPages.push(pageObj);
                
                // Add to App Box
                let appBox = document.createElement('div');
                appBox.style.width = '20px';
                appBox.style.height = '20px';
                appBox.style.background = color;
                appBox.style.borderRadius = '2px';
                
                if(appName === 'Browser') bPages.appendChild(appBox);
                else if(appName === 'Game') gPages.appendChild(appBox);
                else if(appName === 'Music') mPages.appendChild(appBox);
                
                // Try to put in RAM
                let memBlock = document.createElement('div');
                memBlock.style.background = color;
                memBlock.style.color = '#fff';
                memBlock.style.padding = '0.2rem 0.5rem';
                memBlock.style.fontSize = '0.8rem';
                memBlock.style.borderRadius = '4px';
                memBlock.style.textAlign = 'center';
                memBlock.style.animation = 'pulseVal 0.5s ease';
                memBlock.textContent = `${appName} Page ${pId}`;
                
                if (framesUsed < 4) {
                    ram.appendChild(memBlock);
                    framesUsed++;
                    msg.textContent = `Allocated ${appName} page directly to Physical RAM.`;
                } else {
                    // RAM full, swap oldest
                    msg.textContent = `RAM FULL! OS is evicting oldest page to Disk to make room for ${appName}...`;
                    msg.style.color = "var(--accent-neon)";
                    
                    let oldest = ram.firstElementChild;
                    if(oldest) {
                        ram.removeChild(oldest);
                        disk.appendChild(oldest);
                    }
                    ram.appendChild(memBlock);
                }
                ramStat.textContent = `${framesUsed}/4 Frames Used`;
            }
        }
        
        btnB.addEventListener('click', () => { allocate('Browser', '#3b82f6', 2); btnB.disabled = true; });
        btnG.addEventListener('click', () => { allocate('Game', '#10b981', 2); btnG.disabled = true; });
        btnM.addEventListener('click', () => { allocate('Music', '#a855f7', 1); btnM.disabled = true; });
        
        btnR.addEventListener('click', () => {
            framesUsed = 0;
            memoryPages = [];
            bPages.innerHTML = ''; gPages.innerHTML = ''; mPages.innerHTML = '';
            ram.innerHTML = ''; disk.innerHTML = '';
            ramStat.textContent = `0/4 Frames Used`;
            msg.textContent = "Start opening apps to fill up RAM.";
            msg.style.color = "var(--accent-neon)";
            btnB.disabled = false; btnG.disabled = false; btnM.disabled = false;
        });
    }

    /* =========================================
       CHAPTER 9: DMA Controller
    ========================================= */
    function initChapter9() {
        const btnDma = document.getElementById('btn-ch9-dma');
        const cpuState = document.getElementById('ch9-cpu-state');
        const dmaStatus = document.getElementById('ch9-dma-status');
        const dmaProg = document.getElementById('ch9-dma-progress');
        const dmaBytes = document.getElementById('ch9-bytes');
        if(!btnDma) return;

        let running = false;
        btnDma.addEventListener('click', () => {
            if(running) return;
            running = true;
            btnDma.disabled = true;

            dmaStatus.textContent = "TRANSFERRING...";
            dmaStatus.style.color = "var(--accent-neon)";
            
            let p = 0;
            let interval = setInterval(() => {
                p += 10;
                dmaProg.style.width = p + "%";
                dmaBytes.textContent = `${p/10} / 10 GB`;

                if(p >= 100) {
                    clearInterval(interval);
                    dmaStatus.textContent = "COMPLETE - Sending Interrupt!";
                    dmaStatus.style.color = "var(--accent-green)";
                    cpuState.textContent = "Interrupt Received! Running ISR...";
                    cpuState.style.background = "rgba(99, 102, 241, 0.2)";
                    cpuState.style.borderColor = "var(--accent-purple)";

                    setTimeout(() => {
                        cpuState.textContent = "Running User Program (Game)";
                        cpuState.style.background = "rgba(0,255,0,0.1)";
                        cpuState.style.borderColor = "var(--accent-green)";
                        dmaStatus.textContent = "IDLE";
                        dmaStatus.style.color = "";
                        dmaProg.style.width = "0%";
                        dmaBytes.textContent = "0 / 10 GB";
                        running = false;
                        btnDma.disabled = false;
                    }, 3000);
                }
            }, 200);
        });
    }

    /* =========================================
       CHAPTER 10: Cache Coherence (MESI)
    ========================================= */
    function initChapter10() {
        const rd0 = document.getElementById('btn-ch10-c0-rd');
        const wr0 = document.getElementById('btn-ch10-c0-wr');
        const rd1 = document.getElementById('btn-ch10-c1-rd');
        const wr1 = document.getElementById('btn-ch10-c1-wr');
        
        const st0 = document.getElementById('ch10-c0-state');
        const val0 = document.getElementById('ch10-c0-val');
        const st1 = document.getElementById('ch10-c1-state');
        const val1 = document.getElementById('ch10-c1-val');
        
        const msg = document.getElementById('ch10-msg');
        if(!rd0) return;

        let memoryX = 5;

        function setC0(state, val) {
            st0.textContent = `State: ${state}`;
            val0.textContent = val;
            st0.style.color = (state === 'INVALID') ? 'var(--text-secondary)' : 'var(--accent-green)';
            if(state === 'INVALID') val0.style.color = 'var(--text-secondary)';
            else val0.style.color = 'var(--text-primary)';
        }

        function setC1(state, val) {
            st1.textContent = `State: ${state}`;
            val1.textContent = val;
            st1.style.color = (state === 'INVALID') ? 'var(--text-secondary)' : 'var(--accent-green)';
            if(state === 'INVALID') val1.style.color = 'var(--text-secondary)';
            else val1.style.color = 'var(--text-primary)';
        }

        rd0.addEventListener('click', () => {
            msg.textContent = "Core 0 Read Miss. Fetched from Mem.";
            setC0("SHARED", memoryX);
        });

        wr0.addEventListener('click', () => {
            memoryX = 10;
            msg.textContent = "Core 0 Write! Broadcasting Invalidate to Core 1.";
            setC0("MODIFIED", 10);
            setC1("INVALID", "--");
        });

        rd1.addEventListener('click', () => {
            msg.textContent = "Core 1 Read Miss. Fetched from Mem/C0.";
            setC1("SHARED", memoryX);
            if(st0.textContent.includes("MODIFIED")) setC0("SHARED", memoryX);
        });

        wr1.addEventListener('click', () => {
            memoryX = 99;
            msg.textContent = "Core 1 Write! Broadcasting Invalidate to Core 0.";
            setC1("MODIFIED", 99);
            setC0("INVALID", "--");
        });
    }

    // Attempt to initialize whether DOM is loading or already loaded
    function runAll() {
        safeInit('Chapter 1', initChapter1);
        safeInit('Chapter 2', initChapter2);
        safeInit('Chapter 3', initChapter3);
        safeInit('Chapter 4', initChapter4);
        safeInit('Chapter 5', initChapter5);
        safeInit('Chapter 6', initChapter6);
        safeInit('Chapter 7', initChapter7);
        safeInit('Chapter 8', initChapter8);
        safeInit('Chapter 9', initChapter9);
        safeInit('Chapter 10', initChapter10);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAll);
    } else {
        runAll();
    }
})();
