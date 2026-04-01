document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("bg-music");
  const toggleBtn = document.getElementById("music-toggle");

  if (!music || !toggleBtn) return;

  // subtle volume
  music.volume = 0.15;

  // default state
  toggleBtn.textContent = "🔇";

  // toggle play/pause
  toggleBtn.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        toggleBtn.textContent = "🔊";
      } catch (err) {
        console.log("Playback blocked:", err);
      }
    } else {
      music.pause();
      toggleBtn.textContent = "🔇";
    }
  });
});
