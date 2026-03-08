import "./js/firebase-provider.js";
import { APP_CONFIG } from "./js/config.js";
import { createAuthClient } from "./js/auth.js";
import { initComparators } from "./js/comparator.js";
import { createGalleryService } from "./js/gallery-service.js";
import { applyTranslations, getInitialLanguage, setLanguage, t } from "./js/i18n.js";
import { getTheme, initTheme, toggleTheme } from "./js/theme.js";

const state = {
    isAdmin: false,
    allImages: [],
    currentPage: 1,
    itemsPerPage: APP_CONFIG.defaults.itemsPerPage,
    galleryError: "",
    cloudinaryWidget: null
};

const dom = {};
const authClient = createAuthClient(APP_CONFIG.auth);
const galleryService = createGalleryService(APP_CONFIG);

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
    cacheDom();
    initLanguage();
    initThemeControl();
    initComparators(["comparator-restauracion", "comparator-colorizacion"]);
    bindEvents();
    initCloudinaryWidget();
    await initializeSession();
    await refreshGallery();
    updateUI();
}

function cacheDom() {
    dom.loginModal = document.getElementById("loginModal");
    dom.adminLoginBtn = document.getElementById("adminLoginBtn");
    dom.logoutBtn = document.getElementById("logoutBtn");
    dom.adminStatus = document.getElementById("adminStatus");
    dom.uploadSection = document.getElementById("uploadSection");
    dom.emailInput = document.getElementById("emailInput");
    dom.passwordInput = document.getElementById("passwordInput");
    dom.loginBtn = document.getElementById("loginBtn");
    dom.loginMessage = document.getElementById("loginMessage");
    dom.closeModal = document.querySelector(".modal .close");
    dom.urlInput = document.getElementById("urlInput");
    dom.urlSubmit = document.getElementById("urlSubmit");
    dom.imageGallery = document.getElementById("imageGallery");
    dom.emptyMessage = document.getElementById("emptyMessage");
    dom.galleryLoading = document.getElementById("galleryLoading");
    dom.cloudinaryBtn = document.getElementById("cloudinaryBtn");
    dom.useUrlBtn = document.getElementById("useUrlBtn");
    dom.urlUploadArea = document.getElementById("urlUploadArea");
    dom.cantidadSelector = document.getElementById("cantidadSelector");
    dom.paginationContainer = document.getElementById("pagination");
    dom.paginationInfo = document.getElementById("paginationInfo");
    dom.fullScreenModal = document.getElementById("fullScreenModal");
    dom.fullScreenImage = document.getElementById("fullScreenImage");
    dom.fsClose = document.querySelector(".fs-close");
    dom.languageSelect = document.getElementById("languageSelect");
    dom.themeToggle = document.getElementById("themeToggle");
}

function initLanguage() {
    const language = getInitialLanguage(APP_CONFIG.defaults.language);
    setLanguage(language);
    applyTranslations(document);
    dom.languageSelect.value = language;
}

function initThemeControl() {
    initTheme(APP_CONFIG.defaults.theme);
    updateThemeButtonLabel();
}

function updateThemeButtonLabel() {
    const key = getTheme() === "dark" ? "controls.themeToLight" : "controls.themeToDark";
    dom.themeToggle.textContent = t(key);
}

function bindEvents() {
    dom.adminLoginBtn.addEventListener("click", openLoginModal);
    dom.logoutBtn.addEventListener("click", handleLogout);
    dom.loginBtn.addEventListener("click", attemptLogin);
    dom.closeModal.addEventListener("click", closeLoginModal);
    dom.urlSubmit.addEventListener("click", handleUrlUpload);
    dom.cloudinaryBtn.addEventListener("click", openCloudinaryWidget);
    dom.useUrlBtn.addEventListener("click", () => dom.urlUploadArea.classList.toggle("active"));
    dom.cantidadSelector.addEventListener("change", handleCantidadChange);
    dom.languageSelect.addEventListener("change", handleLanguageChange);
    dom.themeToggle.addEventListener("click", handleThemeToggle);
    dom.imageGallery.addEventListener("click", handleGalleryClick);
    dom.fsClose.addEventListener("click", closeFullScreen);
    dom.fullScreenModal.addEventListener("click", (event) => {
        if (event.target === dom.fullScreenModal) closeFullScreen();
    });

    window.addEventListener("click", (event) => {
        if (event.target === dom.loginModal) closeLoginModal();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeLoginModal();
            closeFullScreen();
        }
    });
}

