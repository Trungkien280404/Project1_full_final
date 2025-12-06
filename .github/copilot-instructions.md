<!-- Auto-generated guidance for AI coding agents in this repository -->
# Guidance for AI coding agents working on AutoParts

This repository is a React + Node.js + Python (YOLO/Gemini) monorepo. Be concise and follow the project-specific conventions below.

1) Big picture
- **Frontend**: `autoparts-frontend/` (Vite + React + Tailwind). Entry: `src/App.jsx`. API accessor: `src/api.js` which derives `BASE` from `VITE_API_URL` or the current host (dev uses port 4000). File uploads use `FormData` (field name `file` for ML and `image` for products).
- **Backend**: `autoparts-backend/` (Node.js + Express). Main file: `server.js`. DB helper: `db.js` (exports `query` + default `pool`). Server serves the frontend build from `autoparts-frontend/dist` in production.
- **AI**: Python scripts in `autoparts-backend/` (notably `detector.py`) use Ultralytics YOLO and Google Gemini. YOLO model files are in `autoparts-backend/model/` (`trained.pt`, `best.pt`). The backend invokes `detector.py` via `child_process.spawn('python', ['detector.py', <path>])` and expects a JSON object on the last stdout line.

2) Critical developer workflows & commands
- Backend (development): `cd autoparts-backend && npm install && npm run dev` (script uses `node server.js`). Note: there is no `start` script in `autoparts-backend/package.json` — do not assume `npm start` works unless you add it.
- Frontend (dev): `cd autoparts-frontend && npm install && npm run dev` (Vite). Build: `npm run build` produces `dist/` which backend serves in production.
- Python (AI): create a Python 3.10+ venv and install dependencies: `pip install ultralytics opencv-python google-generativeai python-dotenv`.
- Env vars: backend `.env` should contain `GEMINI_API_KEY` (used by `detector.py`), `DATABASE_URL`, `JWT_SECRET`, `PORT`.

3) Integration contracts and important patterns
- ML endpoint: `POST /api/ml/diagnose` accepts multipart `file` (single image). Backend writes the file to `temp_uploads/`, spawns `python detector.py <path>`, collects stdout/stderr, and parses **the last line** as JSON. Keep detector output stable: always print a single JSON object on the last stdout line.
- Detector contract: `detector.py` prints JSON to stdout with fields: `num_detections`, `visual_output_base64` (PNG base64), `brand`, `model`, `parts` (array). Server code strips logs and parses the last JSON line — do not print other JSON-like lines earlier.
- File uploads: backend uses `multer` and saves product images to `uploads/`. The server serves `/uploads` statically. Frontend uses `FormData` and must NOT set the `Content-Type` header manually (see `jpostMultipart` in `autoparts-frontend/src/api.js`).
- Auth: JWT stored in localStorage under `autoparts_token`; frontend also stores `autoparts_session` (user info). `server.js` reads `Authorization: Bearer <token>` and `auth` middleware sets `req.user`.
- DB: `db.js` uses `process.env.DATABASE_URL`. SQL is executed via `query(text, params)` and transactions use `pool.connect()` + `client.query('BEGIN')`/`COMMIT`/`ROLLBACK`.

4) Project-specific conventions to follow when editing
- Keep `server.js` route structure and naming (`/api/*`, `/api/admin/*`). Admin checks rely on `req.user.role === 'admin'`.
- ML-related changes must preserve the spawn contract and JSON output. If you change the Python output format, update `server.js` parsing accordingly (it takes the last stdout line).
- When adding new API endpoints that accept files, follow the upload pattern: use multer, write to `temp_uploads` for ML, and remove temp files after processing.
- Frontend API helpers: use `Api` functions in `autoparts-frontend/src/api.js`; prefer `jpostMultipart` / `jputMultipart` for file uploads.

5) Debugging tips & pitfalls seen in this repo
- Common error: running `npm start` in `autoparts-backend` fails because `package.json` only defines `dev`. Use `npm run dev` or add a `start` script.
- Python must be available in PATH as `python`. On Windows ensure the chosen environment exposes `python` (PowerShell may require activating venv or using full path).
- YOLO prints logs; server expects the final line to be JSON. Avoid printing extra JSON-like lines from Python helper functions.
- When testing ML locally, run `python detector.py path/to/image.jpg` — the script prints a JSON object. Keep this behavior when editing.

6) Files to check for context when making changes
- `autoparts-backend/server.js` — main API and ML integration logic (auth, products, orders, ML).  
- `autoparts-backend/detector.py` — ML inference script (Gemini + YOLO).  
- `autoparts-backend/db.js` — DB pool helper and exported `query`.  
- `autoparts-backend/package.json` — confirm npm scripts.  
- `autoparts-frontend/src/api.js` — API client conventions & BASE derivation logic.  
- `autoparts-frontend/src/components/Diagnose.jsx` — example of consuming ML output and mapping to products.

7) Example commands you can use during development
```
# Backend dev (in PowerShell):
cd autoparts-backend; npm install; npm run dev

# Frontend dev:
cd autoparts-frontend; npm install; npm run dev

# Run detector locally (Python venv activated):
python detector.py ./path/to/test.jpg
```

If any section is unclear or you'd like more detail about tests, CI, or contributor flow, tell me which area to expand. I'll iterate on this file accordingly.
