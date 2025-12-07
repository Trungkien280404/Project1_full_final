import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Api, setToken } from './api.js';
import Header from './components/Header.jsx';
import AuthModal from './components/AuthModal.jsx';
import { Spinner } from './components/Icons.jsx';
import Toast from './components/Toast.jsx';

// Lazy load components
const Catalog = lazy(() => import('./components/Catalog.jsx'));
const Diagnose = lazy(() => import('./components/Diagnose.jsx'));
const ManagePage = lazy(() => import('./components/ManagePage.jsx'));
const DashBoard = lazy(() => import('./components/DashBoard.jsx'));
const MyOrders = lazy(() => import('./components/MyOrders.jsx'));
const Account = lazy(() => import('./components/Account.jsx'));
const RequireAdmin = lazy(() => import('./components/RequireAdmin.jsx'));
// ManageOrders & ManageProducts are used inside ManagePage usually, but imported here for route probably?
// Checking the code flow below (not fully visible), let's lazy load them all just in case.
// Note: ManageOrders/ManageProducts import paths in original code lacked .jsx extension in some lines, fixing that.
const ManageOrders = lazy(() => import('./components/ManageOrders.jsx'));
const ManageProducts = lazy(() => import('./components/ManageProducts.jsx'));
const ProductDetail = lazy(() => import('./components/ProductDetail.jsx'));
const Checkout = lazy(() => import('./components/Checkout.jsx'));

