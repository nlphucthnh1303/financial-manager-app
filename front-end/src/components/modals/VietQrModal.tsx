import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { VIETNAM_BANKS, generateVietQRUrl, numberToVietnameseWords } from '@/lib/vietnam-banks';
import { formatCurrency } from '@/lib/utils';
import { QrCode, Copy, Download, Share2, Check } from 'lucide-react';
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
  defaultBankBin = '970436', // Vietcombank default
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
    toast.success('Đã sao chép liên kết mã VietQR vào bộ nhớ tạm!');
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
    toast.success('Đang mở ảnh mã VietQR để lưu...');
  };

  const currentBank = VIETNAM_BANKS.find(b => b.bin === bankBin);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Tạo mã VietQR Napas247</DialogTitle>
              <DialogDescription className="text-xs">
                Mã chuyển nhanh 24/7 nhận tiền tức thì từ mọi ngân hàng và ví điện tử Việt Nam.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Bank selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Ngân hàng thụ hưởng</label>
              <select
                value={bankBin}
                onChange={e => setBankBin(e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs shadow-xs text-zinc-900 dark:text-white focus:outline-none"
              >
                {VIETNAM_BANKS.filter(b => b.bin).map(b => (
                  <option key={b.id} value={b.bin}>
                    {b.shortName} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Số tài khoản nhận *</label>
              <Input
                placeholder="VD: 0123456789"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Tên chủ tài khoản</label>
              <Input
                placeholder="VD: NGUYEN VAN A"
                value={accountName}
                onChange={e => setAccountName(e.target.value.toUpperCase())}
                className="h-9 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Số tiền (VNĐ - tùy chọn)</label>
              <MoneyInput
                placeholder="0 (Nhập tự do)"
                value={amount}
                onValueChange={setAmount}
                className="h-9 text-xs font-bold"
              />
            </div>
          </div>

          {numAmount > 0 && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              {numberToVietnameseWords(numAmount)}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Nội dung chuyển khoản</label>
            <Input
              placeholder="VD: Chuyen tien an trua, Tra no..."
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* QR Code Display Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center">
            {accountNumber ? (
              <div className="relative group">
                <img
                  src={qrUrl}
                  alt="Mã VietQR"
                  className="w-48 h-auto object-contain rounded-lg shadow-md bg-white p-2 border border-zinc-100 dark:border-zinc-700"
                />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-400">
                Nhập số tài khoản để tạo mã QR
              </div>
            )}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5">
              {currentBank?.shortName} • {accountNumber || 'Chưa nhập STK'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="text-xs">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Đã chép' : 'Sao chép link'}
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!accountNumber}
            size="sm"
            className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Tải mã QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
