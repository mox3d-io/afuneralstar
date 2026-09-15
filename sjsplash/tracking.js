(() => {
  'use strict';
  const measurementId = 'G-888BCT159V';
  const spotifyUrl = 'https://open.spotify.com/track/0jdbNqbGIEOWz6gJg6kHml';
  const context = {
    page_type: 'music_landing',
    song_title: 'San Juan',
    artist_name: 'A Funeral Star',
    release_title: 'Saudade By The Sea',
    spotify_track_id: '0jdbNqbGIEOWz6gJg6kHml'
  };
  // Local previews never send visits/clicks into the production property.
  if (!['afuneralstar.com', 'www.afuneralstar.com'].includes(location.hostname)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(tag);
  window.gtag('js', new Date());
  // Disable the automatic initial pageview; emit one explicit, song-labelled pageview.
  window.gtag('config', measurementId, { send_page_view: false });
  window.gtag('event', 'page_view', {
    ...context, send_to: measurementId,
    page_title: document.title, page_location: location.href
  });
  const link = document.getElementById('spotify-link');
  link.addEventListener('click', (event) => {
    const sameTab = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    let timer;
    let navigated = false;
    const navigate = () => {
      if (navigated) return;
      navigated = true;
      clearTimeout(timer);
      location.assign(spotifyUrl);
    };
    if (sameTab) {
      event.preventDefault();
      // Spotify must still open if a blocker prevents Google's callback.
      timer = setTimeout(navigate, 500);
    }
    try {
      window.gtag('event', 'stream_click', {
        ...context, send_to: measurementId,
        streaming_service: 'spotify', link_url: spotifyUrl,
        transport_type: 'beacon', event_timeout: 500,
        ...(sameTab ? { event_callback: navigate } : {})
      });
    } catch (_) {
      if (sameTab) navigate();
    }
  });
})();
