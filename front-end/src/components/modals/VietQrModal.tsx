import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VIETNAM_BANKS, generateVietQRUrl, numberToVietnameseWords } from '@/lib/vietnam-banks';
import { QrCode, Copy, Download, Check } from 'lucide-react';
import { toast } from 'sonner';

interface VietQrModalProps {
  open: boolean;
  onClose: () => void;
  defaultBankBin?: string;
  defaultAccount?: string;
  defaultAccountName?: string;
  defaultAmount?: number;
  defaultMemo?: string;
}

export const VietQrModal: React.FC<VietQrModalProps> = ({
  open,
  onClose,
  defaultBankBin = '970436',
  defaultAccount = '',
  defaultAccountName = '',
  defaultAmount = 0,
  defaultMemo = 'Chuyen tien PFM'
}) => {
  const [bankBin, setBankBin] = useState(defaultBankBin);
  const [accountNumber, setAccountNumber] = useState(defaultAccount);
  const [accountName, setAccountName] = useState(defaultAccountName);
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [memo, setMemo] = useState(defaultMemo);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      if (defaultBankBin) setBankBin(defaultBankBin);
      if (defaultAccount) setAccountNumber(defaultAccount);
      if (defaultAccountName) setAccountName(defaultAccountName);
      if (defaultAmount) setAmount(String(defaultAmount));
      if (defaultMemo) setMemo(defaultMemo);
    }
  }, [open, defaultBankBin, defaultAccount, defaultAccountName, defaultAmount, defaultMemo]);

  const numAmount = Number(amount) || 0;
  const qrUrl = generateVietQRUrl({
    bankBin,
    accountNumber: accountNumber || '0123456789',
    accountName: accountName.toUpperCase(),
    amount: numAmount,
    memo: memo,
    template: 'compact2'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    toast.success('Đã sao chép liên kết mã VietQR!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.target = '_blank';
    link.download = `vietqr-${accountNumber || 'napas247'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đang mở mã VietQR để lưu…');
  };

  const currentBank = VIETNAM_BANKS.find(b => b.bin === bankBin);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle>Tạo mã VietQR Napas247</DialogTitle>
              <DialogDescription>
                Mã chuyển nhanh 24/7 nhận tiền tức thì từ mọi ứng dụng ngân hàng.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1]">Ngân hàng nhận</label>
              <Select value={bankBin} onValueChange={setBankBin}>
                <SelectTrigger className="h-10 text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue placeholder="Chọn ngân hàng..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {VIETNAM_BANKS.filter(b => b.bin).map(b => (
                    <SelectItem key={b.id} value={b.bin} className="text-xs">
                      {b.shortName} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1]">Số tài khoản *</label>
              <Input
                placeholder="0123456789…"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="h-10 text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1]">Chủ tài khoản (Không dấu)</label>
              <Input
                placeholder="NGUYEN VAN A…"
                value={accountName}
                onChange={e => setAccountName(e.target.value.toUpperCase())}
                className="h-10 text-sm font-medium rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1]">Số tiền (VNĐ)</label>
              <MoneyInput
                placeholder="0 (Nhập tự do)…"
                value={amount}
                onValueChange={setAmount}
                className="h-10 text-sm font-semibold rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
              />
            </div>
          </div>

          {numAmount > 0 && (
            <div className="text-[11px] text-[#10b981] font-medium px-3 py-1.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
              {numberToVietnameseWords(numAmount)}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1]">Nội dung chuyển khoản</label>
            <Input
              placeholder="Chuyen tien an trua…"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="h-10 text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
            />
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 bg-[#fafafa] dark:bg-[#111111] rounded-xl border border-[#e5e5e5] dark:border-[#262626] text-center">
            {accountNumber ? (
              <img
                src={qrUrl}
                alt="Mã VietQR"
                className="w-48 h-auto object-contain rounded-lg shadow-sm bg-white p-2.5 border border-zinc-200"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-[#888888]">
                Nhập số tài khoản để tạo mã QR
              </div>
            )}
            <p className="text-xs text-[#888888] font-medium mt-3">
              {currentBank?.shortName} • {accountNumber || 'Chưa nhập STK'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCopy} 
            className="h-10 px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 mr-1.5 text-[#10b981]" /> : <Copy className="w-4 h-4 mr-1.5" />}
            <span>{copied ? 'Đã chép link' : 'Sao chép link'}</span>
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!accountNumber}
            className="h-10 px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] text-white hover:bg-[#333333] dark:bg-[#ededed] dark:text-black dark:hover:bg-[#ffffff] shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>Tải mã QR</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
