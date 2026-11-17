// Arelix Bots · comportamiento de la página. Sin dependencias.
//
// Siempre: barra de arriba, barra de avance, reloj en vivo, preguntas que se
// abren suave, onda al tocar un botón y botón flotante de WhatsApp.
// Solo si el celular permite animaciones (clase "anim" en <html>): lo que
// aparece al bajar, las secuencias (línea de tiempo, plática, pasos, volcanes)
// y los contadores.
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  clearTimeout(w.__arelix);

  var anim = root.classList.contains('anim');
  var quieto = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hayIO = 'IntersectionObserver' in w;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function bum(el) { el.classList.remove('bum'); void el.offsetWidth; el.classList.add('bum'); }

  // ---- Barra de arriba y barra de avance ----
  var nav = $('.nav'), barra = $('.progreso'), pendiente = false;
  if (nav) nav.classList.add('fija');
  function alBajar() {
    pendiente = false;
    var y = w.pageYOffset || root.scrollTop || 0;
    if (nav) nav.classList.toggle('pegada', y > 8);
    if (barra) {
      var max = root.scrollHeight - w.innerHeight;
      barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
  }
  w.addEventListener('scroll', function () {
    if (!pendiente) { pendiente = true; w.requestAnimationFrame(alBajar); }
  }, { passive: true });
  w.addEventListener('resize', alBajar, { passive: true });
  alBajar();

  // ---- Reloj en vivo: la hora del celular de quien abre la página ----
  var reloj = $('[data-reloj]');
  if (reloj) {
    var hm = d.createElement('span'), seg = d.createElement('small'), ampm = d.createTextNode('');
    reloj.textContent = '';
    reloj.appendChild(hm);
    if (!quieto) reloj.appendChild(seg);
    reloj.appendChild(ampm);
    var dos = function (n) { return (n < 10 ? '0' : '') + n; };
    var pinta = function () {
      var n = new Date(), h = n.getHours();
      hm.textContent = (h % 12 || 12) + ':' + dos(n.getMinutes());
      seg.textContent = ':' + dos(n.getSeconds());
      ampm.nodeValue = h < 12 ? ' am' : ' pm';
    };
    pinta();
    setInterval(pinta, 1000);
  }

  // ---- Preguntas frecuentes: se abren y se cierran suave ----
  $$('details.faq').forEach(function (det) {
    var sum = $('summary', det), cont = $('.faq-r', det), an = null;
    if (!sum || !cont || quieto || !cont.animate) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      var abrir = !det.open || det.classList.contains('cerrando');
      if (an) an.cancel();
      if (abrir) {
        det.classList.remove('cerrando');
        det.open = true;
        an = cont.animate(
          [{ height: '0px', opacity: 0 }, { height: cont.scrollHeight + 'px', opacity: 1 }],
          { duration: 340, easing: 'cubic-bezier(.2,.7,.2,1)' });
        an.onfinish = function () { an = null; };
      } else {
        det.classList.add('cerrando');
        an = cont.animate(
          [{ height: cont.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 240, easing: 'ease' });
        an.onfinish = function () { det.open = false; det.classList.remove('cerrando'); an = null; };
      }
    });
  });

  // ---- Onda al tocar un botón ----
  if (!quieto) {
    d.addEventListener('pointerdown', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.btn') : null;
      if (!b) return;
      var r = b.getBoundingClientRect(), t = Math.max(r.width, r.height) * 2.2, o = d.createElement('span');
      o.className = 'onda';
      o.style.cssText = 'width:' + t + 'px;height:' + t + 'px;left:' + (e.clientX - r.left - t / 2) + 'px;top:' + (e.clientY - r.top - t / 2) + 'px';
      b.appendChild(o);
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 700);
    }, { passive: true });
  }

  // ---- Botón flotante: se esconde donde ya hay un botón grande de WhatsApp ----
  var fab = $('.fab');
  if (fab && hayIO) {
    var grandes = [$('.hero .cta'), $('[data-fab-fuera]')].filter(Boolean);
    var ioFab = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.__v = e.isIntersecting; });
      fab.classList.toggle('fuera', grandes.some(function (x) { return x.__v; }));
    });
    grandes.forEach(function (x) { ioFab.observe(x); });
  }

  if (!anim || !hayIO) return;

  // ---- Lo que aparece al bajar (solo lo que todavía no está en pantalla) ----
  var alto = w.innerHeight;
  var ioRv = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      ioRv.unobserve(el);
      el.classList.add('in');
      setTimeout(function () { el.classList.remove('rv', 'in'); }, 2400);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
  $$('[data-rv],[data-esc]').forEach(function (el) {
    if (el.hasAttribute('data-esc')) {
      for (var i = 0; i < el.children.length; i++) el.children[i].style.setProperty('--d', i);
    }
    if (el.getBoundingClientRect().top > alto * 0.9) { el.classList.add('rv'); ioRv.observe(el); }
  });

  // ---- Secuencias: arrancan cuando se ven ----
  var sec = {
    // "Mientras tenías cerrado": la cuenta sube con cada cliente atendido
    turno: function (el) {
      var n = $('[data-turno-n]', el), total = $$('.ev', el).length;
      if (!n) return;
      n.textContent = '0 clientes atendidos';
      for (var k = 1; k <= total; k++) (function (k) {
        setTimeout(function () {
          n.textContent = k === 1 ? '1 cliente atendido' : k + ' clientes atendidos';
          bum(n);
          if (k === total) el.classList.add('fin');
        }, (k - 1) * 1000 + 1050);
      })(k);
    },
    // mensajes sin contestar
    pend: function (el) {
      var n = $('[data-pend-n]', el), total = $$('li', el).length;
      if (!n) return;
      for (var k = 1; k <= total; k++) (function (k) {
        setTimeout(function () { el.classList.add('cuenta'); n.textContent = k; bum(n); }, (k - 1) * 500 + 480);
      })(k);
    },
    // los municipios se van prendiendo
    zona: function (el) {
      var n = $('[data-zona-n]', el), total = $$('.pueblos li', el).length;
      if (!n) return;
      for (var k = 1; k <= total; k++) (function (k) {
        setTimeout(function () { el.classList.add('cuenta'); n.textContent = k; bum(n); }, (k - 1) * 350 + 1650);
      })(k);
    },
    // la plática de ejemplo
    chat: function (el) {
      var filas = $$('.fila', el), quien = $('.quien', el), estado = $('[data-chat-estado]', el);
      var otra = $('[data-chat-otra]'), relojes = [];
      var luego = function (f, t) { relojes.push(setTimeout(f, t)); };
      var corre = function () {
        relojes.forEach(clearTimeout); relojes = [];
        el.classList.remove('fin');
        filas.forEach(function (f) { f.classList.remove('v', 'tec'); });
        if (quien) quien.classList.remove('v');
        if (otra) otra.hidden = true;
        if (estado) estado.textContent = 'en línea';
        var t = 350;
        filas.forEach(function (f) {
          if (f.classList.contains('out')) {
            luego(function () { f.classList.add('tec'); }, t);
            t += 1250;
            luego(function () { f.classList.add('v'); }, t);
            t += 850;
          } else {
            luego(function () { if (estado) estado.textContent = 'escribiendo…'; }, t);
            t += 800;
            luego(function () { f.classList.add('v'); if (estado) estado.textContent = 'en línea'; }, t);
            t += 550;
          }
        });
        luego(function () { if (quien) quien.classList.add('v'); }, t - 300);
        luego(function () { el.classList.add('fin'); if (otra) otra.hidden = false; }, t + 500);
      };
      if (otra) otra.addEventListener('click', corre);
      corre();
    }
  };
  var ioSec = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target.__de || e.target;
      ioSec.unobserve(e.target);
      el.classList.add('on');
      var f = sec[el.getAttribute('data-sec')];
      if (f) f(el);
    });
  }, { threshold: 0.4 });
  $$('[data-sec]').forEach(function (el) {
    var ojo = $('[data-ojo]', el) || el;   // qué parte tiene que verse para arrancar
    ojo.__de = el;
    ioSec.observe(ojo);
  });

  // ---- Contadores sueltos ----
  $$('[data-cuenta]').forEach(function (el) {
    var fin = parseInt(el.getAttribute('data-cuenta'), 10), texto = el.textContent;
    if (!fin) return;
    el.style.display = 'inline-block';
    el.style.minWidth = Math.ceil(el.getBoundingClientRect().width) + 'px';
    el.style.textAlign = 'center';
    var ioC = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      ioC.disconnect();
      var t0 = null, listo = false;
      var termina = function () { if (!listo) { listo = true; el.textContent = texto; } };
      var paso = function (t) {
        if (listo) return;
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / 1500), suave = 1 - Math.pow(1 - p, 3);
        if (p < 1) { el.textContent = miles(Math.round(fin * suave)); w.requestAnimationFrame(paso); }
        else termina();
      };
      el.textContent = '0';
      w.requestAnimationFrame(paso);
      setTimeout(termina, 2600);   // por si la pestaña se queda en segundo plano
    }, { threshold: 1 });
    ioC.observe(el);
  });

  // ---- Lo que no está en pantalla no se anima ----
  var ioVivo = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('dormido', !e.isIntersecting); });
  }, { rootMargin: '80px 0px' });
  $$('[data-vivo]').forEach(function (el) { ioVivo.observe(el); });

  // ---- Luz que sigue al cursor en las tarjetas de plan (solo con mouse) ----
  if (w.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.luz').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }
})();
