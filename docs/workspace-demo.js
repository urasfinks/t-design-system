import '../dist/ui.js';
import { initMenus } from './menu-demo.js';
// Demo behavior only. All presentation comes from TDS classes; this file owns
// focus, keys, state attributes and fake data, as a host application would.
const root = document.documentElement;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const say = (id, text) => { const node = document.getElementById(id); node.textContent = ''; requestAnimationFrame(() => { node.textContent = text; }); };
const plural = (n, one, few, many) => {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};
const money = value => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;

/* ---------- Theme ---------- */
function setTheme(value) {
  if (value === 'auto') delete root.dataset.theme; else root.dataset.theme = value;
  for (const item of $$('[data-theme-choice]')) item.setAttribute('aria-checked', String(item.dataset.themeChoice === value));
}

/* ---------- Menus ---------- */
initMenus({ onAction: (item, trigger) => runAction(item, trigger) });

/* ---------- Actions ---------- */
const table = $('#ws-table');
const rowsBody = $('#ws-rows');
const dialog = $('#ws-invoice');
function runAction(item, trigger) {
  const invoice = trigger?.dataset.invoice;
  if (item.dataset.themeChoice) return setTheme(item.dataset.themeChoice);
  switch (item.dataset.action) {
    case 'compact':
      table.classList.toggle('tg-table--compact', item.getAttribute('aria-checked') === 'true');
      return say('ws-table-status', item.getAttribute('aria-checked') === 'true' ? 'Компактные строки включены' : 'Обычные строки');
    case 'new-invoice': return say('ws-table-status', 'Черновик счёта создан');
    case 'open':
      $('#ws-invoice-title').textContent = `Счёт ${invoice}`;
      trigger.focus({ preventScroll: true });
      dialog.showModal();
      return 'keep-focus';
    case 'duplicate': return say('ws-table-status', `Создана копия ${invoice}`);
    case 'remind': return say('ws-table-status', `Напоминание по ${invoice} отправлено`);
    case 'delete': {
      const row = trigger.closest('tr');
      const next = row.nextElementSibling ?? row.previousElementSibling;
      row.remove();
      updateSelection();
      updateTotal();
      say('ws-table-status', `Счёт ${invoice} удалён`);
      next?.querySelector('[data-menu-trigger]')?.focus();
      return 'keep-focus';
    }
  }
}
document.addEventListener('keydown', event => {
  if (event.altKey && event.code === 'KeyN' && !event.target.closest('input, textarea, select')) {
    event.preventDefault();
    say('ws-table-status', 'Черновик счёта создан');
  }
});
dialog.addEventListener('click', event => { if (event.target.closest('[data-close]')) dialog.close(); });

/* ---------- Table: selection, bulk actions, sorting, search ---------- */
const selectAll = $('#ws-select-all');
const bulk = $('#ws-bulk');
const rowChecks = () => $$('tbody .tg-table__select .tg-check', table);
function updateSelection() {
  const checks = rowChecks();
  const chosen = checks.filter(check => check.checked).length;
  selectAll.checked = chosen > 0 && chosen === checks.length;
  selectAll.indeterminate = chosen > 0 && chosen < checks.length;
  // The bar stays in place: empty, it says so and its actions are unavailable.
  bulk.toggleAttribute('data-empty', chosen === 0);
  for (const button of bulk.querySelectorAll('button')) button.disabled = chosen === 0;
  $('#ws-bulk-count').textContent = chosen ? `Выбрано ${chosen} ${plural(chosen, 'счёт', 'счёта', 'счетов')}` : 'Ничего не выбрано';
}
function updateTotal() {
  const sum = $$('tr', rowsBody).filter(row => !row.hidden && row.dataset.amount).reduce((total, row) => total + Number(row.dataset.amount), 0);
  $('#ws-total').textContent = money(sum);
}
selectAll.addEventListener('change', () => { for (const check of rowChecks()) check.checked = selectAll.checked; updateSelection(); });
table.addEventListener('change', event => { if (event.target.closest('tbody .tg-table__select')) updateSelection(); });
$('#ws-bulk-clear').addEventListener('click', () => { for (const check of rowChecks()) check.checked = false; updateSelection(); selectAll.focus(); });

