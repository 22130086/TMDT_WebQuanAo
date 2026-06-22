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
import MyPosts from "./pages/UserPages/MyPosts";
import PostQuotesDetail from "./pages/UserPages/PostQuotesDetail";
import CustomerProfile from "./pages/UserPages/CustomerProfile";
import FactoryProfile from "./pages/FactoryProfile";

import "./styles/product-detail.css";
import "./styles/products.css";
import "./styles/login.css";
import "./styles/register.css";
import "./styles/home.css";
import "./styles/factory.css";
import "./styles/order_checkout.css";
import "./styles/customer-profile.css";
import Cart from "./pages/cart/cart";
import OrderCheckout from "./pages/cart/order_checkout";
import AdminLayout from "./components/AdminLayout";
import ComplaintsManagement from "./pages/AdminPages/ComplaintsManagement";
import DisputesManagement from "./pages/AdminPages/DisputesManagement";
import WithdrawalsManagement from "./pages/AdminPages/WithdrawalsManagement";
import VNPayTransfer from "./pages/AdminPages/VNPayTransfer";
import OrderManagement from "./pages/AdminPages/OrderManagement";
import Reports from "./pages/AdminPages/Reports";
import UserManagement from "./pages/AdminPages/UserManagement";
import FactoryApproval from "./pages/AdminPages/FactoryApproval";
import ProductManagement from "./pages/AdminPages/ProductManagement";
import QuotationManagement from "./pages/AdminPages/QuotationManagement";
import PostManagement from "./pages/AdminPages/PostManagement";

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

        {/* CUSTOMER POSTS */}
        <Route path="/my-posts" element={<ProtectedRoute><MyPosts /></ProtectedRoute>} />
        <Route path="/my-posts/:id" element={<ProtectedRoute><PostQuotesDetail /></ProtectedRoute>} />

        {/* CUSTOMER PROFILE */}
        <Route path="/customer-profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout title="Bảng điều khiển">
                <Admin />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <AdminRoute>
              <AdminLayout title="Quản lý Khiếu nại">
                <ComplaintsManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <AdminRoute>
              <AdminLayout title="Quản lý Tranh chấp">
                <DisputesManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <AdminRoute>
              <AdminLayout title="Quản lý Yêu cầu Rút tiền">
                <WithdrawalsManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/withdrawals/:id/transfer"
          element={
            <AdminRoute>
              <AdminLayout title="Chuyển tiền VNPay">
                <VNPayTransfer />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminLayout title="Quản lý Người dùng">
                <UserManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/factories"
          element={
            <AdminRoute>
              <AdminLayout title="Duyệt Xưởng May">
                <FactoryApproval />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminLayout title="Quản lý Sản phẩm">
                <ProductManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminLayout title="Quản lý Đơn hàng">
                <OrderManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminLayout title="Báo cáo Doanh thu">
                <Reports />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/quotations"
          element={
            <AdminRoute>
              <AdminLayout title="Quản lý Báo giá">
                <QuotationManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/posts"
          element={
            <AdminRoute>
              <AdminLayout title="Quản lý Bài đăng tìm xưởng">
                <PostManagement />
              </AdminLayout>
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