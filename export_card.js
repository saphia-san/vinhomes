/* =============================================================
   MODULE TẠO & XUẤT ẢNH BÁO GIÁ (EXECUTIVE QUOTATION POSTER CARD)
   Dự án: Vinhomes Sài Gòn Park
   =============================================================*/

var currentExportSData = null;

/**
 * Mở modal tùy chỉnh thông tin báo giá trước khi tải ảnh
 */
function openExportModal(S) {
    if (S) {
        currentExportSData = S;
    } else if (typeof selectedApt !== 'undefined' && selectedApt && typeof calculate === 'function') {
        const res = calculate(true, false);
        if (res && res.S) {
            currentExportSData = res.S;
        }
    }
    if (!currentExportSData) {
        currentExportSData = window.lastResultS || (typeof lastResultS !== 'undefined' ? lastResultS : null);
    }

    if (!currentExportSData) {
        alert('Vui lòng chọn căn và bấm Tính Toán trước khi xuất ảnh báo giá!');
        return;
    }

    let modalEl = document.getElementById('exportCardModal');
    if (!modalEl) {
        createExportModalHTML();
        modalEl = document.getElementById('exportCardModal');
    }

    const savedName = localStorage.getItem('vsp_sale_name') || 'Nguyễn Văn A';
    const savedPhone = localStorage.getItem('vsp_sale_phone') || '0901 234 567';

    if (document.getElementById('exportSaleName')) document.getElementById('exportSaleName').value = savedName;
    if (document.getElementById('exportSalePhone')) document.getElementById('exportSalePhone').value = savedPhone;

    updateQuotationPreview();

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } else {
        modalEl.style.display = 'block';
        modalEl.classList.add('show');
    }
}

/**
 * Cập nhật xem trước ảnh báo giá poster Executive 800px
 */
