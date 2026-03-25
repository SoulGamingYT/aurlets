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
    startBtn.classList.remove("hidden"); // show Start Game button

    log(`You joined the lobby as ${username}`);
}

function startGame() {
    socket.emit("startRound");
    startBtn.classList.add("hidden"); // hide start button
}

function nextRound() {
    socket.emit("nextRound");
    nextRoundBtnContainer.classList.add("hidden"); // hide next round button until round ends
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
    if (t === 0) {
        nextRoundBtnContainer.classList.remove("hidden"); // show Next Round button
    }
});

// Game log
socket.on("log", (msg) => {
    const div = document.createElement("div");
    div.textContent = msg;
    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
});
