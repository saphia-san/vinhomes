/* =============================================================
   GIAO DIỆN & TƯƠNG TÁC NGƯỜI DÙNG (UI & RENDERING)
   Dự án: Vinhomes Sài Gòn Park
   Quản lý Tabs, Event Listeners, Render Kết quả, Bảng so sánh & Lịch sử
   =============================================================*/

let selectedApt = null;

function toggleTheme() {
    const isLight = document.body.classList.contains('light-theme');
    if (isLight) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }
    const nowLight = document.body.classList.contains('light-theme');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.innerHTML = nowLight
            ? '<i class="bi bi-moon-stars-fill me-1" style="color:#2563eb;"></i><span class="d-none d-sm-inline ms-1"> Giao Diện Tối</span>'
            : '<i class="bi bi-sun-fill me-1" style="color:#ffd166;"></i><span class="d-none d-sm-inline ms-1"> Giao Diện Sáng</span>';
        btn.className = nowLight
            ? 'btn btn-outline-secondary rounded-3 px-3 py-2 fw-semibold'
            : 'btn btn-outline-warning rounded-3 px-3 py-2 fw-semibold';
    }
    try { 
        localStorage.setItem('vhp_theme', nowLight ? 'light' : 'dark'); 
        localStorage.setItem('vinhomes_theme', nowLight ? 'light' : 'dark'); 
    } catch (e) { }
    if (typeof calculate === 'function') {
        try { calculate(true); } catch (e) { }
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

    const elB33 = document.getElementById('promo_birthday33');
    if (elB33) elB33.addEventListener('change', function () {
        document.getElementById('birthday33RankWrap').style.display = this.checked ? 'block' : 'none';
    });

    const elGold = document.getElementById('promo_goldGift');
    if (elGold) elGold.addEventListener('change', function () {
        document.getElementById('goldGiftCountWrap').style.display = this.checked ? 'block' : 'none';
    });

    const elVoucher = document.getElementById('promo_voucher');
    if (elVoucher) elVoucher.addEventListener('change', function () {
        document.getElementById('voucherAmountWrap').style.display = this.checked ? 'block' : 'none';
    });

    const elCF = document.getElementById('cashFlowDiscount');
    if (elCF) elCF.addEventListener('change', function () {
        document.getElementById('cashFlowDaysWrap').style.display = this.checked ? 'block' : 'none';
    });

    // Toggle sub-inputs cho phần Gợi Ý Căn Phù Hợp
    const elFinGold = document.getElementById('fin_promo_goldGift');
    if (elFinGold) elFinGold.addEventListener('change', function () {
        const wrap = document.getElementById('fin_goldGiftCountWrap');
        if (wrap) wrap.style.display = this.checked ? 'block' : 'none';
    });

    const elFinVoucher = document.getElementById('fin_promo_voucher');
    if (elFinVoucher) elFinVoucher.addEventListener('change', function () {
        const wrap = document.getElementById('fin_voucherWrap');
        if (wrap) wrap.style.display = this.checked ? 'block' : 'none';
    });
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
    const isBank = elMethod ? (elMethod.value === 'bank') : false;
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
    const chk = document.getElementById('promo_voucher');
    const wrap = document.getElementById('voucherCalcDisplay');
    if (!chk || !chk.checked || !wrap) return;
    const oldP = parseNum(document.getElementById('oldHousePrice') ? document.getElementById('oldHousePrice').value : '0');
    const pct = parseInt(document.getElementById('voucherPercent') ? document.getElementById('voucherPercent').value : '8', 10) || 8;
    if (oldP > 0) {
        const rawV = oldP * (pct / 100);
        document.getElementById('voucherRawValue').textContent = fmt(rawV) + ' VNĐ';
        wrap.style.display = 'block';
    } else {
        wrap.style.display = 'none';
    }
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
    dd.innerHTML = matches.map(a => `
        <div class="search-item" onclick="selectApt('${a.macan}')">
            <span class="search-item-code" style="font-weight:800; font-size:0.95rem;">${a.macan}</span>
            <span class="search-item-meta ms-2" style="font-size:0.8rem;">${typeLabel[a.type]} &bull; ${fmt(a.priceBeforeVat)} VNĐ</span>
        </div>`).join('');
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
    let detail = `<span class="apt-meta-text">${typeLabel[apt.type] || 'Hoàn thiện'} &nbsp;|&nbsp; DT Đất: ${apt.dtDat} m² &nbsp;|&nbsp; DT Xây: ${apt.dtXay} m²</span><br>`;
    detail += `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-1">`;
    detail += `<div><span class="apt-price-label" style="font-size:0.9rem;">Giá trước VAT: </span><strong class="apt-price-val" style="font-size:1.15rem; font-weight:800;">${fmt(apt.priceBeforeVat)} VNĐ</strong></div>`;
    detail += `<button type="button" class="btn btn-sm btn-warning fw-bold px-3 shadow-sm" onclick="openLocationSpotlight('${apt.macan}')"><i class="bi bi-pin-map-fill me-1"></i>📍 Soi Vị Trí Căn Này</button>`;
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

    // 2) Nếu nhãn chứa T+X (ví dụ: Lần 3 (T+15), Vốn tự có thêm (T+15), Bắt đầu Xây (T+540), T+15, v.v...)
    let tMatch = label.match(/\(?(T\+\d+)\)?/i);
    if (tMatch) {
        const tNum = tMatch[1].replace(/T\+/i, '');
        return `<span class="badge-stage ${s.badge}">(T + ${tNum} ngày)</span>`;
    }

    // 3) Nếu là Lần X
    if (/^Lần\s+\d+/i.test(label)) {
        return `<span class="badge-stage ${s.badge}">(${label})</span>`;
    }

    // 4) Các nhãn khác: (Ký HĐMB), (Nhận bàn giao), (Sổ hồng), v.v.
    if (label.startsWith('(') && label.endsWith(')')) {
        return `<span class="badge-stage ${s.badge}">${label}</span>`;
    }
    return `<span class="badge-stage ${s.badge}">(${label})</span>`;
}

