const showcases = [...document.querySelectorAll('.showcase')];
const choices = [...document.querySelectorAll('[data-showcase]')];
function selectShowcase(id) {
  if (!showcases.some(showcase => showcase.id === id)) return;
  showcases.forEach(showcase => { showcase.hidden = showcase.id !== id; });
  choices.forEach(choice => {
    if (choice.dataset.showcase === id) choice.setAttribute('aria-current', 'true');
    else choice.removeAttribute('aria-current');
  });
}
showcases.forEach(showcase => {
  const steps = [...showcase.querySelectorAll('[data-step]')];
  const screens = [...showcase.querySelectorAll('.screen')];
  const controls = showcase.querySelector('.showcase-steps');
  function selectStep(id) {
    screens.forEach(screen => { screen.hidden = screen.id !== id; });
    steps.forEach(step => step.setAttribute('aria-pressed', String(step.dataset.step === id)));
  }
  if (controls) controls.hidden = false;
  steps.forEach(step => step.addEventListener('click', () => selectStep(step.dataset.step)));
  if (screens.length) selectStep(screens[0].id);
});
choices.forEach(choice => choice.addEventListener('click', () => selectShowcase(choice.dataset.showcase)));
window.addEventListener('hashchange', () => selectShowcase(location.hash.slice(1)));
if (showcases.length) selectShowcase(showcases.some(showcase => showcase.id === location.hash.slice(1)) ? location.hash.slice(1) : showcases[0].id);

let statusTimer;
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const target = document.getElementById(button.dataset.copy);
  const status = document.getElementById('copy-status');
  if (!target || !status) return;
  button.disabled = true;
  try {
    await navigator.clipboard.writeText(target.textContent + (button.dataset.suffix || ''));
    status.textContent = document.body.dataset.copySuccess;
  } catch {
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = document.body.dataset.copyFail;
  } finally {
    button.disabled = false;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 6000);
  }
}));
