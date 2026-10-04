/**
 * app-admin.js — Panel de administración completo
 */

import "./firebase-provider.js";
import { APP_CONFIG }                               from "./config.js";
import { createAuthClient }                         from "./auth.js";
import { createGalleryService }                     from "./gallery-service.js";
import { getCategorias, invalidateCategoriesCache } from "./categories-service.js";

const authClient     = createAuthClient(APP_CONFIG.auth);
const galleryService = createGalleryService(APP_CONFIG);

let cloudWidget      = null;
let cloudPhotoWidget = null;
let currentPanel     = "dashboard";
let allImages        = [];
let pricingData      = null;
let _pricingBound    = false;

// ── Inicialización ─────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    bindLoginScreen();
    document.getElementById("loginSubmitBtn")?.addEventListener("click", attemptAdminLogin);
    document.getElementById("loginPassword")?.addEventListener("keydown", e => {
        if (e.key === "Enter") attemptAdminLogin();
    });
});

// ── Login ───────────────────────────────────────────────────────────────────

function bindLoginScreen() {
    const provider = window.FirebaseGalleryProvider;
    if (provider) {
        provider.checkSession().then(ok => {
            if (ok) enterPanel();
        }).catch(() => {});
    }
}

async function attemptAdminLogin() {
    const email = document.getElementById("loginEmail")?.value.trim();
    const pass  = document.getElementById("loginPassword")?.value.trim();
    const errEl = document.getElementById("loginErr");
    const btn   = document.getElementById("loginSubmitBtn");

    if (!email || !pass) {
        if (errEl) errEl.textContent = "Completa correo y contraseña.";
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando…'; }

    try {
        await authClient.login({ email, password: pass });
        enterPanel();
    } catch {
        if (errEl) errEl.textContent = "Credenciales inválidas. Intenta de nuevo.";
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock-open"></i> Ingresar al panel'; }
    }
}

function enterPanel() {
    document.getElementById("adminLoginScreen")?.classList.add("hidden");
    document.getElementById("adminPanel")?.classList.remove("hidden");
    const emailEl = document.getElementById("adminUserEmail");
    if (emailEl) emailEl.textContent = document.getElementById("loginEmail")?.value || "Admin";
    initPanel();
}

// ── Panel principal ─────────────────────────────────────────────────────────

async function initPanel() {
    initSidebar();
    initMobileSidebar();
    initCloudinaryWidget();
    initPricingPhotoWidget();

    document.getElementById("refreshQuotes")?.addEventListener("click", loadQuotes);
    document.getElementById("refreshMessages")?.addEventListener("click", loadMessages);
    document.getElementById("refreshGallery")?.addEventListener("click", loadGallery);

    document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
        await authClient.logout();
        window.location.href = "index.html";
    });

    // Galería y categorías: lectura pública — cargar de inmediato
    loadDashboard();
    loadGallery();
    loadCategories();

    // Datos protegidos: esperar token de Auth antes de consultar
    const provider = window.FirebaseGalleryProvider;
    if (provider?.waitForAuthUser) {
        provider.waitForAuthUser().then(() => {
            loadQuotes();
            loadMessages();
            loadPricing();
            loadAboutData();
        });
    } else {
        setTimeout(() => {
            loadQuotes();
            loadMessages();
            loadPricing();
            loadAboutData();
        }, 800);
    }
}

// ── Sidebar desktop ─────────────────────────────────────────────────────────

function initSidebar() {
    document.querySelectorAll(".admin-nav-item[data-panel]").forEach(btn => {
        btn.addEventListener("click", () => {
            switchPanel(btn.dataset.panel);
            closeMobileSidebar();
        });
    });
    document.querySelectorAll("[data-panel]:not(.admin-nav-item)").forEach(el => {
        el.addEventListener("click", () => {
            const panel = el.dataset.panel;
            if (panel) switchPanel(panel);
        });
    });
}

// ── Sidebar móvil ───────────────────────────────────────────────────────────

function openMobileSidebar() {
    document.getElementById("adminSidebar")?.classList.add("is-open");
    document.getElementById("adminSidebarBackdrop")?.classList.add("is-open");
    document.body.style.overflow = "hidden";
}
function closeMobileSidebar() {
    document.getElementById("adminSidebar")?.classList.remove("is-open");
    document.getElementById("adminSidebarBackdrop")?.classList.remove("is-open");
    document.body.style.overflow = "";
}
function initMobileSidebar() {
    document.getElementById("sidebarToggle")?.addEventListener("click", openMobileSidebar);
    document.getElementById("adminSidebarBackdrop")?.addEventListener("click", closeMobileSidebar);
}

