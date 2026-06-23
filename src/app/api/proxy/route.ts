import { NextRequest, NextResponse } from 'next/server';

const PROXY_BASE = '/api/proxy';

function getProxyUrl(originalUrl: string, baseUrl: string): string {
  try {
    // If it's already a proxy URL, don't re-proxy
    if (originalUrl.includes(PROXY_BASE)) return originalUrl;

    // Handle absolute URLs
    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
    }

    // Handle protocol-relative URLs
    if (originalUrl.startsWith('//')) {
      return `${PROXY_BASE}?url=${encodeURIComponent('https:' + originalUrl)}`;
    }

    // Handle absolute paths
    if (originalUrl.startsWith('/')) {
      const base = new URL(baseUrl);
      const fullUrl = `${base.origin}${originalUrl}`;
      return `${PROXY_BASE}?url=${encodeURIComponent(fullUrl)}`;
    }

    // Handle relative paths
    const base = new URL(baseUrl);
    const fullUrl = new URL(originalUrl, base).href;
    return `${PROXY_BASE}?url=${encodeURIComponent(fullUrl)}`;
  } catch {
    return originalUrl;
  }
}

function rewriteHtmlUrls(html: string, baseUrl: string): string {
  // Rewrite src attributes
  html = html.replace(
    /(src\s*=\s*["'])([^"']+)(["'])/gi,
    (_, prefix, url, suffix) => {
      if (
        url.startsWith('data:') ||
        url.startsWith('blob:') ||
        url.startsWith('javascript:') ||
        url.startsWith('#')
      ) {
        return prefix + url + suffix;
      }
      return prefix + getProxyUrl(url, baseUrl) + suffix;
    }
  );

  // Rewrite href attributes (but not for anchors with #)
  html = html.replace(
    /(href\s*=\s*["'])([^"']+)(["'])/gi,
    (_, prefix, url, suffix) => {
      if (
        url.startsWith('data:') ||
        url.startsWith('blob:') ||
        url.startsWith('javascript:') ||
        url.startsWith('#') ||
        url.startsWith('mailto:')
      ) {
        return prefix + url + suffix;
      }
      return prefix + getProxyUrl(url, baseUrl) + suffix;
    }
  );

  // Rewrite action attributes
  html = html.replace(
    /(action\s*=\s*["'])([^"']+)(["'])/gi,
    (_, prefix, url, suffix) => {
      if (url.startsWith('#')) return prefix + url + suffix;
      return prefix + getProxyUrl(url, baseUrl) + suffix;
    }
  );

  // Rewrite url() in style attributes and inline styles
  html = html.replace(
    /url\(["']?([^"')]+)["']?\)/gi,
    (_, url) => {
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        return `url('${url}')`;
      }
      return `url('${getProxyUrl(url, baseUrl)}')`;
    }
  );

  return html;
}

// Inject a script that helps detect video elements and communicate with parent
const INJECTED_SCRIPT = `
<script>
(function() {
  'use strict';

  // Prevent the page from navigating away
  window.addEventListener('beforeunload', function(e) { e.preventDefault(); });

  // Detect video elements and notify parent
  function detectVideos() {
    var videos = document.querySelectorAll('video');
    var videoInfo = [];
    videos.forEach(function(v, i) {
      videoInfo.push({
        index: i,
        src: v.currentSrc || v.src || '',
        width: v.videoWidth || v.clientWidth,
        height: v.videoHeight || v.clientHeight,
        isPlaying: !v.paused,
        hasFullscreen: !!(v.requestFullscreen || v.webkitRequestFullscreen || v.msRequestFullscreen)
      });
    });
    window.parent.postMessage({ type: 'proxy-video-detect', videos: videoInfo }, '*');
  }

  // Run detection on load and when DOM changes
  if (document.readyState === 'complete') {
    detectVideos();
  } else {
    window.addEventListener('load', detectVideos);
  }

  // Observe DOM mutations for dynamically added videos
  var observer = new MutationObserver(function() {
    setTimeout(detectVideos, 500);
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  // Listen for messages from parent
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'proxy-request-videos') {
      detectVideos();
    }
    if (e.data && e.data.type === 'proxy-fullscreen-video') {
      var idx = e.data.index || 0;
      var videos = document.querySelectorAll('video');
      if (videos[idx]) {
        var v = videos[idx];
        if (v.requestFullscreen) v.requestFullscreen();
        else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
        else if (v.msRequestFullscreen) v.msRequestFullscreen();
      }
    }
    if (e.data && e.data.type === 'proxy-play-video') {
      var idx = e.data.index || 0;
      var videos = document.querySelectorAll('video');
      if (videos[idx]) {
        videos[idx].play().catch(function(){});
      }
    }
    if (e.data && e.data.type === 'proxy-pause-video') {
      var idx = e.data.index || 0;
      var videos = document.querySelectorAll('video');
      if (videos[idx]) {
        videos[idx].pause();
      }
    }
  });

  // Click handler to detect video clicks
  document.addEventListener('click', function(e) {
    var video = e.target.closest('video');
    if (video) {
      var videos = document.querySelectorAll('video');
      var idx = Array.from(videos).indexOf(video);
      window.parent.postMessage({
        type: 'proxy-video-clicked',
        index: idx,
        rect: video.getBoundingClientRect()
      }, '*');
    }
  }, true);

  // Report page load
  window.parent.postMessage({ type: 'proxy-page-loaded', url: window.location.href }, '*');
})();
</script>
`;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter. Usage: /api/proxy?url=https://example.com' },
      { status: 400 }
    );
  }

  try {
    // Validate URL
    const targetUrl = new URL(url);

    // Block some dangerous schemes
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are supported' },
        { status: 400 }
      );
    }

    // Fetch the content
    const response = await fetch(targetUrl.href, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    const body = await response.arrayBuffer();

    // Handle different content types
    if (contentType.includes('text/html')) {
      let html = new TextDecoder('utf-8', { fatal: false }).decode(body);

      // Inject base tag to handle relative URLs
      const baseTag = `<base href="${targetUrl.href}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<html>')) {
        html = html.replace('<html>', `<html><head>${baseTag}</head>`);
      } else {
        html = baseTag + html;
      }

      // Rewrite URLs in the HTML
      html = rewriteHtmlUrls(html, targetUrl.href);

      // Inject our helper script before </body> or at the end
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${INJECTED_SCRIPT}</body>`);
      } else {
        html += INJECTED_SCRIPT;
      }

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'X-Frame-Options': 'ALLOWALL',
          'Content-Security-Policy':
            "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-src *; media-src * data: blob:;",
        },
      });
    }

    // For non-HTML content (CSS, JS, images, videos, etc.), pass through directly
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    // Forward content type
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // For video/audio, support range requests
    const range = request.headers.get('range');
    if (range && response.status === 206) {
      headers.set('Content-Range', response.headers.get('content-range') || '');
      headers.set('Accept-Ranges', 'bytes');
      const contentLength = response.headers.get('content-length');
      if (contentLength) headers.set('Content-Length', contentLength);
      return new NextResponse(body, { status: 206, headers });
    }

    const contentLength = body.byteLength;
    headers.set('Content-Length', contentLength.toString());

    // Cache static assets
    if (
      contentType.includes('image') ||
      contentType.includes('font') ||
      contentType.includes('javascript') ||
      contentType.includes('css')
    ) {
      headers.set('Cache-Control', 'public, max-age=3600');
    }

    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch the requested URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
