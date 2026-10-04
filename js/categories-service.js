/**
 * categories-service.js
 *
 * Fuente única de verdad para las categorías del catálogo.
 *
 * Comportamiento:
 *  1. Intenta cargar categorías desde Firestore (colección "categories")
 *  2. Hace merge con las predeterminadas: si Firestore devuelve items,
 *     los usa; si no, usa las predeterminadas de APP_CONFIG.
 *  3. "Todos" siempre está al inicio.
 *  4. El resultado se cachea en memoria para evitar lecturas repetidas.
 *
 * Uso:
 *   import { getCategorias } from "./categories-service.js";
 *   const cats = await getCategorias();
 *   // cats = [{ id, label, icon }, ...]
 */

import { APP_CONFIG } from "./config.js";

// Categorías predeterminadas — fallback si Firestore está vacío
const DEFAULT_CATEGORIAS = [
    { id: "todos",        label: "Todos",        icon: "fas fa-th"              },
    { id: "restauracion", label: "Restauración", icon: "fas fa-magic"           },
    { id: "colorizacion", label: "Colorización", icon: "fas fa-palette"         },
    { id: "retratos",     label: "Retratos",     icon: "fas fa-user"            },
    { id: "bebes",        label: "Bebés",        icon: "fas fa-baby"            },
    { id: "embarazo",     label: "Embarazo",     icon: "fas fa-heart"           },
    { id: "grados",       label: "Grados",       icon: "fas fa-graduation-cap"  },
    { id: "eventos",      label: "Eventos",      icon: "fas fa-camera"          },
];

let _cache = null;   // se rellena en la primera llamada

/**
 * Devuelve la lista completa de categorías.
 * @param {boolean} forceReload  - Si true, ignora el cache y vuelve a leer Firestore.
 * @returns {Promise<Array<{id:string, label:string, icon:string}>>}
 */
export async function getCategorias(forceReload = false) {
    if (_cache && !forceReload) return _cache;

    const provider = window.FirebaseGalleryProvider;

    if (!provider?.listCategories) {
        // Firebase no disponible — usar predeterminadas
        _cache = DEFAULT_CATEGORIAS;
        return _cache;
    }

    try {
        const fromFirestore = await provider.listCategories();

        if (fromFirestore && fromFirestore.length > 0) {
            // Normalizar: asegurarse de que cada item tenga icon
            const normalized = fromFirestore.map(c => ({
                id:    c.id,
                label: c.label || c.id,
                icon:  c.icon  || "fas fa-tag"
            }));

            // Siempre garantizar "Todos" al inicio
            const hasTodos = normalized.some(c => c.id === "todos");
            _cache = hasTodos
                ? normalized
                : [{ id: "todos", label: "Todos", icon: "fas fa-th" }, ...normalized];
        } else {
            // Firestore vacío → usar predeterminadas
            _cache = DEFAULT_CATEGORIAS;
        }
    } catch {
        // Error de red/permisos → usar predeterminadas
        _cache = DEFAULT_CATEGORIAS;
    }

    return _cache;
}

/**
 * Invalida el cache para que la próxima llamada a getCategorias()
 * vuelva a leer desde Firestore. Llamar después de crear/eliminar una categoría.
 */
export function invalidateCategoriesCache() {
    _cache = null;
}
