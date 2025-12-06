import React, { useState } from 'react';
import ManageProducts from './ManageProducts.jsx';
import ManageOrders from './ManageOrders.jsx';
import ManageUsers from './ManageUsers.jsx';
import ManageReviews from './ManageReviews.jsx';
import ManageConsultations from './ManageConsultations.jsx';
import ManageImports from './ManageImports.jsx';

export default function ManagePage() {
  const [subRoute, setSubRoute] = useState('products');

  const menuItems = [
    { id: 'products', label: '📦 Quản lý Sản phẩm' },
    { id: 'orders', label: '🛒 Quản lý Đơn hàng' },
    { id: 'users', label: '👥 Quản lý Người dùng' },
    { id: 'imports', label: '📥 Quản lý Nhập hàng' },
    { id: 'reviews', label: '⭐ Đánh giá & Bình luận' },
    { id: 'consults', label: '📞 Yêu cầu Tư vấn' },
  ];

  return (
    <div className="animate-fade-in flex flex-col md:flex-row gap-6 min-h-[80vh]">
      {/* SIDEBAR */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-24">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">Hệ thống quản lý</div>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSubRoute(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 ${subRoute === item.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-w-0">
        <div className="bg-transparent">
          {subRoute === 'products' && <ManageProducts />}
          {subRoute === 'orders' && <ManageOrders />}
          {subRoute === 'users' && <ManageUsers />}
          {subRoute === 'imports' && <ManageImports />}
          {subRoute === 'reviews' && <ManageReviews />}
          {subRoute === 'consults' && <ManageConsultations />}
        </div>
      </div>
    </div>
  );
}