import http from './http';

export interface UserInfo {
  id: number; email: string; fullName?: string; phone?: string; role: string; status: string; createdAt: string;
}
export interface FactoryInfo {
  id: number; userId: number; factoryName?: string; factoryUserName?: string; factoryUserEmail?: string;
  description?: string; address?: string; verifiedStatus: string; rejectedReason?: string;
  factoryUserAvatar?: string; ratingAvg?: number; minQuantity?: number; maxQuantity?: number; leadTimeDays?: number;
  imageUrls?: string[]; certificates?: CertificateItem[];
  createdAt: string; verifiedAt?: string;
}
export interface CertificateItem { id: number; name: string; imageUrl: string; issuedDate?: string; expiredDate?: string; }
interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
interface ApiResponse<T> { data: T; message?: string; }

class AdminUserService {
  static async getUsers(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<UserInfo>>>('/admin/users', { params: { page, size } });
    return res.data.data;
  }
  static async lockUser(id: number) {
    const res = await http.patch<ApiResponse<UserInfo>>(`/admin/users/${id}/lock`);
    return res.data.data;
  }
  static async unlockUser(id: number) {
    const res = await http.patch<ApiResponse<UserInfo>>(`/admin/users/${id}/unlock`);
    return res.data.data;
  }
  static async getPendingFactories(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<FactoryInfo>>>('/admin/factories/pending', { params: { page, size } });
    return res.data.data;
  }
  static async approveFactory(id: number) {
    const res = await http.patch<ApiResponse<FactoryInfo>>(`/admin/factories/${id}/approve`);
    return res.data.data;
  }
  static async rejectFactory(id: number, reason: string) {
    const res = await http.patch<ApiResponse<FactoryInfo>>(`/admin/factories/${id}/reject`, null, { params: { reason } });
    return res.data.data;
  }
  static async getFactoryDetail(id: number) {
    const res = await http.get<ApiResponse<FactoryInfo>>(`/admin/factories/${id}`);
    return res.data.data;
  }
}

export default AdminUserService;
