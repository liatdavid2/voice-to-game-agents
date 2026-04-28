// Giant Bubbles Catcher game
// Player moves left and right to catch falling bubbles

const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const bubblesContainer = document.getElementById('bubbles-container');
const scoreSpan = document.getElementById('score');
const startButton = document.getElementById('start-button');
const messageDiv = document.getElementById('message');

const gameWidth = 600;
const gameHeight = 400;
const playerWidth = 100;
const playerHeight = 100;

let bubbles = [];
let score = 0;
let gameInterval = null;
let bubbleFallInterval = null;
let isGameRunning = false;
let playerX = (gameWidth - playerWidth) / 2;

// Bubble properties
const bubbleSizes = [80, 100, 120]; // different bubble sizes
const bubbleSymbols = ['💧', '🌟', '✨', '💫', '❄️'];
const maxBubbles = 7;
const bubbleFallSpeed = 2; // pixels per frame
const winningScore = 15;

// Initialize player position
function updatePlayerPosition() {
    player.style.left = playerX + 'px';
}

// Create a new bubble with random properties
function createBubble() {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');

    // Random size
    const size = bubbleSizes[Math.floor(Math.random() * bubbleSizes.length)];
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';

    // Random horizontal position inside game container
    const x = Math.floor(Math.random() * (gameWidth - size));
    bubble.style.left = x + 'px';
    bubble.style.top = '-'+ size + 'px'; // start above the screen

    // Random symbol
    const symbol = bubbleSymbols[Math.floor(Math.random() * bubbleSymbols.length)];
    bubble.textContent = symbol;

    // Different border color for variety
    const colors = ['#00796b', '#004d40', '#26a69a', '#004d40', '#00796b'];
    bubble.style.borderColor = colors[Math.floor(Math.random() * colors.length)];

    bubblesContainer.appendChild(bubble);

    return {element: bubble, x: x, y: -size, size: size, symbol: symbol};
}

// Move bubbles down
function moveBubbles() {
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let bubble = bubbles[i];
        bubble.y += bubbleFallSpeed;
        bubble.element.style.top = bubble.y + 'px';

        // Check if bubble reached bottom (missed)
        if (bubble.y > gameHeight) {
            // Remove bubble
            bubblesContainer.removeChild(bubble.element);
            bubbles.splice(i, 1);

            // Lose a point for missing a bubble
            score = Math.max(0, score - 1);
            updateScore();
            checkGameOver();
        } else if (checkCollision(bubble)) {
            // Caught bubble
            bubblesContainer.removeChild(bubble.element);
            bubbles.splice(i, 1);

            score++;
            updateScore();
            checkWin();
        }
    }
}

// Check collision between player and bubble
function checkCollision(bubble) {
    const playerRect = {
        left: playerX,
        right: playerX + playerWidth,
        top: gameHeight - playerHeight - 10, // player bottom margin
        bottom: gameHeight - 10
    };

    const bubbleRect = {
        left: bubble.x,
        right: bubble.x + bubble.size,
        top: bubble.y,
        bottom: bubble.y + bubble.size
    };

    return !(playerRect.left > bubbleRect.right ||
             playerRect.right < bubbleRect.left ||
             playerRect.top > bubbleRect.bottom ||
             playerRect.bottom < bubbleRect.top);
}

// Update score display
function updateScore() {
    scoreSpan.textContent = score;
}

// Check for win condition
function checkWin() {
    if (score >= winningScore) {
        endGame(true);
    }
}

// Check for lose condition (score below 0 not allowed, but missing bubbles reduce score)
function checkGameOver() {
    if (score < 0) {
        endGame(false);
    }
}

// Start the game
function startGame() {
    if (isGameRunning) return;

    // Reset
    bubbles.forEach(b => bubblesContainer.removeChild(b.element));
    bubbles = [];
    score = 0;
    updateScore();
    messageDiv.textContent = '';
    isGameRunning = true;
    playerX = (gameWidth - playerWidth) / 2;
    updatePlayerPosition();

    // Spawn bubbles every 800ms
    gameInterval = setInterval(() => {
        if (bubbles.length < maxBubbles) {
            bubbles.push(createBubble());
        }
    }, 800);

    // Move bubbles every 20ms
    bubbleFallInterval = setInterval(() => {
        moveBubbles();
    }, 20);

    startButton.textContent = 'Restart Game';
}

// End the game
function endGame(won) {
    isGameRunning = false;
    clearInterval(gameInterval);
    clearInterval(bubbleFallInterval);
    messageDiv.textContent = won ? 'You Win! 🎉' : 'Game Over! 😢';
}

// Handle player movement with mouse or touch
function onMove(event) {
    if (!isGameRunning) return;

    let clientX = 0;
    if (event.type.startsWith('touch')) {
        clientX = event.touches[0].clientX;
    } else {
        clientX = event.clientX;
    }

    const rect = gameContainer.getBoundingClientRect();
    let newX = clientX - rect.left - playerWidth / 2;
    newX = Math.max(0, Math.min(gameWidth - playerWidth, newX));
    playerX = newX;
    updatePlayerPosition();
}

// Event listeners
startButton.addEventListener('click', startGame);
gameContainer.addEventListener('mousemove', onMove);
gameContainer.addEventListener('touchmove', onMove);

// Prevent scrolling on touch inside game container
gameContainer.addEventListener('touchstart', e => e.preventDefault());

// Initialize player position on load
updatePlayerPosition();