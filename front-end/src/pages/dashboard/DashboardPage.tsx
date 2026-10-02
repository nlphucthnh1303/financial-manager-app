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
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';

const BREAKDOWN_COLORS = ['#f59e0b', '#0ea5e9', '#6366f1', '#f43f5e', '#a1a1aa'];

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
  const { start: rangeStart, end: rangeEnd } = useDateRange();
  const start = startOfDayIso(rangeStart);
  const end = endOfDayIso(rangeEnd);

  const loadData = async (manual = false) => {
    try {
      setLoading(true);
      const [sumRes, txRes, piggyRes, accRes]: any[] = await Promise.all([
        api.get(`/statistics/summary?startDate=${start}&endDate=${end}`),
        api.get('/transactions?page=1&pageSize=5'),
        api.get('/piggy-banks'),
        api.get('/accounts?type=Asset&active=true')
      ]);
      setSummary(sumRes.data);
      setRecentTx(txRes.data || []);
      setPiggies(piggyRes.data || []);
      setAccounts(accRes.data || []);
      if (manual) toast.success('Đã cập nhật dữ liệu bảng tổng quan mới nhất!');
    } catch {
      toast.error('Không thể tải dữ liệu từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // The trend chart has its own window (last 7/30/90 days up to today)
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
        'Danh mục': t.category?.name || '',
        'Ví': walletOf(t)?.name || '',
        'Loại': t.transactionType === 'Deposit' ? 'Thu nhập' : t.transactionType === 'Withdrawal' ? 'Chi tiêu' : 'Chuyển khoản',
        'Số tiền (VND)': t.transactionType === 'Withdrawal' ? -t.amount : t.amount,
        'Thời gian': formatDate(t.date)
      }));
      if (rows.length === 0) {
        toast.info('Không có giao dịch nào trong khoảng thời gian này để xuất.');
        return;
      }
      exportToCSV('danh-sach-giao-dich.csv', rows);
      toast.success('Đã xuất tập tin CSV thành công!');
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

  return (
    <div className="space-y-6">
      {/* Greeting & Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Xin chào{userName ? `, ${userName}` : ''} 👋
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Tổng quan tài chính {formatDate(rangeStart)} – {formatDate(rangeEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Stat Cards Grid */}
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
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400">Trong kỳ đã chọn</span>
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
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400">Trong kỳ đã chọn</span>
            </div>
          </div>
        </div>

        {/* Card 3: Dòng tiền ròng */}
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
              <span className="text-zinc-500 dark:text-zinc-400">Tỷ lệ tiết kiệm:</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">{savingRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Tài sản ròng */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tài sản ròng</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
              {formatCurrency(currentNetWorth)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400">Tổng tài sản {accounts.length} tài khoản</span>
            </div>
          </div>
        </div>
      </section>

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
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">5 giao dịch mới nhất được hạch toán</p>
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
                    <th className="px-4 py-3 font-semibold">Ví / Tài khoản</th>
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
                            <span className="font-medium text-zinc-900 dark:text-white block">{t.description}</span>
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
                        <td className={`px-6 py-3.5 text-right font-semibold text-xs tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
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
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Tỷ lệ theo từng nhóm chi tiêu</p>
              </div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(totalExpense)}</span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <p className="mt-4 text-xs text-center text-zinc-500 dark:text-zinc-400">Chưa có khoản chi nào được gán danh mục trong kỳ này.</p>
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
                        <span className="font-semibold text-zinc-900 dark:text-white text-xs w-8 text-right">{Number(c.percentage).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              ) : piggies.map(p => {
                const pct = Math.min(100, p.percentageCompleted || 0);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                      <span className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">{pct.toFixed(0)}% ({formatCurrency(p.currentAmount)} / {formatCurrency(p.targetAmount)})</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Ví & Tài khoản */}
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
                      <span className="text-xs font-medium text-zinc-900 dark:text-white block">{a.name}</span>
                      {a.metadata?.bankName && <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{a.metadata.bankName}</span>}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(a.currentBalance || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
