// server.js
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import fsOriginal from 'fs'; // Dùng fs thường cho các hàm đồng bộ như existsSync
import path from 'path';
import bcrypt from 'bcryptjs';
const bcryptModule = bcrypt.default || bcrypt;
import pool, { query } from './db.js';
import compression from 'compression';
import helmet from 'helmet';

dotenv.config();

const app = express();
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS configuration - Allow ngrok, localhost, and VS Code Port Forwarding
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost, ngrok, and devtunnels domains
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('ngrok') ||
      origin.includes('ngrok-free.app') ||
      origin.includes('devtunnels.ms') ||
      origin.includes('onrender.com')
    ) {
      return callback(null, true);
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json()); // Vẫn cần cho các API gửi JSON

// --- 1. CẤU HÌNH UPLOAD ẢNH SẢN PHẨM (Lưu vào ổ cứng) ---
const uploadDir = path.join(process.cwd(), 'uploads');
// Tạo thư mục nếu chưa có
if (!fsOriginal.existsSync(uploadDir)) {
  fsOriginal.mkdirSync(uploadDir);
}
// Mở thư mục uploads để frontend có thể xem
app.use('/uploads', express.static(uploadDir));

// --- CẤU HÌNH PHỤC VỤ CÁC FOLDER ẢNH CÓ SẴN (NgoaiThat4Web, etc.) ---
// Debug: In ra cấu trúc thư mục để kiểm tra trên Render Logs
const parentDir = path.join(process.cwd(), '..');
console.log('--- DEBUG DIRECTORY STRUCTURE ---');
console.log('Current CWD:', process.cwd());
console.log('Parent Dir:', parentDir);
try {
  console.log('Files in Parent:', fsOriginal.readdirSync(parentDir));
} catch (e) {
  console.log('Error reading parent dir:', e.message);
}

// Map URL path chính xác theo tên trong DB
// Cấu trúc thực tế: NgoaiThat4Web/images/file.webp
app.use('/uploads/NgoaiThat4Web_images', express.static(path.join(parentDir, 'NgoaiThat4Web', 'images')));
app.use('/uploads/NoiThat4Web_images', express.static(path.join(parentDir, 'NoiThat4Web', 'images')));
app.use('/uploads/ThietBi4Web_images', express.static(path.join(parentDir, 'ThietBi4Web', 'images')));

// Thử thêm map trực tiếp không có _images
app.use('/uploads/NgoaiThat4Web', express.static(path.join(parentDir, 'NgoaiThat4Web', 'images')));
app.use('/uploads/NoiThat4Web', express.static(path.join(parentDir, 'NoiThat4Web', 'images')));
app.use('/uploads/ThietBi4Web', express.static(path.join(parentDir, 'ThietBi4Web', 'images')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Đặt tên file: timestamp-tenfilegoc (xóa khoảng trắng để tránh lỗi URL)
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
  }
})
const uploadProduct = multer({ storage: storage });
// -----------------------------------------------------

// Dữ liệu này có thể giữ lại (để tham khảo)
const PART_LABELS = {
  headlight: 'Đèn pha',
  mirror: 'Gương chiếu hậu',
  windshield: 'Kính chắn gió',
  fog_light: 'Đèn sương mù',
  mudguard: 'Chắn bùn',
};

const resetStore = Object.create(null);
const { PORT = 4000, JWT_SECRET = 'secret' } = process.env;
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

const auth = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Yêu cầu quyền Admin' });
  }
  next();
};

