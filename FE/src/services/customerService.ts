import http from "./http";

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export const customerService = {
  /** Lấy thông tin hồ sơ khách hàng */
  getProfile: async (): Promise<{ success: boolean; data: UserProfile; message?: string }> => {
    const response = await http.get("/customer/profile");
    return response.data;
  },

  /** Cập nhật hồ sơ khách hàng */
  updateProfile: async (data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; data: UserProfile; message?: string }> => {
    const response = await http.put("/customer/profile", data);
    return response.data;
  },
};
