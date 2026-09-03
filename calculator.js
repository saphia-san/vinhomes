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
    const kpbt = fixedKpbt > 0 ? fixedKpbt : Math.round((currentLandPrice + p_const) * 0.005);
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
   =============================================================*/
function calcLoan(principal, annualRatePct, termYears, supportPlan, disbursementDate) {
    const totalMonths = termYears * 12;
    const monthlyRate = (annualRatePct / 100) / 12;
    const principalPerM = Math.round(principal / totalMonths);
    const supportMonths = supportPlan ? supportPlan.months : 0;

    let balance = principal;
    const rows = [];
    let totalInterest = 0;
    let totalCDT = 0;
    let totalKHPays = 0;

    for (let m = 1; m <= totalMonths; m++) {
        const interest = Math.round(balance * monthlyRate);
        const date_m = addMonths(disbursementDate, m - 1);
        const supported = (m <= supportMonths);

        const khInterest = supported ? 0 : interest;
        const khTotal = principalPerM + khInterest;

        balance -= principalPerM;
        totalInterest += interest;
        if (supported) totalCDT += interest;
        totalKHPays += khTotal;

        rows.push({
            m, date: date_m,
            principal: principalPerM,
            interest, khInterest, khTotal,
            balance: Math.max(0, balance),
            supported
        });
    }

    return {
        rows, principal, annualRatePct, termYears, totalMonths,
        supportPlan, supportMonths, disbursementDate,
        totalInterest, totalCDT, totalKHPays, principalPerM
    };
}

/* =============================================================
   TÍNH TOÁN CHÍNH (CALCULATE)
   =============================================================*/
