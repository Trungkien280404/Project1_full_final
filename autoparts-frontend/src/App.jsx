import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Api, setToken } from './api.js';
import Header from './components/Header.jsx';
import AuthModal from './components/AuthModal.jsx';
import { Spinner } from './components/Icons.jsx';

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

  // === QUẢN LÝ GIỎ HÀNG Ở APP ===
  const [cart, setCart] = useState([]);

  function addToCart(p) {
    setCart(prev => {
      const i = prev.findIndex(x => x.id === p.id);
      if (i >= 0) {
        const cp = [...prev];
        cp[i].qty += 1;
        return cp;
      }
      return [...prev, { ...p, qty: 1 }];
    });
  }

  function decreaseFromCart(productId) {
    setCart(prev => {
      const i = prev.findIndex(x => x.id === productId);
      if (i < 0) return prev; // Không tìm thấy

      const cp = [...prev];
      if (cp[i].qty > 1) {
        cp[i].qty -= 1;
        return cp;
      } else {
        // Nếu còn 1 thì xóa luôn
        return prev.filter(item => item.id !== productId);
      }
    });
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.id !== productId));
  }

  function clearCart() {
    setCart([]);
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
                    // Show a friendly message for guests
                    alert('✅ Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.\n\n💡 Mẹo: Đăng nhập để theo dõi đơn hàng của bạn!');
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