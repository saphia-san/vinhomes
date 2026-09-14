/* =============================================================
   GIAO DIỆN & TƯƠNG TÁC NGƯỜI DÙNG (UI & RENDERING)
   Dự án: Vinhomes Sài Gòn Park
   Quản lý Tabs, Event Listeners, Render Kết quả, Bảng so sánh & Lịch sử
   =============================================================*/

let selectedApt = null;

function playYoutubeEmbedded(containerEl, videoId) {
    if (!containerEl) return;
    
    // Nếu mở trực tiếp file local (file://), trình duyệt chặn Referrer -> chuyển mở app YouTube
    if (window.location.protocol === 'file:') {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
        return;
    }

    // Khi đưa lên Web chính thức (GitHub Deploy / Server http/https), phát TRỰC TIẾP 100% tại chỗ & Ẩn Tiêu Đề Top Bar
    const origin = (window.location.origin && window.location.origin !== 'null') 
        ? encodeURIComponent(window.location.origin) 
        : '';
    const originParam = origin ? `&origin=${origin}` : '';

    containerEl.innerHTML = `
        <div class="position-relative w-100 rounded-4 overflow-hidden shadow-lg" style="aspect-ratio: 16/9; background:#000;">
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&cc_load_policy=0&cc_lang_pref=off&enablejsapi=1${originParam}"
                title="Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="no-referrer-when-downgrade"
                allowfullscreen
                style="position: absolute; top: -52px; left: 0; width: 100%; height: calc(100% + 58px); border:none; pointer-events:auto;">
            </iframe>
        </div>`;
}

function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme', 'theme-emerald-dark', 'dark-mode', 'theme-dark');
        body.classList.add('light-theme');
        try {
            localStorage.setItem('vhp_theme', 'light');
            localStorage.setItem('vinhomes_theme', 'light');
        } catch (e) { }
    } else {
        body.classList.remove('light-theme', 'theme-bloomberg-light', 'light-mode', 'theme-light');
        body.classList.add('dark-theme');
        try {
            localStorage.setItem('vhp_theme', 'dark');
            localStorage.setItem('vinhomes_theme', 'dark');
        } catch (e) { }
    }
    const isDark = body.classList.contains('dark-theme');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.innerHTML = isDark
            ? '<i class="bi bi-sun-fill me-1" style="color:#ffd166;"></i><span class="d-none d-sm-inline ms-1"> Giao Diện Sáng</span>'
            : '<i class="bi bi-moon-stars-fill me-1" style="color:#2563eb;"></i><span class="d-none d-sm-inline ms-1"> Giao Diện Tối</span>';
        btn.className = isDark
            ? 'btn btn-outline-warning rounded-3 px-3 py-2 fw-semibold'
            : 'btn btn-outline-secondary rounded-3 px-3 py-2 fw-semibold';
    }
    // ⚡ REAL-TIME RE-RENDER: Redraw charts instantly with new theme palette in 1ms!
    if (typeof reRenderAllActiveCharts === 'function') {
        try { reRenderAllActiveCharts(); } catch (e) { }
    }
}

function updateSignDateOptions() {
    const elStart = document.getElementById('startDate');
    const elSign = document.getElementById('signDate');
    if (!elStart || !elSign) return;

    let startDateStr = elStart.value;
    let tDate = (startDateStr && typeof parseDate === 'function') ? parseDate(startDateStr) : new Date();
    if (!tDate || isNaN(tDate.getTime())) tDate = new Date();

    const currentSelVal = elSign.value;
    let optionsHtml = '';

    for (let i = 0; i <= 15; i++) {
        let optDate = new Date(tDate.getTime() + i * 86400000);
        let dateStr = typeof fmtDate === 'function' ? fmtDate(optDate) : optDate.toLocaleDateString('vi-VN');

        let isSel = currentSelVal ? (currentSelVal === dateStr) : (i === 15);
        optionsHtml += `<option value="${dateStr}" ${isSel ? 'selected' : ''}>${dateStr}</option>`;
    }

    elSign.innerHTML = optionsHtml;
}

// --- DOM Event Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Flatpickr với hỗ trợ chọn năm trực tiếp
    const fpConfig = {
        dateFormat: 'd/m/Y',
        locale: 'vn',
        allowInput: false,
        yearSelectorType: 'dropdown'
    };

    if (typeof flatpickr !== 'undefined') {
        flatpickr('#startDate', {
            ...fpConfig,
            defaultDate: new Date(),
            onChange() { updateSignDateOptions(); },
            onReady(dates, dateStr, fp) {
                fp.calendarContainer.classList.add('fp-custom');
                updateSignDateOptions();
            }
        });
        flatpickr('#actualPaymentDate', {
            ...fpConfig,
            defaultDate: new Date(),
            onReady(dates, dateStr, fp) { fp.calendarContainer.classList.add('fp-custom'); }
        });
    }

    updateSignDateOptions();
    updateInterestSupportOptions();
    toggleBankFields();


});

// --- Tab Navigation ---
function showTab(name) {
    ['overview', 'input', 'result', 'loan', 'compare2'].forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) {
            if (t === name) {
                el.style.display = 'block';
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.classList.add('active', 'show');
            } else {
                el.style.display = 'none';
                el.style.opacity = '0';
                el.classList.remove('active', 'show');
            }
        }
        const btn = document.getElementById('tab-' + t + '-btn');
        if (btn) btn.classList.toggle('active', t === name);

        const mBtn = document.getElementById('tab-' + t + '-mobile-btn');
        if (mBtn) mBtn.classList.toggle('active', t === name);
    });
    if (name === 'compare2') {
        if (typeof initCompare2Tab === 'function') initCompare2Tab();
        if (typeof renderCompare2FullTab === 'function') renderCompare2FullTab();
    }

    // Smooth scroll to top of active tab content when switching tabs if scrolled down
    if (window.pageYOffset > 150) {
        const targetEl = document.getElementById('tab-' + name);
        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            const offset = window.innerWidth <= 991 ? 70 : 80;
            window.scrollTo({ top: Math.max(0, window.pageYOffset + rect.top - offset), behavior: 'smooth' });
        }
    }
}

function toggleBankFields() {
    const elMethod = document.getElementById('paymentMethod');
    const isBank = elMethod ? (elMethod.value === 'bank' || elMethod.value.startsWith('bank')) : false;
    const bankSec = document.getElementById('bankSection');
    if (bankSec) {
        if (isBank) {
            bankSec.style.display = 'block';
            bankSec.classList.remove('hidden-section');
        } else {
            bankSec.style.display = 'none';
            bankSec.classList.add('hidden-section');
        }
    }
}

function toggleVoucherInput() {
    const chk = document.getElementById('promo_voucher');
    const wrap = document.getElementById('voucherInputWrap');
    if (wrap) {
        wrap.style.display = (chk && chk.checked) ? 'block' : 'none';
    }
}
window.toggleVoucherInput = toggleVoucherInput;

function setVoucherPreset(amount) {
    const chk = document.getElementById('promo_voucher');
    const wrap = document.getElementById('voucherInputWrap');
    const input = document.getElementById('voucherAmount');
    if (chk) chk.checked = true;
    if (wrap) wrap.style.display = 'block';
    if (input) {
        input.value = amount.toLocaleString('vi-VN');
    }
    if (typeof calculate === 'function') calculate();
}
window.setVoucherPreset = setVoucherPreset;

function toggleFinVoucherInput() {
    const chk = document.getElementById('fin_promo_voucher');
    const wrap = document.getElementById('finVoucherInputWrap');
    if (wrap) {
        wrap.style.display = (chk && chk.checked) ? 'block' : 'none';
    }
}
window.toggleFinVoucherInput = toggleFinVoucherInput;

function toggleCmpVoucherInput(num) {
    const chk = document.getElementById('cmpVoucher' + num);
    const wrap = document.getElementById('cmpVoucherWrap' + num);
    if (wrap) {
        wrap.style.display = (chk && chk.checked) ? 'block' : 'none';
    }
}
window.toggleCmpVoucherInput = toggleCmpVoucherInput;

function setFinVoucherPreset(amount) {
    const chk = document.getElementById('fin_promo_voucher');
    const wrap = document.getElementById('finVoucherInputWrap');
    const input = document.getElementById('fin_voucherAmount');
    if (chk) chk.checked = true;
    if (wrap) wrap.style.display = 'block';
    if (input) {
        input.value = amount.toLocaleString('vi-VN');
    }
    if (typeof runFinancialMatcher === 'function') runFinancialMatcher();
}
window.setFinVoucherPreset = setFinVoucherPreset;

document.addEventListener('DOMContentLoaded', function () {
    toggleBankFields();
});

function onTypeChange() {
    const type = document.getElementById('apartmentType').value;
    const dtXayCol = document.getElementById('manualDtXayCol');
    if (dtXayCol) dtXayCol.style.display = (type === 'gianXay') ? 'block' : 'none';
    updateInterestSupportOptions();
}

function updateInterestSupportOptions() {
    const elType = document.getElementById('apartmentType');
    if (!elType) return;
    const type = elType.value;
    const plans = (type === 'finished')
        ? SALES_POLICY.interestSupport.finished
        : SALES_POLICY.interestSupport.roughAndGianXay;
    const elPlan = document.getElementById('interestSupportPlan');
    if (elPlan) {
        elPlan.innerHTML = plans.map((p, i) =>
            `<option value="${i}">${p.label}${p.extraDiscount > 0 ? ' (CK thêm ' + p.extraDiscount + '%)' : ''}</option>`
        ).join('');
    }
}

function formatNumberInput(el) {
    const raw = el.value.replace(/[^0-9]/g, '');
    if (raw) el.value = parseInt(raw, 10).toLocaleString('vi-VN');
}

function calcVoucherDisplay() {
    // Obsolete - keeping empty for backward compatibility
}

// --- Autocomplete & Apartment Selection ---
function onSearchInput(query) {
    const dd = document.getElementById('searchDropdown');
    const q = query.trim().toUpperCase().replace(/\s+/g, '');
    const elType = document.getElementById('apartmentType');

    if (!q || typeof APARTMENT_DATA === 'undefined') {
        if (dd) dd.style.display = 'none';
        clearSelected();
        return;
    }

    const data = (typeof APARTMENT_DATA !== 'undefined' ? APARTMENT_DATA : []);
    const exactMatch = data.find(a => a.macan.toUpperCase().replace(/\s+/g, '') === q);

    if (exactMatch) {
        selectApt(exactMatch.macan);
        if (dd) dd.style.display = 'none';
        return;
    }

    const matches = data.filter(a =>
        a.macan.toUpperCase().replace(/\s+/g, '').includes(q)
    ).slice(0, 8);

    if (!matches.length) {
        if (dd) dd.style.display = 'none';
        selectedApt = null;
        if (document.getElementById('propInfoBox')) document.getElementById('propInfoBox').style.display = 'none';
        if (document.getElementById('manualInputWrap')) document.getElementById('manualInputWrap').style.display = 'block';
        if (elType) elType.disabled = false;
        onTypeChange();
        return;
    }

    const typeLabel = { rough: 'Thô', finished: 'Hoàn thiện', gianXay: 'Giãn xây' };
    dd.innerHTML = matches.map(a => {
        return `
        <div class="search-item" onclick="selectApt('${a.macan}')">
            <span class="search-item-code" style="font-weight:800; font-size:0.95rem;">${a.macan}</span>
            <span class="search-item-meta ms-2" style="font-size:0.8rem;">${typeLabel[a.type]} &bull; ${fmt(a.priceBeforeVat)} VNĐ ${a.daBan ? '<span class="badge bg-secondary ms-1">Đã bán</span>' : '<span class="badge bg-success ms-1">Đang mở bán</span>'}</span>
        </div>`;
    }).join('');
    dd.style.display = 'block';
}



function selectApt(macan) {
    const data = (typeof APARTMENT_DATA !== 'undefined' ? APARTMENT_DATA : []);
    const clean = (macan || '').trim().toUpperCase().replace(/\s+/g, '');
    const apt = data.find(a => a.macan.toUpperCase().replace(/\s+/g, '') === clean || a.macan === macan);
    if (!apt) return;

    selectedApt = apt;
    window.selectedApt = apt;

    if (document.getElementById('searchApt')) document.getElementById('searchApt').value = apt.macan;
    if (document.getElementById('searchDropdown')) document.getElementById('searchDropdown').style.display = 'none';

    if (document.getElementById('manualPrice')) document.getElementById('manualPrice').value = fmt(apt.priceBeforeVat);
    if (document.getElementById('manualDtDat')) document.getElementById('manualDtDat').value = apt.dtDat;
    if (document.getElementById('manualDtXay')) document.getElementById('manualDtXay').value = apt.dtXay;

    const typeLabel = { rough: 'Thô', finished: 'Hoàn thiện', gianXay: 'Giãn xây' };
    if (document.getElementById('selectedCanLabel')) document.getElementById('selectedCanLabel').textContent = apt.macan;
    let detail = `<span class="apt-meta-text">${typeLabel[apt.type] || 'Hoàn thiện'} &nbsp;|&nbsp; DT Đất: ${apt.dtDat} m² &nbsp;|&nbsp; DT Xây: ${apt.dtXay} m² &nbsp;|&nbsp; ${apt.daBan ? '<span class="badge bg-secondary fw-bold">Đã bán</span>' : '<span class="badge bg-success fw-bold">Đang mở bán</span>'}</span><br>`;
    detail += `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-1">`;
    detail += `<div><span class="apt-price-label" style="font-size:0.9rem;">Giá trước VAT: </span><strong class="apt-price-val" style="font-size:1.15rem; font-weight:800;">${fmt(apt.priceBeforeVat)} VNĐ</strong></div>`;
    detail += `<button type="button" class="btn btn-sm btn-warning fw-bold px-3 shadow-sm" onclick="openLocationSpotlight('${apt.macan}')"><i class="bi bi-pin-map-fill me-1"></i>Xem Vị Trí Căn Này</button>`;
    detail += `</div>`;

    if (document.getElementById('selectedCanDetail')) document.getElementById('selectedCanDetail').innerHTML = detail;
    if (document.getElementById('propInfoBox')) document.getElementById('propInfoBox').style.display = 'block';

    const elType = document.getElementById('apartmentType');
    if (elType) {
        elType.value = apt.type;
        elType.disabled = true; // Khóa chọn tính chất bàn giao khi đã chọn mã căn
    }

    if (document.getElementById('manualInputWrap')) document.getElementById('manualInputWrap').style.display = 'none';

    onTypeChange();
    toggleBankFields();
}

function clearSelected() {
    selectedApt = null;
    if (document.getElementById('searchApt')) document.getElementById('searchApt').value = '';
    if (document.getElementById('propInfoBox')) document.getElementById('propInfoBox').style.display = 'none';
    if (document.getElementById('manualInputWrap')) document.getElementById('manualInputWrap').style.display = 'block';

    const elType = document.getElementById('apartmentType');
    if (elType) {
        elType.disabled = false; // Mở lại cho chọn khi ở chế độ nhập thủ công
    }

    onTypeChange();
}

