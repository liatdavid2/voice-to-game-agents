// Rainbow Snake Game
// Uses images/player.webp for snake head
// Uses images/collectible.webp for collectibles

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');
const startButton = document.getElementById('start-button');

const gridSize = 20; // size of each grid square in pixels
const tileCount = canvas.width / gridSize; // number of tiles horizontally and vertically

// Load images
const playerImg = new Image();
playerImg.src = 'images/player.webp';
const collectibleImg = new Image();
collectibleImg.src = 'images/collectible.webp';

// Rainbow colors for snake body segments
const rainbowColors = [
    '#FF0000', // red
    '#FF7F00', // orange
    '#FFFF00', // yellow
    '#00FF00', // green
    '#0000FF', // blue
    '#4B0082', // indigo
    '#8B00FF'  // violet
];

let snake = [];
let velocity = { x: 0, y: 0 };
let collectible = { x: 0, y: 0 };
let score = 0;
let gameRunning = false;
let gameInterval = null;

// Initialize snake in center
function initSnake() {
    snake = [
        { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }
    ];
    velocity = { x: 0, y: 0 };
}

// Place collectible at random position not on snake
function placeCollectible() {
    let validPosition = false;
    while (!validPosition) {
        collectible.x = Math.floor(Math.random() * tileCount);
        collectible.y = Math.floor(Math.random() * tileCount);
        validPosition = !snake.some(segment => segment.x === collectible.x && segment.y === collectible.y);
    }
}

// Draw the snake with rainbow colors
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;

        if (index === 0) {
            // Draw snake head with player image
            ctx.drawImage(playerImg, x, y, gridSize, gridSize);
            // Draw a small rainbow glow around head
            ctx.strokeStyle = rainbowColors[index % rainbowColors.length];
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
        } else {
            // Draw body segment as colored rectangle with rainbow color
            ctx.fillStyle = rainbowColors[index % rainbowColors.length];
            ctx.fillRect(x, y, gridSize, gridSize);
            // Add a small white border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, gridSize, gridSize);
        }
    });
}

// Draw collectible with collectible image and a colored border
function drawCollectible() {
    const x = collectible.x * gridSize;
    const y = collectible.y * gridSize;
    ctx.drawImage(collectibleImg, x, y, gridSize, gridSize);
    // Draw a bright border to make it stand out
    ctx.strokeStyle = '#FFD700'; // gold
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
}

// Clear canvas
function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Update snake position
function updateSnake() {
    if (velocity.x === 0 && velocity.y === 0) {
        return; // not moving yet
    }

    // Calculate new head position
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Wrap around edges
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame(false);
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check if collectible eaten
    if (head.x === collectible.x && head.y === collectible.y) {
        score++;
        scoreEl.textContent = score;
        placeCollectible();
        // Win condition: snake fills half the board
        if (snake.length >= (tileCount * tileCount) / 2) {
            endGame(true);
            return;
        }
    } else {
        // Remove tail segment
        snake.pop();
    }
}

// Draw everything
function draw() {
    clearCanvas();
    drawCollectible();
    drawSnake();
}

// Game loop
function gameLoop() {
    updateSnake();
    draw();
}

// Handle keyboard input
function keyDownHandler(e) {
    if (!gameRunning) return;
    const key = e.key;
    // Prevent reverse direction
    if (key === 'ArrowUp' && velocity.y !== 1) {
        velocity = { x: 0, y: -1 };
    } else if (key === 'ArrowDown' && velocity.y !== -1) {
        velocity = { x: 0, y: 1 };
    } else if (key === 'ArrowLeft' && velocity.x !== 1) {
        velocity = { x: -1, y: 0 };
    } else if (key === 'ArrowRight' && velocity.x !== -1) {
        velocity = { x: 1, y: 0 };
    }
}

// Start or restart game
function startGame() {
    score = 0;
    scoreEl.textContent = score;
    messageEl.textContent = '';
    initSnake();
    placeCollectible();
    gameRunning = true;
    velocity = { x: 1, y: 0 }; // start moving right
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 120);
}

// End game with win or lose
function endGame(win) {
    gameRunning = false;
    clearInterval(gameInterval);
    velocity = { x: 0, y: 0 };
    if (win) {
        messageEl.style.color = '#006400';
        messageEl.textContent = 'You Win! 🎉';
    } else {
        messageEl.style.color = '#8B0000';
        messageEl.textContent = 'Game Over! 💥';
    }
}

// Event listeners
window.addEventListener('keydown', keyDownHandler);
startButton.addEventListener('click', startGame);

// Draw initial screen
clearCanvas();
ctx.fillStyle = '#fff';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('Press Start to Play', canvas.width / 2, canvas.height / 2);