export default function App() {
  // 1. Lấy session từ localStorage trước
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('autoparts_session') || 'null'); } catch { return null; }
  });

  // 2. Khởi tạo route dựa trên vai trò của user trong session
  const [route, setRoute] = useState(() => {
    // Nếu là admin, mặc định vào dashboard
    if (session?.role === 'admin') return 'dashboard';
    // Người dùng thường hoặc chưa đăng nhập -> vào trang chủ
    return 'home';
  });

  // === QUẢN LÝ AUTH MODAL ===
  const [showAuth, setShowAuth] = useState(false);

  // State để lưu ID sản phẩm đang xem chi tiết
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Global Toast State
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  // Hàm điều hướng có kiểm tra đăng nhập
  function handleNavigate(targetRoute, params = {}) {
    // Các trang yêu cầu đăng nhập
    const protectedRoutes = ['diagnose', 'checkout'];

    if (protectedRoutes.includes(targetRoute) && !session) {
      setShowAuth(true);
      return;
    }

    if (targetRoute === 'productDetail' && params.id) {
      setSelectedProductId(params.id);
    }

    setRoute(targetRoute);
  }

  // === QUẢN LÝ GIỎ HÀNG VỚI ĐỒNG BỘ SERVER ===
  const [cart, setCart] = useState([]);

  // Load cart từ server khi đăng nhập
  async function loadCartFromServer() {
    if (!session) {
      setCart([]);
      return;
    }

    try {
      const serverCart = await Api.getCart();
      // Convert server format to local format
      const localCart = serverCart.map(item => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        image: item.image_path, // Backend trả về image_path
        stock: item.stock,
        qty: item.quantity,
        cartItemId: item.id // Lưu ID của cart item để update/delete
      }));
      setCart(localCart);
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  }

  // Sync cart khi đăng nhập
  useEffect(() => {
    if (session?.email) {
      loadCartFromServer();
    } else {
      setCart([]); // Clear cart khi đăng xuất
    }
  }, [session?.email]); // Re-load khi email thay đổi (đăng nhập/đăng xuất)

  async function addToCart(p) {
    if (!session) {
      showToast('warning', 'Vui lòng đăng nhập để thêm vào giỏ hàng');
      setShowAuth(true);
      return;
    }

    try {
      await Api.addToCart(p.id, 1);
      // Reload cart từ server để đảm bảo đồng bộ
      await loadCartFromServer();
      showToast('success', 'Đã thêm vào giỏ hàng!');
    } catch (err) {
      console.error('Add to cart failed:', err);
      showToast('error', 'Không thể thêm vào giỏ hàng');
    }
  }

  async function decreaseFromCart(productId) {
    const item = cart.find(x => x.id === productId);
    if (!item) return;

    try {
      if (item.qty > 1) {
        // Giảm số lượng
        await Api.updateCartItem(item.cartItemId, item.qty - 1);
      } else {
        // Xóa khỏi giỏ
        await Api.removeFromCart(item.cartItemId);
      }
      await loadCartFromServer();
    } catch (err) {
      console.error('Decrease cart failed:', err);
      showToast('error', 'Không thể cập nhật giỏ hàng');
    }
  }

  async function removeFromCart(productId) {
    const item = cart.find(x => x.id === productId);
    if (!item) return;

    try {
      await Api.removeFromCart(item.cartItemId);
      await loadCartFromServer();
      showToast('success', 'Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (err) {
      console.error('Remove from cart failed:', err);
      showToast('error', 'Không thể xóa khỏi giỏ hàng');
    }
  }

  async function clearCart() {
    if (!session) {
      setCart([]);
      return;
    }

    try {
      await Api.clearCart();
      setCart([]);
    } catch (err) {
      console.error('Clear cart failed:', err);
      showToast('error', 'Không thể xóa giỏ hàng');
    }
  }

  // Gửi ping traffic khi vào app
  useEffect(() => { Api.ping(); }, []);

  // Lưu session vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (session) localStorage.setItem('autoparts_session', JSON.stringify(session));
    else localStorage.removeItem('autoparts_session');
  }, [session]);

  // Effect để tự động chuyển trang khi login/logout thay đổi
  useEffect(() => {
    if (session?.role === 'admin' && (route === 'home' || route === 'checkout')) {
      // Nếu vừa đăng nhập admin mà đang ở trang khách -> chuyển về dashboard
      setRoute('dashboard');
    } else if (!session && (route === 'manage' || route === 'dashboard' || route === 'orders')) {
      // Nếu đăng xuất mà đang ở trang cần quyền -> chuyển về home
      setRoute('home');
    }
  }, [session]);

  return (
    <div className="min-h-screen w-full relative bg-white">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      {/* Hiệu ứng nền (Background Glow) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "#ffffff",
          backgroundImage: `radial-gradient(circle at top right, rgba(173, 109, 244, 0.45), transparent 70%)`,
          filter: "blur(80px)",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Nội dung chính */}
      <div className="relative z-10">
        {/* Header: Chứa thanh menu và nút đăng nhập/đăng xuất */}
        <Header
          current={route}
          onNavigate={handleNavigate}
          session={session}
          setSession={setSession}
          onShowAuth={setShowAuth}
          cartCount={cart.reduce((acc, item) => acc + item.qty, 0)}
        />

        <main className="max-w-6xl mx-auto p-4 space-y-4">
          <Suspense fallback={<div className="flex justify-center p-20"><Spinner /></div>}>
            {/* 1. Trang chủ (Catalog) */}
            {route === 'home' && (
              <Catalog
                cart={cart}
                onAddToCart={addToCart}
                onDecreaseFromCart={decreaseFromCart}
                onCheckout={() => handleNavigate('checkout')}
                onNavigate={handleNavigate}
              />
            )}

            {/* 2. Trang Thanh toán (Checkout) */}
            {route === 'checkout' && (
              <Checkout
                cart={cart}
                onCancel={() => setRoute('home')}
                onCheckoutSuccess={() => {
                  clearCart();
                  // Guest users go back to home, logged-in users can view orders
                  if (session) {
                    setRoute('orders');
                  } else {
                    setRoute('home');
                  }
                }}
                removeFromCart={removeFromCart}
              />
            )}

            {/* 3. Trang Chẩn đoán ảnh AI */}
            {route === 'diagnose' && (
              <Diagnose
                cart={cart}
                addToCart={addToCart}
                onNavigate={handleNavigate}
              />
            )}

            {/* 4. Trang Quản lý (Admin Only) */}
            {route === 'manage' && (
              session?.role === 'admin' ? <ManagePage /> : <RequireAdmin session={session} />
            )}

            {/* 5. Trang Dashboard (Admin Only) */}
            {route === 'dashboard' && (
              session?.role === 'admin' ? <DashBoard /> : <RequireAdmin session={session} />
            )}

            {/* 6. Trang Đơn hàng của tôi (User) */}
            {route === 'orders' && (
              session ? <MyOrders /> : <RequireAdmin session={session} />
            )}

            {/* 7. Trang Tài khoản (User) */}
            {route === 'account' && (
              session ? <Account session={session} /> : <RequireAdmin session={session} />
            )}

            {/* 8. Trang Chi tiết sản phẩm */}
            {route === 'productDetail' && selectedProductId && (
              <ProductDetail
                productId={selectedProductId}
                addToCart={addToCart}
                onBack={() => setRoute('home')}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Auth Modal Global */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={(s) => {
            setSession(s.user);
            setToken(s.token);
            setShowAuth(false);
            // Nếu là admin, vào dashboard
            if (s.user.role === 'admin') setRoute('dashboard');
          }}
        />
      )}
    </div>
  );
}