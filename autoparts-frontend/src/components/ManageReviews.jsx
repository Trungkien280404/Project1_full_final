import React, { useState, useEffect } from 'react';
import { Api } from '../api.js';
import Card from './Card.jsx';
import { Spinner } from './Icons.jsx';

export default function ManageReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Api.adminGetReviews()
            .then(setReviews)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center p-10"><Spinner /></div>;

    return (
        <Card>
            <h2 className="text-xl font-bold mb-4">Quản lý Đánh giá & Bình luận</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Sản phẩm</th>
                            <th className="px-6 py-3">Khách hàng</th>
                            <th className="px-6 py-3">Đánh giá</th>
                            <th className="px-6 py-3">Nội dung</th>
                            <th className="px-6 py-3">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map((r) => (
                            <tr key={r.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <img src={r.product_image} className="w-8 h-8 object-cover rounded" onError={(e) => e.target.src = 'https://placehold.co/50'} />
                                        <span className="truncate max-w-[150px]" title={r.product_name}>{r.product_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>{r.user_name}</div>
                                    <div className="text-xs text-gray-400">ID: {r.user_id}</div>
                                </td>
                                <td className="px-6 py-4 text-yellow-500">
                                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                                </td>
                                <td className="px-6 py-4 max-w-[300px] truncate" title={r.comment}>
                                    {r.comment}
                                </td>
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                    {new Date(r.created_at).toLocaleString('vi-VN')}
                                </td>
                            </tr>
                        ))}
                        {reviews.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-gray-500">Chưa có đánh giá nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
