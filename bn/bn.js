/* MS Biz Studio — Bangla pages: lead forms go through our own /api/contact,
   so the destination inbox never appears on the site. */
(function () {
  /* "Email us" opens a small message form; it is sent through /api/contact,
     so the inbox address is never shown on the page */
  var dlg = document.createElement('dialog');
  dlg.className = 'mail';
  dlg.setAttribute('aria-label', 'ইমেইল করুন');
  dlg.innerHTML =
    '<button type="button" class="close" aria-label="বন্ধ করুন">×</button>' +
    '<div class="form-card"><div class="head" style="margin:0"><h2>ইমেইল করুন</h2><p class="muted">মেসেজ লিখুন, আমরা উত্তর দেব।</p></div>' +
    '<form class="lead" data-need="Email (BD)" novalidate>' +
    '<label>আপনার নাম<input name="name" type="text" autocomplete="name" required></label>' +
    '<label>ফোন নম্বর<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="১১ সংখ্যার মোবাইল নম্বর" required></label>' +
    '<label>মেসেজ<textarea name="details" rows="4"></textarea></label>' +
    '<div class="hp" aria-hidden="true"><label>Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>' +
    '<button class="btn" type="submit">পাঠান</button><p class="msg" role="status" aria-live="polite"></p></form></div>';
  document.body.appendChild(dlg);
  dlg.querySelector('.close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  document.querySelectorAll('[data-mail]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      if (dlg.showModal) dlg.showModal(); else location.hash = '#contact';
      var f = dlg.querySelector('input[name="name"]'); if (f) f.focus();
    });
  });
  var toLatin = function (s) {
    return String(s || '').replace(/[০-৯]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.indexOf(d); });
  };

  document.querySelectorAll('form.lead').forEach(function (form) {
    var msg = form.querySelector('.msg');
    var btn = form.querySelector('button[type="submit"]');
    var say = function (text, ok) {
      msg.textContent = text;
      msg.className = 'msg ' + (ok ? 'ok' : 'err');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = toLatin(form.phone.value).replace(/[^\d+]/g, '');
      if (!name) { say('আপনার নাম লিখুন।', false); form.name.focus(); return; }
      if (phone.replace(/\D/g, '').length < 10) { say('সঠিক মোবাইল নম্বর লিখুন।', false); form.phone.focus(); return; }

      var payload = {
        name: name,
        phone: phone,
        company: form.company ? form.company.value.trim() : '',
        city: form.city ? form.city.value.trim() : '',
        details: form.details ? form.details.value.trim() : '',
        need: form.getAttribute('data-need') || 'Bangla lead',
        page: location.pathname,
        website: form.website ? form.website.value : ''
      };

      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = 'পাঠানো হচ্ছে…';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok) {
          form.reset();
          say('ধন্যবাদ! আমরা শিগগিরই আপনাকে ফোন করব।', true);
        } else {
          say('পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন, বা ইমেইল করুন।', false);
        }
      }).catch(function () {
        say('পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন, বা ইমেইল করুন।', false);
      }).then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  });

  /* Someone who chose English keeps English on the main site */
  document.querySelectorAll('a[data-en]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('msbiz_lang', 'en'); } catch (e) {}
    });
  });
  try { localStorage.removeItem('msbiz_lang'); } catch (e) {}
})();

/* v2: reveal on scroll, receipt animation, calculator, sticky CTA */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bn = function (n) { return Math.round(n).toLocaleString('bn-BD'); };

  var countUp = function (el, from, to) {
    if (reduce) { el.textContent = '৳' + bn(to); return; }
    var t0 = null, dur = 1200;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = '৳' + bn(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  var els = document.querySelectorAll('.reveal-up, .mock');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        var c = en.target.querySelector('[data-count]');
        if (c) countUp(c, +c.getAttribute('data-from'), +c.getAttribute('data-count'));
        io.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  var calc = document.querySelector('.calc');
  if (calc) {
    var range = calc.querySelector('input[type=range]');
    var sales = calc.querySelector('[data-sales]');
    var month = calc.querySelector('[data-month]');
    var year = calc.querySelector('[data-year]');
    var rate = 0.30;
    var update = function () {
      var s = +range.value;
      sales.textContent = '৳' + bn(s);
      month.textContent = '৳' + bn(s * rate);
      year.textContent = '৳' + bn(s * rate * 12);
      range.setAttribute('aria-valuetext', '৳' + bn(s));
    };
    range.addEventListener('input', update);
    calc.querySelectorAll('.rates button').forEach(function (b) {
      b.addEventListener('click', function () {
        rate = +b.getAttribute('data-rate');
        calc.querySelectorAll('.rates button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        update();
      });
    });
    update();
  }

  var sticky = document.querySelector('.sticky-cta');
  var target = sticky && document.querySelector(sticky.getAttribute('data-hide-at'));
  if (sticky && target && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      sticky.classList.toggle('hide', entries[0].isIntersecting);
    }).observe(target);
  }
})();
