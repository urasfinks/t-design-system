export function initDemoCode({ root = document } = {}) {
  for (const example of root.querySelectorAll('[data-example]')) {
    const panel = example.closest('.example-panel');
    if (panel.querySelector(':scope > details.example-code')) continue;
    const details = document.createElement('details');
    details.className = 'example-code';
    const summary = document.createElement('summary');
    summary.textContent = 'Посмотреть HTML';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    // Capture the initial markup, before the user changes the demo state.
    code.textContent = example.innerHTML.trim();
    pre.append(code);
    details.append(summary, pre);
    panel.append(details);
  }
}
