import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SIX_JARS, RULE_50_30_20 } from '@/lib/financial-frameworks';
import { formatCurrency, currentMonthRange, startOfDayIso, endOfDayIso } from '@/lib/utils';
import { MoneyInput } from '@/components/ui/money-input';
import { 
  Layers,
  Percent
} from 'lucide-react';

import { localDb } from '@/lib/localDb';

export const FrameworksPage: React.FC = () => {
  const [method, setMethod] = useState<'jars' | '503020'>('jars');
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState('20000000');
  const [actualExpense, setActualExpense] = useState<number>(0);

  const { start, end } = currentMonthRange();

  useEffect(() => {
    const loadCurrentMonthData = async () => {
      try {
        const res: any = await api.get(`/statistics/summary?startDate=${startOfDayIso(start)}&endDate=${endOfDayIso(end)}`);
        const kpi = res.data?.kpi;
        if (kpi) {
          if (kpi.totalIncome > 0) {
            setMonthlyIncomeInput(String(kpi.totalIncome));
          }
          setActualExpense(kpi.totalExpense || 0);
        }
      } catch {
        const offlineStats = await localDb.computeOfflineStats(startOfDayIso(start), endOfDayIso(end));
        if (offlineStats.income > 0) {
          setMonthlyIncomeInput(String(offlineStats.income));
        }
        setActualExpense(offlineStats.expense || 0);
      }
    };
    loadCurrentMonthData();
  }, []);

  const income = Number(monthlyIncomeInput) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Phương pháp quản lý tài chính
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
            Mô hình phân bổ dòng tiền 6 chiếc hũ (JARS) và quy tắc 50/30/20
          </p>
        </div>

        {/* Method Switcher */}
        <div className="flex items-center p-0.5 bg-[#fafafa] dark:bg-[#111111] shadow-border rounded-md self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMethod('jars')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${method === 'jars' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
          >
            <Layers className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>6 Chiếc Hũ (JARS)</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('503020')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${method === '503020' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
          >
            <Percent className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Quy tắc 50 / 30 / 20</span>
          </button>
        </div>
      </div>

      {/* Income Base Input Card */}
      <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] block mb-1.5">
              Thu nhập hàng tháng dùng để tính toán (VNĐ)
            </label>
            <div className="w-full sm:w-80">
              <MoneyInput
                value={monthlyIncomeInput}
                onValueChange={setMonthlyIncomeInput}
                className="text-base font-semibold tabular-nums shadow-input"
                placeholder="20.000.000…"
              />
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border text-xs sm:text-right">
            <span className="text-[11px] text-[#888888] block">Chi tiêu thực tế tháng này</span>
            <span className="text-base font-semibold text-[#171717] dark:text-[#ededed] tabular-nums block mt-0.5">
              {formatCurrency(actualExpense)}
            </span>
            <span className="text-[11px] text-[#666666] dark:text-[#888888]">
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
              <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0070f3]" />
                Phân bổ ngân sách 6 chiếc hũ (T. Harv Eker)
              </h2>
              <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
                Chia nhỏ thu nhập ngay khi nhận tiền để kiểm soát toàn diện chi tiêu và đầu tư
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
                  className="p-5 rounded-lg shadow-card-hover bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-md flex items-center justify-center text-base bg-[#fafafa] dark:bg-[#111111] shadow-border">
                          {jar.icon}
                        </span>
                        <div>
                          <h3 className="font-semibold text-xs text-[#171717] dark:text-[#ededed]">
                            {jar.name}
                          </h3>
                          <span className="text-[10px] text-[#888888]">
                            Hũ #{jar.code}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-semibold px-2 py-0.5 rounded shadow-border bg-[#fafafa] dark:bg-[#111111] text-[#171717] dark:text-[#ededed]">
                        {jar.percentage}%
                      </span>
                    </div>

                    <div className="mt-4 p-3 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                      <span className="text-[10px] text-[#888888] block">HẠN MỨC DỰ KIẾN</span>
                      <div className="text-lg font-semibold tabular-nums text-[#171717] dark:text-[#ededed] mt-0.5">
                        {formatCurrency(allocated)}
                      </div>
                    </div>

                    <p className="text-xs text-[#666666] dark:text-[#888888] mt-3 leading-relaxed">
                      {jar.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                      <span className="text-[10px] text-[#888888] uppercase block mb-1">Bao gồm:</span>
                      <ul className="space-y-1 text-[11px] text-[#666666] dark:text-[#888888]">
                        {jar.examples.map((ex, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#888888]" />
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
              <h2 className="text-sm font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#10b981]" />
                Quy tắc 50 / 30 / 20 (Elizabeth Warren)
              </h2>
              <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
                Cân đối giữa nhu cầu thiết yếu, mong muốn cá nhân và tích lũy dài hạn
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Needs 50% */}
            <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">🏠</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded shadow-border bg-[#fafafa] dark:bg-[#111111] text-[#171717] dark:text-[#ededed]">
                    50% Thu nhập
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[#171717] dark:text-[#ededed] mt-3">
                  {RULE_50_30_20.needs.label}
                </h3>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">
                  {RULE_50_30_20.needs.desc}
                </p>

                <div className="mt-4 p-3 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                  <span className="text-[10px] text-[#888888] block">HẠN MỨC TỐI ĐA</span>
                  <span className="text-xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5 block">
                    {formatCurrency(income * 0.5)}
                  </span>
                </div>
              </div>
            </div>

            {/* Wants 30% */}
            <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">🍿</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded shadow-border bg-[#fafafa] dark:bg-[#111111] text-[#171717] dark:text-[#ededed]">
                    30% Thu nhập
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[#171717] dark:text-[#ededed] mt-3">
                  {RULE_50_30_20.wants.label}
                </h3>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">
                  {RULE_50_30_20.wants.desc}
                </p>

                <div className="mt-4 p-3 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                  <span className="text-[10px] text-[#888888] block">HẠN MỨC TỐI ĐA</span>
                  <span className="text-xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5 block">
                    {formatCurrency(income * 0.3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Savings 20% */}
            <div className="p-5 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">💰</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded shadow-border bg-[#fafafa] dark:bg-[#111111] text-[#10b981]">
                    20% Thu nhập
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[#171717] dark:text-[#ededed] mt-3">
                  {RULE_50_30_20.savings.label}
                </h3>
                <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">
                  {RULE_50_30_20.savings.desc}
                </p>

                <div className="mt-4 p-3 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                  <span className="text-[10px] text-[#888888] block">MỤC TIÊU TÍCH LŨY</span>
                  <span className="text-xl font-semibold text-[#10b981] tabular-nums mt-0.5 block">
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