// --- Render Result Tab ---
function renderResult(stages, ckDetails, S, comparisonHTML = '') {
    window.lastResultS = S;
    const {
        propValue, typeLabel, paymentMethod, ckPct, ckVnd,
        totalCk, totalCkAll, cfDiscount, actualPaymentDate, cfDetailsStr,
        totalGross, totalKHtoCDT, totalKHtoBank, grandTotal, loanData, showBankSim, PA
    } = S;

    const safeCkPct = (typeof ckPct === 'number' && !isNaN(ckPct)) ? ckPct.toFixed(1) : '0.0';

    const aptCodeStr = S.macan ? S.macan : 'Nhập thủ công';

    let methodDetailText = '';
    if (paymentMethod === 'own-early') {
        methodDetailText = 'Vốn tự có – Thanh toán sớm';
    } else if (paymentMethod === 'own-normal') {
        methodDetailText = 'Vốn tự có – Tiến độ thường';
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
        const rowClass = isStage1 ? 'class="row-stage-deposit"' : '';
        return `
<tr ${rowClass}>
    <td class="stage-col">Đợt ${s.no}&nbsp;${formatStageDisplay(s)}</td>
    <td class="date-col">${s.dateLabel || fmtDate(s.date)}</td>
    <td class="amount">${fmt(s.gross)}</td>
    <td class="discount">${s.ck > 0 ? '–&nbsp;' + fmt(s.ck) : '—'}</td>
    <td class="net-amount">${fmt(s.net)}</td>
    <td style="font-size:0.78rem;color:var(--text-muted);">${s.note || ''}</td>
</tr>`;
    };

    let stageRows = '';
    if (stages.isSplit) {
        stageRows = `
<tr class="split-stage-header" style="background:rgba(52,211,153,0.2); border-left:4px solid #34d399;">
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
${stages.constStages.map(renderSingleRow).join('')}`;
    } else {
        stageRows = stages.map(renderSingleRow).join('');
    }

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
        ? 'Tổng KH trả cho CĐT <span style="font-size:0.73rem;font-weight:400;color:var(--text-muted);">(không gồm phần NH GN 70%)</span>'
        : 'Tổng KH trả cho CĐT';

    let html = `
<tr class="row-subtotal">
    <td colspan="2" style="color:#7ecfff;font-weight:700;">${subtotalLabel}</td>
    <td class="amount">${fmt(totalGross)}</td>
    <td class="discount">–&nbsp;${fmt(totalCkAll)}</td>
    <td class="net-amount">${fmt(totalKHtoCDT)}</td>
    <td></td>
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

    const grandRow = `
<tr class="row-grand">
    <td colspan="2" class="grand-title">
        <i class="bi bi-wallet2 me-2"></i>${grandLabelText}
    </td>
    <td colspan="3" class="net-amount">
        ${fmt(grandTotal)} VNĐ
    </td>
    <td class="grand-note">
        CĐT: ${fmt(totalKHtoCDT)} VNĐ${(loanData && paymentMethod === 'bank') ? ' + NH: ' + fmt(totalKHtoBank) + ' VNĐ' : ''}
    </td>
</tr>`;

    const deductTypeBadge = (d) => {
        if (d.deductType === 'price') return `<span style="background:rgba(74,222,128,0.18);color:#4ade80;font-size:0.72rem;font-weight:800;padding:2px 8px;border-radius:20px;border:1px solid #4ade80;white-space:nowrap;">✂️ Trừ vào giá HĐ</span>`;
        if (d.deductType === 'cashback') return `<span style="background:rgba(251,191,36,0.18);color:#fbbf24;font-size:0.72rem;font-weight:800;padding:2px 8px;border-radius:20px;border:1px solid #fbbf24;white-space:nowrap;">💵 Hoàn tiền sau khi về ở</span>`;
        if (d.deductType === 'gift') return `<span style="background:rgba(167,139,250,0.18);color:#a78bfa;font-size:0.72rem;font-weight:800;padding:2px 8px;border-radius:20px;border:1px solid #a78bfa;white-space:nowrap;">🎁 Quà tặng / Voucher</span>`;
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

<!-- Banner Tên Căn Hộ & Phương Thức Thanh Toán -->
<div class="banner-custom-header mb-3" style="background: linear-gradient(135deg, #0d2e26 0%, #174e40 100%) !important; border: 1.5px solid rgba(255,209,102,0.4); border-left: 5px solid #ffd166; padding: 14px 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(13,46,38,0.25);">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div class="d-flex align-items-center">
            <span class="badge me-3" style="background: linear-gradient(135deg, #ffd166 0%, #f3a83b 100%); color: #0d2e26; font-size: 1.15rem; font-weight: 800; padding: 8px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <i class="bi bi-building me-1"></i>${aptCodeStr}
            </span>
            <div>
                <div style="color: #ffffff; font-size: 1.15rem; font-weight: 800; letter-spacing: 0.3px;">BẢNG BÁO GIÁ CĂN ${aptCodeStr}</div>
                <div style="color: #f1f5f9; font-size: 0.84rem; font-weight: 500;">Loại hình: <span style="color:#ffd166; font-weight:700;">${typeLabel}</span></div>
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

<!-- Khối Biểu đồ Trực quan -->
<div class="row g-3 mb-3">
    <div class="col-md-5">
        <div class="card-custom h-100 chart-box-white" style="background:#ffffff !important; border:1px solid #e2e8f0; color:#0f172a;">
            <div class="card-title" style="color:#0f172a !important;"><i class="bi bi-pie-chart-fill me-2" style="color:#d97706;"></i>Cơ Cấu Giá Trị Căn ${aptCodeStr}</div>
            <div style="min-height:340px; height:340px; position:relative; padding-bottom:15px;">
                <canvas id="chart-breakdown-canvas"></canvas>
            </div>
        </div>
    </div>
    <div class="col-md-7">
        <div class="card-custom h-100 chart-box-white" style="background:#ffffff !important; border:1px solid #e2e8f0; color:#0f172a;">
            <div class="card-title" style="color:#0f172a !important;"><i class="bi bi-bar-chart-line-fill me-2" style="color:#d97706;"></i>So Sánh Chi Phí Các Gói Thanh Toán</div>
            <div style="min-height:320px; height:320px; position:relative; padding-bottom:15px;">
                <canvas id="chart-methods-canvas"></canvas>
            </div>
        </div>
    </div>
</div>

${comparisonHTML || ''}

${PA && PA.p_const > 0 ? `
<!-- Bóc tách giá tiền đất & tiền xây -->
<div class="card-custom mb-3">
    <div class="card-title"><i class="bi bi-pie-chart-fill me-2"></i> Bóc tách chi tiết giá (Đất &amp; Xây)</div>
    <div class="row g-3">
        <div class="col-md-6">
            <div style="background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.3); border-radius:12px; padding:16px;">
                <div class="breakdown-header-land" style="font-weight:800; font-size:0.95rem; margin-bottom:10px;"><i class="bi bi-geo-alt-fill me-1"></i>PHẦN TIỀN ĐẤT</div>
                <div class="d-flex justify-content-between mb-2" style="font-size:0.88rem;">
                    <span>Giá Đất (chưa VAT):</span>
                    <strong style="font-weight:700;">${fmt(PA.p_land)} VNĐ</strong>
                </div>
                <div class="d-flex justify-content-between mb-2" style="font-size:0.88rem;">
                    <span>VAT Đất (10%):</span>
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
                    <span>Giá Xây dựng (chưa VAT):</span>
                    <strong style="font-weight:700;">${fmt(PA.p_const)} VNĐ</strong>
                </div>
                <div class="d-flex justify-content-between mb-2" style="font-size:0.88rem;">
                    <span>VAT Xây dựng (10%):</span>
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
    <div class="card-title"><i class="bi bi-tag-fill"></i> Chi tiết chiết khấu &amp; Khuyến mãi</div>
    <div style="overflow-x:auto;">
        <table class="result-table">
            <thead>
                <tr>
                    <th>Loại chiết khấu / Khuyến mãi</th>
                    <th class="text-end">% CK</th>
                    <th class="text-end">Quà / Cố định</th>
                    <th class="text-end">Giá trị quy đổi (VNĐ)</th>
                    <th class="text-center">Loại Ưu Đãi</th>
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
    <div class="card-title"><i class="bi bi-list-check"></i> Lịch thanh toán chi tiết</div>
    <div style="overflow-x:auto;">
        <table class="result-table">
            <thead>
                <tr>
                    <th style="min-width:210px;">Đợt / Giai đoạn</th>
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
    <td class="text-end" style="color:#f8fafc;font-weight:600;">${fmt(r.principal)}</td>
    <td class="text-end" style="color:${r.supported ? '#4ade80' : '#f87171'};font-weight:700;">
        ${fmt(r.interest)}
        ${r.supported ? '<span class="badge-stage badge-progress ms-1" style="font-size:0.65rem;">CĐT hỗ trợ</span>' : ''}
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
            <div style="font-size:0.72rem;color:var(--text-muted);">VNĐ (KH không phải trả)</div>
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
    <strong>Thời gian HTLS:</strong> ${d.supportMonths} tháng đầu (từ ${fmtDate(d.disbursementDate)}). Trong thời gian này KH <strong>chỉ trả tiền GỐC</strong> (${fmt(d.principalPerM)} VNĐ/tháng), CĐT trả toàn bộ LÃI.
</div>` : ''}

<!-- Biểu đồ dư nợ & lãi vay -->
<div class="card-custom mb-3 chart-box-white" style="background:#ffffff !important; border:1px solid #e2e8f0; color:#0f172a;">
    <div class="card-title" style="color:#0f172a !important;"><i class="bi bi-graph-up-arrow me-2" style="color:#d97706;"></i>Biểu Đồ Diễn Biến Dư Nợ &amp; Lãi Vay Theo Năm</div>
    <div style="height:260px; position:relative;">
        <canvas id="chart-loan-canvas"></canvas>
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
                    <i class="bi bi-arrow-repeat mb-2" style="font-size:3.5rem; color:#ffd166;"></i>
                    <h4 class="mt-2 text-white fw-bold">So Sánh 2 Căn Hộ Song Song</h4>
                    <p class="text-white opacity-90 mt-2" style="font-size:0.95rem;">Vui lòng nhập <strong>Mã Căn 1 (Căn A)</strong> và <strong>Mã Căn 2 (Căn B)</strong> ở trên, sau đó bấm nút <strong style="color:#ffd166;">"So Sánh"</strong></p>
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

        // Calculate 1 & 2 cleanly without DOM side-effects
        const res1 = calculate(true, true, p1.method, p1.supportIdx, apt1Obj);
        const res2 = calculate(true, true, p2.method, p2.supportIdx, apt2Obj);

        if (!res1 || !res2) return;

        const renderPanelHtml = (res, titleColor, titleLabel, rawCode) => {
            const S = res.S;
            const stages = res.stages;
            const ckDetails = res.ckDetails;
            const displayCode = S.macan && S.macan !== 'Thủ công' ? S.macan : rawCode;

            const methodLabelMap = {
                'own-early': '💰 Vốn tự có – Thanh toán sớm',
                'own-normal': '📋 Vốn tự có – Tiến độ thường',
                'bank': '🏦 Vay Ngân hàng (HTLS 0%)'
            };

            const renderTableRows = (arr) => arr.map(s => {
                const isStage1 = (s.no === 1 || (s.label && s.label.toLowerCase().includes('đặt cọc')));
                const rowClass = isStage1 ? 'class="row-stage-deposit"' : '';
                if (s.subItems && s.subItems.length > 0) {
                    return s.subItems.map((item, idx) => {
                        if (idx === 0) {
                            return `<tr ${rowClass}>
                                <td class="stage-col" rowspan="${s.subItems.length}" style="vertical-align:middle;">Đợt ${s.no}&nbsp;${formatStageDisplay(s)}</td>
                                <td class="date-col" rowspan="${s.subItems.length}" style="vertical-align:middle;">${s.dateLabel || fmtDate(s.date)}</td>
                                <td class="amount">${fmt(item.gross)}</td>
                                <td class="discount">—</td>
                                <td class="net-amount">${fmt(item.gross)}</td>
                            </tr>`;
                        } else {
                            return `<tr ${rowClass}>
                                <td class="amount">${fmt(item.gross)}</td>
                                <td class="discount">—</td>
                                <td class="net-amount">${fmt(item.gross)}</td>
                            </tr>`;
                        }
                    }).join('');
                } else {
                    const labelCell = s.label ? `Đợt ${s.no}&nbsp;${formatStageDisplay(s)}` : `—`;
                    return `<tr ${rowClass}>
                        <td class="stage-col">${labelCell}</td>
                        <td class="date-col">${s.dateLabel || fmtDate(s.date)}</td>
                        <td class="amount">${fmt(s.gross)}</td>
                        <td class="discount">${s.ck > 0 ? '–&nbsp;' + fmt(s.ck) : '—'}</td>
                        <td class="net-amount">${fmt(s.net)}</td>
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
                if (d.deductType === 'price') badge = `<span style="background:rgba(74,222,128,0.18);color:#4ade80;font-size:0.70rem;font-weight:800;padding:2px 6px;border-radius:20px;border:1px solid #4ade80;white-space:nowrap;">✂️ Trừ giá HĐ</span>`;
                else if (d.deductType === 'cashback') badge = `<span style="background:rgba(251,191,36,0.18);color:#fbbf24;font-size:0.70rem;font-weight:800;padding:2px 6px;border-radius:20px;border:1px solid #fbbf24;white-space:nowrap;">💵 Hoàn tiền</span>`;
                else if (d.deductType === 'gift') badge = `<span style="background:rgba(167,139,250,0.18);color:#a78bfa;font-size:0.70rem;font-weight:800;padding:2px 6px;border-radius:20px;border:1px solid #a78bfa;white-space:nowrap;">🎁 Quà/Voucher</span>`;
                return `<tr>
                <td>${d.label}</td>
                <td class="text-end" style="color:#4ade80;font-weight:700;">${d.pct > 0 ? d.pct + '%' : '—'}</td>
                <td class="text-end val-gold-theme" style="font-weight:800;">${fmt(d.vnd)} VNĐ</td>
                <td class="text-center" style="white-space:nowrap;">${badge}</td>
            </tr>`;
            }).join('');

            return `
            <div class="card-custom h-100 mb-0">
                <div class="card-panel-header" style="border-bottom:2px solid ${titleColor}; padding-bottom:10px; margin-bottom:16px;">
                    <h5 class="card-panel-title" style="color:${titleColor}; font-weight:800; margin:0;"><i class="bi bi-house-fill me-2"></i>${titleLabel}: ${displayCode}</h5>
                    <div style="font-size:0.83rem; color:var(--text-muted); margin-top:4px;">${S.typeLabel} &bull; ${methodLabelMap[S.paymentMethod] || S.paymentMethod}</div>
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
                            <div class="s-value" style="color:#4ade80; font-size:0.95rem; font-weight:800;">– ${fmt(S.totalCkAll)}</div>
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
                            <div class="s-value" style="color:#ffb703; font-size:1.05rem; font-weight:800;">${fmt(S.grandTotal)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <div class="sec-heading-theme" style="font-weight:700; font-size:0.9rem; margin-bottom:8px;"><i class="bi bi-tag-fill me-1"></i>Chi tiết chiết khấu &amp; Quà tặng</div>
                    <div style="overflow-x:auto;">
                        <table class="result-table" style="font-size:0.78rem;">
                            <thead>
                                <tr>
                                    <th>Hạng mục chiết khấu</th>
                                    <th class="text-end">% CK</th>
                                    <th class="text-end">Giá trị quy đổi</th>
                                    <th class="text-center">Loại Ưu Đãi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ckRows}
                                <tr style="background:rgba(16,185,129,0.22); font-weight:800; border-top: 2px solid #10b981; border-bottom: 1px solid #10b981;">
                                    <td style="color:#34d399; font-weight:800; font-size:0.85rem;">TỔNG CHIẾT KHẤU</td>
                                    <td class="text-end" style="color:#34d399; font-weight:800; font-size:0.85rem;">${S.ckPct.toFixed(1)}%</td>
                                    <td class="text-end" style="color:#4ade80; font-size:0.92rem; font-weight:800;">${fmt(S.totalCkAll)} VNĐ</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div class="sec-heading-theme" style="font-weight:700; font-size:0.9rem; margin-bottom:8px;"><i class="bi bi-list-check me-1"></i>Lịch thanh toán chi tiết</div>
                    <div style="overflow-x:auto;">
                        <table class="result-table" style="font-size:0.78rem;">
                            <thead>
                                <tr>
                                    <th>Đợt</th>
                                    <th>Ngày</th>
                                    <th class="text-end">Gốc</th>
                                    <th class="text-end">CK</th>
                                    <th class="text-end">Thực trả</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${stagesHtml}
                                <tr style="background:rgba(16,185,129,0.22); font-weight:800; border-top: 2px solid #10b981; border-bottom: 1px solid #10b981;">
                                    <td colspan="2" style="color:#34d399; text-align:right; font-size:0.83rem;">TỔNG CỘNG KH TRẢ</td>
                                    <td class="text-end" style="color:#ffffff; font-size:0.85rem;">${fmt(S.totalGross)}</td>
                                    <td class="text-end" style="color:#34d399; font-size:0.85rem;">– ${fmt(S.totalCkAll)}</td>
                                    <td class="text-end" style="color:#4ade80; font-size:0.95rem; font-weight:800;">${fmt(S.totalKHtoCDT)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
            </div>
            `;
        };

        const code1 = apt1Obj ? apt1Obj.macan : val1;
        const code2 = apt2Obj ? apt2Obj.macan : val2;

        const html1 = renderPanelHtml(res1, '#f3e5ab', 'CĂN THỨ 1 (CĂN A)', code1);
        const html2 = renderPanelHtml(res2, '#ffd166', 'CĂN THỨ 2 (CĂN B)', code2);

        const diffVal = res2.S.grandTotal - res1.S.grandTotal;
        const diffText = diffVal === 0 ? 'Hai căn có tổng chi phí bằng nhau' : (diffVal > 0 ? `Căn B (${code2}) cao hơn Căn A (${code1}) là ${fmt(diffVal)} VNĐ` : `Căn B (${code2}) tiết kiệm hơn Căn A (${code1}) là ${fmt(Math.abs(diffVal))} VNĐ`);
        const diffAccent = diffVal > 0 ? '#ef4444' : (diffVal < 0 ? '#10b981' : '#64748b');
        const diffTextColor = diffVal > 0 ? '#dc2626' : (diffVal < 0 ? '#15803d' : '#334155');
        const diffIcon = diffVal > 0 ? 'bi-exclamation-triangle-fill' : (diffVal < 0 ? 'bi-check-circle-fill' : 'bi-info-circle-fill');

        // --- Bảng Ma Trận Dòng Tiền Song Song (Timeline Cash-Flow Comparison Matrix) ---
        const renderCashFlowComparisonMatrix = (r1, r2, c1, c2) => {
            const stages1 = Array.isArray(r1.stages) ? r1.stages : [];
            const stages2 = Array.isArray(r2.stages) ? r2.stages : [];
            const maxLen = Math.max(stages1.length, stages2.length);
            if (maxLen === 0) return '';

            let rowsHtml = '';
            let cum1 = 0;
            let cum2 = 0;

            for (let i = 0; i < maxLen; i++) {
                const s1 = stages1[i] || null;
                const s2 = stages2[i] || null;

                const label1 = s1 ? (s1.label || `Đợt ${s1.no}`) : (s2 ? (s2.label || `Đợt ${s2.no}`) : `Đợt ${i + 1}`);
                const date1Str = s1 ? (s1.dateLabel || fmtDate(s1.date)) : (s2 ? (s2.dateLabel || fmtDate(s2.date)) : '—');

                const net1 = s1 ? (s1.net || 0) : 0;
                const net2 = s2 ? (s2.net || 0) : 0;

                cum1 += net1;
                cum2 += net2;

                const diffNet = net2 - net1;
                let diffBadge = '';
                if (diffNet === 0) {
                    diffBadge = `<span class="badge badge-equal">Bằng nhau</span>`;
                } else if (diffNet > 0) {
                    diffBadge = `<span class="badge badge-diff-high">${c2} cao hơn +${fmt(diffNet)}</span>`;
                } else {
                    diffBadge = `<span class="badge badge-diff-low">${c2} thấp hơn –${fmt(Math.abs(diffNet))}</span>`;
                }

                rowsHtml += `
                <tr>
                    <td style="font-weight:700;">
                        <span class="badge me-1" style="background:rgba(255,209,102,0.15); color:#ffd166;">Đợt ${i + 1}</span>
                        ${label1}
                    </td>
                    <td class="text-center" style="font-size:0.84rem; color:var(--text-muted);">${date1Str}</td>
                    <td class="text-end fw-bold" style="color:#f3e5ab;">${s1 ? fmt(net1) + ' VNĐ' : '—'}</td>
                    <td class="text-end fw-bold" style="color:#ffd166;">${s2 ? fmt(net2) + ' VNĐ' : '—'}</td>
                    <td class="text-center">${diffBadge}</td>
                    <td class="text-end" style="font-size:0.83rem; color:var(--text-muted);">
                        A: ${fmt(cum1)} | B: ${fmt(cum2)}
                    </td>
                </tr>`;
            }

            const totalDiff = r2.S.totalKHtoCDT - r1.S.totalKHtoCDT;
            const totalBadge = totalDiff === 0
                ? '<span class="badge badge-equal">Bằng nhau</span>'
                : (totalDiff > 0
                    ? `<span class="badge" style="background:#ef4444; color:#fff;">TỔNG B CAO HƠN +${fmt(totalDiff)} VNĐ</span>`
                    : `<span class="badge" style="background:#16a34a; color:#fff;">TỔNG B THẤP HƠN –${fmt(Math.abs(totalDiff))} VNĐ</span>`);

            return `
            <div class="card-custom mb-4 sec-card-theme" style="border: 1.5px solid rgba(255,209,102,0.3); border-left: 5px solid #ffd166;">
                <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div>
                        <h5 class="fw-bold mb-1 card-title-theme" style="font-size:1.15rem;">
                            <i class="bi bi-calendar-range-fill me-2" style="color:#ffd166;"></i>Ma Trận Dòng Tiền Thanh Toán Song Song (${c1} vs ${c2})
                        </h5>
                        <div class="sub-text" style="font-size:0.83rem;">Bảng đối chiếu mốc ngày &amp; số tiền phải trả từng đợt thực tế giữa 2 căn hộ</div>
                    </div>
                    <div>${totalBadge}</div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="result-table" style="font-size:0.85rem;">
                        <thead>
                            <tr>
                                <th style="min-width:180px;">Đợt Thanh Toán</th>
                                <th class="text-center" style="min-width:110px;">Mốc Ngày</th>
                                <th class="text-end" style="min-width:145px; color:#f3e5ab;">Căn A (${c1})</th>
                                <th class="text-end" style="min-width:145px; color:#ffd166;">Căn B (${c2})</th>
                                <th class="text-center" style="min-width:180px;">Chênh Lệch Đợt</th>
                                <th class="text-end" style="min-width:170px;">Lũy Kế Đã Đóng (A | B)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                            <tr style="background: linear-gradient(135deg, #0d2e26 0%, #154d40 100%) !important; font-weight:800; border-top:3px solid #ffd166;">
                                <td colspan="2" style="color:#ffffff !important; font-size:0.92rem; vertical-align:middle;">TỔNG CỘNG TRẢ CĐT (SAU CK)</td>
                                <td class="text-end" style="color:#fef08a !important; font-size:1.08rem; vertical-align:middle;">${fmt(r1.S.totalKHtoCDT)} VNĐ</td>
                                <td class="text-end" style="color:#ffd166 !important; font-size:1.08rem; vertical-align:middle;">${fmt(r2.S.totalKHtoCDT)} VNĐ</td>
                                <td class="text-center" colspan="2" style="font-size:0.9rem; vertical-align:middle;">${totalBadge}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
        };

        const matrixHtml = renderCashFlowComparisonMatrix(res1, res2, code1, code2);

        const fullCompareHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div style="font-weight:800; font-size:1.15rem; color:#ffd166; text-shadow:0 0 10px rgba(255,209,102,0.3);">
                <i class="bi bi-layout-split me-2"></i>KẾT QUẢ SO SÁNH SONG SONG: ${code1} vs ${code2}
            </div>
            <button type="button" class="btn btn-warning fw-bold px-3 py-2 shadow" 
                    style="background:linear-gradient(135deg, #ffd166 0%, #f3a83b 100%); color:#0d2e26; border:none; border-radius:8px;" 
                    onclick="exportCompare2Image()">
                <i class="bi bi-camera-fill me-1"></i> Xuất Ảnh PNG So Sánh (HD)
            </button>
        </div>
        <div class="card-custom mb-3 p-3 chart-box-white" style="background:#ffffff !important; border:1px solid #e2e8f0; border-left: 5px solid ${diffAccent} !important; border-radius:12px; color:#0f172a;">
            <div class="d-flex align-items-center gap-2" style="font-size:0.95rem;">
                <i class="bi ${diffIcon} me-1" style="color:${diffAccent}; font-size:1.25rem;"></i>
                <div>
                    <strong style="color:#0f172a;">ĐÁNH GIÁ TỔNG QUAN:</strong> 
                    <span style="color:${diffTextColor}; font-weight:800;">${diffText}</span>
                </div>
            </div>
        </div>
        <div class="card-custom mb-4 chart-box-white" style="background:#ffffff !important; border:1px solid #e2e8f0; color:#0f172a;">
            <div class="card-title" style="color:#0f172a !important;"><i class="bi bi-radar me-2" style="color:#d97706;"></i>Biểu Đồ Radar So Sánh Đa Chiều (${code1} vs ${code2})</div>
            <div style="height:260px; position:relative;">
                <canvas id="chart-radar-canvas"></canvas>
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
            setTimeout(() => {
                if (typeof renderRadarComparisonChart === 'function') {
                    renderRadarComparisonChart('chart-radar-canvas', res1.S, res2.S);
                }
            }, 60);
        }
    } catch (err) {
        console.error("Lỗi khi so sánh 2 căn:", err);
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
        oldHousePrice: document.getElementById('oldHousePrice') ? document.getElementById('oldHousePrice').value : '',
        voucherPercent: document.getElementById('voucherPercent') ? document.getElementById('voucherPercent').value : '8',
        promo_voucher: document.getElementById('promo_voucher') ? document.getElementById('promo_voucher').checked : false,
        promo_goldGift: document.getElementById('promo_goldGift') ? document.getElementById('promo_goldGift').checked : false,
        promo_earlyMoveIn: document.getElementById('promo_earlyMoveIn') ? document.getElementById('promo_earlyMoveIn').checked : false,
        promo_noBlnh: document.getElementById('promo_noBlnh') ? document.getElementById('promo_noBlnh').checked : false,
        promo_aquafield: document.getElementById('promo_aquafield') ? document.getElementById('promo_aquafield').checked : false,
        loanPct: document.getElementById('loanPct') ? document.getElementById('loanPct').value : '70',
        loanTerm: document.getElementById('loanTerm') ? document.getElementById('loanTerm').value : '20',
        interestRate: document.getElementById('interestRate') ? document.getElementById('interestRate').value : '8',
        interestSupportPlan: document.getElementById('interestSupportPlan') ? document.getElementById('interestSupportPlan').value : '0',
        showBankSim: document.getElementById('showBankSim') ? document.getElementById('showBankSim').checked : true
    };

    const record = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
        macan: macanName,
        typeLabel: S.typeLabel,
        paymentMethod: S.paymentMethod,
        propValue: S.propValue,
        totalCkAll: S.totalCkAll,
        totalKHtoCDT: S.totalKHtoCDT,
        grandTotal: S.grandTotal,
        formState
    };

    const existIdx = hist.findIndex(r => r.macan === macanName && r.paymentMethod === S.paymentMethod);
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

    if (f.oldHousePrice && document.getElementById('oldHousePrice')) {
        document.getElementById('oldHousePrice').value = f.oldHousePrice;
    }
    if (f.voucherPercent && document.getElementById('voucherPercent')) {
        document.getElementById('voucherPercent').value = f.voucherPercent;
    }

    const setCheck = (idStrKey, val) => {
        const el = document.getElementById(idStrKey);
        if (el) el.checked = !!val;
    };

    setCheck('promo_voucher', f.promo_voucher);
    setCheck('promo_goldGift', f.promo_goldGift);
    setCheck('promo_earlyMoveIn', f.promo_earlyMoveIn);
    setCheck('promo_noBlnh', f.promo_noBlnh);
    setCheck('promo_aquafield', f.promo_aquafield);
    setCheck('showBankSim', f.showBankSim);

    if (document.getElementById('voucherAmountWrap')) {
        document.getElementById('voucherAmountWrap').style.display = f.promo_voucher ? 'block' : 'none';
    }
    if (typeof calcVoucherDisplay === 'function') calcVoucherDisplay();
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
        'own-early': 'TTS (Vốn tự có)',
        'own-normal': 'Tiến độ thường',
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

    const tbody = hist.map(r => `
        <tr style="cursor:pointer; border-bottom: 1px solid ${rowBorderColor}; background: #ffffff;" 
            onclick="restoreHistoryItem('${r.id}')" 
            title="Bấm để tải lại cấu hình căn này">
            <td style="font-size:12px; color:${timeColor}; white-space:nowrap; padding:10px;">${r.time}</td>
            <td style="padding:10px; white-space:nowrap;">
                <span class="badge" style="background:${macanBg}; color:${macanColor}; font-weight:800; font-size:12px; border:1px solid #fde68a; padding:4px 8px; white-space:nowrap; display:inline-block;">
                    ${r.macan}
                </span>
            </td>
            <td style="font-size:12px; font-weight:600; color:${modalTextColor}; white-space:nowrap; padding:10px;">${methodLabelMap[r.paymentMethod] || r.paymentMethod}</td>
            <td class="text-end" style="font-size:12px; font-weight:600; color:${priceColor}; white-space:nowrap; padding:10px;">${fmt(r.propValue)}</td>
            <td class="text-end" style="color:${totalColor}; font-weight:800; font-size:13px; white-space:nowrap; padding:10px;">${fmt(r.totalKHtoCDT)}</td>
            <td class="text-center" style="white-space:nowrap; padding:10px;">
                <button class="btn btn-sm py-1 px-2 fw-bold" 
                        style="font-size:11px; background:#0d2e26; color:#ffffff; border:none; border-radius:6px;" 
                        onclick="event.stopPropagation(); restoreHistoryItem('${r.id}')">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>Tải lại
                </button>
            </td>
        </tr>
    `).join('');

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: `<span style="color:#0d2e26; font-weight:800;"><i class="bi bi-clock-history me-2"></i>Lịch Sử Báo Giá</span>`,
            background: modalBg,
            color: modalTextColor,
            html: `<div style="max-height:420px; overflow-y:auto; overflow-x:auto; -webkit-overflow-scrolling:touch; width:100%; border-radius:10px; border:1px solid ${rowBorderColor}; background:#ffffff;">
                <table class="table align-middle m-0" style="min-width:650px; font-size:13px; text-align:left; background:#ffffff; color:#0f172a;">
                    <thead style="position:sticky; top:0; background:${tableHeaderBg}; color:${tableHeaderColor}; z-index:2; border-bottom:2px solid #cbd5e1;">
                        <tr>
                            <th style="padding:10px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">Thời gian</th>
                            <th style="padding:10px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">Mã Căn</th>
                            <th style="padding:10px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">PTTT</th>
                            <th class="text-end" style="padding:10px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">Giá chưa VAT</th>
                            <th class="text-end" style="padding:10px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">Thực trả CĐT</th>
                            <th class="text-center" style="padding:10px; color:${tableHeaderColor}; font-weight:700; white-space:nowrap;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody style="color:#0f172a; background:#ffffff;">${tbody}</tbody>
                </table>
            </div>`,
            width: 820,
            showCancelButton: true,
            confirmButtonText: 'Đóng',
            cancelButtonColor: '#e74c3c',
            cancelButtonText: '🗑️ Xóa toàn bộ lịch sử'
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
        setC('promo_voucher', 'fin_promo_voucher');
        setV('oldHousePrice', 'fin_oldHousePrice');
        setV('voucherPercent', 'fin_voucherPercent');
        if (typeof toggleVoucherInputs === 'function') toggleVoucherInputs();

        if (document.getElementById('promo_goldGift')) {
            document.getElementById('promo_goldGift').checked = true;
        }

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

function runFinancialMatcher() {
    const elB = document.getElementById('finBudget');
    const elCF = document.getElementById('finMonthlyCashflow');
    const elM = document.getElementById('finMethod');
    const elT = document.getElementById('finType');

    const bVal = elB ? elB.value : 'all';
    const cfVal = elCF ? elCF.value : 'all';
    const mVal = elM ? elM.value : 'all';
    const tVal = elT ? elT.value : 'all';

    const wrap = document.getElementById('finMatcherResultsWrap');
    const container = document.getElementById('finMatcherResultsContainer');
    const countEl = document.getElementById('finMatchCount');
    if (!wrap || !container) return;

    const data = (typeof APARTMENT_DATA !== 'undefined' ? APARTMENT_DATA : []);
    const typeLabels = { rough: 'Bàn Giao Thô', finished: 'Hoàn Thiện', gianXay: 'Giãn Xây Q4/2028' };

    const maxBudget = (bVal !== 'all') ? parseInt(bVal) * 1_000_000 : Infinity;
    const maxMonthly = (cfVal !== 'all') ? parseInt(cfVal) * 1_000_000 : Infinity;

    // -------- Đọc Promo Checkboxes từ phần Gợi Ý Căn --------
    const getCheck = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
    const finPromos = {
        goldGift: getCheck('fin_promo_goldGift'),
        earlyMoveIn: getCheck('fin_promo_earlyMoveIn'),
        noBlnh: getCheck('fin_promo_noBlnh'),
        aquafield: getCheck('fin_promo_aquafield'),
        voucher: getCheck('fin_promo_voucher'),
        goldGiftCount: (() => { const el = document.getElementById('fin_goldGiftCount'); return el ? el.value : 'auto'; })(),
        oldHousePrice: (() => { const el = document.getElementById('fin_oldHousePrice'); return el ? el.value : ''; })(),
        voucherPercent: (() => { const el = document.getElementById('fin_voucherPercent'); return el ? el.value : '8'; })(),
    };

    // -------- Helper: Sync tạm thời fin_promo_* → checkbox gốc để engine calculator.js đọc được --------
    const syncPromoToMain = () => {
        const setC = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setC('promo_goldGift', finPromos.goldGift);
        setC('promo_earlyMoveIn', finPromos.earlyMoveIn);
        setC('promo_noBlnh', finPromos.noBlnh);
        setC('promo_aquafield', finPromos.aquafield);
        setC('promo_voucher', finPromos.voucher);
        setV('goldGiftCount', finPromos.goldGiftCount);
        setV('oldHousePrice', finPromos.oldHousePrice);
        setV('voucherPercent', finPromos.voucherPercent);
    };

    const restoreMain = (saved) => {
        const setC = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setC('promo_goldGift', saved.goldGift);
        setC('promo_earlyMoveIn', saved.earlyMoveIn);
        setC('promo_noBlnh', saved.noBlnh);
        setC('promo_aquafield', saved.aquafield);
        setC('promo_voucher', saved.voucher);
        setV('goldGiftCount', saved.goldGiftCount);
        setV('oldHousePrice', saved.oldHousePrice);
        setV('voucherPercent', saved.voucherPercent);
    };

    // Lưu lại giá trị gốc của form chính trước khi sync
    const savedMain = {
        goldGift: getCheck('promo_goldGift'),
        earlyMoveIn: getCheck('promo_earlyMoveIn'),
        noBlnh: getCheck('promo_noBlnh'),
        aquafield: getCheck('promo_aquafield'),
        voucher: getCheck('promo_voucher'),
        goldGiftCount: (() => { const el = document.getElementById('goldGiftCount'); return el ? el.value : 'auto'; })(),
        oldHousePrice: (() => { const el = document.getElementById('oldHousePrice'); return el ? el.value : ''; })(),
        voucherPercent: (() => { const el = document.getElementById('voucherPercent'); return el ? el.value : '8'; })(),
    };

    // Đồng bộ checkbox fin_promo_* → checkbox gốc
    syncPromoToMain();

    // Chạy engine tính cho từng căn và lọc kết quả
    const results = [];
    for (const u of data) {
        // Lọc loại hình bàn giao
        if (tVal !== 'all' && u.type !== tVal) continue;

        // Gọi engine tính toán thực – HTLS plan 0 (18 tháng) cho vay bank
        let calcResult = null;
        try {
            calcResult = calculate(true, true, (mVal === 'all' ? 'own-normal' : mVal), 0, u);
        } catch (e) {
            continue;
        }
        if (!calcResult) continue;

        const S = calcResult.S;
        const stages = calcResult.stages;

        // Vốn ban đầu 3 đợt đầu tiên (cọc + ký HĐ + T+15) nếu vay/tiến độ
        const earlyStages = stages.filter(s => !s.label.includes('Ngân hàng') && !s.label.includes('bàn giao') && !s.label.includes('Sổ hồng') && !s.label.includes('Xây T') && !s.label.includes('T+5') && !s.label.includes('T+6') && !s.label.includes('T+7'));
        const initialCapitalNeeded = earlyStages.slice(0, 3).reduce((acc, s) => acc + (s.gross || 0), 0);

        // NGUYÊN TẮC NGHIỆP VỤ TÀI CHÍNH BẤT ĐỘNG SẢN PHÂN BỆỆT THEO LOẠI CĂN:
        // 1. Đối với Căn Giãn Xây (Q4/2028): Chọn TTS 100% thực chất là TTS 100% TIỀN ĐẤT (S.PA.land_total).
        //    Tiền xây dựng được hoãn sang tận T+540 (năm 2028) mới đóng theo tiến độ!
        // 2. Đối với Căn Thô / Hoàn Thiện: Chọn TTS 100% là đóng 100% TỔNG GIÁ TRỊ BĐS (Đất + Xây) ngay trong 15 ngày.
        // 3. Đối với Vay HTLS Bank 70%: Khách chỉ cần ~25-30% Vốn ban đầu (initialCapitalNeeded).
        let requiredCapitalForMethod = 0;
        if (mVal === 'own-early') {
            if (u.type === 'gianXay' && S.PA && S.PA.land_total) {
                // Giãn xây: Chỉ yêu cầu vốn tự có đủ đóng 100% Tiền Đất (sau VAT) trong 15 ngày đầu
                requiredCapitalForMethod = S.PA.land_total;
            } else {
                // Thô / Hoàn thiện: Yêu cầu đủ 100% Tổng giá trị BĐS
                requiredCapitalForMethod = S.totalKHtoCDT || S.grandTotal;
            }
        } else if (mVal === 'own-normal') {
            requiredCapitalForMethod = S.totalKHtoCDT || S.grandTotal;
        } else {
            // Vay bank hoặc Tất cả PTTT
            requiredCapitalForMethod = initialCapitalNeeded;
        }

        // Lọc theo vốn tự có khách hàng chọn
        if (maxBudget !== Infinity && requiredCapitalForMethod > maxBudget) continue;

        // Lọc theo dòng tiền hàng tháng (chỉ áp dụng khi chọn vay bank)
        let monthlyLoanPayment = 0;
        if ((mVal === 'bank' || mVal === 'all') && S.loanData && S.loanData.rows && S.loanData.rows.length > 0) {
            const postSupportRows = S.loanData.rows.filter(r => !r.supported);
            if (postSupportRows.length > 0) {
                monthlyLoanPayment = postSupportRows[0].khTotal;
            }
        }
        if (mVal === 'bank' && maxMonthly !== Infinity && monthlyLoanPayment > maxMonthly) continue;

        results.push({ u, S, stages, initialCapitalNeeded, monthlyLoanPayment });
    }

    // Khôi phục lại giá trị gốc của form chính
    restoreMain(savedMain);

    if (countEl) countEl.textContent = results.length;
    wrap.style.display = 'block';

    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4 border border-secondary rounded-3 bg-dark">
                <i class="bi bi-search text-warning" style="font-size: 2.5rem;"></i>
                <h5 class="fw-bold text-light mt-2 mb-1">Không tìm thấy căn phù hợp với điều kiện tài chính đã chọn!</h5>
                <p class="text-muted small mb-0">Vui lòng nới rộng hạn mức vốn tự có hoặc dòng tiền hàng tháng để xem thêm sản phẩm phù hợp.</p>
            </div>
        `;
        return;
    }

    // Tính match score dựa trên độ khớp tài chính thực
    results.forEach(r => {
        let score = 100;
        if (maxBudget !== Infinity) {
            const ratio = r.initialCapitalNeeded / maxBudget;
            score -= Math.max(0, (ratio - 0.7) * 60); // Trừ điểm nếu ăn quá 70% vốn
        }
        if (mVal === 'bank' && maxMonthly !== Infinity && r.monthlyLoanPayment > 0) {
            const ratio = r.monthlyLoanPayment / maxMonthly;
            score -= Math.max(0, (ratio - 0.75) * 80);
        }
        r.matchScore = Math.max(60, Math.min(100, Math.round(score)));
    });

    // Sắp xếp: matchScore cao nhất trước
    results.sort((a, b) => b.matchScore - a.matchScore);

    container.innerHTML = results.slice(0, 9).map(({ u, S, stages, initialCapitalNeeded, monthlyLoanPayment }) => {
        // Lấy tên phương thức thanh toán
        let ptttName = 'Tiến Độ Thường';
        if (mVal === 'own-early') ptttName = 'TTS 100% (CK 9%)';
        else if (mVal === 'bank') ptttName = 'Vay HTLS Bank 70%';
        else if (mVal === 'all') ptttName = 'Tiến Độ Thường';

        // Màu match score
        const ms = results.find(r => r.u.macan === u.macan)?.matchScore || 95;
        const msBgColor = ms >= 90 ? 'bg-success' : ms >= 75 ? 'bg-warning' : 'bg-secondary';

        // Badges
        const isVOS = (u.macan === 'TL10-53' || u.macan === 'TL10-22');
        const statusBadge = `<span class="badge bg-success"><i class="bi bi-circle-fill me-1" style="font-size:7px;"></i>🟢 Đang mở bán</span>`;
        const vosBadge = isVOS ? `<span class="badge bg-warning text-dark fw-bold"><i class="bi bi-house-check-fill me-1"></i>🏠 VOS: -5% trừ giá + 5% hoàn tiền mặt</span>` : '';
        const goldGiftBadge = `<span class="badge bg-danger"><i class="bi bi-gift-fill me-1"></i>🎁 Quà Vàng Ký HĐMB</span>`;
        const gianXayBadge = u.type === 'gianXay' ? `<span class="badge bg-info text-dark fw-bold"><i class="bi bi-hourglass-split me-1"></i>⏳ Giãn Xây Q4/2028</span>` : '';

        // Đợt đầu chi tiết (3 đợt đầu tiên, không kể bank)
        const earlyStages3 = stages.filter(s => !s.label.includes('Ngân hàng')).slice(0, 3);
        const stage1 = earlyStages3[0];
        const stage2 = earlyStages3[1];
        const stage3 = earlyStages3[2];

        // Tổng thực trả cho CĐT (không kể ngân hàng)
        const totalToCDT = S.totalKHtoCDT || 0;
        const grandTotal = S.grandTotal || 0;

        // Hiển thị dòng tiền hàng tháng chỉ khi có vay
        const monthlyRow = (mVal === 'bank' && monthlyLoanPayment > 0)
            ? `<div class="d-flex justify-content-between">
                <span class="text-light">💳 Trả gốc+lãi/tháng (sau hết HTLS):</span>
                <strong class="text-info">${fmt(monthlyLoanPayment)} VNĐ/tháng</strong>
               </div>`
            : '';

        return `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="p-3 rounded-3 h-100 d-flex flex-column justify-content-between shadow-lg"
                     style="background: #061e18; border: 1.5px solid rgba(255, 209, 102, 0.4); border-radius: 16px;">
                    <div>
                        <!-- Header & Match Score -->
                        <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                            <div>
                                <h5 class="fw-bold mb-0 text-warning" style="font-size: 1.25rem;">${u.macan}</h5>
                                <span class="small text-muted">${typeLabels[u.type] || 'Bàn Giao Hoàn Thiện'}</span>
                            </div>
                            <span class="badge ${msBgColor} px-2 py-1 fw-bold" style="font-size: 0.8rem; box-shadow: 0 0 10px rgba(25,135,84,0.5);">
                                🎯 ${ms}% Khớp
                            </span>
                        </div>

                        <!-- Badges đặc quyền -->
                        <div class="d-flex flex-wrap gap-1 mb-3">
                            ${statusBadge}
                            ${vosBadge}
                            ${goldGiftBadge}
                            ${gianXayBadge}
                        </div>

                        <!-- Thông tin căn cơ bản -->
                        <div class="p-2 rounded-2 mb-2 bg-black border border-dark small" style="line-height: 1.8;">
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Diện tích Đất / Xây:</span>
                                <strong class="text-light">${u.dtDat} m² / ${u.dtXay} m²</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Giá trước VAT:</span>
                                <strong class="text-info">${fmt(u.priceBeforeVat)} VNĐ</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Thực trả CĐT (${ptttName}):</span>
                                <strong class="text-warning">${fmt(totalToCDT)} VNĐ</strong>
                            </div>
                        </div>

                        <!-- Chỉ số tài chính từ engine báo giá -->
                        <div class="p-2 rounded-2 mb-2" style="background: rgba(255, 209, 102, 0.07); border: 1px dashed rgba(255, 209, 102, 0.3); font-size: 0.82rem; line-height: 1.85;">
                            <div class="fw-bold text-warning mb-1" style="font-size: 0.78rem; letter-spacing: 0.5px;">📊 CÁC ĐỢT THANH TOÁN ĐẦU TIÊN</div>
                            ${stage1 ? `<div class="d-flex justify-content-between"><span class="text-muted">Đợt 1 – ${stage1.label}:</span><strong class="text-light">${fmt(stage1.gross)} VNĐ</strong></div>` : ''}
                            ${stage2 ? `<div class="d-flex justify-content-between"><span class="text-muted">Đợt 2 – ${stage2.label}:</span><strong class="text-light">${fmt(stage2.gross)} VNĐ</strong></div>` : ''}
                            ${stage3 ? `<div class="d-flex justify-content-between"><span class="text-muted">Đợt 3 – ${stage3.label}:</span><strong class="text-light">${fmt(stage3.gross)} VNĐ</strong></div>` : ''}
                            <div class="d-flex justify-content-between mt-1 pt-1 border-top border-secondary">
                                <span class="text-light fw-bold">💰 Vốn cần chuẩn bị ban đầu:</span>
                                <strong class="text-warning">${fmt(initialCapitalNeeded)} VNĐ</strong>
                            </div>
                            ${monthlyRow}
                        </div>
                    </div>

                    <!-- Nút hành động nhanh -->
                    <div class="pt-2 d-flex flex-column gap-2">
                        <button type="button" class="btn btn-warning w-100 fw-bold shadow-sm py-2" onclick="selectAndCalculateUnit('${u.macan}')" style="border-radius: 10px; color: #051410;">
                            ⚡ Bấm Tính Chi Tiết Căn Này
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


/* ==========================================================================
   TÍNH NĂNG 2: SOI VỊ TRÍ CĂN ULTRA-HD 300 DPI VỚI GHIM GIỌT NƯỚC VÀNG KIM 3D
   ========================================================================== */
function openLocationSpotlightFromInput() {
    const inputVal = document.getElementById('searchApt') ? document.getElementById('searchApt').value.trim() : '';
    const code = (selectedApt && selectedApt.macan) ? selectedApt.macan : inputVal;
    if (!code) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'Vui lòng chọn hoặc nhập mã căn',
                text: 'Hãy nhập mã căn (ví dụ: ĐLCV1-39, TL10-53...) để soi vị trí HD!',
                confirmButtonColor: '#ffd166'
            });
        } else {
            alert('Vui lòng nhập mã căn (ví dụ: ĐLCV1-39, TL10-53...) để soi vị trí HD!');
        }
        return;
    }
    openLocationSpotlight(code);
}

function getUnitSpotlightInfo(macan) {
    const code = String(macan).toUpperCase();
    let zoneName = "Phân Khu Cao Cấp Vinhomes Sài Gòn Park";
    let roadInfo = "Đường nội khu thoáng mát, kết nối trục chính";
    let amenities = [];

    if (code.startsWith('AS')) {
        zoneName = "Phân Khu Ánh Sáng (Sầm uất & Hiện đại)";
        const roadNum = code.split('-')[0].replace('AS', '');
        roadInfo = `Mặt tiền đường Ánh Sáng ${roadNum} (Lộ giới 13m - 19m)`;
        amenities = [
            "🌿 Kế bên Công viên Ánh Sáng & Mảng xanh nội khu mát mẻ",
            "🏊‍♂️ Gần Bể bơi Resort ngoài trời & Cụm sân Thể thao Pickleball",
            "🏫 Liền kề Hệ thống Trường học liên cấp Vinschool",
            "☕ Cách Đại lộ thương mại sầm uất & Vincom chỉ 2 phút"
        ];
    } else if (code.startsWith('TL')) {
        zoneName = "Phân Khu Tương Lai (Thừa hưởng ngàn tiện ích)";
        const roadNum = code.split('-')[0].replace('TL', '');
        roadInfo = `Mặt tiền đường Tương Lai ${roadNum} (Lộ giới 13m - 23m)`;
        amenities = [
            "🌳 Trực diện Công viên Tương Lai & Hồ cảnh quan thơ mộng",
            "🏋️‍♂️ Cụm sân thể thao ngoài trời, khu Gym & Sân chơi trẻ em",
            "🏫 Gần Trường học quốc tế & Trung tâm y tế Vinmec",
            "🚗 Giao thông kết nối nhanh ra Đại lộ trung tâm (Lộ giới 32m - 40m)"
        ];
    } else if (code.startsWith('DLCV') || code.startsWith('ĐLCV')) {
        zoneName = "Phân Khu Đại Lộ Công Viên (Vị trí Vàng kề Công Viên)";
        const roadNum = code.split('-')[0].replace('ĐLCV', '').replace('DLCV', '');
        roadInfo = `Mặt tiền Đại Lộ Công Viên ${roadNum} (Lộ giới 32m - 40m)`;
        amenities = [
            "🌲 Trực diện Công viên trung tâm & Hồ điều hòa 14ha",
            "⛵ Gần Bến du thuyền xa hoa & Vườn nướng BBQ ngoài trời",
            "🏰 Liền kề Trung tâm thương mại Vincom Mega Mall",
            "🛡️ Không gian sống sinh thái yên tĩnh, an ninh 24/7"
        ];
    } else {
        amenities = [
            "🌿 Mảng xanh công viên nội khu thoáng mát",
            "🏊‍♂️ Gần cụm tiện ích hồ bơi & thể thao ngoài trời",
            "🏫 Gần trường học & trung tâm thương mại dự án"
        ];
    }

    return { zoneName, roadInfo, amenities };
}

function openLocationSpotlight(macan) {
    if (!macan) return;
    const cleanCode = String(macan).trim().toUpperCase();
    const altCode = cleanCode.replace(/Đ/g, 'D').replace(/-/g, '_').toLowerCase();

    const titleEl = document.getElementById('spotlightModalTitle');
    const contentEl = document.getElementById('spotlightBodyContent');
    const modalEl = document.getElementById('locationSpotlightModal');
    if (!modalEl || !contentEl) {
        console.error("Modal element #locationSpotlightModal or content container not found!");
        return;
    }

    if (titleEl) titleEl.innerHTML = `<i class="bi bi-pin-map-fill me-2"></i>SOI VỊ TRÍ CHI TIẾT CĂN: <span style="color:#ffd166;">${cleanCode}</span>`;

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
                    <i class="bi bi-geo-alt-fill me-1"></i>Sơ Đồ 2D CAD HD Toàn Khu (Căn ${cleanCode})
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
                    <img src="assets/pdf_2d_masterplan_hd.jpg" onerror="this.onerror=null; this.src='assets/pdf-masterplan.jpg';" style="width: 100%; height: 100%; object-fit: fill; display: block;" alt="Sơ đồ 2D CAD HD">
                    <!-- Live Glowing Pin Marker -->
                    <div style="position: absolute; left: ${coordX}%; top: ${coordY}%; transform: translate(-50%, -100%); pointer-events: none; z-index: 10;">
                        <div class="px-2.5 py-0.5 rounded-pill shadow-lg fw-bold text-dark d-flex align-items-center gap-1"
                             style="background: #ffd166; border: 1.5px solid #ffffff; font-size: 13.5px; white-space: nowrap; box-shadow: 0 0 18px rgba(255,209,102,0.9) !important;">
                            📍 ${cleanCode}
                        </div>
                        <div class="mx-auto" style="width: 2px; height: 14px; background: linear-gradient(to bottom, #ffd166, #ef4444);"></div>
                        <div class="rounded-circle mx-auto" style="width: 8px; height: 8px; background: #ef4444; border: 1.5px solid #ffffff; box-shadow: 0 0 6px #ef4444;"></div>
                    </div>
                </div>
            </div>
            <div class="text-center mt-2 small text-warning">
                <i class="bi bi-arrows-move me-1"></i> Giữ chuột / vuốt tay để cuộn toàn sơ đồ 2D CAD HD. Bạn có thể nhấn <strong>"Xem Toàn Sơ Đồ"</strong> để xem bao quát dự án!
            </div>
        ` : `
            <div class="p-5 text-center d-flex flex-column align-items-center justify-content-center rounded-3 border border-warning shadow-lg" style="min-height: 480px; background: rgba(255,209,102,0.04);">
                <i class="bi bi-geo-alt text-warning display-3 mb-3"></i>
                <h4 class="fw-bold text-warning mb-2.5">Xin Lỗi: Chưa Cập Nhật Tọa Độ Sơ Đồ 2D Căn ${cleanCode}</h4>
                <p class="mb-3" style="max-width: 500px; line-height: 1.6; color: #cbd5e1 !important; font-size: 0.95rem;">
                    Tọa độ vị trí chính xác trên Sơ đồ 2D CAD HD của căn <strong>${cleanCode}</strong> hiện đang được tiếp tục cập nhật. Dữ liệu vị trí chi tiết của căn này sẽ hiển thị ngay khi bổ sung!
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
                                    <h6 class="fw-bold mb-2.5 mt-2" style="color: #ffd166; font-size: 0.98rem; letter-spacing: 0.2px;"><i class="bi bi-stars me-1"></i>Tiện Ích Nổi Bật Lân Cận:</h6>
                                    <ul class="list-unstyled small mb-0" style="line-height: 1.95; color: #f1f5f9; opacity: 0.95;">
                                        ${info.amenities.map(a => `<li class="mb-1.5">${a}</li>`).join('')}
                                    </ul>
                                </div>
                                <div class="alert alert-dark mb-0 py-2.5 px-3.5 small mt-4" style="background: rgba(255,209,102,0.08); border: 1px dashed rgba(255,209,102,0.35); color: #ffd166; border-radius: 12px; line-height: 1.5;">
                                    <i class="bi bi-info-circle me-1"></i> Chuyển sang Tab 2 để soi trực tiếp trên sơ đồ 2D toàn khu.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: SO TRUC TIEP TREN SO DO 2D CAD HD -->
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
                    Bộ thư viện <code>assets/spotlight/</code> hiện chưa có file ảnh cắt riêng cho căn <strong>${code}</strong>. Hệ thống tự động chuyển sang <strong>Sơ đồ 2D CAD HD</strong> để soi vị trí trực tiếp.
                </p>
                <button type="button" class="btn btn-warning fw-bold px-4 py-2 shadow-lg" onclick="switchToSpotlightCadTab(${x}, ${y})">
                    <i class="bi bi-map-fill me-1"></i> SOI TRỰC TIẾP TRÊN SƠ ĐỒ 2D CAD HD >>
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
                    Rất tiếc, căn <strong class="text-warning fw-bold">${code}</strong> hiện chưa có file ảnh cắt chi tiết và chưa cập nhật tọa độ trên sơ đồ 2D CAD HD. Dữ liệu vị trí căn này sẽ được cập nhật ngay khi bổ sung!
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

function scrollInteractiveCadMap(pctX, pctY) {
    currentCadZoomScale = 1.0;
    setTimeout(() => {
        const viewport = document.getElementById('interactiveMapViewport');
        const inner = document.getElementById('interactiveMapInner');
        if (inner) {
            inner.style.transform = 'scale(1)';
            inner.style.transformOrigin = 'top left';
        }
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
    currentCadZoomScale = Math.min(Math.max(0.3, currentCadZoomScale * factor), 2.5);
    inner.style.transform = `scale(${currentCadZoomScale})`;
    inner.style.transformOrigin = 'top left';
}

function showFullMasterplanZoom() {
    const inner = document.getElementById('interactiveMapInner');
    const viewport = document.getElementById('interactiveMapViewport');
    if (!inner || !viewport) return;
    currentCadZoomScale = 0.35;
    inner.style.transform = `scale(${currentCadZoomScale})`;
    inner.style.transformOrigin = 'top left';
    viewport.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
}

