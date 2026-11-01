
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --------------------------------
// PLAYER SETTINGS
// --------------------------------

const PLAYER_WIDTH = 120;
const PLAYER_HEIGHT = 150;
const PLAYER_X = 165;

const playerImage = new Image();
playerImage.src = "images/player.png";

let playerImageLoaded = false;

playerImage.onload = () => {
    playerImageLoaded = true;
};

// --------------------------------
// AUDIO SETTINGS
// --------------------------------

const backgroundMusic = new Audio("audio/background.mpeg");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.45;

const gameOverSound = new Audio("audio/gameover.mpeg");
gameOverSound.volume = 0.8;

function playMusic() {
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
            console.log("Music playback needs a user interaction.", error);
        });
    }
}

function stopMusic() {
    backgroundMusic.pause();
}

// --------------------------------
// DIFFICULTY SETTINGS
// --------------------------------

const difficulties = {
    easy: {
        gravity: 520,
        flyPower: -300,
        obstacleSpeed: 125,
        obstacleGap: 280,
        obstacleInterval: 2.5
    },

    medium: {
        gravity: 620,
        flyPower: -330,
        obstacleSpeed: 175,
        obstacleGap: 235,
        obstacleInterval: 2.0
    }
};

let selectedDifficulty = "easy";
let settings = difficulties.easy;

// --------------------------------
// GAME VARIABLES
// --------------------------------

let player = {
    x: PLAYER_X,
    y: HEIGHT / 2,
    velocity: 0
};

let obstacles = [];
let stars = [];

let score = 0;
let gameTime = 0;
let obstacleTimer = 0;

let gameState = "menu";
// menu, playing, gameover

let lastTime = 0;

// --------------------------------
// CREATE SPACE STARS
// --------------------------------

for (let i = 0; i < 110; i++) {
    stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 35 + 10,
        alpha: Math.random() * 0.7 + 0.3
    });
}

// --------------------------------
// SPACE BACKGROUND
// --------------------------------

