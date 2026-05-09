import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const siteUrl = "https://www.afuneralstar.com";

const albums = [
  {
    slug: "consumed-by-a-funeral-star",
    title: "Consumed by a Funeral Star",
    collapse: "Cosmic Collapse",
    sourceDir: "content/lyrics/consumed-by-a-funeral-star",
    cover: "consumed-cover.jpg",
  },
  {
    slug: "homeless-and-hopeless",
    title: "Homeless and Hopeless",
    collapse: "Societal Collapse",
    sourceDir: "content/lyrics/homeless-and-hopeless",
    cover: "homeless-cover.jpg",
  },
  {
    slug: "the-land-of-silver-and-sorrow",
    title: "The Land of Silver and Sorrow",
    collapse: "Romantic Collapse",
    sourceDir: "content/lyrics/the-land-of-silver-and-sorrow",
    cover: "silver-cover.jpg",
  },
];

const escapeHtml = (value) =>
  value
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

const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalTitle = (value) => slugify(value.replace(/\s*\([^)]*\)\s*$/g, ""));

const parseLyricFile = (filename) => {
  const match = filename.match(/^(\d+)\s+-\s+(.+)\.txt$/);
  if (!match) return null;
  return {
    number: Number(match[1]),
    title: match[2],
  };
};

const googleTag = `
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-888BCT159V"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag("js", new Date());
      gtag("config", "G-888BCT159V");
    </script>`;

const clarityTag = `
    <script type="text/javascript">
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "wokypjnuyi");
    </script>`;

const pageTemplate = ({ album, track, lyrics, relativeUrl }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(track.title)} Lyrics | A Funeral Star</title>
    <meta name="description" content="${escapeHtml(track.title)} lyrics by A Funeral Star from ${escapeHtml(album.title)}.">
    <meta property="og:title" content="${escapeHtml(track.title)} Lyrics | A Funeral Star">
    <meta property="og:description" content="${escapeHtml(album.title)} / ${escapeHtml(album.collapse)}">
    <meta property="og:image" content="../../assets/img/${album.cover}">
    <meta property="og:type" content="music.song">
    <link rel="canonical" href="${siteUrl}/${relativeUrl}">
    <meta name="theme-color" content="#050506">${googleTag}${clarityTag}
    <link rel="stylesheet" href="../../assets/css/styles.css">
    <script src="../../assets/js/site.js" defer></script>
  </head>
  <body class="lyrics-page">
    <a class="skip-link" href="#main">Skip to lyrics</a>
    <header class="site-header" data-site-header>
      <a class="brand-mark" href="../../index.html#top" aria-label="A Funeral Star home">
        <img src="../../assets/img/logo-main.png" alt="" width="180" height="120">
        <span>A Funeral Star</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" data-nav-toggle>
        <span></span>
        <span></span>
        <span></span>
        <span class="sr-only">Menu</span>
      </button>
      <nav class="primary-nav" id="primary-nav" data-primary-nav>
        <a href="../../index.html#music">Music</a>
        <a href="../../index.html#videos">Videos</a>
        <a href="../../index.html#merch">Merch</a>
        <a href="../../index.html#connect">Mailing list</a>
        <a href="../../index.html#support">Support</a>
        <a href="../../index.html#about">About</a>
      </nav>
    </header>
    <main class="lyrics-main" id="main">
      <article class="lyrics-panel">
        <div class="lyrics-art">
          <img src="../../assets/img/${album.cover}" alt="${escapeHtml(album.title)} album art" width="1200" height="1200">
        </div>
        <div class="lyrics-content">
          <p class="eyebrow">${String(track.number).padStart(2, "0")} / ${escapeHtml(album.collapse)}</p>
          <h1>${escapeHtml(track.title)}</h1>
          <p class="lyrics-album">${escapeHtml(album.title)}</p>
          <pre>${escapeHtml(lyrics.trim())}</pre>
          <a class="text-link" href="../../index.html#music">Back to discography</a>
        </div>
      </article>
    </main>
  </body>
