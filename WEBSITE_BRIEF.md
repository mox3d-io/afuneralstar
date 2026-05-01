# A Funeral Star — Website Build Brief (afuneralstar.com)

## What This Is
Build a website for the band "A Funeral Star" — a death metal / black metal / folk metal project with three albums. The site needs to host embedded media, link to streaming platforms, embed a merch store, and provide Ko-fi/Patreon integration. The aesthetic should be dark, heavy, and atmospheric — think black metal meets cosmic horror. Not generic dark theme — this band's motif is gravitational pull, people trapped in situations like matter trapped in a black hole.

## CRITICAL: File Safety Rules
- **NEVER modify, convert, re-encode, or edit any files under `/home/ace/musicenhancer/albums/*/raw/`** — these are irreplaceable original audio masters
- **NEVER modify files under `/home/ace/musicenhancer/albums/*/enhanced/`** — these are the final mastered tracks
- You may READ and COPY assets (images, videos) but never alter originals
- If you need resized/optimized images for web, create copies in a separate web assets directory

## Band Identity
- **Band Name:** A Funeral Star
- **Tagline:** "Songs about people trapped by the gravity of their situations."
- **Core Motif:** Gravity — literal and metaphorical. Poverty is gravity. Grief is gravity. Addiction is gravity. A funeral star (black hole) is the extreme version of what everyone already understands.
- **Aesthetic:** Cosmic darkness, black holes, gravitational collapse. NOT generic skull-and-crossbones metal. Think: dark matter, filament webs, event horizons, spaghettification, entropy.

## Three Albums (in release order)

### 1. Consumed by a Funeral Star (2025)
- **Genre:** Cosmic black metal / death metal
- **Theme:** Post-human, cosmic scale. The universe as a trap. Gravity tombs, singularities, entropic night. The most extreme and least accessible album.
- **Tracks:** 12 tracks (see file listing below)
- **Album Art:** `/home/ace/musicenhancer/albums/Consumed by a Funeral Star/A funeral star album cover.png`
- **Hi-res Art:** `/home/ace/musicenhancer/albums/Consumed by a Funeral Star/A funeral star album cover - 3000 square.png`
- **Cover Variations:** `/home/ace/musicenhancer/albums/Consumed by a Funeral Star/cover_variations/` (13 variations with different logo/title treatments)
- **Videos (full tracks on YouTube):** `/home/ace/musicenhancer/albums/Consumed by a Funeral Star/videos/` — 12 mp4 files
- **Shorts:** `/home/ace/musicenhancer/albums/Consumed by a Funeral Star/shorts/` — `consumed_short.mp4`, `infinityclosesshort.mp4`

### 2. Homeless and Hopeless (2025)
- **Genre:** Death metal / hardcore punk / crust punk / d-beat
- **Theme:** Human-scale suffering. Poverty, streets, defiance, addiction, loss. The most raw and punk album. Contains space-themed bridge tracks (The Universe Did Not Notice, A Funeral Star, Starlit Grave) that connect it to the Consumed album.
- **Tracks:** 12-13 tracks
- **Album Art:** `/home/ace/musicenhancer/albums/Homeless and Hopeless/homelessandhopelessalbumart.png`
- **Videos:** `/home/ace/musicenhancer/albums/Homeless and Hopeless/videos/` — 13 mp4 files
- **Shorts:** `/home/ace/musicenhancer/albums/Homeless and Hopeless/shorts/` — `hold_that_pose_v20.mp4`
- **Archive assets:** DC statue photos in `shorts/archive/dc_statues/` (28 JPGs of DC monuments, used for the Washington Weeps / Hold That Pose visual aesthetic)

