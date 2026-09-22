import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { endOfDayIso, formatCurrency, startOfDayIso } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { useDateRange } from '@/lib/date-range';
import { check } from '@/lib/validation';
import { toast } from 'sonner';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { RefreshCw } from 'lucide-react';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const SERIES_LABELS: Record<string, string> = { income: 'Thu nhập', expense: 'Chi tiêu' };

export const StatisticsPage: React.FC = () => {
  const { start, end, setRange } = useDateRange();
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [rangeError, setRangeError] = useState<string>();
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setDraftStart(start); setDraftEnd(end); }, [start, end]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const range = `startDate=${startOfDayIso(start)}&endDate=${endOfDayIso(end)}`;
      const [sumRes, trendRes, breakRes]: any[] = await Promise.all([
        api.get(`/statistics/summary?${range}`),
        api.get(`/statistics/cashflow-trend?${range}`),
        api.get(`/statistics/category-breakdown?${range}`)
      ]);
      setSummary(sumRes.data);
      setTrend(trendRes.data || []);
      setBreakdown(breakRes.data || []);
    } catch {
      toast.error('Không thể tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, [start, end]);

  const applyRange = () => {
    const err = (!draftStart || !draftEnd) ? 'Vui lòng chọn đủ ngày bắt đầu và kết thúc.' : check.dateOrder(draftStart, draftEnd);
    setRangeError(err);
    if (err) return;
    if (draftStart === start && draftEnd === end) loadStats();
    else setRange(draftStart, draftEnd);
  };

  const kpi = summary?.kpi;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Báo cáo & Thống kê</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Phân tích chi tiết tình hình tài chính cá nhân</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Input type="date" value={draftStart} max={draftEnd || undefined} onChange={e => setDraftStart(e.target.value)} aria-invalid={!!rangeError} className="h-8 text-xs w-36" />
            <span className="text-zinc-400 text-xs">→</span>
            <Input type="date" value={draftEnd} min={draftStart || undefined} onChange={e => setDraftEnd(e.target.value)} aria-invalid={!!rangeError} className="h-8 text-xs w-36" />
            <button
              type="button"
              onClick={applyRange}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Cập nhật</span>
            </button>
          </div>
          <FieldError message={rangeError} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">TỔNG THU NHẬP</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">{formatCurrency(kpi?.totalIncome || 0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">TỔNG CHI TIÊU</span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">{formatCurrency(kpi?.totalExpense || 0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">DÒNG TIỀN RÒNG</span>
          <div className={`text-xl font-bold tabular-nums mt-1 ${(kpi?.netCashflow || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>{formatCurrency(kpi?.netCashflow || 0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">TÀI SẢN RÒNG</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums mt-1">{formatCurrency(kpi?.currentNetWorth || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Biểu đồ xu hướng Thu/Chi</h2>
          {trend.length === 0 ? (
            <p className="h-60 flex items-center justify-center text-xs text-zinc-500">Không có giao dịch trong khoảng thời gian này.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v) || 0), SERIES_LABELS[name] || name]} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#sg1)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#sg2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Cơ cấu chi tiêu theo danh mục</h2>
          {breakdown.length === 0 ? (
            <p className="h-60 flex items-center justify-center text-center text-xs text-zinc-500">Chưa có khoản chi nào được gán danh mục.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={breakdown} dataKey="amount" nameKey="categoryName" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {breakdown.map((c, i) => <Cell key={c.categoryId} fill={c.color || COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v) || 0), name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {breakdown.map((c, i) => (
                  <div key={c.categoryId} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || COLORS[i % COLORS.length] }} />
                      {c.categoryName}
                    </span>
                    <span className="tabular-nums text-zinc-500">{formatCurrency(c.amount)} · {Number(c.percentage).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const CurrenciesPage: React.FC = () => {
  const [currencies, setCurrencies] = useState<any[]>([]);

  useEffect(() => {
    api.get('/currencies').then((res: any) => setCurrencies(res.data || [])).catch(() => toast.error('Không thể tải danh sách tiền tệ.'));
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Tiền tệ & Tỷ giá</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Quản lý đa tiền tệ trong ứng dụng</p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Danh sách Tiền tệ</h2>
        <div className="space-y-3">
          {currencies.map(c => (
            <div key={c.id} className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-900 dark:text-white text-xs">
                  {c.symbol || c.code}
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-zinc-900 dark:text-white">{c.code}</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{c.name}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.enabled ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                {c.enabled ? 'Đang hoạt động' : 'Tắt'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
