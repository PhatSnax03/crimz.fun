document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("bg-music");
  const toggleBtn = document.getElementById("music-toggle");

  if (!music || !toggleBtn) return;

  // Keep background music subtle
  music.volume = 0.15;

  // Start in paused state
  toggleBtn.textContent = "🔇";

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