</html>
`;

const lyricsIndexTemplate = (tracks) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Lyrics | A Funeral Star</title>
    <meta name="description" content="Lyrics for A Funeral Star songs.">
    <link rel="canonical" href="${siteUrl}/lyrics/">
    <meta name="theme-color" content="#050506">${googleTag}${clarityTag}
    <link rel="stylesheet" href="../assets/css/styles.css">
    <script src="../assets/js/site.js" defer></script>
  </head>
  <body class="lyrics-page">
    <header class="site-header" data-site-header>
      <a class="brand-mark" href="../index.html#top" aria-label="A Funeral Star home">
        <img src="../assets/img/logo-main.png" alt="" width="180" height="120">
        <span>A Funeral Star</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" data-nav-toggle>
        <span></span>
        <span></span>
        <span></span>
        <span class="sr-only">Menu</span>
      </button>
      <nav class="primary-nav" id="primary-nav" data-primary-nav>
        <a href="../index.html#music">Music</a>
        <a href="../index.html#videos">Videos</a>
        <a href="../index.html#merch">Merch</a>
        <a href="../index.html#connect">Mailing list</a>
        <a href="../index.html#support">Support</a>
        <a href="../index.html#about">About</a>
      </nav>
    </header>
    <main class="section lyrics-index">
      <p class="eyebrow">Lyrics</p>
      <h1>A Funeral Star Lyrics</h1>
      ${albums
        .map((album) => {
          const albumTracks = tracks.filter((track) => track.album.slug === album.slug);
          return `<section>
        <h2>${escapeHtml(album.title)}</h2>
        <ol class="track-list">
          ${albumTracks
            .map(
              (track) =>
                `<li><a href="${track.indexUrl}" data-lyrics-link="${slugify(track.title)}">${escapeHtml(track.title)}</a></li>`,
            )
            .join("\n          ")}
        </ol>
      </section>`;
        })
        .join("\n      ")}
    </main>
  </body>
</html>
`;

const createLyricsPages = async () => {
  const generated = [];
  const titleToUrl = new Map();

  await mkdir(path.join(root, "lyrics"), { recursive: true });

  for (const album of albums) {
    const outDir = path.join(root, "lyrics", album.slug);
    await mkdir(outDir, { recursive: true });

    const files = (await readdir(path.join(root, album.sourceDir)))
      .filter((filename) => filename.endsWith(".txt"))
      .sort((a, b) => Number(a.slice(0, 2)) - Number(b.slice(0, 2)));

    for (const filename of files) {
      const track = parseLyricFile(filename);
      if (!track) continue;

      const lyrics = await readFile(path.join(root, album.sourceDir, filename), "utf8");
      const pageName = `${slugify(track.title)}.html`;
      const relativeUrl = `lyrics/${album.slug}/${pageName}`;
      const indexUrl = `${album.slug}/${pageName}`;
      await writeFile(
        path.join(outDir, pageName),
        pageTemplate({ album, track, lyrics, relativeUrl }),
      );

      const generatedTrack = { ...track, album, relativeUrl, indexUrl };
      generated.push(generatedTrack);
      titleToUrl.set(normalTitle(track.title), relativeUrl);
    }
  }

  await writeFile(path.join(root, "lyrics", "index.html"), lyricsIndexTemplate(generated));

  let indexHtml = await readFile(path.join(root, "index.html"), "utf8");
  indexHtml = indexHtml.replace(
    /<li>(?:<a href="lyrics\/[^"]+" data-lyrics-link="[^"]+">)?([^<]+)(?:<\/a>)?<\/li>/g,
    (match, title) => {
      const decodedTitle = unescapeHtml(title);
      const relativeUrl = titleToUrl.get(normalTitle(decodedTitle));
      if (!relativeUrl) return match;
      return `<li><a href="${relativeUrl}" data-lyrics-link="${slugify(decodedTitle)}">${escapeHtml(decodedTitle)}</a></li>`;
    },
  );
  await writeFile(path.join(root, "index.html"), indexHtml);

  return generated;
};

const generated = await createLyricsPages();
console.log(`Generated ${generated.length} lyric pages.`);
