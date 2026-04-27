// Dragon Memory Game script

// Cards data: 8 pairs (16 cards) with two types of dragons
// We'll use two images: player.webp and collectible.webp as dragon types
// Each pair has the same image

const board = document.getElementById('board');
const scoreSpan = document.getElementById('score');
const messageDiv = document.getElementById('message');
const startBtn = document.getElementById('start-btn');

let cards = [];
let flippedCards = [];
let matchedCount = 0;
let score = 0;
let canFlip = false; // To prevent clicking during animations

// Card constructor
function createCard(id, type) {
    return {
        id: id,
        type: type,
        matched: false
    };
}

// Initialize the cards array with pairs
function initCards() {
    cards = [];
    // We want 8 pairs = 16 cards
    // We'll have 4 pairs of player.webp and 4 pairs of collectible.webp
    let id = 0;
    for (let i = 0; i < 4; i++) {
        cards.push(createCard(id++, 'player'));
        cards.push(createCard(id++, 'player'));
        cards.push(createCard(id++, 'collectible'));
        cards.push(createCard(id++, 'collectible'));
    }
    // Now cards length is 16
}

// Shuffle cards array using Fisher-Yates shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Create card element
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.dataset.id = card.id;
    cardDiv.dataset.type = card.type;
    cardDiv.addEventListener('click', onCardClick);

    // Front face (hidden initially)
    // Back face (shown initially) - we use a question mark emoji for back
    cardDiv.textContent = '❓';

    return cardDiv;
}

// Flip card visually
function flipCard(cardDiv) {
    cardDiv.classList.add('flipped');
    cardDiv.textContent = '';
    const img = document.createElement('img');
    if (cardDiv.dataset.type === 'player') {
        img.src = 'images/player.webp';
        img.alt = 'Green Dragon';
    } else {
        img.src = 'images/collectible.webp';
        img.alt = 'Blue Dragon';
    }
    cardDiv.appendChild(img);
}

// Unflip card visually
function unflipCard(cardDiv) {
    cardDiv.classList.remove('flipped');
    cardDiv.textContent = '❓';
    // Remove image if any
    while (cardDiv.firstChild && cardDiv.firstChild.tagName === 'IMG') {
        cardDiv.removeChild(cardDiv.firstChild);
    }
}

// Handle card click
function onCardClick(e) {
    if (!canFlip) return;
    const clicked = e.currentTarget;
    const clickedId = clicked.dataset.id;

    // Prevent clicking already matched or flipped cards
    if (flippedCards.find(c => c.dataset.id === clickedId) || clicked.classList.contains('flipped')) {
        return;
    }

    flipCard(clicked);
    flippedCards.push(clicked);

    if (flippedCards.length === 2) {
        canFlip = false;
        checkForMatch();
    }
}

// Check if flipped cards match
function checkForMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.type === card2.dataset.type) {
        // Match found
        score += 10;
        matchedCount += 2;
        scoreSpan.textContent = score;
        messageDiv.textContent = 'Great! You found a match!';
        // Mark cards as matched
        card1.removeEventListener('click', onCardClick);
        card2.removeEventListener('click', onCardClick);
        flippedCards = [];
        canFlip = true;
        checkWin();
    } else {
        // No match
        score = Math.max(0, score - 2);
        scoreSpan.textContent = score;
        messageDiv.textContent = 'Try again!';
        // Wait a bit then unflip
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            flippedCards = [];
            canFlip = true;
            messageDiv.textContent = '';
        }, 1000);
    }
}

// Check if all pairs matched
function checkWin() {
    if (matchedCount === cards.length) {
        messageDiv.textContent = '🎉 You won! Congratulations! 🎉';
        canFlip = false;
        startBtn.textContent = 'Restart Game';
        startBtn.style.display = 'inline-block';
    }
}

// Start or restart the game
function startGame() {
    messageDiv.textContent = '';
    score = 0;
    matchedCount = 0;
    scoreSpan.textContent = score;
    flippedCards = [];
    canFlip = true;
    startBtn.style.display = 'none';

    initCards();
    shuffle(cards);

    // Clear board
    board.innerHTML = '';

    // Create card elements
    cards.forEach(card => {
        const cardEl = createCardElement(card);
        board.appendChild(cardEl);
    });
}

startBtn.addEventListener('click', startGame);
