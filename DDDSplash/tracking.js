(() => {
  'use strict';
  const measurementId = 'G-888BCT159V';
  const spotifyUrl = 'https://open.spotify.com/track/0zmYJP3oCIjSV2h91wKL0K';
  const context = {
    page_type: 'music_landing',
    song_title: 'Devils Don’t Dance Slow',
    artist_name: 'A Funeral Star',
    release_title: 'Saudade By The Sea',
    spotify_track_id: '0zmYJP3oCIjSV2h91wKL0K'
  };
  const link = document.getElementById('spotify-link');
  const appLink = document.getElementById('spotify-app-link');
  const webLink = document.getElementById('spotify-web-link');
  const android = /Android/i.test(navigator.userAgent) || navigator.userAgentData?.platform === 'Android';
  const intentUrl = 'intent://open.spotify.com/track/' + context.spotify_track_id +
    '#Intent;scheme=https;package=com.spotify.music;S.browser_fallback_url=' +
    encodeURIComponent(spotifyUrl) + ';end';
  // Set href ahead of the tap: app opening remains a direct user gesture.
  // This works independently of GA4 and blockers.
  if (android) {
    link.href = intentUrl;
    appLink.href = intentUrl;
  }
  const production = ['afuneralstar.com', 'www.afuneralstar.com'].includes(location.hostname);
  let pendingX = 0;
  function flushX() {
    if (!window.twttr?.conversion?.trackPid) return;
    while (pendingX > 0) {
      pendingX--;
      try { window.twttr.conversion.trackPid('rfymy', {tw_sale_amount: 0, tw_order_quantity: 0}); }
      catch (_) { /* Tracking must not block Spotify. */ }
    }
  }
  if (production) {
    const xTag = document.createElement('script');
    xTag.async = true; xTag.src = 'https://platform.twitter.com/oct.js';
    xTag.onload = flushX;
    document.head.appendChild(xTag);
  }
  for (const [anchor, method] of [[link, android ? 'android_intent' : 'https'],
    [appLink, android ? 'android_intent' : 'spotify_uri'], [webLink, 'web_fallback']]) {
    anchor.addEventListener('click', () => {
      if (!production) return;
      pendingX++;
      flushX();
      try {
        window.gtag('event', 'stream_click', {
          ...context, send_to: measurementId,
          streaming_service: 'spotify', link_url: spotifyUrl,
          open_method: method, transport_type: 'beacon'
        });
      } catch (_) { /* Analytics must never prevent the native link action. */ }
      // No preventDefault, timers, or event_callback navigation. They can
      // remove the user gesture browsers require to open external apps.
    });
  }
})();
