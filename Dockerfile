
# Sử dụng Base Image Node.js v18 (Bullseye là phiên bản Linux ổn định)
FROM node:18-bullseye

# Thiết lập thư mục làm việc
WORKDIR /app

# 1. Cài đặt Python 3, pip và các thư viện hệ thống cho OpenCV (libgl1)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Kiểm tra version để chắc chắn
RUN python3 --version && pip3 --version

# Tạo symlink python -> python3 (để lệnh 'python' chạy được)
RUN ln -s /usr/bin/python3 /usr/bin/python

# Copy toàn bộ source code
COPY . .

# 2. Cài đặt dependency cho Backend (Python)
WORKDIR /app/autoparts-backend
# Lưu ý: Cài các thư viện nặng như torch có thể mất thời gian
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

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
