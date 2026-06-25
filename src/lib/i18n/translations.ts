export type Locale = 'en' | 'zh';

export const translations: Record<string, Record<Locale, string>> = {
  // ====== Landing Page ======
  'landing.title': { en: 'WebXR VR Video Player', zh: 'WebXR VR 视频播放器' },
  'landing.subtitle': { en: 'Watch VR180/360 side-by-side videos from any website in your VR headset via SteamVR', zh: '通过 SteamVR 在 VR 头显中观看任意网站的 VR180/360 并排视频' },
  'landing.howItWorks': { en: 'How It Works', zh: '工作原理' },
  'landing.step1': { en: 'Open a VR video in another browser tab', zh: '在另一个浏览器标签页中打开 VR 视频' },
  'landing.step2': { en: 'Capture that tab using screen sharing', zh: '使用屏幕共享捕获该标签页' },
  'landing.step3': { en: 'View in VR headset via SteamVR', zh: '通过 SteamVR 在 VR 头显中观看' },
  'landing.or': { en: 'or', zh: '或' },

  // Method 1: Tab Capture
  'landing.method1.title': { en: 'Tab Capture (Screen Sharing)', zh: '标签页捕获（屏幕共享）' },
  'landing.method1.recommended': { en: 'Recommended', zh: '推荐' },
  'landing.method1.desc': { en: 'Capture any browser tab — works with all websites including Bilibili, YouTube, etc. No CORS issues.', zh: '捕获任意浏览器标签页 — 适用于所有网站，包括哔哩哔哩、YouTube 等。无跨域问题。' },
  'landing.method1.btn': { en: 'Start Screen Capture', zh: '开始屏幕捕获' },
  'landing.method1.hint': { en: 'Chrome will show a tab picker — select the tab with your VR video', zh: 'Chrome 将显示标签页选择器 — 选择包含 VR 视频的标签页' },

  // Method 2: Video URL
  'landing.method2.title': { en: 'Direct Video URL', zh: '直接视频链接' },
  'landing.method2.desc': { en: 'Paste a direct link to a video file (.mp4, .webm, .m3u8)', zh: '粘贴视频文件的直接链接（.mp4、.webm、.m3u8）' },
  'landing.method2.placeholder': { en: 'https://example.com/video.mp4 or .m3u8', zh: 'https://example.com/video.mp4 或 .m3u8' },
  'landing.method2.playBtn': { en: 'Play Video URL', zh: '播放视频链接' },
  'landing.method2.notVideoWarning': { en: 'This URL may not be a direct video file. It might not play correctly.', zh: '此链接可能不是直接的视频文件，可能无法正常播放。' },
  'landing.method2.videoDetected': { en: 'Video detected from', zh: '检测到视频，来源' },
  'landing.method2.optionalPageUrl': { en: 'Optional: Original page URL (for reference only)', zh: '可选：原始页面 URL（仅供参考）' },
  'landing.method2.pageUrlPlaceholder': { en: 'https://example.com/page', zh: 'https://example.com/page' },

  // Method 3: Local File
  'landing.method3.title': { en: 'Local Video File', zh: '本地视频文件' },
  'landing.method3.desc': { en: 'Open a video file from your computer. No server upload — processed entirely in your browser.', zh: '从电脑中打开视频文件。无需上传到服务器 — 完全在浏览器中处理。' },
  'landing.method3.btn': { en: 'Choose Video File', zh: '选择视频文件' },
  'landing.method3.hint': { en: 'Supports MP4, WebM, MKV and other browser-compatible formats', zh: '支持 MP4、WebM、MKV 等浏览器兼容格式' },

  // Test Pattern
  'landing.testPattern.title': { en: 'Test Pattern', zh: '测试图案' },
  'landing.testPattern.desc': { en: 'Load a built-in stereo test pattern to preview and configure VR settings', zh: '加载内置立体声测试图案，预览和配置 VR 设置' },
  'landing.testPattern.btn': { en: 'Load Test Pattern', zh: '加载测试图案' },

  // How to find video URL
  'landing.howToFind.title': { en: 'How to Find the Video URL', zh: '如何找到视频 URL' },
  'landing.howToFind.step1': { en: 'Open the VR video page in Chrome', zh: '在 Chrome 中打开 VR 视频页面' },
  'landing.howToFind.step2': { en: 'Right-click the video → "Copy video address" or use DevTools (F12 → Network → filter: media)', zh: '右键点击视频 → "复制视频地址" 或使用开发者工具（F12 → 网络 → 筛选：媒体）' },
  'landing.howToFind.step3': { en: 'Look for .mp4 or .m3u8 URLs in the Network tab', zh: '在网络标签页中查找 .mp4 或 .m3u8 链接' },
  'landing.howToFind.step4': { en: 'Paste the URL above and click Play', zh: '将链接粘贴到上方并点击播放' },
  'landing.howToFind.step5': { en: 'If direct URL doesn\'t work, use Tab Capture instead', zh: '如果直接链接不工作，请改用标签页捕获' },

  // Info section
  'landing.info.tabCapture': { en: 'Tab Capture', zh: '标签页捕获' },
  'landing.info.tabCaptureDesc': { en: 'Uses browser\'s built-in screen sharing — works with any website', zh: '使用浏览器内置屏幕共享 — 适用于任何网站' },
  'landing.info.localFiles': { en: 'Local Files', zh: '本地文件' },
  'landing.info.localFilesDesc': { en: 'Processed entirely in your browser — no server upload needed', zh: '完全在浏览器中处理 — 无需上传到服务器' },
  'landing.info.vrMode': { en: 'VR Mode', zh: 'VR 模式' },
  'landing.info.vrModeDesc': { en: 'Requires Chrome/Edge with WebXR, VR headset, and SteamVR', zh: '需要支持 WebXR 的 Chrome/Edge、VR 头显和 SteamVR' },

  // Iframe warning
  'iframe.warning.title': { en: 'Screen Capture Unavailable', zh: '屏幕捕获不可用' },
  'iframe.warning.desc': { en: 'This app is running inside an iframe. Screen capture requires opening in a new tab.', zh: '此应用正在 iframe 中运行。屏幕捕获需要在新标签页中打开。' },
  'iframe.warning.btn': { en: 'Open in New Tab', zh: '在新标签页中打开' },
  'iframe.warning.captureDisabled': { en: 'Screen capture is not available inside iframes. Please open this app in a new tab.', zh: 'iframe 中无法使用屏幕捕获。请在新标签页中打开此应用。' },
  'iframe.warning.browserNotSupported': { en: 'Your browser doesn\'t support screen capture. Please use Chrome or Edge.', zh: '您的浏览器不支持屏幕捕获。请使用 Chrome 或 Edge。' },
  'iframe.warning.playerTitle': { en: 'Screen Capture Unavailable in iframe', zh: 'iframe 中无法使用屏幕捕获' },
  'iframe.warning.playerDesc': { en: 'Open this page in a new tab to enable screen capture.', zh: '在新标签页中打开此页面以启用屏幕捕获。' },

  // ====== Player ======
  'player.back': { en: 'Back', zh: '返回' },
  'player.playPause': { en: 'Play/Pause', zh: '播放/暂停' },
  'player.muteUnmute': { en: 'Mute/Unmute', zh: '静音/取消静音' },
  'player.fullscreen': { en: 'Fullscreen', zh: '全屏' },
  'player.enterVR': { en: 'Enter VR', zh: '进入 VR' },
  'player.exitVR': { en: 'Exit VR', zh: '退出 VR' },
  'player.enterVRTooltip': { en: 'Enter immersive VR mode', zh: '进入沉浸式 VR 模式' },
  'player.exitVRTooltip': { en: 'Exit VR and return to 2D view', zh: '退出 VR 并返回 2D 视图' },
  'player.vrActive': { en: 'VR Active', zh: 'VR 已激活' },
  'player.vrNotAvailable': { en: 'WebXR Not Available', zh: 'WebXR 不可用' },
  'player.vrNotAvailableDesc': { en: 'WebXR is not supported in this browser. To use VR with SteamVR, open this page in Chrome/Edge with a VR headset connected. You can still use fullscreen and screen capture.', zh: '此浏览器不支持 WebXR。要通过 SteamVR 使用 VR，请在连接了 VR 头显的 Chrome/Edge 中打开此页面。您仍可使用全屏和屏幕捕获功能。' },
  'player.initializing': { en: 'Initializing...', zh: '正在初始化...' },
  'player.loadVideo': { en: 'Load a Video Source', zh: '加载视频源' },
  'player.loadVideoDesc': { en: 'Capture a tab, open a file, or load a test pattern to begin', zh: '捕获标签页、打开文件或加载测试图案以开始' },
  'player.playVideo': { en: 'Play Video', zh: '播放视频' },
  'player.pasteUrl': { en: 'Paste video URL...', zh: '粘贴视频链接...' },
  'player.play': { en: 'Play', zh: '播放' },
  'player.openFile': { en: 'Open File', zh: '打开文件' },
  'player.captureTab': { en: 'Capture Tab', zh: '捕获标签页' },
  'player.openInNewTab': { en: 'Open in New Tab', zh: '在新标签页中打开' },
  'player.openNewTabCapture': { en: 'Open in new tab for screen capture', zh: '在新标签页中打开以进行屏幕捕获' },
  'player.captureBrowserTab': { en: 'Capture a browser tab for VR', zh: '捕获浏览器标签页用于 VR' },
  'player.demo': { en: 'Demo', zh: '演示' },
  'player.file': { en: 'File', zh: '文件' },
  'player.capture': { en: 'Capture', zh: '捕获' },
  'player.orLoadTest': { en: 'or load test pattern', zh: '或加载测试图案' },
  'player.loadTestPattern': { en: 'Load test pattern', zh: '加载测试图案' },
  'player.openLocalVideo': { en: 'Open local video file', zh: '打开本地视频文件' },
  'player.toggleCrop': { en: 'Toggle crop', zh: '切换裁剪' },
  'player.selectRegionCrop': { en: 'Select region to crop', zh: '选择裁剪区域' },
  'player.disableCrop': { en: 'Disable crop', zh: '禁用裁剪' },
  'player.dragHint': { en: 'Drag to look around', zh: '拖拽查看四周' },
  'player.capturedPreview': { en: 'Captured Screen Preview', zh: '已捕获画面预览' },
  'player.drawRectangle': { en: 'Draw a rectangle around the video area', zh: '在视频区域周围画一个矩形' },
  'player.applyCrop': { en: 'Apply', zh: '应用' },
  'player.cancel': { en: 'Cancel', zh: '取消' },
  'player.selectRegion': { en: 'Select Region', zh: '选择区域' },
  'player.resetRegion': { en: 'Reset', zh: '重置' },
  'player.recapture': { en: 'Recapture', zh: '重新捕获' },
  'player.cropHint': { en: 'Draw a box around the video area to crop it for VR', zh: '在视频区域周围画框以裁剪用于 VR' },
  'player.streamingUrl': { en: 'Streaming from URL', zh: '正在从链接播放' },
  'player.localFileLoaded': { en: 'Local file loaded', zh: '本地文件已加载' },
  'player.source': { en: 'Source:', zh: '来源：' },
  'player.source.videoUrl': { en: 'Video URL', zh: '视频链接' },
  'player.source.localFile': { en: 'Local File', zh: '本地文件' },
  'player.source.tabCapture': { en: 'Tab Capture', zh: '标签页捕获' },
  'player.source.testPattern': { en: 'Test Pattern', zh: '测试图案' },
  'player.source.noSource': { en: 'No Source', zh: '无源' },

  // ====== Settings ======
  'settings.title': { en: 'VR Settings', zh: 'VR 设置' },
  'settings.presets': { en: 'Quick Presets', zh: '快速预设' },
  'settings.stereoLayout': { en: 'Stereo Layout', zh: '立体布局' },
  'settings.projectionType': { en: 'Projection Type', zh: '投影类型' },
  'settings.fov': { en: 'Field of View', zh: '视野角度' },

  // ====== Errors ======
  'error.enterVRFailed': { en: 'Failed to enter VR: {error}', zh: '进入 VR 失败：{error}' },
  'error.videoLoadFailed': { en: 'Failed to load video', zh: '视频加载失败' },
  'error.videoFileFailed': { en: 'Failed to load video file', zh: '视频文件加载失败' },
  'error.screenCaptureIframe': { en: 'Screen capture is not available inside an iframe. Please open in a new tab.', zh: 'iframe 中无法使用屏幕捕获。请在新标签页中打开。' },
  'error.screenCaptureBrowser': { en: 'Screen capture is not supported in this browser. Please use Chrome or Edge.', zh: '此浏览器不支持屏幕捕获。请使用 Chrome 或 Edge。' },
  'error.screenCaptureCancelled': { en: 'Screen capture was cancelled', zh: '屏幕捕获已取消' },
  'error.screenCaptureNotFound': { en: 'No screen found to capture', zh: '未找到可捕获的屏幕' },
  'error.screenCaptureNotReadable': { en: 'Screen capture stream is not readable', zh: '屏幕捕获流不可读' },
  'error.screenCaptureAborted': { en: 'Screen capture was aborted', zh: '屏幕捕获已中止' },
};

/** Get a translated string by key. Supports {param} interpolation. */
export function t(key: string, params?: Record<string, string>, locale: Locale = 'zh'): string {
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[locale] || entry.en || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}
