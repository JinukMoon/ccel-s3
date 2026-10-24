/* Scroll stage: native scroll drives (1) a clip-path that opens the framed window to full bleed and
   (2) which frame of the `hero` sequence the canvas shows. No scroll hijacking, no smoothing library.
   Counts, sizes, folders and the poster come from _shared/scroll/manifest.json. */
(function () {
  'use strict';
  const root = document.querySelector('[data-stage]');
  if (!root || !window.S3) return;
  const BASE = window.S3.SHARED + 'scroll/';
  const pin = root.querySelector('.stage-pin');
  const win = root.querySelector('.stage-window');
  const media = root.querySelector('.stage-media');
  const canvas = root.querySelector('.stage-canvas');
  const poster = root.querySelector('.stage-poster');
  const frameBox = root.querySelector('.stage-frame');
  const card = root.querySelector('.stage-card');
  const cue = root.querySelector('.stage-cue');

  const REVEAL_END = 0.42;  // share of the pinned scroll spent opening the window
  const VIDEO_END = 0.8;    // the sequence reaches its last frame here; the light sheet then slides over
  const RADIUS = 14;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let seq = null, imgs = [], ready = [], drawn = -1, target = 0, queued = false, live = false, fineStarted = false;
  let inset = { t: 0, r: 0, b: 0, l: 0 }, ctx = null, cw = 0, ch = 0, edge = true;

  window.S3.manifest().then(init).catch(still);
  // the framed window follows the layout box below the title (fonts, text length, viewport)
  if (window.ResizeObserver) new ResizeObserver(() => { measure(); if (live) sizeCanvas(); schedule(); }).observe(frameBox);

  function still() {
    live = false;
    root.classList.add('is-still');
    measure(); apply(0);
  }

  function init(m) {
    const h = m && m.sequences && m.sequences.hero;
    if (!h) return still();
    const mob = innerWidth < 768 && h.mobile ? h.mobile : null;
    const s = mob || h;
    seq = { dir: s.dir, count: +s.count, w: +s.width, h: +s.height, pattern: m.pattern || 'f_{index:03d}.webp', base: +(m.index_base || 0) };
    if (h.poster) {
      poster.width = +h.width; poster.height = +h.height;
      poster.src = BASE + h.poster;
    }
    if (reduce.matches || !(seq.count > 0)) return still();
    live = true;
    ctx = canvas.getContext('2d');
    imgs = new Array(seq.count); ready = new Array(seq.count).fill(false);
    measure(); sizeCanvas(); update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    reduce.addEventListener && reduce.addEventListener('change', e => { if (e.matches) { removeEventListener('scroll', onScroll); still(); } });
    // never block first paint: the coarse pass starts after load, the fine pass on the first scroll into the stage
    const coarse = () => load(order(8), 4);
    if (document.readyState === 'complete') setTimeout(coarse, 0); else addEventListener('load', coarse, { once: true });
  }

  /* ---- loading ---- */
  const file = i => seq.pattern.replace(/\{index(?::0?(\d+)d)?\}/, (_, w) => String(i + seq.base).padStart(+w || 0, '0'));
  function order(step) {             // every `step`-th frame (+ the last one), coarse first
    const out = [];
    for (let i = 0; i < seq.count; i += step) out.push(i);
    if (out[out.length - 1] !== seq.count - 1) out.push(seq.count - 1);
    return out;
  }
  function fineOrder() {             // fill the gaps: every 4th, every 2nd, then the rest
    const seen = new Set(order(8)), out = [];
    [4, 2, 1].forEach(st => { for (let i = 0; i < seq.count; i += st) if (!seen.has(i)) { seen.add(i); out.push(i); } });
    return out;
  }
  function load(list, conc) {
    let k = 0;
    const next = () => {
      while (k < list.length && imgs[list[k]]) k++;
      if (k >= list.length) return;
      const i = list[k++];
      const im = new Image();
      im.decoding = 'async';
      imgs[i] = im;
      im.onload = () => {
        const done = () => { ready[i] = true; if (Math.abs(i - target) < Math.abs(drawn - target) || drawn < 0) schedule(); next(); };
        im.decode ? im.decode().then(done, done) : done();
      };
      im.onerror = next;
      im.src = BASE + seq.dir + '/' + file(i);
    };
    for (let c = 0; c < conc; c++) next();
  }

  /* ---- drawing ---- */
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(win.clientWidth * dpr), h = Math.round(win.clientHeight * dpr);
    if (w === cw && h === ch) return;
    cw = canvas.width = w; ch = canvas.height = h;
    drawn = -1;
  }
  function nearest(t) {
    for (let d = 0; d < seq.count; d++) {
      if (t - d >= 0 && ready[t - d]) return t - d;
      if (t + d < seq.count && ready[t + d]) return t + d;
    }
    return -1;
  }
  function draw() {
    const i = nearest(target);
    if (i < 0 || i === drawn) return;
    const im = imgs[i];
    const sc = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * sc, h = im.naturalHeight * sc;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
  }

  /* ---- geometry ---- */
  // Desktop: the window opens to the whole stage, behind the title card.
  // Phone (<768px): it opens to full width but keeps its top edge under the title, so the 640px mobile
  // frames are not blown up to a portrait screen and the title never sits over moving frames.
  function measure() {
    const p = pin.getBoundingClientRect(), f = frameBox.getBoundingClientRect();
    const top = innerWidth < 768 ? Math.max(0, Math.round(f.top - p.top)) : 0;
    win.style.top = top + 'px';
    edge = top === 0;
    inset = { t: f.top - p.top - top, r: p.right - f.right, b: p.bottom - f.bottom, l: f.left - p.left };
  }
  function progress() {
    const r = root.getBoundingClientRect();
    const span = root.offsetHeight - pin.offsetHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  }
  function apply(p) {
    const e = ease(clamp(p / REVEAL_END)), k = 1 - e;
    win.style.clipPath = `inset(${(inset.t * k).toFixed(1)}px ${(inset.r * k).toFixed(1)}px ${(inset.b * k).toFixed(1)}px ${(inset.l * k).toFixed(1)}px round ${(RADIUS * k).toFixed(1)}px)`;
    media.style.transform = `scale(${(1 + 0.08 * k).toFixed(4)})`;
    card.style.setProperty('--edge', edge ? e.toFixed(3) : '0');
    if (cue) cue.style.opacity = clamp(1 - p * 12).toFixed(3);
  }
  function update() {
    queued = false;
    const p = live ? progress() : 0;
    apply(p);
    if (!live) return;
    target = Math.round(clamp(p / VIDEO_END) * (seq.count - 1));
    draw();
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  function onScroll() {
    if (!fineStarted && root.getBoundingClientRect().bottom > 0 && scrollY > 0) { fineStarted = true; load(fineOrder(), 4); }
    schedule();
  }
  // the pin is 100svh, so a mobile URL-bar show/hide does not change its size and keeps the bitmap
  function onResize() { measure(); sizeCanvas(); schedule(); }
})();
