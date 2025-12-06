import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Thêm các host/máy chủ được phép vào đây
    allowedHosts: [
      'unsensibly-nonpensionable-lizbeth.ngrok-free.dev', // <-- Tên host ngrok của bạn
      // 'localhost', // Mặc định thường đã có
      // '127.0.0.1',
      // Thêm các hosts khác nếu cần
    ],
  },
});

