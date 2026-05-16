// Site builder for A Funeral Star.
//
// Generates every static page from a single registry so per-page SEO
// (title, description, canonical, og:image, JSON-LD, H1) stays correct
// and the shared rail / drawer / bottom-bar markup stays DRY.

import { mkdir, readFile, readdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const siteUrl = "https://afuneralstar.com";

// ============ Album / release data ============

const albums = [
  {
    slug: "consumed-by-a-funeral-star",
    urlSlug: "consumed",
    title: "Consumed by a Funeral Star",
    collapse: "Cosmic Collapse",
    type: "Album",
    sourceDir: "content/lyrics/consumed-by-a-funeral-star",
    cover: "consumed-cover.webp",
    blurb: "Cosmic black metal and death metal built around singularities, entropy, and gravitational tombs.",
    spotify: "https://open.spotify.com/album/6fuZyp5dx6VddapdwGRKTx",
    apple: "https://music.apple.com/us/album/consumed-by-a-funeral-star/6766791921",
    ytMusic: "https://music.youtube.com/playlist?list=OLAK5uy_n4lLf8FxiEt2bu4poMSmHTJYdl3-_wVpQ",
    youtube: "https://www.youtube.com/playlist?list=PLn4ObNGhe_haIVMCw_8TE-TLDjwXInTI3",
  },
  {
    slug: "homeless-and-hopeless",
    urlSlug: "homeless",
    title: "Homeless and Hopeless",
    collapse: "Societal Collapse",
    type: "Album",
    sourceDir: "content/lyrics/homeless-and-hopeless",
    cover: "homeless-cover.webp",
    blurb: "Death metal, hardcore punk, crust, and d-beat pressure from the human scale.",
    spotify: "https://open.spotify.com/album/1p9YdRV5ECDo2aTwbOWEDZ",
    apple: null,
    ytMusic: "https://music.youtube.com/playlist?list=OLAK5uy_kwNGjT-rIlKIMQ5VfyJMNuPKxF98MB1zY",
    youtube: "https://www.youtube.com/playlist?list=PLn4ObNGhe_hYybuG6mL0RDvjKLlQ624JJ",
  },
  {
    slug: "the-land-of-silver-and-sorrow",
    urlSlug: "silver-and-sorrow",
    title: "The Land of Silver and Sorrow",
    collapse: "Romantic Collapse",
    type: "Album",
    sourceDir: "content/lyrics/the-land-of-silver-and-sorrow",
    cover: "silver-cover.webp",
    blurb: "Romantic subjects trapped inside the violence of their border narco town, where love and survival pull against the same gravity.",
    spotify: "https://open.spotify.com/album/0ZBk9PCZo596PlkhXHi5y8",
    apple: "https://music.apple.com/us/album/the-land-of-silver-and-sorrow/1895990194",
    ytMusic: "https://music.youtube.com/playlist?list=OLAK5uy_n-WUAFpTLmRAcg6mhB0Hr-VXFlnd7x3pI",
    youtube: "https://www.youtube.com/playlist?list=PLn4ObNGhe_ha6o0Y-gVfGQ8TedDfJI5kW",
  },
  {
    slug: "entropy-cuts",
    urlSlug: "entropy-cuts",
    title: "Consumed by a Funeral Star — Entropy Cuts",
    collapse: "Consumed Variants",
    type: "Album",
    sourceDir: "content/lyrics/entropy-cuts",
    cover: "entropycuts.webp",
    blurb: "A companion record to Consumed by a Funeral Star — alternate takes, longer arrangements, and stripped versions that pull the same gravity from a different angle.",
    spotify: null,
    apple: null,
    ytMusic: null,
    youtube: null,
  },
];

const otherReleases = [
  {
    slug: "hell-joseon",
    urlSlug: "hell-joseon",
    title: "Hell Joseon",
    collapse: "Civic Collapse",
    type: "EP",
    cover: "HellJoseon.webp",
    blurb: "On feeling trapped by the architecture of the society itself — careers already scored, credentials already counted, queues you were standing in before you were born. Same gravity as Homeless and Hopeless, pulled from a different angle.",
    tracks: ["Hell Joseon", "Hell Joseon (B-Side)"],
    spotify: null,
    apple: null,
    youtube: null,
  },
  {
    slug: "plomo-y-polvo-reyna",
    urlSlug: "reyna",
    title: "Plomo y Polvo: Reyna",
    collapse: "Día de Muertos Cut",
    type: "Single",
    cover: "ReynaCut.webp",
    blurb: "A reinterpretation of Plomo y Polvo through a queen of the dead — sugar-skull, roses, and the calm of a soul already at the threshold.",
    spotify: null,
    apple: null,
    youtube: null,
  },
];

// ============ Helpers ============

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const unescapeHtml = (value) =>
  value
    .replaceAll("&#039;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&gt;", ">")
    .replaceAll("&lt;", "<")
    .replaceAll("&amp;", "&");

const slugify = (title) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/['"’]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

const normalTitle = (title) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/['"’]/g, "")
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();

const parseLyricFile = (filename) => {
  const match = filename.match(/^(\d+)\s+-\s+(.+)\.txt$/);
  if (!match) return null;
  return { number: Number(match[1]), title: match[2] };
};

// ============ Shared snippets ============

const fontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Spectral:ital,wght@0,400;0,500;1,400;1,500&family=IBM+Plex+Mono:wght@400;500&display=swap">`;

const trackingScripts = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-888BCT159V"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag("js", new Date());
      gtag("config", "G-888BCT159V");
    </script>
    <script type="text/javascript">
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "wokypjnuyi");
    </script>`;

const svgSprite = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
      <defs>
        <symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5l11 7-11 7V5z" fill="currentColor"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" stroke-width="1.6" fill="none"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.6" fill="none"/></symbol>
        <symbol id="logo-spotify" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="currentColor"/></symbol>
        <symbol id="logo-apple" viewBox="0 0 24 24"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 011.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516a.904.904 0 00.02-.193c0-1.815 0-3.63-.002-5.443a.725.725 0 00-.026-.185c-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.442-.088.663-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z" fill="currentColor"/></symbol>
        <symbol id="logo-ytmusic" viewBox="0 0 24 24"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z" fill="currentColor"/></symbol>
        <symbol id="logo-youtube" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="currentColor"/></symbol>
        <symbol id="logo-bandcamp" viewBox="0 0 24 24"><path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" fill="currentColor"/></symbol>
        <symbol id="logo-tiktok" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="currentColor"/></symbol>
        <symbol id="logo-x" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" fill="currentColor"/></symbol>
        <symbol id="logo-kofi" viewBox="0 0 24 24"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" fill="currentColor"/></symbol>
      </defs>
    </svg>`;

const noscriptFallback = `<noscript>
      <section style="padding:2rem 1.5rem;background:#14161c;color:#e8ebf1;text-align:center;font-family:Georgia,serif;border-bottom:1px solid rgba(228,232,242,0.16)">
        <h2 style="font-size:1.4rem;margin:0 0 0.6rem;letter-spacing:0.04em">A Funeral Star</h2>
        <p style="margin:0 0 1rem;color:#c5c9d3;font-style:italic">Experimental death · black · folk metal from Washington, D.C.</p>
        <p style="margin:0 0 1rem"><a href="https://open.spotify.com/artist/3u1NrsCtmIR1u3UBBccghz" style="color:#1ED760;margin:0 0.6rem">Spotify</a> · <a href="https://music.apple.com/us/album/the-land-of-silver-and-sorrow/1895990194" style="color:#FA243C;margin:0 0.6rem">Apple Music</a> · <a href="https://www.youtube.com/channel/UCHr58sw3YcdmXJvoggp1oew" style="color:#FF0033;margin:0 0.6rem">YouTube</a> · <a href="https://afuneralstar.bandcamp.com" style="color:#629AA9;margin:0 0.6rem">Bandcamp</a></p>
        <p style="margin:0"><a href="/lyrics/" style="color:#c4cdd9;margin:0 0.6rem">Lyrics</a> · <a href="https://direct.distrokid.com/afuneralstar/home" style="color:#c4cdd9;margin:0 0.6rem">Merch store</a> · <a href="mailto:contact@afuneralstar.com" style="color:#c4cdd9;margin:0 0.6rem">contact@afuneralstar.com</a></p>
      </section>
    </noscript>`;

const railToggleBtn = `<button class="rail-toggle" type="button" data-rail-toggle aria-expanded="false" aria-controls="rail" aria-label="Open navigation">
      <svg aria-hidden="true"><use href="#i-menu"/></svg>
    </button>`;

// ============ Rail (navigation) ============

const railLink = (href, title, sub, active, activeId, currentActive) => {
  const isActive = activeId === currentActive ? " is-active" : "";
  return `          <a class="rail-link${isActive}" href="${href}">
            <span class="rail-title">${title}</span>
            <span class="rail-sub">${sub}</span>
          </a>`;
};

const railLinkFlat = (href, title, activeId, currentActive) => {
  const isActive = activeId === currentActive ? " is-active" : "";
  return `          <a class="rail-link rail-link-flat${isActive}" href="${href}"><span class="rail-title">${title}</span></a>`;
};

const buildRail = (active = "") => `<aside class="rail" id="rail" data-rail aria-label="Primary navigation">
      <div>
        <a class="rail-home" href="/" aria-label="A Funeral Star — home">
          <img class="rail-home-logo" src="/assets/img/logo-main.webp" alt="A Funeral Star" width="800" height="533">
        </a>

        <nav class="rail-social rail-social-top" aria-label="Follow and listen">
          <a href="https://open.spotify.com/artist/3u1NrsCtmIR1u3UBBccghz" target="_blank" rel="noopener" data-social="spotify" aria-label="Spotify"><svg><use href="#logo-spotify"/></svg></a>
          <a href="https://music.apple.com/us/album/the-land-of-silver-and-sorrow/1895990194" target="_blank" rel="noopener" data-social="apple" aria-label="Apple Music"><svg><use href="#logo-apple"/></svg></a>
          <a href="https://www.youtube.com/channel/UCHr58sw3YcdmXJvoggp1oew" target="_blank" rel="noopener" data-social="youtube" aria-label="YouTube"><svg><use href="#logo-youtube"/></svg></a>
          <a href="https://www.tiktok.com/@afuneralstar" target="_blank" rel="noopener" data-social="tiktok" aria-label="TikTok"><svg><use href="#logo-tiktok"/></svg></a>
          <a href="https://x.com/afuneralstar" target="_blank" rel="noopener" data-social="x" aria-label="X"><svg><use href="#logo-x"/></svg></a>
          <a href="https://afuneralstar.bandcamp.com" target="_blank" rel="noopener" data-social="bandcamp" aria-label="Bandcamp"><svg><use href="#logo-bandcamp"/></svg></a>
          <a href="https://ko-fi.com/afuneralstar" target="_blank" rel="noopener" data-social="kofi" aria-label="Ko-fi"><svg><use href="#logo-kofi"/></svg></a>
        </nav>

        <section class="rail-section" aria-label="Discography">
          <p class="rail-label">Discography</p>
${railLink("/releases/consumed/", "Consumed by a Funeral Star", "Album · Cosmic Collapse", "release-consumed", active)}
${railLink("/releases/homeless/", "Homeless and Hopeless", "Album · Societal Collapse", "release-homeless", active)}
${railLink("/releases/silver-and-sorrow/", "The Land of Silver and Sorrow", "Album · Romantic Collapse", "release-silver", active)}
${railLink("/releases/hell-joseon/", "Hell Joseon", "EP · Civic Collapse", "release-hell-joseon", active)}
${railLink("/releases/entropy-cuts/", "Entropy Cuts", "Album · Consumed Variants", "release-entropy", active)}
${railLink("/releases/reyna/", "Plomo y Polvo: Reyna", "Single · Día de Muertos Cut", "release-reyna", active)}
        </section>

        <section class="rail-section" aria-label="Browse">
          <p class="rail-label">Browse</p>
          <a class="rail-merch${active === "merch" ? " is-active" : ""}" href="/merch/">Merch Store</a>
${railLinkFlat("/videos/", "Videos &amp; Shorts", "videos", active)}
${railLinkFlat("/lyrics/", "Lyrics", "lyrics", active)}
${railLinkFlat("/gallery/", "Gallery", "gallery", active)}
${railLinkFlat("/mailing-list/", "Mailing List", "mailing-list", active)}
${railLinkFlat("/about/", "About", "about", active)}
        </section>
      </div>

      <div class="rail-foot">
        <p class="rail-contact">
          <a href="mailto:contact@afuneralstar.com">contact@afuneralstar.com</a>
        </p>
      </div>
    </aside>`;

// ============ Drawer / lightbox / bottom bar ============

const drawerHtml = `<div class="drawer-scrim" data-drawer-scrim aria-hidden="true"></div>
    <aside class="drawer" data-drawer role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="drawerTitle">
      <header class="drawer-head">
        <p class="drawer-eyebrow">Lyrics</p>
        <h2 class="drawer-title" id="drawerTitle" data-drawer-title>—</h2>
        <p class="drawer-album" data-drawer-album>—</p>
        <button class="drawer-close" type="button" data-drawer-close aria-label="Close lyrics">
          <svg aria-hidden="true"><use href="#i-close"/></svg>
        </button>
      </header>
      <div class="drawer-body" data-drawer-body>Loading…</div>
    </aside>`;

const lightboxHtml = `<div class="lightbox" data-lightbox role="dialog" aria-modal="true" aria-hidden="true" aria-label="Art viewer">
      <img class="lightbox-image" data-lightbox-image alt="">
      <button class="lightbox-close" type="button" data-lightbox-close aria-label="Close">×</button>
      <button class="lightbox-prev" type="button" data-lightbox-prev aria-label="Previous">‹</button>
      <button class="lightbox-next" type="button" data-lightbox-next aria-label="Next">›</button>
      <p class="lightbox-counter" data-lightbox-counter>—</p>
    </div>`;

const bottomBarHtml = `<nav class="bottom-bar" aria-label="Quick actions">
      <a class="bottom-bar-merch" href="/merch/">Merch</a>
      <a href="/mailing-list/">Mailing</a>
    </nav>`;

// ============ Page shell ============

const pageShell = ({
  title,
  description,
  ogImage,
  canonical,
  jsonLd,
  railActive,
  bodyContent,
  extraHead = "",
}) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@afuneralstar">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="theme-color" content="#07070a">${jsonLd ? `
    <script type="application/ld+json">
${jsonLd}
    </script>` : ""}
    ${fontsLink}
    <link rel="stylesheet" href="/assets/css/redesign.css">
    <script src="/assets/js/redesign.js" defer></script>${extraHead}
    ${trackingScripts}
  </head>
  <body data-page="${railActive}">
    <a class="skip-link" href="#stage">Skip to content</a>

    ${noscriptFallback}

    ${svgSprite}

    ${railToggleBtn}

    ${buildRail(railActive)}

    <main class="stage" id="stage">
${bodyContent}
    </main>

    ${drawerHtml}
    ${lightboxHtml}
    ${bottomBarHtml}
  </body>
</html>
`;

// ============ Page content builders ============

const platformsHtml = (album) => {
  const items = [];
  if (album.spotify) {
    items.push(`                <a class="platform platform-primary" href="${album.spotify}" target="_blank" rel="noopener" data-album="${escapeHtml(album.title)}" data-platform="Spotify" aria-label="Listen on Spotify"><svg><use href="#logo-spotify"/></svg></a>`);
  } else {
    items.push(`                <a class="platform platform-primary" href="https://open.spotify.com/artist/3u1NrsCtmIR1u3UBBccghz" target="_blank" rel="noopener" data-album="${escapeHtml(album.title)}" data-platform="Spotify" aria-label="Listen on Spotify"><svg><use href="#logo-spotify"/></svg></a>`);
  }
  if (album.apple) {
    items.push(`                <a class="platform" href="${album.apple}" target="_blank" rel="noopener" data-album="${escapeHtml(album.title)}" data-platform="Apple Music" aria-label="Listen on Apple Music"><svg><use href="#logo-apple"/></svg></a>`);
  } else if (album.apple === null && album.slug === "homeless-and-hopeless") {
    items.push(`                <span class="platform platform-disabled" aria-disabled="true" aria-label="Apple Music coming soon"><svg><use href="#logo-apple"/></svg></span>`);
  } else {
    items.push(`                <a class="platform" href="https://music.apple.com/us/artist/a-funeral-star" target="_blank" rel="noopener" data-album="${escapeHtml(album.title)}" data-platform="Apple Music" aria-label="Listen on Apple Music"><svg><use href="#logo-apple"/></svg></a>`);
  }
  if (album.ytMusic) {
    items.push(`                <a class="platform" href="${album.ytMusic}" target="_blank" rel="noopener" data-album="${escapeHtml(album.title)}" data-platform="YouTube Music" aria-label="Listen on YouTube Music"><svg><use href="#logo-ytmusic"/></svg></a>`);
  }
  if (album.youtube) {
    items.push(`                <a class="platform" href="${album.youtube}" target="_blank" rel="noopener" data-album="${escapeHtml(album.title)}" data-platform="YouTube" aria-label="Watch on YouTube"><svg><use href="#logo-youtube"/></svg></a>`);
  } else if (!album.ytMusic) {
    items.push(`                <a class="platform" href="https://www.youtube.com/channel/UCHr58sw3YcdmXJvoggp1oew" target="_blank" rel="noopener" data-album="${escapeHtml(album.title)}" data-platform="YouTube" aria-label="Watch on YouTube"><svg><use href="#logo-youtube"/></svg></a>`);
  }
  return items.join("\n");
};

const continueFooter = (label, links) =>
  `        <div class="view-continue">
          <p class="view-continue-label">${label}</p>
          <div class="view-continue-list">
${links.map((l) => `            <a href="${l.href}">${escapeHtml(l.text)} →</a>`).join("\n")}
          </div>
        </div>`;

const albumTrackRow = (track, album) =>
  `            <li class="track"><span class="track-num">${String(track.number).padStart(2, "0")}</span><span class="track-title">${escapeHtml(track.title)}</span><span class="track-actions"><button class="track-btn is-lyrics" type="button" data-lyrics="${slugify(track.title)}" data-lyrics-album="${escapeHtml(album.title)}" data-lyrics-title="${escapeHtml(track.title)}" data-lyrics-href="/lyrics/${album.slug}/${slugify(track.title)}.html" aria-label="View lyrics">Lyrics</button></span></li>`;

const albumPage = (album, tracks) => {
  const description = `${album.title} by A Funeral Star. ${album.blurb}`;
  const canonical = `${siteUrl}/releases/${album.urlSlug}/`;
  // og:image uses the same WebP that visitors get — modern social
  // platforms (Twitter/X, Facebook, iMessage, Slack, Discord, LinkedIn)
  // all support WebP in share cards.
  const ogImage = `${siteUrl}/assets/img/${album.cover}`;

  const jsonLd = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "MusicAlbum",
      name: album.title,
      url: canonical,
      image: `${siteUrl}/assets/img/${album.cover}`,
      description: album.blurb,
      genre: ["Death Metal", "Black Metal", "Folk Metal"],
      byArtist: { "@type": "MusicGroup", name: "A Funeral Star", url: siteUrl },
      numTracks: tracks.length,
      track: tracks.map((t) => ({
        "@type": "MusicRecording",
        name: t.title,
        url: `${siteUrl}/lyrics/${album.slug}/${slugify(t.title)}.html`,
        position: t.number,
      })),
    },
    null,
    2,
  );

  const trackRowsHtml = tracks.map((t) => albumTrackRow(t, album)).join("\n");

  const relatedLinks = [
    { href: "/", text: "Home" },
    { href: "/lyrics/", text: "All lyrics" },
    { href: "/mailing-list/", text: "Mailing list" },
  ];

  const bodyContent = `      <section class="view is-active" aria-label="${escapeHtml(album.title)}">
        <div class="album">
          <div class="album-cover">
            <img class="album-art" loading="lazy" src="/assets/img/${album.cover}" alt="${escapeHtml(album.title)} album art" width="1200" height="1200">
            <div class="album-meta">
              <p class="album-eyebrow">${escapeHtml(album.collapse)} · ${album.type}</p>
              <h1 class="album-title">${escapeHtml(album.title)}</h1>
              <p class="album-blurb">${escapeHtml(album.blurb)}</p>
              <div class="album-divider"></div>
              <div class="platforms">
${platformsHtml(album)}
              </div>
            </div>
          </div>

          <ol class="tracks">
${trackRowsHtml}
          </ol>
        </div>

${continueFooter("Continue", relatedLinks)}
      </section>`;

  return pageShell({
    title: `${album.title} | A Funeral Star`,
    description,
    ogImage,
    canonical,
    jsonLd,
    railActive: `release-${album.urlSlug === "consumed" ? "consumed" : album.urlSlug === "homeless" ? "homeless" : album.urlSlug === "silver-and-sorrow" ? "silver" : album.urlSlug === "entropy-cuts" ? "entropy" : album.urlSlug}`,
    bodyContent,
  });
};

