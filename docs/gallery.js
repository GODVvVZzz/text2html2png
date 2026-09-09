const panels = [...document.querySelectorAll('.demo-panel')];
const switcher = document.querySelector('.example-switch');
if (switcher && panels.length) {
  switcher.hidden = false;
  const buttons = [...switcher.querySelectorAll('[data-demo]')];
  function select(id) {
    panels.forEach(panel => { panel.hidden = panel.id !== id; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.demo === id)));
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.demo)));
  select(panels[0].id);
}
let statusTimer;
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const target = document.getElementById(button.dataset.copy);
  const status = document.getElementById('copy-status');
  const content = target.textContent + (button.dataset.suffix || '');
  button.disabled = true;
  try {
    await navigator.clipboard.writeText(content);
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
