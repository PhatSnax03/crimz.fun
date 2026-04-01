document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("snake-canvas");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const bestScoreEl = document.getElementById("best-score");
  const finalScoreEl = document.getElementById("final-score");
  const restartBtn = document.getElementById("restart-btn");
  const playAgainBtn = document.getElementById("play-again-btn");
  const overlay = document.getElementById("game-over-overlay");
  const dpadButtons = document.querySelectorAll(".dpad-btn[data-dir]");

  const music = document.getElementById("bg-music");
  const toggleBtn = document.getElementById("music-toggle");

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

  const gridSize = 20;
  const tileCount = canvas.width / gridSize;

  let snake;
  let direction;
  let nextDirection;
  let food;
  let score;
  let bestScore = Number(localStorage.getItem("crimz_snake_best") || 0);
  let gameLoop;
  let gameSpeed = 135;
  let isGameOver = false;

  bestScoreEl.textContent = bestScore;

  function initGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    isGameOver = false;
    gameSpeed = 135;
    scoreEl.textContent = score;
    overlay.classList.add("hidden");

    placeFood();
    startLoop();
    draw();
  }

  function startLoop() {
    clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
  }

  function placeFood() {
    let valid = false;

    while (!valid) {
      food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
      };

      valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
  }

  function update() {
    if (isGameOver) return;

    direction = nextDirection;

    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    if (
      head.x < 0 ||
      head.x >= tileCount ||
      head.y < 0 ||
      head.y >= tileCount ||
      snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      endGame();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreEl.textContent = score;

      if (score > bestScore) {
        bestScore = score;
        bestScoreEl.textContent = bestScore;
        localStorage.setItem("crimz_snake_best", String(bestScore));
      }

      if (gameSpeed > 70) {
        gameSpeed -= 3;
        startLoop();
      }

      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function drawRoundedRect(x, y, size, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + size - radius, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
    ctx.lineTo(x + size, y + size - radius);
    ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    ctx.lineTo(x + radius, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    ctx.fillStyle = "#111318";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
    }

    // food
    drawRoundedRect(
      food.x * gridSize + 3,
      food.y * gridSize + 3,
      gridSize - 6,
      6,
      "#FAB12F"
    );

    // snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      drawRoundedRect(
        segment.x * gridSize + 2,
        segment.y * gridSize + 2,
        gridSize - 4,
        6,
        isHead ? "#ff8fd9" : "#ff66cc"
      );
    });
  }

  function endGame() {
    isGameOver = true;
    clearInterval(gameLoop);
    finalScoreEl.textContent = score;
    overlay.classList.remove("hidden");
  }

  function setDirection(dir) {
    if (dir === "up" && direction.y !== 1) {
      nextDirection = { x: 0, y: -1 };
    } else if (dir === "down" && direction.y !== -1) {
      nextDirection = { x: 0, y: 1 };
    } else if (dir === "left" && direction.x !== 1) {
      nextDirection = { x: -1, y: 0 };
    } else if (dir === "right" && direction.x !== -1) {
      nextDirection = { x: 1, y: 0 };
    }
  }

  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
      e.preventDefault();
    }

    if (key === "arrowup") setDirection("up");
    if (key === "arrowdown") setDirection("down");
    if (key === "arrowleft") setDirection("left");
    if (key === "arrowright") setDirection("right");

    if (key === " " && isGameOver) {
      initGame();
    }
  });

  dpadButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setDirection(btn.dataset.dir);
    });
  });

  restartBtn.addEventListener("click", initGame);
  playAgainBtn.addEventListener("click", initGame);

  initGame();
});
