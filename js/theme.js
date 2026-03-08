const THEME_KEY = "theme";
const THEMES = new Set(["light", "dark"]);

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

export function initTheme(defaultTheme = "light") {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const theme = THEMES.has(savedTheme) ? savedTheme : defaultTheme;
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
    return theme;
}

export function toggleTheme() {
    const nextTheme = getTheme() === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    return nextTheme;
}

export function getTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    return THEMES.has(current) ? current : "light";
}
