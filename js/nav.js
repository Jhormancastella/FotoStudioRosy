/**
 * nav.js — Navbar compartida de Rosy Photo Studio
 * Se inyecta en cada página via initNav(activePageId, isAdmin).
 * activePageId: "home" | "catalog" | "services" | "about" | "contact" | "quote"
 */

import { applyTranslations, getInitialLanguage, setLanguage, t } from "./i18n.js";
import { getTheme, initTheme, toggleTheme } from "./theme.js";

const LOGO_URL = "https://res.cloudinary.com/dipv76dpn/image/upload/v1757801787/fjtfrshjkyxdtuscpkk5.png";

// Detecta si estamos en la raíz o en /pages/ para ajustar las rutas
function rootPath() {
    const path = window.location.pathname;
    return path.includes("/pages/") ? "../" : "./";
}

function navLinks(active, root) {
    const links = [
        { id: "home",     key: "nav.home",     href: `${root}index.html`,              icon: "fas fa-home"          },
        { id: "catalog",  key: "nav.catalog",  href: `${root}pages/catalogo.html`,     icon: "fas fa-th-large"      },
        { id: "services", key: "nav.services", href: `${root}pages/servicios.html`,    icon: "fas fa-magic"         },
        { id: "about",    key: "nav.about",    href: `${root}pages/sobre-mi.html`,     icon: "fas fa-user-circle"   },
        { id: "contact",  key: "nav.contact",  href: `${root}pages/contactanos.html`,  icon: "fas fa-envelope"      },
        { id: "quote",    key: "nav.quote",    href: `${root}pages/cotizar.html`,      icon: "fas fa-calculator"    },
    ];
    return links.map(l => {
        const isActive = l.id === active;
        return `
        <a href="${l.href}"
           class="nav-link ${isActive ? "nav-link--active" : ""}"
           aria-current="${isActive ? "page" : "false"}">
            <i class="${l.icon} nav-link__icon"></i>
            <span data-i18n="${l.key}">${t(l.key)}</span>
        </a>`;
    }).join("");
}