function calculate(silent = false, returnOnly = false, overrideMethod = null, overrideSupportIdx = null, overrideApt = null) {
    // Lấy dữ liệu căn hộ (ưu tiên từ overrideApt, selectedApt, fallback autocomplete hoặc nhập thủ công)
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
    let tienSDĐ = (apt && apt.dtDat) ? Math.round(UNIT_LAND_FEE * apt.dtDat) : 0;
    let fixedKpbt = (apt && apt.kpbt > 0) ? apt.kpbt : 0;

    const doc = (typeof document !== 'undefined') ? document : null;
    const paymentMethod = overrideMethod || (doc && doc.getElementById('paymentMethod') ? doc.getElementById('paymentMethod').value : 'own-early');
    const startDate = (doc && doc.getElementById('startDate')) ? (parseDate(doc.getElementById('startDate').value) || new Date()) : new Date();
    const signDateStr = doc && doc.getElementById('signDate') ? doc.getElementById('signDate').value : '';
    const signDate = (signDateStr && parseDate(signDateStr)) ? parseDate(signDateStr) : addDays(startDate, 15);
    const handoverDateStr = doc && doc.getElementById('handoverDate') ? doc.getElementById('handoverDate').value : '';
    const handoverDate = (handoverDateStr && parseDate(handoverDateStr)) ? parseDate(handoverDateStr) : addDays(startDate, 547); // ~Q4/2027
    const pinkBookDate = addMonths(handoverDate, 12);

    const promoEarlyMoveIn = doc && doc.getElementById('promo_earlyMoveIn') ? doc.getElementById('promo_earlyMoveIn').checked : false;
    const promoAquafield = doc && doc.getElementById('promo_aquafield') ? doc.getElementById('promo_aquafield').checked : false;
    const promoNoBlnh = doc && doc.getElementById('promo_noBlnh') ? doc.getElementById('promo_noBlnh').checked : false;
    const promoGoldGift = doc && doc.getElementById('promo_goldGift') ? doc.getElementById('promo_goldGift').checked : false;
    const promoVoucher = doc && doc.getElementById('promo_voucher') ? doc.getElementById('promo_voucher').checked : false;

    let voucherAmount = 0;
    if (promoVoucher && doc && doc.getElementById('oldHousePrice')) {
        const oldPrice = parseNum(doc.getElementById('oldHousePrice').value);
        const vPct = parseFloat(doc.getElementById('voucherPercent').value) || 0;
        voucherAmount = Math.round(oldPrice * (vPct / 100));
    }

    const useCashFlow = doc && doc.getElementById('cashFlowDiscount') ? doc.getElementById('cashFlowDiscount').checked : false;
    const actualPaymentDate = (doc && doc.getElementById('actualPaymentDate')) ? (parseDate(doc.getElementById('actualPaymentDate').value) || startDate) : startDate;
    const loanPct = (doc && doc.getElementById('loanPct')) ? (parseInt(doc.getElementById('loanPct').value) || 70) : 70;
    const interestRate = (doc && doc.getElementById('interestRate')) ? (parseFloat(doc.getElementById('interestRate').value) || 0) : 0;
    const loanTermYears = (doc && doc.getElementById('loanTerm')) ? (parseInt(doc.getElementById('loanTerm').value) || 20) : 20;
    const supportPlanIdx = (overrideSupportIdx !== null && overrideSupportIdx !== undefined) ? overrideSupportIdx : (doc && doc.getElementById('interestSupportPlan') ? (parseInt(doc.getElementById('interestSupportPlan').value) || 0) : 0);
    const showBankSim = doc && doc.getElementById('showBankSim') ? doc.getElementById('showBankSim').checked : true;

    const SP = SALES_POLICY;
    const typeLabel = { rough: 'Thô', finished: 'Hoàn thiện', gianXay: 'Giãn xây' }[apt.type] || 'Thô';

    /* --- Bước 1: Chiết khấu tính lùi (trên Giá Đất trước VAT) --- */
    let ckDetails = [];
    const p_const = (apt.type === 'gianXay') ? Math.round(UNIT_CONST_PRICE * apt.dtXay) : 0;
    let baseLandPrice = apt.priceBeforeVat - p_const;
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

    // a) Quà tặng Vàng (Theo CSBH V07 & V08 - Áp dụng theo Tổng Giá Gốc gồm VAT & KPBT)
    if (promoGoldGift) {
        const goldVal = doc && doc.getElementById('goldGiftCount') ? doc.getElementById('goldGiftCount').value : 'auto';
        let goldLabel = '🥇 Quà tặng Vàng';
        let gVnd = 0;
        if (goldVal !== 'auto') {
            const count = parseInt(goldVal, 10);
            gVnd = count * 15_000_000;
            goldLabel = `🥇 Quà tặng Vàng (${count} chỉ)`;
        } else {
            const origPA = breakdownPrice(baseLandPrice, apt.dtDat, apt.dtXay, apt.type, tienSDĐ, fixedKpbt);
            const origAllin = origPA.allin; // Tổng giá gốc trước các chiết khấu (bao gồm VAT và KPBT)
            const gMap = SP.promotions.goldGift;
            if (origAllin >= 20e9) {
                gVnd = gMap.over20b;
                goldLabel = '🥇 Quà tặng Vàng (5 chỉ – 75 triệu)';
            } else if (origAllin >= 10e9) {
                gVnd = gMap.from10to20b;
                goldLabel = '🥇 Quà tặng Vàng (3 chỉ – 45 triệu)';
            } else {
                gVnd = gMap.under10b;
                goldLabel = '🥇 Quà tặng Vàng (1 chỉ – 15 triệu)';
            }
        }
        currentLandPrice -= gVnd;
        totalCkVnd += gVnd;
        ckDetails.push({ label: goldLabel, pct: 0, vnd: gVnd, deductType: 'gift' });
    }

    // b) Chiết khấu % Chính Sách Thanh Toán (TTS & BLNH)
    const ckPctList = [];
    if (paymentMethod === 'own-early') {
        const today = startDate || new Date();
        const deadlineGold = new Date(2026, 8, 10);
        const pct = (today <= deadlineGold) ? 9.0 : 7.5;
        ckPctList.push({ label: `Thanh toán sớm – Vốn tự có (${typeLabel})`, pct });
    } else if (paymentMethod === 'own-normal') {
        ckPctList.push({ label: 'Chiết khấu tiến độ thường (Vốn tự có)', pct: SP.ownCapital.normalProgress });
    } else {
        ckPctList.push({ label: 'Chiết khấu tiến độ thường (vay NH)', pct: SP.ownCapital.normalProgress });
        const plans = (apt.type === 'finished') ? SP.interestSupport.finished : SP.interestSupport.roughAndGianXay;
        const plan = plans[supportPlanIdx];
        if (plan && plan.extraDiscount > 0) {
            ckPctList.push({ label: `CK bổ sung – ${plan.label}`, pct: plan.extraDiscount });
        }
    }

    for (const c of ckPctList) {
        if (c.pct > 0) {
            const ckAmt = Math.round(currentLandPrice * (c.pct / 100));
            currentLandPrice -= ckAmt;
            totalCkVnd += ckAmt;
            ckDetails.push({ label: c.label, pct: c.pct, vnd: ckAmt, deductType: 'price' });
        }
    }

    if (promoNoBlnh) {
        const noBlnhPct = 0.5;
        const ckAmt = Math.round(currentLandPrice * (noBlnhPct / 100));
        currentLandPrice -= ckAmt;
        totalCkVnd += ckAmt;
        ckDetails.push({ label: '🛡️ Từ chối bảo lãnh ngân hàng (0.5%)', pct: noBlnhPct, vnd: ckAmt, deductType: 'price' });
    }

    // c) Chiết khấu Cam kết về ở sớm (5% tính trên Giá ĐÃ TRỪ CK TTS & BLNH)
    if (promoEarlyMoveIn && (apt.type !== 'gianXay' || apt.macan === 'TL10-53' || apt.macan === 'TL10-22')) {
        const earlyMoveInAmt = Math.round(currentLandPrice * (SP.promotions.earlyMoveIn / 100));
        currentLandPrice -= earlyMoveInAmt;
        totalCkVnd += earlyMoveInAmt;
        ckDetails.push({ label: '🏠 Cam kết về ở sớm (5% trừ giá HĐ)', pct: SP.promotions.earlyMoveIn, vnd: earlyMoveInAmt, deductType: 'price' });
        // 5% hoàn tiền mặt sau khi về ở (không trừ vào giá HĐ)
        ckDetails.push({ label: '🎁 Cam kết về ở sớm (5% hoàn tiền sau khi về ở)', pct: 5.0, vnd: earlyMoveInAmt, deductType: 'cashback' });
    }

    if (promoVoucher && voucherAmount > 0) {
        const maxV = Math.round(apt.priceBeforeVat * SP.promotions.voucher.maxPercent / 100);
        const applied = Math.min(voucherAmount, maxV);
        currentLandPrice -= applied;
        totalCkVnd += applied;
        ckDetails.push({ label: `🎟️ Voucher mua nhà (tối đa 30% = ${fmt(maxV)})`, pct: 0, vnd: applied, deductType: 'price' });
    }

    if (promoAquafield) {
        ckDetails.push({ label: '🏊 Quà Aquafield (voucher spa)', pct: 0, vnd: SP.promotions.aquafield, deductType: 'gift' });
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

            stages.push({ no: 1, label: 'Ký TTĐC (Đất)', date: startDate, gross: DEP, badge: 'badge-deposit', note: 'Cố định 300 triệu VNĐ' });
            stages.push({
                no: 2, label: 'Ký CN HĐMB (Dự Kiến)', date: signDate, gross: L_sign10 + L_5gua, badge: 'badge-sign', note: '10% giá bán gồm VAT (đã trừ TTĐC) + 5% Chưa gồm VAT',
                subItems: [
                    { label: '10% giá bán gồm VAT (đã trừ tiền TTĐC)', gross: L_sign10 },
                    { label: '5% Chưa gồm VAT', gross: L_5gua }
                ]
            });
            stages.push({ no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(startDate, 15), gross: L_85, badge: 'badge-progress', note: '85% giá bán gồm VAT' });
            stages.push({ no: 4, label: 'Ngày bàn giao DỰ KIẾN', date: handoverDate, dateLabel: handoverLabel, gross: L_vat5, badge: 'badge-handover', note: 'VAT 5% giá bán Đất' });

            const X_d0 = addDays(startDate, 540);
            const X_15 = Math.round(CT * 0.15);
            const X_5gua = Math.round(C_p * 0.05);
            const X_bg25 = Math.round(CT * 0.25);

            stages.push({ no: 5, label: 'Bắt đầu Xây (T+540)', date: X_d0, gross: X_15 + X_5gua, badge: 'badge-progress', note: '15% Xây gồm VAT + 5% Xây chưa VAT' });
            stages.push({ no: 6, label: 'Xây T+555', date: addDays(startDate, 555), gross: Math.round(CT * 0.10), badge: 'badge-progress', note: '10% Xây gồm VAT' });
            stages.push({ no: 7, label: 'Xây T+600', date: addDays(startDate, 600), gross: X_15, badge: 'badge-progress', note: '15% Xây gồm VAT' });
            stages.push({ no: 8, label: 'Xây T+660', date: addDays(startDate, 660), gross: X_15, badge: 'badge-progress', note: '15% Xây gồm VAT' });
            stages.push({ no: 9, label: 'Xây T+720', date: addDays(startDate, 720), gross: X_15, badge: 'badge-progress', note: '15% Xây gồm VAT' });
            stages.push({ no: 10, label: 'Bàn giao nhà', date: handoverDate, dateLabel: handoverLabel, gross: X_bg25 + C_vat5 + KPBT, badge: 'badge-handover', note: '25% Xây gồm VAT + VAT 5% Xây + KPBT' });
            stages.push({ no: 11, label: 'Sổ hồng', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '5% đảm bảo đã thanh toán ở Đợt 2 & Đợt 5' });

            stages.isSplit = true;
            stages.landStages = stages.slice(0, 4);
            stages.constStages = stages.slice(4);

        } else if (paymentMethod === 'bank') {
            const L_sign10 = Math.round(LT * 0.10) - DEP;
            const L_5gua = Math.round(L_p * 0.05);
            const L_15 = Math.round(LT * 0.15);
            const L_bank70 = Math.round(LT * (loanPct / 100));

            stages.push({ no: 1, label: 'Ký TTĐC (Đất)', date: startDate, gross: DEP, badge: 'badge-deposit', note: 'Cố định 300 triệu VNĐ' });
            stages.push({ no: 2, label: 'Ký CN HĐMB (Đất)', date: signDate, gross: L_sign10 + L_5gua, badge: 'badge-sign', note: '10% Đất (trừ cọc) + 5% Đất chưa VAT' });
            stages.push({ no: 3, label: 'Vốn tự có Đợt 3 (T+15)', date: addDays(startDate, 15), gross: L_15, badge: 'badge-progress', note: '15% Đất (gồm VAT)' });
            stages.push({ no: 4, label: 'Ngân hàng giải ngân (T+30)', date: addDays(startDate, 30), gross: L_bank70, badge: 'badge-bank', note: `${loanPct}% Đất (gồm VAT) – NH giải ngân CĐT` });
            stages.push({ no: 5, label: 'Thông báo CĐT (Đất)', date: handoverDate, dateLabel: handoverLabel, gross: L_vat5, badge: 'badge-handover', note: 'VAT 5% giá bán Đất' });

            const X_d0 = addDays(startDate, 540);
            const X_15 = Math.round(CT * 0.15);
            const X_5gua = Math.round(C_p * 0.05);
            const X_bg25 = Math.round(CT * 0.25);

            stages.push({ no: 6, label: 'Bắt đầu Xây (T+540)', date: X_d0, gross: X_15 + X_5gua, badge: 'badge-progress', note: '15% Xây + 5% Xây chưa VAT' });
            stages.push({ no: 7, label: 'Xây T+555', date: addDays(startDate, 555), gross: Math.round(CT * 0.10), badge: 'badge-progress', note: '10% Xây' });
            stages.push({ no: 8, label: 'Xây T+600', date: addDays(startDate, 600), gross: X_15, badge: 'badge-progress', note: '15% Xây' });
            stages.push({ no: 9, label: 'Xây T+660', date: addDays(startDate, 660), gross: X_15, badge: 'badge-progress', note: '15% Xây' });
            stages.push({ no: 10, label: 'Xây T+720', date: addDays(startDate, 720), gross: X_15, badge: 'badge-progress', note: '15% Xây' });
            stages.push({ no: 11, label: 'Bàn giao nhà', date: handoverDate, dateLabel: handoverLabel, gross: X_bg25 + C_vat5 + KPBT, badge: 'badge-handover', note: '25% Xây + VAT 5% + KPBT' });
            stages.push({ no: 12, label: 'Sổ hồng', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '5% đảm bảo đã trả ở Đợt 2 & 6' });

            stages.isSplit = true;
            stages.landStages = stages.slice(0, 5);
            stages.constStages = stages.slice(5);

        } else {
            const L_sign10 = Math.round(LT * 0.10) - DEP;
            const L_5gua = Math.round(L_p * 0.05);
            const L_15 = Math.round(LT * 0.15);
            const L_bg25 = Math.round(LT * 0.25);

            stages.push({ no: 1, label: 'Ký TTĐC', date: startDate, gross: DEP, badge: 'badge-deposit', note: 'Cố định 300 triệu VNĐ' });
            stages.push({
                no: 2, label: 'Ký HĐMB (Dự kiến)', date: signDate, gross: L_sign10 + L_5gua, badge: 'badge-sign', note: '10% giá bán gồm VAT (đã trừ TTĐC) + 5% Chưa gồm VAT',
                subItems: [
                    { label: '10% giá bán gồm VAT (đã trừ tiền TTĐC)', gross: L_sign10 },
                    { label: '5% Chưa gồm VAT', gross: L_5gua }
                ]
            });
            stages.push({ no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(startDate, 15), gross: L_15, badge: 'badge-progress', note: '15% giá bán gồm VAT' });
            stages.push({ no: 4, label: 'Đợt 2 + 60 ngày', date: addDays(startDate, 60), gross: L_15, badge: 'badge-progress', note: '15% giá bán gồm VAT' });
            stages.push({ no: 5, label: 'Đợt 2 + 120 ngày', date: addDays(startDate, 120), gross: L_15, badge: 'badge-progress', note: '15% giá bán gồm VAT' });
            stages.push({ no: 6, label: 'Đợt 2 + 180 ngày', date: addDays(startDate, 180), gross: L_15, badge: 'badge-progress', note: '15% giá bán gồm VAT' });
            stages.push({
                no: 7, label: 'Thông báo cđt (Dự kiến)', date: addDays(startDate, 270), gross: L_bg25 + L_vat5, badge: 'badge-handover', note: '25% giá bán gồm VAT + VAT 5% giá bán',
                subItems: [
                    { label: '25% giá bán gồm VAT', gross: L_bg25 },
                    { label: 'VAT 5% giá bán', gross: L_vat5 }
                ]
            });

            const X_d0 = addDays(startDate, 540);
            const X_15 = Math.round(CT * 0.15);
            const X_5gua = Math.round(C_p * 0.05);
            const X_bg25 = Math.round(CT * 0.25);

            stages.push({
                no: 8, label: 'Đợt 2 + 540 Ngày', date: X_d0, gross: X_15 + X_5gua, badge: 'badge-progress', note: '15% giá bán gồm VAT + 5% Chưa gồm VAT',
                subItems: [
                    { label: '15% giá bán gồm VAT', gross: X_15 },
                    { label: '5% Chưa gồm VAT', gross: X_5gua }
                ]
            });
            stages.push({ no: 9, label: 'T+555', date: addDays(startDate, 555), gross: Math.round(CT * 0.10), badge: 'badge-progress', note: '10% giá bán gồm VAT' });
            stages.push({ no: 10, label: 'T+600', date: addDays(startDate, 600), gross: X_15, badge: 'badge-progress', note: '15% giá bán gồm VAT' });
            stages.push({ no: 11, label: 'T+660', date: addDays(startDate, 660), gross: X_15, badge: 'badge-progress', note: '15% giá bán gồm VAT' });
            stages.push({ no: 12, label: 'T+720', date: addDays(startDate, 720), gross: X_15, badge: 'badge-progress', note: '15% giá bán gồm VAT' });
            stages.push({
                no: 13, label: 'Bàn giao dự kiến', date: handoverDate, dateLabel: handoverLabel, gross: X_bg25 + C_vat5 + KPBT, badge: 'badge-handover', note: '25% giá bán gồm VAT + VAT 5% + KPBT',
                subItems: [
                    { label: '25% giá bán gồm VAT', gross: X_bg25 },
                    { label: 'VAT 5% giá bán', gross: C_vat5 },
                    { label: '100% KPBT', gross: KPBT }
                ]
            });
            stages.push({ no: 14, label: 'Thông báo cấp sổ', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '5% đảm bảo đã trả ở Đợt 2 & 8' });

            stages.isSplit = true;
            stages.landStages = stages.slice(0, 7);
            stages.constStages = stages.slice(7);
        }

    } else {
        const FV_no_kpbt = PA.p_land + PA.vat_land;
        const P_nd = PA.p_land;
        const sign5gua = Math.round(P_nd * 0.05);
        const sign10 = Math.round(FV_no_kpbt * 0.10) - DEP;
        const vat5 = Math.round((P_nd - tienSDĐ) * 0.05 * 0.10);
        const kpbt = PA.kpbt;

        if (paymentMethod === 'own-early') {
            const early85 = Math.round(FV_no_kpbt * 0.85);

            stages.push({ no: 1, label: 'Ký TTĐC', date: startDate, gross: DEP, badge: 'badge-deposit', note: 'Cố định 300 triệu VNĐ' });
            stages.push({
                no: 2, label: 'Ký CN HĐMB (Dự Kiến)', date: signDate, gross: sign10 + sign5gua, badge: 'badge-sign', note: '10% giá bán gồm VAT (đã trừ TTĐC) + 5% Chưa gồm VAT',
                subItems: [
                    { label: '10% giá bán gồm VAT (đã trừ tiền TTĐC)', gross: sign10 },
                    { label: '5% Chưa gồm VAT', gross: sign5gua }
                ]
            });
            stages.push({ no: 3, label: 'Đợt 2 + 15 ngày', date: addDays(startDate, 15), gross: early85, badge: 'badge-progress', note: '85% giá bán gồm VAT' });
            stages.push({
                no: 4, label: 'Ngày bàn giao DỰ KIẾN', date: handoverDate, dateLabel: handoverLabel, gross: vat5 + kpbt, badge: 'badge-handover', note: 'VAT 5% giá bán + 100% KPBT',
                subItems: [
                    { label: 'VAT 5% giá bán', gross: vat5 },
                    { label: '100% KPBT', gross: kpbt }
                ]
            });
            stages.push({ no: 5, label: 'Theo thông báo cấp sổ', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '5% đảm bảo đã thanh toán ở Đợt 2' });

        } else if (paymentMethod === 'own-normal') {
            const prog15 = Math.round(FV_no_kpbt * 0.15);
            const bg25 = Math.round(FV_no_kpbt * 0.25);

            stages.push({ no: 1, label: 'Đặt cọc', date: startDate, gross: DEP, badge: 'badge-deposit', note: 'Cố định 300 triệu VNĐ' });
            stages.push({ no: 2, label: 'Ký HĐMB', date: signDate, gross: sign10 + sign5gua, badge: 'badge-sign', note: '10% (trừ cọc) + 5% đảm bảo chưa VAT' });
            stages.push({ no: 3, label: 'Lần 3 (T+15)', date: addDays(startDate, 15), gross: prog15, badge: 'badge-progress', note: '15% giá trị gồm VAT' });
            stages.push({ no: 4, label: 'Lần 4 (T+60)', date: addDays(startDate, 60), gross: prog15, badge: 'badge-progress', note: '15% giá trị gồm VAT' });
            stages.push({ no: 5, label: 'Lần 5 (T+120)', date: addDays(startDate, 120), gross: prog15, badge: 'badge-progress', note: '15% giá trị gồm VAT' });
            stages.push({ no: 6, label: 'Lần 6 (T+180)', date: addDays(startDate, 180), gross: prog15, badge: 'badge-progress', note: '15% giá trị gồm VAT' });
            stages.push({ no: 7, label: 'Nhận bàn giao', date: handoverDate, dateLabel: handoverLabel, gross: bg25 + vat5 + kpbt, badge: 'badge-handover', note: '25% + VAT 5% đảm bảo + KPBT' });
            stages.push({ no: 8, label: 'Sổ hồng', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '5% đảm bảo đã thanh toán ở Đợt 2' });

        } else {
            const bankAmt = Math.round(FV_no_kpbt * (loanPct / 100));
            const selfTotal = FV_no_kpbt - bankAmt;
            const self15 = Math.round(FV_no_kpbt * 0.15);
            const selfRemaining = selfTotal - self15;

            stages.push({ no: 1, label: 'Đặt cọc', date: startDate, gross: DEP, badge: 'badge-deposit', note: 'Cố định 300 triệu VNĐ' });
            stages.push({ no: 2, label: 'Ký HĐMB', date: signDate, gross: self15 - DEP, badge: 'badge-sign', note: '15% (trừ cọc)' });

            if (selfRemaining > 0) {
                stages.push({ no: 3, label: 'Vốn tự có thêm (T+15)', date: addDays(startDate, 15), gross: selfRemaining, badge: 'badge-progress', note: `${100 - loanPct - 15}% phần tự có còn lại` });
            }
            stages.push({ no: 4, label: 'Ngân hàng giải ngân (T+30)', date: addDays(startDate, 30), gross: bankAmt, badge: 'badge-bank', note: `${loanPct}% – NH thanh toán trực tiếp CĐT` });
            stages.push({ no: 5, label: 'Nhận bàn giao + KPBT', date: handoverDate, dateLabel: handoverLabel, gross: kpbt, badge: 'badge-handover', note: 'KPBT 2%' });
            stages.push({ no: 6, label: 'Sổ hồng', date: pinkBookDate, dateLabel: pinkBookLabel, gross: 0, badge: 'badge-pink', note: '5% đảm bảo đã thanh toán ở Đợt 2' });
        }
    }

    stages.forEach(s => { s.ck = 0; s.net = s.gross; });

    /* --- Bước 3: Chiết khấu dòng tiền --- */
    let cfDiscount = 0, cfDetailsStr = [];
    if (useCashFlow) {
        stages.forEach(s => {
            if (s.net > 0 && !s.label.includes('Ngân hàng') && s.date > actualPaymentDate) {
                const daysEarly = Math.floor((s.date - actualPaymentDate) / 86400000);
                if (daysEarly >= 7) {
                    const ck = s.net * (SP.cashFlowDiscountRate / 100) * (daysEarly / 365);
                    cfDiscount += ck;
                    cfDetailsStr.push(`Đợt ${s.no} (${daysEarly} ngày)`);
                }
            }
        });
    }

    /* --- Bước 4: Tổng hợp --- */
    const totalGross = stages.reduce((a, s) => a + s.gross, 0);
    const totalCkAll = totalCkVnd + cfDiscount;
    const totalKHtoCDT = stages.reduce((a, s) => {
        if (s.label.includes('Ngân hàng giải ngân')) return a;
        return a + s.net;
    }, 0) - cfDiscount;

    let loanData = null;
    let actualBankAmt = 0;
    if (paymentMethod === 'bank') {
        const bankStage = stages.find(s => s.label.includes('Ngân hàng'));
        actualBankAmt = bankStage ? bankStage.gross : Math.round((PA.p_land + PA.vat_land) * (loanPct / 100));

        if (showBankSim) {
            const plans = (apt.type === 'finished') ? SP.interestSupport.finished : SP.interestSupport.roughAndGianXay;
            loanData = calcLoan(actualBankAmt, interestRate, loanTermYears, plans[supportPlanIdx], addDays(startDate, 30));
        }
    }

    const totalKHtoBank = loanData ? loanData.totalKHPays : 0;
    const contractPrice = totalKHtoCDT + actualBankAmt;
    const grandTotal = (paymentMethod === 'bank') ? contractPrice : (totalKHtoCDT + totalKHtoBank);
    const ckPct = ckDetails.filter(d => d.deductType === 'price' && d.pct > 0).reduce((a, d) => a + d.pct, 0);

    const resultDataS = {
        macan: apt ? apt.macan : 'Thủ công',
        propValue: (apt ? apt.priceBeforeVat : 0), typeLabel, paymentMethod, supportPlanIdx,
        ckPct, ckVnd: totalCkVnd,
        totalCk: totalCkVnd, totalCkAll, cfDiscount, actualPaymentDate, cfDetailsStr,
        totalGross, totalKHtoCDT, actualBankAmt, contractPrice, totalKHtoBank,
        totalInterest: (loanData ? loanData.totalInterest : 0),
        grandTotal, loanData, showBankSim, PA
    };

    // ---- Tính dữ liệu so sánh 3 phương thức cho biểu đồ ----
    const results = {};
    const plans = (apt.type === 'finished') ? SP.interestSupport.finished : SP.interestSupport.roughAndGianXay;
    const methodsToCompare = [
        { id: 'own-early', label: '💰 TTS – Vốn tự có', m: 'own-early', pIdx: null },
        { id: 'own-normal', label: '📋 Tiến độ thường', m: 'own-normal', pIdx: null }
    ];

    plans.forEach((p, idx) => {
        methodsToCompare.push({
            id: 'bank-' + idx,
            label: `🏦 Vay HTLS ${p.months}T`,
            m: 'bank',
            pIdx: idx
        });
    });

    if (!returnOnly) {
        const prevSelected = (typeof selectedApt !== 'undefined') ? selectedApt : null;

        methodsToCompare.forEach(mc => {
            if (typeof selectedApt !== 'undefined') selectedApt = apt;
            const res = calculate(true, true, mc.m, mc.pIdx, apt);
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
        <div class="card-title" style="font-size:1.05rem;"><i class="bi bi-layout-split me-2"></i>Bảng Tóm Tắt So Sánh Các Phương Thức Thanh Toán</div>
        <div style="overflow-x:auto;">
            <table class="result-table">
                <thead><tr><th style="min-width:200px;">Chỉ tiêu (VNĐ)</th>${ths}</tr></thead>
                <tbody>
                    ${rowFn('Giá trị BĐS gốc', S => fmt(S.propValue))}
                    ${rowFn('Tổng chiết khấu', S => fmt(S.totalCkAll), 'color:#5dd88a;')}
                    ${rowFn('Thực trả cho CĐT (sau CK)', S => fmt(S.totalKHtoCDT), 'font-weight:600;')}
                    ${rowFn('Tổng chi phí (CĐT + Vay NH)', S => fmt(S.grandTotal), 'font-size:1.1rem; color:#f39c12;')}
                </tbody>
            </table>
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
