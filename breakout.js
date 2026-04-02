document.addEventListener("DOMContentLoaded", () => {
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

  const canvas = document.getElementById("breakout-canvas");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const levelEl = document.getElementById("level");

  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");

  const overlay = document.getElementById("breakout-overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const overlayBtn = document.getElementById("overlay-btn");

  const moveLeftBtn = document.getElementById("move-left-btn");
  const moveRightBtn = document.getElementById("move-right-btn");

  const game = {
    running: false,
    score: 0,
    lives: 3,
    level: 1,
    rightPressed: false,
    leftPressed: false,
    touchLeft: false,
    touchRight: false,
    animationId: null
  };

  const paddle = {
    width: 120,
    height: 14,
    x: canvas.width / 2 - 60,
    y: canvas.height - 34,
    speed: 8
  };

  const ball = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 9,
    dx: 4,
    dy: -4
  };

  const brickConfig = {
    rowCount: 5,
    columnCount: 9,
    width: 62,
    height: 20,
    padding: 12,
    offsetTop: 50,
    offsetLeft: 34
  };

  let bricks = [];

  function buildBricks() {
    bricks = [];
    for (let c = 0; c < brickConfig.columnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickConfig.rowCount; r++) {
        bricks[c][r] = {
          x: 0,
          y: 0,
          status: 1
        };
      }
    }
  }

  function resetBallAndPaddle() {
    paddle.x = canvas.width / 2 - paddle.width / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 60;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -4;
  }

  function resetGame(fullReset = true) {
    if (fullReset) {
      game.score = 0;
      game.lives = 3;
      game.level = 1;
    }

    brickConfig.rowCount = Math.min(5 + (game.level - 1), 7);
    buildBricks();
    resetBallAndPaddle();
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = game.score;
    livesEl.textContent = game.lives;
    levelEl.textContent = game.level;
  }

  function showOverlay(title, text, buttonText = "Play") {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayBtn.textContent = buttonText;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    if (!game.running) {
      game.running = true;
      hideOverlay();
      loop();
    }
  }

  function stopGame() {
    game.running = false;
    if (game.animationId) {
      cancelAnimationFrame(game.animationId);
      game.animationId = null;
    }
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 2, ball.x, ball.y, ball.radius + 3);
    gradient.addColorStop(0, "#fff1c9");
    gradient.addColorStop(0.4, "#ffcb70");
    gradient.addColorStop(1, "#ff8a2f");
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(255, 177, 74, 0.5)";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  }

  function drawPaddle() {
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, "#ffd77a");
    gradient.addColorStop(1, "#f7b23a");
    ctx.fillStyle = gradient;
    roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 10, true, false);
  }

  function drawBricks() {
    for (let c = 0; c < brickConfig.columnCount; c++) {
      for (let r = 0; r < brickConfig.rowCount; r++) {
        if (bricks[c][r].status === 1) {
          const brickX = c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft;
          const brickY = r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop;
          bricks[c][r].x = brickX;
          bricks[c][r].y = brickY;

          const grad = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickConfig.height);
          if (r % 3 === 0) {
            grad.addColorStop(0, "#ffcf74");
            grad.addColorStop(1, "#f68f2e");
          } else if (r % 3 === 1) {
            grad.addColorStop(0, "#ff7bd5");
            grad.addColorStop(1, "#d84bb6");
          } else {
            grad.addColorStop(0, "#8fd6ff");
            grad.addColorStop(1, "#4aa0ff");
          }

          ctx.fillStyle = grad;
          roundRect(ctx, brickX, brickY, brickConfig.width, brickConfig.height, 8, true, false);
        }
      }
    }
  }

  function drawBackgroundGlow() {
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      120,
      20,
      canvas.width / 2,
      120,
      280
    );
    gradient.addColorStop(0, "rgba(255, 177, 74, 0.08)");
    gradient.addColorStop(1, "rgba(255, 177, 74, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function collisionDetection() {
    let remaining = 0;

    for (let c = 0; c < brickConfig.columnCount; c++) {
      for (let r = 0; r < brickConfig.rowCount; r++) {
        const b = bricks[c][r];
        if (b.status === 1) {
          remaining++;

          if (
            ball.x > b.x &&
            ball.x < b.x + brickConfig.width &&
            ball.y > b.y &&
            ball.y < b.y + brickConfig.height
          ) {
            ball.dy = -ball.dy;
            b.status = 0;
            game.score += 10;
            updateHud();
            remaining--;
          }
        }
      }
    }

    if (remaining === 0) {
      game.level++;
      updateHud();
      stopGame();
      resetGame(false);
      showOverlay("LEVEL CLEAR", "Nice. Ready for the next wall?", "Next level");
    }
  }

  function movePaddle() {
    const movingLeft = game.leftPressed || game.touchLeft;
    const movingRight = game.rightPressed || game.touchRight;

    if (movingRight && paddle.x < canvas.width - paddle.width) {
      paddle.x += paddle.speed;
    } else if (movingLeft && paddle.x > 0) {
      paddle.x -= paddle.speed;
    }
  }

  function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx = -ball.dx;
    }

    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    if (
      ball.y + ball.radius >= paddle.y &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width &&
      ball.dy > 0
    ) {
      const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      ball.dx = hitPoint * 6;
      ball.dy = -Math.abs(ball.dy);
    }

    if (ball.y + ball.radius > canvas.height) {
      game.lives--;
      updateHud();

      if (game.lives <= 0) {
        stopGame();
        showOverlay("GAME OVER", "The wall wins this round.", "Play again");
        game.level = 1;
        resetGame(true);
        return;
      }

      stopGame();
      resetBallAndPaddle();
      showOverlay("TRY AGAIN", "You lost a life. Jump back in.", "Continue");
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundGlow();
    drawBricks();
    drawBall();
    drawPaddle();
  }

  function loop() {
    if (!game.running) return;

    movePaddle();
    updateBall();
    collisionDetection();
    draw();

    game.animationId = requestAnimationFrame(loop);
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();

    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") game.rightPressed = true;
    if (e.key === "Left" || e.key === "ArrowLeft") game.leftPressed = true;
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") game.rightPressed = false;
    if (e.key === "Left" || e.key === "ArrowLeft") game.leftPressed = false;
  });

  function holdButton(button, direction, active) {
    if (!button) return;

    const start = (e) => {
      e.preventDefault();
      game[direction] = true;
    };

    const end = (e) => {
      e.preventDefault();
      game[direction] = false;
    };

    button.addEventListener("touchstart", start, { passive: false });
    button.addEventListener("touchend", end, { passive: false });
    button.addEventListener("touchcancel", end, { passive: false });
    button.addEventListener("mousedown", start);
    button.addEventListener("mouseup", end);
    button.addEventListener("mouseleave", end);
  }

  holdButton(moveLeftBtn, "touchLeft");
  holdButton(moveRightBtn, "touchRight");

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => {
    stopGame();
    resetGame(true);
    showOverlay("BREAKOUT", "Hit start and clear the wall.", "Play");
  });
  overlayBtn.addEventListener("click", startGame);

  resetGame(true);
  draw();
});
