// Cat Memory Game script
// Cards use the collectible image with different colors and symbols to differentiate pairs

const board = document.getElementById('board');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');
const startBtn = document.getElementById('startBtn');

// Card data: each pair has the same symbol and color
const cardPairs = [
  {symbol: '🐱', color: '#f28ab2'},
  {symbol: '😺', color: '#f2d16b'},
  {symbol: '😻', color: '#8af2a2'},
  {symbol: '😹', color: '#8ac1f2'},
  {symbol: '😼', color: '#d68af2'},
  {symbol: '😽', color: '#f28a4a'},
  {symbol: '🙀', color: '#f2a28a'},
  {symbol: '😿', color: '#a28af2'}
];

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let score = 0;
let matchesFound = 0;
const totalPairs = cardPairs.length;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createCardElement(card, index) {
  const cardElement = document.createElement('div');
  cardElement.classList.add('card');
  cardElement.dataset.symbol = card.symbol;
  cardElement.dataset.color = card.color;
  cardElement.dataset.index = index;

  const cardInner = document.createElement('div');
  cardInner.classList.add('card-inner');

  // Front side: show collectible image with symbol and colored border
  const cardFront = document.createElement('div');
  cardFront.classList.add('card-front');
  cardFront.style.borderColor = card.color;

  const imgFront = document.createElement('img');
  imgFront.src = 'images/collectible.webp';
  imgFront.alt = 'Cat collectible';
  cardFront.appendChild(imgFront);

  const symbolFront = document.createElement('div');
  symbolFront.textContent = card.symbol;
  symbolFront.style.color = card.color;
  symbolFront.style.fontSize = '32px';
  cardFront.appendChild(symbolFront);

  // Back side: plain with collectible image
  const cardBack = document.createElement('div');
  cardBack.classList.add('card-back');

  const imgBack = document.createElement('img');
  imgBack.src = 'images/collectible.webp';
  imgBack.alt = 'Cat collectible back';
  cardBack.appendChild(imgBack);

  cardInner.appendChild(cardFront);
  cardInner.appendChild(cardBack);
  cardElement.appendChild(cardInner);

  cardElement.addEventListener('click', onCardClicked);

  return cardElement;
}

function setupBoard() {
  board.innerHTML = '';
  cards = [];
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  score = 0;
  matchesFound = 0;
  scoreDisplay.textContent = 'Score: 0';
  messageDisplay.textContent = '';

  // Create pairs of cards
  const pairCards = [];
  cardPairs.forEach(pair => {
    pairCards.push({...pair});
    pairCards.push({...pair});
  });

  // Shuffle cards
  shuffle(pairCards);

  pairCards.forEach((card, index) => {
    const cardElement = createCardElement(card, index);
    board.appendChild(cardElement);
    cards.push(cardElement);
  });
}

function onCardClicked(e) {
  if (lockBoard) return;
  const clickedCard = e.currentTarget;
  if (clickedCard === firstCard) return; // prevent double click on same card
  if (clickedCard.classList.contains('flipped')) return; // already flipped

  clickedCard.classList.add('flipped');

  if (!firstCard) {
    firstCard = clickedCard;
    return;
  }

  secondCard = clickedCard;
  lockBoard = true;

  checkForMatch();
}

function checkForMatch() {
  const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

  if (isMatch) {
    score += 10;
    matchesFound++;
    updateScore();
    resetTurn();
    if (matchesFound === totalPairs) {
      messageDisplay.textContent = 'You Win! 🎉';
      startBtn.textContent = 'Restart Game';
      lockBoard = true;
    }
  } else {
    score -= 2;
    if(score < 0) score = 0;
    updateScore();
    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetTurn();
    }, 1000);
  }
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
}

startBtn.addEventListener('click', () => {
  setupBoard();
  startBtn.textContent = 'Restart Game';
  messageDisplay.textContent = '';
});