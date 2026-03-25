const socket = io("https://aurlets.up.railway.app");

const playersList = document.getElementById("players");

socket.on("players", (players) => {
    playersList.innerHTML = "";

    Object.entries(players).forEach(([id, player]) => {
        const li = document.createElement("li");
        li.textContent = id + " : " + player.score;
        playersList.appendChild(li);
    });
});

function submitAnswer(){
    const answer = document.getElementById("answer").value;

    const correct = answer === "4"; // example puzzle answer

    socket.emit("answer", {correct});
}