// Helper định dạng nhãn đợt thanh toán (Đặt cọc không có ngoặc, T+X ngày có ngoặc)
function formatStageDisplay(s) {
    if (!s || !s.label) return '';
    let label = String(s.label).trim();

    // 1) Đặt cọc -> KHÔNG để trong ngoặc
    if (s.no === 1 || label.toLowerCase().includes('đặt cọc')) {
        return `<span class="badge-stage ${s.badge}">Đặt cọc</span>`;
    }

    // 2) Nếu nhãn chứa T+X -> CHỈ loại này mới bỏ vào ngoặc (T + X ngày)
    let tMatch = label.match(/\(?(T\+\d+)\)?/i);
    if (tMatch) {
        const tNum = tMatch[1].replace(/T\+/i, '');
        return `<span class="badge-stage ${s.badge}">(T + ${tNum} ngày)</span>`;
    }

    // 3) Nếu nhãn đã có ngoặc sẵn -> giữ nguyên, không bọc thêm
    if (label.startsWith('(') && label.endsWith(')')) {
        // Bỏ ngoặc ra để hiển thị không có ngoặc
        label = label.slice(1, -1).trim();
        return `<span class="badge-stage ${s.badge}">${label}</span>`;
    }

    // 4) Tất cả nhãn khác: Ký HĐMB, Thông báo CĐT, Nhận bàn giao, Sổ hồng, v.v. -> KHÔNG ngoặc
    return `<span class="badge-stage ${s.badge}">${label}</span>`;
}

