/* ---------- Config ---------- */
const ALL_SYMBOLS = [
  { name: 'apple', img: '🍎' }, { name: 'banana', img: '🍌' },
  { name: 'cherry', img: '🍒' }, { name: 'grape', img: '🍇' },
  { name: 'lemon', img: '🍋' }, { name: 'orange', img: '🍊' },
  { name: 'pear', img: '🍐' }, { name: 'strawberry', img: '🍓' },
  { name: 'watermelon', img: '🍉' }, { name: 'pineapple', img: '🍍' },
  { name: 'peach', img: '🍑' }, { name: 'melon', img: '🍈' },
  { name: 'rose', img: '🌹' }, { name: 'tulip', img: '🌷' },
  { name: 'sunflower', img: '🌻' }, { name: 'camera', img: '📷' },
  { name: 'book', img: '📚' }, { name: 'game', img: '🎮' },
  { name: 'watch', img: '⌚️' }, { name: 'cup', img: '☕️' }
]; // plenty to cover 15 pairs

const grid = document.getElementById('grid');
const restartBtn = document.getElementById('restart');
const themeToggle = document.getElementById('themeToggle');
const difficultySel = document.getElementById('difficulty');

const p1El = document.getElementById('p1');
const p2El = document.getElementById('p2');
const turnEl = document.getElementById('turn');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');

const BEST_KEY = (pairs) => `crimz_best_${pairs}`;

/* ---------- State ---------- */
let deck = [];
let flippedIds = [];
let lock = false;
let scores = { p1: 0, p2: 0 };
let currentPlayer = 1;

let timer = { started:false, startTs:0, handle:null };

/* ---------- Utils ---------- */
const pad = (n)=> n.toString().padStart(2,'0');
const fmt = (ms)=> {
  const s = Math.floor(ms/1000);
  return `${pad(Math.floor(s/60))}:${pad(s%60)}`;
};

const randShuffle = (arr)=>{
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
};

function buildDeck(totalCards){
  const pairs = totalCards / 2;
  const chosen = randShuffle([...ALL_SYMBOLS]).slice(0, pairs);
  const doubled = chosen.flatMap(c => [ {...c}, {...c} ]);
  const withMeta = randShuffle(doubled).map((c, i)=>({
    id:i, key:c.name, img:c.img, matched:false
  }));
  return withMeta;
}

function setGridClass(total){
  grid.classList.remove('grid--16','grid--24','grid--30');
  if(total===16) grid.classList.add('grid--16');
  else if(total===24) grid.classList.add('grid--24');
  else grid.classList.add('grid--30'); // 30
}

function updateHUD(){
  p1El.textContent = scores.p1;
  p2El.textContent = scores.p2;
  turnEl.textContent = currentPlayer === 1 ? "Player 1’s turn" : "Player 2’s turn";
}

/* ---------- Sounds (WebAudio, no files) ---------- */
let audioCtx = null;
function tone(freq=520, ms=120, type='triangle', gain=0.06){
  try{
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); o.disconnect(); g.disconnect(); }, ms);
  }catch{}
}

/* ---------- Timer ---------- */
function startTimer(){
  if(timer.started) return;
  timer.started = true;
  timer.startTs = Date.now();
  timer.handle = setInterval(()=>{
    timeEl.textContent = fmt(Date.now()-timer.startTs);
  }, 500);
}
function stopTimerIfWon(totalCards){
  if(deck.every(c=>c.matched)){
    clearInterval(timer.handle);
    const elapsed = Date.now()-timer.startTs;
    const key = BEST_KEY(totalCards);
    const prev = Number(localStorage.getItem(key) || 0);
    if(!prev || elapsed < prev){
      localStorage.setItem(key, String(elapsed));
    }
    setBestLabel(totalCards);
    setTimeout(()=>{
      const winner =
        scores.p1 === scores.p2 ? "It’s a draw!" :
        scores.p1 > scores.p2 ? "Player 1 wins!" : "Player 2 wins!";
      alert(`${winner}  (${scores.p1} – ${scores.p2})  •  Time ${fmt(elapsed)}`);
    },120);
  }
}
function resetTimer(totalCards){
  timer.started=false; timer.startTs=0;
  clearInterval(timer.handle); timer.handle=null;
  timeEl.textContent = "00:00";
  setBestLabel(totalCards);
}
function setBestLabel(totalCards){
  const bestMs = Number(localStorage.getItem(BEST_KEY(totalCards)) || 0);
  bestEl.textContent = `Best — ${bestMs ? fmt(bestMs) : "00:00"}`;
}

