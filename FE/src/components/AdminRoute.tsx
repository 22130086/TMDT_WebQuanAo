import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAuthToken, getUserRole } from "../services/authService";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const token = getAuthToken();
  const role = getUserRole();

  // Nếu chưa đăng nhập, chuyển về login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Nếu role không phải ADMIN, chuyển về home
  if (role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
