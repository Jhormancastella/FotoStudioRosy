function toOptimizedUrl(url) {
    if (typeof url !== "string") return "";
    if (!url.includes("/image/upload/")) return url;
    return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

function mapCloudinaryResource(resource) {
    const publicId = resource.public_id || "";
    return {
        id: publicId,
        publicId,
        name: publicId.split("/").pop() || "Imagen",
        src: toOptimizedUrl(resource.secure_url || ""),
        createdAt: resource.created_at || ""
    };
}

function getFirebaseProvider(providerGlobal) {
    return window[providerGlobal];
}

export function createGalleryService(config) {
    async function listFromCloudinary() {
        const tag = encodeURIComponent(config.cloudinary.listTag);
        const listUrl = `https://res.cloudinary.com/${config.cloudinary.cloudName}/image/list/${tag}.json?cb=${Date.now()}`;
        const response = await fetch(listUrl, { cache: "no-store" });

        if (!response.ok) {
            const cloudinaryError = response.headers.get("X-Cld-Error") || "";
            if (response.status === 404 && cloudinaryError.toLowerCase().includes("no resources found")) {
                return [];
            }
            throw new Error(cloudinaryError || `HTTP_${response.status}`);
        }

        const payload = await response.json();
        const resources = Array.isArray(payload.resources) ? payload.resources : [];
        return resources.map(mapCloudinaryResource).filter((resource) => Boolean(resource.src));
    }

    async function listFromFirebase() {
        const provider = getFirebaseProvider(config.firebase.providerGlobal);
        if (!provider || typeof provider.listImages !== "function") {
            throw new Error("FIREBASE_PROVIDER_MISSING");
        }

        const images = await provider.listImages();
        return Array.isArray(images) ? images : [];
    }

    function createImageRecordFromUpload(uploadInfo) {
        const publicId = uploadInfo.public_id || `img-${Date.now()}`;
        return {
            id: publicId,
            publicId,
            name: uploadInfo.original_filename || "Imagen",
            src: toOptimizedUrl(uploadInfo.secure_url || ""),
            createdAt: uploadInfo.created_at || new Date().toISOString()
        };
    }

    async function saveUploadedImage(uploadInfo) {
        const imageRecord = createImageRecordFromUpload(uploadInfo);

        if (config.dataSource === "firebase") {
            const provider = getFirebaseProvider(config.firebase.providerGlobal);
            if (!provider || typeof provider.saveImage !== "function") {
                throw new Error("FIREBASE_PROVIDER_MISSING");
            }
            const savedRecord = await provider.saveImage(imageRecord);
            if (savedRecord) return savedRecord;
        }

        return imageRecord;
    }

    async function saveExternalImage(url) {
        const imageRecord = {
            id: `url-${Date.now()}`,
            publicId: "",
            name: "Imagen URL",
            src: url,
            createdAt: new Date().toISOString()
        };

        if (config.dataSource === "firebase") {
            const provider = getFirebaseProvider(config.firebase.providerGlobal);
            if (!provider || typeof provider.saveImage !== "function") {
                throw new Error("FIREBASE_PROVIDER_MISSING");
            }
            const savedRecord = await provider.saveImage(imageRecord);
            if (savedRecord) return savedRecord;
        }

        return imageRecord;
    }

    async function deleteImage(image) {
        if (config.dataSource !== "firebase") return false;

        const provider = getFirebaseProvider(config.firebase.providerGlobal);
        if (!provider) {
            return false;
        }

        const docId = image?.id || "";
        const publicId = image?.publicId || "";
        if (!docId) return false;

        if (typeof provider.deleteImageEverywhere === "function") {
            await provider.deleteImageEverywhere({ docId, publicId });
            return true;
        }

        // Fallback only for external URLs that do not have a Cloudinary publicId.
        if (!publicId && typeof provider.deleteImage === "function") {
            await provider.deleteImage(docId);
            return true;
        }

        return false;
    }

    return {
        listImages: async () => (config.dataSource === "firebase" ? listFromFirebase() : listFromCloudinary()),
        saveUploadedImage,
        saveExternalImage,
        deleteImage
    };
}
