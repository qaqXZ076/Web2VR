import { NextRequest, NextResponse } from 'next/server';

const PROXY_BASE = '/api/proxy';

function getProxyUrl(originalUrl: string, baseUrl: string): string {
  try {
    if (originalUrl.includes('/api/proxy')) return originalUrl;
    if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:') || originalUrl.startsWith('javascript:')) return originalUrl;

    if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
      return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
    }
    if (originalUrl.startsWith('//')) {
      return `${PROXY_BASE}?url=${encodeURIComponent('https:' + originalUrl)}`;
    }
    if (originalUrl.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${PROXY_BASE}?url=${encodeURIComponent(`${base.origin}${originalUrl}`)}`;
    }
    const base = new URL(baseUrl);
    return `${PROXY_BASE}?url=${encodeURIComponent(new URL(originalUrl, base).href)}`;
  } catch {
    return originalUrl;
  }
}

function rewriteHtmlUrls(html: string, baseUrl: string): string {
  html = html.replace(
    /(src\s*=\s*["'])([^"']+)(["'])/gi,
    (_, prefix, url, suffix) => {
      if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:') || url.startsWith('#')) {
        return prefix + url + suffix;
      }
      return prefix + getProxyUrl(url, baseUrl) + suffix;
    }
  );
  html = html.replace(
    /(href\s*=\s*["'])([^"']+)(["'])/gi,
    (_, prefix, url, suffix) => {
      if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:') || url.startsWith('#') || url.startsWith('mailto:')) {
        return prefix + url + suffix;
      }
      return prefix + getProxyUrl(url, baseUrl) + suffix;
    }
  );
  html = html.replace(
    /(action\s*=\s*["'])([^"']+)(["'])/gi,
    (_, prefix, url, suffix) => {
      if (url.startsWith('#')) return prefix + url + suffix;
      return prefix + getProxyUrl(url, baseUrl) + suffix;
    }
  );
  html = html.replace(
    /url\(["']?([^"')]+)["']?\)/gi,
    (_, url) => {
      if (url.startsWith('data:') || url.startsWith('blob:')) return `url('${url}')`;
      return `url('${getProxyUrl(url, baseUrl)}')`;
    }
  );
  return html;
}

// Minimal injected script - just page load notification
const INJECTED_SCRIPT = `
<script>
(function() {
  'use strict';
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
    const targetUrl = new URL(url);

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are supported' },
        { status: 400 }
      );
    }

    // Build request headers that mimic a real browser
    const requestHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': targetUrl.origin + '/',
    };

    const response = await fetch(targetUrl.href, {
      headers: requestHeaders,
      redirect: 'follow',
    });

    // If the response is an error, try to show helpful info
    if (!response.ok && response.status !== 206) {
      const contentType = response.headers.get('content-type') || '';

      // Common anti-bot status codes
      const isBlocked = [403, 412, 429, 503].includes(response.status);

      if (contentType.includes('text/html')) {
        const body = await response.arrayBuffer();
        let html = new TextDecoder('utf-8', { fatal: false }).decode(body);
        const baseTag = `<base href="${targetUrl.href}">`;
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${baseTag}`);
        } else {
          html = baseTag + html;
        }
        html = rewriteHtmlUrls(html, targetUrl.href);

        // Inject a helpful banner for blocked sites
        if (isBlocked) {
          const banner = `
<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#fef2f2;border-bottom:2px solid #ef4444;padding:12px 20px;font-family:system-ui,sans-serif;font-size:14px;color:#991b1b;">
  <strong>⚠️ This website blocks proxy access (HTTP ${response.status})</strong><br/>
  <span style="font-size:12px;color:#b91c1c;">Please open the URL in a new tab, play the video, then use <strong>Screen Capture</strong> mode in the VR player to capture it.</span>
</div>`;
          if (html.includes('<body>')) {
            html = html.replace('<body>', `<body>${banner}`);
          } else {
            html = banner + html;
          }
        }

        return new NextResponse(html, {
          status: 200, // Return 200 so iframe renders the error page with banner
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'X-Frame-Options': 'ALLOWALL',
          },
        });
      }

      // Non-HTML error
      return NextResponse.json(
        {
          error: `Target returned ${response.status} ${response.statusText}`,
          hint: isBlocked
            ? 'This website blocks proxy access. Open the URL in a new browser tab, then use "Screen Capture" in VR mode to capture the video.'
            : 'The website may be temporarily unavailable. Try again or use "Screen Capture" mode.',
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const body = await response.arrayBuffer();

    // Handle HTML content
    if (contentType.includes('text/html')) {
      let html = new TextDecoder('utf-8', { fatal: false }).decode(body);

      const baseTag = `<base href="${targetUrl.href}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<html>')) {
        html = html.replace('<html>', `<html><head>${baseTag}</head>`);
      } else {
        html = baseTag + html;
      }

      html = rewriteHtmlUrls(html, targetUrl.href);

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
            "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-src *; media-src * data: blob:; img-src * data: blob:; font-src * data: blob:; connect-src * data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';",
        },
      });
    }

    // Pass through non-HTML content (video, images, CSS, JS, etc.)
    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }

    // Range request support for video/audio
    const range = request.headers.get('range');
    if (range && response.status === 206) {
      responseHeaders.set('Content-Range', response.headers.get('content-range') || '');
      responseHeaders.set('Accept-Ranges', 'bytes');
      const cl = response.headers.get('content-length');
      if (cl) responseHeaders.set('Content-Length', cl);
      return new NextResponse(body, { status: 206, headers: responseHeaders });
    }

    responseHeaders.set('Content-Length', body.byteLength.toString());

    if (
      contentType.includes('image') ||
      contentType.includes('font') ||
      contentType.includes('javascript') ||
      contentType.includes('css')
    ) {
      responseHeaders.set('Cache-Control', 'public, max-age=3600');
    }

    return new NextResponse(body, { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch the requested URL',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'The website may not be accessible through the proxy. Open the URL in a new browser tab, then use "Screen Capture" mode to capture the video.',
      },
      { status: 502 }
    );
  }
}

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
