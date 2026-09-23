/* ============================================================
   DVX LABS — INTERACTION LAYER
   Vanilla JS · no dependencies · rAF-throttled
   ============================================================ */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ============================================================
     1. INTRO SEQUENCE — once per session
     ============================================================ */
  var intro = $("#intro");
  if (intro) {
    var finishIntro = function () {
      intro.classList.add("done");
      window.setTimeout(function () {
        if (intro.parentNode) intro.parentNode.removeChild(intro);
      }, 800);
    };
    window.setTimeout(finishIntro, 1200);
  }

  /* ============================================================
     2. NAVIGATION — glass on scroll, active section, mobile menu
     ============================================================ */
  var nav = $("#nav");
  var navToggle = $("#navToggle");
  var navLinks = $("#navLinks");

  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* mobile menu toggle with focus containment + Escape */
  if (navToggle && navLinks) {
    var setMenu = function (open) {
      navToggle.setAttribute("aria-expanded", String(open));
      navLinks.classList.toggle("open", open);
    };
    navToggle.addEventListener("click", function () {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    /* close after choosing a link */
    $all("a", navLinks).forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });

    /* close on outside click + Escape */
    document.addEventListener("click", function (e) {
      if (!navLinks.classList.contains("open")) return;
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        setMenu(false);
        navToggle.focus();
      }
    });
  }

  /* active-page indicator: on subpages mark that page's nav link;
     on home also track the section in view for the rail + HUD */
  var pageKey = document.body.getAttribute("data-page") || "home";
  var isHome = pageKey === "home";
  var sectionIds = ["hero", "expertise", "work", "process", "about", "contact"];
  var navAnchors = $all(".nav-links a");

  function updateActive() {
    var probe = window.scrollY + window.innerHeight * 0.35;
    var current = "hero";
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= probe) current = id;
    });
    navAnchors.forEach(function (a) {
      var key = a.getAttribute("data-nav");
      var active;
      if (key) {
        active = key === pageKey;
      } else {
        /* the Start-a-project button follows the contact section on home */
        active = isHome && current === "contact";
      }
      a.classList.toggle("active", active);
      if (key) a.setAttribute("aria-current", active ? "page" : "false");
    });

    /* progress rail + HUD sync */
    $all("#progressRail a").forEach(function (a) {
      var h = a.getAttribute("href") || "";
      if (h.charAt(0) !== "#") { a.classList.remove("active"); return; }
      var target = h.slice(1);
      a.classList.toggle("active", isHome ? target === current : target === "top");
    });
    var hudSection = $("#hudSection");
    if (hudSection) {
      var label = isHome
        ? (current === "hero" ? "Intro" : current.charAt(0).toUpperCase() + current.slice(1))
        : pageKey.charAt(0).toUpperCase() + pageKey.slice(1);
      hudSection.textContent = label;
    }
    var hudScroll = $("#hudScroll");
    if (hudScroll) {
      var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      var pct = maxScroll > 0 ? Math.round((window.scrollY / maxScroll) * 100) : 0;
      hudScroll.textContent = String(Math.min(100, Math.max(0, pct))).padStart(3, "0") + "%";
    }
  }
  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
  updateActive();

  /* rAF position-watcher: guarantees nav/rail/HUD stay in sync even where
     scroll events are unreliable (e.g. embedded preview harnesses). */
  var lastY = -1;
  (function tickScroll() {
    var y = window.scrollY;
    if (y !== lastY) {
      lastY = y;
      onScrollNav();
      updateActive();
    }
    requestAnimationFrame(tickScroll);
  })();

  /* ============================================================
     3. REVEAL ON SCROLL — IntersectionObserver, no continuous work
     ============================================================ */
  var revealEls = $all(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============================================================
     4. CUSTOM CURSOR — desktop pointer devices only
     ============================================================ */
  var cursor = $("#cursor");
  var cursorDot = $("#cursorDot");
  var cursorReady = false;
  var cx = 0, cy = 0, tx = 0, ty = 0;
  var rafId = 0;

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (cursor && cursorDot && finePointer.matches && !reduceMotion.matches) {
    cursorReady = true;
    document.body.classList.add("cursor-on");
    /* keep native cursor visible for reliability */
    document.documentElement.classList.add("keep-native-cursor");

    document.addEventListener("pointermove", function (e) {
      cx = e.clientX; cy = e.clientY;
      tx = e.clientX; ty = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(loopCursor);
    }, { passive: true });

    document.addEventListener("pointerdown", function () {
      document.body.classList.add("cursor-pressed");
    });
    document.addEventListener("pointerup", function () {
      document.body.classList.remove("cursor-pressed");
    });

    document.addEventListener("pointerover", function (e) {
      var hit = e.target.closest("a, button, select, input, textarea, [data-cursor]");
      document.body.classList.toggle("cursor-hover", !!hit);
    });

    window.addEventListener("blur", function () {
      document.body.classList.remove("cursor-on");
    });
    window.addEventListener("focus", function () {
      document.body.classList.add("cursor-on");
    });
  }

  function loopCursor() {
    tx += (cx - tx) * 0.22;
    ty += (cy - ty) * 0.22;
    cursor.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    cursorDot.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
    if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) {
      rafId = requestAnimationFrame(loopCursor);
    } else {
      rafId = 0;
    }
  }

  /* ============================================================
     5. HERO WORKSPACE PARALLAX + CARD TILT — rAF, throttled
     ============================================================ */
  var stage = $("#stageWrap");
  var workspace = $("#workspace");

  if (stage && workspace && finePointer.matches && !reduceMotion.matches) {
    var stageRect = null;
    var px = 0, py = 0, gx = 0, gy = 0;
    var stageRaf = 0;

    stage.addEventListener("pointerenter", function () { stageRect = stage.getBoundingClientRect(); });
    stage.addEventListener("pointermove", function (e) {
      if (!stageRect) stageRect = stage.getBoundingClientRect();
      var rect = stageRect;
      var nx = (e.clientX - rect.left) / rect.width - 0.5;
      var ny = (e.clientY - rect.top) / rect.height - 0.5;
      px = nx; py = ny;
      if (!stageRaf) stageRaf = requestAnimationFrame(loopStage);
    }, { passive: true });
    stage.addEventListener("pointerleave", function () {
      px = 0; py = 0;
      if (!stageRaf) stageRaf = requestAnimationFrame(loopStage);
    });

    function loopStage() {
      gx += (px - gx) * 0.08;
      gy += (py - gy) * 0.08;
      workspace.style.transform =
        "rotateX(" + (-gy * 7).toFixed(2) + "deg) rotateY(" + (gx * 9).toFixed(2) + "deg)";
      if (Math.abs(px - gx) > 0.001 || Math.abs(py - gy) > 0.001) {
        stageRaf = requestAnimationFrame(loopStage);
      } else {
        stageRaf = 0;
      }
    }
  }

  /* panel hover light + spotlight vars */
  $all("[data-tilt-light], .work-card").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    }, { passive: true });
  });

  /* ============================================================
     6. WORK CARD TILT — desktop only, tiny rotation
     ============================================================ */
  var tiltCards = $all("[data-tilt]");
  if (finePointer.matches && !reduceMotion.matches) {
    tiltCards.forEach(function (card) {
      var raf = 0, rX = 0, rY = 0, tX = 0, tY = 0;

      card.addEventListener("pointerenter", function () {
        card.style.transition = "transform 0.12s ease-out";
      });
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        tX = ny * -4; tY = nx * 4;
        if (!raf) raf = requestAnimationFrame(function () {
          card.style.transform = "perspective(900px) rotateX(" + tX + "deg) rotateY(" + tY + "deg)";
        });
      }, { passive: true });
      card.addEventListener("pointerleave", function () {
        card.style.transition = "transform 0.45s var(--ease-out)";
        card.style.transform = "";
        raf = 0;
      });
    });
  }

  /* ============================================================
     7. TICKER pause on hover is CSS-only; nothing needed here.
     ============================================================ */

  /* ============================================================
     8. CONTACT FORM — validation + success state
     ============================================================ */
  var form = $("#contactForm");
  if (form) {
    var setFieldError = function (input, msg) {
      var field = input.closest(".field");
      var err = field ? field.querySelector(".field-error") : null;
      if (field) field.classList.toggle("invalid", !!msg);
      if (err) err.textContent = msg || "";
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg) input.setAttribute("aria-describedby", err ? err.id : "");
    };

    var validators = {
      name: function (v) {
        if (!v.trim()) return "Please enter your name.";
        return "";
      },
      email: function (v) {
        if (!v.trim()) return "Please enter your email address.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "Please enter a valid email address, e.g. name@company.com.";
        return "";
      },
      message: function (v) {
        if (!v.trim()) return "Please describe your project briefly.";
        if (v.trim().length < 20) return "A little more detail helps—aim for at least 20 characters.";
        return "";
      }
    };

    var validateField = function (input) {
      var check = validators[input.name];
      if (!check) return true;
      var msg = check(input.value);
      setFieldError(input, msg);
      return !msg;
    };

    $all("input, textarea", form).forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var firstInvalid = null;
      $all("input, textarea", form).forEach(function (input) {
        if (!validateField(input) && ok) { ok = false; firstInvalid = input; }
      });
      /* still validate all fields even after first failure */
      $all("input, textarea", form).forEach(function (input) { if (!validateField(input)) ok = false; });
      if (!ok) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      /* No backend yet: show success state. PLACEHOLDER: connect real endpoint. */
      form.style.display = "none";
      var success = $("#formSuccess");
      if (success) {
        success.classList.add("show");
        success.focus();
      }
    });
  }

  /* ============================================================
     9. FOOTER YEAR
     */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============================================================
     10. TEXT SCRAMBLE / DECODE — headings, once, near viewport
     ============================================================ */
  var SCRAMBLE_CHARS = "01<>_/\\+=*#";
  function scrambleEl(el) {
    var finalText = "";
    /* capture per-node text so the gradient span survives decoding */
    var nodes = [];
    el.childNodes.forEach(function (n) {
      nodes.push({ node: n, text: n.textContent, isSpan: n.nodeType === 1 });
      finalText += n.textContent;
    });
    if (!finalText.trim()) return;
    var frames = 26;
    var frame = 0;
    var timer = window.setInterval(function () {
      frame++;
      var revealCount = Math.floor((frame / frames) * finalText.length);
      var shown = "";
      nodes.forEach(function (entry) {
        var out = "";
        for (var i = 0; i < entry.text.length; i++) {
          var globalIdx = shown.length;
          if (entry.text[i] === " " || globalIdx < revealCount) {
            out += entry.text[i];
          } else {
            out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
        }
        entry.node.textContent = out;
        shown += entry.text;
      });
      if (frame >= frames) {
        window.clearInterval(timer);
        nodes.forEach(function (entry) { entry.node.textContent = entry.text; });
      }
    }, 34);
  }

  if (!reduceMotion.matches && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          scrambleEl(entry.target);
          so.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    $all("[data-scramble]").forEach(function (el) { so.observe(el); });
  }

  /* ============================================================
     11. MAGNETIC BUTTONS — desktop only, rAF-throttled
     ============================================================ */
  if (finePointer.matches && !reduceMotion.matches) {
    $all(".magnetic").forEach(function (btn) {
      var raf = 0, mx = 0, my = 0;
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        mx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        my = (e.clientY - (r.top + r.height / 2)) * 0.32;
        if (!raf) raf = requestAnimationFrame(function () {
          btn.style.translate = mx + "px " + my + "px";
        });
      }, { passive: true });
      btn.addEventListener("pointerleave", function () {
        btn.style.translate = "";
        raf = 0;
      }, { passive: true });
    });
  }

  /* ============================================================
     12. HERO PARTICLE CONSTELLATION — canvas, cursor-reactive
     ============================================================ */
  var canvas = $("#constellation");
  if (canvas && !reduceMotion.matches) {
    var ctx = canvas.getContext("2d");
    if (ctx) {
      var parts = [];
      var mouse = { x: -9999, y: -9999 };
      var cw = 0, ch = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
      var running = false;
      var LINK_DIST = 120, MOUSE_DIST = 170;

      function sizeCanvas() {
        var hero = canvas.parentElement;
        cw = hero.offsetWidth; ch = hero.offsetHeight;
        canvas.width = cw * dpr; canvas.height = ch * dpr;
        canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var target = Math.min(70, Math.floor((cw * ch) / 16000));
        parts = [];
        for (var i = 0; i < target; i++) {
          parts.push({
            x: Math.random() * cw,
            y: Math.random() * ch,
            vx: (Math.random() - 0.5) * 0.28,
            vy: (Math.random() - 0.5) * 0.28,
            r: Math.random() * 1.6 + 0.6
          });
        }
      }

      function drawConstellation() {
        if (doc.classList.contains("motion-off")) { running = false; return; }
        ctx.clearRect(0, 0, cw, ch);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > cw) p.vx *= -1;
          if (p.y < 0 || p.y > ch) p.vy *= -1;
          /* gentle cursor attraction */
          var dxm = mouse.x - p.x, dym = mouse.y - p.y;
          var dm = Math.hypot(dxm, dym);
          if (dm < MOUSE_DIST && dm > 0.001) {
            p.x += (dxm / dm) * 0.16;
            p.y += (dym / dm) * 0.16;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = "rgba(167, 139, 250, 0.55)";
          ctx.fill();
          for (var j = i + 1; j < parts.length; j++) {
            var q = parts[j];
            var dx = p.x - q.x, dy = p.y - q.y;
            var d = Math.hypot(dx, dy);
            if (d < LINK_DIST) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = "rgba(139, 92, 246, " + (0.14 * (1 - d / LINK_DIST)).toFixed(3) + ")";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
          if (dm < MOUSE_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = "rgba(34, 211, 238, " + (0.28 * (1 - dm / MOUSE_DIST)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        if (running) requestAnimationFrame(drawConstellation);
      }

      var hero = $("#hero");
      function startStop() {
        var rect = canvas.getBoundingClientRect();
        var visible = rect.bottom > 0 && rect.top < window.innerHeight;
        if (visible && !running) { running = true; requestAnimationFrame(drawConstellation); }
        else if (!visible && running) { running = false; }
      }

      sizeCanvas();
      window.addEventListener("resize", sizeCanvas, { passive: true });
      window.addEventListener("load", sizeCanvas);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeCanvas);
      if (finePointer.matches) {
        hero.addEventListener("pointermove", function (e) {
          var r = canvas.getBoundingClientRect();
          mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
        }, { passive: true });
        hero.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; }, { passive: true });
      }
      /* visibility gating via IntersectionObserver — no scroll-listener dependency */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          var visible = entries[0].isIntersecting;
          if (visible && !running) { running = true; requestAnimationFrame(drawConstellation); }
          else if (!visible && running) { running = false; }
        }, { threshold: 0 }).observe(canvas);
      } else {
        startStop();
      }
      /* restart after the ambient-motion toggle turns effects back on */
      document.addEventListener("dvx-motion", function () {
        var r = canvas.getBoundingClientRect();
        var visible = r.bottom > 0 && r.top < window.innerHeight;
        if (visible && !running && !doc.classList.contains("motion-off")) { running = true; requestAnimationFrame(drawConstellation); }
      });
    }
  }

  /* ============================================================
     13. COMMAND PALETTE (Ctrl+K) — nav, copy email, motion toggle
     ============================================================ */
  var backdrop = $("#cmdkBackdrop");
  var cmdkInput = $("#cmdkInput");
  var cmdkList = $("#cmdkList");
  var cmdkEmpty = $("#cmdkEmpty");

  function showToast(msg) {
    var toast = $("#toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () { toast.classList.remove("show"); }, 2400);
  }

  function motionOn() { return !document.documentElement.classList.contains("motion-off"); }

  var commands = [
    { label: "Home", key: "H", hint: "Page", run: function () { location.href = "index.html"; } },
    { label: "Go: Expertise", key: "G 1", hint: "Page", run: function () { location.href = "expertise.html"; } },
    { label: "Go: Work", key: "G 2", hint: "Page", run: function () { location.href = "work.html"; } },
    { label: "Go: Process", key: "G 3", hint: "Page", run: function () { location.href = "process.html"; } },
    { label: "Go: About", key: "G 4", hint: "Page", run: function () { location.href = "about.html"; } },
    { label: "Go: Contact", key: "G 5", hint: "Page", run: function () { location.href = "contact.html"; } },
    { label: "Copy email address", key: "E", hint: "hello@dvxlabs.example.com", run: function () {
      var email = "hello@dvxlabs.example.com";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () { showToast("Email copied to clipboard"); }, function () { showToast(email); });
      } else { showToast(email); }
    } },
    { label: "Toggle ambient motion", key: "M", hint: motionOn() ? "On" : "Off", run: function () {
      var on = motionOn();
      document.documentElement.classList.toggle("motion-off", on);
      try { localStorage.setItem("dvx-motion", on ? "off" : "on"); } catch (e) {}
      showToast(on ? "Ambient motion off" : "Ambient motion on");
    } },
    { label: "Start a project", key: "S", hint: "Contact form", run: function () { location.href = "contact.html"; } }
  ];

  /* restore motion preference; respect it alongside prefers-reduced-motion */
  try {
    if (localStorage.getItem("dvx-motion") === "off") document.documentElement.classList.add("motion-off");
  } catch (e) {}

  /* wrap the motion command: refresh its hint and restart ambient layers when re-enabled */
  var motionCmd = commands.filter(function (c) { return c.label === "Toggle ambient motion"; })[0];
  if (motionCmd) {
    var prevMotionRun = motionCmd.run;
    motionCmd.run = function () {
      prevMotionRun();
      motionCmd.hint = motionOn() ? "On" : "Off";
      try { document.dispatchEvent(new Event("dvx-motion")); } catch (e) {}
    };
  }

  var cmdkOpen = false;
  var cmdkIndex = 0;
  var cmdkFiltered = commands.slice();

  function renderCmdk() {
    cmdkList.innerHTML = "";
    cmdkFiltered.forEach(function (cmd, i) {
      var li = document.createElement("li");
      li.setAttribute("role", "presentation");
      var b = document.createElement("button");
      b.className = "cmdk-item";
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", String(i === cmdkIndex));
      b.innerHTML = '<span class="ci-ico" aria-hidden="true">◇</span>';
      b.appendChild(document.createTextNode(cmd.label));
      var k = document.createElement("span");
      k.className = "ci-key";
      k.textContent = cmd.key + " · " + cmd.hint;
      b.appendChild(k);
      b.addEventListener("click", function () { execCmd(cmd); });
      b.addEventListener("pointerenter", function () { cmdkIndex = i; paintSelection(); });
      li.appendChild(b);
      cmdkList.appendChild(li);
    });
    cmdkEmpty.hidden = cmdkFiltered.length > 0;
    cmdkInput.setAttribute("aria-activedescendant", "");
  }
  function paintSelection() {
    $all(".cmdk-item", cmdkList).forEach(function (b, i) {
      b.setAttribute("aria-selected", String(i === cmdkIndex));
    });
  }
  function execCmd(cmd) {
    closeCmdk();
    if (cmd && cmd.run) cmd.run();
  }
  function openCmdk() {
    if (!backdrop) return;
    cmdkOpen = true;
    backdrop.classList.add("open");
    cmdkInput.value = "";
    cmdkIndex = 0;
    cmdkFiltered = commands.slice();
    renderCmdk();
    window.setTimeout(function () { cmdkInput.focus(); }, 30);
  }
  function closeCmdk() {
    if (!backdrop) return;
    cmdkOpen = false;
    backdrop.classList.remove("open");
  }

  if (backdrop && cmdkInput && cmdkList) {
    $("#cmdkTrigger").addEventListener("click", openCmdk);
    backdrop.addEventListener("click", function (e) { if (e.target === backdrop) closeCmdk(); });

    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "k") {
        e.preventDefault();
        cmdkOpen ? closeCmdk() : openCmdk();
      } else if (e.key === "Escape" && cmdkOpen) {
        closeCmdk();
        if (navToggle) navToggle.blur();
      }
    });

    cmdkInput.addEventListener("input", function () {
      var q = cmdkInput.value.trim().toLowerCase();
      cmdkFiltered = commands.filter(function (c) { return c.label.toLowerCase().indexOf(q) !== -1; });
      cmdkIndex = 0;
      renderCmdk();
    });
    cmdkInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); cmdkIndex = Math.min(cmdkIndex + 1, cmdkFiltered.length - 1); paintSelection(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); cmdkIndex = Math.max(cmdkIndex - 1, 0); paintSelection(); }
      else if (e.key === "Enter") { e.preventDefault(); execCmd(cmdkFiltered[cmdkIndex]); }
      else if (e.key === "Escape") { e.stopPropagation(); closeCmdk(); }
    });
  }

  /* ============================================================
     14. WORKSPACE FILE TABS — switch files with a typewriter print
     ============================================================ */
  var FILES = {
    experience: {
      path: "src/experience.ts",
      lines: [
        "<span class=\"c-key\">const</span> experience = {",
        "  strategy: <span class=\"c-str\">\"clear\"</span>,",
        "  interface: <span class=\"c-str\">\"thoughtful\"</span>,",
        "  performance: <span class=\"c-str\">\"fast\"</span>,",
        "  result: <span class=\"c-str\">\"built to work\"</span>",
        "};",
        " ",
        "<span class=\"c-key\">export default</span> <span class=\"c-fn\">launch</span>(experience);"
      ]
    },
    deploy: {
      path: "launch.sh",
      lines: [
        "<span class=\"c-dim\">#!/usr/bin/env bash</span>",
        "<span class=\"c-fn\">dvx</span> build --target production",
        "<span class=\"c-fn\">dvx</span> test --suite e2e",
        "<span class=\"c-fn\">dvx</span> deploy --edge",
        "<span class=\"c-str\">✓ live in 34s — zero downtime</span>"
      ]
    },
    status: {
      path: "status.log",
      lines: [
        "<span class=\"c-dim\">[09:41:07]</span> build <span class=\"c-str\">passing</span>",
        "<span class=\"c-dim\">[09:41:09]</span> lighthouse perf <span class=\"c-str\">98</span>",
        "<span class=\"c-dim\">[09:41:11]</span> a11y audit <span class=\"c-str\">clean</span>",
        "<span class=\"c-dim\">[09:41:12]</span> deploy <span class=\"c-str\">● production — live</span>"
      ]
    }
  };

  var wsRail = $("#wsRail");
  var wsCode = $("#wsCode");
  var wsTitle = $(".ws-titlebar .path");
  if (wsRail && wsCode) {
    var wsTimer = 0;
    var printFile = function (file) {
      var data = FILES[file];
      if (!data) return;
      window.clearInterval(wsTimer);
      wsCode.classList.remove("stamping");
      wsCode.innerHTML = "";
      if (wsTitle) wsTitle.textContent = "dvx-labs — " + data.path;
      var els = data.lines.map(function (html) {
        var span = document.createElement("span");
        span.className = "ln";
        span.innerHTML = html;
        span.style.opacity = "0";
        wsCode.appendChild(span);
        return span;
      });
      var i = 0;
      wsTimer = window.setInterval(function () {
        if (i < els.length) {
          els[i].style.opacity = "1";
          els[i].style.transform = "none";
          els[i].style.transition = "opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out)";
          i++;
        } else {
          window.clearInterval(wsTimer);
        }
      }, 90);
    };
    $all("button", wsRail).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $all("button", wsRail).forEach(function (b) { b.classList.remove("on"); });
        btn.classList.add("on");
        printFile(btn.getAttribute("data-file"));
      });
    });
  }

  /* ============================================================
     15. ABOUT TERMINAL — type-out values when scrolled into view
     ============================================================ */
  var termRows = $all("[data-typeline]");
  if (termRows.length && "IntersectionObserver" in window && !reduceMotion.matches) {
    termRows.forEach(function (el) { el.textContent = ""; el.style.minHeight = "1.3em"; });
    var typeAll = function () {
      var delay = 200;
      termRows.forEach(function (el) {
        var text = el.getAttribute("data-typeline") || el.textContent;
        window.setTimeout(function () {
          var i = 0;
          var t = window.setInterval(function () {
            el.textContent = text.slice(0, ++i);
            if (i >= text.length) window.clearInterval(t);
          }, 26);
        }, delay);
        delay += text.length * 26 + 350;
      });
    };
    var termIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          termIo.unobserve(entry.target);
          typeAll();
        }
      });
    }, { threshold: 0.3 });
    termIo.observe(termRows[0]);
  }

  /* ============================================================
     16. SCROLL PROGRESS LINE + CURSOR LIGHT + HUD FPS
     ============================================================ */
  var progressBar = $("#scrollProgress");
  var cursorLight = $("#cursorLight");
  var hudFps = $("#hudFps");

  function syncProgress() {
    if (!progressBar) return;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progressBar.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }
  window.addEventListener("scroll", syncProgress, { passive: true });
  window.addEventListener("resize", syncProgress);
  syncProgress();

  if (cursorLight && finePointer.matches && !reduceMotion.matches) {
    var lx = 0, ly = 0, lxSet = false, lightRaf = 0;
    document.addEventListener("pointermove", function (e) {
      lx = e.clientX; ly = e.clientY;
      if (!lxSet) {
        lxSet = true;
        document.body.classList.add("light-on");
        cursorLight.style.setProperty("--lx", lx + "px");
        cursorLight.style.setProperty("--ly", ly + "px");
      }
      if (!lightRaf) lightRaf = requestAnimationFrame(loopLight);
    }, { passive: true });
    function loopLight() {
      cursorLight.style.setProperty("--lx", lx + "px");
      cursorLight.style.setProperty("--ly", ly + "px");
      lightRaf = 0;
    }
  }

  if (hudFps && !reduceMotion.matches) {
    var frames = 0, fpsLast = performance.now();
    (function fpsTick(now) {
      frames++;
      if (now - fpsLast >= 1000) {
        hudFps.textContent = frames + " fps";
        frames = 0;
        fpsLast = now;
      }
      requestAnimationFrame(fpsTick);
    })(performance.now());
  }
})();
