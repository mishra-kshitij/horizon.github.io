const AudioCtx = window.AudioContext || window.webkitAudioContext
const audioCtx = new AudioCtx()

let attempts = 0
let correct = 0
let level = 1
let currentItems = []
let playId = 0

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
  ["AA","All after"],["AB","All before"],["ABT","About"],["ADR","Address"],["AGN","Again"],["ANR","Another"],["ANT","Antenna"],["ARND","Around"],["AS","Wait"],["BCI","Broadcast interference"],["BCNU","Be seeing you"],["BK","Break"],["BN","All between"],["BTR","Better"],["BTU","Back to you"],["BUG","Semi-automatic key"],["BURO","QSL bureau"],["B4","Before"],["C","Yes / Correct"],["CFM","Confirm"],["CL","Clear"],["SO","SO usually before HW-How copy"],["CQ","Calling any station"],["CW","Continuous waves"],["DE","From / This is"],["DX","Distance / DX"],["FB","Fine business"],["GA","Go ahead/Good afternoon"],["GE","Good evening"],["GM","Good morning"],["GL","Good luck"],["GN","Good night"],["GD","Good day"],["HI","Laughter"],["HR","Here"],["HW","How copy"],["K","Over"],["KN","Over to named station only"],["OM","Old man"],["R","Received / Roger Roger when R R"],["RST","Signal report"],["SK","End of contact / Silent key"],["TNX","Thanks"],["TU","Thank you"],["UR","Your / You are"],["VY","Very"],["WX","Weather"],["72","Best wishes QRP"],["73","Best regards"],["88","Love and kisses"],["99","Go away"]
].map(([k,d])=>({k,d}))
const PREFIXES = ["AA","AB","AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL","K","N","W","VE","VA","VO","VY","DL","F","G","M","GM","MM","GI","MI","GW","MW","EI","ON","PA","PB","PC","PD","PE","PF","PG","PH","PI","LX","HB","OE","SM","OH","OZ","LA","TF","I","EA","CT","SV","9A","S5","YU","T7","Z3","SP","OK","OL","OM","HA","LZ","YO","ER","ES","YL","LY","UA","UB","UC","UD","UE","UF","UG","UH","UI","UR","EU","EV","EK","4L","UN","JA","JE","JF","JG","JH","JI","BY","HL","BV","VR","XX9","VU","AP","4S","9N","S2","9M2","9M6","9M8","HS","YB","YC","YE","YF","DU","XV","XU","9V","4X","4Z","A7","A6","HZ","EP","YI","OD","TA","ZS","ZR","5H","5X","5Z","SU","CN","3V","7X","9J","9K","A5","KP4","CO","J6","J3","PJ2","PJ4","XE","TG","TI","HP","YN","PY","LU","CX","CE","HK","YV","OA","HC","CP","ZP","VK","ZL","P29","FO","KH6"]
const $ = id => document.getElementById(id)
const reveal = $("reveal")
const hint = $("hint")
const playBtn = $("playBtn")
const submitBtn = $("submitBtn")
const userInput = $("userInput")
const stats = $("stats")
const accuracyBar = $("accuracyBar")
const wpm = $("wpm")
const farnsworth = $("farnsworth")
const tone = $("tone")
const volume = $("volume")

const playTone = (dur, token) => {
  if (token !== playId) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.frequency.value = tone.value
  gain.gain.setValueAtTime(0, audioCtx.currentTime)
  gain.gain.linearRampToValueAtTime(volume.value/100, audioCtx.currentTime+0.01)
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime+dur/1000)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime+dur/1000)
}

const playMorse = async (txt, token) => {
  const unit = 1200 / wpm.value
  for (const c of txt) {
    if (!MORSE[c]) continue
    for (const s of MORSE[c]) {
      playTone(s==="."?unit:unit*3, token)
      await new Promise(r=>setTimeout(r, s==="."?unit*2:unit*4))
    }
    await new Promise(r=>setTimeout(r, unit*(3+Number(farnsworth.value))))
  }
}

const randCall = () =>
  PREFIXES[Math.random()*PREFIXES.length|0] +
  (Math.random()*10|0) +
  String.fromCharCode(65+Math.random()*26|0)

const randAbbr = () => ABBR[Math.random()*ABBR.length|0]

const nextRound = () => {
  currentItems=[]
  hint.textContent=""
  reveal.textContent="Last Played: —"

  const count = ITEMS_PER_LEVEL[level]

  while(currentItems.length<count){
    if(level===1 && Math.random()>0.7){
      currentItems.push({t:randCall(),type:"call"})
    } else {
      const a=randAbbr()
      currentItems.push({t:a.k,type:"abbr",d:a.d})
    }
  }

  const desc = currentItems.filter(i=>i.type==="abbr")
  if(desc.length){
    hint.textContent="Meaning: " + desc.map(i=>`${i.t} = ${i.d}`).join(" | ")
  }
}

playBtn.onclick = async ()=>{
  await audioCtx.resume()
  playId++
  for(const i of currentItems) await playMorse(i.t, playId)
}

submitBtn.onclick = ()=>{
  attempts++
  const input=userInput.value.trim().toUpperCase().split(/\s+/)
  const expected=currentItems.map(i=>i.t)
  const ok=input.join(" ")===expected.join(" ")

  if(ok) correct++

  reveal.textContent="Last Played: "+expected.join(" ")

  const acc=Math.round(correct/attempts*100)
  stats.textContent=`Attempt: ${attempts}/${MAX_ATTEMPTS} | Accuracy: ${acc}%`
  accuracyBar.style.width=acc+"%"

  userInput.value=""

  if(attempts===MAX_ATTEMPTS){
    if(acc===100 && level<4) level++
    attempts=correct=0
  }
  nextRound()
}

nextRound()
