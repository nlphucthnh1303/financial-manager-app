import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, startOfDayIso, endOfDayIso, toDateInput, walletOf } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DaySummary {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  income: number;
  expense: number;
  transactions: any[];
}

export const FinancialCalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DaySummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const loadMonthTransactions = async () => {
    try {
      setLoading(true);
      const start = startOfDayIso(toDateInput(firstDayOfMonth));
      const end = endOfDayIso(toDateInput(lastDayOfMonth));
      const res: any = await api.get(`/transactions?page=1&pageSize=500&startDate=${start}&endDate=${end}`);
      setTransactions(res.data || []);
    } catch {
      toast.error('Không thể tải dữ liệu lịch thu chi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthTransactions();
  }, [year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const firstDayWeekday = firstDayOfMonth.getDay();
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const days: DaySummary[] = [];
  const todayStr = toDateInput(new Date());

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = toDateInput(prevDate);
    days.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      income: 0,
      expense: 0,
      transactions: []
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = toDateInput(curDate);
    
    const dayTxs = transactions.filter(t => {
      const tDate = t.date ? t.date.split('T')[0] : '';
      return tDate === dateStr;
    });

    const inc = dayTxs
      .filter(t => t.transactionType === 'Deposit')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const exp = dayTxs
      .filter(t => t.transactionType === 'Withdrawal')
      .reduce((s, t) => s + (t.amount || 0), 0);

    days.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      income: inc,
      expense: exp,
      transactions: dayTxs
    });
  }

  // Next month padding days
  const remainingSlots = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remainingSlots; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = toDateInput(nextDate);
    days.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      income: 0,
      expense: 0,
      transactions: []
    });
  }

  const totalMonthIncome = transactions
    .filter(t => t.transactionType === 'Deposit')
    .reduce((s, t) => s + (t.amount || 0), 0);
  const totalMonthExpense = transactions
    .filter(t => t.transactionType === 'Withdrawal')
    .reduce((s, t) => s + (t.amount || 0), 0);
  const netMonthCashflow = totalMonthIncome - totalMonthExpense;
  const avgDailyExpense = totalMonthExpense / Math.max(1, new Date().getDate());

  const WEEKDAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Lịch thu chi tài chính
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
            Dòng tiền chi tiết từng ngày trong tháng {month + 1}/{year}
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs shadow-border border-0">
            Hôm nay
          </Button>
          <div className="flex items-center bg-[#ffffff] dark:bg-[#0a0a0a] shadow-border rounded-md p-0.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors rounded"
              title="Tháng trước"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-3 text-[#171717] dark:text-[#ededed] tabular-nums">
              Tháng {month + 1}, {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors rounded"
              title="Tháng sau"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
          <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Tổng thu tháng {month + 1}</span>
          <div className="text-xl font-semibold text-[#10b981] tabular-nums mt-1">
            {formatCurrency(totalMonthIncome)}
          </div>
        </div>

        <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
          <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Tổng chi tháng {month + 1}</span>
          <div className="text-xl font-semibold text-[#ff5b4f] tabular-nums mt-1">
            {formatCurrency(totalMonthExpense)}
          </div>
        </div>

        <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
          <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Dòng tiền dư</span>
          <div className={`text-xl font-semibold tabular-nums mt-1 ${netMonthCashflow >= 0 ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
            {netMonthCashflow > 0 ? '+' : ''}{formatCurrency(netMonthCashflow)}
          </div>
        </div>

        <div className="p-4 rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a]">
          <span className="text-xs font-medium text-[#666666] dark:text-[#888888]">Trung bình chi / ngày</span>
          <div className="text-xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-1">
            {formatCurrency(avgDailyExpense)}
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-4 sm:p-6 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] font-medium text-[#888888] uppercase">
          {WEEKDAY_NAMES.map((name, i) => (
            <div key={i} className={`py-1.5 ${i === 0 || i === 6 ? 'text-[#ff5b4f]' : ''}`}>
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{name.replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}</span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, idx) => {
            const hasActivity = day.income > 0 || day.expense > 0;

            return (
              <div
                key={idx}
                onClick={() => day.isCurrentMonth && setSelectedDay(day)}
                className={`
                  min-h-[75px] sm:min-h-[100px] p-2 rounded-md shadow-border transition-colors flex flex-col justify-between select-none
                  ${day.isCurrentMonth ? 'cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#111111]' : 'opacity-25 bg-[#fafafa] dark:bg-[#050505]'}
                  ${day.isToday ? 'ring-1 ring-[#0070f3] bg-[#fafafa] dark:bg-[#111111]' : 'bg-[#ffffff] dark:bg-[#0a0a0a]'}
                `}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold rounded w-5 h-5 flex items-center justify-center tabular-nums ${day.isToday ? 'bg-[#171717] text-white dark:bg-[#ededed] dark:text-black' : 'text-[#171717] dark:text-[#ededed]'}`}>
                    {day.dayNum}
                  </span>

                  {day.isCurrentMonth && day.transactions.length > 0 && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#888888] font-medium tabular-nums">
                      {day.transactions.length} GD
                    </span>
                  )}
                </div>

                {/* Day In/Out Amounts */}
                {day.isCurrentMonth && hasActivity && (
                  <div className="space-y-0.5 mt-1">
                    {day.income > 0 && (
                      <div className="text-[10px] sm:text-[11px] font-medium text-[#10b981] tabular-nums truncate">
                        +{formatCurrency(day.income).replace(' ₫', 'đ')}
                      </div>
                    )}
                    {day.expense > 0 && (
                      <div className="text-[10px] sm:text-[11px] font-medium text-[#ff5b4f] tabular-nums truncate">
                        −{formatCurrency(day.expense).replace(' ₫', 'đ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty placeholder */}
                {day.isCurrentMonth && !hasActivity && (
                  <div className="text-[10px] text-zinc-300 dark:text-zinc-800 text-center py-1">
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDay && (
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="sm:max-w-lg bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">
                    Chi tiết giao dịch {formatDate(selectedDay.dateStr)}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#888888]">
                    {selectedDay.transactions.length} giao dịch được ghi nhận
                  </DialogDescription>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-[#171717] dark:bg-[#ededed] text-white dark:text-black shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm giao dịch</span>
                </button>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border text-xs">
                <div>
                  <span className="text-[11px] text-[#888888] block">TỔNG THU NHẬP</span>
                  <span className="font-semibold text-[#10b981] text-sm tabular-nums">
                    +{formatCurrency(selectedDay.income)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#888888] block">TỔNG CHI TIÊU</span>
                  <span className="font-semibold text-[#ff5b4f] text-sm tabular-nums">
                    −{formatCurrency(selectedDay.expense)}
                  </span>
                </div>
              </div>

              {selectedDay.transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#888888]">
                  Không có giao dịch nào vào ngày {formatDate(selectedDay.dateStr)}…
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedDay.transactions.map(t => {
                    const isIncome = t.transactionType === 'Deposit';
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-md shadow-border bg-[#ffffff] dark:bg-[#0a0a0a] flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-medium text-[#171717] dark:text-[#ededed] block">
                            {t.description}
                          </span>
                          <span className="text-[11px] text-[#888888]">
                            {t.category?.name || 'Chưa phân loại'} • {walletOf(t)?.name}
                          </span>
                        </div>
                        <span className={`font-semibold tabular-nums text-xs ${isIncome ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
                          {isIncome ? '+' : '−'}{formatCurrency(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadMonthTransactions();
          setSelectedDay(null);
        }}
      />
    </div>
  );
};
