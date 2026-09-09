const buttons = [...document.querySelectorAll('[data-step]')];
buttons.forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.screen').forEach(screen => { screen.hidden = screen.id !== button.dataset.step; });
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));
