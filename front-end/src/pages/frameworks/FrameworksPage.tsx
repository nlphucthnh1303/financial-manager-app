import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SIX_JARS, RULE_50_30_20, type JarCategory } from '@/lib/financial-frameworks';
import { formatCurrency, currentMonthRange, startOfDayIso, endOfDayIso } from '@/lib/utils';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  PieChart as PieIcon, 
  Target, 
  ShieldCheck, 
  ArrowRight, 
  Info,
  Layers,
  Percent,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

export const FrameworksPage: React.FC = () => {
  const [method, setMethod] = useState<'jars' | '503020'>('jars');
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState('20000000'); // default 20M VND
  const [actualExpense, setActualExpense] = useState<number>(0);
  const [actualIncome, setActualIncome] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const { start, end } = currentMonthRange();

  useEffect(() => {
    const loadCurrentMonthData = async () => {
      try {
        setLoading(true);
        const res: any = await api.get(`/statistics/summary?startDate=${startOfDayIso(start)}&endDate=${endOfDayIso(end)}`);
        const kpi = res.data?.kpi;
        if (kpi) {
          if (kpi.totalIncome > 0) {
            setMonthlyIncomeInput(String(kpi.totalIncome));
            setActualIncome(kpi.totalIncome);
          }
          setActualExpense(kpi.totalExpense || 0);
        }
      } catch {
        // use default
      } finally {
        setLoading(false);
      }
    };
    loadCurrentMonthData();
  }, []);

  const income = Number(monthlyIncomeInput) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Phương Pháp Quản Lý Tài Chính
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              JARS & 50/30/20
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Ứng dụng các quy tắc tài chính kinh điển thế giới được tinh chỉnh tối ưu cho người Việt Nam.
          </p>
        </div>

        {/* Method Switcher */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMethod('jars')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${method === 'jars' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Quy tắc 6 Chiếc Hũ (JARS)</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('503020')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${method === '503020' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Quy tắc 50 / 30 / 20</span>
          </button>
        </div>
      </div>

      {/* Income Base Input Card */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
              Thu nhập hàng tháng dùng để phân bổ (VNĐ):
            </label>
            <div className="w-full sm:w-80">
              <MoneyInput
                value={monthlyIncomeInput}
                onValueChange={setMonthlyIncomeInput}
                className="text-lg font-bold tabular-nums"
                placeholder="VD: 20.000.000"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs sm:text-right">
            <span className="text-[10px] text-zinc-400 uppercase font-medium block">Chi tiêu thực tế tháng này</span>
            <span className="text-base font-bold text-zinc-900 dark:text-white tabular-nums block mt-0.5">
              {formatCurrency(actualExpense)}
            </span>
            <span className="text-[11px] text-zinc-500">
              Chiếm {income > 0 ? ((actualExpense / income) * 100).toFixed(0) : 0}% tổng thu nhập
            </span>
          </div>
        </div>
      </div>

      {/* 6 JARS VIEW */}
      {method === 'jars' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Phân bổ ngân sách theo 6 Chiếc Hũ (T. Harv Eker)
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Mỗi khi nhận lương hoặc có thu nhập mới, hãy chia ngay vào 6 hũ này trước khi tiêu xài.
              </p>
            </div>
          </div>

          {/* Jars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SIX_JARS.map(jar => {
              const allocated = income * (jar.percentage / 100);

              return (
                <div
                  key={jar.id}
                  className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-zinc-100 dark:bg-zinc-800">
                          {jar.icon}
                        </span>
                        <div>
                          <h3 className="font-semibold text-xs text-zinc-900 dark:text-white">
                            {jar.name}
                          </h3>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Hũ #{jar.code}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${jar.color}20`, color: jar.color }}>
                        {jar.percentage}%
                      </span>
                    </div>

                    {/* Allocated Amount */}
                    <div className="mt-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-medium block">NGÂN SÁCH GỢI Ý MỖI THÁNG</span>
                      <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-white mt-0.5">
                        {formatCurrency(allocated)}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-3 leading-relaxed">
                      {jar.description}
                    </p>

                    {/* Examples */}
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">Bao gồm:</span>
                      <ul className="space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {jar.examples.map((ex, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-zinc-400" />
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 50/30/20 VIEW */}
      {method === '503020' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                Quy tắc 50 / 30 / 20 (Elizabeth Warren)
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Phương pháp đơn giản nhất để cân bằng giữa sinh hoạt hiện tại và tích lũy tương lai.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Needs 50% */}
            <div className="p-5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/20 dark:bg-sky-950/10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🏠</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-300">
                    50% Thu nhập
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mt-3">
                  {RULE_50_30_20.needs.label}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {RULE_50_30_20.needs.desc}
                </p>

                <div className="mt-4 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-sky-100 dark:border-sky-900">
                  <span className="text-[10px] text-zinc-400 font-medium block">HẠN MỨC TỐI ĐA</span>
                  <span className="text-xl font-bold text-sky-700 dark:text-sky-300 tabular-nums mt-0.5 block">
                    {formatCurrency(income * 0.5)}
                  </span>
                </div>
              </div>
            </div>

            {/* Wants 30% */}
            <div className="p-5 rounded-xl border border-pink-200 dark:border-pink-900/60 bg-pink-50/20 dark:bg-pink-950/10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🍿</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-300">
                    30% Thu nhập
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mt-3">
                  {RULE_50_30_20.wants.label}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {RULE_50_30_20.wants.desc}
                </p>

                <div className="mt-4 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-pink-100 dark:border-pink-900">
                  <span className="text-[10px] text-zinc-400 font-medium block">HẠN MỨC TỐI ĐA</span>
                  <span className="text-xl font-bold text-pink-700 dark:text-pink-300 tabular-nums mt-0.5 block">
                    {formatCurrency(income * 0.3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Savings 20% */}
            <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">💰</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                    20% Thu nhập
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mt-3">
                  {RULE_50_30_20.savings.label}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  {RULE_50_30_20.savings.desc}
                </p>

                <div className="mt-4 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-emerald-100 dark:border-emerald-900">
                  <span className="text-[10px] text-zinc-400 font-medium block">MỤC TIÊU TÍCH LŨY</span>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5 block">
                    {formatCurrency(income * 0.2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
