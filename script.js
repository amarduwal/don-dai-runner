const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// UI elements
const startBtn = document.getElementById('startBtn');
const resetScoreBtn = document.getElementById('resetScore');
const menu = document.getElementById('menu');
const gameDiv = document.getElementById('game');
const scoreSpan = document.getElementById('score');
const highScoreSpan = document.getElementById('highScore');
const menuHighScore = document.getElementById('menuHighScore');
const targetDistance = 25000; // Set the target distance for the flag (in score points)
const cloudImages = [new Image(), new Image(), new Image(), new Image()];

// Load cloud images
cloudImages[0].src = 'images/cloud1.png';
cloudImages[1].src = 'images/cloud2.png';
cloudImages[2].src = 'images/cloud3.png';
cloudImages[3].src = 'images/cloud4.png';

// Load obstacle images
const mountainImage = new Image();
mountainImage.src = 'images/mountain.png'; // Ensure this file exists in your directory

const lionImage = new Image();
lionImage.src = 'images/lion.png'; // Ensure this file exists in your directory

const playerImage = new Image();
playerImage.src = 'images/mario.png';

const flagImage = new Image();
flagImage.src = 'images/nepal.png'; // Ensure the flag image is available

const bgImage = new Image();
bgImage.src = 'images/background.png'; // Ensure the background image is available

// Player animation settings
const frameWidth = 28; // Width of each frame in the sprite sheet
const frameHeight = 42; // Height of each frame in the sprite sheet
const totalFrames = 6; // Total number of frames in the sprite sheet
let currentFrame = 0; // Current frame index
let frameTimer = 0; // Timer to control animation speed
const frameSpeed = 100; // Speed of animation (in ms)

// Obstacle size (adjust dynamically based on canvas or keep constant)
const obstacleWidth = 40; // Set obstacle width
const obstacleHeight = 40; // Set obstacle height

// Initialize obstacles
const obstacles = [
  { x: 300, y: canvas.height - obstacleHeight - 10, type: 'mountain' },
  { x: 600, y: canvas.height - obstacleHeight - 10, type: 'lion' },
];

const clouds = []; // Array to store active clouds

// Game variables
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let player = { x: 50, y: 220, width: 40, height: 40, dy: 0, jumping: false };
let speed = 3;
let lastObstacleTime = 0;
const groundLevel = canvas.height; // Base Y-axis level for player and obstacles
const cloudSpeed = 1.5;
let nextObstacleGap = 1500; // Initial gap between obstacles in ms
let hasWon = false; // Track whether the player has won

const flagX = canvas.width - 100; // Fixed flag X position
const flagY = groundLevel - 62; // Fixed flag Y position
let celebrationTimer = 0; // Timer for celebration animation
const celebrationDuration = 3000; // 2 seconds for celebration animation

const flagWidth = 50; // Width of the flag
const flagHeight = 60; // Height of the flag
let flagXWorld = targetDistance; // World position of the flag (fixed)
let flagVisibleX = null; // Canvas position of the flag (calculated dynamically)

// Update for stopping elements after collision
let stopElements = false; // Flag to stop all elements after reaching the target

let gameState = 'playing'; // Possible values: 'playing', 'celebrating', 'waitingForRestart'

// Reference the buttons
const homeBtn = document.getElementById('homeBtn');
const restartBtn = document.getElementById('restartBtn');

// Initialize high score
highScoreSpan.textContent = `High Score: ${highScore}`;
menuHighScore.textContent = `High Score: ${highScore}`;

// Function to add clouds randomly
function generateClouds() {
  if (Math.random() < 0.02) {
    // Adjust spawn rate
    clouds.push({
      x: canvas.width,
      y: Math.random() * (canvas.height / 5),
      speed: 1 + Math.random() * 2, // Random speed for each cloud
      img: cloudImages[Math.floor(Math.random() * cloudImages.length)], // Random cloud image
    });
  }
}

// Function to draw clouds
function drawClouds() {
  clouds.forEach((cloud, index) => {
    ctx.drawImage(cloud.img, cloud.x, cloud.y, 150, 75); // Adjust size as needed
    cloud.x -= cloud.speed; // Move cloud left

    // Remove off-screen clouds
    if (cloud.x + 150 < 0) clouds.splice(index, 1);
  });
}

