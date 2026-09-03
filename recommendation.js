/* =============================================================
   CHỨC NĂNG GỢI Ý CĂN PHÙ HỢP THEO TÀI CHÍNH KHÁCH HÀNG & CHUYỂN TAB SO SÁNH
   Dự án: Vinhomes Sài Gòn Park
   File: recommendation.js
   =============================================================*/

// State lưu trữ các căn được chọn để so sánh (Tối đa 2 căn chuyển thẳng Tab So Sánh)
let selectedCompareUnits = [];
let allMatchingResults = [];

/**
 * Tính toán tài chính cho 1 phương thức thanh toán cụ thể
 */
function calculateSingleMatchScore(property, userInputs, methodKey) {
    if (!property) return null;
    if (property.dtDat > 1000 || property.dtXay > 10000) return null;

    const { customer_capital, customer_monthly_cashflow } = userInputs;
    const mappedType = property.type; // 'rough', 'finished', 'gianXay'

    let overrideMethod = 'bank';
    let gracePeriodMonths = 18;

    if (methodKey === 'THANH_TOAN_SOM' || methodKey === 'own-early') {
        overrideMethod = 'own-early';
    } else if (methodKey === 'TIEN_DO_CHUAN' || methodKey === 'own-normal') {
        overrideMethod = 'own-normal';
    } else if (typeof methodKey === 'string' && methodKey.startsWith('VAY_HTLS_')) {
        overrideMethod = 'bank';
        gracePeriodMonths = parseInt(methodKey.replace('VAY_HTLS_', ''), 10) || 18;
    } else if (methodKey === 'bank') {
        overrideMethod = 'bank';
        gracePeriodMonths = 18;
    }

    const supportMap = { 18: 0, 24: 1, 30: 2, 36: 3 };
    const supportIdx = supportMap[gracePeriodMonths] !== undefined ? supportMap[gracePeriodMonths] : 0;

    let calcRes = null;
    try {
        calcRes = calculate(true, true, overrideMethod, supportIdx, property);
    } catch (e) {
        return null;
    }
    if (!calcRes || !calcRes.S) return null;

    const S = calcRes.S;
    const net_price = S.contractPrice || S.grandTotal || (S.PA ? S.PA.allin : property.allin);
    if (net_price <= 0) return null;

    let net_land_price = net_price;
    let net_build_price = 0;
    if (S.PA) {
        net_land_price = S.PA.land_total || Math.round(net_price * 0.6);
        net_build_price = S.PA.const_total || Math.round(net_price * 0.4);
    }

    // BƯỚC 2: Tính Vốn ban đầu cần chuẩn bị (initial_capital) và Tổng vốn tự có cần có (total_required_capital)
    let initial_capital = 0;
    let total_required_capital = 0; // Tổng số tiền túi khách phải trả bằng vốn tự có

    if (overrideMethod === 'own-early') {
        if (mappedType === 'gianXay') {
            initial_capital = net_land_price; // TTS Giãn xây đóng 100% Tiền đất trong 15 ngày
            total_required_capital = net_land_price;
        } else {
            initial_capital = net_price; // Thô / Hoàn thiện đóng 100% BĐS
            total_required_capital = net_price;
        }
    } else if (overrideMethod === 'own-normal') {
        initial_capital = Math.round(net_price * 0.20); // 20% đợt đầu
        // Tiến độ chuẩn CĐT đòi hỏi khách tự bỏ tiền túi 100% BĐS (không vay ngân hàng)
        total_required_capital = (mappedType === 'gianXay') ? net_land_price : net_price;
    } else if (overrideMethod === 'bank') {
        // Vay bank 70%: Khách chỉ cần bỏ ra 30% vốn tự có (70% còn lại Ngân hàng cho vay HTLS 0%)
        const earlyStages = (calcRes.stages || []).filter(s => !s.label.includes('Ngân hàng') && !s.label.includes('bàn giao') && !s.label.includes('Sổ hồng') && !s.label.includes('Xây T') && !s.label.includes('T+5') && !s.label.includes('T+6') && !s.label.includes('T+7'));
        initial_capital = earlyStages.slice(0, 3).reduce((acc, s) => acc + (s.gross || 0), 0) || Math.round(net_price * 0.30);
        total_required_capital = initial_capital;
    }

    // BƯỚC 3: Tính Dòng tiền trả nợ hàng tháng (max_monthly_payment)
    let max_monthly_payment = 0;
    if (overrideMethod === 'bank') {
        if (S.loanData && S.loanData.rows && S.loanData.rows.length > 0) {
            const postSupportRows = S.loanData.rows.filter(r => !r.supported);
            if (postSupportRows.length > 0) {
                max_monthly_payment = postSupportRows[0].khTotal;
            }
        }
        if (!max_monthly_payment) {
            const loan_amount = net_price - initial_capital;
            const total_loan_months = 420;
            const grace_period = gracePeriodMonths;
            const months_to_pay_principal = total_loan_months - grace_period;
            const principal_per_month = loan_amount / months_to_pay_principal;
            const interest_rate_per_month = 0.105 / 12;
            const interest_per_month = loan_amount * interest_rate_per_month;
            max_monthly_payment = Math.round(principal_per_month + interest_per_month);
        }
    }

    // LỌC CỨNG HẠN MỨC NGÂN SÁCH (Hard Budget Filtering - Chuẩn Nghiệp Vụ BĐS)
    // Nếu tổng số tiền túi khách phải trả bằng vốn tự có > Vốn tự có sẵn có -> LOẠI BỎ NGAY
    if (customer_capital > 0 && total_required_capital > customer_capital) {
        return null; // Vốn tự có không đủ chi trả -> Loại bỏ khỏi kết quả
    }

    // Nếu khách chọn hạn mức dòng tiền/tháng (vd: 50 Tr/tháng), chỉ giữ lại các căn có max_monthly_payment <= 50 Tr
    if (customer_monthly_cashflow > 0 && overrideMethod === 'bank' && max_monthly_payment > customer_monthly_cashflow) {
        return null; // Dòng tiền trả nợ vượt quá hạn mức dòng tiền khách chọn -> Không khớp
    }

    // BƯỚC 4: Tính Match Score (%)
    const capital_ratio = (customer_capital > 0 && initial_capital > 0) ? (customer_capital / initial_capital) : 1;
    const capital_score = Math.min(100, capital_ratio * 100);

    let cashflow_ratio = 1;
    let cashflow_score = 100;
    if (overrideMethod === 'bank' && max_monthly_payment > 0 && customer_monthly_cashflow > 0) {
        cashflow_ratio = customer_monthly_cashflow / max_monthly_payment;
        cashflow_score = Math.min(100, cashflow_ratio * 100);
    }

    let base_score = (capital_score * 0.6) + (cashflow_score * 0.4);
    const final_score = Math.round(base_score);

    const methodLabels = {
        'own-early': '💰 TTS 100% (Sớm)',
        'own-normal': '📋 Tiến Độ Thường',
        'bank': `🏦 Vay Bank 70% (HTLS ${gracePeriodMonths}T)`
    };

    return {
        property,
        net_price,
        net_land_price,
        net_build_price,
        initial_capital,
        max_monthly_payment,
        capital_score,
        cashflow_score,
        final_score,
        calcRes,
        overrideMethod,
        methodLabel: methodLabels[overrideMethod] || '🏦 Vay HTLS (Bank)'
    };
}

