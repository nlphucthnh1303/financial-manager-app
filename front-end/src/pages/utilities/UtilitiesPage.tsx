import React, { useState } from 'react';
import { 
  LIVE_GOLD_RATES, 
  LIVE_FX_RATES, 
  VIETNAM_OPEN_FUNDS,
  calculateSavingsInterest, 
  calculateLoanSchedule, 
  calculateSipPlan,
  getUpcomingFinancialEvents,
  type FundItem
} from '@/lib/vietnam-market';
import { formatCurrency } from '@/lib/utils';
import { MoneyInput } from '@/components/ui/money-input';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Coins, 
  Landmark, 
  Calculator, 
  CalendarClock,
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  ShieldAlert,
  ChevronRight,
  Plus
} from 'lucide-react';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';

export const UtilitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'market' | 'funds' | 'savings' | 'loan' | 'tet'>('funds');

  // Gold Converter state
  const [goldAmount, setGoldAmount] = useState('1');
  const [selectedGoldIdx] = useState(0);

  // FX Converter state
  const [fxAmount, setFxAmount] = useState('100');
  const [selectedFxCode, setSelectedFxCode] = useState('USD');

  // Fund filter & search state
  const [fundSearch, setFundSearch] = useState('');
  const [fundCategoryFilter, setFundCategoryFilter] = useState<'all' | 'stock' | 'bond' | 'balanced' | 'etf'>('all');
  const [fundCompanyFilter, setFundCompanyFilter] = useState('all');
  const [selectedFundForDetail, setSelectedFundForDetail] = useState<FundItem | null>(null);

  // SIP Calculator state
  const [sipMonthlyAmount, setSipMonthlyAmount] = useState('2000000');
  const [sipExpectedReturn, setSipExpectedReturn] = useState('14');
  const [sipYears, setSipYears] = useState('10');
  const [sipInitialAmount, setSipInitialAmount] = useState('10000000');

  // Quick transaction modal for fund buying
  const [showAddTxModal, setShowAddTxModal] = useState(false);

  // Savings Calculator state
  const [savingsPrincipal, setSavingsPrincipal] = useState('100000000');
  const [savingsRate, setSavingsRate] = useState('5.5');
  const [savingsMonths, setSavingsMonths] = useState('12');
  const [savingsType, setSavingsType] = useState<'end_term' | 'monthly' | 'compound'>('end_term');

  // Loan Calculator state
  const [loanAmount, setLoanAmount] = useState('500000000');
  const [loanRate, setLoanRate] = useState('8.5');
  const [loanTerm, setLoanTerm] = useState('36');
  const [loanMethod, setLoanMethod] = useState<'reducing_balance' | 'fixed_principal'>('reducing_balance');

  // Salary countdown config
  const [salaryDay, setSalaryDay] = useState(5);

  const countdowns = getUpcomingFinancialEvents(salaryDay);

  const selectedGold = LIVE_GOLD_RATES[selectedGoldIdx] || LIVE_GOLD_RATES[0];
  const goldValueSell = (Number(goldAmount) || 0) * selectedGold.sellPrice;

  const selectedFx = LIVE_FX_RATES.find(f => f.code === selectedFxCode) || LIVE_FX_RATES[0];
  const fxValueVnd = (Number(fxAmount) || 0) * selectedFx.sell;

  // Filter funds
  const filteredFunds = VIETNAM_OPEN_FUNDS.filter(fund => {
    const matchSearch = fund.code.toLowerCase().includes(fundSearch.toLowerCase()) || 
                        fund.name.toLowerCase().includes(fundSearch.toLowerCase()) ||
                        fund.company.toLowerCase().includes(fundSearch.toLowerCase());
    const matchCat = fundCategoryFilter === 'all' || fund.category === fundCategoryFilter;
    const matchComp = fundCompanyFilter === 'all' || fund.company === fundCompanyFilter;
    return matchSearch && matchCat && matchComp;
  });

  // Unique fund companies for filter dropdown
  const fundCompanies = Array.from(new Set(VIETNAM_OPEN_FUNDS.map(f => f.company)));

  // SIP calculation
  const sipResult = calculateSipPlan({
    monthlyAmount: Number(sipMonthlyAmount) || 0,
    expectedReturnRate: Number(sipExpectedReturn) || 0,
    years: Number(sipYears) || 1,
    initialAmount: Number(sipInitialAmount) || 0
  });

  const savingsResult = calculateSavingsInterest({
    principal: Number(savingsPrincipal) || 0,
    interestRate: Number(savingsRate) || 0,
    months: Number(savingsMonths) || 1,
    type: savingsType
  });

  const loanResult = calculateLoanSchedule({
    loanAmount: Number(loanAmount) || 0,
    interestRate: Number(loanRate) || 0,
    termMonths: Number(loanTerm) || 1,
    method: loanMethod
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Thị trường & Công cụ tài chính
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
            Chứng chỉ quỹ Việt Nam, giá vàng SJC, tỷ giá ngoại tệ, tính lãi tiết kiệm & lịch trả góp
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 bg-[#fafafa] dark:bg-[#111111] shadow-border rounded-md self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('funds')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'funds' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Chứng chỉ quỹ (CCQ)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('market')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'market' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
          >
            <Coins className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Giá vàng & Tỷ giá</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('savings')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'savings' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
          >
            <Landmark className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Tính lãi tiết kiệm</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loan')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'loan' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
          >
            <Calculator className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Tính vay trả góp</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tet')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'tet' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
          >
            <CalendarClock className="w-3.5 h-3.5 text-[#ff5b4f]" />
            <span>Lương & Tết</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: VIETNAMESE MUTUAL FUNDS & ETF (CHỨNG CHỈ QUỸ VIỆT NAM & SIP)         */}
      {/* ========================================================================= */}
      {activeTab === 'funds' && (
        <div className="space-y-6">
          
          {/* Top Overview KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
              <span className="text-xs font-medium text-[#666666] dark:text-[#888888] block">QUỸ CỔ PHIẾU NỔI BẬT</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">VESAF & DCDS</span>
                <span className="text-xs font-semibold text-[#10b981] tabular-nums">+24.8% ~ +28.5% (1Y)</span>
              </div>
              <p className="text-[11px] text-[#888888] mt-1">Lợi nhuận vượt trội chỉ số VN-Index</p>
            </div>

            <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
              <span className="text-xs font-medium text-[#666666] dark:text-[#888888] block">QUỸ ETF CHỈ SỐ DIAMOND</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">FUEVFVND</span>
                <span className="text-xs font-semibold text-[#10b981] tabular-nums">+26.3% (1Y)</span>
              </div>
              <p className="text-[11px] text-[#888888] mt-1">Phí quản lý thấp chỉ 0.65%/năm</p>
            </div>

            <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
              <span className="text-xs font-medium text-[#666666] dark:text-[#888888] block">QUỸ TRÁI PHIẾU AN TOÀN</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">TCBF & DCBF</span>
                <span className="text-xs font-semibold text-[#0070f3] tabular-nums">~8.2% - 8.5%/năm</span>
              </div>
              <p className="text-[11px] text-[#888888] mt-1">Cao hơn lãi suất tiết kiệm ngân hàng</p>
            </div>

            <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
              <span className="text-xs font-medium text-[#666666] dark:text-[#888888] block">MỨC VỐN TỐI THIỂU</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">Từ 10.000 đ</span>
                <span className="text-xs font-medium text-[#888888]">Khớp lệnh T+2</span>
              </div>
              <p className="text-[11px] text-[#888888] mt-1">Tích sản định kỳ hàng tháng (SIP/DCA)</p>
            </div>
          </div>

          {/* Funds Market Table Section */}
          <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#0070f3]" />
                  <span>Bảng giá & Hiệu suất Chứng chỉ quỹ mở Việt Nam</span>
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
                  Tổng hợp NAV và hiệu suất sinh lời các quỹ mở hàng đầu (Dragon Capital, VinaCapital, SSIAM, VCBF, Techcom Capital)
                </p>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                  <Input 
                    type="text" 
                    placeholder="Tìm mã (DCDS, VESAF…)" 
                    value={fundSearch}
                    onChange={e => setFundSearch(e.target.value)}
                    className="h-8 pl-8 pr-2 shadow-input text-xs"
                  />
                </div>

                {/* Category Filter */}
                <Select value={fundCategoryFilter} onValueChange={(v: any) => setFundCategoryFilter(v)}>
                  <SelectTrigger className="h-8 shadow-input text-xs w-32">
                    <SelectValue placeholder="Loại quỹ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tất cả loại quỹ</SelectItem>
                    <SelectItem value="stock" className="text-xs">Cổ phiếu</SelectItem>
                    <SelectItem value="etf" className="text-xs">ETF Chỉ số</SelectItem>
                    <SelectItem value="bond" className="text-xs">Trái phiếu</SelectItem>
                    <SelectItem value="balanced" className="text-xs">Cân bằng</SelectItem>
                  </SelectContent>
                </Select>

                {/* Company Filter */}
                <Select value={fundCompanyFilter} onValueChange={setFundCompanyFilter}>
                  <SelectTrigger className="h-8 shadow-input text-xs w-36">
                    <SelectValue placeholder="Công ty quản lý" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tất cả công ty</SelectItem>
                    {fundCompanies.map(c => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Funds List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[#888888] text-[11px] font-medium">
                    <th className="py-2.5 px-3">MÃ QUỸ / TÊN QUỸ</th>
                    <th className="py-2.5 px-3">LOẠI QUỸ</th>
                    <th className="py-2.5 px-3 text-right">NAV/CCQ (VNĐ)</th>
                    <th className="py-2.5 px-3 text-right">1 THÁNG</th>
                    <th className="py-2.5 px-3 text-right">6 THÁNG</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-[#171717] dark:text-[#ededed]">1 NĂM</th>
                    <th className="py-2.5 px-3 text-right">3 NĂM</th>
                    <th className="py-2.5 px-3 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {filteredFunds.map(fund => (
                    <tr 
                      key={fund.code} 
                      className="hover:bg-[#fafafa] dark:hover:bg-[#121212] transition-colors cursor-pointer group"
                      onClick={() => setSelectedFundForDetail(fund)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-[#fafafa] dark:bg-[#161616] shadow-border flex items-center justify-center font-bold text-xs font-mono">
                            {fund.code.slice(0, 4)}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-[#171717] dark:text-[#ededed] flex items-center gap-1.5">
                              <span>{fund.code}</span>
                              <span className="text-[10px] font-normal text-[#888888]">({fund.company})</span>
                            </div>
                            <div className="text-[11px] text-[#888888] truncate max-w-xs">{fund.name}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          fund.category === 'stock' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                          fund.category === 'etf' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                          fund.category === 'bond' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {fund.categoryName}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold tabular-nums text-xs">
                        {fund.nav.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums text-xs text-[#10b981]">
                        +{fund.return1M}%
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums text-xs text-[#10b981]">
                        +{fund.return6M}%
                      </td>

                      <td className="py-3 px-3 text-right font-bold tabular-nums text-xs text-[#10b981]">
                        +{fund.return1Y}%
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums text-xs text-[#10b981]">
                        +{fund.return3Y}%
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFundForDetail(fund);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium rounded shadow-border-interactive bg-[#ffffff] dark:bg-[#161616] text-[#171717] dark:text-[#ededed] hover:text-[#0070f3]"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIP / DCA Investment Calculator Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Form: Parameters */}
            <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#10b981]" />
                  <span>Kế hoạch Tích lũy Định kỳ (SIP / DCA)</span>
                </h3>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
                  Mô phỏng sức mạnh lãi kép khi đầu tư chứng chỉ quỹ đều đặn mỗi tháng
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Số tiền đầu tư mỗi tháng (VNĐ) *
                </label>
                <MoneyInput
                  placeholder="2.000.000"
                  value={sipMonthlyAmount}
                  onValueChange={setSipMonthlyAmount}
                  className="shadow-input text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                    Vốn ban đầu (VNĐ)
                  </label>
                  <MoneyInput
                    placeholder="0"
                    value={sipInitialAmount}
                    onValueChange={setSipInitialAmount}
                    className="shadow-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                    Lợi nhuận kỳ vọng (% / năm)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="50"
                    value={sipExpectedReturn}
                    onChange={e => setSipExpectedReturn(e.target.value)}
                    className="shadow-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Thời gian đầu tư: <span className="font-semibold">{sipYears} năm</span> ({Number(sipYears) * 12} tháng)
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={sipYears}
                  onChange={e => setSipYears(e.target.value)}
                  className="w-full accent-[#0070f3] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#888888] mt-1">
                  <span>1 năm</span>
                  <span>5 năm</span>
                  <span>10 năm</span>
                  <span>20 năm</span>
                  <span>30 năm</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <span className="text-[11px] text-[#888888] block mb-1.5">Chọn nhanh mức sinh lời theo loại quỹ:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSipExpectedReturn('8')}
                    className="px-2 py-1 rounded bg-[#fafafa] dark:bg-[#161616] shadow-border text-[10px] font-medium"
                  >
                    Quỹ Trái phiếu (8%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSipExpectedReturn('12')}
                    className="px-2 py-1 rounded bg-[#fafafa] dark:bg-[#161616] shadow-border text-[10px] font-medium"
                  >
                    Quỹ Cân bằng (12%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSipExpectedReturn('15')}
                    className="px-2 py-1 rounded bg-[#fafafa] dark:bg-[#161616] shadow-border text-[10px] font-medium"
                  >
                    Quỹ Cổ phiếu (15%)
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Calculation Results & Milestones */}
            <div className="lg:col-span-2 p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-between space-y-5">
              <div>
                <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block">
                  Ước tính giá trị tài sản ròng sau {sipYears} năm
                </span>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                    <span className="text-[11px] text-[#888888] block">TỔNG VỐN TÍCH LŨY</span>
                    <div className="text-xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-1">
                      {formatCurrency(sipResult.totalInvested)}
                    </div>
                  </div>

                  <div className="p-4 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                    <span className="text-[11px] text-[#888888] block">LỢI NHUẬN TỪ LÃI KÉP</span>
                    <div className="text-xl font-semibold text-[#10b981] tabular-nums mt-1">
                      +{formatCurrency(sipResult.totalInterest)}
                    </div>
                  </div>

                  <div className="p-4 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                    <span className="text-[11px] text-[#888888] block">TỔNG TÀI SẢN ĐẠT ĐƯỢC</span>
                    <div className="text-xl font-semibold text-[#0070f3] tabular-nums mt-1">
                      {formatCurrency(sipResult.finalValue)}
                    </div>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-[#888888]">
                    <span>Tỷ trọng vốn gốc: {((sipResult.totalInvested / sipResult.finalValue) * 100).toFixed(0)}%</span>
                    <span className="text-[#10b981] font-semibold">Tỷ trọng lãi kép: {((sipResult.totalInterest / sipResult.finalValue) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
                    <div 
                      className="h-full bg-zinc-700 dark:bg-zinc-400 transition-all duration-300"
                      style={{ width: `${(sipResult.totalInvested / sipResult.finalValue) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-[#10b981] transition-all duration-300"
                      style={{ width: `${(sipResult.totalInterest / sipResult.finalValue) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Yearly Milestone Breakdown Table */}
                <div className="mt-5">
                  <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block mb-2">
                    Lộ trình tích lũy theo từng mốc năm
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-md">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#fafafa] dark:bg-[#161616] text-[#888888] text-[10px] sticky top-0">
                        <tr>
                          <th className="py-2 px-3">NĂM</th>
                          <th className="py-2 px-3 text-right">VỐN GỐP (VNĐ)</th>
                          <th className="py-2 px-3 text-right text-[#10b981]">LÃI KÉP (VNĐ)</th>
                          <th className="py-2 px-3 text-right font-semibold">TỔNG TÀI SẢN (VNĐ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                        {sipResult.yearlyBreakdown.map(item => (
                          <tr key={item.year} className="hover:bg-[#fafafa] dark:hover:bg-[#111111]">
                            <td className="py-2 px-3 font-medium text-xs">Năm {item.year}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(item.invested)}</td>
                            <td className="py-2 px-3 text-right text-[#10b981] tabular-nums">+{formatCurrency(item.interestEarned)}</td>
                            <td className="py-2 px-3 text-right font-semibold tabular-nums text-[#171717] dark:text-[#ededed]">{formatCurrency(item.totalValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for Selected Fund */}
      {selectedFundForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#ffffff] dark:bg-[#0a0a0a] rounded-xl shadow-2xl p-6 space-y-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black flex items-center justify-center font-bold font-mono text-sm">
                  {selectedFundForDetail.code.slice(0, 4)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#171717] dark:text-[#ededed]">{selectedFundForDetail.code}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[#888888]">
                      {selectedFundForDetail.company}
                    </span>
                  </div>
                  <p className="text-xs text-[#888888]">{selectedFundForDetail.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFundForDetail(null)}
                className="p-1 rounded text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="p-2.5 rounded bg-[#fafafa] dark:bg-[#111111] shadow-border">
                <span className="text-[10px] text-[#888888] block">GIÁ NAV HIỆN TẠI</span>
                <span className="text-xs font-bold tabular-nums">{selectedFundForDetail.nav.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="p-2.5 rounded bg-[#fafafa] dark:bg-[#111111] shadow-border">
                <span className="text-[10px] text-[#888888] block">LỢI NHUẬN 1 NĂM</span>
                <span className="text-xs font-bold text-[#10b981] tabular-nums">+{selectedFundForDetail.return1Y}%</span>
              </div>
              <div className="p-2.5 rounded bg-[#fafafa] dark:bg-[#111111] shadow-border">
                <span className="text-[10px] text-[#888888] block">MỨC ĐỘ RỦI RO</span>
                <span className="text-xs font-semibold">{selectedFundForDetail.riskLevel}</span>
              </div>
              <div className="p-2.5 rounded bg-[#fafafa] dark:bg-[#111111] shadow-border">
                <span className="text-[10px] text-[#888888] block">PHÍ QUẢN LÝ</span>
                <span className="text-xs font-semibold">{selectedFundForDetail.managementFee}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block">Mục tiêu & Chiến lược đầu tư</span>
              <p className="text-xs text-[#666666] dark:text-[#888888] leading-relaxed">
                {selectedFundForDetail.description}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block">Top danh mục nắm giữ trọng số cao</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedFundForDetail.topHoldings.map((h, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-[#fafafa] dark:bg-[#111111] shadow-border text-xs font-medium">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedFundForDetail(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium shadow-border bg-transparent"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFundForDetail(null);
                  setShowAddTxModal(true);
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#171717] dark:bg-[#ededed] text-white dark:text-black flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ghi nhận mua CCQ này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: GOLD & FX MARKET                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          {/* Gold Section */}
          <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                  Bảng giá vàng SJC & 9999
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">Niêm yết thị trường vàng trong nước</p>
              </div>

              {/* Quick Gold Converter */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={goldAmount}
                  onChange={e => setGoldAmount(e.target.value)}
                  className="w-16 h-8 px-2 text-xs rounded-md shadow-input bg-[#fafafa] dark:bg-[#111111] font-medium tabular-nums text-center"
                />
                <span className="text-xs text-[#888888]">Lượng =</span>
                <span className="text-xs font-semibold text-[#10b981] tabular-nums">
                  {formatCurrency(goldValueSell)}
                </span>
              </div>
            </div>

            {/* Gold Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[#888888] text-[11px] font-medium">
                    <th className="py-2.5 px-3">LOẠI VÀNG</th>
                    <th className="py-2.5 px-3 text-right">GIÁ MUA VÀO (VNĐ)</th>
                    <th className="py-2.5 px-3 text-right">GIÁ BÁN RA (VNĐ)</th>
                    <th className="py-2.5 px-3 text-right">BIẾN ĐỘNG HÔM NAY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {LIVE_GOLD_RATES.map((g, idx) => (
                    <tr key={idx} className="hover:bg-[#fafafa] dark:hover:bg-[#121212] transition-colors">
                      <td className="py-3 px-3 font-medium text-[#171717] dark:text-[#ededed]">{g.type}</td>
                      <td className="py-3 px-3 text-right tabular-nums">{formatCurrency(g.buyPrice)}</td>
                      <td className="py-3 px-3 text-right font-semibold tabular-nums text-[#171717] dark:text-[#ededed]">{formatCurrency(g.sellPrice)}</td>
                      <td className={`py-3 px-3 text-right tabular-nums ${g.change >= 0 ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
                        {g.change >= 0 ? '+' : ''}{formatCurrency(g.change)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Foreign Exchange Section */}
          <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                  Tỷ giá ngoại tệ ngân hàng
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">Tỷ giá tham chiếu chuyển đổi sang VND</p>
              </div>

              {/* Quick FX Converter */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={fxAmount}
                  onChange={e => setFxAmount(e.target.value)}
                  className="w-20 h-8 px-2 text-xs rounded-md shadow-input bg-[#fafafa] dark:bg-[#111111] font-medium tabular-nums text-center"
                />
                <Select value={selectedFxCode} onValueChange={setSelectedFxCode}>
                  <SelectTrigger className="h-8 shadow-input text-xs w-28">
                    <SelectValue placeholder="Chọn loại tiền" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIVE_FX_RATES.map(f => (
                      <SelectItem key={f.code} value={f.code} className="text-xs">
                        {f.code} ({f.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-[#888888]">=</span>
                <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">
                  {formatCurrency(fxValueVnd)}
                </span>
              </div>
            </div>

            {/* FX Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {LIVE_FX_RATES.map(fx => (
                <div
                  key={fx.code}
                  className="p-3 rounded-md shadow-border bg-[#fafafa] dark:bg-[#111111] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{fx.flag}</span>
                    <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">{fx.code}</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">
                      {fx.sell.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[10px] text-[#888888] truncate">{fx.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SAVINGS CALCULATOR                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'savings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Form */}
          <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block">
              Thông số khoản gửi tiết kiệm
            </span>

            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                Số tiền gửi ban đầu (VNĐ)
              </label>
              <MoneyInput
                placeholder="100.000.000"
                value={savingsPrincipal}
                onValueChange={setSavingsPrincipal}
                className="shadow-input text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Lãi suất (% / năm)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={savingsRate}
                  onChange={e => setSavingsRate(e.target.value)}
                  className="shadow-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Kỳ hạn (tháng)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={savingsMonths}
                  onChange={e => setSavingsMonths(e.target.value)}
                  className="shadow-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                Hình thức nhận lãi
              </label>
              <Select value={savingsType} onValueChange={v => setSavingsType(v as any)}>
                <SelectTrigger className="shadow-input text-xs h-9">
                  <SelectValue placeholder="Chọn hình thức nhận lãi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end_term" className="text-xs">Lãi trả cuối kỳ (Nhận khi đáo hạn)</SelectItem>
                  <SelectItem value="monthly" className="text-xs">Lãi trả hàng tháng</SelectItem>
                  <SelectItem value="compound" className="text-xs">Lãi kép (Lãi nhập gốc hàng tháng)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-2 p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block">
                Kết quả dự tính
              </span>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                  <span className="text-[11px] text-[#888888] block">TỔNG TIỀN LÃI</span>
                  <div className="text-xl font-semibold text-[#10b981] tabular-nums mt-1">
                    +{formatCurrency(savingsResult.totalInterest)}
                  </div>
                </div>

                <div className="p-4 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                  <span className="text-[11px] text-[#888888] block">TỔNG NHẬN KHI ĐÁO HẠN</span>
                  <div className="text-xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-1">
                    {formatCurrency(savingsResult.finalAmount)}
                  </div>
                </div>

                <div className="p-4 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                  <span className="text-[11px] text-[#888888] block">LÃI TRUNG BÌNH / THÁNG</span>
                  <div className="text-xl font-semibold text-[#0070f3] tabular-nums mt-1">
                    +{formatCurrency(savingsResult.monthlyInterest)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border text-xs text-[#666666] dark:text-[#888888] space-y-1.5">
              <p className="font-semibold text-[#171717] dark:text-[#ededed]">Gợi ý:</p>
              <p>• Chia nhỏ khoản tiền thành nhiều sổ để linh hoạt dòng tiền khi cần thiết mà không mất lãi suất các sổ còn lại.</p>
              <p>• Chọn hình thức lãi kép khi gửi dài hạn từ 1 năm trở lên để tối ưu lợi nhuận sinh sôi.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LOAN CALCULATOR                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'loan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block">
              Thông số khoản vay
            </span>

            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                Số tiền vay (VNĐ)
              </label>
              <MoneyInput
                placeholder="500.000.000"
                value={loanAmount}
                onValueChange={setLoanAmount}
                className="shadow-input text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Lãi suất (% / năm)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={loanRate}
                  onChange={e => setLoanRate(e.target.value)}
                  className="shadow-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Thời hạn (tháng)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={loanTerm}
                  onChange={e => setLoanTerm(e.target.value)}
                  className="shadow-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                Phương thức tính lãi
              </label>
              <Select value={loanMethod} onValueChange={v => setLoanMethod(v as any)}>
                <SelectTrigger className="shadow-input text-xs h-9">
                  <SelectValue placeholder="Chọn phương thức tính lãi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reducing_balance" className="text-xs">Dư nợ giảm dần (Chuẩn ngân hàng VN)</SelectItem>
                  <SelectItem value="fixed_principal" className="text-xs">Dư nợ gốc ban đầu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loan KPI Cards & Schedule Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
                <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Tổng lãi phải trả</span>
                <div className="text-xl font-semibold text-[#ff5b4f] tabular-nums mt-2">
                  {formatCurrency(loanResult.totalInterest)}
                </div>
              </div>

              <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
                <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Tổng tiền (Gốc + Lãi)</span>
                <div className="text-xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-2">
                  {formatCurrency(loanResult.totalPayment)}
                </div>
              </div>

              <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
                <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Tháng đầu tiên trả</span>
                <div className="text-xl font-semibold text-[#0070f3] tabular-nums mt-2">
                  {formatCurrency(loanResult.firstMonthPayment)}
                </div>
              </div>
            </div>

            {/* Repayment Schedule Table */}
            <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-3">
              <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block">
                Lịch trả góp chi tiết qua các tháng (Mẫu 12 tháng đầu)
              </span>
              <div className="max-h-60 overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-md">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#fafafa] dark:bg-[#161616] text-[#888888] text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">KỲ</th>
                      <th className="py-2 px-3 text-right">DƯ NỢ ĐẦU KỲ</th>
                      <th className="py-2 px-3 text-right">TIỀN GỐC</th>
                      <th className="py-2 px-3 text-right">TIỀN LÃI</th>
                      <th className="py-2 px-3 text-right font-semibold">TỔNG TRẢ / THÁNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {loanResult.schedule.slice(0, 12).map(m => (
                      <tr key={m.month} className="hover:bg-[#fafafa] dark:hover:bg-[#111111]">
                        <td className="py-2 px-3 font-medium text-xs">Tháng {m.month}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(m.beginningBalance)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(m.principalPayment)}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-[#ff5b4f]">{formatCurrency(m.interestPayment)}</td>
                        <td className="py-2 px-3 text-right font-semibold tabular-nums text-[#171717] dark:text-[#ededed]">{formatCurrency(m.totalMonthlyPayment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VIETNAMESE SALARY & TET COUNTDOWN                                  */}
      {/* ========================================================================= */}
      {activeTab === 'tet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Salary Countdown Card */}
          <div className="p-6 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <div className="flex items-center justify-between text-[#888888]">
              <span className="text-xs font-medium">ĐẾM NGƯỢC NGÀY NHẬN LƯƠNG</span>
              <CalendarClock className="w-4 h-4 text-[#10b981]" />
            </div>

            <div className="py-4 text-center">
              <div className="text-4xl font-semibold tabular-nums tracking-tight text-[#171717] dark:text-[#ededed]">
                {countdowns.daysToSalary} <span className="text-base font-normal text-[#888888]">ngày nữa</span>
              </div>
              <p className="text-xs text-[#666666] dark:text-[#888888] mt-2">
                Dự kiến: <strong className="text-[#171717] dark:text-[#ededed]">{countdowns.nextSalaryDate}</strong> (Ngày {salaryDay} hàng tháng)
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-2 text-xs">
              <span className="text-[#888888]">Thay đổi ngày nhận lương:</span>
              <Select value={String(salaryDay)} onValueChange={v => setSalaryDay(Number(v))}>
                <SelectTrigger className="h-7 shadow-input text-xs w-44">
                  <SelectValue placeholder="Chọn ngày" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 5, 10, 15, 20, 25, 28, 30].map(d => (
                    <SelectItem key={d} value={String(d)} className="text-xs">
                      Ngày {d} hàng tháng
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tết Holiday Countdown Card */}
          <div className="p-6 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <div className="flex items-center justify-between text-[#888888]">
              <span className="text-xs font-medium">ĐẾM NGƯỢC TẾT NGUYÊN ĐÁN</span>
              <Sparkles className="w-4 h-4 text-[#ff5b4f]" />
            </div>

            <div className="py-4 text-center">
              <div className="text-4xl font-semibold tabular-nums tracking-tight text-[#ff5b4f]">
                {countdowns.daysToTet} <span className="text-base font-normal text-[#888888]">ngày nữa</span>
              </div>
              <p className="text-xs text-[#666666] dark:text-[#888888] mt-2">
                Mùng 1 Tết Nguyên Đán: <strong className="text-[#171717] dark:text-[#ededed]">{countdowns.tetDate}</strong>
              </p>
            </div>

            <div className="p-3 rounded bg-[#fafafa] dark:bg-[#111111] shadow-border text-[11px] text-[#888888] leading-relaxed">
              💡 <strong>Gợi ý tài chính:</strong> Trích trước 10% thu nhập hàng tháng vào Heo tiết kiệm "Quỹ Tết" để chủ động chi tiêu vé xe, quà biếu và lì xì mà không bị thâm hụt ngân sách.
            </div>
          </div>
        </div>
      )}

      {/* Global Quick Add Transaction Modal */}
      <CreateTransactionModal
        open={showAddTxModal}
        onClose={() => setShowAddTxModal(false)}
        defaultType="Withdrawal"
      />
    </div>
  );
};