function handleLanguageChange() {
    const selectedLanguage = dom.languageSelect.value;
    setLanguage(selectedLanguage);
    applyTranslations(document);
    updateThemeButtonLabel();
    updateUI();
    renderGalleryBasedOnSelection();
}

function handleThemeToggle() {
    toggleTheme();
    updateThemeButtonLabel();
}

async function initializeSession() {
    state.isAdmin = await authClient.checkSession();
}

function initCloudinaryWidget() {
    if (!window.cloudinary) {
        dom.cloudinaryBtn.disabled = true;
        return;
    }

    const widgetOptions = {
        cloudName: APP_CONFIG.cloudinary.cloudName,
        uploadPreset: APP_CONFIG.cloudinary.uploadPreset,
        tags: [APP_CONFIG.cloudinary.listTag],
        sources: APP_CONFIG.cloudinary.sources
    };

    if (APP_CONFIG.cloudinary.assetFolder) {
        widgetOptions.folder = APP_CONFIG.cloudinary.assetFolder;
        widgetOptions.asset_folder = APP_CONFIG.cloudinary.assetFolder;
    }

    state.cloudinaryWidget = window.cloudinary.createUploadWidget(widgetOptions, async (error, result) => {
        if (error) {
            alert(t("cloudinary.openError"));
            return;
        }

        if (!result || result.event !== "success") return;

        try {
            const newImage = await galleryService.saveUploadedImage(result.info);
            state.allImages.unshift(newImage);
            state.currentPage = 1;
            renderGalleryBasedOnSelection();
        } catch (uploadError) {
            console.error(uploadError);
            alert(t("firebase.notConfigured"));
        }
    });
}

async function refreshGallery() {
    state.galleryError = "";
    setGalleryLoading(true);

    try {
        const images = await galleryService.listImages();
        state.allImages = images;
    } catch (error) {
        console.error(error);
        state.allImages = [];
        state.galleryError = String(error.message || "UNKNOWN_ERROR");
    } finally {
        renderGalleryBasedOnSelection();
        setGalleryLoading(false);
    }
}

function setGalleryLoading(isLoading) {
    if (!dom.galleryLoading) return;
    dom.galleryLoading.classList.toggle("hidden", !isLoading);
    dom.imageGallery.classList.toggle("gallery-dimmed", isLoading);
    if (isLoading) {
        dom.emptyMessage.style.display = "none";
    }
}

function resolveEmptyStateMessage() {
    if (!state.galleryError) return t("gallery.empty");

    const errorText = state.galleryError.toLowerCase();
    if (errorText.includes("restricted")) return t("gallery.loadRestricted");
    if (errorText.includes("no resources found")) return t("gallery.empty");
    if (errorText.includes("firebase_provider_missing")) return t("firebase.notConfigured");
    return t("gallery.loadError");
}

function handleCantidadChange() {
    state.itemsPerPage = Number.parseInt(dom.cantidadSelector.value, 10);
    state.currentPage = 1;
    renderGalleryBasedOnSelection();
}

function renderGalleryBasedOnSelection() {
    if (state.itemsPerPage === 9999) {
        dom.paginationContainer.classList.add("hidden");
        dom.paginationInfo.classList.add("hidden");
        renderGallery(state.allImages);
        return;
    }

    updatePagination();
    renderCurrentPage();
}