### 3. The Land of Silver and Sorrow (2026)
- **Genre:** Death metal / Mexican folk metal / mariachi metal / narco death metal
- **Theme:** Cultural grief, ritual, Day of the Dead, the weight of history. Bilingual (English/Spanish). The most accessible and best-produced album. Features the band's top-performing track (Vals del Diablo).
- **Tracks:** 15 tracks
- **Album Art:** `/home/ace/musicenhancer/albums/The Land of Silver and Sorrow/silverandsorrowalbumart.png`
- **Hi-res original:** `/home/ace/musicenhancer/albums/The Land of Silver and Sorrow/silverandsorrowalbumart_1024_original.png`
- **Videos:** `/home/ace/musicenhancer/albums/The Land of Silver and Sorrow/videos/` — 15 mp4 files
- **Shorts:** `/home/ace/musicenhancer/albums/The Land of Silver and Sorrow/shorts/` — multiple Vals del Diablo short versions (v1-v5 + IG version)

## Logos
- **Main logo (dark):** `/home/ace/musicenhancer/albums/The Land of Silver and Sorrow/shorts/afuneralstarlogo.png`
- **White logo:** `/home/ace/musicenhancer/albums/The Land of Silver and Sorrow/shorts/whitelogo.png`

## YouTube Channel & Video IDs
- **Channel:** A Funeral Star (UCHr58sw3YcdmXJvoggp1oew)
- All videos are already uploaded and public. Video IDs are stored in:
  - `/home/ace/musicenhancer/albums/Consumed by a Funeral Star/youtube_upload_state.json`
  - `/home/ace/musicenhancer/albums/Homeless and Hopeless/youtube_upload_state.json`
  - `/home/ace/musicenhancer/albums/The Land of Silver and Sorrow/youtube_upload_state.json`
- Each JSON has `{"uploaded": {"filename": "videoId", ...}, "playlist_id": "..."}`
- Use these video IDs for YouTube embeds on the site

## YouTube Playlists
- Consumed: `PLn4ObNGhe_haIVMCw_8TE-TLDjwXInTI3`
- Homeless: `PLn4ObNGhe_hYybuG6mL0RDvjKLlQ624JJ`
- Silver: `PLn4ObNGhe_ha6o0Y-gVfGQ8TedDfJI5kW`

## External Links to Integrate
- **DistroKid Merch Store** — embed or link (get URL from user)
- **Ko-fi** — embed or link (get URL from user)
- **Patreon** — embed or link (get URL from user)
- **Bandcamp** — link (get URL from user)
- **Spotify** — link to artist page (get URL from user)
- **Apple Music** — link (get URL from user)
- **TikTok** — link (get URL from user)
- **YouTube** — https://www.youtube.com/channel/UCHr58sw3YcdmXJvoggp1oew

Note: Ask the user for the specific URLs for DistroKid merch, Ko-fi, Patreon, Bandcamp, Spotify, and Apple Music pages. These aren't stored locally.

## Site Structure (Suggested)
1. **Home/Landing** — Hero with band logo, atmospheric background, latest release featured, streaming links
2. **Music** — All three albums with embedded YouTube playlists or individual track players, album art, track listings
3. **Merch** — DistroKid merch store embed + any additional products with better margins
4. **Support** — Ko-fi and Patreon embeds/links
5. **About** — Band description (keep it mysterious — "Songs about people trapped by the gravity of their situations." Don't explain the AI aspect, don't deny it either)

## Design Notes
- The three albums have a thematic arc: human (Homeless) -> mythic/cultural (Silver) -> cosmic (Consumed). The site design could reflect this progression.
- Silver and Sorrow is the most accessible entry point — consider featuring it prominently for new visitors
- The band's visual identity spans: gritty DC street photography (Homeless), Day of the Dead / Mexican folk imagery (Silver), cosmic horror / black hole visuals (Consumed)
- Mobile-first is important — most traffic comes from YouTube Shorts viewers on phones
- Dark theme is non-negotiable. This is a black/death metal band.

## Tech Notes
- The musicenhancer project at `/home/ace/musicenhancer/` is a Python audio processing pipeline — don't modify it, just read assets from it
- The YouTube upload script (`youtube_upload.py`) and token (`youtube_token.pickle`) are for backend operations, not the website
- Build the website in its own directory, not inside musicenhancer
