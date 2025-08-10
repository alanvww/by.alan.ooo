export default function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        var theme = localStorage.getItem('theme');
        var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        var initialTheme = theme || systemTheme;
        document.documentElement.classList.add(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
