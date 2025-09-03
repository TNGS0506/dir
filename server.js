const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store last 1000 rows
const MAX_HISTORY = 1000;
const crashHistory = [];

function emitCrashData(data) {
  crashHistory.push(data);
  if (crashHistory.length > MAX_HISTORY) {
    crashHistory.shift();
  }
  io.emit("crash-data", data);
}

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

// **Put the connection handler here:**
io.on("connection", (socket) => {
  console.log("Client connected");

  // Send the last 1000 rows to the newly connected client
  socket.emit("crash-history", crashHistory);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start the server
server.listen(3000, () => {
  console.log("🌐 Dashboard running at http://localhost:3000");
});

module.exports = { emitCrashData };
