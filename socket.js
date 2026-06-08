import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
  cors: {
    origin: [
  "https://mozhibu.com",
  "https://www.mozhibu.com",
  "http://localhost:5173",
    "http://localhost:3000"
],
    methods: ["GET", "POST"],
    credentials: true,
  },
});


  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log("👤 User joined room:", userId);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
