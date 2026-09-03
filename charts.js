/* =============================================================
   MODULE BIỂU ĐỒ TRỰC QUAN (CHARTS MODULE)
   Dự án: Vinhomes Sài Gòn Park
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

function getChartColors() {
    const colors = {
        textColor: '#000000',
        subTextColor: '#1e293b',
        gridColor: 'rgba(0, 0, 0, 0.08)',
        angleGridColor: 'rgba(0, 0, 0, 0.15)'
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
    
    const ctx = canvas.getContext('2d');
    
    const bgColors = [
        'rgba(229, 195, 132, 0.30)', // Vàng Cát (Mellow Gold)
        'rgba(158, 215, 198, 0.30)', // Xanh Bạc Hà (Mint Green)
        'rgba(153, 203, 235, 0.30)', // Xanh Da Trời Nhạt (Baby Blue)
        'rgba(226, 169, 155, 0.30)'  // Hồng Đất (Rose Gold)
    ];
    const borderColors = ['#D4A855', '#68B8A0', '#66A9D7', '#C98372'];

    if (S.totalCkAll > 0) {
        labels.push('Tiết kiệm Chiết khấu');
        data.push(S.totalCkAll);
        bgColors.push('rgba(203, 185, 235, 0.30)'); // Tím Oải Hương (Soft Lavender)
        borderColors.push('#A282D7');
    }

    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: function(chart) {
            try {
                if (chart.config.type !== 'doughnut') return;
                var ctx = chart.ctx;
                var chartArea = chart.chartArea;
                if (!chartArea || typeof chartArea.left !== 'number') return;

                ctx.save();
                var dynamicC = getChartColors();
                
                var centerX = (chartArea.left + chartArea.right) / 2;
                var centerY = (chartArea.top + chartArea.bottom) / 2;
                var innerDim = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
                if (!innerDim || isNaN(innerDim) || innerDim <= 0) {
                    ctx.restore();
                    return;
                }

                var fontScale = innerDim / 220;
                if (isNaN(fontScale) || fontScale <= 0) fontScale = 1;
                ctx.textBaseline = "middle";
                
                var totalVal = ((PA.p_land || 0) + (PA.p_const || 0) + (PA.vat_land || 0) + (PA.vat_const || 0) + (PA.kpbt || 0)) / 1e9;
                var textStr = totalVal.toFixed(1) + " Tỷ";
                
                // Draw Subtext (TỔNG GIÁ TRỊ)
                var subFontSize = Math.max(9, Math.round(11 * fontScale));
                ctx.font = "700 " + subFontSize + "px 'Plus Jakarta Sans'";
                ctx.fillStyle = dynamicC.subTextColor;
                var subText = "TỔNG GIÁ TRỊ";
                var subX = Math.round(centerX - (ctx.measureText(subText).width / 2));
                var subY = Math.round(centerY - (innerDim * 0.07));
                ctx.fillText(subText, subX, subY);

                // Draw Main Text (5.2 Tỷ)
                var mainFontSize = Math.max(13, Math.round(20 * fontScale));
                ctx.font = "800 " + mainFontSize + "px 'Plus Jakarta Sans'";
                ctx.fillStyle = dynamicC.textColor;
                var textX = Math.round(centerX - (ctx.measureText(textStr).width / 2));
                var textY = Math.round(centerY + (innerDim * 0.08));
                ctx.fillText(textStr, textX, textY);
                
                ctx.restore();
            } catch (e) {
                console.error("Error in centerTextPlugin:", e);
            }
        }
    };

    activeChartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        plugins: [centerTextPlugin],
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 2.5,
                borderRadius: 4, 
                spacing: 3, 
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
                        font: { family: 'Plus Jakarta Sans', size: 11, weight: '700' },
                        padding: 16,
                        boxWidth: 10,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleFont: { size: 13, family: 'Plus Jakarta Sans', weight: 'bold' },
                    bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
                    padding: 10,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context) {
                            const val = context.raw || 0;
                            return ` ${context.label}: ${(val / 1e9).toFixed(3)} Tỷ VNĐ (${(val / 1e6).toFixed(0)} tr)`;
                        }
                    }
                }
            },
            cutout: '68%',
            layout: { padding: { top: 4, bottom: 20, left: 4, right: 4 } }
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
                    label: 'Vốn tự có trả CĐT',
                    data: khPaysData,
                    backgroundColor: 'rgba(229, 195, 132, 0.35)', // Vàng Cát (Mellow Gold)
                    borderColor: '#D4A855',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    borderSkipped: 'bottom',
                    barPercentage: 0.6,
                    categoryPercentage: 0.75
                },
                {
                    label: 'Ngân hàng giải ngân',
                    data: bankPaysData,
                    backgroundColor: 'rgba(153, 203, 235, 0.35)', // Xanh Da Trời Nhạt (Baby Blue)
                    borderColor: '#66A9D7',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    borderSkipped: 'bottom',
                    barPercentage: 0.6,
                    categoryPercentage: 0.75
                },
                {
                    label: 'Tổng chi phí',
                    data: totalCostData,
                    backgroundColor: 'rgba(158, 215, 198, 0.35)', // Xanh Bạc Hà (Mint Green)
                    borderColor: '#68B8A0',
                    borderWidth: 1.5,
                    borderRadius: 4,
                    borderSkipped: 'bottom',
                    barPercentage: 0.6,
                    categoryPercentage: 0.75
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' }, usePointStyle: true, padding: 15 }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleFont: { size: 14, family: 'Plus Jakarta Sans', weight: 'bold' },
                    bodyFont: { size: 13, family: 'Plus Jakarta Sans' },
                    padding: 12,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} Tỷ VNĐ`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '700' } },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '700' } },
                    grid: { color: C.gridColor, borderDash: [5, 5] },
                    title: { display: true, text: 'Tỷ VNĐ', color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    border: { display: false }
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
    
    const gradLine = ctx.createLinearGradient(0, 0, 0, 400);
    gradLine.addColorStop(0, 'rgba(245,158,11,0.5)');
    gradLine.addColorStop(1, 'rgba(245,158,11,0.0)');

    activeChartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Dư nợ còn lại (Tỷ VNĐ)',
                    data: balanceData,
                    borderColor: '#f59e0b',
                    backgroundColor: gradLine,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#fcd34d',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Lãi KH phải trả/năm (Tr VNĐ)',
                    data: khInterestData,
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 3,
                    yAxisID: 'y1'
                },
                {
                    label: 'CĐT Hỗ trợ lãi (Tr VNĐ)',
                    data: cdtSupportedData,
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' }, usePointStyle: true, padding: 15 }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleFont: { size: 14, family: 'Plus Jakarta Sans', weight: 'bold' },
                    bodyFont: { size: 13, family: 'Plus Jakarta Sans' },
                    padding: 12,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    mode: 'index',
                    intersect: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                x: { 
                    ticks: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '700' } }, 
                    grid: { display: false } 
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: { color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '700' } },
                    title: { display: true, text: 'Dư nợ (Tỷ VNĐ)', color: C.textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    grid: { color: C.gridColor, borderDash: [5, 5] },
                    border: { display: false }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: { color: '#ef4444', font: { family: 'Plus Jakarta Sans', size: 12, weight: '700' } },
                    title: { display: true, text: 'Tiền lãi (Triệu VNĐ)', color: '#ef4444', font: { family: 'Plus Jakarta Sans', size: 12, weight: '800' } },
                    grid: { drawOnChartArea: false },
                    border: { display: false }
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

    const labels = ['Tổng Giá Thực Trả', 'Vốn Tự Có Đợt 1', 'Đơn Giá Đất / m²', 'Tổng % Chiết Khấu', 'Diện Tích Đất (m²)'];

    const maxTotal = Math.max(res1.grandTotal, res2.grandTotal) || 1;
    const maxEquity = Math.max(res1.totalKHtoCDT, res2.totalKHtoCDT) || 1;
    const maxSqm = Math.max(res1.propValue / (res1.dtDat || 1), res2.propValue / (res2.dtDat || 1)) || 1;
    const maxCk = Math.max(res1.ckPct, res2.ckPct) || 1;
    const maxArea = Math.max(res1.dtDat || 50, res2.dtDat || 50) || 1;

    const data1 = [
        Math.round((res1.grandTotal / maxTotal) * 100),
        Math.round((res1.totalKHtoCDT / maxEquity) * 100),
        Math.round(((res1.propValue / (res1.dtDat || 1)) / maxSqm) * 100),
        Math.round((res1.ckPct / maxCk) * 100),
        Math.round(((res1.dtDat || 50) / maxArea) * 100)
    ];

    const data2 = [
        Math.round((res2.grandTotal / maxTotal) * 100),
        Math.round((res2.totalKHtoCDT / maxEquity) * 100),
        Math.round(((res2.propValue / (res2.dtDat || 1)) / maxSqm) * 100),
        Math.round((res2.ckPct / maxCk) * 100),
        Math.round(((res2.dtDat || 50) / maxArea) * 100)
    ];

    const ctx = canvas.getContext('2d');
    activeChartInstances[canvasId] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [
                {
                    label: `Căn A (${res1.macan || 'CĂN A'})`,
                    data: data1,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.3)',
                    pointBackgroundColor: '#f59e0b',
                    borderWidth: 2.5
                },
                {
                    label: `Căn B (${res2.macan || 'CĂN B'})`,
                    data: data2,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56,189,248,0.3)',
                    pointBackgroundColor: '#38bdf8',
                    borderWidth: 2.5
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
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}