const releasePage = (release) => {
  const description = `${release.title} by A Funeral Star. ${release.blurb}`;
  const canonical = `${siteUrl}/releases/${release.urlSlug}/`;
  const ogImage = `${siteUrl}/assets/img/${release.cover}`;

  const tracksHtml = release.tracks
    ? `          <ol class="tracks">
${release.tracks.map((t, i) => `            <li class="track no-lyrics"><span class="track-num">${String(i + 1).padStart(2, "0")}</span><span class="track-title">${escapeHtml(t)}</span><span class="track-actions"></span></li>`).join("\n")}
          </ol>`
    : "";

  const jsonLd = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": release.type === "EP" ? "MusicAlbum" : release.type === "Single" ? "MusicRecording" : "MusicAlbum",
      name: release.title,
      url: canonical,
      image: `${siteUrl}/assets/img/${release.cover}`,
      description: release.blurb,
      genre: ["Death Metal", "Black Metal", "Folk Metal"],
      byArtist: { "@type": "MusicGroup", name: "A Funeral Star", url: siteUrl },
      ...(release.tracks ? { numTracks: release.tracks.length } : {}),
    },
    null,
    2,
  );

  const platformsFake = {
    title: release.title,
    slug: release.slug,
    spotify: release.spotify,
    apple: release.apple,
    youtube: release.youtube,
    ytMusic: null,
  };

  const relatedLinks = [
    { href: "/", text: "Home" },
    { href: "/lyrics/", text: "All lyrics" },
    { href: "/mailing-list/", text: "Mailing list" },
  ];

  const bodyContent = `      <section class="view is-active" aria-label="${escapeHtml(release.title)}">
        <div class="album">
          <div class="album-cover">
            <img class="album-art" loading="lazy" src="/assets/img/${release.cover}" alt="${escapeHtml(release.title)} cover" width="1200" height="1200">
            <div class="album-meta">
              <p class="album-eyebrow">${escapeHtml(release.collapse)} · ${release.type}</p>
              <h1 class="album-title">${escapeHtml(release.title)}</h1>
              <p class="album-blurb">${escapeHtml(release.blurb)}</p>
              <div class="album-divider"></div>
              <div class="platforms">
${platformsHtml(platformsFake)}
              </div>
            </div>
          </div>${tracksHtml ? "\n\n" + tracksHtml : ""}
        </div>

${continueFooter("Continue", relatedLinks)}
      </section>`;

  return pageShell({
    title: `${release.title} | A Funeral Star`,
    description,
    ogImage,
    canonical,
    jsonLd,
    railActive: `release-${release.urlSlug}`,
    bodyContent,
  });
};