function gameOver() {
  gameRunning = false;

  // Display the game over message
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent overlay
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = '24px Arial';
  ctx.fillText(
    `Your Score: ${score}`,
    canvas.width / 2,
    canvas.height / 2 + 20
  );

  // Show the home and restart buttons
  controls.style.display = 'flex'; // Show controls at the bottom of the game screen
  setTimeout(() => controls.classList.add('show'), 50); // Add fade-in effect
}

function drawFlag() {
  if (!stopElements) {
    // Calculate the flag's canvas position dynamically as the player moves
    flagVisibleX = flagXWorld - score;
  }

  // Draw the flag only when it becomes visible on the screen
  if (flagVisibleX >= 0 && flagVisibleX <= canvas.width) {
    ctx.drawImage(flagImage, flagVisibleX, flagY, flagWidth, flagHeight);
  }
}

function checkFlagCollision() {
  if (
    player.x + player.width >= flagVisibleX && // Player's right edge touches the flag
    player.y + player.height >= flagY && // Player is at the same height as the flag
    !stopElements // Check to prevent multiple triggers
  ) {
    stopElements = true; // Freeze game elements
    startCelebration(); // Trigger celebration animation
  }
}

function startCelebration() {
  gameState = 'celebrating';
  let celebrationTimer = 0;

  function celebrationLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Keep the flag and player in their final positions
    ctx.drawImage(flagImage, flagVisibleX, flagY, flagWidth, flagHeight);
    drawPlayerJumpAnimation(); // Optional celebration animation

    celebrationTimer += 16;

    // End celebration and move to restart state
    if (celebrationTimer >= 2000) {
      // Celebration duration: 2 seconds
      gameState = 'waitingForRestart';
      drawWinningScreen(); // Display restart instructions
    } else {
      requestAnimationFrame(celebrationLoop);
    }
  }

  requestAnimationFrame(celebrationLoop);
}

function celebrationLoop(timestamp) {
  // Clear canvas and draw background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  // Keep the flag and player in their final positions
  ctx.drawImage(flagImage, flagVisibleX, flagY, flagWidth, flagHeight);
  drawPlayerJumpAnimation(); // Play jump animation for the player

  // Play celebration animation (e.g., player jumps or confetti falls)
  drawPlayerJumpAnimation();

  celebrationTimer += 16; // Increment timer (approx. 16ms per frame)

  if (celebrationTimer < celebrationDuration) {
    requestAnimationFrame(celebrationLoop); // Continue celebration
  } else {
    drawWinningScreen(); // Show the winning screen
  }
}

function drawPlayerJumpAnimation() {
  const jumpHeight = 20; // Height of the jump
  const animationSpeed = 200; // Speed of jump (ms)

  // Create a bouncing effect using sine wave
  const bounce =
    jumpHeight *
    Math.abs(Math.sin((celebrationTimer / animationSpeed) * Math.PI));
  ctx.drawImage(
    playerImage,
    currentFrame * frameWidth, // Animate using the sprite sheet
    0,
    frameWidth,
    frameHeight,
    player.x,
    player.y - bounce, // Apply bouncing effect
    player.width,
    player.height
  );
}

function drawWinningScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 You Win! 🎉', canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = '32px Arial';
  ctx.fillText(
    `Final Score: ${score}`,
    canvas.width / 2,
    canvas.height / 2 + 20
  );

  ctx.font = '24px Arial';
  ctx.fillText(
    'Press Start to Play Again',
    canvas.width / 2,
    canvas.height / 2 + 70
  );

  gameState = 'waitingForRestart'; // Set the game state to "waiting for restart"
  // Show the home and restart buttons
  controls.style.display = 'flex'; // Show controls at the bottom of the game screen
  setTimeout(() => controls.classList.add('show'), 50); // Add fade-in effect
}

function drawLoosingScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    '😞 Sorry! You Loose! 😞',
    canvas.width / 2,
    canvas.height / 2 - 50
  );

  ctx.font = '32px Arial';
  ctx.fillText(
    `Final Score: ${score}`,
    canvas.width / 2,
    canvas.height / 2 + 20
  );

  ctx.font = '24px Arial';
  ctx.fillText(
    'Restart to Play Again',
    canvas.width / 2,
    canvas.height / 2 + 70
  );

  gameState = 'waitingForRestart'; // Set the game state to "waiting for restart"
  // Show the home and restart buttons
  controls.style.display = 'flex'; // Show controls at the bottom of the game screen
  setTimeout(() => controls.classList.add('show'), 50); // Add fade-in effect
}

function resetHighScore() {
  localStorage.removeItem('highScore');
  highScore = 0;
  highScoreSpan.textContent = `High Score: ${highScore}`;
  menuHighScore.textContent = `High Score: ${highScore}`;
}

// Update player animation
function updatePlayerAnimation(deltaTime) {
  frameTimer += 16;
  if (frameTimer >= frameSpeed) {
    currentFrame = (currentFrame + 1) % totalFrames; // Loop through frames
    frameTimer = 0;
  }
}

// Draw player with animation
function drawPlayer() {
  ctx.drawImage(
    playerImage, // Sprite sheet
    currentFrame * frameWidth, // Source X (frame position)
    0, // Source Y (assuming all frames are in the first row)
    frameWidth, // Source width
    frameHeight, // Source height
    player.x, // Player's X position
    player.y, // Player's Y position
    player.width, // Player's width on canvas
    player.height // Player's height on canvas
  );
}

// Generate a new obstacle
function generateObstacle() {
  const type = Math.random() > 0.5 ? 'mountain' : 'lion'; // Randomize type
  obstacles.push({
    x: canvas.width, // Start at the right edge of the canvas
    y: canvas.height - obstacleHeight, // Align with the ground
    type: type, // Assign the obstacle type
  });
}

// Obstacle logic (updated to include images)
function drawObstacle(obstacle) {
  // Check if the obstacle type is "mountain" or "lion"
  const imageToDraw = obstacle.type === 'mountain' ? mountainImage : lionImage;

  // Draw the obstacle
  ctx.drawImage(
    imageToDraw, // Use the appropriate image
    obstacle.x, // X position
    obstacle.y, // Y position
    obstacleWidth, // Width of the obstacle
    obstacleHeight // Height of the obstacle
  );
}

// Update obstacles and manage their movement
function updateObstacles(timestamp) {
  // Check if it's time to generate a new obstacle
  if (timestamp - lastObstacleTime > nextObstacleGap) {
    generateObstacle();
    lastObstacleTime = timestamp;

    // Adjust next obstacle gap dynamically based on speed and randomness
    const minGap = 500; // Minimum gap (in ms)
    const maxGap = 2000 - speed * 50; // Maximum gap decreases as speed increases
    nextObstacleGap = Math.random() * (maxGap - minGap) + minGap;

    // Occasionally introduce very tight gaps for quick reflexes
    if (Math.random() < 0.2 && speed > 4) {
      nextObstacleGap = Math.max(minGap, nextObstacleGap / 2);
    }
  }

  // Update each obstacle
  obstacles.forEach((obstacle, index) => {
    obstacle.x -= speed; // Move obstacle leftward

    // Collision detection
    if (
      player.x < obstacle.x + obstacleWidth && // Player's right edge past obstacle's left edge
      player.x + player.width > obstacle.x && // Player's left edge before obstacle's right edge
      player.y < obstacle.y + obstacleHeight && // Player's bottom edge above obstacle's top edge
      player.y + player.height > obstacle.y // Player's top edge below obstacle's bottom edge
    ) {
      gameRunning = false;
      drawLoosingScreen();
      endGame();
    }

    // Remove the obstacle if it goes off-screen
    if (obstacle.x + obstacleWidth < 0) {
      obstacles.splice(index, 1); // Remove the obstacle from the array
    }

    // Draw the obstacle
    drawObstacle(obstacle);
  });
}

