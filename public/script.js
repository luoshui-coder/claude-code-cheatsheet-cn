document.querySelectorAll('.toc a').forEach((anchor) => {
  anchor.addEventListener('click', () => {
    document.querySelectorAll('.toc a').forEach((node) => node.classList.remove('is-active'));
    anchor.classList.add('is-active');
  });
});
