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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> Xoá dữ liệu
          </DialogTitle>
          <DialogDescription className="text-xs">Thao tác này không thể hoàn tác.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 py-2">
          <div role="radiogroup" className="space-y-2">
            {SCOPES.map(s => (
              <label
                key={s.value}
                className={`flex gap-2.5 p-3 rounded-lg border cursor-pointer transition ${scope === s.value
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-700'
                  : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
              >
                <input type="radio" name="scope" value={s.value} checked={scope === s.value} onChange={() => setScope(s.value)} className="mt-0.5 accent-rose-600" />
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">{s.title}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{s.detail}</p>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Nhập mật khẩu để xác nhận *</label>
            <Input type="password" autoComplete="current-password" placeholder="Mật khẩu của bạn" value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!errors.password} />
            <FieldError message={errors.password} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 text-white">
              {loading ? 'Đang xoá...' : scope === 'all' ? 'Xoá toàn bộ' : 'Xoá giao dịch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
