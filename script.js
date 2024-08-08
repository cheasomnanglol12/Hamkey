const form = document.querySelector('form');
const output = document.querySelector('#output');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const game = document.querySelector('#game').value;
  const response = await fetch(`/generate/${game}`);
  const code = await response.text();
  output.textContent = `Your promo code is: ${code}`;
});