function switchPanel(panelId) {
    currentPanel = panelId;
    document.querySelectorAll(".admin-nav-item[data-panel]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.panel === panelId);
    });
    document.querySelectorAll(".admin-tab-panel[id^='panel-']").forEach(p => p.classList.remove("active"));
    document.getElementById(`panel-${panelId}`)?.classList.add("active");

    const titleMap = {
        dashboard:  "Dashboard",
        gallery:    "Galería",
        categories: "Categorías",
        quotes:     "Cotizaciones",
        messages:   "Mensajes",
        pricing:    "Precios",
        about:      "Sobre mí"
    };
    const titleEl = document.getElementById("panelTitle");
    if (titleEl) titleEl.textContent = titleMap[panelId] || "Panel";
}

// ── Cloudinary Widget (galería) ─────────────────────────────────────────────

function initCloudinaryWidget() {
    if (!window.cloudinary) return;

    cloudWidget = window.cloudinary.createUploadWidget({
        cloudName:    APP_CONFIG.cloudinary.cloudName,
        uploadPreset: APP_CONFIG.cloudinary.uploadPreset,
        folder:       APP_CONFIG.cloudinary.assetFolder,
        asset_folder: APP_CONFIG.cloudinary.assetFolder,
        tags:         [APP_CONFIG.cloudinary.listTag],
        sources:      APP_CONFIG.cloudinary.sources
    }, async (error, result) => {
        if (error || result?.event !== "success") return;
        const category = document.getElementById("uploadCategory")?.value || "todos";
        const name     = document.getElementById("uploadImageName")?.value.trim() || "";
        try {
            const saved = await galleryService.saveUploadedImage({ ...result.info, category, name: name || undefined });
            allImages.unshift({ ...saved, category });
            renderAdminGallery(allImages);
            updateStatImgs();
            showToast("Imagen subida", "success", "Guardada en la galería correctamente");
        } catch {
            showToast("Error al subir", "error", "No se pudo guardar la imagen");
        }
    });

    document.getElementById("adminCloudinaryBtn")?.addEventListener("click", () => cloudWidget?.open());
    document.getElementById("adminUrlToggle")?.addEventListener("click", () => {
        document.getElementById("adminUrlArea")?.classList.toggle("hidden");
    });
    document.getElementById("adminUrlSubmit")?.addEventListener("click", handleAdminUrlUpload);
    document.getElementById("filterCategory")?.addEventListener("change", () => {
        const cat = document.getElementById("filterCategory")?.value;
        const filtered = cat === "todos" ? allImages : allImages.filter(i => i.category === cat);
        renderAdminGallery(filtered);
    });
}

async function handleAdminUrlUpload() {
    const url      = document.getElementById("adminUrlInput")?.value.trim();
    const category = document.getElementById("uploadCategory")?.value || "todos";
    if (!url) return;
    try {
        const saved = await galleryService.saveExternalImage(url, category);
        allImages.unshift({ ...saved, category });
        renderAdminGallery(allImages);
        const inp = document.getElementById("adminUrlInput");
        if (inp) inp.value = "";
        showToast("Imagen agregada", "success", "Guardada en la galería");
    } catch {
        showToast("Error al agregar", "error", "Verifica la URL e intenta de nuevo");
    }
}

// ── Dashboard ───────────────────────────────────────────────────────────────

function loadDashboard() { updateStatImgs(); }
function updateStatImgs() {
    const el = document.getElementById("statImgs");
    if (el) el.textContent = allImages.length;
}

// ── Galería ─────────────────────────────────────────────────────────────────

async function loadGallery() {
    const loading = document.getElementById("adminGalleryLoading");
    if (loading) loading.style.display = "block";
    try {
        await populateCategorySelects();
        allImages = await galleryService.listImages();
        renderAdminGallery(allImages);
        updateStatImgs();
    } catch {
        showToast("Error al cargar galería", "error");
    } finally {
        if (loading) loading.style.display = "none";
    }
}

// ── Selects de categoría ────────────────────────────────────────────────────

async function populateCategorySelects() {
    const cats       = await getCategorias();
    const uploadOpts = cats.filter(c => c.id !== "todos")
        .map(c => `<option value="${c.id}">${c.label}</option>`).join("");
    const filterOpts = cats
        .map(c => `<option value="${c.id}">${c.label}</option>`).join("");

    const uploadSel = document.getElementById("uploadCategory");
    const filterSel = document.getElementById("filterCategory");
    if (uploadSel) uploadSel.innerHTML = uploadOpts;
    if (filterSel) filterSel.innerHTML = filterOpts;
    return cats;
}

