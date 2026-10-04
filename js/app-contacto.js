/**
 * app-contacto.js — Formulario de contacto con envío a Firebase
 */

import "../js/firebase-provider.js";
import { APP_CONFIG }       from "./config.js";
import { createAuthClient } from "./auth.js";
import { initNav }          from "./nav.js";

const authClient = createAuthClient(APP_CONFIG.auth);

document.addEventListener("DOMContentLoaded", initContacto);

async function initContacto() {
    initNav("contact", {
        onLogoutClick: handleLogout
    });

    bindForm();

    const isAdmin = await authClient.checkSession();
    window._navSetAdmin?.(isAdmin);
}

function bindForm() {
    document.getElementById("contactSendBtn")?.addEventListener("click", sendMessage);
}

async function sendMessage() {
    const name    = document.getElementById("contactName")?.value.trim();
    const email   = document.getElementById("contactEmail")?.value.trim();
    const phone   = document.getElementById("contactPhone")?.value.trim();
    const subject = document.getElementById("contactSubject")?.value || "";
    const message = document.getElementById("contactMessage")?.value.trim();

    if (!name || !email || !message) {
        showMsg("contactMsgError", true);
        showMsg("contactMsg", false);
        return;
    }

    const btn = document.getElementById("contactSendBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando…'; }

    try {
        const provider = window.FirebaseGalleryProvider;
        if (provider?.saveContactMessage) {
            await provider.saveContactMessage({ name, email, phone, subject, message });
        }
        showMsg("contactMsg", true);
        showMsg("contactMsgError", false);
        // Limpiar formulario
        ["contactName","contactEmail","contactPhone","contactMessage"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
    } catch {
        showMsg("contactMsgError", true);
        showMsg("contactMsg", false);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensaje'; }
    }
}

function showMsg(id, visible) {
    document.getElementById(id)?.classList.toggle("is-visible", visible);
}

// ── Auth ────────────────────────────────────────────────────────────────────

async function handleLogout() {
    await authClient.logout();
    window._navSetAdmin?.(false);
}
