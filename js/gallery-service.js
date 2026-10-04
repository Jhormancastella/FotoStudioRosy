/**
 * gallery-service.js — Capa de acceso a datos de la galería
 * Soporta Firebase Firestore como fuente primaria y Cloudinary como fallback.
 */

function toOptimizedUrl(url) {
    if (typeof url !== "string") return "";
    if (!url.includes("/image/upload/")) return url;
    
    // Don't add transformations if they already exist
    if (url.includes("/image/upload/f_auto")) return url;
    
    return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

function mapCloudinaryResource(resource) {
    const publicId = resource.public_id || "";
    return {
        id:        publicId,
        publicId,
        name:      publicId.split("/").pop() || "Imagen",
        src:       toOptimizedUrl(resource.secure_url || ""),
        category:  "todos",
        createdAt: resource.created_at || ""
    };
}

function getFirebaseProvider(providerGlobal) {
    return window[providerGlobal];
}

export function createGalleryService(config) {

    // ── Cloudinary list API ────────────────────────────────────────────────
    async function listFromCloudinary() {
        const tag     = encodeURIComponent(config.cloudinary.listTag);
        const listUrl = `https://res.cloudinary.com/${config.cloudinary.cloudName}/image/list/${tag}.json?cb=${Date.now()}`;
        const response = await fetch(listUrl, { cache: "no-store" });

        if (!response.ok) {
            const cloudinaryError = response.headers.get("X-Cld-Error") || "";
            if (response.status === 404 && cloudinaryError.toLowerCase().includes("no resources found")) return [];
            throw new Error(cloudinaryError || `HTTP_${response.status}`);
        }

        const payload   = await response.json();
        const resources = Array.isArray(payload.resources) ? payload.resources : [];
        return resources.map(mapCloudinaryResource).filter(r => Boolean(r.src));
    }

    // ── Firebase list with fallback to Cloudinary ──────────────────────────
    async function listFromFirebase(categoryId) {
        const provider = getFirebaseProvider(config.firebase.providerGlobal);
        if (!provider || typeof provider.listImages !== "function") {
            throw new Error("FIREBASE_PROVIDER_MISSING");
        }
        const images = await provider.listImages(categoryId);
        
        // If Firebase is empty, try Cloudinary as fallback
        if (Array.isArray(images) && images.length === 0) {
            try {
                return await listFromCloudinary();
            } catch {
                return [];
            }
        }
        
        return Array.isArray(images) ? images : [];
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    function createImageRecordFromUpload(uploadInfo) {
        const publicId = uploadInfo.public_id || `img-${Date.now()}`;
        return {
            id:        publicId,
            publicId,
            name:      uploadInfo.name || uploadInfo.original_filename || "Imagen",
            src:       toOptimizedUrl(uploadInfo.secure_url || ""),
            category:  uploadInfo.category || "todos",
            createdAt: uploadInfo.created_at || new Date().toISOString()
        };
    }

    // ── API pública ────────────────────────────────────────────────────────

    async function listImages(categoryId) {
        return config.dataSource === "firebase"
            ? listFromFirebase(categoryId)
            : listFromCloudinary();
    }

    async function saveUploadedImage(uploadInfo) {
        const imageRecord = createImageRecordFromUpload(uploadInfo);

        if (config.dataSource === "firebase") {
            const provider = getFirebaseProvider(config.firebase.providerGlobal);
            if (!provider || typeof provider.saveImage !== "function") {
                throw new Error("FIREBASE_PROVIDER_MISSING");
            }
            const saved = await provider.saveImage(imageRecord);
            return saved || imageRecord;
        }
        return imageRecord;
    }

    async function saveExternalImage(url, category = "todos") {
        const imageRecord = {
            id:        `url-${Date.now()}`,
            publicId:  "",
            name:      "Imagen URL",
            src:       url,
            category,
            createdAt: new Date().toISOString()
        };

        if (config.dataSource === "firebase") {
            const provider = getFirebaseProvider(config.firebase.providerGlobal);
            if (!provider || typeof provider.saveImage !== "function") {
                throw new Error("FIREBASE_PROVIDER_MISSING");
            }
            const saved = await provider.saveImage(imageRecord);
            return saved || imageRecord;
        }
        return imageRecord;
    }

    async function deleteImage(image) {
        if (config.dataSource !== "firebase") return false;

        const provider = getFirebaseProvider(config.firebase.providerGlobal);
        if (!provider) return false;

        const docId    = image?.id || "";
        const publicId = image?.publicId || "";
        if (!docId) return false;

        if (typeof provider.deleteImageEverywhere === "function") {
            await provider.deleteImageEverywhere({ docId, publicId });
            return true;
        }

        if (!publicId && typeof provider.deleteImage === "function") {
            await provider.deleteImage(docId);
            return true;
        }

        return false;
    }

    async function updateImageCategory(image, newCategory) {
        if (config.dataSource !== "firebase") return false;
        const provider = getFirebaseProvider(config.firebase.providerGlobal);
        if (!provider || typeof provider.updateImageCategory !== "function") return false;
        await provider.updateImageCategory(image.id, newCategory);
        return true;
    }

    return { listImages, saveUploadedImage, saveExternalImage, deleteImage, updateImageCategory };
}
