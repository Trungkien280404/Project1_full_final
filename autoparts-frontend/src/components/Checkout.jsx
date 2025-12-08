import React, { useState, useEffect } from 'react';
import { Api } from '../api.js';
import Card from './Card.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';
import { Spinner } from './Icons.jsx';
import Toast from './Toast.jsx';

export default function Checkout({ cart, onCheckoutSuccess, onCancel, removeFromCart }) {
  const [info, setInfo] = useState({ name: '', phone: '', address: '' });
  const [method, setMethod] = useState('cod');
  const [installation, setInstallation] = useState({ method: '', time: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Address Management State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch addresses on mount
  useEffect(() => {
    Api.getAddresses()
      .then(data => {
        setIsLoggedIn(true);
        setSavedAddresses(data);
        // Auto-select default
        const def = data.find(a => a.is_default) || data[0];
        if (def) {
          setSelectedAddressId(def.id);
          setInfo({ name: def.name, phone: def.phone, address: def.address });
        }
      })
      .catch((err) => {
        // Not logged in or error
        setIsLoggedIn(false);
      });
  }, []);

  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
    setIsEditing(false);
    if (id === 'new') {
      setInfo({ name: '', phone: '', address: '' });
      setSaveNewAddress(true); // Default check for convenience
    } else {
      const addr = savedAddresses.find(a => a.id == id);
      if (addr) {
        setInfo({ name: addr.name, phone: addr.phone, address: addr.address });
        setSaveNewAddress(false);
      }
    }
  };

  const handleEditMode = () => {
    setIsEditing(true);
    setSaveNewAddress(true);
  };

  const productTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const installFee = installation.method === 'home' ? 150000 : 0;
  const finalTotal = productTotal + installFee;

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  async function handleOrder() {
    if (!info.name || !info.phone || !info.address) {
      return showToast('warning', 'Vui lòng điền đầy đủ thông tin giao hàng.');
    }
    if (!/^\d{10,11}$/.test(info.phone)) {
      return showToast('warning', 'Số điện thoại không hợp lệ (10-11 số).');
    }
    if (!installation.method) {
      return showToast('warning', 'Vui lòng chọn phương thức lắp đặt.');
    }
    if (installation.method === 'home' && !installation.time) {
      return showToast('warning', 'Vui lòng nhập thời gian mong muốn lắp đặt.');
    }

    setLoading(true);
    try {
      // 1. Save address if requested
      if (isLoggedIn && (selectedAddressId === 'new' || isEditing) && saveNewAddress) {
        try {
          await Api.addAddress(info);
        } catch (e) {
          console.error("Failed to auto-save address", e);
          // Ignore error and proceed with checkout
        }
      }

      // 2. Checkout
      await Api.checkout(
        cart.map(i => ({ pid: i.id, qty: i.qty })),
        info,
        method,
        installation
      );

      const successMsg = isLoggedIn
        ? `🎉 Đặt hàng thành công! Cảm ơn ${info.name}.`
        : `🎉 Đặt hàng thành công! Cảm ơn ${info.name}. Hãy đăng nhập để theo dõi đơn hàng!`;

      showToast('success', successMsg);

      // Delay to show toast
      setTimeout(() => {
        onCheckoutSuccess();
      }, 2000);

    } catch (e) {
      showToast('error', 'Lỗi đặt hàng: ' + e.message);
      setLoading(false); // Only stop loading on error, on success we keep loading to block interactions till redirect
    }
  }

  if (cart.length === 0) {
    return (
      <Card className="text-center py-12 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🛒</div>
        <div className="text-xl font-medium mb-2">Giỏ hàng trống</div>
        <Button onClick={onCancel}>Quay lại mua sắm</Button>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 pb-10 relative">
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="space-y-6">
        <Card>
          <div className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <span className="bg-gray-100 p-1 rounded text-base">📍</span> Thông tin giao hàng
          </div>

          {/* Address Selection Dropdown */}
          {isLoggedIn && savedAddresses.length > 0 && (
            <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <label className="block text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Chọn địa chỉ đã lưu</label>
              <select
                className="w-full border-blue-300 rounded p-2 text-sm focus:ring-blue-500"
                value={selectedAddressId}
                onChange={e => handleAddressSelect(e.target.value)}
                disabled={loading}
              >
                {savedAddresses.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} - {a.phone} ({a.address.substring(0, 30)}...)
                  </option>
                ))}
                <option value="new">+ Thêm địa chỉ mới</option>
              </select>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <Input
                value={info.name}
                onChange={e => setInfo({ ...info, name: e.target.value })}
                disabled={loading || (selectedAddressId !== 'new' && !isEditing)}
                className={(selectedAddressId !== 'new' && !isEditing) ? 'bg-gray-100 text-gray-500' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <Input
                type="tel"
                value={info.phone}
                onChange={e => setInfo({ ...info, phone: e.target.value })}
                disabled={loading || (selectedAddressId !== 'new' && !isEditing)}
                className={(selectedAddressId !== 'new' && !isEditing) ? 'bg-gray-100 text-gray-500' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ nhận hàng</label>
              <textarea
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${(selectedAddressId !== 'new' && !isEditing) ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                rows="3"
                value={info.address}
                onChange={e => setInfo({ ...info, address: e.target.value })}
                disabled={loading || (selectedAddressId !== 'new' && !isEditing)}
              />
            </div>

            {/* Save Address Checkbox */}
            {isLoggedIn && (selectedAddressId === 'new' || isEditing) && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="saveaddr"
                  checked={saveNewAddress}
                  onChange={e => setSaveNewAddress(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="saveaddr" className="text-sm text-gray-700 select-none cursor-pointer">Lưu địa chỉ này cho lần sau</label>
              </div>
            )}

            {/* Edit button if viewing existing */}
            {isLoggedIn && selectedAddressId !== 'new' && !isEditing && (
              <button
                className="text-sm text-blue-600 hover:underline font-medium"
                onClick={handleEditMode}
              >
                Thay đổi
              </button>
            )}
          </div>
        </Card>

        {/* Installation Method */}
        <Card>
          <div className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-gray-100 p-1 rounded text-base">🔧</span> Phương thức lắp đặt
          </div>
          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${installation.method === 'self' ? 'border-blue-500 bg-blue-50 ring-1' : 'hover:bg-gray-50'}`}>
              <input type="radio" name="install" checked={installation.method === 'self'} onChange={() => setInstallation({ method: 'self', time: '' })} className="mt-1" />
              <div>
                <div className="font-medium text-gray-900">Tự lắp đặt (Miễn phí)</div>
                <div className="text-sm text-gray-500">Bạn sẽ tự lắp đặt sản phẩm.</div>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer ${installation.method === 'home' ? 'border-blue-500 bg-blue-50 ring-1' : 'hover:bg-gray-50'}`}>
              <input type="radio" name="install" checked={installation.method === 'home'} onChange={() => setInstallation({ method: 'home', time: '' })} className="mt-1" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <div className="font-medium text-gray-900">Nhân viên lắp tại nhà</div>
                  <div className="font-bold text-blue-600">+150.000₫</div>
                </div>
                {installation.method === 'home' && (
                  <Input
                    className="mt-2 text-sm"
                    placeholder="Thời gian mong muốn..."
                    value={installation.time}
                    onChange={e => setInstallation({ ...installation, time: e.target.value })}
                  />
                )}
              </div>
            </label>
          </div>
        </Card>

        {/* Payment Method */}
        <Card>
          <div className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-gray-100 p-1 rounded text-base">💳</span> Phương thức thanh toán
          </div>
          <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer ${method === 'cod' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
            <input type="radio" checked={method === 'cod'} readOnly />
            <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
          </label>
        </Card>
      </div>

      {/* CỘT PHẢI: TỔNG KẾT */}
      <div>
        <Card className="sticky top-4">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Đơn hàng của bạn</h2>
          <div className="space-y-3 max-h-[300px] overflow-auto mb-4 custom-scrollbar">
            {cart.map(item => (
              <div key={item.id} className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded border flex-shrink-0 flex items-center justify-center p-1">
                  <img src={item.image_path} alt="" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-gray-500">x{item.qty}</div>
                  <div className="text-sm font-bold text-blue-600">{item.price.toLocaleString('vi-VN')}₫</div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">×</button>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng tiền hàng</span>
              <span className="font-medium">{productTotal.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phí lắp đặt</span>
              <span className="font-medium">{installFee > 0 ? `+${installFee.toLocaleString('vi-VN')}₫` : 'Miễn phí'}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
              <span>Tổng cộng</span>
              <span className="text-blue-600">{finalTotal.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>

          <Button className="w-full mt-6 py-3 text-lg" onClick={handleOrder} disabled={loading}>
            {loading ? <div className="flex items-center justify-center gap-2"><Spinner /> Đang xử lý...</div> : 'Xác nhận Đặt hàng'}
          </Button>
        </Card>
      </div>
    </div>
  );
}