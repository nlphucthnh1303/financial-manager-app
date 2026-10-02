/**
 * Financial Frameworks & Health Scoring for Vietnamese Users
 * - 6 Chiếc Hũ (JARS System)
 * - Quy tắc 50/30/20 (Needs / Wants / Savings)
 * - Điểm Sức Khỏe Tài Chính (Financial Health Score)
 * - Danh mục Chi tiêu chuẩn Việt Nam
 */

export interface JarCategory {
  id: string;
  name: string;
  code: string;
  percentage: number;
  description: string;
  icon: string;
  color: string;
  badgeBg: string;
  examples: string[];
}

export const SIX_JARS: JarCategory[] = [
  {
    id: 'nec',
    code: 'NEC',
    name: 'Chi tiêu Thiết yếu',
    percentage: 55,
    description: 'Chi phí sinh hoạt bắt buộc không thể thiếu hàng ngày.',
    icon: '🏠',
    color: '#0284c7',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    examples: ['Tiền thuê nhà / thế chấp', 'Ăn uống, đi chợ, siêu thị', 'Tiền điện EVN, nước, internet', 'Xăng xe, gửi xe, bảo hiểm y tế']
  },
  {
    id: 'ltss',
    code: 'LTSS',
    name: 'Tiết kiệm Dài hạn',
    percentage: 10,
    description: 'Dành cho các mục tiêu tương lai lớn và quỹ dự phòng rủi ro.',
    icon: '🎯',
    color: '#10b981',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    examples: ['Mua nhà, mua đất', 'Mua ô tô, xe máy mới', 'Quỹ dự phòng khẩn cấp 6 tháng', 'Cưới hỏi, sinh con']
  },
  {
    id: 'edu',
    code: 'EDU',
    name: 'Giáo dục & Phát triển',
    percentage: 10,
    description: 'Đầu tư vào bản thân là khoản đầu tư sinh lời cao nhất.',
    icon: '📚',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    examples: ['Sách phát triển bản thân / tài chính', 'Khóa học chứng chỉ, ngoại ngữ', 'Học phí đại học / cao học', 'Tham gia hội thảo, workshop']
  },
  {
    id: 'play',
    code: 'PLAY',
    name: 'Hưởng thụ & Giải trí',
    percentage: 10,
    description: 'Tự thưởng để tạo động lực tiếp tục làm việc và kiếm tiền.',
    icon: '🍿',
    color: '#ec4899',
    badgeBg: 'bg-pink-50 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300',
    examples: ['Du lịch nghỉ dưỡng, vé máy bay', 'Ăn tối sang trọng cuối tuần', 'Xem phim, hòa nhạc', 'Mua sắm thời trang sở thích']
  },
  {
    id: 'ffa',
    code: 'FFA',
    name: 'Tự do Tài chính & Đầu tư',
    percentage: 10,
    description: 'Tiền đẻ ra tiền, xây dựng nguồn thu nhập thụ động.',
    icon: '📈',
    color: '#f59e0b',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    examples: ['Mua vàng SJC, vàng nhẫn 9999', 'Đầu tư chứng khoán, quỹ mở', 'Góp vốn kinh doanh, bất động sản', 'Gửi tiết kiệm ngân hàng lấy lãi']
  },
  {
    id: 'give',
    code: 'GIVE',
    name: 'Cho đi & Hiếu hỉ',
    percentage: 5,
    description: 'Báo hiếu cha mẹ, xây dựng mối quan hệ và chia sẻ cộng đồng.',
    icon: '❤️',
    color: '#ef4444',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
    examples: ['Biếu tiền bố mẹ định kỳ', 'Tiền mừng cưới hỏi, thôi nôi', 'Quà sinh nhật bạn bè, đối tác', 'Lì xì Tết họ hàng, từ thiện']
  }
];

export interface Rule503020 {
  needs: { percentage: 50; label: string; color: string; desc: string };
  wants: { percentage: 30; label: string; color: string; desc: string };
  savings: { percentage: 20; label: string; color: string; desc: string };
}

