// Giant Bubbles Catcher Game Script

const gameContainer = document.getElementById('game-container');
const bubblesContainer = document.getElementById('bubbles-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const messageDisplay = document.getElementById('message');

// Game settings
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PLAYER_WIDTH = 100;
const BUBBLE_SIZE = 120;
const TOTAL_BUBBLES = 5;
const WIN_SCORE = 10;

let bubbles = [];
let score = 0;
let gameRunning = false;
let bubbleMoveInterval;

// Bubble colors and symbols to create variety
const bubbleStyles = [
    { borderColor: '#ff5252', bgColor: '#ff8a80', symbol: '❤' },
    { borderColor: '#448aff', bgColor: '#82b1ff', symbol: '★' },
    { borderColor: '#ffd740', bgColor: '#fff176', symbol: '☀' },
    { borderColor: '#69f0ae', bgColor: '#b9f6ca', symbol: '❀' },
    { borderColor: '#ff6e40', bgColor: '#ff9e80', symbol: '☁' }
];

// Initialize bubbles with position, style, speed
function createBubbles() {
    bubblesContainer.innerHTML = '';
    bubbles = [];
    for (let i = 0; i < TOTAL_BUBBLES; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        // Apply style from bubbleStyles
        const style = bubbleStyles[i % bubbleStyles.length];
        bubble.style.borderColor = style.borderColor;
        bubble.style.backgroundColor = style.bgColor;
        bubble.textContent = style.symbol;
        // Position bubble randomly inside the game container (top area)
        const x = Math.random() * (GAME_WIDTH - BUBBLE_SIZE);
        const y = Math.random() * (GAME_HEIGHT / 2 - BUBBLE_SIZE);
        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;
        // Speed and direction for horizontal movement
        const speed = (Math.random() * 1.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1);
        bubbles.push({
            element: bubble,
            x: x,
            y: y,
            speed: speed
        });
        bubblesContainer.appendChild(bubble);
        // Add click event to catch bubble
        bubble.addEventListener('click', () => {
            if (!gameRunning) return;
            catchBubble(i);
        });
    }
}

// Move bubbles horizontally and bounce on edges
function moveBubbles() {
    bubbles.forEach(bubble => {
        bubble.x += bubble.speed;
        if (bubble.x <= 0) {
            bubble.x = 0;
            bubble.speed = -bubble.speed;
        } else if (bubble.x >= GAME_WIDTH - BUBBLE_SIZE) {
            bubble.x = GAME_WIDTH - BUBBLE_SIZE;
            bubble.speed = -bubble.speed;
        }
        bubble.element.style.left = `${bubble.x}px`;
    });
}

// Catch a bubble (increase score and reposition it)
function catchBubble(index) {
    score += 1;
    scoreDisplay.textContent = score;
    // Play a simple pop effect - scale bubble briefly
    const bubble = bubbles[index];
    bubble.element.style.transform = 'scale(1.3)';
    setTimeout(() => {
        if (bubble.element) bubble.element.style.transform = '';
    }, 150);
    // Reposition bubble randomly at top area
    bubble.x = Math.random() * (GAME_WIDTH - BUBBLE_SIZE);
    bubble.y = Math.random() * (GAME_HEIGHT / 2 - BUBBLE_SIZE);
    bubble.element.style.left = `${bubble.x}px`;
    bubble.element.style.top = `${bubble.y}px`;
    // Check win condition
    if (score >= WIN_SCORE) {
        endGame(true);
    }
}

// Update player position based on mouse X
function updatePlayerPosition(mouseX) {
    // Calculate relative position inside game container
    const rect = gameContainer.getBoundingClientRect();
    let relativeX = mouseX - rect.left;
    // Clamp position so player stays inside container
    relativeX = Math.max(PLAYER_WIDTH / 2, Math.min(relativeX, GAME_WIDTH - PLAYER_WIDTH / 2));
    player.style.left = `${relativeX}px`;
}

// Start game
function startGame() {
    score = 0;
    scoreDisplay.textContent = score;
    messageDisplay.textContent = '';
    gameRunning = true;
    startBtn.disabled = true;
    createBubbles();
    // Reset player position to center
    player.style.left = `${GAME_WIDTH / 2}px`;
    // Move bubbles every 20ms
    bubbleMoveInterval = setInterval(() => {
        if (!gameRunning) return;
        moveBubbles();
    }, 20);
}

// End game with win or lose
function endGame(won) {
    gameRunning = false;
    clearInterval(bubbleMoveInterval);
    startBtn.disabled = false;
    if (won) {
        messageDisplay.textContent = '🎉 You caught all the giant bubbles! You win! 🎉';
    } else {
        messageDisplay.textContent = 'Game Over! Try again!';
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);

// Track mouse movement inside game container to move player
gameContainer.addEventListener('mousemove', e => {
    if (!gameRunning) return;
    updatePlayerPosition(e.clientX);
});

// Optional: Lose condition if bubbles reach bottom (not implemented for simplicity)

// Initial setup
scoreDisplay.textContent = '0';
messageDisplay.textContent = 'Click Start to play!';