/**
 * ============================================================================
 *  SCME (Skill-Learning-Platform) Core Engine
 *  Developed by Hans Raj
 *  ----------------------------------------------------------------------------
 *  This file acts as the global backbone for all pages across the platform.
 *  It handles universal UI components (like the footer), global state 
 *  (like light/dark theming), prevents theme glitch / FOUC, and acts as 
 *  a central registry for utilities.
 * ============================================================================
 */

// --- 0. Immediate Theme Bootstrap (Prevents FOUC & Glitching on Load) ---
(function initThemeImmediately() {
    try {
        const savedTheme = localStorage.getItem("theme") || localStorage.getItem("scme-theme");
        const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme = (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) ? "dark" : "light";
        
        document.documentElement.setAttribute("data-theme", initialTheme);
        document.documentElement.classList.remove("light-theme", "dark-theme");
        document.documentElement.classList.add(initialTheme === "dark" ? "dark-theme" : "light-theme");
    } catch (e) {
        console.warn("Theme bootstrap error:", e);
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Console Signature ---
    console.log(
        "%c SCME Deep Dive Engine %c Developed by Hans Raj ", 
        "color: white; background: #06b6d4; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;", 
        "color: white; background: #1e293b; padding: 4px 8px; border-radius: 0 4px 4px 0;"
    );

    // --- 2. Cross-Cutting Footer Injection ---
    const footerHTML = `
        <footer class="site-footer" style="padding: 2.5rem 1rem; margin-top: 5rem; border-top: 1px solid var(--border-color, rgba(128,128,128,0.2)); text-align: center; color: var(--text-secondary, #71717a); font-family: var(--font-sans, system-ui, sans-serif); background: var(--bg-panel, rgba(0,0,0,0.02));">
            <div style="max-width: 800px; margin: 0 auto;">
                <p style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary, currentColor); margin-bottom: 0.5rem; letter-spacing: -0.5px;">
                    SCME Interactive Learning Platform
                </p>
                <p style="font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;">
                    Bridging the gap between theoretical concepts and engineering reality through high-performance interactive simulation.
                </p>
                <p style="font-size: 0.9rem; letter-spacing: 0.5px; margin-bottom: 0.25rem;">
                    Designed & Developed by <strong style="color: var(--accent-primary, #3b82f6);">Hans Raj</strong>
                </p>
                <p style="font-size: 0.8rem; margin-top: 1.5rem; opacity: 0.6;">
                    &copy; ${new Date().getFullYear()} SCME. All Rights Reserved.
                </p>
            </div>
        </footer>
    `;
    
    let footerContainer = document.getElementById("global-footer");
    if (!footerContainer) {
        footerContainer = document.createElement("div");
        footerContainer.id = "global-footer";
        document.body.appendChild(footerContainer);
    }
    footerContainer.innerHTML = footerHTML;

    // --- 3. Dynamic Theming Logic ---
    const themeToggleBtn = document.getElementById("theme-toggle");
    const htmlElement = document.documentElement;
    
    // Enable buttery smooth transitions only after the initial frame paints to avoid load flashes
    requestAnimationFrame(() => {
        setTimeout(() => {
            document.body.classList.add("theme-transitions-enabled");
        }, 50);
    });

    // Sync button state with current active theme
    const activeTheme = htmlElement.getAttribute("data-theme") || "dark";
    updateToggleIcon(activeTheme);

    // Global setTheme method
    function setTheme(themeName) {
        const targetTheme = (themeName === "dark") ? "dark" : "light";
        
        // Explicitly set data-theme so both [data-theme="light"] and [data-theme="dark"] CSS rules match
        htmlElement.setAttribute("data-theme", targetTheme);
        htmlElement.classList.remove("light-theme", "dark-theme");
        htmlElement.classList.add(targetTheme === "dark" ? "dark-theme" : "light-theme");
        
        try {
            localStorage.setItem("theme", targetTheme);
            localStorage.setItem("scme-theme", targetTheme);
        } catch (e) {
            // LocalStorage might be disabled in private browsing
        }
        
        updateToggleIcon(targetTheme);
        
        // Broadcast custom events across all canvas and chart engines
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: targetTheme } }));
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: targetTheme } }));
    }

    // Expose globally
    window.SCME_THEME = {
        getTheme: () => htmlElement.getAttribute("data-theme") || "light",
        setTheme: setTheme
    };

    // Toggle button event binding with absolute deduplication
    if (themeToggleBtn) {
        themeToggleBtn.onclick = function handleThemeClick(e) {
            if (e) e.preventDefault();
            const currentTheme = htmlElement.getAttribute("data-theme") || "light";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            setTheme(newTheme);
            
            // Subtle click animation
            themeToggleBtn.style.transform = "scale(0.92)";
            setTimeout(() => {
                themeToggleBtn.style.transform = "scale(1)";
            }, 120);
        };
    }

    /**
     * Updates the text/icon inside the theme toggle button.
     */
    function updateToggleIcon(themeName) {
        if (!themeToggleBtn) return;
        
        const isDark = themeName === "dark";
        const iconContainer = themeToggleBtn.querySelector('.theme-icon');
        
        if (iconContainer) {
            iconContainer.innerHTML = isDark ? "☀️" : "🌙";
        } else {
            const btnText = themeToggleBtn.textContent.trim();
            if (btnText === "Toggle Theme" || btnText.includes("☀️") || btnText.includes("🌙") || btnText.includes("Mode")) {
                themeToggleBtn.innerHTML = isDark 
                    ? '<span class="theme-icon">☀️</span> <span class="theme-text">Light Mode</span>' 
                    : '<span class="theme-icon">🌙</span> <span class="theme-text">Dark Mode</span>';
            }
        }
        
        themeToggleBtn.title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
        themeToggleBtn.setAttribute("aria-label", themeToggleBtn.title);
    }
});