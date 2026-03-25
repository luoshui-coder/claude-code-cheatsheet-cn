document.querySelectorAll('.badge-new').forEach((badge) => {
  const added = badge.getAttribute('data-added');
  if (!added) return;
  const age = (Date.now() - new Date(added).getTime()) / (1000 * 60 * 60 * 24);
  if (age > 14) badge.style.display = 'none';
});
