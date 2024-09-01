import { EventType, Rect, Surface, WindowBuilder } from "jsr:@divy/sdl2@0.12.0";
import image from "./assets/image.js";
import { decodeBase64 } from "jsr:@std/encoding/base64";

const window = new WindowBuilder(
  "Flappy Bird in Deno 🦕",
  400,
  800,
)
  .build();

const canvas = window.canvas();

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Create a class Entity
class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

function fromAsset(key) {
  const img = image[key];
  if (!img) {
    throw new Error(`Image with key ${key} not found`);
  }
  return decodeBase64(img);
}

const textureCreator = canvas.textureCreator();
const birdSurfaceGameOver = Surface.fromRaw(
  fromAsset("yellowbird-gameover"),
);
const birdTextureGameOver = textureCreator.createTextureFromSurface(
  birdSurfaceGameOver,
);
// Use class Entity and make class Player
class Player extends Entity {
  dead = false;
  constructor() {
    super(170, 100, 34, 24);

    const birdSurfaceMidflap = Surface.fromRaw(
      fromAsset("yellowbird-midflap"),
    );
    const birdTextureMidflap = textureCreator.createTextureFromSurface(
      birdSurfaceMidflap,
    );

    const birdSurfaceUpflap = Surface.fromRaw(
      fromAsset("yellowbird-upflap"),
    );
    const birdTextureUpflap = textureCreator.createTextureFromSurface(
      birdSurfaceUpflap,
    );

    const birdSurfaceDownflap = Surface.fromRaw(
      fromAsset("yellowbird-downflap"),
    );
    const birdTextureDownflap = textureCreator.createTextureFromSurface(
      birdSurfaceDownflap,
    );

    this.textures = [
      birdTextureUpflap,
      birdTextureMidflap,
      birdTextureDownflap,
    ];

    this.animationCycle = 0;
  }

  render() {
    const texture = this.dead
      ? birdTextureGameOver
      : this.textures[this.animationCycle];
    canvas.copy(
      texture,
      new Rect(
        0,
        0,
        this.dead ? 34 : this.width,
        this.dead ? 41 : this.height,
      ),
      new Rect(
        this.x,
        this.y,
        this.dead ? 34 : this.width,
        this.dead ? 41 : this.height,
      ),
    );

    // Wing animation
    this.animationCycle += 1;
    if (this.animationCycle >= 3) {
      this.animationCycle = 0;
    }
  }

  die() {
    this.dead = true;
    this.y += 1;
  }
}

//canvas.setCursor("sprites/cursor.png");

