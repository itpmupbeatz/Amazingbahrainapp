// 🎯 Scratch and Win Functionality
const canvas = document.getElementById("scratchCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 300;
canvas.height = 150;

// Fill with gray scratch layer
ctx.fillStyle = "gray";
ctx.fillRect(0, 0, canvas.width, canvas.height);

let isDrawing = false;
let prizes = ["Pen", "Cup", "Cap", "Better luck next time"];
let inventory = { Pen: 200, Cup: 50, Cap: 100 }; // Track stock

canvas.addEventListener("mousedown", () => (isDrawing = true));
canvas.addEventListener("mouseup", () => (isDrawing = false));
canvas.addEventListener("mousemove", scratch);

function scratch(e) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
}

let revealed = false;
canvas.addEventListener("mouseup", () => {
  if (!revealed) {
    revealed = true;
    revealPrize();
  }
});

function revealPrize() {
  let prize = getRandomPrize();
  document.getElementById("prizeMessage").innerText = `🎉 You got: ${prize} 🎉`;
  launchConfetti();
}

function getRandomPrize() {
  let availablePrizes = [];

  Object.keys(inventory).forEach(item => {
    if (inventory[item] > 0) {
      availablePrizes.push(item);
    }
  });

  // 30% chance for "Better luck next time"
  if (Math.random() < 0.3 || availablePrizes.length === 0) {
    return "Better luck next time";
  }

  // Pick a random prize from available
  let prize = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
  inventory[prize]--; // Decrement stock
  return prize;
}

// 🎉 Simple Confetti Animation
function launchConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