const homePage = () => {
  const description = "A Funeral Star. Songs about people trapped by the gravity of their situations. Death metal, black metal, folk metal — albums, videos, lyrics, merch.";
  const canonical = `${siteUrl}/`;
  const ogImage = `${siteUrl}/assets/img/sitebanner.webp`;

  const jsonLd = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      name: "A Funeral Star",
      url: siteUrl,
      logo: `${siteUrl}/assets/img/logo-main.webp`,
      image: `${siteUrl}/assets/img/sitebanner.webp`,
      description: "Songs about people trapped by the gravity of their situations.",
      genre: ["Death Metal", "Black Metal", "Folk Metal"],
      email: "contact@afuneralstar.com",
      sameAs: [
        "https://open.spotify.com/artist/3u1NrsCtmIR1u3UBBccghz",
        "https://www.youtube.com/channel/UCHr58sw3YcdmXJvoggp1oew",
        "https://music.apple.com/us/album/the-land-of-silver-and-sorrow/1895990194",
        "https://afuneralstar.bandcamp.com",
        "https://www.tiktok.com/@afuneralstar",
        "https://x.com/afuneralstar",
        "https://ko-fi.com/afuneralstar",
      ],
      album: [
        { "@type": "MusicAlbum", name: "Consumed by a Funeral Star", url: `${siteUrl}/releases/consumed/` },
        { "@type": "MusicAlbum", name: "Homeless and Hopeless", url: `${siteUrl}/releases/homeless/` },
        { "@type": "MusicAlbum", name: "The Land of Silver and Sorrow", url: `${siteUrl}/releases/silver-and-sorrow/` },
        { "@type": "MusicAlbum", name: "Consumed by a Funeral Star — Entropy Cuts", url: `${siteUrl}/releases/entropy-cuts/` },
        { "@type": "MusicAlbum", name: "Hell Joseon", url: `${siteUrl}/releases/hell-joseon/` },
        { "@type": "MusicRecording", name: "Plomo y Polvo: Reyna", url: `${siteUrl}/releases/reyna/` },
      ],
    },
    null,
    2,
  );

  const bodyContent = `      <section class="view is-active home" aria-label="Home">
        <header class="home-hero">
          <figure class="home-hero-banner">
            <img src="/assets/img/sitebanner.webp" alt="A Funeral Star — new music and merch" width="2172" height="724" fetchpriority="high">
            <a class="banner-hotspot banner-hotspot--shirts" href="https://direct.distrokid.com/afuneralstar/home" target="_blank" rel="noopener" data-merch="distrokid-shirts" aria-label="Shop shirts"></a>
            <a class="banner-hotspot banner-hotspot--mug" href="https://direct.distrokid.com/afuneralstar/home" target="_blank" rel="noopener" data-merch="distrokid-mug" aria-label="Shop mug"></a>
            <a class="banner-hotspot banner-hotspot--tote" href="https://direct.distrokid.com/afuneralstar/home" target="_blank" rel="noopener" data-merch="distrokid-tote" aria-label="Shop tote"></a>
          </figure>
          <div class="home-hero-tagline">
            <h1 class="home-hero-tagline-text">A Funeral Star — songs about people trapped <em>by the gravity</em> of their situations.</h1>
            <p class="home-hero-tagline-meta">Experimental death · black · folk metal from Washington, D.C.</p>
          </div>
        </header>

        <section class="home-block">
          <div class="home-block-head">
            <p class="home-block-eyebrow">Featured Tracks</p>
            <h2 class="home-block-title">Start <em>here</em></h2>
          </div>
          <div class="featured-tracks">
            <a class="featured-track" href="https://open.spotify.com/track/4QLBXHvfms8OJZH0LiFZhc" target="_blank" rel="noopener" data-platform="Spotify" data-album="Consumed by a Funeral Star">
              <span class="featured-track-play" aria-hidden="true"><svg><use href="#i-play"/></svg></span>
              <span class="featured-track-text">
                <span class="featured-track-title">Consumed by a Funeral Star</span>
                <span class="featured-track-album">Cosmic Collapse</span>
              </span>
              <span class="featured-track-meta">Spotify</span>
            </a>
            <a class="featured-track" href="https://open.spotify.com/track/2jKvE8n3AlXqzjuQayx4WJ" target="_blank" rel="noopener" data-platform="Spotify" data-album="Homeless and Hopeless">
              <span class="featured-track-play" aria-hidden="true"><svg><use href="#i-play"/></svg></span>
              <span class="featured-track-text">
                <span class="featured-track-title">Move or Rot</span>
                <span class="featured-track-album">Societal Collapse</span>
              </span>
              <span class="featured-track-meta">Spotify</span>
            </a>
            <a class="featured-track" href="https://open.spotify.com/track/7lRFUpYJ303qdDCHeBoide" target="_blank" rel="noopener" data-platform="Spotify" data-album="The Land of Silver and Sorrow">
              <span class="featured-track-play" aria-hidden="true"><svg><use href="#i-play"/></svg></span>
              <span class="featured-track-text">
                <span class="featured-track-title">Vals del Diablo</span>
                <span class="featured-track-album">Romantic Collapse</span>
              </span>
              <span class="featured-track-meta">Spotify</span>
            </a>
          </div>
        </section>

        <section class="home-block">
          <div class="home-block-head">
            <p class="home-block-eyebrow">Listen</p>
            <h2 class="home-block-title">Stream <em>everywhere</em></h2>
          </div>
          <div class="listen-row">
            <a class="listen-cta" href="https://open.spotify.com/artist/3u1NrsCtmIR1u3UBBccghz" target="_blank" rel="noopener" data-platform="Spotify" data-album="Artist Page">
              <span class="listen-cta-logo"><svg><use href="#logo-spotify"/></svg></span>
              <span class="listen-cta-label">Spotify</span>
            </a>
            <a class="listen-cta" href="https://music.apple.com/us/album/the-land-of-silver-and-sorrow/1895990194" target="_blank" rel="noopener" data-platform="Apple Music" data-album="Artist Page">
              <span class="listen-cta-logo"><svg><use href="#logo-apple"/></svg></span>
              <span class="listen-cta-label">Apple Music</span>
            </a>
            <a class="listen-cta" href="https://music.youtube.com/playlist?list=OLAK5uy_n-WUAFpTLmRAcg6mhB0Hr-VXFlnd7x3pI" target="_blank" rel="noopener" data-platform="YouTube Music" data-album="Artist Page">
              <span class="listen-cta-logo"><svg><use href="#logo-ytmusic"/></svg></span>
              <span class="listen-cta-label">YT Music</span>
            </a>
            <a class="listen-cta" href="https://www.youtube.com/channel/UCHr58sw3YcdmXJvoggp1oew" target="_blank" rel="noopener" data-platform="YouTube" data-album="Channel">
              <span class="listen-cta-logo"><svg><use href="#logo-youtube"/></svg></span>
              <span class="listen-cta-label">YouTube</span>
            </a>
            <a class="listen-cta" href="https://afuneralstar.bandcamp.com" target="_blank" rel="noopener" data-platform="Bandcamp" data-album="Artist Page">
              <span class="listen-cta-logo"><svg><use href="#logo-bandcamp"/></svg></span>
              <span class="listen-cta-label">Bandcamp</span>
            </a>
          </div>
        </section>

        <section class="home-block">
          <div class="home-block-head">
            <p class="home-block-eyebrow">Discography</p>
            <h2 class="home-block-title">Releases</h2>
            <a class="home-block-aside" href="/lyrics/">All lyrics →</a>
          </div>
          <div class="release-grid">
            <a class="release-tile" href="/releases/consumed/">
              <span class="release-tile-art"><img loading="lazy" width="1200" height="1200" src="/assets/img/consumed-cover.webp" alt="Consumed by a Funeral Star album art"></span>
              <span class="release-tile-type">Album</span>
              <span class="release-tile-title">Consumed by a Funeral Star</span>
              <span class="release-tile-sub">Cosmic Collapse</span>
            </a>
            <a class="release-tile" href="/releases/homeless/">
              <span class="release-tile-art"><img loading="lazy" width="1200" height="1200" src="/assets/img/homeless-cover.webp" alt="Homeless and Hopeless album art"></span>
              <span class="release-tile-type">Album</span>
              <span class="release-tile-title">Homeless and Hopeless</span>
              <span class="release-tile-sub">Societal Collapse</span>
            </a>
            <a class="release-tile" href="/releases/silver-and-sorrow/">
              <span class="release-tile-art"><img loading="lazy" width="1200" height="1200" src="/assets/img/silver-cover.webp" alt="The Land of Silver and Sorrow album art"></span>
              <span class="release-tile-type">Album</span>
              <span class="release-tile-title">The Land of Silver and Sorrow</span>
              <span class="release-tile-sub">Romantic Collapse</span>
            </a>
            <a class="release-tile" href="/releases/hell-joseon/">
              <span class="release-tile-art"><img loading="lazy" width="1200" height="1200" src="/assets/img/HellJoseon.webp" alt="Hell Joseon EP cover"></span>
              <span class="release-tile-type">EP</span>
              <span class="release-tile-title">Hell Joseon</span>
              <span class="release-tile-sub">Civic Collapse</span>
            </a>
            <a class="release-tile" href="/releases/entropy-cuts/">
              <span class="release-tile-art"><img loading="lazy" width="1200" height="1200" src="/assets/img/entropycuts.webp" alt="Entropy Cuts album cover"></span>
              <span class="release-tile-type">Album</span>
              <span class="release-tile-title">Entropy Cuts</span>
              <span class="release-tile-sub">Consumed Variants</span>
            </a>
            <a class="release-tile" href="/releases/reyna/">
              <span class="release-tile-art"><img loading="lazy" width="1200" height="1200" src="/assets/img/ReynaCut.webp" alt="Plomo y Polvo: Reyna single cover"></span>
              <span class="release-tile-type">Single</span>
              <span class="release-tile-title">Plomo y Polvo: Reyna</span>
              <span class="release-tile-sub">Día de Muertos Cut</span>
            </a>
          </div>
        </section>

        <div class="home-connect">
          <div class="home-connect-text">
            <p class="home-connect-eyebrow">Mailing list</p>
            <h3 class="home-connect-title">News on releases, shorts, <em>and</em> shows.</h3>
          </div>
          <a class="home-connect-button" href="/mailing-list/">Subscribe</a>
        </div>
      </section>`;

  return pageShell({
    title: "A Funeral Star | Death · Black · Folk Metal",
    description,
    ogImage,
    canonical,
    jsonLd,
    railActive: "home",
    bodyContent,
  });
};

