const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret }       = require("firebase-functions/params");
const admin                  = require("firebase-admin");
const { v2: cloudinary }     = require("cloudinary");

admin.initializeApp();

// ── Secrets ────────────────────────────────────────────────────────────────
const cloudNameSecret    = defineSecret("CLOUDINARY_CLOUD_NAME");
const cloudApiKeySecret  = defineSecret("CLOUDINARY_API_KEY");
const cloudApiSecretSec  = defineSecret("CLOUDINARY_API_SECRET");
const galleryAdminUid    = defineSecret("GALLERY_ADMIN_UID");

function configureCloudinary() {
    cloudinary.config({
        cloud_name: cloudNameSecret.value(),
        api_key:    cloudApiKeySecret.value(),
        api_secret: cloudApiSecretSec.value(),
        secure:     true
    });
}

const SECRETS = [cloudNameSecret, cloudApiKeySecret, cloudApiSecretSec, galleryAdminUid];
const CALL_OPTIONS = { region: "us-central1", cors: true, maxInstances: 10, secrets: SECRETS };

// ── Helpers ────────────────────────────────────────────────────────────────

function assertAdmin(request) {
    const uid = request.auth?.uid || "";
    if (!uid) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");

    const adminUid = (galleryAdminUid.value() || "").trim();
    if (adminUid && uid !== adminUid) {
        throw new HttpsError("permission-denied", "No tienes permisos para esta operación.");
    }
    return uid;
}

// ── deleteGalleryImage ─────────────────────────────────────────────────────

exports.deleteGalleryImage = onCall(CALL_OPTIONS, async (request) => {
    assertAdmin(request);

    const docId    = String(request.data?.docId    || "").trim();
    const publicId = String(request.data?.publicId || "").trim();

    if (!docId) throw new HttpsError("invalid-argument", "Falta docId.");

    if (publicId) {
        configureCloudinary();
        const result     = await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
        const resultState = String(result?.result || "").toLowerCase();
        if (resultState !== "ok" && resultState !== "not found") {
            throw new HttpsError("internal", "Cloudinary no pudo eliminar la imagen.");
        }
    }

    await admin.firestore().collection("gallery").doc(docId).delete();

    return { ok: true, deletedDocId: docId, deletedPublicId: publicId || null };
});

// ── sendCotizacionNotification ─────────────────────────────────────────────
// Enviado automáticamente cuando se escribe en /cotizaciones/{id}

exports.onNewCotizacion = require("firebase-functions/v2/firestore")
    .onDocumentCreated("cotizaciones/{docId}", async (event) => {
        const data = event.data?.data() || {};
        // Solo registra en consola (puedes agregar nodemailer/sendgrid aquí)
        console.log(`Nueva cotización de ${data.name} (${data.email}): $${data.total} COP`);
        return null;
    });

// ── onNewMessage ────────────────────────────────────────────────────────────

exports.onNewMessage = require("firebase-functions/v2/firestore")
    .onDocumentCreated("messages/{docId}", async (event) => {
        const data = event.data?.data() || {};
        console.log(`Nuevo mensaje de ${data.name} (${data.email}): ${data.subject}`);
        return null;
    });
