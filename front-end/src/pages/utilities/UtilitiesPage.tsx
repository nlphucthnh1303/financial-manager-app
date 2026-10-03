import React, { useState } from 'react';
import { 
  LIVE_GOLD_RATES, 
  LIVE_FX_RATES, 
  calculateSavingsInterest, 
  calculateLoanSchedule, 
  getUpcomingFinancialEvents
} from '@/lib/vietnam-market';
import { formatCurrency } from '@/lib/utils';
import { MoneyInput } from '@/components/ui/money-input';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Coins, 
  Landmark, 
  Calculator, 
  CalendarClock
} from 'lucide-react';

export const UtilitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'market' | 'savings' | 'loan' | 'tet'>('market');

  // Gold Converter state
  const [goldAmount, setGoldAmount] = useState('1');
  const [selectedGoldIdx] = useState(0);

  // FX Converter state
  const [fxAmount, setFxAmount] = useState('100');
  const [selectedFxCode, setSelectedFxCode] = useState('USD');

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
            Bảng giá vàng SJC, tỷ giá ngoại tệ, tính lãi tiết kiệm và lịch trả góp ngân hàng
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 bg-[#fafafa] dark:bg-[#111111] shadow-border rounded-md self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('market')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'market' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
          >
            <Coins className="w-3.5 h-3.5 text-[#0070f3]" />
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

      {/* TAB 1: GOLD & FX MARKET */}
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
                <span className="text-xs text-[#888888]">Quy đổi:</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={goldAmount}
                  onChange={e => setGoldAmount(e.target.value)}
                  className="w-16 h-8 px-2 text-xs rounded-md shadow-input bg-[#fafafa] dark:bg-[#111111] font-medium tabular-nums text-center"
                />
                <span className="text-xs text-[#171717] dark:text-[#ededed]">Lượng =</span>
                <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">
                  {formatCurrency(goldValueSell)}
                </span>
              </div>
            </div>

            {/* Gold Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafa] dark:bg-[#111111] text-[#888888] text-[11px] font-medium border-b border-zinc-100 dark:border-zinc-900">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Loại vàng</th>
                    <th className="py-2.5 px-4 font-medium text-right">Giá mua vào</th>
                    <th className="py-2.5 px-4 font-medium text-right">Giá bán ra</th>
                    <th className="py-2.5 px-4 font-medium text-right">Chênh lệch</th>
                    <th className="py-2.5 px-4 font-medium text-center">Đơn vị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-[#171717] dark:text-[#ededed]">
                  {LIVE_GOLD_RATES.map((g, idx) => (
                    <tr key={idx} className="hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors">
                      <td className="py-3 px-4 font-medium">
                        {g.type}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#10b981] tabular-nums">
                        {formatCurrency(g.buyPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#ff5b4f] tabular-nums">
                        {formatCurrency(g.sellPrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#888888] tabular-nums">
                        {formatCurrency(g.sellPrice - g.buyPrice)}
                      </td>
                      <td className="py-3 px-4 text-center text-[#888888] text-[11px]">
                        {g.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FX Section */}
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
                    <span className="text-[10px] text-[#888888] block">{fx.name}</span>
                    <span className="text-sm font-semibold text-[#171717] dark:text-[#ededed] tabular-nums block mt-0.5">
                      {fx.sell.toLocaleString('vi-VN')} ₫
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
          <div className="lg:col-span-1 p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
              Thông tin gửi tiết kiệm
            </h2>

            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                Số tiền gửi ban đầu (VNĐ) *
              </label>
              <MoneyInput
                value={savingsPrincipal}
                onValueChange={setSavingsPrincipal}
                className="font-semibold text-sm shadow-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Lãi suất (% / năm) *
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  value={savingsRate}
                  onChange={e => setSavingsRate(e.target.value)}
                  className="shadow-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Kỳ hạn (Tháng) *
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
                    {formatCurrency(savingsResult.monthlyInterest)}
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

      {/* TAB 3: LOAN / MORTGAGE REPAYMENT SCHEDULE */}
      {activeTab === 'loan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
              <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                Thông số khoản vay
              </h2>

              <div>
                <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                  Số tiền cần vay (VNĐ) *
                </label>
                <MoneyInput
                  value={loanAmount}
                  onValueChange={setLoanAmount}
                  className="font-semibold text-sm shadow-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                    Lãi suất (% / năm) *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="35"
                    value={loanRate}
                    onChange={e => setLoanRate(e.target.value)}
                    className="shadow-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
                    Thời hạn (Tháng) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="360"
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

            {/* Loan KPI Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Tháng đầu tiên cần trả</span>
                <div className="text-xl font-semibold text-[#0070f3] tabular-nums mt-2">
                  {formatCurrency(loanResult.firstMonthPayment)}
                </div>
              </div>

              <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
                <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Tháng cuối cùng cần trả</span>
                <div className="text-xl font-semibold text-[#10b981] tabular-nums mt-2">
                  {formatCurrency(loanResult.lastMonthPayment)}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Table Preview */}
          <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-3">
            <h3 className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">
              Lịch trả nợ chi tiết ({loanResult.schedule.length} kỳ)
            </h3>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafa] dark:bg-[#111111] sticky top-0 text-[11px] font-medium text-[#888888] border-b border-zinc-100 dark:border-zinc-900">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Kỳ</th>
                    <th className="py-2.5 px-4 font-medium text-right">Dư nợ đầu kỳ</th>
                    <th className="py-2.5 px-4 font-medium text-right">Trả gốc</th>
                    <th className="py-2.5 px-4 font-medium text-right">Trả lãi</th>
                    <th className="py-2.5 px-4 font-medium text-right">Tổng thanh toán</th>
                    <th className="py-2.5 px-4 font-medium text-right">Dư nợ cuối kỳ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-[#171717] dark:text-[#ededed]">
                  {loanResult.schedule.map(row => (
                    <tr key={row.month} className="hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors tabular-nums">
                      <td className="py-2 px-4 font-medium">Tháng {row.month}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(row.beginningBalance)}</td>
                      <td className="py-2 px-4 text-right font-medium text-[#0070f3]">{formatCurrency(row.principalPayment)}</td>
                      <td className="py-2 px-4 text-right text-[#ff5b4f]">{formatCurrency(row.interestPayment)}</td>
                      <td className="py-2 px-4 text-right font-semibold">{formatCurrency(row.totalMonthlyPayment)}</td>
                      <td className="py-2 px-4 text-right text-[#888888]">{formatCurrency(row.endingBalance)}</td>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Salary Countdown Card */}
          <div className="p-6 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] space-y-4">
            <div className="flex items-center justify-between text-[#888888]">
              <span className="text-xs font-medium">ĐẾM NGƯỢC NGÀY NHẬN LƯƠNG</span>
              <span>💼</span>
            </div>

            <div>
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
              <span>🏮</span>
            </div>

            <div>
              <div className="text-4xl font-semibold tabular-nums tracking-tight text-[#171717] dark:text-[#ededed]">
                {countdowns.daysToTet} <span className="text-base font-normal text-[#888888]">ngày nữa</span>
              </div>
              <p className="text-xs text-[#666666] dark:text-[#888888] mt-2">
                Mùng 1 Tết Nguyên Đán: <strong className="text-[#171717] dark:text-[#ededed]">{countdowns.tetDate}</strong>
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 text-xs text-[#888888] leading-relaxed">
              Lời khuyên: Phân bổ quỹ tiết kiệm mua sắm Tết trước 2-3 tháng để giảm bớt áp lực tài chính cuối năm.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
