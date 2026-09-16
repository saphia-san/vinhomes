/* =============================================================
   ĐỘNG CƠ TÍNH TOÁN (CALCULATOR ENGINE)
   Dự án: Vinhomes Sài Gòn Park
   Thuần toán học, tính toán công thức & xây dựng lịch thanh toán
   =============================================================*/

// --- Helper Functions ---
function parseNum(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace(/[^0-9]/g, '');
    return parseInt(str, 10) || 0;
}

function fmt(n) {
    if (isNaN(n) || n === null || n === undefined) return '0';
    return Math.round(n).toLocaleString('vi-VN');
}

function parseDate(str) {
    if (!str) return null;
    if (str instanceof Date) return str;
    const parts = str.split('/');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return new Date(str);
}

function fmtDate(d) {
    if (!d) return '';
    if (typeof d === 'string') return d;
    if (!(d instanceof Date) || typeof d.getTime !== 'function' || isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}/${m}/${y}`;
}

function addDays(date, days) {
    const res = new Date(date);
    res.setDate(res.getDate() + days);
    return res;
}

function addMonths(date, months) {
    const res = new Date(date);
    res.setMonth(res.getMonth() + months);
    return res;
}

function diffDays(d1, d2) {
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/* =============================================================
   BÓC TÁCH GIÁ TỰ ĐỘNG (Công thức bí mật CĐT)
   Đơn giá Tiền SDĐ: 9.740.326 VNĐ/m2 đất
   Đơn giá Xây dựng (Giãn xây): 8.500.000 VNĐ/m2 xây
   =============================================================*/
const UNIT_LAND_FEE = 9_740_326;     // VNĐ/m2 đất
const UNIT_CONST_PRICE = 8_500_000;   // VNĐ/m2 xây (Giãn xây)

function breakdownPrice(currentLandPrice, dtDat, dtXay, type, tienSDĐ, fixedKpbt) {
    const p_const = (type === 'gianXay') ? Math.round(UNIT_CONST_PRICE * dtXay) : 0;
    const kpbt = (fixedKpbt && fixedKpbt > 0) ? fixedKpbt : Math.round((currentLandPrice + p_const) * 0.005);
    const landFee = tienSDĐ > 0 ? tienSDĐ : Math.round(UNIT_LAND_FEE * dtDat);

    if (type === 'gianXay') {
        const p_land = currentLandPrice; // Giá Đất sau CK
        const vat_land = Math.round((p_land - landFee) * 0.10);
        const vat_const = Math.round(p_const * 0.10);

        return {
            p_land, p_const,
            vat_land, vat_const,
            kpbt,
            land_total: p_land + vat_land,
            const_total: p_const + vat_const,
            allin: p_land + vat_land + p_const + vat_const + kpbt
        };
    } else {
        const p_land = currentLandPrice;
        const vat_land = Math.round((p_land - landFee) * 0.10);
        const allin = p_land + vat_land + kpbt;

        return {
            p_land, p_const: 0,
            vat_land, vat_const: 0,
            kpbt,
            land_total: p_land + vat_land,
            const_total: 0,
            allin
        };
    }
}

/* =============================================================
   TÍNH LỊCH TRẢ NỢ NGÂN HÀNG (LOAN SCHEDULE)
   Hình thức HTLS 0% X tháng (X = 18/24/30/36 tháng):
   - Trong X tháng HTLS: KH KHÔNG trả GỐC + LÃI (Gốc = 0, Lãi KH = 0).
   - CĐT trả toàn bộ LÃI cho ngân hàng. Dư nợ gốc giữ nguyên (kéo dài thời gian trả nợ gốc).
   - Sau X tháng HTLS: KH trả GỐC phân bổ cho số tháng còn lại (totalMonths - supportMonths) + LÃI.
   =============================================================*/
function calcLoan(principal, annualRatePct, termYears, supportPlan, disbursementDate) {
    const totalMonths = termYears * 12;
    const monthlyRate = (annualRatePct / 100) / 12;
    const supportMonths = supportPlan ? supportPlan.months : 0;
    const remainingMonths = Math.max(1, totalMonths - supportMonths);
    const principalPerM = Math.round(principal / remainingMonths);

    let balance = principal;
    const rows = [];
    let totalCDT = 0;       // Lãi CĐT trả hộ trong HTLS
    let totalKHPays = 0;    // Tổng KH trả (gốc + lãi KH)
    let totalKHInterest = 0; // Chỉ lãi KH thực trả (sau HTLS)

    for (let m = 1; m <= totalMonths; m++) {
        const interest = Math.round(balance * monthlyRate);
        const date_m = addMonths(disbursementDate, m - 1);
        const supported = (m <= supportMonths);

        let principalThisM = 0;
        let khInterest = 0;

        if (supported) {
            totalCDT += interest;  // CĐT trả lãi, KH không trả
            principalThisM = 0;
            khInterest = 0;
            // Dư nợ gốc không giảm trong thời gian ân hạn nợ gốc HTLS
        } else {
            principalThisM = (m === totalMonths) ? balance : principalPerM;
            khInterest = interest;
            totalKHInterest += khInterest; // Chỉ cộng lãi KH thực trả
            balance -= principalThisM;
        }

        const khTotal = principalThisM + khInterest;
        totalKHPays += khTotal;

        rows.push({
            m, date: date_m,
            principal: principalThisM,
            interest, khInterest, khTotal,
            balance: Math.max(0, balance),
            supported
        });
    }

    // totalInterest = lãi KH thực trả (không tính lãi CĐT đỡ)
    const totalInterest = totalKHInterest;

    return {
        rows, principal, annualRatePct, termYears, totalMonths,
        supportPlan, supportMonths, disbursementDate,
        totalInterest, totalCDT, totalKHPays, principalPerM
    };
}

/* =============================================================
   TÍNH TOÁN CHÍNH (CALCULATE)
   =============================================================*/
function calculate(silent = false, returnOnly = false, overrideMethod = null, overrideSupportIdx = null, overrideApt = null, overridePromos = null, overrideLoanTerm = null) {
    // Lấy dữ liệu căn (ưu tiên từ overrideApt, selectedApt, fallback autocomplete hoặc nhập thủ công)
    let apt = overrideApt || ((typeof selectedApt !== 'undefined') ? selectedApt : null);

    if (!apt && typeof document !== 'undefined' && document.getElementById('searchApt')) {
        const searchVal = document.getElementById('searchApt').value.trim().toUpperCase().replace(/\s+/g, '');
        if (searchVal && typeof APARTMENT_DATA !== 'undefined') {
            const found = APARTMENT_DATA.find(a =>
                a.macan.toUpperCase().replace(/\s+/g, '') === searchVal ||
                a.macan.toUpperCase().replace(/\s+/g, '').includes(searchVal)
            );
            if (found) {
                if (!overrideApt && typeof selectApt === 'function') selectApt(found.macan);
                apt = found;
            }
        }
    }

    if (!apt && typeof document !== 'undefined' && document.getElementById('manualPrice')) {
        const price = parseNum(document.getElementById('manualPrice').value);
        const dtDat = parseFloat(document.getElementById('manualDtDat').value) || 0;
        const dtXay = parseFloat(document.getElementById('manualDtXay').value) || 0;
        const type = document.getElementById('apartmentType').value;
        if (!price || !dtDat) {
            if (!silent) alert('⚠️ Chưa nhận diện được mã căn!\nVui lòng chọn mã căn từ danh sách gợi ý hoặc nhập Giá & Diện tích thủ công.');
            return null;
        }
        if (type === 'gianXay' && !dtXay) {
            if (!silent) alert('⚠️ Vui lòng nhập Diện tích Xây dựng cho loại Giãn xây!');
            return null;
        }
        apt = { macan: 'Nhập thủ công', type, dtDat, dtXay, priceBeforeVat: price, vat: 0, kpbt: 0 };
    }

    if (!apt) return null;

    // Base Tiền SDĐ và KPBT
    let tienSDĐ = (apt && apt.tienSDĐ > 0) ? apt.tienSDĐ : ((apt && apt.vat > 0) ? Math.round(apt.priceBeforeVat - (apt.vat / 0.10)) : ((apt && apt.dtDat) ? Math.round(UNIT_LAND_FEE * apt.dtDat) : 0));
    let fixedKpbt = (apt && apt.kpbt > 0) ? apt.kpbt : 0;

    const doc = (typeof document !== 'undefined') ? document : null;
    const paymentMethod = overrideMethod || (doc && doc.getElementById('paymentMethod') ? doc.getElementById('paymentMethod').value : 'own-early');
    const startDate = (doc && doc.getElementById('startDate')) ? (parseDate(doc.getElementById('startDate').value) || new Date()) : new Date();
    const signDateStr = doc && doc.getElementById('signDate') ? doc.getElementById('signDate').value : '';
    const signDate = (signDateStr && parseDate(signDateStr)) ? parseDate(signDateStr) : addDays(startDate, 15);
    const handoverDateStr = doc && doc.getElementById('handoverDate') ? doc.getElementById('handoverDate').value : '';
    const handoverDate = (handoverDateStr && parseDate(handoverDateStr)) ? parseDate(handoverDateStr) : addDays(startDate, 547); // ~Q4/2027
    const pinkBookDate = addMonths(handoverDate, 12);

    const isVosApt = !!(apt && (apt.macan === 'TL10-22' || apt.macan === 'TL10-53' || apt.vos === true));
    const promoEarlyMoveIn = (overridePromos && overridePromos.earlyMoveIn !== undefined) ? (!!overridePromos.earlyMoveIn && isVosApt) : isVosApt;
    const promoAquafield = (overridePromos && overridePromos.aquafield !== undefined) ? !!overridePromos.aquafield : (doc && doc.getElementById('promo_aquafield') ? doc.getElementById('promo_aquafield').checked : true);
    const promoNoBlnh = (overridePromos && overridePromos.noBlnh !== undefined) ? !!overridePromos.noBlnh : true;

    const useCashFlow = false;
    const actualPaymentDate = startDate;
    const loanPct = (doc && doc.getElementById('loanPct')) ? (parseInt(doc.getElementById('loanPct').value) || 70) : 70;
    const interestRate = (doc && doc.getElementById('interestRate')) ? (parseFloat(doc.getElementById('interestRate').value) || 13) : 13;
    const loanTermYears = (overrideLoanTerm !== null && overrideLoanTerm !== undefined) ? overrideLoanTerm : ((doc && doc.getElementById('loanTerm')) ? (parseInt(doc.getElementById('loanTerm').value) || 20) : 20);
    const supportPlanIdx = (overrideSupportIdx !== null && overrideSupportIdx !== undefined) ? overrideSupportIdx : (doc && doc.getElementById('interestSupportPlan') ? (parseInt(doc.getElementById('interestSupportPlan').value) || 0) : 0);
    const showBankSim = true;

    const SP = SALES_POLICY;
    const typeLabel = { rough: 'Thô', finished: 'Hoàn thiện', gianXay: 'Giãn xây' }[apt.type] || 'Thô';

    /* --- Bước 1: Chiết khấu tính lùi (trên Giá Đất trước VAT) --- */
    let ckDetails = [];
    const p_const = (apt.type === 'gianXay') ? ((apt.p_const && apt.p_const > 0) ? apt.p_const : Math.round(UNIT_CONST_PRICE * apt.dtXay)) : 0;
    const origLandPrice = apt.priceBeforeVat - p_const;
    const origPA = breakdownPrice(origLandPrice, apt.dtDat, apt.dtXay, apt.type, tienSDĐ, fixedKpbt);
    const origAllin = origPA.allin;
    let baseLandPrice = origLandPrice;
    if (paymentMethod === 'bank') {
        const plans = (apt.type === 'finished') ? SP.interestSupport.finished : SP.interestSupport.roughAndGianXay;
        const plan = plans[supportPlanIdx];
        if (plan && plan.priceIncrease > 0) {
            const incAmt = Math.round(baseLandPrice * (plan.priceIncrease / 100));
            baseLandPrice += incAmt;
        }
    }
    let currentLandPrice = baseLandPrice;
    let totalCkVnd = 0;

    // b) Chiết khấu % Chính Sách Thanh Toán (TTS & BLNH)
    // - Dòng Giãn xây: Áp chiết khấu trên GIÁ ĐẤT chưa VAT (origLandPrice)
    // - Dòng Thô & Hoàn thiện: Áp chiết khấu trên TỔNG GIÁ BÁN chưa VAT (priceBeforeVat)
    const baseP = (apt && apt.type === 'gianXay') ? origLandPrice : (apt && apt.priceBeforeVat > 0 ? apt.priceBeforeVat : currentLandPrice);

    if (paymentMethod === 'own-early') {
        const pct = SP.ownCapital.earlyPayment.standard;
        const ckAmt = Math.round(baseP * (pct / 100));
        currentLandPrice -= ckAmt;
        totalCkVnd += ckAmt;
        ckDetails.push({ label: 'Thanh toán sớm', pct, vnd: ckAmt, deductType: 'price' });
    } else if (paymentMethod === 'own-normal') {
        const pct = SP.ownCapital.normalProgress;
        if (pct > 0) {
            const ckAmt = Math.round(baseP * (pct / 100));
            currentLandPrice -= ckAmt;
            totalCkVnd += ckAmt;
            ckDetails.push({ label: 'Chiết khấu tiến độ chuẩn (Vốn tự có)', pct, vnd: ckAmt, deductType: 'price' });
        }
    } else {
        const pct = SP.ownCapital.normalProgress;
        if (pct > 0) {
            const ckAmt = Math.round(baseP * (pct / 100));
            currentLandPrice -= ckAmt;
            totalCkVnd += ckAmt;
            ckDetails.push({ label: 'Chiết khấu tiến độ chuẩn (vay NH)', pct, vnd: ckAmt, deductType: 'price' });
        }
        const plans = (apt.type === 'finished') ? SP.interestSupport.finished : SP.interestSupport.roughAndGianXay;
        const plan = plans[supportPlanIdx];
        if (plan && plan.extraDiscount > 0) {
            const ckAmt = Math.round(baseP * (plan.extraDiscount / 100));
            currentLandPrice -= ckAmt;
            totalCkVnd += ckAmt;
            ckDetails.push({ label: `CK bổ sung – ${plan.label}`, pct: plan.extraDiscount, vnd: ckAmt, deductType: 'price' });
        }
    }

    if (promoNoBlnh) {
        const noBlnhPct = 0.5;
        const ckAmt = Math.round(currentLandPrice * (noBlnhPct / 100));
        currentLandPrice -= ckAmt;
        totalCkVnd += ckAmt;
        ckDetails.push({ label: 'Từ chối bảo lãnh ngân hàng (0.5%)', pct: noBlnhPct, vnd: ckAmt, deductType: 'price' });
    }

    // c) Chiết khấu Cam kết về ở sớm (5% tính trên Giá ĐÃ TRỪ CK TTS & BLNH) - Chỉ áp dụng tự động cho TL10-22 và TL10-53
    if (promoEarlyMoveIn) {
        const earlyMoveInAmt = Math.round(currentLandPrice * (SP.promotions.earlyMoveIn / 100));
        currentLandPrice -= earlyMoveInAmt;
        totalCkVnd += earlyMoveInAmt;
        ckDetails.push({ label: 'Cam kết về ở sớm (5% trừ giá HĐ)', pct: SP.promotions.earlyMoveIn, vnd: earlyMoveInAmt, deductType: 'price' });
        // 5% hoàn tiền mặt sau khi về ở (không trừ vào giá HĐ)
        ckDetails.push({ label: 'Cam kết về ở sớm (5% hoàn tiền sau khi về ở)', pct: 5.0, vnd: earlyMoveInAmt, deductType: 'cashback' });
    }

    let appliedVoucher = 0;
    const promoVoucher = (overridePromos && overridePromos.voucher !== undefined) ? !!overridePromos.voucher : (doc && doc.getElementById('promo_voucher') ? doc.getElementById('promo_voucher').checked : false);
    if (promoVoucher) {
        if (overridePromos && overridePromos.voucherAmount !== undefined) {
            appliedVoucher = parseNum(overridePromos.voucherAmount) || 0;
        } else if (doc && doc.getElementById('voucherAmount')) {
            appliedVoucher = parseNum(doc.getElementById('voucherAmount').value) || 0;
        }
    }
    if (appliedVoucher > 0) {
        ckDetails.push({ label: 'Voucher Sở Hữu Nhà Vinhomes', pct: 0, vnd: appliedVoucher, deductType: 'voucher' });
    }

    if (promoAquafield) {
        ckDetails.push({ label: 'Quà Aquafield (voucher spa)', pct: 0, vnd: SP.promotions.aquafield, deductType: 'gift' });
    }

    currentLandPrice = Math.max(0, currentLandPrice);

    // c) Tính lại bộ giá sau chiết khấu
    const PA = breakdownPrice(currentLandPrice, apt.dtDat, apt.dtXay, apt.type, tienSDĐ, fixedKpbt);

    /* --- Bước 2: Lịch thanh toán (Chuẩn Công Ty Tính) --- */
    const DEP = SP.paymentSchedule.deposit; // 300tr
    let stages = [];

    // Nhãn ngày bàn giao dự kiến theo loại căn
    const handoverLabel = apt.type === 'gianXay' ? 'Quý 4/2028' : 'Quý 4/2027';
    const pinkBookLabel = 'Theo TB cấp sổ';

    if (apt.type === 'gianXay') {
        const LT = PA.land_total;
        const CT = PA.const_total;
        const KPBT = PA.kpbt;
        const L_p = PA.p_land;
        const C_p = PA.p_const;
        const L_vat5 = Math.round((L_p - tienSDĐ) * 0.05 * 0.10);
        const C_vat5 = Math.round(C_p * 0.05 * 0.10);

        if (paymentMethod === 'own-early') {
            const L_sign10 = Math.round(LT * 0.10) - DEP;
            const L_5gua = Math.round(L_p * 0.05);
            const L_85 = Math.round(LT * 0.85);

            stages.push({ no: 1, label: 'Ký TTĐC (Đất)', date: startDate, gross: DEP, badge: 'badge-deposit', note: '—' });
            stages.push({
                no: 2, label: 'Ký CN HĐMB (Dự Kiến)', date: signDate, gross: L_sign10 + L_5gua, badge: 'badge-sign', note: '—',
                subItems: [
                    { label: '10% giá bán gồm VAT', gross: L_sign10, note: 'Đã trừ 300 Tr tiền cọc Đợt 1' },
                    { label: '5% Chưa gồm VAT', gross: L_5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({ no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(signDate, 15), gross: L_85, badge: 'badge-progress', note: '—' });
            stages.push({ no: 4, label: 'Thông báo cdt (Dự kiến)', date: handoverDate, dateLabel: 'Quý 2/2027', gross: L_vat5, badge: 'badge-handover', note: '—' });

            const X_d0 = addDays(signDate, 540);
            const X_15 = Math.round(CT * 0.15);
            const X_5gua = Math.round(C_p * 0.05);
            const X_bg25 = Math.round(CT * 0.25);

            stages.push({
                no: 5, label: 'Đợt 2 + 540 Ngày', date: X_d0, gross: X_15 + X_5gua, badge: 'badge-progress', note: '—',
                subItems: [
                    { label: '15% giá bán gồm VAT', gross: X_15, note: '—' },
                    { label: '5% Chưa gồm VAT', gross: X_5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({ no: 6, label: 'T+555', date: addDays(signDate, 555), gross: Math.round(CT * 0.10), badge: 'badge-progress', note: '—' });
            stages.push({ no: 7, label: 'T+600', date: addDays(signDate, 600), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 8, label: 'T+660', date: addDays(signDate, 660), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 9, label: 'T+720', date: addDays(signDate, 720), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({
                no: 10, label: 'Bàn giao dự kiến', date: handoverDate, dateLabel: 'Quý 4/2028', gross: X_bg25 + C_vat5 + KPBT, badge: 'badge-handover', note: '—',
                subItems: [
                    { label: '25% giá bán gồm VAT', gross: X_bg25, note: '—' },
                    { label: 'VAT 5% giá bán', gross: C_vat5, note: '—' },
                    { label: '100% KPBT', gross: KPBT, note: '—' }
                ]
            });
            stages.push({ no: 11, label: 'Theo thông báo cấp sổ', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '—' });

            stages.isSplit = true;
            stages.landStages = stages.slice(0, 4);
            stages.constStages = stages.slice(4);

        } else if (paymentMethod === 'bank') {
            const L_sign10 = Math.round(LT * 0.10) - DEP;
            const L_5gua = Math.round(L_p * 0.05);
            const selfPct = loanPct === 80 ? 0.05 : 0.15;
            const L_self = Math.round(LT * selfPct);
            const L_bank = Math.round(LT * (loanPct / 100));

            const depLabel = loanPct === 80 ? 'Ký TTKQ (Đất)' : 'Ký TTĐC (Đất)';

            stages.push({ no: 1, label: depLabel, date: startDate, gross: DEP, badge: 'badge-deposit', note: '—' });
            stages.push({
                no: 2, label: 'Ký CN HĐMB (Đất)', date: signDate, gross: L_sign10 + L_5gua, badge: 'badge-sign', note: '—',
                subItems: [
                    { label: `10% giá bán gồm VAT`, gross: L_sign10, note: `Đã trừ ${loanPct === 80 ? 'tiền TTKQ' : '300 Tr tiền cọc Đợt 1'}` },
                    { label: '5% Chưa gồm VAT', gross: L_5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({
                no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(signDate, 15), gross: L_self + L_bank, badge: 'badge-progress', note: '—',
                subItems: [
                    { label: `${loanPct === 80 ? '5%' : '15%'} giá bán gồm VAT`, gross: L_self, note: 'Vốn tự có' },
                    { label: `${loanPct}% giá bán gồm VAT`, gross: L_bank, note: `Ngân hàng giải ngân ${loanPct}%` }
                ]
            });
            stages.push({ no: 4, label: 'Thông báo CĐT (Đất)', date: handoverDate, dateLabel: 'Quý 2/2027', gross: L_vat5, badge: 'badge-handover', note: '—' });

            const X_d0 = addDays(signDate, 540);
            const X_15 = Math.round(CT * 0.15);
            const X_5gua = Math.round(C_p * 0.05);
            const X_bg25 = Math.round(CT * 0.25);

            stages.push({
                no: 5, label: 'Đợt 2 + 540 Ngày', date: X_d0, gross: X_15 + X_5gua, badge: 'badge-progress', note: '—',
                subItems: [
                    { label: '15% giá bán gồm VAT', gross: X_15, note: '—' },
                    { label: '5% Chưa gồm VAT', gross: X_5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({ no: 6, label: 'T+555', date: addDays(signDate, 555), gross: Math.round(CT * 0.10), badge: 'badge-progress', note: '—' });
            stages.push({ no: 7, label: 'T+600', date: addDays(signDate, 600), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 8, label: 'T+660', date: addDays(signDate, 660), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 9, label: 'T+720', date: addDays(signDate, 720), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({
                no: 10, label: 'Bàn giao nhà', date: handoverDate, dateLabel: 'Quý 4/2028', gross: X_bg25 + C_vat5 + KPBT, badge: 'badge-handover', note: '—',
                subItems: [
                    { label: '25% giá bán gồm VAT', gross: X_bg25, note: '—' },
                    { label: 'VAT 5% giá bán', gross: C_vat5, note: '—' },
                    { label: '100% KPBT', gross: KPBT, note: '—' }
                ]
            });
            stages.push({ no: 11, label: loanPct === 80 ? 'Theo thông báo cấp sổ' : 'Sổ hồng', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '—' });

            stages.isSplit = true;
            stages.landStages = stages.slice(0, 4);
            stages.constStages = stages.slice(4);

        } else {
            const L_sign10 = Math.round(LT * 0.10) - DEP;
            const L_5gua = Math.round(L_p * 0.05);
            const L_15 = Math.round(LT * 0.15);
            const L_bg25 = Math.round(LT * 0.25);

            stages.push({ no: 1, label: 'Ký TTĐC (Đất)', date: startDate, gross: DEP, badge: 'badge-deposit', note: '—' });
            stages.push({
                no: 2, label: 'Ký HĐMB (Dự kiến)', date: signDate, gross: L_sign10 + L_5gua, badge: 'badge-sign', note: '—',
                subItems: [
                    { label: '10% giá bán gồm VAT', gross: L_sign10, note: 'Đã trừ 300 Tr tiền cọc Đợt 1' },
                    { label: '5% Chưa gồm VAT', gross: L_5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({ no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(signDate, 15), gross: L_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 4, label: 'Đợt 2 + 60 ngày', date: addDays(signDate, 60), gross: L_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 5, label: 'Đợt 2 + 120 ngày', date: addDays(signDate, 120), gross: L_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 6, label: 'Đợt 2 + 180 ngày', date: addDays(signDate, 180), gross: L_15, badge: 'badge-progress', note: '—' });
            stages.push({
                no: 7, label: 'Thông báo cdt (Dự kiến)', date: addDays(signDate, 270), dateLabel: 'Quý 2/2027', gross: L_bg25 + L_vat5, badge: 'badge-handover', note: '—',
                subItems: [
                    { label: '25% giá bán gồm VAT', gross: L_bg25, note: '—' },
                    { label: 'VAT 5% giá bán', gross: L_vat5, note: '—' }
                ]
            });

            const X_d0 = addDays(signDate, 540);
            const X_15 = Math.round(CT * 0.15);
            const X_5gua = Math.round(C_p * 0.05);
            const X_bg25 = Math.round(CT * 0.25);

            stages.push({
                no: 8, label: 'Đợt 2 + 540 Ngày', date: X_d0, gross: X_15 + X_5gua, badge: 'badge-progress', note: '—',
                subItems: [
                    { label: '15% giá bán gồm VAT', gross: X_15, note: '—' },
                    { label: '5% Chưa gồm VAT', gross: X_5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({ no: 9, label: 'T+555', date: addDays(signDate, 555), gross: Math.round(CT * 0.10), badge: 'badge-progress', note: '—' });
            stages.push({ no: 10, label: 'T+600', date: addDays(signDate, 600), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 11, label: 'T+660', date: addDays(signDate, 660), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 12, label: 'T+720', date: addDays(signDate, 720), gross: X_15, badge: 'badge-progress', note: '—' });
            stages.push({
                no: 13, label: 'Bàn giao dự kiến', date: handoverDate, dateLabel: 'Quý 4/2028', gross: X_bg25 + C_vat5 + KPBT, badge: 'badge-handover', note: '—',
                subItems: [
                    { label: '25% giá bán gồm VAT', gross: X_bg25, note: '—' },
                    { label: 'VAT 5% giá bán', gross: C_vat5, note: '—' },
                    { label: '100% KPBT', gross: KPBT, note: '—' }
                ]
            });
            stages.push({ no: 14, label: 'Thông báo cấp sổ', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '—' });

            stages.isSplit = true;
            stages.landStages = stages.slice(0, 7);
            stages.constStages = stages.slice(7);
        }

    } else {
        const basePrice = PA.p_land;
        const vat_goc = Math.round((basePrice - tienSDĐ) * 0.10);
        const vat5 = Math.round((basePrice - tienSDĐ) * 0.05 * 0.10);
        const sign5gua = Math.round(basePrice * 0.05);
        const sign10_full = Math.round((basePrice + vat_goc) * 0.10);
        const sign10 = sign10_full - DEP;
        const totalStage2_net = sign10 + sign5gua;
        const FV_no_kpbt = PA.p_land + PA.vat_land;
        const early85_full = Math.round(FV_no_kpbt * 0.85);
        const kpbt = PA.kpbt;

        if (paymentMethod === 'own-early') {
            stages.push({ no: 1, label: 'Ký TTĐC', date: startDate, gross: DEP, badge: 'badge-deposit', note: '—' });
            stages.push({
                no: 2, label: 'Ký CN HĐMB (Dự Kiến)', date: signDate, gross: totalStage2_net, badge: 'badge-sign', note: '—',
                subItems: [
                    { label: '10% giá bán gồm VAT', gross: sign10, note: 'Đã trừ 300 Tr tiền cọc Đợt 1' },
                    { label: '5% Chưa gồm VAT', gross: sign5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({ no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(signDate, 15), gross: early85_full, badge: 'badge-progress', note: '—' });
            stages.push({
                no: 4, label: 'Ngày bàn giao DỰ KIẾN', date: handoverDate, dateLabel: handoverLabel, gross: vat5 + kpbt, badge: 'badge-handover', note: '—',
                subItems: [
                    { label: 'VAT 5% giá bán', gross: vat5, note: '—' },
                    { label: '100% KPBT', gross: kpbt, note: '—' }
                ]
            });
            stages.push({ no: 5, label: 'Theo thông báo cấp sổ', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '—' });

        } else if (paymentMethod === 'own-normal') {
            const prog15 = Math.round(FV_no_kpbt * 0.15);
            const bg25 = Math.round(FV_no_kpbt * 0.25);

            stages.push({ no: 1, label: 'Ký TTĐC', date: startDate, gross: DEP, badge: 'badge-deposit', note: '—' });
            stages.push({
                no: 2, label: 'Ký CN HĐMB (Dự Kiến)', date: signDate, gross: totalStage2_net, badge: 'badge-sign', note: '—',
                subItems: [
                    { label: '10% giá bán gồm VAT', gross: sign10, note: 'Đã trừ 300 Tr tiền cọc Đợt 1' },
                    { label: '5% Chưa gồm VAT', gross: sign5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({ no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(signDate, 15), gross: prog15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 4, label: 'Đợt 2 + 60 ngày', date: addDays(signDate, 60), gross: prog15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 5, label: 'Đợt 2 + 120 ngày', date: addDays(signDate, 120), gross: prog15, badge: 'badge-progress', note: '—' });
            stages.push({ no: 6, label: 'Đợt 2 + 180 ngày', date: addDays(signDate, 180), gross: prog15, badge: 'badge-progress', note: '—' });
            stages.push({
                no: 7, label: 'Ngày bàn giao DỰ KIẾN', date: handoverDate, dateLabel: handoverLabel, gross: bg25 + vat5 + kpbt, badge: 'badge-handover', note: '—',
                subItems: [
                    { label: '25% giá bán gồm VAT', gross: bg25, note: '—' },
                    { label: 'VAT 5% giá bán', gross: vat5, note: '—' },
                    { label: '100% KPBT', gross: kpbt, note: '—' }
                ]
            });
            stages.push({ no: 8, label: 'Theo thông báo cấp sổ', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '—' });

        } else {
            const selfPct = loanPct === 80 ? 0.05 : 0.15;
            const selfVatAmt = Math.round(FV_no_kpbt * selfPct);
            const bankAmt = Math.round(FV_no_kpbt * (loanPct / 100));

            const depLabel = loanPct === 80 ? 'Ký TTKQ' : 'Ký TTĐC';

            stages.push({ no: 1, label: depLabel, date: startDate, gross: DEP, badge: 'badge-deposit', note: '—' });
            stages.push({
                no: 2, label: 'Ký CN HĐMB (Dự Kiến)', date: signDate, gross: totalStage2_net, badge: 'badge-sign', note: '—',
                subItems: [
                    { label: `10% giá ${loanPct === 80 ? 'gồm VAT' : 'bán gồm VAT'}`, gross: sign10, note: `Đã trừ ${loanPct === 80 ? 'tiền TTKQ' : '300 Tr tiền cọc Đợt 1'}` },
                    { label: '5% Chưa gồm VAT', gross: sign5gua, note: 'CĐT trả lãi 9,5%/năm cho khoản TTĐC đảm bảo HĐMB (từ ngày nhận đủ cọc đến khi có TB nhận GCN, KH cá nhân chịu thuế TNCN)' }
                ]
            });
            stages.push({
                no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(signDate, 15), gross: selfVatAmt + bankAmt, badge: 'badge-progress', note: '—',
                subItems: [
                    { label: `${loanPct === 80 ? '5%' : '15%'} giá bán gồm VAT`, gross: selfVatAmt, note: 'Vốn tự có' },
                    { label: `${loanPct}% giá bán gồm VAT`, gross: bankAmt, note: `Ngân hàng giải ngân ${loanPct}%` }
                ]
            });
            stages.push({
                no: 4, label: 'Ngày bàn giao DỰ KIẾN', date: handoverDate, dateLabel: handoverLabel, gross: vat5 + kpbt, badge: 'badge-handover', note: '—',
                subItems: [
                    { label: 'VAT 5% giá bán', gross: vat5, note: '—' },
                    { label: '100% KPBT', gross: kpbt, note: '—' }
                ]
            });
            stages.push({ no: 5, label: loanPct === 80 ? 'Theo thông báo cấp sổ' : 'Cấp GCNQSH', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '—' });
        }

        if (apt.type === 'rough' || apt.type === 'finished') {
            stages.landStages = stages.slice(0);
            stages.constStages = [];
        } else {
            stages.landStages = stages.slice(0, 7);
            stages.constStages = stages.slice(7);
        }
    }

    // Trừ Voucher theo quy định CĐT: Khách cọc Lần 1 (300tr), Voucher gánh từ Lần 2 (Ký HĐMB) trở đi
    let remainingVoucher = appliedVoucher;
    stages.forEach(s => {
        s.ck = 0;
        s.voucherApplied = 0;
        s.netCash = s.gross;
        // Bắt đầu cấn trừ Voucher từ Đợt 2 (Ký HĐMB) trở đi
        if (s.no > 1 && remainingVoucher > 0 && !s.label.includes('Ngân hàng giải ngân')) {
            const vCap = s.gross;
            const vUse = Math.min(remainingVoucher, vCap);
            s.voucherApplied = Math.min(vUse, s.gross);
            s.netCash = Math.max(0, s.gross - s.voucherApplied);
            remainingVoucher -= vUse;
        }
        s.net = s.netCash; // netCash là số tiền mặt khách hàng phải nộp cho đợt này
    });

    /* --- Bước 3: Chiết khấu dòng tiền (Đã lược bỏ theo chỉ đạo) --- */
    let cfDiscount = 0, cfDetailsStr = [];

    /* --- Bước 4: Tổng hợp --- */
    const totalGross = stages.reduce((a, s) => a + s.gross, 0);
    const totalVoucherApplied = stages.reduce((a, s) => a + (s.voucherApplied || 0), 0);
    const totalCkAll = totalCkVnd + cfDiscount + totalVoucherApplied;
    let loanData = null;
    let actualBankAmt = 0;
    if (paymentMethod === 'bank') {
        const bankStage = stages.find(s => s.label.includes('Ngân hàng'));
        if (bankStage) {
            actualBankAmt = bankStage.gross;
        } else {
            const bankSub = stages.flatMap(s => s.subItems || []).find(sub => sub.label && sub.label.includes('Ngân hàng giải ngân'));
            actualBankAmt = bankSub ? bankSub.gross : Math.round((PA.p_land + PA.vat_land) * (loanPct / 100));
        }

        if (showBankSim || returnOnly) {
            const plans = (apt.type === 'finished') ? SP.interestSupport.finished : SP.interestSupport.roughAndGianXay;
            loanData = calcLoan(actualBankAmt, interestRate, loanTermYears, plans[supportPlanIdx], addDays(startDate, 30));
        }
    }

    const totalKHtoCDT = (paymentMethod === 'bank')
        ? (totalGross - actualBankAmt - cfDiscount)
        : (totalGross - cfDiscount);

    const totalKHtoBank = loanData ? loanData.totalKHPays : 0;
    const contractPrice = totalKHtoCDT + actualBankAmt;
    // grandTotal: tổng chi phí thực tế KH phải bỏ ra
    // - Vay NH: tiền KH trả CĐT + toàn bộ KH trả NH (gốc + lãi)
    //   Nếu có loanData: (totalKHtoCDT + totalKHtoBank) = contractPrice + totalInterest
    //   Nếu không có loanData: (totalKHtoCDT + actualBankAmt) = contractPrice
    // - Vốn tự có: chỉ tính tiền KH trả CĐT
    const grandTotal = (paymentMethod === 'bank')
        ? (loanData ? (totalKHtoCDT + totalKHtoBank) : contractPrice)
        : totalKHtoCDT;
    const ckPct = ckDetails.filter(d => d.deductType === 'price' && d.pct > 0).reduce((a, d) => a + d.pct, 0);

    const resultDataS = {
        macan: apt ? apt.macan : 'Thủ công',
        propValue: (apt ? apt.priceBeforeVat : 0), origAllin, typeLabel, paymentMethod, supportPlanIdx,
        ckPct, ckVnd: totalCkVnd, appliedVoucher, totalVoucherApplied: appliedVoucher,
        totalCk: totalCkVnd, totalCkAll, cfDiscount, actualPaymentDate, cfDetailsStr,
        totalGross, totalKHtoCDT, actualBankAmt, contractPrice, totalKHtoBank,
        totalInterest: (loanData ? loanData.totalInterest : 0),
        grandTotal, loanData, showBankSim, PA
    };

    // ---- Tính dữ liệu so sánh 3 phương thức cho biểu đồ ----
    const results = {};
    const plans = (apt.type === 'finished') ? SP.interestSupport.finished : SP.interestSupport.roughAndGianXay;
    const methodsToCompare = [
        { id: 'own-early', label: 'Thanh toán sớm', m: 'own-early', pIdx: null },
        { id: 'own-normal', label: 'Tiến độ chuẩn', m: 'own-normal', pIdx: null }
    ];

    plans.forEach((p, idx) => {
        methodsToCompare.push({
            id: 'bank-' + idx,
            label: `Vay HTLS ${p.months}T`,
            m: 'bank',
            pIdx: idx
        });
    });

    const compLoanTerm = loanTermYears;

    if (!returnOnly) {
        const prevSelected = (typeof selectedApt !== 'undefined') ? selectedApt : null;

        methodsToCompare.forEach(mc => {
            if (typeof selectedApt !== 'undefined') selectedApt = apt;
            const res = calculate(true, true, mc.m, mc.pIdx, apt, null, compLoanTerm);
            if (res) results[mc.id] = res.S;
        });

        if (typeof selectedApt !== 'undefined') selectedApt = prevSelected;
    }
    resultDataS.comparisonResults = results;

    if (returnOnly) return { S: resultDataS, stages, ckDetails };

    // ---- Bảng so sánh 3 phương thức ----
    const ths = methodsToCompare.map(mc => {
        const isCur = mc.m === paymentMethod && (mc.m !== 'bank' || mc.pIdx === supportPlanIdx);
        const style = isCur ? 'background:rgba(41,128,185,0.25);color:#7ecfff;border-bottom:2px solid #7ecfff;' : '';
        return `<th class="text-end" style="min-width:140px;${style}">${mc.label} ${isCur ? '(Đang chọn)' : ''}</th>`;
    }).join('');

    const rowFn = (label, fn, extraStyle = '') => {
        const tds = methodsToCompare.map(mc => {
            const isCur = mc.m === paymentMethod && (mc.m !== 'bank' || mc.pIdx === supportPlanIdx);
            const tdStyle = isCur ? 'color:#7ecfff;font-weight:700;' : '';
            const val = results[mc.id] ? fn(results[mc.id]) : '—';
            return `<td class="text-end" style="${tdStyle}${extraStyle}">${val}</td>`;
        }).join('');
        return `<tr><td>${label}</td>${tds}</tr>`;
    };

    const comparisonHTML = `
    <div class="card-custom mb-3">
        <div class="card-title" style="font-size:1.05rem;"><i class="bi bi-layout-split me-2"></i>BẢNG TÓM TẮT SO SÁNH CÁC PHƯƠNG THỨC THANH TOÁN</div>
        <div style="overflow-x:auto;">
            <table class="result-table">
                <thead><tr><th style="min-width:200px;">Chỉ tiêu (VNĐ)</th>${ths}</tr></thead>
                <tbody>
                    ${rowFn('Giá bán chưa VAT+KPBT', S => fmt(S.propValue))}
                    ${rowFn('Tổng chiết khấu', S => fmt(S.totalCkAll), 'color:#5dd88a;')}
                    ${rowFn('Giá HĐMB (Thực trả cho CĐT)', S => fmt(S.paymentMethod === 'bank' ? S.contractPrice : S.totalKHtoCDT), 'font-weight:600;')}
                    ${rowFn(`Lãi vay NH tích lũy (${compLoanTerm} năm)`, S => (S.totalInterest > 0 ? fmt(S.totalInterest) : '0 VNĐ'), 'color:#eab308;')}
                    ${rowFn('Tổng chi phí (CĐT + Lãi vay NH)', S => fmt(S.grandTotal), 'font-size:1.1rem; color:#f39c12; font-weight:800;')}
                </tbody>
            </table>
        </div>
        <div class="mt-2 text-muted" style="font-size:0.78rem; font-style:italic;">
            * <strong>Lưu ý giải thích con số:</strong> Tiền Lãi Vay Ngân Hàng ở bảng so sánh trên tính tham khảo tích lũy trong <strong>${compLoanTerm} năm</strong> (với lãi suất giả định ${interestRate}%/năm sau HTLS). Nếu KH <strong>tất toán nợ gốc sớm</strong>, chi phí thực trả chỉ bằng <strong>Giá HĐMB (Thực trả cho CĐT)</strong>.
        </div>
    </div>`;

    resultDataS.stages = stages;
    resultDataS.ckDetails = ckDetails;
    window.lastResultS = resultDataS;
    if (!silent && typeof renderResult === 'function') {
        renderResult(stages, ckDetails, resultDataS, comparisonHTML);
        if (typeof saveHistoryRecord === 'function') saveHistoryRecord(resultDataS);
        if (typeof showTab === 'function') showTab('result');
        if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return { S: resultDataS, stages, ckDetails };
}