const videosPage = () => {
  const description = "Music videos and shorts from A Funeral Star. Start with the funeral dance, then take the rest in 15-second cuts.";
  const canonical = `${siteUrl}/videos/`;
  const ogImage = `${siteUrl}/assets/img/sitebanner.webp`;

  const shorts = [
    ["vals-del-diablo-short.webp", "vals-del-diablo-short.mp4", "Vals del Diablo", "Silver and Sorrow"],
    ["lines-in-the-sand-short.webp", "lines-in-the-sand-short.mp4", "Lines in the Sand", "Silver and Sorrow"],
    ["clavada-final.webp", "clavada-final.mp4", "Clavada en Tu Voz", "Silver and Sorrow"],
    ["hold-that-pose-new.webp", "hold-that-pose-new.mp4", "Hold That Pose", "Homeless and Hopeless"],
    ["the-universe-did-not-notice-korean.webp", "the-universe-did-not-notice-korean.mp4", "The Universe Did Not Notice", "Homeless and Hopeless"],
    ["consumed-short.webp", "consumed-short.mp4", "Consumed", "Consumed by a Funeral Star"],
    ["drifting-fading-short.webp", "drifting-fading-short.mp4", "Drifting, Fading", "Consumed by a Funeral Star"],
    ["into-void-youtube-short.webp", "into-void-youtube-short.mp4", "Into Void", "Consumed by a Funeral Star"],
    ["collapsethenignite.webp", "collapsethenignite.mp4", "Collapse Then Ignite", "Consumed by a Funeral Star"],
    ["noonenoticed-final.webp", "noonenoticed_final.mp4", "No One Noticed", "Entropy Cuts"],
    ["pretendtosleep.webp", "pretendtosleep.mp4", "Close Your Eyes & Pretend to Sleep", "The Land of Silver and Sorrow"],
  ];

  const shortsHtml = shorts
    .map(([poster, video, title, album]) =>
      `          <figure class="short-card"><video controls loop playsinline preload="metadata" poster="/assets/img/shorts/${poster}" data-short-video data-short-title="${escapeHtml(title)}"><source src="/assets/video/shorts/${video}" type="video/mp4"></video><figcaption><strong>${escapeHtml(title)}</strong><span>${escapeHtml(album)}</span></figcaption></figure>`
    )
    .join("\n");

  const bodyContent = `      <section class="view is-active" aria-label="Videos and shorts">
        <div class="view-head">
          <p class="view-eyebrow">Watch</p>
          <h1 class="view-title">Videos <em>&amp;</em> Shorts</h1>
          <p class="view-lede">Start with the funeral dance, then take the rest in 15-second cuts.</p>
        </div>

        <div class="video-feature">
          <div class="video-frame">
            <iframe
              src="https://www.youtube.com/embed/PhYMzXG9sVU"
              title="A Funeral Star — Vals del Diablo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
              loading="lazy"></iframe>
          </div>
        </div>

        <div class="shorts-rail" aria-label="A Funeral Star shorts">
${shortsHtml}
        </div>

${continueFooter("Continue", [
  { href: "/", text: "Home" },
  { href: "/releases/silver-and-sorrow/", text: "Latest album" },
  { href: "/merch/", text: "Merch" },
])}
      </section>`;

  return pageShell({
    title: "Videos & Shorts | A Funeral Star",
    description,
    ogImage,
    canonical,
    railActive: "videos",
    bodyContent,
  });
};

