const STORAGE_KEY = "language";
const DEFAULT_LANGUAGE = "es";

const TRANSLATIONS = {
    es: {
        "header.tagline": "Capturando momentos especiales para toda la vida",
        "controls.languageLabel": "Idioma",
        "controls.spanish": "Español",
        "controls.english": "English",
        "controls.themeToDark": "Tema oscuro",
        "controls.themeToLight": "Tema claro",
        "admin.logout": "Cerrar Sesión",
        "admin.status": "Modo Administrador",
        "upload.title": "Subir Nueva Imagen",
        "upload.deviceTitle": "Subir desde tu dispositivo",
        "upload.deviceButton": "Abrir Cloudinary",
        "upload.urlTitle": "Usar enlace de imagen",
        "upload.urlButton": "Usar URL",
        "upload.urlDescription": "Ingresa la URL de una imagen en internet",
        "upload.urlPlaceholder": "https://ejemplo.com/imagen.jpg",
        "upload.addImage": "Agregar Imagen",
        "upload.urlEmpty": "URL vacía",
        "upload.urlInvalid": "URL inválida",
        "upload.urlLoadError": "No se pudo cargar la imagen",
        "upload.added": "Imagen agregada correctamente",
        "gallery.title": "Galería de Imágenes",
        "gallery.amountLabel": "Imágenes a mostrar:",
        "gallery.optionAll": "Todas",
        "gallery.empty": "No hay imágenes en la galería.",
        "gallery.loadError": "No se pudieron cargar las imágenes.",
        "gallery.loadRestricted": "Cloudinary bloqueó la lista pública de imágenes. Revisa Security > Restricted image types > Resource list.",
        "gallery.delete": "Eliminar",
        "gallery.deleteUnavailable": "La eliminación segura requiere backend. Abriendo la consola de Cloudinary.",
        "pagination.info": "Página {page} de {totalPages} - {totalImages} imágenes en total",
        "comparator.title": "Comparador de Imágenes",
        "comparator.instructions.slide": "Desliza horizontalmente para comparar",
        "comparator.instructions.drag": "Haz clic y arrastra para un control preciso",
        "comparator.instructions.mobile": "Funciona en dispositivos táctiles también",
        "restoration.title": "Restauración",
        "restoration.description": "Nuestro proceso de restauración devuelve a la vida fotografías antiguas y dañadas, reparando desgarros, manchas y otros daños mientras preservamos la esencia original de la imagen.",
        "restoration.before": "Antes de la restauración",
        "restoration.after": "Después de la restauración",
        "colorization.title": "Colorización",
        "colorization.description": "Añadimos color a tus fotografías en blanco y negro utilizando técnicas avanzadas que respetan la iluminación original y los detalles históricos para un resultado natural y vibrante.",
        "colorization.before": "Blanco y negro original",
        "colorization.after": "Con colorización",
        "social.title": "Síguenos en nuestras redes",
        "footer.rights": "© 2025 Todos los derechos reservados – ",
        "footer.caption": "Rosy Photo Studio - Capturando momentos especiales",
        "login.title": "Acceso de Administrador",
        "login.description": "Ingresa correo y contraseña para acceder al modo administrador:",
        "login.emailPlaceholder": "Correo administrador",
        "login.passwordPlaceholder": "Contraseña",
        "login.submit": "Ingresar",
        "auth.required": "Inicia sesión como administrador",
        "auth.unavailable": "No fue posible validar el acceso de administrador.",
        "auth.badCredentials": "Credenciales inválidas.",
        "auth.emailRequired": "Debes ingresar el correo de administrador.",
        "auth.logoutError": "No se pudo cerrar sesión correctamente.",
        "cloudinary.unavailable": "Cloudinary no está disponible en este momento.",
        "cloudinary.openError": "Ocurrió un error al abrir Cloudinary.",
        "firebase.notConfigured": "Proveedor de Firebase no configurado todavía."
    },
    en: {
        "header.tagline": "Capturing special moments for a lifetime",
        "controls.languageLabel": "Language",
        "controls.spanish": "Spanish",
        "controls.english": "English",
        "controls.themeToDark": "Dark theme",
        "controls.themeToLight": "Light theme",
        "admin.logout": "Sign out",
        "admin.status": "Admin Mode",
        "upload.title": "Upload New Image",
        "upload.deviceTitle": "Upload from your device",
        "upload.deviceButton": "Open Cloudinary",
        "upload.urlTitle": "Use image link",
        "upload.urlButton": "Use URL",
        "upload.urlDescription": "Enter an image URL from the internet",
        "upload.urlPlaceholder": "https://example.com/image.jpg",
        "upload.addImage": "Add Image",
        "upload.urlEmpty": "URL is empty",
        "upload.urlInvalid": "Invalid URL",
        "upload.urlLoadError": "Could not load the image",
        "upload.added": "Image added successfully",
        "gallery.title": "Image Gallery",
        "gallery.amountLabel": "Images to show:",
        "gallery.optionAll": "All",
        "gallery.empty": "No images available in the gallery.",
        "gallery.loadError": "Could not load gallery images.",
        "gallery.loadRestricted": "Cloudinary blocked public listing. Check Security > Restricted image types > Resource list.",
        "gallery.delete": "Delete",
        "gallery.deleteUnavailable": "Secure deletion needs backend support. Opening Cloudinary console.",
        "pagination.info": "Page {page} of {totalPages} - {totalImages} images total",
        "comparator.title": "Image Comparator",
        "comparator.instructions.slide": "Slide horizontally to compare",
        "comparator.instructions.drag": "Click and drag for precise control",
        "comparator.instructions.mobile": "Works on touch devices too",
        "restoration.title": "Restoration",
        "restoration.description": "Our restoration process brings old and damaged photos back to life by repairing tears, stains and other defects while preserving the original essence.",
        "restoration.before": "Before restoration",
        "restoration.after": "After restoration",
        "colorization.title": "Colorization",
        "colorization.description": "We add color to your black-and-white photos using advanced techniques that respect original lighting and historical details for a natural, vibrant result.",
        "colorization.before": "Original black and white",
        "colorization.after": "With colorization",
        "social.title": "Follow us on social media",
        "footer.rights": "© 2025 All rights reserved – ",
        "footer.caption": "Rosy Photo Studio - Capturing special moments",
        "login.title": "Administrator Access",
        "login.description": "Enter email and password to access admin mode:",
        "login.emailPlaceholder": "Admin email",
        "login.passwordPlaceholder": "Password",
        "login.submit": "Sign in",
        "auth.required": "Please sign in as administrator",
        "auth.unavailable": "Could not validate administrator access.",
        "auth.badCredentials": "Invalid credentials.",
        "auth.emailRequired": "You must enter the administrator email.",
        "auth.logoutError": "Could not complete sign out.",
        "cloudinary.unavailable": "Cloudinary is not available right now.",
        "cloudinary.openError": "An error occurred while opening Cloudinary.",
        "firebase.notConfigured": "Firebase provider is not configured yet."
    }
};

let currentLanguage = DEFAULT_LANGUAGE;

function interpolate(template, params) {
    return template.replace(/{([^}]+)}/g, (match, key) => (params[key] ?? match));
}

export function getInitialLanguage(fallback = DEFAULT_LANGUAGE) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TRANSLATIONS[saved]) return saved;
    return TRANSLATIONS[fallback] ? fallback : DEFAULT_LANGUAGE;
}

export function setLanguage(language) {
    currentLanguage = TRANSLATIONS[language] ? language : DEFAULT_LANGUAGE;
    localStorage.setItem(STORAGE_KEY, currentLanguage);
    document.documentElement.lang = currentLanguage;
}

export function t(key, params = {}) {
    const dictionary = TRANSLATIONS[currentLanguage] || TRANSLATIONS[DEFAULT_LANGUAGE];
    const fallbackDictionary = TRANSLATIONS[DEFAULT_LANGUAGE];
    const value = dictionary[key] ?? fallbackDictionary[key] ?? key;
    return interpolate(value, params);
}

export function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((node) => {
        const key = node.getAttribute("data-i18n");
        node.textContent = t(key);
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
        const key = node.getAttribute("data-i18n-placeholder");
        node.setAttribute("placeholder", t(key));
    });
}
