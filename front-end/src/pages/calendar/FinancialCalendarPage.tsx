import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, startOfDayIso, endOfDayIso, toDateInput, walletOf } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DaySummary {
  dateStr: string; // YYYY-MM-DD
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
  const [addModalDate, setAddModalDate] = useState(toDateInput());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

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

  // Build calendar matrix (Sunday to Saturday)
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
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
    
    // Find transactions on this day
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

  // Next month padding days to complete 35 or 42 grid slots
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

  // Monthly stats
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Lịch Thu Chi Tài Chính
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Calendar View
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Theo dõi chi tiêu và thu nhập chi tiết theo từng ngày trong tháng {month + 1}/{year}
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">
            Hôm nay
          </Button>
          <div className="flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-md transition"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-3 text-zinc-900 dark:text-white">
              Tháng {month + 1}, {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-md transition"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">TỔNG THU THÁNG {month + 1}</span>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(totalMonthIncome)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">TỔNG CHI THÁNG {month + 1}</span>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1">
            {formatCurrency(totalMonthExpense)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">DÒNG TIỀN DƯ THÁNG</span>
          <div className={`text-lg font-bold tabular-nums mt-1 ${netMonthCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netMonthCashflow > 0 ? '+' : ''}{formatCurrency(netMonthCashflow)}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">TB CHI TIÊU / NGÀY</span>
          <div className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums mt-1">
            {formatCurrency(avgDailyExpense)}
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-xs overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          {WEEKDAY_NAMES.map((name, i) => (
            <div key={i} className={`py-2 ${i === 0 || i === 6 ? 'text-rose-500 font-bold' : ''}`}>
              <span className="hidden sm:inline">{name}</span>
              <span className="sm:hidden">{name.replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}</span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, idx) => {
            const hasActivity = day.income > 0 || day.expense > 0;
            const net = day.income - day.expense;

            return (
              <div
                key={idx}
                onClick={() => day.isCurrentMonth && setSelectedDay(day)}
                className={`
                  min-h-[75px] sm:min-h-[105px] p-1.5 sm:p-2.5 rounded-xl border transition flex flex-col justify-between select-none
                  ${day.isCurrentMonth ? 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600' : 'opacity-30 bg-zinc-50/50 dark:bg-zinc-900/30'}
                  ${day.isToday ? 'border-emerald-500/80 dark:border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-850/40'}
                `}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${day.isToday ? 'bg-emerald-600 text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {day.dayNum}
                  </span>

                  {day.isCurrentMonth && day.transactions.length > 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">
                      {day.transactions.length} GD
                    </span>
                  )}
                </div>

                {/* Day In/Out Amounts */}
                {day.isCurrentMonth && hasActivity && (
                  <div className="space-y-0.5 mt-1">
                    {day.income > 0 && (
                      <div className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                        +{formatCurrency(day.income).replace(' ₫', 'đ')}
                      </div>
                    )}
                    {day.expense > 0 && (
                      <div className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 tabular-nums truncate">
                        -{formatCurrency(day.expense).replace(' ₫', 'đ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty placeholder */}
                {day.isCurrentMonth && !hasActivity && (
                  <div className="text-[10px] text-zinc-300 dark:text-zinc-700 text-center py-1">
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-semibold">
                    Chi tiết giao dịch {formatDate(selectedDay.dateStr)}
                  </DialogTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {selectedDay.transactions.length} giao dịch được hạch toán
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAddModalDate(selectedDay.dateStr);
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm giao dịch ngày này</span>
                </button>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2">
              {/* Day KPI */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 font-medium block">TỔNG THU NHẬP</span>
                  <span className="font-bold text-emerald-600 text-sm tabular-nums">
                    +{formatCurrency(selectedDay.income)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-medium block">TỔNG CHI TIÊU</span>
                  <span className="font-bold text-rose-600 text-sm tabular-nums">
                    -{formatCurrency(selectedDay.expense)}
                  </span>
                </div>
              </div>

              {/* Transactions List */}
              {selectedDay.transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  Không có giao dịch nào vào ngày {formatDate(selectedDay.dateStr)}.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedDay.transactions.map(t => {
                    const isIncome = t.transactionType === 'Deposit';
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-white block">
                            {t.description}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {t.category?.name || 'Chưa phân loại'} • {walletOf(t)?.name}
                          </span>
                        </div>
                        <span className={`font-bold tabular-nums text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
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

      {/* Create Transaction Modal for the selected date */}
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