const galleryPage = () => {
  const description = "Inspirational art from A Funeral Star — daydreams and nightmares to inspire.";
  const canonical = `${siteUrl}/gallery/`;
  const ogImage = `${siteUrl}/assets/img/sitebanner.webp`;

  const tiles = Array.from({ length: 60 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return `          <button class="gallery-tile" data-gallery-index="${i + 1}" data-src="/assets/img/inspirationalart/${n}.webp" aria-label="Open piece ${n}"><img src="/assets/img/inspirationalart/${n}.webp" loading="lazy" width="675" height="1200" alt="Inspirational art ${n}"></button>`;
  }).join("\n");

  const bodyContent = `      <section class="view is-active" aria-label="Inspirational art gallery">
        <div class="view-head">
          <p class="view-eyebrow">Visuals</p>
          <h1 class="view-title">Art <em>&amp;</em> Visions</h1>
          <p class="view-lede">Daydreams and nightmares to inspire.</p>
        </div>

        <div class="gallery-grid" data-gallery>
${tiles}
        </div>

${continueFooter("Continue", [
  { href: "/", text: "Home" },
  { href: "/merch/", text: "Merch" },
  { href: "/mailing-list/", text: "Mailing list" },
])}
      </section>`;

  return pageShell({
    title: "Art & Visions | A Funeral Star",
    description,
    ogImage,
    canonical,
    railActive: "gallery",
    bodyContent,
  });
};

