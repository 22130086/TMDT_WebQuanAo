import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/UserPages/Home";
import Admin from "./pages/AdminPages/Admin";
import Factory from "./pages/FactoryPages/Factory";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import FactoryRoute from "./components/FactoryRoute";

import "./styles/login.css";
import "./styles/register.css";
import "./styles/home.css";
import "./styles/factory.css";
import "./styles/order_checkout.css";
import Cart from "./pages/UserPages/cart";
import OrderCheckout from "./pages/UserPages/order_checkout";

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
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-checkout"
          element={
            <ProtectedRoute>
              <OrderCheckout />
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