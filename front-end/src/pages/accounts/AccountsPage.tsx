import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  RefreshCw, 
  ArrowLeftRight, 
  Pencil,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { check, collectErrors, type FormErrors } from '@/lib/validation';
import { toast } from 'sonner';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';

const labelCls = 'text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block';

const AccountFormModal: React.FC<{ open: boolean; editing: any | null; onClose: () => void; onSuccess: () => void }> = ({ open, editing, onClose, onSuccess }) => {
  const empty = { name: '', currencyId: '', openingBalance: '', includeInNetWorth: true, bankName: '', accountNumber: '', notes: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(editing ? {
      ...empty,
      name: editing.name,
      includeInNetWorth: editing.includeInNetWorth,
      bankName: editing.metadata?.bank_name || '',
      accountNumber: editing.metadata?.account_number || '',
    } : empty);
    if (!editing) {
      api.get('/currencies').then((res: any) => {
        const list = res.data || [];
        setCurrencies(list);
        const vnd = list.find((c: any) => c.code === 'VND') || list[0];
        if (vnd) setForm(f => ({ ...f, currencyId: vnd.id }));
      }).catch(() => {});
    }
  }, [open, editing]);

  const set = (field: keyof typeof empty, value: any) => setForm(f => ({ ...f, [field]: value }));

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

    try {
      setLoading(true);
      const common = { name: form.name.trim(), includeInNetWorth: form.includeInNetWorth, bankName: form.bankName.trim(), accountNumber: form.accountNumber.trim(), notes: form.notes };
      if (editing) {
        await api.put(`/accounts/${editing.id}`, { ...common, active: editing.active });
        toast.success('Đã cập nhật tài khoản.');
      } else {
        await api.post('/accounts', { ...common, currencyId: form.currencyId || null, openingBalance: Number(form.openingBalance) || 0 });
        toast.success('Tạo tài khoản mới thành công!');
      }
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu tài khoản.');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Sửa tài khoản / ví' : 'Thêm tài khoản / Ví mới'}</DialogTitle>
          <DialogDescription>{editing ? 'Cập nhật thông tin hiển thị của ví.' : 'Tạo ví tiền mặt hoặc tài khoản ngân hàng mới trong hệ thống.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 py-2">
          <div>
            <label className={labelCls}>Tên ví / tài khoản *</label>
            <Input placeholder="VD: Ví Tiền mặt, Thẻ MB Bank Digi" value={form.name} onChange={e => set('name', e.target.value)} aria-invalid={!!errors.name} maxLength={100} autoFocus />
            <FieldError message={errors.name} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tên ngân hàng / Đơn vị</label>
              <Input placeholder="MB Bank, Vietcombank..." value={form.bankName} onChange={e => set('bankName', e.target.value)} aria-invalid={!!errors.bankName} maxLength={100} />
              <FieldError message={errors.bankName} />
            </div>
            <div>
              <label className={labelCls}>Số tài khoản / Thẻ</label>
              <Input placeholder="0123456789" inputMode="numeric" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} aria-invalid={!!errors.accountNumber} maxLength={30} />
              <FieldError message={errors.accountNumber} />
            </div>
          </div>

          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Số dư ban đầu (VNĐ)</label>
                <MoneyInput placeholder="0" value={form.openingBalance} onValueChange={v => set('openingBalance', v)} aria-invalid={!!errors.openingBalance} />
                <FieldError message={errors.openingBalance} />
              </div>
              <div>
                <label className={labelCls}>Loại tiền tệ</label>
                <select
                  value={form.currencyId}
                  onChange={e => set('currencyId', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs shadow-xs text-zinc-900 dark:text-white focus:outline-none"
                >
                  {currencies.length > 0 ? currencies.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  )) : <option value="">VND - Việt Nam Đồng</option>}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="netWorth"
              checked={form.includeInNetWorth}
              onChange={e => set('includeInNetWorth', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <label htmlFor="netWorth" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Tính vào Tổng tài sản ròng</label>
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading} className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">{loading ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}</Button>
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

  const loadAccounts = async () => {
    try {
      setLoading(true);
      // Only the user's own wallets; expense/revenue/opening-balance accounts are bookkeeping internals
      const res: any = await api.get('/accounts?type=Asset');
      setAccounts(res.data || []);
    } catch {
      toast.error('Không thể kết nối danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleDelete = async () => {
    const acc = pendingDelete;
    if (!acc) return;
    try {
      // Soft delete: the wallet is hidden, its past transactions stay in the history
      await api.delete(`/accounts/${acc.id}`);
      toast.success(`Đã xóa "${acc.name}".`);
      setPendingDelete(null);
      loadAccounts();
    } catch (err: any) { toast.error(err?.message || 'Không thể xóa tài khoản.'); }
  };

  const openCreate = () => { setEditing(null); setShowAddModal(true); };
  const openEdit = (acc: any) => { setEditing(acc); setShowAddModal(true); };

  const totalNetWorth = accounts.filter(a => a.active && a.includeInNetWorth).reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  const activeCount = accounts.filter(a => a.active).length;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Ví & Tài khoản</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Quản lý dòng tiền, số dư thanh khoản từ Backend API</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={loadAccounts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition shadow-xs" 
            type="button"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition shadow-xs" 
            type="button"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-500" />
            <span>Chuyển quỹ nội bộ</span>
          </button>
          <button 
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs" 
            type="button"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Hero Net Worth Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">TỔNG TÀI SẢN RÒNG (NET WORTH)</span>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums mt-1">
              {formatCurrency(totalNetWorth)}
            </div>
            <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              Tổng số dư của {activeCount} ví đang hoạt động được tính vào tài sản ròng
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Danh sách Tài khoản & Ví thanh toán ({accounts.length})</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-44 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />)}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-3">
            <p className="text-xs text-zinc-500">Chưa có tài khoản nào. Hãy tạo ví tiền mặt hoặc tài khoản ngân hàng đầu tiên!</p>
            <Button size="sm" onClick={openCreate} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm tài khoản mới
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between group ${acc.active ? '' : 'opacity-60'}`}>
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {acc.currency?.code || 'VND'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">{acc.name}</h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {acc.metadata?.bank_name || 'Ví thanh toán'}
                          {acc.metadata?.account_number && ` · ••${acc.metadata.account_number.slice(-4)}`}
                        </p>
                        {!acc.active && <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Ngừng hoạt động</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openEdit(acc)} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition" title="Sửa tài khoản">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {acc.active && (
                        <button type="button" onClick={() => setPendingDelete(acc)} className="p-1 text-zinc-400 hover:text-rose-600 transition" title="Xóa tài khoản">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Số dư hiện tại:</span>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums mt-0.5">
                      {formatCurrency(acc.currentBalance || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button 
              onClick={openCreate}
              className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 p-5 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 hover:border-zinc-400 dark:hover:border-zinc-600 transition flex flex-col items-center justify-center text-center gap-2 min-h-[170px] group"
              type="button"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:scale-110 transition shadow-xs">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-white block">Thêm tài khoản mới</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Thêm ví tiền mặt hoặc ngân hàng</span>
              </div>
            </button>
          </div>
        )}
      </div>

      <AccountFormModal open={showAddModal} editing={editing} onClose={() => setShowAddModal(false)} onSuccess={loadAccounts} />
      <Dialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Xóa tài khoản</DialogTitle>
            <DialogDescription className="text-xs">
              Xóa "{pendingDelete?.name}"? Ví sẽ bị ẩn khỏi danh sách, các giao dịch cũ vẫn được giữ trong lịch sử.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setPendingDelete(null)}>Hủy</Button>
            <Button size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 text-white" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CreateTransactionModal open={showTransferModal} onClose={() => setShowTransferModal(false)} onSuccess={loadAccounts} defaultType="Transfer" />
    </div>
  );
};
