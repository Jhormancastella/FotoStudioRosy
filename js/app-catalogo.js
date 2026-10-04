/**
 * app-catalogo.js — Catálogo con filtros por categoría, paginación y upload (admin)
 */

import "../js/firebase-provider.js";
import { APP_CONFIG }           from "./config.js";
import { createAuthClient }     from "./auth.js";
import { createGalleryService } from "./gallery-service.js";
import { initNav }              from "./nav.js";
import { applyTranslations, t } from "./i18n.js";
import { seedFirebaseIfEmpty }  from "./seed-firebase.js";
import { getCategorias }        from "./categories-service.js";

const authClient     = createAuthClient(APP_CONFIG.auth);
const galleryService = createGalleryService(APP_CONFIG);

const state = {
    isAdmin:      false,
    allImages:    [],
    filtered:     [],
    currentPage:  1,
    itemsPerPage: 12,
    activeCategory: "todos",
    cloudinaryWidget: null
};

const dom = {};

document.addEventListener("DOMContentLoaded", initCatalog);

async function initCatalog() {
    cacheDom();

    initNav("catalog", {
        onLoginClick:  openLoginModal,
        onLogoutClick: handleLogout,
        onAdminReady:  (isAdmin) => {
            state.isAdmin = isAdmin;
            dom.uploadSection?.classList.toggle("hidden", !isAdmin);
            reRenderGallery();
        }
    });

    initCloudinaryWidget();
    bindEvents();

    // Poblar filtros de categoría desde Firestore antes de cargar imágenes
    await populateCatFilters();
    await loadGallery();

    state.isAdmin = await authClient.checkSession();
    window._navSetAdmin?.(state.isAdmin);
    dom.uploadSection?.classList.toggle("hidden", !state.isAdmin);

    // Poblar también el select de categoría del formulario de subida
    await populateCatSelect();
}

function cacheDom() {
    dom.gallery        = document.getElementById("imageGallery");
    dom.loading        = document.getElementById("galleryLoading");
    dom.pagination     = document.getElementById("pagination");
    dom.paginationInfo = document.getElementById("paginationInfo");
    dom.catFilters     = document.getElementById("catFilters");
    dom.cantidad       = document.getElementById("cantidadSelector");
    dom.resultCount    = document.getElementById("resultCount");
    dom.uploadSection  = document.getElementById("uploadSection");
    dom.cloudinaryBtn  = document.getElementById("cloudinaryBtn");
    dom.useUrlBtn      = document.getElementById("useUrlBtn");
    dom.urlUploadArea  = document.getElementById("urlUploadArea");
    dom.urlInput       = document.getElementById("urlInput");
    dom.urlSubmit      = document.getElementById("urlSubmit");
    dom.catSelect      = document.getElementById("imageCategorySelect");
    dom.fullScreenModal = document.getElementById("fullScreenModal");
    dom.fullScreenImage = document.getElementById("fullScreenImage");
    dom.fsClose        = document.getElementById("fsClose");
    dom.loginModal     = document.getElementById("loginModal");
    dom.closeLoginModal = document.getElementById("closeLoginModal");
    dom.emailInput     = document.getElementById("emailInput");
    dom.passwordInput  = document.getElementById("passwordInput");
    dom.loginBtn       = document.getElementById("loginBtn");
    dom.loginMessage   = document.getElementById("loginMessage");
}

// ── Categorías dinámicas ────────────────────────────────────────────────────

async function populateCatFilters() {
    if (!dom.catFilters) return;
    const cats = await getCategorias();

    dom.catFilters.innerHTML = cats.map(c => `
        <button class="cat-btn${c.id === "todos" ? " active" : ""}" data-cat="${c.id}">
            <i class="${c.icon}"></i> ${c.label}
        </button>`).join("");
}

async function populateCatSelect() {
    if (!dom.catSelect) return;
    const cats = await getCategorias();
    // Excluir "todos" del select de subida
    dom.catSelect.innerHTML = cats
        .filter(c => c.id !== "todos")
        .map(c => `<option value="${c.id}">${c.label}</option>`)
        .join("");
}

