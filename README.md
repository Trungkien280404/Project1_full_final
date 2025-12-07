# 🚗 AutoParts E-Commerce Platform

Một nền tảng thương mại điện tử chuyên nghiệp dành cho kinh doanh phụ tùng ô tô, tích hợp đầy đủ các tính năng từ xem sản phẩm, đặt hàng, quản lý đơn hàng đến các tính năng nâng cao như nhận diện phụ tùng và chẩn đoán hư hỏng bằng AI.

![Project Status](https://img.shields.io/badge/Status-Production-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-PERN-blue)
![AI Powered](https://img.shields.io/badge/AI-YOLOv8%20%2B%20Gemini-orange)

## 🌟 Tính Năng Chính

### 👤 Dành cho Khách hàng (User)
- **Danh mục sản phẩm thông minh**: Tìm kiếm, lọc theo loại phụ tùng (Nội thất, Ngoại thất, Thiết bị), và thương hiệu.
- **Chi tiết sản phẩm chuyên sâu**: Xem hình ảnh, giá bán, mô tả, và thông số kỹ thuật chi tiết.
- **Giỏ hàng lưu trữ**: Giỏ hàng được lưu theo tài khoản, không mất khi F5 hoặc đăng nhập lại.
- **Sổ địa chỉ thông minh**: Lưu trữ và tự động điền thông tin giao hàng cho các lần mua sau.
- **Quản lý đơn hàng**: Theo dõi trạng thái đơn hàng (đang xử lý, giao hàng, hoàn thành).
- **AI Chẩn đoán xe**: 
  - Nhận diện hư hỏng xe (YOLOv8)
  - Nhận diện phụ tùng xe (YOLOv8)
  - Nhận diện thương hiệu/mẫu xe (Google Gemini AI)
- **Tương tác**: Gửi đánh giá sản phẩm (Review) và yêu cầu tư vấn trực tiếp.

### 🛡️ Dành cho Quản trị viên (Admin)
- **Dashboard tổng quan**: Thống kê doanh thu, đơn hàng, lượt truy cập.
- **Quản lý Sản phẩm**: Thêm, sửa, xóa sản phẩm, upload ảnh, cập nhật tồn kho.
- **Quản lý Đơn hàng**: Xem chi tiết đơn hàng, cập nhật trạng thái.
- **Quản lý Khách hàng**: Phân quyền (User/Admin), xóa tài khoản.
- **Quản lý Nhập hàng**: Theo dõi lịch sử nhập hàng, ghi nhận nhà cung cấp.
- **Trung tâm phản hồi**:
  - Quản lý Đánh giá: Theo dõi và phản hồi bình luận khách hàng.
  - Quản lý Tư vấn: Xử lý yêu cầu tư vấn, cập nhật trạng thái.

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **React.js** - UI Framework
- **Vite** - Build tool & Dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lazy Loading** - Code splitting & Performance optimization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Helmet** - Security headers

### AI/ML
- **Python 3.11** - AI runtime
- **YOLOv8 (Ultralytics)** - Object detection
- **PyTorch 2.4.0** - Deep learning framework
- **Google Gemini AI** - Brand/model recognition
- **OpenCV** - Image processing

### Deployment
- **Render.com** - Cloud platform
- **Docker** - Containerization
- **GitHub Actions** - CI/CD

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Yêu cầu hệ thống
- [Node.js](https://nodejs.org/) v20+
- [PostgreSQL](https://www.postgresql.org/) v16+
- [Python](https://www.python.org/) 3.11+ (cho tính năng AI)
- [Git](https://git-scm.com/)

### 2. Clone Repository
```bash
git clone https://github.com/Trungkien280404/Project1_full_final.git
cd Project1_full_final
```

### 3. Cài đặt Backend

```bash
cd autoparts-backend
npm install
```

Tạo file `.env`:
```env
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/autoparts_db
JWT_SECRET=your_super_secret_key_here_min_32_chars
GEMINI_API_KEY=your_gemini_api_key_here
```

Cài đặt Python dependencies:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Chạy database migration:
```bash
node migrate_prod_db.js
```

Khởi động server:
```bash
npm start
```

### 4. Cài đặt Frontend

```bash
cd autoparts-frontend
npm install
```

Tạo file `.env` (optional):
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
├── autoparts-backend/          # Node.js Backend
│   ├── server.js               # Main server file
│   ├── detector.py             # AI detection logic
│   ├── requirements.txt        # Python dependencies
│   ├── migrate_prod_db.js      # Database migration
│   ├── create_cart_table.js    # Cart table migration
│   ├── optimize_db.js          # Database optimization
│   └── uploads/                # User uploaded files
│
├── autoparts-frontend/         # React Frontend
│   ├── src/
│   │   ├── components/         # UI Components
│   │   ├── api.js              # API Client
│   │   ├── App.jsx             # Main App & Routing
│   │   └── styles.css          # Global styles
│   └── dist/                   # Production build
│
├── Dockerfile                  # Docker configuration
├── DEPLOYMENT_GUIDE.txt        # Deployment documentation
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/forgot` | Quên mật khẩu - Gửi mã xác minh |
| POST | `/api/auth/verify-reset` | Xác minh mã reset |
| POST | `/api/auth/reset` | Đặt lại mật khẩu |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Lấy danh sách sản phẩm (filter, search) |
| GET | `/api/products/:id` | Chi tiết sản phẩm |
| POST | `/api/products` | (Admin) Thêm sản phẩm mới |
| PUT | `/api/products/:id` | (Admin) Cập nhật sản phẩm |
| DELETE | `/api/products/:id` | (Admin) Xóa sản phẩm |

### Cart (Giỏ hàng)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Lấy giỏ hàng của user |
| POST | `/api/cart` | Thêm sản phẩm vào giỏ |
| PUT | `/api/cart/:id` | Cập nhật số lượng |
| DELETE | `/api/cart/:id` | Xóa item khỏi giỏ |
| DELETE | `/api/cart` | Xóa toàn bộ giỏ hàng |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Tạo đơn hàng mới |
| GET | `/api/orders/my` | Lấy đơn hàng của user |
| PUT | `/api/orders/:id/receive` | Xác nhận đã nhận hàng |
| GET | `/api/admin/orders` | (Admin) Lấy tất cả đơn hàng |
| PUT | `/api/admin/orders/:id` | (Admin) Cập nhật trạng thái |

### AI Diagnosis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/diagnose` | Upload ảnh để AI chẩn đoán |

### Reviews & Consultations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/:productId` | Lấy đánh giá sản phẩm |
| POST | `/api/reviews` | Thêm đánh giá mới |
| POST | `/api/consultations` | Gửi yêu cầu tư vấn |
| GET | `/api/admin/reviews` | (Admin) Quản lý đánh giá |
| GET | `/api/admin/consultations` | (Admin) Quản lý tư vấn |

---

## 🔐 Bảo Mật

- **JWT Authentication**: Stateless authentication với token expiry
- **Password Hashing**: Bcrypt với 10 salt rounds
- **Input Validation**: 
  - Email format validation
  - Password strength requirements (6+ chars, uppercase, special char)
  - SQL injection prevention (parameterized queries)
- **CORS Configuration**: Whitelist allowed origins
- **Helmet.js**: Security headers
- **SSL/HTTPS**: Enforced on production (Render)

---

## 🚢 Deployment

Ứng dụng được deploy trên **Render.com** với:

- **Web Service**: Docker container (Node.js + Python)
- **PostgreSQL Database**: Managed database service
- **Auto-deploy**: Từ GitHub repository
- **SSL Certificate**: Tự động cấp miễn phí

Chi tiết deployment: Xem file `DEPLOYMENT_GUIDE.txt`

**Production URL**: https://your-app-name.onrender.com

---

## 📊 Database Schema

### Main Tables
- `users` - Tài khoản người dùng
- `products` - Sản phẩm
- `cart` - Giỏ hàng (lưu theo user)
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `reviews` - Đánh giá sản phẩm
- `consultations` - Yêu cầu tư vấn
- `import_logs` - Lịch sử nhập hàng
- `user_addresses` - Địa chỉ giao hàng

### Indexes
- GIN trigram index trên `products.name` (full-text search)
- B-tree indexes trên các foreign keys
- Unique constraints để đảm bảo data integrity

---

## 🎯 Tính Năng Nổi Bật

### 1. AI-Powered Diagnosis
- Sử dụng YOLOv8 để detect:
  - Hư hỏng xe (scratches, dents, cracks)
  - Phụ tùng xe (bumper, hood, door, etc.)
- Google Gemini AI nhận diện thương hiệu/mẫu xe
- Lazy loading models để tiết kiệm RAM

### 2. Persistent Shopping Cart
- Giỏ hàng lưu trong database
- Đồng bộ trên mọi thiết bị
- Không mất khi F5 hoặc đăng nhập lại

### 3. Smart Address Book
- Lưu nhiều địa chỉ giao hàng
- Auto-fill khi checkout
- Set default address

### 4. Professional UI/UX
- Toast notifications thay vì alert()
- Lazy loading components
- Responsive design
- Loading states & error handling

---

## 📝 Ghi Chú

### Tài khoản Admin mặc định
- Email: `admin@gmail.com`
- Password: Được set trong migration script

### AI Models
- Damage detection: `damage_model.pt`
- Part detection: `part_model.pt`
- Models được lazy load khi cần

### Environment Variables
Đảm bảo set đầy đủ biến môi trường:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key cho JWT (min 32 chars)
- `GEMINI_API_KEY` - Google AI API key
- `PORT` - Server port (default: 4000)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Nguyễn Trung Kiên**
- GitHub: [@Trungkien280404](https://github.com/Trungkien280404)
- Email: trungkien280404@gmail.com

---

## 🙏 Acknowledgments

- YOLOv8 by Ultralytics
- Google Gemini AI
- Render.com for hosting
- React & Node.js communities

---

*© 2025 AutoParts Project. All rights reserved.*