async function renderAdminGallery(images) {
    const grid = document.getElementById("adminGalleryGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!images.length) {
        grid.innerHTML = '<p style="color:#64748b;font-size:.875rem;padding:1rem">No hay imágenes.</p>';
        return;
    }

    const cats       = await getCategorias();
    const catOptions = cats.map(c => `<option value="${c.id}">${c.label}</option>`).join("");

    images.forEach(img => {
        const item = document.createElement("div");
        item.className = "admin-gallery-item";
        item.innerHTML = `
            <img src="${img.src}" alt="${img.name || "Imagen"}" loading="lazy">
            <div class="item-overlay">
                <button class="btn-admin btn-admin--danger btn-admin--sm" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
                <select class="admin-select cat-edit-select" title="Cambiar categoría"
                    style="font-size:.65rem;padding:.2rem .4rem;height:auto;background:rgba(0,0,0,.75);
                           color:#e2e8f0;border:1px solid #475569;border-radius:.3rem;cursor:pointer">
                    ${catOptions}
                </select>
            </div>`;

        const sel    = item.querySelector(".cat-edit-select");
        sel.value    = img.category || "todos";
        const delBtn = item.querySelector(".btn-admin--danger");

        delBtn.addEventListener("click", async e => {
            e.stopPropagation();
            if (!confirm("¿Eliminar esta imagen?")) return;
            try {
                await galleryService.deleteImage(img);
                allImages = allImages.filter(i => i.id !== img.id);
                renderAdminGallery(allImages);
                updateStatImgs();
                showToast("Imagen eliminada", "success");
            } catch {
                showToast("Error al eliminar", "error", "Verifica los permisos e intenta de nuevo");
            }
        });

        sel.addEventListener("change", async e => {
            e.stopPropagation();
            const newCat   = e.target.value;
            const original = img.category || "todos";
            if (newCat === original) return;
            try {
                await galleryService.updateImageCategory(img, newCat);
                img.category = newCat;
                const catLabel = cats.find(c => c.id === newCat)?.label || newCat;
                showToast("Categoría actualizada", "success", `→ ${catLabel}`);
            } catch {
                e.target.value = original;
                showToast("Error al cambiar categoría", "error");
            }
        });

        grid.appendChild(item);
    });
}

// ── Categorías ─────────────────────────────────────────────────────────────

async function loadCategories() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.listCategories) return;
    try {
        const cats = await provider.listCategories();
        renderCategories(cats);
    } catch {
        showToast("Error al cargar categorías", "error");
    }

    const addBtn    = document.getElementById("addCatBtn");
    const cancelBtn = document.getElementById("cancelCatBtn");
    const saveBtn   = document.getElementById("saveCatBtn");
    if (addBtn && !addBtn._bound) {
        addBtn._bound = true;
        addBtn.addEventListener("click", () => {
            document.getElementById("catFormCard")?.classList.toggle("hidden");
            document.getElementById("catId")?.focus();
        });
        cancelBtn?.addEventListener("click", () => {
            document.getElementById("catFormCard")?.classList.add("hidden");
            _clearCatForm();
        });
        saveBtn?.addEventListener("click", saveCategory);
    }
}

function renderCategories(cats) {
    const list = document.getElementById("categoriesList");
    if (!list) return;

    if (!cats.length) {
        list.innerHTML = '<p style="font-size:.82rem;color:#64748b">No hay categorías personalizadas. Las predeterminadas se usan automáticamente.</p>';
        return;
    }

    list.innerHTML = cats.map(cat => `
        <div class="cat-row">
            <div style="display:flex;align-items:center;gap:.65rem;min-width:0">
                <i class="${cat.icon || "fas fa-tag"}" style="color:#f472b6;width:1rem;text-align:center;flex-shrink:0"></i>
                <span style="font-size:.875rem;color:#e2e8f0;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cat.label || cat.id}</span>
                <code style="font-size:.72rem;color:#64748b;background:rgba(0,0,0,.3);padding:.1rem .4rem;border-radius:.25rem;flex-shrink:0">${cat.id}</code>
            </div>
            <button class="btn-admin btn-admin--danger btn-admin--sm" data-cat-delete="${cat.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>`).join("");

    list.querySelectorAll("[data-cat-delete]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.catDelete;
            if (!confirm(`¿Eliminar la categoría "${id}"?`)) return;
            const provider = window.FirebaseGalleryProvider;
            try {
                await provider.deleteCategory(id);
                invalidateCategoriesCache();
                showToast("Categoría eliminada", "success");
                loadCategories();
                populateCategorySelects();
            } catch {
                showToast("Error al eliminar categoría", "error");
            }
        });
    });
}

