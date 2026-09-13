const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

function resize(){
const size=getViewportSize();
canvas.width=size.width;
canvas.height=size.height;
}
resize();
addEventListener('resize',resize);
if(window.visualViewport){
window.visualViewport.addEventListener('resize',resize);
}

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
audioCtx:null,
pendingMissionStart:false
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

if(shouldBlockForPortrait()){
state.pendingMissionStart=true;
showOrientationOverlay(true);
return;
}

tone(880);

document.getElementById('hookPanel').classList.remove('active');

startCountdown();

};


function getViewportSize(){
const viewport=window.visualViewport||window;
return{
width:Math.floor(viewport.width||window.innerWidth||document.documentElement.clientWidth),
height:Math.floor(viewport.height||window.innerHeight||document.documentElement.clientHeight)
};
}

function isTouchOrSmallScreen(){
return (navigator.maxTouchPoints&&navigator.maxTouchPoints>0)||
window.matchMedia('(pointer: coarse)').matches||
Math.min(window.innerWidth,window.innerHeight)<=900;
}

function isPortraitViewport(){
const size=getViewportSize();
return size.height>=size.width;
}

function shouldBlockForPortrait(){
return isTouchOrSmallScreen()&&isPortraitViewport();
}

function showOrientationOverlay(visible){
const overlay=document.getElementById('orientationOverlay');
if(!overlay)return;
overlay.classList.toggle('active',visible);
overlay.style.display=visible?'flex':'none';
document.body.classList.toggle('orientationBlocked',visible);
}

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

function isMobileLandscape(){
return window.innerWidth<=900 && window.innerWidth>window.innerHeight;
}

function getPlayArea(){
const top=isMobileLandscape()?72:130;
const bottom=isMobileLandscape()?24:30;
return{
centerX:canvas.width/2,
centerY:top+(canvas.height-top-bottom)/2,
top,bottom
};
}

function getScale(){
const area=getPlayArea();
const availableW=canvas.width-90;
const availableH=canvas.height-area.top-area.bottom-50;
return Math.max(18,Math.min(54,availableW/12,availableH/12));
}

function getBubbleRadius(){
return isMobileLandscape()?34:42;
}

function toScreen(x,y){
const scale=getScale();
const area=getPlayArea();
return{
x:area.centerX+x*scale,
y:area.centerY-y*scale
};
}

function createBubble(){

let attempts=0;
const radius=getBubbleRadius();
const area=getPlayArea();

while(attempts<80){

attempts++;

const x=randCoord();
const y=randCoord();

const p=toScreen(x,y);

const safeLeft=radius+12;
const safeRight=canvas.width-radius-12;
const safeTop=area.top+radius+6;
const safeBottom=canvas.height-radius-12;

if(p.x>safeLeft && p.x<safeRight && p.y>safeTop && p.y<safeBottom){

return{
x,y,
q:getQuadrant(x,y),
radius,
pulse:0
};

}

}

return{
x:1,
y:1,
q:1,
radius,
pulse:0
};

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

ctx.globalAlpha=.09;
ctx.fillStyle='#58f6ff';
ctx.textAlign='center';
ctx.textBaseline='middle';

const memoFontSize=Math.max(24,Math.min(42,canvas.width*0.045));
ctx.font=`bold ${memoFontSize}px Arial`;
ctx.fillText('MEMO Studio',canvas.width/2,canvas.height/2+18);

ctx.textBaseline='alphabetic';
ctx.globalAlpha=1;

}

function drawBubble(b){

const p=toScreen(b.x,b.y);

b.pulse+=0.08;

const radius=b.radius+Math.sin(b.pulse)*5;

b.screenX=p.x;
b.screenY=p.y;
b.hitRadius=radius+(isMobileLandscape()?12:0);

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

function handlePointer(e){

if(!state.playing)return;

e.preventDefault();

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

}

canvas.addEventListener('pointerdown',handlePointer,{passive:false});

function startCountdown(){

if(shouldBlockForPortrait()){
state.pendingMissionStart=true;
showOrientationOverlay(true);
return;
}

const overlay=document.getElementById('overlay');
const number=document.getElementById('countdownNumber');

overlay.classList.remove('hidden');

let c=3;

const interval=setInterval(()=>{

number.textContent=c;

tone(500+(c*80),0.04);

c--;

if(c<0){

number.innerHTML='<span class="memoStudioMark">MEMO Studio</span>';

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

if(shouldBlockForPortrait()){
state.pendingMissionStart=true;
showOrientationOverlay(true);
return;
}

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
const blocked=shouldBlockForPortrait();
showOrientationOverlay(blocked);
return blocked;
}

function handleViewportChange(){
resize();
const blocked=checkOrientation();

if(!blocked && state.pendingMissionStart){
state.pendingMissionStart=false;
tone(880);
document.getElementById('hookPanel').classList.remove('active');
startCountdown();
}
}

window.addEventListener('resize',handleViewportChange);
window.addEventListener('orientationchange',()=>{
setTimeout(handleViewportChange,80);
setTimeout(handleViewportChange,260);
});
window.addEventListener('load',handleViewportChange);
window.addEventListener('pageshow',handleViewportChange);

handleViewportChange();
setTimeout(handleViewportChange,100);
setTimeout(handleViewportChange,350);