function updateQuotationPreview() {
    const S = currentExportSData;
    if (!S) return;

    const macan = S.macan || '';
    const titleEl = document.getElementById('exportModalTitleSpan');
    if (titleEl) {
        titleEl.textContent = `Xuất ảnh PNG cho Bảng thanh toán chi tiết của căn ${macan}`;
    }

    const saleName = document.getElementById('exportSaleName') ? document.getElementById('exportSaleName').value : 'Nguyễn Văn A';
    const salePhone = document.getElementById('exportSalePhone') ? document.getElementById('exportSalePhone').value : '0901 234 567';

    localStorage.setItem('vsp_sale_name', saleName);
    localStorage.setItem('vsp_sale_phone', salePhone);

    const container = document.getElementById('quotationCardPreview');
    if (!container) return;

    const fmt = (v) => (v || 0).toLocaleString('vi-VN');
    const fmtD = (d, label) => {
        if (label) return label;
        if (!d) return '—';
        if (typeof fmtDate === 'function') return fmtDate(d);
        if (d instanceof Date) return d.toLocaleDateString('vi-VN');
        return d.toString();
    };

    let methodLabel = '';
    if (S.paymentMethod === 'own-early') {
        methodLabel = 'THANH TOÁN SỚM 100%';
    } else if (S.paymentMethod === 'own-normal') {
        methodLabel = 'THANH TOÁN TIẾN ĐỘ CHUẨN';
    } else {
        const planName = S.supportPlanLabel || 'VAY HTLS 0% (18 THÁNG)';
        methodLabel = planName.toUpperCase();
    }

    const macanVal = macan || 'AS72-24';
    const macanClean = (macanVal || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const mapImgSrc = `assets/spotlight/spotlight_${macanClean}.jpg`;
    const fallbackHero = `assets/hero-overview.jpg`;

    let zoneName = S.subdivision || '';
    let roadInfo = S.road || '';
    let amenityTilesHTML = '';
    if (typeof getUnitSpotlightInfo === 'function') {
        const spotInfo = getUnitSpotlightInfo(macanVal);
        if (spotInfo) {
            if (!zoneName) zoneName = spotInfo.zoneName;
            if (!roadInfo) roadInfo = spotInfo.roadInfo;
            if (spotInfo.amenityTiles && spotInfo.amenityTiles.length) {
                amenityTilesHTML = spotInfo.amenityTiles.map(t => `
                    <div style="position: relative; height: 82px; border-radius: 10px; overflow: hidden; background: #07201a;">
                        <img src="${t.img}" onerror="this.onerror=null; this.src='assets/hero-overview.jpg';" style="width: 100%; height: 100%; object-fit: cover; object-position: center; transform: scale(1.14); display: block;" alt="${t.name}">
                        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 4px 5px; background: linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 70%, transparent 100%); color: #ffffff; font-size: 0.7rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;">${t.name}</div>
                    </div>
                `).join('');
            }
        }
    }
    if (!zoneName) zoneName = 'Ivy Park (Khu 1)';
    if (!roadInfo) roadInfo = 'Ánh Sáng 72 (13m - 19m)';

    const PA = S.PA;
    const isGianXay = PA && PA.p_const > 0;

    // 1. Render Chi tiết bóc tách (Giá trị sau ưu đãi)
    let breakdownHTML = '';
    if (isGianXay) {
        breakdownHTML = `
        <div class="unified-block" style="background: rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 16px 18px; margin-bottom: 22px;">
            <div style="font-size: 0.92rem; font-weight: 800; color: #ffffff; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px;">
                <span><i class="bi bi-pie-chart-fill me-1"></i> GIÁ TRỊ SAU ƯU ĐÃI</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; color: #ffffff;">
                <tbody>
                    <tr>
                        <td style="width: 55%; font-weight: 700; color: #f8d77f; padding: 6.5px 10px;">Giá đất (chưa VAT):</td>
                        <td style="width: 45%; text-align: right; font-weight: 700; padding: 6.5px 10px;">${fmt(PA.p_land)} VNĐ</td>
                    </tr>
                    <tr>
                        <td style="padding: 6.5px 10px 6.5px 18px; color: rgba(255,255,255,0.85);">Thuế VAT Tiền Đất (10%):</td>
                        <td style="text-align: right; color: rgba(255,255,255,0.85); padding: 6.5px 10px;">${fmt(PA.vat_land)} VNĐ</td>
                    </tr>
                    <tr style="background: rgba(248, 215, 127, 0.08); font-weight: 800;">
                        <td style="color: #ffffff; padding: 6.5px 10px;">Tổng Tiền Đất (gồm VAT):</td>
                        <td style="text-align: right; color: #f8d77f; padding: 6.5px 10px;">${fmt(PA.land_total)} VNĐ</td>
                    </tr>

                    <tr>
                        <td style="font-weight: 700; color: #f8d77f; padding: 8px 10px 6.5px 10px;">Giá xây dựng (chưa VAT):</td>
                        <td style="text-align: right; font-weight: 700; padding: 8px 10px 6.5px 10px;">${fmt(PA.p_const)} VNĐ</td>
                    </tr>
                    <tr>
                        <td style="padding: 6.5px 10px 6.5px 18px; color: rgba(255,255,255,0.85);">Thuế VAT Xây Dựng (10%):</td>
                        <td style="text-align: right; color: rgba(255,255,255,0.85); padding: 6.5px 10px;">${fmt(PA.vat_const)} VNĐ</td>
                    </tr>
                    <tr>
                        <td style="padding: 6.5px 10px 6.5px 18px; color: rgba(255,255,255,0.85);">Kinh phí bảo trì (KPBT 0.5%):</td>
                        <td style="text-align: right; color: rgba(255,255,255,0.85); padding: 6.5px 10px;">${fmt(PA.kpbt)} VNĐ</td>
                    </tr>
                    <tr style="background: rgba(248, 215, 127, 0.08); font-weight: 800;">
                        <td style="color: #ffffff; padding: 6.5px 10px;">Tổng tiền Xây (Gồm VAT+KPBT):</td>
                        <td style="text-align: right; color: #f8d77f; padding: 6.5px 10px;">${fmt(PA.const_total + PA.kpbt)} VNĐ</td>
                    </tr>

                    <tr style="background: rgba(255,255,255,0.08); font-weight: 900; border-top: 1.5px solid rgba(248, 215, 127, 0.3);">
                        <td style="color: #ffffff; font-size: 0.85rem; padding: 8px 10px;">TỔNG GIÁ GỒM VAT (Gồm VAT+KPBT):</td>
                        <td style="text-align: right; padding: 8px 10px; background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 50%, #e0a330 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 1.05rem;">${fmt(PA.allin || (PA.land_total + PA.const_total + PA.kpbt))} VNĐ</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
    } else {
        breakdownHTML = `
        <div class="unified-block" style="background: rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 16px 18px; margin-bottom: 22px;">
            <div style="font-size: 0.92rem; font-weight: 800; color: #ffffff; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px;">
                <span><i class="bi bi-pie-chart-fill me-1"></i> GIÁ TRỊ SAU ƯU ĐÃI</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; color: #ffffff;">
                <tbody>
                    <tr>
                        <td style="width: 55%; font-weight: 700; color: #f8d77f; padding: 6.5px 10px;">Giá bán (chưa VAT):</td>
                        <td style="width: 45%; text-align: right; font-weight: 700; padding: 6.5px 10px;">${fmt(PA ? PA.p_land : S.propValue)} VNĐ</td>
                    </tr>
                    <tr>
                        <td style="padding: 6.5px 10px 6.5px 18px; color: rgba(255,255,255,0.85);">Thuế VAT (10%):</td>
                        <td style="text-align: right; color: rgba(255,255,255,0.85); padding: 6.5px 10px;">${fmt(PA ? PA.vat_land : 0)} VNĐ</td>
                    </tr>
                    <tr>
                        <td style="padding: 6.5px 10px 6.5px 18px; color: rgba(255,255,255,0.85);">Kinh phí bảo trì (KPBT 0.5%):</td>
                        <td style="text-align: right; color: rgba(255,255,255,0.85); padding: 6.5px 10px;">${fmt(PA ? PA.kpbt : 0)} VNĐ</td>
                    </tr>
                    <tr style="background: rgba(255,255,255,0.08); font-weight: 900; border-top: 1.5px solid rgba(248, 215, 127, 0.3);">
                        <td style="color: #ffffff; font-size: 0.85rem; padding: 8px 10px;">TỔNG GIÁ GỒM VAT (Gồm VAT+KPBT):</td>
                        <td style="text-align: right; padding: 8px 10px; background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 50%, #e0a330 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 1.05rem;">${fmt(PA ? PA.allin : (S.contractPrice || S.totalGross))} VNĐ</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
    }

    // 2. Render Chi tiết Chiết khấu
    const ckDetails = S.ckDetails || [];
    let ckRowsHTML = '';
    if (ckDetails.length > 0) {
        ckRowsHTML = ckDetails.map(c => {
            const cleanLabel = (c.label || '').replace(/\(\d+(\.\d+)?%\)$/, '').trim();
            const valDisplay = c.valStr || (c.vnd ? (fmt(c.vnd) + ' VNĐ') : (c.pct ? (c.pct + '%') : 'Chiết khấu'));
            return `
            <tr>
                <td style="width: 60%; padding: 6.5px 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">${cleanLabel}:</td>
                <td style="width: 40%; text-align: right; font-weight: 700; padding: 6.5px 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">${valDisplay}</td>
            </tr>`;
        }).join('');
    } else {
        ckRowsHTML = `
        <tr>
            <td style="padding: 6.5px 10px;">Ưu đãi niêm yết theo CSBH CĐT:</td>
            <td style="text-align: right; font-weight: 700; padding: 6.5px 10px;">0 VNĐ</td>
        </tr>`;
    }

    // 3. Render Bảng Lịch Thanh Toán Chi Tiết
    const stages = S.stages || [];
    let scheduleSectionHTML = '';
    const isBankPlan = S.paymentMethod && S.paymentMethod.startsWith('bank');

    const getTableHeader = (stageTitle = 'Đợt thanh toán') => {
        if (isBankPlan) {
            return `
        <thead>
            <tr>
                <th style="width: 18%; background: rgba(255, 255, 255, 0.08); padding: 7px 8px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15); text-align: left;">${stageTitle}</th>
                <th style="width: 15%; text-align: center; background: rgba(255, 255, 255, 0.08); padding: 7px 8px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">Ngày</th>
                <th style="width: 25%; background: rgba(255, 255, 255, 0.08); padding: 7px 8px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15); text-align: left;">TỶ LỆ THANH TOÁN</th>
                <th style="width: 21%; text-align: right; white-space: nowrap; background: rgba(255, 255, 255, 0.08); padding: 7px 12px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">Số tiền (VNĐ)</th>
                <th style="width: 21%; text-align: right; white-space: nowrap; background: rgba(255, 255, 255, 0.08); padding: 7px 8px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">NH giải ngân</th>
            </tr>
        </thead>`;
        }
        return `
        <thead>
            <tr>
                <th style="width: 20%; background: rgba(255, 255, 255, 0.08); padding: 7px 8px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15); text-align: left;">${stageTitle}</th>
                <th style="width: 18%; text-align: center; background: rgba(255, 255, 255, 0.08); padding: 7px 8px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">Ngày</th>
                <th style="width: 37%; background: rgba(255, 255, 255, 0.08); padding: 7px 8px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15); text-align: left;">TỶ LỆ THANH TOÁN</th>
                <th style="width: 25%; text-align: right; white-space: nowrap; background: rgba(255, 255, 255, 0.08); padding: 7px 12px; text-transform: uppercase; font-weight: 800; font-size: 0.68rem; border-bottom: 1px solid rgba(255, 255, 255, 0.15);">Số tiền (VNĐ)</th>
            </tr>
        </thead>`;
    };

    const renderStageRows = (list) => list.flatMap(s => {
        if (s.subItems && s.subItems.length > 0) {
            return s.subItems.map((sub, idx) => {
                const isSubBank = sub.isBankRow || (sub.label && sub.label.includes('Ngân hàng'));
                const subBankVal = isSubBank ? (sub.gross || sub.bankAmt) : sub.bankAmt;
                const subBankText = (subBankVal && subBankVal > 0) ? fmt(subBankVal) : '—';
                const subGrossText = isSubBank ? '—' : fmt(sub.gross || sub.net);
                const subRatio = sub.ratioStr || '—';
                const borderStyle = idx < s.subItems.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.04);' : 'border-bottom: 1px solid rgba(255,255,255,0.12);';

                const bankTd = isBankPlan
                    ? `<td style="text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; padding: 6.5px 8px; ${borderStyle} color: #ffffff; font-weight: 800;">${subBankText}</td>`
                    : '';

                if (idx === 0) {
                    return `
        <tr>
            <td rowspan="${s.subItems.length}" style="padding: 6.5px 8px; border-bottom: 1px solid rgba(255,255,255,0.12); vertical-align: middle;"><strong>Đợt ${s.no}</strong> ${s.label}</td>
            <td rowspan="${s.subItems.length}" style="text-align: center; padding: 6.5px 8px; border-bottom: 1px solid rgba(255,255,255,0.12); vertical-align: middle;">${fmtD(s.date, s.dateLabel)}</td>
            <td style="padding: 6.5px 8px; ${borderStyle} color:#f8d77f; font-weight:700;">${subRatio}</td>
            <td style="text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; padding: 6.5px 12px; ${borderStyle} font-weight: 800;">${subGrossText}</td>
            ${bankTd}
        </tr>`;
                } else {
                    return `
        <tr>
            <td style="padding: 6.5px 8px; ${borderStyle} color:#f8d77f; font-weight:700;">${subRatio}</td>
            <td style="text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; padding: 6.5px 12px; ${borderStyle} font-weight: 800;">${subGrossText}</td>
            ${bankTd}
        </tr>`;
                }
            });
        }

        const bankColText = (s.bankAmt && s.bankAmt > 0) ? fmt(s.bankAmt) : (s.isBankRow ? fmt(s.gross) : '—');
        const grossColText = (s.isBankRow && isBankPlan) ? '—' : fmt(s.gross || s.net);
        const bankTd = isBankPlan
            ? `<td style="text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; padding: 6.5px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #ffffff; font-weight: 800;">${bankColText}</td>`
            : '';

        return [`
        <tr>
            <td style="padding: 6.5px 8px; border-bottom: 1px solid rgba(255,255,255,0.04);"><strong>Đợt ${s.no}</strong> ${s.label}</td>
            <td style="text-align: center; padding: 6.5px 8px; border-bottom: 1px solid rgba(255,255,255,0.04);">${fmtD(s.date, s.dateLabel)}</td>
            <td style="padding: 6.5px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); color:#f8d77f; font-weight:700;">${s.desc || s.ratioStr || 'Thanh toán'}</td>
            <td style="text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; padding: 6.5px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); font-weight: 800;">${grossColText}</td>
            ${bankTd}
        </tr>`];
    }).join('');

    if (isGianXay) {
        const landStages = stages.filter(s => (s.isLand || s.type === 'land' || (s.no && s.no <= 4)));
        const conStages = stages.filter(s => (!s.isLand && s.type !== 'land' && (s.no && s.no > 4)));

        scheduleSectionHTML = `
        <div style="margin-bottom: 18px;">
            <div style="color: #f8d77f; background: rgba(248, 215, 127, 0.08); font-size: 0.78rem; font-weight: 800; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 6px;">
                <span>THANH TOÁN TIỀN ĐẤT</span>
                <span style="font-weight: 700; color: #ffffff; font-size: 0.73rem; white-space: nowrap;">Tổng Tiền Đất (gồm VAT): ${fmt(PA.land_total)} VNĐ</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem; color: #ffffff; table-layout: fixed;">
                ${getTableHeader('Đợt thanh toán')}
                <tbody>
                    ${renderStageRows(landStages.length ? landStages : stages.slice(0, 4))}
                </tbody>
            </table>
        </div>

        <div>
            <div style="color: #f8d77f; background: rgba(248, 215, 127, 0.08); font-size: 0.78rem; font-weight: 800; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 6px;">
                <span>THANH TOÁN TIỀN XÂY DỰNG</span>
                <span style="font-weight: 700; color: #ffffff; font-size: 0.73rem; white-space: nowrap;">Tổng tiền Xây (Gồm VAT+KPBT): ${fmt(PA.const_total + PA.kpbt)} VNĐ</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem; color: #ffffff; table-layout: fixed;">
                ${getTableHeader('Đợt thanh toán')}
                <tbody>
                    ${renderStageRows(conStages.length ? conStages : stages.slice(4))}
                </tbody>
            </table>
        </div>`;
    } else {
        const rowsHTML = renderStageRows(stages);

        scheduleSectionHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.74rem; color: #ffffff; table-layout: fixed;">
            ${getTableHeader('Đợt Thanh Toán')}
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>`;
    }

    let ptttBadgeText = 'TĐC';
    if (S.paymentMethod === 'own-early') {
        ptttBadgeText = 'TTS';
    } else if (S.paymentMethod === 'own-normal') {
        ptttBadgeText = 'TĐC';
    } else {
        let months = 18;
        if (S.supportPlanLabel) {
            const m = S.supportPlanLabel.match(/(\d+)\s*(tháng|T)/i);
            if (m) months = parseInt(m[1], 10);
        } else if (typeof SALES_POLICY !== 'undefined' && SALES_POLICY.interestSupport) {
            const isGian = (S.PA && S.PA.p_const > 0) || (S.apt && (S.apt.type === 'gianXay' || S.apt.type === 'rough'));
            const plans = isGian ? SALES_POLICY.interestSupport.roughAndGianXay : (SALES_POLICY.interestSupport.finished || SALES_POLICY.interestSupport.roughAndGianXay);
            const idx = S.supportPlanIdx || 0;
            if (plans && plans[idx] && plans[idx].months) {
                months = plans[idx].months;
            }
        } else if (S.supportPlanIdx !== undefined && S.supportPlanIdx !== null) {
            months = S.supportPlanIdx * 6 + 18;
        }
        ptttBadgeText = `VAY HTLS 0% (${months}T)`;
    }

    container.innerHTML = `
    <!-- KHUNG POSTER EXECUTIVE (800PX TARGET CAPTURE) -->
    <div id="posterRenderCapture" style="width: 800px; min-width: 800px; background: linear-gradient(150deg, #02120d 0%, #05221a 45%, #083327 80%, #031610 100%); color: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; border-radius: 22px; border: 1.5px solid rgba(248, 215, 127, 0.35); padding: 28px 24px; box-shadow: 0 25px 70px rgba(0,0,0,0.85); box-sizing: border-box; position: relative; margin: 0 auto; text-align: left;">
        
        <!-- 1. HEADER SECTION -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.12);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="logo-vinhomes-saigon-park-gold.jpg" onerror="this.style.display='none';" style="height: 48px; width: auto; max-width: 140px; object-fit: contain; border-radius: 10px; box-shadow: 0 0 18px rgba(248, 215, 127, 0.35); background: rgba(4, 28, 21, 0.6); display: block;" alt="Logo Vinhomes Sài Gòn Park">
                <div>
                    <div style="font-size: 1.4rem; font-weight: 900; background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 50%, #e0a330 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.8px; line-height: 1.1;">VINHOMES SÀI GÒN PARK</div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 30%, #d99b26 70%, #fff0b8 100%); color: #041c15; padding: 8px 22px; border-radius: 30px; text-align: center; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); border: none; display: inline-flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 900; letter-spacing: 0.5px; line-height: 1; white-space: nowrap;">
                ${macan} • ${ptttBadgeText}
            </div>
        </div>

        <!-- 2. SPOTLIGHT VISUAL BLOCK -->
        <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px; margin-bottom: 22px;">
            <div style="border-radius: 16px; overflow: hidden; width: 100%; height: 100%; min-height: 310px; padding: 0 !important; margin: 0 !important; background: transparent !important; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <img src="${mapImgSrc}" onerror="this.onerror=null; this.src='${fallbackHero}';" style="width: 100%; height: 100%; min-height: 310px; border-radius: 16px; object-fit: cover; display: block; border: none !important; margin: 0 !important; padding: 0 !important;" alt="Vị trí căn ${macan}">
            </div>

            <div style="background: rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 16px 14px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="font-size: 0.83rem; line-height: 1.85; color: #ffffff; margin-bottom: 12px; margin-top: 2px;">
                        <div><span style="color: rgba(255,255,255,0.7);">Phân khu:</span> <strong style="color: #ffffff;">${zoneName} ${isGianXay ? '- Giãn Xây' : ''}</strong></div>
                        <div>
                            <span style="color: rgba(255,255,255,0.7);">DT Đất:</span> <strong style="color: #f8d77f;">${S.landArea || S.dtDat || '50'} m²</strong>
                            <span style="color: rgba(255,255,255,0.35); margin: 0 10px;">|</span>
                            <span style="color: rgba(255,255,255,0.7);">DT Xây Dựng:</span> <strong style="color: #f8d77f;">${S.constructionArea || S.dtXd || '157.7'} m²</strong>
                        </div>
                        <div><span style="color: rgba(255,255,255,0.7);">Mặt tiền đường:</span> <strong style="color: #ffffff;">${roadInfo}</strong></div>
                    </div>

                    <div style="font-weight: 800; font-size: 0.8rem; color: #ffffff; margin-bottom: 6px;">
                        Tiện Ích Nổi Bật Lân Cận:
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        ${amenityTilesHTML}
                    </div>
                </div>
            </div>
        </div>

        <!-- 3. CHƯƠNG TRÌNH ƯU ĐÃI -->
        <div style="background: rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 16px 18px; margin-bottom: 22px;">
            <div style="font-size: 0.92rem; font-weight: 800; color: #ffffff; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px;">
                <span><i class="bi bi-gift-fill me-1"></i> CHƯƠNG TRÌNH ƯU ĐÃI</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; color: #ffffff;">
                <tbody>
                    ${ckRowsHTML}
                    <tr style="background: rgba(255,255,255,0.06); font-weight: 900;">
                        <td style="color: #ffffff; font-size: 0.85rem; padding: 6.5px 10px;">TỔNG TIỀN CHIẾT KHẤU TIẾT KIỆM ĐƯỢC:</td>
                        <td style="text-align: right; padding: 6.5px 10px; background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 50%, #e0a330 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 0.88rem;">${fmt(S.totalCkAll)} VNĐ</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 4. GIÁ TRỊ SAU ƯU ĐÃI -->
        ${breakdownHTML}

        <!-- 5. BẢNG THANH TOÁN CHI TIẾT -->
        <div style="background: rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 16px 18px; margin-bottom: 22px;">
            <div style="font-size: 0.92rem; font-weight: 800; color: #ffffff; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px;">
                <span><i class="bi bi-calendar-check-fill me-1"></i> BẢNG THANH TOÁN CHI TIẾT - ${methodLabel}</span>
            </div>
            
            ${scheduleSectionHTML}

            <!-- SUMMARY BANNER -->
            <div style="border-top: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 8px; margin-top: 14px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 900; color: #ffffff; font-size: 0.85rem;">
                    TỔNG SỐ TIỀN KH THỰC TRẢ:
                </div>
                <div style="background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 50%, #e0a330 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 1.1rem;">
                    ${fmt(S.totalKHtoCDT)} VNĐ
                </div>
            </div>
        </div>

        <!-- 6. FOOTER CONSULTANT BANNER -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.12); padding-top: 14px; font-size: 0.78rem; color: rgba(255, 255, 255, 0.85);">
            <div>
                <div style="font-weight: 800; color: #ffffff; font-size: 0.85rem;">Vinhomes Sài Gòn Park – Đại đô thị tri thức bậc nhất TPHCM</div>
                <div style="font-size: 0.72rem; color: rgba(255,255,255,0.65); margin-top: 2px;">Bảng thanh toán được minh họa theo CSBH mới nhất của CĐT Vingroup.</div>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 30%, #d99b26 70%, #fff0b8 100%); color: #041c15; padding: 6px 20px; border-radius: 20px; font-weight: 900; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: right; white-space: nowrap;">
                CVTV: ${saleName} · SĐT: ${salePhone}
            </div>
        </div>

    </div>`;
}

/**
 * Xuất và Tải Ảnh Báo Giá PNG (Chất lượng HD 800px exact dimensions trên cả PC & Mobile)
 */
function downloadQuotationPNG() {
    const el = document.getElementById('posterRenderCapture');
    if (!el) {
        alert('Không tìm thấy khung ảnh báo giá!');
        return;
    }

    if (typeof html2canvas === 'undefined') {
        alert('Thư viện html2canvas chưa được tải. Vui lòng kiểm tra kết nối mạng!');
        return;
    }

    const macan = (currentExportSData && currentExportSData.macan) ? currentExportSData.macan : 'Can';

    const origWidth = el.style.width;
    const origMinWidth = el.style.minWidth;
    el.style.width = '800px';
    el.style.minWidth = '800px';

    html2canvas(el, {
        scale: 2, // HD Quality (1600px canvas width)
        useCORS: true,
        backgroundColor: '#010705',
        width: 800,
        windowWidth: 800,
        imageTimeout: 15000,
        logging: false
    }).then(canvas => {
        el.style.width = origWidth;
        el.style.minWidth = origMinWidth;

        const fileName = `BaoGia_Executive_VinhomesSaigonPark_${macan}.png`;
        if (canvas.toBlob) {
            canvas.toBlob(blob => {
                if (!blob) {
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }, 'image/png');
        } else {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    }).catch(err => {
        el.style.width = origWidth;
        el.style.minWidth = origMinWidth;
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
        <div class="modal-content" style="background:#041c15; color:#ffffff; border:1px solid #f8d77f; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.8);">
            <div class="modal-header" style="border-bottom:1px solid rgba(248,215,127,0.3); padding:16px 20px;">
                <h5 class="modal-title" style="color:#f8d77f !important; -webkit-text-fill-color:#f8d77f !important; font-weight:800 !important; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                    <i class="bi bi-image me-1" style="color:#f8d77f !important; -webkit-text-fill-color:#f8d77f !important;"></i>
                    <span id="exportModalTitleSpan" style="color:#f8d77f !important; -webkit-text-fill-color:#f8d77f !important;">Xuất ảnh PNG cho Bảng thanh toán chi tiết của căn</span>
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" onclick="closeExportModal()"></button>
            </div>
            <div class="modal-body" style="padding:20px;">
                <div class="row g-3 mb-3">
                    <div class="col-md-6 col-12">
                        <label class="form-label text-warning small font-weight-bold mb-1"><i class="bi bi-person-badge me-1"></i> Chuyên viên tư vấn:</label>
                        <input type="text" id="exportSaleName" class="form-control form-control-sm px-3" value="Nguyễn Văn A" style="background:rgba(255,255,255,0.08); color:#ffffff; border:1px solid rgba(248,215,127,0.4); border-radius:8px;" oninput="updateQuotationPreview()">
                    </div>
                    <div class="col-md-6 col-12">
                        <label class="form-label text-warning small font-weight-bold mb-1"><i class="bi bi-telephone-fill me-1"></i> Số điện thoại của CVTV:</label>
                        <input type="text" id="exportSalePhone" class="form-control form-control-sm px-3" value="0901 234 567" style="background:rgba(255,255,255,0.08); color:#ffffff; border:1px solid rgba(248,215,127,0.4); border-radius:8px;" oninput="updateQuotationPreview()">
                    </div>
                </div>

                <div class="text-center mb-2 small" style="color: #ffffff !important; font-weight: 700; font-size: 0.9rem;"><i class="bi bi-eye-fill me-1.5" style="color:#f8d77f !important; font-size: 1.05rem;"></i>Xem trước poster báo giá HD (kích thước chuẩn 800px):</div>
                
                <!-- CONTAINER CHO PHÉP SCROLL NGANG TRÊN ĐIỆN THOẠI NHƯNG ẢNH ĐẢM BẢO CHUẨN 800PX -->
                <div style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; padding: 12px 4px; background: rgba(0,0,0,0.4); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                    <div id="quotationCardPreview" style="display: inline-block; min-width: 800px; text-align: left;"></div>
                </div>
            </div>
            <div class="modal-footer" style="border-top:1px solid rgba(248,215,127,0.3); padding:14px 20px; display:flex; justify-content:space-between; align-items:center;">
                <button type="button" class="btn btn-outline-light btn-sm px-3" style="border-radius:20px;" data-bs-dismiss="modal" onclick="closeExportModal()">Đóng</button>
                <button type="button" class="btn font-weight-bold px-4" style="background:linear-gradient(135deg, #fff7d6 0%, #f8d77f 35%, #d99b26 75%, #ffe699 100%); color:#041c15; border-radius:20px; border:none; box-shadow:0 4px 15px rgba(217,155,38,0.4);" onclick="downloadQuotationPNG()">
                    <i class="bi bi-download me-1"></i> Tải ảnh PNG HD (800px)
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
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        modalEl.style.display = 'none';
        modalEl.classList.remove('show');
    }
}

/* =============================================================
   MODULE XUẤT ẢNH SO SÁNH 2 CĂN (2-UNIT COMPARISON EXPORT)
   ============================================================= */

/**
 * Mở modal tùy chỉnh thông tin sale cho bảng so sánh 2 căn
 */
function exportCompare2Image() {
    const container = document.getElementById('compare2FullContent');
    if (!container || !container.children.length) {
        alert('Vui lòng chọn mã 2 căn và bấm So Sánh trước khi xuất ảnh!');
        return;
    }

    let modalEl = document.getElementById('exportCompareCardModal');
    if (!modalEl) {
        createExportCompareModalHTML();
        modalEl = document.getElementById('exportCompareCardModal');
    }

    const savedName = localStorage.getItem('vsp_sale_name') || 'Nguyễn Văn A';
    const savedPhone = localStorage.getItem('vsp_sale_phone') || '0901 234 567';

    if (document.getElementById('exportCmpSaleName')) document.getElementById('exportCmpSaleName').value = savedName;
    if (document.getElementById('exportCmpSalePhone')) document.getElementById('exportCmpSalePhone').value = savedPhone;

    updateCompareQuotationPreview();

    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } else {
        modalEl.style.display = 'block';
        modalEl.classList.add('show');
    }
}

/**
 * Cập nhật xem trước ảnh so sánh 2 căn
 */
function updateCompareQuotationPreview() {
    const saleName = document.getElementById('exportCmpSaleName') ? document.getElementById('exportCmpSaleName').value : 'Nguyễn Văn A';
    const salePhone = document.getElementById('exportCmpSalePhone') ? document.getElementById('exportCmpSalePhone').value : '0901 234 567';

    localStorage.setItem('vsp_sale_name', saleName);
    localStorage.setItem('vsp_sale_phone', salePhone);

    const mainContent = document.getElementById('compare2FullContent');
    const previewBox = document.getElementById('compareQuotationCardPreview');
    if (!mainContent || !previewBox) return;

    let rawCode1 = document.getElementById('cmpApt1') ? document.getElementById('cmpApt1').value.trim().toUpperCase() : 'CĂN A';
    let rawCode2 = document.getElementById('cmpApt2') ? document.getElementById('cmpApt2').value.trim().toUpperCase() : 'CĂN B';
    let mKey1 = document.getElementById('cmpMethod1') ? document.getElementById('cmpMethod1').value : 'own-early';
    let mKey2 = document.getElementById('cmpMethod2') ? document.getElementById('cmpMethod2').value : 'own-normal';

    if (window.lastCompareMeta) {
        if (window.lastCompareMeta.rawCode1) rawCode1 = window.lastCompareMeta.rawCode1;
        if (window.lastCompareMeta.rawCode2) rawCode2 = window.lastCompareMeta.rawCode2;
    }

    const getPtttLabel = (mKey, tag) => {
        if (tag) return tag;
        if (mKey === 'own-early') return 'TTS';
        if (mKey === 'own-normal') return 'TĐC';
        if (mKey && mKey.startsWith('bank')) {
            let months = 18;
            if (mKey.startsWith('bank_')) {
                const idx = parseInt(mKey.split('_')[1]);
                if (!isNaN(idx)) months = idx * 6 + 18;
            }
            return `Vay HTLS ${months}T`;
        }
        return 'TTS';
    };

    const tag1 = getPtttLabel(mKey1, window.lastCompareMeta ? window.lastCompareMeta.tag1 : null);
    const tag2 = getPtttLabel(mKey2, window.lastCompareMeta ? window.lastCompareMeta.tag2 : null);

    const val1 = `${rawCode1} (${tag1})`;
    const val2 = `${rawCode2} (${tag2})`;
    
    const todayStr = new Date().toLocaleDateString('vi-VN');

    previewBox.innerHTML = `
