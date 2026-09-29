/**
 * ============================================================================
 *  SCME (Skill-Learning-Platform) Core Engine
 *  Developed by Hans Raj
 *  ----------------------------------------------------------------------------
 *  This file acts as the global backbone for all pages across the platform.
 *  It handles universal UI components (like the footer), global state 
 *  (like light/dark theming), prevents theme glitch / FOUC, powers the 
 *  Knowledge Odyssey Preloader, manages Skeleton Loading, optimizes network
 *  navigation via link prefetching, and handles the Internet Buffer indicator.
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

// --- 1. Knowledge Odyssey Preloader & Top Progress System ---
(function initOdysseyPreloader() {
    const startTime = performance.now();
    let isLoaderDismissed = false;
    let statusInterval = null;

    // Inject Preloader DOM immediately when DOM or body is ready
    function injectLoaderDOM() {
        if (!document.body || document.getElementById("scme-loader-overlay")) return;

        // Top Ambient Progress Bar
        const topProgress = document.createElement("div");
        topProgress.id = "scme-top-progress";
        document.body.prepend(topProgress);

        // Preloader Overlay (The Knowledge Odyssey)
        const loaderOverlay = document.createElement("div");
        loaderOverlay.id = "scme-loader-overlay";
        loaderOverlay.setAttribute("role", "status");
        loaderOverlay.setAttribute("aria-live", "polite");
        loaderOverlay.innerHTML = `
            <div class="scme-particle-field">
                <span class="scme-floating-glyph" style="top:22%; left:8%; animation-duration:14s; font-size:1.5rem;">∫</span>
                <span class="scme-floating-glyph" style="top:68%; left:12%; animation-duration:11s; animation-delay:1s;">E=mc²</span>
                <span class="scme-floating-glyph" style="top:28%; left:84%; animation-duration:13s; animation-delay:2s;">&lt;/&gt;</span>
                <span class="scme-floating-glyph" style="top:72%; left:82%; animation-duration:15s; animation-delay:3s;">λ</span>
                <span class="scme-floating-glyph" style="top:18%; left:62%; animation-duration:10s; animation-delay:1.5s;">⚙️</span>
                <span class="scme-floating-glyph" style="top:82%; left:42%; animation-duration:12s; animation-delay:2.5s;">π</span>
                <span class="scme-floating-glyph" style="top:42%; left:90%; animation-duration:16s; animation-delay:0.5s;">O(log n)</span>
                <span class="scme-floating-glyph" style="top:52%; left:16%; animation-duration:13s; animation-delay:3.5s;">∇×B</span>
                <div class="scme-particle" style="width:4px; height:4px; top:80%; left:25%; animation-duration:6s;"></div>
                <div class="scme-particle" style="width:6px; height:6px; top:65%; left:75%; animation-duration:9s; animation-delay:1s;"></div>
                <div class="scme-particle" style="width:3px; height:3px; top:90%; left:50%; animation-duration:7s; animation-delay:2s;"></div>
                <div class="scme-particle" style="width:5px; height:5px; top:50%; left:35%; animation-duration:8s; animation-delay:0.5s;"></div>
                <div class="scme-particle" style="width:4px; height:4px; top:40%; left:60%; animation-duration:10s; animation-delay:1.5s;"></div>
            </div>
            
            <div class="scme-odyssey-stage">
                <div class="scme-book-aura"></div>
                
                <!-- Track 1: Atomic & Mechanical satellites -->
                <div class="scme-orbit-track scme-orbit-track-1">
                    <div class="scme-orbit-satellite scme-sat-atom" title="Physics & Materials">⚛️</div>
                    <div class="scme-orbit-satellite scme-sat-gear" title="Mechanical Systems">⚙️</div>
                </div>
                
                <!-- Track 2: Computational & Mathematical satellites -->
                <div class="scme-orbit-track scme-orbit-track-2">
                    <div class="scme-orbit-satellite scme-sat-code" title="Algorithms & Code">&lt;/&gt;</div>
                    <div class="scme-orbit-satellite scme-sat-math" title="Continuous Math">∫</div>
                </div>
                
                <!-- 3D Flipping Book -->
                <div class="scme-book">
                    <div class="scme-book-cover-left"></div>
                    <div class="scme-book-cover-right"></div>
                    <div class="scme-book-pages-base"></div>
                    <div class="scme-page-flip"></div>
                    <div class="scme-page-flip"></div>
                    <div class="scme-page-flip"></div>
                    <div class="scme-book-spine"></div>
                </div>
            </div>
            
            <div class="scme-loader-brand">
                SCME<span class="dot">●</span>Interactive Platform
            </div>
            <div class="scme-loader-status" id="scme-loader-status-text">
                Initializing Knowledge Engine...
            </div>
            <div class="scme-mini-progress-track">
                <div class="scme-mini-progress-bar"></div>
            </div>
        `;
        document.body.appendChild(loaderOverlay);

        // Internet Buffer Indicator Toast
        const netBuffer = document.createElement("div");
        netBuffer.id = "scme-net-buffer";
        netBuffer.setAttribute("role", "status");
        netBuffer.setAttribute("aria-live", "polite");
        netBuffer.innerHTML = `
            <span class="scme-buffer-icon">📚</span>
            <span id="scme-net-buffer-text">Syncing Knowledge Base...</span>
        `;
        document.body.appendChild(netBuffer);

        // Progress bar initial nudge
        requestAnimationFrame(() => {
            topProgress.style.width = "40%";
        });

        // Cycling status messages
        const statuses = [
            "Initializing Knowledge Graph...",
            "Synthesizing Interactive Models...",
            "Calibrating Physics & Simulators...",
            "Optimizing Hardware Canvas..."
        ];
        let statusIdx = 0;
        const statusEl = document.getElementById("scme-loader-status-text");
        statusInterval = setInterval(() => {
            if (isLoaderDismissed || !statusEl) {
                clearInterval(statusInterval);
                return;
            }
            statusIdx = (statusIdx + 1) % statuses.length;
            statusEl.textContent = statuses[statusIdx];
        }, 300);
    }

    // Dismiss preloader smoothly
    function dismissLoader() {
        if (isLoaderDismissed) return;
        isLoaderDismissed = true;
        if (statusInterval) clearInterval(statusInterval);

        const overlay = document.getElementById("scme-loader-overlay");
        const topProgress = document.getElementById("scme-top-progress");
        const statusEl = document.getElementById("scme-loader-status-text");

        if (statusEl) {
            statusEl.textContent = "Ready to Explore ✨";
        }

        if (topProgress) {
            topProgress.style.width = "100%";
            setTimeout(() => {
                topProgress.style.opacity = "0";
            }, 300);
        }

        const elapsed = performance.now() - startTime;
        // Smooth minimum display time so animation feels fluid and intentional without causing lag
        const minDisplayTime = 320;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);

        setTimeout(() => {
            if (overlay) {
                overlay.classList.add("scme-loader-hidden");
                // Remove from render tree after fade transition
                setTimeout(() => {
                    overlay.style.display = "none";
                }, 400);
            }
        }, remainingTime);
    }

    if (document.body) {
        injectLoaderDOM();
    } else {
        document.addEventListener("DOMContentLoaded", injectLoaderDOM);
    }

    // Dismiss on window load
    if (document.readyState === "complete") {
        dismissLoader();
    } else {
        window.addEventListener("load", dismissLoader);
        // Hard safety timeout: loader will NEVER block user for more than 900ms
        setTimeout(dismissLoader, 900);
    }

    // Handle back/forward navigation (bfcache)
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            const overlay = document.getElementById("scme-loader-overlay");
            if (overlay) overlay.style.display = "none";
            const topProgress = document.getElementById("scme-top-progress");
            if (topProgress) topProgress.style.width = "0%";
        }
    });
})();

// --- 2. Floating Internet Buffer Toast & Offline Guard ---
(function initNetworkBuffer() {
    let hideTimeout = null;

    function showBufferToast(message, icon = "⚡", autoHideMs = 0) {
        const toast = document.getElementById("scme-net-buffer");
        const textEl = document.getElementById("scme-net-buffer-text");
        const iconEl = toast ? toast.querySelector(".scme-buffer-icon") : null;

        if (!toast || !textEl) return;
        if (hideTimeout) clearTimeout(hideTimeout);

        textEl.textContent = message;
        if (iconEl) iconEl.textContent = icon;
        toast.classList.add("scme-buffer-visible");

        if (autoHideMs > 0) {
            hideTimeout = setTimeout(() => {
                toast.classList.remove("scme-buffer-visible");
            }, autoHideMs);
        }
    }

    function hideBufferToast() {
        const toast = document.getElementById("scme-net-buffer");
        if (toast) toast.classList.remove("scme-buffer-visible");
    }

    window.addEventListener("offline", () => {
        showBufferToast("Offline Mode Active — Running Local Models", "📡", 0);
    });

    window.addEventListener("online", () => {
        showBufferToast("Online — Connection Restored ⚡", "✅", 2500);
    });

    // Expose utility globally
    window.SCME_BUFFER = {
        show: showBufferToast,
        hide: hideBufferToast
    };
})();

// --- 3. Instant Link Prefetching & Smooth Page Transitions ---
(function initFastNavigation() {
    const prefetchedUrls = new Set();

    function prefetchUrl(url) {
        if (!url || prefetchedUrls.has(url)) return;
        // Only prefetch relative or same-origin paths, skipping anchors and special protocols
        if (url.startsWith("#") || url.startsWith("javascript:") || url.startsWith("mailto:") || url.startsWith("tel:")) return;
        
        try {
            const targetUrl = new URL(url, window.location.href);
            if (targetUrl.origin !== window.location.origin) return;
            if (targetUrl.pathname === window.location.pathname) return;

            prefetchedUrls.add(url);
            const linkTag = document.createElement("link");
            linkTag.rel = "prefetch";
            linkTag.href = targetUrl.href;
            linkTag.as = "document";
            document.head.appendChild(linkTag);
        } catch (e) {
            // Silently ignore invalid URLs
        }
    }

    // Prefetch on hover (desktop) or touchstart (mobile)
    document.addEventListener("mouseover", (e) => {
        const anchor = e.target.closest("a");
        if (anchor && anchor.href && !anchor.hasAttribute("download")) {
            prefetchUrl(anchor.getAttribute("href"));
        }
    }, { passive: true });

    document.addEventListener("touchstart", (e) => {
        const anchor = e.target.closest("a");
        if (anchor && anchor.href && !anchor.hasAttribute("download")) {
            prefetchUrl(anchor.getAttribute("href"));
        }
    }, { passive: true });

    // Ambient top-progress bar animation on page navigation clicks
    document.addEventListener("click", (e) => {
        const anchor = e.target.closest("a");
        if (!anchor) return;
        
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:") || anchor.target === "_blank") return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const topProgress = document.getElementById("scme-top-progress");
        if (topProgress) {
            topProgress.style.opacity = "1";
            topProgress.style.width = "75%";
        }
    });
})();

// --- 4. Skeleton Loading Engine ---
(function initSkeletonEngine() {
    window.SCME_SKELETON = {
        apply: function(el) {
            if (!el) return;
            el.classList.add("scme-skeleton");
        },
        remove: function(el) {
            if (!el) return;
            el.classList.remove("scme-skeleton");
        },
        wrap: function(container, timeoutMs = 800) {
            if (!container) return;
            container.classList.add("scme-skeleton");
            setTimeout(() => {
                container.classList.remove("scme-skeleton");
            }, timeoutMs);
        }
    };

    function autoApplySkeletons() {
        // Target empty simulator/canvas stages awaiting 3D/chart render
        const targets = document.querySelectorAll(
            ".sim-container, .simulator-stage, .canvas-container, [id$='-canvas-container'], .chart-container"
        );
        targets.forEach(container => {
            if (!container.querySelector("canvas") && container.clientHeight > 40) {
                container.classList.add("scme-skeleton");
            }
        });

        // Watch for canvas insertions to dissolve shimmer immediately
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.tagName === "CANVAS" || (node.querySelector && node.querySelector("canvas"))) {
                            const parent = node.closest(".scme-skeleton");
                            if (parent) parent.classList.remove("scme-skeleton");
                        }
                    }
                });
            });
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Hard timeout to release skeleton regardless after 1200ms
        setTimeout(() => {
            document.querySelectorAll(".scme-skeleton").forEach(el => {
                el.classList.remove("scme-skeleton");
            });
            observer.disconnect();
        }, 1200);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoApplySkeletons);
    } else {
        autoApplySkeletons();
    }
})();

// --- 5. DOM Ready Bootstrap: Signature, Footer, Theming ---
document.addEventListener("DOMContentLoaded", () => {
    
    // Console Signature
    console.log(
        "%c SCME Deep Dive Engine %c Developed by Hans Raj ", 
        "color: white; background: #06b6d4; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;", 
        "color: white; background: #1e293b; padding: 4px 8px; border-radius: 0 4px 4px 0;"
    );

    // Cross-Cutting Footer Injection
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

    // Dynamic Theming Logic
    const themeToggleBtn = document.getElementById("theme-toggle");
    const htmlElement = document.documentElement;
    
    // Enable smooth transitions only after the initial frame paints to avoid load flashes
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