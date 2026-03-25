const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {}; 
// { socketId: { name, score, lives } }

let currentQuestion = "";
let currentAnswer = 0;

let roundActive = false;
let roundCount = 0;
let timerInterval = null;


// Generate random arithmetic question
function generateQuestion() {

  const ops = ["+", "-", "*"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a = Math.floor(Math.random() * 20) + 1;
  let b = Math.floor(Math.random() * 20) + 1;

  if (op === "+") currentAnswer = a + b;
  if (op === "-") currentAnswer = a - b;
  if (op === "*") currentAnswer = a * b;

  currentQuestion = `${a} ${op} ${b} = ?`;
}


// Start a round
function startRound() {

  if (Object.keys(players).length < 2) {
    io.emit("log", "Waiting for at least 2 players...");
    return;
  }

  roundActive = true;

  generateQuestion();

  io.emit("question", currentQuestion);

  let roundTime = (roundCount === 0) ? 60 : 30;

  io.emit("log", `Round ${roundCount + 1} started (${roundTime}s)`);

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

      setTimeout(startRound, 3000);

    }

  }, 1000);
}


io.on("connection", (socket) => {

  console.log("Player connected:", socket.id);


  // Player joins lobby with chosen name
  socket.on("join", (username) => {

    players[socket.id] = {
      name: username,
      score: 0,
      lives: 5
    };

    io.emit("players", Object.values(players));

    io.emit("log", `${username} joined the lobby`);

    // Start game automatically if 2 players
    if (!roundActive && Object.keys(players).length >= 2) {
      startRound();
    }

  });


  socket.on("answer", (answer) => {

    if (!roundActive) return;

    if (parseFloat(answer) === currentAnswer) {

      players[socket.id].score += 1;

      io.emit("log", `${players[socket.id].name} answered correctly!`);

      io.emit("players", Object.values(players));

    }

  });


  socket.on("disconnect", () => {

    if (players[socket.id]) {

      io.emit("log", `${players[socket.id].name} left the game`);

      delete players[socket.id];

      io.emit("players", Object.values(players));

    }

  });

});


server.listen(3000, () => {
  console.log("Game server running on port 3000");
});
