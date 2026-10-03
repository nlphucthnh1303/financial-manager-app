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

const COLORS = ['#0070f3', '#10b981', '#f59e0b', '#ff5b4f', '#7928ca', '#06b6d4', '#de1d8d'];
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
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Báo cáo & Thống kê</h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">Phân tích chi tiết tình hình tài chính cá nhân</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Input type="date" value={draftStart} max={draftEnd || undefined} onChange={e => setDraftStart(e.target.value)} aria-invalid={!!rangeError} className="h-8 text-xs w-36 shadow-input" />
            <span className="text-[#888888] text-xs">→</span>
            <Input type="date" value={draftEnd} min={draftStart || undefined} onChange={e => setDraftEnd(e.target.value)} aria-invalid={!!rangeError} className="h-8 text-xs w-36 shadow-input" />
            <button
              type="button"
              onClick={applyRange}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#888888] ${loading ? 'animate-spin' : ''}`} />
              <span>Cập nhật</span>
            </button>
          </div>
          <FieldError message={rangeError} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-4">
          <span className="text-[11px] font-semibold uppercase text-[#888888]">TỔNG THU NHẬP</span>
          <div className="text-2xl font-semibold text-[#10b981] tabular-nums tracking-tight mt-1">{formatCurrency(kpi?.totalIncome || 0)}</div>
        </div>
        <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-4">
          <span className="text-[11px] font-semibold uppercase text-[#888888]">TỔNG CHI TIÊU</span>
          <div className="text-2xl font-semibold text-[#ff5b4f] tabular-nums tracking-tight mt-1">{formatCurrency(kpi?.totalExpense || 0)}</div>
        </div>
        <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-4">
          <span className="text-[11px] font-semibold uppercase text-[#888888]">DÒNG TIỀN RÒNG</span>
          <div className={`text-2xl font-semibold tabular-nums tracking-tight mt-1 ${(kpi?.netCashflow || 0) < 0 ? 'text-[#ff5b4f]' : 'text-[#0070f3]'}`}>{formatCurrency(kpi?.netCashflow || 0)}</div>
        </div>
        <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-4">
          <span className="text-[11px] font-semibold uppercase text-[#888888]">TÀI SẢN RÒNG</span>
          <div className="text-2xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums tracking-tight mt-1">{formatCurrency(kpi?.currentNetWorth || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5">
          <h2 className="text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-4">Biểu đồ xu hướng Thu/Chi</h2>
          {trend.length === 0 ? (
            <p className="h-60 flex items-center justify-center text-xs text-[#888888]">Không có giao dịch trong khoảng thời gian này.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff5b4f" stopOpacity={0.2} /><stop offset="95%" stopColor="#ff5b4f" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-900" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v) || 0), SERIES_LABELS[name] || name]} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#sg1)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#ff5b4f" fill="url(#sg2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5">
          <h2 className="text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-4">Cơ cấu chi tiêu theo danh mục</h2>
          {breakdown.length === 0 ? (
            <p className="h-60 flex items-center justify-center text-center text-xs text-[#888888]">Chưa có khoản chi nào được gán danh mục.</p>
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
                    <span className="flex items-center gap-2 text-[#171717] dark:text-[#ededed]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || COLORS[i % COLORS.length] }} />
                      {c.categoryName}
                    </span>
                    <span className="tabular-nums text-[#888888]">{formatCurrency(c.amount)} · {Number(c.percentage).toFixed(0)}%</span>
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
        <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Tiền tệ & Tỷ giá</h1>
        <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">Quản lý đa tiền tệ trong ứng dụng</p>
      </div>

      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5">
        <h2 className="text-xs font-semibold text-[#171717] dark:text-[#ededed] mb-4">Danh sách Tiền tệ</h2>
        <div className="space-y-3">
          {currencies.map(c => (
            <div key={c.id} className="p-3.5 rounded-lg shadow-border bg-[#fafafa] dark:bg-[#111111] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#ffffff] dark:bg-[#161616] shadow-border flex items-center justify-center font-semibold text-[#171717] dark:text-[#ededed] text-xs">
                  {c.symbol || c.code}
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-[#171717] dark:text-[#ededed]">{c.code}</h3>
                  <p className="text-[11px] text-[#888888]">{c.name}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${c.enabled ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-zinc-100 dark:bg-zinc-800 text-[#888888]'}`}>
                {c.enabled ? 'Đang hoạt động' : 'Tắt'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