const sortNames = { due: 'сроку', amount: 'сумме' };
table.addEventListener('click', event => {
  const button = event.target.closest('.tg-table__sort');
  if (!button) return;
  const header = button.closest('th');
  const next = header.getAttribute('aria-sort') === 'descending' ? 'ascending' : 'descending';
  for (const th of $$('th[aria-sort]', table)) th.setAttribute('aria-sort', 'none');
  header.setAttribute('aria-sort', next);
  const key = header.dataset.sort;
  const value = row => key === 'amount' ? Number(row.dataset.amount) : Date.parse(row.dataset.due);
  const rows = $$('tr[data-amount]', rowsBody).sort((a, b) => (value(a) - value(b)) * (next === 'ascending' ? 1 : -1));
  rowsBody.append(...rows, ...$$('tr:not([data-amount])', rowsBody));
  say('ws-table-status', `Отсортировано по ${sortNames[key]}, ${next === 'ascending' ? 'по возрастанию' : 'по убыванию'}`);
});

const search = $('#ws-search');
const emptyRow = document.createElement('tr');
emptyRow.hidden = true;
emptyRow.innerHTML = `<td colspan="6"><div class="tg-empty"><svg class="tg-icon tg-empty__icon" viewBox="0 0 24 24" aria-hidden="true"><use href="../dist/icons/search.svg#search"></use></svg><p class="tg-empty__title">Ничего не найдено</p><p class="tg-empty__description">Проверьте номер счёта или название клиента.</p><button class="tg-btn tg-btn--secondary tg-empty__action" type="button" data-clear-search>Сбросить поиск</button></div></td>`;
rowsBody.append(emptyRow);
function filterRows() {
  const query = search.value.trim().toLocaleLowerCase('ru');
  let shown = 0;
  for (const row of $$('tr[data-amount]', rowsBody)) {
    row.hidden = Boolean(query) && !row.textContent.toLocaleLowerCase('ru').includes(query);
    if (!row.hidden) shown++;
  }
  emptyRow.hidden = shown > 0;
  updateTotal();
  say('ws-table-status', query ? `Найдено ${shown} ${plural(shown, 'счёт', 'счёта', 'счетов')}` : '');
}
search.addEventListener('input', filterRows);
$('#ws-search-form').addEventListener('reset', () => setTimeout(filterRows));
$('#ws-search-form').addEventListener('submit', event => event.preventDefault());
rowsBody.addEventListener('click', event => { if (event.target.closest('[data-clear-search]')) { search.value = ''; filterRows(); search.focus(); } });

/* ---------- Tabs ---------- */
const tabs = $$('[role="tab"]');
function selectTab(tab) {
  for (const other of tabs) {
    const selected = other === tab;
    other.setAttribute('aria-selected', String(selected));
    other.tabIndex = selected ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
  }
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const index = tabs.indexOf(tab);
    const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = tabs[(target + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
}

/* ---------- Notice ---------- */
document.addEventListener('click', event => {
  const dismiss = event.target.closest('[data-dismiss]');
  if (!dismiss) return;
  document.getElementById(dismiss.dataset.dismiss).hidden = true;
  $('#ws-main h1').setAttribute('tabindex', '-1');
  $('#ws-main h1').focus();
});
$('#ws-resend').addEventListener('click', () => say('ws-save-status', 'Письмо отправлено ещё раз'));

/* ---------- Toggles ---------- */
document.addEventListener('click', event => {
  const toggle = event.target.closest('.tg-toggle');
  if (toggle) toggle.setAttribute('aria-pressed', String(toggle.getAttribute('aria-pressed') !== 'true'));
});

/* ---------- Client form: input group, requirements, nested choices, async save ---------- */
const password = $('#ws-password');
const rules = $('#ws-rules');
const checks = { length: v => v.length >= 10, digit: v => /\d/.test(v), case: v => /\p{Ll}/u.test(v) && /\p{Lu}/u.test(v) };
password.addEventListener('input', () => {
  for (const rule of $$('[data-rule]', rules)) rule.dataset.met = String(checks[rule.dataset.rule](password.value));
  if ($$('[data-met="false"]', rules).length === 0) { rules.classList.remove('tg-requirements--invalid'); password.removeAttribute('aria-invalid'); }
});
$('#ws-reveal').addEventListener('click', event => {
  const button = event.currentTarget;
  const shown = password.type === 'password';
  password.type = shown ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(shown));
});

const notifyAll = $('#ws-notify-all');
const notify = $$('[data-notify]');
function syncNotify() {
  const count = notify.filter(box => box.checked).length;
  notifyAll.checked = count === notify.length;
  notifyAll.indeterminate = count > 0 && count < notify.length;
  $('#ws-notify-count').textContent = `Выбрано ${count} из ${notify.length}`;
}
notifyAll.addEventListener('change', () => { for (const box of notify) box.checked = notifyAll.checked; syncNotify(); });
for (const box of notify) box.addEventListener('change', syncNotify);
syncNotify();

const form = $('#ws-client');
const save = $('#ws-save');
form.addEventListener('reset', () => setTimeout(() => { for (const rule of $$('[data-rule]', rules)) rule.dataset.met = 'false'; rules.classList.remove('tg-requirements--invalid'); password.removeAttribute('aria-invalid'); syncNotify(); }));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (save.dataset.state === 'busy') return;
  if ($$('[data-met="false"]', rules).length) {
    rules.classList.add('tg-requirements--invalid');
    password.setAttribute('aria-invalid', 'true');
    password.focus();
    return say('ws-save-status', 'Пароль не отвечает требованиям');
  }
  save.dataset.state = 'busy';
  save.setAttribute('aria-busy', 'true');
  say('ws-save-status', 'Сохраняем клиента');
  setTimeout(() => {
    save.dataset.state = 'success';
    save.removeAttribute('aria-busy');
    say('ws-save-status', 'Клиент сохранён');
    setTimeout(() => { save.dataset.state = 'idle'; }, 1600);
  }, 900);
});

