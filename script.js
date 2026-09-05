(() => {
  "use strict";

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const hasGsap = Boolean(window.gsap);
  const hasScrollTrigger = Boolean(window.gsap && window.ScrollTrigger);

  if (hasScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  if (hasGsap && !reducedMotionQuery.matches) {
    document.documentElement.classList.add("js-motion");
  }

  const scene = document.getElementById("portfolioScene");
  const enterButton = scene?.querySelector(".enter-button");
  const homeLogo = document.getElementById("homeLogo");
  const aboutLink = document.getElementById("aboutLink");
  const navbar = document.querySelector(".navbar");
  const aboutContent = document.getElementById("aboutContent");
  const aboutHeading = document.getElementById("aboutName");
  const heroImage = scene?.querySelector(".portrait-hero");
  const aboutImage = scene?.querySelector(".portrait-about");
  const portrait = scene?.querySelector(".portrait");

  let lenis = null;
  let heroTimeline = null;
  let heroIsOpen = false;
  let heroIsAnimating = false;
  let projectSectionEntered = false;

  function useFallbackImage() {
    if (!aboutImage || !heroImage) return;
    aboutImage.removeEventListener("error", useFallbackImage);
    aboutImage.src = heroImage.currentSrc || heroImage.src;
  }

  aboutImage?.addEventListener("error", useFallbackImage);
  if (aboutImage?.complete && aboutImage.naturalWidth === 0) useFallbackImage();

  function closeMobileMenu() {
    const menu = document.getElementById("navbarNav");
    if (menu && window.bootstrap?.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
    }
  }

  function scrollToTopImmediately() {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function unlockScroll() {
    document.body.classList.remove("scroll-locked");
    lenis?.start();
    window.ScrollTrigger?.refresh();
  }

  function lockScroll() {
    lenis?.stop();
    scrollToTopImmediately();
    document.body.classList.add("scroll-locked");
  }

  function initSmoothScroll() {
    if (reducedMotionQuery.matches || !window.Lenis) return;

    lenis = new window.Lenis({
      duration: 1.02,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05,
      syncTouch: false,
      autoRaf: !hasGsap
    });

    lenis.stop();
    lenis.on("scroll", () => window.ScrollTrigger?.update());

    if (hasGsap) {
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    }
  }

  function wrapHeading(element, wordAttribute = "") {
    if (!element || element.dataset.motionSplit === "true") return [];
    const words = element.textContent.trim().split(/\s+/).filter(Boolean);
    element.dataset.motionSplit = "true";
    element.setAttribute("aria-label", words.join(" "));
    element.textContent = "";

    return words.map((word) => {
      const mask = document.createElement("span");
      const inner = document.createElement("span");
      mask.className = "motion-mask";
      inner.className = "motion-word";
      if (wordAttribute) inner.setAttribute(wordAttribute, "");
      inner.textContent = word;
      mask.setAttribute("aria-hidden", "true");
      mask.appendChild(inner);
      element.appendChild(mask);
      return inner;
    });
  }

  function initTextReveal() {
    [
      ".intro-display-title",
      ".intro-name",
      ".skills-title",
      ".projects-title",
      ".highlights-title",
      ".contact-title"
    ].forEach((selector) => wrapHeading(document.querySelector(selector)));
  }

  function setHeroAccessibility(open) {
    enterButton?.setAttribute("aria-expanded", String(open));
    if (open) {
      aboutLink?.setAttribute("aria-current", "location");
      homeLogo?.removeAttribute("aria-current");
    } else {
      homeLogo?.setAttribute("aria-current", "location");
      aboutLink?.removeAttribute("aria-current");
    }
  }

  function openHeroImmediately() {
    if (!scene || !aboutContent) return;
    scene.classList.add("is-open");
    scene.style.setProperty("--about-overlay", "1");
    navbar?.classList.add("is-visible");
    aboutContent.inert = false;
    enterButton && (enterButton.disabled = true);
    setHeroAccessibility(true);
    heroIsOpen = true;
    unlockScroll();
    aboutHeading?.focus({ preventScroll: true });
  }

  function closeHeroImmediately() {
    if (!scene || !aboutContent) return;
    lockScroll();
    scene.classList.remove("is-open");
    scene.style.removeProperty("--about-overlay");
    navbar?.classList.remove("is-visible");
    aboutContent.inert = true;
    enterButton && (enterButton.disabled = false);
    setHeroAccessibility(false);
    heroIsOpen = false;
    homeLogo?.focus({ preventScroll: true });
  }

  function buildHeroTimeline() {
    if (!hasGsap || reducedMotionQuery.matches || !scene || !portrait || !aboutContent) return null;

    const gsap = window.gsap;
    const sceneRect = scene.getBoundingClientRect();
    const first = portrait.getBoundingClientRect();

    scene.classList.add("is-open", "is-transitioning");
    aboutContent.inert = false;

    const last = portrait.getBoundingClientRect();
    const aboutTitleWords = aboutContent.querySelectorAll(".intro-display-title .motion-word");
    const nameWords = aboutContent.querySelectorAll(".intro-name .motion-word");
    const roles = aboutContent.querySelectorAll(".intro-roles li");
    const biography = aboutContent.querySelectorAll(".intro-biography p");
    const contacts = aboutContent.querySelectorAll(".intro-contact");
    const labels = scene.querySelectorAll(".banner-labels span");

    gsap.set(portrait, {
      top: first.top - sceneRect.top,
      left: first.left - sceneRect.left,
      width: first.width,
      height: first.height,
      xPercent: 0,
      x: 0,
      y: 0,
      borderRadius: 0
    });
    gsap.set(aboutContent, { autoAlpha: 0, y: 24 });
    gsap.set([...aboutTitleWords, ...nameWords], { yPercent: 112 });
    gsap.set([...roles, ...biography, ...contacts], { autoAlpha: 0, y: 18 });
    gsap.set(navbar, { autoAlpha: 0, yPercent: -110 });
    gsap.set(aboutImage, { autoAlpha: 0 });
    gsap.set(heroImage, { autoAlpha: 1 });

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
      onComplete: () => {
        heroIsAnimating = false;
        heroIsOpen = true;
        scene.classList.remove("is-transitioning");
        navbar?.classList.add("is-visible");
        gsap.set(portrait, { clearProps: "top,left,width,height,x,y,xPercent" });
        unlockScroll();
        aboutHeading?.focus({ preventScroll: true });
      },
      onReverseComplete: () => {
        heroIsAnimating = false;
        heroIsOpen = false;
        scene.classList.remove("is-open", "is-transitioning");
        navbar?.classList.remove("is-visible");
        aboutContent.inert = true;
        enterButton && (enterButton.disabled = false);
        scene.style.removeProperty("--about-overlay");
        gsap.set(
          [portrait, aboutContent, heroImage, aboutImage, enterButton, navbar, ...labels, ...aboutTitleWords, ...nameWords, ...roles, ...biography, ...contacts],
          { clearProps: "all" }
        );
        homeLogo?.focus({ preventScroll: true });
      }
    });

    timeline
      .addLabel("opening")
      .to(enterButton, { autoAlpha: 0, scale: 0.82, x: 0, y: 0, duration: 0.24 }, "opening")
      .to(labels, {
        autoAlpha: 0,
        x: (index) => index % 2 ? 28 : -28,
        y: (index) => index < 2 ? -12 : 12,
        duration: 0.42,
        stagger: 0.045
      }, "opening+=0.05")
      .to(".title-top", { autoAlpha: 0, y: () => -window.innerHeight * 1.08, duration: 1.02, ease: "power4.inOut" }, "opening+=0.1")
      .to(".title-bottom", { autoAlpha: 0, y: () => window.innerHeight * 1.08, duration: 1.02, ease: "power4.inOut" }, "opening+=0.1")
      .to(scene, { "--about-overlay": 1, duration: 0.72, ease: "power2.inOut" }, "opening+=0.16")
      .to(portrait, {
        top: last.top - sceneRect.top,
        left: last.left - sceneRect.left,
        width: last.width,
        height: last.height,
        borderRadius: "28px 28px 18px 18px",
        duration: 1.05,
        ease: "expo.inOut"
      }, "opening+=0.2")
      .to(heroImage, { autoAlpha: 0, scale: 1.025, duration: 0.48 }, "opening+=0.42")
      .to(aboutImage, { autoAlpha: 1, scale: 1, duration: 0.56 }, "opening+=0.47")
      .addLabel("about", "opening+=0.78")
      .to(aboutContent, { autoAlpha: 1, y: 0, duration: 0.5 }, "about")
      .to(aboutTitleWords, { yPercent: 0, duration: 0.58, stagger: 0.06, ease: "power3.out" }, "about+=0.03")
      .to(nameWords, { yPercent: 0, duration: 0.62, stagger: 0.055, ease: "power3.out" }, "about+=0.1")
      .to(roles, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.06 }, "about+=0.2")
      .to(biography, { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.07 }, "about+=0.29")
      .to(contacts, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.055 }, "about+=0.38")
      .add(() => navbar?.classList.add("is-visible"), "about+=0.42")
      .to(navbar, { autoAlpha: 1, yPercent: 0, duration: 0.48 }, "about+=0.42");

    return timeline;
  }

  function openAbout(event) {
    event?.preventDefault();
    closeMobileMenu();
    scrollToTopImmediately();

    if (heroIsOpen) {
      aboutHeading?.focus({ preventScroll: true });
      return;
    }
    if (heroIsAnimating) return;

    if (!hasGsap || reducedMotionQuery.matches) {
      openHeroImmediately();
      return;
    }

    heroIsAnimating = true;
    aboutContent.inert = false;
    enterButton.disabled = true;
    setHeroAccessibility(true);
    heroTimeline ||= buildHeroTimeline();
    heroTimeline.play(0);
  }

  function openHome(event) {
    event?.preventDefault();
    closeMobileMenu();
    if (!heroIsOpen && !heroIsAnimating) return;

    if (!hasGsap || reducedMotionQuery.matches || !heroTimeline) {
      closeHeroImmediately();
      return;
    }

    heroIsAnimating = true;
    lockScroll();
    aboutContent.inert = true;
    setHeroAccessibility(false);
    heroTimeline.reverse();
  }

  function initHeroAnimation() {
    if (!scene || !enterButton || !aboutContent) return;
    homeLogo?.setAttribute("aria-current", "location");
    aboutContent.inert = true;
    lockScroll();
    enterButton.addEventListener("click", openAbout);
    aboutLink?.addEventListener("click", openAbout);
    homeLogo?.addEventListener("click", openHome);
  }

  function initSectionNavigation() {
    document.querySelectorAll('.navbar a[href^="#"]:not(#homeLogo):not(#aboutLink)').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target || !heroIsOpen) return;
        event.preventDefault();
        closeMobileMenu();
        const offset = -(navbar?.offsetHeight || 0);
        if (lenis) lenis.scrollTo(target, { offset });
        else window.scrollTo({ top: target.offsetTop + offset, behavior: reducedMotionQuery.matches ? "auto" : "smooth" });
      });
    });
  }

  function initSectionMotion() {
    if (!hasScrollTrigger || reducedMotionQuery.matches) return;
    const gsap = window.gsap;

    const makeHeadingTimeline = (section, title, intro, line, extras = []) => {
      const words = title?.querySelectorAll(".motion-word") || [];
      gsap.set(words, { yPercent: 112 });
      gsap.set(intro, { autoAlpha: 0, y: 20 });
      gsap.set(line, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(extras, { autoAlpha: 0, y: 22 });

      return gsap.timeline({
        scrollTrigger: { trigger: section, start: "top 76%", once: true }
      })
        .to(words, { yPercent: 0, duration: 0.62, stagger: 0.06, ease: "power3.out" })
        .to(intro, { autoAlpha: 1, y: 0, duration: 0.48 }, 0.12)
        .to(line, { scaleX: 1, duration: 0.72, ease: "power2.out" }, 0.14);
    };

    const skills = document.querySelector(".skills-section");
    if (skills) {
      const cards = skills.querySelectorAll(".skill-card");
      const timeline = makeHeadingTimeline(
        skills,
        skills.querySelector(".skills-title"),
        skills.querySelector(".skills-intro"),
        skills.querySelector(".skills-title-line"),
        cards
      );
      timeline.to(cards, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.58,
        stagger: 0.095,
        ease: "power3.out"
      }, 0.28);
      gsap.set(cards, { autoAlpha: 0, y: 45, scale: 0.97 });
    }

    const projects = document.querySelector(".projects-section");
    if (projects) {
      const timeline = makeHeadingTimeline(
        projects,
        projects.querySelector(".projects-title"),
        projects.querySelector(".projects-intro"),
        projects.querySelector(".projects-title-line")
      );
      const nav = projects.querySelector(".project-carousel-nav");
      const footer = projects.querySelector(".projects-footer");
      gsap.set([nav, footer], { autoAlpha: 0, y: 18 });
      timeline
        .to(nav, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.28)
        .to(footer, { autoAlpha: 1, y: 0, duration: 0.42 }, 0.46)
        .add(() => {
          projectSectionEntered = true;
          animateActiveProject(projectSlides[activeProjectIndex]);
        }, 0.32);
    }

    const highlights = document.querySelector(".highlights-section");
    if (highlights) {
      const panels = highlights.querySelectorAll(".highlight-panel, .certificates-strip");
      const timeline = makeHeadingTimeline(
        highlights,
        highlights.querySelector(".highlights-title"),
        highlights.querySelector(".highlights-intro"),
        highlights.querySelector(".highlights-title-line")
      );
      gsap.set(panels, { autoAlpha: 0, y: 28 });
      timeline.to(panels, { autoAlpha: 1, y: 0, duration: 0.56, stagger: 0.1, ease: "power2.out" }, 0.28);
    }

    const contact = document.querySelector(".contact-section");
    if (contact) {
      const cards = contact.querySelectorAll(".contact-card");
      const footer = contact.querySelector(".contact-footer");
      const timeline = makeHeadingTimeline(
        contact,
        contact.querySelector(".contact-title"),
        contact.querySelector(".contact-intro"),
        contact.querySelector(".contact-title-line")
      );
      gsap.set([...cards, footer], { autoAlpha: 0, y: 24 });
      timeline
        .to(cards, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }, 0.26)
        .to(footer, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.48);
    }
  }

  const projectCarousel = document.querySelector(".projects-showcase");
  const projectSlides = [
    document.getElementById("projectCard01"),
    document.getElementById("projectCard03"),
    document.getElementById("projectCard04"),
    document.getElementById("projectCard02")
  ].filter(Boolean);
  const projectPrev = document.getElementById("projectPrev");
  const projectNext = document.getElementById("projectNext");
  const projectCurrent = document.getElementById("projectCurrent");
  let activeProjectIndex = 0;
  let projectPointerStart = 0;
  let projectSwipeActive = false;
  let lastProjectWheelAt = 0;

  function animateActiveProject(card) {
    if (!card || !projectSectionEntered || !hasGsap || reducedMotionQuery.matches) return;
    const gsap = window.gsap;
    const slot = card.querySelector(".project-image-slot");
    const image = slot?.querySelector("img");
    const copy = card.querySelector(".project-front-copy");
    const textParts = copy?.querySelectorAll(".flip-title, .flip-description, .flip-meta, .flip-outcome, .project-flip-open") || [];

    gsap.killTweensOf([slot, image, ...textParts]);
    gsap.fromTo(slot,
      { clipPath: "inset(100% 0 0 0)" },
      { clipPath: "inset(0% 0 0 0)", duration: 0.86, ease: "power3.inOut", clearProps: "clipPath" }
    );
    if (image) {
      gsap.fromTo(image, { scale: 1.08 }, { scale: 1, duration: 0.95, ease: "power3.out", clearProps: "scale" });
    }
    gsap.fromTo(textParts,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.06, delay: 0.18, ease: "power3.out", clearProps: "opacity,visibility,transform" }
    );
  }

  function renderProjectCarousel(animate = true) {
    const total = projectSlides.length;
    projectSlides.forEach((slide, index) => {
      const forward = (index - activeProjectIndex + total) % total;
      const backward = (activeProjectIndex - index + total) % total;
      slide.classList.remove("is-active", "is-before", "is-after", "is-far");
      slide.setAttribute("aria-hidden", String(index !== activeProjectIndex));
      slide.inert = index !== activeProjectIndex;

      if (index === activeProjectIndex) {
        slide.classList.add("is-active");
        const isFlipped = slide.classList.contains("is-flipped");
        const front = slide.querySelector(".project-face--front");
        const back = slide.querySelector(".project-face--back");
        if (front) front.inert = isFlipped;
        if (back) back.inert = !isFlipped;
      } else if (forward === 1) {
        slide.classList.add("is-after");
      } else if (backward === 1) {
        slide.classList.add("is-before");
      } else {
        slide.classList.add("is-far");
      }
    });

    if (projectCurrent) projectCurrent.textContent = String(activeProjectIndex + 1).padStart(2, "0");
    if (animate) animateActiveProject(projectSlides[activeProjectIndex]);
  }

  function moveProjectCarousel(direction) {
    if (!projectSlides.length) return;
    projectSlides.forEach((slide) => slide.classList.remove("is-flipped"));
    activeProjectIndex = (activeProjectIndex + direction + projectSlides.length) % projectSlides.length;
    renderProjectCarousel(true);
  }

  function initProjectCarousel() {
    if (!projectCarousel) return;
    projectPrev?.addEventListener("click", () => moveProjectCarousel(-1));
    projectNext?.addEventListener("click", () => moveProjectCarousel(1));

    projectCarousel.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      moveProjectCarousel(event.key === "ArrowLeft" ? -1 : 1);
    });

    projectCarousel.addEventListener("pointerdown", (event) => {
      if (event.target.closest("a, button, input, select, textarea, [role='button']")) {
        projectSwipeActive = false;
        return;
      }

      projectSwipeActive = true;
      projectPointerStart = event.clientX;
      projectCarousel.setPointerCapture?.(event.pointerId);
    });

    projectCarousel.addEventListener("pointerup", (event) => {
      if (!projectSwipeActive) return;
      projectSwipeActive = false;
      const distance = event.clientX - projectPointerStart;
      if (Math.abs(distance) >= 55) moveProjectCarousel(distance > 0 ? -1 : 1);
    });

    projectCarousel.addEventListener("pointercancel", () => {
      projectSwipeActive = false;
    });

    projectCarousel.addEventListener("wheel", (event) => {
      const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
      const now = performance.now();
      if (!horizontalIntent || now - lastProjectWheelAt < 520) return;
      event.preventDefault();
      lastProjectWheelAt = now;
      moveProjectCarousel((event.deltaX || event.deltaY) > 0 ? 1 : -1);
    }, { passive: false });

    renderProjectCarousel(false);
  }

  function focusAfterFlip(card, selector) {
    const target = card.querySelector(selector);
    if (reducedMotionQuery.matches) {
      target?.focus();
      return;
    }
    const inner = card.querySelector(".project-flip-inner");
    const focus = () => target?.focus();
    inner?.addEventListener("transitionend", focus, { once: true });
  }

  function setProjectFlip(card, shouldFlip) {
    if (!card?.classList.contains("is-active")) return;
    card.classList.toggle("is-flipped", shouldFlip);
    const front = card.querySelector(".project-face--front");
    const back = card.querySelector(".project-face--back");
    if (front) front.inert = shouldFlip;
    if (back) back.inert = !shouldFlip;
    focusAfterFlip(card, shouldFlip ? ".project-flip-back" : ".project-flip-open");
  }

  function initProjectFlip() {
    document.querySelectorAll(".project-flip-open").forEach((button) => {
      button.addEventListener("click", () => setProjectFlip(button.closest(".project-story"), true));
    });
    document.querySelectorAll(".project-flip-back").forEach((button) => {
      button.addEventListener("click", () => setProjectFlip(button.closest(".project-story"), false));
    });
  }

  const caseModal = document.querySelector(".case-studies");
  const caseCloseButton = caseModal?.querySelector(".case-modal-close");
  let lastCaseTrigger = null;
  let activeCaseStudy = null;
  let caseTimeline = null;

  function finishCaseClose() {
    caseModal?.classList.remove("is-open");
    caseModal?.setAttribute("aria-hidden", "true");
    if (caseModal) caseModal.inert = true;
    document.body.classList.remove("case-modal-open");
    activeCaseStudy?.classList.remove("is-open");
    activeCaseStudy = null;
    if (heroIsOpen) lenis?.start();
    lastCaseTrigger?.focus();
  }

  function closeCaseStudy() {
    if (!caseModal?.classList.contains("is-open") || !activeCaseStudy) return;
    caseTimeline?.kill();

    if (!hasGsap || reducedMotionQuery.matches) {
      finishCaseClose();
      return;
    }

    caseTimeline = window.gsap.timeline({ onComplete: finishCaseClose })
      .to(activeCaseStudy, { autoAlpha: 0, y: 18, scale: 0.97, duration: 0.24, ease: "power2.in" })
      .to(caseModal, { autoAlpha: 0, duration: 0.22, ease: "power1.out" }, 0.08);
  }

  function openCaseStudy(event) {
    event.preventDefault();
    const targetId = event.currentTarget.getAttribute("href");
    const targetCase = targetId ? document.querySelector(targetId) : null;
    if (!caseModal || !targetCase) return;

    caseTimeline?.kill();
    caseModal.querySelector(".case-study.is-open")?.classList.remove("is-open");
    caseModal.querySelectorAll(".case-study").forEach((study) => { study.inert = study !== targetCase; });
    activeCaseStudy = targetCase;
    lastCaseTrigger = event.currentTarget;
    targetCase.classList.add("is-open");
    targetCase.inert = false;
    caseModal.inert = false;
    caseModal.classList.add("is-open");
    caseModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("case-modal-open");
    lenis?.stop();

    const headingWords = wrapHeading(targetCase.querySelector(".case-hero h4"), "data-modal-word");
    const content = targetCase.querySelectorAll(".case-study-label, .case-meta > div, .case-section");

    if (!hasGsap || reducedMotionQuery.matches) {
      caseCloseButton?.focus();
      return;
    }

    const gsap = window.gsap;
    gsap.set(headingWords, { yPercent: 112 });
    caseTimeline = gsap.timeline({ onComplete: () => caseCloseButton?.focus() })
      .fromTo(caseModal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.26, ease: "power1.out" })
      .fromTo(targetCase, { autoAlpha: 0, y: 25, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, 0.06)
      .to(headingWords, { yPercent: 0, duration: 0.5, stagger: 0.045, ease: "power3.out" }, 0.18)
      .fromTo(content, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.045, ease: "power2.out" }, 0.2);
  }

  function trapModalFocus(event) {
    if (!caseModal?.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeCaseStudy();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = [...caseModal.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.closest("[inert]") && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function initCaseStudyModal() {
    if (!caseModal) return;
    caseModal.inert = true;
    document.querySelectorAll('.project-action--primary[href^="#case-"]').forEach((button) => {
      button.addEventListener("click", openCaseStudy);
    });
    caseCloseButton?.addEventListener("click", closeCaseStudy);
    caseModal.addEventListener("click", (event) => {
      if (event.target === caseModal) closeCaseStudy();
    });
    document.addEventListener("keydown", trapModalFocus);
  }

  function initMagneticButtons() {
    if (!hasGsap || reducedMotionQuery.matches || !finePointerQuery.matches) return;
    const gsap = window.gsap;
    const targets = document.querySelectorAll(
      ".enter-button, .projects-github-link, .project-flip-open, .project-flip-back, .mini-case-links a, .project-carousel-buttons button, .contact-card:not(.contact-card--static), .case-modal-close"
    );

    targets.forEach((target) => {
      const moveX = gsap.quickTo(target, "x", { duration: 0.32, ease: "power3.out" });
      const moveY = gsap.quickTo(target, "y", { duration: 0.32, ease: "power3.out" });
      target.addEventListener("pointermove", (event) => {
        const rect = target.getBoundingClientRect();
        const x = Math.max(-7, Math.min(7, (event.clientX - rect.left - rect.width / 2) * 0.16));
        const y = Math.max(-7, Math.min(7, (event.clientY - rect.top - rect.height / 2) * 0.16));
        moveX(x);
        moveY(y);
      });
      target.addEventListener("pointerleave", () => {
        gsap.to(target, { x: 0, y: 0, duration: 0.65, ease: "elastic.out(1, .45)", overwrite: "auto" });
      });
    });
  }

  function initParallax() {
    if (!hasGsap || reducedMotionQuery.matches || !finePointerQuery.matches) return;
    const gsap = window.gsap;

    if (scene && heroImage && aboutImage) {
      const xHero = gsap.quickTo([heroImage, aboutImage], "x", { duration: 0.7, ease: "power3.out" });
      const yHero = gsap.quickTo([heroImage, aboutImage], "y", { duration: 0.7, ease: "power3.out" });
      scene.addEventListener("pointermove", (event) => {
        xHero((event.clientX / window.innerWidth - 0.5) * 14);
        yHero((event.clientY / window.innerHeight - 0.5) * 10);
      });
      scene.addEventListener("pointerleave", () => {
        xHero(0);
        yHero(0);
      });
    }

    projectCarousel?.addEventListener("pointermove", (event) => {
      const image = projectSlides[activeProjectIndex]?.querySelector(".project-image-slot img");
      if (!image) return;
      const rect = projectCarousel.getBoundingClientRect();
      gsap.to(image, {
        x: ((event.clientX - rect.left) / rect.width - 0.5) * 12,
        y: ((event.clientY - rect.top) / rect.height - 0.5) * 8,
        duration: 0.55,
        ease: "power2.out",
        overwrite: "auto"
      });
    });
    projectCarousel?.addEventListener("pointerleave", () => {
      const image = projectSlides[activeProjectIndex]?.querySelector(".project-image-slot img");
      if (image) gsap.to(image, { x: 0, y: 0, duration: 0.65, ease: "power3.out" });
    });

    if (hasScrollTrigger) {
      gsap.utils.toArray(".projects-deco, .highlights-decoration, .contact-glow").forEach((element, index) => {
        gsap.fromTo(element, { y: index % 2 ? -12 : 12 }, {
          y: index % 2 ? 18 : -18,
          ease: "none",
          scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: 1.2 }
        });
      });
    }
  }

  function initReducedMotionListener() {
    reducedMotionQuery.addEventListener?.("change", () => window.location.reload());
  }

  initTextReveal();
  initSmoothScroll();
  initHeroAnimation();
  initSectionNavigation();
  initProjectCarousel();
  initProjectFlip();
  initCaseStudyModal();
  initSectionMotion();
  initMagneticButtons();
  initParallax();
  initReducedMotionListener();
})();
