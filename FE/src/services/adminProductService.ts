import http from './http';

export interface ProductItem {
  id: number; name: string; description?: string; price: number; stock: number;
  status: string; factoryId: number; factoryName?: string; categoryId?: number;
  categoryName?: string; imageUrls?: string[]; createdAt: string;
}
interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
interface ApiResponse<T> { data: T; message?: string; }

class AdminProductService {
  static async getAll(keyword?: string, page = 0, size = 10) {
    const params: Record<string, string | number> = { page, size };
    if (keyword) params.keyword = keyword;
    const res = await http.get<ApiResponse<PageResponse<ProductItem>>>('/admin/products', { params });
    return res.data.data;
  }
  static async getPending(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<ProductItem>>>('/admin/products/pending', { params: { page, size } });
    return res.data.data;
  }
  static async approve(id: number) {
    const res = await http.patch<ApiResponse<ProductItem>>(`/admin/products/${id}/approve`);
    return res.data.data;
  }
  static async reject(id: number, reason: string) {
    const res = await http.patch<ApiResponse<ProductItem>>(`/admin/products/${id}/reject`, null, { params: { reason } });
    return res.data.data;
  }
}
export default AdminProductService;
