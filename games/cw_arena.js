const AudioCtx = window.AudioContext || window.webkitAudioContext
const audioCtx = new AudioCtx()

let attempts = 0
let correct = 0
let level = 1
let currentItems = []
let playToken = 0

const MAX_ATTEMPTS = 10
const LEVEL_WPM = { 1:20, 2:25, 3:30, 4:35 }
const ITEMS_PER_LEVEL = { 1:1, 2:2, 3:2, 4:2 }
const ABBR_PROB = { 1:0.7, 2:0.4, 3:0.2, 4:0.1 }

const PREFIXES = [
  "AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL",
  "K","N","W",
  "VE","VA","VO","VY",
  "DL","F","G","M","GM","MM","GI","MI","GW","MW",
  "EI",
  "ON","PA","PB","PC","PD","PE","PF","PG","PH","PI",
  "LX","HB","OE",
  "SM","OH","OZ","LA","TF",
  "I","EA","CT","SV",
  "9A","S5","YU","T7","Z3","SP","OK","OL","OM",
  "HA","LZ","YO","ER","ES","YL","LY",
  "UA","UB","UC","UD","UE","UF","UG","UH","UI","UR",
  "EU","EV","EK","4L","UN",
  "JA","JE","JF","JG","JH","JI",
  "BY","HL","BV","VR","XX9",
  "VU","AP","4S","9N","S2",
  "9M2","9M6","9M8",
  "HS",
  "YB","YC","YE","YF",
  "DU","XV","XU",
  "9V",
  "4X","4Z",
  "A7","A6","HZ","EP","YI","OD","TA",
  "ZS","ZR",
  "5H","5X","5Z",
  "SU","CN","3V","7X",
  "9J","9K","A5",
  "KP4","CO","J6","J3","PJ2","PJ4",
  "XE","TG","TI","HP","YN",
  "PY","LU","CX","CE","HK","YV","OA","HC","CP","ZP",
  "VK","ZL",
  "P29","FO","KH6"
]

const CW_ABBR = [
  { a:"72",  d:"Best wishes QRP" },
  { a:"73",  d:"Best regards" },
  { a:"88",  d:"Love and kisses" },
  { a:"99",  d:"Go away" },

  { a:"AA",  d:"All after" },
  { a:"AB",  d:"All before" },
  { a:"ABT", d:"About" },
  { a:"ADR", d:"Address" },
  { a:"AGN", d:"Again" },
  { a:"ANR", d:"Another" },
  { a:"ANT", d:"Antenna" },
  { a:"ARND",d:"Around" },
  { a:"AS",  d:"Wait" },

  { a:"BCI", d:"Broadcast interference" },
  { a:"BCNU",d:"Be seeing you" },
  { a:"BEAM",d:"Directional antenna (typically a Yagi)" },
  { a:"BK",  d:"Break" },
  { a:"BN",  d:"All between" },
  { a:"BTR", d:"Better" },
  { a:"BTU", d:"Back to you" },
  { a:"BUG", d:"Semi-automatic key" },
  { a:"BURO",d:"QSL bureau" },
  { a:"B4",  d:"Before" },

  { a:"CFM", d:"Confirm" },
  { a:"CL",  d:"Clear" },
  { a:"CQ",  d:"Calling any station" },
  { a:"CW",  d:"Continuous waves" },

  { a:"DE",  d:"From / This is" },
  { a:"DX",  d:"Distance / DX" },

  { a:"EL",  d:"Element (e.g. in a Yagi antenna)" },
  { a:"FB",  d:"Fine business" },

  { a:"GA",  d:"Go ahead / Good afternoon" },
  { a:"GD",  d:"Good day" },
  { a:"GE",  d:"Good evening" },
  { a:"GL",  d:"Good luck" },
  { a:"GM",  d:"Good morning" },
  { a:"GN",  d:"Good night" },
  { a:"GND", d:"Ground system or ground-mounted antenna" },
  { a:"GP",  d:"Ground-plane antenna" },

  { a:"HI",  d:"Laughter" },
  { a:"HR",  d:"Here" },
  { a:"HW",  d:"How copy" },

  { a:"K",   d:"Over" },
  { a:"KN",  d:"Over to named station only" },

  { a:"LW",  d:"Long-wire antenna" },

  { a:"OM",  d:"Old man" },

  { a:"RR",  d:"Received / Roger Roger" },
  { a:"RST", d:"Signal report" },

  { a:"SK",  d:"End of contact / Silent key" },
  { a:"SO",  d:"Usually before HW (How copy)" },

  { a:"TNX", d:"Thanks" },
  { a:"TU",  d:"Thank you" },

  { a:"UR",  d:"Your / You are" },

  { a:"VERT",d:"Vertical antenna" },
  { a:"VY",  d:"Very" },

  { a:"WX",  d:"Weather" },

  { a:"YAGI",d:"Specific type of directional beam antenna" }
]

