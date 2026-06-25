import http from './http';

export interface Dispute {
  id: number;
  orderId: number;
  initiatedById: number;
  initiatedByName?: string;
  description: string;
  evidenceUrl?: string;
  status: 'OPEN' | 'ADDITIONAL_INFO_REQUESTED' | 'VERDICT_GIVEN' | 'CLOSED';
  verdict?: string;
  refundToCustomer?: number;
  transferToFactory?: number;
  adminNote?: string;
  violationRecorded?: boolean;
  handledById?: number;
  handledAt?: string;
  createdAt: string;
}

export interface DisputeStats {
  total: number;
  open: number;
  infoRequested: number;
  verdictGiven: number;
  closed: number;
}

export interface DisputeRequest {
  orderId: number;
  description: string;
  evidenceUrl?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

class DisputeService {
  // ---- Customer ----
  static async createDispute(data: DisputeRequest) {
    const res = await http.post<ApiResponse<Dispute>>('/disputes', data);
    return res.data.data;
  }

  static async getMyDisputes(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Dispute>>>('/disputes/my', { params: { page, size } });
    return res.data.data;
  }

  static async getDisputeDetail(id: number) {
    const res = await http.get<ApiResponse<Dispute>>(`/disputes/${id}`);
    return res.data.data;
  }

  // ---- Factory ----
  static async getFactoryDisputes(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Dispute>>>('/factory/disputes', { params: { page, size } });
    return res.data.data;
  }

  // ---- Admin ----
  static async getAll(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Dispute>>>('/admin/disputes', { params: { page, size } });
    return res.data.data;
  }

  static async getByStatus(status: string, page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Dispute>>>(`/admin/disputes/status/${status}`, { params: { page, size } });
    return res.data.data;
  }

  static async search(keyword: string, page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Dispute>>>('/admin/disputes/search', { params: { keyword, page, size } });
    return res.data.data;
  }

  static async getStats() {
    const res = await http.get<ApiResponse<DisputeStats>>('/admin/disputes/stats');
    return res.data.data;
  }

  static async getOne(id: number) {
    const res = await http.get<ApiResponse<Dispute>>(`/admin/disputes/${id}`);
    return res.data.data;
  }
  static async giveVerdict(id: number, data: { verdict: string; refundToCustomer?: number; transferToFactory?: number; adminNote?: string }) {
    const res = await http.patch<ApiResponse<Dispute>>(`/admin/disputes/${id}/verdict`, data);
    return res.data.data;
  }
  static async requestInfo(id: number, note: string) {
    const res = await http.patch<ApiResponse<Dispute>>(`/admin/disputes/${id}/request-info`, { note });
    return res.data.data;
  }
  static async closeDispute(id: number, note?: string) {
    const res = await http.patch<ApiResponse<Dispute>>(`/admin/disputes/${id}/close`, { note });
    return res.data.data;
  }
  // ---- Factory ----
  static async factoryRespond(id: number, response: string) {
    const res = await http.patch<ApiResponse<Dispute>>(`/factory/disputes/${id}/respond`, { response });
    return res.data.data;
  }
}

export default DisputeService;
