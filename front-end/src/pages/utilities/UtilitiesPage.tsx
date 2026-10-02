import React, { useState } from 'react';
import { 
  LIVE_GOLD_RATES, 
  LIVE_FX_RATES, 
  calculateSavingsInterest, 
  calculateLoanSchedule, 
  getUpcomingFinancialEvents,
  type LoanCalculationResult,
  type SavingsCalculationResult
} from '@/lib/vietnam-market';
import { formatCurrency } from '@/lib/utils';
import { MoneyInput } from '@/components/ui/money-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Coins, 
  Landmark, 
  Calculator, 
  CalendarClock, 
  TrendingUp, 
  ArrowRightLeft,
  Flame,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const UtilitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'market' | 'savings' | 'loan' | 'tet'>('market');

  // Gold Converter state
  const [goldAmount, setGoldAmount] = useState('1'); // 1 cây / lượng
  const [selectedGoldIdx, setSelectedGoldIdx] = useState(0);

  // FX Converter state
  const [fxAmount, setFxAmount] = useState('100');
  const [selectedFxCode, setSelectedFxCode] = useState('USD');

  // Savings Calculator state
  const [savingsPrincipal, setSavingsPrincipal] = useState('100000000'); // 100M VND
  const [savingsRate, setSavingsRate] = useState('5.5');
  const [savingsMonths, setSavingsMonths] = useState('12');
  const [savingsType, setSavingsType] = useState<'end_term' | 'monthly' | 'compound'>('end_term');

  // Loan Calculator state
  const [loanAmount, setLoanAmount] = useState('500000000'); // 500M VND
  const [loanRate, setLoanRate] = useState('8.5');
  const [loanTerm, setLoanTerm] = useState('36'); // 36 months
  const [loanMethod, setLoanMethod] = useState<'reducing_balance' | 'fixed_principal'>('reducing_balance');

  // Salary countdown config
  const [salaryDay, setSalaryDay] = useState(5);

  const countdowns = getUpcomingFinancialEvents(salaryDay);

  const selectedGold = LIVE_GOLD_RATES[selectedGoldIdx] || LIVE_GOLD_RATES[0];
  const goldValueBuy = (Number(goldAmount) || 0) * selectedGold.buyPrice;
  const goldValueSell = (Number(goldAmount) || 0) * selectedGold.sellPrice;

  const selectedFx = LIVE_FX_RATES.find(f => f.code === selectedFxCode) || LIVE_FX_RATES[0];
  const fxValueVnd = (Number(fxAmount) || 0) * selectedFx.sell;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Tiện Ích & Công Cụ Thị Trường Việt Nam
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Thị trường & Công cụ
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Bảng giá vàng SJC, tỷ giá ngoại tệ ngân hàng, máy tính lãi tiết kiệm, lịch trả nợ vay ngân hàng và đếm ngược Tết.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('market')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'market' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Giá Vàng & Tỷ Giá</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('savings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'savings' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tính Lãi Tiết Kiệm</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loan')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'loan' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <Calculator className="w-3.5 h-3.5 text-sky-500" />
            <span>Tính Vay Trả Góp</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tet')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'tet' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <CalendarClock className="w-3.5 h-3.5 text-rose-500" />
            <span>Lương & Tết</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GOLD & FX MARKET */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          {/* Gold Section */}
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  🥇
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Bảng Giá Vàng SJC & Vàng Nhẫn 9999
                  </h2>
                  <p className="text-[11px] text-zinc-500">Cập nhật niêm yết thị trường vàng trong nước</p>
                </div>
              </div>

              {/* Quick Gold Converter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Quy đổi nhanh:</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={goldAmount}
                  onChange={e => setGoldAmount(e.target.value)}
                  className="w-16 h-8 px-2 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-bold tabular-nums text-center"
                />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Lượng / Cây =</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatCurrency(goldValueSell)}
                </span>
              </div>
            </div>

            {/* Gold Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase text-[10px] font-semibold border-b border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Loại Vàng</th>
                    <th className="py-2.5 px-4 text-right">Giá Mua Vào</th>
                    <th className="py-2.5 px-4 text-right">Giá Bán Ra</th>
                    <th className="py-2.5 px-4 text-right">Chênh Lệch (Mua - Bán)</th>
                    <th className="py-2.5 px-4 text-center">Đơn Vị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {LIVE_GOLD_RATES.map((g, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>{g.type}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 tabular-nums">
                        {formatCurrency(g.buyPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 tabular-nums">
                        {formatCurrency(g.sellPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-zinc-500 tabular-nums">
                        {formatCurrency(g.sellPrice - g.buyPrice)}
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-400 text-[11px]">
                        {g.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FX Section */}
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                  💵
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Tỷ Giá Ngoại Tệ Ngân Hàng (Vietcombank Reference)
                  </h2>
                  <p className="text-[11px] text-zinc-500">Tỷ giá chuyển đổi ngoại tệ sang Việt Nam Đồng (VND)</p>
                </div>
              </div>

              {/* Quick FX Converter */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={fxAmount}
                  onChange={e => setFxAmount(e.target.value)}
                  className="w-20 h-8 px-2 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-bold tabular-nums text-center"
                />
                <select
                  value={selectedFxCode}
                  onChange={e => setSelectedFxCode(e.target.value)}
                  className="h-8 px-2 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-semibold"
                >
                  {LIVE_FX_RATES.map(f => (
                    <option key={f.code} value={f.code}>{f.code} - {f.name}</option>
                  ))}
                </select>
                <span className="text-xs text-zinc-500">=</span>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                  {formatCurrency(fxValueVnd)}
                </span>
              </div>
            </div>

            {/* FX Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {LIVE_FX_RATES.map(fx => (
                <div
                  key={fx.code}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/40 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{fx.flag}</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">{fx.code}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] text-zinc-400 block">{fx.name}</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums block mt-0.5">
                      {fx.sell.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVINGS INTEREST CALCULATOR */}
      {activeTab === 'savings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-1 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              Thông tin gửi tiết kiệm
            </h2>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                Số tiền gửi ban đầu (VNĐ) *
              </label>
              <MoneyInput
                value={savingsPrincipal}
                onValueChange={setSavingsPrincipal}
                className="font-bold text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Lãi suất (% / năm) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  value={savingsRate}
                  onChange={e => setSavingsRate(e.target.value)}
                  className="font-semibold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Kỳ hạn (Tháng) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={savingsMonths}
                  onChange={e => setSavingsMonths(e.target.value)}
                  className="font-semibold text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                Hình thức nhận lãi
              </label>
              <select
                value={savingsType}
                onChange={e => setSavingsType(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs shadow-xs text-zinc-900 dark:text-white focus:outline-none"
              >
                <option value="end_term">Lãi trả cuối kỳ (Nhận toàn bộ khi đáo hạn)</option>
                <option value="monthly">Lãi trả hàng tháng (Rút tiêu dùng)</option>
                <option value="compound">Lãi kép (Lãi nhập gốc hàng tháng)</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                KẾT QUẢ DỰ TÍNH TIẾT KIỆM
              </span>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-900 shadow-xs">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase block">TỔNG TIỀN LÃI THU VỀ</span>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                    +{formatCurrency(savingsResult.totalInterest)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-900 shadow-xs">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase block">TỔNG NHẬN KHI ĐÁO HẠN</span>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums mt-1">
                    {formatCurrency(savingsResult.finalAmount)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-emerald-900 shadow-xs">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase block">LÃI TRUNG BÌNH / THÁNG</span>
                  <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums mt-1">
                    {formatCurrency(savingsResult.monthlyInterest)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 space-y-2">
              <p className="font-semibold text-zinc-900 dark:text-white">💡 Mẹo gửi tiết kiệm thông minh:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <li>Chia nhỏ khoản tiền thành nhiều sổ (VD: 2-3 sổ có kỳ hạn khác nhau) để khi cần tiền gấp không phải tất toán trước hạn toàn bộ.</li>
                <li>Lãi kép (nhập gốc sinh lãi tiếp) có sức mạnh vượt trội khi gửi dài hạn trên 2-3 năm.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOAN / MORTGAGE REPAYMENT SCHEDULE */}
      {activeTab === 'loan' && (
        <div className="space-y-6">
          {/* Inputs & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-600" />
                Thông số khoản vay
              </h2>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Số tiền cần vay (VNĐ) *
                </label>
                <MoneyInput
                  value={loanAmount}
                  onValueChange={setLoanAmount}
                  className="font-bold text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Lãi suất (% / năm) *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="35"
                    value={loanRate}
                    onChange={e => setLoanRate(e.target.value)}
                    className="font-semibold text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                    Thời hạn (Tháng) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="360"
                    value={loanTerm}
                    onChange={e => setLoanTerm(e.target.value)}
                    className="font-semibold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Phương thức tính lãi
                </label>
                <select
                  value={loanMethod}
                  onChange={e => setLoanMethod(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs shadow-xs text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="reducing_balance">Dư nợ giảm dần (Chuẩn ngân hàng VN)</option>
                  <option value="fixed_principal">Dư nợ gốc ban đầu (Trả góp đều)</option>
                </select>
              </div>
            </div>

            {/* Loan KPI Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">TỔNG LÃI PHẢI TRẢ</span>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-2">
                  {formatCurrency(loanResult.totalInterest)}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1">
                  Bằng {loanResult.loanAmount > 0 ? ((loanResult.totalInterest / loanResult.loanAmount) * 100).toFixed(0) : 0}% tổng gốc vay
                </span>
              </div>

              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">TỔNG SỐ TIỀN (GỐC + LÃI)</span>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums mt-2">
                  {formatCurrency(loanResult.totalPayment)}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1">
                  Trả trong {loanResult.termMonths} tháng
                </span>
              </div>

              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">THÁNG ĐẦU TIÊN CẦN TRẢ</span>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums mt-2">
                  {formatCurrency(loanResult.firstMonthPayment)}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1">Gốc + Lãi tháng đầu</span>
              </div>

              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">THÁNG CUỐI CÙNG CẦN TRẢ</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-2">
                  {formatCurrency(loanResult.lastMonthPayment)}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1">Giảm dần theo thời gian</span>
              </div>
            </div>
          </div>

          {/* Schedule Table Preview (First 12 months) */}
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
              Lịch trả nợ chi tiết từng kỳ ({loanResult.schedule.length} tháng)
            </h3>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 sticky top-0 text-[10px] uppercase font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="py-2.5 px-4">Kỳ</th>
                    <th className="py-2.5 px-4 text-right">Dư nợ đầu kỳ</th>
                    <th className="py-2.5 px-4 text-right">Trả Gốc</th>
                    <th className="py-2.5 px-4 text-right">Trả Lãi</th>
                    <th className="py-2.5 px-4 text-right">Tổng thanh toán</th>
                    <th className="py-2.5 px-4 text-right">Dư nợ cuối kỳ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loanResult.schedule.map(row => (
                    <tr key={row.month} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 tabular-nums">
                      <td className="py-2 px-4 font-semibold text-zinc-900 dark:text-white">Tháng {row.month}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(row.beginningBalance)}</td>
                      <td className="py-2 px-4 text-right font-medium text-sky-600">{formatCurrency(row.principalPayment)}</td>
                      <td className="py-2 px-4 text-right text-rose-600">{formatCurrency(row.interestPayment)}</td>
                      <td className="py-2 px-4 text-right font-bold text-zinc-900 dark:text-white">{formatCurrency(row.totalMonthlyPayment)}</td>
                      <td className="py-2 px-4 text-right text-zinc-500">{formatCurrency(row.endingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SALARY & TET COUNTDOWN */}
      {activeTab === 'tet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Salary Countdown Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white shadow-lg space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-sky-300 tracking-wider">
                  ĐẾM NGƯỢC NGÀY NHẬN LƯƠNG
                </span>
                <span className="text-2xl">💼</span>
              </div>

              <div>
                <div className="text-5xl font-extrabold tabular-nums tracking-tight text-white">
                  {countdowns.daysToSalary} <span className="text-xl font-normal text-sky-200">ngày nữa</span>
                </div>
                <p className="text-xs text-sky-200 mt-2">
                  Ngày nhận lương dự kiến: <strong>{countdowns.nextSalaryDate}</strong> (Ngày {salaryDay} hàng tháng)
                </p>
              </div>

              <div className="pt-3 border-t border-sky-800/60 flex items-center gap-2 text-xs">
                <span>Thay đổi ngày nhận lương:</span>
                <select
                  value={salaryDay}
                  onChange={e => setSalaryDay(Number(e.target.value))}
                  className="bg-indigo-950/80 border border-sky-700 rounded px-2 py-0.5 text-xs text-white"
                >
                  {[1, 5, 10, 15, 20, 25, 28, 30].map(d => (
                    <option key={d} value={d}>Ngày {d} hàng tháng</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tết Holiday Countdown Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-900 via-rose-900 to-amber-950 text-white shadow-lg space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-semibold text-amber-300 tracking-wider">
                  ĐẾM NGƯỢC TẾT NGUYÊN ĐÁN
                </span>
                <span className="text-2xl">🏮</span>
              </div>

              <div>
                <div className="text-5xl font-extrabold tabular-nums tracking-tight text-amber-300">
                  {countdowns.daysToTet} <span className="text-xl font-normal text-amber-100">ngày nữa</span>
                </div>
                <p className="text-xs text-amber-200 mt-2">
                  Mùng 1 Tết Nguyên Đán: <strong>{countdowns.tetDate}</strong>
                </p>
              </div>

              <div className="pt-3 border-t border-red-800/60 text-xs text-amber-200/90 leading-relaxed">
                🧧 Lời khuyên sắm Tết: Hãy tạo hũ tiết kiệm "Quỹ sắm Tết & Lì xì" ngay từ bây giờ để không bị áp lực chi tiêu dồn vào tháng chạp!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
