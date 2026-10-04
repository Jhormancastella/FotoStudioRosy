/**
 * app-cotizar.js — Cotizador dinámico
 * Los precios se cargan desde Firebase (editados desde el admin).
 * Fallback: APP_CONFIG.pricing si Firebase no responde.
 *
 * Lógica de precios:
 *   - "Impresión básica" → precio = tamaño × multiplicador_material
 *   - Cualquier otro servicio → precio = (tamaño × multiplicador_material) + precio_servicio
 *
 * Especial 3×4 cm en papel fotográfico:
 *   Incluye 6 fotos (3 fondo azul + 3 fondo blanco) al precio base.
 */

import "../js/firebase-provider.js";
import { APP_CONFIG }       from "./config.js";
import { createAuthClient } from "./auth.js";
import { initNav }          from "./nav.js";

const authClient       = createAuthClient(APP_CONFIG.auth);
const { contact }      = APP_CONFIG;

/** Datos de precios activos (se sobreescriben con los de Firebase) */
let pricing = {
    sizes:     APP_CONFIG.pricing.sizes.map(s => ({ ...s })),
    materials: APP_CONFIG.pricing.materials.map(m => ({ ...m })),
    services:  APP_CONFIG.pricing.services.map(s => ({ ...s }))
};

document.addEventListener("DOMContentLoaded", initCotizar);

// ── Inicialización ─────────────────────────────────────────────────────────

async function initCotizar() {
    initNav("quote", { onLogoutClick: handleLogout });

    // Cargar precios desde Firebase; si falla usa los de config.js
    await loadPricingFromFirebase();

    // Poblar los <select> con los datos cargados
    populateSelects();

    // Calcular desde el estado inicial
    calcTotal();

    // Eventos
    bindCalculator();

    const isAdmin = await authClient.checkSession();
    window._navSetAdmin?.(isAdmin);
}

// ── Carga de precios desde Firebase ───────────────────────────────────────

async function loadPricingFromFirebase() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.getPricing) return;
    try {
        const data = await provider.getPricing();
        if (data?.sizes?.length)     pricing.sizes     = data.sizes;
        if (data?.materials?.length) pricing.materials = data.materials;
        if (data?.services?.length)  pricing.services  = data.services;
    } catch {
        // Silencioso: usa fallback de config.js
    }
}

// ── Poblar selects dinámicamente ──────────────────────────────────────────

function populateSelects() {
    // Servicios
    const serviceSelect = document.getElementById("serviceSelect");
    if (serviceSelect) {
        serviceSelect.innerHTML = pricing.services.map(s => {
            const priceLabel = s.price === 0
                ? "Precio por tamaño"
                : `+ ${formatCOP(s.price)}`;
            return `<option value="${s.id}">${s.label} — ${priceLabel}</option>`;
        }).join("");
    }

    // Tamaños
    const sizeSelect = document.getElementById("sizeSelect");
    if (sizeSelect) {
        sizeSelect.innerHTML = pricing.sizes.map((s, i) => {
            const hint = s.id === "3x4" ? " ★ 6 fotos incl." : "";
            return `<option value="${s.id}" ${i === 0 ? "selected" : ""}>${s.label}${hint} — ${formatCOP(s.price)}</option>`;
        }).join("");
    }

    // Materiales
    const materialSelect = document.getElementById("materialSelect");
    if (materialSelect) {
        materialSelect.innerHTML = pricing.materials.map(m => {
            const surcharge = m.surcharge ?? 0;
            const extra = surcharge === 0 ? "Incluido" : `+ ${formatCOP(surcharge)}`;
            return `<option value="${m.id}">${m.label} — ${extra}</option>`;
        }).join("");
    }
}

// ── Calculadora ─────────────────────────────────────────────────────────────

function bindCalculator() {
    ["serviceSelect", "sizeSelect", "materialSelect", "quantityInput"].forEach(id => {
        document.getElementById(id)?.addEventListener("change", onSelectionChange);
        document.getElementById(id)?.addEventListener("input",  onSelectionChange);
    });

    document.getElementById("quoteSendBtn")?.addEventListener("click", sendQuote);
}

function onSelectionChange() {
    calcTotal();
    updateSpecialHint();
}

function getSelectedPricing() {
    const serviceId  = document.getElementById("serviceSelect")?.value;
    const sizeId     = document.getElementById("sizeSelect")?.value;
    const materialId = document.getElementById("materialSelect")?.value;
    const quantity   = Math.max(1, parseInt(document.getElementById("quantityInput")?.value || "1", 10));

    const service  = pricing.services.find(s => s.id === serviceId)  || pricing.services[0];
    const size     = pricing.sizes.find(s => s.id === sizeId)         || pricing.sizes[0];
    const material = pricing.materials.find(m => m.id === materialId) || pricing.materials[0];

    return { service, size, material, quantity };
}