/* ---------- Render ---------- */
function render(){
  grid.innerHTML = '';
  deck.forEach(card=>{
    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.dataset.id = card.id;

    const btn = document.createElement('button');
    btn.setAttribute('aria-label','Memory card');

    const inner = document.createElement('div');
    inner.className = 'card-inner';
    if(card.matched) wrap.classList.add('matched');

    const back = document.createElement('div');
    back.className = 'face back';
    back.textContent = '？';

    const front = document.createElement('div');
    front.className = 'face front';
    front.textContent = card.img;

    inner.appendChild(back);
    inner.appendChild(front);
    btn.appendChild(inner);
    wrap.appendChild(btn);

    wrap.addEventListener('click', onFlip);
    grid.appendChild(wrap);
  });

  updateHUD();
}

/* ---------- Game flow ---------- */
function onFlip(e){
  if(lock) return;
  const target = e.currentTarget;
  const id = Number(target.dataset.id);
  const card = deck.find(c=>c.id===id);
  if(!card || card.matched) return;

  // start timer on first interaction
  startTimer();

  // prevent double-selection of same card
  if(flippedIds.includes(id)) return;

  // flip
  target.classList.add('flipped');
  tone(620, 80, 'triangle', 0.05);
  flippedIds.push(id);

  if(flippedIds.length === 2){
    lock = true;
    const [aId, bId] = flippedIds;
    const a = deck.find(c=>c.id===aId);
    const b = deck.find(c=>c.id===bId);

    setTimeout(()=>{
      if(a.key === b.key){
        a.matched = b.matched = true;
        document.querySelector(`.card[data-id="${aId}"]`)?.classList.add('matched');
        document.querySelector(`.card[data-id="${bId}"]`)?.classList.add('matched');

        // score + extra turn
        if(currentPlayer===1) scores.p1++; else scores.p2++;
        tone(860, 140, 'sawtooth', 0.06);
        // same player continues
      }else{
        // flip back + switch turn
        document.querySelector(`.card[data-id="${aId}"]`)?.classList.remove('flipped');
        document.querySelector(`.card[data-id="${bId}"]`)?.classList.remove('flipped');
        currentPlayer = currentPlayer===1 ? 2 : 1;
        tone(320, 120, 'sine', 0.05);
      }
      flippedIds = [];
      lock = false;
      updateHUD();
      stopTimerIfWon(deck.length);
    }, 520);
  }
}

function newGame(totalCards){
  // grid layout class
  setGridClass(totalCards);
  // reset
  scores = { p1:0, p2:0 };
  currentPlayer = 1;
  flippedIds = [];
  lock = false;
  resetTimer(totalCards);

  // build new deck & render
  deck = buildDeck(totalCards);
  render();
}

/* ---------- UI controls ---------- */
restartBtn.addEventListener('click', ()=> newGame(Number(difficultySel.value)));
difficultySel.addEventListener('change', (e)=>{
  const total = Number(e.target.value);
  newGame(total);
});

themeToggle.addEventListener('click', ()=>{
  const body = document.body;
  const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', next);
  localStorage.setItem('crimz_theme', next);
});

/* ---------- Init ---------- */
(function init(){
  // restore theme
  const savedTheme = localStorage.getItem('crimz_theme');
  if(savedTheme) document.body.setAttribute('data-theme', savedTheme);

  // start with Normal (24)
  const total = Number(difficultySel.value);
  newGame(total);
})();
