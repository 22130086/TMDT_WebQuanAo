import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../../services/http';
import '../../styles/factory-profile.css';

interface ApiResponse<T> { data: T; message?: string; }

interface FactoryDetail {
  id: number; userId: number; factoryName: string; factoryUserName?: string;
  description?: string; address?: string; minQuantity?: number; maxQuantity?: number;
  leadTimeDays?: number; verifiedStatus: string; imageUrls?: string[];
  certificates?: { id: number; name: string; imageUrl: string; issuedDate?: string; expiredDate?: string }[];
}

export default function FactoryProfileSetup() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FactoryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Form fields
  const [factoryName, setFactoryName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [minQuantity, setMinQuantity] = useState<number | ''>('');
  const [maxQuantity, setMaxQuantity] = useState<number | ''>('');
  const [leadTimeDays, setLeadTimeDays] = useState<number | ''>('');

  // Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certName, setCertName] = useState('');
  const [certIssuedDate, setCertIssuedDate] = useState('');
  const [certExpiredDate, setCertExpiredDate] = useState('');

  const API_BASE = 'http://localhost:8080';

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<ApiResponse<FactoryDetail>>('/factory/profile');
      if (res.data?.data) {
        const p = res.data.data;
        setProfile(p);
        setFactoryName(p.factoryName || '');
        setDescription(p.description || '');
        setAddress(p.address || '');
        setMinQuantity(p.minQuantity ?? '');
        setMaxQuantity(p.maxQuantity ?? '');
        setLeadTimeDays(p.leadTimeDays ?? '');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await http.post('/factory/profile', {
        factoryName, description, address,
        minQuantity: minQuantity || null,
        maxQuantity: maxQuantity || null,
        leadTimeDays: leadTimeDays || null,
      });
      showMsg('✅ Lưu hồ sơ thành công!');
      fetchProfile();
    } catch (e: any) {
      showMsg('❌ ' + (e.response?.data?.message || 'Lỗi lưu hồ sơ'));
    }
    finally { setSaving(false); }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await http.post<ApiResponse<{ url: string }>>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        await http.post('/factory/profile/images', null, { params: { imageUrl: url, isPrimary: false } });
        showMsg('✅ Tải ảnh thành công!');
        fetchProfile();
      }
    } catch (e: any) {
      showMsg('❌ ' + (e.response?.data?.message || 'Lỗi upload ảnh'));
    }
    finally { setUploadingImage(false); }
  };

  const handleUploadCert = async () => {
    // Upload cert image via hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      setUploadingCert(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await http.post<ApiResponse<{ url: string }>>('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = res.data?.data?.url;
        if (url) {
          await http.post('/factory/profile/certs', {
            name: certName || 'Giấy phép',
            imageUrl: url,
            issuedDate: certIssuedDate || null,
            expiredDate: certExpiredDate || null,
          });
          showMsg('✅ Thêm chứng chỉ thành công!');
          setCertName(''); setCertIssuedDate(''); setCertExpiredDate('');
          fetchProfile();
        }
      } catch (e: any) {
        showMsg('❌ ' + (e.response?.data?.message || 'Lỗi upload chứng chỉ'));
      }
      finally { setUploadingCert(false); }
    };
    input.click();
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải hồ sơ...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>Thiết lập hồ sơ xưởng</h2>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>
            Trạng thái: <span style={{
              color: profile?.verifiedStatus === 'APPROVED' ? '#16a34a' : profile?.verifiedStatus === 'REJECTED' ? '#dc2626' : '#eab308',
              fontWeight: 600
            }}>{profile?.verifiedStatus === 'PENDING' ? '⏳ Chờ duyệt' : profile?.verifiedStatus === 'APPROVED' ? '✅ Đã duyệt' : profile?.verifiedStatus === 'REJECTED' ? '❌ Từ chối' : profile?.verifiedStatus}</span>
          </p>
        </div>
        <button onClick={() => navigate('/factory')} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          ← Về Dashboard
        </button>
      </div>

      {msg && <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontWeight: 500 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: Profile form */}
        <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 12px 30px rgba(0,55,176,0.05)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>📋 Thông tin xưởng</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Tên xưởng *</label>
            <input value={factoryName} onChange={e => setFactoryName(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} placeholder="Xưởng May Blueprint" />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Địa chỉ *</label>
            <input value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} placeholder="123 Đường Công Nghiệp, TP.HCM" />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Mô tả năng lực</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', resize: 'vertical' }} placeholder="Mô tả năng lực sản xuất, loại sản phẩm chuyên may..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>SL tối thiểu</label>
              <input type="number" value={minQuantity} onChange={e => setMinQuantity(e.target.value ? parseInt(e.target.value) : '')} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>SL tối đa</label>
              <input type="number" value={maxQuantity} onChange={e => setMaxQuantity(e.target.value ? parseInt(e.target.value) : '')} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>T/gian SX (ngày)</label>
              <input type="number" value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value ? parseInt(e.target.value) : '')} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
            </div>
          </div>
          <button onClick={handleSaveProfile} disabled={saving} style={{ width: '100%', padding: '0.625rem', background: '#0037b0', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
            {saving ? 'Đang lưu...' : '💾 Lưu hồ sơ'}
          </button>
        </div>

        {/* Right: Images & Certificates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Images */}
          <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 12px 30px rgba(0,55,176,0.05)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>🖼️ Hình ảnh xưởng</h3>
            {profile?.imageUrls && profile.imageUrls.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {profile.imageUrls.map((url, i) => (
                  <img key={i} src={API_BASE + url} alt={`Factory ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }} />
                ))}
              </div>
            )}
            <label style={{ display: 'block', textAlign: 'center', padding: '1.5rem', border: '2px dashed #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b' }}>
              {uploadingImage ? '⏳ Đang tải...' : '📁 Click để tải ảnh xưởng'}
              <input type="file" accept="image/*" onChange={handleUploadImage} style={{ display: 'none' }} disabled={uploadingImage} />
            </label>
          </div>

          {/* Certificates */}
          <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 12px 30px rgba(0,55,176,0.05)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>📜 Chứng chỉ / Giấy phép</h3>
            {profile?.certificates && profile.certificates.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                {profile.certificates.map(cert => (
                  <div key={cert.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                    {cert.imageUrl && <img src={API_BASE + cert.imageUrl} alt={cert.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.25rem' }} />}
                    <div style={{ flex: 1, fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600 }}>{cert.name}</div>
                      {cert.issuedDate && <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{cert.issuedDate} {cert.expiredDate ? `→ ${cert.expiredDate}` : ''}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input value={certName} onChange={e => setCertName(e.target.value)} placeholder="Tên chứng chỉ (VD: Giấy phép kinh doanh)" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem', marginBottom: '0.5rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="date" value={certIssuedDate} onChange={e => setCertIssuedDate(e.target.value)} placeholder="Ngày cấp" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }} title="Ngày cấp" />
              <input type="date" value={certExpiredDate} onChange={e => setCertExpiredDate(e.target.value)} placeholder="Ngày hết hạn" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }} title="Ngày hết hạn" />
            </div>
            <button onClick={handleUploadCert} disabled={uploadingCert} style={{ width: '100%', padding: '0.5rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
              {uploadingCert ? '⏳ Đang tải...' : '📎 Thêm chứng chỉ (chọn ảnh)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
