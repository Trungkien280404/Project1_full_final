
import pg from 'pg';
const { Pool } = pg;

// Connection string từ Render (User cung cấp)
// Lưu ý: Cần thêm ?ssl=true để kết nối an toàn với Render từ bên ngoài
const connectionString = 'postgresql://autoparts_db_dvcr_user:4nW9mE9acKRKFwN6wOAgIlFoXDJAWoQl@dpg-d4q026vdiees7390ldog-a.virginia-postgres.render.com/autoparts_db_dvcr?ssl=true';

const pool = new Pool({ connectionString });

const schemaSql = `
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  part TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  image_path TEXT,
  description TEXT,
  stock INTEGER DEFAULT 0,
  brand TEXT,
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER, -- Có thể null cho khách vãng lai
  total BIGINT,
  status TEXT DEFAULT 'pending',
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method TEXT DEFAULT 'cod',
  installation_method TEXT,
  installation_fee INTEGER DEFAULT 0
);

-- 4. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  qty INTEGER DEFAULT 1
);

-- 5. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  response TEXT,
  status TEXT DEFAULT 'pending', -- pending, answered
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Import Logs Table
CREATE TABLE IF NOT EXISTS import_logs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  qty INTEGER,
  cost_price INTEGER,
  import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  supplier TEXT
);

-- 8. User Addresses Table
CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Indexes (Tối ưu hóa tìm kiếm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_part ON products(part);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_id_desc ON products(id DESC);
`;

const seedAdminSql = `
-- Tạo tài khoản Admin mặc định nếu chưa có
-- Pass: 123456 (Hash mẫu)
INSERT INTO users (email, password, role)
VALUES ('admin@gmail.com', '$2y$10$Xk.cQ.Zk.7k.Xk.cQ.Zk.7k.Xk.cQ.Zk.7k.Xk.cQ.Zk.7k.Xk.cQ', 'admin')
ON CONFLICT (email) DO NOTHING;
`;

async function migrate() {
    try {
        console.log("🚀 Đang kết nối tới Render Database...");

        console.log("🛠️  Đang tạo bảng (Tables)...");
        await pool.query(schemaSql);

        console.log("👤 Đang tạo Admin mặc định...");
        await pool.query(seedAdminSql);

        console.log("✅ Cài đặt Database thành công!");
    } catch (err) {
        console.error("❌ Lỗi:", err);
    } finally {
        pool.end();
    }
}

migrate();
