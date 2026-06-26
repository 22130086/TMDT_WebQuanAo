import http from "./http";

export interface AttributeValueItem {
  id: number;
  value: string;
}

export interface AttributeItem {
  id: number;
  name: string;
  values: AttributeValueItem[];
}

export interface AttributeRequest {
  name: string;
  attributeValues: string; // comma-separated, backend sẽ parse
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

const AdminAttributeService = {
  getAll: async (): Promise<AttributeItem[]> => {
    const res = await http.get<ApiResponse<AttributeItem[]>>("/product-attributes");
    return res.data.data;
  },

  create: async (data: AttributeRequest): Promise<AttributeItem> => {
    const res = await http.post<ApiResponse<AttributeItem>>("/admin/product-attributes", data);
    return res.data.data;
  },

  update: async (id: number, data: AttributeRequest): Promise<AttributeItem> => {
    const res = await http.put<ApiResponse<AttributeItem>>(`/admin/product-attributes/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await http.delete(`/admin/product-attributes/${id}`);
  },
};

export default AdminAttributeService;
