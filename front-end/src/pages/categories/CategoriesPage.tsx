import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FieldError } from '@/components/ui/field-error';
import { check, collectErrors, type FormErrors } from '@/lib/validation';
import { VIETNAMESE_STANDARD_CATEGORIES } from '@/lib/financial-frameworks';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Tag, 
  FolderTree, 
  CornerDownRight, 
  Sparkles
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

const ICON_CHOICES = ['🍜', '☕', '🛒', '🏠', '💡', '🚗', '⛽', '🎬', '🎁', '💊', '📚', '👕', '✈️', '💰', '💼', '📈', '🐷', '📁', '💻', '🏋️', '👶', '❤️'];
const COLOR_CHOICES = ['#171717', '#555555', '#888888', '#0070f3', '#10b981', '#ff5b4f', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const displayIcon = (icon?: string) => (icon && !/^[a-z0-9_-]+$/i.test(icon) ? icon : '📁');
const toDateInput = (d?: string | null) => (d ? d.split('T')[0] : '');

const labelCls = 'text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block';
const selectCls = 'flex h-9 w-full rounded-md shadow-input bg-[#fafafa] dark:bg-[#111111] px-3 py-1 text-xs text-[#171717] dark:text-[#ededed] focus:outline-none';

const CategoryFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing: Category | null;
  defaultType: CategoryType;
  roots: Category[];
}> = ({ open, onClose, onSuccess, editing, defaultType, roots }) => {
  const empty = { name: '', parentId: '', icon: ICON_CHOICES[0], color: COLOR_CHOICES[0], type: defaultType };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(editing
      ? { name: editing.name, parentId: editing.parentId || '', icon: displayIcon(editing.icon), color: editing.color || COLOR_CHOICES[0], type: editing.type }
      : { ...empty, type: defaultType });
  }, [open, editing]);

  const parentOptions = roots.filter(r => r.type === form.type && r.id !== editing?.id);
  const hasChildren = (editing?.subCategories?.length || 0) > 0;

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
        await api.put(`/categories/${editing.id}`, payload);
        toast.success('Đã cập nhật danh mục.');
      } else {
        await api.post('/categories', payload);
        toast.success('Đã thêm danh mục mới.');
      }
      onClose(); onSuccess();
    } catch (err: any) { toast.error(err?.message || 'Lưu danh mục thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">{editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          <DialogDescription className="text-xs text-[#888888]">Phân loại chi tiêu hoặc nguồn thu nhập.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 py-2">
          <div>
            <label className={labelCls}>Tên danh mục *</label>
            <Input placeholder="Cà phê, Tiền điện EVN…" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} maxLength={100} className="shadow-input text-xs" autoFocus />
            <FieldError message={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Thuộc nhóm *</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as CategoryType, parentId: '' }))}>
                <SelectTrigger className="shadow-input text-xs h-9">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expense" className="text-xs text-[#ff5b4f]">Chi tiêu (−)</SelectItem>
                  <SelectItem value="Revenue" className="text-xs text-[#10b981]">Thu nhập (+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelCls}>Danh mục cha</label>
              <Select value={form.parentId || 'root'} onValueChange={v => setForm(f => ({ ...f, parentId: v === 'root' ? '' : v }))} disabled={hasChildren}>
                <SelectTrigger className="shadow-input text-xs h-9">
                  <SelectValue placeholder="— Không có (Gốc) —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root" className="text-xs text-[#888888]">— Không có (Gốc) —</SelectItem>
                  {parentOptions.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {displayIcon(p.icon)} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasChildren && <p className="text-[11px] text-[#888888]">Danh mục đang có danh mục con nên không thể chuyển thành danh mục con.</p>}
          <div>
            <label className={labelCls}>Biểu tượng *</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_CHOICES.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-colors ${form.icon === ic ? 'bg-[#171717] dark:bg-[#ededed] shadow-xs' : 'shadow-border bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0]'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Màu sắc hiển thị *</label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_CHOICES.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} aria-label={c}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${form.color.toLowerCase() === c ? 'border-[#0070f3] scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-6 h-6 rounded cursor-pointer bg-transparent" title="Chọn màu khác" />
            </div>
            <FieldError message={errors.color} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs shadow-border">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-[#171717] dark:bg-[#ededed] text-white dark:text-black">{loading ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TagFormModal: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void; editing: TagItem | null }> = ({ open, onClose, onSuccess, editing }) => {
  const [form, setForm] = useState({ tag: '', description: '', dateFrom: '', dateTo: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(editing
      ? { tag: editing.tag, description: editing.description || '', dateFrom: toDateInput(editing.dateFrom), dateTo: toDateInput(editing.dateTo) }
      : { tag: '', description: '', dateFrom: '', dateTo: '' });
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tag = form.tag.trim().toLowerCase();
    const found = collectErrors({
      tag: !tag ? 'Vui lòng nhập tên tag.'
        : !/^[a-z0-9_-]+$/.test(tag) ? 'Chỉ gồm chữ không dấu, số, "-" hoặc "_", không có khoảng trắng.'
        : check.length(tag, 2, 50, 'Tên tag'),
      description: check.maxLength(form.description, 500, 'Mô tả'),
      dateTo: check.dateOrder(form.dateFrom, form.dateTo),
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    const payload = { tag, description: form.description.trim() || null, dateFrom: form.dateFrom || null, dateTo: form.dateTo || null };
    try {
      setLoading(true);
      if (editing) {
        await api.put(`/tags/${editing.id}`, payload);
        toast.success('Đã cập nhật thẻ tag.');
      } else {
        await api.post('/tags', payload);
        toast.success('Đã tạo thẻ tag mới.');
      }
      onClose(); onSuccess();
    } catch (err: any) { toast.error(err?.message || 'Lưu thẻ tag thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">{editing ? 'Sửa thẻ tag' : 'Thêm thẻ tag'}</DialogTitle>
          <DialogDescription className="text-xs text-[#888888]">Gom nhóm giao dịch theo sự kiện hoặc dự án (VD: #tet-2027, #damcuoi-tuan).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 py-2">
          <div>
            <label className={labelCls}>Tên thẻ tag *</label>
            <Input placeholder="sam-tet-2027, du-lich-phu-quoc…" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} aria-invalid={!!errors.tag} maxLength={50} className="shadow-input text-xs" autoFocus />
            <FieldError message={errors.tag} />
          </div>
          <div>
            <label className={labelCls}>Mô tả sự kiện</label>
            <textarea rows={3} maxLength={500} placeholder="Chi tiêu chuẩn bị Tết Nguyên Đán…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="flex w-full rounded-md shadow-input bg-[#fafafa] dark:bg-[#111111] px-3 py-2 text-xs text-[#171717] dark:text-[#ededed] placeholder-[#888888] focus:outline-none" />
            <FieldError message={errors.description} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ngày bắt đầu</label>
              <Input type="date" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))} className="shadow-input text-xs" />
            </div>
            <div>
              <label className={labelCls}>Ngày kết thúc</label>
              <Input type="date" value={form.dateTo} min={form.dateFrom || undefined} onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))} aria-invalid={!!errors.dateTo} className="shadow-input text-xs" />
              <FieldError message={errors.dateTo} />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs shadow-border">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-[#171717] dark:bg-[#ededed] text-white dark:text-black">{loading ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo thẻ tag'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const RowActions: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
  <div className="flex items-center gap-1 shrink-0">
    <button type="button" onClick={onEdit} title="Sửa" aria-label="Sửa" className="p-1 rounded text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed] transition-colors">
      <Pencil className="w-3.5 h-3.5" />
    </button>
    <button type="button" onClick={onDelete} title="Xóa" aria-label="Xóa" className="p-1 rounded text-[#888888] hover:text-[#ff5b4f] transition-colors">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

type PendingDelete = { kind: 'category'; item: Category } | { kind: 'tag'; item: TagItem } | null;

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<CategoryType>('Expense');
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });
  const [tagModal, setTagModal] = useState<{ open: boolean; editing: TagItem | null }>({ open: false, editing: null });
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, tagRes]: any[] = await Promise.all([api.get('/categories'), api.get('/tags')]);
      setCategories(catRes.data || []);
      setTags(tagRes.data || []);
    } catch {
      toast.error('Không thể tải danh mục và thẻ tag.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleApplyPresetCategories = async () => {
    if (!window.confirm('Áp dụng bộ Danh mục chuẩn Việt Nam (Ăn uống, Nhà cửa, Đi lại, Mua sắm, Hiếu hỉ…)?')) return;
    try {
      setLoading(true);
      for (const cat of VIETNAMESE_STANDARD_CATEGORIES) {
        const res: any = await api.post('/categories', {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          parentId: null
        }).catch(() => null);

        if (res?.data?.id && cat.sub?.length) {
          for (const sub of cat.sub) {
            await api.post('/categories', {
              name: sub,
              icon: cat.icon,
              color: cat.color,
              type: cat.type,
              parentId: res.data.id
            }).catch(() => null);
          }
        }
      }
      toast.success('Đã nạp thành công bộ danh mục chuẩn Việt Nam!');
      loadData();
    } catch {
      toast.error('Không thể tạo danh mục mẫu.');
    } finally {
      setLoading(false);
    }
  };

  const visibleRoots = categories.filter(c => c.type === typeFilter);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === 'category') {
        await api.delete(`/categories/${pendingDelete.item.id}`);
        toast.success('Đã xóa danh mục.');
      } else {
        await api.delete(`/tags/${pendingDelete.item.id}`);
        toast.success('Đã xóa thẻ tag.');
      }
      setPendingDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Xóa thất bại.');
    }
  };

  const renderCategoryRow = (c: Category, isChild = false) => (
    <div key={c.id} className={`p-3 rounded-md shadow-border bg-[#ffffff] dark:bg-[#0a0a0a] flex items-center justify-between gap-3 hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors ${isChild ? 'ml-6' : ''}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {isChild && <CornerDownRight className="w-3.5 h-3.5 text-[#888888] shrink-0 -ml-1" />}
        <span className="w-7 h-7 rounded flex items-center justify-center text-sm shrink-0 bg-[#fafafa] dark:bg-[#111111] shadow-border">{displayIcon(c.icon)}</span>
        <div className="min-w-0">
          <h3 className="font-medium text-xs text-[#171717] dark:text-[#ededed] truncate">{c.name}</h3>
          <span className="text-[11px] text-[#888888]">
            {c.type === 'Revenue' ? 'Thu nhập' : 'Chi tiêu'}
            {!isChild && (c.subCategories?.length || 0) > 0 && ` · ${c.subCategories!.length} mục con`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
        <RowActions onEdit={() => setCategoryModal({ open: true, editing: c })} onDelete={() => setPendingDelete({ kind: 'category', item: c })} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Danh mục & Nhãn sự kiện</h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-0.5">Phân loại dòng tiền và gom nhóm theo sự kiện dự án</p>
        </div>

        <button
          type="button"
          onClick={handleApplyPresetCategories}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed] self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Áp dụng danh mục chuẩn VN</span>
        </button>
      </div>

      {/* Categories */}
      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-[#888888]" /> Danh mục Thu / Chi
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-[#fafafa] dark:bg-[#111111] shadow-border rounded-md">
              {(['Expense', 'Revenue'] as CategoryType[]).map(t => (
                <button key={t} type="button" onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${typeFilter === t ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs' : 'text-[#666666] dark:text-[#888888]'}`}>
                  {t === 'Expense' ? 'Chi tiêu (−)' : 'Thu nhập (+)'}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setCategoryModal({ open: true, editing: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium shadow-sm transition-colors duration-150">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm danh mục
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-md shadow-border bg-[#fafafa] dark:bg-[#0a0a0a] animate-pulse" />)}</div>
        ) : visibleRoots.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#888888] space-y-3">
            <p>Chưa có danh mục {typeFilter === 'Expense' ? 'chi tiêu' : 'thu nhập'} nào…</p>
            <Button size="sm" onClick={handleApplyPresetCategories} className="text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Nạp danh mục chuẩn Việt Nam
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleRoots.map(root => (
              <React.Fragment key={root.id}>
                {renderCategoryRow(root)}
                {root.subCategories?.map(child => renderCategoryRow({ ...child, parentId: root.id }, true))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#888888]" /> Thẻ tag sự kiện / dự án
          </h2>
          <button type="button" onClick={() => setTagModal({ open: true, editing: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium shadow-sm transition-colors duration-150">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm thẻ tag
          </button>
        </div>

        {loading ? (
          <div className="h-12 rounded-md shadow-border bg-[#fafafa] dark:bg-[#0a0a0a] animate-pulse" />
        ) : tags.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#888888]">Chưa có thẻ tag nào…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tags.map(t => (
              <div key={t.id} className="p-3 rounded-md shadow-border bg-[#ffffff] dark:bg-[#0a0a0a] flex items-start justify-between gap-3 hover:bg-[#fafafa] dark:hover:bg-[#111111] transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-[#171717] dark:text-[#ededed] truncate">#{t.tag}</span>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] text-[#888888] shadow-border bg-[#fafafa] dark:bg-[#111111] shrink-0 tabular-nums">{t.transactionCount} giao dịch</span>
                  </div>
                  {t.description && <p className="text-[11px] text-[#888888] mt-0.5 line-clamp-2">{t.description}</p>}
                  {(t.dateFrom || t.dateTo) && (
                    <p className="text-[10px] text-[#888888] mt-1 tabular-nums">{t.dateFrom ? formatDate(t.dateFrom) : '…'} – {t.dateTo ? formatDate(t.dateTo) : '…'}</p>
                  )}
                </div>
                <RowActions onEdit={() => setTagModal({ open: true, editing: t })} onDelete={() => setPendingDelete({ kind: 'tag', item: t })} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CategoryFormModal
        open={categoryModal.open}
        editing={categoryModal.editing}
        defaultType={typeFilter}
        roots={categories}
        onClose={() => setCategoryModal({ open: false, editing: null })}
        onSuccess={loadData}
      />
      <TagFormModal
        open={tagModal.open}
        editing={tagModal.editing}
        onClose={() => setTagModal({ open: false, editing: null })}
        onSuccess={loadData}
      />
      <Dialog open={pendingDelete !== null} onOpenChange={() => setPendingDelete(null)}>
        <DialogContent className="sm:max-w-sm bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">
              {pendingDelete?.kind === 'tag' ? 'Xóa thẻ tag' : 'Xóa danh mục'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#888888]">
              {pendingDelete?.kind === 'category'
                ? `Xóa danh mục "${pendingDelete.item.name}"? Các giao dịch sẽ được giữ lại nhưng không còn danh mục.`
                : `Xóa thẻ "#${pendingDelete?.item.tag}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPendingDelete(null)} className="text-xs shadow-border">Hủy</Button>
            <Button type="button" size="sm" onClick={handleDelete} className="text-xs bg-[#ff5b4f] text-white">Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
