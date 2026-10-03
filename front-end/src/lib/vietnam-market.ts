/**
 * Vietnamese Market Data & Financial Utilities
 * - Gold prices (SJC, Nhẫn trơn 9999)
 * - Exchange rates (USD/VND, EUR/VND, JPY/VND, etc.)
 * - Vietnamese Mutual Funds & ETFs (Chứng chỉ quỹ mở & ETF Việt Nam: DCDS, VESAF, VEOF, TCBF, DCBF, E1VFVN30, FUEVFVND, VCBF...)
 * - SIP (Systematic Investment Plan) / DCA Investment Calculator
 * - Savings interest calculator
 * - Bank loan / mortgage calculator (Dư nợ giảm dần vs Dư nợ ban đầu)
 * - Vietnamese Lunar Calendar / Tết & Salary Countdown
 */

export interface GoldPriceItem {
  type: string;
  buyPrice: number; // VND per tael (lượng)
  sellPrice: number; // VND per tael
  change: number;
  unit: string;
  updateTime: string;
}

export interface FxRateItem {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  buyCash: number;
  buyTransfer: number;
  sell: number;
  change: number;
}

export interface FundItem {
  code: string;
  name: string;
  company: string;
  category: 'stock' | 'bond' | 'balanced' | 'etf';
  categoryName: string;
  riskLevel: 'Thấp' | 'Trung bình' | 'Cao' | 'Rất cao';
  nav: number; // VND per share
  navChange: number; // % latest period
  return1M: number; // %
  return6M: number; // %
  return1Y: number; // %
  return3Y: number; // %
  managementFee: string;
  minInvestment: number;
  description: string;
  topHoldings: string[];
}

export const LIVE_GOLD_RATES: GoldPriceItem[] = [
  {
    type: 'Vàng SJC 1L - 10L (Toàn quốc)',
    buyPrice: 82500000,
    sellPrice: 84500000,
    change: +500000,
    unit: 'VNĐ / Lượng (Cây)',
    updateTime: 'Hôm nay'
  },
  {
    type: 'Vàng Nhẫn Trơn 9999 PNJ / DOJI',
    buyPrice: 82000000,
    sellPrice: 83600000,
    change: +300000,
    unit: 'VNĐ / Lượng (Cây)',
    updateTime: 'Hôm nay'
  },
  {
    type: 'Vàng Nhẫn Tròn Trơn SJC 99.99%',
    buyPrice: 81800000,
    sellPrice: 83300000,
    change: +200000,
    unit: 'VNĐ / Lượng (Cây)',
    updateTime: 'Hôm nay'
  },
  {
    type: 'Vàng Thế giới (Quy đổi)',
    buyPrice: 79500000,
    sellPrice: 80200000,
    change: +450000,
    unit: 'VNĐ / Lượng',
    updateTime: 'Hôm nay'
  }
];

export const LIVE_FX_RATES: FxRateItem[] = [
  { code: 'USD', name: 'Đô la Mỹ', symbol: '$', flag: '🇺🇸', buyCash: 25150, buyTransfer: 25180, sell: 25490, change: +20 },
  { code: 'EUR', name: 'Đồng Euro', symbol: '€', flag: '🇪🇺', buyCash: 27150, buyTransfer: 27280, sell: 28550, change: -45 },
  { code: 'JPY', name: 'Yên Nhật', symbol: '¥', flag: '🇯🇵', buyCash: 165.2, buyTransfer: 166.8, sell: 174.5, change: +0.8 },
  { code: 'GBP', name: 'Bảng Anh', symbol: '£', flag: '🇬🇧', buyCash: 32450, buyTransfer: 32650, sell: 33800, change: +60 },
  { code: 'CNY', name: 'Nhân dân tệ', symbol: '¥', flag: '🇨🇳', buyCash: 3510, buyTransfer: 3540, sell: 3660, change: +5 },
  { code: 'KRW', name: 'Won Hàn Quốc', symbol: '₩', flag: '🇰🇷', buyCash: 17.5, buyTransfer: 18.2, sell: 19.8, change: -0.1 },
  { code: 'SGD', name: 'Đô la Singapore', symbol: 'S$', flag: '🇸🇬', buyCash: 19120, buyTransfer: 19250, sell: 19950, change: +15 },
  { code: 'AUD', name: 'Đô la Úc', symbol: 'A$', flag: '🇦🇺', buyCash: 16800, buyTransfer: 16920, sell: 17550, change: -10 },
  { code: 'CAD', name: 'Đô la Canada', symbol: 'C$', flag: '🇨🇦', buyCash: 18350, buyTransfer: 18480, sell: 19150, change: +8 },
  { code: 'THB', name: 'Baht Thái Lan', symbol: '฿', flag: '🇹🇭', buyCash: 730, buyTransfer: 750, sell: 820, change: +2 }
];

