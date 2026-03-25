const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static("public"));

let players = {}; // { socketId: { name, lives, lastNumber } }
let roundActive = false;
let roundNumbers = {};
let roundTime = 20; // seconds
let timerInterval = null;

// Start a round
function startRound() {
    if (Object.keys(players).length < 2) {
        io.emit("log", "Not enough players for a round.");
        return;
    }

    roundActive = true;
    roundNumbers = {};
    io.emit("log", "Round started! Enter your number.");
    io.emit("roundStart", { roundTime, players: getPlayerStats() });

    let countdown = roundTime;
    io.emit("timer", countdown);
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        countdown--;
        io.emit("timer", countdown);
        if (countdown <= 0) {
            clearInterval(timerInterval);
            resolveRound();
        }
    }, 1000);
}

// Resolve round results
function resolveRound() {
    roundActive = false;

    const numbers = Object.values(roundNumbers);
    if (numbers.length === 0) {
        io.emit("log", "No numbers submitted. Round skipped.");
        return;
    }

    const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const target = avg * 0.8;

    // Find winner and farthest players
    let closestDiff = Infinity;
    let winnerIds = [];
    let farthestDiff = -Infinity;
    let losers = [];

    for (let id in roundNumbers) {
        const diff = Math.abs(roundNumbers[id] - target);
        if (diff < closestDiff) {
            closestDiff = diff;
            winnerIds = [id];
        } else if (diff === closestDiff) {
            winnerIds.push(id);
        }

        if (diff > farthestDiff) {
            farthestDiff = diff;
            losers = [id];
        } else if (diff === farthestDiff) {
            losers.push(id);
        }
    }

    // Handle ties randomly
    const winnerId = winnerIds[Math.floor(Math.random() * winnerIds.length)];

    // Remove life from losers
    losers.forEach(id => {
        if (id !== winnerId) {
            players[id].lives--;
            if (players[id].lives <= 0) {
                io.to(id).emit("eliminated");
                delete players[id];
            }
        }
    });

    io.emit("log", `Round ended! Target: ${target.toFixed(2)}. Winner: ${players[winnerId]?.name || "N/A"}`);
    io.emit("roundResult", {
        target: target.toFixed(2),
        numbers: roundNumbers,
        players: getPlayerStats()
    });

    checkWinner();
}

// Check if only one player left
function checkWinner() {
    const remaining = Object.keys(players);
    if (remaining.length === 1) {
        const winner = players[remaining[0]];
        io.emit("log", `🏆 ${winner.name} wins the game!`);
        io.emit("gameOver", winner);
        players = {}; // reset game
    } else if (remaining.length === 0) {
        io.emit("log", "No players left. Game over.");
    }
}

// Helper: player stats for leaderboard
function getPlayerStats() {
    return Object.values(players).map(p => ({ name: p.name, lives: p.lives }));
}

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (username) => {
        players[socket.id] = { name: username, lives: 5, lastNumber: null };
        io.emit("players", getPlayerStats());
        io.emit("log", `${username} joined the lobby.`);
    });

    socket.on("submitNumber", (num) => {
        if (!roundActive) return;
        const parsed = parseFloat(num);
        if (isNaN(parsed)) return;

        roundNumbers[socket.id] = parsed;
        players[socket.id].lastNumber = parsed;
        io.emit("log", `${players[socket.id].name} submitted a number.`);
    });

    socket.on("startRound", () => {
        if (!roundActive) startRound();
    });

    socket.on("disconnect", () => {
        if (players[socket.id]) {
            io.emit("log", `${players[socket.id].name} left the game.`);
            delete players[socket.id];
            io.emit("players", getPlayerStats());
        }
    });
});

server.listen(3000, () => console.log("KOTD server running on port 3000"));
