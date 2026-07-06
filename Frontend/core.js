/**
 * ============================================================================
 *  SCME (Skill-Learning-Platform) Core Engine
 *  Developed by Hans Raj
 *  ----------------------------------------------------------------------------
 *  This file acts as the global backbone for all pages across the platform.
 *  It handles universal UI components (like the footer), global state 
 *  (like light/dark theming), and acts as a central registry for utilities.
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 0. Console Signature ---
    // A nice little easter egg for developers checking the console
    console.log(
        "%c SCME Deep Dive Engine %c Developed by Hans Raj ", 
        "color: white; background: #06b6d4; padding: 4px 0; border-radius: 4px 0 0 4px; font-weight: bold;", 
        "color: white; background: #1e293b; padding: 4px 0; border-radius: 0 4px 4px 0;"
    );

    // --- 1. Cross-Cutting Footer Injection ---
    // Injecting a premium, detailed footer globally across all pages
    const footerHTML = `
        <footer class="site-footer" style="padding: 2.5rem 1rem; margin-top: 5rem; border-top: 1px solid var(--border-color); text-align: center; color: var(--text-secondary); font-family: var(--font-sans); background: var(--bg-panel);">
            <div style="max-width: 800px; margin: 0 auto;">
                <p style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; letter-spacing: -0.5px;">
                    SCME Interactive Learning Platform
                </p>
                <p style="font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;">
                    Bridging the gap between theoretical concepts and engineering reality through high-performance interactive simulation.
                </p>
                <p style="font-size: 0.9rem; letter-spacing: 0.5px; margin-bottom: 0.25rem;">
                    Designed & Developed by <strong style="color: var(--accent-primary);">Hans Raj</strong>
                </p>
                <p style="font-size: 0.8rem; margin-top: 1.5rem; opacity: 0.6;">
                    &copy; ${new Date().getFullYear()} SCME. All Rights Reserved.
                </p>
            </div>
        </footer>
    `;
    
    let footerContainer = document.getElementById("global-footer");
    
    // Auto-inject the container at the end of the body if the HTML file forgot to include it
    if (!footerContainer) {
        footerContainer = document.createElement("div");
        footerContainer.id = "global-footer";
        document.body.appendChild(footerContainer);
    }
    
    footerContainer.innerHTML = footerHTML;

    // --- 2. Dynamic Theming Logic ---
    const themeToggleBtn = document.getElementById("theme-toggle");
    const htmlElement = document.documentElement;
    
    // Determine initial theme (checking local storage or OS preference)
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Initialize Theme
    const initTheme = (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) ? "dark" : "light";
    setTheme(initTheme);

    // Toggle button event listener
    if (themeToggleBtn) {
        // Add a subtle transition to the body so theme switching is buttery smooth
        document.body.style.transition = "background-color 0.4s ease, color 0.4s ease";
        
        themeToggleBtn.addEventListener("click", () => {
            const currentTheme = htmlElement.getAttribute("data-theme") || "light";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            setTheme(newTheme);
            
            // Add a small pop animation to the button itself on click
            themeToggleBtn.style.transform = "scale(0.85)";
            setTimeout(() => {
                themeToggleBtn.style.transform = "scale(1)";
            }, 150);
        });
    }

    /**
     * Applies the given theme to the document, saves it to localStorage, 
     * and broadcasts a custom event for canvas engines to re-render.
     * 
     * @param {string} themeName - "light" or "dark"
     */
    function setTheme(themeName) {
        if (themeName === "dark") {
            htmlElement.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
            updateToggleIcon("dark");
        } else {
            htmlElement.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
            updateToggleIcon("light");
        }
        
        // Dispatch a custom event so other scripts (like fm-engine.js) 
        // know the theme changed and can update their canvas colors!
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
    }

    /**
     * Updates the text/icon inside the theme toggle button if applicable.
     */
    function updateToggleIcon(themeName) {
        if (!themeToggleBtn) return;
        
        // We look for a span inside the button, or just update the button itself
        // If your button uses an SVG, you could swap SVG classes here instead.
        const iconContainer = themeToggleBtn.querySelector('.theme-icon') || themeToggleBtn;
        
        // Ensure we don't accidentally overwrite complex HTML inside the button 
        // if it doesn't already have text content. Assuming it uses basic emojis/text for now.
        if (iconContainer.innerHTML.includes("🌙") || iconContainer.innerHTML.includes("☀️") || iconContainer.innerText.trim().length <= 2) {
            iconContainer.innerHTML = themeName === "dark" ? "☀️" : "🌙";
        }
        
        themeToggleBtn.title = themeName === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
    }
});