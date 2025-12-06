import React, { useState, useEffect } from 'react';
import { Api } from '../api.js';
import Card from './Card.jsx';
import { Spinner } from './Icons.jsx';

export default function ManageConsultations() {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Api.adminGetConsultations()
            .then(setConsultations)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleStatusChange = async (id, newStatus) => {
        // Optimistic update
        const oldData = [...consultations];
        setConsultations(consultations.map(c => c.id === id ? { ...c, status: newStatus } : c));

        try {
            await Api.adminUpdateConsultationStatus(id, newStatus);
        } catch (e) {
            alert("Lỗi cập nhật trạng thái: " + e.message);
            setConsultations(oldData); // Revert on error
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Spinner /></div>;

    // Helper classes for status styles
    const getStatusStyle = (status) => {
        switch (status) {
            case 'processed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Quản lý Yêu cầu Tư vấn</h2>
                <button onClick={loadData} className="text-blue-600 text-sm hover:underline">Làm mới</button>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Khách hàng</th>
                            <th className="px-6 py-3">Liên hệ</th>
                            <th className="px-6 py-3">Sản phẩm quan tâm</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {consultations.map((c) => (
                            <tr key={c.id} className="bg-white hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                                <td className="px-6 py-4">
                                    <a href={`tel:${c.phone}`} className="font-mono text-blue-600 hover:underline flex items-center gap-1">
                                        📞 {c.phone}
                                    </a>
                                </td>
                                <td className="px-6 py-4">
                                    {c.product_name ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded border overflow-hidden">
                                                <img src={c.image_path} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => e.target.src = 'https://placehold.co/50'} />
                                            </div>
                                            <span className="truncate max-w-[200px] font-medium text-gray-700" title={c.product_name}>{c.product_name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Tư vấn chung</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 min-w-[180px]">
                                    <div className="relative">
                                        <select
                                            className={`appearance-none block w-full text-sm font-bold py-2 px-3 pr-8 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all shadow-sm ${getStatusStyle(c.status)}`}
                                            value={c.status || 'pending'}
                                            onChange={(e) => handleStatusChange(c.id, e.target.value)}
                                        >
                                            <option value="pending" className="bg-white text-gray-800">⏳ Chờ xử lý</option>
                                            <option value="processed" className="bg-white text-gray-800">✅ Đã liên hệ</option>
                                            <option value="cancelled" className="bg-white text-gray-800">❌ Đã huỷ</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-60">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                                    {new Date(c.created_at).toLocaleString('vi-VN')}
                                </td>
                            </tr>
                        ))}
                        {consultations.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-10 text-gray-400 italic">
                                    Hiện chưa có yêu cầu tư vấn nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
