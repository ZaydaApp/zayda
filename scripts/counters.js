
export function animateCounter(el, target, duration=1200){
  const start = 0, diff = target - start;
  const t0 = performance.now();
  function tick(now){
    const p = Math.min(1, (now - t0) / duration);
    el.textContent = Math.round(start + diff * p).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
