document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleTheme');
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    toggleBtn.textContent = document.body.classList.contains('dark-mode')
      ? '☀️ Light Mode'
      : '🌙 Dark Mode';
  });

  const faders = document.querySelectorAll('section');
  const appearOnScroll = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        appearOnScroll.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  faders.forEach(section => appearOnScroll.observe(section));

  document.getElementById('emailMeBtn').addEventListener('click', () => {
    window.location.href = 'mailto:vu2jdc@gmail.com?subject=Let’s Connect!';
  });

  document.getElementById('morseCodeBtn').addEventListener('click', () => {
    window.open('https://kshitijmishra.in/morse-translator.html', '_blank');
  });

  document.getElementById('zedaInBtn').addEventListener('click', () => {
    window.open('https://zeda.in/', '_blank');
  });
});
