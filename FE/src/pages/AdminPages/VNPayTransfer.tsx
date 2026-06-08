import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WithdrawalService from '../../services/withdrawalService';
import type { Withdrawal, TransferRequest } from '../../services/withdrawalService';

const VNPayTransfer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Load withdrawal info by fetching the list and finding the one
    setLoading(true);
    WithdrawalService.getAll(undefined, undefined, undefined, 0, 100)
      .then(d => {
        const found = d?.content?.find(w => w.id === Number(id));
        if (found) setWithdrawal(found);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const formatMoney = (n: number) => n?.toLocaleString('vi-VN') + ' ₫';
  const formatCard = (v: string) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);

  const commissionRate = 5;
  const commission = withdrawal ? Math.round(withdrawal.amount * commissionRate) / 100 : 0;
  const actualTransfer = withdrawal ? withdrawal.amount - commission : 0;

  const handleSubmit = async () => {
    if (!withdrawal || !agreeTerms) return;
    if (cardNumber.replace(/\s/g, '').length < 10) {
      alert('Vui lòng nhập số thẻ hợp lệ');
      return;
    }

    setTransferring(true);
    try {
      const transferReq: TransferRequest = {
        transactionRef: 'VNP-' + Date.now().toString(36).toUpperCase(),
        bankName: bankCode || withdrawal.bankName,
        note: transactionNote || `Chuyển tiền qua VNPay - STK ${withdrawal.accountNumber}`
      };
      await WithdrawalService.markTransferred(withdrawal.id, transferReq);
      alert('Chuyển tiền thành công!');
      navigate('/admin/withdrawals');
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi chuyển tiền. Vui lòng thử lại.');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>hourglass</span>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!withdrawal) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#dc2626' }}>error</span>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>Không tìm thấy yêu cầu rút tiền</p>
          <button onClick={() => navigate('/admin/withdrawals')} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#0037b0', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem' }}>
      {/* VNPay Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #0037b0, #1d4ed8)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.05em' }}>VNPay</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cổng thanh toán</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Giao dịch an toàn · Mã hóa SSL/TLS 256-bit</p>
      </div>

      {/* Transfer Card */}
      <div style={{ background: '#fff', borderRadius: '1rem', boxShadow: '0 20px 50px rgba(0,55,176,0.08)', overflow: 'hidden' }}>
        {/* Amount Display */}
        <div style={{ background: 'linear-gradient(135deg, #0037b0, #1d4ed8)', padding: '1.5rem', color: '#fff', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.5rem' }}>Số tiền chuyển thực tế</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{formatMoney(actualTransfer)}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', opacity: 0.85, marginTop: '0.5rem' }}>
            <span>Yêu cầu: {formatMoney(withdrawal.amount)}</span>
            <span>Phí sàn {commissionRate}%: -{formatMoney(commission)}</span>
          </div>
          <p style={{ fontSize: '0.6875rem', opacity: 0.7, marginTop: '0.25rem' }}>#WD-{withdrawal.id}</p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Recipient Info */}
          <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Thông tin người nhận</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8125rem' }}>
              <span style={{ color: '#64748b' }}>Xưởng</span>
              <strong>{withdrawal.factoryName || `User #${withdrawal.factoryUserId}`}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8125rem' }}>
              <span style={{ color: '#64748b' }}>Ngân hàng</span>
              <strong>{withdrawal.bankName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8125rem' }}>
              <span style={{ color: '#64748b' }}>Số TK</span>
              <strong style={{ fontFamily: 'monospace' }}>{withdrawal.accountNumber}</strong>
            </div>
            {withdrawal.accountName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b' }}>Chủ TK</span>
                <strong>{withdrawal.accountName}</strong>
              </div>
            )}
          </div>

          {/* Card Info Form */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>credit_card</span>
              Số thẻ nguồn
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={e => setCardNumber(formatCard(e.target.value))}
              placeholder="1234 5678 9012 3456"
              disabled={transferring}
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '0.05em', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = '#0037b0'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>person</span>
              Tên chủ thẻ
            </label>
            <input
              type="text"
              value={cardHolder}
              onChange={e => setCardHolder(e.target.value.toUpperCase())}
              placeholder="NGUYEN VAN A"
              disabled={transferring}
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = '#0037b0'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ngân hàng</label>
              <select
                value={bankCode}
                onChange={e => setBankCode(e.target.value)}
                disabled={transferring}
                style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="">Chọn ngân hàng</option>
                <option value="VCB">Vietcombank (VCB)</option>
                <option value="BIDV">BIDV</option>
                <option value="TCB">Techcombank (TCB)</option>
                <option value="MB">MB Bank</option>
                <option value="ACB">ACB</option>
                <option value="VPB">VPBank</option>
                <option value="CTG">VietinBank</option>
                <option value="AGR">Agribank</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ghi chú GD</label>
              <input
                type="text"
                value={transactionNote}
                onChange={e => setTransactionNote(e.target.value)}
                placeholder="Ghi chú..."
                disabled={transferring}
                style={{ width: '100%', padding: '0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Terms */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              disabled={transferring}
              style={{ marginTop: '0.125rem', accentColor: '#0037b0' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Tôi xác nhận thông tin chuyển tiền là chính xác. Giao dịch được thực hiện qua cổng <strong style={{ color: '#0037b0' }}>VNPay</strong> và không thể hoàn tác sau khi xác nhận.
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={transferring || !agreeTerms}
            style={{
              width: '100%', padding: '0.875rem', border: 'none', borderRadius: '0.5rem',
              background: transferring || !agreeTerms ? '#94a3b8' : 'linear-gradient(135deg, #0037b0, #1d4ed8)',
              color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: transferring || !agreeTerms ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: transferring || !agreeTerms ? 'none' : '0 4px 14px rgba(0,55,176,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {transferring ? (
              <>Đang xử lý...</>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>lock</span>
                Xác nhận chuyển {formatMoney(actualTransfer)}
              </>
            )}
          </button>

          {/* Cancel */}
          <button
            onClick={() => navigate('/admin/withdrawals')}
            disabled={transferring}
            style={{
              width: '100%', padding: '0.75rem', marginTop: '0.75rem', border: '1.5px solid #e2e8f0',
              borderRadius: '0.5rem', background: '#fff', color: '#64748b', fontWeight: 600,
              fontSize: '0.875rem', cursor: 'pointer'
            }}
          >
            Hủy bỏ
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.6875rem', color: '#94a3b8' }}>
        <span>🔒 Bảo mật SSL/TLS</span>
        <span>🛡️ Chống gian lận</span>
        <span>✅ Giao dịch an toàn</span>
      </div>
    </div>
  );
};

export default VNPayTransfer;
