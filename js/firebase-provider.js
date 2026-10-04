import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    where
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase client config (pública por diseño en apps web de Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyBOJg_haN96g3I23rLrI423OA0v-wTucBM",
    authDomain: "gallery-rosy.firebaseapp.com",
    projectId: "gallery-rosy",
    storageBucket: "gallery-rosy.firebasestorage.app",
    messagingSenderId: "959707628996",
    appId: "1:959707628996:web:844bcb5125e3af18759091",
    measurementId: "G-X74JGD1TWB"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const authReady = new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(user);
    });
});

// Espera hasta que haya un usuario autenticado activo (útil post-login)
function waitForAuthUser() {
    return new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) { unsub(); resolve(user); }
        });
    });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeGalleryDoc(snap) {
    const d = snap.data() || {};
    return {
        id:        snap.id,
        publicId:  d.publicId  || d.id || "",
        name:      d.name      || "Imagen",
        src:       d.src       || "",
        category:  d.category  || "todos",
        createdAt: d.createdAt || ""
    };
}

// ── Galería ────────────────────────────────────────────────────────────────

async function listImages(categoryId) {
    const col  = collection(db, "gallery");
    const constraints = [orderBy("createdAt", "desc")];
    if (categoryId && categoryId !== "todos") {
        constraints.unshift(where("category", "==", categoryId));
    }
    const snap = await getDocs(query(col, ...constraints));
    return snap.docs.map(normalizeGalleryDoc).filter(img => Boolean(img.src));
}

async function saveImage(image) {
    const payload = {
        publicId:  image.publicId  || image.id || "",
        name:      image.name      || "Imagen",
        src:       image.src       || "",
        category:  image.category  || "todos",
        createdAt: image.createdAt || new Date().toISOString()
    };
    const ref = await addDoc(collection(db, "gallery"), payload);
    return { id: ref.id, ...payload };
}

async function deleteImage(docId) {
    console.log("[FirebaseProvider] deleteImage llamado → docId:", docId);
    if (!docId) return;
    await deleteDoc(doc(db, "gallery", docId));
    console.log("[FirebaseProvider] deleteDoc ejecutado para docId:", docId);
}

async function deleteImageEverywhere({ docId, publicId }) {
    console.log("[FirebaseProvider] deleteImageEverywhere llamado →", { docId, publicId });
    if (!docId) {
        console.warn("[FirebaseProvider] deleteImageEverywhere: docId vacío — abortando");
        return;
    }
    await deleteDoc(doc(db, "gallery", docId));
    console.log("[FirebaseProvider] deleteDoc ejecutado para docId:", docId);
}

async function updateImageCategory(docId, category) {
    if (!docId) return;
    await updateDoc(doc(db, "gallery", docId), { category });
}

// ── Categorías personalizadas ──────────────────────────────────────────────

async function listCategories() {
    const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
    return snap.docs.map(s => ({ id: s.id, ...s.data() }));
}

async function saveCategory(catData) {
    if (catData.id) {
        await setDoc(doc(db, "categories", catData.id), catData, { merge: true });
        return catData;
    }
    const ref = await addDoc(collection(db, "categories"), catData);
    return { id: ref.id, ...catData };
}

async function deleteCategory(catId) {
    await deleteDoc(doc(db, "categories", catId));
}

// ── Página "Sobre mí" ──────────────────────────────────────────────────────

async function getSobreMi() {
    const snap = await getDoc(doc(db, "pages", "sobre-mi"));
    return snap.exists() ? snap.data() : null;
}

async function saveSobreMi(data) {
    await setDoc(doc(db, "pages", "sobre-mi"), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

// ── Cotizaciones ───────────────────────────────────────────────────────────

async function saveCotizacion(data) {
    const payload = { ...data, createdAt: new Date().toISOString(), status: "pendiente" };
    const ref = await addDoc(collection(db, "cotizaciones"), payload);
    return { id: ref.id, ...payload };
}

async function listCotizaciones() {
    const snap = await getDocs(query(collection(db, "cotizaciones"), orderBy("createdAt", "desc")));
    return snap.docs.map(s => ({ id: s.id, ...s.data() }));
}

async function updateCotizacionStatus(docId, status) {
    await updateDoc(doc(db, "cotizaciones", docId), { status, updatedAt: new Date().toISOString() });
}

async function deleteCotizacion(docId) {
    await deleteDoc(doc(db, "cotizaciones", docId));
}

// ── Mensajes de contacto ───────────────────────────────────────────────────

async function saveContactMessage(data) {
    const payload = { ...data, createdAt: new Date().toISOString(), read: false };
    const ref = await addDoc(collection(db, "messages"), payload);
    return { id: ref.id, ...payload };
}

async function listMessages() {
    const snap = await getDocs(query(collection(db, "messages"), orderBy("createdAt", "desc")));
    return snap.docs.map(s => ({ id: s.id, ...s.data() }));
}

async function markMessageRead(docId) {
    await updateDoc(doc(db, "messages", docId), { read: true });
}

async function deleteMessage(docId) {
    await deleteDoc(doc(db, "messages", docId));
}

// ── Precios del cotizador (editables desde admin) ─────────────────────────

async function getPricing() {
    const snap = await getDoc(doc(db, "pages", "pricing"));
    return snap.exists() ? snap.data() : null;
}

async function savePricing(data) {
    await setDoc(doc(db, "pages", "pricing"), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

// ── Auth ───────────────────────────────────────────────────────────────────

async function checkSession() {
    await authReady;
    return Boolean(auth.currentUser);
}

async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
}

async function logout() {
    await signOut(auth);
}

// ── Expose global ──────────────────────────────────────────────────────────

window.FirebaseGalleryProvider = {
    // Galería
    listImages,
    saveImage,
    deleteImage,
    deleteImageEverywhere,
    updateImageCategory,
    // Categorías
    listCategories,
    saveCategory,
    deleteCategory,
    // Páginas
    getSobreMi,
    saveSobreMi,
    // Cotizaciones
    saveCotizacion,
    listCotizaciones,
    updateCotizacionStatus,
    deleteCotizacion,
    // Mensajes
    saveContactMessage,
    listMessages,
    markMessageRead,
    deleteMessage,
    // Precios
    getPricing,
    savePricing,
    // Auth
    checkSession,
    waitForAuthUser,
    login,
    logout
};
