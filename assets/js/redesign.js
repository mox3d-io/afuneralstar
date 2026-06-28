(() => {
  const body = document.body;

  // ---------- analytics helpers ----------
  // GA4 event
  const track = (name, params = {}) => {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, {
        page_path: window.location.pathname,
        page_type: body.dataset.page || "page",
        transport_type: "beacon",
        ...params,
      });
    }
  };
  // Microsoft Clarity API (custom tags / events / session upgrade)
  const clarity = (...args) => {
    try { if (typeof window.clarity === "function") window.clarity(...args); } catch (_) {}
  };

  // Segment every Clarity + GA session by page type up front.
  clarity("set", "page_type", body.dataset.page || "page");

  // ---------- mobile menu ----------
  const menu = document.querySelector("[data-menu]");
  const menuScrim = document.querySelector("[data-menu-scrim]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menuClose = document.querySelector("[data-menu-close]");

  const openMenu = () => {
    menu?.classList.add("is-open");
    menuScrim?.classList.add("is-open");
    menu?.setAttribute("aria-hidden", "false");
    menuToggle?.setAttribute("aria-expanded", "true");
  };
  const closeMenu = () => {
    menu?.classList.remove("is-open");
    menuScrim?.classList.remove("is-open");
    menu?.setAttribute("aria-hidden", "true");
    menuToggle?.setAttribute("aria-expanded", "false");
  };
  menuToggle?.addEventListener("click", () => (menu?.classList.contains("is-open") ? closeMenu() : openMenu()));
  menuClose?.addEventListener("click", closeMenu);
  menuScrim?.addEventListener("click", closeMenu);
  menu?.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });

  // ---------- lyrics drawer ----------
  const drawer = document.querySelector("[data-drawer]");
  const drawerScrim = document.querySelector("[data-drawer-scrim]");
  const drawerTitle = document.querySelector("[data-drawer-title]");
  const drawerAlbum = document.querySelector("[data-drawer-album]");
  const drawerBody = document.querySelector("[data-drawer-body]");
  const drawerClose = document.querySelector("[data-drawer-close]");
  const lyricCache = new Map();

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
    clarity("set", "lyrics_song", title);

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
    btn.addEventListener("click", () =>
      openDrawer({ slug: btn.dataset.lyrics, album: btn.dataset.lyricsAlbum, title: btn.dataset.lyricsTitle, href: btn.dataset.lyricsHref }),
    );
  });

  // ---------- Spotify player overlay (click album art) ----------
  const playerOverlay = document.querySelector("[data-player]");
  const playerFrame = document.querySelector("[data-player-frame]");
  const playerClose = document.querySelector("[data-player-close]");

  const openPlayer = (embedPath, albumName) => {
    if (!playerOverlay || !playerFrame || !embedPath) return false;
    const iframe = document.createElement("iframe");
    iframe.style.borderRadius = "12px";
    iframe.src = `https://open.spotify.com/embed/${embedPath}?utm_source=generator&theme=0`;
    iframe.width = "100%";
    iframe.height = "470";
    iframe.frameBorder = "0";
    iframe.loading = "lazy";
    iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    iframe.title = albumName ? `${albumName} on Spotify` : "Spotify player";
    playerFrame.replaceChildren(iframe);
    playerOverlay.classList.add("is-open");
    playerOverlay.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
    track("spotify_player_open", { album: albumName, embed: embedPath });
    clarity("set", "spotify_player", "open");
    clarity("upgrade", "spotify_player_open"); // prioritize recording this session
    return true;
  };
  const closePlayer = () => {
    playerOverlay?.classList.remove("is-open");
    playerOverlay?.setAttribute("aria-hidden", "true");
    if (playerFrame) playerFrame.replaceChildren();
    body.style.overflow = "";
  };
  playerClose?.addEventListener("click", closePlayer);
  playerOverlay?.addEventListener("click", (e) => { if (e.target === playerOverlay) closePlayer(); });

  document.querySelectorAll("[data-spotify-embed]").forEach((el) => {
    el.addEventListener("click", (e) => {
      let embed = el.dataset.spotifyEmbed;
      if (!embed) return; // no embed → let the link open Spotify directly
      // Optional random-track start: data-spotify-tracks="id1,id2,..."
      const ids = (el.dataset.spotifyTracks || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length) embed = `track/${ids[Math.floor(Math.random() * ids.length)]}`;
      e.preventDefault();
      track("album_art_click", { album: el.dataset.album });
      openPlayer(embed, el.dataset.album);
    });
  });

  // ---------- keyboard: ESC ----------
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (playerOverlay?.classList.contains("is-open")) closePlayer();
    else if (drawer?.classList.contains("is-open")) closeDrawer();
    else if (menu?.classList.contains("is-open")) closeMenu();
  });

  // ---------- outbound + conversion analytics ----------
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a[href^='http']");
    if (!a) return;
    const d = a.dataset || {};
    if (d.platform) {
      track("album_platform_click", { album: d.album, platform: d.platform, link_url: a.href });
      clarity("set", "outbound_platform", d.platform);
      clarity("upgrade", "platform_click");
    } else if (d.merch) {
      track("merch_click", { destination: d.merch, link_url: a.href });
      clarity("set", "merch_click", d.merch);
      clarity("upgrade", "merch_click");
    } else if (d.social) {
      track("social_click", { destination: d.social, link_url: a.href });
      clarity("set", "social_click", d.social);
    }
  });

  // ---------- YouTube lyric-video facade (click-to-load, inline swap) ----------
  // Privacy-first: youtube-nocookie, no YT JS until intent. Swaps the poster for
  // an autoplaying iframe in place (NOT the Spotify [data-player] overlay, which
  // is hardwired to open.spotify.com/embed and a 470px-tall frame).
  document.querySelectorAll("[data-yt-facade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.yt;
      const hero = btn.closest(".video-hero");
      if (!id || !hero) return;
      const title = btn.dataset.ytTitle || "A Funeral Star official video";
      const album = btn.dataset.album || "";
      const slug = btn.dataset.ytSlug || id;
      const iframe = document.createElement("iframe");
      iframe.className = "video-frame";
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      iframe.title = title;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.frameBorder = "0";
      hero.replaceChildren(iframe);
      iframe.focus();
      // The outbound delegate matches a[href^=http], not a <button>, so this is the
      // source of truth for the play, mirroring openPlayer()'s clarity upgrade.
      track("video_play", { video: title, album, platform: "YouTube", id });
      clarity("set", "video_play", slug);
      clarity("upgrade", "video_play");
    });
  });

  // ---------- internal hero / placeholder link clicks (keep the lyrics signal) ----------
  document.querySelectorAll("[data-hero-link]").forEach((a) => {
    a.addEventListener("click", () => {
      track("hero_link_click", { target: a.dataset.heroLink, link_url: a.getAttribute("href") });
      clarity("set", "hero_link", a.dataset.heroLink);
    });
  });

  // ---------- newsletter ----------
  document.querySelector("[data-newsletter-form]")?.addEventListener("submit", () => {
    track("newsletter_submit");
    clarity("set", "newsletter", "submitted");
    clarity("upgrade", "newsletter_submit");
  });

  // ---------- scroll-depth tracking (GA + Clarity) ----------
  const marks = [25, 50, 75, 90, 100];
  const fired = new Set();
  let ticking = false;
  const measure = () => {
    ticking = false;
    const el = document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 8 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100;
    for (const m of marks) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        track("scroll_depth", { percent: m });
        clarity("set", "scroll_depth", String(m));
      }
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(measure); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  measure();
})();
