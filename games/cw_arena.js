const AudioCtx = window.AudioContext || window.webkitAudioContext
const audioCtx = new AudioCtx()

let attempts = 0
let correct = 0
let level = 1
let currentCalls = []

let playId = 0
let activeOscillators = []

const MAX_ATTEMPTS = 10
const LEVEL_WPM = {1:20,2:25,3:30,4:35}
const CALLS_PER_LEVEL = {1:1,2:2,3:2,4:2}

const PREFIXES = ["AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL","K","N","W","VE","VA","VO","VY","DL","F","G","M","GM","MM","GI","MI","GW","MW","EI","ON","PA","PB","PC","PD","PE","PF","PG","PH","PI","LX","HB","OE","SM","OH","OZ","LA","TF","I","EA","CT","SV","9A","S5","YU","T7","Z3","SP","OK","OL","OM","HA","LZ","YO","ER","ES","YL","LY","UA","UB","UC","UD","UE","UF","UG","UH","UI","UR","EU","EV","EK","4L","UN","JA","JE","JF","JG","JH","JI","BY","HL","BV","VR","XX9","VU","AP","4S","9N","S2","9M2","9M6","9M8","HS","YB","YC","YE","YF","DU","XV","XU","9V","4X","4Z","A7","A6","HZ","EP","YI","OD","TA","ZS","ZR","5H","5X","5Z","SU","CN","3V","7X","9J","9K","A5","KP4","CO","J6","J3","PJ2","PJ4","XE","TG","TI","HP","YN","PY","LU","CX","CE","HK","YV","OA","HC","CP","ZP","VK","ZL","P29","FO","KH6"]

const MORSE = {
A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",
H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",
O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",
V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",
0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",
6:"-....",7:"--...",8:"---..",9:"----."
}

const playBtn = document.getElementById("playBtn")
const submitBtn = document.getElementById("submitBtn")
const userInput = document.getElementById("userInput")
const stats = document.getElementById("stats")
const reveal = document.getElementById("reveal")
const accuracyBar = document.getElementById("accuracyBar")
const levelSelect = document.getElementById("level")
const wpm = document.getElementById("wpm")
const farnsworth = document.getElementById("farnsworth")
const tone = document.getElementById("tone")
const volume = document.getElementById("volume")
const themeToggle = document.getElementById("themeToggle")

const wpmLabel = document.getElementById("wpmLabel")
const farnsworthLabel = document.getElementById("farnsworthLabel")
const toneLabel = document.getElementById("toneLabel")
const volumeLabel = document.getElementById("volumeLabel")

const updateLabels = () => {
  wpmLabel.textContent = `WPM ${wpm.value}`
  farnsworthLabel.textContent = `Farnsworth ${farnsworth.value}`
  toneLabel.textContent = `Tone ${tone.value} Hz`
  volumeLabel.textContent = `Volume ${volume.value}%`
}

document.querySelectorAll("input[type=range]").forEach(r => r.oninput = updateLabels)
updateLabels()

const savedTheme = localStorage.getItem("cw-theme")
if (savedTheme) {
  document.body.dataset.theme = savedTheme
  themeToggle.textContent = savedTheme === "light" ? "🌙" : "☀️"
}

themeToggle.onclick = () => {
  const t = document.body.dataset.theme === "light" ? "" : "light"
  document.body.dataset.theme = t
  localStorage.setItem("cw-theme", t)
  themeToggle.textContent = t === "light" ? "🌙" : "☀️"
}

const randomCallsign = () => {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
  const number = Math.floor(Math.random() * 10)
  const suffixLength = Math.random() < 0.2 ? 1 : Math.random() < 0.75 ? 2 : 3
  let suffix = ""
  for (let i = 0; i < suffixLength; i++) {
    suffix += String.fromCharCode(65 + (Math.random() * 26 | 0))
  }
  return prefix + number + suffix
}

const nextRound = () => {
  currentCalls = []
  for (let i = 0; i < CALLS_PER_LEVEL[level]; i++) {
    currentCalls.push(randomCallsign())
  }
}

const stopAllAudio = () => {
  activeOscillators.forEach(o => {
    try { o.stop() } catch {}
  })
  activeOscillators = []
  playBtn.classList.remove("playing")
}

const playTone = (duration, token) => {
  if (token !== playId) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.frequency.value = tone.value
  gain.gain.value = volume.value / 100
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  activeOscillators.push(osc)
  setTimeout(() => {
    try { osc.stop() } catch {}
  }, duration)
}

const playMorse = async (text, token) => {
  const unit = 1200 / wpm.value
  for (let c of text) {
    for (let s of MORSE[c]) {
      if (token !== playId) return
      playTone(s === "." ? unit : unit * 3, token)
      await new Promise(r => setTimeout(r, s === "." ? unit * 2 : unit * 4))
    }
    await new Promise(r => setTimeout(r, unit * (3 + Number(farnsworth.value))))
  }
}

playBtn.onclick = async () => {
  await audioCtx.resume()
  playId++
  stopAllAudio()
  const token = playId
  playBtn.classList.add("playing")
  reveal.textContent = "Played Callsign: —"

  for (let c of currentCalls) {
    await playMorse(c, token)
    if (token !== playId) return
    await new Promise(r => setTimeout(r, 400))
  }

  if (token === playId) playBtn.classList.remove("playing")
}

submitBtn.onclick = () => {
  attempts++
  const input = userInput.value.trim().toUpperCase().split(/\s+/)
  const ok = input.length === currentCalls.length && input.every((v,i)=>v===currentCalls[i])
  submitBtn.className = ok ? "correct" : "wrong"
  setTimeout(()=>submitBtn.className="",500)
  if (ok) correct++
  reveal.textContent = `Played Callsign: ${currentCalls.join("  ")}`
  const acc = Math.round(correct/attempts*100)
  stats.textContent = `Attempt: ${attempts} / 10 | Accuracy: ${acc}%`
  accuracyBar.style.width = acc+"%"
  userInput.value = ""

  if (attempts === MAX_ATTEMPTS) {
    if (acc === 100 && level < 4) {
      level++
      levelSelect.value = level
      wpm.value = LEVEL_WPM[level]
    }
    attempts = 0
    correct = 0
    accuracyBar.style.width = "0%"
    stats.textContent = "Attempt: 0 / 10 | Accuracy: 0%"
  }
  nextRound()
}

wpm.value = LEVEL_WPM[level]
nextRound()