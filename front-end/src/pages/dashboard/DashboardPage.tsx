import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { endOfDayIso, formatCurrency, formatDate, exportToCSV, startOfDayIso, toDateInput, walletOf } from '@/lib/utils';
import { useDateRange } from '@/lib/date-range';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Landmark, 
  BarChart2, 
  Receipt,
  RefreshCw,
  Download,
  ArrowRight,
  Target,
  CreditCard,
  QrCode,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import { LIVE_GOLD_RATES, LIVE_FX_RATES, getUpcomingFinancialEvents } from '@/lib/vietnam-market';
import { calculateFinancialHealth, SIX_JARS, type FinancialHealthEvaluation } from '@/lib/financial-frameworks';
import { VietQrModal } from '@/components/modals/VietQrModal';
import { SmartSmsImportModal } from '@/components/modals/SmartSmsImportModal';
import { FinancialHealthModal } from '@/components/modals/FinancialHealthModal';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';

const BREAKDOWN_COLORS = ['#171717', '#444444', '#777777', '#999999', '#bbbbbb', '#0070f3', '#10b981'];

type TrendRange = '7d' | '30d' | '3m';
const TREND_DAYS: Record<TrendRange, number> = { '7d': 7, '30d': 30, '3m': 90 };

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [piggies, setPiggies] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TrendRange>('7d');
  
  // Modals state
  const [vietQrOpen, setVietQrOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [createTxOpen, setCreateTxOpen] = useState(false);
  
  const { start: rangeStart, end: rangeEnd } = useDateRange();
  const start = startOfDayIso(rangeStart);
  const end = endOfDayIso(rangeEnd);

  const countdowns = getUpcomingFinancialEvents(5);

  const loadData = async (manual = false) => {
    try {
      setLoading(true);
      const [sumRes, txRes, piggyRes, accRes]: any[] = await Promise.all([
        api.get(`/statistics/summary?startDate=${start}&endDate=${end}`).catch(() => ({ data: null })),
        api.get('/transactions?page=1&pageSize=6').catch(() => ({ data: [] })),
        api.get('/piggy-banks').catch(() => ({ data: [] })),
        api.get('/accounts?type=Asset&active=true').catch(() => ({ data: [] }))
      ]);
      setSummary(sumRes.data);
      setRecentTx(txRes.data || []);
      setPiggies(piggyRes.data || []);
      setAccounts(accRes.data || []);
      if (manual) toast.success('Đã làm mới dữ liệu!');
    } catch {
      toast.error('Không thể tải dữ liệu từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrend = async (range: TrendRange) => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - TREND_DAYS[range] + 1);
    try {
      const res: any = await api.get(`/statistics/cashflow-trend?startDate=${startOfDayIso(toDateInput(from))}&endDate=${endOfDayIso(toDateInput(today))}`);
      setTrend(res.data || []);
    } catch {
      setTrend([]);
    }
  };

  useEffect(() => { loadData(); }, [rangeStart, rangeEnd]);
  useEffect(() => { loadTrend(timeRange); }, [timeRange]);

  const handleExportCSV = async () => {
    try {
      const res: any = await api.get(`/transactions?page=1&pageSize=1000&startDate=${start}&endDate=${end}`);
      const rows = (res.data || []).map((t: any) => ({
        'Mô tả': t.description,
        'Danh mục': t.category?.name || 'Chưa phân loại',
        'Ví': walletOf(t)?.name || '',
        'Loại': t.transactionType === 'Deposit' ? 'Thu nhập (+)' : t.transactionType === 'Withdrawal' ? 'Chi tiêu (-)' : 'Chuyển khoản nội bộ',
        'Số tiền (VND)': t.transactionType === 'Withdrawal' ? -t.amount : t.amount,
        'Thời gian': formatDate(t.date),
        'Ghi chú': t.notes || ''
      }));
      if (rows.length === 0) {
        toast.info('Không có giao dịch nào trong khoảng thời gian này để xuất.');
        return;
      }
      exportToCSV('sao-ke-giao-dich-pfm.csv', rows);
      toast.success('Đã xuất tập tin CSV chuẩn UTF-8 thành công!');
    } catch {
      toast.error('Không thể xuất dữ liệu giao dịch.');
    }
  };

  const kpi = summary?.kpi;
  const categoryBreakdown: any[] = summary?.categoryBreakdown || [];
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.fullName ? user.fullName.split(' ').pop() : '';

  const totalIncome = kpi?.totalIncome || 0;
  const totalExpense = kpi?.totalExpense || 0;
  const netCashflow = kpi?.netCashflow || 0;
  const currentNetWorth = kpi?.currentNetWorth || 0;
  const savingRate = totalIncome > 0 ? (netCashflow / totalIncome) * 100 : 0;

  const healthEvaluation: FinancialHealthEvaluation = calculateFinancialHealth({
    monthlyIncome: totalIncome,
    monthlyExpense: totalExpense,
    totalNetWorth: currentNetWorth,
    totalDebts: 0,
    budgetStatusCount: { within: 3, warning: 0, overspent: 0 }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-100 dark:bg-zinc-900 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg shadow-border bg-[#fafafa] dark:bg-[#0a0a0a] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-lg shadow-border bg-[#fafafa] dark:bg-[#0a0a0a] animate-pulse" />
          <div className="h-72 rounded-lg shadow-border bg-[#fafafa] dark:bg-[#0a0a0a] animate-pulse" />
        </div>
      </div>
    );
  }

  const topGold = LIVE_GOLD_RATES[0];
  const topUsd = LIVE_FX_RATES[0];

  return (
    <div className="space-y-6">
      {/* Top Vietnam Market Live Ticker Strip */}
      <div className="p-3 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#171717] dark:text-[#ededed]">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            Thị trường VN:
          </span>

          <div className="flex items-center gap-1.5 text-[#666666] dark:text-[#888888]">
            <span className="text-[#171717] dark:text-[#ededed] font-medium">SJC Mua vào:</span>
            <span className="tabular-nums font-semibold text-[#171717] dark:text-[#ededed]">{formatCurrency(topGold.buyPrice)}</span>
            <span className="text-[11px]">/ lượng</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#666666] dark:text-[#888888]">
            <span className="text-[#171717] dark:text-[#ededed] font-medium">USD/VND:</span>
            <span className="tabular-nums font-semibold text-[#171717] dark:text-[#ededed]">{topUsd.sell.toLocaleString('vi-VN')} ₫</span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[#666666] dark:text-[#888888] text-[11px]">
            <span>Lương: <strong className="text-[#171717] dark:text-[#ededed] tabular-nums">{countdowns.daysToSalary} ngày</strong></span>
            <span>•</span>
            <span>Tết: <strong className="text-[#171717] dark:text-[#ededed] tabular-nums">{countdowns.daysToTet} ngày</strong></span>
          </div>
        </div>

        <a
          href="/utilities"
          className="text-xs font-medium text-[#0070f3] hover:underline flex items-center gap-1"
        >
          <span>Xem chi tiết tỷ giá & vàng</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Bảng tổng quan{userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
            Kỳ hạch toán {formatDate(rangeStart)} – {formatDate(rangeEnd)}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => setVietQrOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#171717] dark:text-[#ededed] shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] px-3 py-1.5 rounded-md" 
          >
            <QrCode className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>VietQR</span>
          </button>

          <button 
            type="button"
            onClick={() => setSmsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#171717] dark:text-[#ededed] shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] px-3 py-1.5 rounded-md" 
          >
            <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Quét SMS</span>
          </button>

          <button 
            onClick={() => { loadData(true); loadTrend(timeRange); }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#171717] dark:text-[#ededed] shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] px-3 py-1.5 rounded-md" 
            type="button"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#888888]" />
            <span>Làm mới</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium text-[#171717] dark:text-[#ededed] shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] px-3 py-1.5 rounded-md" 
            type="button"
          >
            <Download className="w-3.5 h-3.5 text-[#888888]" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (Shadow-as-border) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Thu nhập */}
        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium">Tổng thu nhập</span>
            <div className="w-6 h-6 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border flex items-center justify-center text-[#10b981]">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed] tabular-nums">
              {formatCurrency(totalIncome)}
            </div>
            <div className="mt-1 text-[11px] text-[#888888]">
              Trong khoảng thời gian đã chọn
            </div>
          </div>
        </div>

        {/* Card 2: Tổng Chi tiêu */}
        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium">Tổng chi tiêu</span>
            <div className="w-6 h-6 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border flex items-center justify-center text-[#ff5b4f]">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed] tabular-nums">
              {formatCurrency(totalExpense)}
            </div>
            <div className="mt-1 text-[11px] text-[#888888]">
              Trong khoảng thời gian đã chọn
            </div>
          </div>
        </div>

        {/* Card 3: Dòng tiền ròng */}
        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium">Dòng tiền ròng</span>
            <div className="w-6 h-6 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border flex items-center justify-center text-[#0070f3]">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-semibold tracking-tight tabular-nums ${netCashflow >= 0 ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
              {netCashflow > 0 ? '+' : ''}{formatCurrency(netCashflow)}
            </div>
            <div className="mt-1 text-[11px] text-[#666666] dark:text-[#888888]">
              Tỷ lệ tích lũy: <span className="font-medium text-[#171717] dark:text-[#ededed] tabular-nums">{savingRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Tổng Tài sản ròng */}
        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium">Tổng tài sản ròng</span>
            <div className="w-6 h-6 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border flex items-center justify-center text-[#171717] dark:text-[#ededed]">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed] tabular-nums">
              {formatCurrency(currentNetWorth)}
            </div>
            <div className="mt-1 text-[11px] text-[#888888]">
              {accounts.length} ví & tài khoản hoạt động
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Charts & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Flow Trend Chart Card */}
          <div className="rounded-lg shadow-card p-5 bg-[#ffffff] dark:bg-[#0a0a0a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                  Biểu đồ dòng tiền
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">Biến động thu nhập và chi tiêu</p>
              </div>

              {/* Segmented Control */}
              <div className="flex items-center p-0.5 bg-[#fafafa] dark:bg-[#111111] shadow-border rounded-md self-start sm:self-auto">
                <button 
                  onClick={() => setTimeRange('7d')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${timeRange === '7d' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
                >
                  7 ngày
                </button>
                <button 
                  onClick={() => setTimeRange('30d')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${timeRange === '30d' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
                >
                  30 ngày
                </button>
                <button 
                  onClick={() => setTimeRange('3m')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${timeRange === '3m' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
                >
                  3 tháng
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-4 pb-1 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-[#171717] dark:text-[#ededed] text-xs font-medium">Thu nhập</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff5b4f]"></span>
                  <span className="text-[#171717] dark:text-[#ededed] text-xs font-medium">Chi tiêu</span>
                </div>
              </div>
              <span className="text-[#888888] text-[11px]">Đơn vị: VNĐ</span>
            </div>

            {/* Chart Area */}
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.12)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888888' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}Tr`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      borderColor: 'var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(v: any, name: any) => [formatCurrency(Number(v) || 0), name === 'income' ? 'Thu nhập' : 'Chi tiêu']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={1.5} name="income" />
                  <Area type="monotone" dataKey="expense" stroke="#ff5b4f" fill="#ff5b4f" fillOpacity={0.08} strokeWidth={1.5} name="expense" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions Table Card */}
          <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">
                  Giao dịch gần đây
                </h3>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">Sổ nhật ký thu chi mới nhất</p>
              </div>
              <a href="/transactions" className="text-xs font-medium text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] flex items-center gap-1 transition-colors">
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafa] dark:bg-[#111111] text-[#888888] text-[11px] font-medium border-b border-zinc-100 dark:border-zinc-900">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Mô tả</th>
                    <th className="px-4 py-2.5 font-medium">Danh mục</th>
                    <th className="px-4 py-2.5 font-medium">Tài khoản</th>
                    <th className="px-4 py-2.5 font-medium">Ngày</th>
                    <th className="px-5 py-2.5 font-medium text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-[#171717] dark:text-[#ededed]">
                  {recentTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-xs text-[#888888]">Chưa có giao dịch nào…</td>
                    </tr>
                  ) : recentTx.map(t => {
                    const isIncome = t.transactionType === 'Deposit';
                    const isExpense = t.transactionType === 'Withdrawal';
                    return (
                      <tr key={t.id} className="hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-medium text-[#171717] dark:text-[#ededed] block">{t.description}</span>
                          {t.notes && <span className="text-[11px] text-[#888888]">{t.notes}</span>}
                        </td>
                        <td className="px-4 py-3">
                          {t.category?.name && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#171717] dark:text-[#ededed] shadow-border">
                              {t.category.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#666666] dark:text-[#888888]">{walletOf(t)?.name}</td>
                        <td className="px-4 py-3 text-[#888888] tabular-nums">{formatDate(t.date)}</td>
                        <td className={`px-5 py-3 text-right font-medium tabular-nums ${isIncome ? 'text-[#10b981]' : 'text-[#171717] dark:text-[#ededed]'}`}>
                          {isIncome ? '+' : isExpense ? '−' : ''}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Structure, Saving Goals & Accounts */}
        <div className="space-y-6">
          {/* Card: Cơ cấu Chi tiêu */}
          <div className="rounded-lg shadow-card p-5 bg-[#ffffff] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed]">Cơ cấu chi tiêu</h3>
                <p className="text-xs text-[#666666] dark:text-[#888888]">Tỷ lệ theo từng nhóm</p>
              </div>
              <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">{formatCurrency(totalExpense)}</span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <p className="mt-4 text-xs text-center text-[#888888]">Chưa có khoản chi nào trong kỳ này…</p>
            ) : (
              <div className="mt-4">
                {/* Segmented Monochrome / Restrained Bar */}
                <div className="h-2 w-full bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-full overflow-hidden flex gap-0.5 p-0.5">
                  {categoryBreakdown.map((c, i) => (
                    <div 
                      key={c.categoryId || i} 
                      className="rounded-xs h-full" 
                      style={{ width: `${c.percentage}%`, backgroundColor: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }} 
                      title={`${c.categoryName} (${Number(c.percentage).toFixed(0)}%)`}
                    />
                  ))}
                </div>

                {/* Detailed list breakdown */}
                <div className="mt-4 space-y-2">
                  {categoryBreakdown.map((c, i) => (
                    <div key={c.categoryId || i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }}></span>
                        <span className="text-[#171717] dark:text-[#ededed] font-medium">{c.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#888888] tabular-nums">{formatCurrency(c.amount)}</span>
                        <span className="font-semibold text-[#171717] dark:text-[#ededed] tabular-nums w-8 text-right">{Number(c.percentage).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card: 6 Chiếc Hũ Phân Bổ Tiền */}
          <div className="rounded-lg shadow-card p-5 bg-[#ffffff] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0070f3]" />
                Mô hình 6 Hũ (JARS)
              </h3>
              <a href="/frameworks" className="text-xs text-[#0070f3] hover:underline font-medium">Chi tiết</a>
            </div>

            <div className="mt-3.5 space-y-2">
              {SIX_JARS.slice(0, 4).map(j => {
                const jarBudget = (totalIncome > 0 ? totalIncome : 15000000) * (j.percentage / 100);
                return (
                  <div key={j.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                    <div className="flex items-center gap-2">
                      <span>{j.icon}</span>
                      <span className="font-medium text-[#171717] dark:text-[#ededed]">{j.name}</span>
                    </div>
                    <span className="font-medium text-[#171717] dark:text-[#ededed] tabular-nums">{formatCurrency(jarBudget)} ({j.percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Hũ Tiết kiệm & Mục tiêu */}
          <div className="rounded-lg shadow-card p-5 bg-[#ffffff] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#10b981]" />
                Mục tiêu tích lũy
              </h3>
              <a href="/piggy-banks" className="text-xs text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors font-medium">+ Thêm</a>
            </div>

            <div className="mt-4 space-y-3.5">
              {piggies.length === 0 ? (
                <p className="text-xs text-center text-[#888888]">Chưa có mục tiêu tiết kiệm nào…</p>
              ) : piggies.slice(0, 3).map(p => {
                const pct = Math.min(100, p.percentageCompleted || 0);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-[#171717] dark:text-[#ededed]">{p.name}</span>
                      <span className="font-medium text-[11px] text-[#10b981] tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Ví & Tài khoản Ngân hàng */}
          <div className="rounded-lg shadow-card p-5 bg-[#ffffff] dark:bg-[#0a0a0a]">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#888888]" />
                Tài khoản & Ví
              </h3>
              <span className="text-[11px] text-[#888888] tabular-nums">{accounts.length} nguồn tiền</span>
            </div>

            <div className="mt-3.5 space-y-2">
              {accounts.length === 0 ? (
                <p className="text-xs text-center text-[#888888]">Chưa có tài khoản nào…</p>
              ) : accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-2.5 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                  <div>
                    <span className="text-xs font-medium text-[#171717] dark:text-[#ededed] block">{a.name}</span>
                    {a.metadata?.bank_name && <span className="text-[11px] text-[#888888]">{a.metadata.bank_name}</span>}
                  </div>
                  <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">{formatCurrency(a.currentBalance || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <VietQrModal open={vietQrOpen} onClose={() => setVietQrOpen(false)} />
      <SmartSmsImportModal open={smsModalOpen} onClose={() => setSmsModalOpen(false)} onApplyParsed={() => setCreateTxOpen(true)} />
      <FinancialHealthModal open={healthModalOpen} onClose={() => setHealthModalOpen(false)} evaluation={healthEvaluation} />
      <CreateTransactionModal open={createTxOpen} onClose={() => setCreateTxOpen(false)} onSuccess={() => loadData(true)} />
    </div>
  );
};
