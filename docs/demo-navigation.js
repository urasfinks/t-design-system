// Demo controls must not navigate the catalog or move the document viewport.
// Scroll only a widget's own container; scrollIntoView also moves its ancestors.
export function scrollWithin(container, element) {
  if (!container || !element) return;
  const frame = container.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const top = frame.top + container.clientTop;
  const left = frame.left + container.clientLeft;
  const bottom = top + container.clientHeight;
  const right = left + container.clientWidth;
  const dy = rect.top < top ? rect.top - top : rect.bottom > bottom ? rect.bottom - bottom : 0;
  const dx = rect.left < left ? rect.left - left : rect.right > right ? rect.right - right : 0;
  if (dy || dx) container.scrollBy({top:dy,left:dx,behavior:'instant'});
}

export function initDemoNavigation({root=document}={}) {
  root.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link?.closest('.example-body, .app-preview')) event.preventDefault();
  });
  root.addEventListener('focusin', event => {
    const element = event.target;
    const scope = element.closest('.example-body');
    if (!scope) return;
    for (let container=element.parentElement; container && container!==scope; container=container.parentElement) {
      const style = getComputedStyle(container);
      if ((/(auto|scroll)/.test(style.overflowY) && container.scrollHeight>container.clientHeight) ||
          (/(auto|scroll)/.test(style.overflowX) && container.scrollWidth>container.clientWidth)) {
        scrollWithin(container,element);
        break;
      }
    }
  });
}
