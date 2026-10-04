import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { toast } from 'sonner';
import { formatDate, toDateInput } from '@/lib/utils';
import { check } from '@/lib/validation';

interface DateRangePickerProps {
  open: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

const presets = [
  { label: 'Tháng này', getRange: (now: Date) => ({ s: new Date(now.getFullYear(), now.getMonth(), 1), e: new Date(now.getFullYear(), now.getMonth() + 1, 0) }) },
  { label: 'Tháng trước', getRange: (now: Date) => ({ s: new Date(now.getFullYear(), now.getMonth() - 1, 1), e: new Date(now.getFullYear(), now.getMonth(), 0) }) },
  { label: '30 ngày qua', getRange: (now: Date) => ({ s: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29), e: now }) },
  { label: `Năm nay (${new Date().getFullYear()})`, getRange: (now: Date) => ({ s: new Date(now.getFullYear(), 0, 1), e: new Date(now.getFullYear(), 11, 31) }) },
];

export const DateRangePickerModal: React.FC<DateRangePickerProps> = ({ open, onClose, startDate, endDate, onChange }) => {
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [error, setError] = useState<string>();

  // Start from the range currently applied each time the dialog opens
  useEffect(() => {
    if (open) { setStart(startDate); setEnd(endDate); setError(undefined); }
  }, [open, startDate, endDate]);

  const handleApply = () => {
    const err = (!start || !end) ? 'Vui lòng chọn đủ ngày bắt đầu và kết thúc.' : check.dateOrder(start, end);
    setError(err);
    if (err) return;
    onChange(start, end);
    toast.success(`Đã áp dụng: ${formatDate(start)} – ${formatDate(end)}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="pr-8 space-y-1">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-[#171717] dark:text-[#ededed]">
            <div className="w-8 h-8 rounded-lg bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <span>Chọn khoảng thời gian</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-[#666666] dark:text-[#a1a1a1] mb-2 block">
              Mốc thời gian nhanh:
            </label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { const r = p.getRange(new Date()); setStart(toDateInput(r.s)); setEnd(toDateInput(r.e)); setError(undefined); }}
                  className="px-3 py-1.5 rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-xs font-medium text-[#171717] dark:text-[#ededed] bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] transition-all cursor-pointer active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Từ ngày</label>
              <DatePicker value={start} max={end || undefined} onChange={setStart} aria-invalid={!!error} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Đến ngày</label>
              <DatePicker value={end} min={start || undefined} onChange={setEnd} aria-invalid={!!error} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
            </div>
          </div>
          <FieldError message={error} />
        </div>

        <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] text-white hover:bg-[#333333] dark:bg-[#ededed] dark:text-black dark:hover:bg-[#ffffff] shadow-sm cursor-pointer"
          >
            Áp dụng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
