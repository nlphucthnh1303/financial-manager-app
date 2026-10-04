import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { localDb, type LocalAccount } from '@/lib/localDb';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  RefreshCw, 
  ArrowLeftRight, 
  Pencil, 
  Trash2, 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck,
  Building2,
  Wallet,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { check, collectErrors, type FormErrors } from '@/lib/validation';
import { VIETNAM_BANKS, numberToVietnameseWords, findBankByKeyword, type VietnamBank } from '@/lib/vietnam-banks';
import { BankSelector, BankLogoView } from '@/components/ui/bank-selector';
import { IconPicker, IconRenderer } from '@/components/ui/icon-picker';
import { VietQrModal } from '@/components/modals/VietQrModal';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';
import { toast } from 'sonner';

const labelCls = 'text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block';

const AccountFormModal: React.FC<{
  open: boolean;
  editing: any | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, editing, onClose, onSuccess }) => {
  const empty = {
    name: '',
    currencyId: '',
    openingBalance: '',
    includeInNetWorth: true,
    bankName: 'Vietcombank',
    bankCode: 'VCB',
    accountNumber: '',
    icon: 'Landmark',
    color: '#005a3c',
    notes: ''
  };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      const matched = findBankByKeyword(editing.metadata?.bank_name || editing.name);
      setForm({
        ...empty,
        name: editing.name,
        includeInNetWorth: editing.includeInNetWorth !== false,
        bankName: editing.metadata?.bank_name || matched?.shortName || 'Vietcombank',
        bankCode: editing.metadata?.bank_code || matched?.code || 'VCB',
        accountNumber: editing.metadata?.account_number || '',
        icon: editing.metadata?.icon || (matched?.type === 'wallet' ? 'Wallet' : 'Landmark'),
        color: editing.metadata?.color || matched?.color || '#005a3c',
        notes: editing.notes || ''
      });
    } else {
      setForm(empty);
      api.get('/currencies').then((res: any) => {
        const list = res.data || [];
        setCurrencies(list);
        const vnd = list.find((c: any) => c.code === 'VND') || list[0];
        if (vnd) setForm(f => ({ ...f, currencyId: vnd.id }));
      }).catch(() => {});
    }
  }, [open, editing]);

  const set = (field: keyof typeof empty, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleSelectBank = (bank: VietnamBank) => {
    setForm(f => ({
      ...f,
      bankName: bank.shortName,
      bankCode: bank.code,
      color: bank.color || f.color,
      icon: bank.type === 'wallet' ? 'Wallet' : bank.type === 'digital' ? 'Smartphone' : 'Landmark',
      name: f.name.trim() === '' || f.name.startsWith('Tài khoản') || f.name.startsWith('Ví')
        ? (bank.type === 'wallet' ? bank.shortName : `Tài khoản ${bank.shortName}`)
        : f.name
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = collectErrors({
      name: check.required(form.name, 'Vui lòng nhập tên tài khoản.') || check.length(form.name, 2, 100, 'Tên tài khoản'),
      bankName: check.maxLength(form.bankName, 100, 'Tên ngân hàng'),
      accountNumber: form.accountNumber.trim() && !/^[0-9 -]{4,30}$/.test(form.accountNumber.trim()) && 'Số tài khoản chỉ gồm 4–30 chữ số.',
      openingBalance: !editing && check.amount(form.openingBalance, 'Số dư ban đầu', { allowZero: true }),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    const common = { 
      name: form.name.trim(), 
      includeInNetWorth: form.includeInNetWorth, 
      bankName: form.bankName.trim(), 
      accountNumber: form.accountNumber.trim(), 
      notes: form.notes,
      metadata: {
        bank_name: form.bankName.trim(),
        bank_code: form.bankCode,
        account_number: form.accountNumber.trim(),
        icon: form.icon,
        color: form.color
      }
    };

    try {
      setLoading(true);
      if (editing) {
        try {
          await api.put(`/accounts/${editing.id}`, { ...common, active: editing.active });
        } catch {
          // Offline fallback
          await localDb.updateAccount(editing.id, {
            name: common.name,
            includeInNetWorth: common.includeInNetWorth,
            metadata: common.metadata
          });
        }
        toast.success('Đã cập nhật thông tin tài khoản.');
      } else {
        const openingNum = Number(form.openingBalance) || 0;
        try {
          const res: any = await api.post('/accounts', {
            ...common,
            currencyId: form.currencyId || null,
            openingBalance: openingNum
          });
          if (res.data?.id) {
            await localDb.saveAccounts([{
              id: res.data.id,
              name: common.name,
              accountType: 'Asset',
              currentBalance: openingNum,
              currencyCode: 'VND',
              active: true,
              includeInNetWorth: common.includeInNetWorth,
              metadata: common.metadata
            }]);
          }
        } catch {
          // Offline fallback
          await localDb.addAccount({
            name: common.name,
            accountType: 'Asset',
            currentBalance: openingNum,
            currencyCode: 'VND',
            active: true,
            includeInNetWorth: common.includeInNetWorth,
            metadata: common.metadata
          });
        }
        toast.success('Tạo tài khoản / ví mới thành công!');
      }
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const numOpening = Number(form.openingBalance) || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <span>{editing ? 'Sửa thông tin tài khoản' : 'Thêm tài khoản / Ví ngân hàng'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
            {editing ? 'Cập nhật logo, ngân hàng và thông tin hiển thị.' : 'Chọn ngân hàng hoặc ví điện tử Việt Nam để tạo nhanh.'}
          </DialogDescription>
        </DialogHeader>

        {/* Bank & E-Wallet Picker Selector */}
        <div className="space-y-1.5 pt-1">
          <label className={labelCls}>Chọn Ngân hàng / Ví điện tử</label>
          <BankSelector
            selectedCode={form.bankCode || form.bankName}
            onSelect={handleSelectBank}
          />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
          <div>
            <label className={labelCls}>Tên ví / Tài khoản hiển thị *</label>
            <Input 
              placeholder="Vietcombank Digibank, Ví MoMo…" 
              value={form.name} 
              onChange={e => set('name', e.target.value)} 
              aria-invalid={!!errors.name} 
              maxLength={100} 
              className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelCls}>Ngân hàng / Đơn vị</label>
              <Input 
                placeholder="Vietcombank, MB Bank…" 
                value={form.bankName} 
                onChange={e => set('bankName', e.target.value)} 
                aria-invalid={!!errors.bankName} 
                maxLength={100} 
                className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
              />
              <FieldError message={errors.bankName} />
            </div>

            <div>
              <label className={labelCls}>Số tài khoản (STK)</label>
              <Input 
                placeholder="0123456789…" 
                inputMode="numeric" 
                value={form.accountNumber} 
                onChange={e => set('accountNumber', e.target.value)} 
                aria-invalid={!!errors.accountNumber} 
                maxLength={30} 
                className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
              />
              <FieldError message={errors.accountNumber} />
            </div>
          </div>

          {/* Icon & Color Picker */}
          <div>
            <label className={labelCls}>Biểu tượng & Màu sắc nhận diện</label>
            <IconPicker
              value={form.icon}
              color={form.color}
              onChange={(icon, color) => {
                set('icon', icon);
                if (color) set('color', color);
              }}
            />
          </div>

          {!editing && (
            <div>
              <label className={labelCls}>Số dư ban đầu (VNĐ)</label>
              <MoneyInput 
                placeholder="0…" 
                value={form.openingBalance} 
                onValueChange={v => set('openingBalance', v)} 
                aria-invalid={!!errors.openingBalance} 
                className="h-10 font-semibold text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
              />
              <FieldError message={errors.openingBalance} />
              {numOpening > 0 && (
                <div className="mt-1 text-xs font-medium text-[#10b981]">
                  {numberToVietnameseWords(numOpening)}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="netWorth"
              checked={form.includeInNetWorth}
              onChange={e => set('includeInNetWorth', e.target.checked)}
              className="w-4 h-4 rounded border-[#e5e5e5] dark:border-[#262626] text-black focus:ring-0 cursor-pointer"
            />
            <label htmlFor="netWorth" className="text-xs text-[#171717] dark:text-[#ededed] cursor-pointer font-medium">
              Tính vào Tổng tài sản ròng (Net Worth)
            </label>
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
              type="submit"
              disabled={loading}
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black hover:bg-[#333333] dark:hover:bg-white shadow-sm cursor-pointer"
            >
              {loading ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [vietQrTarget, setVietQrTarget] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/accounts?type=Asset');
      const list = res.data || [];
      setAccounts(list);
      // Cache in LocalDB for offline use
      if (list.length > 0) {
        await localDb.saveAccounts(list.map((a: any) => ({
          id: a.id,
          name: a.name,
          accountType: a.accountType || 'Asset',
          currentBalance: a.currentBalance || 0,
          currencyCode: a.currencyCode || 'VND',
          active: a.active !== false,
          includeInNetWorth: a.includeInNetWorth !== false,
          metadata: a.metadata || {}
        })));
      }
    } catch {
      // Offline fallback: load from Local DB!
      const offlineList = await localDb.getAccounts();
      setAccounts(offlineList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleDelete = async () => {
    const acc = pendingDelete;
    if (!acc) return;
    try {
      await api.delete(`/accounts/${acc.id}`).catch(() => {});
      await localDb.deleteAccount(acc.id);
      toast.success(`Đã xóa "${acc.name}".`);
      setPendingDelete(null);
      loadAccounts();
    } catch (err: any) { 
      toast.error(err?.message || 'Không thể xóa tài khoản.'); 
    }
  };

  const handleCopyAccNumber = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    toast.success(`Đã sao chép số tài khoản: ${num}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCreate = () => { setEditing(null); setShowAddModal(true); };
  const openEdit = (acc: any) => { setEditing(acc); setShowAddModal(true); };

  const totalNetWorth = accounts.filter(a => a.active && a.includeInNetWorth !== false).reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  const activeCount = accounts.filter(a => a.active !== false).length;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Tài khoản & Thẻ ngân hàng
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
            Quản lý số dư, logo ngân hàng Việt Nam và tạo mã VietQR Napas247 từng thẻ
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button 
            onClick={loadAccounts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]" 
            type="button"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#888888] ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]" 
            type="button"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#888888]" />
            <span>Chuyển tiền</span>
          </button>
          <button 
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium shadow-sm transition-colors duration-150" 
            type="button"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Hero Net Worth Card */}
      <div className="rounded-lg shadow-card p-6 bg-[#ffffff] dark:bg-[#0a0a0a]">
        <span className="text-xs font-medium text-[#666666] dark:text-[#888888] uppercase tracking-wider block">
          Tổng tài sản ròng (Net Worth)
        </span>
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums mt-1 text-[#171717] dark:text-[#ededed]">
          {formatCurrency(totalNetWorth)}
        </div>
        <div className="mt-2 text-xs text-[#888888] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Tổng số dư từ {activeCount} tài khoản & ví thanh toán đang hoạt động</span>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">
            Danh sách tài khoản ({accounts.length})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-lg shadow-border bg-[#fafafa] dark:bg-[#0a0a0a]" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 shadow-card rounded-lg bg-[#ffffff] dark:bg-[#0a0a0a] text-center space-y-3">
            <p className="text-xs text-[#888888]">Chưa có tài khoản nào. Hãy thêm ví tiền mặt hoặc ngân hàng đầu tiên!</p>
            <Button size="sm" onClick={openCreate} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm tài khoản mới
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => {
              const matchedBank = findBankByKeyword(acc.metadata?.bank_code || acc.metadata?.bank_name || acc.name);
              const bankName = acc.metadata?.bank_name || matchedBank?.shortName || 'Ví thanh toán';
              const accNum = acc.metadata?.account_number;
              const cardColor = acc.metadata?.color || matchedBank?.color || '#171717';

              return (
                <div
                  key={acc.id}
                  className={`rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-4 flex flex-col justify-between hover:shadow-card-hover transition-shadow ${acc.active !== false ? '' : 'opacity-60'}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {matchedBank ? (
                          <BankLogoView bank={matchedBank} size="md" />
                        ) : (
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: `${cardColor}20`, color: cardColor }}
                          >
                            <IconRenderer name={acc.metadata?.icon || 'Wallet'} color={cardColor} size={16} className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-xs text-[#171717] dark:text-[#ededed] truncate">{acc.name}</h3>
                          <span className="text-[11px] text-[#888888] block truncate">
                            {bankName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setVietQrTarget({
                            bankBin: matchedBank?.bin || '970436',
                            accountNumber: accNum || '',
                            accountName: acc.name
                          })}
                          className="p-1 text-[#0070f3] hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded transition-colors"
                          title="Tạo mã VietQR"
                          aria-label="Tạo mã VietQR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => openEdit(acc)} 
                          className="p-1 text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors rounded" 
                          title="Sửa tài khoản"
                          aria-label="Sửa tài khoản"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setPendingDelete(acc)} 
                          className="p-1 text-[#888888] hover:text-[#ff5b4f] transition-colors rounded" 
                          title="Xóa tài khoản"
                          aria-label="Xóa tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {accNum && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="text-[#888888] font-mono text-[11px] bg-[#fafafa] dark:bg-[#111111] px-2 py-0.5 rounded shadow-border">
                          {accNum}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAccNumber(acc.id, accNum)}
                          className="text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
                          title="Sao chép số tài khoản"
                          aria-label="Sao chép số tài khoản"
                        >
                          {copiedId === acc.id ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                      <span className="text-[10px] uppercase tracking-wider text-[#888888] block">Số dư hiện tại</span>
                      <div className="text-xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums mt-0.5">
                        {formatCurrency(acc.currentBalance || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <button 
              onClick={openCreate}
              className="rounded-lg shadow-border bg-[#fafafa] dark:bg-[#0a0a0a] p-5 hover:bg-[#f5f5f5] dark:hover:bg-[#111111] transition-colors flex flex-col items-center justify-center text-center gap-2 min-h-[140px]"
              type="button"
            >
              <div className="w-8 h-8 rounded-full bg-[#ffffff] dark:bg-[#1a1a1a] shadow-border flex items-center justify-center text-[#888888]">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-[#171717] dark:text-[#ededed]">Thêm tài khoản mới</span>
            </button>
          </div>
        )}
      </div>

      <AccountFormModal open={showAddModal} editing={editing} onClose={() => setShowAddModal(false)} onSuccess={loadAccounts} />
      
      {/* Delete confirmation */}
      <Dialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 pb-1">
            <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">Xóa tài khoản</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
              Bạn có chắc chắn muốn xóa "{pendingDelete?.name}"? Tài khoản sẽ bị xóa khỏi danh sách, các giao dịch cũ vẫn được lưu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              className="h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateTransactionModal open={showTransferModal} onClose={() => setShowTransferModal(false)} onSuccess={loadAccounts} defaultType="Transfer" />

      {/* VietQR Quick Generator */}
      {vietQrTarget && (
        <VietQrModal
          open={!!vietQrTarget}
          onClose={() => setVietQrTarget(null)}
          defaultBankBin={vietQrTarget.bankBin}
          defaultAccount={vietQrTarget.accountNumber}
          defaultAccountName={vietQrTarget.accountName}
        />
      )}
    </div>
  );
};
