/* =============================================================
   CHÍNH SÁCH BÁN HÀNG & HẰNG SỐ CẤU HÌNH (CONFIG)
   Dự án: Vinhomes Sài Gòn Park
   Áp dụng từ: 29/08/2026 (CSBH V08 Mới Nhất - 29/08/2026)
   *** KHI CẦN ĐỔI CHÍNH SÁCH / MỨC CK, CHỈ SỬA FILE NÀY ***
   =============================================================*/
var SALES_POLICY = {
    code: 'VSP_CSBH_CDT_Gian_xay_V08_290826',
    title: 'CSBH V08 (29/08/2026)',

    /* Chiết khấu vốn tự có – % tính trên giá trị BĐS
     * Theo CSBH V08 áp dụng từ 29/08/2026:
     * - Thanh toán sớm 100% (ký đến hết 10/09/2026): 9.0%
     * - Thanh toán sớm 100% (ký sau 10/09/2026): 7.5%
     * - Tiến độ thường: 0.0% (Thanh toán theo Giá Gốc)             */
    ownCapital: {
        earlyPayment: {
            earlyBird: 9.0,   // Từ 29/08/2026 đến hết 10/09/2026: 9.0%
            standard: 7.5     // Sau 10/09/2026: 7.5%
        },
        normalProgress: 0.0   // Thanh toán tiến độ thường: 0% (Giá gốc)
    },

    /* Chiết khấu dòng tiền: 11%/năm × số tiền × số ngày / 365
       Điều kiện: thanh toán trước hạn ≥ 7 ngày                    */
    cashFlowDiscountRate: 11.0,

    /* Hỗ trợ lãi suất khi vay ngân hàng – CSBH V08 (29/08/2026) */
    interestSupport: {
        // Siêu Hỗ Trợ Lãi Suất (đến hết 10/09/2026)
        early: [
            { months: 18, priceIncrease: 0.0, label: 'HTLS 0% trong 18 tháng (+0%)' },
            { months: 24, priceIncrease: 4.5, label: 'HTLS 0% trong 24 tháng (+4.5% giá đất)' },
            { months: 30, priceIncrease: 9.0, label: 'HTLS 0% trong 30 tháng (+9.0% giá đất)' },
            { months: 36, priceIncrease: 14.0, label: 'HTLS 0% trong 36 tháng (+14.0% giá đất)' }
        ],
        // HTLS Tiêu Chuẩn (sau 10/09/2026)
        standard: [
            { months: 18, priceIncrease: 3.5, label: 'HTLS 0% trong 18 tháng (+3.5% giá đất)' },
            { months: 24, priceIncrease: 8.0, label: 'HTLS 0% trong 24 tháng (+8.0% giá đất)' },
            { months: 30, priceIncrease: 13.5, label: 'HTLS 0% trong 30 tháng (+13.5% giá đất)' },
            { months: 36, priceIncrease: 19.5, label: 'HTLS 0% trong 36 tháng (+19.5% giá đất)' }
        ],
        roughAndGianXay: [
            { months: 18, priceIncrease: 0.0, label: 'HTLS 0% trong 18 tháng (+0%)' },
            { months: 24, priceIncrease: 4.5, label: 'HTLS 0% trong 24 tháng (+4.5% giá đất)' },
            { months: 30, priceIncrease: 9.0, label: 'HTLS 0% trong 30 tháng (+9.0% giá đất)' },
            { months: 36, priceIncrease: 14.0, label: 'HTLS 0% trong 36 tháng (+14.0% giá đất)' }
        ],
        finished: [
            { months: 18, priceIncrease: 0.0, label: 'HTLS 0% trong 18 tháng (+0%)' },
            { months: 24, priceIncrease: 4.5, label: 'HTLS 0% trong 24 tháng (+4.5% giá đất)' },
            { months: 30, priceIncrease: 9.0, label: 'HTLS 0% trong 30 tháng (+9.0% giá đất)' },
            { months: 36, priceIncrease: 14.0, label: 'HTLS 0% trong 36 tháng (+14.0% giá đất)' }
        ]
    },

    /* Khuyến mãi & Quà tặng – CSBH V08 (29/08/2026) */
    promotions: {
        earlyMoveIn: 5.0,            // 5% Trừ trực tiếp vào Giá BĐS (5% còn lại nhận hoàn tiền mặt khi về ở sớm)
        aquafield: 20_000_000,       // VNĐ – 500 căn đầu tiên
        goldGift: {                  // Từ 29/08/2026 đến hết 10/09/2026
            under10b:    15_000_000,  // Dưới 10 tỷ -> 1 chỉ (15tr)
            from10to20b: 45_000_000,  // 10 - dưới 20 tỷ -> 3 chỉ (45tr)
            over20b:     75_000_000   // Từ 20 tỷ -> 5 chỉ (75tr)
        },
        voucher: { maxPercent: 30.0 }
    },

    paymentSchedule: {
        deposit: 300_000_000,
        signingContract: 15.0,
        progressPayments: [15.0, 15.0, 15.0, 15.0],
        handover: 25.0,
        maintenanceFee: 2.0,
        finalPayment: 5.0,
        bankEquity: 15.0,
        bankLoan: 70.0
    }
};
