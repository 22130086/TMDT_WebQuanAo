import http from './http';

export interface Complaint {
  id: number;
  orderId: number;
  raisedById: number;
  reason: string;
  evidenceUrl?: string;
  status: 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  resolvedById?: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintRequest {
  orderId: number;
  reason: string;
  evidenceUrl?: string;
}

export interface ComplaintResolveRequest {
  resolution: string;
  status: string;
}

export interface ComplaintStats {
  totalComplaints: number;
  openComplaints: number;
  processingComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
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

class ComplaintService {
  static async createComplaint(data: ComplaintRequest) {
    const res = await http.post<ApiResponse<Complaint>>('/complaints', data);
    return res.data.data;
  }

  static async getMyComplaints(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Complaint>>>('/complaints/my', { params: { page, size } });
    return res.data.data;
  }

  static async getComplaint(complaintId: number) {
    const res = await http.get<ApiResponse<Complaint>>(`/complaints/${complaintId}`);
    return res.data.data;
  }

  static async getOrderComplaints(orderId: number, page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Complaint>>>(`/orders/${orderId}/complaints`, { params: { page, size } });
    return res.data.data;
  }

  static async getFactoryComplaints(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Complaint>>>('/factory/complaints', { params: { page, size } });
    return res.data.data;
  }

  static async resolveComplaint(complaintId: number, data: ComplaintResolveRequest) {
    const res = await http.patch<ApiResponse<Complaint>>(`/complaints/${complaintId}/resolve`, data);
    return res.data.data;
  }

  static async updateStatus(complaintId: number, status: string) {
    const res = await http.patch<ApiResponse<Complaint>>(`/complaints/${complaintId}/status`, { status });
    return res.data.data;
  }

  static async getAllComplaints(page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Complaint>>>('/admin/complaints', { params: { page, size } });
    return res.data.data;
  }

  static async getComplaintsByStatus(status: string, page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Complaint>>>(`/admin/complaints/status/${status}`, { params: { page, size } });
    return res.data.data;
  }

  static async searchComplaints(keyword: string, page = 0, size = 10) {
    const res = await http.get<ApiResponse<PageResponse<Complaint>>>('/admin/complaints/search', { params: { keyword, page, size } });
    return res.data.data;
  }

  static async getComplaintStats() {
    const res = await http.get<ApiResponse<ComplaintStats>>('/admin/complaints/stats');
    return res.data.data;
  }
}

export default ComplaintService;
