import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  'aria-invalid'?: boolean;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Chọn ngày…',
  min,
  max,
  disabled = false,
  className,
  id,
  name,
  'aria-invalid': ariaInvalid,
}) => {
  const [open, setOpen] = useState(false);

  // Parse initial view month/year
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Format display string
  let displayValue = '';
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      displayValue = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  // Calculate calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday
  // We want Monday = 0, ..., Sunday = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: {
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isDisabled: boolean;
    isSelected: boolean;
    isToday: boolean;
  }[] = [];

  // Previous month overflow days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${prevYear}-${padZero(prevMonthIdx + 1)}-${padZero(day)}`;
    const isDis = Boolean((min && dateStr < min) || (max && dateStr > max));
    calendarDays.push({
      dayNumber: day,
      dateStr,
      isCurrentMonth: false,
      isDisabled: isDis,
      isSelected: value === dateStr,
      isToday: todayStr === dateStr,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(d)}`;
    const isDis = Boolean((min && dateStr < min) || (max && dateStr > max));
    calendarDays.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true,
      isDisabled: isDis,
      isSelected: value === dateStr,
      isToday: todayStr === dateStr,
    });
  }

  // Next month overflow days (to fill 35 or 42 grid slots)
  const remaining = 42 - calendarDays.length;
  if (remaining > 0 && remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextYear}-${padZero(nextMonthIdx + 1)}-${padZero(d)}`;
      const isDis = Boolean((min && dateStr < min) || (max && dateStr > max));
      calendarDays.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isDisabled: isDis,
        isSelected: value === dateStr,
        isToday: todayStr === dateStr,
      });
    }
  }

  const handleSelect = (dateStr: string) => {
    onChange(dateStr);
    setOpen(false);
  };

  const handleSetToday = () => {
    onChange(todayStr);
    setOpen(false);
  };

  const handleSetYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = `${y.getFullYear()}-${padZero(y.getMonth() + 1)}-${padZero(y.getDate())}`;
    onChange(yStr);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          className={cn(
            "group flex h-9 w-full items-center justify-between rounded-md bg-transparent px-3 py-1.5 text-base sm:text-sm text-[#171717] dark:text-[#ededed] shadow-input transition-all duration-150 ease-out active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-50 text-left",
            ariaInvalid && "shadow-none ring-1 ring-[#ff5b4f]",
            className
          )}
        >
          <span className={cn("truncate font-normal", !displayValue && "text-[#888888] dark:text-[#666666]")}>
            {displayValue ? (
              <span className="tabular-nums font-medium">{displayValue}</span>
            ) : (
              placeholder
            )}
          </span>
          <CalendarIcon className="w-4 h-4 text-[#888888] group-hover:text-[#171717] dark:group-hover:text-[#ededed] transition-colors shrink-0 ml-2" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3 bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0" align="start">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#f0f0f0] dark:border-[#1a1a1a]">
          <span className="font-semibold text-xs tracking-tight text-[#171717] dark:text-[#ededed]">
            Tháng {viewMonth + 1}, {viewYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-md text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#f4f4f5] dark:hover:bg-[#18181b] transition-colors"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-md text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#f4f4f5] dark:hover:bg-[#18181b] transition-colors"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Weekdays Row */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-[10px] font-semibold text-[#888888] py-1">
              {w}
            </span>
          ))}
        </div>

        {/* Calendar Grid Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.slice(0, 35).map((item, idx) => {
            const isCurrent = item.isCurrentMonth;
            const isSelected = item.isSelected;
            const isToday = item.isToday;

            return (
              <button
                key={`${item.dateStr}-${idx}`}
                type="button"
                disabled={item.isDisabled}
                onClick={() => handleSelect(item.dateStr)}
                className={cn(
                  "h-7 w-full rounded-md text-xs font-medium tabular-nums flex items-center justify-center transition-all duration-100 active:scale-90 relative",
                  !isCurrent && "text-zinc-300 dark:text-zinc-700",
                  isCurrent && !isSelected && "text-[#171717] dark:text-[#ededed] hover:bg-[#f4f4f5] dark:hover:bg-[#18181b]",
                  isSelected && "bg-[#171717] dark:bg-[#ededed] text-[#ffffff] dark:text-[#000000] font-semibold shadow-xs",
                  isToday && !isSelected && "ring-1 ring-inset ring-[#0070f3] text-[#0070f3] font-semibold",
                  item.isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent pointer-events-none"
                )}
              >
                {item.dayNumber}
              </button>
            );
          })}
        </div>

        {/* Quick Action Preset Footer */}
        <div className="mt-3 pt-2 border-t border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2 py-1 text-[11px] font-medium rounded-md text-[#171717] dark:text-[#ededed] bg-[#f4f4f5] dark:bg-[#18181b] hover:bg-[#e4e4e7] dark:hover:bg-[#27272a] transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleSetYesterday}
              className="px-2 py-1 text-[11px] font-medium rounded-md text-[#666666] dark:text-[#888888] hover:bg-[#f4f4f5] dark:hover:bg-[#18181b] transition-colors"
            >
              Hôm qua
            </button>
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-[11px] text-[#ff5b4f] hover:underline"
            >
              Xóa
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
