const socket = io("https://aurlets.up.railway.app");

let username="";

const lobby=document.getElementById("lobby");
const gameArea=document.getElementById("gameArea");

const playersList=document.getElementById("players");
const logBox=document.getElementById("log");

const questionBox=document.getElementById("question");
const timerBox=document.getElementById("timer");


// join lobby
function joinGame(){

username=document.getElementById("username").value.trim();

if(!username) return;

socket.emit("join",username);

lobby.classList.add("hidden");
gameArea.classList.remove("hidden");

log("Joined lobby as "+username);

}


// submit answer
function submitAnswer(){

const answer=document.getElementById("answer").value.trim();

if(!answer) return;

socket.emit("answer",answer);

document.getElementById("answer").value="";

}


// players list
socket.on("players",(players)=>{

playersList.innerHTML="";

players.forEach(player=>{

const li=document.createElement("li");

const hearts="❤️".repeat(player.lives);

li.innerText=`${player.name} — ⭐${player.score} ${hearts}`;

playersList.appendChild(li);

});

});


// question
socket.on("question",(q)=>{
questionBox.innerText=q;
});


// timer
socket.on("timer",(t)=>{
timerBox.innerText=t;
});


// logs
socket.on("log",(msg)=>{
log(msg);
});


function log(text){

const div=document.createElement("div");

div.innerText=text;

logBox.appendChild(div);

logBox.scrollTop=logBox.scrollHeight;

}
