// Paste in the browser console of a StoneOS host, on its My apps page. It prints the HTML skeleton of the
// pieces the SDK owns (the sidebar's shell, the breadcrumb, the page frame) with no host data: no menu
// items, no generated class names, no text. Two hosts that consume the SDK components print the same
// skeleton; run it on both and diff the output (docs/11-launchpad-host-integration.md, "HTML contract").
(() => {
  // emotion (css-*), styled-components (sc-*, or a bare 5-7 letter hash like kjXEm or gtxdpu) and MUI's hashed variants
  const generated = /^(css-|sc-)|^Mui[A-Za-z]+-[a-z0-9]+$|^[a-zA-Z]{5,7}$/;
  const own = (el) =>
    [...el.classList].filter((name) => !generated.test(name) || /^Mui[A-Za-z]+-root$/.test(name)).sort().join('.');
  const label = (el) =>
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : '') +
    (own(el) ? `.${own(el)}` : '') +
    (el.getAttribute('aria-label') ? `[aria-label=${el.getAttribute('aria-label')}]` : '') +
    (el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : '');
  const skip = new Set(['STYLE', 'SCRIPT', 'IMG', 'svg']);
  const lines = [];
  const walk = (el, depth, maxDepth) => {
    lines.push(`${'  '.repeat(depth)}${label(el)}`);
    if (depth >= maxDepth || el.id === 'side-menu') return;
    for (const child of el.children) if (!skip.has(child.tagName)) walk(child, depth + 1, maxDepth);
  };

  lines.push('# sidebar');
  const aside = document.querySelector('.left-side-menu');
  if (aside) walk(aside, 0, 7);

  lines.push('# breadcrumb');
  const crumb = document.querySelector('.navbar-custom nav[aria-label=Location]');
  if (crumb) walk(crumb.parentElement, 0, 3);

  lines.push('# page chain (from .content-page to the frame)');
  const page = document.querySelector('.content-page');
  const chain = [];
  let node = document.querySelector('.stos-page-frame');
  while (node && node !== page.parentElement) {
    chain.push(label(node));
    node = node.parentElement;
  }
  lines.push(chain.reverse().join('\n  > '));

  return lines.join('\n');
})();
