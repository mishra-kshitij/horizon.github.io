const AudioCtx = window.AudioContext || window.webkitAudioContext
let audioCtx = null

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx()
  if (audioCtx.state === "suspended") audioCtx.resume()
}

let attempts = 0
let correct = 0
let level = 1
let currentItems = []

const MAX_ATTEMPTS = 10
const LEVEL_WPM = {1:20,2:25,3:30,4:35}
const ITEMS_PER_LEVEL = {1:1,2:2,3:2,4:2}

const MORSE = {
  A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",
  H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",
  O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",
  V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",
  0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",
  6:"-....",7:"--...",8:"---..",9:"----."
}

const ABBR = [
  ["AA","All after"],["AB","All before"],["ABT","About"],["ADR","Address"],
  ["AGN","Again"],["ANR","Another"],["ANT","Antenna"],["ARND","Around"],
  ["AS","Wait"],["BCI","Broadcast interference"],["BCNU","Be seeing you"],
  ["BK","Break"],["BN","All between"],["BTR","Better"],["BTU","Back to you"],
  ["BUG","Semi-automatic key"],["BURO","QSL bureau"],["B4","Before"],
  ["C","Yes / Correct"],["CFM","Confirm"],["CL","Clear"],
  ["CQ","Calling any station"],["CW","Continuous wave"],
  ["DE","From / This is"],["DX","Distance / DX"],
  ["FB","Fine business"],["GA","Go ahead"],["GE","Good evening"],
  ["GM","Good morning"],["GL","Good luck"],["GN","Good night"],
  ["HI","Laughter"],["HR","Here"],["HW","How copy"],
  ["K","Over"],["KN","Over – named station only"],
  ["OM","Old man"],["R","Received"],
  ["RST","Signal report"],["SK","End of contact / Silent key"],
  ["TNX","Thanks"],["TU","Thank you"],
  ["UR","Your / You are"],["VY","Very"],
  ["WX","Weather"],
  ["72","Best wishes QRP"],["73","Best regards"],
  ["77","Long live CW"],["88","Love and kisses"],["99","Go away"]
].map(([k,d]) => ({ k, d }))

const PREFIXES = [
  "K","N","W","AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL",
  "DL","F","G","I","EA","CT","SV","PA","ON","HB","OE","SM","OH","OZ","LA",
  "JA","JE","JF","JG","JH","JI","HL","BY","VK","ZL","VU","ZS","PY","LU",
  "CX","CE","HK","YV","OA","HC","CP","ZP","TG","TI","HP","YN","XE","CO",
  "9A","S5","OM","HA","SP","OK","YO","LZ","ER","ES","YL","LY",
  "HS","YB","YC","YE","YF","DU","9V","4X","4Z","A6","A7","HZ","EP",
  "TA","SU","CN","3V","7X","9J","9K","A5","KP4","J6","J3","PJ2","PJ4",
  "P29","FO","KH6"
]

const $ = id => document.getElementById(id)

const playBtn = $("playBtn")
const submitBtn = $("submitBtn")
const userInput = $("userInput")
const reveal = $("reveal")
const meaning = $("meaning")
const stats = $("stats")
const accuracyBar = $("accuracyBar")

const wpm = $("wpm")
const farnsworth = $("farnsworth")
const tone = $("tone")
const volume = $("volume")

const wait = ms => new Promise(r => setTimeout(r, ms))

function playTone(ms) {
  ensureAudio()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.frequency.value = tone.value
  gain.gain.value = volume.value / 100

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.start()
  osc.stop(audioCtx.currentTime + ms / 1000)
}

async function playMorse(text) {
  const unit = 1200 / wpm.value
  for (const ch of text) {
    if (!MORSE[ch]) continue
    for (const s of MORSE[ch]) {
      playTone(s === "." ? unit : unit * 3)
      await wait(s === "." ? unit * 2 : unit * 4)
    }
    await wait(unit * (3 + Number(farnsworth.value)))
  }
}

const randCall = () =>
  PREFIXES[Math.random()*PREFIXES.length|0] +
  (Math.random()*9|0) +
  String.fromCharCode(65+Math.random()*26|0)

const randAbbr = () => ABBR[Math.random()*ABBR.length|0]

function nextRound() {
  currentItems = []
  reveal.textContent = "Last Played: —"
  meaning.textContent = ""

  while (currentItems.length < ITEMS_PER_LEVEL[level]) {
    if (Math.random() > 0.6) {
      currentItems.push({t: randCall(), type:"call"})
    } else {
      const a = randAbbr()
      currentItems.push({t:a.k, d:a.d, type:"abbr"})
    }
  }
}

playBtn.onclick = async () => {
  ensureAudio()
  for (const i of currentItems) {
    await playMorse(i.t)
    await wait(400)
  }
}

submitBtn.onclick = () => {
  attempts++
  const input = userInput.value.trim().toUpperCase()
  const expected = currentItems.map(i=>i.t).join(" ")

  if (input === expected) correct++

  reveal.textContent = "Last Played: " + expected
  meaning.textContent = currentItems
    .filter(i=>i.type==="abbr")
    .map(i=>i.d)
    .join(" | ")

  const acc = Math.round((correct/attempts)*100)
  stats.textContent = `Attempt: ${attempts}/${MAX_ATTEMPTS} | Accuracy: ${acc}%`
  accuracyBar.style.width = acc + "%"

  userInput.value = ""

  if (attempts === MAX_ATTEMPTS) {
    if (acc === 100 && level < 4) level++
    attempts = correct = 0
    accuracyBar.style.width = "0%"
  }

  nextRound()
}

nextRound()