// --- Render Result Tab ---
function renderResult(stages, ckDetails, S, comparisonHTML = '') {
    window.lastResultS = S;
    const {
        propValue, typeLabel, paymentMethod, ckPct, ckVnd, appliedVoucher, totalVoucherApplied,
        totalCk, totalCkAll, cfDiscount, actualPaymentDate, cfDetailsStr,
        totalGross, totalKHtoCDT, totalKHtoBank, grandTotal, loanData, showBankSim, PA
    } = S;

    const safeCkPct = (typeof ckPct === 'number' && !isNaN(ckPct)) ? ckPct.toFixed(1) : '0.0';

    const aptCodeStr = S.macan ? S.macan : 'Nhập thủ công';

    let methodDetailText = '';
    if (paymentMethod === 'own-early') {
        methodDetailText = 'Thanh toán sớm';
    } else if (paymentMethod === 'own-normal') {
        methodDetailText = 'Vốn tự có – Tiến độ chuẩn';
    } else {
        const plans = (PA && PA.p_const > 0) ? ((SALES_POLICY && SALES_POLICY.interestSupport && SALES_POLICY.interestSupport.roughAndGianXay) || []) : ((SALES_POLICY && SALES_POLICY.interestSupport && SALES_POLICY.interestSupport.finished) || []);
        const plan = (plans && plans.length > 0) ? (plans[S.supportPlanIdx || 0] || plans[0]) : null;
        const planName = plan ? plan.label : 'HTLS 0%';
        methodDetailText = `Vay ngân hàng (${planName})`;
    }

    const methodLabel = methodDetailText;

    /* ---- Bảng lịch thanh toán ---- */
    const renderSingleRow = s => {
        const isStage1 = (s.no === 1 || (s.label && s.label.toLowerCase().includes('đặt cọc')));
        const rowClass = isStage1 ? 'class="row-stage-deposit"' : (s.voucherApplied > 0 ? 'style="background:rgba(255,209,102,0.06);"' : '');

        let subRowsHtml = '';
        if (s.subItems && s.subItems.length > 0) {
            let remV = s.voucherApplied || 0;
            subRowsHtml = s.subItems.map((sub, idx) => {
                const subVUse = Math.min(remV, sub.gross);
                remV -= subVUse;
                const subNet = Math.max(0, sub.gross - subVUse);
                const subVText = subVUse > 0 ? `<span style="color:#dc2626; font-weight:700;">– ${fmt(subVUse)}</span>` : '—';
                const subNetText = fmt(subNet);

                const subNote = (sub.note && sub.note !== '—') ? sub.note : (idx === 1 ? 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' : '—');

                return `
<tr class="sub-stage-row" style="background:rgba(0,0,0,0.015); font-size:0.85rem;">
    <td class="stage-col" style="padding-left:28px;"><span style="color:#f59e0b; font-weight:700; margin-right:4px;">└─</span>${sub.label}</td>
    <td class="date-col text-muted" style="opacity:0.6;">—</td>
    <td class="amount" style="font-weight:600;">${fmt(sub.gross)}</td>
    <td class="discount">${subVText}</td>
    <td class="net-amount">${subNetText}</td>
    <td style="font-size:0.78rem; opacity:0.85;">${subNote}</td>
</tr>`;
            }).join('');
        }

        const discountText = (s.voucherApplied > 0)
            ? `<span style="color:#dc2626; font-weight:700; font-size:0.92rem;">– ${fmt(s.voucherApplied)}</span>`
            : (s.ck > 0 ? `<span style="color:#dc2626; font-weight:700;">– ${fmt(s.ck)}</span>` : '—');

        const netCashText = fmt(s.net);
        const noteText = s.note || '';

        return `
<tr ${rowClass}>
    <td class="stage-col">Đợt ${s.no}&nbsp;${formatStageDisplay(s)}</td>
    <td class="date-col">${s.dateLabel || fmtDate(s.date)}</td>
    <td class="amount">${fmt(s.gross)}</td>
    <td class="discount" style="font-size:0.82rem;">${discountText}</td>
    <td class="net-amount">${netCashText}</td>
    <td style="font-size:0.78rem;color:var(--text-muted);">${noteText}</td>
</tr>
${subRowsHtml}`;
    };

    const stageRows = stages.isSplit
        ? `<tr class="split-stage-header" style="background:rgba(52,211,153,0.2); border-left:4px solid #34d399;">
    <td colspan="6" class="split-stage-title" style="color:#6ee7b7; font-weight:800; font-size:0.95rem; padding:12px 14px; letter-spacing:0.5px;">
        <i class="bi bi-geo-alt-fill me-2"></i>GIAI ĐOẠN 1: TIẾN ĐỘ THANH TOÁN TIỀN ĐẤT
    </td>
</tr>
${stages.landStages.map(renderSingleRow).join('')}
<tr class="split-stage-header" style="background:rgba(52,211,153,0.2); border-left:4px solid #34d399;">
    <td colspan="6" class="split-stage-title" style="color:#6ee7b7; font-weight:800; font-size:0.95rem; padding:12px 14px; letter-spacing:0.5px;">
        <i class="bi bi-tools me-2"></i>GIAI ĐOẠN 2: TIẾN ĐỘ THANH TOÁN XÂY DỰNG
    </td>
</tr>
${stages.constStages.map(renderSingleRow).join('')}`
        : stages.map(renderSingleRow).join('');

    const cfRow = cfDiscount > 0 ? `
<tr style="background:rgba(39,174,96,0.06);">
    <td colspan="3" style="color:#5dd88a;font-style:italic;">
        <i class="bi bi-lightning-fill me-1"></i>CK dòng tiền 11%/năm <br>
        <span style="font-size:0.75rem;">(Chi tiết sớm: ${cfDetailsStr.join(', ')})</span>
    </td>
    <td class="discount">–&nbsp;${fmt(cfDiscount)}</td>
    <td class="net-amount" colspan="2"></td>
</tr>` : '';

    const subtotalLabel = paymentMethod === 'bank'
        ? 'Vốn tự có KH thực trả CĐT'
        : 'Tổng KH trả cho CĐT';

    const subtotalGrossDisplay = paymentMethod === 'bank' ? '—' : fmt(totalGross);
    const subtotalNoteText = paymentMethod === 'bank' ? '(NH giải ngân 70%)' : '';

    const vSum = (totalVoucherApplied || appliedVoucher || stages.reduce((acc, s) => acc + (s.voucherApplied || 0) + (s.ck || 0), 0));
    const displayDiscountSum = vSum + (cfDiscount || 0);

    let html = `
<tr class="row-subtotal">
    <td colspan="2" style="color:#7ecfff;font-weight:700;">${subtotalLabel}</td>
    <td class="amount">${subtotalGrossDisplay}</td>
    <td class="discount">${displayDiscountSum > 0 ? '–&nbsp;' + fmt(displayDiscountSum) : '—'}</td>
    <td class="net-amount">${fmt(totalKHtoCDT)}</td>
    <td style="font-size:0.78rem;color:var(--text-muted);">${subtotalNoteText}</td>
</tr>`;

    const bankRow = loanData ? `
<tr class="row-bank">
    <td colspan="2" style="color:#85c1e9;font-weight:700;">
        <i class="bi bi-bank me-1"></i>Tổng trả nợ ngân hàng (gốc + lãi KH chịu)
        <span style="font-size:0.73rem;font-weight:400;color:var(--text-muted);">
            – ${loanData.annualRatePct}%/năm × ${loanData.termYears} năm
        </span>
    </td>
    <td class="amount">${fmt(loanData.principal)}</td>
    <td class="discount">—</td>
    <td class="net-amount">${fmt(loanData.totalKHPays)}</td>
    <td style="font-size:0.78rem;color:var(--text-muted);">KH trả dần ${loanData.termYears} năm</td>
</tr>` : '';

    const grandLabelText = (loanData && paymentMethod === 'bank')
        ? 'TỔNG CHI PHÍ KHÁCH HÀNG PHẢI TRẢ (Gốc + Lãi NH)'
        : 'TỔNG CHI PHÍ KHÁCH HÀNG PHẢI TRẢ';

    const grandNoteHtml = (loanData && paymentMethod === 'bank')
        ? `<div>Trả Ngân hàng (Gốc & Lãi): ${fmt(totalKHtoBank)} VNĐ</div>`
        : '';

    const grandRow = `
<tr class="row-grand">
    <td colspan="4" class="grand-title">
        ${grandLabelText}
    </td>
    <td class="net-amount text-end">
        ${fmt(grandTotal)} VNĐ
    </td>
    <td class="grand-note">
        ${grandNoteHtml}
    </td>
</tr>`;

    const deductTypeBadge = (d) => {
        if (d.deductType === 'price') return `<span class="badge-deduct badge-deduct-price">Trừ vào giá HĐ</span>`;
        if (d.deductType === 'cashback') return `<span class="badge-deduct badge-deduct-cashback">Hoàn tiền sau khi về ở</span>`;
        if (d.deductType === 'gift') return `<span class="badge-deduct badge-deduct-gift">Quà tặng / Voucher</span>`;
        if (d.deductType === 'voucher') return `<span class="badge-deduct badge-deduct-voucher">Trừ khi ký HĐMB</span>`;
        return '';
    };

    const ckRows = ckDetails.map(d => `
<tr>
    <td>${d.label}</td>
    <td class="text-end" style="color:${d.pct > 0 ? '#4ade80' : 'var(--text-muted)'};font-weight:700;">
        ${d.pct > 0 ? d.pct + '%' : '—'}
    </td>
    <td class="text-end" style="color:${d.vnd > 0 ? '#4ade80' : 'var(--text-muted)'};font-weight:700;">
        ${d.vnd > 0 ? fmt(d.vnd) + ' VNĐ' : '—'}
    </td>
    <td class="text-end" style="font-weight:800;color:#f3e5ab;">
        ${fmt(d.vnd)} VNĐ
    </td>
    <td class="text-center" style="white-space:nowrap;">${deductTypeBadge(d)}</td>
</tr>`).join('');

    const cfCkRow = cfDiscount > 0 ? `
<tr>
    <td>CK dòng tiền 11%/năm (tính theo số ngày thực tế từng đợt)</td>
    <td class="text-end" style="color:var(--text-muted);">—</td>
    <td class="text-end" style="color:var(--text-muted);">—</td>
    <td class="text-end" style="font-weight:700;color:#7ecfff;">${fmt(cfDiscount)} VNĐ</td>
    <td></td>
</tr>` : '';

    const elResult = document.getElementById('resultContent');
    if (!elResult) return;

    elResult.innerHTML = `
<div class="fade-in" id="result-container">

<!-- Banner Tên Căn & Phương Thức Thanh Toán -->
<div class="banner-custom-header mb-3" style="background: linear-gradient(135deg, #0d2e26 0%, #174e40 100%) !important; border: 1.5px solid rgba(255,209,102,0.4); border-left: 5px solid #ffd166; padding: 14px 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(13,46,38,0.25);">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div class="d-flex align-items-center">
            <span class="badge me-3" style="background: linear-gradient(135deg, #ffd166 0%, #f3a83b 100%); color: #0d2e26; font-size: 1.15rem; font-weight: 800; padding: 8px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <i class="bi bi-building me-1"></i>${aptCodeStr}
            </span>
            <div>
                <div style="color: #ffffff; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.3px;">BẢNG BÁO GIÁ CĂN ${aptCodeStr}</div>
                <div style="color: #f1f5f9; font-size: 0.84rem; font-weight: 500;">Loại hình: <span style="color:#ffd166; font-weight:700;">${typeLabel}</span></div>
                ${(selectedApt && selectedApt.bankInfo) ? (() => {
                    const sc = (selectedApt.bankInfo.soCap && selectedApt.bankInfo.soCap.length) ? selectedApt.bankInfo.soCap.join(', ') : 'N/A';
                    const tc = (selectedApt.bankInfo.thuCap && selectedApt.bankInfo.thuCap.length) ? selectedApt.bankInfo.thuCap.join(', ') : '';
                    const bStr = (sc === tc || !tc) ? sc : `${sc} (Thứ cấp: ${tc})`;
                    return `<div style="color: #cbd5e1; font-size: 0.83rem; font-weight: 500; margin-top: 2px;">
                        <i class="bi bi-bank2 me-1" style="color:#ffd166;"></i>Bank cho vay: <strong style="color:#ffffff;">${bStr}</strong>
                    </div>`;
                })() : ''}
            </div>
        </div>
        <div class="d-flex align-items-center gap-2">
            <div class="text-end">
                <div style="color: #cbd5e1; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Phương thức thanh toán đang chọn</div>
                <span class="badge mt-1" style="background: rgba(255,255,255,0.15); color: #ffd166; font-size: 0.95rem; font-weight: 700; border: 1px solid rgba(255,209,102,0.4); padding: 7px 14px; border-radius: 8px;">
                    ${methodDetailText}
                </span>
            </div>
            <button type="button" class="btn btn-sm" style="background:linear-gradient(135deg, #ffd166 0%, #f3a83b 100%); color:#0d2e26; font-weight:800; border-radius:8px; padding:8px 14px; box-shadow:0 3px 10px rgba(0,0,0,0.3);" onclick="openExportModal()">
                <i class="bi bi-camera-fill me-1"></i>Xuất Ảnh PNG
            </button>
        </div>
    </div>
</div>

<!-- Summary boxes -->
<div class="row g-3 mb-3">
    <div class="col-6 col-md-3">
        <div class="summary-box">
            <div class="s-label"><i class="bi bi-house me-1"></i>Giá trị BĐS (${aptCodeStr})</div>
            <div class="s-value" style="font-size:1.15rem;font-weight:800;">${fmt(propValue)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;font-weight:600;">${typeLabel} · ${methodDetailText}</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="summary-box discount-box">
            <div class="s-label"><i class="bi bi-percent me-1"></i>Tổng chiết khấu</div>
            <div class="s-value" style="font-size:1.15rem;font-weight:800;">–&nbsp;${fmt(totalCkAll)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">${safeCkPct}% + quà ${fmt(ckVnd)} VNĐ</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="summary-box loan-box">
            <div class="s-label"><i class="bi bi-cash-stack me-1"></i>Trả cho CĐT</div>
            <div class="s-value" style="color:#ffe79a;font-size:1.15rem;font-weight:800;">${fmt(totalKHtoCDT)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">VNĐ (sau chiết khấu)</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="summary-box total">
            <div class="s-label"><i class="bi bi-wallet2 me-1"></i>Tổng phải trả</div>
            <div class="s-value" style="color:#ffb703;font-size:1.2rem;font-weight:800;">${fmt(grandTotal)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">VNĐ (CĐT + NH gốc+lãi)</div>
        </div>
    </div>
</div>

<!-- Khối Biểu đồ Trực quan Executive Dark Gold Edition (Ý Tưởng 1) -->
<div class="official-charts-grid mb-3">
    <!-- Chart 1: Biểu đồ Cơ cấu Tổng giá trị tài sản (Doughnut Chart) -->
    <div class="widget-card">
        <div>
            <div class="widget-header-line">
                <div>
                    <div class="widget-title"><i class="bi bi-pie-chart-fill me-2" style="color:inherit;"></i>Cơ cấu tổng giá trị tài sản</div>
                </div>
            </div>

            <div class="executive-split-layout">
                <div class="split-left-area">
                    <canvas id="chart-breakdown-canvas" class="techno-donut-canvas"></canvas>
                </div>
                <div class="split-right-area">
                    <div id="chart-breakdown-legend-wrap"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Chart 3: Biểu đồ So sánh Các Phương thức Thanh toán (3 Grouped Bars) -->
    <div class="widget-card">
        <div>
            <div class="widget-header-line">
                <div>
                    <div class="widget-title"><i class="bi bi-bar-chart-line-fill me-2" style="color:inherit;"></i>So Sánh Các Phương Thức Thanh Toán</div>
                </div>
            </div>

            <div class="canvas-area-main">
                <canvas id="chart-methods-canvas"></canvas>
            </div>
        </div>
    </div>
</div>

${comparisonHTML || ''}

${PA && PA.p_const > 0 ? `
<!-- Bóc tách giá tiền đất & tiền xây -->
<div class="card-custom mb-3">
    <div class="card-title"><i class="bi bi-pie-chart-fill me-2"></i> BÓC TÁCH CHI TIẾT GIÁ (ĐẤT &amp; XÂY)</div>
    <div class="row g-3">
        <div class="col-md-6">
            <div style="background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.3); border-radius:12px; padding:16px;">
                <div class="breakdown-header-land" style="font-weight:800; font-size:0.95rem; margin-bottom:10px;"><i class="bi bi-geo-alt-fill me-1"></i>PHẦN TIỀN ĐẤT</div>
                <div class="d-flex justify-content-between mb-2" style="font-size:0.88rem;">
                    <span>Giá đất (chưa VAT):</span>
                    <strong style="font-weight:700;">${fmt(PA.p_land)} VNĐ</strong>
                </div>
                <div class="d-flex justify-content-between mb-2" style="font-size:0.88rem;">
                    <span>VAT đất (10%):</span>
                    <strong class="breakdown-vat-land" style="font-weight:700;">${fmt(PA.vat_land)} VNĐ</strong>
                </div>
                <div class="d-flex justify-content-between pt-2 mt-1" style="border-top:1.5px dashed rgba(212,175,55,0.4); font-size:0.92rem;">
                    <span style="font-weight:800; text-transform:uppercase; letter-spacing:0.3px;">TỔNG TIỀN ĐẤT (gồm VAT):</span>
                    <strong class="breakdown-total-land" style="font-size:1.1rem; font-weight:900;">${fmt(PA.land_total)} VNĐ</strong>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div style="background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.3); border-radius:12px; padding:16px;">
                <div class="breakdown-header-const" style="font-weight:800; font-size:0.95rem; margin-bottom:10px;"><i class="bi bi-tools me-1"></i>PHẦN TIỀN XÂY DỰNG</div>
                <div class="d-flex justify-content-between mb-2" style="font-size:0.88rem;">
                    <span>Giá xây dựng (chưa VAT):</span>
                    <strong style="font-weight:700;">${fmt(PA.p_const)} VNĐ</strong>
                </div>
                <div class="d-flex justify-content-between mb-2" style="font-size:0.88rem;">
                    <span>VAT xây dựng (10%):</span>
                    <strong class="breakdown-vat-const" style="font-weight:700;">${fmt(PA.vat_const)} VNĐ</strong>
                </div>
                <div class="d-flex justify-content-between mb-2" style="font-size:0.88rem;">
                    <span>Kinh phí bảo trì (KPBT 0.5%):</span>
                    <strong class="breakdown-kpbt" style="font-weight:700;">${fmt(PA.kpbt)} VNĐ</strong>
                </div>
                <div class="d-flex justify-content-between pt-2 mt-1" style="border-top:1.5px dashed rgba(52,211,153,0.4); font-size:0.92rem;">
                    <span style="font-weight:800; text-transform:uppercase; letter-spacing:0.3px;">TỔNG TIỀN XÂY + KPBT:</span>
                    <strong class="breakdown-total-const" style="font-size:1.1rem; font-weight:900;">${fmt(PA.const_total + PA.kpbt)} VNĐ</strong>
                </div>
            </div>
        </div>
    </div>
</div>
` : ''}

<!-- Chi tiết chiết khấu -->
<div class="card-custom">
    <div class="card-title"><i class="bi bi-tag-fill me-2"></i>CHI TIẾT CHIẾT KHẤU &amp; KHUYẾN MÃI</div>
    <div style="overflow-x:auto;">
        <table class="result-table">
            <thead>
                <tr>
                    <th>Loại chiết khấu / khuyến mãi</th>
                    <th class="text-end">% CK</th>
                    <th class="text-end">Quà / Cố định</th>
                    <th class="text-end">Giá trị quy đổi (VNĐ)</th>
                    <th class="text-center">Loại ưu đãi</th>
                </tr>
            </thead>
            <tbody>
                ${ckRows}
                ${cfCkRow}
                <tr style="background:rgba(16,185,129,0.22); font-weight:800; border-top: 2px solid #10b981;">
                    <td style="color:#34d399; font-weight:800;">TỔNG CHIẾT KHẤU</td>
                    <td class="text-end" style="color:#34d399; font-weight:800;">${ckPct.toFixed(1)}%</td>
                    <td class="text-end" style="color:#34d399; font-weight:800;">${fmt(ckVnd)} VNĐ</td>
                    <td class="text-end" style="color:#4ade80; font-size:1.05rem; font-weight:800;">${fmt(totalCkAll)} VNĐ</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

</div>
</div>
<!-- Lịch thanh toán -->
<div class="card-custom">
    <div class="card-title"><i class="bi bi-list-check me-2"></i>LỊCH THANH TOÁN CHI TIẾT</div>
    <div style="overflow-x:auto;">
        <table class="result-table">
            <thead>
                <tr>
                    <th style="min-width:210px;">Đợt / giai đoạn</th>
                    <th style="min-width:105px;">Ngày</th>
                    <th class="text-end" style="min-width:145px;">Số tiền gốc (VNĐ)</th>
                    <th class="text-end" style="min-width:140px;">Chiết khấu (VNĐ)</th>
                    <th class="text-end" style="min-width:145px;">Thực trả (VNĐ)</th>
                    <th style="min-width:220px;">Ghi chú</th>
                </tr>
            </thead>
            <tbody>
                ${stageRows}
                ${cfRow}
                ${html}
                ${bankRow}
                ${grandRow}
            </tbody>
        </table>
    </div>
</div>
`;

    setTimeout(() => {
        if (typeof renderPriceBreakdownChart === 'function') {
            renderPriceBreakdownChart('chart-breakdown-canvas', PA, S);
        }
        if (typeof renderMethodComparisonChart === 'function' && S.comparisonResults) {
            renderMethodComparisonChart('chart-methods-canvas', S.comparisonResults);
        }
    }, 60);

    /* ---- Tab ngân hàng ---- */
    const elLoan = document.getElementById('loanContent');
    if (elLoan) {
        if (loanData) {
            renderLoan(loanData);
        } else {
            elLoan.innerHTML = `
    <div class="card-custom text-center py-4 text-white">
        <i class="bi bi-info-circle-fill" style="font-size:2rem; color:var(--accent-light);"></i>
        <h5 class="mt-2 text-white fw-bold">Hình thức Vốn tự có</h5>
        <p class="mt-1 text-white opacity-90" style="font-size:0.9rem;">Phương thức thanh toán hiện tại không dùng vốn vay – Không phát sinh lịch trả nợ ngân hàng.</p>
    </div>`;
        }
    }
}

// --- Render Loan Schedule ---
function renderLoan(d) {
    setTimeout(() => {
        if (typeof renderLoanScheduleChart === 'function') {
            renderLoanScheduleChart('chart-loan-canvas', d);
        }
    }, 60);
    const rows = d.rows.map(r => `
<tr class="${r.supported ? 'supported-row' : ''}">
    <td class="text-center">${r.m}</td>
    <td class="date-col">${fmtDate(r.date)}</td>
    <td class="text-end" style="color:${r.supported ? '#64748b' : '#f8fafc'};font-weight:600;">${fmt(r.principal)}</td>
    <td class="text-end" style="color:${r.supported ? '#16a34a' : '#ef4444'};font-weight:700;">
        ${fmt(r.interest)}
        ${r.supported ? '<span class="cdt-support-badge"><i class="bi bi-shield-check me-1"></i>CĐT hỗ trợ</span>' : ''}
    </td>
    <td class="text-end" style="font-weight:800;color:${r.supported ? '#4ade80' : '#ffe79a'};">${fmt(r.khTotal)}</td>
    <td class="text-end" style="color:#cbd5e1;">${fmt(r.balance)}</td>
</tr>`).join('');

    const elLoan = document.getElementById('loanContent');
    if (!elLoan) return;

    elLoan.innerHTML = `
<div class="fade-in" id="loan-container">
<div class="row g-3 mb-3">
    <div class="col-6 col-md-3">
        <div class="summary-box loan-box">
            <div class="s-label"><i class="bi bi-bank me-1"></i>Số tiền vay (70%)</div>
            <div class="s-value" style="color:#f3e5ab;font-size:1.15rem;font-weight:800;">${fmt(d.principal)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">VNĐ</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="summary-box">
            <div class="s-label"><i class="bi bi-graph-up me-1"></i>Lãi suất / Kỳ hạn</div>
            <div class="s-value" style="color:#f87171;font-size:1.15rem;font-weight:800;">${d.annualRatePct}%/năm</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">${d.termYears} năm (${d.totalMonths} tháng)</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="summary-box discount-box">
            <div class="s-label"><i class="bi bi-shield-check me-1"></i>CĐT hỗ trợ ${d.supportMonths} tháng</div>
            <div class="s-value" style="color:#4ade80;font-size:1.15rem;font-weight:800;">–&nbsp;${fmt(d.totalCDT)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">VNĐ (CĐT chi trả 100% lãi)</div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="summary-box total">
            <div class="s-label"><i class="bi bi-cash me-1"></i>KH trả NH (gốc+lãi)</div>
            <div class="s-value" style="color:#ffb703;font-size:1.2rem;font-weight:800;">${fmt(d.totalKHPays)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">VNĐ / ${d.termYears} năm</div>
        </div>
    </div>
</div>

${d.supportMonths > 0 ? `
<div class="support-note mb-3">
    <i class="bi bi-check-circle-fill me-2" style="color:#5dd88a;"></i>
    <strong>Thời gian HTLS 0%:</strong> ${d.supportMonths} tháng đầu (từ ${fmtDate(d.disbursementDate)}). Trong thời gian này KH <strong>KHÔNG cần trả GỐC + LÃI (0 VNĐ/tháng)</strong>. CĐT chi trả 100% LÃI cho ngân hàng và hoãn thời gian trả nợ gốc (dư nợ gốc giữ nguyên). Từ tháng thứ ${d.supportMonths + 1} KH mới bắt đầu trả GỐC (${fmt(d.principalPerM)} VNĐ/tháng) + LÃI.
</div>` : ''}

<!-- Biểu đồ dư nợ & lãi vay -->
<div class="widget-card mb-3">
    <div>
        <div class="widget-header-line">
            <div>
                <div class="widget-title"><i class="bi bi-graph-up-arrow me-2" style="color:inherit;"></i>Diễn biến dư nợ và trả góp hàng tháng</div>
            </div>

            <!-- INTERACTIVE VIEW MODE BUTTONS -->
            <div class="chart-mode-pill-group ms-auto">
                <button type="button" class="btn-chart-mode active" onclick="switchChartLoanMode('all', this)">Tất Cả</button>
                <button type="button" class="btn-chart-mode" onclick="switchChartLoanMode('interest', this)">Chỉ Tiền Lãi</button>
                <button type="button" class="btn-chart-mode" onclick="switchChartLoanMode('principal', this)">Chỉ Dư Nợ</button>
            </div>
        </div>

        <div class="canvas-area-tall">
            <canvas id="chart-loan-canvas"></canvas>
        </div>
    </div>
</div>

<div class="card-custom">
    <div class="card-title"><i class="bi bi-table me-1"></i> Lịch trả nợ chi tiết hàng tháng</div>
    <div style="overflow-x:auto;">
        <table class="result-table">
            <thead>
                <tr>
                    <th class="text-center" style="width:60px;">Tháng</th>
                    <th style="min-width:100px;">Ngày trả</th>
                    <th class="text-end" style="min-width:130px;">Tiền gốc (VNĐ)</th>
                    <th class="text-end" style="min-width:130px;">Tiền lãi (VNĐ)</th>
                    <th class="text-end" style="min-width:140px;">KH phải trả (VNĐ)</th>
                    <th class="text-end" style="min-width:140px;">Dư nợ còn lại (VNĐ)</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </div>
</div>
</div>`;
}

// --- Render Compare 2 Apartments Tab ---
function initCompare2Tab() {
    try {
        const list = (typeof APARTMENT_DATA !== 'undefined' ? APARTMENT_DATA : []);
        const dl = document.getElementById('aptDatalist');
        if (dl && list.length > 0 && (!dl.children || !dl.children.length)) {
            const typeLabelMap = { rough: 'Thô', finished: 'Hoàn thiện', gianXay: 'Giãn xây' };
            dl.innerHTML = list.map(a => `<option value="${a.macan}">${a.macan} (${typeLabelMap[a.type] || 'Khác'} - ${fmt(a.priceBeforeVat)} VNĐ)</option>`).join('');
        }
    } catch (e) { }
}

function renderCompare2FullTab() {
    try {
        const tabEl = document.getElementById('tab-compare2');
        if (tabEl) tabEl.style.display = 'block';

        const container = document.getElementById('compare2FullContent');
        const list = (typeof APARTMENT_DATA !== 'undefined' ? APARTMENT_DATA : []);

        const val1 = (document.getElementById('cmpApt1') ? document.getElementById('cmpApt1').value : '').trim().toUpperCase().replace(/\s+/g, '');
        const val2 = (document.getElementById('cmpApt2') ? document.getElementById('cmpApt2').value : '').trim().toUpperCase().replace(/\s+/g, '');

        if (!val1 || !val2) {
            if (container) {
                container.innerHTML = `
                <div class="card-custom text-center py-5">
                    <i class="bi bi-arrow-repeat mb-2 empty-state-icon" style="font-size:3.5rem;"></i>
                    <h4 class="mt-2 fw-bold card-title-theme">So Sánh 2 Căn Song Song</h4>
                    <p class="sub-text mt-2" style="font-size:0.95rem;">Vui lòng nhập <strong>Mã Căn 1 (Căn A)</strong> và <strong>Mã Căn 2 (Căn B)</strong> ở trên, sau đó bấm nút <strong class="empty-state-highlight">"So Sánh"</strong></p>
                </div>`;
            }
            return;
        }

        const mKey1 = document.getElementById('cmpMethod1') ? document.getElementById('cmpMethod1').value : 'own-early';
        const mKey2 = document.getElementById('cmpMethod2') ? document.getElementById('cmpMethod2').value : 'own-early';

        const parseMethodKey = (k) => {
            if (k && k.startsWith('bank_')) {
                const idx = parseInt(k.split('_')[1], 10);
                return { method: 'bank', supportIdx: idx };
            }
            return { method: k || 'own-early', supportIdx: null };
        };

        const p1 = parseMethodKey(mKey1);
        const p2 = parseMethodKey(mKey2);

        const findAptObj = (val) => {
            if (!val) return null;
            const clean = val.toUpperCase().replace(/\s+/g, '');
            return list.find(a => a.macan.toUpperCase().replace(/\s+/g, '') === clean) ||
                list.find(a => a.macan.toUpperCase().replace(/\s+/g, '').includes(clean)) ||
                list.find(a => clean.includes(a.macan.toUpperCase().replace(/\s+/g, '')));
        };

        let apt1Obj = findAptObj(val1);
        let apt2Obj = findAptObj(val2);

        if (!apt1Obj) {
            const basePrice = document.getElementById('manualPrice') ? (parseNum(document.getElementById('manualPrice').value) || 5000000000) : 5000000000;
            apt1Obj = { macan: val1 || 'CĂN A', type: 'gianXay', dtDat: 50, dtXay: 150, priceBeforeVat: basePrice, vat: 0, kpbt: 0 };
        }
        if (!apt2Obj) {
            const basePrice = document.getElementById('manualPrice') ? (parseNum(document.getElementById('manualPrice').value) || 7000000000) : 7000000000;
            apt2Obj = { macan: val2 || 'CĂN B', type: 'gianXay', dtDat: 50, dtXay: 150, priceBeforeVat: basePrice, vat: 0, kpbt: 0 };
        }

        const getCmpCheck = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
        const getCmpVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

        const promos1 = {
            noBlnh: getCmpCheck('cmpNoBlnh1'),
            aquafield: getCmpCheck('cmpAqua1'),
            voucher: getCmpCheck('cmpVoucher1'),
            voucherAmount: getCmpVal('cmpVoucherAmt1')
        };

        const promos2 = {
            noBlnh: getCmpCheck('cmpNoBlnh2'),
            aquafield: getCmpCheck('cmpAqua2'),
            voucher: getCmpCheck('cmpVoucher2'),
            voucherAmount: getCmpVal('cmpVoucherAmt2')
        };

        // Calculate 1 & 2 cleanly without DOM side-effects
        const res1 = calculate(true, true, p1.method, p1.supportIdx, apt1Obj, promos1);
        const res2 = calculate(true, true, p2.method, p2.supportIdx, apt2Obj, promos2);

        if (!res1 || !res2) return;

        const renderPanelHtml = (res, titleColor, titleLabel, rawCode) => {
            const S = res.S;
            const stages = res.stages;
            const ckDetails = res.ckDetails;
            const displayCode = S.macan && S.macan !== 'Thủ công' ? S.macan : rawCode;

            const methodLabelMap = {
                'own-early': 'Thanh toán sớm',
                'own-normal': 'Vốn tự có – Tiến độ chuẩn',
                'bank': 'Vay ngân hàng (HTLS 0%)'
            };

            const isLight = document.body.classList.contains('light-theme');
            const renderTableRows = (arr) => arr.map(s => {
                const isStage1 = (s.no === 1 || (s.label && s.label.toLowerCase().includes('đặt cọc')));
                const rowClass = isStage1 ? 'class="row-stage-deposit"' : '';
                if (s.subItems && s.subItems.length > 0) {
                    return s.subItems.map((item, idx) => {
                        if (idx === 0) {
                            return `<tr ${rowClass}>
                                <td class="stage-col" rowspan="${s.subItems.length}" style="padding:8px 8px; vertical-align:middle; line-height:1.3; overflow-wrap:break-word; word-break:normal;">Đợt ${s.no}&nbsp;${formatStageDisplay(s)}</td>
                                <td class="date-col text-center" rowspan="${s.subItems.length}" style="padding:8px 6px; vertical-align:middle; white-space:nowrap;">${s.dateLabel || fmtDate(s.date)}</td>
                                <td class="amount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">${fmt(item.gross)}</td>
                                <td class="discount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">—</td>
                                <td class="net-amount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">${fmt(item.gross)}</td>
                            </tr>`;
                        } else {
                            return `<tr ${rowClass}>
                                <td class="amount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">${fmt(item.gross)}</td>
                                <td class="discount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">—</td>
                                <td class="net-amount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">${fmt(item.gross)}</td>
                            </tr>`;
                        }
                    }).join('');
                } else {
                    const labelCell = s.label ? `Đợt ${s.no}&nbsp;${formatStageDisplay(s)}` : `—`;
                    return `<tr ${rowClass}>
                        <td class="stage-col" style="padding:8px 8px; vertical-align:middle; line-height:1.3; overflow-wrap:break-word; word-break:normal;">${labelCell}</td>
                        <td class="date-col text-center" style="padding:8px 6px; vertical-align:middle; white-space:nowrap;">${s.dateLabel || fmtDate(s.date)}</td>
                        <td class="amount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">${fmt(s.gross)}</td>
                        <td class="discount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">${(s.voucherApplied > 0) ? '–&nbsp;' + fmt(s.voucherApplied) : (s.ck > 0 ? '–&nbsp;' + fmt(s.ck) : '—')}</td>
                        <td class="net-amount text-end" style="padding:8px 8px; vertical-align:middle; white-space:nowrap;">${fmt(s.net)}</td>
                    </tr>`;
                }
            }).join('');

            let stagesHtml = '';
            if (stages.isSplit) {
                stagesHtml = `
                    <tr class="stage-section-header-land"><td colspan="5" style="font-weight:800;text-align:center;"><i class="bi bi-geo-alt-fill me-1"></i> TIẾN ĐỘ TIỀN ĐẤT</td></tr>
                    ${renderTableRows(stages.landStages)}
                    <tr class="stage-section-header-const"><td colspan="5" style="font-weight:800;text-align:center;"><i class="bi bi-tools me-1"></i> TIẾN ĐỘ XÂY DỰNG</td></tr>
                    ${renderTableRows(stages.constStages)}
                `;
            } else {
                stagesHtml = renderTableRows(stages);
            }

            const ckRows = ckDetails.map(d => {
                let badge = '';
                if (d.deductType === 'price') badge = `<span class="badge-deduct badge-deduct-price">Trừ giá HĐ</span>`;
                else if (d.deductType === 'cashback') badge = `<span class="badge-deduct badge-deduct-cashback">Hoàn tiền</span>`;
                else if (d.deductType === 'gift') badge = `<span class="badge-deduct badge-deduct-gift">Quà/Voucher</span>`;
                else if (d.deductType === 'voucher') badge = `<span class="badge-deduct badge-deduct-voucher">Trừ khi ký HĐMB</span>`;
                return `<tr>
                <td>${d.label}</td>
                <td class="text-end" style="color:${isLight ? '#059669' : '#4ade80'};font-weight:700;">${d.pct > 0 ? d.pct + '%' : '—'}</td>
                <td class="text-end val-gold-theme" style="font-weight:800;">${fmt(d.vnd)} VNĐ</td>
                <td class="text-center" style="white-space:nowrap;">${badge}</td>
            </tr>`;
            }).join('');

            return `
            <div class="card-custom p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="card-panel-title" style="color:${titleColor}; font-weight:800; margin:0;"><i class="bi bi-house-fill me-2"></i>${titleLabel}: ${displayCode}</h5>
                    <div style="font-size:0.85rem; color:${isLight ? '#475569' : '#cbd5e1'}; font-weight:600; margin-top:4px;">${S.typeLabel} &bull; ${methodLabelMap[S.paymentMethod] || S.paymentMethod}</div>
                </div>
                
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <div class="summary-box" style="padding:10px 12px;">
                            <div class="s-label" style="font-size:0.75rem;">Giá chưa VAT</div>
                            <div class="s-value" style="font-size:0.95rem; font-weight:800;">${fmt(S.propValue)}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="summary-box discount-box" style="padding:10px 12px;">
                            <div class="s-label" style="font-size:0.75rem;">Tổng Chiết khấu</div>
                            <div class="s-value" style="color:${isLight ? '#059669' : '#4ade80'}; font-size:0.95rem; font-weight:800;">– ${fmt(S.totalCkAll)}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="summary-box loan-box" style="padding:10px 12px;">
                            <div class="s-label" style="font-size:0.75rem;">Thực trả CĐT</div>
                            <div class="s-value" style="font-size:0.95rem; font-weight:800;">${fmt(S.totalKHtoCDT)}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="summary-box total" style="padding:10px 12px;">
                            <div class="s-label" style="font-size:0.75rem;">Tổng giá trị thực tế</div>
                            <div class="s-value" style="color:${isLight ? '#d97706' : '#ffb703'}; font-size:1.05rem; font-weight:800;">${fmt(S.grandTotal)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <div class="sec-heading-theme" style="font-weight:700; font-size:0.9rem; margin-bottom:8px;"><i class="bi bi-tag-fill me-1"></i>CHI TIẾT CHIẾT KHẤU &amp; QUÀ TẶNG</div>
                    <div style="overflow-x:auto;">
                        <table class="result-table" style="font-size:0.78rem; width:100%; table-layout:fixed;">
                            <thead>
                                <tr>
                                    <th style="width:40%; text-align:left; padding:10px 6px;">Hạng mục chiết khấu</th>
                                    <th style="width:15%; text-align:right; padding:10px 4px;">% CK</th>
                                    <th style="width:25%; text-align:right; padding:10px 4px;">Giá trị quy đổi</th>
                                    <th style="width:20%; text-align:center; padding:10px 4px;">Loại ưu đãi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ckRows}
                                <tr style="background:rgba(16,185,129,0.18); font-weight:800; border-top: 2px solid #10b981; border-bottom: 1px solid #10b981;">
                                    <td style="color:${isLight ? '#059669' : '#34d399'}; font-weight:800; font-size:0.85rem; padding:10px 6px;">TỔNG CHIẾT KHẤU</td>
                                    <td class="text-end" style="color:${isLight ? '#059669' : '#34d399'}; font-weight:800; font-size:0.85rem; padding:10px 4px;">${S.ckPct.toFixed(1)}%</td>
                                    <td class="text-end" style="color:${isLight ? '#059669' : '#4ade80'}; font-size:0.92rem; font-weight:800; padding:10px 4px;">${fmt(S.totalCkAll)} VNĐ</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div class="sec-heading-theme" style="font-weight:700; font-size:0.9rem; margin-bottom:8px;"><i class="bi bi-list-check me-1"></i>LỊCH THANH TOÁN CHI TIẾT</div>
                    <div style="overflow-x:auto;">
                        <table class="result-table" style="font-size:0.78rem; width:100%; table-layout:auto;">
                            <thead>
                                <tr>
                                    <th style="text-align:left; padding:10px 8px;">Đợt</th>
                                    <th style="text-align:center; padding:10px 6px; white-space:nowrap;">Ngày</th>
                                    <th style="text-align:right; padding:10px 8px; white-space:nowrap;">Giá Gốc</th>
                                    <th style="text-align:right; padding:10px 8px; white-space:nowrap;">Chiết Khấu</th>
                                    <th style="text-align:right; padding:10px 8px; white-space:nowrap;">Thực Trả</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${stagesHtml}
                                <tr style="background:${isLight ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.18)'}; font-weight:800; border-top: 2px solid #10b981; border-bottom: 1px solid #10b981;">
                                    <td colspan="2" style="color:${isLight ? '#0d2e26' : '#ffffff'}; text-align:left; padding:10px 8px; font-size:0.78rem; font-weight:800; white-space:nowrap;">TỔNG CỘNG KH TRẢ</td>
                                    <td class="text-end" style="padding:10px 8px; font-size:0.78rem; font-weight:800; white-space:nowrap; border-right: 1px dashed rgba(16,185,129,0.3);">${fmt(S.totalGross)}</td>
                                    <td class="text-end" style="color:${isLight ? '#059669' : '#34d399'}; padding:10px 8px; font-size:0.78rem; font-weight:800; white-space:nowrap; border-right: 1px dashed rgba(16,185,129,0.3);">${S.totalCkAll > 0 ? '– ' + fmt(S.totalCkAll) : '—'}</td>
                                    <td class="text-end" style="color:${isLight ? '#059669' : '#4ade80'}; padding:10px 8px; font-size:0.84rem; font-weight:900; white-space:nowrap;">${fmt(S.totalKHtoCDT)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
            </div>
            `;
        };

        const rawCode1 = apt1Obj ? apt1Obj.macan : val1;
        const rawCode2 = apt2Obj ? apt2Obj.macan : val2;

        const getPtttTag = (mKey, res) => {
            if (mKey === 'own-early') return 'TTS';
            if (mKey === 'own-normal') return 'TĐC';
            if (mKey && mKey.startsWith('bank')) {
                const sup = res && res.S && res.S.loanInfo ? res.S.loanInfo.supportMonths : 0;
                if (sup > 0) return `Vay HTLS ${sup}T`;
                const bankMap = { 'bank_0': 'Vay HTLS 18T', 'bank_1': 'Vay HTLS 24T', 'bank_2': 'Vay HTLS 30T', 'bank_3': 'Vay HTLS 36T' };
                if (bankMap[mKey]) return bankMap[mKey];
                return 'Vay NH';
            }
            if (res && res.S && res.S.paymentMethod) {
                const pm = res.S.paymentMethod;
                if (pm === 'own-early') return 'TTS';
                if (pm === 'own-normal') return 'TĐC';
                if (pm === 'bank') return 'Vay NH';
            }
            return 'TTS';
        };

        const tag1 = getPtttTag(mKey1, res1);
        const tag2 = getPtttTag(mKey2, res2);

        let code1 = `${rawCode1} (${tag1})`;
        let code2 = `${rawCode2} (${tag2})`;

        if (res1 && res1.S) res1.S.displayName = code1;
        if (res2 && res2.S) res2.S.displayName = code2;

        const html1 = renderPanelHtml(res1, '#d97706', 'CĂN THỨ 1 (CĂN A)', code1);
        const html2 = renderPanelHtml(res2, '#059669', 'CĂN THỨ 2 (CĂN B)', code2);

        const totalSelf1 = res1.S.totalKHtoCDT;
        const totalSelf2 = res2.S.totalKHtoCDT;
        const selfDiff = totalSelf2 - totalSelf1;

        const price1 = res1.S.contractPrice || res1.S.totalKHtoCDT;
        const price2 = res2.S.contractPrice || (res2.S.totalKHtoCDT + (res2.S.actualBankAmt || 0));
        const priceDiff = price2 - price1;

        const isLight = typeof isLightMode === 'function' ? isLightMode() : (document.body.classList.contains('light-theme') || !document.body.classList.contains('dark-theme'));
        const redColor     = isLight ? '#dc2626' : '#f87171';
        const greenColor   = isLight ? '#059669' : '#34d399';
        const betterColor  = greenColor;
        const defaultColor = isLight ? '#0f172a' : '#f8fafc';
        const labelColor   = isLight ? '#475569' : '#ffffff';
        const subTextColor  = isLight ? '#475569' : '#cbd5e1';
        const summaryRowBg = isLight ? '#f0fdf4' : '#072b1e';
        const summaryTitleColor = isLight ? '#0f172a' : '#ffffff';

        let overviewTextHtml = '';
        let diffAccent = priceDiff > 0 ? redColor : (priceDiff < 0 ? greenColor : (isLight ? '#d97706' : '#ffd166'));
        let diffIcon = priceDiff > 0 ? 'bi-exclamation-triangle-fill' : (priceDiff < 0 ? 'bi-check-circle-fill' : 'bi-info-circle-fill');

        if (selfDiff < 0 && priceDiff > 0) {
            overviewTextHtml = `<strong style="color:${defaultColor};">Căn B (${code2})</strong> nhẹ vốn ban đầu hơn <strong style="color:${greenColor}; font-weight:700;">${fmt(Math.abs(selfDiff))} VNĐ</strong> (Vay bank 70%). Nhưng <strong style="color:${defaultColor};">Căn B (${code2})</strong> có tổng giá trị tài sản đắt hơn <strong style="color:${redColor}; font-weight:700;">${fmt(Math.abs(priceDiff))} VNĐ</strong>.`;
        } else if (selfDiff > 0 && priceDiff < 0) {
            overviewTextHtml = `<strong style="color:${defaultColor};">Căn A (${code1})</strong> nhẹ vốn ban đầu hơn <strong style="color:${greenColor}; font-weight:700;">${fmt(Math.abs(selfDiff))} VNĐ</strong>. Nhưng <strong style="color:${defaultColor};">Căn B (${code2})</strong> có tổng giá trị tài sản rẻ hơn <strong style="color:${greenColor}; font-weight:700;">${fmt(Math.abs(priceDiff))} VNĐ</strong>.`;
        } else if (priceDiff > 0) {
            overviewTextHtml = `<strong style="color:${defaultColor};">Căn B (${code2})</strong> có tổng giá trị tài sản đắt hơn <strong style="color:${redColor}; font-weight:700;">${fmt(Math.abs(priceDiff))} VNĐ</strong>.`;
        } else if (priceDiff < 0) {
            overviewTextHtml = `<strong style="color:${defaultColor};">Căn B (${code2})</strong> có tổng giá trị tài sản rẻ hơn <strong style="color:${greenColor}; font-weight:700;">${fmt(Math.abs(priceDiff))} VNĐ</strong>.`;
        } else {
            overviewTextHtml = `Hai phương án có vốn ban đầu và tổng giá trị tài sản bằng nhau.`;
        }

        // --- Helper để trích xuất dòng tiền Vốn tự có KH vs Bank giải ngân ---
        const getStageOutPocket = (s) => {
            if (!s) return { totalNet: 0, selfCash: 0, bankAmt: 0, isBank: false };
            const totalNet = s.net || s.gross || 0;
            let bankAmt = 0;

            if (s.label && (s.label.includes('Ngân hàng') || s.label.includes('Bank'))) {
                bankAmt = totalNet;
            } else if (Array.isArray(s.subItems) && s.subItems.length > 0) {
                s.subItems.forEach(sub => {
                    const lbl = ((sub.label || '') + ' ' + (sub.note || '')).toLowerCase();
                    if (lbl.includes('ngân hàng') || lbl.includes('bank')) {
                        bankAmt += (sub.gross || 0);
                    }
                });
            }

            const selfCash = Math.max(0, totalNet - bankAmt);
            return { totalNet, selfCash, bankAmt, isBank: bankAmt > 0 };
        };

        // --- Bảng Ma Trận Dòng Tiền Song Song (Timeline Cash-Flow Comparison Matrix) ---
        const renderCashFlowComparisonMatrix = (r1, r2, c1, c2) => {
            const stages1 = Array.isArray(r1.stages) ? r1.stages : [];
            const stages2 = Array.isArray(r2.stages) ? r2.stages : [];
            const maxLen = Math.max(stages1.length, stages2.length);
            if (maxLen === 0) return '';

            const hasBankPlan = (r1 && r1.S && r1.S.paymentMethod === 'bank') || (r2 && r2.S && r2.S.paymentMethod === 'bank');

            let rowsHtml = '';

            for (let i = 0; i < maxLen; i++) {
                const s1 = stages1[i] || null;
                const s2 = stages2[i] || null;

                const label1 = s1 ? (s1.label || `Đợt ${s1.no}`) : (s2 ? (s2.label || `Đợt ${s2.no}`) : `Đợt ${i + 1}`);
                const date1Str = s1 ? (s1.dateLabel || fmtDate(s1.date)) : (s2 ? (s2.dateLabel || fmtDate(s2.date)) : '—');

                const info1 = getStageOutPocket(s1);
                const info2 = getStageOutPocket(s2);

                const val1 = info1.selfCash;
                const val2 = info2.selfCash;
                const classA = (val1 < val2) ? 'matrix-val-better' : 'matrix-val-default';
                const classB = (val2 < val1) ? 'matrix-val-better' : 'matrix-val-default';

                const diffSelf = info2.selfCash - info1.selfCash;
                const bankAmtInStage = info2.bankAmt || info1.bankAmt || 0;
                let diffBadge = '';
                if (diffSelf === 0) {
                    diffBadge = `<span class="badge badge-equal">Bằng nhau</span>`;
                } else if (diffSelf > 0) {
                    const hasBankNote = bankAmtInStage > 0 
                        ? `<div class="matrix-bank-note" style="font-size:0.73rem; margin-top:2px;">(NH giải ngân: ${fmt(bankAmtInStage)} VNĐ)</div>`
                        : '';
                    diffBadge = `<span class="badge badge-diff-high">${c2} cao hơn ${fmt(diffSelf)}</span>${hasBankNote}`;
                } else {
                    const hasBankNote = bankAmtInStage > 0 
                        ? `<div class="matrix-bank-note" style="font-size:0.73rem; margin-top:2px;">(NH giải ngân: ${fmt(bankAmtInStage)} VNĐ)</div>`
                        : '';
                    diffBadge = `<span class="badge badge-diff-low">${c2} thấp hơn ${fmt(Math.abs(diffSelf))}</span>${hasBankNote}`;
                }

                const cellA = s1 ? `
                    <div class="${classA}" style="font-size:0.92rem;">${fmt(info1.selfCash)} VNĐ</div>
                    ${info1.bankAmt > 0 ? `<div class="matrix-bank-note" style="font-size:0.73rem; margin-top:2px;">(KH trả)</div>` : ''}
                ` : '—';

                const cellB = s2 ? `
                    <div class="${classB}" style="font-size:0.92rem;">${fmt(info2.selfCash)} VNĐ</div>
                    ${info2.bankAmt > 0 ? `<div class="matrix-bank-note" style="font-size:0.73rem; margin-top:2px;">(KH trả)</div>` : ''}
                ` : '—';

                rowsHtml += `
                <tr>
                    <td style="font-weight:700;">
                        <span class="badge me-1 matrix-badge-dot">Đợt ${i + 1}</span>
                        ${label1}
                    </td>
                    <td class="text-center" style="font-size:0.84rem; color:${isLight ? 'var(--text-muted)' : '#cbd5e1'};">${date1Str}</td>
                    <td class="text-end" style="vertical-align:middle;">${cellA}</td>
                    <td class="text-end" style="vertical-align:middle;">${cellB}</td>
                    <td class="text-center" style="vertical-align:middle;">${diffBadge}</td>
                </tr>`;
            }

            // Stylings cho hàng Tổng 1 (Vốn tự có) & Tổng 2 (Tổng giá trị tài sản)
            const selfClass1 = totalSelf1 < totalSelf2 ? 'matrix-val-better' : 'matrix-val-default';
            const selfClass2 = totalSelf2 < totalSelf1 ? 'matrix-val-better' : 'matrix-val-default';
            const selfWeight1 = totalSelf1 < totalSelf2 ? '900' : '700';
            const selfWeight2 = totalSelf2 < totalSelf1 ? '900' : '700';
            const selfGlow1 = (totalSelf1 < totalSelf2 && !isLight) ? 'text-shadow: 0 0 10px rgba(52,211,153,0.5);' : '';
            const selfGlow2 = (totalSelf2 < totalSelf1 && !isLight) ? 'text-shadow: 0 0 10px rgba(52,211,153,0.5);' : '';

            const priceClass1 = price1 < price2 ? 'matrix-val-better' : 'matrix-val-default';
            const priceClass2 = price2 < price1 ? 'matrix-val-better' : 'matrix-val-default';
            const priceWeight1 = price1 < price2 ? '900' : '700';
            const priceWeight2 = price2 < price1 ? '900' : '700';
            const priceGlow1 = (price1 < price2 && !isLight) ? 'text-shadow: 0 0 10px rgba(52,211,153,0.5);' : '';
            const priceGlow2 = (price2 < price1 && !isLight) ? 'text-shadow: 0 0 10px rgba(52,211,153,0.5);' : '';

            const badgeEqualText = `<span class="matrix-val-default" style="font-size:0.88rem;">Bằng nhau</span>`;

            const selfBadge = selfDiff === 0
                ? badgeEqualText
                : (selfDiff > 0
                    ? `<span style="color:#f87171; font-weight:700; font-size:0.88rem;">Căn B hơn ${fmt(selfDiff)} VNĐ</span>`
                    : `<span style="color:${betterColor}; font-weight:700; font-size:0.88rem;">Căn B nhẹ vốn hơn ${fmt(Math.abs(selfDiff))} VNĐ (Vay bank 70%)</span>`);

            const priceBadge = priceDiff === 0
                ? badgeEqualText
                : (priceDiff > 0
                    ? `<span style="color:${betterColor}; font-weight:700; font-size:0.88rem;">Căn A rẻ hơn ${fmt(priceDiff)} VNĐ</span>`
                    : `<span style="color:${betterColor}; font-weight:700; font-size:0.88rem;">Căn B rẻ hơn ${fmt(Math.abs(priceDiff))} VNĐ</span>`);

            return `
            <div class="card-custom mb-4" style="border: none !important;">
                <div class="mb-3">
                    <h5 class="fw-bold mb-1 card-title-theme" style="font-size:1.1rem;">
                        <i class="bi bi-calendar-range-fill me-2 section-title-icon"></i>MA TRẬN DÒNG TIỀN THANH TOÁN SONG SONG (${c1} vs ${c2})
                    </h5>
                    <div class="sub-text" style="font-size:0.82rem;">Đối chiếu từng đợt thanh toán giữa 2 phương án</div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="result-table" style="font-size:0.85rem;">
                        <thead>
                            <tr>
                                <th style="min-width:180px;">Đợt thanh toán</th>
                                <th class="text-center" style="min-width:110px;">Mốc ngày</th>
                                <th class="text-end matrix-header-a" style="min-width:155px;">Căn A (${c1})</th>
                                <th class="text-end matrix-header-b" style="min-width:155px;">Căn B (${c2})</th>
                                <th class="text-center" style="min-width:190px;">Chênh lệch đợt (VTC)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                            ${hasBankPlan ? `
                            <!-- Hàng 1: Tổng Vốn tự có KH cần bỏ ra (Chỉ hiện khi có phương án vay) -->
                            <tr class="matrix-summary-row" style="border-top:2px solid #10b981;">
                                <td colspan="2" class="matrix-summary-title" style="font-size:0.9rem; vertical-align:middle;">
                                    TỔNG VỐN TỰ CÓ KH CẦN BỎ RA
                                    <div class="matrix-sub-text" style="font-size:0.75rem; font-weight:400;">(Chưa tính phần Ngân hàng giải ngân)</div>
                                </td>
                                <td class="text-end ${selfClass1}" style="font-size:1.08rem; font-weight:${selfWeight1}; vertical-align:middle; ${selfGlow1}">${fmt(totalSelf1)} VNĐ</td>
                                <td class="text-end ${selfClass2}" style="font-size:1.08rem; font-weight:${selfWeight2}; vertical-align:middle; ${selfGlow2}">${fmt(totalSelf2)} VNĐ</td>
                                <td class="text-center" style="font-size:0.88rem; vertical-align:middle;">${selfBadge}</td>
                            </tr>
                            <!-- Hàng 2: Tổng giá trị tài sản (Net) -->
                            <tr class="matrix-summary-row" style="border-top:1px solid rgba(16,185,129,0.3);">
                                <td colspan="2" class="matrix-summary-title" style="font-size:0.9rem; vertical-align:middle;">
                                    TỔNG GIÁ TRỊ TÀI SẢN (TỔNG GIÁ NET)
                                    <div class="matrix-sub-text" style="font-size:0.75rem; font-weight:400;">(Gồm Vốn tự có + Ngân hàng giải ngân)</div>
                                </td>
                                <td class="text-end ${priceClass1}" style="font-size:1.08rem; font-weight:${priceWeight1}; vertical-align:middle; ${priceGlow1}">${fmt(price1)} VNĐ</td>
                                <td class="text-end ${priceClass2}" style="font-size:1.08rem; font-weight:${priceWeight2}; vertical-align:middle; ${priceGlow2}">${fmt(price2)} VNĐ</td>
                                <td class="text-center" style="font-size:0.88rem; vertical-align:middle;">${priceBadge}</td>
                            </tr>` : `
                            <!-- Hàng duy nhất: Tổng giá trị tài sản (Net) khi không có phương án vay -->
                            <tr class="matrix-summary-row" style="border-top:2px solid #10b981;">
                                <td colspan="2" class="matrix-summary-title" style="font-size:0.9rem; vertical-align:middle;">
                                    TỔNG GIÁ TRỊ TÀI SẢN (TỔNG GIÁ NET)
                                </td>
                                <td class="text-end ${priceClass1}" style="font-size:1.08rem; font-weight:${priceWeight1}; vertical-align:middle; ${priceGlow1}">${fmt(price1)} VNĐ</td>
                                <td class="text-end ${priceClass2}" style="font-size:1.08rem; font-weight:${priceWeight2}; vertical-align:middle; ${priceGlow2}">${fmt(price2)} VNĐ</td>
                                <td class="text-center" style="font-size:0.88rem; vertical-align:middle;">${priceBadge}</td>
                            </tr>`}
                        </tbody>
                    </table>
                </div>
            </div>`;
        };

        const matrixHtml = renderCashFlowComparisonMatrix(res1, res2, code1, code2);

        const overviewBg = isLight ? '#fefce8 !important' : 'linear-gradient(160deg, #07201a 0%, #031410 100%) !important';
        const overviewBorder = isLight ? '1.5px solid #fde68a !important' : '1.5px solid rgba(255, 209, 102, 0.35) !important';
        const overviewTextColor = isLight ? '#0f172a' : '#e2e8f0';
        const overviewTitleColor = isLight ? '#b45309 !important' : '#ffd166 !important';

        const fullCompareHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div class="compare-header-title" style="font-weight:800; font-size:1.15rem;">
                <i class="bi bi-layout-split me-2 section-title-icon"></i>KẾT QUẢ SO SÁNH SONG SONG: ${code1} vs ${code2}
            </div>
            <button type="button" class="btn btn-warning fw-bold px-3 py-2 shadow" 
                    style="background:linear-gradient(135deg, #ffd166 0%, #f3a83b 100%); color:#0d2e26; border:none; border-radius:8px;" 
                    onclick="exportCompare2Image()">
                <i class="bi bi-camera-fill me-1"></i> Xuất Ảnh PNG So Sánh (HD)
            </button>
        </div>
        <div class="card-custom mb-3 p-3" style="background: ${overviewBg}; border: ${overviewBorder}; border-left: 5px solid ${diffAccent} !important; border-radius:12px; color:${overviewTextColor}; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <div class="d-flex align-items-center gap-2" style="font-size:0.95rem;">
                <i class="bi ${diffIcon} me-2" style="color:${diffAccent}; font-size:1.35rem;"></i>
                <div>
                    <strong style="color:${overviewTitleColor}; letter-spacing:0.5px;">ĐÁNH GIÁ TỔNG QUAN:</strong> 
                    <span style="font-size:0.95rem; line-height:1.5; color:${overviewTextColor};">${overviewTextHtml}</span>
                </div>
            </div>
        </div>
        ${matrixHtml}
        <div class="row g-4">
            <div class="col-lg-6">${html1}</div>
            <div class="col-lg-6">${html2}</div>
        </div>
        `;

        if (container) {
            container.innerHTML = fullCompareHtml;
        }
    } catch (err) {
        console.error("Lỗi khi so sánh 2 căn:", err);
        const container = document.getElementById('compare2FullContent');
        if (container) {
            container.innerHTML = `
            <div class="card-custom text-center py-4 my-3" style="border: 1px solid #ef4444 !important; background: rgba(239, 68, 68, 0.1) !important;">
                <i class="bi bi-exclamation-triangle-fill text-danger mb-2" style="font-size: 2.5rem;"></i>
                <h5 class="text-white fw-bold">Không thể hiển thị so sánh</h5>
                <p class="text-white opacity-90 mb-0" style="font-size: 0.9rem;">Có lỗi phát sinh trong quá trình tính toán (${err.message}). Vui lòng kiểm tra lại thông tin 2 căn đã chọn.</p>
            </div>`;
        }
    }
}

// --- Quotation History Storage & Modal ---
function saveHistoryRecord(S) {
    if (!S) return;
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem('vhp_history') || '[]'); } catch (e) { }

    let macanName = S.macan;
    if ((!macanName || macanName === 'Nhập thủ công' || macanName === 'Thủ công') && typeof selectedApt !== 'undefined' && selectedApt) {
        macanName = selectedApt.macan;
    }
    if ((!macanName || macanName === 'Nhập thủ công' || macanName === 'Thủ công') && document.getElementById('searchApt')) {
        const sVal = document.getElementById('searchApt').value.trim();
        if (sVal) macanName = sVal;
    }
    if (!macanName) macanName = 'Thủ công';

    const formState = {
        macan: macanName,
        apartmentType: document.getElementById('apartmentType') ? document.getElementById('apartmentType').value : '',
        manualPrice: document.getElementById('manualPrice') ? document.getElementById('manualPrice').value : '',
        manualDtDat: document.getElementById('manualDtDat') ? document.getElementById('manualDtDat').value : '',
        manualDtXay: document.getElementById('manualDtXay') ? document.getElementById('manualDtXay').value : '',
        paymentMethod: S.paymentMethod,
        depositDate: document.getElementById('depositDate') ? document.getElementById('depositDate').value : '',
        signDate: document.getElementById('signDate') ? document.getElementById('signDate').value : '',
        promo_earlyMoveIn: document.getElementById('promo_earlyMoveIn') ? document.getElementById('promo_earlyMoveIn').checked : false,
        promo_noBlnh: document.getElementById('promo_noBlnh') ? document.getElementById('promo_noBlnh').checked : false,
        promo_aquafield: document.getElementById('promo_aquafield') ? document.getElementById('promo_aquafield').checked : false,
        promo_voucher: document.getElementById('promo_voucher') ? document.getElementById('promo_voucher').checked : false,
        voucherAmount: document.getElementById('voucherAmount') ? document.getElementById('voucherAmount').value : '',
        loanPct: document.getElementById('loanPct') ? document.getElementById('loanPct').value : '70',
        loanTerm: document.getElementById('loanTerm') ? document.getElementById('loanTerm').value : '20',
        interestRate: document.getElementById('interestRate') ? document.getElementById('interestRate').value : '13',
        interestSupportPlan: document.getElementById('interestSupportPlan') ? document.getElementById('interestSupportPlan').value : '0',
        showBankSim: document.getElementById('showBankSim') ? document.getElementById('showBankSim').checked : true
    };

    const record = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
        macan: macanName,
        typeLabel: S.typeLabel,
        paymentMethod: S.paymentMethod,
        supportPlanIdx: S.supportPlanIdx,
        loanTerm: formState.loanTerm,
        propValue: S.propValue,
        totalCkAll: S.totalCkAll,
        totalKHtoCDT: S.totalKHtoCDT,
        grandTotal: S.grandTotal,
        formState
    };

    const existIdx = hist.findIndex(r => r.macan === macanName && r.paymentMethod === S.paymentMethod && (r.formState ? r.formState.interestSupportPlan : null) === formState.interestSupportPlan && (r.formState ? r.formState.loanTerm : null) === formState.loanTerm);
    if (existIdx > -1) {
        hist.splice(existIdx, 1);
    }

    hist.unshift(record);
    if (hist.length > 30) hist.pop();
    localStorage.setItem('vhp_history', JSON.stringify(hist));
}

function restoreHistoryItem(id) {
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem('vhp_history') || '[]'); } catch (e) { }

    const idStr = String(id);
    const item = hist.find(r => String(r.id) === idStr || r.id == id);

    if (!item) {
        alert('Không tìm thấy bản ghi lịch sử này.'); return;
    }

    if (typeof Swal !== 'undefined') Swal.close();

    const f = item.formState || {};
    const macanToRestore = f.macan || item.macan;
    const methodToRestore = f.paymentMethod || item.paymentMethod;

    showTab('input');

    if (macanToRestore && macanToRestore !== 'Thủ công' && typeof APARTMENT_DATA !== 'undefined') {
        selectApt(macanToRestore);
    } else {
        if (typeof clearSelected === 'function') clearSelected();
        if (f.manualPrice && document.getElementById('manualPrice')) document.getElementById('manualPrice').value = f.manualPrice;
        if (f.manualDtDat && document.getElementById('manualDtDat')) document.getElementById('manualDtDat').value = f.manualDtDat;
        if (f.manualDtXay && document.getElementById('manualDtXay')) document.getElementById('manualDtXay').value = f.manualDtXay;
    }

    if (methodToRestore && document.getElementById('paymentMethod')) {
        document.getElementById('paymentMethod').value = methodToRestore;
    }
    if (f.apartmentType && document.getElementById('apartmentType')) {
        document.getElementById('apartmentType').value = f.apartmentType;
    }
    if (f.depositDate && document.getElementById('depositDate')) {
        document.getElementById('depositDate').value = f.depositDate;
    }
    if (f.signDate && document.getElementById('signDate')) {
        document.getElementById('signDate').value = f.signDate;
    }

    if (f.voucherAmount && document.getElementById('voucherAmount')) {
        document.getElementById('voucherAmount').value = f.voucherAmount;
    }

    const setCheck = (idStrKey, val) => {
        const el = document.getElementById(idStrKey);
        if (el) el.checked = !!val;
    };

    setCheck('promo_earlyMoveIn', f.promo_earlyMoveIn);
    setCheck('promo_noBlnh', f.promo_noBlnh);
    setCheck('promo_aquafield', f.promo_aquafield);
    setCheck('promo_voucher', f.promo_voucher);
    setCheck('showBankSim', f.showBankSim);

    toggleBankFields();
    toggleVoucherInput();
    if (f.loanPct && document.getElementById('loanPct')) {
        document.getElementById('loanPct').value = f.loanPct;
    }
    if (f.loanTerm && document.getElementById('loanTerm')) {
        document.getElementById('loanTerm').value = f.loanTerm;
    }
    if (f.interestRate && document.getElementById('interestRate')) {
        document.getElementById('interestRate').value = f.interestRate;
    }
    if (f.interestSupportPlan && document.getElementById('interestSupportPlan')) {
        document.getElementById('interestSupportPlan').value = f.interestSupportPlan;
    }

    if (typeof calculate === 'function') calculate();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Đã tải lại thành công!',
            text: `Đã khôi phục cài đặt cho căn ${macanToRestore || ''}`,
            timer: 1500,
            showConfirmButton: false
        });
    }
}

function showHistoryModal() {
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem('vhp_history') || '[]'); } catch (e) { }
    if (hist.length === 0) {
        (typeof Swal !== 'undefined' ? Swal.fire : alert)('Lịch sử trống', 'Bạn chưa tính báo giá nào.', 'info');
        return;
    }

    hist.forEach(r => {
        if (!r.formState) {
            r.formState = { macan: r.macan, paymentMethod: r.paymentMethod };
        }
    });

    const methodLabelMap = {
        'own-early': 'Thanh toán sớm',
        'own-normal': 'Tiến độ chuẩn',
        'bank': 'Vay NH (HTLS 0%)'
    };

    // Clean, crisp, high-contrast light modal palette (preferred by user for both Light & Dark modes)
    const modalBg = '#ffffff';
    const modalTextColor = '#0f172a';
    const tableHeaderBg = '#f1f5f9';
    const tableHeaderColor = '#0f172a';
    const rowBorderColor = '#e2e8f0';
    const timeColor = '#475569';
    const macanColor = '#0d2e26';
    const macanBg = '#fef3c7';
    const priceColor = '#0f172a';
    const totalColor = '#16a34a';

    const tbody = hist.map(r => {
        let ptttText = methodLabelMap[r.paymentMethod] || r.paymentMethod;
        if (r.paymentMethod === 'bank') {
            const f = r.formState || {};
            const planIdx = (r.supportPlanIdx !== undefined && r.supportPlanIdx !== null) ? r.supportPlanIdx : (parseInt(f.interestSupportPlan || '0') || 0);
            const term = r.loanTerm || f.loanTerm || '20';
            const htlsMonths = (planIdx === 1 ? 24 : planIdx === 2 ? 30 : planIdx === 3 ? 36 : 18);
            ptttText = `Vay NH (HTLS 0% ${htlsMonths} tháng - ${term} năm)`;
        }
        return `
        <tr style="cursor:pointer; border-bottom: 1px solid ${rowBorderColor}; background: #ffffff;" 
            onclick="restoreHistoryItem('${r.id}')" 
            title="Bấm để tải lại cấu hình căn này">
            <td style="font-size:12px; color:${timeColor}; white-space:nowrap; padding:10px 12px;">${r.time}</td>
            <td style="padding:10px 12px; white-space:nowrap;">
                <span class="badge-macan">
                    ${r.macan}
                </span>
            </td>
            <td style="font-size:12px; font-weight:600; color:${modalTextColor}; white-space:nowrap; padding:10px 12px;">${ptttText}</td>
            <td class="text-center" style="white-space:nowrap; padding:10px 12px;">
                <button class="btn btn-sm py-1 px-2 fw-bold" 
                        style="font-size:11px; background:#0d2e26; color:#ffffff; border:none; border-radius:6px;" 
                        onclick="event.stopPropagation(); restoreHistoryItem('${r.id}')">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>Tải lại
                </button>
            </td>
        </tr>
        `;
    }).join('');

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: `<span style="color:#0d2e26; font-weight:800;"><i class="bi bi-clock-history me-2"></i>Lịch Sử Báo Giá</span>`,
            background: modalBg,
            color: modalTextColor,
            html: `<div id="historyTableWrap" style="
                    width:100%;
                    overflow-x:auto;
                    overflow-y:auto;
                    -webkit-overflow-scrolling:touch;
                    touch-action:pan-x pan-y;
                    max-height:420px;
                    border-radius:10px;
                    border:1px solid #cbd5e1;
                    background:#ffffff;
                    display:block;
                    scrollbar-width:thin;
                    scrollbar-color:#0d2e26 #e2e8f0;
                ">
                <table id="historyTable" style="
                    min-width:440px;
                    width:100%;
                    font-size:13px;
                    text-align:left;
                    background:#ffffff;
                    color:#0f172a;
                    border-collapse:collapse;
                    margin:0;
                ">
                    <thead style="position:sticky; top:0; background:${tableHeaderBg}; color:${tableHeaderColor}; z-index:2; border-bottom:2px solid #cbd5e1;">
                        <tr>
                            <th style="padding:10px 12px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">Thời gian</th>
                            <th style="padding:10px 12px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">Mã Căn</th>
                            <th style="padding:10px 12px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">PTTT</th>
                            <th style="padding:10px 12px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap; text-align:center;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody style="color:#0f172a; background:#ffffff;">${tbody}</tbody>
                </table>
            </div>
            <div id="historyScrollHint" style="font-size:11px; color:#475569; font-weight:600; margin-top:8px; text-align:center; display:none;">
                <i class="bi bi-arrows-expand-horizontal me-1" style="color:#2563eb;"></i>👉 Vuốt sang phải để xem thêm cột
            </div>`,
            width: 620,
            allowTouchMove: false,
            showCancelButton: true,
            confirmButtonText: 'Đóng',
            cancelButtonColor: '#e74c3c',
            cancelButtonText: '🗑️ Xóa toàn bộ lịch sử',
            didOpen: () => {
                const wrap = document.getElementById('historyTableWrap');
                const hint = document.getElementById('historyScrollHint');
                const isMobile = window.innerWidth < 768;

                // Chỉ hiện hint và bật touch scroll trên mobile
                if (isMobile) {
                    if (hint) hint.style.display = 'block';
                    if (wrap) {
                        wrap.addEventListener('touchstart', (e) => { e._histTouchStartX = e.touches[0].clientX; }, { passive: true });
                        wrap.addEventListener('touchmove', (e) => { e.stopPropagation(); }, { passive: true });
                    }
                }
            }
        }).then(res => {
            if (res.dismiss === Swal.DismissReason.cancel) {
                localStorage.removeItem('vhp_history');
                Swal.fire('Đã xóa', 'Lịch sử báo giá đã được xóa sạch.', 'success');
            }
        });
    }
}

/* ==========================================================================
   TÍNH NĂNG 1: BỘ LỌC GỢI Ý CĂN THEO TÀI CHÍNH KHÁCH HÀNG (Tab 2 Section)
   ========================================================================== */
function switchSubInputTab(tabName) {
    const matcherContent = document.getElementById('subTabMatcher');
    const calcContent = document.getElementById('subTabCalc');
    const matcherBtn = document.getElementById('subTabMatcherBtn');
    const calcBtn = document.getElementById('subTabCalcBtn');

    if (!matcherContent || !calcContent || !matcherBtn || !calcBtn) return;

    if (tabName === 'matcher') {
        matcherContent.style.display = 'block';
        calcContent.style.display = 'none';

        matcherBtn.classList.add('active');
        calcBtn.classList.remove('active');
    } else {
        matcherContent.style.display = 'none';
        calcContent.style.display = 'block';

        calcBtn.classList.add('active');
        matcherBtn.classList.remove('active');
    }

    matcherBtn.style.background = '';
    matcherBtn.style.color = '';
    calcBtn.style.background = '';
    calcBtn.style.color = '';
}
window.switchSubInputTab = switchSubInputTab;

function selectAndCalculateUnit(macan, method, supportIdx) {
    try {
        let aptObj = null;
        if (typeof APARTMENT_DATA !== 'undefined' && APARTMENT_DATA.length > 0) {
            const clean = (macan || '').trim().toUpperCase().replace(/\s+/g, '');
            aptObj = APARTMENT_DATA.find(a => a.macan.toUpperCase().replace(/\s+/g, '') === clean || a.macan === macan);
        }
        if (typeof selectApt === 'function') {
            selectApt(macan);
        }

        const targetMethod = (method && method !== 'all') ? method : (aptObj ? aptObj.best_method : null);
        const targetSupportIdx = (supportIdx !== undefined && supportIdx !== null) ? supportIdx : (aptObj ? aptObj.best_support_idx : null);

        // Sync promos from Sub-Tab 1 (fin_promo_) to Sub-Tab 2 (promo_)
        const setC = (targetId, srcId) => {
            const src = document.getElementById(srcId);
            const tgt = document.getElementById(targetId);
            if (src && tgt) tgt.checked = src.checked;
        };
        const setV = (targetId, srcId) => {
            const src = document.getElementById(srcId);
            const tgt = document.getElementById(targetId);
            if (src && tgt) tgt.value = src.value;
        };

        setC('promo_earlyMoveIn', 'fin_promo_earlyMoveIn');
        setC('promo_noBlnh', 'fin_promo_noBlnh');
        setC('promo_aquafield', 'fin_promo_aquafield');

        if (targetMethod && document.getElementById('paymentMethod')) {
            document.getElementById('paymentMethod').value = targetMethod;
            if (typeof toggleBankFields === 'function') toggleBankFields();
        }

        if (typeof calculate === 'function') {
            calculate(false, false, targetMethod, targetSupportIdx, aptObj);
        }
    } catch (err) {
        console.error("Error calculating unit:", err);
    } finally {
        if (typeof showTab === 'function') {
            showTab('result');
        }

        // Direct DOM safeguard for Chrome local file rendering
        const elRes = document.getElementById('tab-result');
        if (elRes) {
            elRes.style.display = 'block';
            elRes.classList.add('active', 'show');
        }

        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            try {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e) {
                try { window.scrollTo(0, 0); } catch (ex) { }
            }
        }
    }
}
window.selectAndCalculateUnit = selectAndCalculateUnit;

// Note: runFinancialMatcher is defined and managed in recommendation.js



/* ==========================================================================
   TÍNH NĂNG 2: XEM VỊ TRÍ CĂN ULTRA-HD 300 DPI VỚI GHIM GIỌT NƯỚC VÀNG KIM 3D
   ========================================================================== */
function openLocationSpotlightFromInput() {
    const inputVal = document.getElementById('searchApt') ? document.getElementById('searchApt').value.trim() : '';
    const code = (selectedApt && selectedApt.macan) ? selectedApt.macan : inputVal;
    if (!code) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'Vui lòng chọn hoặc nhập mã căn',
                text: 'Hãy nhập mã căn (ví dụ: ĐLCV1-39, TL10-53...) để xem vị trí HD!',
                confirmButtonColor: '#ffd166'
            });
        } else {
            alert('Vui lòng nhập mã căn (ví dụ: ĐLCV1-39, TL10-53...) để xem vị trí HD!');
        }
        return;
    }
    openLocationSpotlight(code);
}

function getUnitSpotlightInfo(macan) {
    const code = String(macan).toUpperCase();
    let zoneName = "Global Park (Khu 2)";
    let roadInfo = "Đường nội khu thoáng mát, kết nối trục chính";
    let amenities = [];

    let apt = null;
    if (typeof APARTMENT_DATA !== 'undefined') {
        apt = APARTMENT_DATA.find(a => String(a.macan).toUpperCase().replace(/\s+/g, '') === code.replace(/\s+/g, ''));
    }

    if (code.startsWith('AS')) {
        zoneName = "Ivy Park (Khu 1)";
        const roadNum = code.split('-')[0].replace('AS', '');
        roadInfo = `Mặt tiền đường Ánh Sáng ${roadNum} (Lộ giới 13m - 19m)`;
        amenities = [
            "Mở ra bệ phóng hoàn hảo cho thế hệ tương lai tại quần thể giáo dục đại học quốc tế & trong nước đa dạng cùng <strong>công viên tri thức Ivy Park</strong>.",
            "Trải nghiệm không gian mua sắm tại <strong>phố thời trang Vincom Collection</strong> và <strong>TTTM Vincom Mega Mall</strong>.",
            "Hòa mình vào nhịp sống sầm uất ngày đêm tại <strong>phố ẩm thực Little HongKong</strong>.",
            "An tâm tận hưởng dịch vụ chăm sóc sức khỏe toàn diện 24/7 tại <strong>Bệnh viện Đa khoa Quốc tế Vinmec 5 sao</strong>."
        ];
    } else if (code.startsWith('TL')) {
        zoneName = "Global Park (Khu 2)";
        const roadNum = code.split('-')[0].replace('TL', '');
        roadInfo = `Mặt tiền đường Tương Lai ${roadNum} (Lộ giới 13m - 23m)`;
        amenities = [
            "Hòa mình vào nhịp sống sôi động tại <strong>Trung tâm Ẩm thực & Giải trí Quốc tế 24/7 Global Village</strong> và <strong>Phố Little HongKong</strong>.",
            "Tổ hợp <strong>Làng thời trang Trendy Fashion Town & Vincom Collection</strong> mở ra không gian mua sắm, vui chơi thời thượng.",
            "Quy tụ mạng lưới trường học đa dạng từ <strong>Vinschool</strong> đến các cơ sở giáo dục công lập và tư thục chất lượng cao.",
            "Thỏa sức khám phá tại <strong>công viên thiên văn Galaxy Park</strong>.",
            "Tái tạo năng lượng và tận hưởng nhịp sống năng động nhờ chuỗi công viên xanh mát đan xen hài hòa cùng <strong>tổ hợp sân TDTT lớn nhất miền nam</strong>."
        ];
    } else if (code.startsWith('DLCV') || code.startsWith('ĐLCV')) {
        zoneName = "Global Park (Khu 2)";
        const roadNum = code.split('-')[0].replace('ĐLCV', '').replace('DLCV', '');
        roadInfo = `Mặt tiền Đại Lộ Công Viên ${roadNum} (Lộ giới 32m - 40m)`;
        amenities = [
            "Hòa mình vào nhịp sống sôi động tại <strong>Trung tâm Ẩm thực & Giải trí Quốc tế 24/7 Global Village</strong> và <strong>Phố Little HongKong</strong>.",
            "Tổ hợp <strong>Làng thời trang Trendy Fashion Town & Vincom Collection</strong> mở ra không gian mua sắm, vui chơi thời thượng.",
            "Quy tụ mạng lưới trường học đa dạng từ <strong>Vinschool</strong> đến các cơ sở giáo dục công lập và tư thục chất lượng cao.",
            "Thỏa sức khám phá tại <strong>công viên thiên văn Galaxy Park</strong>.",
            "Tái tạo năng lượng và tận hưởng nhịp sống năng động nhờ chuỗi công viên xanh mát đan xen hài hòa cùng <strong>tổ hợp sân TDTT lớn nhất miền nam</strong>."
        ];
    } else {
        zoneName = "Global Park (Khu 2)";
        amenities = [
            "Hòa mình vào nhịp sống sôi động tại <strong>Trung tâm Ẩm thực & Giải trí Quốc tế 24/7 Global Village</strong> và <strong>Phố Little HongKong</strong>.",
            "Tổ hợp <strong>Làng thời trang Trendy Fashion Town & Vincom Collection</strong> mở ra không gian mua sắm, vui chơi thời thượng.",
            "Quy tụ mạng lưới trường học đa dạng từ <strong>Vinschool</strong> đến các cơ sở giáo dục công lập và tư thục chất lượng cao.",
            "Thỏa sức khám phá tại <strong>công viên thiên văn Galaxy Park</strong>.",
            "Tái tạo năng lượng và tận hưởng nhịp sống năng động nhờ chuỗi công viên xanh mát đan xen hài hòa cùng <strong>tổ hợp sân TDTT lớn nhất miền nam</strong>."
        ];
    }

    if (apt && apt.duong) {
        roadInfo = apt.duong.startsWith('Mặt tiền') ? apt.duong : `Mặt tiền: ${apt.duong}`;
    }
    if (apt && apt.tienIch) {
        const customList = apt.tienIch.split(',').map(s => s.trim());
        amenities = customList.concat(amenities.slice(customList.length));
    }

    return { zoneName, roadInfo, amenities };
}

function openLocationSpotlight(macan) {
    if (!macan) return;
    const cleanCode = String(macan).trim().toUpperCase();
    const codeLen = cleanCode.length;
    let pinFontSize = "9.0";
    if (codeLen >= 9) pinFontSize = "5.4";
    else if (codeLen >= 8) pinFontSize = "6.1";
    else if (codeLen >= 7) pinFontSize = "7.0";
    else if (codeLen >= 6) pinFontSize = "7.9";
    const altCode = cleanCode.replace(/Đ/g, 'D').replace(/-/g, '_').toLowerCase();

    const titleEl = document.getElementById('spotlightModalTitle');
    const contentEl = document.getElementById('spotlightBodyContent');
    const modalEl = document.getElementById('locationSpotlightModal');
    if (!modalEl || !contentEl) {
        console.error("Modal element #locationSpotlightModal or content container not found!");
        return;
    }

    if (titleEl) titleEl.innerHTML = `<i class="bi bi-pin-map-fill me-2" style="color:#ffd166 !important;"></i><span style="color:#ffffff !important; font-weight:800;">XEM VỊ TRÍ CĂN CHI TIẾT:</span> <span style="color:#ffd166 !important; font-weight:900; font-size:1.25rem;">${cleanCode}</span>`;

    // Robust coordinates lookup with window fallback and loose matching
    let coords = null;
    if (typeof getUnitMapCoordinates === 'function') {
        coords = getUnitMapCoordinates(cleanCode);
    } else if (typeof window !== 'undefined' && typeof window.getUnitMapCoordinates === 'function') {
        coords = window.getUnitMapCoordinates(cleanCode);
    }

    if (!coords) {
        const dict = (typeof EXACT_UNIT_MAP_COORDINATES !== 'undefined') ? EXACT_UNIT_MAP_COORDINATES
            : (typeof window !== 'undefined' && window.EXACT_UNIT_MAP_COORDINATES) ? window.EXACT_UNIT_MAP_COORDINATES
                : null;
        if (dict) {
            const rawNoDash = cleanCode.replace(/[^A-Z0-9]/g, '');
            for (let k in dict) {
                if (k.replace(/[^A-Z0-9]/g, '') === rawNoDash) {
                    coords = { macan: cleanCode, x: dict[k].x, y: dict[k].y, name: 'Căn ' + cleanCode };
                    break;
                }
            }
        }
    }

    const hasCoords = !!coords;
    const coordX = hasCoords ? coords.x : 0;
    const coordY = hasCoords ? coords.y : 0;

    if (false) {
        // Obsolete warning
    } else {
        const spotImgSrc = `assets/spotlight/spotlight_${altCode}.jpg?v=` + Date.now();
        const info = getUnitSpotlightInfo(cleanCode);

        const tab2Content = hasCoords ? `
            <div class="d-flex justify-content-between align-items-center mb-2 px-3 py-2 rounded-3 border border-warning" style="background:#061e18;">
                <div class="small text-warning fw-bold">
                    <i class="bi bi-geo-alt-fill me-1"></i>Sơ Đồ 2D Toàn Khu (Căn ${cleanCode})
                </div>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-warning fw-bold" onclick="zoomInteractiveCadMap(1.25)">
                        <i class="bi bi-zoom-in me-1"></i>Phóng To
                    </button>
                    <button type="button" class="btn btn-outline-warning fw-bold" onclick="zoomInteractiveCadMap(0.8)">
                        <i class="bi bi-zoom-out me-1"></i>Thu Nhỏ
                    </button>
                    <button type="button" class="btn btn-outline-warning fw-bold" onclick="scrollInteractiveCadMap(${coordX}, ${coordY})">
                        <i class="bi bi-crosshair me-1"></i>Về Tâm Căn ${cleanCode}
                    </button>
                    <button type="button" class="btn btn-warning text-dark fw-bold" onclick="showFullMasterplanZoom()">
                        <i class="bi bi-arrows-fullscreen me-1"></i>Xem Toàn Sơ Đồ
                    </button>
                </div>
            </div>

            <div class="position-relative overflow-auto rounded-3 border border-warning shadow-lg" id="interactiveMapViewport" style="height: 640px; max-height: 70vh; background: #051410; scrollbar-width: thin;">
                <div style="position: relative; width: 3600px; height: 2548px; transition: transform 0.2s ease-out;" id="interactiveMapInner">
                    <img src="assets/pdf_2d_masterplan_hd.jpg" onerror="this.onerror=null; this.src='assets/pdf-masterplan.jpg';" style="width: 100%; height: 100%; object-fit: fill; display: block;" alt="Sơ đồ 2D">
                    <!-- Live 3D Gold Teardrop Pin Marker -->
                    <div id="modalInteractivePinMarker" style="position: absolute; left: ${coordX}%; top: ${coordY}%; transform: translate(-50%, -100%); transform-origin: 50% 100%; transition: transform 0.25s ease-out; pointer-events: none; z-index: 10; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.85));">
                        <svg width="40" height="49" viewBox="0 0 60 74" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="goldBodyGradModal" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#fff8d6"/>
                                    <stop offset="35%" stop-color="#f5c042"/>
                                    <stop offset="100%" stop-color="#ab7008"/>
                                </linearGradient>
                                <linearGradient id="bronzeBorderGradModal" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stop-color="#ffe89e"/>
                                    <stop offset="100%" stop-color="#301b01"/>
                                </linearGradient>
                            </defs>
                            <path d="M 30 70 C 14 49, 5 38, 5 26 A 25 25 0 1 1 55 26 C 55 38, 46 49, 30 70 Z" fill="url(#goldBodyGradModal)" stroke="url(#bronzeBorderGradModal)" stroke-width="2.5"/>
                            <circle cx="30" cy="26" r="18.5" fill="#ffea9f"/>
                            <circle cx="30" cy="26" r="16" fill="#06160d" stroke="#693d00" stroke-width="1.2"/>
                            <text x="30" y="26" text-anchor="middle" dominant-baseline="central" fill="#ffea85" font-family="'Be Vietnam Pro', 'Plus Jakarta Sans', 'Inter', sans-serif" font-weight="900" font-size="${pinFontSize}" letter-spacing="-0.3"${codeLen >= 7 ? ' textLength="25" lengthAdjust="spacingAndGlyphs"' : ''}>${cleanCode}</text>
                        </svg>
                        <div style="width: 8px; height: 8px; background: #e62229; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px #e62229; margin-top: -3px;"></div>
                    </div>
                </div>
            </div>
            <div class="text-center mt-2 small text-warning">
                <i class="bi bi-arrows-move me-1"></i> Giữ chuột / vuốt tay để cuộn toàn sơ đồ 2D. Bạn có thể nhấn <strong>"Xem Toàn Sơ Đồ"</strong> để xem bao quát dự án!
            </div>
        ` : `
            <div class="p-5 text-center d-flex flex-column align-items-center justify-content-center rounded-3 border border-warning shadow-lg" style="min-height: 480px; background: rgba(255,209,102,0.04);">
                <i class="bi bi-geo-alt text-warning display-3 mb-3"></i>
                <h4 class="fw-bold text-warning mb-2.5">Xin Lỗi: Chưa Cập Nhật Tọa Độ Sơ Đồ 2D Căn ${cleanCode}</h4>
                <p class="mb-3" style="max-width: 500px; line-height: 1.6; color: #cbd5e1 !important; font-size: 0.95rem;">
                    Tọa độ vị trí chính xác trên Sơ đồ 2D của căn <strong>${cleanCode}</strong> hiện đang được tiếp tục cập nhật. Dữ liệu vị trí chi tiết của căn này sẽ hiển thị ngay khi bổ sung!
                </p>
                <div class="d-flex gap-2 justify-content-center">
                    <button type="button" class="btn btn-warning text-dark fw-bold px-4 py-2 shadow" onclick="switchToFullCadViewer()">
                        <i class="bi bi-arrows-fullscreen me-1"></i> Xem Bao Quát Sơ Đồ 2D Toàn Khu
                    </button>
                </div>
            </div>
        `;

        contentEl.innerHTML = `
            <!-- Multi-mode Nav Tabs -->
            <ul class="nav nav-pills mb-3 gap-2 justify-content-center align-items-center flex-wrap" id="spotlightModeTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active fw-bold btn-sm px-3" id="spot-crop-tab" data-bs-toggle="pill" data-bs-target="#spot-crop-pane" type="button" role="tab">
                        <i class="bi bi-crop me-1"></i>1. Ảnh Vị Trí Căn
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link fw-bold btn-sm px-3" id="spot-cad-tab" data-bs-toggle="pill" data-bs-target="#spot-cad-pane" type="button" role="tab" onclick="scrollInteractiveCadMap(${coordX}, ${coordY})">
                        <i class="bi bi-map-fill me-1"></i>2. Sơ Đồ 2D Trực Tiếp
                    </button>
                </li>
                <li class="nav-item">
                    <a href="assets/VHSP.pdf" download="VHSP_So_Do_Phan_Lo_CDT.pdf" target="_blank" class="btn btn-outline-warning fw-bold btn-sm px-3 text-decoration-none d-inline-flex align-items-center" title="Tải File PDF Sơ Đồ Gốc">
                        <i class="bi bi-download me-1"></i>📥 Tải File PDF Gốc
                    </a>
                </li>
            </ul>

            <div class="tab-content" id="spotlightModeTabsContent">
                <!-- TAB 1: ANH CAT HD 300DPI -->
                <div class="tab-pane fade show active" id="spot-crop-pane" role="tabpanel">
                    <div class="row g-3">
                        <div class="col-12 col-lg-7 text-center">
                            <div class="border border-warning rounded-3 overflow-hidden bg-black p-1 shadow-lg">
                                <img src="${spotImgSrc}" onerror="handleSpotlightImgError(this, '${cleanCode}', ${coordX}, ${coordY}, ${hasCoords})" class="img-fluid rounded-2 w-100" style="max-height: 480px; object-fit: contain;" alt="Vị trí ${cleanCode}">
                            </div>
                        </div>
                        <div class="col-12 col-lg-5">
                            <div class="border rounded-4 shadow-lg h-100 d-flex flex-column justify-content-between" style="background: linear-gradient(160deg, #07201a 0%, #031410 100%) !important; border: 1.5px solid rgba(255, 209, 102, 0.35) !important; padding: 24px 22px !important;">
                                <div>
                                    <h6 class="fw-bold mb-3.5 mt-1" style="color: #ffd166; font-size: 1.05rem; text-shadow: 0 0 8px rgba(255,209,102,0.3);"><i class="bi bi-geo-alt-fill me-1"></i>Thông Tin Chi Tiết &amp; Tiện Ích:</h6>
                                    <ul class="list-unstyled small mb-3.5" style="line-height: 2.1; color: #f1f5f9;">
                                        <li class="mb-2"><span style="color: rgba(241,245,249,0.65);">Mã căn:</span> <strong style="color: #ffd166;" class="fs-6 ms-1">${cleanCode}</strong></li>
                                        <li class="mb-2"><span style="color: rgba(241,245,249,0.65);">Phân khu:</span> <strong style="color: #f1f5f9;" class="ms-1">${info.zoneName}</strong></li>
                                        <li class="mb-2.5 d-flex align-items-start gap-1 flex-wrap"><span style="color: rgba(241,245,249,0.65); min-width: 45px;" class="mt-1">Vị trí:</span> <span style="color: #f1f5f9; background: rgba(255,209,102,0.12); padding: 5px 14px; border-radius: 10px; border: 1px solid rgba(255,209,102,0.35); display: inline-block; line-height: 1.5;" class="fw-semibold ms-1">${info.roadInfo}</span></li>
                                    </ul>
                                    <h6 class="fw-bold mb-2.5 mt-2" style="color: #ffd166; font-size: 0.98rem; letter-spacing: 0.2px;">Tiện Ích Nổi Bật Lân Cận:</h6>
                                    <ul class="list-unstyled small mb-0 spotlight-amenities-list" style="line-height: 1.6; color: #f1f5f9;">
                                        ${info.amenities.map(a => `<li class="mb-2" style="position:relative; padding-left:14px;"><span style="position:absolute; left:0; color:#ffd166; font-weight:bold;">•</span> ${a}</li>`).join('')}
                                    </ul>
                                </div>
                                <div class="alert alert-dark mb-0 py-2.5 px-3.5 small mt-4" style="background: rgba(255,209,102,0.08); border: 1px dashed rgba(255,209,102,0.35); color: #ffd166; border-radius: 12px; line-height: 1.5;">
                                    <i class="bi bi-info-circle me-1"></i> Chuyển sang Tab 2 để xem trực tiếp trên sơ đồ 2D toàn khu.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: SO TRUC TIEP TREN SO DO 2D-->
                <div class="tab-pane fade" id="spot-cad-pane" role="tabpanel">
                    ${tab2Content}
                </div>
            </div>
        `;
    }

    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        } else {
            modalEl.style.display = 'block';
            modalEl.classList.add('show');
            document.body.classList.add('modal-open');
        }
    } catch (e) {
        modalEl.style.display = 'block';
        modalEl.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function handleSpotlightImgError(imgEl, code, x, y, hasCoords) {
    const parent = imgEl ? imgEl.parentElement : null;
    if (!parent) return;

    if (hasCoords) {
        parent.innerHTML = `
            <div class="p-4 text-center d-flex flex-column align-items-center justify-content-center h-100" style="min-height: 380px; background: rgba(255,209,102,0.06); border: 1.5px dashed rgba(255,209,102,0.4); border-radius: 14px;">
                <i class="bi bi-geo-alt-fill text-warning display-4 mb-3"></i>
                <h5 class="fw-bold text-warning mb-2">Chưa Có Ảnh Cắt Chi Tiết Căn ${code}</h5>
                <p class="small mb-3" style="max-width: 420px; line-height: 1.6; color: #cbd5e1 !important;">
                    Bộ thư viện <code>assets/spotlight/</code> hiện chưa có file ảnh cắt riêng cho căn <strong>${code}</strong>. Hệ thống tự động chuyển sang <strong>Sơ đồ 2D</strong> để xem vị trí trực tiếp.
                </p>
                <button type="button" class="btn btn-warning fw-bold px-4 py-2 shadow-lg" onclick="switchToSpotlightCadTab(${x}, ${y})">
                    <i class="bi bi-map-fill me-1"></i> XEM TRỰC TIẾP TRÊN SƠ ĐỒ 2D >>
                </button>
            </div>
        `;
        setTimeout(() => {
            switchToSpotlightCadTab(x, y);
        }, 450);
    } else {
        parent.innerHTML = `
            <div class="p-4 text-center d-flex flex-column align-items-center justify-content-center h-100" style="min-height: 380px; background: rgba(255,209,102,0.06); border: 1.5px dashed rgba(255,209,102,0.4); border-radius: 14px;">
                <i class="bi bi-exclamation-triangle-fill text-warning display-4 mb-3"></i>
                <h5 class="fw-bold text-warning mb-2" style="font-size: 1.25rem;">Chưa Cập Nhật Vị Trí Căn ${code}</h5>
                <p class="spotlight-fallback-text mb-3.5" style="max-width: 480px; line-height: 1.65; font-size: 0.95rem; color: #f8fafc !important; font-weight: 500;">
                    Rất tiếc, căn <strong class="text-warning fw-bold">${code}</strong> hiện chưa có file ảnh cắt chi tiết và chưa cập nhật tọa độ trên sơ đồ 2D. Dữ liệu vị trí căn này sẽ được cập nhật ngay khi bổ sung!
                </p>
                <button type="button" class="btn btn-outline-warning fw-bold px-3.5 py-2 btn-sm" onclick="switchToFullCadViewer()">
                    <i class="bi bi-arrows-fullscreen me-1"></i> Xem Bao Quát Sơ Đồ 2D Dự Án
                </button>
            </div>
        `;
    }
}

function switchToFullCadViewer() {
    const cadTabBtn = document.getElementById('spot-cad-tab');
    if (cadTabBtn) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            const tab = bootstrap.Tab.getOrCreateInstance(cadTabBtn);
            tab.show();
        } else {
            cadTabBtn.click();
        }
        showFullMasterplanZoom();
    }
}

function switchToSpotlightCadTab(x, y) {
    const cadTabBtn = document.getElementById('spot-cad-tab');
    if (cadTabBtn) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            const tab = bootstrap.Tab.getOrCreateInstance(cadTabBtn);
            tab.show();
        } else {
            cadTabBtn.click();
        }
        scrollInteractiveCadMap(x, y);
    }
}

function closeLocationSpotlightModal() {
    const modalEl = document.getElementById('locationSpotlightModal');
    if (!modalEl) return;
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
    } catch (e) { }
    modalEl.style.display = 'none';
    modalEl.classList.remove('show');
    document.body.classList.remove('modal-open');
}

function updateInteractivePinScale() {
    const pin = document.getElementById('modalInteractivePinMarker');
    if (!pin) return;
    const pinScale = 1.0 / Math.pow(currentCadZoomScale, 0.72);
    pin.style.transform = `translate(-50%, -100%) scale(${pinScale})`;
    pin.style.transformOrigin = '50% 100%';
}

function scrollInteractiveCadMap(pctX, pctY) {
    currentCadZoomScale = 1.0;
    setTimeout(() => {
        const viewport = document.getElementById('interactiveMapViewport');
        const inner = document.getElementById('interactiveMapInner');
        if (inner) {
            inner.style.transform = 'scale(1)';
            inner.style.transformOrigin = 'top left';
        }
        updateInteractivePinScale();
        if (viewport) {
            const targetX = (pctX / 100.0) * 3600 - (viewport.clientWidth / 2);
            const targetY = (pctY / 100.0) * 2548 - (viewport.clientHeight / 2);
            viewport.scrollTo({ left: Math.max(0, targetX), top: Math.max(0, targetY), behavior: 'smooth' });
        }
    }, 150);
}

let currentCadZoomScale = 1.0;

function zoomInteractiveCadMap(factor) {
    const inner = document.getElementById('interactiveMapInner');
    if (!inner) return;
    currentCadZoomScale = Math.min(Math.max(0.3, currentCadZoomScale * factor), 5.0);
    inner.style.transform = `scale(${currentCadZoomScale})`;
    inner.style.transformOrigin = 'top left';
    updateInteractivePinScale();
}

function showFullMasterplanZoom() {
    const inner = document.getElementById('interactiveMapInner');
    const viewport = document.getElementById('interactiveMapViewport');
    if (!inner || !viewport) return;
    currentCadZoomScale = 0.35;
    inner.style.transform = `scale(${currentCadZoomScale})`;
    inner.style.transformOrigin = 'top left';
    updateInteractivePinScale();
    viewport.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
}