// ── Eventos ─────────────────────────────────────────────────────────────────

function bindEvents() {
    dom.catFilters?.addEventListener("click", e => {
        const btn = e.target.closest(".cat-btn");
        if (!btn) return;
        dom.catFilters.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.activeCategory = btn.dataset.cat;
        state.currentPage = 1;
        applyFilter();
    });

    dom.cantidad?.addEventListener("change", () => {
        state.itemsPerPage = parseInt(dom.cantidad.value, 10);
        state.currentPage = 1;
        reRenderGallery();
    });

    dom.useUrlBtn?.addEventListener("click", () => dom.urlUploadArea?.classList.toggle("hidden"));
    dom.urlSubmit?.addEventListener("click", handleUrlUpload);
    dom.cloudinaryBtn?.addEventListener("click", () => state.cloudinaryWidget?.open());

    dom.gallery?.addEventListener("click", e => {
        const img = e.target.closest("img");
        if (img && !e.target.classList.contains("delete-btn")) openFullscreen(img.src);
    });

    dom.fsClose?.addEventListener("click", closeFullscreen);
    dom.fullScreenModal?.addEventListener("click", e => { if (e.target === dom.fullScreenModal) closeFullscreen(); });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") { closeFullscreen(); closeLoginModal(); }
    });
}

async function loadGallery() {
    setLoading(true);
    try {
        // Initialize Firebase with seed data if empty
        await seedFirebaseIfEmpty();
        
        state.allImages = await galleryService.listImages();
    } catch {
        state.allImages = [];
    } finally {
        applyFilter();
        setLoading(false);
    }
}

function applyFilter() {
    const cat = state.activeCategory;
    state.filtered = cat === "todos"
        ? state.allImages
        : state.allImages.filter(img => img.category === cat);
    state.currentPage = 1;
    reRenderGallery();
}

function reRenderGallery() {
    const total = state.filtered.length;
    const perPage = state.itemsPerPage === 9999 ? total : state.itemsPerPage;
    const start = (state.currentPage - 1) * perPage;
    const slice = state.filtered.slice(start, start + perPage);

    renderGallery(slice);

    if (dom.resultCount) {
        dom.resultCount.textContent = `${total} imagen${total !== 1 ? "es" : ""}`;
    }

    if (state.itemsPerPage === 9999) {
        if (dom.pagination) dom.pagination.innerHTML = "";
        if (dom.paginationInfo) dom.paginationInfo.textContent = "";
        return;
    }

    renderPagination(total, perPage);
}

function renderGallery(images) {
    if (!dom.gallery) return;
    dom.gallery.innerHTML = "";

    if (!images.length) {
        dom.gallery.innerHTML = '<p class="empty-message">No hay imágenes en esta categoría.</p>';
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
        img.addEventListener("error", () => item.remove());
        img.src = image.src;
        item.appendChild(img);

        if (state.isAdmin) {
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "delete-btn";
            delBtn.title = "Eliminar";
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.addEventListener("click", async e => {
                e.stopPropagation();
                if (!confirm("¿Eliminar esta imagen?")) return;
                try {
                    await galleryService.deleteImage(image);
                    state.allImages = state.allImages.filter(i => i.id !== image.id);
                    applyFilter();
                } catch { alert("No se pudo eliminar."); }
            });
            item.appendChild(delBtn);
        }

        dom.gallery.appendChild(item);
    });
}