function updateBackground() {
  // Move clouds
  clouds.forEach((cloud) => {
    cloud.x -= cloudSpeed;
    if (cloud.x + cloud.width < 0) {
      cloud.x = canvas.width + Math.random() * 100;
      // cloud.y = 500 + Math.random() * 100;
      cloud.y = 1000;
    }
  });
}

function drawBackground() {
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height); // Stretch to canvas size
}

function loop(timestamp) {
  if (gameState === 'waitingForRestart') return; // Pause game updates

  if (!gameRunning) return;

  // Stop all updates if the game is frozen
  if (stopElements) {
    // Draw the final frame with the flag and player in their last positions
    drawBackground();
    // Update and draw game elements
    generateClouds();
    drawClouds();

    drawFlag();
    drawPlayer();
    return;
  }

  const deltaTime = timestamp - lastObstacleTime; // Calculate time since last frame

  // Clear canvas and draw background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  // Update and draw game elements
  generateClouds();
  drawClouds();

  updateBackground();

  // Update score
  score++;
  scoreSpan.textContent = `Score: ${score}`;

  // Update player
  player.y += player.dy;
  if (player.y < groundLevel - player.height) {
    player.dy += 0.5; // Gravity
  } else {
    player.y = groundLevel - player.height;
    player.jumping = false;
  }

  // Update player animation
  updatePlayerAnimation(deltaTime);

  // Draw player with animation
  drawPlayer();

  // Draw the flag and check collision
  drawFlag();
  checkFlagCollision();

  updateObstacles(timestamp); // Update obstacles with dynamic generation and movement

  // Increase speed over time
  speed += 0.001;

  // Request next frame
  requestAnimationFrame(loop);
}

function endGame() {
  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
    highScoreSpan.textContent = `High Score: ${highScore}`;
    menuHighScore.textContent = `High Score: ${highScore}`;
  }

  // Stop the game
  gameRunning = false;

  controls.style.display = 'flex'; // Show controls at the bottom of the game screen
  setTimeout(() => controls.classList.add('show'), 50); // Add fade-in effect
}

function resetGameVariables() {
  // Reset game variables
  score = 0;
  speed = 3;
  stopElements = false;
  player = {
    x: 50,
    y: 220,
    width: 30,
    height: 30,
    dy: 0,
    jumping: false,
  };
  obstacles.length = 0; // Clear all obstacles
  lastObstacleTime = 0;
  nextObstacleGap = 1500; // Reset the initial gap
  flagVisibleX = null; // Reset the flag position
  flagXWorld = targetDistance; // Reset flag position in the world
  hasWon = false; // Reset winning condition
  gameState = 'playing'; // Ensure game state is "playing"
}

function startGame() {
  // Reset the game state
  resetGameVariables();

  // Hide buttons with fade-out effect
  controls.classList.remove('show');
  setTimeout(() => (controls.style.display = 'none'), 500);

  // Start the game
  gameState = 'playing';
  gameRunning = true;
  menu.style.display = 'none';
  gameDiv.style.display = 'block';
  // Hide controls and menu, start the game
  controls.style.display = 'none';
  requestAnimationFrame(loop);
}

// Event listeners
startBtn.addEventListener('click', () => {
  if (!gameRunning || gameState === 'waitingForRestart') {
    startGame(); // Restart the game when the "Start" button is clicked
  }
});
resetScoreBtn.addEventListener('click', resetHighScore);
window.addEventListener('keydown', (e) => {
  if ((e.key === ' ' || e.key === 'ArrowUp') && !player.jumping) {
    player.dy = -10;
    player.jumping = true;
  }
});

window.addEventListener('touchstart', () => {
  if (!player.jumping) {
    player.dy = -10; // Jump velocity
    player.jumping = true;
  }
});

// Adjust canvas size initially and on window resize
// window.addEventListener('resize', resizeCanvas);
// resizeCanvas(); // Initial call

// Home button logic
homeBtn.addEventListener('click', () => {
  menu.style.display = 'flex'; // Show the menu
  gameDiv.style.display = 'none'; // Hide the game
  controls.style.display = 'none'; // Hide the controls
  console.log(highScore);
});

// Restart button logic
restartBtn.addEventListener('click', () => {
  startGame(); // Restart the game
});
