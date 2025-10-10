document.addEventListener('DOMContentLoaded', () => {
  const music = document.getElementById('bg-music');
  const toggleBtn = document.getElementById('music-toggle');

  // Try to kick off autoplay (iOS/Android may require a tap)
  if (music) {
    const tryPlay = () => music.play().catch(() => {});
    tryPlay();
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    document.addEventListener('click', tryPlay, { once: true });
  }

  if (toggleBtn && music) {
    const setIcon = () => { toggleBtn.textContent = music.muted ? '🔇' : '🔊'; };
    setIcon();
    toggleBtn.addEventListener('click', () => {
      music.muted = !music.muted;
      setIcon();
      if (!music.muted) music.play().catch(()=>{});
    });
  }
});
