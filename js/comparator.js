function initComparator(comparatorId) {
    const comparator = document.getElementById(comparatorId);
    if (!comparator || comparator.dataset.ready === "true") return;

    const beforeContainer = comparator.querySelector(".image-before");
    const sliderLine = comparator.querySelector(".slider-line");
    const sliderHandle = comparator.querySelector(".slider-handle");
    const imageContainer = comparator.querySelector(".image-container");

    if (!beforeContainer || !sliderLine || !sliderHandle || !imageContainer) return;

    let isDragging = false;
    let pointerDown = false;
    let lastClientX = null;

    // Render batching
    let scheduled = false;
    let targetXPx = null; // posición en píxeles relativa al contenedor

    function bounds() {
        return imageContainer.getBoundingClientRect();
    }

    function clamp(x, min, max) {
        return Math.max(min, Math.min(max, x));
    }

    function toPercent(xPx, widthPx) {
        if (widthPx <= 0) return 50;
        return (xPx / widthPx) * 100;
    }

    function setVisualPosition(xPx) {
        const b = bounds();
        const w = b.width;
        const x = clamp(xPx, 0, w);
        const percent = toPercent(x, w);

        // Actualiza el recorte del BEFORE (más eficiente que forzar layout global)
        // Ajustamos con width en px dentro del contenedor
        beforeContainer.style.width = `${x}px`;

        // Mover línea y manija con transform para mejor rendimiento (GPU)
        sliderLine.style.transform = `translateX(${x}px)`;
        sliderHandle.style.transform = `translate(${x}px, -50%)`;
    }

    function scheduleRender(nextXPx) {
        targetXPx = nextXPx;
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            if (targetXPx == null) return;
            setVisualPosition(targetXPx);
        });
    }

    function positionFromClientX(clientX) {
        const b = bounds();
        return clientX - b.left;
    }

    function startDrag(clientX, pointerId) {
        pointerDown = true;
        isDragging = true;
        comparator.classList.add("is-dragging");
        const xPx = positionFromClientX(clientX);
        scheduleRender(xPx);
        try { comparator.setPointerCapture(pointerId); } catch {}
    }

    function moveDrag(clientX) {
        if (!isDragging) return;
        const xPx = positionFromClientX(clientX);
        scheduleRender(xPx);
    }

    function endDrag(pointerId) {
        if (!pointerDown) return;
        pointerDown = false;
        isDragging = false;
        comparator.classList.remove("is-dragging");
        try { if (pointerId != null) comparator.releasePointerCapture(pointerId); } catch {}
    }

    // Click/tap suave cuando no se arrastra: animar hasta el punto tocado
    function animateTo(clientX) {
        const xPx = positionFromClientX(clientX);
        comparator.classList.add("is-animating");
        scheduleRender(xPx);
        // Remover el flag tras la animación CSS
        clearTimeout(animateTo._t);
        animateTo._t = setTimeout(() => {
            comparator.classList.remove("is-animating");
        }, 220);
    }

    comparator.addEventListener("pointerdown", (event) => {
        // Evita scroll/zoom mientras interactúas con el comparador
        event.preventDefault();
        lastClientX = event.clientX;
        startDrag(event.clientX, event.pointerId);
    }, { passive: false });

    comparator.addEventListener("pointermove", (event) => {
        if (!pointerDown) return;
        event.preventDefault();
        lastClientX = event.clientX;
        moveDrag(event.clientX);
    }, { passive: false });

    comparator.addEventListener("pointerup", (event) => {
        event.preventDefault();
        endDrag(event.pointerId);
    });

    comparator.addEventListener("pointercancel", (event) => {
        endDrag(event.pointerId);
    });

    comparator.addEventListener("pointerleave", () => {
        // Si el puntero sale del contenedor, terminar el arrastre
        endDrag(null);
    });

    // Soporte de teclado mejorado
    comparator.addEventListener("keydown", (event) => {
        const step = (event.shiftKey ? 10 : 5); // paso fino con flechas, mayor con shift
        const b = bounds();
        const currentWidth = parseFloat(beforeContainer.style.width || `${b.width / 2}px`);
        if (Number.isNaN(currentWidth)) return;

        if (event.key === "ArrowLeft") {
            scheduleRender(currentWidth - (b.width * step / 100));
        }
        if (event.key === "ArrowRight") {
            scheduleRender(currentWidth + (b.width * step / 100));
        }
    });

    // Click/tap para saltar con animación cuando no haya arrastre sostenido
    comparator.addEventListener("click", (event) => {
        // Si hubo drag real, el click subsiguiente suele ser sintético; ignoramos
        if (isDragging) return;
        animateTo(event.clientX);
    });

    comparator.setAttribute("tabindex", "0");
    comparator.dataset.ready = "true";

    // Posición inicial al 50%
    requestAnimationFrame(() => {
        const b = bounds();
        const xPx = b.width / 2;
        setVisualPosition(xPx);
    });
}

export function initComparators(ids = []) {
    ids.forEach((id) => initComparator(id));
}
