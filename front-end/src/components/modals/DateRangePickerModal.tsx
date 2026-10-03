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
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-base font-semibold flex items-center gap-2 text-[#171717] dark:text-[#ededed]">
            <CalendarIcon className="w-4 h-4 text-[#0070f3]" />
            Chọn khoảng thời gian
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => { const r = p.getRange(new Date()); setStart(toDateInput(r.s)); setEnd(toDateInput(r.e)); setError(undefined); }}
                className="px-2.5 py-1.5 rounded-md shadow-border text-xs font-medium text-[#171717] dark:text-[#ededed] bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] transition-all duration-150 active:scale-95"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">Từ ngày</label>
              <DatePicker value={start} max={end || undefined} onChange={setStart} aria-invalid={!!error} className="h-9 text-xs shadow-input" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">Đến ngày</label>
              <DatePicker value={end} min={start || undefined} onChange={setEnd} aria-invalid={!!error} className="h-9 text-xs shadow-input" />
            </div>
          </div>
          <FieldError message={error} />
        </div>

        <DialogFooter className="pt-3 flex flex-row items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-3 text-xs shadow-border">Hủy</Button>
          <Button size="sm" onClick={handleApply} className="h-8 px-4 text-xs bg-[#171717] dark:bg-[#ededed] text-white dark:text-black">Áp dụng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
