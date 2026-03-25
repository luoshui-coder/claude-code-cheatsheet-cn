document.querySelectorAll('.badge-new').forEach((badge) => {
  const added = badge.getAttribute('data-added');
  if (!added) return;
  const age = (Date.now() - new Date(added).getTime()) / (1000 * 60 * 60 * 24);
  if (age > 14) badge.style.display = 'none';
});

const body = document.body;
const buttons = document.querySelectorAll('.os-btn');
const setOS = (os) => {
  body.setAttribute('data-os', os);
  buttons.forEach((btn) => btn.classList.toggle('active', btn.dataset.os === os));
  localStorage.setItem('cc-cheatsheet-os', os);
};
const stored = localStorage.getItem('cc-cheatsheet-os');
setOS(stored === 'win' ? 'win' : 'mac');
buttons.forEach((btn) => btn.addEventListener('click', () => setOS(btn.dataset.os)));
