/* Montana Car Wash - interactions */
(function () {
  const root = document.documentElement;
  const unhide = () => root.classList.remove('js-anim');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- header ---------- */
  const hdr = document.querySelector('.hdr');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 30);
    if (!document.body.classList.contains('menu-open')) {
      hdr.classList.toggle('is-hidden', y > 420 && y > lastY + 4);
      if (y < lastY - 4) hdr.classList.remove('is-hidden');
    }
    lastY = y;
    const bar = document.querySelector('.mbar');
    if (bar) bar.classList.toggle('on', y > innerHeight * 0.55);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.mmenu a').forEach(a => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- button glow follows pointer ---------- */
  document.querySelectorAll('.btn--blue').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      b.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  /* ---------- draggable strips (mouse drag, native swipe) ---------- */
  document.querySelectorAll('.strip').forEach(strip => {
    let down = false, sx = 0, sl = 0, moved = 0;
    strip.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.abs(dx);
      if (moved > 4) strip.classList.add('drag');
      strip.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { down = false; setTimeout(() => strip.classList.remove('drag'), 0); });
    strip.addEventListener('click', e => { if (moved > 6) e.preventDefault(); }, true);
    const nav = strip.parentElement.querySelector('[data-strip-nav]');
    if (nav) nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const card = strip.querySelector(':scope > *');
      const step = card ? card.getBoundingClientRect().width + 16 : 300;
      strip.scrollBy({ left: (b.dataset.dir === 'next' ? 1 : -1) * step * 1.5, behavior: 'smooth' });
    }));
  });

  /* ---------- car class switch ---------- */
  document.querySelectorAll('[data-seg]').forEach(seg => {
    const scope = seg.closest('[data-seg-scope]') || document;
    const btns = [...seg.querySelectorAll('button')];
    const pill = seg.querySelector('.seg__pill');
    const place = b => {
      if (!pill) return;
      pill.style.left = b.offsetLeft + 'px'; pill.style.top = b.offsetTop + 'px';
      pill.style.width = b.offsetWidth + 'px'; pill.style.height = b.offsetHeight + 'px';
    };
    const set = (i, first) => {
      btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i));
      place(btns[i]);
      scope.querySelectorAll('[data-p]').forEach(el => {
        const v = el.dataset.p.split('|'); const nv = v[Math.min(i, v.length - 1)];
        if (el.textContent === nv) return;
        if (first || reduce) { el.textContent = nv; return; }
        if (el.dataset.count !== undefined) {
          const from = parseInt(el.textContent, 10) || 0, to = parseInt(nv, 10), t0 = performance.now();
          const tick = t => { const k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3);
            el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
        } else {
          el.classList.add('swap');
          setTimeout(() => { el.textContent = nv; el.classList.remove('swap'); }, 200);
        }
      });
    };
    btns.forEach((b, i) => b.addEventListener('click', () => set(i)));
    set(0, true);
    addEventListener('resize', () => place(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
    if (document.fonts) document.fonts.ready.then(() => place(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
  });

  /* ---------- hero foam + bubbles ---------- */
  const Foam = (() => {
    const c = document.getElementById('foam');
    if (!c || reduce) return null;
    const wrap = c.parentElement, ctx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2);
    let w = 0, h = 0, layer = null, wipeP = -1, bubbles = [], raf = 0, visible = true, done = false;

    const size = () => {
      const r = wrap.getBoundingClientRect(); w = r.width; h = r.height;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const paintFoam = () => {
      layer = document.createElement('canvas');
      layer.width = c.width; layer.height = c.height;
      const f = layer.getContext('2d'); f.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = f.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(238,245,250,.93)'); g.addColorStop(1, 'rgba(214,228,240,.96)');
      f.fillStyle = g; f.fillRect(0, 0, w, h);
      const n = Math.round(w * h / 260);
      for (let i = 0; i < n; i++) {
        const x = Math.random() * w, y = Math.random() * h, r = 2 + Math.pow(Math.random(), 2.4) * 22;
        const rg = f.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
        rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(.7, 'rgba(232,241,248,.6)'); rg.addColorStop(1, 'rgba(150,182,208,.55)');
        f.fillStyle = rg; f.beginPath(); f.arc(x, y, r, 0, 6.283); f.fill();
        if (r > 7) { f.strokeStyle = 'rgba(255,255,255,.8)'; f.lineWidth = 1; f.beginPath(); f.arc(x - r * .3, y - r * .3, r * .45, 3.6, 4.6); f.stroke(); }
      }
    };
    const drawWipe = () => {
      ctx.clearRect(0, 0, w, h);
      if (!layer) return;
      ctx.drawImage(layer, 0, 0, w, h);
      const ex = wipeP * (w + 120) - 60, tilt = h * .12;
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let y = 0; y <= h; y += 10) ctx.lineTo(ex - tilt * (y / h) + Math.sin(y * .05 + wipeP * 8) * 6, y);
      ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); ctx.restore();
      if (wipeP > 0 && wipeP < 1) {
        const grd = ctx.createLinearGradient(ex - 30, 0, ex + 6, 0);
        grd.addColorStop(0, 'rgba(143,208,255,0)'); grd.addColorStop(1, 'rgba(255,255,255,.9)');
        ctx.strokeStyle = grd; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ex, -4); ctx.lineTo(ex - tilt, h + 4); ctx.stroke();
      }
    };
    const spawn = (x, y, n = 1, burst = false) => {
      for (let i = 0; i < n; i++) {
        if (bubbles.length > 70) bubbles.shift();
        const a = Math.random() * 6.283, s = burst ? 1 + Math.random() * 2.2 : .3;
        bubbles.push({ x, y, r: 4 + Math.random() * (burst ? 16 : 12), vx: Math.cos(a) * s, vy: -0.6 - Math.random() * 1.1 + (burst ? Math.sin(a) * s : 0), life: 0, max: 70 + Math.random() * 80, pop: 0 });
      }
      loop();
    };
    const drawBubble = b => {
      if (b.pop) {
        ctx.strokeStyle = `rgba(255,255,255,${.7 * (1 - b.pop / 10)})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (1 + b.pop * .09), 0, 6.283); ctx.stroke(); return;
      }
      const rg = ctx.createRadialGradient(b.x - b.r * .3, b.y - b.r * .3, b.r * .1, b.x, b.y, b.r);
      rg.addColorStop(0, 'rgba(255,255,255,.35)'); rg.addColorStop(.75, 'rgba(160,215,255,.08)'); rg.addColorStop(.92, 'rgba(200,235,255,.45)'); rg.addColorStop(1, 'rgba(255,255,255,.1)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(b.x - b.r * .25, b.y - b.r * .25, b.r * .55, 3.5, 4.5); ctx.stroke();
    };
    const step = () => {
      raf = 0;
      if (!done) return;
      ctx.clearRect(0, 0, w, h);
      bubbles = bubbles.filter(b => {
        if (b.pop) { b.pop++; drawBubble(b); return b.pop < 10; }
        b.life++; b.x += b.vx + Math.sin(b.life * .06) * .35; b.y += b.vy; b.vx *= .97;
        if (b.life > b.max || b.y < -20) b.pop = 1;
        drawBubble(b); return true;
      });
      if (bubbles.length && visible) loop();
    };
    const loop = () => { if (!raf && done) raf = requestAnimationFrame(step); };

    size(); paintFoam(); wipeP = 0; drawWipe();
    new ResizeObserver(() => { const old = w; size(); if (!done) { paintFoam(); drawWipe(); } else if (old !== w) ctx.clearRect(0, 0, w, h); }).observe(wrap);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(wrap);

    const local = e => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    let lastSpawn = 0;
    wrap.addEventListener('pointermove', e => {
      if (!done || e.pointerType !== 'mouse') return;
      const t = performance.now(); if (t - lastSpawn < 45) return; lastSpawn = t;
      const [x, y] = local(e); spawn(x, y, 1);
    });
    wrap.addEventListener('pointerdown', e => { if (!done) return; const [x, y] = local(e); spawn(x, y, 9, true); });
    let idle = setInterval(() => { if (done && visible && document.visibilityState === 'visible') spawn(Math.random() * w, h + 10, 1); }, 900);

    return {
      wipe(dur = 1.7) {
        const t0 = performance.now();
        const tick = t => {
          const k = Math.min(1, (t - t0) / (dur * 1000));
          wipeP = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          drawWipe();
          if (k < 1) requestAnimationFrame(tick);
          else {
            layer = null; done = true; ctx.clearRect(0, 0, w, h);
            spawn(w * .5, h * .7, 14, true);
            const hint = document.querySelector('.hero__hint');
            if (hint && !fine) hint.textContent = 'Торкніться фото, щоб додати піни';
            if (hint) { hint.classList.add('on'); setTimeout(() => hint.classList.remove('on'), 4200); }
          }
        };
        requestAnimationFrame(tick);
      },
      clear() { layer = null; done = true; ctx.clearRect(0, 0, w, h); }
    };
  })();

  /* ---------- GSAP: intro + scroll moments ---------- */
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
  if (!window.gsap) { unhide(); if (Foam) Foam.clear(); return; }
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add({ all: 'all', wide: '(min-width: 900px)', reduce: '(prefers-reduced-motion: reduce)' }, ctx => {
    const { wide, reduce: rd } = ctx.conditions;
    if (rd) { unhide(); if (Foam) Foam.clear(); return; }

    const hero = document.querySelector('.hero');
    if (hero && root.classList.contains('js-anim')) {
      gsap.set('.hero h1 .ln > span', { y: 0, yPercent: 125 });
      gsap.set('.hero .kick, .hero__lead, .hero .btns, .hero__meta', { opacity: 0, y: 22 });
      gsap.set('.hero__tag', { opacity: 0, x: -20 });
      gsap.set('.hero__photo-wrap', { clipPath: 'inset(100% 0% 0% 0% round 26px)' });
      gsap.set('.ridge path', { strokeDashoffset: 1 });
      unhide();
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to('.hero__photo-wrap', { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.15, ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
        .to('.hero .kick', { opacity: 1, y: 0, duration: .8 }, .15)
        .to('.hero h1 .ln > span', { yPercent: 0, duration: 1.1, stagger: .11 }, .2)
        .to('.hero__lead, .hero .btns, .hero__meta', { opacity: 1, y: 0, duration: .9, stagger: .09 }, .65)
        .to('.ridge path', { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, .4)
        .add(() => Foam && Foam.wipe(1.5), .8)
        .to('.hero__tag', { opacity: 1, x: 0, duration: .8 }, 2.3);
      gsap.to('.hero__photo-wrap img', { yPercent: 6, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    } else if (document.querySelector('.phero') && root.classList.contains('js-anim')) {
      gsap.set('.phero h1 .ln > span', { y: 0, yPercent: 125 });
      gsap.set('.phero__img', { clipPath: 'inset(100% 0% 0% 0% round 26px)' });
      unhide();
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to('.phero h1 .ln > span', { yPercent: 0, duration: 1.05, stagger: .1 }, .1)
        .to('.phero__img', { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.15, ease: 'power4.inOut', clearProps: 'clipPath' }, 0);
    } else { unhide(); if (Foam) Foam.clear(); }

    // ridge steps: line draws as you scroll (no pinning)
    const rp = document.querySelector('.steps__svg .draw');
    if (rp) {
      gsap.fromTo(rp, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.steps__track', start: 'top 85%', end: 'bottom 45%', scrub: .6 } });
      gsap.from('.steps__svg .peak', { scale: 0, transformOrigin: '50% 50%', stagger: .15, duration: .6, ease: 'back.out(2)', scrollTrigger: { trigger: '.steps__track', start: 'top 70%' } });
    }


    if (wide) {
      gsap.utils.toArray('.cx__m2').forEach(el => gsap.fromTo(el, { yPercent: 12 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
      gsap.utils.toArray('.srv__media img').forEach(el => gsap.fromTo(el, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    }
  });
  setTimeout(unhide, 3000);

})();
