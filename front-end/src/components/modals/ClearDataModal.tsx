import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field-error';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { check, collectErrors, type FormErrors } from '@/lib/validation';

type Scope = 'transactions' | 'all';

interface ClearDataModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SCOPES: { value: Scope; title: string; detail: string }[] = [
  {
    value: 'transactions',
    title: 'Chỉ xoá giao dịch',
    detail: 'Xoá mọi giao dịch và lịch sử hũ tiết kiệm, số dư các ví về 0. Giữ lại ví, danh mục, tags, ngân sách, hóa đơn.',
  },
  {
    value: 'all',
    title: 'Xoá toàn bộ dữ liệu',
    detail: 'Xoá tất cả ví, giao dịch, danh mục, tags, ngân sách, hóa đơn, hũ tiết kiệm. Tài khoản trở về như lúc mới đăng ký (chỉ còn "Ví Tiền mặt").',
  },
];

export const ClearDataModal: React.FC<ClearDataModalProps> = ({ open, onClose, onSuccess }) => {
  const [scope, setScope] = useState<Scope>('transactions');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScope('transactions'); setPassword(''); setErrors({});
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = collectErrors({ password: check.required(password, 'Vui lòng nhập mật khẩu để xác nhận.') });
    setErrors(found);
    if (Object.keys(found).length) return;

    try {
      setLoading(true);
      const res: any = await api.post('/auth/clear-data', { password, scope });
      const d = res.data || {};
      toast.success(scope === 'all'
        ? 'Đã xoá toàn bộ dữ liệu. Tài khoản đã được đặt lại.'
        : `Đã xoá ${d.transactions ?? 0} giao dịch.`);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const fieldErr = Array.isArray(err?.errors) ? err.errors.find((x: any) => x.field === 'password') : null;
      if (fieldErr) setErrors({ password: fieldErr.message });
      else toast.error(err?.message || 'Không thể xoá dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-[#171717] dark:text-[#ededed]">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>Xoá dữ liệu hệ thống</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
            Hành động này sẽ xóa dữ liệu theo phạm vi bạn chọn và không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-2">
          <div role="radiogroup" className="space-y-2.5">
            {SCOPES.map(s => {
              const isSelected = scope === s.value;
              return (
                <label
                  key={s.value}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 dark:border-rose-700 ring-1 ring-rose-500/30'
                      : 'border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f5f5f5] dark:hover:bg-[#161616]'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value={s.value}
                    checked={isSelected}
                    onChange={() => setScope(s.value)}
                    className="mt-1 w-4 h-4 accent-rose-600 shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-rose-700 dark:text-rose-300' : 'text-[#171717] dark:text-[#ededed]'}`}>
                      {s.title}
                    </p>
                    <p className="text-xs text-[#666666] dark:text-[#a1a1a1] mt-0.5 leading-relaxed">
                      {s.detail}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">
              Nhập mật khẩu để xác nhận <span className="text-rose-500">*</span>
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Mật khẩu tài khoản của bạn"
              value={password}
              onChange={e => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
            />
            <FieldError message={errors.password} />
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
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
            >
              {loading ? 'Đang xoá...' : scope === 'all' ? 'Xác nhận xoá toàn bộ' : 'Xác nhận xoá giao dịch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
