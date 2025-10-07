const cardArray = [
  { name: 'apple', img: '🍎' },
  { name: 'banana', img: '🍌' },
  { name: 'cherry', img: '🍒' },
  { name: 'grape', img: '🍇' },
  { name: 'lemon', img: '🍋' },
  { name: 'orange', img: '🍊' },
  { name: 'pear', img: '🍐' },
  { name: 'pineapple', img: '🍍' },
  { name: 'strawberry', img: '🍓' },
  { name: 'rose', img: '🌹' },
  { name: 'tulip', img: '🌷' },
  { name: 'sunflower', img: '🌻' },
  { name: 'camera', img: '📷' },
  { name: 'book', img: '📚' },
];
let gameGrid = [...cardArray, ...cardArray].sort(() => 0.5 - Math.random());
const grid = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restart');

let cardsChosen = [];
let cardsChosenId = [];
let cardsWon = [];
let currentPlayer = 1;
let player1Score = 0;
let player2Score = 0;

function createBoard() {
  grid.innerHTML = '';
  gameGrid.forEach((_, i) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('data-id', i);
    card.textContent = '❓';
    card.addEventListener('click', flipCard);
    grid.appendChild(card);
  });
}

function checkForMatch() {
  const cards = document.querySelectorAll('.card');
  const [optionOneId, optionTwoId] = cardsChosenId;

  if (cardsChosen[0] === cardsChosen[1]) {
    cards[optionOneId].textContent = '✅';
    cards[optionTwoId].textContent = '✅';
    cardsWon.push(cardsChosen);
    if (currentPlayer === 1) player1Score++;
    else player2Score++;
  } else {
    cards[optionOneId].textContent = '❓';
    cards[optionTwoId].textContent = '❓';
    currentPlayer = currentPlayer === 1 ? 2 : 1;
  }

  cardsChosen = [];
  cardsChosenId = [];
  scoreDisplay.textContent = `Player 1: ${player1Score} | Player 2: ${player2Score}`;

  if (cardsWon.length === cardArray.length) {
    setTimeout(() => {
      alert(
        player1Score > player2Score
          ? '🎉 Player 1 Wins!'
          : player2Score > player1Score
          ? '🎉 Player 2 Wins!'
          : '🤝 It’s a Draw!'
      );
    }, 500);
  }
}

function flipCard() {
  const cardId = this.getAttribute('data-id');
  if (cardsChosenId.includes(cardId)) return;

  cardsChosen.push(gameGrid[cardId].name);
  cardsChosenId.push(cardId);
  this.textContent = gameGrid[cardId].img;

  if (cardsChosen.length === 2) {
    setTimeout(checkForMatch, 500);
  }
}

restartBtn.addEventListener('click', () => {
  player1Score = 0;
  player2Score = 0;
  cardsWon = [];
  currentPlayer = 1;
  gameGrid = [...cardArray, ...cardArray].sort(() => 0.5 - Math.random());
  scoreDisplay.textContent = `Player 1: ${player1Score} | Player 2: ${player2Score}`;
  createBoard();
});

createBoard();
