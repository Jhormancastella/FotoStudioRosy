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
    addDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// This client config is public by design in Firebase web apps.
const firebaseConfig = {
    apiKey: "AIzaSyBOJg_haN96g3I23rLrI423OA0v-wTucBM",
    authDomain: "gallery-rosy.firebaseapp.com",
    projectId: "gallery-rosy",
    storageBucket: "gallery-rosy.firebasestorage.app",
    messagingSenderId: "959707628996",
    appId: "1:959707628996:web:844bcb5125e3af18759091",
    measurementId: "G-X74JGD1TWB"
};

const COLLECTION_NAME = "gallery";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authReady = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
    });
});

function normalizeDocument(documentSnapshot) {
    const data = documentSnapshot.data() || {};
    return {
        id: documentSnapshot.id,
        publicId: data.publicId || data.id || "",
        name: data.name || "Imagen",
        src: data.src || "",
        createdAt: data.createdAt || ""
    };
}

async function listImages() {
    const collectionRef = collection(db, COLLECTION_NAME);
    const listQuery = query(collectionRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(listQuery);

    return snapshot.docs
        .map(normalizeDocument)
        .filter((image) => Boolean(image.src));
}

async function saveImage(image) {
    const payload = {
        publicId: image.publicId || image.id || "",
        name: image.name || "Imagen",
        src: image.src || "",
        createdAt: image.createdAt || new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return {
        id: docRef.id,
        ...payload
    };
}

async function deleteImage(docId) {
    if (!docId) return;
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
}

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

window.FirebaseGalleryProvider = {
    listImages,
    saveImage,
    deleteImage,
    checkSession,
    login,
    logout
};
