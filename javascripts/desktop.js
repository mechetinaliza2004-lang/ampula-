'use strict';

const movable = [];
const stack = [];

function raise(el) {
  const i = stack.indexOf(el);
  if (i >= 0) stack.splice(i, 1);
  stack.push(el);
  stack.forEach((w, k) => { w.style.zIndex = String(10 + k); });
}
function place(el, x, y) {
  el.dataset.dx = x;
  el.dataset.dy = y;
  el.style.translate = x || y ? `${x}px ${y}px` : '';
}
function keepInside(el, x, y) {
  if (el.hidden || !el.offsetParent) return [x, y];
  const d = ui.desk.getBoundingClientRect(), r = el.getBoundingClientRect();
  const left0 = r.left - (+el.dataset.dx || 0), top0 = r.top - (+el.dataset.dy || 0);
  const minX = d.left - left0, maxX = Math.max(minX, d.right - r.width - left0);
  const minY = d.top - top0, maxY = Math.max(minY, d.bottom - ui.taskbar.offsetHeight - r.height - top0);
  return [Math.round(clamp(x, minX, maxX)), Math.round(clamp(y, minY, maxY))];
}

function makeMovable(el, handle, skip) {
  movable.push(el);
  stack.push(el);
  el.addEventListener('pointerdown', () => raise(el), true);
  handle.addEventListener('pointerdown', e => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || (skip && e.target.closest(skip))) return;
    const sx = e.clientX, sy = e.clientY, ox = +el.dataset.dx || 0, oy = +el.dataset.dy || 0;
    let moved = false;
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    const move = ev => {
      if (ev.pointerId !== e.pointerId) return;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      document.body.classList.add('dragging');
      place(el, ...keepInside(el, ox + dx, oy + dy));
    };
    const up = ev => {
      if (ev.pointerId !== e.pointerId) return;
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      document.body.classList.remove('dragging');
      if (moved) {
        el.dataset.dragged = '1';
        setTimeout(() => { delete el.dataset.dragged; }, 0);
      }
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });
}

document.querySelectorAll('.desk .win').forEach(w => makeMovable(w, w.querySelector('.tb'), '.tb-x'));
document.querySelectorAll('.icon').forEach(icon => {
  makeMovable(icon, icon);
  icon.addEventListener('click', e => {
    if (icon.dataset.dragged) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);
});
stack.forEach((w, k) => { w.style.zIndex = String(10 + k); });
raise(ui.dialog);

$('#arrange').addEventListener('click', () => {
  movable.forEach(el => place(el, 0, 0));
  log('окна разложены по местам');
});

function stopEverything() {
  ptr.clear();
  releaseAll('');
  if (engine) engine.killAll();
  log('тишина');
}
$('#panic').addEventListener('click', stopEverything);

document.addEventListener('pointerdown', e => {
  if (!(e.target.closest && e.target.closest('.tb, .icon, #arrange, #help'))) startAudio();
}, true);
document.addEventListener('touchend', () => { if (engine && engine.ctx.state !== 'running') engine.ctx.resume().catch(() => {}); }, { passive: true });
document.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('button, .tube')) e.preventDefault(); });

function frame() {
  if (!document.hidden) {
    drawScope();
    if (engine) ui.rdVoices.textContent = engine.activeCount();
  }
  requestAnimationFrame(frame);
}

setVoice('glass', false);
setImmersion(state.immersion);
readSliders();
buildKeys();
sizeScope();
tick();
setInterval(tick, 15000);
new ResizeObserver(() => {
  sizeScope();
  if ((ui.keys.clientWidth < 520 ? 1 : 2) !== nOct) buildKeys();
  movable.forEach(el => { if (+el.dataset.dx || +el.dataset.dy) place(el, ...keepInside(el, +el.dataset.dx, +el.dataset.dy)); });
}).observe(document.body);
requestAnimationFrame(frame);