// Helper: Validate email format with strict rules
const isValidEmail = (email) => {
  // Regex chặt chẽ hơn: TLD phải ít nhất 2 ký tự, không cho phép ký tự đặc biệt lạ
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Helper: Kiểm tra typo trong email domain
const checkEmailTypo = (email) => {
  const commonDomains = {
    'gmail.com': [
      'gmaih.com', 'gmaul.com', 'gmial.com', 'gmeil.com', 'gmai.com',
      'gmall.com', 'gmil.com', 'gmaill.com', 'gnail.com', 'gmal.com',
      'gamil.com', 'gmaiil.com', 'gmailo.com'
    ],
    'yahoo.com': ['yaho.com', 'yahooo.com', 'yhoo.com', 'yhaoo.com', 'yahou.com'],
    'outlook.com': ['outlok.com', 'outloo.com', 'outlookk.com', 'outluk.com'],
    'hotmail.com': ['hotmial.com', 'hotmal.com', 'hotmaii.com', 'hotmil.com', 'homail.com'],
  };

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  for (const [correct, typos] of Object.entries(commonDomains)) {
    if (typos.includes(domain)) {
      return `Email có vẻ sai. Bạn có muốn dùng @${correct} thay vì @${domain}?`;
    }
  }

  return null;
};

// Helper: Validate password strength (min 6 chars, 1 uppercase, 1 special char)
const isStrongPassword = (password) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 6;
  return hasUpperCase && hasSpecialChar && isLongEnough;
};

