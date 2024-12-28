function sendEmail() {
    window.location.href = "mailto:vu2jdc@gmail.com";
}

function openMorsePage() {
    window.open('morse-translator.html', '_blank');
}

function openZedaIn() {
    window.open('https://zeda.in', '_blank');
}
document.addEventListener("DOMContentLoaded", () => {
  const clearButton = document.getElementById("clearButton");
  const textArea = document.getElementById("input");
  const speedSlider = document.getElementById("speed");
  const speedValue = document.getElementById("speedValue");
  const toneSlider = document.getElementById("tone");
  const toneValue = document.getElementById("toneValue");
  const volumeSlider = document.getElementById("volume");
  const volumeValue = document.getElementById("volumeValue");

  // Clear textarea
  clearButton.addEventListener("click", () => {
    textArea.value = "";
  });

  // Update WPM value
  speedSlider.addEventListener("input", () => {
    speedValue.textContent = speedSlider.value;
  });

  // Update tone frequency value
  toneSlider.addEventListener("input", () => {
    toneValue.textContent = toneSlider.value;
  });

  // Update volume value
  volumeSlider.addEventListener("input", () => {
    volumeValue.textContent = `${volumeSlider.value}%`;
  });
});
