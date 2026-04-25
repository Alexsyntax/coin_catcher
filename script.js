const area       = document.getElementById('cg-area');
const playerEl   = document.getElementById('cg-player');
const scoreEl    = document.getElementById('cg-score');
const bestEl     = document.getElementById('cg-best');
const livesEl    = document.getElementById('cg-lives');
const comboStatEl  = document.getElementById('cg-combo-stat');
const comboPopup = document.getElementById('cg-combo-popup');
const overlay    = document.getElementById('cg-overlay');
const btn        = document.getElementById('cg-btn');
const speedBarEl = document.getElementById('cg-speed-bar');

let score = 0, lives = 3, combo = 1;
let running = false;
let px = 0;
let best = parseInt(localStorage.getItem('ccBest') || '0', 10);
let spawnTimer = null;
let touchStartX = null;

bestEl.textContent = best;

/* ── Helpers ── */
function livesStr(n) {
  const full  = '❤';
  const empty = '♡';
  return Array.from({ length: 3 }, (_, i) => i < n ? full : empty).join(' ');
}

function updateSpeed() {
  const pct = 10 + Math.min((score / 5) * 9, 90);
  speedBarEl.style.width = pct + '%';
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 7; i++) {
    const p = document.createElement('div');
    p.className = 'cg-particle';
    const angle = (Math.PI * 2 * i) / 7;
    const dist  = 18 + Math.random() * 16;
    p.style.cssText = [
      `left:${x + Math.cos(angle) * 8}px`,
      `top:${y + Math.sin(angle) * 8}px`,
      `background:${color}`,
      `--dx:${(Math.cos(angle) * dist).toFixed(1)}px`,
      `--dy:${(Math.sin(angle) * dist - 24).toFixed(1)}px`
    ].join(';');
    area.appendChild(p);
    setTimeout(() => p.remove(), 520);
  }
}

function flashArea(miss) {
  const f = document.createElement('div');
  f.className = 'cg-flash' + (miss ? ' cg-miss-flash' : '');
  area.appendChild(f);
  setTimeout(() => f.remove(), 230);
}

function showCombo() {
  comboStatEl.textContent = `x${combo}`;
  if (combo > 1) {
    comboPopup.textContent = `x${combo} COMBO!`;
    comboPopup.style.opacity = '1';
    clearTimeout(comboPopup._hide);
    comboPopup._hide = setTimeout(() => {
      comboPopup.style.opacity = '0';
    }, 900);
  } else {
    comboPopup.style.opacity = '0';
  }
}

/* ── Spawn logic ── */
function spawnCoin() {
  if (!running) return;

  const aW      = area.clientWidth;
  const isBomb  = Math.random() < Math.min(0.12 + score * 0.007, 0.32);
  const isGold  = !isBomb && Math.random() < 0.28;

  const coin = document.createElement('div');
  coin.className = 'cg-coin ' + (isBomb ? 'cg-coin-bomb' : isGold ? 'cg-coin-gold' : 'cg-coin-silver');
  coin.textContent = isBomb ? '💣' : isGold ? '★' : '';

  const cx = 8 + Math.random() * (aW - 40);
  coin.style.left = cx + 'px';
  coin.style.top  = '-28px';
  area.appendChild(coin);

  let cy = -28;
  const speed = 3.5 + Math.min(score * 0.14, 8) + Math.random() * 2;

  const tick = () => {
    if (!running) { coin.remove(); return; }
    cy += speed;
    coin.style.top = cy + 'px';

    // Collision check
    const cr = coin.getBoundingClientRect();
    const pr = playerEl.getBoundingClientRect();
    const hit = cr.bottom >= pr.top && cr.top <= pr.bottom &&
                cr.right  >= pr.left && cr.left <= pr.right;

    if (hit) {
      coin.remove();
      if (isBomb) {
        lives = Math.max(0, lives - 1);
        livesEl.textContent = livesStr(lives);
        combo = 1;
        showCombo();
        flashArea(true);
        spawnParticles(cx + 12, cy + 12, '#e05050');
        if (lives <= 0) { endGame(); return; }
      } else {
        const pts = (isGold ? 2 : 1) * combo;
        score += pts;
        scoreEl.textContent = score;
        combo++;
        showCombo();
        updateSpeed();
        flashArea(false);
        spawnParticles(cx + 12, cy + 12, isGold ? '#f0c040' : '#90c0e0');
      }
      return;
    }

    // Missed (fell off bottom)
    if (cy > area.clientHeight + 32) {
      coin.remove();
      if (!isBomb) {
        combo = 1;
        showCombo();
        flashArea(true);
      }
      return;
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function scheduleSpawn() {
  if (!running) return;
  spawnCoin();
  const delay = Math.max(280, 900 - score * 11);
  spawnTimer = setTimeout(scheduleSpawn, delay);
}

/* ── Game flow ── */
function startGame() {
  score = 0; lives = 3; combo = 1; running = true;

  scoreEl.textContent  = 0;
  livesEl.textContent  = livesStr(3);
  comboStatEl.textContent = 'x1';
  comboPopup.style.opacity = '0';
  overlay.style.display    = 'none';

  area.querySelectorAll('.cg-coin').forEach(c => c.remove());
  clearTimeout(spawnTimer);
  updateSpeed();

  const aW = area.clientWidth;
  px = aW / 2 - playerEl.offsetWidth / 2;
  playerEl.style.left = px + 'px';

  scheduleSpawn();
}

function endGame() {
  running = false;
  clearTimeout(spawnTimer);

  const isNewBest = score > best;
  if (isNewBest) {
    best = score;
    localStorage.setItem('ccBest', best);
    bestEl.textContent = best;
  }

  overlay.innerHTML = `
    <h2>GAME OVER</h2>
    <p>${isNewBest && score > 0 ? '★ NEW BEST ★' : 'final score'}</p>
    <div class="cg-score-display">${score}</div>
    <button class="cg-replay-btn" id="cg-replay">PLAY AGAIN</button>
  `;
  overlay.style.display = 'flex';
  document.getElementById('cg-replay').addEventListener('click', startGame);
}

/* ── Input: keyboard ── */
document.addEventListener('keydown', e => {
  if (!running) return;
  const step = 30;
  const max  = area.clientWidth - playerEl.offsetWidth;
  if (e.key === 'ArrowLeft')  { px = Math.max(0, px - step); e.preventDefault(); }
  if (e.key === 'ArrowRight') { px = Math.min(max, px + step); e.preventDefault(); }
  playerEl.style.left = px + 'px';
});

/* ── Input: mouse ── */
area.addEventListener('mousemove', e => {
  if (!running) return;
  const rect = area.getBoundingClientRect();
  const half = playerEl.offsetWidth / 2;
  px = Math.max(0, Math.min(area.clientWidth - playerEl.offsetWidth, e.clientX - rect.left - half));
  playerEl.style.left = px + 'px';
});

/* ── Input: touch ── */
area.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

area.addEventListener('touchmove', e => {
  if (!running || touchStartX === null) return;
  const dx = e.touches[0].clientX - touchStartX;
  touchStartX = e.touches[0].clientX;
  const max = area.clientWidth - playerEl.offsetWidth;
  px = Math.max(0, Math.min(max, px + dx));
  playerEl.style.left = px + 'px';
  e.preventDefault();
}, { passive: false });

/* ── Start button ── */
btn.addEventListener('click', startGame);