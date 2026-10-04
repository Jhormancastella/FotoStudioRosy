const STORAGE_KEY    = "language";
const DEFAULT_LANG   = "es";

const T = {
    es: {
        // ── Controles globales ──────────────────────────────────────
        "controls.languageLabel":  "Idioma",
        "controls.spanish":        "Español",
        "controls.english":        "English",
        "controls.themeToDark":    "Tema oscuro",
        "controls.themeToLight":   "Tema claro",
        // ── Navegación ──────────────────────────────────────────────
        "nav.home":       "Inicio",
        "nav.catalog":    "Catálogo",
        "nav.services":   "Servicios",
        "nav.about":      "Sobre mí",
        "nav.contact":    "Contáctanos",
        "nav.quote":      "Cotizar",
        "nav.admin":      "Admin",
        // ── Header ──────────────────────────────────────────────────
        "header.tagline": "Capturando momentos especiales para toda la vida",
        // ── Admin ───────────────────────────────────────────────────
        "admin.logout":   "Cerrar Sesión",
        "admin.status":   "Modo Admin",
        "admin.panel":    "Panel de Administración",
        // ── Login ───────────────────────────────────────────────────
        "login.title":             "Acceso de Administrador",
        "login.description":       "Ingresa correo y contraseña:",
        "login.emailPlaceholder":  "Correo administrador",
        "login.passwordPlaceholder":"Contraseña",
        "login.submit":            "Ingresar",
        // ── Auth ────────────────────────────────────────────────────
        "auth.required":       "Inicia sesión como administrador",
        "auth.unavailable":    "No fue posible validar el acceso.",
        "auth.badCredentials": "Credenciales inválidas.",
        "auth.emailRequired":  "Debes ingresar el correo de administrador.",
        "auth.logoutError":    "No se pudo cerrar sesión correctamente.",
        // ── Subir imágenes ──────────────────────────────────────────
        "upload.title":          "Subir Nueva Imagen",
        "upload.deviceTitle":    "Subir desde dispositivo",
        "upload.deviceButton":   "Abrir Cloudinary",
        "upload.urlTitle":       "Usar enlace de imagen",
        "upload.urlButton":      "Usar URL",
        "upload.urlDescription": "Ingresa la URL de una imagen en internet",
        "upload.urlPlaceholder": "https://ejemplo.com/imagen.jpg",
        "upload.addImage":       "Agregar Imagen",
        "upload.urlEmpty":       "URL vacía",
        "upload.urlInvalid":     "URL inválida",
        "upload.urlLoadError":   "No se pudo cargar la imagen",
        "upload.added":          "Imagen agregada correctamente",
        "upload.category":       "Categoría",
        // ── Galería ─────────────────────────────────────────────────
        "gallery.title":         "Galería de Imágenes",
        "gallery.amountLabel":   "Imágenes a mostrar:",
        "gallery.optionAll":     "Todas",
        "gallery.loading":       "Cargando imágenes...",
        "gallery.empty":         "No hay imágenes en esta categoría.",
        "gallery.loadError":     "No se pudieron cargar las imágenes.",
        "gallery.loadRestricted":"Listado bloqueado por Cloudinary.",
        "gallery.delete":        "Eliminar",
        "gallery.deleteError":   "No se pudo eliminar la imagen.",
        "gallery.deleteUnavailable":"La eliminación requiere backend.",
        // ── Paginación ───────────────────────────────────────────────
        "pagination.info": "Página {page} de {totalPages} — {totalImages} imágenes",
        // ── Catálogo ─────────────────────────────────────────────────
        "catalog.title":       "Catálogo",
        "catalog.subtitle":    "Explora nuestros trabajos por categoría",
        "catalog.allFilter":   "Todos",
        // ── Servicios ────────────────────────────────────────────────
        "services.title":      "Nuestros Servicios",
        "services.subtitle":   "Transformamos tus recuerdos con amor y precisión",
        "comparator.title":    "Comparador Antes / Después",
        "comparator.instructions.slide":  "Desliza para comparar",
        "comparator.instructions.drag":   "Arrastra con precisión",
        "comparator.instructions.mobile": "Compatible táctil",
        "restoration.title":       "Restauración de Fotos",
        "restoration.description": "Devolvemos a la vida fotografías antiguas y dañadas, reparando desgarros, manchas y deterioro mientras preservamos la esencia original.",
        "restoration.before":      "Foto dañada",
        "restoration.after":       "Restaurada",
        "colorization.title":       "Colorización",
        "colorization.description": "Añadimos color natural a fotografías en blanco y negro respetando la iluminación y los detalles históricos para un resultado vibrante.",
        "colorization.before":      "B&N original",
        "colorization.after":       "Con color",
        // ── Sobre mí ─────────────────────────────────────────────────
        "about.title":     "Sobre mí",
        "about.subtitle":  "Conoce la historia detrás del lente",
        "about.edit":      "Editar contenido",
        "about.save":      "Guardar cambios",
        "about.saved":     "Cambios guardados",
        // ── Contacto ─────────────────────────────────────────────────
        "contact.title":       "Contáctanos",
        "contact.subtitle":    "Estamos aquí para ayudarte",
        "contact.name":        "Nombre completo",
        "contact.email":       "Correo electrónico",
        "contact.phone":       "Teléfono (opcional)",
        "contact.subject":     "Asunto",
        "contact.message":     "Mensaje",
        "contact.send":        "Enviar mensaje",
        "contact.sending":     "Enviando...",
        "contact.sent":        "¡Mensaje enviado! Te contactaremos pronto.",
        "contact.error":       "Error al enviar. Intenta de nuevo.",
        "contact.location":    "Nuestra ubicación",
        "contact.schedule":    "Horario de atención",
        "contact.scheduleVal": "Lun – Vie: 8am – 6pm | Sáb: 9am – 2pm",
        // ── Cotizador ────────────────────────────────────────────────
        "quote.title":        "Cotizador",
        "quote.subtitle":     "Calcula el precio de tu pedido",
        "quote.service":      "Servicio",
        "quote.size":         "Tamaño",
        "quote.material":     "Material",
        "quote.quantity":     "Cantidad",
        "quote.total":        "Total estimado",
        "quote.send":         "Solicitar cotización",
        "quote.sending":      "Enviando...",
        "quote.sent":         "¡Cotización enviada! Te contactaremos pronto.",
        "quote.error":        "Error al enviar. Intenta de nuevo.",
        "quote.namePlaceholder":  "Tu nombre",
        "quote.emailPlaceholder": "Tu correo",
        "quote.phonePlaceholder": "Tu teléfono",
        "quote.notesPlaceholder": "Detalles adicionales o referencias…",
        "quote.notes":            "Notas adicionales",
        "quote.yourInfo":         "Tus datos de contacto",
        // ── Social ────────────────────────────────────────────────────
        "social.title":   "Síguenos en redes",
        "social.whatsapp":"WhatsApp",
        "social.facebook":"Facebook",
        "social.instagram":"Instagram",
        // ── Footer ────────────────────────────────────────────────────
        "footer.rights":  "© 2025 Todos los derechos reservados — ",
        "footer.caption": "Rosy Photo Studio · Capturando momentos especiales",
        // ── Firebase / Cloudinary ─────────────────────────────────────
        "cloudinary.unavailable":  "Cloudinary no está disponible.",
        "cloudinary.openError":    "Error al abrir Cloudinary.",
        "firebase.notConfigured":  "Firebase no está configurado."
    },
    en: {
        "controls.languageLabel":  "Language",
        "controls.spanish":        "Spanish",
        "controls.english":        "English",
        "controls.themeToDark":    "Dark theme",
        "controls.themeToLight":   "Light theme",
        "nav.home":       "Home",
        "nav.catalog":    "Catalog",
        "nav.services":   "Services",
        "nav.about":      "About me",
        "nav.contact":    "Contact us",
        "nav.quote":      "Get a Quote",
        "nav.admin":      "Admin",
        "header.tagline": "Capturing special moments for a lifetime",
        "admin.logout":   "Sign out",
        "admin.status":   "Admin Mode",
        "admin.panel":    "Administration Panel",
        "login.title":             "Administrator Access",
        "login.description":       "Enter email and password:",
        "login.emailPlaceholder":  "Admin email",
        "login.passwordPlaceholder":"Password",
        "login.submit":            "Sign in",
        "auth.required":       "Please sign in as administrator",
        "auth.unavailable":    "Could not validate access.",
        "auth.badCredentials": "Invalid credentials.",
        "auth.emailRequired":  "You must enter the administrator email.",
        "auth.logoutError":    "Could not complete sign out.",
        "upload.title":          "Upload New Image",
        "upload.deviceTitle":    "Upload from device",
        "upload.deviceButton":   "Open Cloudinary",
        "upload.urlTitle":       "Use image link",
        "upload.urlButton":      "Use URL",
        "upload.urlDescription": "Enter an image URL from the internet",
        "upload.urlPlaceholder": "https://example.com/image.jpg",
        "upload.addImage":       "Add Image",
        "upload.urlEmpty":       "URL is empty",
        "upload.urlInvalid":     "Invalid URL",
        "upload.urlLoadError":   "Could not load image",
        "upload.added":          "Image added successfully",
        "upload.category":       "Category",
        "gallery.title":         "Image Gallery",
        "gallery.amountLabel":   "Images to show:",
        "gallery.optionAll":     "All",
        "gallery.loading":       "Loading images...",
        "gallery.empty":         "No images in this category.",
        "gallery.loadError":     "Could not load gallery images.",
        "gallery.loadRestricted":"Cloudinary blocked public listing.",
        "gallery.delete":        "Delete",
        "gallery.deleteError":   "Could not delete the image.",
        "gallery.deleteUnavailable":"Deletion requires backend support.",
        "pagination.info": "Page {page} of {totalPages} — {totalImages} images",
        "catalog.title":       "Catalog",
        "catalog.subtitle":    "Browse our work by category",
        "catalog.allFilter":   "All",
        "services.title":      "Our Services",
        "services.subtitle":   "We transform your memories with love and precision",
        "comparator.title":    "Before / After Comparator",
        "comparator.instructions.slide":  "Slide to compare",
        "comparator.instructions.drag":   "Click and drag for precision",
        "comparator.instructions.mobile": "Touch compatible",
        "restoration.title":       "Photo Restoration",
        "restoration.description": "We bring old and damaged photos back to life, repairing tears, stains and deterioration while preserving the original essence.",
        "restoration.before":      "Damaged photo",
        "restoration.after":       "Restored",
        "colorization.title":       "Colorization",
        "colorization.description": "We add natural color to black-and-white photos respecting the original lighting and historical details for a vibrant result.",
        "colorization.before":      "Original B&W",
        "colorization.after":       "With color",
        "about.title":     "About me",
        "about.subtitle":  "The story behind the lens",
        "about.edit":      "Edit content",
        "about.save":      "Save changes",
        "about.saved":     "Changes saved",
        "contact.title":       "Contact us",
        "contact.subtitle":    "We're here to help you",
        "contact.name":        "Full name",
        "contact.email":       "Email address",
        "contact.phone":       "Phone (optional)",
        "contact.subject":     "Subject",
        "contact.message":     "Message",
        "contact.send":        "Send message",
        "contact.sending":     "Sending...",
        "contact.sent":        "Message sent! We'll contact you soon.",
        "contact.error":       "Error sending. Please try again.",
        "contact.location":    "Our location",
        "contact.schedule":    "Business hours",
        "contact.scheduleVal": "Mon – Fri: 8am – 6pm | Sat: 9am – 2pm",
        "quote.title":        "Quote Calculator",
        "quote.subtitle":     "Calculate the price of your order",
        "quote.service":      "Service",
        "quote.size":         "Size",
        "quote.material":     "Material",
        "quote.quantity":     "Quantity",
        "quote.total":        "Estimated total",
        "quote.send":         "Request quote",
        "quote.sending":      "Sending...",
        "quote.sent":         "Quote sent! We'll contact you soon.",
        "quote.error":        "Error sending. Please try again.",
        "quote.namePlaceholder":  "Your name",
        "quote.emailPlaceholder": "Your email",
        "quote.phonePlaceholder": "Your phone",
        "quote.notesPlaceholder": "Additional details or references…",
        "quote.notes":            "Additional notes",
        "quote.yourInfo":         "Your contact info",
        "social.title":   "Follow us",
        "social.whatsapp":"WhatsApp",
        "social.facebook":"Facebook",
        "social.instagram":"Instagram",
        "footer.rights":  "© 2025 All rights reserved — ",
        "footer.caption": "Rosy Photo Studio · Capturing special moments",
        "cloudinary.unavailable":  "Cloudinary is not available.",
        "cloudinary.openError":    "Error opening Cloudinary.",
        "firebase.notConfigured":  "Firebase is not configured."
    }
};

let currentLang = DEFAULT_LANG;

function interpolate(tpl, params) {
    return tpl.replace(/{([^}]+)}/g, (m, k) => params[k] ?? m);
}

export function getInitialLanguage(fallback = DEFAULT_LANG) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && T[saved]) return saved;
    return T[fallback] ? fallback : DEFAULT_LANG;
}

export function setLanguage(lang) {
    currentLang = T[lang] ? lang : DEFAULT_LANG;
    localStorage.setItem(STORAGE_KEY, currentLang);
    document.documentElement.lang = currentLang;
}

export function t(key, params = {}) {
    const dict = T[currentLang] || T[DEFAULT_LANG];
    const val  = dict[key] ?? T[DEFAULT_LANG][key] ?? key;
    return interpolate(val, params);
}

export function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.getAttribute("data-i18n"));
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    root.querySelectorAll("[data-i18n-title]").forEach(el => {
        el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
}
