export type Locale = 'en' | 'zh';

export const translations: Record<string, Record<Locale, string>> = {
  // ====== Landing Page ======
  'landing.title': { en: 'WebXR VR Video Player', zh: 'WebXR VR 视频播放器' },
  'landing.subtitle': { en: 'Watch VR180/360 side-by-side videos from any website in your VR headset via SteamVR', zh: '通过 SteamVR 在 VR 头显中观看任意网站的 VR180/360 并排视频' },
  'landing.howItWorks': { en: 'How It Works', zh: '工作原理' },
  'landing.step1Title': { en: '1. Open Video', zh: '1. 打开视频' },
  'landing.step1Desc': { en: 'Open your VR video in another browser tab (Bilibili, YouTube, etc.)', zh: '在另一个浏览器标签页中打开 VR 视频（哔哩哔哩、YouTube 等）' },
  'landing.step2Title': { en: '2. Capture & Select', zh: '2. 捕获与选择' },
  'landing.step2Desc': { en: 'Capture that tab, then draw a box around the video area', zh: '捕获该标签页，然后在视频区域周围画框' },
  'landing.step3Title': { en: '3. View in VR', zh: '3. VR 观看' },
  'landing.step3Desc': { en: 'The selected area is mapped to a VR sphere/cylinder for immersive viewing', zh: '选定区域映射到 VR 球体/柱面，实现沉浸式观看' },

  // Method: Screen Capture
  'landing.capture.title': { en: 'Screen Capture', zh: '屏幕捕获' },
  'landing.capture.desc': { en: 'Open a VR video in another browser tab, then capture that tab. Works with any website — no proxy issues.', zh: '在另一个浏览器标签页中打开 VR 视频，然后捕获该标签页。适用于任何网站 — 无代理问题。' },
  'landing.capture.btn': { en: 'Start Screen Capture', zh: '开始屏幕捕获' },

  // Test Pattern
  'landing.testPattern.title': { en: 'Test Pattern', zh: '测试图案' },
  'landing.testPattern.desc': { en: 'Load a built-in stereo test pattern to preview the VR player and experiment with projection settings.', zh: '加载内置立体声测试图案，预览 VR 播放器并体验投影设置。' },
  'landing.testPattern.btn': { en: 'Load Test Pattern', zh: '加载测试图案' },

  // Quick Start Guide
  'landing.quickStart.title': { en: 'Quick Start Guide', zh: '快速入门指南' },
  'landing.quickStart.step1': { en: 'Open a VR video in your browser (e.g. bilibili.com VR180 video, play it fullscreen or in theater mode)', zh: '在浏览器中打开 VR 视频（如哔哩哔哩 VR180 视频，全屏或影院模式播放）' },
  'landing.quickStart.step2': { en: 'Come to this app and click {strong}Start Screen Capture{/strong}', zh: '来到此应用并点击{strong}开始屏幕捕获{/strong}' },
  'landing.quickStart.step3': { en: 'Select the browser tab with the video when prompted', zh: '在提示时选择包含视频的浏览器标签页' },
  'landing.quickStart.step4': { en: 'Use {strong}Select Region{/strong} to draw a box around the VR video area in the preview', zh: '使用{strong}选择区域{/strong}在预览中围绕 VR 视频区域画框' },
  'landing.quickStart.step5': { en: 'Choose the right {strong}VR preset{/strong} (VR180 SBS, VR360 TB, etc.) and click {strong}Enter VR{/strong}', zh: '选择合适的{strong}VR 预设{/strong}（VR180 SBS、VR360 TB 等）并点击{strong}进入 VR{/strong}' },

  // Requirements
  'landing.requirements.vrMode': { en: 'VR Mode:', zh: 'VR 模式：' },
  'landing.requirements.vrModeDesc': { en: 'Requires Chrome/Edge with WebXR support, a VR headset, and SteamVR running on your PC', zh: '需要支持 WebXR 的 Chrome/Edge、VR 头显和 PC 上运行的 SteamVR' },
  'landing.requirements.screenCapture': { en: 'Screen Capture:', zh: '屏幕捕获：' },
  'landing.requirements.screenCaptureDesc': { en: "Uses your browser's built-in screen sharing — no server-side proxy, works with any website", zh: '使用浏览器内置屏幕共享 — 无需服务器代理，适用于任何网站' },
  'landing.requirements.noProxy': { en: 'No Proxy:', zh: '无代理：' },
  'landing.requirements.noProxyDesc': { en: 'This app captures your screen directly — it never loads websites through a server, avoiding CORS/412 errors entirely', zh: '此应用直接捕获屏幕 — 不会通过服务器加载网站，完全避免 CORS/412 错误' },

  // ====== Player ======
  'player.back': { en: 'Back', zh: '返回' },
  'player.playPause': { en: 'Play / Pause', zh: '播放 / 暂停' },
  'player.muteUnmute': { en: 'Mute / Unmute', zh: '静音 / 取消静音' },
  'player.fullscreen': { en: 'Fullscreen', zh: '全屏' },
  'player.enterVR': { en: 'Enter VR', zh: '进入 VR' },
  'player.exitVR': { en: 'Exit VR', zh: '退出 VR' },
  'player.enterVRTooltip': { en: 'Enter immersive VR mode', zh: '进入沉浸式 VR 模式' },
  'player.exitVRTooltip': { en: 'Exit VR and return to 2D view', zh: '退出 VR 并返回 2D 视图' },
  'player.vrActive': { en: 'VR Active', zh: 'VR 已激活' },
  'player.vrNotAvailable': { en: 'WebXR Not Available', zh: 'WebXR 不可用' },
  'player.vrNotAvailableDesc': { en: 'WebXR is not supported in this browser. To use VR with SteamVR, open this page in Chrome/Edge with a VR headset connected. You can still use fullscreen and screen capture.', zh: '此浏览器不支持 WebXR。要通过 SteamVR 使用 VR，请在连接了 VR 头显的 Chrome/Edge 中打开此页面。您仍可使用全屏和屏幕捕获功能。' },
  'player.setupGuide': { en: 'Setup Guide:', zh: '设置指南：' },
  'player.setupGuide.step1': { en: 'Install SteamVR on your PC', zh: '在 PC 上安装 SteamVR' },
  'player.setupGuide.step2': { en: 'Connect your VR headset', zh: '连接 VR 头显' },
  'player.setupGuide.step3': { en: 'Open this page in Chrome/Edge', zh: '在 Chrome/Edge 中打开此页面' },
  'player.setupGuide.step4': { en: 'Click "Capture" then "Enter VR"', zh: '点击"捕获"然后"进入 VR"' },
  'player.initializing': { en: 'Initializing VR player...', zh: '正在初始化 VR 播放器...' },
  'player.noVideoSource': { en: 'No video source', zh: '无视频源' },
  'player.noVideoSourceDesc': { en: 'Click "Capture" below to capture a browser tab playing your VR video, or load the test pattern to preview the VR player.', zh: '点击下方"捕获"以捕获正在播放 VR 视频的浏览器标签页，或加载测试图案以预览 VR 播放器。' },
  'player.screenCapture': { en: 'Screen Capture', zh: '屏幕捕获' },
  'player.testPattern': { en: 'Test Pattern', zh: '测试图案' },
  'player.demo': { en: 'Demo', zh: '演示' },
  'player.capture': { en: 'Capture', zh: '捕获' },
  'player.captureTooltip': { en: 'Capture screen/window for VR', zh: '捕获屏幕/窗口用于 VR' },
  'player.loadTestPattern': { en: 'Load test pattern', zh: '加载测试图案' },
  'player.enterFullscreen': { en: 'Enter fullscreen mode', zh: '进入全屏模式' },
  'player.toggleCrop': { en: 'Toggle crop', zh: '切换裁剪' },
  'player.selectRegionCrop': { en: 'Select region to crop', zh: '选择裁剪区域' },
  'player.disableCrop': { en: 'Disable crop (full frame)', zh: '禁用裁剪（全帧）' },
  'player.dragHint': { en: 'Drag to look around · Space: Play/Pause · F: Fullscreen · M: Mute', zh: '拖拽查看四周 · 空格：播放/暂停 · F：全屏 · M：静音' },
  'player.capturedPreview': { en: 'Captured Screen Preview', zh: '已捕获画面预览' },
  'player.drawRectangle': { en: 'Draw a rectangle around the video area', zh: '在视频区域周围画一个矩形' },
  'player.applyCrop': { en: 'Apply Crop', zh: '应用裁剪' },
  'player.cancel': { en: 'Cancel', zh: '取消' },
  'player.selectRegion': { en: 'Select Region', zh: '选择区域' },
  'player.resetRegion': { en: 'Reset Region', zh: '重置区域' },
  'player.recapture': { en: 'Re-capture', zh: '重新捕获' },
  'player.cropHint': { en: '💡 Use {strong}Select Region{/strong} to crop the video area if the VR video doesn\'t fill the entire captured screen.', zh: '💡 如果 VR 视频没有填满整个捕获画面，请使用{strong}选择区域{/strong}裁剪视频区域。' },
  'player.source.screenCapture': { en: 'Screen Capture', zh: '标签页捕获' },
  'player.source.testPattern': { en: 'Test Pattern', zh: '测试图案' },
  'player.source.noSource': { en: 'No Source', zh: '无源' },
  'player.layout.sbs': { en: 'SBS', zh: 'SBS' },
  'player.layout.tb': { en: 'TB', zh: 'TB' },
  'player.layout.mono': { en: 'Mono', zh: 'Mono' },
  'player.projection.sphere360': { en: '360°', zh: '360°' },
  'player.projection.hemisphere180': { en: '180°', zh: '180°' },
  'player.projection.cylinder': { en: 'Cyl', zh: '柱面' },
  'player.projection.flat': { en: 'Flat', zh: '平面' },
  'player.crop': { en: 'Crop', zh: '裁剪' },

  // ====== Settings ======
  'settings.title': { en: 'VR Settings', zh: 'VR 设置' },
  'settings.presets': { en: 'Quick Presets', zh: '快速预设' },
  'settings.manualSettings': { en: 'Manual Settings', zh: '手动设置' },
  'settings.stereoLayout': { en: 'Stereo Layout', zh: '立体布局' },
  'settings.projectionType': { en: 'Projection Type', zh: '投影类型' },
  'settings.fov': { en: 'Field of View', zh: '视野角度' },
  'settings.currentConfig': { en: 'Current Configuration:', zh: '当前配置：' },
  'settings.layoutLabel': { en: 'Layout:', zh: '布局：' },
  'settings.projectionLabel': { en: 'Projection:', zh: '投影：' },
  'settings.fovLabel': { en: 'FOV:', zh: '视野：' },

  // ====== Presets ======
  'preset.vr180-sbs.name': { en: 'VR180 (Side-by-Side)', zh: 'VR180（并排）' },
  'preset.vr180-sbs.desc': { en: 'Standard VR180 video with left/right eye views side by side', zh: '标准 VR180 视频，左右眼画面并排排列' },
  'preset.vr180-tb.name': { en: 'VR180 (Top-Bottom)', zh: 'VR180（上下）' },
  'preset.vr180-tb.desc': { en: 'VR180 video with left/right eye views stacked top/bottom', zh: 'VR180 视频，左右眼画面上下排列' },
  'preset.vr360-sbs.name': { en: 'VR360 (Side-by-Side)', zh: 'VR360（并排）' },
  'preset.vr360-sbs.desc': { en: 'Full 360° video with side-by-side stereo', zh: '完整 360° 视频，并排立体' },
  'preset.vr360-tb.name': { en: 'VR360 (Top-Bottom)', zh: 'VR360（上下）' },
  'preset.vr360-tb.desc': { en: 'Full 360° video with top-bottom stereo', zh: '完整 360° 视频，上下立体' },
  'preset.cylinder-sbs.name': { en: 'Cinema (Side-by-Side)', zh: '影院（并排）' },
  'preset.cylinder-sbs.desc': { en: 'Cylindrical projection like a curved movie screen, side-by-side stereo', zh: '柱面投影，如弧形电影幕布，并排立体' },
  'preset.cylinder-mono.name': { en: 'Flat Cinema (Mono)', zh: '平面影院（单目）' },
  'preset.cylinder-mono.desc': { en: 'Cylindrical projection for standard mono video, like a curved screen', zh: '标准单目视频的柱面投影，如弧形屏幕' },
  'preset.flat-sbs.name': { en: 'Flat Screen (Side-by-Side)', zh: '平面屏幕（并排）' },
  'preset.flat-sbs.desc': { en: 'No distortion — left/right halves displayed as flat screens to each eye', zh: '无畸变 — 左右半幅分别以平面方式显示到左右眼' },
  'preset.flat-tb.name': { en: 'Flat Screen (Top-Bottom)', zh: '平面屏幕（上下）' },
  'preset.flat-tb.desc': { en: 'No distortion — top/bottom halves displayed as flat screens to each eye', zh: '无畸变 — 上下半幅分别以平面方式显示到左右眼' },

  // ====== Projection & Layout Labels ======
  'projection.sphere360': { en: '360° Sphere', zh: '360° 球面' },
  'projection.hemisphere180': { en: '180° Hemisphere', zh: '180° 半球' },
  'projection.cylinder': { en: 'Cylinder (Cinema)', zh: '柱面（影院）' },
  'projection.flat': { en: 'Flat (Parallel Eyes)', zh: '平面（平行眼）' },
  'layout.sbs': { en: 'Side-by-Side (Left | Right)', zh: '并排（左 | 右）' },
  'layout.tb': { en: 'Top-Bottom (Top / Bottom)', zh: '上下（上 / 下）' },
  'layout.mono': { en: 'Mono (Single View)', zh: '单目（单视图）' },

  // ====== Errors ======
  'error.enterVRFailed': { en: 'Failed to enter VR: {error}. Make sure your VR headset is connected and SteamVR is running.', zh: '进入 VR 失败：{error}。请确保 VR 头显已连接且 SteamVR 正在运行。' },
  'error.videoLoadFailed': { en: 'Failed to load video', zh: '视频加载失败' },
  'error.videoFileFailed': { en: 'Failed to load video file', zh: '视频文件加载失败' },
  'error.screenCaptureCancelled': { en: 'Screen capture was cancelled or failed. Please try again.', zh: '屏幕捕获已取消或失败。请重试。' },
  'error.screenCaptureIframe': { en: 'Screen capture is not available inside an iframe. Please open in a new tab.', zh: 'iframe 中无法使用屏幕捕获。请在新标签页中打开。' },
  'error.screenCaptureBrowser': { en: 'Screen capture is not supported in this browser. Please use Chrome or Edge.', zh: '此浏览器不支持屏幕捕获。请使用 Chrome 或 Edge。' },
  'error.screenCaptureNotFound': { en: 'No screen found to capture', zh: '未找到可捕获的屏幕' },
  'error.screenCaptureNotReadable': { en: 'Screen capture stream is not readable', zh: '屏幕捕获流不可读' },
  'error.screenCaptureAborted': { en: 'Screen capture was aborted', zh: '屏幕捕获已中止' },

  // ====== Header / Footer ======
  'app.title': { en: 'WebXR VR Player', zh: 'WebXR VR 播放器' },
  'footer.left': { en: 'WebXR VR Video Player — Capture any website\'s VR video for SteamVR', zh: 'WebXR VR 视频播放器 — 捕获任意网站的 VR 视频用于 SteamVR' },
  'footer.right': { en: 'Requires WebXR-compatible browser & VR headset', zh: '需要支持 WebXR 的浏览器和 VR 头显' },
  'header.capture': { en: 'Capture', zh: '捕获' },
  'header.vr': { en: 'VR', zh: 'VR' },

  // ====== Language Switcher ======
  'lang.switch': { en: 'Language', zh: '语言' },
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
