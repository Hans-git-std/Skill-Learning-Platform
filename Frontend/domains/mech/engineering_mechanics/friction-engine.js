document.addEventListener("DOMContentLoaded", () => {
    const rampSlider = document.getElementById('ramp-slider');
    const muSlider = document.getElementById('mu-slider');
    const rampDisplay = document.getElementById('ramp-display');
    const muDisplay = document.getElementById('mu-display');
    const ramp = document.getElementById('ramp-container');
    const block = document.getElementById('friction-block');
    const frictionArrow = document.getElementById('friction-arrow');
    const gravityArrow = document.getElementById('gravity-vector');
    const statusText = document.getElementById('friction-status');
    const btnReset = document.getElementById('btn-reset-block');

    let isSliding = false;

    function updatePhysics() {
        if (isSliding) return; 

        let currentAngle = parseFloat(rampSlider.value);
        let mu = parseFloat(muSlider.value);

        rampDisplay.textContent = `${currentAngle}°`;
        muDisplay.textContent = mu.toFixed(2);

        // 1. Rotate the Ramp
        ramp.style.transform = `rotate(${-currentAngle}deg)`;
        
        // 2. Counter-Rotate Gravity
        if (gravityArrow) {
            gravityArrow.style.transform = `rotate(${currentAngle}deg)`;
        }
        
        // Math Engine
        let angleOfRepose = Math.atan(mu) * (180 / Math.PI);
        let slidingForceVisual = Math.sin(currentAngle * (Math.PI / 180)) * 120;
        
        if (frictionArrow) {
            frictionArrow.style.width = `${Math.max(10, slidingForceVisual)}px`;
        }

        // Logic Gate
        if (currentAngle <= angleOfRepose) {
            statusText.innerHTML = `Static Equilibrium. Angle (${currentAngle}&deg;) is &le; Angle of Repose (${angleOfRepose.toFixed(1)}&deg;).`;
            statusText.style.color = "#10b981"; 
            block.style.transition = 'none'; 
            block.style.left = '70%'; 
        } else {
            statusText.innerHTML = `SLIPPAGE! Angle (${currentAngle}&deg;) &gt; Angle of Repose (${angleOfRepose.toFixed(1)}&deg;). Static friction broken!`;
            statusText.style.color = "#ef4444"; 
            
            // Trigger Animation
            isSliding = true;
            rampSlider.disabled = true;
            muSlider.disabled = true;

            block.style.transition = 'left 0.8s cubic-bezier(0.5, 0, 1, 1)'; 
            block.style.left = '5%'; 
            
            if (frictionArrow) {
                frictionArrow.style.width = `${frictionArrow.offsetWidth * 0.6}px`; 
            }
        }
    }

    btnReset.addEventListener('click', () => {
        // 1. Unlock the engine
        isSliding = false;
        rampSlider.disabled = false;
        muSlider.disabled = false;
        
        // 2. Hard Reset the UI values to absolute defaults
        rampSlider.value = 0;
        muSlider.value = 0.5;
        
        // 3. Instantly snap the block and arrow back
        block.style.transition = 'none';
        block.style.left = '70%';
        if (frictionArrow) {
            frictionArrow.style.transition = 'none';
        }
        
        // 4. Force a browser repaint to apply the instant snap
        void block.offsetWidth; 
        
        // 5. Restore the physics animations and recalculate
        if (frictionArrow) {
            frictionArrow.style.transition = 'width 0.1s linear';
        }
        updatePhysics();
    });

    rampSlider.addEventListener('input', updatePhysics);
    muSlider.addEventListener('input', updatePhysics);
    
    updatePhysics(); // Init
});