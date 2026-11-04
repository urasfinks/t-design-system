function disclosure(markup, { label = 'Посмотреть HTML', copy = false } = {}) {
  const details = document.createElement('details');
  details.className = 'example-code tg-disclosure tg-card tg-card--disclosure';
  const summary = document.createElement('summary');
  summary.className = 'tg-disclosure__trigger';
  summary.textContent = label;
  const pre = document.createElement('pre');
  pre.className = 'tg-card tg-no-border tg-no-radius-top';
  pre.translate = false;
  const code = document.createElement('code');
  code.textContent = markup;
  pre.append(code);
  const content = document.createElement('div');
  content.className = 'tg-disclosure__content tg-p-0';
  content.append(pre);
  details.append(summary, content);
  if (copy) {
    const actions = document.createElement('div');
    actions.className = 'tg-row tg-p-4';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tg-btn tg-btn--secondary';
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
