import http from './http';
import { getImageUrl } from './http';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  id: number;
  customerId: number;
  customerEmail?: string;
  customerName?: string;
  factoryId?: number;
  factoryName?: string;
  orderType?: string;
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  status: string;
  receiverName?: string;
  receiverPhone?: string;
  shippingAddress?: string;
  note?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  items?: OrderItem[];
}

interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; }
interface ApiResponse<T> { data: T; message?: string; }

class AdminOrderService {
  static async getAll(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<AdminOrder>>>('/admin/orders', { params: { page, size } });
    return res.data.data;
  }
  static async getById(id: number) {
    const res = await http.get<ApiResponse<AdminOrder>>(`/admin/orders/${id}`);
    return res.data.data;
  }
}

export default AdminOrderService;
