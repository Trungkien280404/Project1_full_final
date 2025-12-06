# 🧪 Hướng Dẫn Test API với Postman

## 📋 Mục Lục
1. [Cấu Hình Ban Đầu](#cấu-hình-ban-đầu)
2. [Authentication APIs](#1-authentication-apis)
3. [Product APIs](#2-product-apis)
4. [Order APIs](#3-order-apis)
5. [Admin APIs](#4-admin-apis)
6. [ML Diagnostic API](#5-ml-diagnostic-api)
7. [Stats APIs](#6-stats-apis)

---

## Cấu Hình Ban Đầu

### Base URL
```
http://localhost:4000
```

### Environment Variables (Tạo trong Postman)
- `base_url`: `http://localhost:4000`
- `token`: (sẽ được set tự động sau khi login)

---

## 1. Authentication APIs

### 1.1. Đăng Ký (Register)
**POST** `{{base_url}}/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Nguyễn Văn Test",
  "email": "test@example.com",
  "password": "123456"
}
```

**Expected Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn Test",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Test Script (Postman):**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
    console.log("Token saved:", response.token);
}
```

---

### 1.2. Đăng Nhập (Login)
**POST** `{{base_url}}/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn Test",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Test Script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
}
```

---

### 1.3. Quên Mật Khẩu (Forgot Password)
**POST** `{{base_url}}/api/auth/forgot`

**Body (JSON):**
```json
{
  "email": "test@example.com"
}
```

**Expected Response (200):**
```json
{
  "message": "Mã xác thực đã được gửi qua email"
}
```

---

### 1.4. Xác Thực Mã Reset
**POST** `{{base_url}}/api/auth/verify-reset`

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "code": "123456"
}
```

---

### 1.5. Reset Mật Khẩu
**POST** `{{base_url}}/api/auth/reset`

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

---

## 2. Product APIs

### 2.1. Lấy Danh Sách Sản Phẩm
**GET** `{{base_url}}/api/products`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Cửa sau bên trái",
    "brand": "Toyota",
    "price": 8200000,
    "stock": 10,
    "category": "Cửa xe",
    "img": "/uploads/product_1.jpg",
    "createdat": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2.2. Tạo Sản Phẩm Mới (Admin Only)
**POST** `{{base_url}}/api/products`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
- `name`: Phanh đĩa trước
- `brand`: Honda
- `price`: 1500000
- `stock`: 20
- `category`: Phanh
- `file`: [Chọn file ảnh]

**Expected Response (201):**
```json
{
  "id": 2,
  "name": "Phanh đĩa trước",
  "brand": "Honda",
  "price": 1500000,
  "stock": 20,
  "category": "Phanh",
  "img": "/uploads/product_2.jpg"
}
```

---

### 2.3. Cập Nhật Sản Phẩm (Admin Only)
**PUT** `{{base_url}}/api/products/1`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
- `name`: Cửa sau bên trái (Updated)
- `price`: 8500000
- `stock`: 15
- `file`: [Optional - file ảnh mới]

---

### 2.4. Xóa Sản Phẩm (Admin Only)
**DELETE** `{{base_url}}/api/products/1`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "message": "Đã xóa sản phẩm"
}
```

---

## 3. Order APIs

### 3.1. Tạo Đơn Hàng (Checkout)
**POST** `{{base_url}}/api/orders`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "items": [
    {
      "pid": 1,
      "qty": 2
    },
    {
      "pid": 2,
      "qty": 1
    }
  ],
  "info": {
    "name": "Nguyễn Văn A",
    "phone": "0912345678",
    "address": "123 Đường ABC, Quận 1, TP.HCM"
  },
  "method": "cod",
  "installation": {
    "method": "home",
    "time": "9h sáng mai"
  }
}
```

**Installation Options:**
- `method`: `"self"` (tự lắp đặt - miễn phí) hoặc `"home"` (lắp tại nhà - +150,000₫)
- `time`: Chỉ bắt buộc nếu `method = "home"`

**Expected Response (201):**
```json
{
  "id": 1,
  "userEmail": "test@example.com",
  "total": 18550000,
  "items": [...],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Tính Toán Total:**
- Product 1: 8,200,000 × 2 = 16,400,000₫
- Product 2: 1,500,000 × 1 = 1,500,000₫
- Installation Fee: 150,000₫ (nếu method = "home")
- **Total: 18,050,000₫**

---

### 3.2. Lấy Đơn Hàng Của Tôi
**GET** `{{base_url}}/api/orders/my`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "total": 18050000,
    "status": "pending",
    "customer_name": "Nguyễn Văn A",
    "customer_phone": "0912345678",
    "customer_address": "123 Đường ABC, Quận 1, TP.HCM (Lắp đặt lúc: 9h sáng mai)",
    "payment_method": "cod",
    "installation_method": "home",
    "installation_fee": 150000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "items": [
      {
        "pid": 1,
        "qty": 2,
        "product": {
          "id": 1,
          "name": "Cửa sau bên trái",
          "price": 8200000
        }
      }
    ]
  }
]
```

---

### 3.3. Xác Nhận Đã Nhận Hàng
**PUT** `{{base_url}}/api/orders/1/receive`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{}
```

**Expected Response (200):**
```json
{
  "message": "Đã xác nhận nhận hàng"
}
```

---

## 4. Admin APIs

### 4.1. Lấy Danh Sách Users (Admin Only)
**GET** `{{base_url}}/api/admin/users`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "createdat": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 4.2. Cập Nhật Role User (Admin Only)
**PUT** `{{base_url}}/api/admin/users/2`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "role": "admin"
}
```

**Role Options:** `"user"` hoặc `"admin"`

---

### 4.3. Xóa User (Admin Only)
**DELETE** `{{base_url}}/api/admin/users/2`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "message": "Đã xóa user"
}
```

---

### 4.4. Lấy Tất Cả Đơn Hàng (Admin Only)
**GET** `{{base_url}}/api/admin/orders`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "user_email": "test@example.com",
    "total": 18050000,
    "status": "pending",
    "customer_name": "Nguyễn Văn A",
    "installation_method": "home",
    "installation_fee": 150000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "items": [...]
  }
]
```

---

### 4.5. Cập Nhật Trạng Thái Đơn Hàng (Admin Only)
**PUT** `{{base_url}}/api/admin/orders/1`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "status": "shipping"
}
```

**Status Options:**
- `"pending"` - Đang xử lý
- `"shipping"` - Đang giao hàng
- `"completed"` - Hoàn thành
- `"cancelled"` - Đã hủy

---

## 5. ML Diagnostic API

### 5.1. Chẩn Đoán Hư Hỏng Từ Ảnh
**POST** `{{base_url}}/api/ml/diagnose`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body (form-data):**
- `file`: [Chọn file ảnh xe hơi]

**Expected Response (200):**
```json
{
  "damages": [
    {
      "type": "dent",
      "confidence": 0.95,
      "bbox": [100, 150, 200, 250]
    }
  ],
  "parts": [
    {
      "name": "door",
      "confidence": 0.92,
      "bbox": [50, 100, 300, 400]
    }
  ],
  "summary": "Phát hiện 1 vết lõm trên cửa xe",
  "annotated_image": "/uploads/diagnosed_123456.jpg"
}
```

---

## 6. Stats APIs

### 6.1. Lấy Thống Kê Tổng Quan (Admin Only)
**GET** `{{base_url}}/api/stats/overview`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "users": 150,
  "orders": 320,
  "revenue": 450000000,
  "products": 45,
  "topWeek": [
    {
      "id": 1,
      "name": "Cửa sau bên trái",
      "total_sold": 25
    }
  ],
  "topMonth": [...]
}
```

---

### 6.2. Ghi Nhận Traffic
**POST** `{{base_url}}/api/traffic/ping`

**Headers:**
```
Content-Type: application/json
```

**Body:** (Empty)

**Expected Response (200):**
```json
{
  "message": "OK"
}
```

---

### 6.3. Lấy Dữ Liệu Traffic (Admin Only)
**GET** `{{base_url}}/api/stats/traffic`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
[
  {
    "date": "2024-01-01",
    "count": 150
  },
  {
    "date": "2024-01-02",
    "count": 200
  }
]
```

---

## 📝 Test Scenarios

### Scenario 1: User Flow (Khách Hàng)
1. ✅ Register → Save token
2. ✅ Get Products
3. ✅ Create Order (với installation method)
4. ✅ Get My Orders
5. ✅ Receive Order (nếu status = shipping)

### Scenario 2: Admin Flow
1. ✅ Login as Admin
2. ✅ Create Product (với upload ảnh)
3. ✅ Get All Users
4. ✅ Update User Role
5. ✅ Get All Orders
6. ✅ Update Order Status
7. ✅ Get Stats Overview

### Scenario 3: Installation Feature Test
1. ✅ Create Order với `installation.method = "self"` → Total không có phí lắp đặt
2. ✅ Create Order với `installation.method = "home"` → Total +150,000₫
3. ✅ Verify installation_fee trong response
4. ✅ Check address có chứa thời gian lắp đặt

---

## 🔧 Tips & Tricks

### 1. Import Collection vào Postman
Bạn có thể tạo Collection với tất cả endpoints trên và export ra file JSON để chia sẻ.

### 2. Environment Variables
Tạo 2 environments:
- **Development**: `base_url = http://localhost:4000`
- **Production**: `base_url = https://your-domain.com`

### 3. Pre-request Scripts
Thêm vào Collection level:
```javascript
// Auto-refresh token nếu hết hạn
const token = pm.environment.get("token");
if (!token) {
    console.log("No token found. Please login first.");
}
```

### 4. Tests Scripts (Collection Level)
```javascript
// Kiểm tra response time
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

// Kiểm tra status code
pm.test("Status code is successful", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});
```

---

## 🚨 Common Errors

### 401 Unauthorized
- **Nguyên nhân**: Token không hợp lệ hoặc đã hết hạn
- **Giải pháp**: Login lại để lấy token mới

### 403 Forbidden
- **Nguyên nhân**: User không có quyền (cần admin role)
- **Giải pháp**: Đăng nhập với tài khoản admin

### 400 Bad Request
- **Nguyên nhân**: Dữ liệu gửi lên không đúng format
- **Giải pháp**: Kiểm tra lại Body JSON

### 500 Internal Server Error
- **Nguyên nhân**: Lỗi server (database, file system, etc.)
- **Giải pháp**: Kiểm tra logs trong terminal backend

---

## 📚 Tài Liệu Tham Khảo
- Backend Server: `http://localhost:4000`
- Frontend Dev: `http://localhost:5173`
- Database: PostgreSQL (localhost:5432)

**Chúc bạn test thành công! 🎉**
