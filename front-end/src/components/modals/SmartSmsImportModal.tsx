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
      <DialogContent className="sm:max-w-lg bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border text-[#10b981] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Phân tích SMS biến động số dư</DialogTitle>
              <DialogDescription className="text-xs text-[#888888]">
                Dán tin nhắn từ VCB, TCB, MB, MoMo… để tự động trích xuất thông tin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          <div>
            <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">
              Nội dung tin nhắn SMS / Thông báo ngân hàng:
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => handleParse(e.target.value)}
              placeholder="SD TK 0071… +5,000,000VND luc 15:30. Ref: Cong ty tra luong…"
              className="w-full text-xs p-3 rounded-md shadow-input bg-[#fafafa] dark:bg-[#111111] text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none font-mono"
              autoFocus
            />
          </div>

          <div>
            <span className="text-[11px] text-[#888888] font-medium block mb-1.5">Mẫu tin nhắn thử nghiệm:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_SMS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadSample(sample.text)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded shadow-border bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] text-[#171717] dark:text-[#ededed] transition-colors"
                >
                  {sample.bank}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Result Preview */}
          {parsed ? (
            <div className="p-3.5 rounded-md shadow-border bg-[#fafafa] dark:bg-[#111111] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#10b981] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Nhận diện thành công
                </span>
                <span className="text-[10px] text-[#888888] tabular-nums">
                  Độ chính xác: {(parsed.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded shadow-border bg-[#ffffff] dark:bg-[#0a0a0a]">
                  <span className="text-[10px] text-[#888888] block">LOẠI GIAO DỊCH</span>
                  <span className={`font-semibold mt-0.5 block ${parsed.type === 'Deposit' ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
                    {parsed.type === 'Deposit' ? 'Thu nhập (+)' : 'Chi tiêu (−)'}
                  </span>
                </div>

                <div className="p-2 rounded shadow-border bg-[#ffffff] dark:bg-[#0a0a0a]">
                  <span className="text-[10px] text-[#888888] block">SỐ TIỀN NHẬN DIỆN</span>
                  <span className="font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5 block">
                    {formatCurrency(parsed.amount)}
                  </span>
                </div>

                <div className="p-2 rounded shadow-border bg-[#ffffff] dark:bg-[#0a0a0a] col-span-2">
                  <span className="text-[10px] text-[#888888] block">MÔ TẢ GIAO DỊCH</span>
                  <span className="font-medium text-[#171717] dark:text-[#ededed] mt-0.5 block truncate">
                    {parsed.description}
                  </span>
                </div>
              </div>
            </div>
          ) : inputText.trim() ? (
            <div className="p-3 rounded-md shadow-border bg-[#fafafa] dark:bg-[#111111] flex items-center gap-2 text-xs text-[#ff5b4f]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Chưa nhận diện được số tiền hoặc định dạng tin nhắn.</span>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs shadow-border">
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!parsed}
            onClick={handleApply}
            size="sm"
            className="text-xs bg-[#171717] dark:bg-[#ededed] text-white dark:text-black"
          >
            <span>Điền vào biểu mẫu</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
