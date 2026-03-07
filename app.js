// ========== CONFIGURACIÓN DE CLOUDINARY ==========
const CLOUD_NAME = 'dipv76dpn';
const UPLOAD_PRESET = 'rosy_unsigned';
const FOLDER = 'Rosy';
const ADMIN_PASSWORD = 'Nileynave';

// URLs de los comparadores antes/después (fijas)
const COMPARATORS = {
    restoration: {
        before: 'https://res.cloudinary.com/dipv76dpn/image/upload/f_auto,q_auto/v1757873204/Rosy/atqg41isqwlhf3jcnxpd.jpg',
        after: 'https://res.cloudinary.com/dipv76dpn/image/upload/f_auto,q_auto/v1757873175/Rosy/riqnvhzae5niudf8zyue.png'
    },
    colorization: {
        before: 'https://res.cloudinary.com/dipv76dpn/image/upload/f_auto,q_auto/v1757873246/Rosy/ajtrh1rirk5dnp4kgnu3.jpg',
        after: 'https://res.cloudinary.com/dipv76dpn/image/upload/f_auto,q_auto/v1757806166/Rosy/xrcskkzenwojxwengwss.png'
    }
};

// ========== VARIABLES GLOBALES ==========
let allImages = [];
let isAdmin = false;
let currentPage = 1;
let itemsPerPage = 6;

// ========== ELEMENTOS DEL DOM ==========
const adminLoginBtn = document.getElementById('adminLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminStatus = document.getElementById('adminStatus');
const uploadSection = document.getElementById('uploadSection');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.modal .close');
const urlInput = document.getElementById('urlInput');
const urlSubmit = document.getElementById('urlSubmit');
const imageGallery = document.getElementById('imageGallery');
const emptyMessage = document.getElementById('emptyMessage');
const cloudinaryBtn = document.getElementById('cloudinaryBtn');
const useUrlBtn = document.getElementById('useUrlBtn');
const cantidadSelector = document.getElementById('cantidadSelector');
const paginationContainer = document.getElementById('pagination');
const paginationInfo = document.getElementById('paginationInfo');
const fullscreenModal = document.getElementById('fullscreenModal');
const fullscreenImage = document.getElementById('fullscreenImage');
const fsClose = document.querySelector('.fs-close');

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Cargar comparadores
    loadComparators();

    // Cargar galería
    loadGallery();

    // Event listeners
    adminLoginBtn.addEventListener('click', openLoginModal);
    logoutBtn.addEventListener('click', logout);
    loginBtn.addEventListener('click', attemptLogin);
    closeModal.addEventListener('click', () => loginModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
    });
    urlSubmit.addEventListener('click', handleUrlUpload);
    cloudinaryBtn.addEventListener('click', openCloudinary);
    useUrlBtn.addEventListener('click', () => {
        document.getElementById('urlUploadArea').classList.toggle('active');
    });
    cantidadSelector.addEventListener('change', handleCantidadChange);
    fsClose.addEventListener('click', closeFullscreen);
    fullscreenModal.addEventListener('click', closeFullscreen);

    // Inicializar Cloudinary Widget
    const widget = cloudinary.createUploadWidget(
        {
            cloudName: CLOUD_NAME,
            uploadPreset: UPLOAD_PRESET,
            folder: FOLDER,
            sources: ['local', 'url', 'camera']
        },
        (error, result) => {
            if (!error && result && result.event === 'success') {
                simulateAddImage(result.info);
            }
        }
    );
    window.cloudinaryWidget = widget;

    updateUI();
}

// ========== CARGAR COMPARADORES ==========
function loadComparators() {
    // Restauración
    const restaurationAfter = document.getElementById('restaurationAfter');
    const restaurationBefore = document.getElementById('restaurationBefore');
    restaurationAfter.src = COMPARATORS.restoration.after;
    restaurationBefore.src = COMPARATORS.restoration.before;

    // Colorización
    const colorizationAfter = document.getElementById('colorizationAfter');
    const colorizationBefore = document.getElementById('colorizationBefore');
    colorizationAfter.src = COMPARATORS.colorization.after;
    colorizationBefore.src = COMPARATORS.colorization.before;

    // Inicializar sliders
    initSliders();
}

