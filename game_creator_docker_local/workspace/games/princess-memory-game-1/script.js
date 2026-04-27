// Princess Memory Game Script

const startBtn = document.getElementById('startBtn');
const gameBoard = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');

// Array of princess images (8 pairs, 16 cards total)
const princessImages = [
    'images/princess1.png',
    'images/princess2.png',
    'images/princess3.png',
    'images/princess4.png',
    'images/princess5.png',
    'images/princess6.png',
    'images/princess7.png',
    'images/princess8.png'
];

let cards = [];
let flippedCards = [];
let matchedCount = 0;
let score = 0;
let busy = false; // to prevent clicking while cards are flipping back

// Shuffle function using Fisher-Yates
function shuffle(array) {
    for (let i = array.length -1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize the game board
function initGame() {
    // Reset variables
    cards = [];
    flippedCards = [];
    matchedCount = 0;
    score = 0;
    busy = false;
    scoreDisplay.textContent = 'Score: 0';
    messageDisplay.textContent = '';
    gameBoard.innerHTML = '';

    // Create pairs of cards
    const cardImages = princessImages.concat(princessImages); // duplicate for pairs
    shuffle(cardImages);

    // Create card elements
    cardImages.forEach((imgSrc, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.image = imgSrc;
        card.dataset.index = index;

        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = 'Princess card';

        card.appendChild(img);

        card.addEventListener('click', onCardClick);

        gameBoard.appendChild(card);
        cards.push(card);
    });
}

// Handle card click
function onCardClick(e) {
    if (busy) return;
    const card = e.currentTarget;

    // Ignore if already matched or flipped
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    flipCard(card);

    flippedCards.push(card);

    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

// Flip card to show image
function flipCard(card) {
    card.classList.add('flipped');
}

// Flip card back to hide image
function unflipCard(card) {
    card.classList.remove('flipped');
}

// Check if two flipped cards match
function checkForMatch() {
    busy = true;
    const [card1, card2] = flippedCards;

    if (card1.dataset.image === card2.dataset.image) {
        // Match found
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedCount += 2;
        score += 10;
        scoreDisplay.textContent = 'Score: ' + score;
        flippedCards = [];
        busy = false;

        if (matchedCount === cards.length) {
            // All matched - win
            messageDisplay.textContent = 'You Win! 🎉';
        }
    } else {
        // No match - flip back after short delay
        score -= 2;
        if(score < 0) score = 0;
        scoreDisplay.textContent = 'Score: ' + score;
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            flippedCards = [];
            busy = false;
        }, 1000);
    }
}

startBtn.addEventListener('click', () => {
    initGame();
});

// On page load, show instructions and disable board
messageDisplay.textContent = 'Click Start to play!';
