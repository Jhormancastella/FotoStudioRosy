/**
 * social-links.js
 * Carga los links de contacto y redes sociales desde Firestore (pages/contact)
 * y los aplica dinámicamente a todos los elementos del DOM.
 *
 * Fallback: si Firebase no responde o el documento no existe,
 * usa los valores de APP_CONFIG.contact.social (hardcodeados como respaldo).
 *
 * Uso desde cualquier página JS:
 *   import { applyContactLinks } from "./social-links.js";
 *   applyContactLinks();   // se puede llamar sin await, se resuelve sola
 */

import { APP_CONFIG } from "./config.js";

/** Valores por defecto extraídos del config estático */
const DEFAULTS = {
    whatsapp:  APP_CONFIG.contact.social.whatsapp,
    facebook:  APP_CONFIG.contact.social.facebook,
    instagram: APP_CONFIG.contact.social.instagram,
    tiktok:    APP_CONFIG.contact.social.tiktok,
    phone:     APP_CONFIG.contact.phone,
    email:     APP_CONFIG.contact.email
};

/**
 * Obtiene los links de Firestore.
 * Retorna null si el provider aún no está listo o el documento no existe.
 */
async function fetchContactLinks() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.getContactLinks) return null;
    try {
        return await provider.getContactLinks();
    } catch {
        return null;
    }
}

/**
 * Convierte una URL de wa.me en número formateado legible.
 * Ej: "https://wa.me/573178654554" → "+57 317 865 4554"
 * Si ya es un número formateado (empieza con +) lo retorna tal cual.
 */
