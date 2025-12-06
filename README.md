# 🚗 AutoParts E-Commerce Platform

Một nền tảng thương mại điện tử chuyên nghiệp dành cho kinh doanh phụ tùng ô tô, tích hợp đầy đủ các tính năng từ xem sản phẩm, đặt hàng, quản lý đơn hàng đến các tính năng nâng cao như nhận diện phụ tùng bằng AI.

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-PERN-blue)

## 🌟 Tính Năng Chính

### 👤 Dành cho Khách hàng (User)
*   **Danh mục sản phẩm thông minh**: Tìm kiếm, lọc theo loại phụ tùng (Nội thất, Ngoại thất, Thiết bị), và thương hiệu.
*   **Chi tiết sản phẩm chuyên sâu**: Xem hình ảnh, giá bán, mô tả, và **thông số kỹ thuật chi tiết**.
*   **Giỏ hàng & Thanh toán**: Thêm vào giỏ, cập nhật số lượng, quy trình thanh toán mượt mà.
*   **Sổ địa chỉ thông minh**: Lưu trữ và tự động điền thông tin giao hàng cho các lần mua sau.
*   **Quản lý đơn hàng**: Theo dõi trạng thái đơn hàng (đang xử lý, giao hàng, hoàn thành).
*   **AI Chẩn đoán**: Tải lên hình ảnh hoặc âm thanh để nhận diện lỗi xe và gợi ý phụ tùng phù hợp (Tính năng Beta).
*   **Tương tác**: Gửi đánh giá sản phẩm (Review) và yêu cầu tư vấn trực tiếp.

### 🛡️ Dành cho Quản trị viên (Admin)
*   **Dashboard tổng quan**: Thống kê nhanh tình hình kinh doanh.
*   **Quản lý Sản phẩm**: Thêm, sửa, xóa sản phẩm, cập nhật tồn kho.
*   **Quản lý Đơn hàng**: Xem chi tiết đơn hàng, cập nhật trạng thái (Chờ xác nhận -> Đang giao -> Hoàn thành).
*   **Quản lý Khách hàng**: Phân quyền (User/Staff/Admin).
*   **Quản lý Nhập hàng (Import)**: Theo dõi lịch sử nhập hàng, thêm tồn kho, ghi nhận nhà cung cấp.
*   **Trung tâm phản hồi**:
    *   **Quản lý Đánh giá**: Theo dõi bình luận và đánh giá sao từ khách hàng.
    *   **Quản lý Tư vấn**: Xử lý các yêu cầu gọi lại, cập nhật trạng thái (Chờ xử lý, Đã liên hệ).

---

## 🛠️ Công Nghệ Sử Dụng

Dự án được xây dựng trên **PERN Stack** (PostgreSQL, Express, React, Node.js):

*   **Frontend**: React.js, Tailwind CSS (Styling), Vite (Build tool).
*   **Backend**: Node.js, Express.js.
*   **Database**: PostgreSQL.
*   **AI Engine**: Python (TensorFlow/PyTorch) & Flask (cho các tác vụ nhận diện).

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Yêu cầu hệ thống
*   [Node.js](https://nodejs.org/) (v16 trở lên)
*   [PostgreSQL](https://www.postgresql.org/)
*   [Python](https://www.python.org/) 3.8+ (Nếu chạy tính năng AI)

### 2. Cài đặt Backend
Di chuyển vào thư mục backend và cài đặt dependencies:
```bash
cd autoparts-backend
npm install
```

Tạo file `.env` trong thư mục `autoparts-backend`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/autoparts_db
JWT_SECRET=your_super_secret_key_123
```

Chạy server:
```bash
npm start
```

### 3. Cài đặt Frontend
Di chuyển vào thư mục frontend và cài đặt dependencies:
```bash
cd autoparts-frontend
npm install
```

Tạo file `.env` trong thư mục `autoparts-frontend` (nếu cần config port khác):
```env
VITE_API_URL=http://localhost:4000
```

Chạy dev server:
```bash
npm run dev
```
Hoặc build production:
```bash
npm run build
```

---

## 📂 Cấu Trúc Dự Án

```
autoparts_full/
├── autoparts-backend/       # Server Node.js & API
│   ├── server.js            # Entry point chính, định nghĩa API
│   ├── db.js                # Kết nối Database
│   ├── detector.py          # AI logic (Python)
│   └── uploads/             # Thư mục lưu file upload
│
├── autoparts-frontend/      # Client React App
│   ├── src/
│   │   ├── components/      # Các UI component (Header, ProductDetail, ManagePage...)
│   │   ├── api.js           # API Service
│   │   └── App.jsx          # Routing chính
│   └── dist/                # Build output
│
└── README.md                # Tài liệu dự án
```

---

## 🔌 API Document (Tóm tắt)

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| **GET** | `/api/products` | Lấy danh sách sản phẩm (có filter, search) |
| **GET** | `/api/product/:id` | Lấy chi tiết sản phẩm |
| **POST** | `/api/orders` | Tạo đơn hàng mới |
| **GET** | `/api/reviews/:id` | Lấy đánh giá của sản phẩm |
| **POST** | `/api/consultations` | Gửi yêu cầu tư vấn |
| **GET** | `/api/admin/imports` | (Admin) Lấy lịch sử nhập hàng |
| **POST** | `/api/admin/imports` | (Admin) Nhập hàng & tăng tồn kho |

---

## 📝 Ghi Chú Phát Triển

*   **Quyền Admin**: Tài khoản admin mặc định (nếu có trong seed data) hoặc set role trực tiếp trong database (`UPDATE users SET role='admin' WHERE email='...'`).
*   **AI Feature**: Cần cài đặt các thư viện Python (`pip install tensorflow flask ...`) và chạy service Python riêng hoặc tích hợp qua child_process trong Node.js (cấu hình hiện tại đang dùng child_process).

---
*© 2025 AutoParts Project. Developed by Trung Kien.*