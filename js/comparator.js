function initComparator(comparatorId) {
    const comparator = document.getElementById(comparatorId);
    if (!comparator || comparator.dataset.ready === "true") return;

    const beforeContainer = comparator.querySelector(".image-before");
    const sliderLine = comparator.querySelector(".slider-line");
    const sliderHandle = comparator.querySelector(".slider-handle");
    const imageContainer = comparator.querySelector(".image-container");
    // La imagen interna del "before" debe mantener siempre el ancho total del contenedor
    const beforeInnerImg = beforeContainer ? beforeContainer.querySelector("img") : null;

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

    // Fuerza la imagen interna a mantener el ancho completo del contenedor
    // para que no se deforme al recortar el contenedor padre
    function syncInnerImageWidth() {
        if (!beforeInnerImg) return;
        const w = imageContainer.offsetWidth;
        beforeInnerImg.style.width = w + "px";
    }

    function setVisualPosition(xPx) {
        const b = bounds();
        const w = b.width;
        const x = clamp(xPx, 0, w);

        // Recorta el contenedor del BEFORE sin alterar la posición interna de la imagen
        beforeContainer.style.width = `${x}px`;

        // Mueve línea y manija con transform (GPU, sin forzar layout)
        // La línea se desplaza desde su borde izquierdo (origen 0)
        sliderLine.style.transform = `translateX(${x}px)`;
        // El handle se centra sobre la línea restando la mitad de su ancho (22px = 44px / 2)
        sliderHandle.style.transform = `translate(calc(${x}px - 50%), -50%)`;
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

    // Actualiza el ancho de la imagen interna al redimensionar la ventana
    function onResize() {
        syncInnerImageWidth();
        // Reposiciona al 50% si aún no se ha interactuado
        const currentWidth = parseFloat(beforeContainer.style.width);
        if (!Number.isNaN(currentWidth)) {
            const b = bounds();
            // Mantener la proporción relativa actual
            const ratio = currentWidth / (b.width || 1);
            setVisualPosition(ratio * b.width);
        }
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

    // Sincroniza el ancho de la imagen interna y posiciona al 50% inicial
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() => {
        syncInnerImageWidth();
        const b = bounds();
        setVisualPosition(b.width / 2);
    });
}

export function initComparators(ids = []) {
    ids.forEach((id) => initComparator(id));
}
