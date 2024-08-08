const express = require('express');
const app = express();

app.use(express.json());

const games = require('./games'); // Load the games script

app.post('/generate/:game', async (req, res) => {
  const game = req.params.game;
  const code = await games.displayPromoCode(game);
  res.send(code);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
