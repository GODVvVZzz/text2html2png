const panels = [...document.querySelectorAll('.demo-panel')];
const choices = [...document.querySelectorAll('[data-demo]')];
if (choices.length && panels.length) {
  const languageLink = document.querySelector('.language-link');
  const languagePage = languageLink?.getAttribute('href');
  function select(id) {
    if (!panels.some(panel => panel.id === id)) return;
    panels.forEach(panel => { panel.hidden = panel.id !== id; });
    choices.forEach(choice => {
      if (choice.dataset.demo === id) choice.setAttribute('aria-current', 'true');
      else choice.removeAttribute('aria-current');
    });
    if (languageLink) languageLink.href = `${languagePage}#${id}`;
  }
  choices.forEach(choice => choice.addEventListener('click', () => select(choice.dataset.demo)));
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));
  select(panels.some(panel => panel.id === location.hash.slice(1)) ? location.hash.slice(1) : panels[0].id);
}
let statusTimer;
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const target = document.getElementById(button.dataset.copy);
  const status = document.getElementById('copy-status');
  if (!target || !status) return;
  const content = target.textContent + (button.dataset.suffix || '');
  button.disabled = true;
  try {
    await navigator.clipboard.writeText(content);
    status.textContent = document.body.dataset.copySuccess;
  } catch {
    const details = target.closest('details');
    if (details) details.open = true;
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
