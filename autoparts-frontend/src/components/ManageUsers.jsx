import React, { useState, useEffect } from 'react';
import { Api } from '../api.js';
import Card from './Card.jsx';
import { Spinner } from './Icons.jsx';

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Các vai trò trong hệ thống
    const rolesToSet = ['user', 'staff', 'admin'];

    useEffect(() => {
        setLoading(true);
        Api.adminGetUsers()
            .then(data => {
                // Sắp xếp theo thứ tự: Admin -> Staff -> User
                const rolePriority = { admin: 1, staff: 2, user: 3 };
                const sorted = data.sort((a, b) => {
                    const pA = rolePriority[a.role] || 4;
                    const pB = rolePriority[b.role] || 4;
                    return pA - pB;
                });
                setUsers(sorted);
            })
            .catch(err => setError(err.message || 'Không thể tải danh sách người dùng'))
            .finally(() => setLoading(false));
    }, []);

    async function handleRoleChange(id, newRole) {
        if (loading) return;
        // Optimistic Update: Cập nhật giao diện ngay lập tức
        const oldUsers = [...users];
        setUsers(users.map(u => (u.id === id ? { ...u, role: newRole } : u)));

        try {
            await Api.adminUpdateUserRole(id, newRole);
            // Thành công: Không làm gì thêm
        } catch (e) {
            // Thất bại: Hoàn tác lại giao diện cũ và báo lỗi
            setUsers(oldUsers);
            alert('Lỗi cập nhật vai trò: ' + e.message);
        }
    }

    async function handleDelete(id) {
        if (loading) return;
        if (!confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng này không?')) return;

        setLoading(true);
        try {
            await Api.adminDeleteUser(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (e) {
            alert('Lỗi xóa người dùng: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card>
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <div className="text-xl font-bold text-gray-800">
                    Danh sách Người dùng ({users.length})
                </div>
                {loading && <span className="text-xs text-blue-500 animate-pulse font-medium">Đang đồng bộ dữ liệu...</span>}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <div className="min-w-[600px]">
                    {/* Header Bảng */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        <div className="col-span-5">Thông tin cá nhân</div>
                        <div className="col-span-4">Vai trò hệ thống</div>
                        <div className="col-span-3 text-right">Hành động</div>
                    </div>

                    {/* Nội dung Bảng */}
                    <div className="divide-y divide-gray-100 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {users.map(user => (
                            <div key={user.id} className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-blue-50 transition duration-150">

                                {/* Cột Thông tin */}
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${user.role === 'admin' ? 'bg-purple-600' : user.role === 'staff' ? 'bg-blue-500' : 'bg-gray-400'
                                        }`}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-gray-900 truncate" title={user.name}>{user.name}</div>
                                        <div className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</div>
                                    </div>
                                </div>

                                {/* Cột Vai trò */}
                                <div className="col-span-4">
                                    <select
                                        className={`block w-full pl-3 pr-8 py-1.5 text-xs font-medium border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm ${user.role === 'admin'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : user.role === 'staff'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : 'bg-white text-gray-700'
                                            }`}
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1} // Không cho đổi admin cuối cùng
                                    >
                                        {rolesToSet.map(role => (
                                            <option key={role} value={role}>{role.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cột Hành động */}
                                <div className="col-span-3 text-right">
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-600 hover:text-red-900 text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-50 transition"
                                        title="Xóa người dùng"
                                        disabled={user.role === 'admin'} // An toàn: Không cho xóa Admin
                                    >
                                        Xóa
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}
