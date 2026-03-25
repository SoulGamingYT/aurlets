const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    players[socket.id] = {
        score: 0
    };

    io.emit("players", players);

    socket.on("answer", (data) => {
        if (data.correct) {
            players[socket.id].score += 1;
        }

        io.emit("players", players);
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("players", players);
    });
});

server.listen(3000, () => {
    console.log("Game server running on port 3000");
});
