// Executed in the browser by Playwright page.evaluate. Resolves and composites CSS colors.
export const measureContrast = ({ selector, pseudo = null }) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].map((v, i) => i === 3 ? v / 255 : v); };
    const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])).concat(1);
    const el = document.querySelector(selector);
    let bg = [255, 255, 255, 1];
    const chain = []; for (let node = el; node; node = node.parentElement) chain.unshift(node);
    for (const node of chain) bg = over(rgba(getComputedStyle(node).backgroundColor), bg);
    const fg = over(rgba(getComputedStyle(el, pseudo).color), bg);
    const luminance = rgb => rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const [a, b] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    return { ratio: (a + .05) / (b + .05), fg, bg };
  };
