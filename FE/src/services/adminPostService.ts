import http from './http';

export interface OutsourcingPostData {
  id: number;
  title: string;
  description?: string;
  quantity: number;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';
  customer?: { id: number; fullName: string; email: string };
  category?: { id: number; name: string };
  createdAt: string;
  updatedAt?: string;
}

interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
interface ApiResponse<T> { data: T; message?: string; }

class AdminPostService {
  static async getAll(status?: string, page = 0, size = 10) {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    const res = await http.get<ApiResponse<PageResponse<OutsourcingPostData>>>('/admin/outsourcing-posts', { params });
    return res.data.data;
  }

  static async getById(id: number) {
    const res = await http.get<ApiResponse<OutsourcingPostData>>(`/admin/outsourcing-posts/${id}`);
    return res.data.data;
  }

  static async close(id: number, reason?: string) {
    const params: Record<string, string> = {};
    if (reason) params.reason = reason;
    const res = await http.patch<ApiResponse<OutsourcingPostData>>(`/admin/outsourcing-posts/${id}/close`, null, { params });
    return res.data;
  }

  static async delete(id: number, reason?: string) {
    const params: Record<string, string> = {};
    if (reason) params.reason = reason;
    const res = await http.delete<ApiResponse<null>>(`/admin/outsourcing-posts/${id}`, { params });
    return res.data;
  }
}

export default AdminPostService;
