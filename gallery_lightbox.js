/* =============================================================
   GALLERY LIGHTBOX ENGINE - VINHOMES SÀI GÒN PARK
   Trình xem album ảnh đa phương tiện full-screen với chuyển ảnh & thumbnails
   ============================================================= */

const ZONE_TITLES = {
    'botanical-park': 'Công Viên Bách Thảo Botanica Park (27 ha)',
    'zenpark': 'Công Viên Nhật Bản Zenpark Tĩnh Tại',
    'vinwonders': 'Công Viên Nước VinWonders Ocean Park (22.7 ha)',
    'startup-village': 'Làng Khởi Nghiệp Saigon Startup Village (2.3 ha)',
    'fashion-town': 'Phối Cảnh Làng Thời Trang Trendy Fashion Town (2.3 ha)',
    'thap-bieu-tuong': 'Tháp Biểu Tượng & Trung Tâm Giao Thương',
    'thiet-ke-san-pham': 'Bộ Sưu Tập Phối Cảnh Kiến Trúc Nhà Phố & Biệt Thự Mới Nhất',
    'phac-thao-mat-bang': 'Bộ Sưu Tập Phác Thảo Mặt Bằng & Bản Vẽ Thiết Kế',
    'phac-thao-mat-bang-quy-hoach': 'Bộ Sưu Tập Phác Thảo Mặt Bằng Quy Hoạch & Phân Khu (10 Bản Vẽ)',
    'ban-ve-thiet-ke-chi-tiet': 'Bộ Sưu Tập Phác Thảo Bản Vẽ Thiết Kế Chi Tiết Căn (15 Bản Vẽ)',
    'tieu-chuan-ban-giao': 'Phối Cảnh Tiêu Chuẩn Bàn Giao Thô & Hoàn Thiện CĐT'
};

let currentAlbumKey = '';
let currentAlbumIndex = 0;
let currentImageList = [];
let currentImageIndex = 0;
let currentFallbackTitle = '';

function showModalElement() {
    const elModal = document.getElementById('albumLightboxModal');
    if (!elModal) return;
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        try {
            let modal = bootstrap.Modal.getInstance(elModal);
            if (!modal) {
                modal = new bootstrap.Modal(elModal);
            }
            modal.show();
            return;
        } catch (err) {
            console.warn('Bootstrap modal instance error, falling back to manual display:', err);
        }
    }
    
    // Bulletproof manual display fallback
    elModal.style.display = 'block';
    elModal.classList.add('show');
    document.body.classList.add('modal-open');
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.onclick = closeModalElement;
        document.body.appendChild(backdrop);
    }
}

function closeModalElement() {
    const elModal = document.getElementById('albumLightboxModal');
    if (elModal) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            try {
                let modal = bootstrap.Modal.getInstance(elModal);
                if (modal) {
                    modal.hide();
                    return;
                }
            } catch(e) {}
        }
        elModal.style.display = 'none';
        elModal.classList.remove('show');
    }
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
}

function openAlbumLightbox(zoneKey, startIndex) {
    startIndex = startIndex || 0;
    if (typeof GALLERY_DATA === 'undefined' || !GALLERY_DATA || !GALLERY_DATA[zoneKey]) {
        console.error('GALLERY_DATA or zoneKey missing:', zoneKey);
        return;
    }
    
    currentAlbumKey = zoneKey;
    currentAlbumIndex = Math.max(0, Math.min(startIndex, GALLERY_DATA[zoneKey].length - 1));
    
    updateAlbumDisplay();
    showModalElement();
}

