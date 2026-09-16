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
    const net_price = (S && S.totalKHtoCDT > 0) ? S.totalKHtoCDT : (S.contractPrice || S.grandTotal || (S.PA ? S.PA.allin : property.allin));
    if (net_price <= 0) return null;

    let net_land_price = net_price;
    let net_build_price = 0;
    if (S.PA) {
        net_land_price = S.PA.land_total || Math.round(net_price * 0.6);
        net_build_price = S.PA.const_total || Math.round(net_price * 0.4);
    }

    // BƯỚC 2: Tính Vốn ban đầu cần chuẩn bị (initial_capital) và Tổng vốn tự có cần có (total_required_capital)
    let initial_capital = 0;
    let total_required_capital = 0; // Tổng số tiền túi khách phải trả bằng vốn tự có (không tính nợ vay bank)

    if (overrideMethod === 'own-early') {
        if (mappedType === 'gianXay') {
            initial_capital = net_land_price; // TTS Giãn xây đóng 100% Tiền đất trong 15 ngày
            total_required_capital = net_land_price;
        } else {
            initial_capital = net_price; // Thô / Hoàn thiện đóng 100% BĐS (Đã trừ Voucher & CSBH)
            total_required_capital = net_price;
        }
    } else if (overrideMethod === 'own-normal') {
        const full_price = S.contractPrice || S.origAllin || (S.PA ? S.PA.allin : net_price);
        initial_capital = Math.round(full_price * 0.20); // 20% đợt 1 & 2 (Cọc + Ký HĐMB)
        // Tiến độ chuẩn CĐT đòi hỏi khách tự bỏ tiền túi 100% BĐS (không vay ngân hàng)
        total_required_capital = (mappedType === 'gianXay') ? net_land_price : net_price;
    } else if (overrideMethod === 'bank') {
        // Vay bank 70%: Vốn tự có ban đầu 30% chính là toàn bộ số tiền mặt thực trả CĐT (S.totalKHtoCDT = net_price)
        initial_capital = net_price;
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
            const currentRate = (typeof document !== 'undefined' && document.getElementById('interestRate'))
                ? (parseFloat(document.getElementById('interestRate').value) || 13.0)
                : 13.0;
            const interest_rate_per_month = (currentRate / 100) / 12;
            const interest_per_month = loan_amount * interest_rate_per_month;
            max_monthly_payment = Math.round(principal_per_month + interest_per_month);
        }
    }

    // LỌC CỨNG HẠN MỨC NGÂN SÁCH (Hard Budget Filtering - Chuẩn Nghiệp Vụ BĐS)
    // 1. Nếu số vốn ban đầu cần chuẩn bị đợt 1 > Vốn tự có sẵn có -> LOẠI BỎ NGAY
    if (customer_capital > 0 && initial_capital > customer_capital) {
        return null; // Vốn ban đầu đợt 1 không đủ chi trả -> Loại bỏ
    }

    // 2. Với PTTT Không Vay (Thanh toán sớm & Tiến độ chuẩn):
    // Khách không vay bank nên Tổng vốn tự có cần có = 100% Giá căn (hoặc 100% Đất nếu Giãn xây).
    // Nếu Vốn tự có của khách < Tổng giá căn -> Không đủ khả năng tự thanh toán theo tiến độ/TTS -> LOẠI BỎ
    if (customer_capital > 0 && (overrideMethod === 'own-early' || overrideMethod === 'own-normal') && total_required_capital > customer_capital) {
        return null;
    }

    // 3. Với PTTT Vay Bank: Nếu khách chọn hạn mức dòng tiền/tháng (vd: 50 Tr/tháng), chỉ giữ lại các căn có max_monthly_payment <= hạn mức
    if (customer_monthly_cashflow > 0 && overrideMethod === 'bank' && max_monthly_payment > customer_monthly_cashflow) {
        return null; // Dòng tiền trả nợ vượt quá hạn mức dòng tiền khách chọn -> Loại bỏ
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
        'own-early': 'Thanh toán sớm',
        'own-normal': 'Tiến độ chuẩn',
        'bank': `Vay bank 70% (HTLS ${gracePeriodMonths}T)`
    };

    const true_total_cost = (S && S.grandTotal > 0) ? S.grandTotal : (net_price + (S && S.totalKHtoBank ? S.totalKHtoBank : 0));

    return {
        property,
        net_price,
        true_total_cost,
        net_land_price,
        net_build_price,
        initial_capital,
        max_monthly_payment,
        capital_score,
        cashflow_score,
        final_score,
        calcRes,
        overrideMethod,
        methodLabel: methodLabels[overrideMethod] || 'Vay HTLS (Bank)'
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

    // Ưu tiên PTTT có TỔNG CHI PHÍ TÀI CHÍNH THỰC TẾ (gồm cả gốc+lãi sau HTLS) thấp nhất cho khách (chiết khấu cao nhất)
    validScores.sort((a, b) => a.true_total_cost - b.true_total_cost || a.initial_capital - b.initial_capital);
    return validScores[0];
}