export const VIETNAM_OPEN_FUNDS: FundItem[] = [
  // 1. Quỹ Cổ Phiếu Tăng Trưởng
  {
    code: 'DCDS',
    name: 'Quỹ Đầu tư Chứng khoán Năng động DC',
    company: 'Dragon Capital',
    category: 'stock',
    categoryName: 'Cổ phiếu',
    riskLevel: 'Cao',
    nav: 78540,
    navChange: +0.65,
    return1M: +2.8,
    return6M: +14.2,
    return1Y: +24.8,
    return3Y: +48.6,
    managementFee: '1.85%/năm',
    minInvestment: 100000,
    description: 'Đầu tư tập trung vào các cổ phiếu hàng đầu có tiềm năng tăng trưởng vượt trội trên sàn HOSE/HNX.',
    topHoldings: ['FPT (14.2%)', 'MWG (9.8%)', 'MBB (8.5%)', 'TCB (7.9%)', 'ACB (6.4%)']
  },
  {
    code: 'VESAF',
    name: 'Quỹ Đầu tư Cổ phiếu Tiếp cận Thị trường VN',
    company: 'VinaCapital',
    category: 'stock',
    categoryName: 'Cổ phiếu',
    riskLevel: 'Cao',
    nav: 31420,
    navChange: +0.82,
    return1M: +3.2,
    return6M: +16.5,
    return1Y: +28.5,
    return3Y: +56.2,
    managementFee: '1.95%/năm',
    minInvestment: 100000,
    description: 'Chiến lược tìm kiếm các doanh nghiệp có lợi thế cạnh tranh bền vững, định giá hấp dẫn và room ngoại cao.',
    topHoldings: ['FPT (15.1%)', 'MBB (9.2%)', 'VND (7.8%)', 'PNJ (6.9%)', 'KDH (6.2%)']
  },
  {
    code: 'VEOF',
    name: 'Quỹ Đầu tư Cổ phiếu Hưng Thịnh VinaCapital',
    company: 'VinaCapital',
    category: 'stock',
    categoryName: 'Cổ phiếu',
    riskLevel: 'Cao',
    nav: 26350,
    navChange: +0.45,
    return1M: +2.1,
    return6M: +12.8,
    return1Y: +22.1,
    return3Y: +42.5,
    managementFee: '1.80%/năm',
    minInvestment: 100000,
    description: 'Đầu tư các doanh nghiệp đầu ngành vốn hóa lớn (Large-cap) có cổ tức tiền mặt đều đặn và tài chính vững mạnh.',
    topHoldings: ['VCB (11.5%)', 'FPT (10.8%)', 'HPG (9.1%)', 'VHM (8.3%)', 'GAS (7.5%)']
  },
  {
    code: 'VCBF-BCF',
    name: 'Quỹ Đầu tư Cổ phiếu Hàng đầu VCBF',
    company: 'VCBF (Vietcombank Fund)',
    category: 'stock',
    categoryName: 'Cổ phiếu',
    riskLevel: 'Cao',
    nav: 30850,
    navChange: +0.55,
    return1M: +2.4,
    return6M: +13.1,
    return1Y: +21.4,
    return3Y: +39.8,
    managementFee: '1.75%/năm',
    minInvestment: 100000,
    description: 'Kết hợp triết lý đầu tư giá trị và tăng trưởng của Vietcombank và Franklin Templeton Investments.',
    topHoldings: ['FPT (13.5%)', 'ACB (8.9%)', 'MWG (8.2%)', 'VNM (7.6%)', 'VRE (6.1%)']
  },

  // 2. Quỹ ETF Chỉ Số
  {
    code: 'FUEVFVND',
    name: 'Quỹ ETF DCVFMVN DIAMOND',
    company: 'Dragon Capital',
    category: 'etf',
    categoryName: 'ETF',
    riskLevel: 'Cao',
    nav: 32800,
    navChange: +0.72,
    return1M: +3.0,
    return6M: +15.8,
    return1Y: +26.3,
    return3Y: +52.1,
    managementFee: '0.65%/năm',
    minInvestment: 50000,
    description: 'Mô phỏng chỉ số VN Diamond gồm các cổ phiếu đã kín room ngoại tốt nhất thị trường chứng khoán Việt Nam.',
    topHoldings: ['FPT (15.6%)', 'MWG (14.2%)', 'PNJ (11.4%)', 'TCB (9.8%)', 'REE (8.5%)']
  },
  {
    code: 'E1VFVN30',
    name: 'Quỹ ETF DCVFMVN30',
    company: 'Dragon Capital',
    category: 'etf',
    categoryName: 'ETF',
    riskLevel: 'Cao',
    nav: 24150,
    navChange: +0.38,
    return1M: +1.9,
    return6M: +10.5,
    return1Y: +17.5,
    return3Y: +31.2,
    managementFee: '0.55%/năm',
    minInvestment: 50000,
    description: 'Mô phỏng rổ chỉ số VN30 đại diện cho 30 doanh nghiệp vốn hóa lớn và thanh khoản cao nhất thị trường.',
    topHoldings: ['VCB (8.2%)', 'FPT (7.9%)', 'HPG (7.5%)', 'VIC (6.8%)', 'TCB (6.5%)']
  },
  {
    code: 'SSIAM-VNX50',
    name: 'Quỹ ETF SSIAM VNX50',
    company: 'SSIAM',
    category: 'etf',
    categoryName: 'ETF',
    riskLevel: 'Cao',
    nav: 22680,
    navChange: +0.42,
    return1M: +2.0,
    return6M: +11.2,
    return1Y: +18.9,
    return3Y: +34.5,
    managementFee: '0.60%/năm',
    minInvestment: 50000,
    description: 'Mô phỏng rổ chỉ số VNX50 gồm 50 cổ phiếu hàng đầu trên cả 2 sàn HOSE và HNX.',
    topHoldings: ['FPT (9.1%)', 'MBB (7.8%)', 'ACB (7.2%)', 'MWG (6.9%)', 'VHM (6.5%)']
  },

  // 3. Quỹ Trái Phiếu & Thu Nhập Cố Định (An Toàn)
  {
    code: 'TCBF',
    name: 'Quỹ Đầu tư Trái phiếu Techcom',
    company: 'Techcom Capital',
    category: 'bond',
    categoryName: 'Trái phiếu',
    riskLevel: 'Thấp',
    nav: 16850,
    navChange: +0.06,
    return1M: +0.68,
    return6M: +4.1,
    return1Y: +8.2,
    return3Y: +26.4,
    managementFee: '1.00%/năm',
    minInvestment: 10000,
    description: 'Đầu tư vào trái phiếu doanh nghiệp niêm yết chất lượng cao, tiền gửi có kỳ hạn và chứng chỉ tiền gửi ngân hàng.',
    topHoldings: ['Trái phiếu Masan', 'Trái phiếu Vingroup', 'Tiền gửi Techcombank', 'Trái phiếu Gelex']
  },
  {
    code: 'DCBF',
    name: 'Quỹ Đầu tư Trái phiếu DC',
    company: 'Dragon Capital',
    category: 'bond',
    categoryName: 'Trái phiếu',
    riskLevel: 'Thấp',
    nav: 28420,
    navChange: +0.07,
    return1M: +0.71,
    return6M: +4.3,
    return1Y: +8.5,
    return3Y: +27.8,
    managementFee: '0.95%/năm',
    minInvestment: 100000,
    description: 'Tối ưu hóa lợi nhuận ổn định với rủi ro kiểm soát thông qua trái phiếu chính phủ và trái phiếu tổ chức tín dụng.',
    topHoldings: ['Trái phiếu BIDV', 'Trái phiếu VietinBank', 'Chứng chỉ tiền gửi MBB', 'Trái phiếu EVN']
  },
  {
    code: 'SSIBF',
    name: 'Quỹ Đầu tư Trái phiếu SSI',
    company: 'SSIAM',
    category: 'bond',
    categoryName: 'Trái phiếu',
    riskLevel: 'Thấp',
    nav: 15680,
    navChange: +0.05,
    return1M: +0.65,
    return6M: +3.9,
    return1Y: +8.1,
    return3Y: +25.9,
    managementFee: '0.90%/năm',
    minInvestment: 50000,
    description: 'Đầu tư an toàn với dòng thu nhập cố định đều đặn hàng quý từ các định chế tài chính uy tín.',
    topHoldings: ['Trái phiếu Agribank', 'Trái phiếu Vietcombank', 'Trái phiếu HDBank']
  },

  // 4. Quỹ Cân Bằng (Tối Ưu Rủi Ro & Lợi Nhuận)
  {
    code: 'VCBF-TBF',
    name: 'Quỹ Đầu tư Cân bằng Chiến lược VCBF',
    company: 'VCBF',
    category: 'balanced',
    categoryName: 'Cân bằng',
    riskLevel: 'Trung bình',
    nav: 27950,
    navChange: +0.32,
    return1M: +1.6,
    return6M: +8.9,
    return1Y: +14.6,
    return3Y: +33.2,
    managementFee: '1.50%/năm',
    minInvestment: 100000,
    description: 'Phân bổ 50% Cổ phiếu tăng trưởng + 50% Trái phiếu an toàn nhằm giảm thiểu độ biến động khi thị trường sụt giảm.',
    topHoldings: ['FPT (6.8%)', 'ACB (4.9%)', 'Trái phiếu BIDV (18.5%)', 'Tiền gửi VCB (15.2%)']
  },
  {
    code: 'VIBF',
    name: 'Quỹ Đầu tư Cân bằng Tuệ sáng VinaCapital',
    company: 'VinaCapital',
    category: 'balanced',
    categoryName: 'Cân bằng',
    riskLevel: 'Trung bình',
    nav: 14280,
    navChange: +0.35,
    return1M: +1.7,
    return6M: +9.4,
    return1Y: +15.2,
    return3Y: +35.1,
    managementFee: '1.55%/năm',
    minInvestment: 100000,
    description: 'Phân bổ linh hoạt giữa cổ phiếu chiết khấu sâu và trái phiếu sinh lời ổn định theo chu kỳ kinh tế.',
    topHoldings: ['FPT (7.2%)', 'MBB (5.1%)', 'Trái phiếu VietinBank (20.1%)', 'Tiền gửi VPBank (12.4%)']
  }
];

