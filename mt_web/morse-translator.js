const morseCode = {
  'a':'.-','b':'-...','c':'-.-.','d':'-..','e':'.','f':'..-.',
  'g':'--.','h':'....','i':'..','j':'.---','k':'-.-','l':'.-..',
  'm':'--','n':'-.','o':'---','p':'.--.','q':'--.-','r':'.-.',
  's':'...','t':'-','u':'..-','v':'...-','w':'.--','x':'-..-',
  'y':'-.--','z':'--..','1':'.----','2':'..---','3':'...--',
  '4':'....-','5':'.....','6':'-....','7':'--...','8':'---..',
  '9':'----.','0':'-----',' ': '/', '.':'.-.-.-', ',':'--..--',
  '?':'..--..','/':'-..-.','-':'-....-','(':'-.--.',')':'-.--.-',
  '=':'-...-','&':'.-...','@':'.--.-.','"':'.-..-.','_':'..--.-',
  ';':'-.-.-.','!':'-.-.--',':':'---...'
};

const inputField = document.getElementById('input');
const displayArea = document.getElementById('display');
const translateButton = document.getElementById('translateButton');
const stopButton = document.getElementById('stopButton');
const clearButton = document.getElementById('clearButton');
const speedControl = document.getElementById('speed');
const toneControl = document.getElementById('tone');
const volumeControl = document.getElementById('volume');
const speedValue = document.getElementById('speedValue');
const toneValue = document.getElementById('toneValue');
const volumeValue = document.getElementById('volumeValue');
const toggleDisplayButton = document.getElementById('toggleDisplayButton');
const showMeterCheckbox = document.getElementById('showMeter');
const meterCanvas = document.getElementById('meter');
const themeToggle = document.getElementById('themeToggle');

let audioContext, masterGain, analyser, meterCtx;
let isPlaying = false;
let meterAnimation;

function initAudio() {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    masterGain.connect(analyser);
    meterCtx = meterCanvas.getContext('2d');
    if (audioContext.state === 'suspended') audioContext.resume();
  }
  masterGain.gain.value = volumeControl.value / 100;
}

function drawMeter() {
  if (!showMeterCheckbox.checked || !analyser) return;
  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    const val = (dataArray[i] - 128) / 128;
    sum += val * val;
  }
  const rms = Math.sqrt(sum / bufferLength);
  const volume = masterGain.gain.value;
  const scalingFactor = 2.5; 
  const level = Math.min(1, rms * scalingFactor * volume);

  const isDark = document.body.classList.contains('dark');

  meterCtx.fillStyle = isDark ? "#222" : "#eee";
  meterCtx.fillRect(0, 0, meterCanvas.width, meterCanvas.height);
  meterCtx.fillStyle = "rgba(47, 200, 139, 0.6)";
  const barHeight = 12, y = (meterCanvas.height - barHeight) / 2;
  meterCtx.fillRect(0, y, meterCanvas.width * level, barHeight);

  if (isPlaying) meterAnimation = requestAnimationFrame(drawMeter);
}

function startMeter() {
  cancelAnimationFrame(meterAnimation);
  meterAnimation = requestAnimationFrame(drawMeter);
}

function stopMeter() {
  cancelAnimationFrame(meterAnimation);
  meterCtx.clearRect(0, 0, meterCanvas.width, meterCanvas.height);
}

showMeterCheckbox.addEventListener('change', () => {
  if (!showMeterCheckbox.checked) {
    stopMeter();
  } else if (isPlaying) {
    startMeter();
  }
});

function playTone(duration) {
  const freq = parseFloat(toneControl.value);
  const osc = audioContext.createOscillator();
  const g = audioContext.createGain();
  g.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  osc.connect(g);
  g.connect(masterGain);
  g.connect(analyser);

  const atk = 0.002, rel = 0.002;
  const start = audioContext.currentTime;
  const vol = masterGain.gain.value;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + atk);
  g.gain.setValueAtTime(vol, start + duration - rel);
  g.gain.linearRampToValueAtTime(0, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

async function playMorse(morse) {
  initAudio();
  isPlaying = true;
  if (showMeterCheckbox.checked) startMeter();
  const getUnit = () => 1.2 / parseInt(speedControl.value);
  for (const ch of morse) {
    if (!isPlaying) break;
    const unit = getUnit();
    if (ch === '.') {
      playTone(unit);
      await wait(unit * 2);
    } else if (ch === '-') {
      playTone(unit * 3);
      await wait(unit * 4);
    } else if (ch === ' ') {
      await wait(unit * 2);
    } else if (ch === '/') {
      await wait(unit * 6);
    }
  }
  stopPlayback();
}

function wait(sec) {
  return new Promise(r => setTimeout(r, sec * 1000));
}

function stopPlayback() {
  isPlaying = false;
  stopMeter();
}

translateButton.addEventListener('click', () => {
  initAudio();
  const text = inputField.value.toLowerCase();
  let morse = '';
  for (const c of text) morse += morseCode[c] ? morseCode[c] + ' ' : '';
  displayArea.textContent = morse.trim();
  if (morse.trim()) playMorse(morse.trim());
});

stopButton.addEventListener('click', stopPlayback);

clearButton.addEventListener('click', () => {
  inputField.value = '';
  displayArea.textContent = '';
  stopPlayback();
});

toggleDisplayButton.addEventListener('click', () => {
  if (displayArea.style.display === 'none') {
    displayArea.style.display = 'block';
    toggleDisplayButton.textContent = 'Hide Translation Box';
  } else {
    displayArea.style.display = 'none';
    toggleDisplayButton.textContent = 'Show Translation Box';
  }
});

speedControl.oninput = () => speedValue.textContent = speedControl.value;
toneControl.oninput = () => toneValue.textContent = toneControl.value;
volumeControl.oninput = () => {
  volumeValue.textContent = volumeControl.value;
  if (masterGain) masterGain.gain.value = volumeControl.value / 100;
};

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

function resizeMeter() {
  meterCanvas.width = meterCanvas.clientWidth;
}
window.addEventListener('resize', resizeMeter);
resizeMeter();

initAudio();