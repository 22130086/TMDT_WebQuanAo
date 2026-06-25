import React, { useState, useEffect, useCallback } from 'react';
import WalletService from '../../services/walletService';
import type { Wallet, WalletTransaction } from '../../services/walletService';
import '../../styles/admin-table.css';
import '../../styles/wallet.css';

const AdminWalletManagement: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Detail modal
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedTx, setSelectedTx] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Adjust modal
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Wallet | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // All transactions
  const [allTx, setAllTx] = useState<WalletTransaction[]>([]);
  const [allTxPage, setAllTxPage] = useState(0);
  const [allTxTotalPages, setAllTxTotalPages] = useState(1);
  const [showAllTx, setShowAllTx] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const pageSize = 20;

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchWallets = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const d = await WalletService.getAllWallets(search || undefined, p, pageSize);
      if (d?.content) { setWallets(d.content); setTotalPages(d.totalPages || 1); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchWallets(0); }, [fetchWallets]);

  const formatMoney = (n: number) => (n ?? 0).toLocaleString('vi-VN') + ' ₫';

  const openDetail = async (wallet: Wallet) => {
    setSelectedWallet(wallet);
    try {
      const d = await WalletService.getUserTransactions(wallet.user.id, 0, 10);
      if (d?.content) { setSelectedTx(d.content); setTxTotalPages(d.totalPages || 1); }
    } catch (e) { setSelectedTx([]); }
    setTxPage(0);
  };

  const fetchDetailTx = async (walletId: number, p: number) => {
    try {
      const d = await WalletService.getUserTransactions(walletId, p, 10);
      if (d?.content) { setSelectedTx(d.content); setTxTotalPages(d.totalPages || 1); setTxPage(p); }
    } catch (e) { console.error(e); }
  };

  const openAdjust = (wallet: Wallet) => {
    setAdjustTarget(wallet);
    setAdjustAmount('');
    setAdjustNote('');
    setShowAdjust(true);
  };

  const handleAdjust = async () => {
    const amount = parseFloat(adjustAmount);
    if (!amount || isNaN(amount) || amount === 0) { showMsg('error', 'Số tiền không hợp lệ'); return; }
    if (!adjustTarget) return;
    setAdjusting(true);
    try {
      await WalletService.adjustBalance(adjustTarget.user.id, amount, adjustNote || undefined);
      showMsg('success', `Đã ${amount > 0 ? 'cộng' : 'trừ'} ${formatMoney(Math.abs(amount))} cho ${adjustTarget.user.fullName}`);
      setShowAdjust(false);
      fetchWallets(page);
      if (selectedWallet?.user.id === adjustTarget.user.id) openDetail(adjustTarget);
    } catch (e: any) {
      showMsg('error', e?.response?.data?.message || 'Điều chỉnh thất bại');
    } finally { setAdjusting(false); }
  };

  const fetchAllTx = async (p: number) => {
    try {
      const d = await WalletService.getAllTransactions(p, 15);
      if (d?.content) { setAllTx(d.content); setAllTxTotalPages(d.totalPages || 1); setAllTxPage(p); }
    } catch (e) { console.error(e); }
  };

  const openAllTx = () => {
    setShowAllTx(true);
    fetchAllTx(0);
  };

  return (
    <div className="at-container">
      {message && <div className={`wallet-toast ${message.type}`}>{message.text}</div>}
      {loading && <div className="at-loading">Đang tải...</div>}

      <div className="at-header">
        <h3>Quản lý Ví tiền</h3>
        <div className="at-toolbar">
          <div className="at-search">
            <span className="material-symbols-outlined">search</span>
            <input placeholder="Tìm theo tên, email..." value={search}
              onChange={e => { setSearch(e.target.value); }} />
          </div>
          <button className="wallet-btn-outline" onClick={openAllTx}>
            <span className="material-symbols-outlined">receipt_long</span> Tất cả giao dịch
          </button>
        </div>
      </div>

      <div className={`at-main ${selectedWallet ? 'has-detail' : ''}`}>
        {/* Wallet Table */}
        <section className="at-section">
          <div className="wallet-table-wrap">
            <table className="wallet-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Số dư</th>
                  <th>Phong tỏa</th>
                  <th>Cập nhật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {wallets.length === 0 ? (
                  <tr><td colSpan={8} className="wallet-empty">Không có ví nào</td></tr>
                ) : (
                  wallets.map((w, idx) => (
                    <tr key={w.id}>
                      <td>{page * pageSize + idx + 1}</td>
                      <td><strong>{w.user?.fullName || 'N/A'}</strong></td>
                      <td>{w.user?.email}</td>
                      <td><span className={`role-badge role-${w.user?.role?.toLowerCase()}`}>{w.user?.role}</span></td>
                      <td className="tx-positive">{formatMoney(w.balance)}</td>
                      <td className="tx-negative">{formatMoney(w.frozen)}</td>
                      <td>{w.updatedAt ? new Date(w.updatedAt).toLocaleString('vi-VN') : '-'}</td>
                      <td>
                        <div className="wallet-action-btns">
                          <button className="wallet-btn-sm primary" onClick={() => openDetail(w)}>
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button className="wallet-btn-sm warning" onClick={() => openAdjust(w)}>
                            <span className="material-symbols-outlined">tune</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="wallet-pagination">
              <button disabled={page === 0} onClick={() => { setPage(page - 1); fetchWallets(page - 1); }}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span>Trang {page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => { setPage(page + 1); fetchWallets(page + 1); }}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </section>

        {/* Detail Panel */}
        {selectedWallet && (
          <aside className="wallet-detail-panel">
            <div className="wallet-detail-header">
              <h4>{selectedWallet.user?.fullName}</h4>
              <button className="wallet-close-btn" onClick={() => setSelectedWallet(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="wallet-detail-info">
              <div className="wallet-detail-row"><span>Email:</span> {selectedWallet.user?.email}</div>
              <div className="wallet-detail-row"><span>Vai trò:</span> {selectedWallet.user?.role}</div>
              <div className="wallet-detail-row"><span>Số dư:</span> <strong className="tx-positive">{formatMoney(selectedWallet.balance)}</strong></div>
              <div className="wallet-detail-row"><span>Phong tỏa:</span> <strong className="tx-negative">{formatMoney(selectedWallet.frozen)}</strong></div>
            </div>
            <h5>Giao dịch gần đây</h5>
            <div className="wallet-detail-tx">
              {selectedTx.length === 0 ? (
                <p className="wallet-empty">Chưa có giao dịch</p>
              ) : (
                selectedTx.map(tx => (
                  <div key={tx.id} className="wallet-detail-tx-item">
                    <span className={`tx-type tx-${tx.type?.toLowerCase()}`}>{WalletService.getTypeLabel(tx.type)}</span>
                    <span className={tx.amount >= 0 ? 'tx-positive' : 'tx-negative'}>
                      {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount)}
                    </span>
                    <span className="tx-time">{tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : ''}</span>
                  </div>
                ))
              )}
            </div>
            {txTotalPages > 1 && (
              <div className="wallet-pagination small">
                <button disabled={txPage === 0} onClick={() => fetchDetailTx(selectedWallet.user.id, txPage - 1)}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span>{txPage + 1}/{txTotalPages}</span>
                <button disabled={txPage >= txTotalPages - 1} onClick={() => fetchDetailTx(selectedWallet.user.id, txPage + 1)}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Adjust Modal */}
      {showAdjust && adjustTarget && (
        <div className="wallet-modal-overlay" onClick={() => setShowAdjust(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <h3>Điều chỉnh số dư</h3>
            <p className="wallet-modal-sub">Người dùng: <strong>{adjustTarget.user?.fullName}</strong> ({adjustTarget.user?.email})</p>
            <p className="wallet-modal-sub">Số dư hiện tại: <strong>{formatMoney(adjustTarget.balance)}</strong></p>
            <div className="wallet-form-group">
              <label>Số tiền điều chỉnh (dương = cộng, âm = trừ)</label>
              <input type="number" placeholder="VD: 100000 (cộng) hoặc -50000 (trừ)" value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)} step="1000" />
            </div>
            <div className="wallet-form-group">
              <label>Lý do / Ghi chú</label>
              <input type="text" placeholder="Nhập lý do điều chỉnh" value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)} />
            </div>
            <div className="wallet-modal-actions">
              <button className="wallet-btn-cancel" onClick={() => setShowAdjust(false)}>Hủy</button>
              <button className="wallet-btn-submit" onClick={handleAdjust} disabled={adjusting}>
                {adjusting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Transactions Modal */}
      {showAllTx && (
        <div className="wallet-modal-overlay" onClick={() => setShowAllTx(false)}>
          <div className="wallet-modal wide" onClick={e => e.stopPropagation()}>
            <h3>Tất cả giao dịch ví</h3>
            <div className="wallet-table-wrap" style={{ maxHeight: '400px', overflow: 'auto' }}>
              <table className="wallet-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Số dư sau</th>
                    <th>Ghi chú</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {allTx.length === 0 ? (
                    <tr><td colSpan={6} className="wallet-empty">Không có giao dịch</td></tr>
                  ) : (
                    allTx.map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.wallet?.user?.fullName || 'N/A'}</td>
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
            {allTxTotalPages > 1 && (
              <div className="wallet-pagination">
                <button disabled={allTxPage === 0} onClick={() => fetchAllTx(allTxPage - 1)}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span>{allTxPage + 1}/{allTxTotalPages}</span>
                <button disabled={allTxPage >= allTxTotalPages - 1} onClick={() => fetchAllTx(allTxPage + 1)}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
            <div className="wallet-modal-actions">
              <button className="wallet-btn-cancel" onClick={() => setShowAllTx(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWalletManagement;