// ========== INICIALIZAR SLIDERS DE COMPARADORES ==========
function initSliders() {
    const containers = document.querySelectorAll('.image-container');

    containers.forEach((container) => {
        const imageBefore = container.querySelector('.image-before');
        let isSliding = false;

        const startSlide = (e) => {
            isSliding = true;
            updateSlide(e, container, imageBefore);
        };

        const stopSlide = () => {
            isSliding = false;
        };

        const moveSlide = (e) => {
            if (isSliding) {
                updateSlide(e, container, imageBefore);
            }
        };

        container.addEventListener('mousedown', startSlide);
        container.addEventListener('touchstart', startSlide);
        document.addEventListener('mouseup', stopSlide);
        document.addEventListener('touchend', stopSlide);
        document.addEventListener('mousemove', moveSlide);
        document.addEventListener('touchmove', moveSlide);

        // Click para mover
        container.addEventListener('click', (e) => {
            updateSlide(e, container, imageBefore);
        });
    });
}

function updateSlide(e, container, imageBefore) {
    const rect = container.getBoundingClientRect();
    let x = e.clientX - rect.left;

    // Para touch events
    if (e.touches) {
        x = e.touches[0].clientX - rect.left;
    }

    // Limitar entre 0 y el ancho del contenedor
    x = Math.max(0, Math.min(x, rect.width));

    const percentage = (x / rect.width) * 100;
    imageBefore.style.width = percentage + '%';
}

// ========== CARGAR GALERÍA DESDE CLOUDINARY ==========
async function loadGallery() {
    try {
        emptyMessage.textContent = 'Cargando imágenes de la galería...';

        const res = await fetch(
            `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${FOLDER}.json`
        );

        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }

        const data = await res.json();

        if (!data.resources || data.resources.length === 0) {
            emptyMessage.textContent =
                'No hay imágenes en la galería. Sube algunas fotos para comenzar.';
            allImages = [];
            renderGalleryBasedOnSelection();
            return;
        }

        // Mapear recursos y agregar optimización f_auto,q_auto
        allImages = data.resources.map((r) => {
            // Construir URL con optimización
            const baseUrl = r.secure_url;
            const optimizedUrl = baseUrl.replace(
                '/image/upload/',
                '/image/upload/f_auto,q_auto/'
            );

            return {
                id: r.public_id,
                src: optimizedUrl,
                name: r.public_id.split('/').pop()
            };
        });

        renderGalleryBasedOnSelection();
    } catch (error) {
        console.error('Error cargando galería:', error);
        emptyMessage.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: #fc25a2; margin-bottom: 10px; display: block;"></i>
            <p><strong>No se pudieron cargar las imágenes</strong></p>
            <p style="font-size: 0.9rem; margin-top: 10px;">
                Asegúrate de que la carpeta "${FOLDER}" en Cloudinary tenga habilitado "resource list".
            </p>
            <p style="font-size: 0.85rem; margin-top: 5px; color: #999;">
                Error: ${error.message}
            </p>
        `;
        allImages = [];
        renderGalleryBasedOnSelection();
    }
}

// ========== RENDERIZAR GALERÍA SEGÚN SELECCIÓN ==========
function renderGalleryBasedOnSelection() {
    if (itemsPerPage === 9999) {
        // Mostrar todas las imágenes sin paginación
        paginationContainer.classList.add('hidden');
        paginationInfo.classList.add('hidden');
        renderGallery(allImages);
    } else {
        // Mostrar con paginación
        updatePagination();
        renderCurrentPage();
    }
}

// ========== RENDERIZAR PÁGINA ACTUAL ==========
function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const imagesToShow = allImages.slice(startIndex, endIndex);

    renderGallery(imagesToShow);

    // Actualizar info de paginación
    const totalPages = Math.ceil(allImages.length / itemsPerPage);
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages} - ${allImages.length} imágenes en total`;
    paginationInfo.classList.remove('hidden');
}

// ========== RENDERIZAR GALERÍA ==========
function renderGallery(images) {
    imageGallery.innerHTML = '';

    if (images.length === 0) {
        emptyMessage.textContent =
            'No hay imágenes para mostrar. Sube fotos para comenzar.';
        imageGallery.appendChild(emptyMessage);
        return;
    }

    images.forEach((image) => {
        if (!image.src) return; // Saltar imágenes sin URL

        const item = document.createElement('div');
        item.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.name;
        img.addEventListener('click', () => openFullscreen(image.src));

        item.appendChild(img);

        // Botón de eliminar (solo para admin)
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteImage(image.id);
            });
            item.appendChild(deleteBtn);
        }

        imageGallery.appendChild(item);
    });
}

