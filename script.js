/* ============================================================
   Houda & Youssef — 22.08.2026
   Interactivity: countdown, language toggle, scroll reveals,
                  RSVP form.
   ============================================================ */

(() => {
  "use strict";

  // ---------- 0. Intro: 3D door opening ----------
  const intro    = document.getElementById("intro");
  const introBtn = document.getElementById("intro-open");

  let introOpened = false;
  function openIntro() {
    if (introOpened || !intro) return;
    introOpened = true;

    intro.classList.add("is-opening");
    // Envelope choreography: seal breaks (~0.6s) → flap opens (~1.4s)
    // → letter slides out (~2.1s). Give the guest a beat to absorb,
    // then fade and unlock scroll.
    setTimeout(() => { intro.classList.add("is-hidden"); }, 2700);
    setTimeout(() => {
      document.body.classList.remove("scroll-locked");
      window.scrollTo({ top: 0 });
    }, 3400);
  }

  // Only the wax seal triggers the opening — it's THE focal interaction.
  introBtn?.addEventListener("click", openIntro);
  document.addEventListener("keydown", (e) => {
    if (!introOpened && (e.key === "Enter" || e.key === " ")) {
      // Avoid scrolling the page when pressing Space.
      if (e.key === " ") e.preventDefault();
      openIntro();
    }
  });


  // ---------- 1. Countdown ----------
  // Wedding date — local time. Adjust hour if needed.
  const WEDDING_DATE = new Date("2026-08-22T20:00:00");

  const cd = {
    days:  document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    mins:  document.getElementById("cd-mins"),
    secs:  document.getElementById("cd-secs"),
  };

  const pad = (n) => String(n).padStart(2, "0");

  function updateCountdown() {
    const diff = WEDDING_DATE - new Date();
    if (diff <= 0) {
      cd.days.textContent = cd.hours.textContent = cd.mins.textContent = cd.secs.textContent = "00";
      return;
    }
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    cd.days.textContent  = pad(d);
    cd.hours.textContent = pad(h);
    cd.mins.textContent  = pad(m);
    cd.secs.textContent  = pad(s);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);


  // ---------- 2. Language toggle (FR / AR) ----------
  const LANG_KEY = "ao-wedding-lang";
  const body = document.body;

  function applyLang(lang) {
    body.classList.toggle("lang-fr", lang === "fr");
    body.classList.toggle("lang-ar", lang === "ar");
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-fr][data-ar]").forEach((el) => {
      const next = el.getAttribute(`data-${lang}`);
      if (next) el.textContent = next;
    });
    localStorage.setItem(LANG_KEY, lang);
  }

  const savedLang = localStorage.getItem(LANG_KEY) || "fr";
  applyLang(savedLang);

  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    const current = body.classList.contains("lang-ar") ? "ar" : "fr";
    applyLang(current === "fr" ? "ar" : "fr");
  });


  // ---------- 2b. 3D parallax world ----------
  // Decorative floating shapes drift at different speeds as the user scrolls,
  // giving the impression of layered depth.
  const parallaxLayers = document.querySelectorAll("[data-parallax]");
  let ticking = false;

  function updateParallax() {
    const y = window.scrollY;
    parallaxLayers.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      const z = -y * speed * 0.5;
      el.style.transform = `translate3d(0, ${-y * speed}px, 0) translateZ(${z}px)`;
    });
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });


  // ---------- 2c. Story timeline: dynamic line + per-event activation ----------
  const storyTimeline = document.getElementById("story-timeline");
  if (storyTimeline) {
    const events = Array.from(storyTimeline.querySelectorAll(".st-event"));

    // Each event lights up when its dot crosses the viewport's midpoint.
    const evIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-active");
        });
      },
      { threshold: 0, rootMargin: "0px 0px -45% 0px" }
    );
    events.forEach((ev) => evIO.observe(ev));

    // The gold line fills based on scroll progress through the timeline.
    function updateStoryProgress() {
      const rect = storyTimeline.getBoundingClientRect();
      const viewH = window.innerHeight;
      const start = viewH * 0.85;          // start filling when top reaches 85% down
      const end   = viewH * 0.35;          // full when top reaches 35% down
      const scrolled = start - rect.top;
      const total    = rect.height + (start - end);
      const pct = Math.max(0, Math.min(1, scrolled / total));
      storyTimeline.style.setProperty("--progress", (pct * 100).toFixed(1) + "%");
    }
    updateStoryProgress();
    window.addEventListener("scroll", updateStoryProgress, { passive: true });
    window.addEventListener("resize", updateStoryProgress);
  }


  // ---------- 3. Scroll reveal ----------
  const reveals = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => io.observe(el));



  // ---------- 5. RSVP form ----------
  // For now: simulate submit + persist locally. Hook up to a real
  // backend (Formspree, Netlify Forms, or a custom API) later.
  const form     = document.getElementById("rsvp-form");
  const feedback = document.getElementById("form-feedback");

  const messages = {
    fr: {
      ok:    "Merci ! Votre réponse a bien été enregistrée.",
      error: "Merci de remplir les champs obligatoires.",
    },
    ar: {
      ok:    "شكراً لكم! تم تسجيل ردكم.",
      error: "يرجى ملء الحقول المطلوبة.",
    },
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    feedback.classList.remove("error");

    const data = Object.fromEntries(new FormData(form).entries());
    const lang = body.classList.contains("lang-ar") ? "ar" : "fr";

    if (!data.name || !data.email) {
      feedback.textContent = messages[lang].error;
      feedback.classList.add("error");
      return;
    }

    // Persist locally as a draft (real submission goes through a backend).
    const stored = JSON.parse(localStorage.getItem("ao-rsvp") || "[]");
    stored.push({ ...data, submittedAt: new Date().toISOString() });
    localStorage.setItem("ao-rsvp", JSON.stringify(stored));

    feedback.textContent = messages[lang].ok;
    form.reset();
  });

})();
