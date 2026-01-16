const AudioCtx = window.AudioContext || window.webkitAudioContext
const audioCtx = new AudioCtx()
const IS_ANDROID = /Android/i.test(navigator.userAgent)

let attempts = 0
let correct = 0
let level = 1
let currentItems = []
let playToken = 0

let userWpmOverride = null

const MAX_ATTEMPTS = 10
const LEVEL_WPM = { 1:20, 2:25, 3:30, 4:35 }
const ITEMS_PER_LEVEL = { 1:1, 2:2, 3:2, 4:2 }
const ABBR_PROB = { 1:0.7, 2:0.4, 3:0.2, 4:0.1 }

const PREFIXES = [
  "AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL","AT","K","N","W",
  "KL","KP2","KP4","KH6","VE","VA","VO","VY","DL","F","G","M","GM","MM",
  "GI","MI","GW","MW","EI","GU","ON","PA","PB","PC","PD","PE","PF","PG",
  "PH","PI","LX","HB","OE","SM","OH","OZ","LA","TF","IS","TK","I","EA",
  "EA6","EA8","CT","SV","SV5","SV9","9A","S5","SP","OK","OM","HA","LZ",
  "YO","ER","ES","YL","LY","UA","UR","JA","JE","JF","JG","JH","JI","HL",
  "BY","BV","VR","XW","VU","VU2","VU3","AP","4S","9N","S2","9M2","9M4",
  "9M6","9M8","HS","YB","YC","YE","YF","DU","XV","XU","9V","A6","A7",
  "HZ","EP","YI","OD","TA","JY","ZS","ZR","ZS8","5H","5X","5Z","ET",
  "EL","5N","9G","7P","SU","CN","3V","7X","9J","9K","A5","KP4","CO",
  "J6","J3","PJ2","PJ4","XE","TG","TI","HP","YN","PY","LU","CX","CE",
  "HK","YV","OA","HC","CP","ZP","VK","VK9","VK0","ZL","P29","FO","VP6"
]

