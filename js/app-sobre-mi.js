/**
 * app-sobre-mi.js — Página "Sobre mí" con edición inline para el admin
 */

import "../js/firebase-provider.js";
import { APP_CONFIG }       from "./config.js";
import { createAuthClient } from "./auth.js";
import { initNav }          from "./nav.js";

const authClient = createAuthClient(APP_CONFIG.auth);

let isEditing   = false;
let cloudWidget = null;

document.addEventListener("DOMContentLoaded", initSobreMi);

async function initSobreMi() {
    initNav("about", {
        onLogoutClick: handleLogout
    });

    // Cargar contenido desde Firebase
    await loadContent();

    const isAdmin = await authClient.checkSession();
    window._navSetAdmin?.(isAdmin);
    if (isAdmin) showAdminControls();

    initCloudinaryWidget();
}

// ── Cargar contenido ────────────────────────────────────────────────────────

async function loadContent() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.getSobreMi) return;
    try {
        const data = await provider.getSobreMi();
        if (data) applyContent(data);
    } catch { /* usa los defaults del HTML */ }
}

function applyContent(data) {
    if (data.name)    setEl("aboutName",     data.name);
    if (data.role)    setEl("aboutRole",     data.role);
    if (data.bio1)    setEl("aboutBio1",     data.bio1);
    if (data.bio2)    setEl("aboutBio2",     data.bio2);
    if (data.statPhotos)  setEl("statPhotos",  data.statPhotos);
    if (data.statYears)   setEl("statYears",   data.statYears);
    if (data.statClients) setEl("statClients", data.statClients);
    if (data.photoUrl) {
        const img = document.getElementById("aboutPhoto");
        const placeholder = document.getElementById("aboutPhotoPlaceholder");
        if (img) { img.src = data.photoUrl; img.classList.remove("hidden"); }
        if (placeholder) placeholder.classList.add("hidden");
    }
}

function setEl(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

// ── Controles admin ─────────────────────────────────────────────────────────

function showAdminControls() {
    const controls = document.getElementById("adminAboutControls");
    if (controls) controls.classList.remove("hidden");
    controls?.classList.add("flex");

    document.getElementById("editAboutBtn")?.addEventListener("click", startEditing);
    document.getElementById("saveAboutBtn")?.addEventListener("click", saveContent);
}

function startEditing() {
    isEditing = true;
    const editableIds = ["aboutName", "aboutRole", "aboutBio1", "aboutBio2", "statPhotos", "statYears", "statClients"];
    editableIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute("contenteditable", "true");
    });
    document.getElementById("editAboutBtn")?.classList.add("hidden");
    document.getElementById("saveAboutBtn")?.classList.remove("hidden");
    document.getElementById("adminPhotoTools")?.classList.remove("hidden");
}

async function saveContent() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.saveSobreMi) { alert("Firebase no configurado."); return; }

    const data = {
        name:        document.getElementById("aboutName")?.textContent || "",
        role:        document.getElementById("aboutRole")?.textContent || "",
        bio1:        document.getElementById("aboutBio1")?.innerHTML   || "",
        bio2:        document.getElementById("aboutBio2")?.innerHTML   || "",
        statPhotos:  document.getElementById("statPhotos")?.textContent || "",
        statYears:   document.getElementById("statYears")?.textContent  || "",
        statClients: document.getElementById("statClients")?.textContent || "",
        photoUrl:    document.getElementById("aboutPhoto")?.src || ""
    };

    const btn = document.getElementById("saveAboutBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando…'; }

    try {
        await provider.saveSobreMi(data);

        // Salir del modo edición
        isEditing = false;
        ["aboutName","aboutRole","aboutBio1","aboutBio2","statPhotos","statYears","statClients"].forEach(id => {
            document.getElementById(id)?.removeAttribute("contenteditable");
        });
        document.getElementById("editAboutBtn")?.classList.remove("hidden");
        document.getElementById("saveAboutBtn")?.classList.add("hidden");
        document.getElementById("adminPhotoTools")?.classList.add("hidden");

        const msg = document.getElementById("aboutSaveMsg");
        if (msg) { msg.classList.remove("hidden"); msg.classList.add("is-visible"); setTimeout(() => { msg.classList.remove("is-visible"); msg.classList.add("hidden"); }, 3000); }
    } catch { alert("No se pudo guardar. Intenta de nuevo."); }
    finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar cambios'; }
    }
}

// ── Cloudinary para foto de perfil ──────────────────────────────────────────

function initCloudinaryWidget() {
    if (!window.cloudinary) return;
    cloudWidget = window.cloudinary.createUploadWidget({
        cloudName:    APP_CONFIG.cloudinary.cloudName,
        uploadPreset: APP_CONFIG.cloudinary.uploadPreset,
        maxFiles:     1,
        sources:      ["local", "url", "camera"],
        cropping:     true,
        croppingAspectRatio: 0.75
    }, (error, result) => {
        if (error || result?.event !== "success") return;
        const url = result.info.secure_url;
        const img = document.getElementById("aboutPhoto");
        const placeholder = document.getElementById("aboutPhotoPlaceholder");
        if (img) { img.src = url; img.classList.remove("hidden"); }
        if (placeholder) placeholder.classList.add("hidden");
    });

    document.getElementById("changePhotoBtn")?.addEventListener("click", () => cloudWidget?.open());
}

// ── Auth ────────────────────────────────────────────────────────────────────

async function handleLogout() {
    await authClient.logout();
    window._navSetAdmin?.(false);
    isEditing = false;
    document.getElementById("adminAboutControls")?.classList.add("hidden");
}
