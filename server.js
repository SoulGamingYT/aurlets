const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static("public"));

let players = {};
let roundActive = false;
let timerInterval = null;
let roundTime = 30;

let currentQuestion = "";
let currentAnswer = "";

// Utility: generate a random integer between min and max (inclusive)
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random math question
function generateQuestion() {
    const operations = ["+", "-", "*", "/"];
    const op = operations[randInt(0, operations.length - 1)];
    let a = randInt(1, 20);
    let b = randInt(1, 20);

    if (op === "/") {
        // Ensure integer division
        a = a * b;
        currentAnswer = (a / b).toString();
    } else if (op === "+") {
        currentAnswer = (a + b).toString();
    } else if (op === "-") {
        currentAnswer = (a - b).toString();
    } else if (op === "*") {
        currentAnswer = (a * b).toString();
    }

    currentQuestion = `${a} ${op} ${b} = ?`;
}

// Start a round
function startRound() {
    roundActive = true;
    generateQuestion();
    io.emit("question", currentQuestion);

    let countdown = roundTime;
    io.emit("timer", countdown);

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        countdown--;
        io.emit("timer", countdown);

        if (countdown <= 0) {
            clearInterval(timerInterval);
            roundActive = false;
            io.emit("log", `Round ended! Correct answer was ${currentAnswer}. Click 'Next Round' to continue.`);
        }
    }, 1000);
}

function nextRound() {
    if (!roundActive) startRound();
}

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (username) => {
        players[socket.id] = { name: username, score: 0 };
        io.emit("players", Object.values(players));
        io.emit("log", `${username} joined the lobby`);
    });

    socket.on("answer", (answer) => {
        if (!roundActive) return;
        const player = players[socket.id];
        if (!player) return;

        if (answer.trim() === currentAnswer) {
            player.score += 1;
            io.emit("log", `${player.name} got it right!`);
        } else {
            io.emit("log", `${player.name} answered: ${answer}`);
        }

        io.emit("players", Object.values(players));
    });

    socket.on("startRound", () => {
        if (!roundActive) startRound();
    });

    socket.on("nextRound", () => {
        if (!roundActive) nextRound();
    });

    socket.on("disconnect", () => {
        const player = players[socket.id];
        if (player) io.emit("log", `${player.name} left the game`);
        delete players[socket.id];
        io.emit("players", Object.values(players));
    });
});

server.listen(3000, () => {
    console.log("Game server running on port 3000");
});
