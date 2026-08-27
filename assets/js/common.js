(() => {
  const root = document.documentElement;
  const key = 'iyte_tools_theme';
  const saved = localStorage.getItem(key);
  if (saved === 'dark' || saved === 'light') root.dataset.theme = saved;

  const sync = () => {
    document.querySelectorAll('#themeToggle,.theme-toggle').forEach(btn => {
      btn.textContent = root.dataset.theme === 'dark' ? '☀' : '☾';
    });
  };
  sync();

  document.addEventListener('click', e => {
    const btn = e.target.closest('#themeToggle,.theme-toggle');
    if (!btn) return;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(key, root.dataset.theme);
    sync();
  });
})();
