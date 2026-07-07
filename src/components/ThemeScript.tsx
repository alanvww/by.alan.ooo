export default function ThemeScript() {
  // Runs before paint: theme mirrors the OS preference. The removeItem clears
  // the key persisted by an earlier version of the site so old visitors also
  // go back to following their system setting.
  const themeScript = `
    (function() {
      try {
        localStorage.removeItem('theme');
        var theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.add(theme);
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
