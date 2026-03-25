const socket = io("https://aurlets.up.railway.app");

const playersList = document.getElementById("players");
const logBox = document.getElementById("log");
const questionBox = document.getElementById("question");
const timerBox = document.getElementById("timer");

function submitAnswer() {
  const answer = document.getElementById("answer").value.trim();
  if (!answer) return;
  socket.emit("answer", answer);
  document.getElementById("answer").value = "";
}

socket.on("players", (players) => {
  playersList.innerHTML = "";
  players.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.name} — ${p.score}`;
    playersList.appendChild(li);
  });
});

socket.on("question", (q) => {
  questionBox.textContent = q;
});

socket.on("timer", (t) => {
  timerBox.textContent = t;
});

socket.on("log", (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  logBox.appendChild(div);
  logBox.scrollTop = logBox.scrollHeight;
});
