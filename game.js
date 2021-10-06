const KEYS = {
  LEFT: 37,
  RIGHT: 39,
  SPACE: 32,
};

const game = {
  running: true,
  ctx: null,
  platform: null,
  ball: null,
  blocks: [],
  score: 0,
  rows: 4,
  cols: 8,
  width: 640,
  height: 360,
  sprites: {
    background: null,
    ball: null,
    platform: null,
    block: null,
  },
  sounds: {
    bump: null,
  },
  init() {
    this.ctx = document.getElementById("mycanvas").getContext("2d");
    this.setEvents();
    this.setTextFont();
  },
  setEvents() {
    window.addEventListener("keydown", ({ keyCode }) => {
      if (keyCode === KEYS.SPACE) {
        this.platform.fire();
      } else if (keyCode === KEYS.LEFT || keyCode === KEYS.RIGHT) {
        this.platform.start(keyCode);
      }
    });
    window.addEventListener("keyup", () => {
      this.platform.stop();
    });
  },
  setTextFont() {
    this.ctx.font = "20px Arial";
    this.ctx.fillStyle = "#FFFFFF";
  },
  preload(callback) {
    let loaded = 0;
    let required = Object.keys(this.sprites).length;
    required += Object.keys(this.sounds).length;

    const onResourceLoad = () => {
      ++loaded;
      if (loaded >= required) {
        callback();
      }
    };

    this.preloadSprites(onResourceLoad);
    this.preloadAudio(onResourceLoad);
  },
  preloadSprites(listener) {
    for (let key in this.sprites) {
      this.sprites[key] = new Image();
      this.sprites[key].src = `img/${key}.png`;
      this.sprites[key].addEventListener("load", listener);
    }
  },
  preloadAudio(listener) {
    for (let key in this.sounds) {
      this.sounds[key] = new Audio(`sounds/${key}.mp3`);
      this.sounds[key].addEventListener("canplaythrough", listener, {
        once: true,
      });
    }
  },
  create() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.blocks.push({
          active: true,
          width: 60,
          height: 20,
          x: 64 * col + 65,
          y: 24 * row + 35,
        });
      }
    }
  },
  update() {
    this.collideBlocks();
    this.collidePlatform();
    this.ball.collideWorldBounds();
    this.platform.collideWorldBounds();
    this.platform.move();
    this.ball.move();
  },
  addScore() {
    ++this.score;
    if (this.score >= this.blocks.length) {
      this.end("You win!");
    }
  },
  collideBlocks() {
    for (let block of this.blocks) {
      if (block.active && this.ball.collide(block)) {
        this.ball.bumpBlock(block);
        this.addScore();
        this.sounds.bump.play();
      }
    }
  },
  collidePlatform() {
    if (this.ball.collide(this.platform)) {
      this.ball.bumpPlatform(this.platform);
      this.sounds.bump.play();
    }
  },
  run() {
    if (this.running) {
      window.requestAnimationFrame(() => {
        this.update();
        this.render();
        this.run();
      });
    }
  },
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.drawImage(this.sprites.background, 0, 0);
    this.ctx.drawImage(
      this.sprites.ball,
      this.ball.frame * this.ball.width,
      0,
      this.ball.width,
      this.ball.height,
      this.ball.x,
      this.ball.y,
      this.ball.width,
      this.ball.height
    );
    this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
    this.renderBlocks();
    this.ctx.fillText(`Score: ${this.score}`, 15, 20);
  },
  renderBlocks() {
    for (let block of this.blocks) {
      if (block.active) {
        this.ctx.drawImage(this.sprites.block, block.x, block.y);
      }
    }
  },
  start() {
    this.init();
    this.preload(() => {
      this.create();
      this.run();
    });
  },
  end(message) {
    game.running = false;
    alert(message);
    window.location.reload();
  },
  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
};

game.ball = {
  velocity: 3,
  dx: 0,
  dy: 0,
  x: 320,
  y: 280,
  width: 20,
  height: 20,
  frame: 0,
  start() {
    this.dy = -this.velocity;
    this.dx = game.random(-this.velocity, this.velocity);
    this.animate();
  },
  animate() {
    setInterval(() => {
      ++this.frame;
      if (this.frame > 3) {
        this.frame = 0;
      }
    }, 100);
  },
  move() {
    if (this.dy) {
      this.y += this.dy;
    }
    if (this.dx) {
      this.x += this.dx;
    }
  },
  collide(element) {
    let x = this.x + this.dx;
    let y = this.y + this.dy;

    if (
      x + this.width > element.x &&
      x < element.x + element.width &&
      y + this.height > element.y &&
      y < element.y + element.height
    ) {
      return true;
    } else {
      return false;
    }
  },
  collideWorldBounds() {
    let x = this.x + this.dx;
    let y = this.y + this.dy;

    let ballLeft = x;
    let ballRight = ballLeft + this.width;
    let ballTop = y;
    let ballBottom = ballTop + this.height;

    let worldLeft = 0;
    let worldRight = game.width;
    let worldTop = 0;
    let worldBottom = game.height;

    if (ballLeft < worldLeft) {
      this.x = 0;
      this.dx = this.velocity;
      game.sounds.bump.play();
    } else if (ballRight > worldRight) {
      this.x = worldRight - this.width;
      this.dx = -this.velocity;
      game.sounds.bump.play();
    } else if (ballTop < worldTop) {
      this.y = 0;
      this.dy = this.velocity;
      game.sounds.bump.play();
    } else if (ballBottom > worldBottom) {
      game.end("You lose!");
    }
  },
  bumpBlock(block) {
    this.dy *= -1;
    block.active = false;
  },
  bumpPlatform(platform) {
    if (platform.dx) {
      this.x += platform.dx;
    }
    if (this.dy > 0) {
      this.dy = -this.velocity;
      let touchX = this.x + this.width / 2;
      this.dx = this.velocity * platform.getTouchOffset(touchX);
    }
  },
};

game.platform = {
  velocity: 6,
  dx: 0,
  x: 280,
  y: 300,
  width: 100,
  height: 14,
  ball: game.ball,
  fire() {
    if (this.ball) {
      this.ball.start();
      this.ball = null;
    }
  },
  start(direction) {
    if (direction === KEYS.RIGHT) {
      this.dx = this.velocity;
    } else {
      this.dx = -this.velocity;
    }
  },
  stop() {
    this.dx = 0;
  },
  move() {
    if (this.dx) {
      this.x += this.dx;
      if (this.ball) {
        this.ball.x += this.dx;
      }
    }
  },
  getTouchOffset(x) {
    let diff = this.x + this.width - x;
    let offset = this.width - diff;
    let result = (2 * offset) / this.width;
    return result - 1;
  },
  collideWorldBounds() {
    let x = this.x + this.dx;

    let platformLeft = x;
    let platformRight = platformLeft + this.width;

    let worldLeft = 0;
    let worldRight = game.width;

    if (platformLeft < worldLeft) {
      this.x = 0;
      this.dx = 0;
    } else if (platformRight > worldRight) {
      this.x = game.width - this.width;
      this.dx = 0;
    }
  },
};

window.addEventListener("load", () => game.start());
