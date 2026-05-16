import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Factory from "./pages/Factory";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import FactoryRoute from "./components/FactoryRoute";

import "./styles/login.css";
import "./styles/register.css";
import "./styles/home.css";
import "./styles/factory.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/factory"
          element={
            <FactoryRoute>
              <Factory />
            </FactoryRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;