/**
 * Tính điểm khớp tài chính thông minh (Thử tất cả PTTT nếu khách chọn Tất cả)
 */
function calculateMatchScore(property, userInputs) {
    if (!property) return null;
    const { payment_method } = userInputs;

    if (payment_method && payment_method !== 'all') {
        return calculateSingleMatchScore(property, userInputs, payment_method);
    }

    // Nếu chọn "Tất cả PTTT", duyệt thử 3 phương thức chính và chọn PTTT phù hợp nhất
    const methodsToTest = ['own-early', 'own-normal', 'bank'];
    const validScores = [];

    for (const m of methodsToTest) {
        const res = calculateSingleMatchScore(property, userInputs, m);
        if (res) validScores.push(res);
    }

    if (validScores.length === 0) return null;

    // Ưu tiên xếp hạng PTTT có final_score cao nhất (hoặc Vốn ban đầu thấp nhất)
    validScores.sort((a, b) => b.final_score - a.final_score || a.initial_capital - b.initial_capital);
    return validScores[0];
}

/**
 * Cập nhật nhãn hiển thị con số chính xác trên Thanh Trượt (Range Sliders) khi kéo trượt
 */
function updateFinSliderDisplays() {
    const elB = document.getElementById('finBudget');
    const elDispB = document.getElementById('finBudgetValDisplay');
    if (elB && elDispB) {
        const v = parseInt(elB.value, 10);
        if (v === 0) {
            elDispB.textContent = "Tất cả";
        } else if (v >= 1000) {
            const ty = (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1);
            elDispB.textContent = `${ty} Tỷ VNĐ`;
        } else {
            elDispB.textContent = `${v} Triệu VNĐ`;
        }
    }

    const elCF = document.getElementById('finMonthlyCashflow');
    const elDispCF = document.getElementById('finCashflowValDisplay');
    if (elCF && elDispCF) {
        const v = parseInt(elCF.value, 10);
        if (v === 0) {
            elDispCF.textContent = "Tất cả";
        } else {
            elDispCF.textContent = `${v} Triệu/tháng`;
        }
    }
}

