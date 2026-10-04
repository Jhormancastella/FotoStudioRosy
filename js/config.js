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
    },
    // Categorías del catálogo — editables desde el admin (también en Firestore "categories")
    catalogCategories: [
        { id: "restauracion",  label: "Restauración",       icon: "fas fa-magic",           collection: "gallery" },
        { id: "colorizacion",  label: "Colorización",       icon: "fas fa-palette",         collection: "gallery" },
        { id: "retratos",      label: "Retratos",           icon: "fas fa-user",            collection: "gallery" },
        { id: "bebes",         label: "Bebés",              icon: "fas fa-baby",            collection: "gallery" },
        { id: "embarazo",      label: "Embarazo",           icon: "fas fa-heart",           collection: "gallery" },
        { id: "grados",        label: "Grados",             icon: "fas fa-graduation-cap",  collection: "gallery" },
        { id: "eventos",       label: "Eventos",            icon: "fas fa-camera",          collection: "gallery" },
        { id: "todos",         label: "Todos",              icon: "fas fa-th",              collection: "gallery" }
    ],
    // Precios base en COP para el cotizador
    pricing: {
        currency: "COP",
        sizes: [
            { id: "3x4",    label: "3×4 cm",        price: 3000  },
            { id: "5x7",    label: "5×7 cm",        price: 5000  },
            { id: "8x10",   label: "8×10 cm",       price: 12000 },
            { id: "10x15",  label: "10×15 cm",      price: 15000 },
            { id: "13x18",  label: "13×18 cm",      price: 20000 },
            { id: "20x25",  label: "20×25 cm",      price: 28000 },
            { id: "25x30",  label: "25×30 cm",      price: 38000 },
            { id: "30x40",  label: "30×40 cm",      price: 52000 },
            { id: "40x60",  label: "40×60 cm",      price: 80000 },
            { id: "60x90",  label: "60×90 cm",      price: 140000}
        ],
        materials: [
            { id: "papel_fotografico", label: "Papel fotográfico",   surcharge: 0      },
            { id: "mate",              label: "Acabado mate",         surcharge: 2000   },
            { id: "canvas",            label: "Canvas / Lienzo",      surcharge: 15000  },
            { id: "acrilico",          label: "Acrílico",             surcharge: 25000  },
            { id: "madera",            label: "Tabla de madera",      surcharge: 30000  },
            { id: "aluminio",          label: "Aluminio Dibond",      surcharge: 45000  }
        ],
        services: [
            { id: "basico",        label: "Impresión básica",       price: 0      },
            { id: "restauracion",  label: "Restauración",           price: 35000  },
            { id: "colorizacion",  label: "Colorización",           price: 45000  },
            { id: "retoque",       label: "Retoque profesional",    price: 25000  },
            { id: "combo",         label: "Restauración + Color",   price: 70000  },
            { id: "pendon",        label: "Pendón",                 price: 50000  },
            { id: "retablo",       label: "Retablo",                price: 80000  }
        ]
    },
    // Información de contacto / ubicación
    contact: {
        phone: "+57 322 913 5021",
        whatsapp: "573229135021",
        email: "rosyphotostudio@gmail.com",
        address: "Barrio Divino Niño, Calle 10 #10-37, Tibú, Norte de Santander, Colombia",
        city: "Tibú, Norte de Santander",
        mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15820.24!2d-72.7286!3d8.6576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e68c0dae2ab6b35%3A0x6cc52bea3b4c7e4a!2sTib%C3%BA%2C%20Norte%20de%20Santander!5e0!3m2!1ses!2sco!4v1700000000002!5m2!1ses!2sco",
        social: {
            whatsapp:  "https://wa.me/573229135021",
            facebook:  "https://www.facebook.com/people/Rosy-photostudio-Tibu/61593262499731/",
            instagram: "https://www.instagram.com/rosyphotostudio3/",
            tiktok:    "https://www.tiktok.com/@rosyphotostudio"
        }
    }
});
