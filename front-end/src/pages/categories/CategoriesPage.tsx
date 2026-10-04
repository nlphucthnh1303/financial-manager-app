import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { localDb, type LocalCategory, type LocalTag } from '@/lib/localDb';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FieldError } from '@/components/ui/field-error';
import { check, collectErrors, type FormErrors } from '@/lib/validation';
import { VIETNAMESE_STANDARD_CATEGORIES } from '@/lib/financial-frameworks';
import { IconPicker, IconRenderer } from '@/components/ui/icon-picker';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Tag, 
  FolderTree, 
  CornerDownRight, 
  Sparkles,
  Layers
} from 'lucide-react';

type CategoryType = 'Expense' | 'Revenue';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  icon: string;
  color: string;
  type: CategoryType;
  subCategories?: Category[];
}

interface TagItem {
  id: string;
  tag: string;
  description?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  transactionCount: number;
}

const labelCls = 'text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block';

const CategoryFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing: Category | null;
  defaultType: CategoryType;
  roots: Category[];
}> = ({ open, onClose, onSuccess, editing, defaultType, roots }) => {
  const empty = { name: '', parentId: '', icon: 'Utensils', color: '#ff5b4f', type: defaultType };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(editing
      ? { name: editing.name, parentId: editing.parentId || '', icon: editing.icon || 'Folder', color: editing.color || '#ff5b4f', type: editing.type }
      : { ...empty, type: defaultType });
  }, [open, editing, defaultType]);

  const parentOptions = roots.filter(r => r.type === form.type && r.id !== editing?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const found = collectErrors({
      name: check.required(form.name, 'Vui lòng nhập tên danh mục.') || check.length(form.name, 2, 100, 'Tên danh mục'),
      color: !/^#[0-9A-Fa-f]{6}$/.test(form.color) && 'Mã màu không hợp lệ.',
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    const payload = { name, parentId: form.parentId || null, icon: form.icon, color: form.color, type: form.type };
    try {
      setLoading(true);
      if (editing) {
        try {
          await api.put(`/categories/${editing.id}`, payload);
        } catch {
          await localDb.updateCategory(editing.id, payload);
        }
        toast.success('Đã cập nhật danh mục.');
      } else {
        try {
          const res: any = await api.post('/categories', payload);
          if (res.data?.id) {
            await localDb.saveCategories([{ ...payload, id: res.data.id }]);
          }
        } catch {
          await localDb.addCategory(payload);
        }
        toast.success('Đã thêm danh mục mới.');
      }
      onClose(); 
      onSuccess();
    } catch (err: any) { 
      toast.error(err?.message || 'Lưu danh mục thất bại.'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">
            {editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
            Chọn biểu tượng vector hiện đại từ ReUI Icons hoặc bộ Emoji.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
          <div>
            <label className={labelCls}>Tên danh mục *</label>
            <Input 
              placeholder="Ăn uống, Tiền nhà, Mua sắm…" 
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              aria-invalid={!!errors.name} 
              maxLength={100} 
              className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" 
              autoFocus 
            />
            <FieldError message={errors.name} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelCls}>Loại danh mục</label>
              <Select value={form.type} onValueChange={(val: CategoryType) => setForm(f => ({ ...f, type: val, parentId: '' }))}>
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expense" className="text-xs sm:text-sm">Chi tiêu (−)</SelectItem>
                  <SelectItem value="Revenue" className="text-xs sm:text-sm">Thu nhập (+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={labelCls}>Danh mục cha (Tùy chọn)</label>
              <Select value={form.parentId || 'root'} onValueChange={val => setForm(f => ({ ...f, parentId: val === 'root' ? '' : val }))}>
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue placeholder="Không có (Cấp gốc)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root" className="text-xs sm:text-sm">Không có (Cấp gốc)</SelectItem>
                  {parentOptions.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs sm:text-sm">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Biểu tượng (ReUI / Lucide Icons) & Màu sắc</label>
            <IconPicker
              value={form.icon}
              color={form.color}
              onChange={(icon, color) => {
                setForm(f => ({ ...f, icon, color: color || f.color }));
              }}
            />
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
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black hover:bg-[#333333] dark:hover:bg-white shadow-sm cursor-pointer"
            >
              {loading ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TagFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing: TagItem | null;
}> = ({ open, onClose, onSuccess, editing }) => {
  const [form, setForm] = useState({ tag: '', description: '', dateFrom: '', dateTo: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(editing
      ? { tag: editing.tag, description: editing.description || '', dateFrom: editing.dateFrom?.split('T')[0] || '', dateTo: editing.dateTo?.split('T')[0] || '' }
      : { tag: '', description: '', dateFrom: '', dateTo: '' });
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tag = form.tag.trim().replace(/^#/, '');
    const found = collectErrors({
      tag: check.required(tag, 'Vui lòng nhập tên thẻ tag.') || check.length(tag, 1, 50, 'Thẻ tag'),
      dateTo: form.dateFrom && form.dateTo && form.dateTo < form.dateFrom && 'Ngày kết thúc phải sau ngày bắt đầu.',
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    const payload = { tag, description: form.description.trim() || null, dateFrom: form.dateFrom || null, dateTo: form.dateTo || null };
    try {
      setLoading(true);
      if (editing) {
        try {
          await api.put(`/tags/${editing.id}`, payload);
        } catch {
          // offline
        }
        toast.success('Đã cập nhật thẻ tag.');
      } else {
        try {
          await api.post('/tags', payload);
        } catch {
          await localDb.addTag(payload);
        }
        toast.success('Đã tạo thẻ tag mới.');
      }
      onClose(); onSuccess();
    } catch (err: any) { toast.error(err?.message || 'Lưu thẻ tag thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">{editing ? 'Sửa thẻ tag' : 'Thêm thẻ tag'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">Gom nhóm giao dịch theo sự kiện hoặc dự án (VD: #tet-2027, #damcuoi-tuan).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
          <div>
            <label className={labelCls}>Tên thẻ tag *</label>
            <Input placeholder="sam-tet-2027, du-lich-phu-quoc…" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} aria-invalid={!!errors.tag} maxLength={50} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" autoFocus />
            <FieldError message={errors.tag} />
          </div>
          <div>
            <label className={labelCls}>Mô tả sự kiện</label>
            <textarea rows={3} maxLength={500} placeholder="Chi tiêu chuẩn bị Tết Nguyên Đán…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="flex w-full rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#111111] p-3 text-xs sm:text-sm text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#0070f3]" />
            <FieldError message={errors.description} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelCls}>Ngày bắt đầu</label>
              <Input type="date" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
            </div>
            <div>
              <label className={labelCls}>Ngày kết thúc</label>
              <Input type="date" value={form.dateTo} min={form.dateFrom || undefined} onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))} aria-invalid={!!errors.dateTo} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.dateTo} />
            </div>
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
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black hover:bg-[#333333] dark:hover:bg-white shadow-sm cursor-pointer"
            >
              {loading ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo thẻ tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<CategoryType>('Expense');
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });
  const [tagModal, setTagModal] = useState<{ open: boolean; editing: TagItem | null }>({ open: false, editing: null });
  const [pendingDelete, setPendingDelete] = useState<{ kind: 'category' | 'tag'; item: any } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, tagRes]: any[] = await Promise.all([
        api.get('/categories').catch(() => ({ data: null })),
        api.get('/tags').catch(() => ({ data: [] }))
      ]);
      
      let catList = catRes.data;
      if (!catList || catList.length === 0) {
        // Fallback to localDb
        const offlineCats = await localDb.getCategories();
        catList = offlineCats.map(c => ({
          id: c.id,
          name: c.name,
          parentId: c.parentId || null,
          icon: c.icon || 'Folder',
          color: c.color || '#171717',
          type: (c.type || 'Expense') as CategoryType
        }));
      } else {
        await localDb.saveCategories(catList.map((c: any) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          parentId: c.parentId,
          type: c.type
        })));
      }

      setCategories(catList || []);
      setTags(tagRes.data || []);
    } catch {
      const offlineCats = await localDb.getCategories();
      setCategories(offlineCats.map(c => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId || null,
        icon: c.icon || 'Folder',
        color: c.color || '#171717',
        type: (c.type || 'Expense') as CategoryType
      })));
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApplyPresetCategories = async () => {
    if (!window.confirm('Áp dụng bộ Danh mục chuẩn Việt Nam (Ăn uống, Nhà cửa, Đi lại, Mua sắm, Hiếu hỉ…)?')) return;
    try {
      setLoading(true);
      for (const cat of VIETNAMESE_STANDARD_CATEGORIES) {
        try {
          await api.post('/categories', {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
          });
        } catch {
          await localDb.addCategory({
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type as any
          });
        }
      }
      toast.success('Đã khởi tạo bộ danh mục Việt Nam chuẩn!');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi khi áp dụng danh mục mẫu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === 'category') {
        await api.delete(`/categories/${pendingDelete.item.id}`).catch(() => {});
        await localDb.deleteCategory(pendingDelete.item.id);
        toast.success(`Đã xóa danh mục "${pendingDelete.item.name}".`);
      } else {
        await api.delete(`/tags/${pendingDelete.item.id}`).catch(() => {});
        await localDb.deleteTag(pendingDelete.item.id);
        toast.success(`Đã xóa thẻ tag "#${pendingDelete.item.tag}".`);
      }
      setPendingDelete(null);
      loadData();
    } catch (err: any) { toast.error(err?.message || 'Xóa thất bại.'); }
  };

  const filteredCategories = categories.filter(c => (c.type || 'Expense') === typeFilter);
  const rootCategories = filteredCategories.filter(c => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">
            Danh mục & Thẻ sự kiện
          </h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">
            Phân loại thu chi đa tầng với biểu tượng ReUI / Lucide và thẻ tag dự án
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleApplyPresetCategories}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Nạp bộ danh mục mẫu</span>
          </button>
          <button
            type="button"
            onClick={() => setTagModal({ open: true, editing: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]"
          >
            <Tag className="w-3.5 h-3.5 text-[#888888]" />
            <span>Thêm thẻ tag</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryModal({ open: true, editing: null })}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium shadow-sm transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm danh mục</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setTypeFilter('Expense')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            typeFilter === 'Expense'
              ? 'bg-[#171717] dark:bg-[#ededed] text-white dark:text-black shadow-sm'
              : 'text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed]'
          }`}
        >
          Danh mục Chi tiêu (−)
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('Revenue')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            typeFilter === 'Revenue'
              ? 'bg-[#171717] dark:bg-[#ededed] text-white dark:text-black shadow-sm'
              : 'text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed]'
          }`}
        >
          Danh mục Thu nhập (+)
        </button>
      </div>

      {/* Category List */}
      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] divide-y divide-zinc-100 dark:divide-zinc-900">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#888888]">Đang tải danh mục…</div>
        ) : rootCategories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-[#888888]">Chưa có danh mục nào thuộc nhóm này.</p>
            <Button size="sm" onClick={() => setCategoryModal({ open: true, editing: null })} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm danh mục đầu tiên
            </Button>
          </div>
        ) : (
          rootCategories.map(parent => {
            const subs = filteredCategories.filter(c => c.parentId === parent.id);
            return (
              <div key={parent.id} className="p-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${parent.color}20`, color: parent.color }}
                    >
                      <IconRenderer name={parent.icon} color={parent.color} size={16} className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-[#171717] dark:text-[#ededed]">
                        {parent.name}
                      </span>
                      {subs.length > 0 && (
                        <span className="text-[10px] text-[#888888] ml-2">
                          ({subs.length} danh mục con)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCategoryModal({ open: true, editing: parent })}
                      className="p-1 text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] rounded transition-colors"
                      title="Sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ kind: 'category', item: parent })}
                      className="p-1 text-[#888888] hover:text-[#ff5b4f] rounded transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {subs.length > 0 && (
                  <div className="mt-2.5 ml-6 space-y-1.5 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800">
                    {subs.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between py-1 text-xs">
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="w-3 h-3 text-[#888888]" />
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                          >
                            <IconRenderer name={sub.icon} color={sub.color} size={12} className="w-3 h-3" />
                          </div>
                          <span className="text-[#171717] dark:text-[#ededed]">{sub.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCategoryModal({ open: true, editing: sub })}
                            className="p-1 text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed]"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete({ kind: 'category', item: sub })}
                            className="p-1 text-[#888888] hover:text-[#ff5b4f]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tags Section */}
      {tags.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#0070f3]" />
            <span>Thẻ sự kiện & Chiến dịch ({tags.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <div
                key={t.id}
                className="px-3 py-1.5 rounded-md shadow-border bg-[#ffffff] dark:bg-[#0a0a0a] flex items-center gap-2 text-xs"
              >
                <span className="font-medium text-[#0070f3]">#{t.tag}</span>
                {t.description && <span className="text-[11px] text-[#888888]">· {t.description}</span>}
                <button
                  type="button"
                  onClick={() => setPendingDelete({ kind: 'tag', item: t })}
                  className="text-[#888888] hover:text-[#ff5b4f]"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <CategoryFormModal
        open={categoryModal.open}
        editing={categoryModal.editing}
        onClose={() => setCategoryModal({ open: false, editing: null })}
        onSuccess={loadData}
        defaultType={typeFilter}
        roots={rootCategories}
      />

      <TagFormModal
        open={tagModal.open}
        editing={tagModal.editing}
        onClose={() => setTagModal({ open: false, editing: null })}
        onSuccess={loadData}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 pb-1">
            <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">Xác nhận xóa</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
              Bạn có chắc chắn muốn xóa {pendingDelete?.kind === 'category' ? `danh mục "${pendingDelete?.item.name}"` : `thẻ tag "#${pendingDelete?.item.tag}"`}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              className="h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
