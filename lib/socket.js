import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// Khởi tạo io
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: false
  }
});

// Map để lưu online user: userId -> socketId
const userSocketMap = new Map();

// Hàm lấy socketId theo userId (dùng ở controller/service khác)
export function getReceiverSocketId(userId) {
  return userSocketMap.get(userId);
}

// Xử lý sự kiện kết nối socket
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap.set(userId, socket.id);
    console.log(`🟢 User ${userId} online`);
  }

  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);

    for (const [id, sId] of userSocketMap.entries()) {
      if (sId === socket.id) {
        userSocketMap.delete(id);
        console.log(`🔴 User ${id} offline`);
        break;
      }
    }

    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

// Export app, server, io để dùng toàn cục
export { app, server, io };