async function saveCategory() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.saveCategory) {
        showToast("Firebase no disponible", "error");
        return;
    }

    const id    = document.getElementById("catId")?.value.trim().toLowerCase().replace(/\s+/g, "-");
    const label = document.getElementById("catLabel")?.value.trim();
    const icon  = document.getElementById("catIcon")?.value.trim() || "fas fa-tag";

    if (!id || !label) {
        showToast("ID y nombre son obligatorios", "error");
        return;
    }

    const btn = document.getElementById("saveCatBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando…'; }

    try {
        await provider.saveCategory({ id, label, icon, order: Date.now() });
        invalidateCategoriesCache();
        showToast("Categoría guardada", "success", `"${label}" añadida al catálogo`);
        document.getElementById("catFormCard")?.classList.add("hidden");
        _clearCatForm();
        loadCategories();
        populateCategorySelects();
    } catch {
        showToast("Error al guardar categoría", "error");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar'; }
    }
}

function _clearCatForm() {
    ["catId", "catLabel"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    const hidden  = document.getElementById("catIcon");
    const preview = document.getElementById("catIconPreview");
    const lbl     = document.getElementById("catIconLabel");
    const grid    = document.getElementById("iconPickerGrid");
    if (hidden)  hidden.value      = "fas fa-tag";
    if (preview) preview.innerHTML = '<i class="fas fa-tag"></i>';
    if (lbl)     lbl.textContent   = "fas fa-tag";
    grid?.querySelectorAll(".icon-pick-btn").forEach(b => {
        b.classList.toggle("selected", b.dataset.icon === "fas fa-tag");
    });
}

// ── Cotizaciones ─────────────────────────────────────────────────────────────

async function loadQuotes() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.listCotizaciones) return;

    const loading = document.getElementById("quotesLoading");
    if (loading) loading.style.display = "block";

    try {
        const quotes  = await provider.listCotizaciones();
        const tbody   = document.getElementById("quotesTbody");
        const empty   = document.getElementById("quotesEmpty");
        const stat    = document.getElementById("statQuotes");
        const badge   = document.getElementById("quoteBadge");

        if (stat) stat.textContent = quotes.length;
        const pending = quotes.filter(q => q.status === "pendiente").length;
        if (badge) { badge.textContent = pending; badge.classList.toggle("hidden", pending === 0); }

        if (!tbody) return;
        if (!quotes.length) { empty?.classList.remove("hidden"); tbody.innerHTML = ""; return; }
        empty?.classList.add("hidden");

        tbody.innerHTML = "";
        quotes.forEach(q => {
            const date  = q.createdAt ? new Date(q.createdAt).toLocaleDateString("es-CO") : "—";
            const total = q.total
                ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(q.total)
                : "—";
            const statusClass = q.status === "completado" ? "done" : q.status === "rechazado" ? "rejected" : "pending";

            // WhatsApp link para cotizaciones
            const waPhoneQ = (q.phone || "").replace(/\D/g, "");
            const waMsgQ   = encodeURIComponent(
                `Hola ${q.name || ""}, soy Rosy Photo Studio 📸\n` +
                `Recibí tu cotización:\n` +
                `• Servicio: ${q.service || "—"}\n` +
                `• Tamaño: ${q.size || "—"}\n` +
                `• Material: ${q.material || "—"}\n` +
                `• Total estimado: ${total}\n\n` +
                `Te contacto para confirmar los detalles:`
            );
            const waLinkQ = waPhoneQ
                ? `https://wa.me/${waPhoneQ.startsWith("57") ? waPhoneQ : "57" + waPhoneQ}?text=${waMsgQ}`
                : null;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <span class="td-main">${q.name || "—"}</span>
                    <span class="td-sub">${q.email || ""}</span>
                    ${waLinkQ
                        ? `<a href="${waLinkQ}" target="_blank" rel="noopener"
                              style="display:inline-flex;align-items:center;gap:.3rem;
                                     color:#25d366;font-size:.75rem;font-weight:600;
                                     text-decoration:none;margin-top:.15rem"
                              title="Responder por WhatsApp">
                               <i class="fab fa-whatsapp"></i> ${q.phone}
                           </a>`
                        : q.phone ? `<span class="td-sub">${q.phone}</span>` : ""
                    }
                </td>
                <td>${q.service || "—"}</td>
                <td>${q.size || "—"}</td>
                <td>${q.material || "—"}</td>
                <td style="color:#f472b6;font-weight:700">${total}</td>
                <td><span class="status-badge status-badge--${statusClass}">${q.status || "pendiente"}</span></td>
                <td class="td-sub">${date}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-admin btn-admin--secondary btn-admin--sm q-complete" title="Completar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-admin btn-admin--sm q-reject" title="Rechazar"
                            style="background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.25)">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="btn-admin btn-admin--danger btn-admin--sm q-delete" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>`;

            tr.querySelector(".q-complete").addEventListener("click", () => updateQuoteStatus(q.id, "completado"));
            tr.querySelector(".q-reject").addEventListener("click",   () => updateQuoteStatus(q.id, "rechazado"));
            tr.querySelector(".q-delete").addEventListener("click",   () => deleteQuote(q.id));
            tbody.appendChild(tr);
        });

    } catch {
        showToast("Error al cargar cotizaciones", "error");
    } finally {
        if (loading) loading.style.display = "none";
    }
}

async function updateQuoteStatus(id, status) {
    const provider = window.FirebaseGalleryProvider;
    try {
        await provider.updateCotizacionStatus(id, status);
        showToast(
            status === "completado" ? "Cotización completada" : "Cotización rechazada",
            status === "completado" ? "success" : "warn"
        );
        loadQuotes();
    } catch {
        showToast("Error al actualizar", "error");
    }
}

async function deleteQuote(id) {
    if (!confirm("¿Eliminar esta cotización?")) return;
    const provider = window.FirebaseGalleryProvider;
    try {
        await provider.deleteCotizacion(id);
        showToast("Cotización eliminada", "success");
        loadQuotes();
    } catch {
        showToast("Error al eliminar", "error");
    }
}

// ── Mensajes ─────────────────────────────────────────────────────────────────

async function loadMessages() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.listMessages) return;

    const loading = document.getElementById("msgsLoading");
    if (loading) loading.style.display = "block";

    try {
        const msgs   = await provider.listMessages();
        const list   = document.getElementById("messagesList");
        const empty  = document.getElementById("msgsEmpty");
        const stat   = document.getElementById("statMsgs");
        const unread = document.getElementById("statUnread");
        const badge  = document.getElementById("msgBadge");

        if (stat) stat.textContent = msgs.length;
        const unreadCount = msgs.filter(m => !m.read).length;
        if (unread) unread.textContent = unreadCount;
        if (badge)  { badge.textContent = unreadCount; badge.classList.toggle("hidden", unreadCount === 0); }

        if (!list) return;
        if (!msgs.length) { empty?.classList.remove("hidden"); list.innerHTML = ""; return; }
        empty?.classList.add("hidden");
        list.innerHTML = "";

        msgs.forEach(m => {
            const date = m.createdAt ? new Date(m.createdAt).toLocaleDateString("es-CO") : "—";

            const waPhone = (m.phone || "").replace(/\D/g, "");
            const waMsg   = encodeURIComponent(
                `Hola ${m.name || ""}, soy Rosy Photo Studio 📸\n` +
                `Recibí tu mensaje: "${(m.message || "").slice(0, 100)}${(m.message || "").length > 100 ? "…" : ""}"\n\n` +
                `Te respondo:`
            );
            const waLink = waPhone
                ? `https://wa.me/${waPhone.startsWith("57") ? waPhone : "57" + waPhone}?text=${waMsg}`
                : null;

            const div = document.createElement("div");
            div.className = `msg-item${!m.read ? " msg-item--unread" : ""}`;
            div.innerHTML = `
                <div class="msg-header">
                    <div class="msg-info">
                        <span class="msg-name">
                            ${m.name || "—"}
                            ${!m.read ? '<span class="msg-dot"></span>' : ""}
                        </span>
                        <span class="msg-meta">
                            <i class="fas fa-envelope" style="margin-right:.3rem;opacity:.5"></i>
                            ${m.email || "—"}
                        </span>
                        ${m.phone ? `
                        <span class="msg-meta">
                            <i class="fas fa-phone" style="margin-right:.3rem;opacity:.5"></i>
                            ${waLink
                                ? `<a href="${waLink}" target="_blank" rel="noopener"
                                      style="color:#25d366;font-weight:600;text-decoration:none;
                                             display:inline-flex;align-items:center;gap:.3rem"
                                      title="Responder por WhatsApp">
                                      ${m.phone}
                                      <i class="fab fa-whatsapp" style="font-size:.9rem"></i>
                                   </a>`
                                : m.phone}
                        </span>` : ""}
                        <span class="msg-meta">
                            <i class="fas fa-tag" style="margin-right:.3rem;opacity:.5"></i>
                            ${m.subject || "Sin asunto"}
                        </span>
                    </div>
                    <div class="msg-actions">
                        <span class="td-sub">${date}</span>
                        ${!m.read
                            ? `<button class="btn-admin btn-admin--secondary btn-admin--sm msg-read" title="Marcar como leído">
                                   <i class="fas fa-eye"></i>
                               </button>`
                            : ""}
                        <button class="btn-admin btn-admin--danger btn-admin--sm msg-del" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="msg-body">${m.message || ""}</p>
                ${waLink ? `
                <div style="padding:.65rem 0 .1rem">
                    <a href="${waLink}" target="_blank" rel="noopener"
                       style="display:inline-flex;align-items:center;gap:.5rem;
                              background:#25d366;color:#fff;border-radius:.55rem;
                              padding:.4rem .9rem;font-size:.8rem;font-weight:600;
                              text-decoration:none;transition:background .18s"
                       onmouseover="this.style.background='#16a34a'"
                       onmouseout="this.style.background='#25d366'">
                        <i class="fab fa-whatsapp"></i> Responder por WhatsApp
                    </a>
                </div>` : ""}`;

            div.querySelector(".msg-read")?.addEventListener("click", () => markRead(m.id));
            div.querySelector(".msg-del").addEventListener("click",  () => deleteMsg(m.id));
            list.appendChild(div);
        });

    } catch {
        showToast("Error al cargar mensajes", "error");
    } finally {
        if (loading) loading.style.display = "none";
    }
}

