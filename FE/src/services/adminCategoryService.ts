import http from "./http";

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  parent?: CategoryItem | null;
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
  slug: string;
  parentId?: number | null;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

const AdminCategoryService = {
  getAll: async (): Promise<CategoryItem[]> => {
    const res = await http.get<ApiResponse<CategoryItem[]>>("/admin/categories");
    return res.data.data;
  },

  getRoots: async (): Promise<CategoryItem[]> => {
    const res = await http.get<ApiResponse<CategoryItem[]>>("/categories");
    return res.data.data;
  },

  getChildren: async (parentId: number): Promise<CategoryItem[]> => {
    const res = await http.get<ApiResponse<CategoryItem[]>>(`/categories/${parentId}/children`);
    return res.data.data;
  },

  create: async (data: CategoryRequest): Promise<CategoryItem> => {
    const res = await http.post<ApiResponse<CategoryItem>>("/admin/categories", data);
    return res.data.data;
  },

  update: async (id: number, data: CategoryRequest): Promise<CategoryItem> => {
    const res = await http.put<ApiResponse<CategoryItem>>(`/admin/categories/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await http.delete(`/admin/categories/${id}`);
  },
};

export default AdminCategoryService;
