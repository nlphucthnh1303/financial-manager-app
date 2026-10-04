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
  MessageSquareShare, 
  Trash2, 
  Search, 
  CreditCard, 
  QrCode,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import { VietQrModal } from '@/components/modals/VietQrModal';
import { toast } from 'sonner';

export const DebtsPage: React.FC = () => {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [tab, setTab] = useState<'lend' | 'borrow'>('lend');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<DebtItem | null>(null);
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
      toast.error('Vui lòng nhập họ và tên.');
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
    setPersonName(''); setPhone(''); setBankName(''); setBankAccount('');
    setOriginalAmount(''); setDueDate(''); setDescription('');
    loadData();
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      toast.error('Vui lòng nhập số tiền thanh toán.');
      return;
    }

    addPaymentToDebt(selectedDebtForPayment.id, {
      amount: amt,
      date: payDate || toDateInput(),
      notes: payNotes.trim() || undefined
    });

    toast.success(`Đã ghi nhận thanh toán ${formatCurrency(amt)}!`);
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
    toast.success('Đã sao chép tin nhắn nhắc nợ lịch sự!');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Sổ quản lý vay nợ
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
            Theo dõi minh bạch các khoản cho mượn hoặc đi vay kèm VietQR
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-sm transition-colors duration-150 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{tab === 'lend' ? 'Thêm khoản cho vay' : 'Thêm khoản đi vay'}</span>
        </button>
      </div>

      {/* Summary Cards (Shadow-as-border) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium uppercase tracking-wider">
              {tab === 'lend' ? 'Người khác còn nợ' : 'Bạn đang còn nợ'}
            </span>
            <div className={`w-6 h-6 rounded-md shadow-border flex items-center justify-center ${tab === 'lend' ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
              <HandCoins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-semibold tabular-nums tracking-tight ${tab === 'lend' ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
              {formatCurrency(totalRemaining)}
            </div>
            <div className="text-[11px] text-[#888888] mt-1">
              {filtered.filter(d => d.status !== 'completed').length} khoản chưa tất toán
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium uppercase tracking-wider">
              {tab === 'lend' ? 'Đã thu hồi được' : 'Bạn đã trả'}
            </span>
            <div className="w-6 h-6 rounded-md shadow-border flex items-center justify-center text-[#0070f3]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums tracking-tight">
              {formatCurrency(totalPaid)}
            </div>
            <div className="text-[11px] text-[#888888] mt-1">
              Đạt {(totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0).toFixed(0)}% tổng số tiền
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium uppercase tracking-wider">
              Tổng số tiền ban đầu
            </span>
            <div className="w-6 h-6 rounded-md shadow-border flex items-center justify-center text-[#171717] dark:text-[#ededed]">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums tracking-tight">
              {formatCurrency(totalOriginal)}
            </div>
            <div className="text-[11px] text-[#888888] mt-1">
              Tổng cộng {filtered.length} bản ghi
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5 space-y-4">
        {/* Segmented Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center p-0.5 bg-[#fafafa] dark:bg-[#111111] shadow-border rounded-md w-fit">
            <button
              type="button"
              onClick={() => setTab('lend')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${tab === 'lend' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Cho vay (Người khác nợ tôi)</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('borrow')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${tab === 'borrow' ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-[#ff5b4f]" />
              <span>Đi vay (Tôi nợ người khác)</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc lý do…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-input text-xs text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none"
            />
          </div>
        </div>

        {/* Debts Grid */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#888888] space-y-3">
            <p>Chưa có khoản {tab === 'lend' ? 'cho vay' : 'đi vay'} nào…</p>
            <Button size="sm" onClick={() => setShowAddModal(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm bản ghi đầu tiên
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
                  className={`p-4 rounded-lg shadow-border bg-[#ffffff] dark:bg-[#0a0a0a] flex flex-col justify-between ${
                    isDone ? 'opacity-60' : 'hover:shadow-card transition-shadow'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-[#171717] dark:text-[#ededed]">
                            {debt.personName}
                          </h3>
                          {isDone ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#10b981] shadow-border">
                              Đã tất toán
                            </span>
                          ) : debt.paidAmount > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#0070f3] shadow-border">
                              Đã trả {pct}%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#ff5b4f] shadow-border">
                              Chưa trả
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
                          {debt.description}
                          {debt.phone && ` • SĐT: ${debt.phone}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(debt.id, debt.personName)}
                        className="p-1 text-[#888888] hover:text-[#ff5b4f] transition-colors rounded"
                        title="Xóa bản ghi"
                        aria-label="Xóa bản ghi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress & Numbers */}
                    <div className="mt-3.5 p-3 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] text-[#888888]">
                          {isDone ? 'Đã hoàn tất' : 'Số tiền còn lại:'}
                        </span>
                        <span className={`font-semibold tabular-nums ${isDone ? 'text-[#10b981]' : 'text-[#171717] dark:text-[#ededed]'}`}>
                          {isDone ? formatCurrency(debt.originalAmount) : formatCurrency(remaining)}
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isDone ? 'bg-[#10b981]' : 'bg-[#171717] dark:bg-[#ededed]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-[#888888] mt-2 tabular-nums">
                        <span>Vay: {formatDate(debt.startDate)}</span>
                        <span>{debt.dueDate ? `Hạn: ${formatDate(debt.dueDate)}` : 'Không có hạn'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDebtForPayment(debt);
                          setPayAmount(String(remaining));
                        }}
                        className="flex-1 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium transition-colors"
                      >
                        Ghi nhận trả nợ
                      </button>
                    )}

                    {tab === 'lend' && !isDone && (
                      <button
                        type="button"
                        onClick={() => handleCopyReminder(debt)}
                        className="px-2.5 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed] flex items-center gap-1"
                        title="Tạo tin nhắn nhắc nợ lịch sự"
                      >
                        <MessageSquareShare className="w-3.5 h-3.5 text-[#888888]" />
                        <span>Nhắc nợ</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setVietQrTarget(debt)}
                      className="px-2.5 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed] flex items-center gap-1"
                      title="Mã VietQR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#0070f3]" />
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
        <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 pb-1">
            <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">
              {tab === 'lend' ? 'Ghi nhận khoản cho vay' : 'Ghi nhận khoản đi vay'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
              {tab === 'lend'
                ? 'Theo dõi tiền bạn cho bạn bè, người thân hoặc đối tác vay mượn.'
                : 'Theo dõi các khoản tiền bạn đang vay mượn người khác hoặc ngân hàng.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDebt} className="space-y-4 py-1">
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                {tab === 'lend' ? 'Tên người vay (Bạn bè / Đối tác) *' : 'Tên chủ nợ (Người cho vay) *'}
              </label>
              <Input
                placeholder="Nguyễn Văn Tuấn, Chị Lan…"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                maxLength={100}
                className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                  Số tiền (VNĐ) *
                </label>
                <MoneyInput
                  placeholder="5.000.000…"
                  value={originalAmount}
                  onValueChange={setOriginalAmount}
                  className="h-10 font-semibold text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                  Số điện thoại
                </label>
                <Input
                  placeholder="0912…"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={15}
                  className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                />
              </div>
            </div>

            {Number(originalAmount) > 0 && (
              <div className="text-xs text-[#10b981] font-medium px-3 py-1.5 rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
                {numberToVietnameseWords(Number(originalAmount))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                  Ngày ghi nhận *
                </label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                  Hạn thanh toán
                </label>
                <DatePicker
                  value={dueDate}
                  min={startDate}
                  onChange={setDueDate}
                  placeholder="Chọn hạn trả…"
                  className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                Lý do & Ghi chú
              </label>
              <Input
                placeholder="Vay tiền sửa xe, đóng học phí…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={255}
                className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
              />
            </div>

            <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black hover:bg-[#333333] dark:hover:bg-white shadow-sm cursor-pointer"
              >
                Lưu vào sổ nợ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Ghi nhận trả nợ */}
      {selectedDebtForPayment && (
        <Dialog open={!!selectedDebtForPayment} onOpenChange={() => setSelectedDebtForPayment(null)}>
          <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
            <DialogHeader className="space-y-1.5 pb-1">
              <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                Ghi nhận thanh toán trả nợ
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
                {selectedDebtForPayment.personName} • Còn nợ: {formatCurrency(selectedDebtForPayment.originalAmount - selectedDebtForPayment.paidAmount)}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddPayment} className="space-y-4 py-1">
              <div>
                <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                  Số tiền thanh toán (VNĐ) *
                </label>
                <MoneyInput
                  placeholder="0…"
                  value={payAmount}
                  onValueChange={setPayAmount}
                  className="h-10 font-semibold text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                  Ngày thanh toán
                </label>
                <DatePicker
                  value={payDate}
                  onChange={setPayDate}
                  className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
                  Ghi chú đợt trả
                </label>
                <Input
                  placeholder="Chuyển khoản qua MoMo, VCB…"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  maxLength={255}
                  className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                />
              </div>

              <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDebtForPayment(null)}
                  className="h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black hover:bg-[#333333] dark:hover:bg-white shadow-sm cursor-pointer"
                >
                  Xác nhận thanh toán
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