function drawBackground(deltaTime = 0) {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);

    gradient.addColorStop(0, "#05091e");
    gradient.addColorStop(0.5, "#111b48");
    gradient.addColorStop(1, "#080b22");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Nebula clouds
    const nebula1 = ctx.createRadialGradient(
        220, 180, 10,
        220, 180, 260
    );

    nebula1.addColorStop(0, "rgba(113, 54, 190, 0.32)");
    nebula1.addColorStop(1, "rgba(113, 54, 190, 0)");

    ctx.fillStyle = nebula1;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const nebula2 = ctx.createRadialGradient(
        700, 400, 10,
        700, 400, 260
    );

    nebula2.addColorStop(0, "rgba(0, 170, 220, 0.22)");
    nebula2.addColorStop(1, "rgba(0, 170, 220, 0)");

    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Distant planet
    ctx.beginPath();
    ctx.arc(730, 135, 65, 0, Math.PI * 2);

    const planetGradient = ctx.createLinearGradient(
        670, 80, 790, 190
    );

    planetGradient.addColorStop(0, "#d18cff");
    planetGradient.addColorStop(0.5, "#7149c9");
    planetGradient.addColorStop(1, "#30206d");

    ctx.fillStyle = planetGradient;
    ctx.fill();

    // Planet rings
    ctx.beginPath();
    ctx.ellipse(730, 140, 100, 22, -0.25, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(188, 179, 255, 0.65)";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Stars
    stars.forEach(star => {
        if (gameState === "playing") {
            star.x -= star.speed * deltaTime;

            if (star.x < 0) {
                star.x = WIDTH;
                star.y = Math.random() * HEIGHT;
            }
        }

        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "#ffffff";

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;

    // Subtle space floor
    const floorGradient = ctx.createLinearGradient(
        0, HEIGHT - 35, 0, HEIGHT
    );

    floorGradient.addColorStop(0, "rgba(55, 94, 175, 0)");
    floorGradient.addColorStop(1, "rgba(28, 42, 100, 0.55)");

    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, HEIGHT - 35, WIDTH, 35);
}

// --------------------------------
// DRAW PLAYER
// --------------------------------

function drawPlayer() {
    const x = player.x - PLAYER_WIDTH / 2;
    const y = player.y - PLAYER_HEIGHT / 2;

    ctx.save();

    // Glowing aura
    ctx.shadowColor = "#55dfff";
    ctx.shadowBlur = 18;

    if (playerImageLoaded) {
        ctx.drawImage(
            playerImage,
            x,
            y,
            PLAYER_WIDTH,
            PLAYER_HEIGHT
        );
    } else {
        ctx.fillStyle = "#58dfff";
        ctx.beginPath();
        ctx.arc(player.x, player.y, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// --------------------------------
// CREATE SPACE GATES
// --------------------------------

function createObstacle() {
    const gap = settings.obstacleGap;

    const minimumY = 65;
    const maximumY = HEIGHT - gap - 65;

    const gapY =
        Math.random() * (maximumY - minimumY) + minimumY;

    obstacles.push({
        x: WIDTH + 20,
        width: 85,
        gapY: gapY,
        gap: gap,
        passed: false
    });
}

// --------------------------------
// DRAW SPACE GATES
// --------------------------------

function drawGatePart(x, y, width, height) {
    if (height <= 0) return;

    const gradient = ctx.createLinearGradient(
        x, 0, x + width, 0
    );

    gradient.addColorStop(0, "#173f91");
    gradient.addColorStop(0.35, "#42d9ff");
    gradient.addColorStop(0.65, "#7765ff");
    gradient.addColorStop(1, "#142d77");

    ctx.save();

    ctx.shadowColor = "#48cfff";
    ctx.shadowBlur = 18;

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    ctx.restore();

    // Gate border
    ctx.strokeStyle = "#a8f5ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Decorative energy lines
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;

    for (let lineY = y + 25; lineY < y + height - 10; lineY += 45) {
        ctx.beginPath();
        ctx.moveTo(x + 12, lineY);
        ctx.lineTo(x + width - 12, lineY);
        ctx.stroke();
    }
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        const topHeight = obstacle.gapY;
        const bottomY = obstacle.gapY + obstacle.gap;
        const bottomHeight = HEIGHT - bottomY;

        drawGatePart(
            obstacle.x,
            0,
            obstacle.width,
            topHeight
        );

        drawGatePart(
            obstacle.x,
            bottomY,
            obstacle.width,
            bottomHeight
        );

        // Bright gate edges
        ctx.fillStyle = "#b5faff";

        ctx.fillRect(
            obstacle.x - 5,
            obstacle.gapY - 12,
            obstacle.width + 10,
            12
        );

        ctx.fillRect(
            obstacle.x - 5,
            bottomY,
            obstacle.width + 10,
            12
        );
    });
}

// --------------------------------
// COLLISION DETECTION
// --------------------------------

function checkCollision(obstacle) {
    // Slightly smaller hitbox for fair gameplay
    const left = player.x - 30;
    const right = player.x + 30;
    const top = player.y - 42;
    const bottom = player.y + 42;

    const obstacleLeft = obstacle.x;
    const obstacleRight = obstacle.x + obstacle.width;

    const horizontalHit =
        right > obstacleLeft &&
        left < obstacleRight;

    const verticalHit =
        top < obstacle.gapY ||
        bottom > obstacle.gapY + obstacle.gap;

    return horizontalHit && verticalHit;
}

// --------------------------------
// START GAME
// --------------------------------

function startGame() {
    settings = difficulties[selectedDifficulty];

    player.y = HEIGHT / 2;
    player.velocity = 0;

    obstacles = [];

    score = 0;
    gameTime = 0;
    obstacleTimer = 0;

    gameOverSound.pause();
    gameOverSound.currentTime = 0;

    gameState = "playing";

    backgroundMusic.currentTime = 0;
    playMusic();
}

// --------------------------------
// GAME OVER
// --------------------------------

function endGame() {
    if (gameState !== "playing") return;

    gameState = "gameover";

    stopMusic();

    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(error => {
        console.log("Game over sound could not play:", error);
    });
}

// --------------------------------
// PLAYER FLYING
// --------------------------------

function fly() {
    if (gameState !== "playing") return;

    player.velocity = settings.flyPower;
}

// --------------------------------
// UPDATE GAME
// --------------------------------

function update(deltaTime) {
    if (gameState !== "playing") return;

    gameTime += deltaTime;

    // Player physics
    player.velocity += settings.gravity * deltaTime;
    player.y += player.velocity * deltaTime;

    // Create obstacles
    obstacleTimer += deltaTime;

    if (obstacleTimer >= settings.obstacleInterval) {
        createObstacle();
        obstacleTimer = 0;
    }

    // Move obstacles and check collision
    obstacles.forEach(obstacle => {
        obstacle.x -= settings.obstacleSpeed * deltaTime;

        if (
            !obstacle.passed &&
            obstacle.x + obstacle.width < player.x
        ) {
            obstacle.passed = true;
            score++;
        }

        if (checkCollision(obstacle)) {
            endGame();
        }
    });

    obstacles = obstacles.filter(
        obstacle => obstacle.x + obstacle.width > 0
    );

    // Screen boundary collision
    if (
        player.y - 42 < 0 ||
        player.y + 42 > HEIGHT
    ) {
        endGame();
    }
}

// --------------------------------
// SCORE AND TIMER
// --------------------------------

function drawScore() {
    ctx.textAlign = "left";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 29px Arial";

    ctx.shadowColor = "#4bdfff";
    ctx.shadowBlur = 12;

    ctx.fillText("SCORE: " + score, 25, 45);

    ctx.font = "19px Arial";
    ctx.fillText(
        "TIME: " + Math.floor(gameTime) + "s",
        25,
        75
    );

    ctx.shadowBlur = 0;

    ctx.textAlign = "right";
    ctx.font = "bold 17px Arial";
    ctx.fillStyle = "#b9eaff";

    ctx.fillText(
        selectedDifficulty.toUpperCase(),
        WIDTH - 25,
        45
    );

    ctx.textAlign = "left";
}

// --------------------------------
// BUTTON DRAWING
// --------------------------------

function drawButton(x, y, width, height, label, active = false) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);

    if (active) {
        gradient.addColorStop(0, "#3ee6ff");
        gradient.addColorStop(1, "#6464ff");
    } else {
        gradient.addColorStop(0, "#263b78");
        gradient.addColorStop(1, "#202653");
    }

    ctx.save();

    ctx.shadowColor = active ? "#48dfff" : "#171d55";
    ctx.shadowBlur = active ? 18 : 8;

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 13);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = active ? "#d0fbff" : "#7788cc";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 21px Arial";
    ctx.fillText(label, x + width / 2, y + height / 2 + 7);
}

