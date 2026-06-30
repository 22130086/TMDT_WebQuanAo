import { useState, useEffect, useCallback } from 'react';
import AdminCategoryService from '../../services/adminCategoryService';
import type { CategoryItem } from '../../services/adminCategoryService';
import '../../styles/admin-table.css';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formParentId, setFormParentId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const roots = await AdminCategoryService.getRoots();
      // Lấy danh sách phẳng: roots + children
      const all: any[] = [];
      for (const r of roots) {
        all.push(r);
        try {
          const children = await AdminCategoryService.getChildren(r.id);
          children.forEach((c: any) => { c._parentName = r.name; });
          all.push(...children);
        } catch {}
      }
      setCategories(all as CategoryItem[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormParentId(null);
    setEditingId(null);
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormParentId(cat.parent?.id ?? null);
    setShowForm(true);
    setError('');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formName.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      if (editingId !== null) {
        await AdminCategoryService.update(editingId, {
          name: formName.trim(),
          slug: formSlug.trim() || formName.trim().toLowerCase().replace(/\s+/g, '-'),
          parentId: formParentId,
        });
        setSuccess('Cập nhật danh mục thành công!');
      } else {
        await AdminCategoryService.create({
          name: formName.trim(),
          slug: formSlug.trim() || formName.trim().toLowerCase().replace(/\s+/g, '-'),
          parentId: formParentId,
        });
        setSuccess('Thêm danh mục thành công!');
      }
      fetchCategories();
      setTimeout(() => {
        setShowForm(false);
        resetForm();
        setSuccess('');
      }, 800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) return;
    try {
      await AdminCategoryService.delete(id);
      setSuccess('Đã xóa danh mục!');
      fetchCategories();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xóa danh mục');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getParentName = (cat: any): string => {
    return cat._parentName || cat.parent?.name || '—';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Build a flat list for parent selection (exclude current editing item and its children)
  const parentOptions = categories.filter(c => c.id !== editingId);

  return (
    <div className="at-container">
      {loading && <div className="at-loading">Đang tải...</div>}
      {success && (
        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="at-section">
        <div className="at-header">
          <h3>Quản lý Danh mục</h3>
          <button className="at-btn primary" onClick={handleOpenAdd}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Thêm danh mục
          </button>
        </div>

        <div className="at-table-wrap">
          <table className="at-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th>Danh mục cha</th>
                <th>Ngày tạo</th>
                <th className="center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && !loading && (
                <tr><td colSpan={6} className="at-empty">Chưa có danh mục nào</td></tr>
              )}
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td><span className="at-id">#{cat.id}</span></td>
                  <td><span className="at-name">{cat.name}</span></td>
                  <td><span className="at-sub">{cat.slug}</span></td>
                  <td><span className="at-sub">{getParentName(cat)}</span></td>
                  <td><span className="at-date">{formatDate(cat.createdAt)}</span></td>
                  <td className="center">
                    <div className="at-actions" style={{ justifyContent: 'center' }}>
                      <button className="at-btn info" onClick={() => handleOpenEdit(cat)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>edit</span>
                        Sửa
                      </button>
                      <button className="at-btn danger" onClick={() => handleDelete(cat.id, cat.name)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>delete</span>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className="at-modal-overlay" onClick={handleCloseForm}>
          <div className="at-modal" onClick={e => e.stopPropagation()}>
            <div className="at-modal-header">
              <h3>{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
              <button className="at-modal-close" onClick={handleCloseForm}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="at-modal-body">
                <div className="at-form-group">
                  <label>Tên danh mục <span className="req">*</span></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Nhập tên danh mục..."
                    autoFocus
                  />
                </div>
                <div className="at-form-group">
                  <label>Slug</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={e => setFormSlug(e.target.value)}
                    placeholder="ten-danh-muc (tự động nếu để trống)"
                  />
                </div>
                <div className="at-form-group">
                  <label>Danh mục cha</label>
                  <select
                    value={formParentId ?? ''}
                    onChange={e => setFormParentId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">— Không có (danh mục gốc) —</option>
                    {parentOptions.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.parent ? `(con của ${c.parent.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="at-modal-footer">
                <button type="button" className="at-btn outline" onClick={handleCloseForm}>Hủy</button>
                <button type="submit" className="at-btn primary">
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