function renderPagination(total, perPage) {
    if (!dom.pagination) return;
    dom.pagination.innerHTML = "";
    const totalPages = Math.ceil(total / perPage);

    if (totalPages <= 1) {
        if (dom.paginationInfo) dom.paginationInfo.textContent = "";
        return;
    }

    const mkBtn = (label, disabled, active, onClick) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `pagination-btn ${active ? "active" : ""} ${disabled ? "disabled" : ""}`.trim();
        b.textContent = label;
        b.disabled = disabled;
        if (!disabled) b.addEventListener("click", onClick);
        return b;
    };

    dom.pagination.appendChild(mkBtn("«", state.currentPage === 1, false, () => goToPage(state.currentPage - 1)));

    for (let p = 1; p <= totalPages; p++) {
        dom.pagination.appendChild(mkBtn(String(p), false, p === state.currentPage, () => goToPage(p)));
    }

    dom.pagination.appendChild(mkBtn("»", state.currentPage === totalPages, false, () => goToPage(state.currentPage + 1)));

    if (dom.paginationInfo) {
        dom.paginationInfo.textContent = `Página ${state.currentPage} de ${totalPages} — ${total} imágenes`;
    }
}

function goToPage(page) {
    state.currentPage = page;
    reRenderGallery();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function setLoading(on) {
    dom.loading?.classList.toggle("is-visible", on);
    if (dom.gallery) dom.gallery.style.opacity = on ? ".4" : "";
}

// ── Upload por URL ──────────────────────────────────────────────────────────

async function handleUrlUpload() {
    const url = dom.urlInput?.value.trim();
    if (!url) return;
    const category = dom.catSelect?.value || "todos";
    try {
        const saved = await galleryService.saveExternalImage(url, category);
        state.allImages.unshift({ ...saved, category });
        applyFilter();
        if (dom.urlInput) dom.urlInput.value = "";
    } catch { alert("No se pudo agregar la imagen."); }
}

// ── Cloudinary Widget ───────────────────────────────────────────────────────

function initCloudinaryWidget() {
    if (!window.cloudinary) return;
    state.cloudinaryWidget = window.cloudinary.createUploadWidget({
        cloudName:   APP_CONFIG.cloudinary.cloudName,
        uploadPreset: APP_CONFIG.cloudinary.uploadPreset,
        folder:      APP_CONFIG.cloudinary.assetFolder,
        asset_folder: APP_CONFIG.cloudinary.assetFolder,
        tags:        [APP_CONFIG.cloudinary.listTag],
        sources:     APP_CONFIG.cloudinary.sources
    }, async (error, result) => {
        if (error || result?.event !== "success") return;
        const category = dom.catSelect?.value || "todos";
        try {
            const saved = await galleryService.saveUploadedImage({ ...result.info, category });
            state.allImages.unshift({ ...saved, category });
            applyFilter();
        } catch { alert("Error al guardar la imagen."); }
    });
}

// ── Fullscreen ──────────────────────────────────────────────────────────────

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

// ── Auth ────────────────────────────────────────────────────────────────────

function openLoginModal() {
    if (dom.loginMessage) dom.loginMessage.textContent = "";
    dom.loginModal?.classList.add("is-open");
    dom.closeLoginModal?.addEventListener("click", closeLoginModal, { once: true });
    window.addEventListener("click", e => { if (e.target === dom.loginModal) closeLoginModal(); }, { once: true });
    dom.loginBtn?.addEventListener("click", attemptLogin, { once: true });
}
function closeLoginModal() { dom.loginModal?.classList.remove("is-open"); }

async function attemptLogin() {
    const email    = dom.emailInput?.value.trim() || "";
    const password = dom.passwordInput?.value.trim() || "";
    if (!email || !password) { if (dom.loginMessage) dom.loginMessage.textContent = "Completa los campos."; return; }

    const btn = dom.loginBtn;
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando…'; }

    try {
        await authClient.login({ email, password });
        // Redirigir al panel de administración
        window.location.href = "../admin.html";
    } catch {
        if (dom.loginMessage) dom.loginMessage.textContent = "Credenciales inválidas.";
        if (btn) { btn.disabled = false; btn.innerHTML = 'Ingresar'; }
    }
}

async function handleLogout() {
    await authClient.logout();
    state.isAdmin = false;
    window._navSetAdmin?.(false);
    dom.uploadSection?.classList.add("hidden");
    reRenderGallery();
}
