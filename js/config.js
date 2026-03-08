export const APP_CONFIG = Object.freeze({
    cloudinary: {
        cloudName: "dipv76dpn",
        uploadPreset: "rosy_unsigned",
        assetFolder: "Rosy",
        listTag: "rosy-gallery",
        sources: ["local", "url", "camera"]
    },
    auth: {
        mode: "firebase",
        firebaseAdminEmail: "",
        providerGlobal: "FirebaseGalleryProvider",
        endpoints: {
            login: "/api/admin/login",
            logout: "/api/admin/logout",
            session: "/api/admin/session"
        }
    },
    dataSource: "firebase",
    firebase: {
        enabled: true,
        collection: "gallery",
        providerGlobal: "FirebaseGalleryProvider"
    },
    defaults: {
        itemsPerPage: 8,
        language: "es",
        theme: "light"
    }
});
