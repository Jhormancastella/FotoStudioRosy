const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { v2: cloudinary } = require("cloudinary");

admin.initializeApp();

const cloudNameSecret = defineSecret("CLOUDINARY_CLOUD_NAME");
const cloudApiKeySecret = defineSecret("CLOUDINARY_API_KEY");
const cloudApiSecretSecret = defineSecret("CLOUDINARY_API_SECRET");
const galleryAdminUidSecret = defineSecret("GALLERY_ADMIN_UID");

function configureCloudinary() {
    cloudinary.config({
        cloud_name: cloudNameSecret.value(),
        api_key: cloudApiKeySecret.value(),
        api_secret: cloudApiSecretSecret.value(),
        secure: true
    });
}

exports.deleteGalleryImage = onCall(
    {
        region: "us-central1",
        cors: true,
        maxInstances: 10,
        secrets: [cloudNameSecret, cloudApiKeySecret, cloudApiSecretSecret, galleryAdminUidSecret]
    },
    async (request) => {
        const currentUid = request.auth?.uid || "";
        if (!currentUid) {
            throw new HttpsError("unauthenticated", "Debes iniciar sesión para eliminar imágenes.");
        }

        const adminUid = (galleryAdminUidSecret.value() || "").trim();
        if (adminUid && currentUid !== adminUid) {
            throw new HttpsError("permission-denied", "No tienes permisos para eliminar imágenes.");
        }

        const docId = String(request.data?.docId || "").trim();
        const publicId = String(request.data?.publicId || "").trim();

        if (!docId) {
            throw new HttpsError("invalid-argument", "Falta docId.");
        }

        if (publicId) {
            configureCloudinary();
            const cloudinaryResult = await cloudinary.uploader.destroy(publicId, {
                resource_type: "image",
                invalidate: true
            });

            const deletionState = String(cloudinaryResult?.result || "").toLowerCase();
            if (deletionState !== "ok" && deletionState !== "not found") {
                throw new HttpsError("internal", "Cloudinary no pudo eliminar la imagen.");
            }
        }

        await admin.firestore().collection("gallery").doc(docId).delete();

        return {
            ok: true,
            deletedDocId: docId,
            deletedPublicId: publicId || null
        };
    }
);
