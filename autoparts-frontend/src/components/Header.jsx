import React, { useState } from 'react';
import Button from './Button.jsx';
import { IconMenu, IconX, IconShoppingCart, IconLogOut, IconUser } from './Icons.jsx';
import { setToken } from '../api.js';

export default function Header({ current, onNavigate, session, setSession, onShowAuth, cartCount }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getVariant = (tabName) => current === tabName ? 'primary' : 'ghost';
  const isAdmin = session?.role === 'admin';

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    setSession(null);
    setToken(null);
    onNavigate('home');
    setShowMobileMenu(false);
  };

  // Hàm điều hướng và đóng menu
  const handleNav = (route) => {
    onNavigate(route);
    setShowMobileMenu(false);
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* LEFT: Logo & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowMobileMenu(true)}
          >
            <IconMenu />
          </button>

          <div
            className="font-bold text-xl md:text-2xl cursor-pointer text-gray-900 tracking-tight"
            onClick={() => onNavigate(isAdmin ? 'dashboard' : 'home')}
          >
            AutoParts
          </div>
        </div>

        {/* CENTER: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {!isAdmin && (
            <>
              <Button variant={getVariant('home')} onClick={() => onNavigate('home')}>Sản phẩm</Button>
              <Button variant={getVariant('diagnose')} onClick={() => onNavigate('diagnose')}>Chẩn đoán AI</Button>
            </>
          )}
          {isAdmin && (
            <>
              <Button variant={getVariant('dashboard')} onClick={() => onNavigate('dashboard')}>Dashboard</Button>
              <Button variant={getVariant('manage')} onClick={() => onNavigate('manage')}>Quản lý</Button>
            </>
          )}
          {session && !isAdmin && (
            <Button variant={getVariant('orders')} onClick={() => onNavigate('orders')}>Đơn hàng</Button>
          )}
        </nav>

        {/* RIGHT: Cart & Account */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Cart Icon (Always Visible) */}
          {!isAdmin && (
            <button
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => onNavigate('checkout')}
            >
              <IconShoppingCart />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Desktop Account Info */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <div className="text-sm text-right">
                  <div className="font-medium">{session.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{session.role}</div>
                </div>
                <Button variant="outline" onClick={() => onNavigate('account')} className="!px-3">Tài khoản</Button>
                <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={handleLogout}>Đăng xuất</Button>
              </>
            ) : (
              <Button onClick={() => onShowAuth(true)}>Đăng nhập</Button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />

          {/* Drawer Content */}
          <div className="absolute top-0 left-0 bottom-0 w-[80%] max-w-xs bg-white shadow-2xl p-4 flex flex-col animate-slide-in-left">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-xl text-gray-900">Menu</span>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <IconX />
              </button>
            </div>

            {/* User Info in Drawer */}
            {session ? (
              <div className="bg-gray-50 p-4 rounded-xl mb-6 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <IconUser />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{session.name}</div>
                  <div className="text-xs text-gray-500 uppercase">{session.role}</div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <Button className="w-full justify-center py-3" onClick={() => { onShowAuth(true); setShowMobileMenu(false); }}>
                  Đăng nhập / Đăng ký
                </Button>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Điều hướng</div>

              {!isAdmin && (
                <>
                  <button onClick={() => handleNav('home')} className={`w-full text-left px-4 py-3 rounded-lg font-medium ${current === 'home' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    Sản phẩm
                  </button>
                  <button onClick={() => handleNav('diagnose')} className={`w-full text-left px-4 py-3 rounded-lg font-medium ${current === 'diagnose' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    Chẩn đoán AI
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <button onClick={() => handleNav('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg font-medium ${current === 'dashboard' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    Dashboard
                  </button>
                  <button onClick={() => handleNav('manage')} className={`w-full text-left px-4 py-3 rounded-lg font-medium ${current === 'manage' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                    Quản lý
                  </button>
                </>
              )}

              {session && !isAdmin && (
                <button onClick={() => handleNav('orders')} className={`w-full text-left px-4 py-3 rounded-lg font-medium ${current === 'orders' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Đơn hàng của tôi
                </button>
              )}

              {session && (
                <button onClick={() => handleNav('account')} className={`w-full text-left px-4 py-3 rounded-lg font-medium ${current === 'account' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                  Tài khoản
                </button>
              )}
            </div>

            {/* Logout Button */}
            {session && (
              <div className="pt-4 border-t border-gray-100 mt-auto">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors">
                  <IconLogOut /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}