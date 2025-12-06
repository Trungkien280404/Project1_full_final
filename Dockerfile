
# Sử dụng Base Image có sẵn Python 3.9 (nhẹ)
FROM python:3.9-slim

# Thiết lập biến môi trường để Python không tạo file cache __pycache__
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Cài đặt các công cụ hệ thống cần thiết
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Node.js v18
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && apt-get install -y libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy toàn bộ source code vào Docker
COPY . .

# 1. Cài đặt dependency cho Backend (Python)
WORKDIR /app/autoparts-backend
RUN pip install --no-cache-dir -r requirements.txt
# Nếu ultralytics gặp lỗi thiếu torch CPU, có thể cài riêng torch CPU để giảm size
# RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 2. Cài đặt dependency cho Backend (Node.js)
RUN npm install

# 3. Cài đặt và Build Frontend
WORKDIR /app/autoparts-frontend
RUN npm install
RUN npm run build

# Quay lại folder backend để chạy server
WORKDIR /app/autoparts-backend

# Mở port 4000
EXPOSE 4000

# Lệnh chạy server
CMD ["node", "server.js"]
