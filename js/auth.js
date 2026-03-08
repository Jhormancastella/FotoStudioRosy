async function parseSafeJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

export function createAuthClient(config) {
    let isAuthenticated = false;

    function getFirebaseProvider() {
        const providerName = config.providerGlobal || "FirebaseGalleryProvider";
        return window[providerName];
    }

    async function checkSession() {
        if (config.mode === "firebase") {
            const provider = getFirebaseProvider();
            if (!provider || typeof provider.checkSession !== "function") return false;
            isAuthenticated = await provider.checkSession();
            return isAuthenticated;
        }

        if (config.mode !== "api") return false;

        try {
            const response = await fetch(config.endpoints.session, {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) {
                isAuthenticated = false;
                return false;
            }

            const data = await parseSafeJson(response);
            isAuthenticated = Boolean(data.authenticated ?? data.isAdmin ?? true);
            return isAuthenticated;
        } catch {
            isAuthenticated = false;
            return false;
        }
    }

    async function login(credentials) {
        if (config.mode === "firebase") {
            const provider = getFirebaseProvider();
            if (!provider || typeof provider.login !== "function") {
                throw new Error("AUTH_NOT_CONFIGURED");
            }

            const email = credentials?.email;
            const password = credentials?.password;
            if (!email || !password) throw new Error("INVALID_CREDENTIALS");

            try {
                isAuthenticated = await provider.login(email, password);
                return isAuthenticated;
            } catch (error) {
                const code = String(error?.code || "").toLowerCase();
                const invalidCredential =
                    code.includes("invalid") ||
                    code.includes("wrong-password") ||
                    code.includes("user-not-found") ||
                    code.includes("missing-password");
                throw new Error(invalidCredential ? "INVALID_CREDENTIALS" : "AUTH_UNAVAILABLE");
            }
        }

        if (config.mode !== "api") {
            throw new Error("AUTH_NOT_CONFIGURED");
        }

        let response;
        try {
            response = await fetch(config.endpoints.login, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password: credentials?.password || "" })
            });
        } catch {
            throw new Error("AUTH_UNAVAILABLE");
        }

        if (response.status === 401 || response.status === 403) {
            throw new Error("INVALID_CREDENTIALS");
        }

        if (!response.ok) {
            throw new Error("AUTH_UNAVAILABLE");
        }

        const data = await parseSafeJson(response);
        isAuthenticated = Boolean(data.authenticated ?? true);
        return isAuthenticated;
    }

    async function logout() {
        if (config.mode === "firebase") {
            const provider = getFirebaseProvider();
            if (provider && typeof provider.logout === "function") {
                await provider.logout();
            }
            isAuthenticated = false;
            return;
        }

        if (config.mode !== "api") {
            isAuthenticated = false;
            return;
        }

        await fetch(config.endpoints.logout, {
            method: "POST",
            credentials: "include"
        });

        isAuthenticated = false;
    }

    return {
        checkSession,
        login,
        logout
    };
}