/* ---------- Accordion ---------- */
const expand = $('#ws-expand');
const panels = $$('#ws-faq > details');
expand.addEventListener('click', () => {
  const openAll = !panels.every(panel => panel.open);
  for (const panel of panels) panel.open = openAll;
  expand.textContent = openAll ? 'Свернуть всё' : 'Развернуть всё';
});
for (const panel of panels) panel.addEventListener('toggle', () => { expand.textContent = panels.every(p => p.open) ? 'Свернуть всё' : 'Развернуть всё'; });

/* ---------- Assistant chat: streaming, stop, Enter to send ---------- */
const log = $('#ws-log');
const prompt = $('#ws-prompt');
const send = $('#ws-send');
const sendIcon = send.querySelector('use');
let stream = null;
function resizePrompt() {
  prompt.style.height = 'auto';
  const style = getComputedStyle(prompt);
  const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  prompt.style.height = `${Math.min(prompt.scrollHeight + borders, parseFloat(style.maxHeight))}px`;
}
prompt.addEventListener('input', resizePrompt);
prompt.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('#ws-chat-form').requestSubmit(); }
  if (event.key === 'Escape' && stream) { event.preventDefault(); stopStream(); }
});
function message(role, text) {
  const node = document.createElement('article');
  node.className = `tg-message tg-message--${role}`;
  node.setAttribute('aria-label', role === 'user' ? 'Вы' : 'Помощник');
  node.innerHTML = '<div class="tg-message__body"><p></p></div>';
  node.querySelector('p').textContent = text;
  log.append(node);
  return node;
}
function setSending(active) {
  send.setAttribute('aria-label', active ? 'Остановить ответ' : 'Отправить');
  sendIcon.setAttribute('href', active ? '../dist/icons/square.svg#square' : '../dist/icons/arrow-up.svg#arrow-up');
}
function stopStream(done = false) {
  clearInterval(stream.timer);
  const { node } = stream;
  stream = null;
  node.dataset.state = done ? 'done' : 'stopped';
  node.removeAttribute('aria-busy');
  if (!done) {
    const meta = document.createElement('p');
    meta.className = 'tg-message__meta tg-mt-0 tg-mb-0';
    meta.textContent = 'Ответ остановлен';
    node.append(meta);
  }
  setSending(false);
  say('ws-chat-status', done ? 'Помощник ответил' : 'Ответ остановлен');
}
$('#ws-chat-form').addEventListener('submit', event => {
  event.preventDefault();
  if (stream) return stopStream();
  const text = prompt.value.trim();
  if (!text) return prompt.focus();
  message('user', text);
  prompt.value = '';
  resizePrompt();
  const reply = 'Проверил счета за октябрь. Просрочен один, INV-1037, на 96 000 ₽. Ещё два счёта нужно оплатить до 14 ноября: напоминания по ним уйдут автоматически за три дня до срока.'.split(' ');
  const node = message('assistant', '');
  node.dataset.state = 'streaming';
  node.setAttribute('aria-busy', 'true');
  const paragraph = node.querySelector('p');
  setSending(true);
  say('ws-chat-status', 'Помощник отвечает');
  let index = 0;
  stream = { node, timer: setInterval(() => {
    paragraph.textContent += (index ? ' ' : '') + reply[index++];
    if (index === reply.length) stopStream(true);
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 70) };
});
