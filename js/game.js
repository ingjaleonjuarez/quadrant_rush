const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

function resize(){
canvas.width=innerWidth;
canvas.height=innerHeight;
}
resize();
addEventListener('resize',resize);

const panels=document.querySelectorAll('.panel');

function showPanel(id){
panels.forEach(p=>p.classList.remove('active'));
document.getElementById(id).classList.add('active');
}

const state={
player:'Jugador',
score:0,
combo:0,
timer:45,
targetQuadrant:1,
playing:false,
bubbles:[],
texts:[],
timerInterval:null,
audioCtx:null
};

const quadrants=['I','II','III','IV'];

function initAudio(){
if(!state.audioCtx){
state.audioCtx=new(window.AudioContext||window.webkitAudioContext)();
}
}

function tone(freq=500,duration=0.05,type='square'){

if(!state.audioCtx)return;

const osc=state.audioCtx.createOscillator();
const gain=state.audioCtx.createGain();

osc.type=type;
osc.frequency.value=freq;

gain.gain.value=0.03;

osc.connect(gain);
gain.connect(state.audioCtx.destination);

osc.start();

setTimeout(()=>osc.stop(),duration*1000);

}

document.getElementById('playBtn').onclick=()=>{
initAudio();
tone(620);
showPanel('namePanel');
};

document.getElementById('continueBtn').onclick=()=>{

const n=document.getElementById('playerInput').value.trim();

if(n.length>0){
state.player=n;
}

tone(760);

showPanel('hookPanel');

};

document.getElementById('startMissionBtn').onclick=()=>{

tone(880);

document.getElementById('hookPanel').classList.remove('active');

startCountdown();

};

function randCoord(){
let n=0;
while(n===0){
n=Math.floor(Math.random()*11)-5;
}
return n;
}

function getQuadrant(x,y){
if(x>0&&y>0)return 1;
if(x<0&&y>0)return 2;
if(x<0&&y<0)return 3;
if(x>0&&y<0)return 4;
}

function toScreen(x,y){
const scale=54;
return{
x:canvas.width/2+x*scale,
y:canvas.height/2-y*scale
};
}

function createBubble(){

while(true){

const x=randCoord();
const y=randCoord();

const p=toScreen(x,y);

if(p.y>130){

return{
x,y,
q:getQuadrant(x,y),
radius:42,
pulse:0
};

}

}

}

function refillBubbles(){

state.bubbles=[];

while(state.bubbles.length<2){
state.bubbles.push(createBubble());
}

}

function chooseQuadrant(){

state.targetQuadrant=Math.floor(Math.random()*4)+1;

document.getElementById('objective').textContent=
`CUADRANTE ${quadrants[state.targetQuadrant-1]}`;

}

function drawArena(){

ctx.clearRect(0,0,canvas.width,canvas.height);

ctx.fillStyle='#040811';
ctx.fillRect(0,0,canvas.width,canvas.height);

for(let i=0;i<canvas.width;i+=60){

ctx.strokeStyle='rgba(88,246,255,.03)';

ctx.beginPath();
ctx.moveTo(i,0);
ctx.lineTo(i,canvas.height);
ctx.stroke();

}

for(let j=0;j<canvas.height;j+=60){

ctx.beginPath();
ctx.moveTo(0,j);
ctx.lineTo(canvas.width,j);
ctx.stroke();

}

ctx.strokeStyle='rgba(88,246,255,.16)';

ctx.beginPath();
ctx.moveTo(canvas.width/2,0);
ctx.lineTo(canvas.width/2,canvas.height);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(0,canvas.height/2);
ctx.lineTo(canvas.width,canvas.height/2);
ctx.stroke();

ctx.globalAlpha=.05;
ctx.fillStyle='#58f6ff';
ctx.font='bold 220px Arial';
ctx.textAlign='center';

ctx.font='bold 90px Arial';
ctx.fillText('Preparatoria',canvas.width/2,canvas.height/2+10);

ctx.font='bold 72px Arial';
ctx.fillText('Sor Juana',canvas.width/2,canvas.height/2+95);

ctx.globalAlpha=1;

}

function drawBubble(b){

const p=toScreen(b.x,b.y);

b.pulse+=0.08;

const radius=b.radius+Math.sin(b.pulse)*5;

b.screenX=p.x;
b.screenY=p.y;
b.hitRadius=radius;

ctx.beginPath();
ctx.arc(p.x,p.y,radius,0,Math.PI*2);

ctx.fillStyle=b.q===state.targetQuadrant?'#58f6ff':'#ff9755';

ctx.shadowBlur=28;
ctx.shadowColor=ctx.fillStyle;

ctx.fill();

ctx.strokeStyle='white';
ctx.lineWidth=3;
ctx.stroke();

ctx.fillStyle='#061018';
ctx.font='bold 18px Arial';
ctx.textAlign='center';

ctx.fillText(`(${b.x},${b.y})`,p.x,p.y+6);

}

