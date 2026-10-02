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
  Banknote,
  ShoppingBag,
  Briefcase,
  QrCode,
  Sparkles,
  HeartPulse,
  Coins,
  CalendarDays,
  CalendarClock,
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

const BREAKDOWN_COLORS = ['#f59e0b', '#0ea5e9', '#6366f1', '#f43f5e', '#10b981', '#8b5cf6', '#a1a1aa'];

type TrendRange = '7d' | '30d' | '3m';
const TREND_DAYS: Record<TrendRange, number> = { '7d': 7, '30d': 30, '3m': 90 };

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [piggies, setPiggies] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
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
      const [sumRes, txRes, piggyRes, accRes, billRes]: any[] = await Promise.all([
        api.get(`/statistics/summary?startDate=${start}&endDate=${end}`).catch(() => ({ data: null })),
        api.get('/transactions?page=1&pageSize=6').catch(() => ({ data: [] })),
        api.get('/piggy-banks').catch(() => ({ data: [] })),
        api.get('/accounts?type=Asset&active=true').catch(() => ({ data: [] })),
        api.get('/bills').catch(() => ({ data: [] }))
      ]);
      setSummary(sumRes.data);
      setRecentTx(txRes.data || []);
      setPiggies(piggyRes.data || []);
      setAccounts(accRes.data || []);
      setBills(billRes.data || []);
      if (manual) toast.success('Đã làm mới dữ liệu bảng tổng quan!');
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

  // Financial health calculation
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
        <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-72 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  const topGold = LIVE_GOLD_RATES[0];
  const topUsd = LIVE_FX_RATES[0];

  return (
    <div className="space-y-6">
      {/* Top Vietnam Market Live Ticker Strip */}
      <div className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Thị trường VN:
          </span>

          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span className="text-amber-500 font-bold">🥇 SJC:</span>
            <span className="tabular-nums font-bold">{formatCurrency(topGold.buyPrice)}</span>
            <span className="text-[11px] text-zinc-400">/ lượng</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span className="text-sky-500 font-bold">💵 USD/VND:</span>
            <span className="tabular-nums font-bold">{topUsd.sell.toLocaleString('vi-VN')} đ</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-zinc-500">
            <CalendarClock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Lương: <strong>{countdowns.daysToSalary} ngày</strong></span>
            <span>• Tết: <strong>{countdowns.daysToTet} ngày</strong></span>
          </div>
        </div>

        <a
          href="/utilities"
          className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>Xem chi tiết tỷ giá & vàng</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* Greeting & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span>Xin chào{userName ? `, ${userName}` : ''}</span>
            <span className="text-lg">👋</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Báo cáo tài chính kỳ {formatDate(rangeStart)} – {formatDate(rangeEnd)}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => setVietQrOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-3 py-1.5 rounded-lg shadow-xs transition" 
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mã VietQR</span>
          </button>

          <button 
            type="button"
            onClick={() => setSmsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg shadow-xs transition" 
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quét SMS</span>
          </button>

          <button 
            onClick={() => { loadData(true); loadTrend(timeRange); }}
            className="flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg shadow-xs transition" 
            type="button"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Làm mới</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg shadow-xs transition" 
            type="button"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Thu nhập */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tổng Thu nhập</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
              {formatCurrency(totalIncome)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span>Trong kỳ đã chọn</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tổng Chi tiêu */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tổng Chi tiêu</span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
              {formatCurrency(totalExpense)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span>Trong kỳ đã chọn</span>
            </div>
          </div>
        </div>

        {/* Card 3: Dòng tiền ròng & Tỷ lệ tiết kiệm */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Dòng tiền ròng</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className={`text-2xl font-bold tracking-tight tabular-nums ${netCashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netCashflow > 0 ? '+' : ''}{formatCurrency(netCashflow)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <span className="text-zinc-500">Tỷ lệ tiết kiệm:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">{savingRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Tổng Tài sản ròng (Net Worth) */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tổng Tài sản ròng</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
              {formatCurrency(currentNetWorth)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
              <span>{accounts.length} ví & tài khoản ngân hàng</span>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Health Banner */}
      <div 
        onClick={() => setHealthModalOpen(true)}
        className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/80 via-sky-50/50 to-emerald-50/30 dark:from-emerald-950/30 dark:via-sky-950/20 dark:to-emerald-950/10 shadow-xs cursor-pointer hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-sm">
            {healthEvaluation.score}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-zinc-900 dark:text-white">
                Sức khỏe Tài chính: {healthEvaluation.rating} ({healthEvaluation.score}/100đ)
              </h3>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-semibold">
                Khám sức khỏe
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5">
              {healthEvaluation.summary}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          <span>Xem chi tiết & lời khuyên</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Charts & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Flow Trend Chart Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-zinc-500" />
                  Xu hướng Dòng tiền
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Thu nhập và chi tiêu theo thời gian</p>
              </div>
              {/* Segmented Control */}
              <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg self-start sm:self-auto">
                <button 
                  onClick={() => setTimeRange('7d')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${timeRange === '7d' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
                >
                  7 ngày
                </button>
                <button 
                  onClick={() => setTimeRange('30d')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${timeRange === '30d' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
                >
                  30 ngày
                </button>
                <button 
                  onClick={() => setTimeRange('3m')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${timeRange === '3m' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
                >
                  3 tháng
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-4 pb-1 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                  <span className="text-zinc-700 dark:text-zinc-300 text-xs font-medium">Thu nhập</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs"></span>
                  <span className="text-zinc-700 dark:text-zinc-300 text-xs font-medium">Chi tiêu</span>
                </div>
              </div>
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">Đơn vị: VNĐ</span>
            </div>

            {/* Chart Area */}
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-zinc-500" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} className="text-zinc-500" />
                  <Tooltip
                    formatter={(v: any, name: any) => [formatCurrency(Number(v) || 0), name === 'income' ? 'Thu nhập' : 'Chi tiêu']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} name="income" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} strokeWidth={2} name="expense" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions Table Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-zinc-500" />
                  Giao dịch gần đây
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Lịch sử hạch toán kế toán kép mới nhất</p>
              </div>
              <a href="/transactions" className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition group">
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 text-[10px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Mô tả</th>
                    <th className="px-4 py-3 font-semibold">Danh mục</th>
                    <th className="px-4 py-3 font-semibold">Ví / Ngân hàng</th>
                    <th className="px-4 py-3 font-semibold">Thời gian</th>
                    <th className="px-6 py-3 font-semibold text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {recentTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">Chưa có giao dịch nào.</td>
                    </tr>
                  ) : recentTx.map(t => {
                    const isIncome = t.transactionType === 'Deposit';
                    const isExpense = t.transactionType === 'Withdrawal';
                    return (
                      <tr key={t.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-3.5 flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${isIncome ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'}`}>
                            {isIncome ? <Briefcase className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-white block">{t.description}</span>
                            {t.notes && <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.notes}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {t.category?.name && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                              {t.category.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400 text-xs">{walletOf(t)?.name}</td>
                        <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-[11px]">{formatDate(t.date)}</td>
                        <td className={`px-6 py-3.5 text-right font-bold text-xs tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                          {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(t.amount)}
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
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Cơ cấu Chi tiêu</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Tỷ lệ theo từng nhóm chi</p>
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(totalExpense)}</span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <p className="mt-4 text-xs text-center text-zinc-500 dark:text-zinc-400">Chưa có khoản chi nào trong kỳ này.</p>
            ) : (
              <div className="mt-4">
                {/* Segmented Multi-color Bar */}
                <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-zinc-200/50 dark:border-zinc-700/50">
                  {categoryBreakdown.map((c, i) => (
                    <div key={c.categoryId || i} className="rounded-xs h-full" style={{ width: `${c.percentage}%`, backgroundColor: c.color || BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }} title={`${c.categoryName} (${Number(c.percentage).toFixed(0)}%)`}></div>
                  ))}
                </div>

                {/* Detailed list breakdown */}
                <div className="mt-4 space-y-2.5">
                  {categoryBreakdown.map((c, i) => (
                    <div key={c.categoryId || i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length] }}></span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{c.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums font-medium">{formatCurrency(c.amount)}</span>
                        <span className="font-bold text-zinc-900 dark:text-white text-xs w-8 text-right">{Number(c.percentage).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card: 6 Chiếc Hũ Phân Bổ Tiền */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Mô hình 6 Hũ (JARS)
              </h3>
              <a href="/frameworks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Chi tiết</a>
            </div>

            <div className="mt-3.5 space-y-2">
              {SIX_JARS.slice(0, 4).map(j => {
                const jarBudget = (totalIncome > 0 ? totalIncome : 15000000) * (j.percentage / 100);
                return (
                  <div key={j.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span>{j.icon}</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{j.name}</span>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(jarBudget)} ({j.percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Hũ Tiết kiệm & Mục tiêu */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Hũ Tiết kiệm & Mục tiêu
              </h3>
              <a href="/piggy-banks" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition font-medium">+ Thêm</a>
            </div>

            <div className="mt-4 space-y-4">
              {piggies.length === 0 ? (
                <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">Chưa có hũ tiết kiệm nào.</p>
              ) : piggies.slice(0, 3).map(p => {
                const pct = Math.min(100, p.percentageCompleted || 0);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                      <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">{pct.toFixed(0)}% ({formatCurrency(p.currentAmount)} / {formatCurrency(p.targetAmount)})</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Ví & Tài khoản Ngân hàng */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-500" />
                Ví & Tài khoản
              </h3>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{accounts.length} nguồn tiền</span>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {accounts.length === 0 ? (
                <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">Chưa có tài khoản nào.</p>
              ) : accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/60 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-xs text-zinc-600 dark:text-zinc-300 shadow-xs">
                      <Banknote className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white block">{a.name}</span>
                      {a.metadata?.bank_name && <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{a.metadata.bank_name}</span>}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(a.currentBalance || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals for Dashboard actions */}
      <VietQrModal open={vietQrOpen} onClose={() => setVietQrOpen(false)} />
      <SmartSmsImportModal open={smsModalOpen} onClose={() => setSmsModalOpen(false)} onApplyParsed={() => setCreateTxOpen(true)} />
      <FinancialHealthModal open={healthModalOpen} onClose={() => setHealthModalOpen(false)} evaluation={healthEvaluation} />
      <CreateTransactionModal open={createTxOpen} onClose={() => setCreateTxOpen(false)} onSuccess={() => loadData(true)} />
    </div>
  );
};