/**
 * Hàm điều khiển chính chạy Bộ Lọc Gợi Ý Căn Phù Hợp
 */
function runFinancialMatcher() {
    const elB = document.getElementById('finBudget');
    const elCF = document.getElementById('finMonthlyCashflow');
    const elM = document.getElementById('finMethod');
    const elT = document.getElementById('finType');

    updateFinSliderDisplays();

    const bVal = elB ? elB.value : '0';
    const cfVal = elCF ? elCF.value : '0';
    const mVal = elM ? elM.value : 'all';
    const tVal = elT ? elT.value : 'all';

    const wrap = document.getElementById('finMatcherResultsWrap');
    const container = document.getElementById('finMatcherResultsContainer');
    const countEl = document.getElementById('finMatchCount');
    if (!wrap || !container) return;

    // Chuyển đổi bVal (Triệu VNĐ), cfVal (Triệu VNĐ) sang con số VNĐ chuẩn
    let customer_capital = 0;
    if (bVal && bVal !== 'all' && bVal !== '0') {
        customer_capital = parseInt(bVal, 10) * 1_000_000;
    }

    let customer_monthly_cashflow = 0;
    if (cfVal && cfVal !== 'all' && cfVal !== '0') {
        customer_monthly_cashflow = parseInt(cfVal, 10) * 1_000_000;
    }

    const userInputs = {
        customer_capital,
        customer_monthly_cashflow,
        payment_method: mVal,
        property_type: tVal
    };

    // Đồng bộ tạm thời Promo Checkboxes (Quà tặng Vàng LUÔN BẰNG TRUE tự động)
    const getCheck = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
    const finPromos = {
        goldGift:    true, // TỰ ĐỘNG CHIẾT KHẤU QUÀ VÀNG CHO TẤT CẢ CĂN
        earlyMoveIn: getCheck('fin_promo_earlyMoveIn'),
        noBlnh:      getCheck('fin_promo_noBlnh'),
        aquafield:   getCheck('fin_promo_aquafield'),
        voucher:     getCheck('fin_promo_voucher'),
        goldGiftCount: 'auto',
        oldHousePrice: (() => { const el = document.getElementById('fin_oldHousePrice'); return el ? el.value : ''; })(),
        voucherPercent: (() => { const el = document.getElementById('fin_voucherPercent'); return el ? el.value : '8'; })(),
    };

    const savedMain = {
        goldGift:    getCheck('promo_goldGift'),
        earlyMoveIn: getCheck('promo_earlyMoveIn'),
        noBlnh:      getCheck('promo_noBlnh'),
        aquafield:   getCheck('promo_aquafield'),
        voucher:     getCheck('promo_voucher'),
        goldGiftCount: (() => { const el = document.getElementById('goldGiftCount'); return el ? el.value : 'auto'; })(),
        oldHousePrice: (() => { const el = document.getElementById('oldHousePrice'); return el ? el.value : ''; })(),
        voucherPercent: (() => { const el = document.getElementById('voucherPercent'); return el ? el.value : '8'; })(),
    };

    const syncPromoToMain = () => {
        const setC = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setC('promo_goldGift', true); // Luôn bật Quà Vàng
        setC('promo_earlyMoveIn', finPromos.earlyMoveIn);
        setC('promo_noBlnh', finPromos.noBlnh);
        setC('promo_aquafield', finPromos.aquafield);
        setC('promo_voucher', finPromos.voucher);
        setV('goldGiftCount', 'auto');
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

    syncPromoToMain();

    const data = (typeof APARTMENT_DATA !== 'undefined' ? APARTMENT_DATA : []);
    const results = [];

    for (const u of data) {
        // Lọc loại hình bàn giao
        if (tVal !== 'all') {
            const typeMap = { 'gianXay': 'gianXay', 'rough': 'rough', 'finished': 'finished', 'GIAN_XAY': 'gianXay', 'THO': 'rough', 'HOAN_THIEN': 'finished' };
            if (u.type !== typeMap[tVal] && u.type !== tVal) continue;
        }

        const scoreObj = calculateMatchScore(u, userInputs);
        if (scoreObj && scoreObj.final_score >= 50) {
            results.push(scoreObj);
        }
    }

    restoreMain(savedMain);

    // Sắp xếp ưu tiên hiển thị theo số tiền Vốn ban đầu cần có từ THẤP ĐẾN CAO, sau đó tới Tổng Giá Thực Trả (Net) từ THẤP ĐẾN CAO
    results.sort((a, b) => a.initial_capital - b.initial_capital || a.net_price - b.net_price);
    allMatchingResults = results;

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

    renderAllMatchedCards();
}

/**
 * Render TOÀN BỘ danh sách căn phù hợp với BỐ CỤC GỌN GÀNG, VUÔNG VẮN, TỐI ƯU CỰC MẠNH CHO MOBILE
 */
function renderAllMatchedCards() {
    const container = document.getElementById('finMatcherResultsContainer');
    if (!container || !allMatchingResults) return;

    const typeLabels = { rough: 'Bàn Giao Thô', finished: 'Hoàn Thiện', gianXay: 'Giãn Xây Q4/2028' };
    const elM = document.getElementById('finMethod');
    const mVal = elM ? elM.value : 'all';

    container.innerHTML = allMatchingResults.map(item => {
        const { property: u, net_price, initial_capital, max_monthly_payment, final_score, methodLabel, overrideMethod, calcRes } = item;

        const targetMethod = overrideMethod || 'own-early';
        const targetSupportIdx = (calcRes && calcRes.S && calcRes.S.supportPlanIdx !== undefined) ? calcRes.S.supportPlanIdx : 0;

        // Màu & Badge Match score
        const msBgColor = final_score >= 90 ? 'bg-success text-white' : final_score >= 70 ? 'bg-warning text-dark' : 'bg-danger text-white';

        // XÁC ĐỊNH SỐ CHỈ VÀNG THEO CSBH V07 & V08 (Tổng giá gốc gồm VAT và KPBT)
        const origAllin = (calcRes && calcRes.S && calcRes.S.PA && calcRes.S.PA.allin) ? calcRes.S.PA.allin : (u.priceBeforeVat || 0);
        let goldText = 'Quà 1 Chỉ Vàng';
        if (origAllin >= 20e9) {
            goldText = 'Quà 5 Chỉ Vàng';
        } else if (origAllin >= 10e9) {
            goldText = 'Quà 3 Chỉ Vàng';
        }

        // Badges đặc quyền gọn gàng với padding thoải mái
        const isVOS = (u.macan === 'TL10-53' || u.macan === 'TL10-22');
        const vosBadge = isVOS ? `<span class="badge bg-warning text-dark fw-bold shadow-sm px-2.5 py-1" style="font-size: 0.72rem; border-radius: 10px;">VOS: -5% HĐMB + 5% tiền mặt</span>` : '';
        const goldBadge = `<span class="badge gold-gift-badge fw-bold shadow-sm px-2.5 py-1" style="font-size: 0.72rem; border-radius: 10px; background: linear-gradient(135deg, #ffd166 0%, #f59e0b 100%); color: #04120e !important; font-weight: 800;">${goldText}</span>`;
        const gianXayBadge = u.type === 'gianXay' ? `<span class="badge bg-info text-dark fw-bold shadow-sm px-2.5 py-1" style="font-size: 0.72rem; border-radius: 10px;">Giãn Xây Q4/2028</span>` : '';

        const monthlyRow = (max_monthly_payment > 0)
            ? `<div class="d-flex justify-content-between align-items-center py-1">
                <span class="text-light opacity-90 fw-medium">Trả góp/tháng:</span>
                <strong class="text-info font-monospace fw-bold" style="font-size: 0.88rem;">${fmt(max_monthly_payment)}&nbsp;<span class="fw-normal opacity-90" style="font-size: 0.75rem;">/tháng</span></strong>
               </div>`
            : '';

        const isChecked = selectedCompareUnits.includes(u.macan);

        return `
            <div class="col-12 col-md-6 col-lg-4 mb-3">
                <div class="card-recommendation-item rounded-4 h-100 d-flex flex-column justify-content-between shadow position-relative"
                     style="background: linear-gradient(160deg, #092e26 0%, #041a14 100%); border: 1.5px solid rgba(255, 209, 102, 0.35); border-radius: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.4); padding: 16px 18px;">
                    <div>
                        <!-- Header: Mã Căn & Match Score -->
                        <div class="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom border-secondary border-opacity-30">
                            <div class="d-flex align-items-center gap-2">
                                <h5 class="fw-extrabold mb-0 text-warning" style="font-size: 1.25rem; letter-spacing: 0.3px; text-shadow: 0 0 8px rgba(255,209,102,0.3);">${u.macan}</h5>
                                <span class="badge type-badge ${u.type === 'gianXay' ? 'type-badge-gianxay' : (u.type === 'rough' ? 'type-badge-rough' : 'type-badge-finished')} px-2.5 py-1 fw-bold" style="font-size: 0.72rem; border-radius: 10px;">${typeLabels[u.type] || 'Bàn Giao Hoàn Thiện'}</span>
                            </div>
                            <span class="badge ${msBgColor} px-2.5 py-1 fw-bold shadow-sm" style="font-size: 0.8rem; border-radius: 10px;">
                                ${final_score}% Khớp
                            </span>
                        </div>

                        <!-- Badges & Ô Tick So Sánh (Thêm mt-2.5 pt-0.5 để không đụng đường viền trên) -->
                        <div class="d-flex justify-content-between align-items-center mb-2.5 mt-2.5 pt-0.5 flex-wrap gap-1.5">
                            <div class="d-flex align-items-center gap-1.5 flex-wrap">
                                <span class="badge bg-success bg-gradient text-white px-2.5 py-1" style="font-size: 0.72rem; border-radius: 10px;">Đang mở bán</span>
                                ${goldBadge}
                                ${vosBadge}
                            </div>
                            <div class="form-check m-0 d-flex align-items-center gap-1 cursor-pointer">
                                <input class="form-check-input cursor-pointer m-0" type="checkbox" id="chk_cmp_${u.macan}" 
                                       style="width: 1rem; height: 1rem;" 
                                       onchange="toggleCompareUnit('${u.macan}')" ${isChecked ? 'checked' : ''}>
                                <label class="form-check-label text-warning extra-small fw-bold mb-0 cursor-pointer" for="chk_cmp_${u.macan}" style="font-size: 0.78rem;">
                                    Tick So Sánh
                                </label>
                            </div>
                        </div>

                        <!-- Spec Grid (Glassmorphism rộng rãi, không bị chạm viền) -->
                        <div class="rounded-3 mb-2.5" style="background: rgba(3, 20, 16, 0.85); border: 1px solid rgba(255, 209, 102, 0.25); padding: 12px 14px; font-size: 0.82rem; line-height: 1.65;">
                            <div class="d-flex justify-content-between align-items-center py-1">
                                <span class="text-light opacity-75">Diện tích Đất / Xây:</span>
                                <strong class="text-white fw-bold">${u.dtDat} m² &nbsp;•&nbsp; ${u.dtXay} m²</strong>
                            </div>
                            <div class="d-flex justify-content-between align-items-center py-1">
                                <span class="text-light opacity-75">Giá Gốc CĐT:</span>
                                <strong class="text-info font-monospace fw-bold">${fmt(u.priceBeforeVat)}&nbsp;<span class="fw-normal opacity-85" style="font-size: 0.75rem;">VNĐ</span></strong>
                            </div>
                            <div class="d-flex justify-content-between align-items-center py-1 border-top border-secondary border-opacity-25 mt-1 pt-1.5">
                                <span class="text-warning fw-bold">Thực Trả CĐT (Net):</span>
                                <strong class="text-warning font-monospace fw-bold" style="font-size: 0.92rem; text-shadow: 0 0 8px rgba(255,209,102,0.3);">${fmt(net_price)}&nbsp;<span class="fw-normal opacity-90" style="font-size: 0.75rem;">VNĐ</span></strong>
                            </div>
                        </div>

                        <!-- Financial Box (Khung Vốn & Dòng Tiền) -->
                        <div class="rounded-3 mb-2" style="background: rgba(255, 209, 102, 0.07); border: 1px dashed rgba(255, 209, 102, 0.45); padding: 12px 14px; font-size: 0.82rem; line-height: 1.65;">
                            <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-warning border-opacity-25 mb-1.5 pb-1.5">
                                <span class="text-light opacity-90 fw-bold">Phương thức tính:</span>
                                <span class="badge bg-warning text-dark fw-bold shadow-sm px-2.5 py-1" style="font-size: 0.74rem; border-radius: 10px;">${methodLabel}</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center py-1">
                                <span class="text-white fw-bold">Vốn ban đầu cần có:</span>
                                <strong class="text-warning font-monospace fw-bold" style="font-size: 0.9rem;">${fmt(initial_capital)}&nbsp;<span class="fw-normal opacity-90" style="font-size: 0.75rem;">VNĐ</span></strong>
                            </div>
                            ${monthlyRow}
                        </div>
                    </div>

                    <!-- Button CTA -->
                    <div class="mt-1.5">
                        <button type="button" class="btn btn-warning w-100 fw-extrabold shadow-sm py-2.5 text-dark btn-calc-unit" onclick="selectAndCalculateUnit('${u.macan}', '${targetMethod}', ${targetSupportIdx})" 
                                style="border-radius: 12px; background: linear-gradient(135deg, #ffd166 0%, #f39c12 100%); border: none; font-size: 0.88rem; font-weight: 800; letter-spacing: 0.2px; padding: 10px 16px;">
                            BẤM TÍNH CHI TIẾT CĂN NÀY
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* =============================================================
   TÍNH NĂNG TICK CHỌN 2 CĂN ĐỂ SO SÁNH THẲNG TRÊN TAB SO SÁNH HỆ THỐNG
   =============================================================*/

function toggleCompareUnit(macan) {
    const idx = selectedCompareUnits.indexOf(macan);
    if (idx >= 0) {
        selectedCompareUnits.splice(idx, 1);
    } else {
        if (selectedCompareUnits.length >= 2) {
            alert('Giao diện so sánh chuẩn của hệ thống cho phép chọn 2 căn hộ (Căn A & Căn B)! Vui lòng bỏ chọn 1 căn trước nếu muốn thay đổi.');
            const chk = document.getElementById(`chk_cmp_${macan}`);
            if (chk) chk.checked = false;
            return;
        }
        selectedCompareUnits.push(macan);
    }

    updateCompareStickyBar();
}

function updateCompareStickyBar() {
    let bar = document.getElementById('finCompareStickyBar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'finCompareStickyBar';
        document.body.appendChild(bar);
    }

    if (selectedCompareUnits.length === 0) {
        bar.style.setProperty('display', 'none', 'important');
        bar.innerHTML = '';
        return;
    }

    bar.style.removeProperty('display');

    const unitPills = selectedCompareUnits.map(code => 
        `<span class="cmp-code-pill">${code}</span>`
    ).join('<span class="cmp-code-sep">•</span>');

    const btnDisabled = selectedCompareUnits.length < 2 ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : '';
    const btnText = selectedCompareUnits.length < 2 ? 'Tick 1 căn nữa' : '🚀 So Sánh 2 Căn';

    bar.innerHTML = `
        <div class="cmp-left-info">
            <span class="cmp-count-tag">⚖️ ${selectedCompareUnits.length}/2</span>
            <div class="cmp-codes-wrap">${unitPills}</div>
        </div>
        <div class="cmp-right-btns">
            <button type="button" class="cmp-action-btn" ${btnDisabled} onclick="goToSystemCompareTab()">
                ${btnText}
            </button>
            <button type="button" class="cmp-close-btn" onclick="clearSelectedCompareUnits()" title="Bỏ chọn tất cả">
                <i class="bi bi-x-circle-fill"></i>
            </button>
        </div>
    `;
}

function clearSelectedCompareUnits() {
    selectedCompareUnits = [];
    document.querySelectorAll('.fin-cmp-checkbox, [id^="chk_cmp_"]').forEach(c => c.checked = false);
    updateCompareStickyBar();
}

/**
 * TỰ ĐỘNG CHUYỂN SANG TAB SO SÁNH HIỆN TẠI VỚI GIÁ THỰC TRẢ (CÓ ĐỒNG BỘ ƯU ĐÃI)
 */
function goToSystemCompareTab() {
    if (selectedCompareUnits.length < 2) {
        alert('Vui lòng tick chọn đủ 2 căn hộ để thực hiện so sánh song song!');
        return;
    }

    const code1 = selectedCompareUnits[0];
    const code2 = selectedCompareUnits[1];

    // Nạp mã căn vào 2 ô input Tab So Sánh
    const elApt1 = document.getElementById('cmpApt1');
    const elApt2 = document.getElementById('cmpApt2');
    if (elApt1) elApt1.value = code1;
    if (elApt2) elApt2.value = code2;

    // Đọc phương thức PTTT từ bộ lọc Gợi Ý Căn để đồng bộ sang Tab So Sánh
    const elM = document.getElementById('finMethod');
    const mVal = elM ? elM.value : 'own-early';
    let cmpMethodVal = 'own-early';
    if (mVal === 'own-early' || mVal === 'THANH_TOAN_SOM') cmpMethodVal = 'own-early';
    else if (mVal === 'own-normal' || mVal === 'TIEN_DO_CHUAN') cmpMethodVal = 'own-normal';
    else if (mVal === 'bank' || mVal.startsWith('VAY_HTLS')) cmpMethodVal = 'bank_0';

    const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setV('cmpMethod1', cmpMethodVal);
    setV('cmpMethod2', cmpMethodVal);

    // Đọc trạng thái các Chương Trình Ưu Đãi (Quà Vàng LUÔN = true)
    const getCheck = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
    const pGold = true; // Luôn tự động bật Quà Vàng
    const pEarly = getCheck('fin_promo_earlyMoveIn');
    const pNoBlnh = getCheck('fin_promo_noBlnh');
    const pAqua = getCheck('fin_promo_aquafield');
    const pVoucher = getCheck('fin_promo_voucher');

    const setC = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    // Đồng bộ ưu đãi sang Căn 1 trong Tab So Sánh
    setC('cmpGold1', pGold);
    setC('cmpEarly1', pEarly);
    setC('cmpNoBlnh1', pNoBlnh);
    setC('cmpAqua1', pAqua);
    if (pVoucher && document.getElementById('fin_oldHousePrice')) {
        setV('cmpVoucher1', document.getElementById('fin_oldHousePrice').value || '');
    }

    // Đồng bộ ưu đãi sang Căn 2 trong Tab So Sánh
    setC('cmpGold2', pGold);
    setC('cmpEarly2', pEarly);
    setC('cmpNoBlnh2', pNoBlnh);
    setC('cmpAqua2', pAqua);
    if (pVoucher && document.getElementById('fin_oldHousePrice')) {
        setV('cmpVoucher2', document.getElementById('fin_oldHousePrice').value || '');
    }

    // Chuyển sang Tab So Sánh 2 Căn hiện tại của hệ thống
    if (typeof showTab === 'function') {
        showTab('compare2');
    }

    // Render ngay lập tức bảng so sánh 2 căn với đầy đủ ưu đãi đã đồng bộ
    if (typeof renderCompare2FullTab === 'function') {
        renderCompare2FullTab();
    }

    // Cuộn mượt lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Global binding
window.runFinancialMatcher = runFinancialMatcher;
window.calculateMatchScore = calculateMatchScore;
window.toggleCompareUnit = toggleCompareUnit;
window.goToSystemCompareTab = goToSystemCompareTab;
window.clearSelectedCompareUnits = clearSelectedCompareUnits;
window.updateFinSliderDisplays = updateFinSliderDisplays;

document.addEventListener('DOMContentLoaded', () => {
    updateFinSliderDisplays();

    // Tự động lắng nghe sự kiện trượt slider trên Mobile / Touch / Mouse khi người dùng bắt đầu kéo
    const finB = document.getElementById('finBudget');
    const finCF = document.getElementById('finMonthlyCashflow');
    if (finB) {
        finB.addEventListener('input', () => { updateFinSliderDisplays(); runFinancialMatcher(); });
        finB.addEventListener('change', () => { updateFinSliderDisplays(); runFinancialMatcher(); });
    }
    if (finCF) {
        finCF.addEventListener('input', () => { updateFinSliderDisplays(); runFinancialMatcher(); });
        finCF.addEventListener('change', () => { updateFinSliderDisplays(); runFinancialMatcher(); });
    }

    const finM = document.getElementById('finMethod');
    const finT = document.getElementById('finType');
    if (finM) finM.addEventListener('change', runFinancialMatcher);
    if (finT) finT.addEventListener('change', runFinancialMatcher);

    // Không tự động hiển thị 48 căn khi mới vào trang. Giữ danh sách ẩn cho đến khi khách kéo trượt hoặc bấm Tìm Căn.
});