const CW_ABBR = [
  { a:"72",  d:"Best wishes QRP" },{ a:"73",  d:"Best regards" },
  { a:"88",  d:"Love and kisses" },{ a:"99",  d:"Go away" },
  { a:"AA",  d:"All after" },{ a:"AB",  d:"All before" },
  { a:"ABT", d:"About" },{ a:"ADR", d:"Address" },
  { a:"AGN", d:"Again" },{ a:"AGN?", d:"Again?" },
  { a:"ANR", d:"Another" },
  { a:"ANT", d:"Antenna" },{ a:"ARND",d:"Around" },
  { a:"AR",  d:"End of message" },
  { a:"AS",  d:"Wait" },
  { a:"BCI", d:"Broadcast interference" },
  { a:"BCNU",d:"Be seeing you" },
  { a:"BEAM",d:"Directional antenna" },
  { a:"BK",  d:"Break" },
  { a:"BN",  d:"All between" },
  { a:"BT",  d:"Separator / Break between thoughts" },
  { a:"BTR", d:"Better" },
  { a:"BTU", d:"Back to you" },
  { a:"BUG", d:"Semi-automatic key" },
  { a:"BURO",d:"QSL bureau" },
  { a:"B4",  d:"Before" },
  { a:"CFM", d:"Confirm" },
  { a:"CL",  d:"Closing (I am closing my station)" },
  { a:"CLR",  d:"Clear" },
  { a:"CQ",  d:"Calling any station" },
  { a:"CQDX",d:"Calling distant stations" },
  { a:"CW",  d:"Continuous waves" },
  { a:"DE",  d:"From / This is" },
  { a:"DR",  d:"Dear" },
  { a:"DX",  d:"Distance / DX station" },
  { a:"DXCC",d:"DX Century Club" },
  { a:"EL",  d:"Element (e.g. in a Yagi antenna)" },
  { a:"ES",  d:"And" },
  { a:"FER", d:"For" },
  { a:"FB",  d:"Fine business" },
  { a:"UFB", d:"Ultra fine business" },
  { a:"GA",  d:"Go ahead / Good afternoon as per Context" },
  { a:"GD",  d:"Good or Good day as per Context" },
  { a:"GE",  d:"Good evening" },
  { a:"GL",  d:"Good luck" },
  { a:"GM",  d:"Good morning" },
  { a:"GN",  d:"Good night" },
  { a:"GND", d:"Ground system or ground-mounted antenna" },
  { a:"GP",  d:"Ground-plane antenna" },
  { a:"HI",  d:"Laughter" },
  { a:"HR",  d:"Here" },
  { a:"HW",  d:"How copy" },
  { a:"HW?", d:"How copy? Preceeded by SO" },
  { a:"K",   d:"Over / Go ahead" },
  { a:"KN",  d:"Over to named station only" },
  { a:"LID", d:"Poor operator" },
  { a:"LOG", d:"Logbook" },
  { a:"LOTW",d:"Logbook of The World" },
  { a:"LW",  d:"Long-wire antenna" },
  { a:"MSG", d:"Message" },
  { a:"NR",  d:"Number or Near as per Context" },
  { a:"NR?", d:"Number?" },
  { a:"NAME",d:"Operator's name" },
  { a:"OM",  d:"Old man or Male Radio Operator" },
  { a:"OP",  d:"Operator" },
  { a:"PFX", d:"Prefix" },
  { a:"PSE", d:"Please" },
  { a:"POTA",d:"Parks On The Air" },
  { a:"PWR", d:"Power" },
  { a:"QRK", d:"Readability" },
  { a:"QRL", d:"Busy" },
  { a:"QRM", d:"Man-made interference" },
  { a:"QRN", d:"Natural interference / static" },
  { a:"QRO", d:"Increase power" },
  { a:"QRP", d:"Decrease power" },
  { a:"QRQ", d:"Send faster" },
  { a:"QRS", d:"Send slower" },
  { a:"QRT", d:"Stop sending" },
  { a:"QRU", d:"Nothing more to send" },
  { a:"QRZ", d:"Who is calling me?" },
  { a:"QSB", d:"Fading" },
  { a:"QSK", d:"Break-in" },
  { a:"QSL", d:"Acknowledge receipt / Confirmation" },
  { a:"QRL?",d:"Is this Frequency in use?" },
  { a:"QSO", d:"Contact / communication" },
  { a:"QST", d:"General call to all stations" },
  { a:"QSY", d:"Change frequency" },
  { a:"QTC", d:"Message traffic" },
  { a:"QTH", d:"Location" },
  { a:"RR",  d:"Received / Roger Roger" },
  { a:"RST", d:"Signal report" },
  { a:"RPT", d:"Repeat or Report as per Context" },
  { a:"RPRT",d:"Report" },
  { a:"RIG", d:"Transmitter / transceiver" },
  { a:"SIG", d:"Signal" },
  { a:"SK",  d:"End of contact / Silent key" },
  { a:"SKED",d:"Scheduled time to meet" },
  { a:"SO",  d:"So, Usually used before HW (How copy)" },
  { a:"SOTA",d:"Summits On The Air" },
  { a:"SR",  d:"Sorry" },
  { a:"TEMP",d:"Temperature" },
  { a:"TEST",d:"Contest call" },
  { a:"TNX", d:"Thanks" },
  { a:"TU",  d:"Thank you" },
  { a:"UR",  d:"Your / You are" },
  { a:"VERT",d:"Vertical antenna" },
  { a:"VVV", d:"CW Test Signal" },
  { a:"VY",  d:"Very" },
  { a:"WX",  d:"Weather" },
  { a:"YL",  d:"Young Lady (female operator)" },
  { a:"XYL", d:"Wife of a radio operator" },
  { a:"YAGI",d:"Directional beam antenna" },
  { a:"FT8", d:"Digital weak-signal mode" },
  { a:"PSK", d:"Phase Shift Keying" },
  { a:"RBN", d:"Reverse Beacon Network" }
]

let sessionAbbrPool = [...CW_ABBR]

const MORSE = {
A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",
H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",
O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",
V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",
0:"-----",1:".----",2:"..---",3:"...--",4:"....-",5:".....",
6:"-....",7:"--...",8:"---..",9:"----.","?":"..--.."
}

const $ = id => document.getElementById(id)

const randomCallsign = () => {
  const prefix = PREFIXES[Math.random() * PREFIXES.length | 0]
  const r = Math.random()
  const totalLen = r < 0.4 ? 5 : r < 0.8 ? 6 : 7
  const digit = String(Math.random() * 10 | 0)
  const lettersNeeded = Math.max(
    1,
    totalLen - (prefix.length + 1)
  )

  let suffix = ""
  for (let i = 0; i < lettersNeeded; i++) {
    suffix += String.fromCharCode(65 + Math.random() * 26 | 0)
  }

  return prefix + digit + suffix
}

const getUniqueSessionAbbr = () => {
  if (!sessionAbbrPool.length) sessionAbbrPool = [...CW_ABBR]
  return sessionAbbrPool.splice(Math.random() * sessionAbbrPool.length | 0, 1)[0]
}