/**
 * SIP (Systematic Investment Plan) / DCA Investment Calculator
 */
export interface SipCalculationResult {
  monthlyAmount: number;
  expectedReturnRate: number; // %/year (e.g. 12%)
  years: number;
  totalInvested: number;
  totalInterest: number;
  finalValue: number;
  yearlyBreakdown: {
    year: number;
    invested: number;
    interestEarned: number;
    totalValue: number;
  }[];
}

export function calculateSipPlan(params: {
  monthlyAmount: number;
  expectedReturnRate: number;
  years: number;
  initialAmount?: number;
}): SipCalculationResult {
  const { monthlyAmount, expectedReturnRate, years, initialAmount = 0 } = params;
  const monthlyRate = (expectedReturnRate / 100) / 12;
  const totalMonths = years * 12;

  let currentTotal = initialAmount;
  let totalInvested = initialAmount;

  const yearlyBreakdown: SipCalculationResult['yearlyBreakdown'] = [];

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      currentTotal = (currentTotal + monthlyAmount) * (1 + monthlyRate);
      totalInvested += monthlyAmount;
    }
    const interestEarned = Math.max(0, currentTotal - totalInvested);
    yearlyBreakdown.push({
      year: y,
      invested: Math.round(totalInvested),
      interestEarned: Math.round(interestEarned),
      totalValue: Math.round(currentTotal)
    });
  }

  const finalValue = Math.round(currentTotal);
  const totalInterest = Math.round(finalValue - totalInvested);

  return {
    monthlyAmount,
    expectedReturnRate,
    years,
    totalInvested: Math.round(totalInvested),
    totalInterest,
    finalValue,
    yearlyBreakdown
  };
}

