/* =============================================================
   CHÍNH SÁCH BÁN HÀNG & HẰNG SỐ CẤU HÌNH (CONFIG)
   Dự án: Vinhomes Sài Gòn Park
   Áp dụng từ: 11/09/2026 (Ban hành ngày 11/09/2026)
   Nguồn: CSBH V09 Giãn xây (11/09/2026) & V08 Thô/HT (11/09/2026)
   *** CẬP NHẬT CHÍNH SÁCH BAN HÀNH 11/09/2026:
       - Chiết khấu TTS: 7.5%
       - Quà tặng Vàng: ĐÃ KẾT THÚC
       - MỚI: Siêu Quà Tặng Đặc Quyền Sinh Nhật 33 năm VGR (11/09 - 31/10/2026):
         Member: 0.3%, Gold: 0.9%, Platinum: 1.2%, Diamond: 1.5%
       - MỚI: VinClub Thường: Gold 0.3% (0.15% trừ giá + 0.15% VPoint), Platinum 0.4%, Diamond 0.5%
       - HTLS Tiêu Chuẩn: 18T = +3.5%, 24T = +8%, 30T = +13.5%, 36T = +19.5%
   *** KHI CẦN ĐỔI CHÍNH SÁCH / MỨC CK, CHỈ SỬA FILE NÀY ***
   =============================================================*/
var SALES_POLICY = {
    code: 'VSP_CSBH_V09_V08_11092026',
    title: 'CSBH V09 (Giãn xây) & V08 (Thô/HT) - 11/09/2026',
    defaultInterestRate: 13.0, // Lãi suất vay ngân hàng mặc định (%/năm tham khảo)

    /* Chiết khấu vốn tự có – % tính trên Giá trị QSD Đất & Thương Mại (trước VAT, KPBT) */
    ownCapital: {
        earlyPayment: {
            earlyBird: 7.5,   // Mức chuẩn 7.5% áp dụng khi TTS
            standard:  7.5
        },
        normalProgress: 0.0   // Tiến độ thường: 0% (Giá gốc)
    },

    /* Chiết khấu dòng tiền: 11%/năm × số tiền × số ngày / 365 */
    cashFlowDiscountRate: 11.0,

    /* Hỗ trợ lãi suất khi vay ngân hàng */
    interestSupport: {
        roughAndGianXay: [
            { months: 18, priceIncrease: 3.5,  extraDiscount: 0.0, label: 'HTLS 0% trong 18 tháng (+3.5%)' },
            { months: 24, priceIncrease: 8.0,  extraDiscount: 0.0, label: 'HTLS 0% trong 24 tháng (+8.0%)' },
            { months: 30, priceIncrease: 13.5, extraDiscount: 0.0, label: 'HTLS 0% trong 30 tháng (+13.5%)' },
            { months: 36, priceIncrease: 19.5, extraDiscount: 0.0, label: 'HTLS 0% trong 36 tháng (+19.5%)' }
        ],
        finished: [
            { months: 18, priceIncrease: 3.5,  extraDiscount: 0.0, label: 'HTLS 0% trong 18 tháng (+3.5%)' },
            { months: 24, priceIncrease: 8.0,  extraDiscount: 0.0, label: 'HTLS 0% trong 24 tháng (+8.0%)' },
            { months: 30, priceIncrease: 13.5, extraDiscount: 0.0, label: 'HTLS 0% trong 30 tháng (+13.5%)' },
            { months: 36, priceIncrease: 19.5, extraDiscount: 0.0, label: 'HTLS 0% trong 36 tháng (+19.5%)' }
        ]
    },

    /* Khuyến mãi & Quà tặng */
    promotions: {
        earlyMoveIn: 5.0,            // 5% Trừ trực tiếp vào Giá BĐS (5% còn lại nhận hoàn tiền mặt khi về ở sớm)
        aquafield: 20_000_000,       // VNĐ – 500 căn đầu tiên
        goldGift: null,              // ĐÃ KẾT THÚC
        voucher: { maxPercent: 30.0 },
        // Siêu Quà Tặng Đặc Quyền Sinh Nhật 33 năm VGR (11/09 - 31/10/2026)
        vgr33Years: {
            member: 0.3,
            gold: 0.9,
            platinum: 1.2,
            diamond: 1.5
        },
        // Chương trình VinClub thường
        vinClub: {
            gold: { direct: 0.15, vpoint: 0.15 },
            platinum: { direct: 0.20, vpoint: 0.20 },
            diamond: { direct: 0.25, vpoint: 0.25 }
        }
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

function getGoldCountForApt(apt) {
    // Quà tặng Vàng đã KẾT THÚC sau ngày 10/09/2026
    // Hàm giữ lại để tương thích ngược nhưng luôn trả về null/0
    return null;
}