function addFloating(text,x,y,color){

state.texts.push({
text,x,y,color,life:36
});

}

function drawFloating(){

for(let i=state.texts.length-1;i>=0;i--){

const t=state.texts[i];

t.y-=1.2;
t.life--;

ctx.save();

ctx.globalAlpha=t.life/36;

ctx.fillStyle=t.color;
ctx.font='bold 28px Arial';
ctx.shadowBlur=16;
ctx.shadowColor=t.color;
ctx.textAlign='center';

ctx.fillText(t.text,t.x,t.y);

ctx.restore();

if(t.life<=0){
state.texts.splice(i,1);
}

}

}

function updateHUD(){

document.getElementById('score').textContent=`SCORE ${state.score}`;
document.getElementById('combo').textContent=`COMBO x${state.combo}`;
document.getElementById('timer').textContent=state.timer;

}

function evaluateBubble(index){

const b=state.bubbles[index];

const p=toScreen(b.x,b.y);

state.score+=1;

if(b.q===state.targetQuadrant){

state.score+=2;
state.combo++;

tone(760,0.07);

addFloating('+3',p.x,p.y,'#58f6ff');

}else{

tone(420,0.05,'triangle');

addFloating('+1',p.x,p.y,'#ffe66d');

}

state.bubbles.splice(index,1);

while(state.bubbles.length<2){
state.bubbles.push(createBubble());
}

updateHUD();

}

canvas.addEventListener('click',(e)=>{

if(!state.playing)return;

const rect=canvas.getBoundingClientRect();

const px=e.clientX-rect.left;
const py=e.clientY-rect.top;

for(let i=0;i<state.bubbles.length;i++){

const b=state.bubbles[i];

const dx=px-b.screenX;
const dy=py-b.screenY;

if(Math.sqrt(dx*dx+dy*dy)<=b.hitRadius){

evaluateBubble(i);
return;

}

}

});

function startCountdown(){

const overlay=document.getElementById('overlay');
const number=document.getElementById('countdownNumber');

overlay.classList.remove('hidden');

let c=3;

const interval=setInterval(()=>{

number.textContent=c;

tone(500+(c*80),0.04);

c--;

if(c<0){

number.textContent='Preparatoria Sor Juana';

tone(880,0.08,'triangle');

setTimeout(()=>{

overlay.classList.add('hidden');

startGame();

},600);

clearInterval(interval);

}

},1000);

}

function startGame(){

state.playing=true;
state.score=0;
state.combo=0;
state.timer=45;

chooseQuadrant();
refillBubbles();
updateHUD();

clearInterval(state.timerInterval);

state.timerInterval=setInterval(()=>{

state.timer--;

updateHUD();

if(state.timer<=0){

clearInterval(state.timerInterval);

state.playing=false;

endGame();

}

},1000);

}

function saveLeaderboard(){

let board=JSON.parse(localStorage.getItem('quadrantRushBoard')||'[]');

board.push({
name:state.player,
score:state.score
});

board.sort((a,b)=>b.score-a.score);

board=board.slice(0,5);

localStorage.setItem('quadrantRushBoard',JSON.stringify(board));

return board;

}

function endGame(){

const board=saveLeaderboard();

document.getElementById('finalInfo').innerHTML=`
Jugador: <strong>${state.player}</strong><br>
Score Final: <strong>${state.score}</strong>
`;

let html='<h3>TOP PLAYERS</h3>';

board.forEach((p,i)=>{
html+=`${i+1}. ${p.name} - ${p.score}<br>`;
});

html+='<br><strong>¿PUEDES SUPERAR EL RÉCORD?</strong>';

document.getElementById('leaderboard').innerHTML=html;

showPanel('endPanel');
runEndSequence();

}

document.getElementById('playAgainBtn').onclick=()=>{

tone(720);

showPanel('hookPanel');

};

document.getElementById('restartBtn').onclick=()=>{

tone(620);

startGame();

};

function loop(){

drawArena();

for(const bubble of state.bubbles){
drawBubble(bubble);
}

drawFloating();

requestAnimationFrame(loop);

}

loop();


function runEndSequence(){

const s1=document.getElementById('endStep1');
const s2=document.getElementById('endStep2');
const s3=document.getElementById('endStep3');

[s1,s2,s3].forEach(s=>s.classList.remove('active'));

s1.classList.add('active');

setTimeout(()=>{
s1.classList.remove('active');
s2.classList.add('active');
},2200);

setTimeout(()=>{
s2.classList.remove('active');
s3.classList.add('active');
},4400);

}


function checkOrientation(){

const overlay=document.getElementById('orientationOverlay');

const isMobile = window.innerWidth <= 900;

if(isMobile && window.innerWidth > window.innerHeight){
overlay.style.display='flex';
}else{
overlay.style.display='none';
}

}

window.addEventListener('resize',checkOrientation);
window.addEventListener('orientationchange',checkOrientation);

setTimeout(checkOrientation,300);
