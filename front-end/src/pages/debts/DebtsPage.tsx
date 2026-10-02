import React, { useState, useEffect } from 'react';
import { 
  getDebts, 
  addDebt, 
  addPaymentToDebt, 
  deleteDebt, 
  generatePoliteReminderMessage, 
  type DebtItem 
} from '@/lib/debts-store';
import { formatCurrency, formatDate, toDateInput } from '@/lib/utils';
import { numberToVietnameseWords } from '@/lib/vietnam-banks';
import { 
  HandCoins, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MessageSquareShare, 
  Trash2, 
  Search, 
  CreditCard, 
  AlertTriangle,
  QrCode,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { VietQrModal } from '@/components/modals/VietQrModal';
import { toast } from 'sonner';

export const DebtsPage: React.FC = () => {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [tab, setTab] = useState<'lend' | 'borrow'>('lend');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<DebtItem | null>(null);
  const [selectedDebtForReminder, setSelectedDebtForReminder] = useState<DebtItem | null>(null);
  const [vietQrTarget, setVietQrTarget] = useState<DebtItem | null>(null);

  // Form states for adding debt
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [startDate, setStartDate] = useState(toDateInput());
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // Payment form states
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(toDateInput());
  const [payNotes, setPayNotes] = useState('');

  const loadData = () => {
    setDebts(getDebts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      toast.error('Vui lòng nhập họ và tên người vay/cho vay.');
      return;
    }
    const amt = Number(originalAmount);
    if (!amt || amt <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ lớn hơn 0.');
      return;
    }

    addDebt({
      type: tab,
      personName: personName.trim(),
      phone: phone.trim() || undefined,
      bankName: bankName.trim() || undefined,
      bankAccount: bankAccount.trim() || undefined,
      originalAmount: amt,
      startDate: startDate || toDateInput(),
      dueDate: dueDate || undefined,
      description: description.trim() || (tab === 'lend' ? 'Cho mượn tiền' : 'Đi vay tiền')
    });

    toast.success(tab === 'lend' ? 'Đã thêm khoản cho vay mới!' : 'Đã thêm khoản đi vay mới!');
    setShowAddModal(false);
    // Reset form
    setPersonName(''); setPhone(''); setBankName(''); setBankAccount('');
    setOriginalAmount(''); setDueDate(''); setDescription('');
    loadData();
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      toast.error('Vui lòng nhập số tiền thanh toán hợp lệ.');
      return;
    }

    addPaymentToDebt(selectedDebtForPayment.id, {
      amount: amt,
      date: payDate || toDateInput(),
      notes: payNotes.trim() || undefined
    });

    toast.success(`Đã ghi nhận trả ${formatCurrency(amt)}!`);
    setSelectedDebtForPayment(null);
    setPayAmount(''); setPayNotes('');
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Xác nhận xóa bản ghi nợ của "${name}"?`)) {
      deleteDebt(id);
      toast.success('Đã xóa bản ghi.');
      loadData();
    }
  };

  const handleCopyReminder = (debt: DebtItem) => {
    const msg = generatePoliteReminderMessage(debt);
    navigator.clipboard.writeText(msg);
    toast.success('Đã sao chép tin nhắn nhắc nợ lịch sự vào bộ nhớ tạm!');
  };

  const filtered = debts.filter(d => d.type === tab && (!search.trim() || 
    d.personName.toLowerCase().includes(search.toLowerCase()) || 
    d.description.toLowerCase().includes(search.toLowerCase()) ||
    (d.phone && d.phone.includes(search))
  ));

  const totalOriginal = filtered.reduce((s, d) => s + d.originalAmount, 0);
  const totalPaid = filtered.reduce((s, d) => s + d.paidAmount, 0);
  const totalRemaining = Math.max(0, totalOriginal - totalPaid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Sổ Quản lý Vay Nợ & Mượn Tiền
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Sổ nợ cá nhân
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Ghi chép minh bạch các khoản cho bạn bè mượn hoặc đi vay, tạo tin nhắn nhắc nợ lịch sự kèm mã VietQR.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{tab === 'lend' ? 'Ghi nhận Cho vay' : 'Ghi nhận Đi vay'}</span>
        </button>
      </div>

      {/* Tabs Switcher & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Tổng tiền nợ còn lại */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {tab === 'lend' ? 'NGƯỜI KHÁC ĐANG NỢ BẠN' : 'BẠN ĐANG CÒN NỢ'}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tab === 'lend' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'}`}>
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold tabular-nums tracking-tight ${tab === 'lend' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(totalRemaining)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {filtered.filter(d => d.status !== 'completed').length} khoản chưa tất toán xong
            </div>
          </div>
        </div>

        {/* Card 2: Đã thu hồi / Đã trả */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {tab === 'lend' ? 'ĐÃ THU HỒI ĐƯỢC' : 'BẠN ĐÃ THANH TOÁN'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(totalPaid)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Đạt {(totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0).toFixed(0)}% tổng giá trị
            </div>
          </div>
        </div>

        {/* Card 3: Tổng giá trị ban đầu */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              TỔNG GỐC BAN ĐẦU
            </span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(totalOriginal)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Tổng cộng {filtered.length} bản ghi
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4">
        {/* Sub Header & Segmented Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 w-fit">
            <button
              type="button"
              onClick={() => setTab('lend')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${tab === 'lend' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tôi cho vay (Người khác nợ tôi)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('borrow')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${tab === 'borrow' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Tôi đi vay (Tôi nợ người khác)</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc lý do..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Debts List */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500 space-y-3">
            <p>Chưa có khoản {tab === 'lend' ? 'cho vay' : 'đi vay'} nào.</p>
            <Button size="sm" onClick={() => setShowAddModal(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm khoản đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(debt => {
              const remaining = Math.max(0, debt.originalAmount - debt.paidAmount);
              const pct = Math.min(100, Math.round((debt.paidAmount / debt.originalAmount) * 100));
              const isDone = debt.status === 'completed';

              return (
                <div
                  key={debt.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between shadow-xs ${
                    isDone
                      ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/40 opacity-70'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    {/* Item Top info */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                            {debt.personName}
                          </h3>
                          {isDone ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Đã tất toán
                            </span>
                          ) : debt.paidAmount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Đã trả {pct}%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              Chưa trả
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {debt.description}
                          {debt.phone && ` • SĐT: ${debt.phone}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(debt.id, debt.personName)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 transition rounded-md"
                        title="Xóa bản ghi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress & Numbers */}
                    <div className="mt-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] text-zinc-500">
                          {isDone ? 'Đã hoàn tất thanh toán' : 'Số tiền còn lại:'}
                        </span>
                        <span className={`font-bold tabular-nums ${isDone ? 'text-emerald-600' : 'text-zinc-900 dark:text-white'}`}>
                          {isDone ? formatCurrency(debt.originalAmount) : formatCurrency(remaining)}
                        </span>
                      </div>

                      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2">
                        <span>Ngày vay: {formatDate(debt.startDate)}</span>
                        <span>{debt.dueDate ? `Hạn trả: ${formatDate(debt.dueDate)}` : 'Không có hạn'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDebtForPayment(debt);
                          setPayAmount(String(remaining));
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
                      >
                        Ghi nhận trả nợ
                      </button>
                    )}

                    {tab === 'lend' && !isDone && (
                      <button
                        type="button"
                        onClick={() => handleCopyReminder(debt)}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-750 transition flex items-center gap-1"
                        title="Tạo tin nhắn nhắc nợ lịch sự"
                      >
                        <MessageSquareShare className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Nhắc nợ</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setVietQrTarget(debt)}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-750 transition flex items-center gap-1"
                      title="Mã VietQR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-sky-600" />
                      <span>VietQR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Thêm khoản nợ mới */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {tab === 'lend' ? 'Ghi nhận Khoản cho vay' : 'Ghi nhận Khoản đi vay'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {tab === 'lend'
                ? 'Theo dõi số tiền bạn cho bạn bè, người thân hoặc đối tác vay mượn.'
                : 'Theo dõi các khoản tiền bạn đang vay mượn người khác hoặc vay ngân hàng.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDebt} className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                {tab === 'lend' ? 'Tên người vay (Bạn bè / Đối tác) *' : 'Tên chủ nợ (Người cho vay) *'}
              </label>
              <Input
                placeholder="VD: Nguyễn Văn Tuấn, Chị Lan..."
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Số tiền (VNĐ) *
                </label>
                <MoneyInput
                  placeholder="VD: 5.000.000"
                  value={originalAmount}
                  onValueChange={setOriginalAmount}
                  className="font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Số điện thoại
                </label>
                <Input
                  placeholder="0912..."
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={15}
                />
              </div>
            </div>

            {Number(originalAmount) > 0 && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                {numberToVietnameseWords(Number(originalAmount))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Ngày cho vay / vay *
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Hạn thanh toán dự kiến
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  min={startDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                Lý do & Ghi chú
              </label>
              <Input
                placeholder="VD: Vay tiền sửa xe, đóng học phí, đặt cọc nhà..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={255}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)} className="text-xs">
                Hủy
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                Lưu vào sổ nợ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Ghi nhận trả nợ từng đợt */}
      {selectedDebtForPayment && (
        <Dialog open={!!selectedDebtForPayment} onOpenChange={() => setSelectedDebtForPayment(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Ghi nhận thanh toán trả nợ
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedDebtForPayment.personName} • Còn nợ: {formatCurrency(selectedDebtForPayment.originalAmount - selectedDebtForPayment.paidAmount)}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddPayment} className="space-y-3 py-2">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Số tiền thanh toán đợt này (VNĐ) *
                </label>
                <MoneyInput
                  placeholder="0"
                  value={payAmount}
                  onValueChange={setPayAmount}
                  className="font-bold text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Ngày nhận / thanh toán
                </label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">
                  Ghi chú đợt trả
                </label>
                <Input
                  placeholder="VD: Trả qua Momo, chuyển khoản VCB..."
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  maxLength={255}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDebtForPayment(null)} className="text-xs">
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                  Xác nhận đã thanh toán
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* VietQR Quick Generator for Debts */}
      {vietQrTarget && (
        <VietQrModal
          open={!!vietQrTarget}
          onClose={() => setVietQrTarget(null)}
          defaultAccount={vietQrTarget.bankAccount || ''}
          defaultAccountName={vietQrTarget.personName}
          defaultAmount={Math.max(0, vietQrTarget.originalAmount - vietQrTarget.paidAmount)}
          defaultMemo={`Tra no ${vietQrTarget.description || ''}`.trim()}
        />
      )}
    </div>
  );
};
