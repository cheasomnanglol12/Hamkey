const express = require('express');
const app = express();
const hamkey = require('./hamkey');

app.use(express.json());

app.post('/generate/:game', async (req, res) => {
  const game = req.params.game;
  try {
    const code = await hamkey.displayPromoCode(game);
    res.send(code);
  } catch (err) {
    res.status(500).send(`Error generating promo code: ${err.message}`);
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
