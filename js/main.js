/* NPC SDA Church: site behaviour */
(function () {
  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Light / dark theme toggle ---------- */
  const root = document.documentElement;
  const themeBtn = document.querySelector('.theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (theme, save) => {
    root.setAttribute('data-theme', theme);
    const next = theme === 'light' ? 'dark' : 'light';
    const label = `Switch to ${next} mode`;
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
    themeBtn.querySelector('use').setAttribute('href', theme === 'light' ? '#i-moon' : '#i-sun');
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#ffffff' : '#0b1622');
    if (save) { try { localStorage.setItem('npc-theme', theme); } catch (_) { /* storage blocked */ } }
  };
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);
  themeBtn.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
  });

  /* ---------- Header background on scroll ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  const setNav = (open) => {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
  };
  toggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setNav(false);
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', (m) => { if (m.matches) setNav(false); });

  /* ---------- Active nav link (scroll spy) ---------- */
  const links = [...nav.querySelectorAll('a')];
  const sectionFor = (a) => {
    const id = a.getAttribute('href').slice(1);
    return id === 'top' ? document.querySelector('.hero') : document.getElementById(id);
  };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', sectionFor(a) === entry.target));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = sectionFor(a); if (s) spy.observe(s); });

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
        const i = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.transitionDelay = Math.min(i * 60, 360) + 'ms';
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- "Happening now" / "Next up" service (Manila time) ---------- */
  function manilaMinuteOfWeek() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return day * 1440 + parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
  }
  const toMin = (day, hhmm) => { const [h, m] = hhmm.split(':').map(Number); return day * 1440 + h * 60 + m; };

  function markServices() {
    const WEEK = 7 * 1440;
    const now = manilaMinuteOfWeek();
    const cards = [...document.querySelectorAll('.service-card')];
    let next = null, best = Infinity, live = null;
    cards.forEach((card) => {
      card.classList.remove('is-now', 'is-next');
      card.querySelector('.service-badge').hidden = true;
      const d = +card.dataset.day;
      const start = toMin(d, card.dataset.start), end = toMin(d, card.dataset.end);
      if (now >= start && now < end && !live) live = card;
      const until = (start - now + WEEK) % WEEK;
      if (until < best) { best = until; next = card; }
    });
    const target = live || next;
    if (!target) return;
    target.classList.add(live ? 'is-now' : 'is-next');
    const badge = target.querySelector('.service-badge');
    badge.textContent = live ? 'Happening now' : 'Next up';
    badge.hidden = false;
  }
  markServices();
  setInterval(markServices, 60 * 1000);

  /* ---------- Visit Us schedule (built from the Service Times cards) ---------- */
  const schedule = document.getElementById('schedule-list');
  if (schedule) {
    const order = [3, 5, 6]; // Wed, Fri, then Sabbath
    [...document.querySelectorAll('.service-card')]
      .sort((a, b) => order.indexOf(+a.dataset.day) - order.indexOf(+b.dataset.day) || a.dataset.start.localeCompare(b.dataset.start))
      .forEach((card) => {
        const li = document.createElement('li');
        const name = document.createElement('strong');
        name.textContent = card.querySelector('h3, h4').textContent.trim();
        const when = document.createElement('span');
        const day = card.querySelector('.service-day').textContent.trim().slice(0, 3);
        when.textContent = `${day} · ${card.querySelector('.service-time').textContent.trim()}`;
        li.append(name, when);
        schedule.appendChild(li);
      });
  }

  /* ---------- Hero countdown to the next service ---------- */
  // Reads day/start/end from the Service Times cards, so editing a card updates the countdown too.
  const cd = document.getElementById('countdown');
  if (cd) {
    const MANILA = 8 * 3600 * 1000;  // Philippines is UTC+8 all year (no daylight saving)
    const DAY = 86400 * 1000;
    const nums = {};
    cd.querySelectorAll('.cd-num').forEach((n) => { nums[n.dataset.unit] = n; });
    const nameEl = cd.querySelector('.cd-event-name');
    const timer = cd.querySelector('.countdown');
    const services = [...document.querySelectorAll('.service-card')].map((el) => ({
      day: +el.dataset.day, start: el.dataset.start, end: el.dataset.end,
      name: el.querySelector('h3, h4').textContent.trim(),
      when: el.querySelector('.service-day').textContent.trim() + ' · ' + el.querySelector('.service-time').textContent.trim(),
    }));
    const toMs = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return (h * 60 + m) * 60000; };

    // Next start (and whether one is running now) as real timestamps
    const findNext = (now) => {
      const local = now + MANILA;                     // "Manila clock" expressed as UTC
      const midnight = local - (local % DAY);         // Manila midnight today (in that shifted clock)
      const today = new Date(local).getUTCDay();
      let next = null, live = null;
      services.forEach((sv) => {
        const offsetDays = (sv.day - today + 7) % 7;
        let startAt = midnight + offsetDays * DAY + toMs(sv.start) - MANILA;
        const endAt = midnight + offsetDays * DAY + toMs(sv.end) - MANILA;
        if (now >= startAt && now < endAt) live = sv;
        if (startAt <= now) startAt += 7 * DAY;
        if (!next || startAt < next.t) next = { ...sv, t: startAt };
      });
      return { next, live };
    };

    const set = (unit, v) => { const s = String(v); if (nums[unit].textContent !== s) nums[unit].textContent = s; };
    let shown = '';
    const tick = () => {
      const now = Date.now();
      const { next, live } = findNext(now);
      if (!next) return;
      const label = live ? `Happening now: ${live.name}` : `${next.name} · ${next.when}`;
      if (label !== shown) {
        shown = label;
        nameEl.textContent = label;
        timer.setAttribute('aria-label', `Next service, ${next.name}, ${next.when}`);
      }
      let s = Math.max(0, Math.floor((next.t - now) / 1000));
      set('days', Math.floor(s / 86400)); s %= 86400;
      set('hours', Math.floor(s / 3600)); s %= 3600;
      set('minutes', Math.floor(s / 60));
      set('seconds', s % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Building fund progress ---------- */
  const fund = document.querySelector('.fund');
  if (fund) {
    const raised = +fund.dataset.raised, goal = +fund.dataset.goal;
    const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
    const peso = (n) => '₱' + n.toLocaleString('en-PH');
    fund.querySelector('.fund-raised').textContent = peso(raised);
    fund.querySelector('.fund-goal').textContent = peso(goal);
    const left = fund.querySelector('.fund-left');
    if (left) left.textContent = peso(Math.max(0, goal - raised));
    fund.querySelector('.fund-pct span').textContent = pct + '%';
    const bar = fund.querySelector('.fund-bar');
    bar.setAttribute('aria-valuenow', pct);
    const fill = bar.querySelector('span');
    if (reduceMotion) { fill.style.width = pct + '%'; }
    else {
      fill.style.width = '0%';
      new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting) { fill.style.width = pct + '%'; obs.disconnect(); }
      }, { threshold: 0.4 }).observe(bar);
    }
  }

  /* ---------- Copy account numbers ---------- */
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        const label = btn.getAttribute('aria-label');
        btn.classList.add('copied');
        btn.setAttribute('aria-label', 'Copied!');
        setTimeout(() => { btn.classList.remove('copied'); btn.setAttribute('aria-label', label); }, 1600);
      } catch (_) { /* clipboard unavailable: number is still visible */ }
    });
  });

  /* ---------- Prayer request → opens email app ---------- */
  const form = document.getElementById('prayer-form');
  if (form) {
    const req = form.querySelector('#pr-request');
    const err = form.querySelector('#pr-request-err');
    const validate = () => {
      const ok = req.value.trim().length > 0;
      req.setAttribute('aria-invalid', String(!ok));
      err.hidden = ok;
      return ok;
    };
    req.addEventListener('blur', () => { if (req.value) validate(); });
    req.addEventListener('input', () => { if (req.getAttribute('aria-invalid') === 'true') validate(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) { req.focus(); return; }
      const name = form.querySelector('#pr-name').value.trim() || 'Anonymous';
      const priv = form.querySelector('input[name="private"]').checked;
      const subject = `Prayer request${priv ? ' (private)' : ''} from ${name}`;
      const body = `${req.value.trim()}\n\n— ${name}\n${priv ? 'Please keep this request private (pastor only).' : 'OK to share with the prayer team.'}`;
      window.location.href = 'mailto:npctsora.sdachurch1998@gmail.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      let status = form.querySelector('.form-status');
      if (!status) {
        status = document.createElement('p');
        status.className = 'form-status';
        status.setAttribute('role', 'status');
        form.appendChild(status);
      }
      status.textContent = 'Your email app should open with your request ready to send. Thank you. We will be praying with you.';
    });
  }

  /* ---------- Footer year ---------- */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
