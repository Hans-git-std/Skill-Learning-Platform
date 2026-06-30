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

});
