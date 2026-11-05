function disclosure(markup, { label = 'Посмотреть HTML', copy = false } = {}) {
  const details = document.createElement('details');
  details.className = 'example-code tg-disclosure tg-disclosure--compact tg-disclosure--embedded';
  details.name = 'catalog-html';
  const summary = document.createElement('summary');
  summary.className = 'tg-disclosure__trigger';
  summary.textContent = label;
  const pre = document.createElement('pre');
  pre.className = 'tg-code-block tg-scroll-region';
  pre.tabIndex = 0;
  // Code viewers are small named groups, not hundreds of page landmarks.
  pre.setAttribute('role', 'group');
  pre.setAttribute('aria-label', 'HTML примера');
  pre.translate = false;
  const code = document.createElement('code');
  code.textContent = markup;
  pre.append(code);
  const content = document.createElement('div');
  content.className = 'tg-disclosure__content tg-col';
  content.append(pre);
  details.append(summary, content);
  if (copy) {
    const actions = document.createElement('div');
    actions.className = 'tg-row';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tg-btn tg-btn--secondary tg-btn--sm';
    button.textContent = 'Скопировать HTML';
    const status = document.createElement('span');
    status.setAttribute('role', 'status');
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(markup);
        status.textContent = 'HTML скопирован';
      } catch {
        pre.tabIndex = 0;
        pre.focus({ preventScroll: true });
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = 'HTML выделен. Нажмите Ctrl+C или ⌘C.';
      }
    });
    actions.append(button, status);
    content.append(actions);
  }
  return details;
}

export function initDemoCode({ root = document } = {}) {
  // Static source examples (including the full-screen composition) use the
  // same renderer and copy action as generated per-variant HTML viewers.
  for (const existing of root.querySelectorAll('details.example-code')) {
    if (existing.matches('.tg-disclosure--embedded') && existing.querySelector('button')) continue;
    const code = existing.querySelector('code');
    if (code) existing.replaceWith(disclosure(code.textContent, { label: existing.querySelector('summary')?.textContent || 'Посмотреть HTML', copy: true }));
  }
  for (const example of root.querySelectorAll('[data-example]')) {
    const panel = example.closest('.example-panel');
    if (panel.querySelector(':scope > details.example-code')) continue;
    // Freeze the full example before adding per-variant controls to the catalog.
    const fullMarkup = example.innerHTML.trim();
    const stages = example.querySelectorAll('.catalog-overview > tbody > tr > td > .example-body');
    for (const stage of stages) {
      const fragment = stage.cloneNode(true);
      for (const node of [fragment, ...fragment.querySelectorAll('*')]) {
        for (const attribute of [...node.attributes]) {
          if (/^data-(?:catalog-|example$|spec$|ui$)/.test(attribute.name)) node.removeAttribute(attribute.name);
        }
      }
      stage.parentElement.append(disclosure(fragment.innerHTML.trim(), { copy: true }));
    }
    panel.append(disclosure(fullMarkup, { label: stages.length ? 'Посмотреть HTML всего примера' : 'Посмотреть HTML', copy: true }));
  }
  // Keep a class intact when it fits; only genuinely long tokens break on phones.
  for (const tag of root.querySelectorAll('code.class-tag')) {
    if (tag.children.length) continue;
    const parts = tag.textContent.split(/(\.[\w-]+|--[\w-]+)/g);
    tag.replaceChildren(...parts.map(part => {
      if (!/^(?:\.|--)/.test(part)) return document.createTextNode(part);
      const token = document.createElement('span');
      token.textContent = part;
      return token;
    }));
  }
}
