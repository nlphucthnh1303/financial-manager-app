import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FieldError } from '@/components/ui/field-error';
import { check, collectErrors, type FormErrors } from '@/lib/validation';
import { Plus, Pencil, Trash2, Tag, FolderTree, CornerDownRight } from 'lucide-react';

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

const ICON_CHOICES = ['📁', '🍜', '☕', '🛒', '🏠', '💡', '🚗', '⛽', '🎬', '🎁', '💊', '📚', '👕', '✈️', '💰', '💼', '📈', '🐷'];
const COLOR_CHOICES = ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1', '#0ea5e9', '#06b6d4', '#10b981', '#84cc16', '#71717a'];

// Categories created before the emoji picker store plain identifiers such as "folder"
const displayIcon = (icon?: string) => (icon && !/^[a-z0-9_-]+$/i.test(icon) ? icon : '📁');

const toDateInput = (d?: string | null) => (d ? d.split('T')[0] : '');

const labelCls = 'text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block';
const selectCls = 'flex h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs shadow-xs text-zinc-900 dark:text-white focus:outline-none';

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

  // Only one nesting level is shown, so a parent must be a root of the same type (and not itself)
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
          <DialogDescription className="text-xs">Phân loại lý do thu/chi cho các giao dịch.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3 py-2">
          <div>
            <label className={labelCls}>Tên danh mục *</label>
            <Input placeholder="VD: Cà phê & Trà sữa" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} maxLength={100} autoFocus />
            <FieldError message={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Thuộc nhóm *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CategoryType, parentId: '' }))} className={selectCls}>
                <option value="Expense">Chi tiêu</option>
                <option value="Revenue">Thu nhập</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Danh mục cha</label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} className={selectCls} disabled={hasChildren}>
                <option value="">— Không có —</option>
                {parentOptions.map(p => <option key={p.id} value={p.id}>{displayIcon(p.icon)} {p.name}</option>)}
              </select>
            </div>
          </div>
          {hasChildren && <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Danh mục đang có danh mục con nên không thể chuyển thành danh mục con.</p>}
          <div>
            <label className={labelCls}>Biểu tượng *</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_CHOICES.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`w-8 h-8 rounded-md border text-base flex items-center justify-center transition ${form.icon === ic ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Màu sắc *</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {COLOR_CHOICES.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} aria-label={c}
                  className={`w-6 h-6 rounded-full border-2 transition ${form.color.toLowerCase() === c ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-7 h-7 rounded cursor-pointer bg-transparent" title="Chọn màu khác" />
            </div>
            <FieldError message={errors.color} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">{loading ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}</Button>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{editing ? 'Sửa thẻ tag' : 'Thêm thẻ tag'}</DialogTitle>
          <DialogDescription className="text-xs">Gom nhóm giao dịch theo sự kiện hoặc dự án.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3 py-2">
          <div>
            <label className={labelCls}>Tên thẻ tag *</label>
            <Input placeholder="VD: dulich-dalat-2026" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} aria-invalid={!!errors.tag} maxLength={50} autoFocus />
            <FieldError message={errors.tag} />
          </div>
          <div>
            <label className={labelCls}>Mô tả sự kiện</label>
            <textarea rows={3} maxLength={500} placeholder="VD: Chuyến đi Đà Lạt cùng gia đình" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <FieldError message={errors.description} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ngày bắt đầu</label>
              <Input type="date" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Ngày kết thúc</label>
              <Input type="date" value={form.dateTo} min={form.dateFrom || undefined} onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))} aria-invalid={!!errors.dateTo} />
              <FieldError message={errors.dateTo} />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">{loading ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo thẻ tag'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ConfirmDeleteModal: React.FC<{ open: boolean; title: string; message: string; onClose: () => void; onConfirm: () => Promise<void> }> = ({ open, title, message, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    try { setLoading(true); await onConfirm(); }
    finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-xs">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
          <Button type="button" disabled={loading} size="sm" onClick={handleConfirm} className="text-xs bg-rose-600 hover:bg-rose-700 text-white">{loading ? 'Đang xóa...' : 'Xóa'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RowActions: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
  <div className="flex items-center gap-0.5 shrink-0">
    <button type="button" onClick={onEdit} title="Sửa" className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
      <Pencil className="w-3.5 h-3.5" />
    </button>
    <button type="button" onClick={onDelete} title="Xóa" className="p-1.5 rounded-md text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
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
    <div key={c.id} className={`p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition ${isChild ? 'ml-6' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        {isChild && <CornerDownRight className="w-3.5 h-3.5 text-zinc-400 shrink-0 -ml-1" />}
        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `${c.color}22` }}>{displayIcon(c.icon)}</span>
        <div className="min-w-0">
          <h3 className="font-semibold text-xs text-zinc-900 dark:text-white truncate">{c.name}</h3>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {c.type === 'Revenue' ? 'Thu nhập' : 'Chi tiêu'}
            {!isChild && (c.subCategories?.length || 0) > 0 && ` · ${c.subCategories!.length} danh mục con`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
        <RowActions onEdit={() => setCategoryModal({ open: true, editing: c })} onDelete={() => setPendingDelete({ kind: 'category', item: c })} />
      </div>
    </div>
  );

  const deleteMessage = !pendingDelete ? '' : pendingDelete.kind === 'category'
    ? `Xóa danh mục "${pendingDelete.item.name}"? Các giao dịch đang dùng danh mục này sẽ được giữ lại nhưng không còn danh mục.`
    : `Xóa thẻ "#${pendingDelete.item.tag}"? Thẻ sẽ được gỡ khỏi ${pendingDelete.item.transactionCount} giao dịch đang gắn.`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Danh mục & Nhãn</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Phân loại giao dịch Thu/Chi theo danh mục và gom nhóm bằng thẻ tag</p>
      </div>

      {/* Categories */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-zinc-500" /> Danh mục Thu / Chi
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              {(['Expense', 'Revenue'] as CategoryType[]).map(t => (
                <button key={t} type="button" onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${typeFilter === t ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  {t === 'Expense' ? 'Chi tiêu' : 'Thu nhập'}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setCategoryModal({ open: true, editing: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm danh mục
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
        ) : visibleRoots.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">Chưa có danh mục {typeFilter === 'Expense' ? 'chi tiêu' : 'thu nhập'} nào.</p>
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
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-zinc-500" /> Thẻ tag
          </h2>
          <button type="button" onClick={() => setTagModal({ open: true, editing: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm thẻ
          </button>
        </div>

        {loading ? (
          <div className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ) : tags.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">Chưa có thẻ tag nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tags.map(t => (
              <div key={t.id} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate">#{t.tag}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">{t.transactionCount} giao dịch</span>
                  </div>
                  {t.description && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{t.description}</p>}
                  {(t.dateFrom || t.dateTo) && (
                    <p className="text-[10px] text-zinc-400 mt-1">{t.dateFrom ? formatDate(t.dateFrom) : '…'} – {t.dateTo ? formatDate(t.dateTo) : '…'}</p>
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
      <ConfirmDeleteModal
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'tag' ? 'Xóa thẻ tag' : 'Xóa danh mục'}
        message={deleteMessage}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