function renderCurrentPage() {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const imagesToShow = state.allImages.slice(startIndex, endIndex);
    renderGallery(imagesToShow);

    const totalPages = Math.max(1, Math.ceil(state.allImages.length / state.itemsPerPage));
    dom.paginationInfo.textContent = t("pagination.info", {
        page: String(state.currentPage),
        totalPages: String(totalPages),
        totalImages: String(state.allImages.length)
    });
    dom.paginationInfo.classList.toggle("hidden", state.allImages.length === 0);
}

function updatePagination() {
    const totalPages = Math.ceil(state.allImages.length / state.itemsPerPage);
    dom.paginationContainer.innerHTML = "";

    if (totalPages <= 1) {
        dom.paginationContainer.classList.add("hidden");
        dom.paginationInfo.classList.add("hidden");
        return;
    }

    dom.paginationContainer.classList.remove("hidden");

    const prevButton = createPageButton("«", state.currentPage === 1, () => {
        if (state.currentPage > 1) {
            state.currentPage -= 1;
            renderCurrentPage();
            updatePagination();
        }
    });
    dom.paginationContainer.appendChild(prevButton);

    const maxVisiblePages = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        dom.paginationContainer.appendChild(createPageButton("1", false, () => jumpToPage(1)));
        if (startPage > 2) dom.paginationContainer.appendChild(createEllipsis());
    }

    for (let page = startPage; page <= endPage; page += 1) {
        dom.paginationContainer.appendChild(
            createPageButton(String(page), false, () => jumpToPage(page), page === state.currentPage)
        );
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) dom.paginationContainer.appendChild(createEllipsis());
        dom.paginationContainer.appendChild(createPageButton(String(totalPages), false, () => jumpToPage(totalPages)));
    }

    const nextButton = createPageButton("»", state.currentPage === totalPages, () => {
        if (state.currentPage < totalPages) {
            state.currentPage += 1;
            renderCurrentPage();
            updatePagination();
        }
    });
    dom.paginationContainer.appendChild(nextButton);
}

function jumpToPage(page) {
    state.currentPage = page;
    renderCurrentPage();
    updatePagination();
}

function createPageButton(label, disabled, onClick, active = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `pagination-button ${disabled ? "disabled" : ""} ${active ? "active" : ""}`.trim();
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener("click", onClick);
    return button;
}

function createEllipsis() {
    const ellipsis = document.createElement("span");
    ellipsis.className = "pagination-ellipsis";
    ellipsis.textContent = "...";
    return ellipsis;
}

function renderGallery(images) {
    dom.imageGallery.innerHTML = "";

    if (!images.length) {
        dom.emptyMessage.textContent = resolveEmptyStateMessage();
        dom.emptyMessage.style.display = "block";
        dom.imageGallery.appendChild(dom.emptyMessage);
        return;
    }

    images.forEach((image) => {
        if (!image.src) return;

        const item = document.createElement("article");
        item.className = "gallery-item is-loading";
        item.dataset.src = image.src;

        const img = document.createElement("img");
        img.className = "gallery-image";
        img.alt = image.name || "Imagen";
        img.loading = "lazy";
        img.addEventListener("load", () => {
            item.classList.remove("is-loading");
            img.classList.add("loaded");
        });
        img.addEventListener("error", () => {
            item.classList.remove("is-loading");
            img.classList.add("loaded");
        });
        img.src = image.src;
        item.appendChild(img);

        if (state.isAdmin) {
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-btn";
            deleteButton.title = t("gallery.delete");
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.addEventListener("click", async (event) => {
                event.stopPropagation();
                await handleDeleteRequest(image);
            });
            item.appendChild(deleteButton);
        }

        dom.imageGallery.appendChild(item);
    });
}

async function handleDeleteRequest(image) {
    try {
        const deleted = await galleryService.deleteImage(image);

        if (deleted) {
            state.allImages = state.allImages.filter((item) => item.id !== image.id);
            state.currentPage = 1;
            renderGalleryBasedOnSelection();
            return;
        }
    } catch (error) {
        console.error(error);
        alert(t("gallery.deleteError"));
        return;
    }

    alert(t("gallery.deleteUnavailable"));
    const folder = encodeURIComponent(APP_CONFIG.cloudinary.assetFolder || "");
    window.open(`https://cloudinary.com/console/media_library/folder/${folder}`, "_blank", "noopener,noreferrer");
}

