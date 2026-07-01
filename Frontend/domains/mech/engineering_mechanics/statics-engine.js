document.addEventListener("DOMContentLoaded", () => {
    const slider = document.getElementById('angle-slider');
    const display = document.getElementById('angle-display');
    const canvas = document.getElementById('vector-canvas');
    const btnResolve = document.getElementById('btn-resolve');
    const btnEquil = document.getElementById('btn-equilibrium'); // The fixed button
    const statusText = document.getElementById('statics-status');

    const VECTOR_LENGTH = 180; 
    let currentAngle = 45; 
    let isResolved = false;
    let showReaction = false; // New state

    const mainVector = document.createElement('div');
    const xVector = document.createElement('div');
    const yVector = document.createElement('div');
    const reactionVector = document.createElement('div'); // New vector
    const projX = document.createElement('div'); 
    const projY = document.createElement('div'); 

    function initCanvas() {
        canvas.innerHTML = ''; 
        
        const lineStyle = "position: absolute; transform-origin: 0 50%; height: 4px; border-radius: 2px; transition: all 0.1s linear;";
        const dashedStyle = "position: absolute; transform-origin: 0 50%; height: 2px; border-top: 2px dashed rgba(255,255,255,0.3); transition: all 0.1s linear;";

        mainVector.style.cssText = lineStyle + "background: #f59e0b; z-index: 5;"; 
        xVector.style.cssText = lineStyle + "background: #ef4444; z-index: 4; opacity: 0;"; 
        yVector.style.cssText = lineStyle + "background: #10b981; z-index: 4; opacity: 0;"; 
        reactionVector.style.cssText = lineStyle + "background: #3b82f6; z-index: 3; opacity: 0;"; // Blue Reaction
        projX.style.cssText = dashedStyle + "opacity: 0;";
        projY.style.cssText = dashedStyle + "opacity: 0;";

        canvas.appendChild(projX);
        canvas.appendChild(projY);
        canvas.appendChild(reactionVector);
        canvas.appendChild(xVector);
        canvas.appendChild(yVector);
        canvas.appendChild(mainVector);

        const xAxis = document.createElement('div');
        xAxis.style.cssText = "position: absolute; bottom: 40px; left: 10%; width: 80%; height: 2px; background: var(--card-border);";
        const yAxis = document.createElement('div');
        yAxis.style.cssText = "position: absolute; bottom: 40px; left: 50%; width: 2px; height: 80%; background: var(--card-border);";
        
        canvas.appendChild(xAxis);
        canvas.appendChild(yAxis);

        drawVectors();
    }

    function drawVectors() {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return;

        const originX = rect.width / 2;
        const originY = rect.height - 40;
        const rad = currentAngle * (Math.PI / 180);
        
        const compX = VECTOR_LENGTH * Math.cos(rad);
        const compY = VECTOR_LENGTH * Math.sin(rad);

        mainVector.style.width = `${VECTOR_LENGTH}px`;
        mainVector.style.left = `${originX}px`;
        mainVector.style.top = `${originY}px`;
        mainVector.style.transform = `rotate(${-currentAngle}deg)`;

        if (isResolved) {
            xVector.style.width = `${Math.abs(compX)}px`;
            xVector.style.left = `${originX}px`;
            xVector.style.top = `${originY}px`;
            xVector.style.transform = compX < 0 ? `rotate(180deg)` : `rotate(0deg)`;
            xVector.style.opacity = "1";

            yVector.style.width = `${compY}px`;
            yVector.style.left = `${originX}px`;
            yVector.style.top = `${originY}px`;
            yVector.style.transform = `rotate(-90deg)`;
            yVector.style.opacity = "1";

            projX.style.width = `${compY}px`;
            projX.style.left = `${originX + compX}px`;
            projX.style.top = `${originY}px`;
            projX.style.transform = `rotate(-90deg)`;
            projX.style.opacity = "1";

            projY.style.width = `${Math.abs(compX)}px`;
            projY.style.left = `${originX}px`;
            projY.style.top = `${originY - compY}px`;
            projY.style.transform = compX < 0 ? `rotate(180deg)` : `rotate(0deg)`;
            projY.style.opacity = "1";

            statusText.textContent = `Fx = ${compX.toFixed(1)}N  |  Fy = ${compY.toFixed(1)}N`;
            statusText.style.color = "#10b981"; 
        }

        if (showReaction) {
            reactionVector.style.width = `${VECTOR_LENGTH}px`;
            reactionVector.style.left = `${originX}px`;
            reactionVector.style.top = `${originY}px`;
            // Reaction is exactly 180 degrees opposite
            reactionVector.style.transform = `rotate(${180 - currentAngle}deg)`;
            reactionVector.style.opacity = "1";
            
            statusText.textContent = `Equilibrium Achieved: Ground applies equal and opposite force of 180N at ${180 + parseInt(currentAngle)}°.`;
            statusText.style.color = "#3b82f6";
        }
    }

    slider.addEventListener('input', (e) => {
        currentAngle = e.target.value;
        display.textContent = `${currentAngle}°`;
        isResolved = false;
        showReaction = false;
        xVector.style.opacity = "0";
        yVector.style.opacity = "0";
        projX.style.opacity = "0";
        projY.style.opacity = "0";
        reactionVector.style.opacity = "0";
        statusText.textContent = `Applied Force: 180N at ${currentAngle}°. Awaiting Resolution...`;
        statusText.style.color = "#f59e0b";
        drawVectors();
    });

    btnResolve.addEventListener('click', () => {
        isResolved = true;
        showReaction = false;
        reactionVector.style.opacity = "0";
        drawVectors();
    });

    btnEquil.addEventListener('click', () => {
        showReaction = true;
        isResolved = false;
        xVector.style.opacity = "0";
        yVector.style.opacity = "0";
        projX.style.opacity = "0";
        projY.style.opacity = "0";
        drawVectors();
    });

    window.addEventListener('resize', drawVectors);
    initCanvas();
});