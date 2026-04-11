const toggleBtn=document.getElementById("toggleTheme")

toggleBtn.onclick=()=>{
document.body.classList.toggle("light-mode")
}

const sections=document.querySelectorAll(".section")

const observer=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
entry.target.classList.add("visible")
}
})
},{threshold:.2})

sections.forEach(section=>observer.observe(section))

document.querySelectorAll("#emailMeBtn").forEach(btn=>{
btn.onclick=()=>{
window.location.href="mailto:kshitij.mishra@hotmail.com"
}
})

document.querySelectorAll("#zedaInBtn").forEach(btn=>{
btn.onclick=()=>{
window.open("https://zeda.in","_blank")
}
})

document.querySelectorAll("#vidyutraBtn").forEach(btn=>{
btn.onclick=()=>{
window.open("https://vidyutra.com","_blank")
}
})

document.getElementById("morseCodeBtn").onclick=()=>{
window.open("https://kshitijmishra.in/mt_web/morse-translator.html","_blank")
}

document.getElementById("cwArenaBtn").onclick=()=>{
window.open("https://kshitijmishra.in/games/cw_arena.html","_blank")
}

document.getElementById("hamRadioLoggerBtn").onclick=()=>{
window.open("https://kshitijmishra.in/logger/logger.html","_blank")
}

document.addEventListener("mousemove",e=>{
const glow=document.createElement("div")
glow.style.position="fixed"
glow.style.left=e.clientX+"px"
glow.style.top=e.clientY+"px"
glow.style.width="4px"
glow.style.height="4px"
glow.style.background="rgba(0,245,255,0.6)"
glow.style.borderRadius="50%"
glow.style.pointerEvents="none"
glow.style.zIndex="9999"
document.body.appendChild(glow)
setTimeout(()=>glow.remove(),200)
})

let keys=[]

window.addEventListener("keydown",e=>{
keys.push(e.key.toLowerCase())
keys=keys.slice(-4)
if(keys.join("")==="zeda"){
document.body.classList.toggle("light-mode")
alert("ZEDA MODE ⚡")
}
})