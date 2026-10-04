/**
 * app-servicios.js — Página de Servicios con comparadores
 */

import "../js/firebase-provider.js";
import { APP_CONFIG }       from "./config.js";
import { createAuthClient } from "./auth.js";
import { initComparators }  from "./comparator.js";
import { initNav }          from "./nav.js";

const authClient = createAuthClient(APP_CONFIG.auth);

document.addEventListener("DOMContentLoaded", initServicios);

async function initServicios() {
    // Navbar
    initNav("services", {
        onLogoutClick: handleLogout
    });

    // Comparadores
    initComparators(["comparator-restauracion", "comparator-colorizacion"]);

    // Sesión
    const isAdmin = await authClient.checkSession();
    window._navSetAdmin?.(isAdmin);

    // Scroll suave a anclas desde URL (#restauracion, #colorizacion)
    const hash = window.location.hash;
    if (hash) {
        const el = document.querySelector(hash);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
    }
}

async function handleLogout() {
    await authClient.logout();
    window._navSetAdmin?.(false);
}
