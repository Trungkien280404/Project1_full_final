import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createCartTable() {
    try {
        console.log('Creating cart table...');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, product_id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

        console.log('✅ Cart table created successfully');

        // Tạo index để tăng tốc query
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_user_email ON cart(user_email);
    `);

        console.log('✅ Cart indexes created successfully');

    } catch (error) {
        console.error('❌ Error creating cart table:', error);
    } finally {
        await pool.end();
    }
}

createCartTable();
