const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let currentQuestion = "What is 2 + 2?";
let roundTime = 30;
let timerInterval = null;

// Broadcast question and start timer
function startRound() {
    io.emit("question", currentQuestion);
    let countdown = roundTime;
    io.emit("timer", countdown);

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        countdown--;
        io.emit("timer", countdown);
        if (countdown <= 0) {
            io.emit("log", "Round ended! Next round coming soon...");
            clearInterval(timerInterval);
            // Optional: generate new question
            currentQuestion = "What is 3 + 5?";
            startRound();
        }
    }, 1000);
}

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (username) => {
        players[socket.id] = { name: username, score: 0 };
        io.emit("players", Object.values(players));
        io.emit("log", `${username} joined the lobby`);

        // Start first round if first player
        if (Object.keys(players).length === 1) startRound();
    });

    socket.on("answer", (answer) => {
        const player = players[socket.id];
        if (!player) return;

        // Example correct answer checking
        if (answer === "4") {
            player.score += 1;
            io.emit("log", `${player.name} got it right!`);
        } else {
            io.emit("log", `${player.name} answered: ${answer}`);
        }

        io.emit("players", Object.values(players));
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