const MORSE = {
A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",
H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",
O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",
V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",
0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",
6:"-....",7:"--...",8:"---..",9:"----."
}

const $ = id => document.getElementById(id)

const randomCallsign = () => {
  const p = PREFIXES[Math.random() * PREFIXES.length | 0]
  return p + (Math.random() * 10 | 0) +
         String.fromCharCode(65 + Math.random() * 26 | 0)
}

const generateItem = () => {
  if (Math.random() < ABBR_PROB[level]) {
    const a = CW_ABBR[Math.random() * CW_ABBR.length | 0]
    return { play: a.a, expected: a.a, display: `${a.a} — ${a.d}` }
  }
  const c = randomCallsign()
  return { play: c, expected: c, display: c }
}

const nextRound = () => {
  currentItems = []
  for (let i = 0; i < ITEMS_PER_LEVEL[level]; i++) {
    currentItems.push(generateItem())
  }
}

const playTone = (dur, token) => {
  if (token !== playToken) return
  const o = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  o.frequency.value = tone.value
  g.gain.value = volume.value / 100
  o.connect(g)
  g.connect(audioCtx.destination)
  o.start()
  o.stop(audioCtx.currentTime + dur / 1000)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

const playMorse = async (txt, token) => {
  const unit = 1200 / wpm.value
  const fGap = Number(farnsworth.value) * unit

  for (const c of txt) {
    const code = MORSE[c]
    if (!code) continue

    for (const s of code) {
      playTone(s === "." ? unit : unit * 3, token)
      await sleep(s === "." ? unit * 2 : unit * 4)
    }
    await sleep(unit * 3 + fGap)
  }
}

const playBtn = $("playBtn")
const submitBtn = $("submitBtn")
const userInput = $("userInput")
const reveal = $("reveal")
const stats = $("stats")
const accuracyBar = $("accuracyBar")
const wpm = $("wpm")
const farnsworth = $("farnsworth")
const tone = $("tone")
const volume = $("volume")
const levelBadge = $("levelBadge")
const themeToggle = $("themeToggle")

const updateLabels = () => {
  $("wpmLabel").textContent = `WPM ${wpm.value}`
  $("farnsworthLabel").textContent = `Farnsworth ${farnsworth.value}`
  $("toneLabel").textContent = `Tone ${tone.value} Hz`
  $("volumeLabel").textContent = `Volume ${volume.value}%`
  levelBadge.textContent = level
}

[wpm, farnsworth, tone, volume].forEach(r => r.oninput = updateLabels)

playBtn.onclick = async () => {
  await audioCtx.resume()

  playToken++
  const token = playToken

  playBtn.classList.add("playing")
  reveal.textContent = "—"

  for (const item of currentItems) {
    if (token !== playToken) break

    await playMorse(item.play, token)
    await new Promise(r => setTimeout(r, 400))
  }

  if (token === playToken) {
    playBtn.classList.remove("playing")
  }
}


submitBtn.onclick = () => {
  if (!userInput.value.trim()) return

  attempts++
  const input = userInput.value.trim().toUpperCase().split(/\s+/)
  const expected = currentItems.map(i => i.expected)

  const ok =
    input.length === expected.length &&
    input.every((v, i) => v === expected[i])

  if (ok) correct++

  submitBtn.classList.remove("correct", "wrong")
  submitBtn.classList.add(ok ? "correct" : "wrong")
  setTimeout(() => submitBtn.classList.remove("correct", "wrong"), 500)

  reveal.textContent = currentItems.map(i => i.display).join(" | ")

  const acc = Math.round(correct / attempts * 100)
  stats.textContent = `Attempt: ${attempts} / ${MAX_ATTEMPTS} | Accuracy: ${acc}%`
  accuracyBar.style.width = acc + "%"

  userInput.value = ""

  if (attempts === MAX_ATTEMPTS) {
    if (acc === 100 && level < 4) level++
    attempts = correct = 0
    accuracyBar.style.width = "0%"
  }

  wpm.value = LEVEL_WPM[level]
  updateLabels()
  nextRound()
}

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

wpm.value = LEVEL_WPM[level]
updateLabels()
nextRound()