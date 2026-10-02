/**
 * Vietnamese Market Data & Financial Utilities
 * - Gold prices (SJC, Nhẫn trơn 9999)
 * - Exchange rates (USD/VND, EUR/VND, JPY/VND, etc.)
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

  if (type === 'compound') {
    // Compound interest (Lãi kép nhập gốc hàng tháng)
    finalAmount = principal * Math.pow(1 + ratePerMonth, months);
    totalInterest = finalAmount - principal;
  } else {
    // Simple interest (Lãi cuối kỳ / hàng tháng)
    totalInterest = principal * (interestRate / 100) * (months / 12);
    finalAmount = principal + totalInterest;
  }

  return {
    principal,
    interestRate,
    months,
    type,
    totalInterest: Math.round(totalInterest),
    finalAmount: Math.round(finalAmount),
    monthlyInterest: Math.round(totalInterest / Math.max(1, months))
  };
}

/**
 * Bank Loan Repayment Schedule Calculator (Dư nợ giảm dần vs Dư nợ ban đầu)
 */
export interface LoanMonthlySchedule {
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
  schedule: LoanMonthlySchedule[];
}

export function calculateLoanSchedule(params: {
  loanAmount: number;
  interestRate: number; // %/year (e.g. 8.5)
  termMonths: number;
  method: 'reducing_balance' | 'fixed_principal';
}): LoanCalculationResult {
  const { loanAmount, interestRate, termMonths, method } = params;
  const monthlyRate = (interestRate / 100) / 12;
  const schedule: LoanMonthlySchedule[] = [];

  let totalInterest = 0;
  let currentBalance = loanAmount;
  const fixedMonthlyPrincipal = loanAmount / termMonths;

  if (method === 'reducing_balance') {
    // Gốc chia đều + Lãi trên dư nợ thực tế giảm dần (Chuẩn phổ biến ngân hàng VN)
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
    // Lãi tính trên dư nợ gốc ban đầu (Phổ biến trong vay tiêu dùng/trả góp thẻ tín dụng)
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
  
  // 1. Next Salary Date Countdown
  let nextSalary = new Date(now.getFullYear(), now.getMonth(), salaryDay);
  if (now.getDate() >= salaryDay) {
    nextSalary = new Date(now.getFullYear(), now.getMonth() + 1, salaryDay);
  }
  const diffTimeSalary = nextSalary.getTime() - now.getTime();
  const daysToSalary = Math.max(0, Math.ceil(diffTimeSalary / (1000 * 60 * 60 * 24)));

  // 2. Tết Nguyên Đán Countdown (Approximated 2027 Lunar New Year - Feb 06, 2027)
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
