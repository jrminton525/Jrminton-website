/* ============================================================
   J.R. Minton — site scripts
   ------------------------------------------------------------
   Each feature is wrapped in its own IIFE with an early-return
   guard, so loading this file on a page that doesn't have (say)
   the podcast section or the contact form is a no-op for those
   pieces. The mobile nav and scrolled-nav state run on any page
   that includes the nav from template.html.
   ============================================================ */

/* ============ Mobile nav toggle ============ */
(function setupMobileNav() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;

  function closeMenu() {
    navLinks.classList.remove('open');
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  }
  function openMenu() {
    navLinks.classList.add('open');
    menuToggle.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
  }

  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navLinks.classList.contains('open')) closeMenu();
    else openMenu();
  });

  // Tap outside the menu to close it.
  // On mobile (≤900px), the closing tap is "swallowed" so the user doesn't
  // accidentally trigger a link or button while trying to dismiss the menu.
  // On desktop, the click passes through normally — misclicks are unlikely there.
  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    if (navLinks.contains(e.target) || menuToggle.contains(e.target)) return;

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeMenu();
  }, true); // capture phase so we intercept before the target's own handler runs

  // Close menu when a nav link is tapped
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on Escape key (nice-to-have for desktop)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
  });
})();

/* ============ Scrolled-nav state ============ */
(function setupScrolledNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
})();

/* ============ Fade-in on scroll ============ */
(function setupFadeIn() {
  const fadeEls = document.querySelectorAll('.section-title, .demo-card, .category-card');
  if (fadeEls.length === 0) return;

  fadeEls.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 50);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeEls.forEach(el => observer.observe(el));
})();

/* ============ Podcast scroll-driven shrink animation ============ */
(function setupPodcastScroll() {
  const podcastSection = document.querySelector('.podcast');
  const podcastStack = document.querySelector('.podcast-stack');
  if (!podcastSection || !podcastStack) return;

  function update() {
    const rect = podcastSection.getBoundingClientRect();
    const sectionHeight = podcastSection.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Progress = 0 when section's top hits bottom of viewport (just appearing)
    // Progress = 1 when we've scrolled enough to push section's bottom to top
    const scrolled = viewportHeight - rect.top;
    const totalScrollDistance = viewportHeight + sectionHeight;
    let progress = scrolled / totalScrollDistance;
    progress = Math.max(0, Math.min(1, progress));

    // Wave shrinks EARLY — from progress 0.10 → 0.35 (right as section enters)
    const waveProgress = Math.max(0, Math.min(1, (progress - 0.10) / 0.25));
    const waveScale = 1 - (waveProgress * 0.55); // 1 → 0.45

    // Glow fades out as wave shrinks
    const glowOpacity = 1 - waveProgress;

    // As wave shrinks, pull it UP toward the label (closing empty space above it).
    const waveMarginTop = waveProgress * -10; // 0rem → -10rem

    // Content fades in from progress 0.20 → 0.40 (right behind the wave shrink)
    const contentProgress = Math.max(0, Math.min(1, (progress - 0.20) / 0.20));
    const contentOpacity = contentProgress;
    const contentTranslate = (1 - contentProgress) * 30;

    podcastStack.style.setProperty('--wave-scale', waveScale);
    podcastStack.style.setProperty('--wave-margin-top', waveMarginTop + 'rem');
    podcastStack.style.setProperty('--glow-opacity', glowOpacity);
    podcastStack.style.setProperty('--content-opacity', contentOpacity);
    podcastStack.style.setProperty('--content-translate', contentTranslate + 'px');
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ============ Contact form (fetch-based submit with inline status) ============ */
(function setupContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('cf-status');
  const submitBtn = document.getElementById('cf-submit');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    status.className = 'form-status';
    status.textContent = '';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.reset();
        status.className = 'form-status success';
        status.textContent =
          "Thanks — your message is on its way. I'll get back to you soon.";
        submitBtn.textContent = 'Send Message';
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          (data.errors && data.errors.map(e => e.message).join(', ')) ||
          'Something went wrong. Please try again or email directly.';
        status.className = 'form-status error';
        status.textContent = msg;
        submitBtn.textContent = 'Send Message';
      }
    } catch (err) {
      status.className = 'form-status error';
      status.textContent =
        "Couldn't send the message. Please check your connection or email directly.";
      submitBtn.textContent = 'Send Message';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();

/* ============ Discount-code copy-on-click (affiliate page) ============ */
(function setupCodeCopy() {
  const codeButtons = document.querySelectorAll('.brand-code-value[data-copy]');
  if (codeButtons.length === 0) return;

  codeButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.getAttribute('data-copy');
      const feedback = btn.parentElement.querySelector('.brand-code-copied');

      try {
        await navigator.clipboard.writeText(code);
        if (feedback) {
          feedback.classList.add('is-visible');
          setTimeout(() => feedback.classList.remove('is-visible'), 1800);
        }
      } catch (err) {
        // Fallback: select the text so the user can long-press → copy on mobile
        const range = document.createRange();
        range.selectNodeContents(btn);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  });
})();