/**
 * Cập nhật nhãn hiển thị con số chính xác trên Thanh Trượt (Range Sliders) khi kéo trượt
 */
function updateFinSliderDisplays() {
    const elB = document.getElementById('finBudget');
    const elDispB = document.getElementById('finBudgetValDisplay');
    if (elB && elDispB) {
        const v = parseInt(elB.value, 10) || 1900;
        if (v >= 20000) {
            elDispB.textContent = "20 Tỷ+ VNĐ";
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
        const v = parseInt(elCF.value, 10) || 46;
        if (v >= 200) {
            elDispCF.textContent = "200 Triệu+/tháng";
        } else {
            elDispCF.textContent = `${v} Triệu/tháng`;
        }
    }
}
window.updateFinSliderDisplays = updateFinSliderDisplays;

/**
 * Hàm điều khiển chính chạy Bộ Lọc Gợi Ý Căn Phù Hợp
 */
function runFinancialMatcher() {
    const elB = document.getElementById('finBudget');
    const elCF = document.getElementById('finMonthlyCashflow');
    const elM = document.getElementById('finMethod');
    const elT = document.getElementById('finType');
    const elBank = document.getElementById('finBank');

    updateFinSliderDisplays();

    const bVal = elB ? elB.value : '0';
    const cfVal = elCF ? elCF.value : '0';
    const mVal = elM ? elM.value : 'all';
    const tVal = elT ? elT.value : 'all';
    const bankVal = elBank ? elBank.value : 'all';

    const wrap = document.getElementById('finMatcherResultsWrap');
    const container = document.getElementById('finMatcherResultsContainer');
    const countEl = document.getElementById('finMatchCount');
    if (!wrap || !container) return;

    // Chuyển đổi bVal (Triệu VNĐ), cfVal (Triệu VNĐ) sang con số VNĐ chuẩn
    let customer_capital = 0;
    if (bVal && bVal !== 'all' && bVal !== '0') {
        const bNum = parseInt(bVal, 10);
        customer_capital = (bNum >= 20000) ? Infinity : bNum * 1_000_000;
    }

    let customer_monthly_cashflow = 0;
    if (cfVal && cfVal !== 'all' && cfVal !== '0') {
        const cfNum = parseInt(cfVal, 10);
        customer_monthly_cashflow = (cfNum >= 200) ? Infinity : cfNum * 1_000_000;
    }

    const userInputs = {
        customer_capital,
        customer_monthly_cashflow,
        payment_method: mVal,
        property_type: tVal
    };

    // Đồng bộ tạm thời Promo Checkboxes
    const getCheck = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

    const activePromos = {
        goldGift: getCheck('fin_promo_goldGift') || getCheck('promo_goldGift'),
        earlyMoveIn: getCheck('fin_promo_earlyMoveIn'),
        noBlnh: true,
        aquafield: getCheck('fin_promo_aquafield') || getCheck('promo_aquafield'),
        voucher: getCheck('fin_promo_voucher') || getCheck('promo_voucher'),
        voucherAmount: getVal('fin_voucherAmount') || getVal('voucherAmount'),
    };

    const savedMain = {
        goldGift: getCheck('promo_goldGift'),
        noBlnh: getCheck('promo_noBlnh'),
        aquafield: getCheck('promo_aquafield'),
        voucher: getCheck('promo_voucher'),
        goldGiftCount: getVal('goldGiftCount') || 'auto',
        voucherAmount: getVal('voucherAmount'),
    };

    const applyPromosToMain = () => {
        const setC = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setC('promo_goldGift', activePromos.goldGift);
        setC('promo_noBlnh', activePromos.noBlnh);
        setC('promo_aquafield', activePromos.aquafield);
        setC('promo_voucher', activePromos.voucher);
        if (activePromos.voucherAmount) setV('voucherAmount', activePromos.voucherAmount);
    };

    const restoreMain = (saved) => {
        const setC = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setC('promo_goldGift', saved.goldGift);
        setC('promo_noBlnh', saved.noBlnh);
        setC('promo_aquafield', saved.aquafield);
        setC('promo_voucher', saved.voucher);
        setV('goldGiftCount', saved.goldGiftCount);
        setV('voucherAmount', saved.voucherAmount);
    };

    applyPromosToMain();

    const data = (typeof APARTMENT_DATA !== 'undefined' ? APARTMENT_DATA : []);
    const results = [];

    for (const u of data) {
        // Bỏ qua các căn đã bán, chỉ gợi ý các căn Đang mở bán
        if (u.daBan === true || u.status === 'daBan') continue;

        // Lọc chương trình Về ở sớm (chỉ 2 căn TL10-22 và TL10-53 hỗ trợ VOS)
        const isVos = !!(u && (u.macan === 'TL10-22' || u.macan === 'TL10-53' || u.vos === true));
        if (activePromos.earlyMoveIn && !isVos) continue;

        // Lọc loại hình bàn giao
        if (tVal !== 'all') {
            const typeMap = { 'gianXay': 'gianXay', 'rough': 'rough', 'finished': 'finished', 'GIAN_XAY': 'gianXay', 'THO': 'rough', 'HOAN_THIEN': 'finished' };
            if (u.type !== typeMap[tVal] && u.type !== tVal) continue;
        }

        // Lọc ngân hàng hỗ trợ cho vay
        if (bankVal !== 'all') {
            const bInfo = u.bankInfo;
            if (!bInfo || !bInfo.allBanks) continue;
            const bList = bInfo.allBanks.map(b => b.toUpperCase());
            const targetB = bankVal.toUpperCase();
            let matchBank = false;
            if (targetB === 'MBB' || targetB === 'MB') {
                matchBank = bList.includes('MBB') || bList.includes('MB');
            } else {
                matchBank = bList.includes(targetB);
            }
            if (!matchBank) continue;
        }

        const scoreObj = calculateMatchScore(u, userInputs);
        if (scoreObj && scoreObj.final_score >= 50) {
            results.push(scoreObj);
        }
    }

    restoreMain(savedMain);

    // Sắp xếp ưu tiên hiển thị theo TỔNG CHI PHÍ TÀI CHÍNH THỰC TẾ (gồm cả gốc+lãi sau HTLS) từ THẤP ĐẾN CAO
    results.sort((a, b) => a.true_total_cost - b.true_total_cost || a.initial_capital - b.initial_capital);
    allMatchingResults = results;

    if (countEl) countEl.textContent = results.length;
    wrap.style.display = 'block';

    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4 px-3 card-custom sec-card-theme rounded-3 shadow-sm">
                <i class="bi bi-search mb-2" style="font-size: 2.8rem; color: #d97706; display: inline-block;"></i>
                <h4 class="fw-bold mt-2 mb-2" style="font-size: 1.15rem;">KHÔNG TÌM THẤY CĂN PHÙ HỢP VỚI ĐIỀU KIỆN TÀI CHÍNH ĐÃ CHỌN!</h4>
                <div class="sub-text small mb-0" style="font-size: 0.92rem;">Vui lòng nới rộng hạn mức vốn tự có hoặc dòng tiền hàng tháng để xem thêm sản phẩm phù hợp.</div>
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

    const typeLabels = { rough: 'Thô', finished: 'Hoàn thiện', gianXay: 'Giãn xây' };
    const elM = document.getElementById('finMethod');
    const mVal = elM ? elM.value : 'all';

    const cardsHtml = allMatchingResults.map(item => {
        const { property: u, net_price, initial_capital, max_monthly_payment, final_score, methodLabel, overrideMethod, calcRes } = item;

        const targetMethod = overrideMethod || 'own-early';
        const targetSupportIdx = (calcRes && calcRes.S && calcRes.S.supportPlanIdx !== undefined) ? calcRes.S.supportPlanIdx : 0;

        // Màu & Badge Match score
        const msBgColor = final_score >= 90 ? 'bg-success text-white' : final_score >= 70 ? 'bg-warning text-dark' : 'bg-danger text-white';

        // XÁC ĐỊNH SỐ CHỈ VÀNG THEO CSBH (Tổng giá gốc gồm VAT và KPBT)
        const origAllin = (calcRes && calcRes.S && calcRes.S.PA && calcRes.S.PA.allin) ? calcRes.S.PA.allin : (u.priceBeforeVat || 0);
        // Quà tặng Vàng: chỉ hiển thị nếu chương trình còn hiệu lực (SP.promotions.goldGift != null)
        const goldGiftActive = (typeof SALES_POLICY !== 'undefined' && SALES_POLICY.promotions && SALES_POLICY.promotions.goldGift !== null);
        let goldText = 'Quà 1 chỉ vàng';
        if (origAllin >= 20e9) {
            goldText = 'Quà 5 chỉ vàng';
        } else if (origAllin >= 10e9) {
            goldText = 'Quà 3 chỉ vàng';
        }

        // Badges đặc quyền gọn gàng với padding thoải mái
        const isVOS = (u.macan === 'TL10-53' || u.macan === 'TL10-22' || u.macan === 'TL10-51' || u.vos === true);
        const vosBadge = isVOS ? `<span class="badge bg-warning text-dark fw-bold shadow-sm px-2.5 py-1" style="font-size: 0.72rem; border-radius: 10px;">VOS: -5% HĐMB + 5% tiền mặt</span>` : '';
        const goldBadge = goldGiftActive ? `<span class="badge gold-gift-badge fw-bold shadow-sm px-2.5 py-1" style="font-size: 0.72rem; border-radius: 10px; background: linear-gradient(135deg, #ffd166 0%, #f59e0b 100%); color: #04120e !important; font-weight: 800;">${goldText}</span>` : '';
        const gianXayBadge = u.type === 'gianXay' ? `<span class="badge bg-info text-dark fw-bold shadow-sm px-2.5 py-1" style="font-size: 0.72rem; border-radius: 10px;">Giãn xây</span>` : '';

        const ROW = 'display:flex; justify-content:space-between; align-items:center; padding:5px 0; font-size:0.82rem;';
        const monthlyRow = (max_monthly_payment > 0)
            ? `<div class="rec-row-border" style="${ROW}">
                <span class="rec-label">Trả góp/tháng:</span>
                <strong class="font-monospace rec-val-highlight" style="font-size:0.86rem; font-weight:700;">${fmt(max_monthly_payment)}&nbsp;<span class="rec-unit" style="font-weight:400; font-size:0.73rem;">/tháng</span></strong>
               </div>`
            : '';

        const isChecked = selectedCompareUnits.includes(u.macan);

        return `
            <div class="col-12 col-md-6 col-lg-4 mb-3">
                <div class="card-recommendation-item rounded-4 h-100 d-flex flex-column justify-content-between shadow position-relative"
                     style="background: linear-gradient(160deg, #092e26 0%, #041a14 100%); border: 1.5px solid rgba(255, 209, 102, 0.35); border-radius: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.4); padding: 14px 16px;">
                    <div>
                        <!-- Header: Mã Căn, Loại Hình & Ô Tick So Sánh trên cùng 1 hàng -->
                        <div class="d-flex align-items-center justify-content-between gap-2 mb-2 pb-2 rec-card-header-row" style="border-bottom: 1px solid rgba(255, 209, 102, 0.25);">
                            <div class="d-flex align-items-center gap-2 flex-wrap">
                                <span class="fw-extrabold rec-unit-code mb-0">${u.macan}</span>
                                <span class="badge type-badge ${u.type === 'gianXay' ? 'type-badge-gianxay' : (u.type === 'rough' ? 'type-badge-rough' : 'type-badge-finished')} px-2 py-1 fw-bold" style="font-size: 0.72rem; border-radius: 8px;">${typeLabels[u.type] || 'Hoàn thiện'}</span>
                            </div>

                            <label class="m-0 d-inline-flex align-items-center cursor-pointer ms-auto" for="chk_cmp_${u.macan}" style="background: transparent; border: none; padding: 0; white-space: nowrap; user-select: none; gap: 5px;">
                                <input class="form-check-input cursor-pointer" type="checkbox" id="chk_cmp_${u.macan}" 
                                       style="width: 1rem; height: 1rem; accent-color: #f59e0b; margin: 0 !important; flex-shrink: 0;" 
                                       onchange="toggleCompareUnit('${u.macan}')" ${isChecked ? 'checked' : ''}>
                                <span class="fw-bold mb-0 cursor-pointer rec-cmp-label" style="font-size: 0.78rem;">
                                    Tick so sánh
                                </span>
                            </label>
                        </div>

                        <!-- Badges Ưu Đãi (Quà Vàng, VOS) -->
                        ${(goldBadge || vosBadge) ? `
                        <div class="d-flex align-items-center gap-1.5 flex-wrap mb-2 mt-1">
                            ${goldBadge}
                            ${vosBadge}
                        </div>` : ''}

                        <!-- Info Box: gộp Spec + Financial -->
                        <div class="rounded-3 mb-2 mt-2.5 rec-inner-box" style="padding:8px 14px;">
                            <div style="${ROW}">
                                <span class="rec-label">Diện tích đất / xây:</span>
                                <strong class="rec-val">${u.dtDat} m² • ${u.dtXay} m²</strong>
                            </div>
                            <div class="rec-row-border" style="${ROW}">
                                <span class="rec-label">Giá bán chưa VAT, KPBT:</span>
                                <strong class="font-monospace rec-val" style="font-weight:600;">${fmt(u.priceBeforeVat)}&nbsp;<span class="rec-unit" style="font-weight:400; font-size:0.73rem;">VNĐ</span></strong>
                            </div>
                            ${u.bankInfo ? (() => {
                                const sc = (u.bankInfo.soCap && u.bankInfo.soCap.length) ? u.bankInfo.soCap.join(', ') : '';
                                const tc = (u.bankInfo.thuCap && u.bankInfo.thuCap.length) ? u.bankInfo.thuCap.join(', ') : '';
                                const isSame = sc === tc && sc !== '';
                                const showTC = tc && !isSame;
                                return `<div class="rec-row-border" style="${ROW} font-size:0.78rem; align-items:flex-start;">
                                    <span class="rec-label"><i class="bi bi-bank2 me-1"></i>Bank cho vay:</span>
                                    <span class="rec-bank-val" style="text-align:right;">
                                        ${sc || 'N/A'}${showTC ? `<div class="rec-bank-sub" style="font-weight:500; font-size:0.75rem; margin-top:2px;">Thứ cấp: ${tc}</div>` : ''}
                                    </span>
                                </div>`;
                            })() : ''}
                            <div class="rec-row-border" style="${ROW}">
                                <span class="rec-label-net" style="font-weight:600;">Thực trả CĐT:</span>
                                <strong class="font-monospace rec-val-net" style="font-size:0.9rem; font-weight:700;">${fmt(net_price)}&nbsp;<span class="rec-unit-gold" style="font-weight:400; font-size:0.73rem;">VNĐ</span></strong>
                            </div>
                            <!-- Divider mục tài chính -->
                            <div class="rec-divider" style="margin:4px 0;"></div>
                            <div style="${ROW}">
                                <span class="rec-label">Phương thức:</span>
                                <span class="rec-method-val" style="font-weight:600; font-size:0.8rem;">${methodLabel}</span>
                            </div>
                            <div class="rec-row-border" style="${ROW}">
                                <span class="rec-label-capital" style="font-weight:600;">Vốn ban đầu cần có:</span>
                                <strong class="font-monospace rec-val-capital" style="font-size:0.9rem; font-weight:700;">${fmt(initial_capital)}&nbsp;<span class="rec-unit-gold" style="font-weight:400; font-size:0.73rem;">VNĐ</span></strong>
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

    requestAnimationFrame(() => {
        container.innerHTML = cardsHtml;
    });
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
            alert('Giao diện so sánh chuẩn của hệ thống cho phép chọn 2 căn (Căn A & Căn B)! Vui lòng bỏ chọn 1 căn trước nếu muốn thay đổi.');
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
    const btnText = selectedCompareUnits.length < 2 ? 'Tick 1 căn nữa' : 'So sánh';

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
        alert('Vui lòng tick chọn đủ 2 căn để thực hiện so sánh song song!');
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
    const pNoBlnh = true;
    const pAqua = getCheck('fin_promo_aquafield');
    const pVoucher = getCheck('fin_promo_voucher');

    const setC = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    // Đồng bộ ưu đãi sang Căn 1 trong Tab So Sánh
    setC('cmpGold1', pGold);
    setC('cmpEarly1', pEarly);
    setC('cmpNoBlnh1', pNoBlnh);
    setC('cmpAqua1', pAqua);
    setC('cmpVoucher1', pVoucher);
    if (pVoucher && document.getElementById('fin_voucherAmount')) {
        setV('cmpVoucherAmt1', document.getElementById('fin_voucherAmount').value || '');
        if (typeof toggleCmpVoucherInput === 'function') toggleCmpVoucherInput(1);
    }

    // Đồng bộ ưu đãi sang Căn 2 trong Tab So Sánh
    setC('cmpGold2', pGold);
    setC('cmpEarly2', pEarly);
    setC('cmpNoBlnh2', pNoBlnh);
    setC('cmpAqua2', pAqua);
    setC('cmpVoucher2', pVoucher);
    if (pVoucher && document.getElementById('fin_voucherAmount')) {
        setV('cmpVoucherAmt2', document.getElementById('fin_voucherAmount').value || '');
        if (typeof toggleCmpVoucherInput === 'function') toggleCmpVoucherInput(2);
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
window.debouncedRunFinancialMatcher = debouncedRunFinancialMatcher;
window.calculateMatchScore = calculateMatchScore;
window.toggleCompareUnit = toggleCompareUnit;
window.goToSystemCompareTab = goToSystemCompareTab;
window.clearSelectedCompareUnits = clearSelectedCompareUnits;
window.updateFinSliderDisplays = updateFinSliderDisplays;

let finDebounceTimer = null;
function debouncedRunFinancialMatcher() {
    clearTimeout(finDebounceTimer);
    finDebounceTimer = setTimeout(() => {
        requestAnimationFrame(() => {
            runFinancialMatcher();
        });
    }, 220);
}

function initFinMatcherEvents() {
    updateFinSliderDisplays();

    const finB = document.getElementById('finBudget');
    const finCF = document.getElementById('finMonthlyCashflow');

    const bindSliderEvents = (el) => {
        if (!el) return;
        ['input', 'change', 'pointermove', 'touchmove'].forEach(evt => {
            el.addEventListener(evt, updateFinSliderDisplays, { passive: true });
        });
        el.addEventListener('input', debouncedRunFinancialMatcher);
        el.addEventListener('change', runFinancialMatcher);
    };

    bindSliderEvents(finB);
    bindSliderEvents(finCF);

    const finM = document.getElementById('finMethod');
    const finT = document.getElementById('finType');
    if (finM) finM.addEventListener('change', runFinancialMatcher);
    if (finT) finT.addEventListener('change', runFinancialMatcher);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinMatcherEvents);
} else {
    initFinMatcherEvents();
}
