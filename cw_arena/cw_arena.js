const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

let oscillator, gainNode;
let gameActive = false;
let attempts = 0;
let correct = 0;
let currentCall = "";
const MAX_ATTEMPTS = 10;

const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("cw-theme");
if (savedTheme) document.body.dataset.theme = savedTheme;

themeToggle.onclick = () => {
  const theme = document.body.dataset.theme === "light" ? "" : "light";
  document.body.dataset.theme = theme;
  localStorage.setItem("cw-theme", theme);
  themeToggle.textContent = theme ? "☀️" : "🌙";
};

const MORSE = {
A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",
H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",
O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",
V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",
0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",
6:"-....",7:"--...",8:"---..",9:"----."
};

const startBtn = document.getElementById("startBtn");
const playBtn = document.getElementById("playBtn");
const submitBtn = document.getElementById("submitBtn");
const userInput = document.getElementById("userInput");
const stats = document.getElementById("stats");
const accuracyBar = document.getElementById("accuracyBar");
const reveal = document.getElementById("reveal");

const wpm = document.getElementById("wpm");
const farnsworth = document.getElementById("farnsworth");
const tone = document.getElementById("tone");
const volume = document.getElementById("volume");

const PREFIXES = [
"AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL",
"K","N","W","VE","VA","VO","VY","DL","F","G","M","GM","MM",
"GI","MI","GW","MW","EI","ON","PA","PB","PC","PD","PE","PF",
"PG","PH","PI","LX","HB","OE","SM","OH","OZ","LA","TF","I",
"EA","CT","SV","9A","S5","YU","T7","Z3","SP","OK","OL","OM",
"HA","LZ","YO","ER","ES","YL","LY","UA","UB","UC","UD","UE",
"UF","UG","UH","UI","UR","EU","EV","EK","4L","UN","JA","JE",
"JF","JG","JH","JI","BY","HL","BV","VR","XX9","VU","AP","4S",
"9N","S2","9M2","9M6","9M8","HS","YB","YC","YE","YF","DU",
"XV","XU","9V","4X","4Z","A7","A6","HZ","EP","YI","OD","TA",
"ZS","ZR","5H","5X","5Z","SU","CN","3V","7X","9J","9K","A5",
"KP4","CO","J6","J3","PJ2","PJ4","XE","TG","TI","HP","YN",
"PY","LU","CX","CE","HK","YV","OA","HC","CP","ZP","VK","ZL",
"P29","FO","KH6"
];

function randomCallsign() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const digit = Math.floor(Math.random() * 10);
  const suffix =
    String.fromCharCode(65 + Math.random() * 26 | 0) +
    String.fromCharCode(65 + Math.random() * 26 | 0);
  return prefix + digit + suffix;
}

function playTone(duration) {
  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();
  oscillator.frequency.value = tone.value;
  gainNode.gain.value = volume.value / 100;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), duration);
}

function playMorse(text) {
  let unit = 1200 / wpm.value;
  let t = 0;
  playBtn.classList.add("active");

  for (let char of text) {
    for (let s of MORSE[char]) {
      setTimeout(() => playTone(s === "." ? unit : unit * 3), t);
      t += s === "." ? unit * 2 : unit * 4;
    }
    t += unit * (3 + Number(farnsworth.value));
  }

  setTimeout(() => playBtn.classList.remove("active"), t);
}

function nextRound() {
  if (attempts >= MAX_ATTEMPTS) return stopGame();
  currentCall = randomCallsign();
}

function stopGame() {
  gameActive = false;
  startBtn.textContent = "Start Game";
  startBtn.className = "start";
}

startBtn.onclick = () => {
  if (!gameActive) {
    attempts = 0;
    correct = 0;
    accuracyBar.style.width = "0%";
    stats.textContent = "Attempt: 0 / 10 | Accuracy: 0%";
    reveal.textContent = "Played Callsign: —";
    gameActive = true;
    startBtn.textContent = "Stop Game";
    startBtn.className = "stop";
    nextRound();
  } else {
    stopGame();
  }
};

playBtn.onclick = () => {
  if (!gameActive) return;
  reveal.textContent = "Played Callsign: —";
  playMorse(currentCall);
};

submitBtn.onclick = () => {
  if (!gameActive) return;

  attempts++;

  const isCorrect =
    userInput.value.trim().toUpperCase() === currentCall;

  if (isCorrect) correct++;

  reveal.textContent = `Played Callsign: ${currentCall}`;

  const acc = Math.round((correct / attempts) * 100);
  stats.textContent =
    `Attempt: ${attempts} / ${MAX_ATTEMPTS} | Accuracy: ${acc}%`;
  accuracyBar.style.width = acc + "%";

  userInput.value = "";

  nextRound();
};