async function markRead(id) {
    const provider = window.FirebaseGalleryProvider;
    try { await provider.markMessageRead(id); loadMessages(); } catch {}
}

async function deleteMsg(id) {
    if (!confirm("¿Eliminar este mensaje?")) return;
    const provider = window.FirebaseGalleryProvider;
    try {
        await provider.deleteMessage(id);
        showToast("Mensaje eliminado", "success");
        loadMessages();
    } catch {
        showToast("Error al eliminar", "error");
    }
}

// ── Precios ───────────────────────────────────────────────────────────────────

async function loadPricing() {
    const provider = window.FirebaseGalleryProvider;
    let data = null;

    if (provider?.getPricing) {
        try { data = await provider.getPricing(); } catch {}
    }

    pricingData = data || {
        sizes:     APP_CONFIG.pricing.sizes.map(s => ({ ...s })),
        materials: APP_CONFIG.pricing.materials.map(m => ({ ...m })),
        services:  APP_CONFIG.pricing.services.map(s => ({ ...s }))
    };

    renderPricingEditors();

    if (!_pricingBound) {
        _pricingBound = true;
        document.querySelectorAll(".admin-tab[data-ptab]").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".admin-tab[data-ptab]").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                document.querySelectorAll("[id^='ptab-']").forEach(p => p.classList.remove("active"));
                document.getElementById(`ptab-${btn.dataset.ptab}`)?.classList.add("active");
            });
        });
        document.getElementById("savePricingBtn")?.addEventListener("click", savePricing);
    }
}