const generateItem = () => {
  if (Math.random() < ABBR_PROB[level]) {
    const a = getUniqueSessionAbbr()
    return { play:a.a, expected:a.a, display:`${a.a} — ${a.d}` }
  }
  const c = randomCallsign()
  return { play:c, expected:c, display:c }
}

const nextRound = () => {
  currentItems = []
  for (let i = 0; i < ITEMS_PER_LEVEL[level]; i++) {
    currentItems.push(generateItem())
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

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

document.addEventListener("keydown", e => {
  if (e.code === "Space") { e.preventDefault(); playBtn.click() }
  if (e.key === "Enter") { e.preventDefault(); submitBtn.click() }
})

userInput.addEventListener("keydown", e => {
  if (e.key !== "Backspace") return
  const pos = userInput.selectionStart
  if (pos > 0 && userInput.value[pos - 1] === " ") {
    e.preventDefault()
    userInput.value =
      userInput.value.slice(0, pos - 1) + userInput.value.slice(pos)
    userInput.selectionStart = userInput.selectionEnd = pos - 1
  }
})

userInput.addEventListener("input", () => {
  const value = userInput.value.toUpperCase()
  const parts = value.split(" ")
  const idx = parts.length - 1
  const current = currentItems[idx]
  if (!current) return
  if (parts[idx].length === current.expected.length && !value.endsWith(" ")) {
    userInput.value = value + " "
  }
})

userInput.addEventListener("blur", ()=>setTimeout(()=>userInput.focus(),50))

if (IS_ANDROID) {
  userInput.addEventListener("beforeinput", e => {
    if (e.inputType === "insertText" && e.data === " ") {
      e.preventDefault()
      playBtn.click()
    }
  })
}

playBtn.onclick = async () => {
  await audioCtx.resume()

  playToken++
  const token = playToken

  playBtn.classList.add("playing")
  reveal.textContent = "—"

  for (const item of currentItems) {
    if (token !== playToken) break
    await playMorse(item.play, token)
    await sleep(400)
  }

  playBtn.classList.remove("playing")
}

submitBtn.onclick = () => {
  if (!userInput.value.trim()) return
  attempts++

  const input = userInput.value.trim().toUpperCase().split(/\s+/)
  const expected = currentItems.map(i => i.expected)
  const ok = input.length === expected.length && input.every((v,i)=>v===expected[i])
  if (ok) correct++

  submitBtn.classList.add(ok ? "correct" : "wrong")
  setTimeout(()=>submitBtn.classList.remove("correct","wrong"),500)

  reveal.textContent = currentItems.map(i=>i.display).join(" | ")

  const acc = Math.round(correct / attempts * 100)
  stats.textContent = `Attempt: ${attempts} / ${MAX_ATTEMPTS} | Accuracy: ${acc}%`
  accuracyBar.style.width = acc + "%"

  userInput.value = ""
  userInput.focus()

  if (attempts === MAX_ATTEMPTS) {
    if (acc === 100 && level < 4) level++
    attempts = correct = 0
    accuracyBar.style.width = "0%"
  }

  const levelWpm = LEVEL_WPM[level]

  if (userWpmOverride !== null) {
    if (userWpmOverride >= levelWpm) {
      wpm.value = userWpmOverride
    } else {
      userWpmOverride = null
      wpm.value = levelWpm
    }
  } else {
    wpm.value = levelWpm
  }

  updateLabels()
  nextRound()
}

const updateLabels = () => {
  $("wpmLabel").textContent = `WPM ${wpm.value}`
  $("farnsworthLabel").textContent = `Farnsworth ${farnsworth.value}`
  $("toneLabel").textContent = `Tone ${tone.value} Hz`
  $("volumeLabel").textContent = `Volume ${volume.value}%`
  levelBadge.textContent = level
}

wpm.oninput = () => {
  userWpmOverride = Number(wpm.value)
  updateLabels()
}
;[farnsworth,tone,volume].forEach(r => r.oninput = updateLabels)

const savedTheme = localStorage.getItem("cw-theme")
if (savedTheme) {
  document.body.dataset.theme = savedTheme
  themeToggle.textContent = savedTheme === "light" ? "🌙" : "☀️"
}

themeToggle.onclick = () => {
  const isLight = document.body.dataset.theme === "light"
  const newTheme = isLight ? "" : "light"

  document.body.dataset.theme = newTheme
  localStorage.setItem("cw-theme", newTheme)

  themeToggle.textContent = newTheme === "light" ? "🌙" : "☀️"
}

wpm.value = LEVEL_WPM[level]
updateLabels()
nextRound()
userInput.focus()