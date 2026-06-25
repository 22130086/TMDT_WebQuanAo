import http from './http';

export interface Wallet {
  id: number;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
    status: string;
  };
  balance: number;
  frozen: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: number;
  wallet: {
    id: number;
    user: {
      id: number;
      email: string;
      fullName: string;
    };
  };
  orderId?: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'REFUND' | 'TRANSFER' | 'FREEZE' | 'UNFREEZE';
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
interface ApiResponse<T> { data: T; message?: string; }

const txTypeLabels: Record<string, string> = {
  DEPOSIT: 'Nạp tiền',
  WITHDRAWAL: 'Rút tiền',
  COMMISSION: 'Hoa hồng',
  REFUND: 'Hoàn tiền',
  TRANSFER: 'Chuyển khoản',
  FREEZE: 'Đóng băng',
  UNFREEZE: 'Mở đóng băng',
};

class WalletService {
  // ---- User / Factory ----

  static async getMyWallet() {
    const res = await http.get<ApiResponse<Wallet>>('/wallet');
    return res.data.data;
  }

  static async ensureWallet() {
    const res = await http.post<ApiResponse<Wallet>>('/wallet/ensure');
    return res.data.data;
  }

  static async getMyTransactions(page = 0, size = 20) {
    const res = await http.get<ApiResponse<PageResponse<WalletTransaction>>>('/wallet/transactions', { params: { page, size } });
    return res.data.data;
  }

  static async deposit(amount: number, note?: string) {
    const res = await http.post<ApiResponse<Wallet>>('/wallet/deposit', { amount, note });
    return res.data.data;
  }

  static async requestWithdrawal(amount: number, bankName: string, accountNumber: string, accountName: string) {
    const res = await http.post<ApiResponse<any>>('/wallet/withdraw', { amount, bankName, accountNumber, accountName });
    return res.data;
  }

  static async getWithdrawals(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<any>>>('/wallet/withdrawals', { params: { page, size } });
    return res.data.data;
  }

  // ---- Admin ----

  static async getAllWallets(search?: string, page = 0, size = 20) {
    const params: Record<string, string | number> = { page, size };
    if (search) params.search = search;
    const res = await http.get<ApiResponse<PageResponse<Wallet>>>('/admin/wallets', { params });
    return res.data.data;
  }

  static async getWalletByUserId(userId: number) {
    const res = await http.get<ApiResponse<Wallet>>(`/admin/wallets/${userId}`);
    return res.data.data;
  }

  static async getUserTransactions(userId: number, page = 0, size = 20) {
    const res = await http.get<ApiResponse<PageResponse<WalletTransaction>>>(`/admin/wallets/${userId}/transactions`, { params: { page, size } });
    return res.data.data;
  }

  static async adjustBalance(userId: number, amount: number, note?: string) {
    const res = await http.post<ApiResponse<Wallet>>(`/admin/wallets/${userId}/adjust`, { amount, note });
    return res.data;
  }

  static async getAllTransactions(page = 0, size = 20) {
    const res = await http.get<ApiResponse<PageResponse<WalletTransaction>>>('/admin/transactions', { params: { page, size } });
    return res.data.data;
  }

  static getTypeLabel(type: string) {
    return txTypeLabels[type] || type;
  }
}

export default WalletService;
