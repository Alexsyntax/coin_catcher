const gameArea = document.getElementById("gameArea");
const player = document.getElementById("player");
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const livesText = document.getElementById("lives");
const startBtn = document.getElementById("startBtn");

let score = 0;
let lives = 3;
let playerX = 220;
let gameRunning = false;
let coinInterval;

let bestScore = localStorage.getItem("bestScore") || 0;
bestText.textContent = bestScore;

document.addEventListener("keydown", movePlayer);
startBtn.addEventListener("click", startGame);

function startGame() {
  score = 0;
  lives = 3;
  playerX = 220;
  gameRunning = true;

  scoreText.textContent = score;
  livesText.textContent = lives;
  player.style.left = playerX + "px";

  document.querySelectorAll(".coin").forEach(coin => coin.remove());

  clearInterval(coinInterval);
  coinInterval = setInterval(createCoin, 900);

  startBtn.textContent = "Restart Game";
}

function movePlayer(event) {
  if (!gameRunning) return;

  if (event.key === "ArrowLeft") {
    playerX -= 25;
  } else if (event.key === "ArrowRight") {
    playerX += 25;
  }

  if (playerX < 0) playerX = 0;
  if (playerX > gameArea.clientWidth - player.clientWidth) {
    playerX = gameArea.clientWidth - player.clientWidth;
  }

  player.style.left = playerX + "px";
}

function createCoin() {
  if (!gameRunning) return;

  const coin = document.createElement("div");
  coin.classList.add("coin");

  const coinX = Math.random() * (gameArea.clientWidth - 30);
  coin.style.left = coinX + "px";
  coin.style.top = "0px";

  gameArea.appendChild(coin);

  let coinY = 0;

  const fall = setInterval(() => {
    if (!gameRunning) {
      clearInterval(fall);
      coin.remove();
      return;
    }

    coinY += 5;
    coin.style.top = coinY + "px";

    if (checkCollision(coin, player)) {
      score++;
      scoreText.textContent = score;
      coin.remove();
      clearInterval(fall);
    }

    if (coinY > gameArea.clientHeight) {
      lives--;
      livesText.textContent = lives;
      coin.remove();
      clearInterval(fall);

      if (lives <= 0) {
        endGame();
      }
    }
  }, 20);
}

function checkCollision(coin, player) {
  const coinRect = coin.getBoundingClientRect();
  const playerRect = player.getBoundingClientRect();

  return (
    coinRect.bottom >= playerRect.top &&
    coinRect.top <= playerRect.bottom &&
    coinRect.right >= playerRect.left &&
    coinRect.left <= playerRect.right
  );
}

function endGame() {
  gameRunning = false;
  clearInterval(coinInterval);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore", bestScore);
    bestText.textContent = bestScore;
  }

  alert("Game Over! Your score: " + score);
}