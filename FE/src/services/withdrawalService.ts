import http from './http';

export interface Withdrawal {
  id: number;
  factoryUserId: number;
  factoryUserName?: string;
  factoryName?: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TRANSFERRED';
  adminNote?: string;
  handledById?: number;
  handledAt?: string;
  createdAt: string;
}

export interface WithdrawalStats {
  total: number;
  pending: number;
  approved: number;
  transferred: number;
  rejected: number;
}

interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
interface ApiResponse<T> { data: T; message?: string; }

class WithdrawalService {
  static async getAll(status?: string, page = 0, size = 10) {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    const res = await http.get<ApiResponse<PageResponse<Withdrawal>>>('/admin/withdrawals', { params });
    return res.data.data;
  }
  static async getStats() {
    const res = await http.get<ApiResponse<WithdrawalStats>>('/admin/withdrawals/stats');
    return res.data.data;
  }
  static async approve(id: number) {
    const res = await http.patch<ApiResponse<Withdrawal>>(`/admin/withdrawals/${id}/approve`);
    return res.data.data;
  }
  static async reject(id: number, note: string) {
    const res = await http.patch<ApiResponse<Withdrawal>>(`/admin/withdrawals/${id}/reject`, null, { params: { note } });
    return res.data.data;
  }
  static async markTransferred(id: number) {
    const res = await http.patch<ApiResponse<Withdrawal>>(`/admin/withdrawals/${id}/transferred`);
    return res.data.data;
  }
}

export default WithdrawalService;
