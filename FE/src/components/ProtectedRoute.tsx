import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "../services/authService";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
