window.getCssVar = function(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

document.addEventListener("DOMContentLoaded", () => {
    // Watch for theme changes from central core.js
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === "data-theme") {
                window.dispatchEvent(new Event("theme-changed"));
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true
    });

    // Sidebar navigation highlighting
    const sections = document.querySelectorAll("header.chapter-header");
    const navLinks = document.querySelectorAll(".chapter-list a");

    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Removed unused sectionHeight variable
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href").includes(current) && current !== "") {
                link.classList.add("active");
            }
        });
    });
});