function calcTotal() {
    const { service, size, material, quantity } = getSelectedPricing();

    // Nueva fórmula: precio tamaño + sobrecargo material + precio servicio
    // material.surcharge es el costo adicional fijo en COP según el material elegido.
    // Si llega un dato antiguo con multiplier (Firebase aún no actualizado), hacemos
    // fallback transparente para no romper cotizaciones existentes.
    const materialSurcharge = material.surcharge != null
        ? material.surcharge
        : (size.price * ((material.multiplier ?? 1) - 1));   // fallback legado

    const unitBase   = size.price + materialSurcharge;        // impresión base
    const unitTotal  = unitBase + service.price;              // + servicio adicional
    const grandTotal = unitTotal * quantity;

    // Mostrar total
    const totalEl = document.getElementById("quoteTotal");
    if (totalEl) totalEl.textContent = formatCOP(grandTotal);

    // Desglose
    const lines = [
        { label: `Impresión ${size.label}`, value: formatCOP(size.price) }
    ];
    if (materialSurcharge > 0) {
        lines.push({ label: `Material: ${material.label}`, value: `+ ${formatCOP(materialSurcharge)}` });
    } else {
        lines.push({ label: `Material: ${material.label}`, value: "Incluido" });
    }
    if (service.price > 0) {
        lines.push({ label: `Servicio: ${service.label}`, value: `+ ${formatCOP(service.price)}` });
    }
    if (quantity > 1) {
        lines.push({ label: `Cantidad: ${quantity} unidades`, value: `×${quantity}` });
    }
    lines.push({ label: "TOTAL estimado", value: formatCOP(grandTotal), bold: true });

    renderBreakdown(lines);

    // WhatsApp dinámico
    buildWhatsAppLink({ service, size, material, quantity, grandTotal });
}

function updateSpecialHint() {
    const sizeId     = document.getElementById("sizeSelect")?.value;
    const materialId = document.getElementById("materialSelect")?.value;
    const hintEl     = document.getElementById("specialHint");
    if (!hintEl) return;

    const show = sizeId === "3x4" && materialId === "papel_fotografico";
    // Support both old inline-style approach and new CSS-class approach
    if (typeof hintEl.classList !== "undefined") {
        hintEl.classList.toggle("visible", show);
    }
    hintEl.style.display = show ? "flex" : "none";
}

function formatCOP(n) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(n);
}

function renderBreakdown(lines) {
    const el = document.getElementById("breakdownLines");
    if (!el) return;
    el.innerHTML = lines.map(l => `
        <div style="display:flex;justify-content:space-between;align-items:center;
            ${l.bold ? "font-weight:700;border-top:1px solid rgba(252,37,162,.2);margin-top:.4rem;padding-top:.4rem" : ""}">
            <span style="color:#6b7280;font-size:.8rem">${l.label}</span>
            <span style="color:${l.bold ? "#fc25a2" : "#374151"};font-size:.8rem;font-weight:${l.bold ? "700" : "500"}">${l.value}</span>
        </div>
    `).join("");
}

function buildWhatsAppLink({ service, size, material, quantity, grandTotal }) {
    const msg = encodeURIComponent(
        `¡Hola Rosy Photo Studio! 📸\n` +
        `Quisiera cotizar lo siguiente:\n` +
        `• Servicio: ${service.label}\n` +
        `• Tamaño: ${size.label}${size.id === "3x4" && material.id === "papel_fotografico" ? " (incluye 3 fondo azul + 3 fondo blanco)" : ""}\n` +
        `• Material: ${material.label}\n` +
        `• Cantidad: ${quantity}\n` +
        `• Total estimado: ${formatCOP(grandTotal)}\n\n` +
        `⚠️ Nota: el precio final puede variar según la complejidad del diseño e impresión.\n` +
        `Por favor contáctenme para confirmar. ¡Gracias!`
    );
    const link = document.getElementById("quoteWhatsapp");
    if (link) link.href = `https://wa.me/${contact.whatsapp}?text=${msg}`;
}

// ── Envío de cotización a Firebase ─────────────────────────────────────────

async function sendQuote() {
    const name  = document.getElementById("quoteName")?.value.trim();
    const email = document.getElementById("quoteEmail")?.value.trim();
    const phone = document.getElementById("quotePhone")?.value.trim();
    const notes = document.getElementById("quoteNotes")?.value.trim();

    if (!name || !email) {
        showMsg("quoteMsgError", true, "Por favor completa nombre y correo.");
        return;
    }

    const btn = document.getElementById("quoteSendBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando…'; }

    const { service, size, material, quantity } = getSelectedPricing();
    const baseImpresion = size.price * material.multiplier;
    const total         = (baseImpresion + service.price) * quantity;

    try {
        const provider = window.FirebaseGalleryProvider;
        if (provider?.saveCotizacion) {
            await provider.saveCotizacion({
                name, email, phone, notes,
                service:  service.label,
                size:     size.label,
                material: material.label,
                quantity,
                total
            });
        }
        showMsg("quoteMsg", true);
        showMsg("quoteMsgError", false);
        // Limpiar form
        ["quoteName","quoteEmail","quotePhone","quoteNotes"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
    } catch {
        showMsg("quoteMsgError", true, "Error al enviar. Intenta de nuevo.");
        showMsg("quoteMsg", false);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar cotización'; }
    }
}

function showMsg(id, visible, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("is-visible", visible);
    if (text) {
        const span = el.querySelector("span");
        if (span) span.textContent = text;
    }
}

// ── Auth ────────────────────────────────────────────────────────────────────

async function handleLogout() {
    await authClient.logout();
    window._navSetAdmin?.(false);
}