const merchPage = () => {
  const description = "Merch and records from A Funeral Star. Shirts, totes, mugs, digital albums, and direct support.";
  const canonical = `${siteUrl}/merch/`;
  const ogImage = `${siteUrl}/assets/img/sitebanner.webp`;

  const bodyContent = `      <section class="view is-active" aria-label="Merch store">
        <div class="view-head">
          <p class="view-eyebrow">Wear the gravity</p>
          <h1 class="view-title">Merch <em>&amp;</em> Records</h1>
          <p class="view-lede">Shirts, totes, mugs, and the records they were drawn from. Every sale funds the next album.</p>
        </div>

        <div class="merch-grid">
          <article class="merch-card">
            <h3>DistroKid Store</h3>
            <p>Official storefront for shirts, totes, mugs, and release drops.</p>
            <div class="merch-actions">
              <a class="merch-button" href="https://direct.distrokid.com/afuneralstar/home" target="_blank" rel="noopener" data-merch="distrokid">Open Store</a>
            </div>
          </article>
          <article class="merch-card">
            <h3>Bandcamp</h3>
            <p>Digital albums, direct support, and one-off release pages.</p>
            <div class="merch-actions">
              <a class="merch-button merch-button-ghost" href="https://afuneralstar.bandcamp.com" target="_blank" rel="noopener" data-merch="bandcamp">Open Bandcamp</a>
            </div>
          </article>
          <article class="merch-card">
            <h3>Ko-fi</h3>
            <p>Tip the band directly. Funds studio time and short-form video.</p>
            <div class="merch-actions">
              <a class="merch-button merch-button-ghost" href="https://ko-fi.com/afuneralstar" target="_blank" rel="noopener" data-merch="ko-fi">Open Ko-fi</a>
            </div>
          </article>
        </div>

${continueFooter("Continue", [
  { href: "/", text: "Home" },
  { href: "/releases/silver-and-sorrow/", text: "Latest album" },
  { href: "/mailing-list/", text: "Mailing list" },
])}
      </section>`;

  return pageShell({
    title: "Merch & Records | A Funeral Star",
    description,
    ogImage,
    canonical,
    railActive: "merch",
    bodyContent,
  });
};

