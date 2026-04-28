// Hello Kitty Memory Game Script
// Uses two images: player and collectible
// Each pair shares the same image but differs by color and symbol

const board = document.getElementById('board');
const scoreSpan = document.getElementById('score');
const messageDiv = document.getElementById('message');
const startButton = document.getElementById('start-button');

// Card data: pairs of cards with image, symbol, and border color
// We have 8 pairs (16 cards)
const pairsData = [
  {image: 'images/player.webp', symbol: '❤', color: '#e91e63', border: '#ad1457'},
  {image: 'images/player.webp', symbol: '★', color: '#f48fb1', border: '#880e4f'},
  {image: 'images/player.webp', symbol: '☀', color: '#f06292', border: '#b71c1c'},
  {image: 'images/player.webp', symbol: '❀', color: '#f8bbd0', border: '#880e4f'},
  {image: 'images/collectible.webp', symbol: '✿', color: '#ba68c8', border: '#4a148c'},
  {image: 'images/collectible.webp', symbol: '☁', color: '#9575cd', border: '#311b92'},
  {image: 'images/collectible.webp', symbol: '☂', color: '#ce93d8', border: '#4a148c'},
  {image: 'images/collectible.webp', symbol: '❄', color: '#e1bee7', border: '#6a1b9a'}
];

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let score = 0;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createCardElement(cardData, index) {
  // cardData: {image, symbol, color, border}
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.index = index;

  const cardInner = document.createElement('div');
  cardInner.classList.add('card-inner');

  const cardFront = document.createElement('div');
  cardFront.classList.add('card-front');
  cardFront.style.borderColor = cardData.border;
  cardFront.style.color = cardData.color;

  const symbolSpan = document.createElement('div');
  symbolSpan.classList.add('symbol');
  symbolSpan.textContent = cardData.symbol;

  cardFront.appendChild(symbolSpan);

  const cardBack = document.createElement('div');
  cardBack.classList.add('card-back');
  cardBack.style.borderColor = cardData.border;
  
  const img = document.createElement('img');
  img.src = cardData.image;
  img.alt = 'Hello Kitty';
  img.draggable = false;
  cardBack.appendChild(img);

  cardInner.appendChild(cardFront);
  cardInner.appendChild(cardBack);
  card.appendChild(cardInner);

  card.addEventListener('click', () => handleCardClick(card));

  return card;
}

function startGame() {
  // Reset variables
  board.innerHTML = '';
  messageDiv.textContent = '';
  messageDiv.className = '';
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  matchedPairs = 0;
  score = 0;
  scoreSpan.textContent = score;

  // Create deck (2 cards per pair)
  cards = [];
  pairsData.forEach((pair, i) => {
    // Create two cards per pair
    cards.push({...pair, pairId: i});
    cards.push({...pair, pairId: i});
  });

  shuffle(cards);

  // Create card elements
  cards.forEach((cardData, index) => {
    const cardElement = createCardElement(cardData, index);
    board.appendChild(cardElement);
  });
}

function handleCardClick(cardElement) {
  if (lockBoard) return;
  if (cardElement.classList.contains('flipped')) return;

  cardElement.classList.add('flipped');

  if (!firstCard) {
    firstCard = cardElement;
    return;
  }

  secondCard = cardElement;
  lockBoard = true;

  checkForMatch();
}

function checkForMatch() {
  const firstIndex = firstCard.dataset.index;
  const secondIndex = secondCard.dataset.index;

  if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
    // Match found
    matchedPairs++;
    score += 10;
    updateScore();
    resetTurn(true);
    if (matchedPairs === pairsData.length) {
      showWinMessage();
    }
  } else {
    // No match
    score -= 2;
    updateScore();
    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetTurn(false);
    }, 1000);
  }
}

function resetTurn(matched) {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function updateScore() {
  if(score < 0) score = 0;
  scoreSpan.textContent = score;
}

function showWinMessage() {
  messageDiv.textContent = '🎉 You Win! Great Memory! 🎉';
  messageDiv.className = 'win-message';
}

startButton.addEventListener('click', startGame);
