// Dragon Memory Game script
// Cards: 8 pairs, each pair with the same image (player or collectible)
// Use local images for pairs

const board = document.getElementById('board');
const scoreSpan = document.getElementById('score');
const messageDiv = document.getElementById('message');
const startBtn = document.getElementById('start-btn');

// Card data: 8 pairs (16 cards total)
// We will use 4 pairs of player image and 4 pairs of collectible image
const cardTypes = [
  {type: 'player', img: 'images/player.webp'},
  {type: 'player', img: 'images/player.webp'},
  {type: 'player', img: 'images/player.webp'},
  {type: 'player', img: 'images/player.webp'},
  {type: 'collectible', img: 'images/collectible.webp'},
  {type: 'collectible', img: 'images/collectible.webp'},
  {type: 'collectible', img: 'images/collectible.webp'},
  {type: 'collectible', img: 'images/collectible.webp'}
];

let cards = [];
let flippedCards = [];
let matchedCount = 0;
let score = 0;
let canFlip = false;

// Shuffle function
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize game
function initGame() {
  // Reset variables
  board.innerHTML = '';
  messageDiv.textContent = '';
  score = 0;
  matchedCount = 0;
  scoreSpan.textContent = score;
  flippedCards = [];
  canFlip = true;

  // Create pairs array: duplicate cardTypes to have pairs
  // Actually cardTypes already contains 8 cards (4 player + 4 collectible), we need pairs so duplicate it
  cards = cardTypes.concat(cardTypes.slice());

  // Shuffle cards
  shuffle(cards);

  // Create card elements
  cards.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.dataset.type = card.type;
    cardElement.dataset.index = index;

    // Back side (face down)
    const backDiv = document.createElement('div');
    backDiv.classList.add('back');

    // Front image
    const frontImg = document.createElement('img');
    frontImg.src = card.img;
    frontImg.alt = card.type;

    cardElement.appendChild(backDiv);
    cardElement.appendChild(frontImg);

    cardElement.addEventListener('click', onCardClick);

    board.appendChild(cardElement);
  });
}

function onCardClick(e) {
  if (!canFlip) return;
  const clickedCard = e.currentTarget;

  // Ignore if already flipped or matched
  if (flippedCards.includes(clickedCard) || clickedCard.classList.contains('matched')) return;

  flipCard(clickedCard);

  flippedCards.push(clickedCard);

  if (flippedCards.length === 2) {
    canFlip = false;
    checkForMatch();
  }
}

function flipCard(card) {
  card.classList.add('flipped');
}

function unflipCards() {
  flippedCards.forEach(card => card.classList.remove('flipped'));
  flippedCards = [];
  canFlip = true;
}

function checkForMatch() {
  const [card1, card2] = flippedCards;
  if (card1.dataset.type === card2.dataset.type) {
    // Match found
    card1.classList.add('matched');
    card2.classList.add('matched');
    matchedCount += 2;
    score += 10;
    scoreSpan.textContent = score;
    flippedCards = [];
    canFlip = true;
    messageDiv.textContent = 'Great! You found a match!';
    checkWin();
  } else {
    // No match
    score -= 2;
    if (score < 0) score = 0;
    scoreSpan.textContent = score;
    messageDiv.textContent = 'Try again!';
    setTimeout(() => {
      unflipCards();
      messageDiv.textContent = '';
    }, 1000);
  }
}

function checkWin() {
  if (matchedCount === cards.length) {
    messageDiv.textContent = '🎉 You won! Congratulations! 🎉';
    canFlip = false;
  }
}

startBtn.addEventListener('click', () => {
  initGame();
  messageDiv.textContent = '';
});
