(function () {
  const KEY = 'sable-theme';
  const root = document.documentElement;
  const cssVar = n => getComputedStyle(root).getPropertyValue(n).trim();

  function get() { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } }
  function set(t) { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { } apply(); }

  function apply() {
    const t = get();
    if (t) root.dataset.theme = t; else delete root.dataset.theme;
    document.querySelectorAll('#theme-seg [data-theme-val]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.themeVal === t)));
    if (window.Chart) applyChartTheme();
    document.dispatchEvent(new CustomEvent('sable:theme', { detail: { theme: t || 'auto' } }));
  }

  const colors = () => ({
    accent: cssVar('--accent-text'), accentSoft: cssVar('--accent-soft'), label: cssVar('--label'),
    muted: cssVar('--label-secondary'), success: cssVar('--success'), warning: cssVar('--warning'),
    danger: cssVar('--danger'), surface: cssVar('--surface-elevated'),
    series: [1, 2, 3, 4, 5, 6, 7, 8].map(i => cssVar('--chart-' + i)),
  });

  function applyChartTheme() {
    const C = window.Chart.defaults;
    C.color = cssVar('--label-secondary');
    C.borderColor = cssVar('--separator');
    C.font.family = getComputedStyle(document.body).fontFamily;
    C.font.size = 12;
    C.maintainAspectRatio = false;
    Object.assign(C.plugins.legend.labels, { boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 3, padding: 14 });
    Object.assign(C.plugins.tooltip, {
      backgroundColor: cssVar('--label'), titleColor: cssVar('--bg'), bodyColor: cssVar('--bg'), footerColor: cssVar('--bg'),
      padding: 12, cornerRadius: 12, boxPadding: 4, usePointStyle: true,
    });
    C.elements.bar.borderRadius = 4;
    C.elements.line.borderWidth = 2;
    C.elements.line.tension = 0.3;
    C.elements.point.radius = 0;
    C.elements.point.hoverRadius = 4;
    C.elements.arc.borderColor = cssVar('--surface-elevated');
    C.elements.arc.borderWidth = 3;
    C.scale.grid.drawTicks = false;
    C.scale.border = { display: false };
    C.scale.ticks.padding = 8;
    C.interaction = { mode: 'index', intersect: false };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) C.animation = false;
  }

  function toast(msg, ms = 2400) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), ms);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('#theme-seg [data-theme-val]');
    if (b) set(b.dataset.themeVal);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
  apply();

  window.Sable = { setTheme: set, getTheme: get, colors, applyChartTheme, toast, cssVar };
})();
