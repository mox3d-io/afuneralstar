const body = document.body;
const header = document.querySelector("[data-site-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const primaryNav = document.querySelector("[data-primary-nav]");
const playlistStage = document.querySelector("[data-playlist-stage]");
const playerTarget = document.querySelector("[data-player-target]");
const closePlayer = document.querySelector("[data-close-player]");
const promoSlides = Array.from(document.querySelectorAll("[data-promo-slide]"));
const promoDots = Array.from(document.querySelectorAll("[data-promo-dot]"));
let promoIndex = 0;
let promoTimer;

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

const closeNav = () => {
  body.classList.remove("nav-open");
  primaryNav?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  body.classList.toggle("nav-open", !isOpen);
  primaryNav?.classList.toggle("is-open", !isOpen);
});

primaryNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

document.querySelectorAll("[data-playlist]").forEach((button) => {
  button.addEventListener("click", () => {
    const playlistId = button.getAttribute("data-playlist");
    if (!playlistId || !playlistStage || !playerTarget) return;

    playerTarget.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0"
        title="A Funeral Star album playlist"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `;

    playlistStage.hidden = false;
    closePlayer?.focus();
  });
});

const hidePlayer = () => {
  if (!playlistStage || !playerTarget) return;
  playlistStage.hidden = true;
  playerTarget.innerHTML = "";
};

const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag !== "function") return;

  window.gtag("event", eventName, {
    page_path: window.location.pathname,
    transport_type: "beacon",
    ...params,
  });
};

const showPromo = (nextIndex, interaction = "auto") => {
  if (!promoSlides.length) return;

  promoIndex = (nextIndex + promoSlides.length) % promoSlides.length;
  promoSlides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === promoIndex);
  });
  promoDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === promoIndex);
  });

  const activeSlide = promoSlides[promoIndex];
  const promoName = activeSlide?.querySelector("[data-promo-link]")?.dataset.promo;
  trackEvent("promo_slide_view", {
    promo: promoName,
    slide_index: promoIndex + 1,
    interaction,
  });
};

const startPromo = () => {
  if (promoSlides.length < 2) return;

  window.clearInterval(promoTimer);
  promoTimer = window.setInterval(() => showPromo(promoIndex + 1), 6500);
};

if (promoSlides.length) {
  showPromo(0, "initial");
  startPromo();
}

promoDots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    showPromo(index, "dot");
    startPromo();
  });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearInterval(promoTimer);
  } else {
    startPromo();
  }
});

document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[href^='http']");
  if (!link || typeof window.gtag !== "function") return;

  window.gtag("event", "fan_link_click", {
    link_text: link.textContent.trim().replace(/\s+/g, " "),
    link_url: link.href,
    link_domain: new URL(link.href).hostname,
    transport_type: "beacon",
  });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[data-lyrics-link]");
  if (!(link instanceof HTMLAnchorElement) || typeof window.gtag !== "function") return;

  const lyricsUrl = new URL(link.getAttribute("href"), window.location.href);

  trackEvent("lyrics_click", {
    song: link.textContent.trim().replace(/\s+/g, " "),
    page_path: lyricsUrl.pathname,
  });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[data-platform-link]");
  if (!(link instanceof HTMLAnchorElement) || typeof window.gtag !== "function") return;

  trackEvent("album_platform_click", {
    album: link.dataset.album,
    platform: link.dataset.platform,
    link_url: link.href,
  });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[data-promo-link]");
  if (!(link instanceof HTMLAnchorElement) || typeof window.gtag !== "function") return;

  trackEvent("promo_click", {
    promo: link.dataset.promo,
    link_text: link.textContent.trim().replace(/\s+/g, " "),
    link_url: link.href,
  });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[data-hero-link]");
  if (!(link instanceof HTMLAnchorElement) || typeof window.gtag !== "function") return;

  trackEvent("hero_cta_click", {
    cta: link.dataset.hero,
    link_text: link.textContent.trim().replace(/\s+/g, " "),
    link_url: link.href,
  });
});

document.querySelectorAll("[data-short-video]").forEach((video) => {
  const milestones = [25, 50, 75];
  const reachedMilestones = new Set();
  let loopCount = 0;
  let lastTime = 0;
  let watchedSeconds = 0;
  let lastWatchSample = 0;

  const baseParams = () => {
    const source = video.querySelector("source");
    return {
      video_title: video.dataset.shortTitle,
      album: video.dataset.shortAlbum,
      video_src: source?.getAttribute("src"),
    };
  };

  video.addEventListener("play", () => {
    document.querySelectorAll("[data-short-video]").forEach((otherVideo) => {
      if (otherVideo !== video) {
        otherVideo.pause();
      }
    });

    lastWatchSample = video.currentTime;

    if (video.dataset.playTracked) return;
    video.dataset.playTracked = "true";
    trackEvent("short_play", baseParams());
  });

  video.addEventListener("timeupdate", () => {
    const duration = video.duration;
    if (!duration || !isFinite(duration)) return;

    const delta = video.currentTime - lastWatchSample;
    if (delta > 0 && delta < 1.5) {
      watchedSeconds += delta;
    }
    lastWatchSample = video.currentTime;

    if (lastTime > duration - 0.75 && video.currentTime < 0.75) {
      loopCount += 1;
      trackEvent("short_complete", {
        ...baseParams(),
        loop_count: loopCount,
        watched_seconds: Math.round(watchedSeconds),
      });
    }
    lastTime = video.currentTime;

    const ratio = (video.currentTime / duration) * 100;
    milestones.forEach((m) => {
      if (ratio >= m && !reachedMilestones.has(m)) {
        reachedMilestones.add(m);
        trackEvent("short_progress", { ...baseParams(), milestone: m });
      }
    });
  });

  video.addEventListener("ended", () => {
    trackEvent("short_complete", {
      ...baseParams(),
      loop_count: loopCount,
      watched_seconds: Math.round(watchedSeconds),
    });
  });
});

closePlayer?.addEventListener("click", hidePlayer);

playlistStage?.addEventListener("click", (event) => {
  if (event.target === playlistStage) {
    hidePlayer();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
    hidePlayer();
  }
});

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();
