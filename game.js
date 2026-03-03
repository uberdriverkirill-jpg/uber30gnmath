// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameRunning = false;
let gameStarted = false;
let score = 0;
let speed = 0;
let maxSpeed = 0;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 60,
    speed: 0,
    maxSpeed: 15
};

// Obstacles
let obstacles = [];
let trees = [];
let mountains = [];
let snow = [];

// Input handling
let keys = {};
let mouseX = canvas.width / 2;

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
});

window.addEventListener('touchmove', (e) => {
    mouseX = e.touches[0].clientX;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Parallax mountains
class Mountain {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = -this.height;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }
}

// Obstacles
class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50 + Math.random() * 30;
        this.height = 40;
        this.speed = 8 + speed * 0.2;
    }

    update() {
        this.y += this.speed + speed * 0.3;
    }

    draw() {
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Warning pattern
        ctx.fillStyle = '#ff6b6b';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(this.x + i * 20, this.y, 10, 10);
            ctx.fillRect(this.x + i * 20, this.y + this.height - 10, 10, 10);
        }
    }

    isColliding(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
}

// Trees
class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 6;
    }

    update() {
        this.y += this.speed + speed * 0.2;
    }

    draw() {
        // Tree trunk
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x - 10, this.y, 20, 40);

        // Tree foliage
        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 20, 30, 0, Math.PI * 2);
        ctx.fill();

        // Snow on tree
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x - 15, this.y - 15, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    isColliding(player) {
        return Math.hypot(
            (this.x - (player.x + player.width / 2)),
            (this.y - (player.y + player.height / 2))
        ) < 40;
    }
}

// Snowflakes for parallax
class SnowFlake {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speed = this.size / 2;
    }

    update() {
        this.y += this.speed + speed * 0.1;
        this.x += Math.sin(this.y * 0.01) * 0.5;

        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameRunning = true;
    gameStarted = true;
    score = 0;
    speed = 0;
    maxSpeed = 0;
    player.x = canvas.width / 2;
    obstacles = [];
    trees = [];
    mountains = [];
    snow = [];

    // Initialize parallax elements
    for (let i = 0; i < 3; i++) {
        mountains.push(new Mountain(Math.random() * canvas.width, -100, 300, 200, 2 + i * 0.5));
    }

    for (let i = 0; i < 50; i++) {
        snow.push(new SnowFlake());
    }

    gameLoop();
}

function updatePlayer() {
    // Keyboard and mouse controls
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x -= 8;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x += 8;
    }

    // Mouse/touch control
    const screenCenter = canvas.width / 2;
    const diff = mouseX - screenCenter;
    player.x += diff * 0.01;

    // Keep player on screen
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Accelerate
    if (speed < player.maxSpeed) {
        speed += 0.3;
    } else {
        speed = player.maxSpeed;
    }

    maxSpeed = Math.max(maxSpeed, speed);
}

function updateObstacles() {
    // Spawn new obstacles
    if (Math.random() < 0.02 + speed * 0.005) {
        obstacles.push(new Obstacle(Math.random() * (canvas.width - 80) + 40, -50));
    }

    // Update and remove obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();

        // Collision detection
        if (obstacles[i].isColliding(player)) {
            endGame();
            return;
        }

        // Remove if off screen
        if (obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
            score += 10 + Math.floor(speed * 5);
        }
    }
}

function updateTrees() {
    // Spawn new trees
    if (Math.random() < 0.015 + speed * 0.003) {
        trees.push(new Tree(Math.random() * (canvas.width - 60) + 30, -60));
    }

    // Update and remove trees
    for (let i = trees.length - 1; i >= 0; i--) {
        trees[i].update();

        // Collision detection
        if (trees[i].isColliding(player)) {
            endGame();
            return;
        }

        // Remove if off screen
        if (trees[i].y > canvas.height) {
            trees.splice(i, 1);
        }
    }
}

function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Score: ${score}`;
    document.getElementById('finalSpeed').textContent = `Max Speed: ${Math.floor(maxSpeed * 10)} km/h`;
    document.getElementById('gameOver').style.display = 'block';
}

function drawPlayer() {
    // Player body
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Player head
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y - 10, 12, 0, Math.PI * 2);
    ctx.fill();

    // Goggles
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 8, player.y - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 + 8, player.y - 10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Snowboard
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(player.x - 5, player.y + player.height, 50, 15);

    // Motion blur effect
    if (speed > 5) {
        ctx.fillStyle = `rgba(255, 107, 157, ${speed / player.maxSpeed * 0.3})`;
        ctx.fillRect(player.x - 10, player.y, player.width, player.height);
    }
}

function drawUI() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('speed').textContent = `Speed: ${Math.floor(speed * 10)} km/h`;
}

function gameLoop() {
    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameRunning) {
        // Draw parallax mountains
        mountains.forEach(mountain => {
            mountain.update();
            mountain.draw();
        });

        // Draw snow
        snow.forEach(flake => {
            flake.update();
            flake.draw();
        });

        // Draw road lines for parallax effect
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Update and draw game elements
        updatePlayer();
        updateObstacles();
        updateTrees();

        // Draw obstacles
        obstacles.forEach(obstacle => obstacle.draw());

        // Draw trees
        trees.forEach(tree => tree.draw());

        // Draw player
        drawPlayer();

        // Draw snow on ground
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

        drawUI();
    }

    if (gameStarted) {
        requestAnimationFrame(gameLoop);
    }
}

// Show start screen
document.getElementById('startScreen').style.display = 'block';
