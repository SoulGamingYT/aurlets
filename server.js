const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/* ===================================================
   MATH GAME (unchanged)
=================================================== */
const math = io.of("/math");

let mathPlayers = {};
let mathQuestion = "";
let mathAnswer = 0;
let mathRoundActive = false;
let mathTimer;
let mathRoundCount = 0;

function generateMathQuestion() {
    const ops = ["+","-","*"];
    const op = ops[Math.floor(Math.random()*ops.length)];
    let a = Math.floor(Math.random()*20)+1;
    let b = Math.floor(Math.random()*20)+1;
    if(op==="+") mathAnswer = a+b;
    if(op==="-") mathAnswer = a-b;
    if(op==="*") mathAnswer = a*b;
    mathQuestion = `${a} ${op} ${b} = ?`;
}

function startMathRound() {
    if(Object.keys(mathPlayers).length < 2) {
        math.emit("log","Waiting for players...");
        return;
    }

    mathRoundActive = true;
    generateMathQuestion();

    let roundTime = mathRoundCount===0?30:15;
    math.emit("question", mathQuestion);
    math.emit("log", `Round ${mathRoundCount+1} started (${roundTime}s)`);

    let countdown = roundTime;
    math.emit("timer", countdown);
    clearInterval(mathTimer);

    mathTimer = setInterval(()=>{
        countdown--;
        math.emit("timer", countdown);
        if(countdown<=0){
            clearInterval(mathTimer);
            mathRoundActive=false;
            math.emit("log",`Round ended! Correct answer: ${mathAnswer}`);
            mathRoundCount++;
            setTimeout(startMathRound,3000);
        }
    },1000);
}

math.on("connection", (socket)=>{
    console.log("Math player connected");
    mathPlayers[socket.id] = { score:0 };
    math.emit("players", Object.values(mathPlayers));

    if(!mathRoundActive && Object.keys(mathPlayers).length>=2){
        startMathRound();
    }

    socket.on("answer",(answer)=>{
        if(!mathRoundActive) return;
        if(parseFloat(answer)===mathAnswer){
            mathPlayers[socket.id].score++;
            math.emit("log","Correct answer!");
            math.emit("players", Object.values(mathPlayers));
        }
    });

    socket.on("disconnect", ()=>{
        delete mathPlayers[socket.id];
        math.emit("players", Object.values(mathPlayers));
    });
});


/* ===================================================
   KOTD GAME
=================================================== */

const kotd = io.of("/kotd");

let kotdPlayers = {}; // { socketId: {name, score, lives, lastNumber} }
let kotdRoundActive = false;
let kotdRoundTime = 60;
let kotdTimer;
let kotdRoundCount = 0;

function startKotdRound() {
    if(Object.keys(kotdPlayers).length < 2){
        kotd.emit("log","Waiting for players...");
        return;
    }

    kotdRoundActive = true;

    kotd.emit("question", "Enter your number for this round");
    kotd.emit("log", `Round ${kotdRoundCount+1} started (${kotdRoundTime}s)`);

    let countdown = kotdRoundTime;
    kotd.emit("timer", countdown);
    clearInterval(kotdTimer);

    kotdTimer = setInterval(()=>{
        countdown--;
        kotd.emit("timer", countdown);
        if(countdown<=0){
            clearInterval(kotdTimer);
            processKotdRound();
        }
    },1000);
}

function processKotdRound() {
    kotdRoundActive=false;
    kotd.emit("log", "Round ended!");

    // Compute target = 0.8 * average
    const numbers = Object.values(kotdPlayers).map(p=>p.lastNumber).filter(n=>n!==undefined);
    if(numbers.length===0){
        kotd.emit("log","No numbers submitted, skipping round");
    } else {
        const avg = numbers.reduce((a,b)=>a+b,0)/numbers.length;
        const target = avg*0.8;
        kotd.emit("log",`Target number (0.8 * avg) = ${target.toFixed(2)}`);

        // Determine winner and farthest
        let closestId = null;
        let minDiff = Infinity;
        let farthestIds = [];
        let maxDiff = -Infinity;

        for(let [id, p] of Object.entries(kotdPlayers)){
            const diff = Math.abs(p.lastNumber - target);
            if(diff < minDiff){
                minDiff = diff;
                closestId = id;
            }
            if(diff > maxDiff){
                maxDiff = diff;
                farthestIds = [id];
            } else if(diff === maxDiff){
                farthestIds.push(id);
            }
        }

        // Update winner
        if(closestId) kotdPlayers[closestId].score++;
        kotd.emit("log", `${kotdPlayers[closestId].name} wins this round ⭐`);

        // Remove life from farthest
        for(let id of farthestIds){
            kotdPlayers[id].lives--;
            if(kotdPlayers[id].lives <=0){
                kotd.emit("log", `${kotdPlayers[id].name} eliminated ❤️`);
                delete kotdPlayers[id];
            }
        }
    }

    // Clear lastNumber for next round
    for(let p of Object.values(kotdPlayers)) p.lastNumber = undefined;

    kotd.emit("players", Object.values(kotdPlayers));

    // Next round settings
    kotdRoundCount++;
    kotdRoundTime = 30;

    // Check for winner
    if(Object.keys(kotdPlayers).length===1){
        const winner = Object.values(kotdPlayers)[0];
        kotd.emit("log", `${winner.name} wins the game! 🎉`);
        kotdPlayers={}; // reset game
        kotdRoundCount=0;
        kotdRoundTime=60;
    } else {
        setTimeout(startKotdRound,3000);
    }
}

kotd.on("connection",(socket)=>{
    console.log("KOTD player connected");

    socket.on("join",(username)=>{
        kotdPlayers[socket.id] = { name:username, score:0, lives:5 };
        kotd.emit("players", Object.values(kotdPlayers));
        kotd.emit("log", `${username} joined lobby`);

        if(!kotdRoundActive && Object.keys(kotdPlayers).length>=2){
            startKotdRound();
        }
    });

    socket.on("answer",(number)=>{
        if(!kotdRoundActive) return;
        kotdPlayers[socket.id].lastNumber = parseFloat(number);
        kotd.emit("log", `${kotdPlayers[socket.id].name} submitted a number`);
    });

    socket.on("disconnect",()=>{
        if(kotdPlayers[socket.id]){
            kotd.emit("log", `${kotdPlayers[socket.id].name} left`);
            delete kotdPlayers[socket.id];
            kotd.emit("players", Object.values(kotdPlayers));
        }
    });
});

server.listen(3000,()=>console.log("Server running on port 3000"));
