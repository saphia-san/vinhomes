/* =============================================================
   GIAO DIỆN & TƯƠNG TÁC NGƯỜI DÙNG (UI & RENDERING)
   Dự án: Vinhomes Sài Gòn Park
   Quản lý Tabs, Event Listeners, Render Kết quả, Bảng so sánh & Lịch sử
   =============================================================*/

let selectedApt = null;

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
    const nowLight = document.body.classList.contains('light-theme');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.innerHTML = nowLight
            ? '<i class="bi bi-moon-stars-fill" style="color:#2563eb;"></i><span class="d-none d-sm-inline ms-1"> Giao Diện Tối</span>'
            : '<i class="bi bi-sun-fill" style="color:#d97706;"></i><span class="d-none d-sm-inline ms-1"> Giao Diện Sáng</span>';
    }
    try { localStorage.setItem('vhp_theme', nowLight ? 'light' : 'dark'); } catch (e) { }
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
});

// --- Tab Navigation ---
function showTab(name) {
    ['overview', 'input', 'result', 'loan', 'compare2'].forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) {
            el.style.display = (t === name) ? 'block' : 'none';
            el.classList.toggle('active', t === name);
            el.classList.toggle('show', t === name);
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
            <span class="search-item-meta" style="font-size:0.8rem;">${typeLabel[a.type]} &bull; ${fmt(a.priceBeforeVat)} VNĐ</span>
        </div>`).join('');
    dd.style.display = 'block';
}

function selectApt(macan) {
    const data = (typeof APARTMENT_DATA !== 'undefined' ? APARTMENT_DATA : []);
    const clean = (macan || '').trim().toUpperCase().replace(/\s+/g, '');
    const apt = data.find(a => a.macan.toUpperCase().replace(/\s+/g, '') === clean || a.macan === macan);
    if (!apt) return;

    selectedApt = apt;

    if (document.getElementById('searchApt')) document.getElementById('searchApt').value = apt.macan;
    if (document.getElementById('searchDropdown')) document.getElementById('searchDropdown').style.display = 'none';

    if (document.getElementById('manualPrice')) document.getElementById('manualPrice').value = fmt(apt.priceBeforeVat);
    if (document.getElementById('manualDtDat')) document.getElementById('manualDtDat').value = apt.dtDat;
    if (document.getElementById('manualDtXay')) document.getElementById('manualDtXay').value = apt.dtXay;

    const typeLabel = { rough: '🧱 Thô', finished: '🏠 Hoàn thiện', gianXay: '🏗️ Giãn xây' };
    if (document.getElementById('selectedCanLabel')) document.getElementById('selectedCanLabel').textContent = apt.macan;
    let detail = `<span style="color:#cbd5e1;">${typeLabel[apt.type] || 'Hoàn thiện'} &nbsp;|&nbsp; DT Đất: ${apt.dtDat} m² &nbsp;|&nbsp; DT Xây: ${apt.dtXay} m²</span><br>`;
    detail += `<span style="color:#cbd5e1; font-size:0.9rem;">Giá trước VAT: </span><strong style="color:#ffd166; font-size:1.15rem; font-weight:800; text-shadow:0 0 10px rgba(255,209,102,0.3);">${fmt(apt.priceBeforeVat)} VNĐ</strong>`;
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

// --- Render Result Tab ---
function renderResult(stages, ckDetails, S, comparisonHTML = '') {
    window.lastResultS = S;
    const {
        propValue, typeLabel, paymentMethod, ckPct, ckVnd,
        totalCk, totalCkAll, cfDiscount, actualPaymentDate, cfDetailsStr,
        totalGross, totalKHtoCDT, totalKHtoBank, grandTotal, loanData, showBankSim, PA
    } = S;

    const aptCodeStr = S.macan ? S.macan : 'Nhập thủ công';

    let methodDetailText = '';
    if (paymentMethod === 'own-early') {
        methodDetailText = '💰 Vốn tự có – Thanh toán sớm';
    } else if (paymentMethod === 'own-normal') {
        methodDetailText = '📋 Vốn tự có – Tiến độ thường';
    } else {
        const plans = (PA && PA.p_const > 0) ? SALES_POLICY.interestSupport.roughAndGianXay : SALES_POLICY.interestSupport.finished;
        const plan = plans[S.supportPlanIdx || 0];
        const planName = plan ? plan.label : 'HTLS 0%';
        methodDetailText = `🏦 Vay ngân hàng (${planName})`;
    }

    const methodLabel = methodDetailText;

    /* ---- Bảng lịch thanh toán ---- */
    const renderSingleRow = s => `
<tr>
    <td class="stage-col">Đợt ${s.no}&nbsp;<span class="badge-stage ${s.badge}">${s.label}</span></td>
    <td class="date-col">${fmtDate(s.date)}</td>
    <td class="amount">${fmt(s.gross)}</td>
    <td class="discount">${s.ck > 0 ? '–&nbsp;' + fmt(s.ck) : '—'}</td>
    <td class="net-amount">${fmt(s.net)}</td>
    <td style="font-size:0.78rem;color:var(--text-muted);">${s.note || ''}</td>
</tr>`;

    let stageRows = '';
    if (stages.isSplit) {
        stageRows = `
<tr style="background:rgba(212,175,55,0.22); border-left:4px solid #d4af37;">
    <td colspan="6" style="color:#f3e5ab; font-weight:800; font-size:0.95rem; padding:12px 14px; letter-spacing:0.5px;">
        <i class="bi bi-geo-alt-fill me-2"></i>GIAI ĐOẠN 1: TIẾN ĐỘ THANH TOÁN TIỀN ĐẤT
    </td>
</tr>
${stages.landStages.map(renderSingleRow).join('')}
<tr style="background:rgba(52,211,153,0.2); border-left:4px solid #34d399;">
    <td colspan="6" style="color:#6ee7b7; font-weight:800; font-size:0.95rem; padding:12px 14px; letter-spacing:0.5px;">
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
    <td>${d.label} <span style="font-size:0.75rem;color:var(--text-muted);">${d.appliedOn ? '(áp dụng trên ' + d.appliedOn + ')' : ''}</span></td>
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
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">${ckPct.toFixed(1)}% + quà ${fmt(ckVnd)} VNĐ</div>
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
            <div style="height:250px; position:relative;">
                <canvas id="chart-breakdown-canvas"></canvas>
            </div>
        </div>
    </div>
    <div class="col-md-7">
        <div class="card-custom h-100 chart-box-white" style="background:#ffffff !important; border:1px solid #e2e8f0; color:#0f172a;">
            <div class="card-title" style="color:#0f172a !important;"><i class="bi bi-bar-chart-line-fill me-2" style="color:#d97706;"></i>So Sánh Chi Phí Các Gói Thanh Toán</div>
            <div style="height:250px; position:relative;">
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
                    <i class="bi bi-arrow-repeat" style="font-size:3rem; color:var(--accent-light);"></i>
                    <h4 class="mt-3 text-white fw-bold">So Sánh 2 Căn Hộ Song Song</h4>
                    <p class="text-white opacity-90 mt-2" style="font-size:0.95rem;">Vui lòng nhập <strong>Mã Căn 1 (Căn A)</strong> và <strong>Mã Căn 2 (Căn B)</strong> ở trên, sau đó bấm nút <strong style="color:var(--accent-light);">"So Sánh"</strong></p>
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
                if (s.subItems && s.subItems.length > 0) {
                    return s.subItems.map((item, idx) => {
                        if (idx === 0) {
                            return `<tr>
                                <td class="stage-col" rowspan="${s.subItems.length}" style="vertical-align:middle;">Đợt ${s.no}&nbsp;<span class="badge-stage ${s.badge}">${s.label}</span></td>
                                <td class="date-col" rowspan="${s.subItems.length}" style="vertical-align:middle;">${s.dateLabel || fmtDate(s.date)}</td>
                                <td class="amount">${fmt(item.gross)}</td>
                                <td class="discount">—</td>
                                <td class="net-amount">${fmt(item.gross)}</td>
                            </tr>`;
                        } else {
                            return `<tr>
                                <td class="amount">${fmt(item.gross)}</td>
                                <td class="discount">—</td>
                                <td class="net-amount">${fmt(item.gross)}</td>
                            </tr>`;
                        }
                    }).join('');
                } else {
                    const labelCell = s.label ? `Đợt ${s.no}&nbsp;<span class="badge-stage ${s.badge}">${s.label}</span>` : `—`;
                    return `<tr>
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
            <div style="font-weight:800; font-size:1.1rem; color:var(--accent-light);">
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
            <td style="padding:10px;">
                <span class="badge" style="background:${macanBg}; color:${macanColor}; font-weight:800; font-size:12px; border:1px solid #fde68a; padding:4px 8px;">
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
            html: `<div style="max-height:420px; overflow-y:auto; overflow-x:auto; -webkit-overflow-scrolling:touch; border-radius:10px; border:1px solid ${rowBorderColor}; background:#ffffff;">
                <table class="table align-middle m-0" style="font-size:13px; text-align:left; background:#ffffff; color:#0f172a;">
                    <thead style="position:sticky; top:0; background:${tableHeaderBg}; color:${tableHeaderColor}; z-index:2; border-bottom:2px solid #cbd5e1;">
                        <tr>
                            <th style="padding:10px; color:${tableHeaderColor}; font-weight:700;">Thời gian</th>
                            <th style="padding:10px; color:${tableHeaderColor}; font-weight:700;">Mã Căn</th>
                            <th style="padding:10px; color:${tableHeaderColor}; font-weight:700;">PTTT</th>
                            <th class="text-end" style="padding:10px; color:${tableHeaderColor}; font-weight:700;">Giá chưa VAT</th>
                            <th class="text-end" style="padding:10px; color:${tableHeaderColor}; font-weight:700;">Thực trả CĐT</th>
                            <th class="text-center" style="padding:10px; color:${tableHeaderColor}; font-weight:700;">Thao tác</th>
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
