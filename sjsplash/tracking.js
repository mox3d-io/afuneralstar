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
  // The X API supplied a dedicated single-event tag for Spotify button clicks.
  // Keep it independent of GA4 so a Google blocker does not suppress X events.
  const xClicks = [];
  function xClick() {
    if (window.twttr?.conversion?.trackPid) {
      window.twttr.conversion.trackPid('rfbkq', {tw_sale_amount: 0, tw_order_quantity: 0});
    } else {
      xClicks.push(true);
    }
  }
  if (production) {
    window.fbq = window.fbq || function () {
      window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
    };
    window._fbq = window._fbq || window.fbq;
    window.fbq.push = window.fbq; window.fbq.loaded = true; window.fbq.version = '2.0';
    window.fbq.queue = window.fbq.queue || [];
    const metaTag = document.createElement('script');
    metaTag.async = true; metaTag.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(metaTag);
    window.fbq('init', '1383265040543968');
    window.fbq('track', 'PageView');
    window.twq = window.twq || function () {
      window.twq.exe ? window.twq.exe.apply(window.twq, arguments) : window.twq.queue.push(arguments);
    };
    window.twq.version = '1.1';
    window.twq.queue = window.twq.queue || [];
    const xBase = document.createElement('script');
    xBase.async = true; xBase.src = 'https://static.ads-twitter.com/uwt.js';
    document.head.appendChild(xBase);
    window.twq('config', 'redpj');
    const xEvent = document.createElement('script');
    xEvent.async = true; xEvent.src = 'https://platform.twitter.com/oct.js';
    xEvent.onload = () => {
      if (window.twttr?.conversion?.trackPid) {
        while (xClicks.length) { xClicks.pop(); try { xClick(); } catch (_) {} }
      }
    };
    document.head.appendChild(xEvent);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(tag);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false });
    window.gtag('event', 'page_view', {
      ...context, send_to: measurementId,
      page_title: document.title, page_location: location.href
    });
  }
  for (const [anchor, method] of [[link, android ? 'android_intent' : 'https'],
    [appLink, android ? 'android_intent' : 'spotify_uri'], [webLink, 'web_fallback']]) {
    anchor.addEventListener('click', () => {
      if (!production) return;
      try {
        window.fbq('trackCustom', 'SpotifyClick', {
          song_title: context.song_title, spotify_track_id: context.spotify_track_id,
          streaming_service: 'spotify', open_method: method
        });
      } catch (_) { /* Preserve native navigation if Meta is blocked. */ }
      try { xClick(); } catch (_) { /* Preserve native navigation if X is blocked. */ }
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
