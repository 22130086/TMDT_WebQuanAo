import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";

import Home from "./pages/UserPages/Home";
import Admin from "./pages/AdminPages/Admin";
import Factory from "./pages/FactoryPages/Factory";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import PaymentResult from './pages/cart/PaymentResult';
import OrderHistory from "./pages/order/order-history";
import OrderDetail from "./pages/order/order-detail";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import FactoryRoute from "./components/FactoryRoute";
import CustomOrder from "./pages/CustomOrder";
import FactoryProfile from "./pages/FactoryProfile";

import "./styles/product-detail.css";
import "./styles/products.css";
import "./styles/login.css";
import "./styles/register.css";
import "./styles/home.css";
import "./styles/factory.css";
import "./styles/order_checkout.css";
import Cart from "./pages/cart/cart";
import OrderCheckout from "./pages/cart/order_checkout";

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

        {/* Cart */}
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
        <Route path="/payment-result" element={<PaymentResult />} />

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
            <Route
      path="/custom-order"
      element={
        <ProtectedRoute>
          <CustomOrder />
        </ProtectedRoute>
      }
      />
      <Route
        path="/factory-profile/:id"
        element={
          <ProtectedRoute>
            <FactoryProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-history"
        element={
          <ProtectedRoute>
            <OrderHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-detail/:id"
        element={
          <ProtectedRoute>
            <OrderDetail />
          </ProtectedRoute>
        }
      />
      </Routes>

    </BrowserRouter>
  );
}

export default App;