/**
 * Bank Savings Interest Rate Calculator
 */
export interface SavingsCalculationResult {
  principal: number;
  interestRate: number; // %/year
  months: number;
  type: 'end_term' | 'monthly' | 'compound';
  totalInterest: number;
  finalAmount: number;
  monthlyInterest: number;
}

export function calculateSavingsInterest(params: {
  principal: number;
  interestRate: number; // %/year (e.g. 5.5)
  months: number;
  type: 'end_term' | 'monthly' | 'compound';
}): SavingsCalculationResult {
  const { principal, interestRate, months, type } = params;
  const ratePerMonth = (interestRate / 100) / 12;

  let totalInterest = 0;
  let finalAmount = principal;
  let monthlyInterest = 0;

  if (type === 'end_term') {
    totalInterest = principal * (interestRate / 100) * (months / 12);
    finalAmount = principal + totalInterest;
    monthlyInterest = totalInterest / months;
  } else if (type === 'monthly') {
    monthlyInterest = principal * ratePerMonth;
    totalInterest = monthlyInterest * months;
    finalAmount = principal + totalInterest;
  } else if (type === 'compound') {
    finalAmount = principal * Math.pow(1 + ratePerMonth, months);
    totalInterest = finalAmount - principal;
    monthlyInterest = totalInterest / months;
  }

  return {
    principal,
    interestRate,
    months,
    type,
    totalInterest: Math.round(totalInterest),
    finalAmount: Math.round(finalAmount),
    monthlyInterest: Math.round(monthlyInterest)
  };
}

