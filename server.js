const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {}; // { socketId: { name, score } }
let currentQuestion = "";
let currentAnswer = 0;
let roundActive = false;
let roundTime = 30; // first round
let timerInterval = null;
let roundCount = 0;

// Generate random arithmetic question
function generateQuestion() {
  const ops = ["+", "-", "*", "/"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = Math.floor(Math.random() * 20) + 1;
  let b = Math.floor(Math.random() * 20) + 1;

  if (op === "/") {
    a = a * b; // integer division
    currentAnswer = a / b;
  } else if (op === "+") {
    currentAnswer = a + b;
  } else if (op === "-") {
    currentAnswer = a - b;
  } else if (op === "*") {
    currentAnswer = a * b;
  }

  currentQuestion = `${a} ${op} ${b} = ?`;
}

// Start a round
function startRound() {
  if (Object.keys(players).length < 2) {
    io.emit("log", "Waiting for more players...");
    return;
  }

  roundActive = true;
  generateQuestion();
  io.emit("question", currentQuestion);
  io.emit("log", `Round ${roundCount + 1} started!`);

  let countdown = roundTime;
  io.emit("timer", countdown);

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    countdown--;
    io.emit("timer", countdown);
    if (countdown <= 0) {
      clearInterval(timerInterval);
      roundActive = false;
      io.emit("log", `Round ended! Correct answer: ${currentAnswer}`);
      roundCount++;
      roundTime = 15; // subsequent rounds
      startRound();
    }
  }, 1000);
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);
  players[socket.id] = { name: socket.id, score: 0 };
  io.emit("players", Object.values(players));
  io.emit("log", `Player joined: ${socket.id}`);

  // Auto start first round when at least 2 players join
  if (!roundActive && Object.keys(players).length >= 2) {
    startRound();
  }

  socket.on("answer", (data) => {
    if (!roundActive) return;
    if (parseFloat(data) === currentAnswer) {
      players[socket.id].score += 1;
      io.emit("log", `${players[socket.id].name} answered correctly!`);
    }
    io.emit("players", Object.values(players));
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("players", Object.values(players));
    io.emit("log", `Player disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
