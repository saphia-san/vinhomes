/* =============================================================
   MODULE TẠO & XUẤT ẢNH BÁO GIÁ (EXPORT QUOTATION CARD MODULE)
   Dự án: Vinhomes Sài Gòn Park
   =============================================================*/

var currentExportSData = null;

/**
 * Mở modal tùy chỉnh thông tin báo giá trước khi tải ảnh
 */
function openExportModal(S) {
    currentExportSData = S || window.lastResultS || (typeof lastResultS !== 'undefined' ? lastResultS : null);
    if (!currentExportSData) {
        alert('Vui lòng chọn căn hộ và bấm Tính Toán trước khi xuất ảnh báo giá!');
        return;
    }

    let modalEl = document.getElementById('exportCardModal');
    if (!modalEl) {
        createExportModalHTML();
        modalEl = document.getElementById('exportCardModal');
    }

    updateQuotationPreview();

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    } else {
        modalEl.style.display = 'block';
        modalEl.classList.add('show');
    }
}

/**
 * Cập nhật xem trước ảnh báo giá đầy đủ thông tin chi tiết
 */
function updateQuotationPreview() {
    const S = currentExportSData;
    if (!S) return;

    const saleName = document.getElementById('exportSaleName') ? document.getElementById('exportSaleName').value : 'Chuyên Viên Tư Vấn';
    const salePhone = document.getElementById('exportSalePhone') ? document.getElementById('exportSalePhone').value : '0901 234 567';
    const customerName = document.getElementById('exportCustomerName') ? document.getElementById('exportCustomerName').value : 'Quý Khách Hàng';
    const theme = document.getElementById('exportTheme') ? document.getElementById('exportTheme').value : 'gold';

    const container = document.getElementById('quotationCardPreview');
    if (!container) return;

    const fmt = (v) => (v || 0).toLocaleString('vi-VN');
    const fmtD = (d) => {
        if (!d) return '—';
        if (typeof fmtDate === 'function') return fmtDate(d);
        if (d instanceof Date) return d.toLocaleDateString('vi-VN');
        return d.toString();
    };

    const methodLabel = S.paymentMethod === 'own-early' ? '💰 Vốn Tự Có – Thanh Toán Sớm 100%'
        : S.paymentMethod === 'own-normal' ? '📋 Vốn Tự Có – Thanh Toán Theo Tiến Độ Thường'
            : '🏦 Vay Ngân Hàng Hỗ Trợ Lãi Suất 0%';

    const isWhite = theme === 'white';
    const bgStyle = isWhite
        ? 'background: #ffffff; color: #0f172a;'
        : theme === 'dark'
            ? 'background: linear-gradient(145deg, #061a15 0%, #0d2e26 100%); color: #ffffff;'
            : 'background: linear-gradient(145deg, #09211a 0%, #0d2e26 50%, #051410 100%); color: #ffffff;';

    const goldColor = isWhite ? '#b45309' : '#ffd166';
    const textColor = isWhite ? '#0f172a' : '#ffffff';
    const mutedColor = isWhite ? '#475569' : '#cbd5e1';
    const cardBg = isWhite ? '#f8fafc' : 'rgba(255,255,255,0.05)';
    const cardBorder = isWhite ? '1px solid #e2e8f0' : '1px solid rgba(255,209,102,0.2)';
    const tableHeaderBg = isWhite ? '#0d2e26' : 'rgba(255,209,102,0.15)';
    const tableHeaderColor = isWhite ? '#ffffff' : '#ffd166';

    const todayStr = new Date().toLocaleDateString('vi-VN');

    // 1. Render Chi tiết bóc tách (Đất & Xây)
    const PA = S.PA;
    let breakdownHTML = '';
    if (PA && PA.p_const > 0) {
        breakdownHTML = `
        <div style="background:${cardBg}; border:${cardBorder}; border-radius:12px; padding:16px; margin-bottom:20px;">
            <div style="font-weight:800; font-size:0.95rem; color:${goldColor}; margin-bottom:12px;">
                ❖ BÓC TÁCH CHI TIẾT GIÁ BẤT ĐỘNG SẢN (ĐẤT & XÂY DỰNG)
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; font-size:0.85rem;">
                <div style="background:${isWhite ? '#ffffff' : 'rgba(212,175,55,0.08)'}; padding:12px; border-radius:8px; border:${cardBorder};">
                    <div style="font-weight:800; color:${isWhite ? '#b45309' : '#ffd166'}; margin-bottom:6px;">📍 PHẦN TIỀN ĐẤT</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Giá Đất (chưa VAT):</span><strong>${fmt(PA.p_land)} VNĐ</strong></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>VAT Đất (10%):</span><strong>${fmt(PA.vat_land)} VNĐ</strong></div>
                    <div style="display:flex; justify-content:space-between; border-top:1px dashed ${mutedColor}; padding-top:6px; font-weight:800; color:${isWhite ? '#b45309' : '#ffd166'};">
                        <span>TỔNG TIỀN ĐẤT (gồm VAT):</span><span>${fmt(PA.land_total)} VNĐ</span>
                    </div>
                </div>
                <div style="background:${isWhite ? '#ffffff' : 'rgba(52,211,153,0.08)'}; padding:12px; border-radius:8px; border:${cardBorder};">
                    <div style="font-weight:800; color:${isWhite ? '#047857' : '#6ee7b7'}; margin-bottom:6px;">🛠️ PHẦN TIỀN XÂY DỰNG</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Giá Xây dựng (chưa VAT):</span><strong>${fmt(PA.p_const)} VNĐ</strong></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>VAT Xây dựng (10%):</span><strong>${fmt(PA.vat_const)} VNĐ</strong></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>Kinh phí bảo trì (KPBT 0.5%):</span><strong>${fmt(PA.kpbt)} VNĐ</strong></div>
                    <div style="display:flex; justify-content:space-between; border-top:1px dashed ${mutedColor}; padding-top:6px; font-weight:800; color:${isWhite ? '#047857' : '#6ee7b7'};">
                        <span>TỔNG TIỀN XÂY + KPBT:</span><span>${fmt(PA.const_total + PA.kpbt)} VNĐ</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // 2. Render Chi tiết Chiết khấu
    const ckDetails = S.ckDetails || [];
    let ckRowsHTML = '';
    if (ckDetails.length > 0) {
        ckRowsHTML = ckDetails.map(c => `
            <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:0.83rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>• ${c.label}:</span>
                <strong style="color:${isWhite ? '#16a34a' : '#4ade80'};">${c.valStr || 'Chiết khấu'}</strong>
            </div>
        `).join('');
    } else {
        ckRowsHTML = `<div style="font-size:0.83rem; color:${mutedColor};">• Ưu đãi niêm yết theo CSBH CĐT</div>`;
    }

    // 3. Render Bảng Lịch Thanh Toán
    const stages = S.stages || [];
    let scheduleRowsHTML = '';
    if (stages.length > 0) {
        scheduleRowsHTML = stages.map(s => `
            <tr style="border-bottom: 1px solid ${isWhite ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}; font-size:0.82rem;">
                <td style="padding:7px 10px; font-weight:700; color:${goldColor};">Đợt ${s.no} (${s.label})</td>
                <td style="padding:7px 10px;">${fmtD(s.date)}</td>
                <td style="padding:7px 10px; text-align:right; font-weight:600;">${fmt(s.gross)} VNĐ</td>
            </tr>
        `).join('');
    }

    container.innerHTML = `
<div id="quotationRenderCapture" style="width:760px; padding:36px; ${bgStyle} font-family:'Plus Jakarta Sans', sans-serif; border-radius:20px; border:3px solid ${goldColor}; box-shadow:0 20px 60px rgba(0,0,0,0.6); margin:0 auto; box-sizing:border-box;">
    
    <!-- Header Banner Logo & Tên Dự Án -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid ${goldColor}; padding-bottom:20px; margin-bottom:24px;">
        <div>
            <div style="font-size:1.6rem; font-weight:900; color:${goldColor}; letter-spacing:1.5px; text-transform:uppercase;">VINHOMES SÀI GÒN PARK</div>
            <div style="font-size:0.88rem; font-weight:700; color:${textColor}; margin-top:4px;">BẢNG PHƯƠNG ÁN TÀI CHÍNH MUA BẤT ĐỘNG SẢN CHÍNH THỨC</div>
            <div style="font-size:0.78rem; color:${mutedColor}; margin-top:2px;">Áp dụng CSBH V08 CĐT Vingroup · Ngày lập: ${todayStr}</div>
        </div>
        <div style="background:linear-gradient(135deg, #ffd166 0%, #f3a83b 100%); color:#0d2e26; font-size:1.35rem; font-weight:900; padding:10px 22px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.3); text-align:center;">
            <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; opacity:0.85;">MÃ CĂN HỘ</div>
            ${S.macan || 'AS72-24'}
        </div>
    </div>

    <!-- Khung Thông Tin Khách Hàng & Sale -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
        <div style="background:${cardBg}; padding:14px 18px; border-radius:12px; border:${cardBorder}; border-left:4px solid ${goldColor};">
            <div style="font-size:0.78rem; color:${mutedColor}; text-transform:uppercase; font-weight:700;">KÍNH GỬI QUÝ KHÁCH HÀNG</div>
            <div style="font-size:1.2rem; font-weight:900; color:${goldColor}; margin-top:2px;">${customerName}</div>
        </div>
        <div style="background:${cardBg}; padding:14px 18px; border-radius:12px; border:${cardBorder}; border-left:4px solid #34d399;">
            <div style="font-size:0.78rem; color:${mutedColor}; text-transform:uppercase; font-weight:700;">CHUYÊN VIÊN TƯ VẤN BẤT ĐỘNG SẢN</div>
            <div style="font-size:1.05rem; font-weight:800; color:${textColor}; margin-top:2px;">${saleName}</div>
            <div style="font-size:0.92rem; font-weight:700; color:${goldColor};">📞 Hotline: ${salePhone}</div>
        </div>
    </div>

    <!-- Thông Tin Sản Phẩm & Giá Niêm Yết -->
    <div style="background:${cardBg}; padding:18px; border-radius:12px; border:${cardBorder}; margin-bottom:20px;">
        <div style="font-size:0.95rem; font-weight:800; color:${goldColor}; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            📌 THÔNG TIN CHI TIẾT THỬA ĐẤT / CĂN HỘ
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:0.88rem;">
            <div>Mã Căn Hộ: <strong style="color:${goldColor}; font-size:0.95rem;">${S.macan}</strong></div>
            <div>Loại Hình Sản Phẩm: <strong style="color:${textColor};">${S.typeLabel}</strong></div>
            <div>Giá Niêm Yết Gốc (chưa VAT): <strong style="color:${textColor}; font-size:0.95rem;">${fmt(S.propValue)} VNĐ</strong></div>
            <div>Phương Thức Thanh Toán: <strong style="color:${goldColor};">${methodLabel}</strong></div>
        </div>
    </div>

    ${breakdownHTML}

    <!-- Tổng Hợp Ưu Đãi Chiết Khấu -->
    <div style="background:${cardBg}; padding:18px; border-radius:12px; border:${cardBorder}; margin-bottom:20px;">
        <div style="font-size:0.95rem; font-weight:800; color:${goldColor}; margin-bottom:10px;">
            🎁 CÁC KHOẢN CHIẾT KHẤU & ƯU ĐÃI ĐƯỢC HƯỞNG
        </div>
        ${ckRowsHTML}
        <div style="display:flex; justify-content:space-between; margin-top:10px; padding-top:10px; border-top:1.5px solid ${goldColor}; font-size:0.95rem; font-weight:900;">
            <span>TỔNG TIỀN CHIẾT KHẤU TIẾT KIỆM:</span>
            <span style="color:${isWhite ? '#16a34a' : '#34d399'};">${fmt(S.totalCkAll)} VNĐ (${S.ckPct.toFixed(2)}%)</span>
        </div>
    </div>

    <!-- Tổng Báo Giá & Nộp Tiền -->
    <div style="background:linear-gradient(135deg, rgba(255,209,102,0.18) 0%, rgba(212,175,55,0.28) 100%); border:2px solid ${goldColor}; padding:20px; border-radius:14px; margin-bottom:24px; text-align:center;">
        <div style="font-size:0.88rem; font-weight:800; color:${mutedColor}; text-transform:uppercase; letter-spacing:0.5px;">TỔNG GIÁ TRỊ HỢP ĐỒNG CUỐI CÙNG (GỒM VAT + KPBT)</div>
        <div style="font-size:2.2rem; font-weight:900; color:${goldColor}; margin:8px 0; letter-spacing:1px;">${fmt(S.grandTotal)} VNĐ</div>
        <div style="display:flex; justify-content:center; gap:24px; font-size:0.88rem; color:${textColor}; font-weight:700; margin-top:8px;">
            <div>• Vốn tự có trả CĐT: <span style="color:${goldColor};">${fmt(S.totalKHtoCDT)} VNĐ</span></div>
            ${S.actualBankAmt > 0 ? `<div>• Ngân hàng giải ngân HTLS: <span style="color:#60a5fa;">${fmt(S.actualBankAmt)} VNĐ</span></div>` : ''}
        </div>
    </div>

    <!-- Bảng Lịch Thanh Toán Chi Tiết Theo Đợt -->
    ${scheduleRowsHTML ? `
    <div style="background:${cardBg}; padding:18px; border-radius:12px; border:${cardBorder}; margin-bottom:24px;">
        <div style="font-size:0.95rem; font-weight:800; color:${goldColor}; margin-bottom:12px;">
            📅 BẢNG LỊCH THANH TOÁN TIẾN ĐỘ CHÍNH THỨC
        </div>
        <table style="width:100%; border-collapse:collapse; text-align:left;">
            <thead>
                <tr style="background:${tableHeaderBg}; color:${tableHeaderColor}; font-size:0.82rem; font-weight:800; text-transform:uppercase;">
                    <th style="padding:9px 10px; border-radius:6px 0 0 6px;">Đợt Thanh Toán</th>
                    <th style="padding:9px 10px;">Hạn Thanh Toán</th>
                    <th style="padding:9px 10px; text-align:right; border-radius:0 6px 6px 0;">Số Tiền Nộp (VNĐ)</th>
                </tr>
            </thead>
            <tbody>
                ${scheduleRowsHTML}
            </tbody>
        </table>
    </div>` : ''}

    <!-- Footer Cam Kết & Chữ Ký -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1.5px solid ${goldColor}; padding-top:20px; font-size:0.78rem; color:${mutedColor};">
        <div>
            <div style="font-weight:700; color:${textColor};">Vinhomes Sài Gòn Park – Đô Thị Tri Thức 1.080 ha</div>
            <div>Báo giá mang tính chất minh họa phương án tài chính chuẩn xác.</div>
        </div>
        <div style="text-align:right;">
            <div style="font-weight:800; color:${goldColor}; font-size:0.85rem;">CẢM ƠN QUÝ KHÁCH HÀNG!</div>
            <div>Hotline hỗ trợ 24/7: ${salePhone}</div>
        </div>
    </div>

</div>`;
}

/**
 * Xuất và Tải Ảnh Báo Giá PNG
 */
function downloadQuotationPNG() {
    const el = document.getElementById('quotationRenderCapture');
    if (!el) {
        alert('Không tìm thấy khung ảnh báo giá!');
        return;
    }

    if (typeof html2canvas === 'undefined') {
        alert('Thư viện html2canvas chưa được tải. Vui lòng kiểm tra kết nối mạng!');
        return;
    }

    const macan = (currentExportSData && currentExportSData.macan) ? currentExportSData.macan : 'CanHo';

    html2canvas(el, {
        scale: 2, // HD Quality
        useCORS: true,
        backgroundColor: null
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `BaoGia_VinhomesSaigonPark_${macan}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error('Error generating PNG card:', err);
        alert('Có lỗi khi tạo ảnh báo giá: ' + err.message);
    });
}

