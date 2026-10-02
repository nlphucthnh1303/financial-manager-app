import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, ArrowLeftRight, CreditCard, Tags, PieChart, Receipt, PiggyBank, BarChart3, DollarSign, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenQuickAddTx?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteProps> = ({ open, onClose, onOpenQuickAddTx }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const commands = [
    { label: 'Tạo giao dịch mới', icon: Plus, action: () => { onClose(); onOpenQuickAddTx?.(); } },
    { label: 'Trang Bảng tổng quan', icon: LayoutDashboard, action: () => { navigate('/'); onClose(); } },
    { label: 'Trang Giao dịch', icon: ArrowLeftRight, action: () => { navigate('/transactions'); onClose(); } },
    { label: 'Trang Ví & Tài khoản', icon: CreditCard, action: () => { navigate('/accounts'); onClose(); } },
    { label: 'Trang Danh mục & Tags', icon: Tags, action: () => { navigate('/categories'); onClose(); } },
    { label: 'Trang Ngân sách chi tiêu', icon: PieChart, action: () => { navigate('/budgets'); onClose(); } },
    { label: 'Trang Hóa đơn & Định kỳ', icon: Receipt, action: () => { navigate('/bills'); onClose(); } },
    { label: 'Trang Hũ tiết kiệm', icon: PiggyBank, action: () => { navigate('/piggy-banks'); onClose(); } },
    { label: 'Trang Báo cáo Thống kê', icon: BarChart3, action: () => { navigate('/statistics'); onClose(); } },
    { label: 'Trang Tiền tệ & Tỷ giá', icon: DollarSign, action: () => { navigate('/currencies'); onClose(); } },
  ];

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center px-4 pr-12 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Gõ lệnh hoặc tìm kiếm trang..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-12 text-xs bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 shrink-0">ESC</kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">Không tìm thấy kết quả phù hợp.</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition text-left"
                >
                  <Icon className="w-4 h-4 text-zinc-400" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
