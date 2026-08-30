/* =============================================================
   MODULE BIỂU ĐỒ TRỰC QUAN (CHARTS MODULE)
   Dự án: Vinhomes Sài Gòn Park
   =============================================================*/

var activeChartInstances = {};

function destroyChart(canvasId) {
    if (activeChartInstances[canvasId]) {
        try {
            activeChartInstances[canvasId].destroy();
        } catch (e) { console.warn('Error destroying chart:', e); }
        delete activeChartInstances[canvasId];
    }
}

function getChartColors() {
    const isLight = document.body && document.body.classList.contains('light-theme');
    const colors = {
        textColor: isLight ? '#0f172a' : '#e2e8f0',
        subTextColor: isLight ? '#475569' : '#94a3b8',
        gridColor: isLight ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.08)',
        angleGridColor: isLight ? 'rgba(15,23,42,0.22)' : 'rgba(255,255,255,0.15)'
    };
    if (typeof Chart !== 'undefined' && Chart.defaults) {
        Chart.defaults.color = colors.textColor;
    }
    return colors;
}

/**
 * 1. Biểu đồ Cơ cấu Tổng giá trị BĐS (Doughnut Chart)
 */
function renderPriceBreakdownChart(canvasId, PA, S) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    destroyChart(canvasId);
    const C = getChartColors();

    const labels = ['Giá Đất (Chưa VAT)', 'Giá Xây Dựng (Chưa VAT)', 'Thuế GTGT (VAT 10%)', 'Kinh phí bảo trì (KPBT 2%)'];
    const data = [PA.p_land, PA.p_const || 0, (PA.vat_land + PA.vat_const), PA.kpbt];
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

    if (S.totalCkAll > 0) {
        labels.push('Tiết kiệm Chiết khấu');
        data.push(S.totalCkAll);
        colors.push('#059669');
    }

    const ctx = canvas.getContext('2d');
    activeChartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderColor: document.body && document.body.classList.contains('dark-theme') ? '#0d2e26' : '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: C.textColor,
                        font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' },
                        padding: 12,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const val = context.raw || 0;
                            return ` ${context.label}: ${(val / 1e9).toFixed(3)} Tỷ VNĐ (${(val / 1e6).toFixed(0)} tr)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

/**
 * 2. Biểu đồ So sánh Các Phương thức Thanh toán (Grouped Bar Chart)
 */
function renderMethodComparisonChart(canvasId, results) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    destroyChart(canvasId);
    const C = getChartColors();

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
        khPaysData.push((item.totalKHtoCDT / 1e9).toFixed(3));
        bankPaysData.push((item.actualBankAmt / 1e9).toFixed(3));
        totalCostData.push((item.grandTotal / 1e9).toFixed(3));
    });

    const ctx = canvas.getContext('2d');
    activeChartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Vốn tự có trả CĐT (Tỷ VNĐ)',
                    data: khPaysData,
                    backgroundColor: '#f59e0b',
                    borderRadius: 6
                },
                {
                    label: 'Ngân hàng giải ngân (Tỷ VNĐ)',
                    data: bankPaysData,
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                },
                {
                    label: 'Tổng chi phí (Tỷ VNĐ)',
                    data: totalCostData,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' }, usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} Tỷ VNĐ`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    grid: { color: C.gridColor }
                },
                y: {
                    ticks: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    grid: { color: C.gridColor },
                    title: { display: true, text: 'Tỷ VNĐ', color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } }
                }
            }
        }
    });
}

/**
 * 3. Biểu đồ Diễn biến Dư nợ & Trả nợ Ngân hàng (Line/Area Chart)
 */
function renderLoanScheduleChart(canvasId, loanData) {
    if (typeof Chart === 'undefined' || !loanData || !loanData.rows) return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    destroyChart(canvasId);
    const C = getChartColors();

    const yearly = {};
    loanData.rows.forEach(r => {
        const year = Math.floor((r.m - 1) / 12) + 1;
        if (!yearly[year]) {
            yearly[year] = { year, principal: 0, interest: 0, khInterest: 0, endBalance: r.balance };
        }
        yearly[year].principal += r.principal;
        yearly[year].interest += r.interest;
        yearly[year].khInterest += r.khInterest;
        yearly[year].endBalance = r.balance;
    });

    const labels = Object.keys(yearly).map(y => `Năm ${y}`);
    const balanceData = Object.values(yearly).map(y => (y.endBalance / 1e9).toFixed(3));
    const khInterestData = Object.values(yearly).map(y => (y.khInterest / 1e6).toFixed(0));
    const cdtSupportedData = Object.values(yearly).map(y => ((y.interest - y.khInterest) / 1e6).toFixed(0));

    const ctx = canvas.getContext('2d');
    activeChartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Dư nợ còn lại (Tỷ VNĐ)',
                    data: balanceData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Lãi KH phải trả/năm (Tr VNĐ)',
                    data: khInterestData,
                    borderColor: '#ef4444',
                    backgroundColor: '#ef4444',
                    type: 'bar',
                    yAxisID: 'y1',
                    borderRadius: 4
                },
                {
                    label: 'Lãi CĐT hỗ trợ 0%/năm (Tr VNĐ)',
                    data: cdtSupportedData,
                    borderColor: '#10b981',
                    backgroundColor: '#10b981',
                    type: 'bar',
                    yAxisID: 'y1',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' }, usePointStyle: true }
                }
            },
            scales: {
                x: { ticks: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } }, grid: { color: C.gridColor } },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    title: { display: true, text: 'Dư nợ (Tỷ VNĐ)', color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    grid: { color: C.gridColor }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: { color: '#ef4444', font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    title: { display: true, text: 'Tiền lãi (Triệu VNĐ)', color: '#ef4444', font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    grid: { drawOnChartArea: false }
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

    destroyChart(canvasId);
    const C = getChartColors();

    const labels = ['Giá HĐMB', 'Vốn Tự Có 30%', 'Diện Tích Đất', 'Chiết Khấu %', 'Đơn Giá/m2'];

    const maxVal = Math.max(res1.grandTotal, res2.grandTotal) || 1;
    const data1 = [
        Math.round((res1.grandTotal / maxVal) * 100),
        Math.round(((res1.totalKHtoCDT || res1.grandTotal * 0.3) / maxVal) * 100),
        Math.min(100, Math.round((res1.propValue / 1e8))),
        Math.round(res1.ckPct * 5),
        80
    ];

    const data2 = [
        Math.round((res2.grandTotal / maxVal) * 100),
        Math.round(((res2.totalKHtoCDT || res2.grandTotal * 0.3) / maxVal) * 100),
        Math.min(100, Math.round((res2.propValue / 1e8))),
        Math.round(res2.ckPct * 5),
        75
    ];

    const ctx = canvas.getContext('2d');
    activeChartInstances[canvasId] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [
                {
                    label: `Căn 1 (${res1.macan})`,
                    data: data1,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.25)',
                    pointBackgroundColor: '#f59e0b'
                },
                {
                    label: `Căn 2 (${res2.macan})`,
                    data: data2,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.25)',
                    pointBackgroundColor: '#3b82f6'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } } }
            },
            scales: {
                r: {
                    angleLines: { color: C.angleGridColor },
                    grid: { color: C.angleGridColor },
                    pointLabels: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    ticks: { display: false }
                }
            }
        }
    });
}