const mailingListPage = () => {
  const description = "Mailing list signup for A Funeral Star. News on releases, shorts, and shows. No spam.";
  const canonical = `${siteUrl}/mailing-list/`;
  const ogImage = `${siteUrl}/assets/img/sitebanner.webp`;

  const bodyContent = `      <section class="view is-active" aria-label="Mailing list and contact">
        <div class="view-head">
          <p class="view-eyebrow">Stay close</p>
          <h1 class="view-title">Mailing <em>list</em></h1>
          <p class="view-lede">News on releases, shorts, and shows. No spam.</p>
        </div>

        <div class="connect-grid">
          <form
            class="signup-form"
            action="https://buttondown.com/api/emails/embed-subscribe/afuneralstar"
            method="post"
            target="popupwindow"
            data-newsletter-form>
            <label for="email">Subscribe</label>
            <div class="signup-form-row">
              <input type="email" name="email" id="email" required placeholder="your@email.com" autocomplete="email">
              <button type="submit">Join</button>
            </div>
          </form>

          <div class="connect-contact">
            <p>Booking, press, or general inquiries —</p>
            <a href="mailto:contact@afuneralstar.com">contact@afuneralstar.com</a>
          </div>
        </div>

${continueFooter("Continue", [
  { href: "/", text: "Home" },
  { href: "/releases/silver-and-sorrow/", text: "Latest album" },
  { href: "/merch/", text: "Merch" },
])}
      </section>`;

  return pageShell({
    title: "Mailing List | A Funeral Star",
    description,
    ogImage,
    canonical,
    railActive: "mailing-list",
    bodyContent,
  });
};

const aboutPage = () => {
  const description = "About A Funeral Star — experimental death metal band from Washington D.C. Songs about people trapped by the gravity of their situations.";
  const canonical = `${siteUrl}/about/`;
  const ogImage = `${siteUrl}/assets/img/sitebanner.webp`;

  const bodyContent = `      <section class="view is-active" aria-label="About">
        <div class="view-head">
          <p class="view-eyebrow">About</p>
          <h1 class="view-title">A Funeral <em>Star</em></h1>
        </div>

        <div class="about-prose">
          <p>Experimental death metal from Washington D.C. — songs about people trapped by the gravity of their situations, like living inside a funeral star.</p>
          <p>Our music moves from the street to the ritual to the event horizon: poverty, grief, addiction, history, collapse. Every record is another orbit around the same force.</p>
        </div>

        <ul class="about-meta">
          <li>Based — Washington, D.C.</li>
          <li>Genre — Death · Black · Folk Metal</li>
          <li>Records — Three full-lengths, an EP, a single, ongoing</li>
        </ul>

${continueFooter("Continue", [
  { href: "/", text: "Home" },
  { href: "/releases/silver-and-sorrow/", text: "Latest album" },
  { href: "/mailing-list/", text: "Mailing list" },
])}
      </section>`;

  return pageShell({
    title: "About | A Funeral Star",
    description,
    ogImage,
    canonical,
    railActive: "about",
    bodyContent,
  });
};

// ============ Lyric pages ============

const buildTrackJsonLd = ({ album, track, lyrics, relativeUrl }) =>
  JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      name: track.title,
      url: `${siteUrl}/${relativeUrl}`,
      byArtist: { "@type": "MusicGroup", name: "A Funeral Star", url: siteUrl },
      inAlbum: { "@type": "MusicAlbum", name: album.title, url: `${siteUrl}/releases/${album.urlSlug}/` },
      lyrics: { "@type": "CreativeWork", text: lyrics.trim() },
      genre: ["Death Metal", "Black Metal", "Folk Metal"],
    },
    null,
    2,
  );

// og:image points at the same WebP visitors load — modern social
// platforms render WebP share cards correctly.
const lyricOgImage = (album) => `${siteUrl}/assets/img/${album.cover}`;

const lyricPageTemplate = ({ album, track, lyrics, relativeUrl }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(track.title)} Lyrics | A Funeral Star</title>
    <meta name="description" content="${escapeHtml(track.title)} lyrics by A Funeral Star from ${escapeHtml(album.title)}.">
    <meta property="og:title" content="${escapeHtml(track.title)} Lyrics | A Funeral Star">
    <meta property="og:description" content="${escapeHtml(album.title)} / ${escapeHtml(album.collapse)}">
    <meta property="og:image" content="${lyricOgImage(album)}">
    <meta property="og:type" content="music.song">
    <meta property="og:url" content="${siteUrl}/${relativeUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(track.title)} Lyrics | A Funeral Star">
    <meta name="twitter:description" content="${escapeHtml(album.title)} / ${escapeHtml(album.collapse)}">
    <meta name="twitter:image" content="${lyricOgImage(album)}">
    <link rel="canonical" href="${siteUrl}/${relativeUrl}">
    <meta name="theme-color" content="#050506">
    ${trackingScripts}
    <script type="application/ld+json">
${buildTrackJsonLd({ album, track, lyrics, relativeUrl })}
    </script>
    <link rel="stylesheet" href="/assets/css/styles.css">
    <script src="/assets/js/site.js" defer></script>
  </head>
  <body class="lyrics-page">
    <a class="skip-link" href="#main">Skip to lyrics</a>
    <header class="site-header" data-site-header>
      <a class="brand-mark" href="/" aria-label="A Funeral Star home">
        <img src="/assets/img/logo-main.webp" alt="" width="180" height="120">
        <span>A Funeral Star</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" data-nav-toggle>
        <span></span>
        <span></span>
        <span></span>
        <span class="sr-only">Menu</span>
      </button>
      <nav class="primary-nav" id="primary-nav" data-primary-nav>
        <a href="/releases/${album.urlSlug}/">Album</a>
        <a href="/videos/">Videos</a>
        <a href="/merch/">Merch</a>
        <a href="/mailing-list/">Mailing list</a>
        <a href="/about/">About</a>
      </nav>
    </header>
    <main class="lyrics-main" id="main">
      <article class="lyrics-panel">
        <div class="lyrics-art">
          <img src="/assets/img/${album.cover}" alt="${escapeHtml(album.title)} album art" width="1200" height="1200">
        </div>
        <div class="lyrics-content">
          <p class="eyebrow">${String(track.number).padStart(2, "0")} / ${escapeHtml(album.collapse)}</p>
          <h1>${escapeHtml(track.title)}</h1>
          <p class="lyrics-album"><a href="/releases/${album.urlSlug}/">${escapeHtml(album.title)}</a></p>
          <pre>${escapeHtml(lyrics.trim())}</pre>
          <a class="text-link" href="/releases/${album.urlSlug}/">Back to ${escapeHtml(album.title)}</a>
        </div>
      </article>
    </main>
  </body>
