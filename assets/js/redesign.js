(() => {
  const body = document.body;
  const rail = document.querySelector("[data-rail]");
  const railToggle = document.querySelector("[data-rail-toggle]");
  const drawer = document.querySelector("[data-drawer]");
  const drawerScrim = document.querySelector("[data-drawer-scrim]");
  const drawerTitle = document.querySelector("[data-drawer-title]");
  const drawerAlbum = document.querySelector("[data-drawer-album]");
  const drawerBody = document.querySelector("[data-drawer-body]");
  const drawerClose = document.querySelector("[data-drawer-close]");

  const lyricCache = new Map();

  const track = (name, params = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, {
        page_path: window.location.pathname,
        transport_type: "beacon",
        ...params,
      });
    }
  };

  // ---------- Rail (mobile drawer) ----------

  const openRail = () => {
    rail?.classList.add("is-open");
    railToggle?.setAttribute("aria-expanded", "true");
  };
  const closeRail = () => {
    rail?.classList.remove("is-open");
    railToggle?.setAttribute("aria-expanded", "false");
  };
  railToggle?.addEventListener("click", () => {
    rail?.classList.contains("is-open") ? closeRail() : openRail();
  });

  // Close rail when a nav link is clicked (on mobile)
  rail?.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeRail();
  });

  // ---------- Lyrics drawer ----------

  const openDrawer = async ({ slug, album, title, href }) => {
    if (!drawer) return;
    drawerTitle.textContent = title;
    drawerAlbum.textContent = album;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    drawerScrim?.classList.add("is-open");
    drawerBody.classList.remove("is-error");
    drawerBody.classList.add("is-loading");
    drawerBody.textContent = "Loading…";

    track("lyrics_open", { song: title, album, slug });

    try {
      let text = lyricCache.get(href);
      if (!text) {
        const res = await fetch(href);
        if (!res.ok) throw new Error("Fetch failed");
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const pre = doc.querySelector(".lyrics-content pre");
        if (!pre) throw new Error("No lyrics in page");
        text = pre.textContent.trim();
        lyricCache.set(href, text);
      }
      drawerBody.classList.remove("is-loading");
      drawerBody.textContent = text;
    } catch (err) {
      drawerBody.classList.remove("is-loading");
      drawerBody.classList.add("is-error");
      drawerBody.textContent = "Couldn't load these lyrics. Open the standalone page instead.";
    }
  };

  const closeDrawer = () => {
    drawer?.classList.remove("is-open");
    drawer?.setAttribute("aria-hidden", "true");
    drawerScrim?.classList.remove("is-open");
  };

  drawerClose?.addEventListener("click", closeDrawer);
  drawerScrim?.addEventListener("click", closeDrawer);

  document.querySelectorAll("[data-lyrics]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openDrawer({
        slug: btn.dataset.lyrics,
        album: btn.dataset.lyricsAlbum,
        title: btn.dataset.lyricsTitle,
        href: btn.dataset.lyricsHref,
      });
    });
  });

  // ---------- Shorts: pause-others + GA tracking ----------

  document.querySelectorAll("[data-short-video]").forEach((video) => {
    video.addEventListener("play", () => {
      document.querySelectorAll("[data-short-video]").forEach((other) => {
        if (other !== video) other.pause();
      });
      if (!video.dataset.tracked) {
        video.dataset.tracked = "1";
        track("short_play", { video_title: video.dataset.shortTitle });
      }
    });
  });

  // ---------- Gallery + lightbox ----------

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");
  const lightboxPrev = document.querySelector("[data-lightbox-prev]");
  const lightboxNext = document.querySelector("[data-lightbox-next]");
  const lightboxCounter = document.querySelector("[data-lightbox-counter]");

  // Shuffle gallery on each page load (only relevant on /gallery/)
  const galleryGrid = document.querySelector("[data-gallery]");
  if (galleryGrid) {
    const kids = Array.from(galleryGrid.children);
    for (let i = kids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [kids[i], kids[j]] = [kids[j], kids[i]];
    }
    kids.forEach((k) => galleryGrid.appendChild(k));
  }

  const galleryTiles = Array.from(document.querySelectorAll(".gallery-tile"));
  let galleryIndex = 0;

  const openLightbox = (i) => {
    if (!lightbox || galleryTiles.length === 0) return;
    galleryIndex = ((i % galleryTiles.length) + galleryTiles.length) % galleryTiles.length;
    const tile = galleryTiles[galleryIndex];
    lightboxImage.src = tile.dataset.src;
    lightboxImage.alt = `Inspirational art ${tile.dataset.galleryIndex}`;
    lightboxCounter.textContent = `${tile.dataset.galleryIndex} / ${galleryTiles.length}`;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    track("gallery_view", { piece: tile.dataset.galleryIndex });
  };

  const closeLightbox = () => {
    lightbox?.classList.remove("is-open");
    lightbox?.setAttribute("aria-hidden", "true");
  };

  galleryTiles.forEach((tile, i) => {
    tile.addEventListener("click", () => openLightbox(i));
  });
  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxPrev?.addEventListener("click", () => openLightbox(galleryIndex - 1));
  lightboxNext?.addEventListener("click", () => openLightbox(galleryIndex + 1));
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // ---------- Keyboard: ESC, arrow keys ----------

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (lightbox?.classList.contains("is-open")) closeLightbox();
      else if (drawer?.classList.contains("is-open")) closeDrawer();
      else if (rail?.classList.contains("is-open")) closeRail();
    } else if (lightbox?.classList.contains("is-open")) {
      if (e.key === "ArrowLeft") openLightbox(galleryIndex - 1);
      else if (e.key === "ArrowRight") openLightbox(galleryIndex + 1);
    }
  });

  // ---------- Outbound analytics ----------

  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a[href^='http']");
    if (!a) return;
    const d = a.dataset || {};
    if (d.platform) {
      track("album_platform_click", { album: d.album, platform: d.platform, link_url: a.href });
    } else if (d.merch) {
      track("merch_click", { destination: d.merch, link_url: a.href });
    } else if (d.social) {
      track("social_click", { destination: d.social, link_url: a.href });
    }
  });

  // ---------- Newsletter ----------

  document.querySelector("[data-newsletter-form]")?.addEventListener("submit", () => {
    track("newsletter_submit");
  });
})();
