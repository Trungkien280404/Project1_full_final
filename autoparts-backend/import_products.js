import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..'); // d:/Code/autoparts_full
const BACKEND_UPLOADS_DIR = path.join(__dirname, 'uploads');

const FOLDERS = [
    { name: 'NgoaiThat4Web', part: 'Ngoại Thất' },
    { name: 'NoiThat4Web', part: 'Nội Thất' },
    { name: 'ThietBi4Web', part: 'Thiết Bị' }
];

async function importProducts() {
    try {
        console.log('Starting import...');

        // Ensure uploads directory exists
        if (!fs.existsSync(BACKEND_UPLOADS_DIR)) {
            fs.mkdirSync(BACKEND_UPLOADS_DIR);
        }

        for (const folder of FOLDERS) {
            const folderPath = path.join(ROOT_DIR, folder.name);
            const jsonPath = path.join(folderPath, 'products_data_cleaned.json');

            if (!fs.existsSync(jsonPath)) {
                console.warn(`Skipping ${folder.name}: JSON file not found at ${jsonPath}`);
                continue;
            }

            console.log(`Processing ${folder.name}...`);
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // Create specific upload folder for this category to avoid name collisions
            const targetImgDir = path.join(BACKEND_UPLOADS_DIR, `${folder.name}_images`);
            if (!fs.existsSync(targetImgDir)) {
                fs.mkdirSync(targetImgDir, { recursive: true });
            }

            for (const item of data) {
                const { title, price, car_model, main_image_path, description_html, specifications } = item;

                // Handle Image
                let dbImagePath = '';
                if (main_image_path) {
                    const srcImgPath = path.join(folderPath, main_image_path); // e.g., NgoaiThat4Web/images/file.webp
                    const fileName = path.basename(main_image_path);
                    const destImgPath = path.join(targetImgDir, fileName);

                    if (fs.existsSync(srcImgPath)) {
                        fs.copyFileSync(srcImgPath, destImgPath);
                        // Path relative to backend server root (or accessible via static middleware)
                        // server.js serves 'uploads' at '/uploads'
                        // So we need 'uploads/NgoaiThat4Web_images/file.webp'
                        dbImagePath = `uploads/${folder.name}_images/${fileName}`;
                    } else {
                        // console.warn(`Image not found: ${srcImgPath}`);
                    }
                }

                // Check if product exists
                const existing = await pool.query('SELECT id FROM products WHERE name = $1', [title]);
                if (existing.rows.length > 0) {
                    // console.log(`Skipping ${title}: already exists`);
                    continue;
                }

                // Insert into DB
                const queryText = `
          INSERT INTO products (name, part, brand, price, stock, image_path, description, specifications)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

                const values = [
                    title,
                    folder.part,
                    car_model || 'Other',
                    Number(price) || 0,
                    100, // Default stock
                    dbImagePath,
                    description_html,
                    JSON.stringify(specifications)
                ];

                try {
                    await pool.query(queryText, values);
                } catch (err) {
                    console.error(`Error inserting ${title}:`, err.message);
                }
            }
            console.log(`Finished ${folder.name}`);
        }

        console.log('Import completed successfully.');
    } catch (err) {
        console.error('Import failed:', err);
    } finally {
        await pool.end();
    }
}

importProducts();
