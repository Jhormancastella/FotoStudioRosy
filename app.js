/**
 * app.js — Página de Inicio (index.html)
 * Carga la navbar, muestra una preview de la galería (primeras 8 fotos)
 * e inicializa los dos comparadores.
 */

import "./js/firebase-provider.js";
import { APP_CONFIG }           from "./js/config.js";
import { createAuthClient }     from "./js/auth.js";
import { createGalleryService } from "./js/gallery-service.js";
import { initComparators }      from "./js/comparator.js";
import { initNav }              from "./js/nav.js";
import { applyTranslations }    from "./js/i18n.js";
import { seedFirebaseIfEmpty }  from "./js/seed-firebase.js";

const authClient    = createAuthClient(APP_CONFIG.auth);
const galleryService = createGalleryService(APP_CONFIG);

const dom = {};

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
    cacheDom();

    // Inyectar navbar
    initNav("home", {
        onLoginClick:  openLoginModal,
        onLogoutClick: handleLogout,
        onAdminReady:  (isAdmin) => { /* nada especial en inicio */ }
    });

    // Comparadores - initialize with delay to ensure DOM is ready
    setTimeout(() => {
        initComparators(["comparator-restauracion", "comparator-colorizacion"]);
    }, 100);

    // Galería preview (max 8)
    await loadPreviewGallery();

    // Sesión admin
    const isAdmin = await authClient.checkSession();
    window._navSetAdmin?.(isAdmin);

    // Fullscreen modal
    bindFullscreen();
}

function cacheDom() {
    dom.imageGallery    = document.getElementById("imageGallery");
    dom.galleryLoading  = document.getElementById("galleryLoading");
    dom.fullScreenModal = document.getElementById("fullScreenModal");
    dom.fullScreenImage = document.getElementById("fullScreenImage");
    dom.fsClose         = document.getElementById("fsClose");
    dom.loginModal      = document.getElementById("loginModal");
    dom.closeLoginModal = document.getElementById("closeLoginModal");
    dom.emailInput      = document.getElementById("emailInput");
    dom.passwordInput   = document.getElementById("passwordInput");
    dom.loginBtn        = document.getElementById("loginBtn");
    dom.loginMessage    = document.getElementById("loginMessage");
}

async function loadPreviewGallery() {
    if (!dom.imageGallery) return;
    dom.galleryLoading?.classList.add("is-visible");

    try {
        // Initialize Firebase with seed data if empty
        await seedFirebaseIfEmpty();
        
        const images = await galleryService.listImages();
        const preview = images.slice(0, 8);
        renderGallery(preview);
    } catch {
        dom.imageGallery.innerHTML = '<p class="empty-message">No se pudieron cargar las imágenes.</p>';
    } finally {
        dom.galleryLoading?.classList.remove("is-visible");
    }
}

function renderGallery(images) {
    if (!dom.imageGallery) return;
    dom.imageGallery.innerHTML = "";
    if (!images.length) {
        dom.imageGallery.innerHTML = '<p class="empty-message">No hay imágenes en la galería.</p>';
        return;
    }
    images.forEach(image => {
        const item = document.createElement("article");
        item.className = "gallery-item is-loading";
        const img = document.createElement("img");
        img.className = "gallery-image";
        img.alt = image.name || "Imagen";
        img.loading = "lazy";
        img.addEventListener("load", () => { item.classList.remove("is-loading"); img.classList.add("loaded"); });
        img.src = image.src;
        item.appendChild(img);
        item.addEventListener("click", () => openFullscreen(image.src));
        dom.imageGallery.appendChild(item);
    });
}

function bindFullscreen() {
    dom.imageGallery?.addEventListener("click", e => {
        const img = e.target.closest("img");
        if (img) openFullscreen(img.src);
    });
    dom.fsClose?.addEventListener("click", closeFullscreen);
    dom.fullScreenModal?.addEventListener("click", e => { if (e.target === dom.fullScreenModal) closeFullscreen(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeFullscreen(); closeLoginModal(); } });
}

function openFullscreen(src) {
    if (!dom.fullScreenModal) return;
    dom.fullScreenImage.src = src;
    dom.fullScreenModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
}
function closeFullscreen() {
    dom.fullScreenModal?.classList.remove("is-open");
    if (dom.fullScreenImage) dom.fullScreenImage.src = "";
    document.body.style.overflow = "";
}

function openLoginModal() {
    if (dom.loginMessage) dom.loginMessage.textContent = "";
    if (dom.emailInput)   dom.emailInput.value = "";
    if (dom.passwordInput) dom.passwordInput.value = "";
    dom.loginModal?.classList.add("is-open");
    dom.closeLoginModal?.addEventListener("click", closeLoginModal, { once: true });
    window.addEventListener("click", outsideLoginClose);
    dom.loginBtn?.addEventListener("click", attemptLogin, { once: true });
    dom.passwordInput?.addEventListener("keydown", e => { if (e.key === "Enter") attemptLogin(); });
}
function closeLoginModal() {
    dom.loginModal?.classList.remove("is-open");
    window.removeEventListener("click", outsideLoginClose);
}
function outsideLoginClose(e) {
    if (e.target === dom.loginModal) closeLoginModal();
}

async function attemptLogin() {
    const email    = dom.emailInput?.value.trim() || "";
    const password = dom.passwordInput?.value.trim() || "";
    if (!email || !password) { if (dom.loginMessage) dom.loginMessage.textContent = "Completa los campos."; return; }

    const btn = dom.loginBtn;
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando…'; }

    try {
        await authClient.login({ email, password });
        // Redirigir al panel de administración
        window.location.href = "admin.html";
    } catch {
        if (dom.loginMessage) dom.loginMessage.textContent = "Credenciales inválidas.";
        if (btn) { btn.disabled = false; btn.innerHTML = 'Ingresar'; }
    }
}

async function handleLogout() {
    await authClient.logout();
    window._navSetAdmin?.(false);
}