<div id="compareQuotationRenderCapture" style="width:1150px; min-width:1150px; padding:28px 24px; background: linear-gradient(150deg, #02120d 0%, #05221a 45%, #083327 80%, #031610 100%); color: #ffffff; font-family:'Plus Jakarta Sans', sans-serif; border-radius:22px; border:1.5px solid rgba(248,215,127,0.35); box-shadow:0 25px 70px rgba(0,0,0,0.85); margin:0 auto; box-sizing:border-box; text-align:left;">
    
    <style>
        #compareQuotationRenderCapture {
            background: linear-gradient(150deg, #02120d 0%, #05221a 45%, #083327 80%, #031610 100%) !important;
            color: #ffffff !important;
            font-family: 'Plus Jakarta Sans', sans-serif !important;
        }

        /* Tất cả chữ và số mặc định trong ảnh xuất đều màu TRẮNG */
        #compareQuotationRenderCapture *,
        #compareQuotationRenderCapture div,
        #compareQuotationRenderCapture p,
        #compareQuotationRenderCapture span,
        #compareQuotationRenderCapture strong,
        #compareQuotationRenderCapture h1,
        #compareQuotationRenderCapture h2,
        #compareQuotationRenderCapture h3,
        #compareQuotationRenderCapture h4,
        #compareQuotationRenderCapture h5,
        #compareQuotationRenderCapture h6,
        #compareQuotationRenderCapture td,
        #compareQuotationRenderCapture th,
        #compareQuotationRenderCapture label,
        #compareQuotationRenderCapture i {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
        }

        #compareQuotationRenderCapture .card-custom,
        #compareQuotationRenderCapture .card {
            background: rgba(255, 255, 255, 0.04) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 16px !important;
            color: #ffffff !important;
            box-shadow: none !important;
        }

        /* 1. Ô ĐÁNH GIÁ TỔNG QUAN (Overview Box): Nền cùng màu nền ảnh, viền vàng kim */
        #compareQuotationRenderCapture .card-custom.mb-3.p-3,
        #compareQuotationRenderCapture .card-custom.p-3.mb-3 {
            background: rgba(255, 255, 255, 0.04) !important;
            border: 1px solid rgba(248, 215, 127, 0.35) !important;
            border-left: 5px solid #f8d77f !important;
            border-radius: 14px !important;
            color: #ffffff !important;
            box-shadow: none !important;
        }

        #compareQuotationRenderCapture .card-custom.mb-3.p-3 strong,
        #compareQuotationRenderCapture .card-custom.p-3.mb-3 strong,
        #compareQuotationRenderCapture .card-custom.mb-3.p-3 i,
        #compareQuotationRenderCapture .card-custom.p-3.mb-3 i {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
        }

        /* 2. Khối Summary Boxes (Giá chưa VAT, Tổng Chiết khấu, Thực trả CĐT, Tổng giá trị thực tế) */
        #compareQuotationRenderCapture .summary-box {
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
        }

        #compareQuotationRenderCapture .summary-box .s-label {
            color: rgba(255, 255, 255, 0.75) !important;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.75) !important;
        }

        #compareQuotationRenderCapture .summary-box .s-value,
        #compareQuotationRenderCapture .summary-box.total .s-value,
        #compareQuotationRenderCapture .summary-box.discount-box .s-value,
        #compareQuotationRenderCapture .summary-box.loan-box .s-value {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
            font-weight: 800 !important;
        }

        #compareQuotationRenderCapture .summary-box.total {
            background: rgba(248, 215, 127, 0.08) !important;
            border: 1px solid rgba(248, 215, 127, 0.3) !important;
        }

        #compareQuotationRenderCapture table {
            background: transparent !important;
            color: #ffffff !important;
        }

        #compareQuotationRenderCapture table th {
            background: rgba(255, 255, 255, 0.08) !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            border-bottom: 1.5px solid rgba(255, 255, 255, 0.2) !important;
            font-weight: 800 !important;
        }

        #compareQuotationRenderCapture table td {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        #compareQuotationRenderCapture .sub-text,
        #compareQuotationRenderCapture .matrix-sub-text,
        #compareQuotationRenderCapture .matrix-bank-note {
            color: rgba(255, 255, 255, 0.65) !important;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.65) !important;
        }

        #compareQuotationRenderCapture tr.stage-section-header-land,
        #compareQuotationRenderCapture tr.stage-section-header-const {
            background: rgba(255, 255, 255, 0.06) !important;
        }

        /* Đảm bảo dòng Đợt 1 (row-stage-deposit) có cùng nền hòa hợp với các đợt khác */
        #compareQuotationRenderCapture .row-stage-deposit,
        #compareQuotationRenderCapture tr.row-stage-deposit {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        #compareQuotationRenderCapture .row-stage-deposit td,
        #compareQuotationRenderCapture tr.row-stage-deposit td {
            background: transparent !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            font-weight: 700 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        #compareQuotationRenderCapture .badge-deduct-price,
        #compareQuotationRenderCapture .badge-deduct-cashback,
        #compareQuotationRenderCapture .badge-deduct-gift,
        #compareQuotationRenderCapture .badge-deduct-voucher {
            background: rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }

        /* 3. Các hàng tổng quan trọng trong Bảng Chi Tiết (Subtotal, Bank, Grand Total Rows) -> MÀU VÀNG (#f8d77f) */
        #compareQuotationRenderCapture tr.row-subtotal td,
        #compareQuotationRenderCapture tr.row-subtotal td *,
        #compareQuotationRenderCapture tr.row-bank td,
        #compareQuotationRenderCapture tr.row-bank td *,
        #compareQuotationRenderCapture tr.row-grand td,
        #compareQuotationRenderCapture tr.row-grand td *,
        #compareQuotationRenderCapture tr.row-summary-allin td,
        #compareQuotationRenderCapture tr.row-summary-allin td *,
        #compareQuotationRenderCapture .net-amount {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
            font-weight: 800 !important;
        }

        #compareQuotationRenderCapture tr.row-grand .grand-title {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
            font-weight: 900 !important;
        }

        /* ============================================================
           QUY TẮC NỔI BẬT RIÊNG CHO BẢNG DÒNG TIỀN THANH TOÁN SONG SONG
           ============================================================ */

        /* 1. Số tiền của căn nào ít hơn ở mỗi đợt & hàng tổng -> MÀU VÀNG (#f8d77f) */
        #compareQuotationRenderCapture .result-table .matrix-val-better,
        #compareQuotationRenderCapture .result-table .matrix-val-better * {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
            font-weight: 800 !important;
        }

        /* 2. Số tiền căn lớn hơn hoặc bằng nhau -> MÀU TRẮNG (#ffffff) */
        #compareQuotationRenderCapture .result-table .matrix-val-default,
        #compareQuotationRenderCapture .result-table .matrix-val-default * {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
        }

        /* 3. Ô hiển thị chênh lệch (Cột 5):
              Bằng nhau -> Màu trắng xám (#cbd5e1) */
        #compareQuotationRenderCapture .result-table .badge-equal,
        #compareQuotationRenderCapture .result-table .badge-equal * {
            color: #cbd5e1 !important;
            -webkit-text-fill-color: #cbd5e1 !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }

        /* 4. Ô hiển thị chênh lệch (Cột 5):
              Hơn hay kém gì -> MÀU VÀNG (#f8d77f) */
        #compareQuotationRenderCapture .result-table .badge-diff-high,
        #compareQuotationRenderCapture .result-table .badge-diff-high *,
        #compareQuotationRenderCapture .result-table .badge-diff-low,
        #compareQuotationRenderCapture .result-table .badge-diff-low * {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
            background: rgba(248, 215, 127, 0.15) !important;
            border: 1px solid rgba(248, 215, 127, 0.4) !important;
        }

        /* 5. Hai hàng tổng trong Ma Trận Dòng Tiền (Tổng vốn tự có & Tổng giá trị tài sản) -> MÀU VÀNG (#f8d77f) */
        #compareQuotationRenderCapture .matrix-summary-row {
            background: rgba(255, 255, 255, 0.04) !important;
            border-top: 1.5px solid rgba(248, 215, 127, 0.35) !important;
        }

        #compareQuotationRenderCapture .matrix-summary-row td,
        #compareQuotationRenderCapture .matrix-summary-row td *,
        #compareQuotationRenderCapture .matrix-summary-row .matrix-summary-title,
        #compareQuotationRenderCapture .matrix-summary-row .matrix-summary-title * {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
            font-weight: 800 !important;
        }

        #compareQuotationRenderCapture .matrix-summary-row .matrix-sub-text {
            color: rgba(248, 215, 127, 0.75) !important;
            -webkit-text-fill-color: rgba(248, 215, 127, 0.75) !important;
            font-weight: 500 !important;
        }

        #compareQuotationRenderCapture .matrix-summary-row td:last-child span {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
        }
        #compareQuotationRenderCapture .matrix-summary-row td:last-child .matrix-val-default {
            color: #cbd5e1 !important;
            -webkit-text-fill-color: #cbd5e1 !important;
        }

        /* Top Brand Title & Badges */
        #compareQuotationRenderCapture .top-brand-title {
            background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 50%, #e0a330 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
        }

        #compareQuotationRenderCapture .top-hdr-badge,
        #compareQuotationRenderCapture .footer-sale-badge {
            background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 30%, #d99b26 70%, #fff0b8 100%) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
        }

        #compareQuotationRenderCapture .top-hdr-badge *,
        #compareQuotationRenderCapture .footer-sale-badge * {
            color: #041c15 !important;
            -webkit-text-fill-color: #041c15 !important;
        }

        #compareQuotationRenderCapture .sale-hotline-text {
            color: #f8d77f !important;
            -webkit-text-fill-color: #f8d77f !important;
        }
    </style>
    
    <!-- Top Header Banner -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255, 255, 255, 0.12); padding-bottom:18px; margin-bottom:22px;">
        <div style="display:flex; align-items:center; gap:12px;">
            <img src="logo-vinhomes-saigon-park-gold.jpg" onerror="this.style.display='none';" style="height: 48px; width: auto; max-width: 140px; object-fit: contain; border-radius: 10px; box-shadow: 0 0 18px rgba(248, 215, 127, 0.35); background: rgba(4, 28, 21, 0.6); display: block;" alt="Logo Vinhomes Sài Gòn Park">
            <div>
                <div class="top-brand-title" style="font-size:1.6rem; font-weight:900; background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 50%, #e0a330 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing:1px; line-height: 1.1; text-transform:uppercase;">VINHOMES SÀI GÒN PARK</div>
                <div style="font-size:0.92rem; font-weight:800; color:#ffffff; margin-top:3px; letter-spacing:0.5px; text-transform:uppercase;">BẢNG SO SÁNH 2 PHƯƠNG ÁN THANH TOÁN</div>
            </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
            <div class="top-hdr-badge" style="background:linear-gradient(135deg, #fff7d6 0%, #f8d77f 30%, #d99b26 70%, #fff0b8 100%); color:#041c15 !important; padding:8px 18px; border-radius:18px; text-align:center; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); min-width: 125px;">
                <div style="font-size:0.82rem; font-weight:800; color:#041c15 !important; -webkit-text-fill-color:#041c15 !important; text-transform:uppercase;">Căn A: ${rawCode1}</div>
                <div style="font-size:0.82rem; font-weight:800; color:#041c15 !important; -webkit-text-fill-color:#041c15 !important; margin-top:2px;">${tag1}</div>
            </div>
            
            <div style="font-size:1.4rem; font-weight:900; color:#f8d77f; -webkit-text-fill-color:#f8d77f; line-height:1; padding:0 4px; text-shadow:0 0 8px rgba(248,215,127,0.5);">•</div>

            <div class="top-hdr-badge" style="background:linear-gradient(135deg, #fff7d6 0%, #f8d77f 30%, #d99b26 70%, #fff0b8 100%); color:#041c15 !important; padding:8px 18px; border-radius:18px; text-align:center; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); min-width: 125px;">
                <div style="font-size:0.82rem; font-weight:800; color:#041c15 !important; -webkit-text-fill-color:#041c15 !important; text-transform:uppercase;">Căn B: ${rawCode2}</div>
                <div style="font-size:0.82rem; font-weight:800; color:#041c15 !important; -webkit-text-fill-color:#041c15 !important; margin-top:2px;">${tag2}</div>
            </div>
        </div>
    </div>

    <!-- Nội dung bảng so sánh chi tiết -->
    <div class="compare-capture-body">
        ${mainContent.innerHTML}
    </div>

    <!-- Footer Banner -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.12); padding-top:16px; margin-top:24px; font-size:0.78rem; color:rgba(255,255,255,0.85);">
        <div>
            <div style="font-weight:800; color:#ffffff; font-size:0.85rem;">Vinhomes Sài Gòn Park – Đại đô thị tri thức bậc nhất TPHCM</div>
            <div style="font-size:0.72rem; color:rgba(255,255,255,0.65); margin-top:2px;">Bảng so sánh phương án tài chính được minh họa theo CSBH mới nhất của CĐT Vingroup.</div>
        </div>
        <div class="footer-sale-badge" style="background: linear-gradient(135deg, #fff7d6 0%, #f8d77f 30%, #d99b26 70%, #fff0b8 100%); color: #041c15; padding: 6px 20px; border-radius: 20px; font-weight: 900; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: right; white-space: nowrap;">
            <span>CVTV: ${saleName} · SĐT: ${salePhone}</span>
        </div>
    </div>

