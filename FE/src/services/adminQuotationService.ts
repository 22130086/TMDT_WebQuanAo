import http from './http';

export interface QuotationData {
  id: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  note?: string;
  deliveryDays?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'CANCELLED';
  postId?: number;
  postTitle?: string;
  factoryId: number;
  factoryName: string;
  customerId: number;
  customerName: string;
  createdAt: string;
  updatedAt?: string;
}

interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
interface ApiResponse<T> { data: T; message?: string; }

class AdminQuotationService {
  static async getAll(status?: string, page = 0, size = 10) {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    const res = await http.get<ApiResponse<PageResponse<QuotationData>>>('/admin/quotations', { params });
    return res.data.data;
  }

  static async getById(id: number) {
    const res = await http.get<ApiResponse<QuotationData>>(`/admin/quotations/${id}`);
    return res.data.data;
  }

  static async delete(id: number, reason?: string) {
    const params: Record<string, string> = {};
    if (reason) params.reason = reason;
    const res = await http.delete<ApiResponse<null>>(`/admin/quotations/${id}`, { params });
    return res.data;
  }
}

export default AdminQuotationService;
