/* ==========================================================================
   INTERACTIVE MAP ENGINE & AUTO-ZOOM LOCATOR
   Vinhomes Sài Gòn Park - Ultra-Fast 60fps Pan & Zoom Map Engine
   ========================================================================== */

var currentMapScale = 1.0;
var currentMapX = 0;
var currentMapY = 0;
var isDraggingMap = false;
var dragStartX = 0;
var dragStartY = 0;
var activeUnitCode = null;

document.addEventListener('DOMContentLoaded', function () {
    initInteractiveMap();
});

/**
 * Khởi tạo bộ điều khiển bản đồ tương tác Pan-Zoom 60fps
 */
function initInteractiveMap() {
    var container = document.getElementById('mapViewerViewport');
    var wrapper = document.getElementById('mapWrapper');
    if (!container || !wrapper) return;

    // Lắng nghe sự kiện kéo rê (Drag to Pan)
    container.addEventListener('mousedown', function (e) {
        if (e.target.closest('#mapPinMarker') || e.target.closest('.map-control-btn')) return;
        isDraggingMap = true;
        dragStartX = e.clientX - currentMapX;
        dragStartY = e.clientY - currentMapY;
        container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', function (e) {
        if (!isDraggingMap) return;
        e.preventDefault();
        currentMapX = e.clientX - dragStartX;
        currentMapY = e.clientY - dragStartY;
        applyMapTransform(false);
    });

    window.addEventListener('mouseup', function (e) {
        if (isDraggingMap) {
            isDraggingMap = false;
            container.style.cursor = 'grab';
        }
    });

    // Khởi tạo danh sách các căn vào Dropdown Chọn Tọa Độ
    populateCalibratorDropdown();

    // Lắng nghe sự kiện Click để Hiệu Chỉnh Tọa Độ Trực Quan cho Saler / Admin
    container.addEventListener('click', function (e) {
        if (e.target.closest('#mapPinMarker') || e.target.closest('.map-control-btn')) return;
        
        // Tính toán tọa độ X, Y dạng % chuẩn trên ảnh Masterplan
        var img = wrapper.querySelector('img');
        if (!img) return;
        var containerRect = container.getBoundingClientRect();
        var containerW = containerRect.width;
        var containerH = containerRect.height;
        var imgAspect = 14044 / 9934;
        
        var renderedW = containerW;
        var renderedH = containerW / imgAspect;
        var offsetX = 0;
        var offsetY = (containerH - renderedH) / 2;
        if (renderedH > containerH) {
            renderedH = containerH;
            renderedW = containerH * imgAspect;
            offsetX = (containerW - renderedW) / 2;
            offsetY = 0;
        }

        // Tọa độ click trên container viewport
        var clickViewportX = e.clientX - containerRect.left;
        var clickViewportY = e.clientY - containerRect.top;

        // Quy đổi ngược về tọa độ Px trên ảnh không bị zoom
        var clickImgPxX = (clickViewportX - currentMapX) / currentMapScale;
        var clickImgPxY = (clickViewportY - currentMapY) / currentMapScale;

        var pctX = roundVal(((clickImgPxX - offsetX) / renderedW) * 100, 3);
        var pctY = roundVal(((clickImgPxY - offsetY) / renderedH) * 100, 3);

        var coordStr = '"x": ' + pctX + ', "y": ' + pctY;
        console.log("📍 Clicked Map Coordinate:", coordStr);

        // Lưu vào bộ nhớ Calibrator
        var sel = document.getElementById('calibratorUnitSelect');
        var selectedUnit = sel ? sel.value : null;

        if (selectedUnit) {
            USER_PICKED_COORDINATES[selectedUnit] = { x: pctX, y: pctY };
            
            // Cập nhật thẻ trạng thái
            var statusBox = document.getElementById('calibratorStatusText');
            if (statusBox) {
                statusBox.value = '✅ ' + selectedUnit + ': ' + coordStr + ' (Đã lưu vào danh sách)';
            }

            // Di chuyển ghim trực tiếp đến điểm vừa click
            var pin = document.getElementById('mapPinMarker');
            var pinText = document.getElementById('mapPinText');
            if (pin) {
                if (pinText) pinText.textContent = 'CĂN ' + selectedUnit;
                pin.style.display = 'block';
                pin.style.left = clickImgPxX + 'px';
                pin.style.top = clickImgPxY + 'px';
            }

            // Tự động chuyển Dropdown sang căn tiếp theo để người dùng click liên tục!
            if (sel && sel.selectedIndex < sel.options.length - 1) {
                sel.selectedIndex = sel.selectedIndex + 1;
            }
        } else {
            // Nếu chưa chọn căn, chỉ hiển thị tọa độ live
            var coordDisplay = document.getElementById('mapCoordDisplay');
            if (coordDisplay) {
                coordDisplay.innerHTML = '📍 Tọa độ click: <strong>' + coordStr + '</strong>';
                coordDisplay.style.display = 'block';
            }

            var pin = document.getElementById('mapPinMarker');
            if (pin) {
                pin.style.display = 'block';
                pin.style.left = clickImgPxX + 'px';
                pin.style.top = clickImgPxY + 'px';
            }
        }
    });

    // Lắng nghe sự kiện Cảm ứng di động (Touch Drag for Mobile)
    container.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
            isDraggingMap = true;
            dragStartX = e.touches[0].clientX - currentMapX;
            dragStartY = e.touches[0].clientY - currentMapY;
        }
    }, { passive: true });

    container.addEventListener('touchmove', function (e) {
        if (isDraggingMap && e.touches.length === 1) {
            currentMapX = e.touches[0].clientX - dragStartX;
            currentMapY = e.touches[0].clientY - dragStartY;
            applyMapTransform(false);
        }
    }, { passive: true });

    container.addEventListener('touchend', function () {
        isDraggingMap = false;
    });

    // Double tap/click to reset zoom
    container.addEventListener('dblclick', function () {
        resetMapZoom();
    });
}