// ========== ACTUALIZAR PAGINACIÓN ==========
function updatePagination() {
    const totalPages = Math.ceil(allImages.length / itemsPerPage);

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        paginationContainer.classList.add('hidden');
        paginationInfo.classList.add('hidden');
        return;
    }

    paginationContainer.classList.remove('hidden');

    // Botón anterior
    const prevButton = document.createElement('button');
    prevButton.className = `pagination-button ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = '&laquo;';
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderCurrentPage();
            updatePagination();
        }
    });
    paginationContainer.appendChild(prevButton);

    // Números de página
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'pagination-button';
        firstBtn.textContent = '1';
        firstBtn.addEventListener('click', () => {
            currentPage = 1;
            renderCurrentPage();
            updatePagination();
        });
        paginationContainer.appendChild(firstBtn);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            renderCurrentPage();
            updatePagination();
        });
        paginationContainer.appendChild(btn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }

        const lastBtn = document.createElement('button');
        lastBtn.className = 'pagination-button';
        lastBtn.textContent = totalPages;
        lastBtn.addEventListener('click', () => {
            currentPage = totalPages;
            renderCurrentPage();
            updatePagination();
        });
        paginationContainer.appendChild(lastBtn);
    }

    // Botón siguiente
    const nextButton = document.createElement('button');
    nextButton.className = `pagination-button ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = '&raquo;';
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderCurrentPage();
            updatePagination();
        }
    });
    paginationContainer.appendChild(nextButton);
}

// ========== CAMBIAR CANTIDAD DE IMÁGENES POR PÁGINA ==========
function handleCantidadChange() {
    itemsPerPage = parseInt(cantidadSelector.value);
    currentPage = 1;

    if (itemsPerPage === 9999) {
        paginationContainer.classList.add('hidden');
        paginationInfo.classList.add('hidden');
        renderGallery(allImages);
    } else {
        updatePagination();
        renderCurrentPage();
    }
}

// ========== ADMIN - LOGIN ==========
function openLoginModal() {
    loginModal.style.display = 'block';
    passwordInput.focus();
}

function attemptLogin() {
    const password = passwordInput.value;
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        loginModal.style.display = 'none';
        passwordInput.value = '';
        loginMessage.textContent = '';
        updateUI();
    } else {
        loginMessage.textContent = 'Contraseña incorrecta';
        passwordInput.value = '';
    }
}

function logout() {
    isAdmin = false;
    updateUI();
}

function updateUI() {
    if (isAdmin) {
        adminLoginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        adminStatus.classList.remove('hidden');
        uploadSection.classList.remove('hidden');
    } else {
        adminLoginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        adminStatus.classList.add('hidden');
        uploadSection.classList.add('hidden');
    }
}

// ========== ABRIR CLOUDINARY WIDGET ==========
function openCloudinary() {
    if (isAdmin) {
        window.cloudinaryWidget.open();
    } else {
        alert('Inicia sesión como administrador');
        openLoginModal();
    }
}

// ========== SUBIR POR URL ==========
async function handleUrlUpload() {
    const url = urlInput.value.trim();

    if (!url) {
        alert('Por favor ingresa una URL válida');
        return;
    }

    try {
        // Validar que sea una URL válida
        new URL(url);

        // Simular agregación de imagen
        simulateAddImage({ secure_url: url, public_id: 'url_upload_' + Date.now() });
        urlInput.value = '';
        document.getElementById('urlUploadArea').classList.remove('active');
    } catch {
        alert('La URL no es válida');
    }
}

// ========== SIMULAR AGREGACIÓN DE IMAGEN ==========
function simulateAddImage(imageInfo) {
    // Agregar optimización f_auto,q_auto
    const baseUrl = imageInfo.secure_url;
    const optimizedUrl = baseUrl.includes('cloudinary.com')
        ? baseUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/')
        : baseUrl;

    const newImage = {
        id: imageInfo.public_id,
        src: optimizedUrl,
        name: imageInfo.public_id.split('/').pop()
    };

    allImages.unshift(newImage);
    currentPage = 1;
    renderGalleryBasedOnSelection();
    alert('¡Imagen agregada exitosamente!');
}

// ========== ELIMINAR IMAGEN ==========
async function deleteImage(imageId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        return;
    }

    try {
        // Aquí iría la lógica para eliminar de Cloudinary
        // Por ahora, solo eliminamos del array local
        allImages = allImages.filter((img) => img.id !== imageId);
        currentPage = 1;
        renderGalleryBasedOnSelection();
        alert('Imagen eliminada');
    } catch (error) {
        alert('Error al eliminar la imagen: ' + error.message);
    }
}

// ========== PANTALLA COMPLETA ==========
function openFullscreen(imageSrc) {
    fullscreenImage.src = imageSrc;
    fullscreenModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeFullscreen() {
    fullscreenModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Cerrar pantalla completa al presionar Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeFullscreen();
    }
});
