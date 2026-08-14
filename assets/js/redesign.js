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
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lyrics]");
    if (!btn) return;
    if (drawer) {
      openDrawer({ slug: btn.dataset.lyrics, album: btn.dataset.lyricsAlbum, title: btn.dataset.lyricsTitle, href: btn.dataset.lyricsHref });
    } else if (typeof openVeil === "function" && btn.dataset.lyricsHref) {
      openVeil(btn.dataset.lyricsHref);
    }
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
  // Delegated so facades inside injected overlay content work too.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-yt-facade]");
    if (btn) {
      const id = btn.dataset.yt;
      const hero = btn.closest(".video-hero");
      if (!id || !hero) return;
      const inVeil = !!btn.closest("[data-veil]");
      const title = btn.dataset.ytTitle || "A Funeral Star official video";
      const album = btn.dataset.album || "";
      const slug = btn.dataset.ytSlug || id;
      const iframe = document.createElement("iframe");
      iframe.className = "video-frame";
      if (!inVeil) iframe.dataset.heroMain = "1";
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
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
      if (inVeil) pauseHero();
    }
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

  // ---------- merch banner rotator ----------
  // Serves one random approved banner per pageview into every
  // [data-banner-slot]; GA4 banner_view / banner_click events carry the
  // banner id so CTR per creative = clicks / views in one report.
  const BANNERS = ["b2-e1","b2-e2","b2-e3","b2-hj2","b2-hj4","b2-m1","b2-m2","b2-m3",
                   "b2-sc1","b2-sc3","b2-sr2","b2-sr3","b2-grokscar2","b2-c1","b2-c2","b2-c3",
                   "b1-hj1","b1-scar1","b1-scar2"];
  const serveBanners = (scope) => (scope || document).querySelectorAll("[data-banner-slot]").forEach((slot) => {
    const id = BANNERS[Math.floor(Math.random() * BANNERS.length)];
    const a = document.createElement("a");
    a.className = "merch-banner";
    a.href = "https://direct.distrokid.com/afuneralstar/home";
    a.target = "_blank";
    a.rel = "noopener";
    a.dataset.banner = id;
    a.setAttribute("aria-label", "A Funeral Star merch, opens the store");
    const img = document.createElement("img");
    img.src = `/assets/img/banners/${id}.webp`;
    img.alt = "A Funeral Star merch";
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 1280;
    img.height = 854;
    a.appendChild(img);
    slot.replaceChildren(a);
    track("banner_view", { banner: id });
    clarity("set", "banner_served", id);
    a.addEventListener("click", () => {
      track("banner_click", { banner: id });
      clarity("set", "banner_clicked", id);
      clarity("upgrade", "banner_clicked");
    });
  });
  serveBanners(document);

  // ---------- external links open in new tabs (the album keeps playing) ----------
  const externalize = (scope) => {
    (scope || document).querySelectorAll('a[href^="http"]').forEach((a) => {
      try {
        const u = new URL(a.href);
        if (u.hostname !== location.hostname) { a.target = "_blank"; a.rel = "noopener"; }
      } catch (_) {}
    });
  };
  externalize(document);

  // ---------- hero variant lottery (home only) ----------
  // Full album 65%; the proven catalog splits the rest. Every serve is
  // tagged so hero_variant x video_play = per-video splash conversion.
  const HERO_VARIANTS = [
    { id: "6wByRBbj3KI", w: 65, title: "A Scar In The Star · Full Album", cap: "Full Album · 53 Minutes", album: "A Scar In The Star", line: "Eleven songs, and one that was never released. It only lives here." },
    { id: "Y3Q0Bz4fjzM", w: 5, title: "I Become (Lyric Video)", cap: "Now Playing · Lyric Video", album: "Now We Ignite", line: "I Become. Transformation under pressure." },
    { id: "NQvLYPjYHfo", w: 5, title: "The House That Breathes Back (Lyric Video)", cap: "Now Playing · Lyric Video", album: "A Scar In The Star", line: "No one alone, but no one at home." },
    { id: "X8lGWaxxqzI", w: 5, title: "The Hidden Hand (Lyric Video)", cap: "Now Playing · Lyric Video", album: "Monuments", line: "The invisible hand made flesh." },
    { id: "oTKtafXc-Mk", w: 5, title: "Clock Don't Stop (Lyric Video)", cap: "Now Playing · Lyric Video", album: "Monuments", line: "Is time theft eating at you?" },
    { id: "PhYMzXG9sVU", w: 5, title: "Vals del Diablo (Official Audio)", cap: "Now Playing · Official Audio", album: "The Land of Silver and Sorrow", line: "The devil's waltz, from the land of silver and sorrow." },
    { id: "CNzLqINOzTM", w: 5, title: "The Signal Thins (Lyric Video)", cap: "Now Playing · Lyric Video", album: "Now We Ignite", line: "The signal thins. The song remains." },
    { id: "ZXzDGFwwdsI", w: 5, title: "A Dying Star (Lyric Video)", cap: "Now Playing · Lyric Video", album: "Now We Ignite", line: "Every ending burns on the way down." },
  ];
  if (body.dataset.page === "home") {
    const total = HERO_VARIANTS.reduce((s, v) => s + v.w, 0);
    let roll = Math.random() * total;
    const pick = HERO_VARIANTS.find((v) => (roll -= v.w) < 0) || HERO_VARIANTS[0];
    track("hero_variant", { variant: pick.id, video: pick.title });
    clarity("set", "hero_variant", pick.title);
    if (pick.id !== HERO_VARIANTS[0].id) {
      const facade = document.querySelector("[data-yt-facade]");
      if (facade) {
        facade.dataset.yt = pick.id;
        facade.dataset.ytTitle = pick.title;
        facade.dataset.ytSlug = pick.id;
        facade.dataset.album = pick.album;
        facade.setAttribute("aria-label", `Play ${pick.title}`);
        const poster = facade.querySelector(".video-poster");
        if (poster) {
          poster.onerror = () => { poster.onerror = null; poster.src = `https://i.ytimg.com/vi/${pick.id}/hqdefault.jpg`; };
          poster.src = `https://i.ytimg.com/vi/${pick.id}/maxresdefault.jpg`;
          poster.alt = pick.title;
        }
        const cap = facade.querySelector(".video-cap");
        if (cap) cap.innerHTML = '<span class="video-cap-dot" aria-hidden="true"></span>' + pick.cap;
        const line = document.querySelector(".video-title");
        if (line) line.textContent = pick.line;
      }
    }
  }

  // ---------- persistent-splash veil (home only) ----------
  // Internal navigation opens page content in a panel ABOVE the playing
  // hero video; the music never stops. Direct subpage visits are normal
  // pages. History stays shareable via pushState.
  let pausedByVeil = false;
  const heroCmd = (func) => {
    const f = document.querySelector("iframe[data-hero-main]");
    try { f?.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: "" }), "*"); } catch (_) {}
  };
  const pauseHero = () => { heroCmd("pauseVideo"); pausedByVeil = true; };
  window.pauseHero = pauseHero;
  let veil = null, veilBody = null, veilTitle = null;
  const buildVeil = () => {
    veil = document.createElement("div");
    veil.className = "page-veil";
    veil.setAttribute("data-veil", "");
    veil.innerHTML = `
      <div class="veil-shell" role="dialog" aria-modal="false" aria-label="Page">
        <div class="veil-top">
          <p class="veil-title" data-veil-title></p>
          <button class="veil-close" type="button" data-veil-close aria-label="Close and return to the void"><svg aria-hidden="true"><use href="#i-close"/></svg></button>
        </div>
        <div class="veil-body" data-veil-body></div>
      </div>`;
    document.body.appendChild(veil);
    veilBody = veil.querySelector("[data-veil-body]");
    veilTitle = veil.querySelector("[data-veil-title]");
    veil.addEventListener("click", (e) => { if (e.target === veil || e.target.closest("[data-veil-close]")) closeVeil(true); });
  };
  const closeVeil = (push) => {
    if (!veil) return;
    veil.classList.remove("is-open");
    document.body.classList.remove("veil-locked");
    veilBody.replaceChildren();
    if (pausedByVeil) { heroCmd("playVideo"); pausedByVeil = false; }
    if (push) history.pushState({}, "", "/");
  };
  const openVeil = async (href, replace) => {
    if (body.dataset.page !== "home") return false;
    if (!veil) buildVeil();
    veil.classList.add("is-open");
    document.body.classList.add("veil-locked");
    veilBody.innerHTML = '<p class="veil-loading">Loading...</p>';
    track("overlay_nav", { href });
    clarity("set", "overlay_page", href);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error("fetch failed");
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      const main = doc.querySelector("main.stage");
      if (!main) throw new Error("no stage");
      veilTitle.textContent = (doc.querySelector("title")?.textContent || "").split("|")[0].trim();
      veilBody.replaceChildren(...main.children);
      veilBody.scrollTop = 0;
      serveBanners(veilBody);
      externalize(veilBody);
      if (!replace) history.pushState({ veil: href }, "", href);
    } catch (_) {
      window.location.href = href;
    }
    return true;
  };
  if (body.dataset.page === "home") {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (a.target === "_blank" || a.closest(".horizon-gate")) return;
      if (href === "/" || href.startsWith("/#")) { e.preventDefault(); closeVeil(true); return; }
      e.preventDefault();
      openVeil(href);
    });
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.veil) openVeil(e.state.veil, true);
      else closeVeil(false);
    });
  }

  // ---------- horizon gate (home only) ----------
  // One gesture does everything: dismisses the gate and chains a click into
  // the hero facade, whose autoplay=1 iframe inherits the user activation,
  // so the album starts WITH sound. Session-scoped: internal nav never
  // re-gates. If JS is off, a noscript style hides the gate entirely.
  const gate = document.querySelector("[data-gate]");
  if (gate) {
    if (sessionStorage.getItem("horizonCrossed") === "1") {
      gate.remove();
    } else {
      body.classList.add("gate-locked");
      clarity("set", "saw_horizon_gate", "yes");
      const cross = () => {
        sessionStorage.setItem("horizonCrossed", "1");
        track("horizon_crossed", {});
        clarity("set", "crossed_horizon", "yes");
        clarity("upgrade", "crossed_horizon");
        gate.classList.add("is-crossing");
        body.classList.remove("gate-locked");
        document.querySelector("[data-yt-facade]")?.click();
        setTimeout(() => gate.remove(), 750);
      };
      gate.querySelectorAll("[data-gate-enter]").forEach((b) => b.addEventListener("click", cross));
    }
  }
})();
