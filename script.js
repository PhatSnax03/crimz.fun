document.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("bg-music");
  const toggleBtn = document.getElementById("music-toggle");
  const enterBtn = document.getElementById("enter-arcade-btn");
  const gamesSection = document.getElementById("games");
  const heroOrbital = document.getElementById("hero-orbital");

  const sphere = document.getElementById("orangeSphere");
  const fireflyContainer = document.getElementById("fireflyContainer");

  /* =========================
     MUSIC
  ========================= */

  if (music && toggleBtn) {
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
  }

  /* =========================
     ENTER ARCADE BUTTON
  ========================= */

  function openArcade(autoScroll = true) {
    if (!gamesSection) return;

    gamesSection.classList.remove("hidden-games");
    gamesSection.classList.add("show-games");

    if (window.innerWidth <= 640 && heroOrbital) {
      heroOrbital.style.display = "none";
    }

    if (enterBtn) {
      enterBtn.style.display = "none";
    }

    if (autoScroll) {
      setTimeout(() => {
        gamesSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
    }
  }

  if (enterBtn) {
    enterBtn.addEventListener("click", () => {
      openArcade(true);
    });
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("arcade") === "open") {
    openArcade(false);
  }

  /* =========================
     EASTER EGG SPHERE
  ========================= */

  let tapCount = 0;
  let opened = false;
  const tapsToOpen = 6;

  function handleSphereTap() {
    if (!sphere || !fireflyContainer || opened) return;

    tapCount++;

    sphere.classList.remove("tapped", "cracking");
    void sphere.offsetWidth;
    sphere.classList.add("tapped");

    if (tapCount >= 2) sphere.classList.add("show-crack-1");
    if (tapCount >= 4) sphere.classList.add("show-crack-2");
    if (tapCount >= 5) {
      sphere.classList.add("show-crack-3");
      sphere.classList.add("cracking");
    }

    if (tapCount >= tapsToOpen) {
      openSphere();
    }
  }

  function openSphere() {
    if (!sphere) return;

    opened = true;
    sphere.classList.add("open");
    releaseFireflies(28);
  }

  function releaseFireflies(count) {
    if (!sphere || !fireflyContainer) return;

    const sphereRect = sphere.getBoundingClientRect();
    const containerRect = fireflyContainer.getBoundingClientRect();

    const originX = sphereRect.left - containerRect.left + sphereRect.width / 2;
    const originY = sphereRect.top - containerRect.top + sphereRect.height / 2;

    for (let i = 0; i < count; i++) {
      const fly = document.createElement("span");
      fly.className = "firefly";

      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.9 - 0.45);
      const distance = 90 + Math.random() * 140;
      const driftX = Math.cos(angle) * distance;
      const driftY = Math.sin(angle) * distance - 80 - Math.random() * 120;
      const duration = 1800 + Math.random() * 1600;
      const size = 4 + Math.random() * 6;

      fly.style.left = `${originX}px`;
      fly.style.top = `${originY}px`;
      fly.style.width = `${size}px`;
      fly.style.height = `${size}px`;

      fireflyContainer.appendChild(fly);

      fly.animate(
        [
          {
            transform: "translate(0, 0) scale(0.7)",
            opacity: 0
          },
          {
            transform: `translate(${driftX * 0.35}px, ${driftY * 0.35}px) scale(1)`,
            opacity: 1,
            offset: 0.2
          },
          {
            transform: `translate(${driftX}px, ${driftY}px) scale(0.85)`,
            opacity: 0
          }
        ],
        {
          duration,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );

      setTimeout(() => fly.remove(), duration);
    }
  }

  if (sphere) {
    sphere.addEventListener("click", handleSphereTap);

    sphere.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSphereTap();
      }
    });
  }
});