function openSingleImageModal(imgSrc, title, customList, customIndex, customTitles) {
    currentFallbackTitle = title || 'Phóng To Hình Ảnh HD';
    currentTitlesList = Array.isArray(customTitles) ? customTitles : [];
    
    if (Array.isArray(customList) && customList.length > 0) {
        currentImageList = customList;
        currentImageIndex = typeof customIndex === 'number' ? customIndex : customList.indexOf(imgSrc);
    } else {
        // Collect all images from GALLERY_DATA or find matching key
        let found = false;
        if (typeof GALLERY_DATA !== 'undefined' && GALLERY_DATA) {
            for (let key in GALLERY_DATA) {
                if (Array.isArray(GALLERY_DATA[key]) && GALLERY_DATA[key].includes(imgSrc)) {
                    currentImageList = GALLERY_DATA[key];
                    currentImageIndex = GALLERY_DATA[key].indexOf(imgSrc);
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            // Build list of all 25 sketch images if it is a sketch
            const sketches = Array.from({length: 25}, (_, i) => `assets/gallery/phac-thao-mat-bang/phac-thao-mat-bang_${(i+1).toString().padStart(2, '0')}.jpg`);
            if (sketches.includes(imgSrc)) {
                currentImageList = sketches;
                currentImageIndex = sketches.indexOf(imgSrc);
            } else {
                currentImageList = [imgSrc];
                currentImageIndex = 0;
            }
        }
    }
    
    if (currentImageIndex < 0) currentImageIndex = 0;
    currentAlbumKey = 'CUSTOM_LIST';
    updateCustomModalDisplay();
    showModalElement();
}

function updateCustomModalDisplay() {
    if (!currentImageList || currentImageList.length === 0) return;
    
    const imgSrc = currentImageList[currentImageIndex];
    const elImg = document.getElementById('albumLightboxImg');
    const elTitle = document.getElementById('albumLightboxTitle');
    const elCounter = document.getElementById('albumLightboxCounter');
    const elThumbnails = document.getElementById('albumLightboxThumbnails');
    
    // Determine active title for current image
    let activeTitle = currentFallbackTitle;
    if (currentTitlesList && currentTitlesList[currentImageIndex]) {
        activeTitle = currentTitlesList[currentImageIndex];
    }
    
    if (elImg) elImg.src = imgSrc;
    if (elTitle) elTitle.innerHTML = `<i class="bi bi-images me-2 text-warning"></i>${activeTitle}`;
    if (elCounter) elCounter.innerText = `Ảnh ${currentImageIndex + 1} / ${currentImageList.length}`;
    
    if (elThumbnails && currentImageList.length > 1) {
        elThumbnails.innerHTML = currentImageList.map((src, idx) => `
            <img src="${src}" 
                 alt="Thumb ${idx + 1}" 
                 onclick="jumpToCustomIndex(${idx})"
                 style="height: 56px; width: 80px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid ${idx === currentImageIndex ? '#ffd166' : 'transparent'}; opacity: ${idx === currentImageIndex ? '1' : '0.6'}; transition: all 0.2s ease;">
        `).join('');
    } else if (elThumbnails) {
        elThumbnails.innerHTML = '';
    }
}

function jumpToCustomIndex(idx) {
    currentImageIndex = idx;
    updateCustomModalDisplay();
}

function updateAlbumDisplay() {
    if (!currentAlbumKey || typeof GALLERY_DATA === 'undefined' || !GALLERY_DATA[currentAlbumKey]) return;
    
    const images = GALLERY_DATA[currentAlbumKey];
    if (!images || images.length === 0) return;
    
    const imgSrc = images[currentAlbumIndex];
    const zoneTitle = ZONE_TITLES[currentAlbumKey] || 'Bộ Sưu Tập Phối Cảnh Dự Án';
    
    const elImg = document.getElementById('albumLightboxImg');
    const elTitle = document.getElementById('albumLightboxTitle');
    const elCounter = document.getElementById('albumLightboxCounter');
    const elThumbnails = document.getElementById('albumLightboxThumbnails');
    
    if (elImg) elImg.src = imgSrc;
    if (elTitle) elTitle.innerHTML = `<i class="bi bi-images me-2 text-warning"></i>${zoneTitle}`;
    if (elCounter) elCounter.innerText = `Ảnh ${currentAlbumIndex + 1} / ${images.length}`;
    
    if (elThumbnails) {
        elThumbnails.innerHTML = images.map((src, idx) => `
            <img src="${src}" 
                 alt="Thumb ${idx + 1}" 
                 onclick="jumpToAlbumIndex(${idx})"
                 style="height: 56px; width: 80px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid ${idx === currentAlbumIndex ? '#ffd166' : 'transparent'}; opacity: ${idx === currentAlbumIndex ? '1' : '0.6'}; transition: all 0.2s ease;">
        `).join('');
    }
}

function prevAlbumImage() {
    if (currentAlbumKey === 'CUSTOM_LIST' && currentImageList.length > 0) {
        const total = currentImageList.length;
        currentImageIndex = (currentImageIndex - 1 + total) % total;
        updateCustomModalDisplay();
        return;
    }
    if (!currentAlbumKey || !GALLERY_DATA[currentAlbumKey]) return;
    const total = GALLERY_DATA[currentAlbumKey].length;
    currentAlbumIndex = (currentAlbumIndex - 1 + total) % total;
    updateAlbumDisplay();
}

function nextAlbumImage() {
    if (currentAlbumKey === 'CUSTOM_LIST' && currentImageList.length > 0) {
        const total = currentImageList.length;
        currentImageIndex = (currentImageIndex + 1) % total;
        updateCustomModalDisplay();
        return;
    }
    if (!currentAlbumKey || !GALLERY_DATA[currentAlbumKey]) return;
    const total = GALLERY_DATA[currentAlbumKey].length;
    currentAlbumIndex = (currentAlbumIndex + 1) % total;
    updateAlbumDisplay();
}

function jumpToAlbumIndex(idx) {
    currentAlbumIndex = idx;
    updateAlbumDisplay();
}

// Global window binding
if (typeof window !== 'undefined') {
    window.openAlbumLightbox = openAlbumLightbox;
    window.openSingleImageModal = openSingleImageModal;
    window.prevAlbumImage = prevAlbumImage;
    window.nextAlbumImage = nextAlbumImage;
    window.jumpToAlbumIndex = jumpToAlbumIndex;
    window.jumpToCustomIndex = jumpToCustomIndex;
    window.closeModalElement = closeModalElement;
}

// Keyboard shortcuts & close triggers
document.addEventListener('keydown', (e) => {
    const elModal = document.getElementById('albumLightboxModal');
    if (elModal && (elModal.classList.contains('show') || elModal.style.display === 'block')) {
        if (e.key === 'ArrowLeft') prevAlbumImage();
        if (e.key === 'ArrowRight') nextAlbumImage();
        if (e.key === 'Escape') closeModalElement();
    }
});
