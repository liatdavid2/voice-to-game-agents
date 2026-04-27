// Princess Memory Game
// Flip cards to find matching pairs of princess images

const board = document.getElementById('board');
const scoreSpan = document.getElementById('score');
const messageDiv = document.getElementById('message');
const startBtn = document.getElementById('startBtn');

// Card data: pairs of princess images
// Using the two local images for pairs
const cardImages = [
  'images/player.webp',
  'images/collectible.webp'
];

let cards = [];
let flippedCards = [];
let matchedCount = 0;
let score = 0;
let busy = false; // prevent clicking while checking

// Create a deck with pairs duplicated
function createDeck() {
  const pairsCount = 4; // total 8 cards (4 pairs)
  let deck = [];
  for (let i = 0; i < pairsCount; i++) {
    // Cycle through cardImages for variety
    const img = cardImages[i % cardImages.length];
    deck.push({ id: i * 2, img: img, matched: false });
    deck.push({ id: i * 2 + 1, img: img, matched: false });
  }
  return deck;
}

// Shuffle array in place
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Render cards on board
function renderBoard() {
  board.innerHTML = '';
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.dataset.id = card.id;

    // Back side: plain pink
    // Front side: image
    // We'll show image only if flipped or matched

    // Add image element
    const img = document.createElement('img');
    img.src = card.img;
    img.alt = 'Princess';
    img.style.display = 'none';
    cardElement.appendChild(img);

    cardElement.addEventListener('click', () => onCardClicked(cardElement));

    board.appendChild(cardElement);
  });
}

// Flip card visually
function flipCard(cardElement) {
  cardElement.classList.add('flipped');
  const img = cardElement.querySelector('img');
  img.style.display = 'block';
}

// Unflip card visually
function unflipCard(cardElement) {
  cardElement.classList.remove('flipped');
  const img = cardElement.querySelector('img');
  img.style.display = 'none';
}

// Handle card click
function onCardClicked(cardElement) {
  if (busy) return; // wait while checking
  const cardId = parseInt(cardElement.dataset.id, 10);
  const card = cards.find(c => c.id === cardId);
  if (!card || card.matched) return; // ignore matched
  if (flippedCards.find(c => c.id === cardId)) return; // ignore already flipped

  flipCard(cardElement);
  flippedCards.push({ card, element: cardElement });

  if (flippedCards.length === 2) {
    busy = true;
    checkForMatch();
  }
}

// Check if flipped cards match
function checkForMatch() {
  const [first, second] = flippedCards;
  if (first.card.img === second.card.img) {
    // Match found
    first.card.matched = true;
    second.card.matched = true;
    matchedCount += 2;
    score += 10;
    updateScore();
    messageDiv.textContent = 'You found a match! 🎉';
    flippedCards = [];
    busy = false;
    checkWin();
  } else {
    // No match, flip back after short delay
    score = Math.max(0, score - 2);
    updateScore();
    messageDiv.textContent = 'Try again!';
    setTimeout(() => {
      unflipCard(first.element);
      unflipCard(second.element);
      flippedCards = [];
      busy = false;
      messageDiv.textContent = '';
    }, 1000);
  }
}

// Update score display
function updateScore() {
  scoreSpan.textContent = score;
}

// Check if all pairs matched
function checkWin() {
  if (matchedCount === cards.length) {
    messageDiv.textContent = 'You win! 🎊 Click Restart to play again.';
    startBtn.textContent = 'Restart Game';
    startBtn.disabled = false;
  }
}

// Start or restart game
function startGame() {
  score = 0;
  matchedCount = 0;
  flippedCards = [];
  cards = createDeck();
  shuffle(cards);
  renderBoard();
  updateScore();
  messageDiv.textContent = '';
  startBtn.disabled = true;
}

startBtn.addEventListener('click', startGame);

// Initial state
messageDiv.textContent = 'Click Start Game to begin!';
