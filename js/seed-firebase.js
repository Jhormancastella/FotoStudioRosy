/**
 * seed-firebase.js — Inicializa Firebase con datos de ejemplo si está vacío
 * Este archivo carga datos desde Cloudinary y los guarda en Firebase para demostración
 */

export async function seedFirebaseIfEmpty() {
    try {
        // Esperar a que Firebase esté listo
        const provider = window.FirebaseGalleryProvider;
        if (!provider || typeof provider.listImages !== "function") {
            console.log("Firebase provider not ready yet");
            return;
        }

        // Verificar si ya hay imágenes
        const existing = await provider.listImages();
        if (Array.isArray(existing) && existing.length > 0) {
            console.log(`Firebase already has ${existing.length} images, skipping seed`);
            return;
        }

        console.log("Firebase is empty, seeding with sample images from Cloudinary...");

        // Datos de ejemplo desde las imágenes que ya están en Cloudinary
        const sampleImages = [
            {
                name: "Foto restaurada - Familia",
                src: "https://res.cloudinary.com/dipv76dpn/image/upload/f_auto,q_auto/v1757873204/Rosy/atqg41isqwlhf3jcnxpd.jpg",
                publicId: "Rosy/atqg41isqwlhf3jcnxpd",
                category: "restauracion",
                createdAt: new Date().toISOString()
            },
            {
                name: "Foto original dañada",
                src: "https://res.cloudinary.com/dipv76dpn/image/upload/f_auto,q_auto/v1757873175/Rosy/riqnvhzae5niudf8zyue.png",
                publicId: "Rosy/riqnvhzae5niudf8zyue",
                category: "restauracion",
                createdAt: new Date(Date.now() - 1000).toISOString()
            },
            {
                name: "Colorización - Familia retrato",
                src: "https://res.cloudinary.com/dipv76dpn/image/upload/f_auto,q_auto/v1757806166/Rosy/xrcskkzenwojxwengwss.png",
                publicId: "Rosy/xrcskkzenwojxwengwss",
                category: "colorizacion",
                createdAt: new Date(Date.now() - 2000).toISOString()
            },
            {
                name: "Foto en blanco y negro - Original",
                src: "https://res.cloudinary.com/dipv76dpn/image/upload/f_auto,q_auto/v1757873246/Rosy/ajtrh1rirk5dnp4kgnu3.jpg",
                publicId: "Rosy/ajtrh1rirk5dnp4kgnu3",
                category: "colorizacion",
                createdAt: new Date(Date.now() - 3000).toISOString()
            }
        ];

        // Guardar cada imagen en Firebase
        for (const img of sampleImages) {
            try {
                if (typeof provider.saveImage === "function") {
                    await provider.saveImage(img);
                    console.log(`✓ Seeded: ${img.name}`);
                }
            } catch (err) {
                console.warn(`Failed to seed image "${img.name}":`, err.message);
            }
        }

        console.log("✓ Firebase seed completed successfully");
    } catch (error) {
        console.warn("Seed operation failed (non-critical):", error.message);
    }
}
