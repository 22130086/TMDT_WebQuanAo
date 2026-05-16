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
  payload: RegisterPayload
): Promise<AuthResponse> {
  try {
    const response = await http.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      payload
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error));
  }
}

export function saveAuthToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function getAuthToken() {
  return localStorage.getItem("auth_token") || "";
}
