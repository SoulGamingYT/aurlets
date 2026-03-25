const socket = io("/kotd");

let username = "";
const lobby = document.getElementById("lobby");
const gameArea = document.getElementById("gameArea");
const playersList = document.getElementById("players");
const logBox = document.getElementById("log");
const answerInput = document.getElementById("answer");

// --------------------
// Auto-rejoin on page load
// --------------------
window.onload = () => {
    const savedName = localStorage.getItem("kotdName");
    if (savedName) {
        username = savedName;
        socket.emit("join", username);
        lobby.classList.add("hidden");
        gameArea.classList.remove("hidden");
        log(`Rejoined as ${username}`);
    }
};

// --------------------
// Join game manually
// --------------------
function joinGame() {
    username = document.getElementById("username").value.trim();
    if (!username) return;

    localStorage.setItem("kotdName", username); // save for reload
    socket.emit("join", username);

    lobby.classList.add("hidden");
    gameArea.classList.remove("hidden");

    log(`Joined lobby as ${username}`);
}

// --------------------
// Submit a number
// --------------------
function submitAnswer() {
    const number = answerInput.value.trim();
    if (number === "" || isNaN(number)) return;

    socket.emit("answer", parseFloat(number));
    answerInput.value = "";
}

// --------------------
// Socket listeners
// --------------------
socket.on("players", (players) => {
    playersList.innerHTML = "";

    players.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = `${p.name} - ${p.lives} ❤️ - ${p.score} ⭐`;
        playersList.appendChild(li);
    });
});

socket.on("question", (q) => {
    document.getElementById("question").innerText = q;
});

socket.on("timer", (t) => {
    document.getElementById("timer").innerText = t;
});

socket.on("log", (msg) => {
    log(msg);
});

// --------------------
// Logging helper
// --------------------
function log(text) {
    const div = document.createElement("div");
    div.innerText = text;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
}

// --------------------
// Reconnect handling
// --------------------
socket.io.on("reconnect", () => {
    if (username) {
        socket.emit("join", username);
        log(`Reconnected as ${username}`);
    }
});