function renderPricingEditors() {
    if (!pricingData) return;

    // ── Tamaños ──────────────────────────────────────────────────────────
    const sizesEl = document.getElementById("sizesEditor");
    if (sizesEl) {
        sizesEl.innerHTML = pricingData.sizes.map((s, i) => `
            <div class="price-editor-row">
                <span class="price-editor-label">${s.label}</span>
                <input type="number" class="admin-input size-price-input" data-index="${i}"
                       value="${s.price}" min="0" step="500"
                       oninput="updatePricingPreview()">
            </div>`).join("");
    }

    // ── Materiales (surcharge en COP) ────────────────────────────────────
    const matEl = document.getElementById("materialsEditor");
    if (matEl) {
        matEl.innerHTML = pricingData.materials.map((m, i) => {
            // Compatibilidad: si el doc de Firestore aún tiene multiplier pero no surcharge
            const currentVal = m.surcharge != null ? m.surcharge : 0;
            return `
            <div class="price-editor-row">
                <span class="price-editor-label">${m.label}</span>
                <input type="number" class="admin-input material-surcharge-input" data-index="${i}"
                       value="${currentVal}" min="0" step="500"
                       oninput="updatePricingPreview()"
                       placeholder="0">
            </div>`;
        }).join("");
    }

    // ── Servicios ────────────────────────────────────────────────────────
    const srvEl = document.getElementById("servicesEditor");
    if (srvEl) {
        srvEl.innerHTML = pricingData.services.map((s, i) => `
            <div class="price-editor-row">
                <span class="price-editor-label">${s.label}</span>
                <input type="number" class="admin-input service-price-input" data-index="${i}"
                       value="${s.price}" min="0" step="1000"
                       oninput="updatePricingPreview()">
            </div>`).join("");
    }

    // Preview inicial
    updatePricingPreview();
}

