/* =============================================================
   MODULE BIỂU ĐỒ TRỰC QUAN (CHARTS MODULE) - EXECUTIVE EDITION
   Dự án: Vinhomes Sài Gòn Park
   Tích hợp: Ý Tưởng 1 (Giao Diện Tối: Xanh Đen Vinhomes Luxury & Vàng 24K)
            & Ý Tưởng 3 (Giao Diện Sáng: Bloomberg Sáng & Deep Forest Green)
   =============================================================*/

var activeChartInstances = {};

function destroyChart(canvasId) {
    if (typeof Chart !== 'undefined' && typeof Chart.getChart === 'function') {
        try {
            const existing = Chart.getChart(canvasId);
            if (existing) existing.destroy();
        } catch (e) { console.warn('Error destroying Chart via getChart:', e); }
    }
    if (activeChartInstances[canvasId]) {
        try {
            activeChartInstances[canvasId].destroy();
        } catch (e) { console.warn('Error destroying chart:', e); }
        delete activeChartInstances[canvasId];
    }
}

// Dynamic Theme Detector Helper
function isLightMode() {
    // 1. Check dark theme first! If dark-theme is present, it is strictly Dark Mode (Idea 1 Gold).
    if (document.body.classList.contains('dark-theme') || 
        document.body.classList.contains('theme-emerald-dark') || 
        document.body.classList.contains('dark-mode') || 
        document.body.classList.contains('theme-dark')) {
        return false;
    }
    // 2. Check light theme
    if (document.body.classList.contains('light-theme') || 
        document.body.classList.contains('theme-bloomberg-light') || 
        document.body.classList.contains('light-mode') || 
        document.body.classList.contains('theme-light')) {
        return true;
    }
    // 3. Fallback to prototype currentTheme if defined
    if (typeof currentTheme !== 'undefined') {
        return currentTheme === 'bloomberg-light';
    }
    return !document.body.classList.contains('dark-theme');
}

function getChartColors(isDarkTheme = true) {
    const isLight = !isDarkTheme || isLightMode();
    return {
        textColor: isLight ? '#1e293b' : '#ffffff',
        subTextColor: isLight ? '#64748b' : '#7e8c9b',
        gridColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
        angleGridColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.15)',
        gold: isLight ? '#d4af37' : '#f0ce81',
        emerald: isLight ? '#10b981' : '#2be098',
        blue: isLight ? '#0284c7' : '#66a9d7',
        cyan: isLight ? '#0ea5e9' : '#38bdf8'
    };
}

// 1. CENTER TEXT GLASS PLUGIN FOR CHART 1 (CƠ CẤU TỔNG GIÁ TRỊ BĐS)
const centerTextPlugin = {
    id: 'centerTextPriceBreakdown',
    afterDraw(chart) {
        if (!chart.canvas || (chart.canvas.id !== 'chart-breakdown-canvas' && chart.canvas.id !== 'chartPriceBreakdown')) return;
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        if (!chartArea) return;

        const dataset = chart.data.datasets[0];
        const dataArr = dataset ? dataset.data || [] : [];
        let netVal = dataArr.reduce((a, b) => a + (parseFloat(b) || 0), 0);
        
        let totalStr = '0 Tỷ';
        if (netVal >= 1e9) {
            totalStr = (netVal / 1e9).toFixed(2) + " Tỷ";
        } else if (netVal >= 1e6) {
            totalStr = (netVal / 1e6).toFixed(0) + " Tr";
        } else if (netVal > 0) {
            totalStr = (netVal > 100 ? (netVal / 1000).toFixed(2) : netVal) + " Tỷ";
        }

        const isLight = isLightMode();
        ctx.save();
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const chartWidth = chartArea.right - chartArea.left;
        const chartHeight = chartArea.bottom - chartArea.top;
        const minDim = Math.min(chartWidth, chartHeight);
        
        const labelSize = Math.max(9, Math.round(minDim * 0.052));
        const valueSize = Math.max(18, Math.round(minDim * 0.11));
        const gap = Math.round(valueSize * 0.55);

        // Line 1: Subtitle Label (positioned safely above center)
        ctx.font = `700 ${labelSize}px "Be Vietnam Pro", sans-serif`;
        ctx.fillStyle = isLight ? '#16653F' : '#E2C96E';
        ctx.fillText('TỔNG GIÁ TRỊ', centerX, centerY - gap);

        // Line 2: Large Value (positioned safely below center)
        ctx.font = `800 ${valueSize}px "Be Vietnam Pro", sans-serif`;
        ctx.fillStyle = isLight ? '#0B3B24' : '#F5D061';
        ctx.shadowBlur = 0;
        ctx.fillText(totalStr, centerX, centerY + Math.round(valueSize * 0.45));

        ctx.restore();
    }
};
if (typeof Chart !== 'undefined') Chart.register(centerTextPlugin);

window.chartLoanLabelMode = 'all';

