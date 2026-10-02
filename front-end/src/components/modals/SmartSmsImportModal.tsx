import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { parseVietnameseBankNotification, type ParsedSmsResult } from '@/lib/vietnam-banks';
import { formatCurrency } from '@/lib/utils';
import { Sparkles, ArrowRight, Check, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface SmartSmsImportModalProps {
  open: boolean;
  onClose: () => void;
  onApplyParsed: (result: ParsedSmsResult) => void;
}

const SAMPLE_SMS = [
  {
    bank: 'Vietcombank',
    text: 'SD TK 0071000123456 +5,000,000VND vao 14:30 02/10/2026. Ref: Cong ty ABC tra Luong thang 9/2026.'
  },
  {
    bank: 'Techcombank',
    text: 'GD: -45,000VND tai HIGHLANDS COFFEE qua The debit 4032********1234 luc 08:15 02/10/2026. So du: 12,450,000VND.'
  },
  {
    bank: 'MB Bank',
    text: 'TK 0888888888 -1,250,000VND luc 19:40 02/10/2026. ND: CK tien dien EVN va nuoc sinh hoat thang 9.'
  },
  {
    bank: 'Ví MoMo',
    text: 'Ban da thanh toan thanh cong 85.000d cho ShopeeFood - Tra sua Phuc Long. Ma GD: 091823712.'
  }
];

export const SmartSmsImportModal: React.FC<SmartSmsImportModalProps> = ({ open, onClose, onApplyParsed }) => {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParsedSmsResult | null>(null);

  const handleParse = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setParsed(null);
      return;
    }
    const res = parseVietnameseBankNotification(text);
    setParsed(res);
  };

  const handleApply = () => {
    if (!parsed) return;
    onApplyParsed(parsed);
    toast.success('Đã nạp dữ liệu giao dịch từ tin nhắn thành công!');
    onClose();
  };

  const loadSample = (s: string) => {
    handleParse(s);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Trình phân tích SMS & Biến động số dư</DialogTitle>
              <DialogDescription className="text-xs">
                Dán tin nhắn SMS Banking hoặc thông báo từ VCB, TCB, MB, MoMo... để tự động ghi chép.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Text Area Input */}
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
              Nội dung tin nhắn SMS / Thông báo ngân hàng:
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => handleParse(e.target.value)}
              placeholder="VD: SD TK 0071... +5,000,000VND luc 15:30. Ref: Cong ty tra luong..."
              className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              autoFocus
            />
          </div>

          {/* Sample quick buttons */}
          <div>
            <span className="text-[11px] text-zinc-500 font-medium block mb-1.5">Mẫu tin nhắn thử nghiệm nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_SMS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadSample(sample.text)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
                >
                  {sample.bank}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Result Preview */}
          {parsed ? (
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Phân tích thành công
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium">
                  Độ chính xác: {(parsed.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-emerald-100 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-medium block">LOẠI GIAO DỊCH</span>
                  <span className={`font-bold mt-0.5 block ${parsed.type === 'Deposit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {parsed.type === 'Deposit' ? 'Thu nhập (+)' : 'Chi tiêu (-)'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-emerald-100 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-medium block">SỐ TIỀN NHẬN DIỆN</span>
                  <span className="font-bold text-zinc-900 dark:text-white tabular-nums text-sm mt-0.5 block">
                    {formatCurrency(parsed.amount)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-emerald-100 dark:border-zinc-700 col-span-2">
                  <span className="text-[10px] text-zinc-400 font-medium block">MÔ TẢ GIAO DỊCH</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block truncate">
                    {parsed.description}
                  </span>
                </div>
              </div>
            </div>
          ) : inputText.trim() ? (
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Chưa nhận diện được số tiền hoặc định dạng ngân hàng. Vui lòng kiểm tra lại nội dung dán.</span>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!parsed}
            onClick={handleApply}
            size="sm"
            className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
          >
            <span>Điền vào biểu mẫu</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
