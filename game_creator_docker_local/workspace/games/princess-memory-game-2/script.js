// Princess Memory Game script

const startBtn = document.getElementById('startBtn');
const gameBoard = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');

// Array of princess images (relative paths)
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
let canFlip = false;

// Shuffle helper function
function shuffle(array) {
    for (let i = array.length -1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createCards() {
    // Duplicate princess images to create pairs
    const gameImages = princessImages.slice(0, 8); // 8 pairs for 16 cards
    const cardImages = gameImages.concat(gameImages); // 16 cards
    shuffle(cardImages);

    gameBoard.innerHTML = '';
    cards = [];

    cardImages.forEach((imgSrc, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.image = imgSrc;
        card.dataset.index = index;

        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = 'Princess';

        card.appendChild(img);
        gameBoard.appendChild(card);

        cards.push(card);

        card.addEventListener('click', () => {
            if (!canFlip) return;
            if (card.classList.contains('flipped')) return;
            if (flippedCards.length === 2) return;

            flipCard(card);
        });
    });
}

function flipCard(card) {
    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        canFlip = false;
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.image === card2.dataset.image) {
        // Match found
        matchedCount += 2;
        score += 10;
        updateScore();
        flippedCards = [];
        canFlip = true;
        checkWin();
    } else {
        // No match - flip back after short delay
        score = Math.max(0, score - 2);
        updateScore();
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            canFlip = true;
        }, 1000);
    }
}

function updateScore() {
    scoreDisplay.textContent = 'Score: ' + score;
}

function checkWin() {
    if (matchedCount === cards.length) {
        messageDisplay.textContent = 'You Win! 🎉';
        canFlip = false;
        startBtn.textContent = 'Restart Game';
        startBtn.disabled = false;
    }
}

function startGame() {
    matchedCount = 0;
    score = 0;
    updateScore();
    messageDisplay.textContent = '';
    createCards();
    canFlip = true;
    startBtn.disabled = true;
}

startBtn.addEventListener('click', () => {
    startGame();
});