function handleGalleryClick(event) {
    if (event.target.tagName !== "IMG") return;
    dom.fullScreenImage.src = event.target.src;
    dom.fullScreenModal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeFullScreen() {
    dom.fullScreenModal.style.display = "none";
    dom.fullScreenImage.src = "";
    document.body.style.overflow = "";
}

function openLoginModal() {
    dom.loginMessage.textContent = "";
    if (dom.emailInput) dom.emailInput.value = APP_CONFIG.auth.firebaseAdminEmail || "";
    dom.passwordInput.value = "";
    dom.loginModal.style.display = "block";
    if (dom.emailInput && !dom.emailInput.value) {
        dom.emailInput.focus();
    } else {
        dom.passwordInput.focus();
    }
}

function closeLoginModal() {
    dom.loginModal.style.display = "none";
}

async function attemptLogin() {
    const email = (dom.emailInput?.value || APP_CONFIG.auth.firebaseAdminEmail || "").trim();
    const password = dom.passwordInput.value.trim();

    if (!password) {
        dom.loginMessage.textContent = t("auth.badCredentials");
        return;
    }

    if (APP_CONFIG.auth.mode === "firebase" && !email) {
        dom.loginMessage.textContent = t("auth.emailRequired");
        return;
    }

    try {
        const isAuthenticated = await authClient.login({ email, password });
        if (!isAuthenticated) {
            dom.loginMessage.textContent = t("auth.badCredentials");
            return;
        }

        state.isAdmin = true;
        closeLoginModal();
        updateUI();
    } catch (error) {
        const knownInvalid = error.message === "INVALID_CREDENTIALS";
        dom.loginMessage.textContent = knownInvalid ? t("auth.badCredentials") : t("auth.unavailable");
    }
}

async function handleLogout() {
    try {
        await authClient.logout();
    } catch (error) {
        console.error(error);
        alert(t("auth.logoutError"));
    }

    state.isAdmin = false;
    updateUI();
}

function openCloudinaryWidget() {
    if (!state.isAdmin) {
        alert(t("auth.required"));
        openLoginModal();
        return;
    }

    if (!state.cloudinaryWidget) {
        alert(t("cloudinary.unavailable"));
        return;
    }

    state.cloudinaryWidget.open();
}

async function handleUrlUpload() {
    if (!state.isAdmin) {
        alert(t("auth.required"));
        openLoginModal();
        return;
    }

    const url = dom.urlInput.value.trim();
    if (!url) {
        alert(t("upload.urlEmpty"));
        return;
    }

    try {
        new URL(url);
    } catch {
        alert(t("upload.urlInvalid"));
        return;
    }

    const image = new Image();
    image.onload = async () => {
        try {
            const newImage = await galleryService.saveExternalImage(url);
            state.allImages.unshift(newImage);
            state.currentPage = 1;
            renderGalleryBasedOnSelection();
            dom.urlInput.value = "";
            dom.urlUploadArea.classList.remove("active");
        } catch (error) {
            console.error(error);
            alert(t("firebase.notConfigured"));
        }
    };
    image.onerror = () => alert(t("upload.urlLoadError"));
    image.src = url;
}

function updateUI() {
    dom.adminStatus.textContent = t("admin.status");

    if (state.isAdmin) {
        dom.adminStatus.classList.remove("hidden");
        dom.uploadSection.classList.remove("hidden");
        dom.adminLoginBtn.classList.add("hidden");
        dom.logoutBtn.classList.remove("hidden");
    } else {
        dom.adminStatus.classList.add("hidden");
        dom.uploadSection.classList.add("hidden");
        dom.adminLoginBtn.classList.remove("hidden");
        dom.logoutBtn.classList.add("hidden");
    }
}
