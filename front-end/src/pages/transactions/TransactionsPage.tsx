import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { counterpartyOf, endOfDayIso, formatCurrency, formatDate, startOfDayIso, walletOf, exportToCSV } from '@/lib/utils';
import { useDateRange } from '@/lib/date-range';
import { 
  TrendingUp, 
  TrendingDown, 
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
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreateTransactionModal } from '@/components/modals/CreateTransactionModal';
import { SmartSmsImportModal } from '@/components/modals/SmartSmsImportModal';
import { VietQrModal } from '@/components/modals/VietQrModal';
import { type ParsedSmsResult } from '@/lib/vietnam-banks';

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Chi tiết giao dịch #{tx.id?.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-center py-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <span className={`text-3xl font-extrabold tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>
              {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(tx.amount)}
            </span>
            <p className="text-zinc-700 dark:text-zinc-200 font-semibold text-xs mt-1.5">{tx.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Thời gian</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{formatDate(tx.date)}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Loại giao dịch</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{isIncome ? 'Thu nhập (+)' : isExpense ? 'Chi tiêu (-)' : 'Chuyển khoản ↔'}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">{isIncome ? 'Ví nhận' : 'Ví chi'}</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{walletOf(tx)?.name || '—'}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">{isIncome ? 'Nguồn thu' : isExpense ? 'Nơi chi tiêu' : 'Ví nhận'}</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{counterpartyOf(tx)?.name || '—'}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Danh mục</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{tx.category?.name || 'Chưa phân loại'}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Thẻ tag</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{tx.tags?.length ? tx.tags.map((t: string) => `#${t}`).join(' ') : '—'}</span>
            </div>
          </div>
          {tx.notes && <p className="text-xs text-zinc-600 dark:text-zinc-400 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">{tx.notes}</p>}
        </div>
        <DialogFooter className="gap-2">
          {!confirmDelete ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenVietQr(tx)} className="text-xs text-sky-600">
                <QrCode className="w-3.5 h-3.5 mr-1" /> Tạo VietQR
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Đóng</Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} className="text-xs">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
              </Button>
            </>
          ) : (
            <div className="w-full space-y-2">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium text-center">Xác nhận xóa vĩnh viễn giao dịch này?</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setConfirmDelete(false)}>Hủy</Button>
                <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={() => { onDelete(tx.id); onClose(); }}>Xóa ngay</Button>
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
  const { start, end } = useDateRange();

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const range = `startDate=${startOfDayIso(start)}&endDate=${endOfDayIso(end)}`;
      let url = `/transactions?page=${page}&pageSize=${PAGE_SIZE}&${range}`;
      if (typeFilter !== 'all') url += `&type=${typeFilter}`;
      const [res, sum]: any[] = await Promise.all([api.get(url), api.get(`/statistics/summary?${range}`)]);
      setTransactions(res.data || []);
      setKpi(sum.data?.kpi || null);
    } catch {
      toast.error('Không thể tải danh sách giao dịch từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [typeFilter, start, end]);
  useEffect(() => { loadTransactions(); }, [page, typeFilter, start, end]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Đã xóa giao dịch thành công.');
      loadTransactions();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa giao dịch.');
    }
  };

  const handleExportCSV = () => {
    const rows = filtered.map(t => ({
      'Mô tả': t.description,
      'Danh mục': t.category?.name || 'Chưa phân loại',
      'Ví nguồn': walletOf(t)?.name || '',
      'Đối tác / Nơi chi': counterpartyOf(t)?.name || '',
      'Loại': t.transactionType === 'Deposit' ? 'Thu nhập (+)' : t.transactionType === 'Withdrawal' ? 'Chi tiêu (-)' : 'Chuyển khoản nội bộ',
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Sổ Giao Dịch</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Lịch sử hạch toán kế toán kép theo chuẩn Firefly III kết nối cơ sở dữ liệu
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSmsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quét SMS Banking</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-medium shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-750 transition" 
            type="button"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Xuất CSV</span>
          </button>

          <button 
            onClick={loadTransactions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-medium shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-750 transition" 
            type="button"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition" 
            type="button"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">TỔNG THU TRONG KỲ</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {totalIncome > 0 ? '+' : ''}{formatCurrency(totalIncome)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">TỔNG CHI TRONG KỲ</span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
              {totalExpense > 0 ? '-' : ''}{formatCurrency(totalExpense)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">DÒNG TIỀN DƯ THỰC TẾ</span>
            <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3.5">
            <div className={`text-2xl font-bold tabular-nums tracking-tight ${totalIncome - totalExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {totalIncome - totalExpense > 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Tier Filter Bar */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mô tả, tên danh mục, quán xá hoặc tài khoản..." 
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <div className="md:col-span-4">
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none"
            >
              <option value="all">Loại giao dịch: Tất cả</option>
              <option value="Deposit">Thu nhập (+)</option>
              <option value="Withdrawal">Chi tiêu (-)</option>
              <option value="Transfer">Chuyển tiền nội bộ ↔</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Danh sách giao dịch ({filtered.length})</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{formatDate(start)} – {formatDate(end)}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Đang tải dữ liệu từ máy chủ...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500 space-y-3">
            <p>{q || typeFilter !== 'all' ? 'Không có giao dịch nào khớp bộ lọc.' : 'Chưa có giao dịch nào trong khoảng thời gian này.'}</p>
            <Button size="sm" onClick={() => setShowAddModal(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Tạo giao dịch đầu tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 text-[10px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-6 font-semibold">NGÀY & GIỜ</th>
                  <th className="py-3 px-6 font-semibold">MÔ TẢ GIAO DỊCH</th>
                  <th className="py-3 px-6 font-semibold">DANH MỤC</th>
                  <th className="py-3 px-6 font-semibold">VÍ / NGUỒN TIỀN</th>
                  <th className="py-3 px-6 font-semibold">LOẠI</th>
                  <th className="py-3 px-6 font-semibold text-right">SỐ TIỀN (VNĐ)</th>
                  <th className="py-3 px-6 font-semibold text-center w-16">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {filtered.map((tx: any) => {
                  const isIncome = tx.transactionType === 'Deposit';
                  const isExpense = tx.transactionType === 'Withdrawal';
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => setSelectedTx(tx)}>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-medium tabular-nums text-zinc-900 dark:text-white">{formatDate(tx.date)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-zinc-900 dark:text-white">{tx.description}</div>
                        {tx.notes && <div className="text-zinc-500 text-[11px] mt-0.5">{tx.notes}</div>}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                          {tx.category?.name || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-medium text-zinc-900 dark:text-white">{walletOf(tx)?.name}</div>
                        {counterpartyOf(tx)?.name && <div className="text-[11px] text-zinc-500">{tx.transactionType === 'Deposit' ? 'từ ' : '→ '}{counterpartyOf(tx).name}</div>}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>
                          {isIncome ? 'Thu nhập (+)' : isExpense ? 'Chi tiêu (-)' : 'Chuyển tiền ↔'}
                        </span>
                      </td>
                      <td className={`py-4 px-6 text-right whitespace-nowrap font-bold tabular-nums text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>
                        {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); }}
                          className="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white inline-flex items-center justify-center transition"
                          type="button"
                        >
                          <MoreVertical className="w-4 h-4" />
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
          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Trang {page}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!hasNextPage || loading} onClick={() => setPage(p => p + 1)}>
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