/**
 * Tạo Modal HTML cho Export Card
 */
function createExportModalHTML() {
    const modalHTML = `
<div class="modal fade" id="exportCardModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content" style="background:#0d2e26; color:#ffffff; border:1px solid #ffd166; border-radius:14px;">
            <div class="modal-header" style="border-bottom:1px solid rgba(255,209,102,0.3);">
                <h5 class="modal-title" style="color:#ffd166; font-weight:800;">
                    <i class="bi bi-image me-2"></i>Tùy Chỉnh & Xuất Ảnh Báo Giá PNG Cho Khách Hàng
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" onclick="closeExportModal()"></button>
            </div>
            <div class="modal-body">
                <div class="row g-3 mb-3">
                    <div class="col-md-4">
                        <label class="form-label text-warning small font-weight-bold">Tên Chuyên Viên Tư Vấn (Sale):</label>
                        <input type="text" id="exportSaleName" class="form-control form-control-sm" value="Nguyễn Văn A" oninput="updateQuotationPreview()">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label text-warning small font-weight-bold">Số Điện Thoại Sale:</label>
                        <input type="text" id="exportSalePhone" class="form-control form-control-sm" value="0901 234 567" oninput="updateQuotationPreview()">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label text-warning small font-weight-bold">Tên Khách Hàng:</label>
                        <input type="text" id="exportCustomerName" class="form-control form-control-sm" value="Anh/Chị Khách Hàng" oninput="updateQuotationPreview()">
                    </div>
                    <div class="col-md-12">
                        <label class="form-label text-warning small font-weight-bold">Tone Màu Thẻ Báo Giá:</label>
                        <select id="exportTheme" class="form-select form-select-sm" onchange="updateQuotationPreview()">
                            <option value="gold">🏆 Hoàng Gia Emerald Gold (Đen Tuyền & Vàng Kim - Khuyên Dùng)</option>
                            <option value="dark">🌿 Dark Emerald Classic (Xanh Lục Bảo)</option>
                            <option value="white">⚪ Clean White (Nền Trắng Nổi Bật)</option>
                        </select>
                    </div>
                </div>

                <div class="text-center mb-2 text-muted small"><i class="bi bi-eye me-1"></i>Xem trước Bản Phương Án Tài Chính Chi Tiết HD:</div>
                <div id="quotationCardPreview" style="overflow-x:auto; padding:10px; background:rgba(0,0,0,0.3); border-radius:10px;"></div>
            </div>
            <div class="modal-footer" style="border-top:1px solid rgba(255,209,102,0.3);">
                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal" onclick="closeExportModal()">Đóng</button>
                <button type="button" class="btn btn-warning btn-sm font-weight-bold" onclick="downloadQuotationPNG()">
                    <i class="bi bi-download me-1"></i>Tải Ảnh Báo Giá PNG (HD)
                </button>
            </div>
        </div>
    </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeExportModal() {
    const modalEl = document.getElementById('exportCardModal');
    if (modalEl) {
        modalEl.style.display = 'none';
        modalEl.classList.remove('show');
    }
}
