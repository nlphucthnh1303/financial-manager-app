import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Sparkles, 
  Wallet, 
  Tag, 
  Calendar, 
  Check, 
  X, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight,
  Landmark,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, toDateInput } from '@/lib/utils';
import { localDb, type LocalAccount, type LocalCategory } from '@/lib/localDb';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { ParsedBankReceipt } from '@/lib/bank-receipt-parser';

interface ReceiptShareModalProps {
  open: boolean;
  onClose: () => void;
  parsed: ParsedBankReceipt | null;
  onSuccess?: () => void;
}

export const ReceiptShareModal: React.FC<ReceiptShareModalProps> = ({
  open,
  onClose,
  parsed,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [txType, setTxType] = useState<'Withdrawal' | 'Deposit' | 'Transfer'>('Withdrawal');
  const [date, setDate] = useState<string>(toDateInput());
  const [walletId, setWalletId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [wallets, setWallets] = useState<LocalAccount[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [showRawText, setShowRawText] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !parsed) return;

    setAmount(String(parsed.amount || ''));
    setDescription(parsed.description || `Giao dịch ${parsed.bankName}`);
    setTxType(parsed.transactionType || 'Withdrawal');
    setDate(parsed.date ? parsed.date.slice(0, 10) : toDateInput());
    setShowRawText(false);

    // Load wallets & categories from local DB
    Promise.all([localDb.getAccounts(), localDb.getCategories()]).then(([accs, cats]) => {
      setWallets(accs);
      setCategories(cats);

      // Auto-match wallet by bank name
      if (accs.length > 0) {
        const matched = accs.find((a) =>
          a.name.toLowerCase().includes(parsed.bankName.toLowerCase())
        );
        setWalletId(matched ? matched.id : accs[0].id);
      }

      // Default category
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
    });
  }, [open, parsed]);

  if (!parsed) return null;

  const handleSave = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Vui lòng kiểm tra lại số tiền hợp lệ.');
      return;
    }

    if (!description.trim()) {
      toast.error('Mô tả giao dịch không được để trống.');
      return;
    }

    const chosenWallet = wallets.find((w) => w.id === walletId);
    const chosenCategory = categories.find((c) => c.id === categoryId);
    const when = date === toDateInput() ? new Date() : new Date(`${date}T12:00:00`);

    const payload = {
      transactionType: txType,
      description: description.trim(),
      amount: numAmount,
      currencyCode: 'VND',
      date: when.toISOString(),
      sourceAccountId: walletId || 'local-acc-bank',
      sourceAccountName: chosenWallet?.name || parsed.bankName || 'Tài khoản Ngân hàng',
      destinationAccountId: null,
      destinationAccountName: parsed.counterparty || null,
      categoryId: categoryId || null,
      categoryName: chosenCategory?.name || null,
      notes: `[OCR ${parsed.bankName}] ${parsed.referenceCode ? 'Mã GD: ' + parsed.referenceCode : ''}`.trim(),
    };

    try {
      setLoading(true);
      // Try online API first
      const res: any = await api.post('/transactions', payload).catch(() => null);

      // Save to local database (offline-first)
      await localDb.addTransaction({
        ...payload,
        serverId: res?.data?.id || null,
      });

      if (res?.data?.id) {
        toast.success(`Đã lưu giao dịch ${formatCurrency(numAmount)} thành công!`);
      } else {
        toast.success(`Đã lưu ngoại tuyến ${formatCurrency(numAmount)} vào máy (Sẽ đồng bộ khi cắm cáp)!`);
      }

      onClose();
      onSuccess?.();
    } catch {
      await localDb.addTransaction({
        ...payload,
        serverId: null,
      });
      toast.success(`Đã lưu ngoại tuyến ${formatCurrency(numAmount)} vào máy!`);
      onClose();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0070f3]/10 text-[#0070f3]">
              <Landmark className="w-3.5 h-3.5" />
              <span>{parsed.bankName}</span>
            </div>
            <span className="text-xs text-[#888888]">Nhận diện thông minh OCR</span>
          </div>
          <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2 pt-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Biên lai chuyển khoản đã quét</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
            Thông tin đã được tự động trích xuất từ hình ảnh bạn vừa chia sẻ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount Box */}
          <div className="p-4 rounded-xl bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626] text-center">
            <span className="text-xs font-medium text-[#888888] block">Số tiền giao dịch</span>
            <div className="mt-1 flex items-center justify-center">
              <MoneyInput
                value={amount}
                onValueChange={setAmount}
                className="text-2xl sm:text-3xl font-bold text-center tracking-tight border-0 shadow-none focus-visible:ring-0 text-[#171717] dark:text-[#ededed] bg-transparent"
                placeholder="0 ₫"
              />
            </div>
            {Number(amount) > 0 && (
              <span className="text-xs font-semibold text-[#ff5b4f] dark:text-[#ff7066] mt-1 block">
                {formatCurrency(Number(amount))}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] block mb-1.5">
              Nội dung giao dịch
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Tiền ăn trưa, Mua sắm..."
              className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
            />
          </div>

          {/* Wallet and Category Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] block mb-1.5">
                Tài khoản / Ví
              </label>
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger className="h-10 w-full text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue placeholder="Chọn ví..." />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-xs sm:text-sm">
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] block mb-1.5">
                Danh mục chi tiêu
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-10 w-full text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue placeholder="Chọn danh mục..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs sm:text-sm">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] block mb-1.5">
              Ngày ghi nhận
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
            />
          </div>

          {/* Raw Text Preview Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="text-xs text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] inline-flex items-center gap-1.5 cursor-pointer"
            >
              {showRawText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showRawText ? 'Ẩn văn bản gốc quét được' : 'Xem chi tiết văn bản gốc'}</span>
            </button>
            {showRawText && (
              <pre className="mt-2 p-3 rounded-xl bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626] text-xs text-[#666666] dark:text-[#888888] whitespace-pre-wrap max-h-24 overflow-y-auto font-mono">
                {parsed.rawText}
              </pre>
            )}
          </div>
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
            onClick={handleSave}
            disabled={loading}
            className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] text-white hover:bg-[#333333] dark:bg-[#ededed] dark:text-black dark:hover:bg-white shadow-sm cursor-pointer"
          >
            {loading ? 'Đang lưu…' : 'Lưu vào Sổ giao dịch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
