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
const speedControl = document.getElementById('speed');
const toneControl = document.getElementById('tone');
const speedValue = document.getElementById('speedValue');
const toneValue = document.getElementById('toneValue');

let audioContext;
let oscillators = [];
let isPlaying = false;

speedControl.addEventListener('input', () => {
  speedValue.textContent = speedControl.value;
});

toneControl.addEventListener('input', () => {
  toneValue.textContent = toneControl.value;
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

function initializeAudioContext() {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playMorse(morse) {
  const wpm = parseInt(speedControl.value, 10);
  const unitDuration = 1200 / wpm; // 1 time unit in milliseconds
  const toneFrequency = parseInt(toneControl.value, 10);

  let currentTime = audioContext.currentTime;

  morse.split('').forEach(symbol => {
    if (!isPlaying) return;

    switch (symbol) {
      case '.': // Dit
        scheduleBeep(currentTime, unitDuration, toneFrequency);
        currentTime += unitDuration / 1000 + unitDuration / 1000; // Tone + intra-character space
        break;
      case '-': // Dah
        scheduleBeep(currentTime, unitDuration * 3, toneFrequency);
        currentTime += (unitDuration * 3) / 1000 + unitDuration / 1000;
        break;
      case ' ': // Inter-character space
        currentTime += (unitDuration * 3) / 1000; // Adjust based on Morse logic
        break;
      case '/': // Word space
        currentTime += (unitDuration * 7) / 1000;
        break;
    }
  });
}

function scheduleBeep(startTime, duration, frequency) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  oscillator.connect(gainNode).connect(audioContext.destination);

  gainNode.gain.setValueAtTime(1, startTime);
  gainNode.gain.setValueAtTime(0, startTime + duration / 1000);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000);

  oscillators.push(oscillator); // Track active oscillators
}

function clearOscillators() {
  oscillators.forEach(oscillator => oscillator.stop());
  oscillators = [];
}