function switchChartLoanMode(mode, btn) {
    window.chartLoanLabelMode = mode;
    if (btn && btn.parentNode) {
        btn.parentNode.querySelectorAll('.btn-chart-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    const chart = (typeof Chart !== 'undefined') ? (Chart.getChart('chart-loan-canvas') || Chart.getChart('chartLoanSchedule')) : null;
    if (chart) {
        chart.update();
    }
}

// 2. CLEAN DATALABELS DRAWING PLUGIN (NO COLLISION FOR COMBO & LINE CHARTS)
const customChartValuesPlugin = {
    id: 'customChartValues',
    afterDatasetsDraw(chart) {
        const id = chart.canvas.id;
        const ctx = chart.ctx;
        const isLight = isLightMode();
        ctx.save();

        // A. FOR LOAN SCHEDULE CHART (chart-loan-canvas / chartLoanSchedule)
        if (id === 'chart-loan-canvas' || id === 'chartLoanSchedule') {
            const metaBar = chart.getDatasetMeta(0);
            const metaLine = chart.getDatasetMeta(1);
            const mode = window.chartLoanLabelMode || 'all';

            if (metaBar && metaBar.data && metaLine && metaLine.data) {
                const isMobileScreen = chart.width < 500 || window.innerWidth < 768;

                // Draw Bar Values (Dư Nợ Gốc) - ALWAYS INSIDE the green bar with white text
                if (chart.isDatasetVisible(0) && (mode === 'all' || mode === 'principal')) {
                    const totalBars = metaBar.data.length;
                    const barStep = (isMobileScreen && totalBars > 10) ? (totalBars > 16 ? 3 : 2) : 1;

                    metaBar.data.forEach((bar, i) => {
                        if (bar.hidden) return;
                        if (barStep > 1 && i % barStep !== 0 && i !== totalBars - 1) return;

                        const valBar = chart.data.datasets[0].data[i];
                        if (valBar === undefined || valBar === null) return;
                        const numBar = parseFloat(valBar);
                        if (isNaN(numBar) || numBar <= 0) return;

                        const textBar = numBar.toFixed(1);
                        const barHeight = chart.chartArea ? (chart.chartArea.bottom - bar.y) : 50;
                        if (barHeight < 14) return;

                        const fontSz = isMobileScreen ? 8.5 : 10;
                        ctx.font = `800 ${fontSz}px "Outfit", sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#ffffff';

                        const posY = bar.y + (barHeight >= 20 ? 10 : Math.max(4, barHeight / 2));
                        ctx.fillText(textBar, bar.x, posY);
                    });
                }

                // Draw Line Values (Lãi Vay Trả Hàng Tháng) - ABOVE line points cleanly with Glass Pill Badge
                if (chart.isDatasetVisible(1) && (mode === 'all' || mode === 'interest')) {
                    const totalLinePts = metaLine.data.length;
                    const lineStep = (isMobileScreen && totalLinePts > 10) ? (totalLinePts > 16 ? 3 : 2) : 1;

                    metaLine.data.forEach((pt, i) => {
                        if (lineStep > 1 && i % lineStep !== 0 && i !== totalLinePts - 1) return;

                        const valLine = chart.data.datasets[1].data[i];
                        if (valLine === undefined || valLine === null) return;
                        const textLine = (valLine === 0 || valLine === '0') ? '0 Tr' : `${valLine} Tr`;

                        const fontSz = isMobileScreen ? 9 : 10.5;
                        ctx.font = `800 ${fontSz}px "Outfit", sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        const textWidth = ctx.measureText(textLine).width;
                        const px = pt.x;
                        const py = pt.y - (isMobileScreen ? 9 : 12);

                        const padX = isMobileScreen ? 3 : 6;
                        const rw = textWidth + padX * 2;
                        const rh = isMobileScreen ? 13 : 16;
                        const rx = px - rw / 2;
                        const ry = py - rh / 2;

                        ctx.save();
                        ctx.beginPath();
                        if (ctx.roundRect) {
                            ctx.roundRect(rx, ry, rw, rh, 3);
                        } else {
                            ctx.rect(rx, ry, rw, rh);
                        }
                        ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(4, 20, 14, 0.92)';
                        ctx.strokeStyle = isLight ? '#136F4E' : '#F5D061';
                        ctx.lineWidth = 1;
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = isLight ? '#0F5B3F' : '#FFF099';
                        ctx.fillText(textLine, px, py);
                        ctx.restore();
                    });
                }
            }
        }

        // B. FOR METHOD COMPARISON CHART (chart-methods-canvas / chartMethodComparison)
        if (id === 'chart-methods-canvas' || id === 'chartMethodComparison') {
            const numLabels = chart.data.labels ? chart.data.labels.length : 0;
            const darkColors = ['#FEF08A', '#F59E0B', '#EAB308'];
            const lightColors = ['#22c55e', '#059669', '#043d2c'];

            for (let i = 0; i < numLabels; i++) {
                const items = [];
                chart.data.datasets.forEach((ds, dsIdx) => {
                    const meta = chart.getDatasetMeta(dsIdx);
                    if (!meta || !meta.data || meta.hidden || !chart.isDatasetVisible(dsIdx)) return;
                    const pt = meta.data[i];
                    if (!pt || pt.hidden) return;
                    const val = ds.data[i];
                    const numVal = parseFloat(val);
                    if (isNaN(numVal) || numVal <= 0) return;

                    const color = isLight ? lightColors[dsIdx % lightColors.length] : darkColors[dsIdx % darkColors.length];
                    items.push({ dsIdx, numVal, text: numVal.toFixed(2), pt, color });
                });

                if (items.length === 0) continue;

                // Sort by numeric value ascending
                items.sort((a, b) => a.numVal - b.numVal);

                // Deduplicate values that are virtually identical
                const uniqueItems = [];
                items.forEach(it => {
                    const existing = uniqueItems.find(u => Math.abs(u.numVal - it.numVal) < 0.01);
                    if (!existing) {
                        uniqueItems.push(it);
                    }
                });

                uniqueItems.forEach((it, idx) => {
                    const pt = it.pt;
                    let posX = pt.x;

                    if (i === 0) {
                        ctx.textAlign = 'left';
                        posX = pt.x + 6;
                    } else if (i === numLabels - 1) {
                        ctx.textAlign = 'right';
                        posX = pt.x - 6;
                    } else {
                        ctx.textAlign = 'center';
                    }

                    ctx.font = '800 10.5px "Outfit", sans-serif';
                    ctx.fillStyle = it.color;

                    if (uniqueItems.length === 1) {
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(it.text, posX, pt.y - 7);
                    } else {
                        if (idx === 0) {
                            ctx.textBaseline = 'top';
                            ctx.fillText(it.text, posX, pt.y + 7);
                        } else {
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(it.text, posX, pt.y - 7);
                        }
                    }
                });
            }
        }

        ctx.restore();
    }
};
if (typeof Chart !== 'undefined') Chart.register(customChartValuesPlugin);


// Global Chart Parameters Tracker for Real-time Theme Switching without F5 Refresh
window.lastChartArgs = window.lastChartArgs || {
    breakdown: null,
    methods: null,
    loan: null,
    radar: null
};

function reRenderAllActiveCharts() {
    if (window.lastChartArgs.breakdown) {
        const b = window.lastChartArgs.breakdown;
        renderPriceBreakdownChart(b.canvasId, b.PA, b.S);
    }
    if (window.lastChartArgs.methods) {
        const m = window.lastChartArgs.methods;
        renderMethodComparisonChart(m.canvasId, m.results);
    }
    if (window.lastChartArgs.loan) {
        const l = window.lastChartArgs.loan;
        renderLoanScheduleChart(l.canvasId, l.loanData);
    }
    if (window.lastChartArgs.radar) {
        const r = window.lastChartArgs.radar;
        renderRadarComparisonChart(r.canvasId, r.res1, r.res2);
    }
}

/**
 * 1. Biểu đồ Cơ cấu Tổng giá trị BĐS (Doughnut Chart)
 */
function renderPriceBreakdownChart(canvasId, PA, S) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    window.lastChartArgs.breakdown = { canvasId, PA, S };

    destroyChart(canvasId);
    const c = canvas.getContext('2d');
    const isLight = isLightMode();

    const labels = ['Giá đất (chưa VAT)', 'Giá xây dựng (chưa VAT)', 'Thuế GTGT (VAT 10%)', 'Kinh phí bảo trì (KPBT 2%)'];
    const data = [PA.p_land || 0, PA.p_const || 0, ((PA.vat_land || 0) + (PA.vat_const || 0)), PA.kpbt || 0];
    
    if (S && S.totalCkAll > 0) {
        labels.push('Chiết khấu');
        data.push(S.totalCkAll);
    }

    const grandSum = data.reduce((a, b) => a + b, 0) || 1;

    const darkMonochromeGoldColors = ['#FEF08A', '#F5D061', '#F59E0B', '#854D0E', '#FFFFFF'];
    const lightColors = ['#042316', '#105E38', '#16804B', '#229E62', '#34D399'];
    const sliceColors = isLight ? lightColors : darkMonochromeGoldColors;

    // Render legend wrap dynamically matching theme
    const legendWrap = document.getElementById('chart-breakdown-legend-wrap');
    if (legendWrap) {
        const legendLabels = ['Giá đất', 'Giá xây dựng', 'Thuế VAT (10%)', 'KPBT (2%)', 'Chiết khấu'];
        let itemsHtml = '';
        labels.forEach((lbl, idx) => {
            const val = data[idx] || 0;
            const pctRaw = (val / grandSum) * 100;
            let pctStr = (pctRaw % 1 === 0) ? `${pctRaw.toFixed(0)}%` : `${pctRaw.toFixed(1)}%`;
            if (idx === 4 && S && S.ckPct > 0) {
                pctStr = `${S.ckPct.toFixed(1)}%`;
            }
            const valStr = val >= 1e9 ? `${(val / 1e9).toFixed(2)} Tỷ` : `${(val / 1e6).toFixed(0)} Tr`;
            const color = sliceColors[idx % sliceColors.length];
            const legendLbl = legendLabels[idx] || lbl;
            
            const badgeStyle = isLight 
                ? `background:${color}18; color:#0B3B24; border:1px solid ${color}40; padding:1px 5px; border-radius:4px; font-size:0.64rem; font-weight:800;` 
                : `background:${color}22; color:${color}; border:1px solid ${color}50; padding:1px 5px; border-radius:4px; font-size:0.64rem; font-weight:800;`;
            const valColor = isLight ? '#0B3B24' : '#F5D061';

            itemsHtml += `
            <div class="vertical-list-card">
                <div class="pill-left">
                    <span class="pill-dot" style="background:${color}; box-shadow:0 0 7px ${color}90;"></span>
                    <span class="pill-label">${legendLbl}</span>
                </div>
                <div class="pill-right">
                    <span class="pill-val" style="color:${valColor};">${valStr}</span>
                    <span class="pill-badge" style="${badgeStyle}">${pctStr}</span>
                </div>
            </div>`;
        });
        legendWrap.innerHTML = `<div class="luxury-vertical-list">${itemsHtml}</div>`;
    }

    activeChartInstances[canvasId] = new Chart(c, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: sliceColors,
                borderColor: isLight ? '#FFFFFF' : '#04180F',
                borderWidth: 1.5,
                borderRadius: 5,
                spacing: 3,
                hoverOffset: 6
            }]
        },
        options: {
            animation: false,
            devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2.5),
            responsive: true,
            maintainAspectRatio: false,
            cutout: '66%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(6,29,18,0.96)',
                    titleColor: isLight ? '#0B3B24' : '#F5D061',
                    bodyColor: isLight ? '#1e293b' : '#E2E8F0',
                    borderColor: isLight ? 'rgba(11,59,36,0.2)' : 'rgba(245,208,97,0.3)',
                    borderWidth: 1,
                    padding: 10,
                    boxPadding: 4,
                    usePointStyle: true,
                    callbacks: {
                        label: (context) => {
                            const val = context.raw || 0;
                            const pct = (val / grandSum * 100).toFixed(1);
                            const amount = val >= 1e9 ? `${(val / 1e9).toFixed(2)} Tỷ` : `${(val / 1e6).toFixed(0)} Triệu`;
                            return `  ${context.label}: ${amount} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * 2. Biểu đồ So sánh Các Phương thức Thanh toán (3-Line Comparison Chart)
 */
function renderMethodComparisonChart(canvasId, results) {
    if (typeof Chart === 'undefined' || !results) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    window.lastChartArgs.methods = { canvasId, results };

    destroyChart(canvasId);
    const c = canvas.getContext('2d');
    const isLight = isLightMode();

    const labels = [];
    const khPaysData = [];
    const bankPaysData = [];
    const totalCostData = [];

    const keys = Object.keys(results);
    keys.forEach(k => {
        const item = results[k];
        let label = item.paymentMethod === 'own-early' ? 'TTS 100%'
            : item.paymentMethod === 'own-normal' ? 'Tiến độ'
                : `Vay HTLS (${item.supportPlanIdx !== undefined ? (item.supportPlanIdx * 6 + 18) + 'T' : 'NH'})`;
        labels.push(label);
        khPaysData.push(parseFloat((item.totalKHtoCDT / 1e9).toFixed(2)));
        bankPaysData.push(parseFloat((item.actualBankAmt / 1e9).toFixed(2)));
        totalCostData.push(parseFloat((item.grandTotal / 1e9).toFixed(2)));
    });

    const gFeeFill = c.createLinearGradient(0, 0, 0, 260);
    if (isLight) {
        gFeeFill.addColorStop(0, 'rgba(5, 150, 105, 0.18)');
        gFeeFill.addColorStop(1, 'rgba(5, 150, 105, 0.01)');
    } else {
        gFeeFill.addColorStop(0, 'rgba(52, 211, 153, 0.20)');
        gFeeFill.addColorStop(0.5, 'rgba(52, 211, 153, 0.06)');
        gFeeFill.addColorStop(1, 'rgba(7, 32, 26, 0.00)');
    }

    activeChartInstances[canvasId] = new Chart(c, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Vốn Tự Có Trả CĐT',
                    data: khPaysData,
                    borderColor: isLight ? '#22c55e' : '#FEF08A',
                    backgroundColor: isLight ? '#22c55e' : '#FEF08A',
                    fill: false,
                    tension: 0.35,
                    borderWidth: 2.8,
                    pointRadius: 5.5,
                    pointBackgroundColor: isLight ? '#22c55e' : '#FEF08A',
                    pointBorderColor: isLight ? '#22c55e' : '#FEF08A',
                    pointBorderWidth: 2.5,
                    pointHoverRadius: 8.0
                },
                {
                    label: 'Ngân Hàng Giải Ngân',
                    data: bankPaysData,
                    borderColor: isLight ? '#059669' : '#F59E0B',
                    backgroundColor: isLight ? '#059669' : '#F59E0B',
                    fill: false,
                    tension: 0.35,
                    borderWidth: 2.8,
                    pointRadius: 5.5,
                    pointBackgroundColor: isLight ? '#059669' : '#F59E0B',
                    pointBorderColor: isLight ? '#059669' : '#F59E0B',
                    pointBorderWidth: 2.5,
                    pointHoverRadius: 8.0
                },
                {
                    label: 'Tổng Chi Phí Thực Trả',
                    data: totalCostData,
                    borderColor: isLight ? '#043d2c' : '#EAB308',
                    backgroundColor: isLight ? '#043d2c' : '#EAB308',
                    fill: false,
                    tension: 0.35,
                    borderWidth: 3.2,
                    pointRadius: 6.0,
                    pointBackgroundColor: isLight ? '#043d2c' : '#EAB308',
                    pointBorderColor: isLight ? '#043d2c' : '#EAB308',
                    pointBorderWidth: 2.8,
                    pointHoverRadius: 8.5
                }
            ]
        },
        options: {
            animation: false,
            devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2.5),
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 18,
                    right: 18,
                    top: 4,
                    bottom: 5
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isLight ? '#1e293b' : '#E2E8F0',
                        font: { family: 'Be Vietnam Pro', size: 10.5, weight: '700' },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 8
                    }
                },
                tooltip: {
                    backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(6,29,18,0.96)',
                    titleColor: isLight ? '#0B3B24' : '#F5D061',
                    bodyColor: isLight ? '#1e293b' : '#E2E8F0',
                    borderColor: isLight ? 'rgba(11,59,36,0.2)' : 'rgba(245,208,97,0.3)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} Tỷ VNĐ`
                    }
                }
            },
            scales: {
                x: { 
                    ticks: { color: isLight ? '#475569' : '#94A3B8', font: { family: 'Be Vietnam Pro', size: 10, weight: '700' } }, 
                    grid: { color: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)' } 
                },
                y: {
                    ticks: { color: isLight ? '#16653F' : '#94A3B8', font: { family: 'Be Vietnam Pro', size: 9.5, weight: '700' }, padding: 8 },
                    grid: { color: isLight ? '#e2e8f0' : 'rgba(245,208,97,0.10)', borderDash: [4, 4] },
                    title: { display: true, text: 'Tỷ VNĐ', color: isLight ? '#0B3B24' : '#F5D061', font: { family: 'Be Vietnam Pro', size: 10, weight: '800' } },
                    min: 0
                }
            }
        }
    });
}