export const RULE_50_30_20 = {
  needs: {
    percentage: 50,
    label: 'Nhu cầu Thiết yếu (50%)',
    color: '#0284c7',
    desc: 'Ăn uống, thuê nhà, điện nước, xăng xe, y tế...'
  },
  wants: {
    percentage: 30,
    label: 'Mong muốn & Sở thích (30%)',
    color: '#ec4899',
    desc: 'Cà phê, mua sắm, du lịch, xem phim, giải trí...'
  },
  savings: {
    percentage: 20,
    label: 'Tiết kiệm & Đầu tư (20%)',
    color: '#10b981',
    desc: 'Tích lũy mua nhà, quỹ khẩn cấp, mua vàng, chứng khoán...'
  }
};

/**
 * Standard Vietnamese Category Presets for one-click setup
 */
export const VIETNAMESE_STANDARD_CATEGORIES = [
  // Expense Categories
  { name: 'Ăn uống & Cà phê', icon: '🍜', color: '#f59e0b', type: 'Expense' as const, jar: 'NEC', sub: ['Cà phê & Trà sữa', 'Ăn sáng & Ăn trưa', 'Đi chợ & Siêu thị', 'Ăn tối & Nhậu nhẹt'] },
  { name: 'Nhà cửa & Tiện ích', icon: '🏠', color: '#0284c7', type: 'Expense' as const, jar: 'NEC', sub: ['Tiền thuê nhà', 'Tiền điện EVN', 'Tiền nước sinh hoạt', 'Internet & Điện thoại', 'Phí dịch vụ chung cư'] },
  { name: 'Đi lại & Phương tiện', icon: '🚗', color: '#6366f1', type: 'Expense' as const, jar: 'NEC', sub: ['Xăng xe', 'Grab / Taxi / Xe bus', 'Gửi xe & Phí cầu đường', 'Bảo dưỡng & Sửa xe'] },
  { name: 'Mua sắm & Tiêu dùng', icon: '🛒', color: '#ec4899', type: 'Expense' as const, jar: 'PLAY', sub: ['Quần áo & Phụ kiện', 'Đồ công nghệ / Điện máy', 'Mỹ phẩm & Chăm sóc da', 'Đồ gia dụng'] },
  { name: 'Hiếu hỉ & Quan hệ', icon: '🎁', color: '#ef4444', type: 'Expense' as const, jar: 'GIVE', sub: ['Mừng cưới / Sinh nhật', 'Biếu bố mẹ gia đình', 'Lì xì Tết & Quà biếu', 'Thôi nôi & Đầy tháng'] },
  { name: 'Sức khỏe & Y tế', icon: '💊', color: '#10b981', type: 'Expense' as const, jar: 'NEC', sub: ['Thuốc men & Khám bệnh', 'Bảo hiểm y tế / Nhân thọ', 'Tập Gym / Thể thao', 'Thực phẩm chức năng'] },
  { name: 'Học tập & Phát triển', icon: '📚', color: '#8b5cf6', type: 'Expense' as const, jar: 'EDU', sub: ['Sách vở & Tài liệu', 'Khóa học & Chứng chỉ', 'Học phí & Luyện thi'] },
  { name: 'Giải trí & Hưởng thụ', icon: '🎬', color: '#06b6d4', type: 'Expense' as const, jar: 'PLAY', sub: ['Du lịch & Nghỉ dưỡng', 'Xem phim & Xem nhạc', 'Netflix / Spotify / Game', 'Spa & Thư giãn'] },
  { name: 'Đầu tư & Tiết kiệm', icon: '📈', color: '#84cc16', type: 'Expense' as const, jar: 'FFA', sub: ['Mua vàng SJC / 9999', 'Đầu tư chứng khoán', 'Gửi tiết kiệm có kỳ hạn', 'Bất động sản'] },
  
  // Revenue Categories
  { name: 'Lương & Thu nhập chính', icon: '💼', color: '#10b981', type: 'Revenue' as const, sub: ['Lương tháng', 'Thưởng tháng 13 & Tết', 'Thưởng hiệu quả / KPI'] },
  { name: 'Nghề tay trái & Freelance', icon: '💻', color: '#0ea5e9', type: 'Revenue' as const, sub: ['Làm thêm ngoài giờ', 'Bán hàng online', 'Tư vấn / Dịch vụ'] },
  { name: 'Lợi nhuận Đầu tư & Tiền lãi', icon: '💰', color: '#f59e0b', type: 'Revenue' as const, sub: ['Lãi tiền gửi tiết kiệm', 'Cổ tức chứng khoán', 'Lợi nhuận bán vàng / BĐS', 'Tiền cho thuê nhà'] },
  { name: 'Thu nhập khác', icon: '🎁', color: '#8b5cf6', type: 'Revenue' as const, sub: ['Quà biếu / Tiền mừng', 'Hoàn tiền thẻ tín dụng', 'Thu nợ người khác'] }
];

