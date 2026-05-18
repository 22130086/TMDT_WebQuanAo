import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Factory from "./pages/Factory";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import FactoryRoute from "./components/FactoryRoute";

import "./styles/product-detail.css";
import "./styles/products.css";
import "./styles/login.css";
import "./styles/register.css";
import "./styles/home.css";
import "./styles/factory.css";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* HOME */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* PRODUCTS */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        {/* PRODUCT DETAIL */}
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        {/* FACTORY */}
        <Route
          path="/factory/*"
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