// --------------------------------
// MENU SCREEN
// --------------------------------

function drawMenu() {
    ctx.fillStyle = "rgba(3, 7, 25, 0.45)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = "center";

    ctx.shadowColor = "#63dfff";
    ctx.shadowBlur = 20;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 43px Arial";
    ctx.fillText("FLY THROUGH THE MIST", WIDTH / 2, 170);

    ctx.shadowBlur = 0;

    ctx.font = "20px Arial";
    ctx.fillStyle = "#b9dfff";
    ctx.fillText("SPACE ADVENTURE", WIDTH / 2, 210);

    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SELECT YOUR DIFFICULTY", WIDTH / 2, 290);

    drawButton(
        275, 325, 150, 55,
        "EASY",
        selectedDifficulty === "easy"
    );

    drawButton(
        475, 325, 150, 55,
        "MEDIUM",
        selectedDifficulty === "medium"
    );

    drawButton(
        350, 425, 200, 65,
        "START GAME",
        true
    );

    ctx.font = "16px Arial";
    ctx.fillStyle = "#d4e6ff";
    ctx.fillText(
        "Avoid the glowing space gates!",
        WIDTH / 2,
        535
    );
}

// --------------------------------
// GAME OVER SCREEN
// --------------------------------

function drawGameOver() {
    ctx.fillStyle = "rgba(2, 5, 20, 0.75)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = "center";

    ctx.shadowColor = "#ff54bb";
    ctx.shadowBlur = 20;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 55px Arial";
    ctx.fillText("GAME OVER", WIDTH / 2, 220);

    ctx.shadowBlur = 0;

    ctx.font = "29px Arial";
    ctx.fillStyle = "#8feaff";
    ctx.fillText("YOUR SCORE: " + score, WIDTH / 2, 285);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#d5ddff";
    ctx.fillText(
        "Difficulty: " + selectedDifficulty.toUpperCase(),
        WIDTH / 2,
        325
    );

    drawButton(
        350, 390, 200, 65,
        "PLAY AGAIN",
        true
    );

    ctx.font = "16px Arial";
    ctx.fillStyle = "#c5d5ff";
    ctx.fillText(
        "Click PLAY AGAIN to restart",
        WIDTH / 2,
        490
    );
}

// --------------------------------
// DRAW GAME
// --------------------------------

function draw(deltaTime) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawBackground(deltaTime);

    if (gameState === "playing" || gameState === "gameover") {
        drawObstacles();
        drawPlayer();
        drawScore();
    }

    if (gameState === "menu") {
        drawPlayer();
        drawMenu();
    }

    if (gameState === "gameover") {
        drawGameOver();
    }
}

// --------------------------------
// MAIN GAME LOOP
// --------------------------------

function gameLoop(timestamp) {
    const deltaTime = lastTime
        ? Math.min((timestamp - lastTime) / 1000, 0.04)
        : 0;

    lastTime = timestamp;

    update(deltaTime);
    draw(deltaTime);

    requestAnimationFrame(gameLoop);
}

// --------------------------------
// MOUSE AND TOUCH CONTROLS
// --------------------------------

canvas.addEventListener("pointerdown", event => {
    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) * WIDTH / rect.width;
    const y = (event.clientY - rect.top) * HEIGHT / rect.height;

    if (gameState === "menu") {
        // Easy button
        if (x >= 275 && x <= 425 && y >= 325 && y <= 380) {
            selectedDifficulty = "easy";
            return;
        }

        // Medium button
        if (x >= 475 && x <= 625 && y >= 325 && y <= 380) {
            selectedDifficulty = "medium";
            return;
        }

        // Start button
        if (x >= 350 && x <= 550 && y >= 425 && y <= 490) {
            startGame();
        }

        return;
    }

    if (gameState === "gameover") {
        // Play again button
        if (x >= 350 && x <= 550 && y >= 390 && y <= 455) {
            startGame();
        }

        return;
    }

    if (gameState === "playing") {
        fly();
    }
});

// --------------------------------
// KEYBOARD CONTROLS
// --------------------------------

document.addEventListener("keydown", event => {
    if (
        event.code === "Space" ||
        event.code === "ArrowUp"
    ) {
        event.preventDefault();

        if (event.repeat) return;

        if (gameState === "menu") {
            startGame();
        } else if (gameState === "playing") {
            fly();
        } else if (gameState === "gameover") {
            startGame();
        }
    }
});

// --------------------------------
// START ANIMATION
// --------------------------------

requestAnimationFrame(gameLoop);
