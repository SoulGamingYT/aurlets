const socket = io("https://aurlets.up.railway.app");

let username = "";
const lobby = document.getElementById("lobby");
const gameArea = document.getElementById("gameArea");
const playersList = document.getElementById("players");
const logBox = document.getElementById("log");
const questionBox = document.getElementById("question");
const timerBox = document.getElementById("timer");

function joinGame() {
    username = document.getElementById("username").value.trim();
    if (!username) return;

    socket.emit("join", username);

    lobby.classList.add("hidden");
    gameArea.classList.remove("hidden");

    log(`You joined the lobby as ${username}`);
}

function submitAnswer() {
    const answer = document.getElementById("answer").value.trim();
    if (!answer) return;
    socket.emit("answer", answer);
    document.getElementById("answer").value = "";
}

// Update player list
socket.on("players", (players) => {
    playersList.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.name} — ${p.score}`;
        playersList.appendChild(li);
    });
});

// Update puzzle question
socket.on("question", (q) => {
    questionBox.textContent = q;
});

// Update timer
socket.on("timer", (t) => {
    timerBox.textContent = t;
});

// Game log
socket.on("log", (msg) => {
    const div = document.createElement("div");
    div.textContent = msg;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
});