function waUrlToPhone(waUrl) {
    if (!waUrl) return "";
    // Si ya viene como número formateado
    if (waUrl.startsWith("+") || /^\d[\d\s\-]+$/.test(waUrl)) return waUrl;
    const raw = waUrl.replace(/^https?:\/\/wa\.me\//, "").replace(/[^\d]/g, "");
    if (!raw) return waUrl;
    // Colombia (+57): +57 XXX XXX XXXX
    if (raw.startsWith("57") && raw.length === 12) {
        return `+57 ${raw.slice(2, 5)} ${raw.slice(5, 8)} ${raw.slice(8)}`;
    }
    // Genérico: agrupar de a 3 desde la derecha del indicativo
    return `+${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 8)} ${raw.slice(8)}`;
}

/**
 * Parcha todos los elementos del DOM que llevan un enlace de red social
 * o WhatsApp con los valores dinámicos de Firestore (con fallback al config).
 *
 * Elementos que se actualizan:
 * - .social-link--wa / --fb / --ig / --tt       → href
 * - .contact-channel con icono WA/FB/IG/TT      → href
 * - .site-footer links WA/FB/IG/TT              → href
 * - #quoteWhatsapp                               → href base (cotizar.html)
 * - a[href*="wa.me"] genéricos                  → href
 * - Textos visibles del número de WhatsApp:
 *     #waTextMap, #waTextFooter (#waPhoneFooter),
 *     #waTextSobreMi, #waPhoneChannel
 */
function patchDOM(links) {
    const wa = links.whatsapp  || DEFAULTS.whatsapp;
    const fb = links.facebook  || DEFAULTS.facebook;
    const ig = links.instagram || DEFAULTS.instagram;
    const tt = links.tiktok    || DEFAULTS.tiktok;

    // Número formateado para texto visible (+57 317 865 4554)
    const phoneText = links.phone || waUrlToPhone(wa);

    // ── Iconos de la sección "Síguenos en redes" (.social-link--xx) ──────
    document.querySelectorAll(".social-link--wa").forEach(el => { el.href = wa; });
    document.querySelectorAll(".social-link--fb").forEach(el => { el.href = fb; });
    document.querySelectorAll(".social-link--ig").forEach(el => { el.href = ig; });
    document.querySelectorAll(".social-link--tt").forEach(el => { el.href = tt; });

    // ── Tarjetas de canal (.contact-channel) en contactanos.html ─────────
    document.querySelectorAll(".contact-channel").forEach(el => {
        if (!(el instanceof HTMLAnchorElement)) return;
        const icon = el.querySelector("i");
        if (!icon) return;
        if (icon.classList.contains("fa-whatsapp"))    el.href = wa;
        if (icon.classList.contains("fa-facebook-f"))  el.href = fb;
        if (icon.classList.contains("fa-instagram"))   el.href = ig;
        if (icon.classList.contains("fa-tiktok"))      el.href = tt;
    });

    // ── Footer de index.html (.site-footer) ──────────────────────────────
    document.querySelectorAll(".site-footer a[href]").forEach(el => {
        const icon = el.querySelector("i");
        if (!icon) return;
        if (icon.classList.contains("fa-whatsapp"))    el.href = wa;
        if (icon.classList.contains("fa-facebook-f"))  el.href = fb;
        if (icon.classList.contains("fa-instagram"))   el.href = ig;
        if (icon.classList.contains("fa-tiktok"))      el.href = tt;
    });

    // ── Botón WhatsApp del cotizador (#quoteWhatsapp) ────────────────────
    const waNum = wa.replace("https://wa.me/", "");
    const quoteBtn = document.getElementById("quoteWhatsapp");
    if (quoteBtn && !quoteBtn.dataset.hasMessage) {
        quoteBtn.href = wa;
    }
    if (window.__contact) {
        window.__contact.whatsapp = waNum;
    }

    // ── CTAs WhatsApp adicionales (a[href*="wa.me"]) ──────────────────────
    document.querySelectorAll(`a[href*="wa.me"]`).forEach(el => {
        if (el.id === "quoteWhatsapp") return;
        try {
            const url  = new URL(el.href, window.location.href);
            const text = url.searchParams.get("text");
            el.href    = text ? `${wa}?text=${encodeURIComponent(text)}` : wa;
        } catch { el.href = wa; }
    });

    // ── Textos VISIBLES del número de teléfono ────────────────────────────

    // index.html — sección mapa: <a id="waTextMap">+57 322 913 5021</a>
    const waTextMap = document.getElementById("waTextMap");
    if (waTextMap) {
        waTextMap.href        = wa;
        waTextMap.textContent = phoneText;
    }

    // index.html — footer: <span id="waPhoneFooter">+57 322 913 5021</span>
    const waPhoneFooter = document.getElementById("waPhoneFooter");
    if (waPhoneFooter) waPhoneFooter.textContent = phoneText;
    // también actualizar el href del anchor padre
    const waTextFooter = document.getElementById("waTextFooter");
    if (waTextFooter) waTextFooter.href = wa;

    // contactanos.html — tarjeta canal: <p id="waPhoneChannel">+57 322 913 5021</p>
    const waPhoneChannel = document.getElementById("waPhoneChannel");
    if (waPhoneChannel) waPhoneChannel.textContent = phoneText;

    // sobre-mi.html — bloque info: <a id="waTextSobreMi">+57 322 913 5021</a>
    const waTextSobreMi = document.getElementById("waTextSobreMi");
    if (waTextSobreMi) {
        waTextSobreMi.href        = wa;
        waTextSobreMi.textContent = phoneText;
    }

    // ── Guardar en window.__contact para compatibilidad ───────────────────
    window.__socialLinks = { whatsapp: wa, facebook: fb, instagram: ig, tiktok: tt, phone: phoneText };
}

/**
 * Función principal exportada.
 * Llama a patchDOM inmediatamente con los defaults, luego con los de Firestore.
 */
export async function applyContactLinks() {
    // 1. Aplicar defaults de config.js de inmediato (sin esperar a Firebase)
    patchDOM(DEFAULTS);

    // 2. Esperar que el provider esté disponible (lo inyecta firebase-provider.js)
    //    Intentamos hasta 3 s para no bloquear páginas sin conexión.
    let provider = window.FirebaseGalleryProvider;
    if (!provider) {
        await new Promise(resolve => {
            const t0 = Date.now();
            const id = setInterval(() => {
                if (window.FirebaseGalleryProvider || Date.now() - t0 > 3000) {
                    clearInterval(id);
                    resolve();
                }
            }, 80);
        });
    }

    // 3. Obtener valores de Firestore y re-aplicar si existen
    const remote = await fetchContactLinks();
    if (remote) patchDOM(remote);
}
