// Comportamiento de la página: barra superior al hacer scroll, animaciones de
// aparición y chat de demostración. Sin dependencias.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nav = document.querySelector('.topnav');
  if (nav) {
    var onScroll = function () { nav.setAttribute('data-scrolled', String(window.scrollY > 12)); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (reduce || !('IntersectionObserver' in window)) return;
  root.classList.add('rv');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

  var q = document.querySelector('[data-chat="q"]');
  var typing = document.querySelector('[data-chat="typing"]');
  var a = document.querySelector('[data-chat="a"]');
  var status = document.querySelector('[data-chat-status]');
  if (q && typing && a && status) {
    var show = function (step) {
      q.hidden = step < 1;
      typing.hidden = step !== 2;
      a.hidden = step < 3;
      status.textContent = step === 2 ? 'escribiendo…' : 'en línea';
    };
    var run = function () {
      [[0, 0], [1, 700], [2, 1700], [3, 3300]].forEach(function (s) {
        setTimeout(function () { show(s[0]); }, s[1]);
      });
      setTimeout(run, 8000);
    };
    run();
  }
})();
