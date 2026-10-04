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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border border-[#e5e5e5] dark:border-[#222222] bg-[#ffffff] dark:bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center px-4 pr-12 border-b border-[#f0f0f0] dark:border-[#1f1f1f] bg-[#fafafa]/50 dark:bg-[#111111]/50">
          <Search className="w-4 h-4 text-[#888888] mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Gõ lệnh hoặc tìm kiếm trang..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-12 text-xs sm:text-sm bg-transparent text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] font-mono text-[#888888] bg-[#f5f5f5] dark:bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] shrink-0">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#888888]">
              Không tìm thấy lệnh hoặc trang phù hợp với "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#444444] dark:text-[#a1a1a1] hover:bg-[#f5f5f5] dark:hover:bg-[#141414] hover:text-[#171717] dark:hover:text-[#ededed] transition-all text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#f0f0f0] dark:bg-[#1a1a1a] flex items-center justify-center text-[#888888] group-hover:text-[#171717] dark:group-hover:text-[#ededed] transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
