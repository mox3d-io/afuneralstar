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
      // Google Ads conversion mirror: a play is the site's one conversion
      // (action 7724852142, secondary/observation - never a bid signal)
      if (name === "video_play") {
        window.gtag("event", "conversion", { send_to: "AW-18299802121/UGZDCK7Hv-McEImkg5ZE" });
      }
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

  // ---------- YouTube facade (click-to-load, CUED, inline swap) ----------
  // Privacy-first: youtube-nocookie, no YT JS until intent. 2026-08-15
  // experiment: autoplay-classified embeds NEVER register views (2:30
  // watched, pause/resume tried - nothing), and a play that starts inside
  // YouTube's chrome always does. So facades load a PAUSED player; the
  // visitor's play click is the counted event. video_play now means an
  // actual play (widget message channel), not a poster click - that's
  // video_cue. Delegated so facades inside veil content work too.
  const cuedPlayers = [];
  const armPlayTracking = (iframe, meta) => {
    const hello = () => { try { iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: meta.id }), "*"); } catch (_) {} };
    iframe.addEventListener("load", () => { hello(); setTimeout(hello, 600); setTimeout(hello, 1800); });
    cuedPlayers.push({ iframe, meta, fired: false });
  };
  window.addEventListener("message", (e) => {
    const p = cuedPlayers.find((x) => x.iframe.contentWindow === e.source);
    if (!p || p.fired) return;
    let d; try { d = JSON.parse(e.data); } catch (_) { return; }
    const st = d && d.info && typeof d.info.playerState === "number" ? d.info.playerState
      : d && d.event === "onStateChange" && typeof d.info === "number" ? d.info : null;
    if (st !== 1 && st !== 3) return;
    p.fired = true;
    track("video_play", { video: p.meta.video, album: p.meta.album, platform: "YouTube", id: p.meta.id, method: p.meta.method });
    clarity("set", "video_play", p.meta.slug);
    clarity("upgrade", "video_play");
    if (p.meta.inVeil) pauseHero();
  });
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
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
      iframe.title = title;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.frameBorder = "0";
      hero.replaceChildren(iframe);
      iframe.focus();
      track("video_cue", { video: title, album, platform: "YouTube", id });
      clarity("set", "video_cued", slug);
      armPlayTracking(iframe, { video: title, album, id, slug, inVeil, method: inVeil ? "veil_cued" : "cued_click" });
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
    const pos = slot.classList.contains("banner-top") ? "top" : "body";
    track("banner_view", { banner: id, position: pos });
    clarity("set", "banner_served", id);
    a.addEventListener("click", () => {
      track("banner_click", { banner: id, position: pos });
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
  let heroPick = HERO_VARIANTS[0];
  if (body.dataset.page === "home") {
    const total = HERO_VARIANTS.reduce((s, v) => s + v.w, 0);
    let roll = Math.random() * total;
    const pick = HERO_VARIANTS.find((v) => (roll -= v.w) < 0) || HERO_VARIANTS[0];
    heroPick = pick;
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

  // ---------- horizon gate (home only): two doors ----------
  // Door 1, the singularity: the hole is a LIVE cropped YouTube player; a
  // tap inside it is a real in-player start, which counts (verified live
  // 2026-08-15: registered in Studio realtime within ~3 min).
  // Door 2, "Enter The Horizon": crosses in SILENCE - the port morphs into
  // the hero slot cued, not playing. Unlabeled on purpose (easter egg).
  // Why: same-day experiment proved autoplay-classified embeds NEVER
  // register (2:30 watched, pause/resume tried - nothing), so autoplaying
  // on door 2 would waste the play. A cued hero's later play click counts.
  // Session-scoped: internal nav never re-gates. No JS, no gate.
  const gate = document.querySelector("[data-gate]");
  if (gate) {
    if (sessionStorage.getItem("horizonCrossed") === "1") {
      gate.remove();
    } else {
      body.classList.add("gate-locked");
      clarity("set", "saw_horizon_gate", "yes");
      const hole = gate.querySelector(".gate-hole");
      let port = null, portFrame = null, crossed = false;
      const sizePort = () => {
        if (!port || !hole) return;
        const r = hole.getBoundingClientRect();
        const d = Math.round(r.width * 0.34);
        port.style.width = port.style.height = d + "px";
        port.style.left = Math.round(r.left + r.width / 2 - d / 2) + "px";
        port.style.top = Math.round(r.top + r.height / 2 - d / 2) + "px";
      };
      if (hole && body.dataset.page === "home") {
        port = document.createElement("div");
        port.id = "gate-port";
        portFrame = document.createElement("iframe");
        portFrame.src = `https://www.youtube-nocookie.com/embed/${heroPick.id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
        portFrame.title = heroPick.title;
        portFrame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        portFrame.frameBorder = "0";
        port.appendChild(portFrame);
        // Until the player is genuinely tappable the hole PULSES and taps
        // pass through it to the gate beneath (-> quiet entry, not a dead
        // click). Clarity showed slow-mobile arrivals hammering the unready
        // hole 62 times in one session.
        port.classList.add("is-loading");
        sizePort();
        document.body.appendChild(port);
        sizePort();
        window.addEventListener("resize", sizePort);
        // widget handshake so the embed reports player state back to us
        const hello = () => { try { portFrame.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "gate" }), "*"); } catch (_) {} };
        portFrame.addEventListener("load", () => {
          hello(); setTimeout(hello, 600); setTimeout(hello, 1800);
          setTimeout(() => port.classList.remove("is-loading"), 350);
        });
      }
      const cross = (door) => {
        crossed = true;
        sessionStorage.setItem("horizonCrossed", "1");
        track("horizon_crossed", { door });
        track(door === "singularity" ? "gate_singularity" : door === "drift" ? "gate_drift" : "gate_enter_button", { variant: heroPick.id });
        clarity("set", "crossed_horizon", door);
        clarity("upgrade", "crossed_horizon");
        gate.classList.add("is-crossing");
        setTimeout(() => gate.remove(), 750);
      };
      // Shared: morph the live port from the hole into the hero slot.
      const morphToHero = () => {
        const host = document.querySelector(".video-hero");
        if (!host || !port) { body.classList.remove("gate-locked"); return; }
        portFrame.dataset.heroMain = "1";
        host.classList.add("is-ported");
        window.removeEventListener("resize", sizePort);
        const dock = () => {
          const t = host.getBoundingClientRect();
          port.style.left = Math.round(t.left + window.scrollX) + "px";
          port.style.top = Math.round(t.top + window.scrollY) + "px";
          port.style.width = Math.round(t.width) + "px";
          port.style.height = Math.round(t.height) + "px";
        };
        port.classList.add("is-hero");
        dock();
        setTimeout(() => {
          body.classList.remove("gate-locked"); // scrollbar returns, page shifts
          port.classList.add("is-docked");
          dock(); // so measure AFTER the shift
          window.addEventListener("resize", dock);
        }, 840);
      };
      // Port play signal (play or its buffering). Fires for door 1 (tap in
      // the hole -> cross + morph) AND for a quiet-entry visitor who later
      // taps play on the cued hero (video_play only, method horizon_cued).
      let portPlayed = false;
      window.addEventListener("message", (e) => {
        if (portPlayed || !portFrame || e.source !== portFrame.contentWindow) return;
        let d; try { d = JSON.parse(e.data); } catch (_) { return; }
        const st = d && d.info && typeof d.info.playerState === "number" ? d.info.playerState
          : d && d.event === "onStateChange" && typeof d.info === "number" ? d.info : null;
        if (st !== 1 && st !== 3) return;
        portPlayed = true;
        track("video_play", { video: heroPick.title, album: heroPick.album, platform: "YouTube",
          id: heroPick.id, method: crossed ? "horizon_cued" : "singularity" });
        clarity("set", "video_play", heroPick.id);
        clarity("upgrade", "video_play");
        if (!crossed) { cross("singularity"); morphToHero(); }
      });
      // Door 2: crosses in silence; the port docks CUED. Its play button is
      // the second chance at a counted view.
      gate.querySelectorAll("[data-gate-enter]").forEach((b) => b.addEventListener("click", () => {
        if (crossed) return;
        cross("enter_button");
        morphToHero();
      }));
      // Door 3, the drift: a tap anywhere else on the gate (disk, name,
      // backdrop) is someone asking to come in. Let them in quietly
      // instead of ignoring them - but not before the arrival finishes.
      // Rearmed 2026-08-18: the instant drift was cannibalizing
      // singularity plays (Aug 16: drift 65 vs singularity 43, plays 47
      // lagging 126 crossings). The eager first-tappers are the old
      // rage-click cohort - the best play converters - so an early tap
      // now fast-forwards the choreography onto live doors instead of
      // swallowing them silently. Drift arms once the button has landed.
      let driftArmed = false;
      setTimeout(() => { driftArmed = true; }, 4200);
      let hurried = false;
      gate.addEventListener("click", (e) => {
        if (crossed || e.target.closest("[data-gate-enter]")) return;
        if (!driftArmed) {
          if (!hurried) {
            hurried = true;
            gate.classList.add("is-hurried");
            port?.classList.add("is-hurried");
            track("gate_hurry", { variant: heroPick.id });
          }
          return;
        }
        cross("drift");
        morphToHero();
      });
    }
  }
})();

// ---------- X ads website tag (audience plumbing, 2026-08-17) ----------
// Legacy oct pixel (pid redpj) as a post-load image beacon: feeds X website
// audiences without a blocking script. Swap to uwt.js once the modern
// pixel ID is pulled from ads.x.com Events Manager.
window.addEventListener("load", () => {
  ["https://analytics.twitter.com/i/adsct", "https://t.co/i/adsct"].forEach((base) => {
    const img = new Image(1, 1);
    img.src = base + "?txn_id=redpj&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0";
  });
});
