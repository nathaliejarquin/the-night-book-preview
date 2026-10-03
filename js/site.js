/* The Night Book — vanilla, no libraries. Letter form posts to Netlify Forms ("letter"). */
(function () {
  "use strict";
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = mqReduce.matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. scroll reveal (once, 15%, stagger 90ms max 3) ---------- */
  $$(".reveal-group").forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--d", (i % 3) * 90 + "ms"); });
  });
  var targets = [];
  $$(".media").forEach(function (m) {
    if (m.closest(".hero") || m.closest(".lightbox")) return;
    m.classList.add("rv-media"); targets.push(m);
  });
  $$(".archwrap").forEach(function (a) { if (!a.closest(".hero") && !a.closest(".atlas")) { a.classList.add("rv-arch"); targets.push(a); } });
  $$(".cap, .reveal").forEach(function (t) { if (!t.closest(".hero")) { t.classList.add("rv-text"); targets.push(t); } });
  function settle(el) {
    el.classList.add("is-in");
    if (reduce) { el.classList.add("is-settled"); return; }
    el.classList.add("wc");
    setTimeout(function () { el.classList.remove("wc"); el.classList.add("is-settled"); }, 1800);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { settle(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    targets.forEach(function (t) { io.observe(t); });
  } else { targets.forEach(settle); }
  $$(".hero .media").forEach(function (m) { m.classList.add("is-settled"); });

  /* ---------- 1b. the sky: a new star's line draws in once (none with reduced motion) ---------- */
  var atlasEl = $("[data-atlas]");
  if (atlasEl && $(".atlas__line--new", atlasEl)) {
    if (reduce || !("IntersectionObserver" in window)) atlasEl.classList.add("is-drawn");
    else {
      var aio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { atlasEl.classList.add("is-drawn"); aio.disconnect(); } }, { threshold: 0.4 });
      aio.observe(atlasEl);
    }
  }

  /* ---------- 2. progress hairline ---------- */
  var bar = $(".progress span");
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")";
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- 3. hero pager: crossfade, I / IV, arrows, keys, desktop autoplay 8s ---------- */
  var hero = $("[data-pager-root]");
  if (hero) {
    var slides = $$(".slide", hero), nums = $$(".pager__b", hero);
    var roman = ["I", "II", "III", "IV"], idx = 0, timer = null, paused = false, heroVisible = true;
    var capEl = $(".hero__cap [data-cap]", hero), metaEl = $(".hero__cap [data-meta]", hero), rEl = $("[data-roman]", hero), rTop = $("[data-roman-top]", hero);
    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) { s.classList.toggle("is-active", j === idx); s.setAttribute("aria-hidden", j === idx ? "false" : "true"); });
      nums.forEach(function (b, j) { b.classList.toggle("is-active", j === idx); if (j === idx) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
      var s = slides[idx];
      if (capEl) capEl.textContent = s.getAttribute("data-cap"); metaEl.textContent = s.getAttribute("data-meta");
      rEl.textContent = roman[idx]; if (rTop) rTop.textContent = roman[idx];
    }
    nums.forEach(function (b) { b.addEventListener("click", function () { go(+b.getAttribute("data-go")); restart(); }); });
    $$("[data-step]", hero).forEach(function (b) { b.addEventListener("click", function () { go(idx + (+b.getAttribute("data-step"))); restart(); }); });
    hero.addEventListener("keydown", function (e) {
      if (e.target.closest && e.target.closest(".hcards, .hsteps")) return;
      if (e.key === "ArrowRight") { go(idx + 1); restart(); }
      if (e.key === "ArrowLeft") { go(idx - 1); restart(); }
    });
    var desktop = window.matchMedia("(min-width: 980px) and (hover: hover)").matches;
    function start() { if (reduce || !desktop) return; stop(); timer = setInterval(function () { if (!paused && heroVisible && !document.hidden) go(idx + 1); }, 8000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function restart() { if (timer) start(); }
    var media = $(".hero__media", hero);
    media.addEventListener("mouseenter", function () { paused = true; });
    media.addEventListener("mouseleave", function () { paused = false; });
    hero.addEventListener("focusin", function () { paused = true; });
    hero.addEventListener("focusout", function () { paused = false; });
    new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }).observe(hero);
    start();
    /* gentle mouse parallax on the strip layer (desktop, pointer fine) */
    var par = $("[data-parallax]", hero);
    if (par && fine && !reduce) {
      var raf = null, tx = 0, ty = 0;
      media.addEventListener("mousemove", function (e) {
        var r = media.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * -12; ty = ((e.clientY - r.top) / r.height - 0.5) * -6;
        if (!raf) raf = requestAnimationFrame(function () { par.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0)"; raf = null; });
      });
      media.addEventListener("mouseleave", function () { par.style.transition = "transform 1200ms cubic-bezier(.22,.61,.36,1)"; par.style.transform = ""; setTimeout(function () { par.style.transition = ""; }, 1200); });
    }
  }

  /* ---------- 4. instrument cards: one open at a time ---------- */
  var cards = $$(".icard");
  cards.forEach(function (c) {
    var b = $(".icard__toggle", c);
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      cards.forEach(function (o) { o.classList.remove("is-open"); $(".icard__toggle", o).setAttribute("aria-expanded", "false"); $(".icard__toggle", o).firstChild.nodeValue = "More "; });
      if (open) { c.classList.add("is-open"); b.setAttribute("aria-expanded", "true"); b.firstChild.nodeValue = "Less "; }
    });
  });

  /* ---------- 5. lightbox: bone backdrop, FLIP open 600ms, close 320ms, keys, swipe, focus trap ---------- */
  var lb = $("[data-lightbox]");
  var items = $$("[data-lb-item]");
  if (lb && items.length) {
    var lbImg = $("[data-lb-img]", lb), lbT = $("[data-lb-title]", lb), lbL = $("[data-lb-legend]", lb), lbD = $("[data-lb-ledger]", lb), lbC = $("[data-lb-count]", lb);
    var cur = 0, opener = null;
    function fill(i) {
      cur = (i + items.length) % items.length;
      var it = items[cur], src = $("[data-lb-open] img", it);
      lbImg.src = src.currentSrc || src.src; lbImg.alt = src.alt;
      lbT.textContent = $("[data-lb-t]", it).textContent;
      lbL.textContent = $("[data-lb-l]", it).textContent;
      lbD.innerHTML = $("[data-lb-d]", it).innerHTML;
      lbC.textContent = (cur + 1) + " / " + items.length;
    }
    function openLb(i, fromEl) {
      opener = fromEl; fill(i);
      lb.hidden = false; document.body.classList.add("lb-open");
      var first = fromEl.getBoundingClientRect();
      if (!reduce) {
        lb.classList.add("is-entering");
        var last = lbImg.getBoundingClientRect();
        var doFlip = function () {
          last = lbImg.getBoundingClientRect();
          var sx = first.width / last.width, sy = first.height / last.height;
          lbImg.style.transform = "translate(" + (first.left - last.left) + "px," + (first.top - last.top) + "px) scale(" + sx + "," + sy + ")";
          lbImg.style.willChange = "transform";
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            lbImg.style.transition = "transform 600ms cubic-bezier(.16,1,.3,1)"; lbImg.style.transform = "none";
            lb.classList.remove("is-entering");
            setTimeout(function () { lbImg.style.transition = ""; lbImg.style.willChange = ""; }, 650);
          }); });
        };
        if (lbImg.complete) doFlip(); else lbImg.onload = function () { lbImg.onload = null; doFlip(); };
      }
      $("[data-lb-close]", lb).focus();
    }
    function closeLb() {
      var done = function () { lb.hidden = true; lb.classList.remove("is-closing"); document.body.classList.remove("lb-open"); if (opener) opener.focus(); };
      if (reduce) return done();
      lb.classList.add("is-closing"); setTimeout(done, 330);
    }
    items.forEach(function (it, i) {
      var t = $("[data-lb-open]", it);
      t.addEventListener("click", function () { openLb(i, t); });
      t.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(i, t); } });
    });
    $("[data-lb-close]", lb).addEventListener("click", closeLb);
    $("[data-lb-prev]", lb).addEventListener("click", function () { fill(cur - 1); });
    $("[data-lb-next]", lb).addEventListener("click", function () { fill(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowRight") fill(cur + 1);
      else if (e.key === "ArrowLeft") fill(cur - 1);
      else if (e.key === "Tab") {
        var f = $$("button, a[href]", lb).filter(function (x) { return x.offsetParent !== null; });
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    var sx0 = null;
    lb.addEventListener("touchstart", function (e) { sx0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (sx0 === null) return; var dx = e.changedTouches[0].clientX - sx0; sx0 = null;
      if (Math.abs(dx) > 50) fill(cur + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- 6. soft exit fade between pages (first paint never hidden) ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|https?:)/.test(href)) return;
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault(); document.body.classList.add("is-leaving");
    setTimeout(function () { location.href = a.href; }, 300);
  });
  addEventListener("pageshow", function () { document.body.classList.remove("is-leaving"); });

  /* ---------- 7. letter form (Netlify Forms: POST /, form-name=letter) ---------- */
  var form = $("[data-letter-form]");
  if (!form) return;
  var PURSE = {
    DREAM: ["USD 4.5–8.5k", "USD 8.5–14k+"], SIGHT: ["USD 5–9k", "USD 9–15k+"],
    NIGHT: ["from USD 4k + travel"], ROOM: ["from USD 10k + travel"], STUDY: ["Price on request"]
  };
  var purse = $("[data-purse]", form), studyField = $('[data-field="study"]', form), seasonField = $('[data-field="season"]', form);
  var briefHint = $("[data-brief-hint]", form), BRIEF_HINT = briefHint ? briefHint.textContent : "";
  function field(n) { return $('[data-field="' + n + '"]', form); }
  function clear(n) { var f = field(n); if (f) f.classList.remove("has-error"); }
  function isStudy() { var c = $('input[name="instrument"]:checked', form); return c && c.value === "STUDY"; }
  $$('input[name="instrument"]', form).forEach(function (r) {
    r.addEventListener("change", function () {
      clear("instrument"); clear("purse"); purse.innerHTML = "";
      PURSE[r.value].forEach(function (label) {
        var l = document.createElement("label"); l.className = "radio-line";
        var inp = document.createElement("input"); inp.type = "radio"; inp.name = "purse"; inp.value = label;
        l.appendChild(inp); l.appendChild(document.createTextNode(" " + label)); purse.appendChild(l);
      });
      var study = r.value === "STUDY";
      if (studyField) studyField.hidden = !study; if (seasonField) seasonField.hidden = study;
      if (briefHint) briefHint.textContent = study ? "A short note: where it will hang, or why this study. Optional for studies." : BRIEF_HINT;
      if (PURSE[r.value].length === 1) $("input", purse).checked = true;
    });
  });
  form.addEventListener("change", function (e) { if (e.target.name === "season") clear("season"); if (e.target.name === "purse") clear("purse"); if (e.target.name === "study") clear("study"); });
  var q = new URLSearchParams(location.search);
  var qr = $('input[name="instrument"][value="' + (q.get("instrument") || "").toUpperCase().replace(/[^A-Z]/g, "") + '"]', form);
  if (qr) {
    qr.checked = true; qr.dispatchEvent(new Event("change", { bubbles: true }));
    var qs = (q.get("study") || "").replace(/[^A-Za-z0-9-]/g, "");
    var sr = qs && $('input[name="study"][value="' + qs + '"]', form); if (sr) sr.checked = true;
  }
  $$("[data-count-for]", form).forEach(function (c) {
    var input = document.getElementById(c.getAttribute("data-count-for")), max = +input.getAttribute("maxlength");
    function tick() { var n = input.value.length; c.textContent = n + " / " + max; c.classList.toggle("near", n >= max * 0.9 && n < max); c.classList.toggle("over", n >= max); }
    input.addEventListener("input", tick); tick();
  });
  ["city", "brief", "why", "name", "email"].forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener("input", function () { clear(id); }); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = [], v = function (id) { return (document.getElementById(id).value || "").trim(); };
    var study = isStudy();
    if (!$('input[name="instrument"]:checked', form)) bad.push("instrument");
    if (study && !$('input[name="study"]:checked', form)) bad.push("study");
    if (!v("city")) bad.push("city");
    var brief = v("brief"), bf = field("brief");
    if (!brief && !study) { bad.push("brief"); $(".err", bf).textContent = "Tell me what you’d like painted."; }
    else if (brief.length > 800) { bad.push("brief"); $(".err", bf).textContent = "Keep it under 800 characters."; }
    if (!study && !$('input[name="season"]:checked', form)) bad.push("season");
    if (!$('input[name="purse"]:checked', form)) bad.push("purse");
    if (!v("why")) bad.push("why");
    if (!v("name")) bad.push("name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) bad.push("email");
    $$(".has-error", form).forEach(function (f) { f.classList.remove("has-error"); });
    bad.forEach(function (n) { field(n).classList.add("has-error"); });
    if (bad.length) { field(bad[0]).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); return; }
    var btn = $('button[type="submit"]', form), sErr = $("[data-submit-err]", form);
    if (sErr) sErr.classList.remove("is-on");
    var fd = new FormData(form);
    fd.set("form-name", "letter");
    var pc = $('input[name="purse"]:checked', form);
    fd.set("purse", pc ? pc.value : "");
    if (!study) fd.delete("study");
    btn.disabled = true; btn.setAttribute("aria-busy", "true");
    fetch(form.getAttribute("action") || "/", { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("submit failed " + res.status);
        /* success only after Netlify accepts the letter; then the seal stamps once */
        form.hidden = true;
        $$("[data-hide-on-success]").forEach(function (el) { el.hidden = true; });
        var s = $("[data-success]"); s.hidden = false; s.focus({ preventScroll: true });
        var top = s.getBoundingClientRect().top + scrollY - 120;
        scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
        var seal = $(".seal", s);
        if (seal && !reduce) setTimeout(function () { seal.classList.add("is-stamped"); }, 450);
      })
      .catch(function (err) {
        if (window.console) console.error(err);
        btn.disabled = false; btn.removeAttribute("aria-busy");
        if (sErr) sErr.classList.add("is-on");
      });
  });
})();
