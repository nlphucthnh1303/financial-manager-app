import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { parseVietnameseBankNotification, type ParsedSmsResult } from '@/lib/vietnam-banks';
import { formatCurrency } from '@/lib/utils';
import { Sparkles, ArrowRight, Check, AlertCircle } from 'lucide-react';
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
    toast.success('Đã nạp dữ liệu từ tin nhắn SMS!');
    onClose();
  };

  const loadSample = (s: string) => {
    handleParse(s);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">Phân tích SMS biến động số dư</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
                Dán tin nhắn từ VCB, TCB, MB, MoMo… để tự động trích xuất thông tin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
              Nội dung tin nhắn SMS / Thông báo ngân hàng:
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => handleParse(e.target.value)}
              placeholder="SD TK 0071… +5,000,000VND luc 15:30. Ref: Cong ty tra luong…"
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626] text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#0070f3] font-mono leading-relaxed transition-all"
              autoFocus
            />
          </div>

          <div>
            <span className="text-xs font-medium text-[#666666] dark:text-[#a1a1a1] block mb-2">Mẫu tin nhắn thử nghiệm:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_SMS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadSample(sample.text)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] text-[#171717] dark:text-[#ededed] transition-all cursor-pointer active:scale-95"
                >
                  {sample.bank}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Result Preview */}
          {parsed ? (
            <div className="p-4 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#10b981] flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Nhận diện thành công
                </span>
                <span className="text-xs text-[#888888] tabular-nums">
                  Độ chính xác: {(parsed.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg border border-[#e5e5e5] dark:border-[#222222] bg-[#ffffff] dark:bg-[#0a0a0a]">
                  <span className="text-[10px] text-[#888888] font-medium uppercase block">LOẠI GIAO DỊCH</span>
                  <span className={`font-semibold mt-0.5 block ${parsed.type === 'Deposit' ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
                    {parsed.type === 'Deposit' ? 'Thu nhập (+)' : 'Chi tiêu (−)'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-[#e5e5e5] dark:border-[#222222] bg-[#ffffff] dark:bg-[#0a0a0a]">
                  <span className="text-[10px] text-[#888888] font-medium uppercase block">SỐ TIỀN NHẬN DIỆN</span>
                  <span className="font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5 block">
                    {formatCurrency(parsed.amount)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-[#e5e5e5] dark:border-[#222222] bg-[#ffffff] dark:bg-[#0a0a0a] col-span-2">
                  <span className="text-[10px] text-[#888888] font-medium uppercase block">MÔ TẢ GIAO DỊCH</span>
                  <span className="font-medium text-[#171717] dark:text-[#ededed] mt-0.5 block truncate">
                    {parsed.description}
                  </span>
                </div>
              </div>
            </div>
          ) : inputText.trim() ? (
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Chưa nhận diện được số tiền hoặc định dạng tin nhắn.</span>
            </div>
          ) : null}
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
            disabled={!parsed}
            onClick={handleApply}
            className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black hover:bg-[#333333] dark:hover:bg-white shadow-sm cursor-pointer inline-flex items-center"
          >
            <span>Điền vào biểu mẫu</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
