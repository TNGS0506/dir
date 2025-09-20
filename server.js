const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const MAX_HISTORY = 1000;
const crashHistory = [];

function emitCrashData(data) {
  crashHistory.push(data);
  if (crashHistory.length > MAX_HISTORY) {
    crashHistory.shift();
  }
  io.emit("crash-data", data);
}

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.emit("crash-history", crashHistory);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("🌐 Dashboard running at http://localhost:3000");
});

module.exports = { emitCrashData };
