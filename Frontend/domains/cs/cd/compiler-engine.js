document.addEventListener('DOMContentLoaded', () => {
    
    // --- Smooth Scrolling for Navigation ---
    document.querySelectorAll('.chapter-list a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
                document.querySelectorAll('.chapter-list a').forEach(a => a.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Helper: Shared Lexer logic for other simulators
    function tokenize(code) {
        const rules = [
            { type: 'type', regex: /^(int|float|void|char|double|string|bool)\b/ },
            { type: 'keyword', regex: /^(if|else|while|return)\b/ },
            { type: 'id', regex: /^[a-zA-Z_]\w*/ },
            { type: 'num', regex: /^[0-9]+(\.[0-9]+)?/ },
            { type: 'str', regex: /^"[^"]*"/ },
            { type: 'op', regex: /^(=|\+|\-|\*|\/|==|!=|<|>|<=|>=)/ },
            { type: 'punc', regex: /^(;|:|,|\(|\)|\{|\})/ },
            { type: 'ws', regex: /^\s+/ }
        ];

        let tokens = [];
        let str = code;

        while (str.length > 0) {
            let matched = false;
            for (const rule of rules) {
                const match = rule.regex.exec(str);
                if (match) {
                    if (rule.type !== 'ws') {
                        tokens.push({ type: rule.type, value: match[0] });
                    }
                    str = str.substring(match[0].length);
                    matched = true;
                    break;
                }
            }
            if (!matched) { str = str.substring(1); } // Skip unknown
        }
        return tokens;
    }


    // ==========================================
    // SIMULATOR 1: LEXER (DFA Tokenizer)
    // ==========================================
    const btnLex = document.getElementById('btn-lex');
    const btnLexRand = document.getElementById('btn-lex-rand');
    const btnLexReset = document.getElementById('btn-lex-reset');
    const lexInput = document.getElementById('lex-input');
    const lexCharBox = document.getElementById('lex-char-box');
    const lexTokenBox = document.getElementById('lex-token-box');
    
    const lexExamples = [
        'int speed = 85;',
        'float gravity = 9.81;',
        'string status = "OK";',
        'bool isValid = true;'
    ];

    function randomizeLexer() {
        let current = lexInput.value;
        let next;
        do {
            next = lexExamples[Math.floor(Math.random() * lexExamples.length)];
        } while (next === current);
        lexInput.value = next;
        lexCharBox.innerHTML = '<span class="placeholder-text">Awaiting scan...</span>';
        lexTokenBox.innerHTML = '<span class="placeholder-text">Awaiting scan...</span>';
    }

    btnLexRand.addEventListener('click', randomizeLexer);
    btnLexReset.addEventListener('click', randomizeLexer);

    btnLex.addEventListener('click', () => {
        const code = lexInput.value;
        if (!code) return;
        
        lexCharBox.innerHTML = '';
        lexTokenBox.innerHTML = '';
        
        // Spread characters for visual scanning
        const chars = code.split('');
        chars.forEach(c => {
            let span = document.createElement('span');
            span.className = 'char-span';
            span.textContent = c === ' ' ? '_' : c;
            lexCharBox.appendChild(span);
        });

        const tokens = tokenize(code);
        let charIndex = 0;
        let tokenIndex = 0;

        function scanNext() {
            if (charIndex >= chars.length) {
                // Done scanning
                return;
            }

            const charSpans = lexCharBox.querySelectorAll('.char-span');
            charSpans.forEach(s => s.classList.remove('scanning'));
            
            // Fast forward spaces for visuals
            while(charIndex < chars.length && chars[charIndex] === ' ') {
                charSpans[charIndex].classList.add('done');
                charIndex++;
            }
            
            if (charIndex >= chars.length) return;

            // Highlight current scan block based on the current token
            let currentToken = tokens[tokenIndex];
            if (currentToken) {
                // Approximate mapping for visual effect
                let tLen = currentToken.value.length;
                for(let i=0; i<tLen && (charIndex+i)<chars.length; i++) {
                    charSpans[charIndex + i].classList.add('scanning');
                }
                
                setTimeout(() => {
                    for(let i=0; i<tLen && (charIndex+i)<chars.length; i++) {
                        charSpans[charIndex + i].classList.remove('scanning');
                        charSpans[charIndex + i].classList.add('done');
                    }
                    
                    const tSpan = document.createElement('span');
                    tSpan.className = `token tok-${currentToken.type}`;
                    tSpan.textContent = `${currentToken.type.toUpperCase()}('${currentToken.value}')`;
                    lexTokenBox.appendChild(tSpan);
                    
                    charIndex += tLen;
                    tokenIndex++;
                    setTimeout(scanNext, 400);
                }, 600);
            }
        }
        
        scanNext();
    });


    // ==========================================
    // SIMULATOR 2: PARSER (AST Builder)
    // ==========================================
    const btnParse = document.getElementById('btn-parse');
    const btnParseRand = document.getElementById('btn-parse-rand');
    const btnParseReset = document.getElementById('btn-parse-reset');
    const parseInput = document.getElementById('parse-input');
    const astBox = document.getElementById('parse-ast-box');

    const parseExamples = [
        'A + B * C',
        'X * Y - Z',
        'P / Q + R'
    ];

    function randomizeParser() {
        let current = parseInput.value;
        let next;
        do {
            next = parseExamples[Math.floor(Math.random() * parseExamples.length)];
        } while (next === current);
        parseInput.value = next;
        astBox.innerHTML = '<span class="placeholder-text">Awaiting expression...</span>';
    }

    btnParseRand.addEventListener('click', randomizeParser);
    btnParseReset.addEventListener('click', randomizeParser);

    btnParse.addEventListener('click', () => {
        const code = parseInput.value.trim();
        if(!code) return;
        astBox.innerHTML = '';
        
        const tokens = tokenize(code);
        // Simple logic for binary operations to demonstrate precedence visually
        
        let opStack = [];
        let outputQueue = [];
        
        // Very rough Shunting Yard for building the visual tree
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
        
        tokens.forEach(t => {
            if (t.type === 'num' || t.type === 'id') {
                outputQueue.push(t);
            } else if (t.type === 'op') {
                while(opStack.length > 0 && precedence[opStack[opStack.length-1].value] >= precedence[t.value]) {
                    outputQueue.push(opStack.pop());
                }
                opStack.push(t);
            }
        });
        while(opStack.length > 0) outputQueue.push(opStack.pop());

        // Build HTML visually (Simulated layout)
        let htmlStr = `<div style="display:flex; flex-direction:column; align-items:center;">`;
        
        // This is a mocked layout to visually represent the AST structure for typical A + B * C input
        
        let mainOp = tokens.find(t => t.value === '+' || t.value === '-');
        let highOp = tokens.find(t => t.value === '*' || t.value === '/');
        
        if (mainOp && highOp) {
            htmlStr += `<div class="ast-node" style="animation-delay: 0s;">${mainOp.value} (OP)</div>`;
            htmlStr += `<div style="display:flex; gap: 2rem; margin-top: 0.5rem; align-items:flex-start;">`;
            htmlStr += `   <div class="ast-node" style="animation-delay: 0.3s;">${tokens[tokens.indexOf(mainOp)-1].value}</div>`;
            htmlStr += `   <div style="display:flex; flex-direction:column; align-items:center;">`;
            htmlStr += `       <div class="ast-node" style="animation-delay: 0.6s;">${highOp.value} (OP)</div>`;
            htmlStr += `       <div style="display:flex; gap: 1rem; margin-top: 0.5rem;">`;
            htmlStr += `           <div class="ast-node" style="animation-delay: 0.9s;">${tokens[tokens.indexOf(highOp)-1].value}</div>`;
            htmlStr += `           <div class="ast-node" style="animation-delay: 1.2s;">${tokens[tokens.indexOf(highOp)+1].value}</div>`;
            htmlStr += `       </div>`;
            htmlStr += `   </div>`;
            htmlStr += `</div>`;
        } else if (mainOp || highOp) {
            let op = mainOp || highOp;
            htmlStr += `<div class="ast-node" style="animation-delay: 0s;">${op.value} (OP)</div>`;
            htmlStr += `<div style="display:flex; gap: 2rem; margin-top: 0.5rem;">`;
            htmlStr += `   <div class="ast-node" style="animation-delay: 0.3s;">${tokens[tokens.indexOf(op)-1].value}</div>`;
            htmlStr += `   <div class="ast-node" style="animation-delay: 0.6s;">${tokens[tokens.indexOf(op)+1].value}</div>`;
            htmlStr += `</div>`;
        } else {
            htmlStr += `<div class="ast-node">Expression too simple or invalid format.</div>`;
        }
        htmlStr += `</div>`;
        
        astBox.innerHTML = htmlStr;
    });


    // ==========================================
    // SIMULATOR 3: SEMANTIC (Type & Symbol Table)
    // ==========================================
    const btnSem = document.getElementById('btn-sem');
    const btnSemRand = document.getElementById('btn-sem-rand');
    const btnSemReset = document.getElementById('btn-sem-reset');
    const semInput = document.getElementById('sem-input');
    const semTableBox = document.getElementById('sem-table-box');
    const semLogBox = document.getElementById('sem-log-box');
    
    const semExamples = [
        'int age = 25;',
        'string name = "Alice";',
        'int error = "Hello";',
        'float pi = 3.14;'
    ];

    const renderEmptySem = () => {
        semTableBox.innerHTML = `
            <div class="sym-row sym-header">
                <span>Name</span><span>Type</span><span>Size</span><span>Scope</span>
            </div>
            <span class="placeholder-text">Table Empty.</span>
        `;
        semLogBox.innerHTML = '<span class="placeholder-text">Awaiting declaration...</span>';
    };

    function randomizeSemantic() {
        let current = semInput.value;
        let next;
        do {
            next = semExamples[Math.floor(Math.random() * semExamples.length)];
        } while (next === current);
        semInput.value = next;
        renderEmptySem();
    }

    btnSemRand.addEventListener('click', randomizeSemantic);
    btnSemReset.addEventListener('click', randomizeSemantic);
    
    // Initialize Symbol Table Header
    renderEmptySem();

    btnSem.addEventListener('click', () => {
        const code = semInput.value.trim();
        if(!code) return;
        
        const tokens = tokenize(code);
        
        // Clear previous runs
        semTableBox.innerHTML = `
            <div class="sym-row sym-header">
                <span>Name</span><span>Type</span><span>Size</span><span>Scope</span>
            </div>
        `;
        semLogBox.innerHTML = '';
        
        // Analyze
        let declaredType = null;
        let idName = null;
        let assignedVal = null;
        let assignedType = null;
        
        let typeToken = tokens.find(t => t.type === 'type');
        let idToken = tokens.find(t => t.type === 'id');
        let assignToken = tokens.find(t => t.value === '=');
        
        const log = (msg, status) => {
            const div = document.createElement('div');
            div.className = `log-line ${status}`;
            div.textContent = msg;
            semLogBox.appendChild(div);
        };
        
        if (!typeToken || !idToken) {
            log('Syntax Error: Missing Type or Identifier.', 'err');
            return;
        }
        
        declaredType = typeToken.value;
        idName = idToken.value;
        log(`Analyzer: Detected declaration of '${idName}' as '${declaredType}'.`, 'ok');
        
        // Determine assigned type
        if (assignToken) {
            let valToken = tokens[tokens.indexOf(assignToken) + 1];
            if (valToken) {
                if (valToken.type === 'num') {
                    assignedType = valToken.value.includes('.') ? (declaredType === 'double' || declaredType === 'float' ? declaredType : 'float') : 'int';
                    assignedVal = valToken.value;
                } else if (valToken.type === 'str') {
                    assignedType = 'string';
                    assignedVal = valToken.value;
                }
            }
        }
        
        setTimeout(() => {
            if (assignedType) {
                log(`Analyzer: Detected assignment value '${assignedVal}' of inferred type '${assignedType}'.`, 'ok');
                setTimeout(() => {
                    // Type Checking Logic
                    let typeMismatch = false;
                    if (declaredType === 'int' && assignedType !== 'int') typeMismatch = true;
                    if (declaredType === 'string' && assignedType !== 'string') typeMismatch = true;
                    if (declaredType === 'float' && assignedType === 'string') typeMismatch = true;
                    
                    if (typeMismatch) {
                        log(`TYPE ERROR: Cannot assign type '${assignedType}' to variable of type '${declaredType}'.`, 'err');
                    } else {
                        log(`Type Check Passed. Semantic rules validated.`, 'ok');
                        
                        // Add to Symbol Table
                        const symRow = document.createElement('div');
                        symRow.className = 'sym-row';
                        let size = declaredType === 'int' ? '4B' : (declaredType === 'float' ? '4B' : 'Var');
                        symRow.innerHTML = `<span>${idName}</span><span>${declaredType}</span><span>${size}</span><span>Global</span>`;
                        semTableBox.appendChild(symRow);
                    }
                }, 800);
            } else {
                log(`Declaration only. Skipping type compatibility check.`, 'warn');
                // Add to Symbol Table
                const symRow = document.createElement('div');
                symRow.className = 'sym-row';
                let size = declaredType === 'int' ? '4B' : 'Var';
                symRow.innerHTML = `<span>${idName}</span><span>${declaredType}</span><span>${size}</span><span>Global</span>`;
                semTableBox.appendChild(symRow);
            }
        }, 800);
    });

    // ==========================================
    // SIMULATOR 4: IR GENERATOR (Three Address Code)
    // ==========================================
    const btnIr = document.getElementById('btn-ir');
    const btnIrRand = document.getElementById('btn-ir-rand');
    const btnIrReset = document.getElementById('btn-ir-reset');
    const irInput = document.getElementById('ir-input');
    const irOutBox = document.getElementById('ir-out-box');

    const irExamples = [
        'X = (A + B) * C',
        'RESULT = BASE - OFFSET * 4',
        'Y = SPEED / TIME + 10'
    ];

    function randomizeIr() {
        let current = irInput.value;
        let next;
        do {
            next = irExamples[Math.floor(Math.random() * irExamples.length)];
        } while (next === current);
        irInput.value = next;
        irOutBox.innerHTML = '<span class="placeholder-text">Awaiting AST flattening...</span>';
    }

    btnIrRand.addEventListener('click', randomizeIr);
    btnIrReset.addEventListener('click', randomizeIr);

    btnIr.addEventListener('click', () => {
        const code = irInput.value.trim();
        if(!code) return;
        irOutBox.innerHTML = '';
        
        const tokens = tokenize(code);
        let idName = tokens[0] && tokens[0].type === 'id' ? tokens[0].value : 'result';
        
        let rhsTokens = [];
        let pastAssign = false;
        for(let t of tokens) {
            if (t.value === ';') break;
            if (pastAssign) rhsTokens.push(t);
            if (t.value === '=') pastAssign = true;
        }
        
        let irLines = [];
        
        // Strip parens for simplicity of simulation
        let cleanRHS = rhsTokens.filter(t => t.value !== '(' && t.value !== ')');
        
        let mainOp = cleanRHS.find(t => t.value === '+' || t.value === '-');
        let highOp = cleanRHS.find(t => t.value === '*' || t.value === '/');
        
        if (mainOp && highOp) {
            let leftH = cleanRHS[cleanRHS.indexOf(highOp)-1].value;
            let rightH = cleanRHS[cleanRHS.indexOf(highOp)+1].value;
            irLines.push(`t1 = ${leftH} ${highOp.value} ${rightH}`);
            
            let leftM = cleanRHS[0].value;
            if(leftM === leftH) leftM = cleanRHS[cleanRHS.indexOf(mainOp)-1].value;
            
            irLines.push(`t2 = ${leftM} ${mainOp.value} t1`);
            irLines.push(`${idName} = t2`);
        } else if (mainOp || highOp) {
            let op = mainOp || highOp;
            let left = cleanRHS[cleanRHS.indexOf(op)-1].value;
            let right = cleanRHS[cleanRHS.indexOf(op)+1].value;
            irLines.push(`t1 = ${left} ${op.value} ${right}`);
            irLines.push(`${idName} = t1`);
        } else {
            let val = cleanRHS.length > 0 ? cleanRHS[0].value : '0';
            irLines.push(`${idName} = ${val}`);
        }

        irLines.forEach((line, i) => {
            setTimeout(() => {
                const div = document.createElement('div');
                div.className = 'code-line';
                div.textContent = line;
                irOutBox.appendChild(div);
            }, i * 400);
        });
    });

    // ==========================================
    // SIMULATOR 5: OPTIMIZER
    // ==========================================
    const btnOptLoad = document.getElementById('btn-opt-load');
    const btnOptFold = document.getElementById('btn-opt-fold');
    const btnOptDead = document.getElementById('btn-opt-dead');
    const btnOptReset = document.getElementById('btn-opt-reset');
    const optBeforeBox = document.getElementById('opt-before-box');
    const optAfterBox = document.getElementById('opt-after-box');

    let currentIR = [];

    const optExamples = [
        [
            "t1 = 24 * 60",
            "t2 = t1 * 60",
            "seconds_in_day = t2",
            "dead_var = 100",
            "t3 = dead_var + 5",
            "return seconds_in_day"
        ],
        [
            "t1 = 100 * 5",
            "distance = t1",
            "x = 42",
            "y = x * 0",
            "return distance"
        ]
    ];

    function randomizeOptimizer() {
        optBeforeBox.innerHTML = '';
        optAfterBox.innerHTML = '<span class="placeholder-text">Awaiting optimizations.</span>';
        
        let currentStr = currentIR.join('\\n');
        let next;
        do {
            next = optExamples[Math.floor(Math.random() * optExamples.length)];
        } while (next.join('\\n') === currentStr);
        currentIR = next;

        currentIR.forEach(line => {
            const div = document.createElement('div');
            div.className = 'code-line';
            div.textContent = line;
            optBeforeBox.appendChild(div);
        });
    }

    btnOptLoad.addEventListener('click', randomizeOptimizer);
    btnOptReset.addEventListener('click', randomizeOptimizer);

    btnOptFold.addEventListener('click', () => {
        if(currentIR.length === 0) return;
        optAfterBox.innerHTML = '';
        
        // Simulate Constant Folding
        let foldedIR = [];
        let nextIRState = [];
        currentIR.forEach(line => {
            if (line.includes("24 * 60")) {
                foldedIR.push(`<span class="strike-through">${line}</span>`);
                foldedIR.push(`<span class="highlight">t1 = 1440</span> (Folded)`);
                nextIRState.push("t1 = 1440");
            } else if (line.includes("t1 * 60")) {
                foldedIR.push(`<span class="strike-through">${line}</span>`);
                foldedIR.push(`<span class="highlight">t2 = 86400</span> (Folded)`);
                nextIRState.push("t2 = 86400");
            } else if (line.includes("100 * 5")) {
                foldedIR.push(`<span class="strike-through">${line}</span>`);
                foldedIR.push(`<span class="highlight">t1 = 500</span> (Folded)`);
                nextIRState.push("t1 = 500");
            } else if (line.includes("x * 0")) {
                foldedIR.push(`<span class="strike-through">${line}</span>`);
                foldedIR.push(`<span class="highlight">y = 0</span> (Folded)`);
                nextIRState.push("y = 0");
            } else {
                foldedIR.push(line);
                nextIRState.push(line);
            }
        });

        currentIR = nextIRState;

        foldedIR.forEach(line => {
            const div = document.createElement('div');
            div.className = 'code-line';
            div.innerHTML = line;
            optAfterBox.appendChild(div);
        });
    });

    btnOptDead.addEventListener('click', () => {
        if(currentIR.length === 0) return;
        optAfterBox.innerHTML = '';
        
        // Simulate Dead Code Elimination
        let deadIR = [];
        let finalIR = [];
        currentIR.forEach(line => {
            if (line.includes("dead_var") || line.includes("t3 =") || line.includes("x =") || line.includes("y =")) {
                if (line.includes("dead_var") || line.includes("t3 =") || line.includes("x = 42") || line.includes("y = 0")) {
                     deadIR.push(`<span class="strike-through">${line}</span> (Dead Code)`);
                } 
            } else {
                if (line.includes("t1 =") || line.includes("t2 =")) {
                     deadIR.push(`<span class="strike-through">${line}</span> (Unused Temp)`);
                } else {
                     deadIR.push(`<span class="highlight">${line}</span>`);
                     finalIR.push(line);
                }
            }
        });

        currentIR = finalIR;

        deadIR.forEach(line => {
            const div = document.createElement('div');
            div.className = 'code-line';
            div.innerHTML = line;
            optAfterBox.appendChild(div);
        });
    });

    // ==========================================
    // SIMULATOR 6: RUN-TIME ENVIRONMENT (CALL STACK & ACTIVATION RECORDS)
    // ==========================================
    const btnStackMain = document.getElementById('btn-stack-main');
    const btnStackCallA = document.getElementById('btn-stack-call-a');
    const btnStackCallB = document.getElementById('btn-stack-call-b');
    const btnStackRecurse = document.getElementById('btn-stack-recurse');
    const btnStackPop = document.getElementById('btn-stack-pop');
    const btnStackReset = document.getElementById('btn-stack-reset');

    const stackFramesBox = document.getElementById('stack-frames-box');
    const regEsp = document.getElementById('reg-esp');
    const regEbp = document.getElementById('reg-ebp');
    const stackDepthVal = document.getElementById('stack-depth-val');
    const stackAsmLog = document.getElementById('stack-asm-log');

    let callStack = [];
    const BASE_ADDR = 0x7FFF0000;
    const MAX_STACK_DEPTH = 5;

    function renderCallStack() {
        if (!stackFramesBox) return;
        stackFramesBox.innerHTML = '';

        if (callStack.length === 0) {
            stackFramesBox.innerHTML = '<span class="placeholder-text">Stack Empty. Click main() to initialize.</span>';
            if (regEsp) regEsp.innerText = '0x7FFF0000';
            if (regEbp) regEbp.innerText = '0x7FFF0000';
            if (stackDepthVal) stackDepthVal.innerText = '0 / 5';
            return;
        }

        const currentESP = BASE_ADDR - (callStack.length * 32);
        const currentEBP = BASE_ADDR - ((callStack.length - 1) * 32);

        if (regEsp) regEsp.innerText = `0x${currentESP.toString(16).toUpperCase()}`;
        if (regEbp) regEbp.innerText = `0x${currentEBP.toString(16).toUpperCase()}`;
        if (stackDepthVal) stackDepthVal.innerText = `${callStack.length} / ${MAX_STACK_DEPTH}`;

        // Render from top of stack (most recent) down to bottom
        for (let i = callStack.length - 1; i >= 0; i--) {
            const frame = callStack[i];
            const frameDiv = document.createElement('div');
            frameDiv.className = 'stack-frame';
            if (i === callStack.length - 1) {
                frameDiv.style.borderColor = '#10b981';
                frameDiv.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.25)';
            }

            let paramsHtml = frame.params.map(p => 
                `<div class="stack-cell param"><span>Param [ebp+${p.offset}]: <strong>${p.name}</strong></span><span>= ${p.val}</span></div>`
            ).join('');

            let localsHtml = frame.locals.map(l => 
                `<div class="stack-cell local"><span>Local [ebp-${l.offset}]: <strong>${l.name}</strong></span><span>= ${l.val}</span></div>`
            ).join('');

            frameDiv.innerHTML = `
                <div class="stack-frame-header" style="${i === callStack.length - 1 ? 'background: #10b981;' : ''}">
                    <span>${frame.name} [Frame #${i + 1}]</span>
                    <span style="font-family: monospace; font-size: 0.75rem;">EBP: 0x${(BASE_ADDR - (i * 32)).toString(16).toUpperCase()}</span>
                </div>
                <div class="stack-frame-body">
                    ${paramsHtml}
                    <div class="stack-cell ret-addr"><span>Return Address:</span><span>${frame.retAddr}</span></div>
                    <div class="stack-cell frame-ptr"><span>Saved Frame Pointer:</span><span>${frame.savedEBP}</span></div>
                    ${localsHtml}
                </div>
            `;
            stackFramesBox.appendChild(frameDiv);
        }
    }

    function logStackAsm(lines) {
        if (!stackAsmLog) return;
        stackAsmLog.innerHTML = '';
        lines.forEach(line => {
            const div = document.createElement('div');
            div.className = 'code-line';
            div.innerHTML = line;
            stackAsmLog.appendChild(div);
        });
    }

    function pushFrame(frame) {
        if (callStack.length >= MAX_STACK_DEPTH) {
            logStackAsm([
                `<span style="color: #ef4444; font-weight: bold;">⚠️ STACK OVERFLOW!</span>`,
                `<span style="color: #ef4444;">SIGSEGV: Maximum call stack limit reached.</span>`,
                `<span>Process terminated by OS memory guard.</span>`
            ]);
            return;
        }

        callStack.push(frame);
        renderCallStack();
        logStackAsm([
            `<span class="highlight">; --- Function Prologue: ${frame.name} ---</span>`,
            `<span>push    ebp            ; Save caller frame pointer</span>`,
            `<span>mov     ebp, esp       ; Set new base pointer</span>`,
            `<span>sub     esp, ${frame.locals.length * 4 + 8}       ; Allocate stack frame</span>`,
            `<span style="color: #10b981;">; Activated Frame at 0x${(BASE_ADDR - ((callStack.length - 1) * 32)).toString(16).toUpperCase()}</span>`
        ]);
    }

    if (btnStackMain) btnStackMain.addEventListener('click', () => {
        callStack = [];
        pushFrame({
            name: 'main()',
            retAddr: '0x00401010 (__libc_start)',
            savedEBP: '0x00000000',
            params: [
                { name: 'argc', val: '1', offset: 8 },
                { name: 'argv', val: '0x7FFF1200', offset: 12 }
            ],
            locals: [
                { name: 'statusCode', val: '0', offset: 4 }
            ]
        });
    });

    if (btnStackCallA) btnStackCallA.addEventListener('click', () => {
        if (callStack.length === 0) {
            btnStackMain.click();
        }
        pushFrame({
            name: 'computeSum(a, b)',
            retAddr: '0x004014F8',
            savedEBP: `0x${(BASE_ADDR - ((callStack.length - 1) * 32)).toString(16).toUpperCase()}`,
            params: [
                { name: 'a', val: '15', offset: 8 },
                { name: 'b', val: '27', offset: 12 }
            ],
            locals: [
                { name: 'sum', val: '42', offset: 4 }
            ]
        });
    });

    if (btnStackCallB) btnStackCallB.addEventListener('click', () => {
        if (callStack.length === 0) btnStackMain.click();
        pushFrame({
            name: 'helperHash(key)',
            retAddr: '0x004018A2',
            savedEBP: `0x${(BASE_ADDR - ((callStack.length - 1) * 32)).toString(16).toUpperCase()}`,
            params: [
                { name: 'key', val: '42', offset: 8 }
            ],
            locals: [
                { name: 'salt', val: '0x9E37', offset: 4 },
                { name: 'hash', val: '98231', offset: 8 }
            ]
        });
    });

    let factN = 4;
    if (btnStackRecurse) btnStackRecurse.addEventListener('click', () => {
        if (callStack.length === 0) btnStackMain.click();
        factN = Math.max(1, factN - 1);
        pushFrame({
            name: `fact(n = ${factN})`,
            retAddr: '0x0040209C',
            savedEBP: `0x${(BASE_ADDR - ((callStack.length - 1) * 32)).toString(16).toUpperCase()}`,
            params: [
                { name: 'n', val: `${factN}`, offset: 8 }
            ],
            locals: [
                { name: 'subResult', val: factN <= 1 ? '1' : '?', offset: 4 }
            ]
        });
    });

    if (btnStackPop) btnStackPop.addEventListener('click', () => {
        if (callStack.length === 0) return;
        const popped = callStack.pop();
        renderCallStack();
        logStackAsm([
            `<span class="highlight">; --- Function Epilogue: ${popped.name} ---</span>`,
            `<span>mov     esp, ebp       ; Collapse local stack frame</span>`,
            `<span>pop     ebp            ; Restore caller frame pointer</span>`,
            `<span>ret                    ; Pop return address into EIP</span>`,
            `<span style="color: #3b82f6;">; Returned control to caller. Frame deallocated.</span>`
        ]);
    });

    if (btnStackReset) btnStackReset.addEventListener('click', () => {
        callStack = [];
        factN = 4;
        renderCallStack();
        logStackAsm([`<span class="placeholder-text">Stack cleared. Ready.</span>`]);
    });


    // ==========================================
    // SIMULATOR 7: REGISTER ALLOCATION & GRAPH COLORING (Back-End)
    // ==========================================
    const regCanvas = document.getElementById('reg-alloc-canvas');
    const regKSelect = document.getElementById('reg-k-select');
    const btnRegBuild = document.getElementById('btn-reg-build');
    const btnRegColor = document.getElementById('btn-reg-color');
    const btnRegReset = document.getElementById('btn-reg-reset');
    const regAsmBox = document.getElementById('reg-asm-box');

    let graphNodes = [
        { id: 't1', label: 't1', x: 0.25, y: 0.28, color: null, reg: null },
        { id: 't2', label: 't2', x: 0.75, y: 0.28, color: null, reg: null },
        { id: 't3', label: 't3', x: 0.50, y: 0.52, color: null, reg: null },
        { id: 't4', label: 't4', x: 0.28, y: 0.82, color: null, reg: null },
        { id: 't5', label: 't5', x: 0.72, y: 0.82, color: null, reg: null }
    ];

    // Adjacency edges (interference: simultaneously live variables)
    const graphEdges = [
        ['t1', 't2'],
        ['t1', 't3'],
        ['t2', 't3'],
        ['t2', 't4'],
        ['t3', 't4'],
        ['t3', 't5'],
        ['t4', 't5']
    ];

    let graphBuilt = false;
    let graphColored = false;

    function drawInterferenceGraph() {
        if (!regCanvas) return;
        const ctx = regCanvas.getContext('2d');
        const w = regCanvas.parentElement.clientWidth || 320;
        const h = 260;
        regCanvas.width = w;
        regCanvas.height = h;

        ctx.clearRect(0, 0, w, h);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (!graphBuilt) {
            ctx.fillStyle = isDark ? '#71717a' : '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Click "1. Build Interference Graph" to construct live ranges', w / 2, h / 2);
            return;
        }

        // Draw edges
        ctx.strokeStyle = isDark ? '#52525b' : '#cbd5e1';
        ctx.lineWidth = 2;
        graphEdges.forEach(([srcId, dstId]) => {
            const src = graphNodes.find(n => n.id === srcId);
            const dst = graphNodes.find(n => n.id === dstId);
            if (src && dst) {
                ctx.beginPath();
                ctx.moveTo(src.x * w, src.y * h);
                ctx.lineTo(dst.x * w, dst.y * h);
                ctx.stroke();
            }
        });

        // Draw nodes
        graphNodes.forEach(node => {
            const nx = node.x * w;
            const ny = node.y * h;
            const radius = 22;

            ctx.beginPath();
            ctx.arc(nx, ny, radius, 0, Math.PI * 2);

            if (node.color) {
                ctx.fillStyle = node.color;
            } else {
                ctx.fillStyle = isDark ? '#27272a' : '#f1f5f9';
            }
            ctx.fill();

            ctx.strokeStyle = isDark ? '#a1a1aa' : '#475569';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = node.color ? '#ffffff' : (isDark ? '#fafafa' : '#0f172a');
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const displayLabel = node.reg ? `${node.label}:${node.reg}` : node.label;
            ctx.fillText(displayLabel, nx, ny);
        });
    }

    if (btnRegBuild) btnRegBuild.addEventListener('click', () => {
        graphBuilt = true;
        graphColored = false;
        graphNodes.forEach(n => { n.color = null; n.reg = null; });
        drawInterferenceGraph();

        if (regAsmBox) {
            regAsmBox.innerHTML = `
                <div class="code-line"><span class="highlight">; Intermediate Representation (3-Address Code):</span></div>
                <div class="code-line">t1 = read_sensor()       ; live: t1</div>
                <div class="code-line">t2 = get_threshold()      ; live: t1, t2</div>
                <div class="code-line">t3 = t1 + t2              ; live: t2, t3</div>
                <div class="code-line">t4 = t3 * 2               ; live: t3, t4</div>
                <div class="code-line">t5 = t3 - t4              ; live: t4, t5</div>
                <div class="code-line">write_out(t5)             ; live: none</div>
                <div class="code-line" style="color: #3b82f6; margin-top: 0.5rem;">[Graph Built]: 5 nodes, 7 interference edges. Ready for Chaitin K-coloring.</div>
            `;
        }
    });

    if (btnRegColor) btnRegColor.addEventListener('click', () => {
        if (!graphBuilt) {
            btnRegBuild.click();
        }
        const K = parseInt(regKSelect ? regKSelect.value : '3', 10);
        graphColored = true;

        if (K === 3) {
            // 3-Colorable: chromatic number is 3
            // t1 -> R0, t2 -> R1, t3 -> R2, t4 -> R0, t5 -> R1
            graphNodes.find(n => n.id === 't1').color = '#3b82f6';
            graphNodes.find(n => n.id === 't1').reg = 'R0';

            graphNodes.find(n => n.id === 't2').color = '#10b981';
            graphNodes.find(n => n.id === 't2').reg = 'R1';

            graphNodes.find(n => n.id === 't3').color = '#f59e0b';
            graphNodes.find(n => n.id === 't3').reg = 'R2';

            graphNodes.find(n => n.id === 't4').color = '#3b82f6';
            graphNodes.find(n => n.id === 't4').reg = 'R0';

            graphNodes.find(n => n.id === 't5').color = '#10b981';
            graphNodes.find(n => n.id === 't5').reg = 'R1';

            drawInterferenceGraph();

            if (regAsmBox) {
                regAsmBox.innerHTML = `
                    <div class="code-line" style="color: #10b981; font-weight: bold;">✔ K=3 Graph Successfully Colored (0 Spills to RAM!):</div>
                    <div class="code-line"><span style="color: #3b82f6;">t1, t4 → EAX (R0)</span> | <span style="color: #10b981;">t2, t5 → EBX (R1)</span> | <span style="color: #f59e0b;">t3 → ECX (R2)</span></div>
                    <hr style="border: 0; border-top: 1px solid var(--card-border); margin: 0.5rem 0;">
                    <div class="code-line"><span class="highlight">; Emitted x86 Target Assembly (Pure Register Speed):</span></div>
                    <div class="code-line">call   read_sensor</div>
                    <div class="code-line">mov    eax, edx          ; eax = t1</div>
                    <div class="code-line">call   get_threshold</div>
                    <div class="code-line">mov    ebx, edx          ; ebx = t2</div>
                    <div class="code-line">mov    ecx, eax</div>
                    <div class="code-line">add    ecx, ebx          ; ecx (t3) = t1 + t2</div>
                    <div class="code-line">mov    eax, ecx</div>
                    <div class="code-line">shl    eax, 1            ; eax (t4) = t3 * 2 (reused EAX!)</div>
                    <div class="code-line">mov    ebx, ecx</div>
                    <div class="code-line">sub    ebx, eax          ; ebx (t5) = t3 - t4 (reused EBX!)</div>
                    <div class="code-line">mov    edi, ebx</div>
                    <div class="code-line">call   write_out</div>
                `;
            }
        } else {
            // K = 2: Chromatic number > 2. Chaitin heuristic spills node t3 (highest degree)
            graphNodes.find(n => n.id === 't1').color = '#3b82f6';
            graphNodes.find(n => n.id === 't1').reg = 'R0';

            graphNodes.find(n => n.id === 't2').color = '#10b981';
            graphNodes.find(n => n.id === 't2').reg = 'R1';

            // Spilled!
            graphNodes.find(n => n.id === 't3').color = '#ef4444';
            graphNodes.find(n => n.id === 't3').reg = 'RAM';

            graphNodes.find(n => n.id === 't4').color = '#3b82f6';
            graphNodes.find(n => n.id === 't4').reg = 'R0';

            graphNodes.find(n => n.id === 't5').color = '#10b981';
            graphNodes.find(n => n.id === 't5').reg = 'R1';

            drawInterferenceGraph();

            if (regAsmBox) {
                regAsmBox.innerHTML = `
                    <div class="code-line" style="color: #ef4444; font-weight: bold;">⚠️ K=2 Insufficient! Chromatic degree exceeds hardware limit:</div>
                    <div class="code-line"><span style="color: #ef4444;">[SPILL OCCURRED]: Variable t3 forced into Stack RAM [ebp-4]</span></div>
                    <hr style="border: 0; border-top: 1px solid var(--card-border); margin: 0.5rem 0;">
                    <div class="code-line"><span class="highlight">; Emitted Assembly with Memory Spill Penalties:</span></div>
                    <div class="code-line">call   read_sensor</div>
                    <div class="code-line">mov    eax, edx          ; eax = t1</div>
                    <div class="code-line">call   get_threshold</div>
                    <div class="code-line">mov    ebx, edx          ; ebx = t2</div>
                    <div class="code-line">add    eax, ebx          ; eax = t1 + t2</div>
                    <div class="code-line" style="color: #ef4444; font-weight: bold;">mov    [ebp-4], eax      ; SPILL: store t3 in RAM (+100 cycles)</div>
                    <div class="code-line">shl    eax, 1            ; eax = t4</div>
                    <div class="code-line" style="color: #ef4444; font-weight: bold;">mov    ebx, [ebp-4]      ; RELOAD: fetch t3 from RAM (+100 cycles)</div>
                    <div class="code-line">sub    ebx, eax          ; ebx = t5</div>
                    <div class="code-line">mov    edi, ebx</div>
                    <div class="code-line">call   write_out</div>
                `;
            }
        }
    });

    if (btnRegReset) btnRegReset.addEventListener('click', () => {
        graphBuilt = false;
        graphColored = false;
        graphNodes.forEach(n => { n.color = null; n.reg = null; });
        drawInterferenceGraph();
        if (regAsmBox) {
            regAsmBox.innerHTML = '<span class="placeholder-text">Click "Build Interference Graph" then "Run Chaitin K-Coloring" to see assembly code generation.</span>';
        }
    });

    window.addEventListener('resize', () => {
        if (graphBuilt) drawInterferenceGraph();
    });

    // Auto-draw placeholder
    setTimeout(drawInterferenceGraph, 100);

});
