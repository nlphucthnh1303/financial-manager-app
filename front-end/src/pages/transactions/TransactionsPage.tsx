import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { localDb, type LocalTransaction } from '@/lib/localDb';
import { counterpartyOf, endOfDayIso, formatCurrency, formatDate, startOfDayIso, walletOf, exportToCSV } from '@/lib/utils';
import { useDateRange } from '@/lib/date-range';
import { 
  Receipt, 
  RefreshCw, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  MoreVertical,
  Trash2,
  QrCode,
  Sparkles,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';
import { SmartSmsImportModal } from '@/components/modals/SmartSmsImportModal';
import { VietQrModal } from '@/components/modals/VietQrModal';

const PAGE_SIZE = 50;

const TxDetailDialog: React.FC<{ 
  tx: any; 
  open: boolean; 
  onClose: () => void; 
  onDelete: (id: string) => void;
  onOpenVietQr: (tx: any) => void;
}> = ({ tx, open, onClose, onDelete, onOpenVietQr }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!tx) return null;
  const isIncome = tx.transactionType === 'Deposit';
  const isExpense = tx.transactionType === 'Withdrawal';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">
            Chi tiết giao dịch #{tx.id?.slice(0, 8)}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#888888]">
            Thông tin định khoản kế toán kép
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-center py-4 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
            <span className={`text-3xl font-semibold tabular-nums ${isIncome ? 'text-[#10b981]' : isExpense ? 'text-[#ff5b4f]' : 'text-[#0070f3]'}`}>
              {isExpense ? '−' : isIncome ? '+' : ''}{formatCurrency(tx.amount)}
            </span>
            <p className="text-[#171717] dark:text-[#ededed] font-medium text-xs mt-1">{tx.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
              <span className="text-[10px] text-[#888888] block">Thời gian</span>
              <span className="font-medium text-[#171717] dark:text-[#ededed] block mt-0.5 tabular-nums">{formatDate(tx.date)}</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
              <span className="text-[10px] text-[#888888] block">Loại giao dịch</span>
              <span className="font-medium text-[#171717] dark:text-[#ededed] block mt-0.5">{isIncome ? 'Thu nhập (+)' : isExpense ? 'Chi tiêu (−)' : 'Chuyển khoản ↔'}</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
              <span className="text-[10px] text-[#888888] block">{isIncome ? 'Ví nhận' : 'Ví chi'}</span>
              <span className="font-medium text-[#171717] dark:text-[#ededed] block mt-0.5">{walletOf(tx)?.name || '—'}</span>
            </div>
            <div className="p-2.5 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">
              <span className="text-[10px] text-[#888888] block">Danh mục</span>
              <span className="font-medium text-[#171717] dark:text-[#ededed] block mt-0.5">{tx.category?.name || 'Chưa phân loại'}</span>
            </div>
          </div>
          {tx.notes && <p className="text-xs text-[#666666] dark:text-[#888888] p-2.5 rounded-md bg-[#fafafa] dark:bg-[#111111] shadow-border">{tx.notes}</p>}
        </div>
        <DialogFooter className="gap-2">
          {!confirmDelete ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenVietQr(tx)} className="text-xs shadow-border text-[#0070f3]">
                <QrCode className="w-3.5 h-3.5 mr-1" /> VietQR
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs shadow-border">Đóng</Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} className="text-xs bg-[#ff5b4f] text-white">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
              </Button>
            </>
          ) : (
            <div className="w-full space-y-2">
              <p className="text-xs text-[#ff5b4f] font-medium text-center">Xác nhận xóa giao dịch này?</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs shadow-border" onClick={() => setConfirmDelete(false)}>Hủy</Button>
                <Button variant="destructive" size="sm" className="flex-1 text-xs bg-[#ff5b4f] text-white" onClick={() => { onDelete(tx.id); onClose(); }}>Xóa ngay</Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [vietQrTx, setVietQrTx] = useState<any>(null);
  const [kpi, setKpi] = useState<any>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { start, end } = useDateRange();

  const mapLocalToTxJournal = (t: LocalTransaction) => ({
    id: t.id,
    transactionType: t.transactionType,
    amount: t.amount,
    currencyCode: t.currencyCode || 'VND',
    description: t.description,
    date: t.date,
    sourceAccount: { id: t.sourceAccountId, name: t.sourceAccountName || 'Ví tiền mặt' },
    destinationAccount: { id: t.destinationAccountId, name: t.destinationAccountName || '—' },
    category: t.categoryName ? { id: t.categoryId, name: t.categoryName } : null,
    notes: t.notes,
    isSynced: t.isSynced,
    syncAction: t.syncAction,
  });

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const range = `startDate=${startOfDayIso(start)}&endDate=${endOfDayIso(end)}`;
      let url = `/transactions?page=${page}&pageSize=${PAGE_SIZE}&${range}`;
      if (typeFilter !== 'all') url += `&type=${typeFilter}`;

      const [res, sum]: any[] = await Promise.all([
        api.get(url),
        api.get(`/statistics/summary?${range}`)
      ]);
      const serverData = res.data || [];

      // Also get any pending local offline transactions
      const pendingLocals = await localDb.getPendingSyncTransactions();
      setPendingCount(pendingLocals.length);

      // Merge local pending that aren't on the server yet
      const mappedLocals = pendingLocals.map(mapLocalToTxJournal);
      const combined = [...mappedLocals, ...serverData];

      setTransactions(combined);
      setKpi(sum.data?.kpi || null);
      setIsOfflineMode(false);
    } catch {
      // Offline fallback: load from Local DB!
      setIsOfflineMode(true);
      const localList = await localDb.getTransactions({
        startDate: startOfDayIso(start),
        endDate: endOfDayIso(end),
        type: typeFilter
      });
      const pendingLocals = await localDb.getPendingSyncTransactions();
      setPendingCount(pendingLocals.length);

      const stats = await localDb.computeOfflineStats(startOfDayIso(start), endOfDayIso(end));
      setTransactions(localList.map(mapLocalToTxJournal));
      setKpi({
        totalIncome: stats.income,
        totalExpense: stats.expense,
        netCashflow: stats.net,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [typeFilter, start, end]);
  useEffect(() => { loadTransactions(); }, [page, typeFilter, start, end]);

  const handleDelete = async (id: string) => {
    try {
      if (id.startsWith('loc-tx-')) {
        await localDb.deleteTransaction(id);
        toast.success('Đã xóa giao dịch cục bộ.');
        loadTransactions();
        return;
      }
      await api.delete(`/transactions/${id}`);
      await localDb.deleteTransaction(id);
      toast.success('Đã xóa giao dịch.');
      loadTransactions();
    } catch {
      await localDb.deleteTransaction(id);
      toast.info('Đã đánh dấu xóa ngoại tuyến. Sẽ đồng bộ khi cắm cáp.');
      loadTransactions();
    }
  };

  const handleExportCSV = () => {
    const rows = filtered.map(t => ({
      'Mô tả': t.description,
      'Danh mục': t.category?.name || 'Chưa phân loại',
      'Ví nguồn': walletOf(t)?.name || '',
      'Đối tác': counterpartyOf(t)?.name || '',
      'Loại': t.transactionType === 'Deposit' ? 'Thu nhập (+)' : t.transactionType === 'Withdrawal' ? 'Chi tiêu (-)' : 'Chuyển khoản',
      'Số tiền (VNĐ)': t.transactionType === 'Withdrawal' ? -t.amount : t.amount,
      'Thời gian': formatDate(t.date),
      'Ghi chú': t.notes || ''
    }));
    if (!rows.length) {
      toast.info('Không có giao dịch nào để xuất.');
      return;
    }
    exportToCSV(`sao-ke-giao-dich-${start.slice(0, 10)}.csv`, rows);
    toast.success('Đã xuất tập tin CSV chuẩn UTF-8 thành công!');
  };

  const totalIncome = kpi?.totalIncome || 0;
  const totalExpense = kpi?.totalExpense || 0;

  const q = search.trim().toLowerCase();
  const filtered = transactions.filter(tx => !q ||
    tx.description?.toLowerCase().includes(q) ||
    walletOf(tx)?.name?.toLowerCase().includes(q) ||
    counterpartyOf(tx)?.name?.toLowerCase().includes(q) ||
    tx.category?.name?.toLowerCase().includes(q)
  );
  const hasNextPage = transactions.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      {/* Page Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Sổ giao dịch
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
            Nhật ký thu chi và hạch toán kế toán kép
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSmsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Quét SMS</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]" 
            type="button"
          >
            <Download className="w-3.5 h-3.5 text-[#888888]" />
            <span>Xuất CSV</span>
          </button>

          <button 
            onClick={loadTransactions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]" 
            type="button"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#888888] ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium shadow-sm transition-colors duration-150" 
            type="button"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tạo giao dịch</span>
          </button>
        </div>
      </div>

      {/* Offline Status Banner */}
      {isOfflineMode && (
        <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Chế độ Ngoại tuyến: Đang sử dụng cơ sở dữ liệu cục bộ trên máy.</span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500 text-black">
              {pendingCount} giao dịch chờ đồng bộ cáp USB
            </span>
          )}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium">Tổng thu trong kỳ</span>
            <div className="w-6 h-6 rounded-md shadow-border flex items-center justify-center text-[#10b981]">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold text-[#10b981] tabular-nums tracking-tight">
              {totalIncome > 0 ? '+' : ''}{formatCurrency(totalIncome)}
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium">Tổng chi trong kỳ</span>
            <div className="w-6 h-6 rounded-md shadow-border flex items-center justify-center text-[#ff5b4f]">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-semibold text-[#ff5b4f] tabular-nums tracking-tight">
              {totalExpense > 0 ? '−' : ''}{formatCurrency(totalExpense)}
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-card p-4 bg-[#ffffff] dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[#666666] dark:text-[#888888]">
            <span className="text-xs font-medium">Dòng tiền dư thực tế</span>
            <div className="w-6 h-6 rounded-md shadow-border flex items-center justify-center text-[#0070f3]">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-semibold tabular-nums tracking-tight ${totalIncome - totalExpense >= 0 ? 'text-[#10b981]' : 'text-[#ff5b4f]'}`}>
              {totalIncome - totalExpense > 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] pointer-events-none" />
            <Input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mô tả, danh mục hoặc tài khoản…" 
              className="pl-8 pr-3 shadow-input text-xs"
            />
          </div>

          <div className="md:col-span-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="shadow-input text-xs h-9">
                <SelectValue placeholder="Tất cả loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả loại giao dịch</SelectItem>
                <SelectItem value="Deposit" className="text-xs text-[#10b981]">Thu nhập (+)</SelectItem>
                <SelectItem value="Withdrawal" className="text-xs text-[#ff5b4f]">Chi tiêu (−)</SelectItem>
                <SelectItem value="Transfer" className="text-xs text-[#0070f3]">Chuyển khoản ↔</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#171717] dark:text-[#ededed]">Danh sách giao dịch ({filtered.length})</h2>
          <span className="text-[11px] text-[#888888] tabular-nums">{formatDate(start)} – {formatDate(end)}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#888888]">Đang tải dữ liệu…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#888888] space-y-3">
            <p>{q || typeFilter !== 'all' ? 'Không có giao dịch nào khớp bộ lọc.' : 'Chưa có giao dịch nào trong khoảng thời gian này…'}</p>
            <Button size="sm" onClick={() => setShowAddModal(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Tạo giao dịch đầu tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] dark:bg-[#111111] text-[#888888] border-b border-zinc-100 dark:border-zinc-900 text-[11px] font-medium">
                <tr>
                  <th className="py-2.5 px-5 font-medium">Ngày</th>
                  <th className="py-2.5 px-4 font-medium">Mô tả giao dịch</th>
                  <th className="py-2.5 px-4 font-medium">Danh mục</th>
                  <th className="py-2.5 px-4 font-medium">Tài khoản</th>
                  <th className="py-2.5 px-4 font-medium">Loại</th>
                  <th className="py-2.5 px-5 font-medium text-right">Số tiền</th>
                  <th className="py-2.5 px-4 font-medium text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-[#171717] dark:text-[#ededed]">
                {filtered.map((tx: any) => {
                  const isIncome = tx.transactionType === 'Deposit';
                  const isExpense = tx.transactionType === 'Withdrawal';
                  return (
                    <tr key={tx.id} className="hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors cursor-pointer" onClick={() => setSelectedTx(tx)}>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="tabular-nums text-[#888888] text-[11px]">{formatDate(tx.date)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#171717] dark:text-[#ededed] flex items-center gap-1.5 flex-wrap">
                          <span>{tx.description}</span>
                          {tx.isSynced === false && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-normal">
                              Chờ đồng bộ
                            </span>
                          )}
                        </div>
                        {tx.notes && <div className="text-[#888888] text-[11px] mt-0.5">{tx.notes}</div>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#171717] dark:text-[#ededed] shadow-border">
                          {tx.category?.name || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[#666666] dark:text-[#888888]">
                        <div>{walletOf(tx)?.name}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[11px] font-medium ${isIncome ? 'text-[#10b981]' : isExpense ? 'text-[#ff5b4f]' : 'text-[#0070f3]'}`}>
                          {isIncome ? 'Thu nhập' : isExpense ? 'Chi tiêu' : 'Chuyển khoản'}
                        </span>
                      </td>
                      <td className={`py-3 px-5 text-right whitespace-nowrap font-semibold tabular-nums text-xs ${isIncome ? 'text-[#10b981]' : 'text-[#171717] dark:text-[#ededed]'}`}>
                        {isExpense ? '−' : isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); }}
                          className="w-6 h-6 rounded hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] inline-flex items-center justify-center transition-colors"
                          type="button"
                          aria-label="Chi tiết giao dịch"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {(page > 1 || hasNextPage) && (
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs text-[#888888]">
            <span className="tabular-nums">Trang {page}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs shadow-border" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs shadow-border" disabled={!hasNextPage || loading} onClick={() => setPage(p => p + 1)}>
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <TxDetailDialog 
        key={selectedTx?.id} 
        tx={selectedTx} 
        open={!!selectedTx} 
        onClose={() => setSelectedTx(null)} 
        onDelete={handleDelete}
        onOpenVietQr={(t) => setVietQrTx(t)}
      />
      
      <CreateTransactionModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={loadTransactions} />
      <SmartSmsImportModal open={showSmsModal} onClose={() => setShowSmsModal(false)} onApplyParsed={() => setShowAddModal(true)} />
      {vietQrTx && (
        <VietQrModal
          open={!!vietQrTx}
          onClose={() => setVietQrTx(null)}
          defaultAmount={vietQrTx.amount}
          defaultMemo={vietQrTx.description}
        />
      )}
    </div>
  );
};
