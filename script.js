document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("bg-music");
  const toggleBtn = document.getElementById("music-toggle");

  if (!music || !toggleBtn) return;

  music.volume = 0.15;

  const savedState = localStorage.getItem("crimz_music_state") || "paused";

  const updateButton = () => {
    toggleBtn.textContent = music.paused ? "🔇" : "🔊";
  };

  updateButton();

  if (savedState === "playing") {
    const tryResume = async () => {
      try {
        await music.play();
        updateButton();
      } catch (err) {
        updateButton();
      }
    };

    document.addEventListener("click", tryResume, { once: true });
    document.addEventListener("touchstart", tryResume, { once: true, passive: true });
  }

  toggleBtn.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        localStorage.setItem("crimz_music_state", "playing");
      } catch (err) {
        console.log("Playback blocked:", err);
      }
    } else {
      music.pause();
      localStorage.setItem("crimz_music_state", "paused");
    }

    updateButton();
  });
});