export function initNav(activePageId = "home", {
    onAdminReady    = null,   // callback(isAdmin) cuando la sesión está lista
    onLoginClick    = null,   // callback para abrir el modal de login
    onLogoutClick   = null,   // callback para cerrar sesión
} = {}) {
    const root = rootPath();

    // ── Inyectar HTML ───────────────────────────────────────────────────────
    const placeholder = document.getElementById("nav-placeholder");
    if (!placeholder) return;

    placeholder.innerHTML = `
    <header id="site-header" class="site-header">
        <!-- Glow orbs decorativos -->
        <div class="header-orb header-orb--tl" aria-hidden="true"></div>
        <div class="header-orb header-orb--br" aria-hidden="true"></div>

        <!-- Top bar -->
        <div class="header-topbar">
            <!-- Izquierda: logo + nombre -->
            <a href="${root}index.html" class="header-brand" aria-label="Rosy Photo Studio — Inicio">
                <img src="${LOGO_URL}" alt="Logo Rosy Photo Studio" class="header-logo">
                <span class="header-name font-script">Rosy Photo Studio</span>
            </a>

            <!-- Derecha: controles -->
            <div class="header-controls">
                <!-- Selector de idioma -->
                <div class="control-select-wrap">
                    <select id="languageSelect" aria-label="Idioma" class="control-select">
                        <option value="es" data-i18n="controls.spanish">Español</option>
                        <option value="en" data-i18n="controls.english">English</option>
                    </select>
                    <i class="fas fa-chevron-down control-select-arrow" aria-hidden="true"></i>
                </div>

                <!-- Tema -->
                <button id="themeToggle" type="button" class="control-btn" data-i18n="controls.themeToDark">
                    <i class="fas fa-moon"></i>
                    <span></span>
                </button>

                <!-- Admin: login / estado / logout -->
                <button id="adminLoginBtn" type="button"
                        class="control-btn control-btn--icon"
                        aria-label="Acceso administrador"
                        data-i18n-title="admin.panel">
                    <i class="fas fa-lock"></i>
                </button>
                <div id="adminBadge" class="admin-badge hidden">
                    <i class="fas fa-shield-alt"></i>
                    <span data-i18n="admin.status">Modo Admin</span>
                </div>
                <button id="logoutBtn" type="button" class="control-btn hidden">
                    <i class="fas fa-sign-out-alt"></i>
                    <span data-i18n="admin.logout">Cerrar Sesión</span>
                </button>
            </div>
        </div>

        <!-- Tagline -->
        <p class="header-tagline" data-i18n="header.tagline">Capturando momentos especiales para toda la vida</p>

        <!-- Navegación principal -->
        <nav class="site-nav" aria-label="Navegación principal" id="site-nav">
            <!-- Hamburger (móvil) — va ANTES de los links para posicionarse a la derecha -->
            <button id="navToggle" type="button" class="nav-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="navLinks">
                <span class="nav-toggle__bar"></span>
                <span class="nav-toggle__bar"></span>
                <span class="nav-toggle__bar"></span>
            </button>
            <div class="nav-links" id="navLinks">
                ${navLinks(activePageId, root)}
            </div>
        </nav>

        <!-- Línea decorativa inferior -->
        <div class="header-rule" aria-hidden="true"></div>
    </header>`;

    // ── Idioma & Tema ───────────────────────────────────────────────────────
    const langSel    = document.getElementById("languageSelect");
    const themeBtn   = document.getElementById("themeToggle");

    // IMPORTANTE: initTheme PRIMERO para respetar el valor guardado en localStorage
    initTheme("light");

    const lang = getInitialLanguage("es");
    setLanguage(lang);
    langSel.value = lang;
    applyTranslations(document);
    _updateThemeBtn(themeBtn);

    langSel.addEventListener("change", () => {
        setLanguage(langSel.value);
        applyTranslations(document);
        _updateThemeBtn(themeBtn);
        // Re-renderiza solo los links; el toggle (hamburger) permanece en el DOM
        const navLinksEl = document.getElementById("navLinks");
        if (navLinksEl) {
            navLinksEl.innerHTML = navLinks(activePageId, root);
            // Re-bind click-to-close en los nuevos <a>
            _bindNavLinkClose();
        }
    });

    themeBtn.addEventListener("click", () => {
        toggleTheme();
        _updateThemeBtn(themeBtn);
    });

    // ── Hamburger ───────────────────────────────────────────────────────────
    _bindHamburger();

    // ── Admin callbacks ─────────────────────────────────────────────────────
    const loginBtn  = document.getElementById("adminLoginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const badge     = document.getElementById("adminBadge");

    // Candado → redirige directo a admin.html (el login vive allí)
    if (loginBtn) loginBtn.addEventListener("click", () => {
        window.location.href = `${root}admin.html`;
    });
    if (logoutBtn && onLogoutClick) logoutBtn.addEventListener("click", onLogoutClick);

    // Expone función para actualizar el estado visual del admin desde fuera
    window._navSetAdmin = function(isAdmin) {
        loginBtn?.classList.toggle("hidden", isAdmin);
        badge?.classList.toggle("hidden",    !isAdmin);
        logoutBtn?.classList.toggle("hidden", !isAdmin);
        if (typeof onAdminReady === "function") onAdminReady(isAdmin);
    };
}

function _updateThemeBtn(btn) {
    if (!btn) return;
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.innerHTML = dark
        ? `<i class="fas fa-sun"></i><span>${t("controls.themeToLight")}</span>`
        : `<i class="fas fa-moon"></i><span>${t("controls.themeToDark")}</span>`;
}

// Guarda referencia al handler de "click fuera" para poder removearlo
let _outsideClickHandler = null;

function _closeNavMenu() {
    const toggle  = document.getElementById("navToggle");
    const navLinksEl = document.getElementById("navLinks");
    if (!navLinksEl || !toggle) return;
    navLinksEl.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
}

function _bindHamburger() {
    const toggle     = document.getElementById("navToggle");
    const navLinksEl = document.getElementById("navLinks");
    if (!toggle || !navLinksEl) return;

    // Usa onclick en lugar de addEventListener para evitar duplicados al re-llamar
    toggle.onclick = () => {
        const open = navLinksEl.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));

        // Registra/cancela el listener de "click fuera"
        if (open) {
            // Pequeño delay para que este mismo click no lo cierre de inmediato
            setTimeout(() => {
                _outsideClickHandler = (e) => {
                    const header = document.getElementById("site-header");
                    if (header && !header.contains(e.target)) {
                        _closeNavMenu();
                        document.removeEventListener("click", _outsideClickHandler);
                        _outsideClickHandler = null;
                    }
                };
                document.addEventListener("click", _outsideClickHandler);
            }, 10);
        } else {
            if (_outsideClickHandler) {
                document.removeEventListener("click", _outsideClickHandler);
                _outsideClickHandler = null;
            }
        }
    };

    // Cierra al hacer click en un link del menú (móvil)
    _bindNavLinkClose();
}

function _bindNavLinkClose() {
    const toggle     = document.getElementById("navToggle");
    const navLinksEl = document.getElementById("navLinks");
    if (!navLinksEl || !toggle) return;
    navLinksEl.querySelectorAll(".nav-link").forEach(a => {
        a.onclick = () => {
            navLinksEl.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            if (_outsideClickHandler) {
                document.removeEventListener("click", _outsideClickHandler);
                _outsideClickHandler = null;
            }
        };
    });
}
