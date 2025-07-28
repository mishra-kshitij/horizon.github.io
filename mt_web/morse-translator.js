const morseCode = {
  'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
  'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
  'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
  's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
  'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
  '9': '----.', '0': '-----', '.': '.-.-.-', '&': '.-...', '@': '.--.-.',
  ' ': '/', ')': '-.--.-', '(': '-.--.', ':': '---...', ',': '--..--', '=': '-...-',
  '!': '-.-.--', '-': '-....-', '+': '.-.-.', '?': '..--..', '/': '-..-.', 
  '"': '.-..-.',
};

const inputField = document.getElementById('input');
const displayArea = document.getElementById('display');
const translateButton = document.getElementById('translateButton');
const stopButton = document.getElementById('stopButton');
const clearButton = document.getElementById('clearButton');
const speedControl = document.getElementById('speed');
const toneControl = document.getElementById('tone');
const volumeControl = document.getElementById('volume');
const toggleDisplayButton = document.getElementById('toggleDisplayButton');
const speedValue = document.getElementById('speedValue');
const toneValue = document.getElementById('toneValue');
const volumeValue = document.getElementById('volumeValue');

let audioContext;
let gainNode;
let isPlaying = false;
let playQueue = [];

function initializeAudioContext() {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.gain.value = volumeControl.value / 100;
    gainNode.connect(audioContext.destination);
  }
}

function scheduleTone(duration) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(parseInt(toneControl.value), audioContext.currentTime);
  oscillator.connect(gainNode);
  gainNode.gain.setTargetAtTime(volumeControl.value / 100, audioContext.currentTime, 0.01);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

function playMorse(morse) {
  initializeAudioContext();
  let idx = 0;
  let currentTime = Date.now();

  const playNext = () => {
    if (!isPlaying || idx >= morse.length) return;

    const wpm = parseInt(speedControl.value);
    const unit = 1200 / wpm;

    const char = morse[idx];
    idx++;

    if (char === '.') {
      scheduleTone(unit);
      setTimeout(playNext, unit + unit);
    } else if (char === '-') {
      scheduleTone(unit * 3);
      setTimeout(playNext, unit * 3 + unit);
    } else if (char === ' ') {
      setTimeout(playNext, unit * 2);
    } else if (char === '/') {
      setTimeout(playNext, unit * 4);
    } else {
      playNext();
    }
  };

  playNext();
}

function clearQueue() {
  playQueue.forEach(clearTimeout);
  playQueue = [];
}

translateButton.addEventListener('click', () => {
  const text = inputField.value.toLowerCase();
  let morse = '';
  isPlaying = true;

  clearQueue();

  text.split('').forEach(char => {
    if (morseCode[char]) morse += morseCode[char] + ' ';
  });

  displayArea.textContent = morse.trim();
  playMorse(morse.trim());
});

stopButton.addEventListener('click', () => {
  isPlaying = false;
  clearQueue();
});

clearButton.addEventListener('click', () => {
  inputField.value = '';
  displayArea.textContent = '';
  isPlaying = false;
  clearQueue();
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

speedControl.addEventListener('input', () => {
  speedValue.textContent = speedControl.value;
});
toneControl.addEventListener('input', () => {
  toneValue.textContent = toneControl.value;
});
volumeControl.addEventListener('input', () => {
  volumeValue.textContent = volumeControl.value;
  if (gainNode) gainNode.gain.value = volumeControl.value / 100;
});