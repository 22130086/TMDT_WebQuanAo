import axios from "axios";
import http from "./http";  

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: "CUSTOMER" | "FACTORY";
  factoryName?: string;
  factoryAddress?: string;
  certImageUrl?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  role: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

function getAxiosErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Lỗi kết nối tới server"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Lỗi không xác định";
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const response = await http.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      payload
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error));
  }
}

export async function register(
  payload: RegisterPayload,
  otp: string
): Promise<AuthResponse> {
  try {
    const response = await http.post<ApiResponse<AuthResponse>>(
      `/auth/register?otp=${otp}`,
      payload
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error));
  }
}

export async function sendOtp(email: string): Promise<string> {
  try {
    const response = await http.post<ApiResponse<string>>(
      `/auth/send-otp?email=${email}`
    );
    return response.data?.data || "Success";
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error));
  }
}

export async function sendOtpForgotPassword(email: string): Promise<string> {
  try {
    const response = await http.post<ApiResponse<string>>(
      `/auth/forgot-password/send-otp?email=${email}`
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error));
  }
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<string> {
  try {
    const response = await http.post<ApiResponse<string>>(
      `/auth/forgot-password/reset?email=${email}&otp=${otp}&newPassword=${newPassword}`
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error));
  }
}

export function saveAuthToken(token: string) {
    // Đổi từ "auth_token" thành "token"
    localStorage.setItem("token", token);
}

export function getAuthToken() {
    // Đổi từ "auth_token" thành "token"
    return localStorage.getItem("token") || "";
}

export function saveUserRole(role: string) {
    localStorage.setItem("user_role", role);
}

export function getUserRole() {
    return localStorage.getItem("user_role") || "";
}

export function clearAuth() {
    // Đồng bộ xóa đúng key "token" khi đăng xuất
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
}
