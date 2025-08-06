const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load inventory
let inventory = JSON.parse(fs.readFileSync('inventory.json'));

// Random prize allocation
app.get('/get-prize', (req, res) => {
  const prizes = ["Pen", "Cap", "Cup"];
  let availablePrizes = prizes.filter(p => inventory[p] > 0);

  // 30% chance of Better Luck
  let isBetterLuck = Math.random() < 0.3 || availablePrizes.length === 0;
  let prize = "Better Luck Next Time!";

  if (!isBetterLuck) {
    prize = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
    inventory[prize]--;
    fs.writeFileSync('inventory.json', JSON.stringify(inventory, null, 2));
  }

  res.json({ prize, inventory });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