export interface FinancialHealthEvaluation {
  score: number; // 0 - 100
  rating: 'Tuyệt vời' | 'Tốt' | 'Khá' | 'Cần chú ý' | 'Báo động';
  color: string;
  summary: string;
  insights: {
    title: string;
    description: string;
    type: 'success' | 'warning' | 'info' | 'danger';
  }[];
  metrics: {
    savingsRate: number; // %
    debtRatio: number; // %
    emergencyFundMonths: number;
    budgetAdherence: number; // %
  };
}

/**
 * Calculate Financial Health Score for the user based on Vietnamese economic benchmarks
 */
export function calculateFinancialHealth(params: {
  monthlyIncome: number;
  monthlyExpense: number;
  totalNetWorth: number;
  totalDebts: number;
  budgetStatusCount: { within: number; warning: number; overspent: number };
}): FinancialHealthEvaluation {
  const { monthlyIncome, monthlyExpense, totalNetWorth, totalDebts, budgetStatusCount } = params;

  let score = 50; // base score
  const insights: FinancialHealthEvaluation['insights'] = [];

  // 1. Savings Rate Metric (Max 25 pts)
  const savings = Math.max(0, monthlyIncome - monthlyExpense);
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

  if (savingsRate >= 30) {
    score += 25;
    insights.push({
      title: 'Tỷ lệ tiết kiệm xuất sắc (>30%)',
      description: `Bạn đang giữ lại được ${savingsRate.toFixed(0)}% thu nhập mỗi tháng, vượt mức khuyến nghị 20% của chuyên gia tài chính.`,
      type: 'success'
    });
  } else if (savingsRate >= 20) {
    score += 20;
    insights.push({
      title: 'Tỷ lệ tiết kiệm đạt chuẩn (20-30%)',
      description: `Bạn tiết kiệm được ${savingsRate.toFixed(0)}% thu nhập. Hãy duy trì đều đặn để sớm đạt tự do tài chính.`,
      type: 'success'
    });
  } else if (savingsRate >= 10) {
    score += 10;
    insights.push({
      title: 'Tỷ lệ tiết kiệm ở mức khá (10-20%)',
      description: `Bạn tiết kiệm được ${savingsRate.toFixed(0)}% thu nhập. Hãy thử cắt giảm thêm 5-10% chi phí không cần thiết để tăng tích lũy.`,
      type: 'info'
    });
  } else if (monthlyIncome > 0 && savingsRate < 10 && savingsRate >= 0) {
    score += 2;
    insights.push({
      title: 'Tỷ lệ tiết kiệm còn thấp (<10%)',
      description: 'Số tiền tiết kiệm mỗi tháng còn mỏng. Bạn dễ gặp rủi ro nếu có sự cố đột xuất xảy ra.',
      type: 'warning'
    });
  } else if (monthlyIncome > 0 && monthlyExpense > monthlyIncome) {
    score -= 20;
    insights.push({
      title: 'Chi tiêu vượt quá thu nhập (Bội chi)',
      description: `Tháng này bạn đã chi nhiều hơn thu ${Math.abs(monthlyIncome - monthlyExpense).toLocaleString('vi-VN')} đ. Cần rà soát ngay các khoản chi phát sinh!`,
      type: 'danger'
    });
  }

  // 2. Emergency Fund Cushion (Max 20 pts)
  const avgMonthlyBurn = monthlyExpense > 0 ? monthlyExpense : 10000000;
  const emergencyFundMonths = totalNetWorth / avgMonthlyBurn;

  if (emergencyFundMonths >= 6) {
    score += 20;
    insights.push({
      title: 'Quỹ dự phòng an toàn (>6 tháng)',
      description: `Tài sản hiện tại đủ duy trì cuộc sống của bạn trong ${emergencyFundMonths.toFixed(1)} tháng nếu mất nguồn thu nhập.`,
      type: 'success'
    });
  } else if (emergencyFundMonths >= 3) {
    score += 12;
    insights.push({
      title: 'Quỹ dự phòng tạm ổn (3-6 tháng)',
      description: `Tài sản của bạn duy trì được ${emergencyFundMonths.toFixed(1)} tháng. Hãy phấn đấu nâng lên mức 6 tháng chi phí.`,
      type: 'info'
    });
  } else {
    score -= 5;
    insights.push({
      title: 'Quỹ dự phòng còn mỏng (<3 tháng)',
      description: 'Bạn nên ưu tiên tích lũy tối thiểu 3 tháng tiền sinh hoạt vào tài khoản tiết kiệm linh hoạt.',
      type: 'warning'
    });
  }

  // 3. Debt to Income Ratio (Max 15 pts)
  const debtRatio = monthlyIncome > 0 ? (totalDebts / (monthlyIncome * 12)) * 100 : 0;
  if (totalDebts === 0) {
    score += 15;
    insights.push({
      title: 'Không có nợ nần',
      description: 'Bạn không chịu áp lực trả nợ hoặc lãi vay hàng tháng. Rất tuyệt vời!',
      type: 'success'
    });
  } else if (debtRatio < 30) {
    score += 10;
    insights.push({
      title: 'Mức nợ trong tầm kiểm soát (<30%)',
      description: 'Tỷ lệ nợ trên thu nhập ở ngưỡng an toàn, không ảnh hưởng lớn đến thanh khoản.',
      type: 'info'
    });
  } else {
    score -= 10;
    insights.push({
      title: 'Áp lực nợ khá cao (>30%)',
      description: 'Hãy ưu tiên dùng phương pháp quả cầu tuyết (Snowball) hoặc lãi suất cao nhất (Avalanche) để tất toán nợ sớm.',
      type: 'warning'
    });
  }

  // 4. Budget Adherence (Max 15 pts)
  const totalBudgets = budgetStatusCount.within + budgetStatusCount.warning + budgetStatusCount.overspent;
  let budgetAdherence = 100;
  if (totalBudgets > 0) {
    budgetAdherence = (budgetStatusCount.within / totalBudgets) * 100;
    if (budgetStatusCount.overspent > 0) {
      score -= 10;
      insights.push({
        title: `Có ${budgetStatusCount.overspent} ngân sách bị vượt hạn mức`,
        description: 'Bạn đang chi tiêu vượt kế hoạch ở một số danh mục. Hãy kiểm tra lại mục tiêu ngân sách.',
        type: 'warning'
      });
    } else {
      score += 15;
      insights.push({
        title: 'Tuân thủ ngân sách tốt',
        description: 'Tất cả các danh mục chi tiêu đều đang nằm trong hạn mức cho phép.',
        type: 'success'
      });
    }
  }

  // Clamp final score between 10 and 100
  const finalScore = Math.min(100, Math.max(10, score));

  let rating: FinancialHealthEvaluation['rating'] = 'Khá';
  let color = '#f59e0b';
  let summary = 'Sức khỏe tài chính của bạn đang ở mức trung bình khá, cần tối ưu thêm một số điểm.';

  if (finalScore >= 85) {
    rating = 'Tuyệt vời';
    color = '#10b981';
    summary = 'Tình hình tài chính của bạn cực kỳ vững mạnh, kiểm soát chi tiêu và tích lũy xuất sắc!';
  } else if (finalScore >= 70) {
    rating = 'Tốt';
    color = '#0ea5e9';
    summary = 'Bạn đang quản lý tài chính rất tốt, chỉ cần duy trì kỷ luật và đầu tư thông minh.';
  } else if (finalScore >= 50) {
    rating = 'Khá';
    color = '#f59e0b';
    summary = 'Tài chính ổn định nhưng còn tiềm ẩn rủi ro nếu có biến cố đột xuất.';
  } else if (finalScore >= 35) {
    rating = 'Cần chú ý';
    color = '#f97316';
    summary = 'Cần rà soát lại các khoản chi tiêu và cắt giảm ngay những chi phí không cần thiết.';
  } else {
    rating = 'Báo động';
    color = '#ef4444';
    summary = 'Cảnh báo nguy cơ mất cân đối dòng tiền, cần ưu tiên thanh toán nợ và siết chặt ngân sách!';
  }

  return {
    score: finalScore,
    rating,
    color,
    summary,
    insights,
    metrics: {
      savingsRate,
      debtRatio,
      emergencyFundMonths,
      budgetAdherence
    }
  };
}