/**
 * Cập nhật hiệu ứng biến hình CSS Transform
 */
function applyMapTransform(smooth) {
    var wrapper = document.getElementById('mapWrapper');
    var pin = document.getElementById('mapPinMarker');
    if (!wrapper) return;

    if (smooth) {
        wrapper.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    } else {
        wrapper.style.transition = 'none';
    }

    wrapper.style.transform = 'translate3d(' + currentMapX + 'px, ' + currentMapY + 'px, 0) scale(' + currentMapScale + ')';

    // Đảo ngược độ Zoom cho Thẻ Ghim: Zoom in sâu thì ghim tự thu nhỏ thành chấm kim cực nét không che mất thửa đất
    if (pin) {
        var pinScale = 0.85 / Math.pow(currentMapScale, 1.18);
        pin.style.transform = 'translate(-50%, -100%) scale(' + pinScale + ')';
        pin.style.transformOrigin = '50% 100%';
    }
}

/**
 * Tự động trượt mượt & Phóng to Camera (Auto-Zoom 550%) đến đúng vị trí Mã Căn
 */
function focusOnUnitOnMap(macan, autoScroll) {
    if (!macan) return;
    var coord = getUnitMapCoordinates(macan);
    if (!coord) return;

    activeUnitCode = coord.macan;

    var container = document.getElementById('mapViewerViewport');
    var wrapper = document.getElementById('mapWrapper');
    var pin = document.getElementById('mapPinMarker');
    var pinText = document.getElementById('mapPinText');

    if (!container || !wrapper || !pin) return;

    // Lấy thông tin căn
    var apt = null;
    if (typeof APARTMENT_DATA !== 'undefined') {
        apt = APARTMENT_DATA.find(function (a) { return String(a.macan).trim().toUpperCase() === coord.macan; });
    }

    var priceVal = apt ? (apt.allin || apt.priceBeforeVat || 0) : 0;
    var priceText = priceVal > 0 ? (' | ' + (priceVal / 1e9).toFixed(2) + ' Tỷ') : '';

    // Cập nhật vị trí ghim pin (Pixel chuẩn xác theo tỷ lệ khung hình ảnh)
    var containerW = container.clientWidth;
    var containerH = container.clientHeight;

    var imgElem = wrapper.querySelector('img');
    var renderedW = containerW;
    var renderedH = containerH;
    var offsetX = 0;
    var offsetY = 0;

    if (imgElem) {
        var imgNaturalW = imgElem.naturalWidth || 9363;
        var imgNaturalH = imgElem.naturalHeight || 6623;
        var containerAspect = containerW / containerH;
        var imgAspect = imgNaturalW / imgNaturalH;

        if (containerAspect > imgAspect) {
            renderedH = containerH;
            renderedW = containerH * imgAspect;
            offsetX = (containerW - renderedW) / 2;
            offsetY = 0;
        } else {
            renderedW = containerW;
            renderedH = containerW / imgAspect;
            offsetX = 0;
            offsetY = (containerH - renderedH) / 2;
        }
    }

    var targetPxX = offsetX + (coord.x / 100) * renderedW;
    var targetPxY = offsetY + (coord.y / 100) * renderedH;

    pin.style.left = targetPxX + 'px';
    pin.style.top = targetPxY + 'px';
    pin.style.display = 'block';

    if (pinText) {
        pinText.innerHTML = coord.macan + priceText;
    }

    // Đặt độ zoom cận cảnh 5.8x (580% zoom in)
    currentMapScale = coord.zoom || 5.8;

    currentMapX = (containerW / 2) - (targetPxX * currentMapScale);
    currentMapY = (containerH / 2) - (targetPxY * currentMapScale);

    applyMapTransform(true);

    // Trượt màn hình mượt xuống bản đồ nếu cần
    if (autoScroll !== false) {
        var sec = document.getElementById('sec-pdf-map');
        if (sec) {
            sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

/**
 * Tăng / Giảm Zoom thủ công bằng nút bấm kính lúp (Zoom về trung tâm khung nhìn)
 */
function adjustMapZoom(delta) {
    var container = document.getElementById('mapViewerViewport');
    var viewportW = container ? container.clientWidth : 800;
    var viewportH = container ? container.clientHeight : 500;

    var oldScale = currentMapScale;
    var newScale = Math.max(1.0, Math.min(8.0, currentMapScale + delta));
    if (newScale === oldScale) return;

    var zoomRatio = newScale / oldScale;
    currentMapX = (viewportW / 2) - ((viewportW / 2) - currentMapX) * zoomRatio;
    currentMapY = (viewportH / 2) - ((viewportH / 2) - currentMapY) * zoomRatio;
    currentMapScale = newScale;

    applyMapTransform(true);
}

/**
 * Đặt lại vị trí ban đầu (Reset View)
 */
function resetMapZoom() {
    currentMapScale = 1.0;
    currentMapX = 0;
    currentMapY = 0;
    applyMapTransform(true);

    var pin = document.getElementById('mapPinMarker');
    if (pin) pin.style.display = 'none';
}

/**
 * Tìm kiếm nhanh Mã căn trực tiếp trên Bản Đồ
 */
function filterMapUnitSearch(input) {
    var val = String(input.value || '').trim().toUpperCase();
    if (!val) return;

    // Nếu gõ được mã căn hợp lệ
    focusOnUnitOnMap(val, false);
}

/* Helper làm tròn số thập phân */
function roundVal(val, decimals) {
    var pow = Math.pow(10, decimals);
    return Math.round(val * pow) / pow;
}

/* ==========================================================================
   BẢNG CÔNG CỤ HIỆU CHỈNH TỌA ĐỘ DỄ DÀNG CHO SALER / USER
   ========================================================================== */

var USER_PICKED_COORDINATES = {};

function populateCalibratorDropdown() {
    var sel = document.getElementById('calibratorUnitSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Click chọn căn muốn gắn tọa độ --</option>';

    if (typeof EXACT_UNIT_MAP_COORDINATES !== 'undefined') {
        var keys = Object.keys(EXACT_UNIT_MAP_COORDINATES).sort();
        keys.forEach(function(k) {
            var opt = document.createElement('option');
            opt.value = k;
            opt.textContent = k + ' - ' + EXACT_UNIT_MAP_COORDINATES[k].name;
            sel.appendChild(opt);
        });
    }
}

function onCalibratorSelectUnit(unitCode) {
    if (!unitCode) return;
    var statusBox = document.getElementById('calibratorStatusText');
    if (statusBox) {
        statusBox.value = '👉 Đã chọn ' + unitCode + '. Hãy CLICK trên bản đồ để gắn vị trí!';
    }
    // Fly to current position if exists
    focusOnUnitOnMap(unitCode, '');
}

function copyAllPickedCoordinates() {
    var keys = Object.keys(USER_PICKED_COORDINATES);
    if (keys.length === 0) {
        alert('⚠️ Bạn chưa click chọn tọa độ căn nào!\nHãy chọn 1 căn trong danh sách ➔ Click bản đồ để gán tọa độ trước nhé.');
        return;
    }

    var textOut = JSON.stringify ? JSON.stringify(USER_PICKED_COORDINATES, null, 4) : '';

    if (navigator.clipboard) {
        navigator.clipboard.writeText(textOut);
    }

    alert('✅ ĐÃ COPY THÀNH CÔNG ' + keys.length + ' CĂN BẠN VỪA BẤM TỌA ĐỘ!\n\nHãy nhấn Ctrl + V (Dán) vào khung chat gửi cho tôi nhé!');
}