/** Preview en vivo: muestra el precio estimado del combo más común (3×4 / papel / básico) */
window.updatePricingPreview = function() {
    const previewEl = document.getElementById("pricingPreview");
    if (!previewEl || !pricingData) return;

    // Leer valores actuales de los inputs (sin guardar aún)
    const sizes = [...pricingData.sizes];
    document.querySelectorAll(".size-price-input").forEach(inp => {
        const idx = parseInt(inp.dataset.index, 10);
        if (!isNaN(idx) && sizes[idx]) sizes[idx] = { ...sizes[idx], price: parseFloat(inp.value) || 0 };
    });

    const materials = [...pricingData.materials];
    document.querySelectorAll(".material-surcharge-input").forEach(inp => {
        const idx = parseInt(inp.dataset.index, 10);
        if (!isNaN(idx) && materials[idx]) materials[idx] = { ...materials[idx], surcharge: parseFloat(inp.value) || 0 };
    });

    const services = [...pricingData.services];
    document.querySelectorAll(".service-price-input").forEach(inp => {
        const idx = parseInt(inp.dataset.index, 10);
        if (!isNaN(idx) && services[idx]) services[idx] = { ...services[idx], price: parseFloat(inp.value) || 0 };
    });

    const fmt = n => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

    // Construir filas de la tabla preview
    const rows = sizes.map(size => {
        return materials.map(mat => {
            const base    = (size.price || 0) + (mat.surcharge || 0);
            const basico  = base;
            const retoque = base + ((services.find(s => s.id === "retoque")?.price) || 0);
            return `
            <tr>
                <td style="padding:.35rem .6rem;font-size:.78rem;color:var(--adm-text-muted)">${size.label}</td>
                <td style="padding:.35rem .6rem;font-size:.78rem;color:var(--adm-text-muted)">${mat.label}</td>
                <td style="padding:.35rem .6rem;font-size:.78rem;font-weight:700;color:#f472b6">${fmt(basico)}</td>
                <td style="padding:.35rem .6rem;font-size:.78rem;color:var(--adm-text-muted)">${fmt(retoque)}</td>
            </tr>`;
        }).join("");
    }).join("");

    previewEl.innerHTML = `
        <div style="overflow-x:auto;margin-top:.5rem">
            <table style="width:100%;border-collapse:collapse;font-size:.78rem">
                <thead>
                    <tr style="border-bottom:1px solid rgba(255,255,255,.08)">
                        <th style="padding:.35rem .6rem;text-align:left;font-size:.7rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Tamaño</th>
                        <th style="padding:.35rem .6rem;text-align:left;font-size:.7rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Material</th>
                        <th style="padding:.35rem .6rem;text-align:left;font-size:.7rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Básico</th>
                        <th style="padding:.35rem .6rem;text-align:left;font-size:.7rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">+ Retoque</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
};

async function savePricing() {
    if (!pricingData) return;

    document.querySelectorAll(".size-price-input").forEach(inp => {
        const idx = parseInt(inp.dataset.index, 10);
        const val = parseFloat(inp.value);
        if (!isNaN(idx) && !isNaN(val) && pricingData.sizes[idx]) pricingData.sizes[idx].price = val;
    });
    document.querySelectorAll(".material-surcharge-input").forEach(inp => {
        const idx = parseInt(inp.dataset.index, 10);
        const val = parseFloat(inp.value);
        if (!isNaN(idx) && !isNaN(val) && pricingData.materials[idx]) {
            pricingData.materials[idx].surcharge  = val;
            delete pricingData.materials[idx].multiplier; // limpiar campo legado
        }
    });
    document.querySelectorAll(".service-price-input").forEach(inp => {
        const idx = parseInt(inp.dataset.index, 10);
        const val = parseFloat(inp.value);
        if (!isNaN(idx) && !isNaN(val) && pricingData.services[idx]) pricingData.services[idx].price = val;
    });

    const provider = window.FirebaseGalleryProvider;
    if (!provider?.savePricing) { showToast("Firebase no disponible", "error"); return; }

    const btn = document.getElementById("savePricingBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando…'; }

    try {
        await provider.savePricing(pricingData);
        showToast("Precios guardados", "success", "Los cambios se reflejan en el cotizador");
    } catch {
        showToast("Error al guardar precios", "error");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar cambios'; }
    }
}

// ── Sobre mí ──────────────────────────────────────────────────────────────────

async function loadAboutData() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.getSobreMi) return;
    try {
        const data = await provider.getSobreMi();
        if (data) {
            const set     = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
            const setHTML = (id, val) => { const el = document.getElementById(id); if (el && val) el.innerHTML = val; };
            set("aboutAdminName", data.name);
            set("aboutAdminRole", data.role);
            setHTML("aboutAdminBio1", data.bio1);
            setHTML("aboutAdminBio2", data.bio2);
            set("aboutStatPhotos",  data.statPhotos);
            set("aboutStatYears",   data.statYears);
            set("aboutStatClients", data.statClients);
            if (data.photoUrl) {
                const img    = document.getElementById("aboutPreviewImg");
                const urlInp = document.getElementById("aboutPhotoUrl");
                if (img)    img.src      = data.photoUrl;
                if (urlInp) urlInp.value = data.photoUrl;
            }
        }
    } catch {}

    const saveBtn = document.getElementById("saveAboutAdminBtn");
    if (saveBtn && !saveBtn._bound) {
        saveBtn._bound = true;
        saveBtn.addEventListener("click", saveAboutAdmin);
    }

    const urlInp = document.getElementById("aboutPhotoUrl");
    if (urlInp && !urlInp._bound) {
        urlInp._bound = true;
        urlInp.addEventListener("input", e => {
            const img = document.getElementById("aboutPreviewImg");
            if (img && e.target.value) img.src = e.target.value;
        });
    }
}

function initPricingPhotoWidget() {
    if (!window.cloudinary) return;
    cloudPhotoWidget = window.cloudinary.createUploadWidget({
        cloudName:    APP_CONFIG.cloudinary.cloudName,
        uploadPreset: APP_CONFIG.cloudinary.uploadPreset,
        maxFiles: 1,
        sources: ["local", "url", "camera"],
        cropping: true,
        croppingAspectRatio: 0.75
    }, (error, result) => {
        if (error || result?.event !== "success") return;
        const url    = result.info.secure_url;
        const img    = document.getElementById("aboutPreviewImg");
        const urlInp = document.getElementById("aboutPhotoUrl");
        if (img)    img.src      = url;
        if (urlInp) urlInp.value = url;
    });
    document.getElementById("changeAboutPhotoBtn")?.addEventListener("click", () => cloudPhotoWidget?.open());
}

async function saveAboutAdmin() {
    const provider = window.FirebaseGalleryProvider;
    if (!provider?.saveSobreMi) { showToast("Firebase no configurado", "error"); return; }

    const data = {
        name:        document.getElementById("aboutAdminName")?.value       || "",
        role:        document.getElementById("aboutAdminRole")?.value       || "",
        bio1:        document.getElementById("aboutAdminBio1")?.innerHTML   || "",
        bio2:        document.getElementById("aboutAdminBio2")?.innerHTML   || "",
        statPhotos:  document.getElementById("aboutStatPhotos")?.value      || "",
        statYears:   document.getElementById("aboutStatYears")?.value       || "",
        statClients: document.getElementById("aboutStatClients")?.value     || "",
        photoUrl:    document.getElementById("aboutPhotoUrl")?.value
                  || document.getElementById("aboutPreviewImg")?.src        || ""
    };

    const btn = document.getElementById("saveAboutAdminBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando…'; }

    try {
        await provider.saveSobreMi(data);
        showToast("Página guardada", "success", "Los cambios se ven en «Sobre mí»");
    } catch {
        showToast("Error al guardar", "error");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar'; }
    }
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function showToast(title, type = "success", subtitle = "") {
    const toast    = document.getElementById("adminToast");
    const titleEl  = document.getElementById("toastTitle");
    const msgEl    = document.getElementById("toastMsg");
    const iconEl   = document.getElementById("toastIcon");
    const wrapEl   = document.getElementById("toastIconWrap");
    const progress = document.getElementById("toastProgress");
    if (!toast) return;

    const config = {
        success: { icon: "fas fa-check-circle",       bg: "rgba(74,222,128,.18)",  color: "#4ade80" },
        error:   { icon: "fas fa-times-circle",        bg: "rgba(248,113,113,.18)", color: "#f87171" },
        warn:    { icon: "fas fa-exclamation-triangle", bg: "rgba(251,191,36,.18)", color: "#fbbf24" },
        info:    { icon: "fas fa-info-circle",         bg: "rgba(96,165,250,.18)",  color: "#60a5fa" },
    };
    const cfg = config[type] || config.success;

    toast.className = `show ${type}`;
    if (titleEl)  titleEl.textContent = title;
    if (msgEl)  { msgEl.textContent   = subtitle; msgEl.style.display = subtitle ? "block" : "none"; }
    if (iconEl)   iconEl.className    = cfg.icon;
    if (wrapEl)  { wrapEl.style.background = cfg.bg; wrapEl.style.color = cfg.color; }

    if (progress) {
        progress.style.background = cfg.color;
        progress.style.transition = "none";
        progress.style.transform  = "scaleX(1)";
        void progress.offsetWidth;
        progress.style.transition = "transform 3.2s linear";
        progress.style.transform  = "scaleX(0)";
    }

    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 3200);
}