function checkCollision(
  x1,
  y1,
  w1,
  h1,
  x2,
  y2,
  w2,
  h2,
) {
  return !(x2 > w1 + x1 || x1 > w2 + x2 || y2 > h1 + y1 || y1 > h2 + y2);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let is_space = false;
let score_value = 0;

const gravity = 1;
const fps = 9;

const upperPipes = [];
const lowerPipes = [];

const UPPER_PIPE_Y = 0;
const LOWER_PIPE_Y_BASE = 800;
const PIPE_WIDTH = 52;
const PIPE_DISTANCE = 100;
const GAP = 130;

const bgScreenSurface = Surface.fromRaw(fromAsset("background"));
const bgScreenTexture = textureCreator.createTextureFromSurface(
  bgScreenSurface,
);

const startSurface = Surface.fromRaw(fromAsset("start"));
const startTexture = textureCreator.createTextureFromSurface(startSurface);

const pipeSurfaceUp = Surface.fromRaw(fromAsset("pipe-up"));
const pipeTextureUp = textureCreator.createTextureFromSurface(pipeSurfaceUp);

const pipeSurfaceDown = Surface.fromRaw(fromAsset("pipe-down"));
const pipeTextureDown = textureCreator.createTextureFromSurface(
  pipeSurfaceDown,
);

const bird = new Player();

let gameOver = false;
let intro = true;

for (let i = 1; i < 6; i++) {
  const height = getRandomInt(100, 300);
  const distance = (i == 1) ? 0 : PIPE_DISTANCE;
  upperPipes.push({ x: 400 + (PIPE_WIDTH * i) + (distance * i), height });

  // Screen width - Corresponding upper pipe height - Random Gap
  lowerPipes.push({
    x: 400 + (PIPE_WIDTH * i) + (distance * i),
    height: 800 - height - GAP,
  });
}
canvas.clear();

const wholeRect = new Rect(0, 0, 400, 800);
canvas.copy(bgScreenTexture, wholeRect, wholeRect);
canvas.copy(
  startTexture,
  wholeRect,
  new Rect(
    100,
    230,
    210,
    300,
  ),
);

canvas.present();

for await (const event of window.events()) {
  switch (event.type) {
    case EventType.Draw:
      if (intro) {
        break;
      }

      canvas.copy(
        bgScreenTexture,
        new Rect(0, 0, 400, 800),
        new Rect(
          0,
          0,
          400,
          800,
        ),
      );

      for (let idx = 0; idx < upperPipes.length; idx++) {
        if (
          checkCollision(
            bird.x,
            bird.y,
            34,
            24,
            upperPipes[idx].x,
            UPPER_PIPE_Y,
            PIPE_WIDTH,
            upperPipes[idx].height,
          ) ||
          checkCollision(
            bird.x,
            bird.y,
            34,
            24,
            lowerPipes[idx].x,
            LOWER_PIPE_Y_BASE - lowerPipes[idx].height,
            PIPE_WIDTH,
            lowerPipes[idx].height,
          )
        ) {
          // Only runs once
          if (!gameOver) {
            gameOver = true;
            //           canvas.playMusic(
            //             "./audio/game_over.wav",
            //           );
            canvas.present();
          }
        }
        if (
          checkCollision(
            bird.x + 50 / 2,
            bird.y,
            0,
            50,
            upperPipes[idx].x + PIPE_WIDTH / 2,
            upperPipes[idx].height,
            0,
            800 - upperPipes[idx].height - lowerPipes[idx].height,
          )
        ) {
          score_value += 1;
          const score_effects = ["scored_1.wav", "scored_2.wav"];
          //         canvas.playMusic(
          //           "./audio/" + score_effects[Math.floor(Math.random() * 2)],
          //         );
        }

        // Debug:
        // canvas.fillRect(playerX + 50 / 2, playerY, 0, 50)
        // canvas.fillRect(upperPipes[idx].x + PIPE_WIDTH / 2, upperPipes[idx].height, 0, 800 - upperPipes[idx].height - lowerPipes[idx].height);

        // Pipes
        canvas.copy(
          pipeTextureDown,
          new Rect(0, 0, 52, 320),
          new Rect(
            upperPipes[idx].x,
            UPPER_PIPE_Y,
            PIPE_WIDTH,
            upperPipes[idx].height,
          ),
        );
        canvas.copy(
          pipeTextureUp,
          new Rect(0, 0, 52, 320),
          new Rect(
            lowerPipes[idx].x,
            LOWER_PIPE_Y_BASE - lowerPipes[idx].height,
            PIPE_WIDTH,
            lowerPipes[idx].height,
          ),
        );
        if (!gameOver) {
          bird.render();

          upperPipes[idx].x -= 1;
          lowerPipes[idx].x -= 1;
          if (upperPipes[idx].x <= -PIPE_WIDTH) {
            upperPipes[idx].x = 800 + PIPE_WIDTH;
            upperPipes[idx].height = getRandomInt(100, 190);
            lowerPipes[idx].x = 800 + PIPE_WIDTH;
            lowerPipes[idx].height = 800 - upperPipes[idx].height - GAP;
          }

          if (bird.y >= 800 - 50) {
            gameOver = true;

            canvas.playMusic(
              "./audio/game_over.wav",
            );
          }
        } else {
          bird.die();
          bird.render();
        }
      }
      // Game physics
      if (is_space) {
        bird.y -= 50;
        is_space = false;
      } else {
        // Give player downwards acceleration
        bird.y += gravity;
      }
      if (bird.y >= 800 - 50) {
        bird.y = 800 - 50;
      }
      canvas.present();
      sleepSync(fps);
      break;
    case EventType.Quit:
      Deno.exit();
      break;
    case EventType.KeyDown:
      // Space
      if (event.keycode == 32 && !gameOver) {
        intro = false;
        is_space = true;
      }
      if (event.keycode == 114 && gameOver) {
        intro = true;
        gameOver = false;
      }
      break;
    case EventType.MouseButtonDown:
      if (event.button == 1 && !gameOver) {
        // Left click
        intro = false;
        is_space = true;
      }
      break;
    default:
      break;
  }
}