</div>`;

    // 1. Chuyển đổi toàn bộ thẻ <canvas> (như biểu đồ Radar) thành thẻ <img> sắc nét
    const origCanvases = mainContent.querySelectorAll('canvas');
    const previewCanvases = previewBox.querySelectorAll('canvas');
    origCanvases.forEach((origCanvas, i) => {
        if (previewCanvases[i]) {
            try {
                const imgData = origCanvas.toDataURL('image/png');
                const img = document.createElement('img');
                img.src = imgData;
                img.style.width = '100%';
                img.style.maxHeight = '280px';
                img.style.objectFit = 'contain';
                previewCanvases[i].parentNode.replaceChild(img, previewCanvases[i]);
            } catch (err) {
                console.error('Lỗi chuyển đổi canvas sang img:', err);
            }
        }
    });

    // 2. Ẩn nút bấm trong ảnh xuất ra để giữ thẻ sạch đẹp
    previewBox.querySelectorAll('.compare-capture-body button').forEach(btn => btn.remove());

    // 3. Xử lý ép kiểu style cho ô ĐÁNH GIÁ TỔNG QUAN trong previewBox để nền trùng màu poster và chữ nổi màu vàng/trắng
    previewBox.querySelectorAll('.card-custom').forEach(card => {
        if (card.textContent && card.textContent.includes('ĐÁNH GIÁ TỔNG QUAN')) {
            card.style.setProperty('background', 'rgba(255, 255, 255, 0.04)', 'important');
            card.style.setProperty('border', '1px solid rgba(248, 215, 127, 0.35)', 'important');
            card.style.setProperty('border-left', '5px solid #f8d77f', 'important');
            card.style.setProperty('color', '#ffffff', 'important');
            card.style.setProperty('box-shadow', 'none', 'important');

            card.querySelectorAll('strong').forEach(el => {
                el.style.setProperty('color', '#f8d77f', 'important');
                el.style.setProperty('-webkit-text-fill-color', '#f8d77f', 'important');
            });
            card.querySelectorAll('i').forEach(el => {
                el.style.setProperty('color', '#f8d77f', 'important');
                el.style.setProperty('-webkit-text-fill-color', '#f8d77f', 'important');
            });
        }
    });

    // 4. Ép dòng Đợt 1 (.row-stage-deposit) về nền trong suốt trùng màu với các đợt khác
    previewBox.querySelectorAll('.row-stage-deposit, tr.row-stage-deposit').forEach(tr => {
        tr.style.setProperty('background', 'transparent', 'important');
        tr.querySelectorAll('td').forEach(td => {
            td.style.setProperty('background', 'transparent', 'important');
            td.style.setProperty('color', '#ffffff', 'important');
            td.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
        });
    });
}

/**
 * Tải ảnh PNG so sánh 2 căn (HD Quality)
 */
function downloadCompareQuotationPNG() {
    const el = document.getElementById('compareQuotationRenderCapture');
    if (!el) {
        alert('Không tìm thấy bản so sánh để xuất ảnh!');
        return;
    }

    if (typeof html2canvas === 'undefined') {
        alert('Thư viện html2canvas chưa được tải. Vui lòng kiểm tra kết nối mạng!');
        return;
    }

    const val1 = document.getElementById('cmpApt1') ? document.getElementById('cmpApt1').value.trim() : 'CanA';
    const val2 = document.getElementById('cmpApt2') ? document.getElementById('cmpApt2').value.trim() : 'CanB';

    const origWidth = el.style.width;
    const origMinWidth = el.style.minWidth;
    el.style.width = '1150px';
    el.style.minWidth = '1150px';

    html2canvas(el, {
        scale: 2, // HD Quality
        useCORS: true,
        backgroundColor: '#010705',
        width: 1150,
        windowWidth: 1150,
        imageTimeout: 15000,
        logging: false
    }).then(canvas => {
        el.style.width = origWidth;
        el.style.minWidth = origMinWidth;

        const fileName = `SoSanh_VinhomesSaigonPark_${val1}_vs_${val2}.png`;
        if (canvas.toBlob) {
            canvas.toBlob(blob => {
                if (!blob) {
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }, 'image/png');
        } else {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    }).catch(err => {
        el.style.width = origWidth;
        el.style.minWidth = origMinWidth;
        console.error('Error generating comparison PNG card:', err);
        alert('Có lỗi khi tạo ảnh so sánh: ' + err.message);
    });
}

/**
 * Tạo Modal HTML cho Export Compare Card
 */
function createExportCompareModalHTML() {
    const modalHTML = `
