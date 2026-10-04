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
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0070f3]" />
              Chọn Ngân hàng hoặc Ví điện tử Việt Nam
            </DialogTitle>
            <DialogDescription className="text-xs text-[#888888]">
              Bao gồm đầy đủ Big 4, Ngân hàng TMCP, Ngân hàng số và Ví điện tử (MoMo, ZaloPay, Viettel Money…)
            </DialogDescription>
          </DialogHeader>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <Input
              placeholder="Tìm theo tên ngân hàng, mã (VCB, TCB, MB, MoMo…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs shadow-input"
              autoFocus
            />
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {[
              { id: 'popular', label: '⭐ Phổ biến nhất', icon: Sparkles },
              { id: 'all', label: 'Tất cả (35+)', icon: Building2 },
              { id: 'bank', label: 'Ngân hàng', icon: Building2 },
              { id: 'wallet', label: 'Ví điện tử', icon: Wallet },
              { id: 'digital', label: 'Ngân hàng số', icon: Smartphone },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  filterType === tab.id
                    ? 'bg-[#171717] dark:bg-[#ededed] text-white dark:text-black shadow-sm'
                    : 'bg-[#fafafa] dark:bg-[#111111] text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] shadow-border'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Banks Grid / List */}
          <div className="flex-1 overflow-y-auto max-h-72 grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1 py-1">
            {filteredBanks.map((bank) => {
              const isSelected = selectedCode === bank.code || selectedCode === bank.shortName;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleChoose(bank)}
                  className={`p-2.5 rounded-lg text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-[#0070f3]/10 ring-2 ring-[#0070f3] shadow-sm'
                      : 'bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] shadow-border'
                  }`}
                >
                  <BankLogoView bank={bank} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#171717] dark:text-[#ededed] truncate">
                        {bank.shortName}
                      </span>
                      {bank.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#000000]/5 dark:bg-[#ffffff]/10 text-[#666666] dark:text-[#888888]">
                          {bank.code}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#888888] block truncate mt-0.5">
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

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs shadow-border"
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
