
# Sử dụng Base Image Node.js v20 (Bookworm - Python 3.11)
FROM node:20-bookworm

# Thiết lập thư mục làm việc
WORKDIR /app

# 1. Cài đặt Python 3, venv và các thư viện hệ thống
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Kiểm tra version
RUN python3 --version

# --- THIẾT LẬP MÔI TRƯỜNG ẢO (VENV) ---
# Tránh lỗi PEP 668 (Externally Managed Environment) trên Debian 12
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy toàn bộ source code vào Docker
COPY . .

# 2. Cài đặt dependency cho Backend (Python)
WORKDIR /app/autoparts-backend

# Giờ pip sẽ cài vào venv nên không cần --break-system-packages
RUN pip install --upgrade pip
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# 3. Cài đặt dependency cho Backend (Node.js)
RUN npm install

# 4. Cài đặt và Build Frontend
WORKDIR /app/autoparts-frontend
RUN npm install
RUN npm run build

# Quay lại folder backend để chạy server
WORKDIR /app/autoparts-backend

# Mở port 4000
EXPOSE 4000

# Lệnh chạy server
CMD ["node", "server.js"]
