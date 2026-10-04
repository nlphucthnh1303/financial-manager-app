import React, { useState, useMemo } from 'react';
import { Search, Check, Building2, Wallet, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { VIETNAM_BANKS, type VietnamBank } from '@/lib/vietnam-banks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BankSelectorProps {
  selectedCode?: string;
  onSelect: (bank: VietnamBank) => void;
  trigger?: React.ReactNode;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  selectedCode,
  onSelect,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'popular' | 'bank' | 'wallet' | 'digital'>('popular');

  const selectedBank = useMemo(() => {
    return VIETNAM_BANKS.find(b => b.code === selectedCode || b.shortName === selectedCode);
  }, [selectedCode]);

  const filteredBanks = useMemo(() => {
    let list = VIETNAM_BANKS;

    if (filterType === 'popular') {
      list = list.filter(b => b.popular);
    } else if (filterType === 'bank') {
      list = list.filter(b => b.type === 'bank');
    } else if (filterType === 'wallet') {
      list = list.filter(b => b.type === 'wallet');
    } else if (filterType === 'digital') {
      list = list.filter(b => b.type === 'digital');
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(b => 
        b.code.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        (b.bin && b.bin.includes(q))
      );
    }

    return list;
  }, [search, filterType]);

  const handleChoose = (bank: VietnamBank) => {
    onSelect(bank);
    setOpen(false);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md shadow-border bg-[#ffffff] dark:bg-[#111111] hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-colors w-full text-left"
        >
          {selectedBank ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BankLogoView bank={selectedBank} size="sm" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] block truncate">
                  {selectedBank.shortName}
                </span>
                <span className="text-[10px] text-[#888888] block truncate">
                  {selectedBank.bin ? `BIN: ${selectedBank.bin}` : selectedBank.type === 'wallet' ? 'Ví điện tử' : 'Tiền mặt'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#888888] text-xs">
              <Building2 className="w-4 h-4" />
              <span>Chọn Ngân hàng / Ví điện tử…</span>
            </div>
          )}
          <span className="text-[11px] font-medium text-[#0070f3] ml-auto shrink-0">
            Thay đổi
          </span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 pb-1">
            <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <span>Chọn Ngân hàng hoặc Ví điện tử</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
              Bao gồm đầy đủ Big 4, Ngân hàng TMCP, Ngân hàng số và Ví điện tử (MoMo, ZaloPay, Viettel Money…)
            </DialogDescription>
          </DialogHeader>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
            <Input
              placeholder="Tìm theo tên ngân hàng, mã (VCB, TCB, MB, MoMo…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
              autoFocus
            />
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'popular', label: '⭐ Phổ biến', icon: Sparkles },
              { id: 'all', label: 'Tất cả (35+)', icon: Building2 },
              { id: 'bank', label: 'Ngân hàng', icon: Building2 },
              { id: 'wallet', label: 'Ví điện tử', icon: Wallet },
              { id: 'digital', label: 'Ngân hàng số', icon: Smartphone },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterType === tab.id
                    ? 'bg-[#171717] dark:bg-[#ededed] text-white dark:text-black shadow-xs'
                    : 'bg-[#fafafa] dark:bg-[#111111] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] border border-[#e5e5e5] dark:border-[#262626]'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Banks Grid / List */}
          <div className="flex-1 overflow-y-auto max-h-72 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1 py-1">
            {filteredBanks.map((bank) => {
              const isSelected = selectedCode === bank.code || selectedCode === bank.shortName;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleChoose(bank)}
                  className={`p-3 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0070f3]/10 border-2 border-[#0070f3] shadow-xs'
                      : 'bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0] dark:hover:bg-[#161616] border border-[#e5e5e5] dark:border-[#262626]'
                  }`}
                >
                  <BankLogoView bank={bank} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-semibold text-[#171717] dark:text-[#ededed] truncate">
                        {bank.shortName}
                      </span>
                      {bank.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#000000]/5 dark:bg-[#ffffff]/10 text-[#666666] dark:text-[#888888]">
                          {bank.code}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#888888] block truncate mt-0.5">
                      {bank.name}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#0070f3] shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredBanks.length === 0 && (
              <div className="col-span-2 text-center py-8 text-xs text-[#888888]">
                Không tìm thấy ngân hàng hoặc ví phù hợp với từ khóa "{search}".
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto h-10 px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const BankLogoView: React.FC<{
  bank?: VietnamBank | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ bank, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  if (!bank) {
    return (
      <div className={`rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center ${size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'} ${className}`}>
        <Building2 className="w-4 h-4 text-zinc-500" />
      </div>
    );
  }

  const dimCls = size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';

  return (
    <div
      className={`rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative font-semibold ${dimCls} ${className}`}
      style={{ backgroundColor: `${bank.color}20`, color: bank.color }}
    >
      {bank.logoUrl && !imgError ? (
        <img
          src={bank.logoUrl}
          alt={bank.shortName}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
        />
      ) : (
        <span className="select-none">{bank.logo || bank.code?.slice(0, 2) || '🏦'}</span>
      )}
    </div>
  );
};