/**
 * 3. Biểu đồ Diễn biến Dư nợ & Trả nợ Ngân hàng (Combo Bar & Line Chart)
 */
function renderLoanScheduleChart(canvasId, loanData) {
    if (typeof Chart === 'undefined' || !loanData || !loanData.rows) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    window.lastChartArgs.loan = { canvasId, loanData };

    destroyChart(canvasId);
    const c = canvas.getContext('2d');
    const isLight = isLightMode();

    const yearly = {};
    loanData.rows.forEach(r => {
        const year = Math.floor((r.m - 1) / 12) + 1;
        if (!yearly[year]) {
            yearly[year] = { year, principal: 0, interest: 0, khInterest: 0, endBalance: r.balance, count: 0 };
        }
        yearly[year].principal += r.principal;
        yearly[year].interest += r.interest;
        yearly[year].khInterest += r.khInterest;
        yearly[year].endBalance = r.balance;
        yearly[year].count += 1;
    });

    const labels = Object.keys(yearly).map(y => `Năm ${y}`);
    const balanceData = Object.values(yearly).map(y => parseFloat((y.endBalance / 1e9).toFixed(2)));
    const khInterestMonthlyData = Object.values(yearly).map(y => {
        const avgMonthly = (y.khInterest / (y.count || 12)) / 1e6;
        return avgMonthly === 0 ? 0 : parseFloat(avgMonthly.toFixed(1));
    });

    // Vertical Liquid Gold (Dark Mode) / Luxury Forest Emerald (Light Mode) Gradient
    const gBar = c.createLinearGradient(0, 0, 0, 280);
    if (isLight) {
        gBar.addColorStop(0,    '#1CA070');
        gBar.addColorStop(0.3,  '#136F4E');
        gBar.addColorStop(0.75, '#0F5B3F');
        gBar.addColorStop(1,    '#062E1F');
    } else {
        gBar.addColorStop(0,    '#F9E887');
        gBar.addColorStop(0.22, '#F5D061');
        gBar.addColorStop(0.52, '#C9A227');
        gBar.addColorStop(0.80, '#E8C53A');
        gBar.addColorStop(1,    '#7A5813');
    }

    // Line Gradient Area Fill
    const gLineFill = c.createLinearGradient(0, 0, 0, 280);
    if (isLight) {
        gLineFill.addColorStop(0, 'rgba(19, 111, 78, 0.22)');
        gLineFill.addColorStop(1, 'rgba(6, 46, 31, 0.01)');
    } else {
        gLineFill.addColorStop(0, 'rgba(255, 248, 219, 0.45)');
        gLineFill.addColorStop(0.40, 'rgba(245, 208, 97, 0.20)');
        gLineFill.addColorStop(0.75, 'rgba(197, 160, 89, 0.05)');
        gLineFill.addColorStop(1, 'rgba(122, 88, 19, 0.0)');
    }

    const isMobileScreen = (window.innerWidth < 768);

    activeChartInstances[canvasId] = new Chart(c, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Dư nợ gốc ngân hàng',
                    data: balanceData,
                    backgroundColor: gBar,
                    borderColor: isLight ? '#062E1F' : '#FFF5C0',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 32,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Lãi vay trả hàng tháng (TB)',
                    data: khInterestMonthlyData,
                    borderColor: isLight ? '#0F5B3F' : '#FFF099',
                    backgroundColor: gLineFill,
                    fill: true,
                    tension: 0.38,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: isLight ? '#136F4E' : '#FFF099',
                    pointBorderColor: isLight ? '#062E1F' : '#F5D061',
                    pointBorderWidth: 2.8,
                    pointHoverRadius: 8.0,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            animation: false,
            devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2.5),
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: isMobileScreen ? 2 : 18,
                    right: isMobileScreen ? 2 : 18,
                    top: isMobileScreen ? 14 : 4,
                    bottom: 5
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isLight ? '#1e293b' : '#E2E8F0',
                        font: { family: 'Be Vietnam Pro', size: isMobileScreen ? 9.5 : 11, weight: '700' },
                        usePointStyle: true,
                        padding: isMobileScreen ? 6 : 10,
                        generateLabels: (chart) => {
                            const defaultLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            if (defaultLabels[0]) {
                                // Cột Dư nợ gốc: Icon hình ô vuông bo góc màu Forest Green đậm / Vàng Đồng
                                defaultLabels[0].pointStyle = 'rectRounded';
                                defaultLabels[0].fillStyle = isLight ? '#0F5B3F' : '#C9A227';
                                defaultLabels[0].strokeStyle = isLight ? '#062E1F' : '#F5D061';
                            }
                            if (defaultLabels[1]) {
                                // Đường Lãi vay: Icon chấm tròn màu Forest Emerald / Vàng Sáng
                                defaultLabels[1].pointStyle = 'circle';
                                defaultLabels[1].fillStyle = isLight ? '#136F4E' : '#FFF099';
                                defaultLabels[1].strokeStyle = isLight ? '#0F5B3F' : '#F5D061';
                            }
                            return defaultLabels;
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(6,29,18,0.96)',
                    titleColor: isLight ? '#0F5B3F' : '#F5D061',
                    bodyColor: isLight ? '#1e293b' : '#E2E8F0',
                    borderColor: isLight ? 'rgba(15,91,63,0.25)' : 'rgba(245,208,97,0.3)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.datasetIndex === 0) return ` Dư nợ gốc: ${ctx.raw} Tỷ VNĐ`;
                            return ` Lãi trả hàng tháng (TB): ${ctx.raw} Triệu / tháng`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isLight ? '#475569' : '#94A3B8',
                        font: { family: 'Be Vietnam Pro', size: isMobileScreen ? 9 : 11, weight: '700' },
                        maxRotation: isMobileScreen ? 50 : 45,
                        minRotation: isMobileScreen ? 35 : 0
                    },
                    grid: { color: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)' }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: isMobileScreen ? 'Dư nợ (Tỷ)' : 'Dư nợ gốc (Tỷ VNĐ)',
                        color: isLight ? '#062E1F' : '#F5D061',
                        font: { family: 'Be Vietnam Pro', size: isMobileScreen ? 9.5 : 11, weight: '800' }
                    },
                    ticks: { color: isLight ? '#062E1F' : '#94A3B8', font: { family: 'Be Vietnam Pro', size: isMobileScreen ? 9 : 10, weight: '700' }, padding: isMobileScreen ? 2 : 8 },
                    grid: { color: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)' },
                    min: 0
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: isMobileScreen ? 'Lãi (Tr/thg)' : 'Lãi hàng tháng (Triệu VNĐ/tháng)',
                        color: isLight ? '#0F5B3F' : '#FFF099',
                        font: { family: 'Be Vietnam Pro', size: isMobileScreen ? 9.5 : 11, weight: '800' }
                    },
                    ticks: { color: isLight ? '#0F5B3F' : '#FFF099', font: { family: 'Be Vietnam Pro', size: isMobileScreen ? 9 : 10, weight: '700' }, padding: isMobileScreen ? 2 : 8 },
                    grid: { drawOnChartArea: false },
                    min: 0
                }
            }
        }
    });
}

