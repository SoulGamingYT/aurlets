const socket = io("https://aurlets.up.railway.app");

let username = "";
const lobby = document.getElementById("lobby");
const gameArea = document.getElementById("gameArea");
const playersList = document.getElementById("players");
const logBox = document.getElementById("log");
const questionBox = document.getElementById("question");
const timerBox = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const nextRoundBtnContainer = document.getElementById("nextRoundBtnContainer");

function joinGame() {
    username = document.getElementById("username").value.trim();
    if (!username) return;

    socket.emit("join", username);
    lobby.classList.add("hidden");
    gameArea.classList.remove("hidden");
    startBtn.classList.remove("hidden");
    log(`You joined the lobby as ${username}`);
}

function startGame() {
    socket.emit("startRound");
    startBtn.classList.add("hidden");
}

function nextRound() {
    socket.emit("startRound");
    nextRoundBtnContainer.classList.add("hidden");
}

function submitNumber() {
    const number = document.getElementById("answer").value.trim();
    if (!number) return;
    socket.emit("submitNumber", number);
    document.getElementById("answer").value = "";
}

// Socket events
socket.on("players", (players) => {
    playersList.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.name} — ${p.lives} ❤️`;
        playersList.appendChild(li);
    });
});

socket.on("roundStart", ({ roundTime }) => {
    questionBox.textContent = `Enter a number for this round!`;
    timerBox.textContent = roundTime;
});

socket.on("timer", (t) => {
    timerBox.textContent = t;
    if (t === 0) nextRoundBtnContainer.classList.remove("hidden");
});

socket.on("roundResult", (data) => {
    log(`Round results! Target: ${data.target}`);
    for (let id in data.numbers) {
        log(`${data.numbers[id]}`);
    }
});

socket.on("log", (msg) => log(msg));
socket.on("eliminated", () => {
    log("You have been eliminated!");
});
socket.on("gameOver", (winner) => {
    log(`🏆 Game Over! Winner: ${winner.name}`);
});

// Helper to log messages
function log(msg) {
    const div = document.createElement("div");
    div.textContent = msg;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
}
