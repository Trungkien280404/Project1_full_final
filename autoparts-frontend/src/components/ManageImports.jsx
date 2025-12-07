import React, { useState, useEffect } from 'react';
import { Api } from '../api.js';
import Card from './Card.jsx';
import { Spinner } from './Icons.jsx';
import Toast from './Toast.jsx';

export default function ManageImports() {
    const [imports, setImports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    // Toast state
    const [toast, setToast] = useState(null);

    // Form state
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    const [supplier, setSupplier] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            Api.adminGetImports(),
            Api.products({ limit: 1000 }) // Get all products for dropdown
        ])
            .then(([importData, productData]) => {
                setImports(importData);
                // Handle different product response structures if needed
                const prodList = Array.isArray(productData) ? productData : (productData.data || []);
                setProducts(prodList);
                if (prodList.length > 0) setSelectedProduct(prodList[0].id);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleImport = async (e) => {
        e.preventDefault();
        try {
            await Api.adminAddImport({
                product_id: selectedProduct,
                quantity: parseInt(quantity),
                note,
                supplier
            });

            setToast({ type: 'success', message: 'Nhập hàng thành công! Tồn kho đã được cập nhật.' });

            // 1. Refresh import list
            const newImports = await Api.adminGetImports();
            setImports(newImports);

            // 2. Refresh product list to update stock in dropdown immediately
            const productData = await Api.products({ limit: 1000 });
            const prodList = Array.isArray(productData) ? productData : (productData.data || []);
            setProducts(prodList);

            setNote('');
            setSupplier('');
            setQuantity(1);
        } catch (e) {
            setToast({ type: 'error', message: "Lỗi nhập hàng: " + e.message });
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Spinner /></div>;

    return (
        <div className="space-y-6">
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Form Nhập Hàng */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Nhập Hàng (Thêm tồn kho)</h2>
                <form onSubmit={handleImport} className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Sản phẩm</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedProduct}
                            onChange={e => setSelectedProduct(e.target.value)}
                        >
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Tồn hiện tại: {p.stock})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng nhập</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            required
                        />
                    </div>
                    {/* Nhà cung cấp */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                            value={supplier}
                            onChange={e => setSupplier(e.target.value)}
                            placeholder="Tên công ty / nhà phân phối..."
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú nhập hàng</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 h-20"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Ví dụ: Lô hàng tháng 12..."
                        />
                    </div>
                    <div className="md:col-span-2 text-right">
                        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition">
                            Xác nhận Nhập kho
                        </button>
                    </div>
                </form>
            </Card>

            {/* Lịch sử Nhập hàng */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Lịch sử Nhập hàng</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Sản phẩm</th>
                                <th className="px-6 py-3">Số lượng</th>
                                <th className="px-6 py-3">Nhà cung cấp</th>
                                <th className="px-6 py-3">Ghi chú</th>
                                <th className="px-6 py-3">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {imports.map((item) => (
                                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {item.product_name} <span className="text-xs text-gray-400">#{item.product_id}</span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-green-600">
                                        +{item.quantity}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-blue-800">
                                        {item.supplier || <span className="text-gray-400 italic">--</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {item.note || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleString('vi-VN')}
                                    </td>
                                </tr>
                            ))}
                            {imports.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">Chưa có lịch sử nhập hàng.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
