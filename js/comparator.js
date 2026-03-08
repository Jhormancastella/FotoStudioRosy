function initComparator(comparatorId) {
    const comparator = document.getElementById(comparatorId);
    if (!comparator || comparator.dataset.ready === "true") return;

    const beforeContainer = comparator.querySelector(".image-before");
    const sliderLine = comparator.querySelector(".slider-line");
    const sliderHandle = comparator.querySelector(".slider-handle");
    const imageContainer = comparator.querySelector(".image-container");

    if (!beforeContainer || !sliderLine || !sliderHandle || !imageContainer) return;

    let isMoving = false;

    function setPosition(clientX) {
        const bounds = imageContainer.getBoundingClientRect();
        const raw = ((clientX - bounds.left) / bounds.width) * 100;
        const position = Math.max(0, Math.min(100, raw));

        beforeContainer.style.width = `${position}%`;
        sliderLine.style.left = `${position}%`;
        sliderHandle.style.left = `${position}%`;
    }

    comparator.addEventListener("pointerdown", (event) => {
        isMoving = true;
        setPosition(event.clientX);
        comparator.setPointerCapture(event.pointerId);
    });

    comparator.addEventListener("pointermove", (event) => {
        if (!isMoving) return;
        setPosition(event.clientX);
    });

    comparator.addEventListener("pointerup", () => {
        isMoving = false;
    });

    comparator.addEventListener("pointercancel", () => {
        isMoving = false;
    });

    comparator.addEventListener("keydown", (event) => {
        const current = Number.parseFloat(beforeContainer.style.width || "50");

        if (event.key === "ArrowLeft") {
            const next = Math.max(0, current - 5);
            beforeContainer.style.width = `${next}%`;
            sliderLine.style.left = `${next}%`;
            sliderHandle.style.left = `${next}%`;
        }

        if (event.key === "ArrowRight") {
            const next = Math.min(100, current + 5);
            beforeContainer.style.width = `${next}%`;
            sliderLine.style.left = `${next}%`;
            sliderHandle.style.left = `${next}%`;
        }
    });

    comparator.setAttribute("tabindex", "0");
    comparator.dataset.ready = "true";
}

export function initComparators(ids = []) {
    ids.forEach((id) => initComparator(id));
}