// ===== Auth (CẬP NHẬT: VALIDATION NÂNG CAO) =====
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  // Validation: Email format
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Email không đúng định dạng' });
  }

  // Kiểm tra typo trong domain
  const typoWarning = checkEmailTypo(email);
  if (typoWarning) {
    return res.status(400).json({ message: typoWarning });
  }

  // Validation: Password strength
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: 'Mật khẩu phải có ít nhất 1 chữ in hoa và 1 ký tự đặc biệt (!@#$%...)'
    });
  }

  try {
    const existingUser = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Đăng ký không thành công: Email đã tồn tại' });
    }

    const salt = await bcryptModule.genSalt(10);
    const passwordHash = await bcryptModule.hash(password, salt);
    const sql = 'INSERT INTO users (name, email, role, password) VALUES ($1, $2, $3, $4) RETURNING email, role, name';
    const result = await query(sql, [name || email.split('@')[0], email, 'user', passwordHash]);
    const u = result.rows[0];
    const token = signToken({ email: u.email, role: u.role, name: u.name });
    res.status(201).json({ token, user: { email: u.email, role: u.role, name: u.name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  // Validation: Email format
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Email không đúng định dạng' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Vui lòng nhập mật khẩu' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const u = result.rows[0];

    if (!u || !(await bcryptModule.compare(password, u.password))) {
      return res.status(401).json({ message: 'Đăng nhập không thành công: Sai email hoặc mật khẩu' });
    }

    const token = signToken({ email: u.email, role: u.role, name: u.name });
    res.json({ token, user: { email: u.email, role: u.role, name: u.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// ===== Forgot Password Flow =====

// POST /api/auth/forgot - Gửi mã xác minh
app.post('/api/auth/forgot', async (req, res) => {
  const { email } = req.body || {};

  // Validation: Email format
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Email không đúng định dạng' });
  }

  try {
    // Kiểm tra email có tồn tại không
    const result = await query('SELECT email FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.'
      });
    }

    // Tạo mã xác minh 6 số
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // Hết hạn sau 15 phút

    // Lưu vào resetStore
    resetStore[email] = { code, expiresAt };

    console.log(`[Reset Password] Code for ${email}: ${code} (expires in 15 min)`);

    res.json({
      ok: true,
      message: `Mã xác minh đã được tạo: ${code} (Trong môi trường thực tế, mã này sẽ được gửi qua email)`
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// POST /api/auth/verify-reset - Xác minh mã
app.post('/api/auth/verify-reset', (req, res) => {
  const { email, code } = req.body || {};

  if (!email || !code) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mã xác minh' });
  }

  const stored = resetStore[email];

  if (!stored) {
    return res.status(400).json({ message: 'Không tìm thấy yêu cầu đặt lại mật khẩu cho email này' });
  }

  if (Date.now() > stored.expiresAt) {
    delete resetStore[email];
    return res.status(400).json({ message: 'Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới.' });
  }

  if (stored.code !== code) {
    return res.status(400).json({ message: 'Mã xác minh không đúng. Vui lòng kiểm tra lại.' });
  }

  res.json({ ok: true, message: 'Mã xác minh hợp lệ' });
});

// POST /api/auth/reset - Đặt lại mật khẩu
app.post('/api/auth/reset', async (req, res) => {
  const { email, code, newPassword } = req.body || {};

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  // Kiểm tra mật khẩu mới
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      message: 'Mật khẩu phải có ít nhất 1 chữ in hoa và 1 ký tự đặc biệt (!@#$%...)'
    });
  }

  const stored = resetStore[email];

  if (!stored) {
    return res.status(400).json({ message: 'Không tìm thấy yêu cầu đặt lại mật khẩu' });
  }

  if (Date.now() > stored.expiresAt) {
    delete resetStore[email];
    return res.status(400).json({ message: 'Mã xác minh đã hết hạn' });
  }

  if (stored.code !== code) {
    return res.status(400).json({ message: 'Mã xác minh không đúng' });
  }

  try {
    // Cập nhật mật khẩu mới
    const salt = await bcryptModule.genSalt(10);
    const passwordHash = await bcryptModule.hash(newPassword, salt);

    const result = await query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING email, role, name',
      [passwordHash, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Xóa mã đã sử dụng
    delete resetStore[email];

    const u = result.rows[0];
    const token = signToken({ email: u.email, role: u.role, name: u.name });

    res.json({
      ok: true,
      token,
      user: { email: u.email, role: u.role, name: u.name },
      message: 'Đổi mật khẩu thành công'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});


// ===== Products (ĐÃ CẬP NHẬT: BỎ BRAND, THÊM UPLOAD) =====

app.get('/api/products', async (req, res) => {
  try {
    // Bỏ cột brand khỏi query (nếu bảng đã xóa cột) hoặc select * cũng được nếu cột vẫn còn
    const result = await query('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: 'Lỗi máy chủ' }); }
});

// Migration: Thêm cột brand, description, specifications nếu chưa có
(async () => {
  try {
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS specifications JSONB;
    `);
    console.log('[DB] Checked/Added brand, description, specifications columns to products table.');
  } catch (e) {
    console.error('[DB] Error checking columns:', e);
  }
})();

// GET ALL PRODUCTS (Public - không cần auth)
// GET ALL PRODUCTS (Public - không cần auth)
app.get('/api/products', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tải sản phẩm' });
  }
});

// GET SINGLE PRODUCT
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// CREATE PRODUCT (Cập nhật với brand, description, specifications)
app.post('/api/products', auth, uploadProduct.single('image'), async (req, res) => {
  // Lấy dữ liệu từ form-data
  const { name, part, brand, price, stock, description, specifications } = req.body;

  // Chuyển đổi kiểu dữ liệu
  const priceNum = Number(price);
  const stockNum = Number(stock);

  // Tạo URL ảnh (nếu có file)
  let imgUrl = '';
  if (req.file) {
    // Sửa lỗi đường dẫn ảnh trên Windows (thay \ bằng /)
    imgUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  } else {
    imgUrl = req.body.image_path || '';
  }

  // Validate: Yêu cầu name, part, brand, price
  if (!name || !part || !brand || isNaN(priceNum)) {
    console.log("Dữ liệu nhận được:", req.body);
    return res.status(400).json({ message: 'Thiếu thông tin sản phẩm (Tên, Loại, Thương hiệu, Giá)' });
  }

  try {
    // Câu lệnh SQL: Thêm cột brand, description, specifications, image_path
    const sql = `
      INSERT INTO products (name, part, brand, price, stock, image_path, description, specifications) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const values = [
      name,
      part,
      brand,
      priceNum,
      isNaN(stockNum) ? 0 : stockNum,
      imgUrl,
      description || '',
      specifications || '{}'
    ];

    const result = await query(sql, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo sản phẩm' });
  }
});

// UPDATE PRODUCT (Cập nhật với brand, description, specifications)
app.put('/api/products/:id', auth, uploadProduct.single('image'), async (req, res) => {
  const { id } = req.params;
  try {
    const currentResult = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    const p = currentResult.rows[0];

    const { name, part, brand, price, stock, description, specifications } = req.body;

    let newImg = p.image_path;
    if (req.file) {
      newImg = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    // Giữ nguyên giá trị cũ nếu không gửi mới
    const newName = name !== undefined ? name : p.name;
    const newPart = part !== undefined ? part : p.part;
    const newBrand = brand !== undefined ? brand : p.brand;
    const newPrice = price !== undefined ? Number(price) : p.price;
    const newStock = stock !== undefined ? Number(stock) : p.stock;
    const newDesc = description !== undefined ? description : p.description;
    const newSpecs = specifications !== undefined ? specifications : p.specifications;

    // SQL Update: Thêm cột brand, description, specifications, image_path
    const sql = `
      UPDATE products 
      SET name = $1, part = $2, brand = $3, price = $4, stock = $5, image_path = $6, description = $7, specifications = $8
      WHERE id = $9 
      RETURNING *
    `;
    const values = [newName, newPart, newBrand, newPrice, newStock, newImg, newDesc, newSpecs, id];

    const result = await query(sql, values);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật sản phẩm' });
  }
});
app.delete('/api/products/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ ok: true, removed: result.rows[0] });
  } catch (err) { res.status(500).json({ message: 'Lỗi máy chủ' }); }
});


// ===== Orders (GIỮ NGUYÊN LOGIC QUẢN LÝ ĐƠN HÀNG MỚI) =====

// Migration: Thêm cột installation_method và installation_fee nếu chưa có
(async () => {
  try {
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS installation_method VARCHAR(50) DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS installation_fee INTEGER DEFAULT 0;
`);
    console.log('[DB] Checked/Added installation columns to orders table.');
  } catch (e) {
    console.error('[DB] Error checking installation columns:', e);
  }
})();

app.post('/api/orders', async (req, res) => {
  const { items, info, method, installation } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Giỏ hàng trống' });

  // Validate installation
  if (!installation || !installation.method) {
    return res.status(400).json({ message: 'Vui lòng chọn phương thức lắp đặt' });
  }

  // Validate customer info for guest checkout
  if (!info || !info.name || !info.phone || !info.address) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin giao hàng' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productIds = items.map(it => it.pid);
    const productResult = await client.query(`SELECT id, name, price, stock FROM products WHERE id = ANY($1::int[])`, [productIds]);
    let totalProductPrice = 0;
    const productsMap = new Map(productResult.rows.map(p => [p.id, p]));

    for (const it of items) {
      const p = productsMap.get(Number(it.pid));
      if (!p) throw new Error(`SP lỗi: ${it.pid}`);
      if (p.stock < it.qty) throw new Error(`Hết hàng: ${p.name}`);
      totalProductPrice += p.price * it.qty;
    }

    // Tính phí lắp đặt
    let installFee = 0;
    if (installation.method === 'home') {
      installFee = 150000; // Phí cố định hoặc logic tùy chỉnh
    }

    const finalTotal = totalProductPrice + installFee;

    // Xử lý địa chỉ với thông tin lắp đặt
    let finalAddress = info.address || '';
    if (installation.method === 'home' && installation.time) {
      finalAddress += ` (Lắp đặt lúc: ${installation.time})`;
    }

    // Check if user is logged in (optional)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userResult = await client.query('SELECT id FROM users WHERE email = $1', [decoded.email]);
        if (userResult.rows.length > 0) {
          userId = userResult.rows[0].id;
        }
      } catch (err) {
        // Token invalid or expired, proceed as guest
      }
    }

    const orderSql = `
      INSERT INTO orders(
        user_id, total, customer_name, customer_phone, customer_address, payment_method, status,
        installation_method, installation_fee
      )
      VALUES($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
      RETURNING id, createdat
    `;

    const values = [
      userId, // null for guest, user_id for logged-in users
      finalTotal,
      info.name || '',
      info.phone || '',
      finalAddress,
      method || 'cod',
      installation.method,
      installFee
    ];

    const orderResult = await client.query(orderSql, values);
    const orderId = orderResult.rows[0].id;
    const orderCreatedAt = orderResult.rows[0].createdat;

    for (const it of items) {
      await client.query('INSERT INTO order_items (order_id, product_id, qty) VALUES ($1, $2, $3)', [orderId, it.pid, it.qty]);
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [it.qty, it.pid]);
    }
    await client.query('COMMIT');
    res.status(201).json({ id: orderId, total: finalTotal, items, createdAt: orderCreatedAt });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', err);
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

// API lấy danh sách đơn hàng cho Admin (đã có đủ thông tin)
app.get('/api/admin/orders', auth, adminAuth, async (req, res) => {
  try {
    const sql = `
      SELECT o.*,
      (SELECT json_agg(json_build_object(
        'qty', oi.qty,
        'pid', p.id,
        'product_name', p.name,
        'image_path', p.image_path,
        'price', p.price
      )) 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = o.id) as items 
      FROM orders o 
      ORDER BY o.createdat DESC
    `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Lỗi máy chủ' }); }
});

app.put('/api/admin/orders/:id', auth, adminAuth, async (req, res) => {
  const { status } = req.body;
  await query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ ok: true });
});


// --- ADDRESS MANAGEMENT API ---
app.get('/api/user/addresses', auth, async (req, res) => {
  try {
    // Get all addresses for user, order by default first, then newest
    const result = await query(
      'SELECT * FROM user_addresses WHERE user_id = (SELECT id FROM users WHERE email = $1) ORDER BY is_default DESC, id DESC',
      [req.user.email]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching addresses' });
  }
});

app.post('/api/user/addresses', auth, async (req, res) => {
  try {
    const { name, phone, address, is_default } = req.body;
    const user = await query('SELECT id FROM users WHERE email = $1', [req.user.email]);
    if (user.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const userId = user.rows[0].id;

    // If new address is default, unset other defaults
    if (is_default) {
      await query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    // Insert new address
    const result = await query(
      'INSERT INTO user_addresses (user_id, name, phone, address, is_default) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, phone, address, is_default || false]
    );

    // If this is the ONLY address, make it default automatically
    const count = await query('SELECT COUNT(*) FROM user_addresses WHERE user_id = $1', [userId]);
    if (parseInt(count.rows[0].count) === 1) {
      await query('UPDATE user_addresses SET is_default = true WHERE id = $1', [result.rows[0].id]);
      result.rows[0].is_default = true;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving address' });
  }
});

app.delete('/api/user/addresses/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
      [id, req.user.email]
    );
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting address' });
  }
});

// Get My Orders
app.get('/api/orders/my', auth, async (req, res) => {
  const sql = `SELECT o.*, (SELECT json_agg(json_build_object('qty', oi.qty, 'pid', p.id, 'product', p)) FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items FROM orders o WHERE o.user_id = (SELECT id FROM users WHERE email = $1) ORDER BY o.createdat DESC`;
  const result = await query(sql, [req.user.email]);
  res.json(result.rows);
});

app.put('/api/orders/:id/receive', auth, async (req, res) => {
  const { id } = req.params;
  try {
    // Chỉ cho phép xác nhận khi đơn hàng đang ở trạng thái 'shipping' và thuộc về user này
    const sql = `
            UPDATE orders 
            SET status = 'completed' 
            WHERE id = $1 
              AND user_id = (SELECT id FROM users WHERE email = $2) 
              AND status = 'shipping'
RETURNING *
  `;
    const result = await query(sql, [id, req.user.email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Không thể xác nhận (Đơn không tồn tại, không phải của bạn, hoặc chưa được giao)' });
    }

    res.json({ ok: true, order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===== Stats & Admin Users (GIỮ NGUYÊN) =====
app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
  const result = await query('SELECT id, name, email, role FROM users ORDER BY id ASC');
  res.json(result.rows);
});
app.put('/api/admin/users/:id', auth, adminAuth, async (req, res) => {
  const { role } = req.body;
  console.log(`[Admin] Updating user ${req.params.id} role to ${role} `);
  if (!['admin', 'user', 'staff'].includes(role)) return res.status(400).json({ message: 'Role invalid' });

  try {
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Lỗi cập nhật người dùng' });
  }
});

app.delete('/api/admin/users/:id', auth, adminAuth, async (req, res) => {
  const userId = req.params.id;
  console.log(`[Admin] Deleting user ${userId} `);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Xóa các item trong đơn hàng của user này
    // orders.user_id là INTEGER (khóa ngoại trỏ tới users.id)
    // Ta dùng subquery để xóa order_items thuộc về các đơn hàng của user này
    await client.query(`
      DELETE FROM order_items 
      WHERE order_id IN(SELECT id FROM orders WHERE user_id = $1)
  `, [userId]);

    // 2. Xóa orders của user này
    await client.query('DELETE FROM orders WHERE user_id = $1', [userId]);

    // 3. Xóa user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Lỗi xóa người dùng: ' + err.message });
  } finally {
    client.release();
  }
});

// Stats (Rút gọn, logic giống cũ)
// Stats
app.get('/api/stats/overview', auth, async (req, res) => {
  try {
    const userRes = await query('SELECT COUNT(*) FROM users');
    const orderRes = await query('SELECT COUNT(*) FROM orders');
    const revenueRes = await query('SELECT SUM(total) FROM orders');
    const productRes = await query('SELECT COUNT(*) FROM products');

    // Top week
    const topWeekSql = `
            SELECT p.name, p.part as brand, SUM(oi.qty) as qty
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.createdAt >= NOW() - INTERVAL '7 days'
            GROUP BY p.id, p.name, p.part
            ORDER BY qty DESC
            LIMIT 5
  `;
    const topWeekRes = await query(topWeekSql);

    // Top month
    const topMonthSql = `
            SELECT p.name, p.part as brand, SUM(oi.qty) as qty
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.createdAt >= NOW() - INTERVAL '30 days'
            GROUP BY p.id, p.name, p.part
            ORDER BY qty DESC
            LIMIT 5
  `;
    const topMonthRes = await query(topMonthSql);

    res.json({
      users: parseInt(userRes.rows[0].count),
      orders: parseInt(orderRes.rows[0].count),
      revenue: parseInt(revenueRes.rows[0].sum || 0),
      products: parseInt(productRes.rows[0].count),
      topWeek: topWeekRes.rows,
      topMonth: topMonthRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy thống kê' });
  }
});

app.get('/api/stats/traffic', auth, async (req, res) => {
  try {
    // Lấy số lượng đơn hàng theo ngày trong 30 ngày qua
    const sql = `
            SELECT to_char(createdAt, 'YYYY-MM-DD') as date, COUNT(*) as count
            FROM orders
            WHERE createdAt >= NOW() - INTERVAL '30 days'
            GROUP BY date
            ORDER BY date ASC
        `;
    const result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy traffic' });
  }
});
app.post('/api/traffic/ping', async (req, res) => { res.json({ ok: true }); });


// ===== ML Diagnose (GIỮ NGUYÊN - TÍCH HỢP PYTHON) =====
const uploadMem = multer({ storage: multer.memoryStorage() });

app.post('/api/ml/diagnose', uploadMem.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Thiếu file ảnh' });
  }
  const fileBuffer = req.file.buffer;
  const tempDir = path.join(process.cwd(), 'temp_uploads');
  const tempFilePath = path.join(tempDir, `${Date.now()}_${req.file.originalname}`);

  try {
    if (!fsOriginal.existsSync(tempDir)) fsOriginal.mkdirSync(tempDir);
    await fs.writeFile(tempFilePath, fileBuffer);

    console.log('[ML] Starting detection with:', tempFilePath);

    // Thử dùng python3 trước (cho Linux/Render), sau đó mới thử python (Windows)
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    // Truyền biến môi trường rõ ràng cho Python
    const env = {
      ...process.env,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GOOGLE_API_KEY: process.env.GEMINI_API_KEY // Thêm backup key này vì thư viện Google thường tìm nó
    };

    const pythonProcess = spawn(pythonCmd, ['detector.py', tempFilePath], { env });
    let resultData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => { resultData += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`[Python] Exit code: ${code}`);
          console.error(`[Python] stderr: ${errorData}`);
          // Nếu lỗi do thiếu thư viện (ModuleNotFoundError) hoặc không có python
          return reject(new Error('AI Server chưa được cài đặt đầy đủ thư viện (Torch, Pillow).'));
        }
        resolve();
      });
      pythonProcess.on('error', (err) => {
        console.error('[Python] Process error:', err);
        if (err.code === 'ENOENT') {
          reject(new Error('Server không tìm thấy Python. Tính năng này chỉ hoạt động trên máy có Python.'));
        } else {
          reject(err);
        }
      });
    });

    console.log('[ML] Python output length:', resultData.length);
    const lines = resultData.trim().split('\n');
    const jsonLine = lines[lines.length - 1];

    // Kiểm tra xem output có phải JSON không
    try {
      const jsonResult = JSON.parse(jsonLine);
      res.json(jsonResult);
    } catch (e) {
      throw new Error('Kết quả từ AI không hợp lệ: ' + jsonLine);
    }

  } catch (error) {
    console.error('Error ML:', error.message);
    // Trả về 200 OK nhưng kèm thông báo lỗi để Frontend hiển thị đẹp thay vì popup 500
    res.json({
      detected: false,
      message: 'Tính năng AI chưa khả dụng trên Cloud Server này (Thiếu GPU/Python Libs).',
      products: [] // Trả về mảng rỗng để không crash UI
    });
  } finally {
    try { await fs.unlink(tempFilePath); } catch (e) { }
  }
});

// ========== SERVE FRONTEND BUILD (PRODUCTION) ==========


import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CHỈNH LẠI PATH CHO FRONTEND =====
const frontendPath = path.join(__dirname, "..", "autoparts-frontend", "dist");

console.log("Serving frontend from:", frontendPath);  // Debug

app.use(express.static(frontendPath, {
  maxAge: '1d',
  etag: false
}));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(frontendPath, "index.html"));
});


// =====// --- CONSULTATIONS API ---
app.post('/api/consultations', async (req, res) => {
  try {
    const { product_id, name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'Vui lòng nhập tên và số điện thoại.' });
    }

    await query(
      'INSERT INTO consultations (product_id, name, phone) VALUES ($1, $2, $3)',
      [product_id || null, name, phone]
    );

    res.json({ message: 'Gửi yêu cầu thành công!' });
  } catch (err) {
    console.error('Consultation error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- REVIEWS API ---
// Lấy danh sách review của 1 sản phẩm
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await query(
      'SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC',
      [productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ message: 'Lỗi lấy đánh giá' });
  }
});

// Gửi review mới
app.post('/api/reviews', auth, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user.id;
    const user_name = req.user.name || 'Người dùng'; // Lấy tên từ token

    if (!rating || !product_id) {
      return res.status(400).json({ message: 'Thiếu thông tin đánh giá.' });
    }

    const result = await query(
      'INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_id, user_id, user_name, rating, comment]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Post review error:', err);
    res.status(500).json({ message: 'Lỗi gửi đánh giá' });
  }
});

// --- ADMIN APIs ---

// 1. Get all reviews (Admin)
app.get('/api/admin/reviews', async (req, res) => {
  try {
    const result = await query(`
        SELECT r.*, p.name as product_name, p.image_path as product_image 
        FROM reviews r
        JOIN products p ON r.product_id = p.id
        ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// 2. Get all consultations (Admin)
app.get('/api/admin/consultations', async (req, res) => {
  try {
    const result = await query(`
        SELECT c.*, p.name as product_name, p.image_path 
        FROM consultations c
        LEFT JOIN products p ON c.product_id = p.id
        ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching consultations' });
  }
});

// Update consultation status (Admin)
app.put('/api/admin/consultations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'pending', 'processed', 'cancelled'

    await query('UPDATE consultations SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Updated status successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating consultation' });
  }
});

// 3. Import Logs & Add Stock (Admin)
app.get('/api/admin/imports', async (req, res) => {
  try {
    const result = await query(`
            SELECT i.*, p.name as product_name 
            FROM import_logs i
            JOIN products p ON i.product_id = p.id
            ORDER BY i.created_at DESC
        `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching imports' });
  }
});

app.post('/api/admin/imports', async (req, res) => {
  try {
    const { product_id, quantity, note, supplier } = req.body;
    // Transaction to update stock and log import
    await query('BEGIN');
    await query('INSERT INTO import_logs (product_id, quantity, note, supplier) VALUES ($1, $2, $3, $4)', [product_id, quantity, note, supplier || '']);
    await query('UPDATE products SET stock = stock + $1 WHERE id = $2', [quantity, product_id]);
    await query('COMMIT');
    res.json({ message: 'Import successful' });
  } catch (err) {
    await query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Import failed' });
  }
});

// ===== Cart Management (Giỏ hàng lưu theo tài khoản) =====

// GET /api/cart - Lấy giỏ hàng của user
app.get('/api/cart', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id, c.product_id, c.quantity, c.created_at,
             p.name, p.price, p.image_path, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_email = $1
      ORDER BY c.created_at DESC
    `, [req.user.email]);

    res.json(result.rows);
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ message: 'Lỗi khi tải giỏ hàng' });
  }
});

// POST /api/cart - Thêm sản phẩm vào giỏ hàng
app.post('/api/cart', auth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || quantity < 1) {
      return res.status(400).json({ message: 'Thông tin không hợp lệ' });
    }

    // Kiểm tra sản phẩm có tồn tại không
    const productCheck = await query('SELECT id, stock FROM products WHERE id = $1', [product_id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra đã có trong giỏ hàng chưa
    const existing = await query(
      'SELECT id, quantity FROM cart WHERE user_email = $1 AND product_id = $2',
      [req.user.email, product_id]
    );

    if (existing.rows.length > 0) {
      // Cập nhật số lượng
      const newQuantity = existing.rows[0].quantity + quantity;
      await query(
        'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, existing.rows[0].id]
      );
    } else {
      // Thêm mới
      await query(
        'INSERT INTO cart (user_email, product_id, quantity) VALUES ($1, $2, $3)',
        [req.user.email, product_id, quantity]
      );
    }

    res.json({ message: 'Đã thêm vào giỏ hàng' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ message: 'Lỗi khi thêm vào giỏ hàng' });
  }
});

// PUT /api/cart/:id - Cập nhật số lượng sản phẩm trong giỏ
app.put('/api/cart/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
    }

    // Kiểm tra quyền sở hữu
    const check = await query('SELECT id FROM cart WHERE id = $1 AND user_email = $2', [id, req.user.email]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    await query(
      'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantity, id]
    );

    res.json({ message: 'Đã cập nhật số lượng' });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật giỏ hàng' });
  }
});

// DELETE /api/cart/:id - Xóa sản phẩm khỏi giỏ hàng
app.delete('/api/cart/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const check = await query('SELECT id FROM cart WHERE id = $1 AND user_email = $2', [id, req.user.email]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    await query('DELETE FROM cart WHERE id = $1', [id]);

    res.json({ message: 'Đã xóa khỏi giỏ hàng' });
  } catch (err) {
    console.error('Delete cart error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa khỏi giỏ hàng' });
  }
});

// DELETE /api/cart - Xóa toàn bộ giỏ hàng
app.delete('/api/cart', auth, async (req, res) => {
  try {
    await query('DELETE FROM cart WHERE user_email = $1', [req.user.email]);
    res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa giỏ hàng' });
  }
});

// ===== Serve Frontend (Production) =====
const frontendDistPath = path.join(process.cwd(), '..', 'autoparts-frontend', 'dist');
console.log('Serving frontend from:', frontendDistPath);

// Serve static assets (JS, CSS, images) with cache control
app.use(express.static(frontendDistPath, {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true
}));

// SPA fallback - Serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Không serve index.html cho API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ message: 'Not found' });
  }

  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});