/**
 * Bank Loan & Mortgage Calculator
 */
export interface LoanScheduleMonth {
  month: number;
  beginningBalance: number;
  principalPayment: number;
  interestPayment: number;
  totalMonthlyPayment: number;
  endingBalance: number;
}

export interface LoanCalculationResult {
  loanAmount: number;
  interestRate: number; // %/year
  termMonths: number;
  method: 'reducing_balance' | 'fixed_principal';
  totalInterest: number;
  totalPayment: number;
  firstMonthPayment: number;
  lastMonthPayment: number;
  schedule: LoanScheduleMonth[];
}

export function calculateLoanSchedule(params: {
  loanAmount: number;
  interestRate: number; // %/year (e.g. 8.5)
  termMonths: number;
  method: 'reducing_balance' | 'fixed_principal';
}): LoanCalculationResult {
  const { loanAmount, interestRate, termMonths, method } = params;
  const monthlyRate = (interestRate / 100) / 12;
  const fixedMonthlyPrincipal = loanAmount / termMonths;

  const schedule: LoanScheduleMonth[] = [];
  let currentBalance = loanAmount;
  let totalInterest = 0;

  if (method === 'reducing_balance') {
    for (let m = 1; m <= termMonths; m++) {
      const interest = currentBalance * monthlyRate;
      const principal = fixedMonthlyPrincipal;
      const total = principal + interest;
      const endBal = Math.max(0, currentBalance - principal);

      schedule.push({
        month: m,
        beginningBalance: Math.round(currentBalance),
        principalPayment: Math.round(principal),
        interestPayment: Math.round(interest),
        totalMonthlyPayment: Math.round(total),
        endingBalance: Math.round(endBal)
      });

      totalInterest += interest;
      currentBalance = endBal;
    }
  } else {
    const fixedMonthlyInterest = loanAmount * monthlyRate;
    for (let m = 1; m <= termMonths; m++) {
      const principal = fixedMonthlyPrincipal;
      const interest = fixedMonthlyInterest;
      const total = principal + interest;
      const endBal = Math.max(0, currentBalance - principal);

      schedule.push({
        month: m,
        beginningBalance: Math.round(currentBalance),
        principalPayment: Math.round(principal),
        interestPayment: Math.round(interest),
        totalMonthlyPayment: Math.round(total),
        endingBalance: Math.round(endBal)
      });

      totalInterest += interest;
      currentBalance = endBal;
    }
  }

  return {
    loanAmount,
    interestRate,
    termMonths,
    method,
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(loanAmount + totalInterest),
    firstMonthPayment: schedule[0]?.totalMonthlyPayment || 0,
    lastMonthPayment: schedule[schedule.length - 1]?.totalMonthlyPayment || 0,
    schedule
  };
}

/**
 * Vietnamese Salary & Holiday Countdown calculations
 */
export function getUpcomingFinancialEvents(salaryDay: number = 5) {
  const now = new Date();
  
  let nextSalary = new Date(now.getFullYear(), now.getMonth(), salaryDay);
  if (now.getDate() >= salaryDay) {
    nextSalary = new Date(now.getFullYear(), now.getMonth() + 1, salaryDay);
  }
  const diffTimeSalary = nextSalary.getTime() - now.getTime();
  const daysToSalary = Math.max(0, Math.ceil(diffTimeSalary / (1000 * 60 * 60 * 24)));

  const tetDate = new Date(2027, 1, 6);
  const diffTimeTet = tetDate.getTime() - now.getTime();
  const daysToTet = Math.max(0, Math.ceil(diffTimeTet / (1000 * 60 * 60 * 24)));

  return {
    daysToSalary,
    nextSalaryDate: nextSalary.toLocaleDateString('vi-VN'),
    daysToTet,
    tetDate: tetDate.toLocaleDateString('vi-VN')
  };
}