<div class="modal fade" id="exportCompareCardModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content" style="background:#041c15; color:#ffffff; border:1px solid #f8d77f; border-radius:16px;">
            <div class="modal-header" style="border-bottom:1px solid rgba(248,215,127,0.3);">
                <h5 class="modal-title" style="color:#f8d77f !important; -webkit-text-fill-color:#f8d77f !important; font-weight:800 !important; font-size:1.15rem; display:flex; align-items:center; gap:8px;">
                    <i class="bi bi-camera-fill me-1" style="color:#f8d77f !important; -webkit-text-fill-color:#f8d77f !important;"></i>
                    <span style="color:#f8d77f !important; -webkit-text-fill-color:#f8d77f !important;">Xuất ảnh PNG cho BẢNG SO SÁNH CĂN</span>
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" onclick="closeExportCompareModal()"></button>
            </div>
            <div class="modal-body" style="padding:20px;">
                <div class="row g-3 mb-3">
                    <div class="col-md-6 col-12">
                        <label class="form-label text-warning small font-weight-bold mb-1"><i class="bi bi-person-badge me-1"></i> Chuyên viên tư vấn:</label>
                        <input type="text" id="exportCmpSaleName" class="form-control form-control-sm px-3" value="Nguyễn Văn A" style="background:rgba(255,255,255,0.08); color:#ffffff; border:1px solid rgba(248,215,127,0.4);" oninput="updateCompareQuotationPreview()">
                    </div>
                    <div class="col-md-6 col-12">
                        <label class="form-label text-warning small font-weight-bold mb-1"><i class="bi bi-telephone-fill me-1"></i> Số điện thoại của CVTV:</label>
                        <input type="text" id="exportCmpSalePhone" class="form-control form-control-sm px-3" value="0901 234 567" style="background:rgba(255,255,255,0.08); color:#ffffff; border:1px solid rgba(248,215,127,0.4);" oninput="updateCompareQuotationPreview()">
                    </div>
                </div>

                <div class="text-center mb-2 small" style="color: #ffffff !important; font-weight: 700; font-size: 0.9rem;"><i class="bi bi-eye-fill me-1.5" style="color:#f8d77f !important; font-size: 1.05rem;"></i>Xem trước Bảng so sánh 2 phương án thanh toán:</div>
                <div style="overflow-x:auto; width:100%; -webkit-overflow-scrolling:touch; padding:10px; background:rgba(0,0,0,0.4); border-radius:12px;">
                    <div id="compareQuotationCardPreview" style="display:inline-block; min-width:1150px; text-align:left;"></div>
                </div>
            </div>
            <div class="modal-footer" style="border-top:1px solid rgba(248,215,127,0.3);">
                <button type="button" class="btn btn-outline-light btn-sm px-3" style="border-radius:20px;" data-bs-dismiss="modal" onclick="closeExportCompareModal()">Đóng</button>
                <button type="button" class="btn font-weight-bold px-4" style="background:linear-gradient(135deg, #fff7d6 0%, #f8d77f 35%, #d99b26 75%, #ffe699 100%); color:#041c15; border-radius:20px;" onclick="downloadCompareQuotationPNG()">
                    <i class="bi bi-download me-1"></i> Tải ảnh so sánh PNG (HD)
                </button>
            </div>
        </div>
    </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeExportCompareModal() {
    const modalEl = document.getElementById('exportCompareCardModal');
    if (modalEl) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        modalEl.style.display = 'none';
        modalEl.classList.remove('show');
    }
}
