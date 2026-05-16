import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAuthToken, getUserRole } from "../services/authService";

interface FactoryRouteProps {
  children: ReactNode;
}

export default function FactoryRoute({ children }: FactoryRouteProps) {
  const token = getAuthToken();
  const role = getUserRole();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== "FACTORY") {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
