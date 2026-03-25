const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/* ===================================================
   MATH GAME
=================================================== */

const math = io.of("/math");

let mathPlayers = {};
let mathQuestion = "";
let mathAnswer = 0;
let mathRoundActive = false;
let mathTimer;
let mathRoundCount = 0;

function generateMathQuestion(){

    const ops = ["+","-","*"];
    const op = ops[Math.floor(Math.random()*ops.length)];

    let a = Math.floor(Math.random()*20)+1;
    let b = Math.floor(Math.random()*20)+1;

    if(op==="+") mathAnswer = a+b;
    if(op==="-") mathAnswer = a-b;
    if(op==="*") mathAnswer = a*b;

    mathQuestion = `${a} ${op} ${b} = ?`;
}

function startMathRound(){

    if(Object.keys(mathPlayers).length < 2){
        math.emit("log","Waiting for players...");
        return;
    }

    mathRoundActive = true;

    generateMathQuestion();

    let roundTime = mathRoundCount === 0 ? 30 : 15;

    math.emit("question",mathQuestion);
    math.emit("log",`Round ${mathRoundCount+1} started (${roundTime}s)`);

    let countdown = roundTime;

    math.emit("timer",countdown);

    clearInterval(mathTimer);

    mathTimer = setInterval(()=>{

        countdown--;

        math.emit("timer",countdown);

        if(countdown<=0){

            clearInterval(mathTimer);

            mathRoundActive=false;

            math.emit("log",`Correct answer: ${mathAnswer}`);

            mathRoundCount++;

            setTimeout(startMathRound,3000);

        }

    },1000);
}

math.on("connection",(socket)=>{

    console.log("Math player connected");

    mathPlayers[socket.id] = {
        score:0
    };

    math.emit("players",Object.values(mathPlayers));

    if(!mathRoundActive && Object.keys(mathPlayers).length>=2){
        startMathRound();
    }

    socket.on("answer",(answer)=>{

        if(!mathRoundActive) return;

        if(parseFloat(answer)===mathAnswer){

            mathPlayers[socket.id].score++;

            math.emit("log","Correct answer!");

            math.emit("players",Object.values(mathPlayers));

        }

    });

    socket.on("disconnect",()=>{

        delete mathPlayers[socket.id];

        math.emit("players",Object.values(mathPlayers));

    });

});


/* ===================================================
   KING OF THE DIAMOND GAME
=================================================== */

const kotd = io.of("/kotd");

let kotdPlayers = {};
let kotdQuestion = "";
let kotdAnswer = 0;

let kotdRoundActive = false;
let kotdRoundCount = 0;
let kotdTimer;

function generateKotdQuestion(){

    const ops = ["+","-","*"];
    const op = ops[Math.floor(Math.random()*ops.length)];

    let a = Math.floor(Math.random()*20)+1;
    let b = Math.floor(Math.random()*20)+1;

    if(op==="+") kotdAnswer = a+b;
    if(op==="-") kotdAnswer = a-b;
    if(op==="*") kotdAnswer = a*b;

    kotdQuestion = `${a} ${op} ${b} = ?`;
}

function startKotdRound(){

    if(Object.keys(kotdPlayers).length < 2){
        kotd.emit("log","Waiting for players...");
        return;
    }

    kotdRoundActive = true;

    generateKotdQuestion();

    let roundTime = kotdRoundCount === 0 ? 60 : 30;

    kotd.emit("question",kotdQuestion);
    kotd.emit("log",`Round ${kotdRoundCount+1} started (${roundTime}s)`);

    let countdown = roundTime;

    kotd.emit("timer",countdown);

    clearInterval(kotdTimer);

    kotdTimer = setInterval(()=>{

        countdown--;

        kotd.emit("timer",countdown);

        if(countdown<=0){

            clearInterval(kotdTimer);

            kotdRoundActive=false;

            kotd.emit("log",`Correct answer: ${kotdAnswer}`);

            kotdRoundCount++;

            setTimeout(startKotdRound,3000);

        }

    },1000);
}

kotd.on("connection",(socket)=>{

    console.log("KOTD player connected");

    socket.on("join",(username)=>{

        kotdPlayers[socket.id] = {
            name: username,
            score: 0,
            lives: 5
        };

        kotd.emit("players",Object.values(kotdPlayers));

        kotd.emit("log",`${username} joined lobby`);

        if(!kotdRoundActive && Object.keys(kotdPlayers).length>=2){
            startKotdRound();
        }

    });

    socket.on("answer",(answer)=>{

        if(!kotdRoundActive) return;

        if(parseFloat(answer)===kotdAnswer){

            kotdPlayers[socket.id].score++;

            kotd.emit("log",`${kotdPlayers[socket.id].name} answered correctly`);

            kotd.emit("players",Object.values(kotdPlayers));

        }

    });

    socket.on("disconnect",()=>{

        if(kotdPlayers[socket.id]){

            kotd.emit("log",`${kotdPlayers[socket.id].name} left`);

            delete kotdPlayers[socket.id];

            kotd.emit("players",Object.values(kotdPlayers));

        }

    });

});


server.listen(3000,()=>{
    console.log("Aurlets Game Server running on port 3000");
});
