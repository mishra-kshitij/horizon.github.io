const morseCode = {
  'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
  'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
  'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
  's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
  'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
  '9': '----.', '0': '-----', '.': '.-.-.-', '&': '.-...', '@': '.--.-.',
  ' ': '/', ')': '-.--.-', '(': '-.--.', ':': '---...', ',': '--..--', '=': '-...-',
  '!': '-.-.--', '.': '.-.-.-', '-': '-....-', '+': '.-.-.', '?': '..--..', '/': '-..-.', 
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
let oscillators = [];
let isPlaying = false;

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

translateButton.addEventListener('click', () => {
  const text = inputField.value.toLowerCase();
  let morse = '';
  isPlaying = true;

  initializeAudioContext();
  clearOscillators();

  text.split('').forEach(char => {
    if (morseCode[char]) morse += morseCode[char] + ' ';
  });

  displayArea.textContent = morse.trim();
  playMorse(morse.trim());
});

stopButton.addEventListener('click', () => {
  isPlaying = false;
  clearOscillators();
});

clearButton.addEventListener('click', () => {
  inputField.value = '';
  displayArea.textContent = '';
  clearOscillators();
  isPlaying = false;
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

function initializeAudioContext() {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.gain.value = volumeControl.value / 100;
    gainNode.connect(audioContext.destination);
  }
}

function playMorse(morse) {
  const wpm = parseInt(speedControl.value, 10);
  const unitDuration = 1200 / wpm;
  const toneFrequency = parseInt(toneControl.value, 10);

  let currentTime = audioContext.currentTime;

  morse.split('').forEach(symbol => {
    if (!isPlaying) return;

    switch (symbol) {
      case '.':
        scheduleBeep(currentTime, unitDuration, toneFrequency);
        currentTime += unitDuration / 1000 + unitDuration / 1000;
        break;
      case '-':
        scheduleBeep(currentTime, unitDuration * 3, toneFrequency);
        currentTime += (unitDuration * 3) / 1000 + unitDuration / 1000;
        break;
      case ' ':
        currentTime += (unitDuration * 3) / 1000;
        break;
      case '/':
        currentTime += (unitDuration * 7) / 1000;
        break;
    }
  });
}

function scheduleBeep(startTime, duration, frequency) {
  const oscillator = audioContext.createOscillator();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  oscillator.connect(gainNode);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000);

  oscillators.push(oscillator);
}

function clearOscillators() {
  oscillators.forEach(oscillator => oscillator.stop());
  oscillators = [];
}
