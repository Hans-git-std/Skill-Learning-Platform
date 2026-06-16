document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Cross-Cutting Footer Injection ---
    const footerHTML = `
        <footer class="site-footer">
            <p>Developed by Hans Raj.</p>
            <p>&copy; ${new Date().getFullYear()} SCME Deep Dive Engine.</p>
        </footer>
    `;
    const footerContainer = document.getElementById("global-footer");
    if (footerContainer) {
        footerContainer.innerHTML = footerHTML;
    }

    // --- 2. Dynamic Theming Logic ---
    const themeToggleBtn = document.getElementById("theme-toggle");
    const htmlElement = document.documentElement;
    
    // Check local storage or system preference on load
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
        htmlElement.setAttribute("data-theme", "dark");
    }

    // Toggle button event
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const currentTheme = htmlElement.getAttribute("data-theme");
            if (currentTheme === "dark") {
                htmlElement.removeAttribute("data-theme");
                localStorage.setItem("theme", "light");
            } else {
                htmlElement.setAttribute("data-theme", "dark");
                localStorage.setItem("theme", "dark");
            }
        });
    }
});