</html>
`;

const lyricsIndexTemplate = (tracksByAlbum) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Lyrics | A Funeral Star</title>
    <meta name="description" content="Lyrics for A Funeral Star songs.">
    <link rel="canonical" href="${siteUrl}/lyrics/">
    <meta name="theme-color" content="#050506">
    ${trackingScripts}
    <link rel="stylesheet" href="/assets/css/styles.css">
    <script src="/assets/js/site.js" defer></script>
  </head>
  <body class="lyrics-page">
    <header class="site-header" data-site-header>
      <a class="brand-mark" href="/" aria-label="A Funeral Star home">
        <img src="/assets/img/logo-main.webp" alt="" width="180" height="120">
        <span>A Funeral Star</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" data-nav-toggle>
        <span></span><span></span><span></span><span class="sr-only">Menu</span>
      </button>
      <nav class="primary-nav" id="primary-nav" data-primary-nav>
        <a href="/">Home</a>
        <a href="/videos/">Videos</a>
        <a href="/merch/">Merch</a>
        <a href="/mailing-list/">Mailing list</a>
        <a href="/about/">About</a>
      </nav>
    </header>
    <main class="section lyrics-index">
      <p class="eyebrow">Lyrics</p>
      <h1>A Funeral Star Lyrics</h1>
${tracksByAlbum.map((g) => `      <section>
        <h2><a href="/releases/${g.urlSlug}/">${escapeHtml(g.title)}</a></h2>
        <ol class="track-list">
${g.tracks.map((t) => `          <li><a href="${t.indexUrl}" data-lyrics-link="${slugify(t.title)}">${escapeHtml(t.title)}</a></li>`).join("\n")}
        </ol>
      </section>`).join("\n")}
    </main>
  </body>
</html>
`;

// ============ Sitemap ============

const writeSitemap = async (lyricTracks) => {
  const today = new Date().toISOString().slice(0, 10);

  const mainPages = [
    { loc: `${siteUrl}/`, priority: "1.0", changefreq: "weekly", images: [
      `${siteUrl}/assets/img/sitebanner.webp`,
      `${siteUrl}/assets/img/consumed-cover.webp`,
      `${siteUrl}/assets/img/homeless-cover.webp`,
      `${siteUrl}/assets/img/silver-cover.webp`,
      `${siteUrl}/assets/img/HellJoseon.webp`,
      `${siteUrl}/assets/img/entropycuts.webp`,
      `${siteUrl}/assets/img/ReynaCut.webp`,
    ]},
    { loc: `${siteUrl}/releases/consumed/`, priority: "0.9", changefreq: "monthly", images: [`${siteUrl}/assets/img/consumed-cover.webp`] },
    { loc: `${siteUrl}/releases/homeless/`, priority: "0.9", changefreq: "monthly", images: [`${siteUrl}/assets/img/homeless-cover.webp`] },
    { loc: `${siteUrl}/releases/silver-and-sorrow/`, priority: "0.9", changefreq: "monthly", images: [`${siteUrl}/assets/img/silver-cover.webp`] },
    { loc: `${siteUrl}/releases/hell-joseon/`, priority: "0.8", changefreq: "monthly", images: [`${siteUrl}/assets/img/HellJoseon.webp`] },
    { loc: `${siteUrl}/releases/entropy-cuts/`, priority: "0.8", changefreq: "monthly", images: [`${siteUrl}/assets/img/entropycuts.webp`] },
    { loc: `${siteUrl}/releases/reyna/`, priority: "0.8", changefreq: "monthly", images: [`${siteUrl}/assets/img/ReynaCut.webp`] },
    { loc: `${siteUrl}/videos/`, priority: "0.7", changefreq: "monthly", images: [] },
    { loc: `${siteUrl}/lyrics/`, priority: "0.7", changefreq: "monthly", images: [] },
    { loc: `${siteUrl}/gallery/`, priority: "0.6", changefreq: "monthly", images: [] },
    { loc: `${siteUrl}/merch/`, priority: "0.7", changefreq: "monthly", images: [] },
    { loc: `${siteUrl}/mailing-list/`, priority: "0.6", changefreq: "monthly", images: [] },
    { loc: `${siteUrl}/about/`, priority: "0.6", changefreq: "monthly", images: [] },
  ];

  const lyricPages = lyricTracks.map((t) => ({
    loc: `${siteUrl}/${t.relativeUrl}`,
    priority: "0.5",
    changefreq: "monthly",
    images: [`${siteUrl}/assets/img/${t.album.cover}`],
  }));

  const all = [...mainPages, ...lyricPages];

  const body = all
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.images.map((img) => `\n    <image:image><image:loc>${img}</image:loc></image:image>`).join("")}
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`;

  await writeFile(path.join(root, "sitemap.xml"), xml);
};

// ============ Main build ============

const main = async () => {
  // 1. Lyric pages (per track, plus collect tracks-by-album for index + sitemap)
  const allTracks = [];
  const tracksByAlbum = [];

  for (const album of albums) {
    const outDir = path.join(root, "lyrics", album.slug);
    await mkdir(outDir, { recursive: true });

    const files = (await readdir(path.join(root, album.sourceDir)))
      .filter((f) => f.endsWith(".txt"))
      .sort((a, b) => Number(a.slice(0, 2)) - Number(b.slice(0, 2)));

    const albumTracks = [];
    for (const filename of files) {
      const track = parseLyricFile(filename);
      if (!track) continue;

      const lyrics = await readFile(path.join(root, album.sourceDir, filename), "utf8");
      const pageName = `${slugify(track.title)}.html`;
      const relativeUrl = `lyrics/${album.slug}/${pageName}`;
      const indexUrl = `${album.slug}/${pageName}`;

      await writeFile(
        path.join(outDir, pageName),
        lyricPageTemplate({ album, track, lyrics, relativeUrl }),
      );

      const generatedTrack = { ...track, album, relativeUrl, indexUrl };
      albumTracks.push(generatedTrack);
      allTracks.push(generatedTrack);
    }

    tracksByAlbum.push({
      title: album.title,
      urlSlug: album.urlSlug,
      tracks: albumTracks,
    });
  }

  // 2. Lyrics index
  await writeFile(path.join(root, "lyrics", "index.html"), lyricsIndexTemplate(tracksByAlbum));

  // 3. Home + per-page top-level routes
  await writeFile(path.join(root, "index.html"), homePage());

  for (const album of albums) {
    const albumTracks = allTracks.filter((t) => t.album.slug === album.slug);
    const dir = path.join(root, "releases", album.urlSlug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), albumPage(album, albumTracks));
  }

  for (const release of otherReleases) {
    const dir = path.join(root, "releases", release.urlSlug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), releasePage(release));
  }

  for (const [slug, builder] of [
    ["videos", videosPage],
    ["gallery", galleryPage],
    ["merch", merchPage],
    ["mailing-list", mailingListPage],
    ["about", aboutPage],
  ]) {
    const dir = path.join(root, slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), builder());
  }

  // 4. Sitemap
  await writeSitemap(allTracks);

  return { pageCount: 12 + allTracks.length };
};

const { pageCount } = await main();
console.log(`Built ${pageCount} pages.`);
