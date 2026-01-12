const AudioCtx = window.AudioContext || window.webkitAudioContext
const audioCtx = new AudioCtx()

let attempts = 0
let correct = 0
let level = 1
let currentCalls = []
let playId = 0

const MAX_ATTEMPTS = 10
const LEVEL_WPM = { 1:20, 2:25, 3:30, 4:35 }
const CALLS_PER_LEVEL = { 1:1, 2:2, 3:2, 4:2 }

const PREFIXES = ["AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL","K","N","W","VE","VA","VO","VY","DL","F","G","M","GM","MM","GI","MI","GW","MW","EI","ON","PA","PB","PC","PD","PE","PF","PG","PH","PI","LX","HB","OE","SM","OH","OZ","LA","TF","I","EA","CT","SV","9A","S5","YU","T7","Z3","SP","OK","OL","OM","HA","LZ","YO","ER","ES","YL","LY","UA","UB","UC","UD","UE","UF","UG","UH","UI","UR","EU","EV","EK","4L","UN","JA","JE","JF","JG","JH","JI","BY","HL","BV","VR","XX9","VU","AP","4S","9N","S2","9M2","9M6","9M8","HS","YB","YC","YE","YF","DU","XV","XU","9V","4X","4Z","A7","A6","HZ","EP","YI","OD","TA","ZS","ZR","5H","5X","5Z","SU","CN","3V","7X","9J","9K","A5","KP4","CO","J6","J3","PJ2","PJ4","XE","TG","TI","HP","YN","PY","LU","CX","CE","HK","YV","OA","HC","CP","ZP","VK","ZL","P29","FO","KH6"]

const MORSE = {
  A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",
  H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",
  O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",
  V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",
  0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",
  6:"-....",7:"--...",8:"---..",9:"----."
}

const $ = id => document.getElementById(id)

const playBtn = $("playBtn")
const submitBtn = $("submitBtn")
const userInput = $("userInput")
const stats = $("stats")
const reveal = $("reveal")
const accuracyBar = $("accuracyBar")
const levelSelect = $("level")
const wpm = $("wpm")
const farnsworth = $("farnsworth")
const tone = $("tone")
const volume = $("volume")
const themeToggle = $("themeToggle")

const wpmLabel = $("wpmLabel")
const farnsworthLabel = $("farnsworthLabel")
const toneLabel = $("toneLabel")
const volumeLabel = $("volumeLabel")

const updateLabels = () => {
  wpmLabel.textContent = `WPM ${wpm.value}`
  farnsworthLabel.textContent = `Farnsworth ${farnsworth.value}`
  toneLabel.textContent = `Tone ${tone.value} Hz`
  volumeLabel.textContent = `Volume ${volume.value}%`
}

const syncParams = () => {
  wpm.value = LEVEL_WPM[level]
  levelSelect.value = level
  updateLabels()
}

document.querySelectorAll("input[type=range]").forEach(r => r.oninput = updateLabels)

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
  const prefix = PREFIXES[Math.random()*PREFIXES.length|0]
  const number = Math.random()*10|0
  const len = Math.random() < 0.2 ? 1 : Math.random() < 0.75 ? 2 : 3
  return prefix + number + [...Array(len)].map(()=>String.fromCharCode(65+Math.random()*26|0)).join("")
}

const nextRound = () => {
  currentCalls = Array.from({length: CALLS_PER_LEVEL[level]}, randomCallsign)
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
  setTimeout(() => osc.stop(), duration)
}

const playMorse = async (text, token) => {
  const unit = 1200 / wpm.value
  for (const c of text) {
    for (const s of MORSE[c]) {
      if (token !== playId) return
      playTone(s === "." ? unit : unit*3, token)
      await new Promise(r => setTimeout(r, s === "." ? unit*2 : unit*4))
    }
    await new Promise(r => setTimeout(r, unit*(3 + Number(farnsworth.value))))
  }
}

playBtn.onclick = async () => {
  await audioCtx.resume()
  playId++
  const token = playId
  playBtn.classList.add("playing")
  reveal.textContent = "Played Callsign: —"

  for (const c of currentCalls) {
    await playMorse(c, token)
    await new Promise(r => setTimeout(r, 400))
  }
  playBtn.classList.remove("playing")
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
  accuracyBar.style.width = acc + "%"

  userInput.value = ""

  if (attempts === MAX_ATTEMPTS) {
    if (acc === 100 && level < 4) {
      level++
      syncParams()
    }
    attempts = 0
    correct = 0
    accuracyBar.style.width = "0%"
    stats.textContent = "Attempt: 0 / 10 | Accuracy: 0%"
  }
  nextRound()
}

syncParams()
nextRound()