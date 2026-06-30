import { useState, useEffect, useCallback } from 'react';
import AdminAttributeService from '../../services/adminAttributeService';
import type { AttributeItem } from '../../services/adminAttributeService';
import '../../styles/admin-table.css';

export default function AttributeManagement() {
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formValues, setFormValues] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminAttributeService.getAll();
      setAttributes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAttributes(); }, [fetchAttributes]);

  const resetForm = () => {
    setFormName('');
    setFormValues('');
    setEditingId(null);
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (attr: AttributeItem) => {
    setEditingId(attr.id);
    setFormName(attr.name);
    setFormValues(attr.values?.map(v => v.value).join(', ') || '');
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
      setError('Vui lòng nhập tên thuộc tính');
      return;
    }

    try {
      if (editingId !== null) {
        await AdminAttributeService.update(editingId, {
          name: formName.trim(),
          attributeValues: formValues.trim(),
        });
        setSuccess('Cập nhật thuộc tính thành công!');
      } else {
        await AdminAttributeService.create({
          name: formName.trim(),
          attributeValues: formValues.trim(),
        });
        setSuccess('Thêm thuộc tính thành công!');
      }
      fetchAttributes();
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
    if (!window.confirm(`Bạn có chắc muốn xóa thuộc tính "${name}"?`)) return;
    try {
      await AdminAttributeService.delete(id);
      setSuccess('Đã xóa thuộc tính!');
      fetchAttributes();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xóa thuộc tính');
      setTimeout(() => setError(''), 3000);
    }
  };

  const renderValues = (attr: AttributeItem) => {
    if (!attr.values || attr.values.length === 0) return <span className="at-sub">—</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {attr.values.map((v, i) => (
          <span key={v.id || i} className="at-badge info">{v.value}</span>
        ))}
      </div>
    );
  };

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
          <div>
            <h3>Quản lý Thuộc tính Sản phẩm</h3>
            <p className="subtitle">Kích thước, Màu sắc, Chất liệu và các thuộc tính khác</p>
          </div>
          <button className="at-btn primary" onClick={handleOpenAdd}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Thêm thuộc tính
          </button>
        </div>

        <div className="at-table-wrap">
          <table className="at-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên thuộc tính</th>
                <th>Giá trị</th>
                <th className="center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {attributes.length === 0 && !loading && (
                <tr><td colSpan={4} className="at-empty">Chưa có thuộc tính nào</td></tr>
              )}
              {attributes.map(attr => (
                <tr key={attr.id}>
                  <td><span className="at-id">#{attr.id}</span></td>
                  <td><span className="at-name">{attr.name}</span></td>
                  <td>{renderValues(attr)}</td>
                  <td className="center">
                    <div className="at-actions" style={{ justifyContent: 'center' }}>
                      <button className="at-btn info" onClick={() => handleOpenEdit(attr)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>edit</span>
                        Sửa
                      </button>
                      <button className="at-btn danger" onClick={() => handleDelete(attr.id, attr.name)}>
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
              <h3>{editingId ? 'Sửa thuộc tính' : 'Thêm thuộc tính mới'}</h3>
              <button className="at-modal-close" onClick={handleCloseForm}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="at-modal-body">
                <div className="at-form-group">
                  <label>Tên thuộc tính <span className="req">*</span></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="VD: Kích thước, Màu sắc, Chất liệu..."
                    autoFocus
                  />
                </div>
                <div className="at-form-group">
                  <label>
                    Giá trị thuộc tính
                    <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.75rem', textTransform: 'none', letterSpacing: '0' }}>
                      (phân cách bằng dấu phẩy)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formValues}
                    onChange={e => setFormValues(e.target.value)}
                    placeholder="VD: S, M, L, XL, XXL"
                  />
                  {formValues && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {formValues.split(',').map((v, i) => {
                        const trimmed = v.trim();
                        return trimmed ? (
                          <span key={i} className="at-badge info">{trimmed}</span>
                        ) : null;
                      })}
                    </div>
                  )}
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
