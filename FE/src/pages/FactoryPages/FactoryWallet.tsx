import { useState, useEffect, useCallback } from 'react';
import WalletService from '../../services/walletService';
import type { Wallet, WalletTransaction } from '../../services/walletService';
import '../../styles/wallet.css';

const FactoryWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Deposit modal
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Withdraw modal
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchWallet = useCallback(async () => {
    try {
      await WalletService.ensureWallet();
      const w = await WalletService.getMyWallet();
      setWallet(w);
      setError(null);
    } catch (e: any) {
      console.error('Lỗi tải ví:', e);
      setError(e?.response?.data?.message || 'Không thể tải thông tin ví');
    }
  }, []);

  const fetchTransactions = useCallback(async (page: number) => {
    try {
      const d = await WalletService.getMyTransactions(page, 10);
      if (d?.content) {
        setTransactions(d.content);
        setTxTotalPages(d.totalPages || 1);
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const d = await WalletService.getWithdrawals(0, 10);
      if (d?.content) setWithdrawals(d.content);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchWallet(); fetchTransactions(0); fetchWithdrawals(); }, [fetchWallet, fetchTransactions, fetchWithdrawals]);
  useEffect(() => { setLoading(false); }, [wallet]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { showMsg('error', 'Số tiền không hợp lệ'); return; }
    setDepositing(true);
    try {
      await WalletService.deposit(amount, depositNote || undefined);
      showMsg('success', 'Nạp tiền thành công!');
      setShowDeposit(false);
      setDepositAmount('');
      setDepositNote('');
      fetchWallet();
      fetchTransactions(0);
    } catch (e: any) {
      showMsg('error', e?.response?.data?.message || 'Nạp tiền thất bại');
    } finally { setDepositing(false); }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { showMsg('error', 'Số tiền không hợp lệ'); return; }
    if (!bankName || !accountNumber || !accountName) { showMsg('error', 'Vui lòng điền đầy đủ thông tin ngân hàng'); return; }
    setWithdrawing(true);
    try {
      await WalletService.requestWithdrawal(amount, bankName, accountNumber, accountName);
      showMsg('success', 'Gửi yêu cầu rút tiền thành công!');
      setShowWithdraw(false);
      setWithdrawAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      fetchWallet();
      fetchTransactions(0);
      fetchWithdrawals();
    } catch (e: any) {
      showMsg('error', e?.response?.data?.message || 'Gửi yêu cầu thất bại');
    } finally { setWithdrawing(false); }
  };

  const formatMoney = (n: number) => (n ?? 0).toLocaleString('vi-VN') + ' ₫';
  const statusLabels: Record<string, string> = {
    PENDING: 'Đang chờ', APPROVED: 'Đã duyệt', TRANSFERRED: 'Đã chuyển', REJECTED: 'Từ chối'
  };

  if (loading) return <div className="wallet-loading">Đang tải...</div>;

  return (
    <div className="wallet-container">
      {message && <div className={`wallet-toast ${message.type}`}>{message.text}</div>}
      {error && (
        <div className="wallet-error-banner">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
          <button onClick={() => { setError(null); fetchWallet(); }}>Thử lại</button>
        </div>
      )}

      {/* Balance Cards */}
      <div className="wallet-cards">
        <div className="wallet-card balance">
          <div className="wallet-card-icon"><span className="material-symbols-outlined">account_balance_wallet</span></div>
          <div className="wallet-card-info">
            <p className="wallet-card-label">Số dư khả dụng</p>
            <h2 className="wallet-card-value">{formatMoney(wallet?.balance ?? 0)}</h2>
          </div>
        </div>
        <div className="wallet-card frozen">
          <div className="wallet-card-icon"><span className="material-symbols-outlined">lock</span></div>
          <div className="wallet-card-info">
            <p className="wallet-card-label">Đang phong tỏa</p>
            <h2 className="wallet-card-value">{formatMoney(wallet?.frozen ?? 0)}</h2>
          </div>
        </div>
        <div className="wallet-card total">
          <div className="wallet-card-icon"><span className="material-symbols-outlined">savings</span></div>
          <div className="wallet-card-info">
            <p className="wallet-card-label">Tổng tài sản</p>
            <h2 className="wallet-card-value">{formatMoney((wallet?.balance ?? 0) + (wallet?.frozen ?? 0))}</h2>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="wallet-actions">
        <button className="wallet-btn deposit-btn" onClick={() => setShowDeposit(true)}>
          <span className="material-symbols-outlined">add_circle</span> Nạp tiền
        </button>
        <button className="wallet-btn withdraw-btn" onClick={() => setShowWithdraw(true)}>
          <span className="material-symbols-outlined">payments</span> Rút tiền
        </button>
      </div>

      {/* Transaction History */}
      <div className="wallet-section">
        <h3><span className="material-symbols-outlined">receipt_long</span> Lịch sử giao dịch</h3>
        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Số dư sau GD</th>
                <th>Ghi chú</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="wallet-empty">Chưa có giao dịch nào</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id}>
                    <td><span className={`tx-type tx-${tx.type?.toLowerCase()}`}>{WalletService.getTypeLabel(tx.type)}</span></td>
                    <td className={tx.amount >= 0 ? 'tx-positive' : 'tx-negative'}>
                      {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount)}
                    </td>
                    <td>{formatMoney(tx.balanceAfter)}</td>
                    <td className="tx-note">{tx.note || '-'}</td>
                    <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {txTotalPages > 1 && (
          <div className="wallet-pagination">
            <button disabled={txPage === 0} onClick={() => { setTxPage(txPage - 1); fetchTransactions(txPage - 1); }}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span>Trang {txPage + 1} / {txTotalPages}</span>
            <button disabled={txPage >= txTotalPages - 1} onClick={() => { setTxPage(txPage + 1); fetchTransactions(txPage + 1); }}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      <div className="wallet-section">
        <h3><span className="material-symbols-outlined">history</span> Lịch sử rút tiền</h3>
        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>Số tiền</th>
                <th>Ngân hàng</th>
                <th>STK</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan={5} className="wallet-empty">Chưa có yêu cầu rút tiền</td></tr>
              ) : (
                withdrawals.map(w => (
                  <tr key={w.id}>
                    <td className="tx-negative">-{formatMoney(w.amount)}</td>
                    <td>{w.bankName}</td>
                    <td>{w.accountNumber}</td>
                    <td><span className={`wd-status wd-${w.status?.toLowerCase()}`}>{statusLabels[w.status] || w.status}</span></td>
                    <td>{w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN') : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="wallet-modal-overlay" onClick={() => setShowDeposit(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <h3>Nạp tiền vào ví</h3>
            <div className="wallet-form-group">
              <label>Số tiền (VNĐ)</label>
              <input type="number" placeholder="Nhập số tiền" value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)} min="10000" step="1000" />
            </div>
            <div className="wallet-form-group">
              <label>Ghi chú</label>
              <input type="text" placeholder="Nội dung nạp tiền" value={depositNote}
                onChange={e => setDepositNote(e.target.value)} />
            </div>
            <div className="wallet-modal-actions">
              <button className="wallet-btn-cancel" onClick={() => setShowDeposit(false)}>Hủy</button>
              <button className="wallet-btn-submit" onClick={handleDeposit} disabled={depositing}>
                {depositing ? 'Đang xử lý...' : 'Xác nhận nạp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="wallet-modal-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <h3>Yêu cầu rút tiền</h3>
            <div className="wallet-form-group">
              <label>Số tiền (VNĐ) - Số dư: {formatMoney(wallet?.balance ?? 0)}</label>
              <input type="number" placeholder="Nhập số tiền" value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)} min="10000" step="1000" />
            </div>
            <div className="wallet-form-group">
              <label>Tên ngân hàng</label>
              <input type="text" placeholder="VD: Vietcombank" value={bankName}
                onChange={e => setBankName(e.target.value)} />
            </div>
            <div className="wallet-form-group">
              <label>Số tài khoản</label>
              <input type="text" placeholder="Nhập số tài khoản" value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)} />
            </div>
            <div className="wallet-form-group">
              <label>Tên chủ tài khoản</label>
              <input type="text" placeholder="Nhập tên chủ TK" value={accountName}
                onChange={e => setAccountName(e.target.value)} />
            </div>
            <div className="wallet-modal-actions">
              <button className="wallet-btn-cancel" onClick={() => setShowWithdraw(false)}>Hủy</button>
              <button className="wallet-btn-submit" onClick={handleWithdraw} disabled={withdrawing}>
                {withdrawing ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryWallet;
