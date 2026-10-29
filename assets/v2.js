/* MS Biz Studio v2 pages: reveal on scroll, receipt count-up, commission calculator, sticky button.
   Works for Bangla (৳, Bangla digits) and English ($) pages. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var loc = document.documentElement.lang === 'bn' ? 'bn-BD' : 'en-US';
  var money = function (cur, n) { return cur + Math.round(n).toLocaleString(loc); };

  var countUp = function (el) {
    var cur = el.hasAttribute('data-cur') ? el.getAttribute('data-cur') : '৳';
    var from = +el.getAttribute('data-from'), to = +el.getAttribute('data-count');
    if (reduce) { el.textContent = money(cur, to); return; }
    var t0 = null, dur = 1200;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = money(cur, from + (to - from) * e);
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
        if (c) countUp(c);
        io.unobserve(en.target);
      });
    }, { threshold: 0.2 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  var calc = document.querySelector('.calc');
  if (calc) {
    var cur = calc.getAttribute('data-cur') || '৳';
    var range = calc.querySelector('input[type=range]');
    var sales = calc.querySelector('[data-sales]');
    var month = calc.querySelector('[data-month]');
    var year = calc.querySelector('[data-year]');
    var pressed = calc.querySelector('.rates button[aria-pressed=true]');
    var rate = pressed ? +pressed.getAttribute('data-rate') : 0.3;
    var update = function () {
      var s = +range.value;
      sales.textContent = money(cur, s);
      month.textContent = money(cur, s * rate);
      year.textContent = money(cur, s * rate * 12);
      range.setAttribute('aria-valuetext', money(cur, s));
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