/**
 * 4. Biểu đồ Radar So Sánh 2 Căn (Radar Chart Tab 4)
 */
function renderRadarComparisonChart(canvasId, res1, res2) {
    if (typeof Chart === 'undefined' || !res1 || !res2) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    window.lastChartArgs.radar = { canvasId, res1, res2 };

    const isLight = isLightMode();
    const codeA = res1.macan || 'Căn A';
    const codeB = res2.macan || 'Căn B';
    const legendWrap = document.getElementById('chart-radar-legend-wrap');

    destroyChart(canvasId);
    const c = canvas.getContext('2d');

    const labels = ['Tổng giá thực trả', 'Vốn tự có đợt 1', 'Đơn giá đất / m²', 'Tổng % chiết khấu', 'Diện tích đất (m²)'];

    const area1 = res1.dtDat > 0 ? res1.dtDat : (res1.dtXay > 0 ? res1.dtXay : 50);
    const area2 = res2.dtDat > 0 ? res2.dtDat : (res2.dtXay > 0 ? res2.dtXay : 50);

    const propVal1 = res1.grandTotal || res1.propValue || 0;
    const propVal2 = res2.grandTotal || res2.propValue || 0;

    const sqm1 = propVal1 / area1;
    const sqm2 = propVal2 / area2;

    const fmtSqm = (val) => {
        if (val >= 1e6) return `${(val / 1e6).toFixed(1)} Tr/m²`;
        if (val >= 1e3) return `${(val / 1e3).toFixed(0)}k/m²`;
        return `${val.toFixed(0)} đ/m²`;
    };

    const rawVals1 = [
        `${(res1.grandTotal / 1e9).toFixed(2)} Tỷ`,
        `${(res1.totalKHtoCDT / 1e9).toFixed(2)} Tỷ`,
        fmtSqm(sqm1),
        `${(res1.ckPct || 0).toFixed(1)}%`,
        `${area1.toFixed(1)} m²`
    ];

    const rawVals2 = [
        `${(res2.grandTotal / 1e9).toFixed(2)} Tỷ`,
        `${(res2.totalKHtoCDT / 1e9).toFixed(2)} Tỷ`,
        fmtSqm(sqm2),
        `${(res2.ckPct || 0).toFixed(1)}%`,
        `${area2.toFixed(1)} m²`
    ];

    const maxTotal = Math.max(res1.grandTotal, res2.grandTotal) || 1;
    const maxEquity = Math.max(res1.totalKHtoCDT, res2.totalKHtoCDT) || 1;
    const maxSqm = Math.max(sqm1, sqm2) || 1;
    const maxCk = Math.max(res1.ckPct, res2.ckPct) || 1;
    const maxArea = Math.max(area1, area2) || 1;

    const data1 = [
        Math.round((res1.grandTotal / maxTotal) * 100),
        Math.round((res1.totalKHtoCDT / maxEquity) * 100),
        Math.round((sqm1 / maxSqm) * 100),
        Math.round((res1.ckPct / maxCk) * 100),
        Math.round((area1 / maxArea) * 100)
    ];

    const data2 = [
        Math.round((res2.grandTotal / maxTotal) * 100),
        Math.round((res2.totalKHtoCDT / maxEquity) * 100),
        Math.round((sqm2 / maxSqm) * 100),
        Math.round((res2.ckPct / maxCk) * 100),
        Math.round((area2 / maxArea) * 100)
    ];

    const items = [
        { label: 'Tổng giá thực trả', valA: rawVals1[0], valB: rawVals2[0], numA: res1.grandTotal || 0, numB: res2.grandTotal || 0 },
        { label: 'Vốn tự có đợt 1', valA: rawVals1[1], valB: rawVals2[1], numA: res1.totalKHtoCDT || 0, numB: res2.totalKHtoCDT || 0 },
        { label: 'Đơn giá / m²', valA: rawVals1[2], valB: rawVals2[2], numA: sqm1 || 0, numB: sqm2 || 0 },
        { label: 'Tổng % chiết khấu', valA: rawVals1[3], valB: rawVals2[3], numA: res1.ckPct || 0, numB: res2.ckPct || 0 },
        { label: 'Diện tích căn', valA: rawVals1[4], valB: rawVals2[4], numA: area1 || 0, numB: area2 || 0 }
    ];

    let rowsHtml = items.map(it => {
        let styleA = isLight ? 'color:#1e293b; font-weight:700;' : 'color:#ffffff; font-weight:700;';
        let styleB = isLight ? 'color:#1e293b; font-weight:700;' : 'color:#ffffff; font-weight:700;';

        if (Math.abs(it.numA - it.numB) > 0.0001) {
            if (it.numA < it.numB) {
                styleA = isLight ? 'color:#059669; font-weight:900;' : 'color:#34d399; text-shadow:0 0 8px rgba(52,211,153,0.45); font-weight:900;';
                styleB = isLight ? 'color:#64748b; font-weight:700;' : 'color:#ffffff; font-weight:700; opacity:0.85;';
            } else if (it.numB < it.numA) {
                styleB = isLight ? 'color:#059669; font-weight:900;' : 'color:#34d399; text-shadow:0 0 8px rgba(52,211,153,0.45); font-weight:900;';
                styleA = isLight ? 'color:#64748b; font-weight:700;' : 'color:#ffffff; font-weight:700; opacity:0.85;';
            }
        }

        const trBg = isLight ? '#f8fafc' : 'linear-gradient(145deg, rgba(13, 46, 38, 0.55), rgba(7, 23, 20, 0.75))';
        const borderColor = isLight ? '#e2e8f0' : 'rgba(240,206,129,0.18)';
        const labelColor = isLight ? '#0F5235' : '#ffffff';

        return `
        <tr style="background:${trBg}; transition: all 0.2s ease;">
            <td style="padding:11px 14px; font-size:0.85rem; border-top:1px solid ${borderColor}; border-bottom:1px solid ${borderColor}; border-left:1px solid ${borderColor}; border-top-left-radius:8px; border-bottom-left-radius:8px; color:${labelColor}; font-weight:700; white-space:nowrap;">
                ${it.label}
            </td>
            <td style="padding:11px 14px; font-size:0.95rem; text-align:center; border-top:1px solid ${borderColor}; border-bottom:1px solid ${borderColor}; white-space:nowrap; ${styleA}">
                ${it.valA}
            </td>
            <td style="padding:11px 14px; font-size:0.95rem; text-align:center; border-top:1px solid ${borderColor}; border-bottom:1px solid ${borderColor}; border-right:1px solid ${borderColor}; border-top-right-radius:8px; border-bottom-right-radius:8px; white-space:nowrap; ${styleB}">
                ${it.valB}
            </td>
        </tr>
        `;
    }).join('');

    if (legendWrap) {
        const thBg = isLight ? '#f1f5f9' : 'rgba(4,16,14,0.95)';
        const thColor = isLight ? '#0F5235' : '#ffffff';
        const thValColor = isLight ? '#854d0e' : '#fce8a6';
        const thBorder = isLight ? '#cbd5e1' : 'rgba(240,206,129,0.4)';

        legendWrap.innerHTML = `
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:separate; border-spacing:0 6px; font-size:0.85rem;">
                    <thead>
                        <tr>
                            <th style="padding:11px 14px; font-size:0.8rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; color:${thColor}; background:${thBg}; border-bottom:2px solid ${thBorder}; border-top-left-radius:8px; border-bottom-left-radius:8px;">HẠNG MỤC SO SÁNH</th>
                            <th style="padding:11px 14px; font-size:0.8rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; color:${thValColor}; background:${thBg}; border-bottom:2px solid ${thBorder}; text-align:center;">CĂN A (${codeA})</th>
                            <th style="padding:11px 14px; font-size:0.8rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; color:${thValColor}; background:${thBg}; border-bottom:2px solid ${thBorder}; text-align:center; border-top-right-radius:8px; border-bottom-right-radius:8px;">CĂN B (${codeB})</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    activeChartInstances[canvasId] = new Chart(c, {
        type: 'radar',
        data: {
            labels,
            datasets: [
                {
                    label: `Căn A (${codeA})`,
                    data: data1,
                    borderColor: isLight ? '#D4AF37' : '#FFF099',
                    backgroundColor: isLight ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 240, 153, 0.28)',
                    pointBackgroundColor: isLight ? '#ffffff' : '#FFFDF0',
                    pointBorderColor: isLight ? '#D4AF37' : '#F5D061',
                    pointBorderWidth: 2.8,
                    pointRadius: 5.5,
                    borderWidth: 3.0
                },
                {
                    label: `Căn B (${codeB})`,
                    data: data2,
                    borderColor: isLight ? '#0B3B24' : '#34D399',
                    backgroundColor: isLight ? 'rgba(11, 59, 36, 0.15)' : 'rgba(52, 211, 153, 0.24)',
                    pointBackgroundColor: isLight ? '#ffffff' : '#E6FFFA',
                    pointBorderColor: isLight ? '#0B3B24' : '#10B981',
                    pointBorderWidth: 2.8,
                    pointRadius: 5.5,
                    borderWidth: 3.0
                }
            ]
        },
        options: {
            animation: false,
            devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2.5),
            _rawValues1: rawVals1,
            _rawValues2: rawVals2,
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 20, bottom: 20, left: 45, right: 45 } },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: isLight ? '#1e293b' : '#ffffff', font: { family: 'Be Vietnam Pro', size: 11, weight: '700' }, usePointStyle: true, padding: 12 }
                },
                tooltip: {
                    backgroundColor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(6,29,18,0.96)',
                    titleColor: isLight ? '#0B3B24' : '#F5D061',
                    bodyColor: isLight ? '#1e293b' : '#E2E8F0',
                    borderColor: isLight ? 'rgba(11,59,36,0.2)' : 'rgba(245,208,97,0.3)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: (tooltipItem) => {
                            const ds = tooltipItem.dataset;
                            const rawList = tooltipItem.datasetIndex === 0 ? rawVals1 : rawVals2;
                            const realVal = rawList ? rawList[tooltipItem.dataIndex] : '';
                            return ` ${ds.label}: ${realVal} (Điểm: ${tooltipItem.raw}/100)`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    angleLines: { color: isLight ? '#dee2e6' : 'rgba(255,255,255,0.12)' },
                    grid: { color: isLight ? '#dee2e6' : 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: isLight ? '#0B3B24' : '#cbd5e1', font: { family: 'Be Vietnam Pro', size: 10, weight: '700' } },
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}
