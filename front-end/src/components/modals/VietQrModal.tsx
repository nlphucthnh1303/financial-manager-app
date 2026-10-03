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
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border text-[#0070f3] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Tạo mã VietQR Napas247</DialogTitle>
              <DialogDescription className="text-xs text-[#888888]">
                Mã chuyển nhanh 24/7 nhận tiền tức thì từ mọi ngân hàng VN.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">Ngân hàng</label>
              <Select value={bankBin} onValueChange={setBankBin}>
                <SelectTrigger className="shadow-input text-xs h-9">
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

            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">Số tài khoản *</label>
              <Input
                placeholder="0123456789…"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="shadow-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">Chủ tài khoản</label>
              <Input
                placeholder="NGUYEN VAN A…"
                value={accountName}
                onChange={e => setAccountName(e.target.value.toUpperCase())}
                className="shadow-input text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">Số tiền (VNĐ)</label>
              <MoneyInput
                placeholder="0 (Nhập tự do)…"
                value={amount}
                onValueChange={setAmount}
                className="shadow-input text-xs font-semibold"
              />
            </div>
          </div>

          {numAmount > 0 && (
            <div className="text-[11px] text-[#10b981] font-medium px-2.5 py-1 rounded bg-[#fafafa] dark:bg-[#111111] shadow-border">
              {numberToVietnameseWords(numAmount)}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block">Nội dung chuyển khoản</label>
            <Input
              placeholder="Chuyen tien an trua…"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="shadow-input text-xs"
            />
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] dark:bg-[#111111] rounded-lg shadow-border text-center">
            {accountNumber ? (
              <img
                src={qrUrl}
                alt="Mã VietQR"
                className="w-44 h-auto object-contain rounded-md shadow-sm bg-white p-2 border border-zinc-200/50"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-md text-xs text-[#888888]">
                Nhập số tài khoản để tạo mã QR
              </div>
            )}
            <p className="text-[11px] text-[#888888] mt-2">
              {currentBank?.shortName} • {accountNumber || 'Chưa nhập STK'}
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2 flex flex-row justify-end items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="text-xs shadow-border whitespace-nowrap min-h-[36px] px-3">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Đã chép' : 'Sao chép link'}
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!accountNumber}
            size="sm"
            className="text-xs bg-[#171717] dark:bg-[#ededed] text-white dark:text-black whitespace-nowrap min-h-[36px] px-3"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Tải mã QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
